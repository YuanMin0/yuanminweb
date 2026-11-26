/* 检查高亮与滚动位置：node check_spy.js <page> <selector> */
const http = require('http');
const BASE = 'http://127.0.0.1:8765/', DBG = 'http://127.0.0.1:9222';
function getJSON(u){return new Promise((res,rej)=>{http.get(u,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej)})}
class CDP{constructor(ws){this.ws=ws;this.id=0;this.p=new Map()}
 static async attach(u){const ws=new WebSocket(u);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});const c=new CDP(ws);ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&c.p.has(m.id)){const{res,rej}=c.p.get(m.id);c.p.delete(m.id);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}};return c}
 send(method,params={}){const id=++this.id;return new Promise((res,rej)=>{this.p.set(id,{res,rej});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.p.has(id)){this.p.delete(id);rej(new Error('timeout '+method))}},60000)})}}
const [, , p, sel] = process.argv;
(async () => {
  const ver = await getJSON(DBG + '/json/version');
  const b = await CDP.attach(ver.webSocketDebuggerUrl);
  const { targetId } = await b.send('Target.createTarget', { url: 'about:blank' });
  const list = await getJSON(DBG + '/json/list');
  const t = list.find(x => x.id === targetId);
  const pg = await CDP.attach(t.webSocketDebuggerUrl);
  await pg.send('Page.enable');
  await pg.send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 760, deviceScaleFactor: 1, mobile: false });
  await pg.send('Page.navigate', { url: BASE + p });
  await new Promise(r => setTimeout(r, 1600));
  const expr = `(function(){
    var el=document.querySelector(${JSON.stringify(sel)});
    if(!el) return {err:'no element'};
    el.scrollIntoView({block:'start'});
    return new Promise(function(res){
      setTimeout(function(){
        var y=scrollY+150;
        var arts=[].slice.call(document.querySelectorAll('article.knowledge-block'));
        var last=null;
        arts.forEach(function(a){ if(a.offsetTop<=y) last=a; });
        var act=document.querySelector('.nav-section.active');
        var first=arts[0];
        res({scrollY:Math.round(scrollY), targetTop:Math.round(el.getBoundingClientRect().top),
             lastBlock:last?last.id:null, activeNav:act?act.textContent.trim():null,
             firstBlockOffset:first?first.offsetTop:null,
             targetOffset:el.offsetTop,
             offsetParent:first?first.offsetParent.tagName+'.'+first.offsetParent.className:null});
      }, 700);
    });
  })()`;
  const r = await pg.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  console.log(JSON.stringify(r.result.value, null, 1));
  await b.send('Target.closeTarget', { targetId });
  process.exit(0);
})();
