# -*- coding: utf-8 -*-
"""为站点每个科目生成「考前速记」页（莫奈版，仅知识点）。"""
import json
import re
from pathlib import Path

SITE = Path(r'C:\Users\38815\WorkBuddy AI\2026-10-16-02-21-50\medilearn')
DATA = SITE / 'data'
OUT = SITE / 'mn'
OUT.mkdir(exist_ok=True)

SEM_MAP = {'dayi1':'大一上','dayi2':'大一下','daer1':'大二上','daer2':'大二下',
           'dasan1':'大三上','dasan2':'大三下','other':'其他','':'—'}

TPL = Path(r'G:\学习资料\大三上\习思想\习思想PPT-莫奈版.html')
tpl = TPL.read_text(encoding='utf-8')
CSS = tpl[tpl.find('<style>') + 7: tpl.find('</style>')]
EXTRA_CSS = '''
    /* 目录可读性：仿宋小字在屏幕上发虚，改黑体、略放大、加半档字重 */
    .sidebar .nav-chapter, .sidebar .nav-section, .sidebar-title, .side-search{
      font-family:"Microsoft YaHei","PingFang SC","Hiragino Sans GB",system-ui,-apple-system,sans-serif;
    }
    .sidebar .nav-section{font-size:15px;font-weight:500;letter-spacing:.015em;line-height:1.62}
    .sidebar .nav-section.active{font-weight:700}

    /* 全宽度防横向溢出：长代码/公式在容器内滚动，不撑破页面 */
    pre { max-width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
    pre code { overflow-wrap:normal; word-break:normal; }
    /* 知识块内的小标题（type=h） */
    .kc-h { margin:22px 0 10px; color:var(--navy); font-family:var(--font-heading); line-height:1.45; }
    h4.kc-h { font-size:1.05em; }
    h5.kc-h { font-size:1em; }
    @media print { .kc-h { break-after:avoid; page-break-after:avoid; } }
'''
CSS = CSS + EXTRA_CSS


def md(t):
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'`(.+?)`', r'<code>\1</code>', t)
    return t


def render_content(items):
    out = []
    for it in items or []:
        ty = it.get('type')
        if ty == 'p':
            out.append('<p>%s</p>' % md(it.get('text', '')))
        elif ty == 'h':
            lv = min(5, max(3, int(it.get('level') or 3)))
            out.append('<h%d class="kc-h">%s</h%d>' % (lv, md(it.get('text', '')), lv))
        elif ty == 'table':
            head = ''.join('<th>%s</th>' % md(str(h)) for h in it.get('head', []))
            rows = ''.join('<tr>' + ''.join('<td>%s</td>' % md(str(c)) for c in r) + '</tr>'
                           for r in it.get('rows', []))
            out.append('<div class="table-wrap"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (head, rows))
        elif ty in ('ol', 'ul', 'list'):
            tag = 'ol' if ty == 'ol' else 'ul'
            out.append('<%s>%s</%s>' % (tag, ''.join('<li>%s</li>' % md(str(x)) for x in it.get('items', [])), tag))
        elif ty in ('tip', 'quote', 'note'):
            out.append('<blockquote>%s</blockquote>' % md(it.get('text', '')))
        elif ty == 'code':
            out.append('<pre><code>%s</code></pre>' % it.get('text', ''))
        elif it.get('text'):
            out.append('<p>%s</p>' % md(it['text']))
    return ''.join(out)


def build(sub):
    chapters = sub.get('chapters') or []
    nav, body = [], []
    # 讨论课：没有讲义，但在目录里占位说明（数据里用 discussionChapters 声明）
    disc = {}
    for d in (sub.get('discussionChapters') or []):
        disc.setdefault(int(d.get('after') or 0), []).append(d.get('title') or '讨论课')
    for i, ch in enumerate(chapters, 1):
        no = '%02d' % i
        ks = ch.get('knowledge') or []
        nav.append('<div class="nav-group"><a class="nav-chapter" href="#chapter-%s">%s</a></div>' % (no, ch.get('title', '')))
        for dt in disc.get(i, []):
            nav.append('<div class="nav-group"><span class="nav-chapter nav-muted">%s</span></div>' % dt)
        arts = []
        for j, k in enumerate(ks, 1):
            tags = ''.join('<span class="chip ghost">%s</span>' % t for t in (k.get('tags') or [])[:3])
            arts.append(
                '<article class="knowledge-block"><h3>%s</h3><div class="knowledge-content">'
                '<div class="chips" style="margin-bottom:10px">%s</div>%s</div></article>'
                % (k.get('title', ''), tags, render_content(k.get('content'))))
        body.append('<section class="chapter" id="chapter-%s"><header class="chapter-header">'
                    '<span class="chapter-number">%s</span><div><p>%s</p><h2>%s</h2></div></header>%s</section>'
                    % (no, no, sub.get('name', ''), ch.get('title', ''), ''.join(arts)))

    n_k = sum(len(c.get('knowledge') or []) for c in chapters)
    return '''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%s | 考前速记</title><script src="../js/auth.js"></script><script>if(window.WB&&WB.auth)WB.auth.guard();</script><style>%s</style></head>
<body>
<header class="hero"><div class="hero-inner">
<h1>%s · 考前速记</h1>
<p>%s</p>
<div class="hero-meta"><span>%s</span><span>共 %d 讲 · %d 个知识点</span></div>
</div></header>
<div class="layout">
<aside class="sidebar"><h2 class="sidebar-title">章节目录</h2>%s%s</aside>
<main>%s
<footer class="footer"><p><a href="../subject.html?s=%s">← 返回科目页</a> · <a href="../quiz.html?s=%s">去刷题</a></p></footer>
</main></div>
</body></html>''' % (sub.get('name', ''), CSS, sub.get('name', ''), md(sub.get('desc', '') or ''),
                     SEM_MAP.get(sub.get('sem',''), sub.get('sem','')), len(chapters), n_k,
                     ('<p class="nav-note">%s</p>' % sub.get('discussionNote')) if sub.get('discussionNote') else '',
                     ''.join(nav), ''.join(body),
                     sub.get('id'), sub.get('id'))


def parse(p):
    s = p.read_text(encoding='utf-8')
    m = re.search(r'WB\.register\(\s*(\{.*\})\s*\)\s*;?\s*$', s, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except Exception:
        return None


if __name__ == '__main__':
    import sys
    ONLY = set(sys.argv[1:])   # 指定科目 id 时只重建这些页，避免覆盖手工精编页与已注入题库

    ok, skip = [], []
    for p in sorted(DATA.glob('*.js')):
        if p.name.startswith(('exam-', '_', 'quiz-', 'cdn', 'desktop', 'changelog')):
            continue
        sub = parse(p)
        if not sub or not sub.get('chapters'):
            skip.append(p.name)
            continue
        if ONLY and sub['id'] not in ONLY:
            continue
        (OUT / (sub['id'] + '.html')).write_text(build(sub), encoding='utf-8')
        ok.append(sub['id'])

    print('生成 %d 个：%s' % (len(ok), ', '.join(ok[:12]) + (' …' if len(ok) > 12 else '')))
    print('跳过 %d 个：%s' % (len(skip), ', '.join(skip[:8])))
