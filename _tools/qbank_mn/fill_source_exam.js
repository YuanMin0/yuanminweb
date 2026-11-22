const fs=require('fs');
const ids=fs.readdirSync('mn').filter(f=>f.endsWith('.html')&&f!=='index.html').map(f=>f.slice(0,-5));
let n=0;
for(const id of ids){
  const p='data/exam-'+id+'.js'; if(!fs.existsSync(p))continue;
  const pin='data/'+id+'.js';
  let cap=null; const WB={register:o=>cap=o,registerExam:()=>{}};
  new Function('window','WB',fs.readFileSync(pin,'utf8'))({WB},WB);
  const name=(cap&&cap.name)||id;
  let ex=[]; const W2={register:()=>{},registerExam:(s,c)=>ex.push(c)};
  new Function('window','WB',fs.readFileSync(p,'utf8'))({WB:W2},W2);
  let ch=false;
  for(const chs of ex) for(const c of chs) for(const k of c.knowledge||[]) for(const q of k.quiz||[]){
    if(!q.source){q.source='《'+name+'》·'+c.title+'·'+k.title; n++; ch=true;}
  }
  if(ch&&ex.length) fs.writeFileSync(p,"WB.registerExam('"+id+"', "+JSON.stringify(ex[0],null,2)+");\n",'utf8');
}
console.log('filled',n);
