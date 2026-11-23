const fs=require('fs'),path=require('path');
const {execSync}=require('child_process');
const p='data/statistics.js';
let cap=null;const WB={register:o=>cap=o,registerExam:()=>{}};
new Function('window','WB',fs.readFileSync(p,'utf8'))({WB},WB);
const py=path.join(__dirname,'questions.py');
const out=execSync('python -c "import sys;sys.path.insert(0,r\'C:/Users/38815/WorkBuddy AI/2026-10-16-02-21-50/medilearn/_tools/stat_add\');import questions,json;print(json.dumps(questions.CHAPTERS,ensure_ascii=False))"',{encoding:'utf8',maxBuffer:10*1024*1024});
const chapters=JSON.parse(out);
let added=0;
for(const ch of chapters){
  if(cap.chapters.some(c=>c.title===ch.title)){console.log('exists',ch.title);continue;}
  for(const k of ch.knowledge){
    if(!k.content||!k.content.length) k.content=[{type:'p',text:k.summary}];
  }
  cap.chapters.push(ch); added+=ch.knowledge.reduce((n,k)=>n+(k.quiz||[]).length,0);
}
fs.writeFileSync(p,'WB.register('+JSON.stringify(cap,null,2)+');\n','utf8');
console.log('added questions',added,'chapters',cap.chapters.length);
