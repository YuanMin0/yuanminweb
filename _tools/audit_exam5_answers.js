/* 模拟卷答案自检：结论句、数值、选项重复、名解与题库一致性 */
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const sb={window:{},console};vm.createContext(sb);
['meta.js','p1.js','p2.js','p3.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(ROOT,'exam5/data',f),'utf8'),sb));
const EX=sb.window.EXAM5,L='ABCDEFGH';
const plain=h=>String(h||'').replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,'').replace(/\s+/g,'');
function lcs(a,b){if(!a||!b)return 0;let best=0;const prev=new Array(b.length+1).fill(0);
for(let i=1;i<=a.length;i++){let last=0;for(let j=1;j<=b.length;j++){const t=prev[j];if(a[i-1]===b[j-1]){prev[j]=last+1;if(prev[j]>best)best=prev[j];}else prev[j]=0;last=t;}}return best;}
function conclusion(exp){const m=exp.match(/(?:故|因此|所以|应选|答案是|正确答案是|正确答案为|综上)[，,：:]?([^。；;]{4,60})/g);return m?m.join('|'):'';}

let n=0,bad=[];
EX.papers.forEach(p=>{
  p.sections.filter(s=>s.key==='single'||s.key==='multiple').forEach(sec=>{
    sec.items.forEach((q,i)=>{
      n++;
      const opts=(q.o||[]).map(plain);
      const ans=Array.isArray(q.a)?q.a:[q.a];
      const exp=plain(q.e);
      // 1) 选项重复
      if(new Set(opts).size!==opts.length) bad.push([p.name,sec.key,i+1,'选项重复']);
      // 2) 结论句指向
      const c=conclusion(exp);
      if(c){
        const sc=opts.map(o=>lcs(c,o));
        const maxOther=Math.max(...sc.filter((_,k)=>ans.indexOf(k)<0),0);
        const ansScore=Math.max(...ans.map(k=>sc[k]||0),0);
        if(maxOther>=8&&maxOther>=ansScore+5) bad.push([p.name,sec.key,i+1,'结论句更像 '+L[sc.indexOf(maxOther)]]);
      }
      // 3) 数值
      if(q.type==='single'&&opts.every(o=>/^[^\u4e00-\u9fa5]{0,6}-?\d+(\.\d+)?[^\u4e00-\u9fa5]{0,8}$/.test(o))){
        const v=parseFloat((opts[q.a].match(/-?\d+(\.\d+)?/)||[])[0]);
        const nums=new Set((exp.match(/-?\d+(\.\d+)?/g)||[]).map(Number));
        if(!isNaN(v)&&!nums.has(v)) bad.push([p.name,sec.key,i+1,'答案数值 '+v+' 未在解析出现']);
      }
    });
  });
});
console.log('模拟卷选择题',n,'问题',bad.length);
bad.forEach(x=>console.log('  ',x.join(' | ')));
