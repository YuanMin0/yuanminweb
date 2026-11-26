/* 清缓存后测量：node cs_nosw.js <page> "<expr>" */
const http = require('http');
const BASE = 'http://127.0.0.1:8765/', DBG = 'http://127.0.0.1:9222';
function getJSON(u){return new Promise((res,rej)=>{http.get(u,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej)})}
class CDP{constructor(ws){this.ws=ws;this.id=0;this.p=new Map()}
 static async attach(u){const ws=new WebSocket(u);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});const c=new CDP(ws);ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&c.p.has(m.id)){const{res,rej}=c.p.get(m.id);c.p.delete(m.id);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}};return c}
 send(method,params={}){const id=++this.id;return new Promise((res,rej)=>{this.p.set(id,{res,rej});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.p.has(id)){this.p.delete(id);rej(new Error('timeout '+method))}},120000)})}}
const [, , p, expr] = process.argv;
(async () => {
  const ver = await getJSON(DBG + '/json/version');
  const b = await CDP.attach(ver.webSocketDebuggerUrl);
  const { targetId } = await b.send('Target.createTarget', { url: 'about:blank' });
  const list = await getJSON(DBG + '/json/list');
  const t = list.find(x => x.id === targetId);
  const pg = await CDP.attach(t.webSocketDebuggerUrl);
  await pg.send('Page.enable');
  await pg.send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 780, deviceScaleFactor: 1, mobile: false });
  await pg.send('Network.enable');
  await pg.send('Network.setCacheDisabled', { cacheDisabled: true });
  await pg.send('Page.navigate', { url: BASE + p });
  await new Promise(r => setTimeout(r, 1500));
  await pg.send('Runtime.evaluate', { expression: `(async function(){
    try{
      var ks = await caches.keys();
      await Promise.all(ks.map(function(k){ return caches.delete(k); }));
      var rs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(rs.map(function(r){ return r.unregister(); }));
    }catch(e){}
    return 1;
  })()`, awaitPromise: true });
  await pg.send('Page.reload', { ignoreCache: true });
  await new Promise(r => setTimeout(r, 2200));
  const r = await pg.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  console.log(JSON.stringify(r.result.value, null, 1));
  await b.send('Target.closeTarget', { targetId });
  process.exit(0);
})();
