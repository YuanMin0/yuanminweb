const http=require('http'),fs=require('fs');
const DBG='http://127.0.0.1:9222';
function getJSON(u){return new Promise((res,rej)=>{http.get(u,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej)})}
class CDP{constructor(ws){this.ws=ws;this.id=0;this.p=new Map()}
static async attach(u){const ws=new WebSocket(u);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});const c=new CDP(ws);ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&c.p.has(m.id)){const{res,rej}=c.p.get(m.id);c.p.delete(m.id);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}};return c}
send(method,params={}){const id=++this.id;return new Promise((res,rej)=>{this.p.set(id,{res,rej});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.p.has(id)){this.p.delete(id);rej(new Error('timeout'))}},60000)})}}
(async()=>{
const sel=process.argv[2], out=process.argv[3], h=+(process.argv[4]||700);
const ver=await getJSON(DBG+'/json/version');const b=await CDP.attach(ver.webSocketDebuggerUrl);
const {targetId}=await b.send('Target.createTarget',{url:'about:blank'});
const list=await getJSON(DBG+'/json/list');const t=list.find(x=>x.id===targetId);
const pg=await CDP.attach(t.webSocketDebuggerUrl);
await pg.send('Page.enable');await pg.send('Runtime.enable');await pg.send('Network.enable');
await pg.send('Network.setCacheDisabled',{cacheDisabled:true});
await pg.send('Emulation.setDeviceMetricsOverride',{width:1400,height:1000,deviceScaleFactor:1,mobile:false});
await pg.send('Page.navigate',{url:'http://127.0.0.1:8765/mn/organ3.html'});
await new Promise(r=>setTimeout(r,1500));
const r=await pg.send('Runtime.evaluate',{returnByValue:true,expression:`(function(){var e=document.querySelector(${JSON.stringify(sel)});var b=e.getBoundingClientRect();return JSON.stringify({x:b.x+window.scrollX,y:b.y+window.scrollY,w:b.width});})()`});
const box=JSON.parse(r.result.value);
const {data}=await pg.send('Page.captureScreenshot',{format:'png',clip:{x:box.x-10,y:box.y-10,width:Math.min(box.w+20,1380),height:h,scale:1},captureBeyondViewport:true});
fs.writeFileSync(out,Buffer.from(data,'base64'));
console.log('saved',JSON.stringify(box));
await b.send('Target.closeTarget',{targetId});process.exit(0);
})().catch(e=>{console.error(e.message);process.exit(1)});
