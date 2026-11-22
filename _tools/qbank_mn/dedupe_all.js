const fs=require('fs');
const ids=fs.readdirSync('mn').filter(f=>f.endsWith('.html')&&f!=='index.html').map(f=>f.slice(0,-5));
const norm=s=>String(s).replace(/[\s，。、；：？！“”‘’（）()《》【】\[\]<>·—…\-_,.;:?!"']/g,'').toLowerCase();
let removed=0;
function load(code){let cap=null,ex=[];const WB={register:o=>cap=o,registerExam:(s,c)=>ex.push(c)};new Function('window','WB',code)({WB},WB);return{cap,ex};}
for(const id of ids){
  const pin='data/'+id+'.js', pex='data/exam-'+id+'.js';
  if(!fs.existsSync(pin)) continue;
  const a=load(fs.readFileSync(pin,'utf8'));
  const b=fs.existsSync(pex)?load(fs.readFileSync(pex,'utf8')):{cap:null,ex:[]};
  const seen=new Set();
  // 真题章节优先保留
  let examChanged=false;
  for(const chs of b.ex) for(const c of chs) for(const k of c.knowledge||[]){
    if(!Array.isArray(k.quiz)) continue;
    const before=k.quiz.length;
    k.quiz=k.quiz.filter(q=>{const n=norm(q.stem); if(seen.has(n))return false; seen.add(n); return true;});
    if(k.quiz.length!==before){removed+=before-k.quiz.length; examChanged=true;}
  }
  let inlineChanged=false;
  for(const c of a.cap.chapters||[]) for(const k of c.knowledge||[]){
    if(!Array.isArray(k.quiz)) continue;
    const before=k.quiz.length;
    k.quiz=k.quiz.filter(q=>{const n=norm(q.stem); if(seen.has(n))return false; seen.add(n); return true;});
    if(k.quiz.length!==before){removed+=before-k.quiz.length; inlineChanged=true;}
  }
  if(inlineChanged) fs.writeFileSync(pin,'WB.register('+JSON.stringify(a.cap,null,2)+');\n','utf8');
  if(examChanged && b.ex.length) fs.writeFileSync(pex,"WB.registerExam('"+id+"', "+JSON.stringify(b.ex[0],null,2)+");\n",'utf8');
}
console.log('removed',removed);
