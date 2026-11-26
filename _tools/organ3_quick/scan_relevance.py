# -*- coding: utf-8 -*-
"""扫描 资料/ 与 PPT/ 下全部文档，统计与器官3（泌尿）相关的段落，找遗漏素材。"""
import re, json
from pathlib import Path

SRC = Path(r'G:\学习资料\器官3')
OUT = Path(__file__).parent

import pymupdf
from docx import Document

KW = ['肾', '尿', '滤过', '重吸收', '醛固酮', '抗利尿', '脱水', '水肿', '酸碱', '碱剩余',
      '休克', '应激', 'DIC', '利尿', '抗菌', '抗生素', '耐药', '化疗指数', '肌酐', 'GFR']

def pdf_text(p):
    d = pymupdf.open(str(p))
    t = ''.join(pg.get_text() for pg in d)
    d.close()
    return t

def docx_text(p):
    d = Document(str(p))
    parts = [x.text for x in d.paragraphs]
    for tb in d.tables:
        for r in tb.rows:
            for c in r.cells:
                parts.append(c.text)
    return '\n'.join(parts)

rows = []
for base in [SRC / '资料', SRC / 'PPT']:
    if not base.exists():
        continue
    for p in sorted(base.rglob('*')):
        if p.is_dir() or p.suffix.lower() not in ('.pdf', '.docx'):
            continue
        try:
            t = pdf_text(p) if p.suffix.lower() == '.pdf' else docx_text(p)
        except Exception as e:
            continue
        if len(t) < 200:
            continue
        # 按段落统计命中
        paras = [x.strip() for x in re.split(r'[\n\r]+', t) if len(x.strip()) > 8]
        hit = [x for x in paras if any(k in x for k in KW)]
        ratio = len(hit) / max(1, len(paras))
        rows.append({
            'file': str(p.relative_to(SRC)),
            'chars': len(t),
            'paras': len(paras),
            'hit': len(hit),
            'ratio': round(ratio, 3),
            'samples': hit[:4],
        })

rows.sort(key=lambda x: -x['hit'])
for r in rows:
    print('%-52s %6d字 命中%4d/%4d (%.0f%%)' % (r['file'][:52], r['chars'], r['hit'], r['paras'], r['ratio'] * 100))
    for s in r['samples'][:2]:
        print('      · ' + s[:88])
(OUT / 'coverage_scan.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf-8')
print('\n文件数', len(rows))
