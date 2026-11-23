const fs=require('fs'),path=require('path');
const {execSync}=require('child_process');
const py='C:/Users/38815/WorkBuddy AI/2026-10-16-02-21-50/medilearn/_tools/stat_add';
const meta=JSON.parse(execSync(`python -c "import sys;sys.path.insert(0,r'${py}');import extra,json;print(json.dumps({'PICKS':extra.PICKS,'EXPLAIN':{f'{k[0]}-{k[1]}':v for k,v in extra.EXPLAIN.items()},'CHAPTER':extra.CHAPTER,'SOURCE':extra.SOURCE},ensure_ascii=False))"`,{encoding:'utf8',maxBuffer:10*1024*1024}));
const parsed=JSON.parse(fs.readFileSync('../_ext/stat2/parsed.json','utf8'));
const byBlock={};for(const b of parsed)byBlock[b.block]=b;
let cap=null;const WB={register:o=>cap=o,registerExam:()=>{}};
new Function('window','WB',fs.readFileSync('data/statistics.js','utf8'))({WB},WB);
const norm=s=>s.replace(/[\s，。、；：？！“”‘’（）()《》【】\[\]<>·—…\-_,.;:?!"']/g,'');
let added=0,skipped=[];
for(const [blk,nums] of Object.entries(meta.PICKS)){
  const b=byBlock[blk];
  const [chIdx,kIdx]=meta.CHAPTER[blk];
  const k=cap.chapters[chIdx-1].knowledge[kIdx];
  for(const num of nums){
    const q=(b.single||[]).find(x=>x.num===num);
    if(!q||!q.answer||!q.options||q.options.length<4){skipped.push(`${blk}-${num}:bad`);continue;}
    const ex=meta.EXPLAIN[`${blk}-${num}`];
    if(!ex){skipped.push(`${blk}-${num}:noexp`);continue;}
    const n=norm(q.stem);
    if((k.quiz||[]).some(x=>norm(x.stem)===n)){skipped.push(`${blk}-${num}:dup`);continue;}
    const ai='ABCDE'.indexOf(q.answer);
    if(ai<0||ai>=q.options.length){skipped.push(`${blk}-${num}:ans`);continue;}
    k.quiz=k.quiz||[];
    k.quiz.push({type:'single',stem:q.stem,options:q.options,answer:ai,explain:ex,source:`《统计.pdf》在线自测·${meta.SOURCE[blk]}（原题）`,freq:'中频'});
    added++;
  }
}
fs.writeFileSync('data/statistics.js','WB.register('+JSON.stringify(cap,null,2)+');\n','utf8');
console.log('added',added,'skipped',skipped);
