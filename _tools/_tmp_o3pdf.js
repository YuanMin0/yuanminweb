const http=require('http');
const DBG='http://127.0.0.1:9222';
function getJSON(u){return new Promise((res,rej)=>{http.get(u,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej)})}
class CDP{constructor(ws){this.ws=ws;this.id=0;this.p=new Map()}
static async attach(u){const ws=new WebSocket(u);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});const c=new CDP(ws);ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&c.p.has(m.id)){const{res,rej}=c.p.get(m.id);c.p.delete(m.id);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}};return c}
send(method,params={}){const id=++this.id;return new Promise((res,rej)=>{this.p.set(id,{res,rej});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.p.has(id)){this.p.delete(id);rej(new Error('timeout '+method))}},90000)})}}
(async()=>{
const ver=await getJSON(DBG+'/json/version');const b=await CDP.attach(ver.webSocketDebuggerUrl);
const {targetId}=await b.send('Target.createTarget',{url:'about:blank'});
const list=await getJSON(DBG+'/json/list');const t=list.find(x=>x.id===targetId);
const pg=await CDP.attach(t.webSocketDebuggerUrl);
await pg.send('Page.enable');
await pg.send('Page.navigate',{url:'http://127.0.0.1:8765/mn/organ3.html'});
await new Promise(r=>setTimeout(r,3000));
console.log('title', await pg.send('Runtime.evaluate',{expression:'document.title',returnByValue:true}).then(r=>r.result.value));
const css=`.sidebar,.mobile-nav,.footer,.hdr,.top,.tools,.progress,.dock,.tabbar,.question-bank,body::before,body::after,.grain,.scroll-progress,.to-top,.qr-zoom{display:none!important}.layout{display:block!important}main{width:100%!important;margin:0!important;padding:0!important}*{animation:none!important;transition:none!important;filter:none!important;backdrop-filter:none!important;box-shadow:none!important;text-shadow:none!important;mix-blend-mode:normal!important;mask:none!important}.reveal{opacity:1!important;transform:none!important}.chapter,.knowledge-block,table,.table-wrap{break-inside:auto!important}`;
await pg.send('Runtime.evaluate',{expression:`(function(){var st=document.createElement('style');st.textContent=${JSON.stringify(css)};document.head.appendChild(st);})()`});
await new Promise(r=>setTimeout(r,800));
console.log('css ok');
const t0=Date.now();
const {data}=await pg.send('Page.printToPDF',{printBackground:true,paperWidth:8.27,paperHeight:11.69,marginTop:0.45,marginBottom:0.45,marginLeft:0.45,marginRight:0.45});
console.log('pdf',Math.round(data.length*0.75/1024),'KB',Date.now()-t0,'ms');
require('fs').writeFileSync('pdf/organ3.pdf',Buffer.from(data,'base64'));
await b.send('Target.closeTarget',{targetId});process.exit(0);
})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
