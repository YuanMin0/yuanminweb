const fs=require('fs');
const map=JSON.parse(fs.readFileSync('../_ext/stat2/tested_map.json','utf8'));
const norm=s=>s.replace(/[\s，。、；：？！“”‘’（）()《》【】\[\]<>·—…\-_,.;:?!"']/g,'');
let cap=null;const WB={register:o=>cap=o,registerExam:()=>{}};
new Function('window','WB',fs.readFileSync('data/statistics.js','utf8'))({WB},WB);
let n=0,src=0;
for(const c of cap.chapters){
  for(const k of c.knowledge||[]){
    for(const q of k.quiz||[]){
      const key=norm(q.stem);
      let t=map[key];
      if(c._exam) t='考过·原题（往年真题）';
      if(!t) t='未考过';
      q.tested=t; n++;
      if(!q.source){q.source='《医学统计学》·'+c.title+'·'+k.title; src++;}
    }
  }
}
fs.writeFileSync('data/statistics.js','WB.register('+JSON.stringify(cap,null,2)+');\n','utf8');
console.log('marked',n,'filled source',src);
