# -*- coding: utf-8 -*-
"""把课件精读补充块插入 mn/organ3.html，并同步目录与知识点计数。"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import blocks_a, blocks_b, blocks_c, blocks_d, blocks_e  # noqa

BLOCKS = blocks_a.BLOCKS + blocks_b.BLOCKS + blocks_c.BLOCKS + blocks_d.BLOCKS + blocks_e.BLOCKS
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
PATH = os.path.join(ROOT, 'mn', 'organ3.html')


def main():
    s = open(PATH, encoding='utf-8').read()
    added = []
    for b in BLOCKS:
        ch = b['ch']
        m = re.search(r'(<section class="chapter" id="chapter-%s">)(.*?)(</section>)' % ch, s, re.S)
        if not m:
            print('chapter not found', ch)
            continue
        body = m.group(2)
        if '<h3>%s</h3>' % b['title'] in body:
            print('exists', b['title'])
            continue
        idxs = [int(x) for x in re.findall(r'id="section-%s-(\d+)"' % ch, body)]
        nxt = (max(idxs) if idxs else 0) + 1
        chips = ''.join('<span class="chip ghost">%s</span>' % c for c in b['chips'])
        art = ('<article class="knowledge-block" id="section-%s-%02d"><h3>%s</h3>'
               '<div class="knowledge-content"><div class="chips" style="margin-bottom:10px">%s</div>%s</div></article>'
               % (ch, nxt, b['title'], chips, b['html']))
        new_body = body + art
        s = s[:m.start(2)] + new_body + s[m.end(2):]

        # 目录子项：插在该章 nav-chapter 之后（已有子项则追加到最后）
        nav_re = re.compile(r'(<a class="nav-chapter" href="#chapter-%s">[^<]*</a>)((?:\s*<a class="nav-section" href="#section-%s-\d+">[^<]*</a>)*)' % (ch, ch))
        nm = nav_re.search(s)
        if nm:
            s = s[:nm.end(0)] + '<a class="nav-section" href="#section-%s-%02d">%s</a>' % (ch, nxt, b['title']) + s[nm.end(0):]
        else:
            print('nav not found', ch)
        added.append((ch, nxt, b['title']))

    # 知识点计数
    total = len(re.findall(r'<article class="knowledge-block"', s))
    s = re.sub(r'(共 18 讲 · )\d+( 个知识点)', r'\g<1>%d\g<2>' % total, s)

    open(PATH, 'w', encoding='utf-8', newline='\n').write(s)
    print('added', len(added), 'total blocks', total)
    for a in added:
        print(' ', a)


if __name__ == '__main__':
    main()
