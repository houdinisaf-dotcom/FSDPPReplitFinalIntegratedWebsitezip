import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Fresh profile per viewport, direct development-host resolution, no auth bypass.
export async function withBrowser(options, run) {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  assert.ok(domain);
  const profile = mkdtempSync(join(tmpdir(), 'fsd-products-'));
  const chrome = spawn('chromium', [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
    '--no-proxy-server', `--host-resolver-rules=MAP ${domain} 127.0.0.1`,
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: 'ignore' });
  let socket;
  const pending = new Map();
  try {
    const portFile = join(profile, 'DevToolsActivePort');
    for (let i = 0; !existsSync(portFile) && i < 100; i++) await delay(100);
    assert.ok(existsSync(portFile), 'Chromium starts.');
    const port = readFileSync(portFile, 'utf8').split('\n')[0];
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    let sequence = 0;
    const errors = [];
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const request = pending.get(message.id);
        if (!request) return;
        pending.delete(message.id);
        clearTimeout(request.timeout);
        if (message.error) request.reject(new Error(JSON.stringify(message.error)));
        else request.resolve(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') {
        errors.push(message.params.exceptionDetails);
      }
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 20000);
      pending.set(id, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
      return response.result.value;
    };
    const waitFor = async expression => {
      for (let i = 0; i < 150; i++) {
        if (await evaluate(expression)) return;
        await delay(50);
      }
      throw new Error(`Condition not met: ${expression}`);
    };
    const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    const key = async (key, modifiers = 0) => {
      const code = { Escape: 27, Tab: 9, ArrowRight: 39, ArrowLeft: 37, Enter: 13, Home: 36, End: 35 }[key];
      for (const type of ['rawKeyDown', 'keyUp']) {
        await send('Input.dispatchKeyEvent', { type, key, code: key, windowsVirtualKeyCode: code, modifiers });
      }
    };
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.bringToFront');
    await send('Emulation.setDeviceMetricsOverride', {
      width: options.width, height: options.height, deviceScaleFactor: 1, mobile: !!options.mobile,
    });
    if (options.mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: options.reduce ? 'reduce' : 'no-preference' }],
    });
    for (const source of options.initScripts || []) {
      await send('Page.addScriptToEvaluateOnNewDocument', { source });
    }
    const navigate = path => send('Page.navigate', { url: `http://${domain}:5000${path}` });
    await navigate(options.path || '/');
    await waitFor(options.readyExpression || '!!document.querySelector("#catalogue-grid article")');
    await run({ send, evaluate, waitFor, click, key, navigate, delay, errors });
    assert.deepEqual(errors, [], 'No unhandled browser exceptions.');
  } finally {
    for (const request of pending.values()) clearTimeout(request.timeout);
    socket?.close();
    chrome.kill('SIGTERM');
    await Promise.race([new Promise(resolve => chrome.once('exit', resolve)), delay(3000)]);
    rmSync(profile, { recursive: true, force: true });
  }
}
