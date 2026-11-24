/* 交叉验证 D：选项语义近似（bigram 相似度 >0.8 且文本不同） */
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
function fakeEl(){return {style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains:()=>false},setAttribute(){},getAttribute:()=>null,removeAttribute(){},appendChild(){},removeChild(){},addEventListener(){},remove(){},querySelector:()=>null,querySelectorAll:()=>[],insertBefore(){},cloneNode:()=>fakeEl(),children:[],innerHTML:'',textContent:''};}
const doc={documentElement:fakeEl(),body:fakeEl(),head:fakeEl(),createElement:()=>fakeEl(),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},getElementById:()=>null};
const sb={window:{},document:doc,localStorage:{getItem:()=>null,setItem(){},removeItem(){}},location:{href:'http://x/',pathname:'/',search:''},navigator:{userAgent:'node'},matchMedia:()=>({matches:false,addEventListener(){}}),setTimeout,clearTimeout,setInterval,clearInterval,URL:{createObjectURL:()=>'',revokeObjectURL(){}},console};
sb.window.localStorage=sb.localStorage;sb.window.document=doc;sb.global=sb;sb.self=sb;vm.createContext(sb);
function load(f){try{vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),sb,{filename:f});}catch(e){}if(!sb.WB&&sb.window.WB)sb.WB=sb.window.WB;}
load('js/core.js');
const files=fs.readdirSync(path.join(ROOT,'data')).filter(f=>f.endsWith('.js'));
files.filter(f=>!f.startsWith('exam-')&&!['_meta.js','quiz-meta.js','cdn-config.js','extra-subjects.js'].includes(f)).forEach(f=>load('data/'+f));
files.filter(f=>f.startsWith('exam-')).forEach(f=>load('data/'+f));
const WB=sb.window.WB;
const plain=h=>String(h||'').replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,'').toLowerCase();
function bg(t){const s=new Set();for(let i=0;i<t.length-1;i++)s.add(t.slice(i,i+2));return s;}
function dice(a,b){const A=bg(a),B=bg(b);if(!A.size||!B.size)return 0;let x=0;A.forEach(k=>{if(B.has(k))x++;});return 2*x/(A.size+B.size);}
let n=0,bad=[];
for(const s of WB.subjects())(s.chapters||[]).forEach((ch,ci)=>ch.knowledge.forEach((k,ki)=>k.quiz.forEach((q,qi)=>{
  if(q.type!=='single'&&q.type!=='multiple')return;
  n++;
  const o=(q.options||[]).map(plain);
  for(let i=0;i<o.length;i++)for(let j=i+1;j<o.length;j++){
    if(o[i]===o[j])continue;
    const sim=dice(o[i],o[j]);
    if(sim>=0.8)bad.push([`${s.id}#c${ci+1}k${ki+1}q${qi+1}`,sim.toFixed(2),q.stem.slice(0,22),o[i].slice(0,26),o[j].slice(0,26)]);
  }
})));
console.log('选择题',n,'| 选项语义近似',bad.length);
bad.slice(0,20).forEach(x=>console.log('  ['+x[0]+' '+x[1]+'] '+x[2]+' | '+x[3]+' ≈ '+x[4]));
