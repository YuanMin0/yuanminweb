const fs=require('fs');
const ids=fs.readdirSync('mn').filter(f=>f.endsWith('.html')&&f!=='index.html').map(f=>f.slice(0,-5));
let n=0;
for(const id of ids){
  const p='data/'+id+'.js'; if(!fs.existsSync(p))continue;
  let cap=null; const WB={register:o=>cap=o,registerExam:()=>{}};
  new Function('window','WB',fs.readFileSync(p,'utf8'))({WB},WB);
  if(!cap) continue;
  let ch=false;
  for(const c of cap.chapters||[]) for(const k of c.knowledge||[]) for(const q of k.quiz||[]){
    if(!q.source){
      q.source='《'+cap.name+'》·'+c.title+'·'+k.title;
      n++; ch=true;
    }
  }
  if(ch) fs.writeFileSync(p,'WB.register('+JSON.stringify(cap,null,2)+');\n','utf8');
}
console.log('filled',n);
