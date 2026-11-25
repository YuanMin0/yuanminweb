# -*- coding: utf-8 -*-
"""渲染指定页为 PNG（用于视觉读取）。"""
import pymupdf, sys
from pathlib import Path

SRC = Path(r'G:\学习资料\大三上\儿童少年卫生学\PPT')
OUT = Path(r'C:\Users\38815\WorkBuddy AI\2026-10-16-02-21-50\medilearn\_tools\child_deep\png')
OUT.mkdir(exist_ok=True)

FILES = {
    'ch04': '7',
    'ch06': '29ce785b6d2649964554a8b62f6b7ace.pdf',
    'ch07': '儿童少年健康状况20261027.pdf',
    'ch08': '2026-11-02',
    'ch09': '2026-11-04',
    'ch10': '2026课件教学卫生-周露霖.pdf',
}

# 参数: key:1,18,26
for arg in sys.argv[1:]:
    key, pages = arg.split(':')
    pgs = [int(x) for x in pages.split(',')]
    d = pymupdf.open(str(SRC / FILES[key]))
    for n in pgs:
        pg = d[n - 1]
        pix = pg.get_pixmap(dpi=110)
        f = OUT / ('%s_p%02d.png' % (key, n))
        pix.save(str(f))
        print(f)
    d.close()
