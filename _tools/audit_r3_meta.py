# -*- coding: utf-8 -*-
"""深度轮 3：页面元信息与可访问性静态检查"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = {'_bak', '.git', 'files'}

def rel(p): return os.path.relpath(p, ROOT).replace('\\', '/')

rows = []
for dp, dn, fn in os.walk(ROOT):
    r = rel(dp)
    if r == '.':
        r = ''
    if any(r == s or r.startswith(s + '/') for s in SKIP):
        dn[:] = []
        continue
    for f in fn:
        if not f.endswith('.html'):
            continue
        p = os.path.join(dp, f)
        s = open(p, encoding='utf-8', errors='replace').read()
        head = s[:s.find('</head>')] if '</head>' in s else s[:3000]
        rows.append({
            'f': rel(p),
            'title': bool(re.search(r'<title>\s*\S', head)),
            'desc': bool(re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'][^"\']{10,}', head)),
            'lang': bool(re.search(r'<html[^>]+lang=', s[:400])),
            'vp': bool(re.search(r'<meta[^>]+name=["\']viewport["\']', head)),
            'h1': len(re.findall(r'<h1[\s>]', s)),
        })

miss_t = [x['f'] for x in rows if not x['title']]
miss_d = [x['f'] for x in rows if not x['desc']]
miss_l = [x['f'] for x in rows if not x['lang']]
miss_v = [x['f'] for x in rows if not x['vp']]
no_h1 = [x['f'] for x in rows if x['h1'] == 0]
multi_h1 = [(x['f'], x['h1']) for x in rows if x['h1'] > 1]

print('页面总数', len(rows))
print('缺 title      :', len(miss_t), miss_t[:10])
print('缺 description:', len(miss_d), miss_d[:14])
print('缺 lang       :', len(miss_l), miss_l[:10])
print('缺 viewport   :', len(miss_v), miss_v[:10])
print('无 h1         :', len(no_h1), no_h1[:10])
print('多个 h1       :', len(multi_h1), multi_h1[:8])
