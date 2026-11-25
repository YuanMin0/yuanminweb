# -*- coding: utf-8 -*-
"""器官3 课件高保真提取：
- 递归遍历 PPT 目录，按文件内容哈希去重（根目录与子目录多为同一份）
- 每个 slide 提取：文本框（含组合形状）、表格、演讲者备注、图片哈希/尺寸
- PDF 用 pymupdf 逐页提取文本与图片
- 图片按内容哈希落盘，已存在的复用 _ext/qg3/ppt_img
输出：_ext/organ3_full/lectures/*.json、_ext/organ3_full/all_slides.json
"""
import os, sys, json, hashlib, re
from pathlib import Path

from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE
import pymupdf

SRC = Path(r'G:\学习资料\器官3\PPT')
OUT = Path(r'C:\Users\38815\WorkBuddy AI\2026-10-16-02-21-50\_ext\organ3_full')
IMG = OUT / 'img'
OLD_IMG = Path(r'C:\Users\38815\WorkBuddy AI\2026-10-16-02-21-50\_ext\qg3\ppt_img')
LEC = OUT / 'lectures'
for p in (OUT, IMG, LEC):
    p.mkdir(parents=True, exist_ok=True)

SKIP_DIRS = {'ppt在线考试'}


def sha(b):
    return hashlib.md5(b).hexdigest()


def save_img(blob, ext):
    h = sha(blob)
    short = h[:10]
    name = short + ext
    for base in (IMG, OLD_IMG):
        f = base / name
        if f.exists():
            return name
    (IMG / name).write_bytes(blob)
    return name


def iter_shapes(shapes):
    for sh in shapes:
        if sh.shape_type == MSO_SHAPE_TYPE.GROUP:
            yield from iter_shapes(sh.shapes)
        else:
            yield sh


def shape_text(sh):
    out = []
    if getattr(sh, 'has_text_frame', False) and sh.has_text_frame:
        t = sh.text_frame.text.strip()
        if t:
            out.append(t)
    if getattr(sh, 'has_table', False) and sh.has_table:
        rows = []
        for r in sh.table.rows:
            cells = []
            for c in r.cells:
                cells.append(re.sub(r'\s+', ' ', c.text).strip())
            if any(cells):
                rows.append(' | '.join(cells))
        if rows:
            out.append('[表格]\n' + '\n'.join(rows))
    return out


def extract_pptx(path):
    prs = Presentation(str(path))
    slides = []
    for idx, s in enumerate(prs.slides, 1):
        texts, imgs = [], []
        for sh in iter_shapes(s.shapes):
            texts += shape_text(sh)
            if sh.shape_type == MSO_SHAPE_TYPE.PICTURE:
                try:
                    blob = sh.image.blob
                    ext = '.' + (sh.image.ext or 'png').lower()
                    name = save_img(blob, ext)
                    imgs.append({'file': name, 'w': sh.width, 'h': sh.height})
                except Exception:
                    pass
        note = ''
        try:
            if s.has_notes_slide:
                note = s.notes_slide.notes_text_frame.text.strip()
        except Exception:
            pass
        slides.append({'n': idx, 'text': '\n'.join(texts), 'note': note, 'images': imgs})
    return slides


def extract_pdf(path):
    doc = pymupdf.open(str(path))
    slides = []
    for i, page in enumerate(doc, 1):
        texts = [page.get_text().strip()]
        imgs = []
        for info in page.get_images(full=True):
            try:
                pix = pymupdf.Pixmap(doc, info[0])
                if pix.n > 4:
                    pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
                blob = pix.tobytes('png')
                if pix.width < 80 or pix.height < 60:
                    continue
                name = save_img(blob, '.png')
                imgs.append({'file': name, 'w': pix.width, 'h': pix.height})
            except Exception:
                pass
        slides.append({'n': i, 'text': '\n'.join(texts), 'note': '', 'images': imgs})
    return slides


def main():
    seen = {}
    files = []
    for p in sorted(SRC.rglob('*')):
        if p.is_dir() or p.name.startswith('~$'):
            continue
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        if p.suffix.lower() not in ('.pptx', '.pdf'):
            continue
        h = sha(p.read_bytes())
        if h in seen:
            continue
        seen[h] = p
        files.append(p)

    print('唯一课件文件', len(files))
    all_slides = []
    for i, p in enumerate(files, 1):
        rel = p.relative_to(SRC).as_posix()
        try:
            slides = extract_pptx(p) if p.suffix.lower() == '.pptx' else extract_pdf(p)
        except Exception as e:
            print('  FAIL', rel, e)
            continue
        rec = {'file': rel, 'name': p.stem, 'kind': p.suffix.lower().lstrip('.'), 'slides': slides}
        (LEC / (re.sub(r'[\\/:*?"<>|]', '_', p.stem) + '.json')).write_text(
            json.dumps(rec, ensure_ascii=False), encoding='utf-8')
        for s in slides:
            all_slides.append({'lecture': p.stem, 'file': rel, 'n': s['n'], 'text': s['text'],
                               'note': s['note'], 'images': s['images']})
        print('  %2d/%d %-52s slides=%d imgs=%d' % (
            i, len(files), rel[:52], len(slides), sum(len(s['images']) for s in slides)))

    (OUT / 'all_slides.json').write_text(json.dumps(all_slides, ensure_ascii=False), encoding='utf-8')
    print('总页数', len(all_slides), '图片引用', sum(len(s['images']) for s in all_slides))


if __name__ == '__main__':
    main()
