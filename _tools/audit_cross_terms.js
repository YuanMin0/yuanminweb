/* 交叉验证 C：跨科目同名术语/概念的定义一致性 */
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
function bigrams(t){const s=new Set();for(let i=0;i<t.length-1;i++)s.add(t.slice(i,i+2));return s;}
function dice(a,b){const A=bigrams(a),B=bigrams(b);if(!A.size||!B.size)return 0;let inter=0;A.forEach(x=>{if(B.has(x))inter++;});return 2*inter/(A.size+B.size);}

const groups=new Map();
for(const s of WB.subjects())(s.chapters||[]).forEach(ch=>ch.knowledge.forEach(k=>k.quiz.forEach(q=>{
  if(q.type!=='term')return;
  const key=plain(q.stem).replace(/[（(].*?[)）]/g,'');
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push({sid:s.id,subj:s.name,stem:q.stem,def:plain(q.explain||q.a||'')});
})));
let pairs=0,bad=[];
groups.forEach((arr,key)=>{
  if(arr.length<2)return;
  for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){
    if(arr[i].sid===arr[j].sid)continue;
    pairs++;
    const sim=dice(arr[i].def,arr[j].def);
    if(sim<0.45)bad.push([key,arr[i].subj+'/'+arr[i].stem,arr[j].subj+'/'+arr[j].stem,sim.toFixed(2),arr[i].def.slice(0,40),arr[j].def.slice(0,40)]);
  }
});
console.log('跨科目同名术语对',pairs,'| 定义相似度<0.45',bad.length);
bad.sort((a,b)=>a[3]-b[3]).slice(0,15).forEach(x=>console.log('  ['+x[3]+'] '+x[0]+' | '+x[1]+' vs '+x[2]+'\n       A: '+x[4]+'\n       B: '+x[5]));
