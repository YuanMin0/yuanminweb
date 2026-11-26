/* 分步滚动，记录侧栏是否跟随：node scrolltest.js <page> */
const http = require('http');
const BASE = 'http://127.0.0.1:8765/', DBG = 'http://127.0.0.1:9222';
function getJSON(u){return new Promise((res,rej)=>{http.get(u,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej)})}
class CDP{
  constructor(ws){this.ws=ws;this.id=0;this.p=new Map()}
  static async attach(u){const ws=new WebSocket(u);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});const c=new CDP(ws);ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&c.p.has(m.id)){const{res,rej}=c.p.get(m.id);c.p.delete(m.id);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}};return c}
  send(method,params={}){const id=++this.id;return new Promise((res,rej)=>{this.p.set(id,{res,rej});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.p.has(id)){this.p.delete(id);rej(new Error('timeout '+method))}},60000)})}
}
const [, , p, wArg, hArg] = process.argv;
(async()=>{
  const ver = await getJSON(DBG + '/json/version');
  const b = await CDP.attach(ver.webSocketDebuggerUrl);
  const { targetId } = await b.send('Target.createTarget', { url: 'about:blank' });
  const list = await getJSON(DBG + '/json/list');
  const t = list.find(x => x.id === targetId);
  const pg = await CDP.attach(t.webSocketDebuggerUrl);
  await pg.send('Page.enable');
  await pg.send('Emulation.setDeviceMetricsOverride', { width: +(wArg||1440), height: +(hArg||900), deviceScaleFactor: 1, mobile: false });
  await pg.send('Page.navigate', { url: BASE + p });
  await new Promise(r => setTimeout(r, 1600));
  const total = (await pg.send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight-innerHeight', returnByValue: true })).result.value;
  console.log('可滚动高度', total);
  for (let y = 0; y <= total; y += 600) {
    await pg.send('Runtime.evaluate', { expression: `window.scrollTo(0, ${y}); 1` });
    await new Promise(r => setTimeout(r, 650));
    const r = await pg.send('Runtime.evaluate', { expression: `(()=>{var sb=document.querySelector('.sidebar');var a=document.querySelector('.nav-section.active')||document.querySelector('.nav-chapter.active');return [Math.round(scrollY), Math.round(sb.scrollTop), a?a.textContent.trim().slice(0,14):'-']})()`, returnByValue: true });
    console.log(r.result.value.join('  |  '));
  }
  await b.send('Target.closeTarget', { targetId });
  process.exit(0);
})();
