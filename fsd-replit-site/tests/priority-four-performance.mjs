import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { browserSession } from './browser-session.mjs';

// Compare the previous and updated production builds, not a changing Vite HMR
// session. This is a small local lab sample, not field data or a Lighthouse score.
const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('Specify before or after');
const root = resolve('dist');
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png',
  '.webp':'image/webp', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.woff2':'font/woff2', '.woff':'font/woff', '.avif':'image/avif' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://test.local').pathname);
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(`${root}/`)) { response.writeHead(403).end(); return; }
    const bytes = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream',
      'Cache-Control':'no-store', 'Content-Length':bytes.length });
    response.end(bytes);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve=>server.listen(0, '127.0.0.1', resolve));
const browser = await browserSession();
try {
  await browser.send('Network.enable');
  await browser.send('Network.setCacheDisabled', { cacheDisabled:true });
  await browser.send('Page.addScriptToEvaluateOnNewDocument', { source:`
    window.__fsdLab={lcp:null,cls:0};
    new PerformanceObserver(list=>{for(const e of list.getEntries())window.__fsdLab.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__fsdLab.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
  ` });
  const samples = [];
  for (const width of [390, 1440]) {
    await browser.send('Emulation.setDeviceMetricsOverride', { width,height:900,mobile:false,deviceScaleFactor:1 });
    await browser.send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'no-preference'}] });
    for (let run=1;run<=3;run++) {
      await browser.send('Page.navigate', { url:`http://127.0.0.1:${server.address().port}/?lab=${phase}-${width}-${run}` });
      await browser.wait(`document.querySelector('[data-runtime-ready="true"]')`, 'production-build runtime ready');
      await browser.evaluate('new Promise(resolve=>setTimeout(resolve,1500))');
      samples.push(await browser.evaluate(`(()=>{
        const navigation=performance.getEntriesByType('navigation')[0];
        const resources=performance.getEntriesByType('resource');
        const paint=performance.getEntriesByName('first-contentful-paint')[0];
        return {width:${width},run:${run},fcpMs:paint?.startTime??null,lcpMs:window.__fsdLab.lcp,
          cls:window.__fsdLab.cls,domContentLoadedMs:navigation.domContentLoadedEventEnd,
          transferredBytes:resources.reduce((sum,item)=>sum+item.transferSize,0),
          heavy3dImports:resources.filter(item=>/three|model-viewer|babylon|\\.gltf|\\.glb/i.test(item.name)).length};
      })()`));
    }
  }
  const report = { phase, environment:'Local static production build, cold resource cache, no CPU/network throttling',
    window:'1500ms after runtime ready per sample; three samples per width; not field performance',
    samples, runtimeErrors:browser.errors };
  await writeFile(`handoff/priority-four-performance-${phase}.json`, `${JSON.stringify(report,null,2)}\n`);
  console.log(JSON.stringify(report,null,2));
  if (browser.errors.length) throw new Error('Runtime errors occurred during performance samples');
} finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
