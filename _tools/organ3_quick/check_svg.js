/* 检查页面内所有 SVG 的文字是否超出 viewBox：node check_svg.js <path> */
const http = require('http'), fs = require('fs');
const BASE = 'http://127.0.0.1:8765/', DBG = 'http://127.0.0.1:9222';
function getJSON(u){return new Promise((res,rej)=>{http.get(u,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej)})}
class CDP{
  constructor(ws){this.ws=ws;this.id=0;this.p=new Map()}
  static async attach(u){const ws=new WebSocket(u);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});const c=new CDP(ws);ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&c.p.has(m.id)){const{res,rej}=c.p.get(m.id);c.p.delete(m.id);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}};return c}
  send(method,params={}){const id=++this.id;return new Promise((res,rej)=>{this.p.set(id,{res,rej});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.p.has(id)){this.p.delete(id);rej(new Error('timeout '+method))}},60000)})}
}
const p = process.argv[2];
(async()=>{
  const ver = await getJSON(DBG + '/json/version');
  const b = await CDP.attach(ver.webSocketDebuggerUrl);
  const { targetId } = await b.send('Target.createTarget', { url: 'about:blank' });
  const list = await getJSON(DBG + '/json/list');
  const t = list.find(x => x.id === targetId);
  const pg = await CDP.attach(t.webSocketDebuggerUrl);
  await pg.send('Page.enable');
  await pg.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await pg.send('Page.navigate', { url: BASE + p });
  await new Promise(r => setTimeout(r, 2200));
  const expr = `(function(){
    var out=[];
    document.querySelectorAll('figure.fig svg').forEach(function(svg, idx){
      var vb=svg.viewBox.baseVal;
      var probs=[];
      svg.querySelectorAll('text').forEach(function(t){
        var bb;
        try { bb=t.getBBox(); } catch(e){ return; }
        var r=bb.x+bb.width, bo=bb.y+bb.height;
        if (bb.x < -1 || bb.y < -1 || r > vb.width+1 || bo > vb.height+1) {
          probs.push({txt:t.textContent.slice(0,26), x:Math.round(bb.x), right:Math.round(r), w:Math.round(bb.width), vbw:vb.width});
        }
      });
      if (probs.length) out.push({idx:idx, aria:svg.getAttribute('aria-label'), probs:probs});
    });
    return JSON.stringify({total:document.querySelectorAll('figure.fig svg').length, bad:out});
  })()`;
  const r = await pg.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  const data = JSON.parse(r.result.value);
  console.log('SVG 总数', data.total, '｜溢出图数', data.bad.length);
  data.bad.forEach(function(g){
    console.log('  #' + g.idx, g.aria);
    g.probs.forEach(function(x){ console.log('    ', JSON.stringify(x)); });
  });
  await b.send('Target.closeTarget', { targetId });
  process.exit(0);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
