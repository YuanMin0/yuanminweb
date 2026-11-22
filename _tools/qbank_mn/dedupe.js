const fs=require('fs'),path=require('path');
const ids=fs.readdirSync('mn').filter(f=>f.endsWith('.html')&&f!=='index.html').map(f=>f.slice(0,-5));
const norm=s=>String(s).replace(/[\s，。、；：？！“”‘’（）()《》【】\[\]<>·—…\-_,.;:?!"']/g,'').toLowerCase();
let removed=0;
for(const id of ids){
  const p='data/'+id+'.js'; if(!fs.existsSync(p)) continue;
  let cap=null; const WB={register:o=>cap=o,registerExam:()=>{}};
  new Function('window','WB',fs.readFileSync(p,'utf8'))({WB},WB);
  if(!cap) continue;
  const seen=new Set(); let ch=false;
  for(const c of cap.chapters||[]) for(const k of c.knowledge||[]){
    if(!Array.isArray(k.quiz)) continue;
    const before=k.quiz.length;
    k.quiz=k.quiz.filter(q=>{const n=norm(q.stem); if(seen.has(n)) return false; seen.add(n); return true;});
    if(k.quiz.length!==before){removed+=before-k.quiz.length; ch=true;}
  }
  if(ch) fs.writeFileSync(p,'WB.register('+JSON.stringify(cap,null,2)+');\n','utf8');
}
console.log('removed',removed);
