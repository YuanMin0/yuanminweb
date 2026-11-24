# -*- coding: utf-8 -*-
"""比对速记页与数据层：同题干的选择题，答案文本是否一致"""
import os, re, json, html, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 1) 用 node 导出数据层：科目 -> {normStem: answerText}
js = r'''
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
'''
open(os.path.join(ROOT,'_tools/_tmp_dump.js'),'w',encoding='utf-8').write(js)
raw = subprocess.check_output(['node', os.path.join(ROOT,'_tools/_tmp_dump.js')], cwd=ROOT).decode('utf-8')
DATA = json.loads(raw)

def norm(t):
    t = html.unescape(re.sub(r'<[^>]+>','',t))
    return re.sub(r'\s+','',t).lower()

CARD = re.compile(r'<article class="qa-card[^>]*data-type="(single|multiple)"[^>]*>(.*?)</article>', re.S)
OPT = re.compile(r'<div class="option-list">(.*?)</div>\s*<button', re.S)
ITEM = re.compile(r'<div>\s*([A-H])[\.、]\s*(.*?)</div>', re.S)
ANS = re.compile(r'答案：</strong>\s*([A-H]+)')

bad=[]; total=0
for fn in sorted(os.listdir(os.path.join(ROOT,'mn'))):
    if not fn.endswith('.html') or fn=='index.html': continue
    sid=fn[:-5]
    if sid not in DATA: continue
    s=open(os.path.join(ROOT,'mn',fn),encoding='utf-8').read()
    for m in CARD.finditer(s):
        total+=1
        body=m.group(2)
        hm=re.search(r'<h3>(.*?)</h3>', body, re.S)
        if not hm: continue
        key=norm(hm.group(1))
        if key not in DATA[sid]: continue
        om=OPT.search(body)
        if not om: continue
        opts=dict((l,t) for l,t in ITEM.findall(om.group(1)))
        am=ANS.search(body)
        if not am: continue
        letters=am.group(1)
        mn_ans='|'.join(norm(opts.get(c,'')) for c in letters)
        data_ans=norm(DATA[sid][key])
        if mn_ans and data_ans and mn_ans!=data_ans:
            bad.append((fn, hm.group(1)[:30], letters, mn_ans[:30], data_ans[:30]))

print('比对题卡', total, '答案不一致', len(bad))
for b in bad[:20]:
    print('  ', b[0], '|', b[1], '| mn:', b[2], b[3], '| data:', b[4])
