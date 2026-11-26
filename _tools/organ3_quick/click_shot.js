/* 打开页面 → 点击指定元素 → 截图：node click_shot.js <path> <out.png> <selector> [--mobile] */
const http = require('http'), fs = require('fs');
const BASE = 'http://127.0.0.1:8765/', DBG = 'http://127.0.0.1:9222';
function getJSON(u){return new Promise((res,rej)=>{http.get(u,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej)})}
class CDP{
  constructor(ws){this.ws=ws;this.id=0;this.p=new Map()}
  static async attach(u){const ws=new WebSocket(u);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});const c=new CDP(ws);ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&c.p.has(m.id)){const{res,rej}=c.p.get(m.id);c.p.delete(m.id);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}};return c}
  send(method,params={}){const id=++this.id;return new Promise((res,rej)=>{this.p.set(id,{res,rej});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.p.has(id)){this.p.delete(id);rej(new Error('timeout '+method))}},60000)})}
}
const [, , p, out, sel] = process.argv;
const mobile = process.argv.includes('--mobile');
(async()=>{
  const ver = await getJSON(DBG + '/json/version');
  const b = await CDP.attach(ver.webSocketDebuggerUrl);
  const { targetId } = await b.send('Target.createTarget', { url: 'about:blank' });
  const list = await getJSON(DBG + '/json/list');
  const t = list.find(x => x.id === targetId);
  const pg = await CDP.attach(t.webSocketDebuggerUrl);
  await pg.send('Page.enable');
  await pg.send('Emulation.setDeviceMetricsOverride', mobile
    ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
    : { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await pg.send('Page.navigate', { url: BASE + p });
  await new Promise(r => setTimeout(r, 1600));
  const thenArg = process.argv.find(a => a.startsWith('--then='));
  if (sel) {
    const scrollExpr = `(function(){var e=document.querySelector(${JSON.stringify(sel)}); if(!e) return 'NOTFOUND'; if(e.classList.contains('ex-btn')) e.click(); var r=e.getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.top - 120); return 'OK '+Math.round(r.top);})()`;
    for (let k = 0; k < 3; k++) {
      const r0 = await pg.send('Runtime.evaluate', { expression: scrollExpr, returnByValue: true });
      if (k === 0) console.log('  target:', r0.result.value);
      await new Promise(r => setTimeout(r, 500));
    }
    if (thenArg) {
      const sel2 = thenArg.slice(7);
      const expr2 = `(function(){var e=document.querySelector(${JSON.stringify(sel2)}); if(!e) return 'NOTFOUND'; var r=e.getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.top - 120); return 'OK2 '+Math.round(r.top);})()`;
      for (let k = 0; k < 3; k++) {
        const r2 = await pg.send('Runtime.evaluate', { expression: expr2, returnByValue: true });
        if (k === 0) console.log('  then:', r2.result.value);
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  const { data } = await pg.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(out, Buffer.from(data, 'base64'));
  console.log('saved', out);
  await b.send('Target.closeTarget', { targetId });
  process.exit(0);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
