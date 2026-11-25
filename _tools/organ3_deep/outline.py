# -*- coding: utf-8 -*-
"""打印指定课件的页面标题/小节提纲，便于逐讲核对。"""
import json, re, sys
from pathlib import Path
from collections import defaultdict

slides = json.loads(Path(r'C:\Users\38815\WorkBuddy AI\2026-10-16-02-21-50\_ext\organ3_full\all_slides.json').read_text(encoding='utf-8'))
by = defaultdict(list)
for s in slides:
    by[s['lecture']].append(s)

HEAD = re.compile(r'^(?:[一二三四五六七八九十]+[、.]|\d+[、.]|（[一二三四五六七八九十]+）|\([0-9]+\)|第[一二三四五六七八九十]+[节讲章]|[①②③④⑤⑥⑦⑧⑨⑩])')

def outline(name, maxlen=34):
    arr = sorted(by[name], key=lambda x: x['n'])
    out = []
    for s in arr:
        lines = [re.sub(r'\s+', ' ', x).strip() for x in s['text'].split('\n')]
        lines = [x for x in lines if x]
        if not lines:
            continue
        cand = []
        first = lines[0]
        if 2 <= len(first) <= maxlen and not re.match(r'^[\s，。；：、]', first):
            cand.append(first)
        for l in lines[1:]:
            if HEAD.match(l) and len(l) <= maxlen:
                cand.append(l)
        for c in cand[:3]:
            out.append((s['n'], c))
    # 去重（保留首次出现的页码）
    seen = set()
    uniq = []
    for n, c in out:
        k = re.sub(r'\s+', '', c)
        if k in seen:
            continue
        seen.add(k)
        uniq.append((n, c))
    return uniq

if __name__ == '__main__':
    names = sys.argv[1:]
    for name in names:
        if name not in by:
            print('未找到', name)
            continue
        arr = by[name]
        print('\n######## %s  页数=%d' % (name, len(arr)))
        for n, c in outline(name):
            print('  P%-4d %s' % (n, c))
