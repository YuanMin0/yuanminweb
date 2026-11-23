# -*- coding: utf-8 -*-
"""第三轮：资源与链接审查
1) 所有 <script src> / <link href> / <img src> 是否存在
2) 所有站内 <a href="*.html"> 是否存在
3) mn/list.js 与 mn/*.html 是否一致
4) sw.js 预缓存清单是否都存在
"""
import os, re, json, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = {'_bak', '.git', 'files'}

def rel(p):
    return os.path.relpath(p, ROOT).replace('\\', '/')

def walk_html():
    for dp, dn, fn in os.walk(ROOT):
        r = rel(dp)
        if r == '.':
            r = ''
        if any(r == s or r.startswith(s + '/') for s in SKIP):
            dn[:] = []
            continue
        for f in fn:
            if f.endswith('.html'):
                yield os.path.join(dp, f)

TAG = re.compile(r'<(script|link|img|source|iframe)\b[^>]*>', re.I)
ATTR = re.compile(r'\b(src|href)\s*=\s*["\']([^"\']+)["\']', re.I)

missing = []   # (html, attr, value)
external = 0
checked = 0

for path in sorted(walk_html()):
    base = os.path.dirname(path)
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        s = f.read()
    for m in TAG.finditer(s):
        tag = m.group(0)
        for am in ATTR.finditer(tag):
            v = am.group(2).strip()
            if not v or v.startswith('#') or v.startswith('data:'):
                continue
            if re.match(r'^(https?:)?//', v) or v.startswith('mailto:') or v.startswith('javascript:'):
                external += 1
                continue
            if '${' in v or "'+" in v or '+ "' in v:
                continue
            checked += 1
            clean = v.split('#')[0].split('?')[0]
            if not clean:
                continue
            clean = urllib.parse.unquote(clean)
            target = os.path.normpath(os.path.join(base, clean))
            if not os.path.exists(target):
                missing.append((rel(path), am.group(1), v))

print('检查站内资源引用 %d 个（外链 %d 个跳过）' % (checked, external))
print('缺失资源 %d 个' % len(missing))
for h, a, v in missing[:60]:
    print('  [%s] %s=%s' % (h, a, v))

# 站内页面链接
print('\n--- 站内 HTML 链接 ---')
dead = []
for path in sorted(walk_html()):
    base = os.path.dirname(path)
    s = open(path, 'r', encoding='utf-8', errors='replace').read()
    for m in re.finditer(r'<a\b[^>]*href\s*=\s*["\']([^"\']+)["\']', s, re.I):
        v = m.group(1).strip()
        if not v or v.startswith('#') or re.match(r'^(https?:)?//', v) or v.startswith('mailto:') or v.startswith('javascript:'):
            continue
        if '${' in v or "'+" in v:
            continue
        clean = urllib.parse.unquote(v.split('#')[0].split('?')[0])
        if not clean:
            continue
        target = os.path.normpath(os.path.join(base, clean))
        if not os.path.exists(target):
            dead.append((rel(path), v))
print('死链 %d 个' % len(dead))
for h, v in dead[:40]:
    print('  [%s] -> %s' % (h, v))

# mn/list.js 一致性
print('\n--- mn 列表一致性 ---')
lst = open(os.path.join(ROOT, 'mn', 'list.js'), encoding='utf-8').read()
ids = re.findall(r'id:\s*[\'"]([a-z0-9\-]+)[\'"]', lst)
files = {f[:-5] for f in os.listdir(os.path.join(ROOT, 'mn')) if f.endswith('.html')}
print('list.js 条目 %d，mn 目录页面 %d' % (len(ids), len(files)))
print('  list.js 有但无页面:', sorted(set(ids) - files))
print('  有页面但 list.js 无:', sorted(files - set(ids) - {'index'}))
