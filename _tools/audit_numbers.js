/* 数值一致性：选项为数字时，答案数值应出现在解析中 */
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
const WB=sb.window.WB,L='ABCDEFGH';
const plain=h=>String(h||'').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/\s+/g,'');
const num=s=>{const m=String(s).match(/-?\d+(?:\.\d+)?/);return m?parseFloat(m[0]):null;};
const risky=[];let n=0;
for(const s of WB.subjects())(s.chapters||[]).forEach((ch,ci)=>(ch.knowledge||[]).forEach((k,ki)=>(k.quiz||[]).forEach((q,qi)=>{
  if(q.type!=='single')return;
  const opts=(q.options||[]).map(plain);
  if(!opts.every(o=>/^[^\u4e00-\u9fa5]{0,6}-?\d+(\.\d+)?[^\u4e00-\u9fa5]{0,8}$/.test(o)))return;
  n++;
  const ansNum=num(opts[q.answer]); if(ansNum===null)return;
  const exp=plain(q.explain);
  const nums=new Set((exp.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number));
  if(nums.has(ansNum))return;
  const others=opts.map((o,i)=>({i,v:num(o)})).filter(x=>x.i!==q.answer&&x.v!==null&&nums.has(x.v));
  if(others.length===1){
    risky.push({tag:`${s.id}#c${ci+1}k${ki+1}q${qi+1}`,subj:s.name,stem:q.stem.slice(0,30),
      ans:L[q.answer]+'='+ansNum,other:L[others[0].i]+'='+others[0].v,exp:exp.slice(-60)});
  }
})));
console.log('纯数值选项单选',n,'可疑',risky.length);
risky.slice(0,30).forEach(r=>console.log(`[${r.tag}] ${r.subj} | ${r.stem} | 答案 ${r.ans} 未在解析出现，${r.other} 出现 | …${r.exp}`));
