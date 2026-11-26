# -*- coding: utf-8 -*-
"""复审：把四份「泡面往年」里的名解/大题清单与 dati 数据比对，找遗漏。"""
import json, re
from pathlib import Path

D = Path(__file__).parent
TXT = D / 'txt'

# 我的题库标题
mine = []
for fn in ['dati_1.json', 'dati_2.json']:
    for cat in json.loads((D / fn).read_text(encoding='utf-8'))['cats']:
        for it in cat['items']:
            mine.append((cat['id'], it['id'], it['title']))

def norm(t):
    t = re.sub(r'\*\*|（[^）]*）|\([^)]*\)|\s', '', t)
    return t.lower()

def best_match(title):
    n = norm(title)
    best, score = None, 0
    for cat, iid, mt in mine:
        m = norm(mt)
        # 最长公共子串长度
        L = 0
        for a in range(len(n)):
            for b in range(a + 2, len(n) + 1):
                if n[a:b] in m:
                    L = max(L, b - a)
        if L > score:
            score, best = L, (cat, iid, mt)
    return best, score

FILES = {
    'shengli_paomian': ('生理', r'^(\d+)\.\s*(?:[一二三四五六七八九十]+次|W)?\s*([^\n：:]{2,40})'),
    'bingsheng_paomian': ('病生', r'^(\d+)\.\s*(?:[一二三四五六七八九十]+次)?\s*([^\n：:]{2,40})'),
    'bingli_paomian': ('病理', r'^(\d+)\.\s*(?:[一二三四五六七八九十]+次)?\s*([^\n：:]{2,40})'),
    'yaoli_paomian': ('药理', r'^(\d+)\.\s*(?:[一二三四五六七八九十]+次)?\s*([^\n：:]{2,40})'),
}

for key, (label, pat) in FILES.items():
    f = TXT / (key + '.txt')
    if not f.exists():
        continue
    txt = f.read_text(encoding='utf-8')
    items = []
    for line in txt.split('\n'):
        line = line.strip()
        m = re.match(pat, line)
        if m:
            items.append(m.group(2).strip())
    print('=' * 66)
    print('%s（%s）：共 %d 条编号项' % (label, key, len(items)))
    for t in items:
        if len(t) < 3:
            continue
        b, s = best_match(t)
        flag = 'OK ' if s >= 4 else ('?? ' if s >= 3 else 'MISS')
        print('  %s %-34s -> %s(%s) 匹配%d' % (flag, t[:34], b[1] if b else '-', b[2][:16] if b else '-', s))
