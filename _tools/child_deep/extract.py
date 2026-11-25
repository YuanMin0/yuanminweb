# -*- coding: utf-8 -*-
"""提取儿童少年卫生学 6 份课件全文（按页），统计图片型页。"""
import pymupdf, os, json
from pathlib import Path

SRC = Path(r'G:\学习资料\大三上\儿童少年卫生学\PPT')
OUT = Path(r'C:\Users\38815\WorkBuddy AI\2026-10-16-02-21-50\medilearn\_tools\child_deep')
OUT.mkdir(exist_ok=True)

FILES = {
    'ch04_qingchunqi': '7',
    'ch06_yinsu': '29ce785b6d2649964554a8b62f6b7ace.pdf',
    'ch07_jiankang': '儿童少年健康状况20261027.pdf',
    'ch08_xinli': '2026-11-02',
    'ch09_weixian': '2026-11-04',
    'ch10_jiaoxue': '2026课件教学卫生-周露霖.pdf',
}

summary = {}
for key, fn in FILES.items():
    p = SRC / fn
    d = pymupdf.open(str(p))
    pages = []
    img_only = []
    for i, pg in enumerate(d):
        t = pg.get_text().strip()
        imgs = len(pg.get_images(full=True))
        pages.append({'no': i + 1, 'text': t, 'imgs': imgs})
        if len(t) < 50 and imgs:
            img_only.append(i + 1)
    (OUT / (key + '.json')).write_text(json.dumps(pages, ensure_ascii=False, indent=1), encoding='utf-8')
    total = sum(len(x['text']) for x in pages)
    summary[key] = {'file': fn, 'pages': len(pages), 'chars': total, 'img_only': img_only}
    d.close()

print(json.dumps(summary, ensure_ascii=False, indent=1))
