# -*- coding: utf-8 -*-
"""识别 G:/学习资料/器官3 下所有资料：类型、页数/段落、首段文本，输出清单。"""
import os, json, zipfile, re
from pathlib import Path

SRC = Path(r'G:\学习资料\器官3')
OUT = Path(r'C:\Users\38815\WorkBuddy AI\2026-10-16-02-21-50\medilearn\_tools\organ3_quick')
OUT.mkdir(exist_ok=True)

import pymupdf
from docx import Document
from pptx import Presentation


def read_pdf(p, limit=600):
    d = pymupdf.open(str(p))
    n = len(d)
    t = ''
    for i in range(min(n, 3)):
        t += d[i].get_text()
        if len(t) > limit:
            break
    d.close()
    return n, t.strip()[:limit].replace('\n', ' / ')


def read_docx(p, limit=600):
    d = Document(str(p))
    paras = [x.text.strip() for x in d.paragraphs if x.text.strip()]
    n = len(paras)
    t = ' / '.join(paras[:12])
    # 表格里也常有内容
    if not t and d.tables:
        t = ' | '.join(c.text.strip() for r in d.tables[0].rows for c in r.cells)[:limit]
    return n, t[:limit]


def read_pptx(p, limit=600):
    pr = Presentation(str(p))
    n = len(pr.slides)
    t = ''
    for s in pr.slides[:2]:
        for sh in s.shapes:
            if sh.has_text_frame:
                t += sh.text_frame.text + ' '
        if len(t) > limit:
            break
    return n, t.strip()[:limit].replace('\n', ' / ')


def read_ppt_ole(p, limit=600):
    """旧版 .ppt：从 OLE 流里粗提 UTF-16 文本。"""
    data = p.read_bytes()
    # 找 UTF-16LE 中文串
    txt = data.decode('utf-16-le', errors='ignore')
    chunks = re.findall(r'[\u4e00-\u9fa5，。；：、（）0-9A-Za-z%]{6,}', txt)
    return len(chunks), ' / '.join(chunks[:20])[:limit]


rows = []
for p in sorted(SRC.rglob('*')):
    if p.is_dir():
        continue
    ext = p.suffix.lower()
    if ext not in ('.pdf', '.docx', '.doc', '.ppt', '.pptx'):
        continue
    try:
        if ext == '.pdf':
            n, t = read_pdf(p)
        elif ext == '.docx':
            n, t = read_docx(p)
        elif ext == '.pptx':
            n, t = read_pptx(p)
        else:
            n, t = read_ppt_ole(p)
    except Exception as e:
        n, t = -1, 'ERR ' + str(e)[:80]
    rows.append({'path': str(p.relative_to(SRC)), 'ext': ext, 'size': p.stat().st_size, 'n': n, 'head': t})

(OUT / 'inventory.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf-8')
for r in rows:
    print('%-58s %-5s %7dKB p/§%-4s %s' % (r['path'][:58], r['ext'], r['size'] // 1024, r['n'], r['head'][:110]))
print('total', len(rows))
