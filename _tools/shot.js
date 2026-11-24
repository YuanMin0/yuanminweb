/* 截图：node _tools/shot.js <path> <out.png> [--mobile] [--full] [--open] */
const http = require('http');
const fs = require('fs');
const BASE = 'http://127.0.0.1:8765/';
const DBG = 'http://127.0.0.1:9222';
function getJSON(u) { return new Promise((res, rej) => { http.get(u, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej); }); }
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.p = new Map(); }
  static async attach(u) { const ws = new WebSocket(u); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }); const c = new CDP(ws); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && c.p.has(m.id)) { const { res, rej } = c.p.get(m.id); c.p.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); } }; return c; }
  send(method, params = {}) { const id = ++this.id; return new Promise((res, rej) => { this.p.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })); setTimeout(() => { if (this.p.has(id)) { this.p.delete(id); rej(new Error('timeout ' + method)); } }, 60000); }); }
}
const arg = process.argv[2], out = process.argv[3];
const mobile = process.argv.includes('--mobile');
const full = process.argv.includes('--full');
const openAll = process.argv.includes('--open');
(async () => {
  const ver = await getJSON(DBG + '/json/version');
  const b = await CDP.attach(ver.webSocketDebuggerUrl);
  const { targetId } = await b.send('Target.createTarget', { url: 'about:blank' });
  const list = await getJSON(DBG + '/json/list');
  const t = list.find(x => x.id === targetId);
  const pg = await CDP.attach(t.webSocketDebuggerUrl);
  await pg.send('Page.enable'); await pg.send('Runtime.enable'); await pg.send('Network.enable');
  await pg.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (mobile) await pg.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  else await pg.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
  await pg.send('Page.navigate', { url: BASE + arg });
  await new Promise(r => setTimeout(r, 1400));
  const atArg = process.argv.find(a => a.startsWith('--at='));
  if (atArg) {
    const sel = atArg.slice('--at='.length);
    await pg.send('Runtime.evaluate', { expression: `(function(){var e=document.querySelector(${JSON.stringify(sel)}); if(e) e.scrollIntoView({block:'start'});})()` });
    await new Promise(r => setTimeout(r, 400));
  }
  if (openAll) {
    await pg.send('Runtime.evaluate', { expression: "document.querySelectorAll('details.ans').forEach(function(d){d.open=true})" });
    await new Promise(r => setTimeout(r, 300));
  }
  const params = { format: 'png' };
  if (full) { const m = await pg.send('Page.getLayoutMetrics'); const h = Math.min(m.cssContentSize.height, 20000); params.clip = { x: 0, y: 0, width: mobile ? 390 : 1200, height: h, scale: 1 }; params.captureBeyondViewport = true; }
  const { data } = await pg.send('Page.captureScreenshot', params);
  fs.writeFileSync(out, Buffer.from(data, 'base64'));
  console.log('saved', out);
  await b.send('Target.closeTarget', { targetId });
  process.exit(0);
})().catch(e => { console.error('SHOT FAIL', e.message); process.exit(1); });
