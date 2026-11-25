# -*- coding: utf-8 -*-
"""习思想课件提取：逐页文本 + 图片哈希/尺寸，输出 JSON 与图片目录。"""
import os, re, json, hashlib
from pathlib import Path
import pymupdf

SRC = Path(r'G:\学习资料\大三上\习思想\PPT')
OUT = Path(r'C:\Users\38815\WorkBuddy AI\2026-10-16-02-21-50\_ext\xssx_full')
IMG = OUT / 'img'
OUT.mkdir(parents=True, exist_ok=True)
IMG.mkdir(parents=True, exist_ok=True)


def sha(b):
    return hashlib.md5(b).hexdigest()[:12]


def save_img(blob, ext):
    name = sha(blob) + ext
    f = IMG / name
    if not f.exists():
        f.write_bytes(blob)
    return name


def main():
    pdfs = sorted(SRC.glob('*.pdf'))
    all_pages = []
    meta = []
    for pdf in pdfs:
        doc = pymupdf.open(str(pdf))
        pages = []
        for i, page in enumerate(doc, 1):
            text = page.get_text().strip()
            imgs = []
            for info in page.get_images(full=True):
                try:
                    pix = pymupdf.Pixmap(doc, info[0])
                    if pix.n > 4:
                        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
                    if pix.width < 120 or pix.height < 80:
                        continue
                    blob = pix.tobytes('png')
                    name = save_img(blob, '.png')
                    imgs.append({'file': name, 'w': pix.width, 'h': pix.height})
                except Exception:
                    pass
            pages.append({'n': i, 'text': text, 'images': imgs})
            all_pages.append({'deck': pdf.stem, 'n': i, 'text': text, 'images': imgs})
        chars = sum(len(p['text']) for p in pages)
        blank = sum(1 for p in pages if len(p['text']) < 50)
        meta.append({'file': pdf.name, 'pages': len(pages), 'chars': chars, 'blank': blank})
        print('%-14s 页=%3d 字=%6d 少字页=%2d' % (pdf.stem[:12], len(pages), chars, blank))

    (OUT / 'pages.json').write_text(json.dumps(all_pages, ensure_ascii=False), encoding='utf-8')
    (OUT / 'meta.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding='utf-8')
    print('总页数', len(all_pages), '唯一图片', len(list(IMG.glob('*'))))


if __name__ == '__main__':
    main()
