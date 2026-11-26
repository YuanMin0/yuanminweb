const http = require('http');
const BASE = 'http://127.0.0.1:8765/', DBG = 'http://127.0.0.1:9222';
function getJSON(u){return new Promise((res,rej)=>{http.get(u,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej)})}
class CDP{constructor(ws){this.ws=ws;this.id=0;this.p=new Map()}
 static async attach(u){const ws=new WebSocket(u);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});const c=new CDP(ws);ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&c.p.has(m.id)){const{res,rej}=c.p.get(m.id);c.p.delete(m.id);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}};return c}
 send(method,params={}){const id=++this.id;return new Promise((res,rej)=>{this.p.set(id,{res,rej});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.p.has(id)){this.p.delete(id);rej(new Error('timeout '+method))}},240000)})}}
(async () => {
  const ver = await getJSON(DBG + '/json/version');
  const b = await CDP.attach(ver.webSocketDebuggerUrl);
  const { targetId } = await b.send('Target.createTarget', { url: 'about:blank' });
  const list = await getJSON(DBG + '/json/list');
  const t = list.find(x => x.id === targetId);
  const pg = await CDP.attach(t.webSocketDebuggerUrl);
  await pg.send('Page.enable');
  await pg.send('Page.navigate', { url: BASE + 'mn/organ3.html' });
  await new Promise(r => setTimeout(r, 2000));
  await pg.send('Emulation.setEmulatedMedia', { media: 'print' });
  const r = await pg.send('Runtime.evaluate', {
    expression: `(function(){
      var f=document.querySelector('.chapter-header .fig');
      if(!f) return {err:'no fig'};
      var cs=getComputedStyle(f);
      return {display:cs.display, h:f.getBoundingClientRect().height, w:f.getBoundingClientRect().width,
              bodyH:document.body.scrollHeight};
    })()`, returnByValue: true });
  console.log(JSON.stringify(r.result.value));
  await b.send('Target.closeTarget', { targetId });
  process.exit(0);
})();
