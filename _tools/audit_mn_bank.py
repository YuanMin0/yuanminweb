# -*- coding: utf-8 -*-
"""深度轮 2b：速记页（mn/*.html）题库自检
检查：选项重复、答案字母越界、答案字母与选项数不符、解析缺失、来源缺失
"""
import os, re, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MN = os.path.join(ROOT, 'mn')

CARD = re.compile(r'<article class="qa-card[^"]*"(.*?)</article>', re.S)
OPT = re.compile(r'<div class="option-list">(.*?)</div>\s*<button', re.S)
ITEM = re.compile(r'<div>\s*([A-H])[\.、]\s*(.*?)</div>', re.S)
ANS = re.compile(r'答案：</strong>\s*([A-H]{1,8})')
EXPL = re.compile(r'解析：</strong>(.*?)</p>', re.S)
SRC = re.compile(r'来源：</strong>(.*?)</p>', re.S)
DTYPE = re.compile(r'data-type="([a-z]+)"')

def norm(t):
    t = html.unescape(re.sub(r'<[^>]+>', '', t))
    t = t.replace('\u3000', ' ').strip().lower()
    t = re.sub(r'[\s。，、；：！？,.;:!?"\'()\[\]【】《》]', '', t)
    return t

total = 0
issues = []
for fn in sorted(os.listdir(MN)):
    if not fn.endswith('.html') or fn == 'index.html':
        continue
    s = open(os.path.join(MN, fn), encoding='utf-8').read()
    for m in CARD.finditer(s):
        body = m.group(1)
        total += 1
        dt = DTYPE.search(body)
        dtype = dt.group(1) if dt else '?'
        if dtype not in ('single', 'multiple'):
            continue
        om = OPT.search(body)
        if not om:
            # 兼容列表以 </div></div> 结尾、后面没有 button 的写法
            om = re.search(r'<div class="option-list">(.*?)</div></div>', body, re.S)
        opts = ITEM.findall(om.group(1)) if om else []
        am = ANS.search(body)
        ans = am.group(1) if am else ''
        stem = re.search(r'<h3>(.*?)</h3>', body, re.S)
        head = re.sub(r'<[^>]+>', '', stem.group(1))[:30] if stem else '?'
        if len(opts) < 3:
            issues.append((fn, '选项不足', head, str(len(opts))))
            continue
        texts = [norm(t) for _, t in opts]
        if len(set(texts)) != len(texts):
            dup = [t for t in set(texts) if texts.count(t) > 1]
            issues.append((fn, '选项重复', head, ' / '.join(x[:18] for x in dup)))
        letters = [l for l, _ in opts]
        if not ans:
            issues.append((fn, '缺答案', head, ''))
        else:
            for ch in ans:
                if ch not in letters:
                    issues.append((fn, '答案字母越界', head, ans + ' 不在 ' + ''.join(letters)))
        if dtype == 'single' and len(ans) != 1:
            issues.append((fn, '单选答案多字母', head, ans))
        if not EXPL.search(body):
            issues.append((fn, '缺解析', head, ''))
        if not SRC.search(body):
            issues.append((fn, '缺来源', head, ''))

print('速记页题卡总数', total)
print('问题数', len(issues))
from collections import Counter
print(Counter(i[1] for i in issues))
for i in issues[:20]:
    print('  ', ' | '.join(i))
