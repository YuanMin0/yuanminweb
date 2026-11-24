
const fs=require('fs'),vm=require('vm');
function fakeEl(){return {style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains:()=>false},setAttribute(){},getAttribute:()=>null,removeAttribute(){},appendChild(){},removeChild(){},addEventListener(){},remove(){},querySelector:()=>null,querySelectorAll:()=>[],insertBefore(){},cloneNode:()=>fakeEl(),children:[],innerHTML:'',textContent:''};}
const doc={documentElement:fakeEl(),body:fakeEl(),head:fakeEl(),createElement:()=>fakeEl(),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},getElementById:()=>null};
const sb={window:{},document:doc,localStorage:{getItem:()=>null,setItem(){},removeItem(){}},location:{href:'http://x/',pathname:'/',search:''},navigator:{userAgent:'node'},matchMedia:()=>({matches:false,addEventListener(){}}),setTimeout,clearTimeout,setInterval,clearInterval,URL:{createObjectURL:()=>'',revokeObjectURL(){}},console};
sb.window.localStorage=sb.localStorage;sb.window.document=doc;sb.global=sb;sb.self=sb;vm.createContext(sb);
vm.runInContext(fs.readFileSync('js/core.js','utf8'),sb);sb.WB=sb.window.WB;
const files=fs.readdirSync('data').filter(f=>f.endsWith('.js'));
files.filter(f=>!f.startsWith('exam-')&&!['_meta.js','quiz-meta.js','cdn-config.js','extra-subjects.js'].includes(f)).forEach(f=>{try{vm.runInContext(fs.readFileSync('data/'+f,'utf8'),sb)}catch(e){}});
const WB=sb.window.WB;const out={};
for(const s of WB.subjects()){
  const m={};
  (s.chapters||[]).forEach(ch=>ch.knowledge.forEach(k=>k.quiz.forEach(q=>{
    if(q.type!=='single'&&q.type!=='multiple')return;
    const key=String(q.stem).replace(/<[^>]+>/g,'').replace(/\s+/g,'').toLowerCase();
    const idx=Array.isArray(q.answer)?q.answer:[q.answer];
    m[key]=idx.map(i=>(q.options||[])[i]||'').join('|');
  })));
  out[s.id]=m;
}
process.stdout.write(JSON.stringify(out));
