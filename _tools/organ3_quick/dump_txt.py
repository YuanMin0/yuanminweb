# -*- coding: utf-8 -*-
"""提取器官3「往年题 / 精简版」PDF 全文，供大题整理使用。"""
import pymupdf
from pathlib import Path

SRC = Path(r'G:\学习资料\器官3')
OUT = Path(r'C:\Users\38815\WorkBuddy AI\2026-10-16-02-21-50\medilearn\_tools\organ3_quick\txt')
OUT.mkdir(parents=True, exist_ok=True)

FILES = {
    'shengli_paomian': SRC / '生理泌尿泡面往年.pdf',
    'bingsheng_paomian': SRC / '病生泡面往年：休克，水盐平衡酸碱平衡，肾功能不全.pdf',
    'bingli_paomian': SRC / '泌尿病理-泡面.pdf',
    'yaoli_paomian': SRC / '药理泡面：抗菌药物（抗病毒结核真菌的没有）.pdf',
    'shengli_xitiji': SRC / '泌尿生理 14生理学学习指导与习题集-第3版.pdf',
    'yaoli_sfy': SRC / 'sfy 药理知识点：利尿药，抗菌药物，抗真菌药物（没看见抗病毒的）.pdf',
    'shengli_zhishidian': SRC / '生理知识点：泌尿生理知识点.pdf',
    'bingsheng_zhishidian': SRC / '病生知识点戴春风：水盐酸碱平衡紊乱，肾功能不全，应激和休克.pdf',
    'bingsheng_jingjian': SRC / '资料' / '4cacf96cdab7780a8e2aa271cf568614_212209773568771399_m(1).pdf',
    'bingsheng_zonglun': SRC / '资料' / '4cacf96cdab7780a8e2aa271cf568614_1649545565751855860_m(1).pdf',
    'kaodian_qingdan': SRC / '资料' / '4cacf96cdab7780a8e2aa271cf5688972_m(1).pdf',
}

for key, p in FILES.items():
    if not p.exists():
        print('MISS', key, p.name)
        continue
    d = pymupdf.open(str(p))
    parts = []
    for i, pg in enumerate(d, 1):
        parts.append('\n=== P%d ===\n' % i + pg.get_text())
    txt = ''.join(parts)
    (OUT / (key + '.txt')).write_text(txt, encoding='utf-8')
    print('%-22s pages %-3d chars %d' % (key, len(d), len(txt)))
    d.close()
