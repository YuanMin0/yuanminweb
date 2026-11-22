# -*- coding: utf-8 -*-
"""给全部 mn/*.html 顶部加「选择题刷题」入口（与环境卫生学同款），幂等。"""
import glob
import json
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
counts = json.load(open(os.path.join(os.path.dirname(__file__), 'choice_counts.json'), encoding='utf-8'))

CSS = '''<style>
  /* 顶部「选择题刷题」入口：与莫奈封面配色统一（干草金） */
  .hero-cta{display:inline-flex;align-items:center;gap:9px;margin-top:16px;padding:10px 22px;
    color:#FFF4DA;background:rgba(217,167,94,.16);border:1.5px solid rgba(255,225,170,.62);
    border-radius:999px;box-shadow:0 10px 26px -16px rgba(0,0,0,.55);
    font:700 15px var(--font-heading);text-decoration:none;letter-spacing:.02em;
    transition:background .3s ease,border-color .3s ease,transform .34s cubic-bezier(.16,1,.3,1);}
  .hero-cta:hover{background:rgba(217,167,94,.30);border-color:#FFE3AE;transform:translateY(-2px);}
  .hero-cta:focus-visible{outline:3px solid #FFE3AE;outline-offset:3px;}
  .hero-cta em{font:400 13px var(--font-kai);font-style:normal;color:rgba(255,244,218,.80);}
  @media (max-width:600px){.hero-cta{margin-top:12px;padding:9px 16px;font-size:14px;}.hero-cta em{font-size:12px;}}
  @media (prefers-reduced-motion:reduce){.hero-cta{transition:none;}}
</style>
'''

changed = []
for p in sorted(glob.glob(os.path.join(ROOT, 'mn', '*.html'))):
    sid = os.path.splitext(os.path.basename(p))[0]
    if sid == 'index':
        continue
    s = open(p, encoding='utf-8').read()
    if 'class="hero-cta"' in s:
        continue
    n = counts.get(sid)
    if not n:
        continue
    cta = ('<a class="hero-cta" href="../quiz.html?s=%s"><span class="hero-cta-ico" aria-hidden="true">✎</span>'
           '选择题刷题<em>%d 题 · 即时判分</em></a>' % (sid, n))
    m = re.search(r'(<div class="hero-meta">.*?</div>)', s, re.S)
    if not m:
        print('NO hero-meta', sid)
        continue
    s = s[:m.end(1)] + cta + s[m.end(1):]
    if '</head>' in s and '.hero-cta{' not in s:
        s = s.replace('</head>', CSS + '</head>', 1)
    open(p, 'w', encoding='utf-8', newline='\n').write(s)
    changed.append((sid, n))

print('changed', len(changed))
for sid, n in changed:
    print(' ', sid, n)
