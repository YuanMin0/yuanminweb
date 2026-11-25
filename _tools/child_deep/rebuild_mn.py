# -*- coding: utf-8 -*-
"""一键重建 mn/ertong.html：生成 → 刷题入口 → 题库骨架 → 同步题库 → PDF按钮/回顶。"""
import subprocess, sys
from pathlib import Path

ROOT = Path(r'C:\Users\38815\WorkBuddy AI\2026-10-16-02-21-50\medilearn')
PY = sys.executable

def run(*args):
    r = subprocess.run([PY] + list(args), cwd=str(ROOT), capture_output=True, text=True, encoding='utf-8')
    print('>', ' '.join(Path(a).name for a in args), '|', (r.stdout or '').strip()[-200:])
    if r.returncode != 0:
        print(r.stderr[-800:])
        raise SystemExit(1)

run('_tools/mn_build.py', 'ertong')
run('_tools/qbank_mn/add_cta.py')

p = ROOT / 'mn' / 'ertong.html'
s = p.read_text(encoding='utf-8')
s = s.replace('href="../quiz.html?s=ertong"', 'href="../drill.html?s=ertong"')
s = s.replace('>选择题刷题<em>218 题 · 即时判分</em>', '>刷题<em>218 题 · 即时判分</em>')

if '<section class="question-bank"' not in s:
    top = '<div class="nav-question-bank"><a class="nav-chapter" href="#question-bank">题库 · 284 题 →</a></div>'
    bot = ('<div class="nav-question-bank" style="margin-top:22px;padding-top:14px;border-top:1px solid var(--gray-200)">'
           '<a class="nav-chapter" href="#question-bank">题库 · 284 题 →</a></div>')
    s = s.replace('<aside class="sidebar">', '<aside class="sidebar">' + top, 1)
    s = s.replace('</aside>', bot + '</aside>', 1)
    sec = ('<section class="question-bank" id="question-bank" data-question-list="bank">'
           '<h2>题库 · 拓展练习</h2><p>共 0 题。</p></section>\n')
    s = s.replace('<footer class="footer">', sec + '<footer class="footer">', 1)
p.write_text(s, encoding='utf-8', newline='\n')

run('_tools/qbank_mn/sync_mn_bank.py', 'ertong')
run('_tools/add_pdf_button.py')
print('done')
