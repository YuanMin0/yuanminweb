# -*- coding: utf-8 -*-
"""把速记页里仍为「全选」的多选题，按 data 层同题干题目的新选项/答案同步。
只改 options 与 答案 行，并在解析末尾补 data 层新增的错项说明，保留原有解析主体。
用法：python _tools/fix_mn_allselect.py <sid> [--write]
"""
import json, os, re, subprocess, sys, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

LOADER = r"""
const fs=require('fs');
const id=process.env.SID;
let cap=null,ex=[];
const WB={register:o=>{cap=o;},registerExam:(s,c)=>{ex.push(c);}};
const code=fs.readFileSync('data/'+id+'.js','utf8');
new Function('window','WB',code)({WB},WB);
const pe='data/exam-'+id+'.js';
if(fs.existsSync(pe)){
  const c2=fs.readFileSync(pe,'utf8');
  new Function('window','WB',c2)({WB},WB);
}
const chapters=(cap.chapters||[]).concat(...ex);
console.log(JSON.stringify({name:cap.name,chapters}));
"""

CARD = re.compile(r'(<article class="qa-card[^"]*"[^>]*data-type="multiple"[^>]*>)(.*?)(</article>)', re.S)
OPT = re.compile(r'(<div class="option-list">)(.*?)(</div>\s*<button)', re.S)
ITEM = re.compile(r'<div>\s*([A-H])[\.、]\s*(.*?)</div>', re.S)
ANS = re.compile(r'(答案：</strong>)\s*([A-H]+)')
H3 = re.compile(r'<h3>(.*?)</h3>', re.S)


def norm(t):
    t = re.sub(r'<[^>]+>', '', t)
    t = html.unescape(t)
    return re.sub(r'\s+', '', t).lower()


def load(sid):
    env = dict(os.environ, SID=sid)
    out = subprocess.check_output(['node', '-e', LOADER], cwd=ROOT, text=True, encoding='utf-8', env=env)
    data = json.loads(out)
    m = {}
    for ch in data['chapters']:
        for k in ch.get('knowledge', []):
            for q in k.get('quiz', []):
                if q.get('type') == 'multiple':
                    m[norm(q['stem'])] = q
    return m


def main():
    sid = sys.argv[1]
    write = '--write' in sys.argv
    path = os.path.join(ROOT, 'mn', sid + '.html')
    s = open(path, encoding='utf-8').read()
    dm = load(sid)
    changed = []
    missing = []

    def repl(m):
        head, body, tail = m.group(1), m.group(2), m.group(3)
        hm = H3.search(body)
        if not hm:
            return m.group(0)
        key = norm(hm.group(1))
        q = dm.get(key)
        if not q:
            missing.append(hm.group(1)[:36])
            return m.group(0)
        opts = q.get('options') or []
        ans = q.get('answer') or []
        if len(opts) < 5 or len(ans) >= len(opts):
            return m.group(0)  # data 层仍全选，跳过
        om = OPT.search(body)
        am = ANS.search(body)
        if not om or not am:
            return m.group(0)
        cur = ITEM.findall(om.group(2))
        if len(cur) != len(am.group(2)):
            return m.group(0)  # 页面上已经不是全选，跳过
        letters = 'ABCDEFGH'
        old_texts = [html.unescape(t).strip() for _, t in cur]
        new_opts = ''.join(
            '<div>%s. %s</div>' % (letters[i], html.escape(html.unescape(o), quote=False))
            for i, o in enumerate(opts)
        )
        # 只替换 option-list 的内部，保留外层 div 与后面的 <button ...>
        body = body[:om.start(2)] + new_opts + body[om.end(2):]
        # 重新定位答案行
        am = ANS.search(body)
        old_ans = am.group(2)
        new_ans = ''.join(letters[i] for i in ans)
        body = body[:am.start(2)] + new_ans + body[am.end(2):]
        # 追加错项说明 + 修正「四项均」表述
        added = [o for o in opts if html.unescape(o).strip() not in old_texts]
        note = ''
        if len(added) == 1:
            exp = q.get('explain') or ''
            tag = '<b>%s</b>' % added[0]
            k = exp.find(tag)
            if k >= 0:
                note = exp[k:]
        # 选项数变了，原「四项均正确」的表述要改成按字母表述
        fixed = '上述各项中 ' + '、'.join(new_ans) + ' 正确'
        body = body.replace('上述四项均正确', fixed).replace('四项均正确', fixed)
        if note:
            p = body.rfind('</div></div>')
            if p > 0:
                body = body[:p] + '<p><strong>解析补充：</strong>' + note + '</p>' + body[p:]
        changed.append((hm.group(1)[:36], old_ans, new_ans))
        return head + body + tail

    s2 = CARD.sub(repl, s)
    print(sid, '可同步', len(changed), '未匹配 data', len(missing))
    for c in changed:
        print('   ', c[0], c[1], '->', c[2])
    for x in missing:
        print('    [无 data] ', x)
    if write and changed:
        open(path, 'w', encoding='utf-8', newline='\n').write(s2)
        print('   已写入')


if __name__ == '__main__':
    main()
