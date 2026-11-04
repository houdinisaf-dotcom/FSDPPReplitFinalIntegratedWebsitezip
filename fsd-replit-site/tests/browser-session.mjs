import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

export const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function browserSession() {
  const profile = await mkdtemp(join(tmpdir(), 'fsd-gallery-'));
  const chrome = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`], { stdio: 'ignore' });
  let ws;
  const close = async () => {
    ws?.close(); chrome.kill('SIGTERM');
    await Promise.race([once(chrome, 'exit'), pause(2500)]);
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  };
  try {
    let port;
    for (let i = 0; i < 100 && !port; i++) {
      try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); }
      catch { await pause(100); }
    }
    if (!port) throw new Error('Chromium did not start');
    const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
    await once(ws, 'open');
    const pending = new Map();
    const errors = [];
    let sequence = 0;
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      const item = pending.get(message.id);
      if (item) {
        clearTimeout(item.timer); pending.delete(message.id);
        message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') {
        const detail = message.params.exceptionDetails;
        errors.push(detail.exception?.description || detail.text);
      }
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
      timer.unref();
      pending.set(id, { resolve, reject, timer });
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const wait = async (expression, label = expression) => {
      for (let i = 0; i < 120; i++) {
        if (await evaluate(`Boolean(${expression})`)) return;
        await pause(100);
      }
      throw new Error(`Timed out: ${label}`);
    };
    const key = async name => {
      const code = { Escape: 27, ArrowRight: 39, ArrowLeft: 37, Enter: 13 }[name];
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code: name,
        windowsVirtualKeyCode: code, ...(name === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}) });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code: name, windowsVirtualKeyCode: code });
    };
    await send('Page.enable'); await send('Runtime.enable');
    return { send, evaluate, wait, key, errors, close };
  } catch (error) { await close(); throw error; }
}
