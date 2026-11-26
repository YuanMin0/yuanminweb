/* 滚到指定位置后截图：node shot_at.js <page> <out.png> <y> */
const http=require('http'),fs=require('fs');
const BASE='http://127.0.0.1:8765/',DBG='http://127.0.0.1:9222';
function getJSON(u){return new Promise((res,rej)=>{http.get(u,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej)})}
class CDP{constructor(ws){this.ws=ws;this.id=0;this.p=new Map()}
 static async attach(u){const ws=new WebSocket(u);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});const c=new CDP(ws);ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&c.p.has(m.id)){const{res,rej}=c.p.get(m.id);c.p.delete(m.id);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)}};return c}
 send(method,params={}){const id=++this.id;return new Promise((res,rej)=>{this.p.set(id,{res,rej});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.p.has(id)){this.p.delete(id);rej(new Error('timeout '+method))}},60000)})}}
const [,,p,out,yArg]=process.argv;
(async()=>{
 const ver=await getJSON(DBG+'/json/version');const b=await CDP.attach(ver.webSocketDebuggerUrl);
 const {targetId}=await b.send('Target.createTarget',{url:'about:blank'});
 const list=await getJSON(DBG+'/json/list');const t=list.find(x=>x.id===targetId);
 const pg=await CDP.attach(t.webSocketDebuggerUrl);await pg.send('Page.enable');
 await pg.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await pg.send('Page.navigate',{url:BASE+p});await new Promise(r=>setTimeout(r,1600));
 // 分步滚，模拟真实滚动
 const target=+yArg||0;
 for(let v=0;v<target;v+=400){await pg.send('Runtime.evaluate',{expression:`window.scrollTo(0,${Math.min(v+400,target)})`});await new Promise(r=>setTimeout(r,16));}
 await new Promise(r=>setTimeout(r,700));
 const info=await pg.send('Runtime.evaluate',{expression:`(()=>{var sb=document.querySelector('.sidebar');var a=document.querySelector('.nav-section.active')||document.querySelector('.nav-chapter.active');var r=a?a.getBoundingClientRect():null;return {y:Math.round(scrollY),sb:Math.round(sb.scrollTop),act:a?a.textContent.trim().slice(0,12):'-',actTop:r?Math.round(r.top):0,sh:sb.scrollHeight,ch:sb.clientHeight};})()`,returnByValue:true});
 console.log(JSON.stringify(info.result.value));
 const {data}=await pg.send('Page.captureScreenshot',{format:'png'});
 fs.writeFileSync(out,Buffer.from(data,'base64'));
 await b.send('Target.closeTarget',{targetId});process.exit(0);
})();
