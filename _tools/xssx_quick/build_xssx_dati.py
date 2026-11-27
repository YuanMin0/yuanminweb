# -*- coding: utf-8 -*-
"""生成 xssx-dati.html：习近平新时代中国特色社会主义思想概论 · 考前大题速背。
以 organ3-dati.html 为模板复用样式与脚本，只替换标题、侧栏与正文。"""
import json, re, html
from pathlib import Path

D = Path(__file__).parent
SITE = D.parent.parent
TPL = SITE / 'organ3-dati.html'
OUT = SITE / 'xssx-dati.html'

PRINT_CSS = '<style id="print-css">\n@media print{\n  @page{ size:A4; margin:14mm 12mm 16mm; }\n  html,body{ background:#fff !important; color:#111 !important; }\n  .topbar,.sidebar,.side-handle,.pbar,.to-top,.hero-ctas,.side-search,.nav-legend,\n  #searchHint,.ex-btn,.side-toggle{ display:none !important; }\n  .hero{ padding:0 0 9mm !important; background:none !important; border:0 !important; box-shadow:none !important; }\n  .hero-inner{ max-width:none !important; padding:0 !important; }\n  .hero h1{ font-size:25pt !important; color:#111 !important; margin:0 0 4mm !important; letter-spacing:.02em; }\n  .hero .eyebrow{ color:#777 !important; font-size:8.5pt !important; letter-spacing:.18em; }\n  .hero .lede{ color:#333 !important; font-size:10pt !important; line-height:1.75 !important; max-width:150mm; }\n  .hero-meta{ color:#444 !important; font-size:9pt !important; margin-top:4mm !important; }\n  .hero-meta b{ color:#111 !important; }\n  .layout{ display:block !important; grid-template-columns:none !important; gap:0 !important; }\n  main{ margin:0 !important; padding:0 !important; border:0 !important; background:#fff !important; box-shadow:none !important; }\n  .cat{ break-before:page; page-break-before:always; margin:0 0 6mm !important; }\n  .cat:first-of-type{ break-before:auto; page-break-before:auto; }\n  .cat-head{ margin:0 0 4mm !important; padding:0 0 2.5mm !important; border-bottom:1.6pt solid #222; }\n  .cat-head h2{ font-size:15pt !important; color:#111 !important; }\n  .cat-en{ color:#888 !important; font-size:8pt !important; letter-spacing:.16em; }\n  .cat-desc{ color:#333 !important; font-size:9pt !important; line-height:1.7 !important; }\n  .qcard{ border:.6pt solid #c9c9c9 !important; border-radius:2mm !important; box-shadow:none !important;\n          background:#fff !important; padding:3.6mm 4mm !important; margin:0 0 3.6mm !important;\n          break-inside:avoid; page-break-inside:avoid; }\n  .qcard::after{ display:none !important; }\n  .qhead{ margin-bottom:2mm !important; }\n  .qhead h3{ font-size:11pt !important; color:#111 !important; line-height:1.45 !important; }\n  .qid{ background:#f0f0f0 !important; color:#333 !important; border:0 !important; font-size:8pt !important; }\n  .qtype{ border:.6pt solid #999 !important; color:#333 !important; font-size:7.5pt !important; }\n  .ans{ margin:0 !important; padding-left:4.5mm !important; }\n  .ans li{ font-size:9.6pt !important; line-height:1.62 !important; color:#1a1a1a !important; margin:0 0 1.4mm !important; }\n  .ans b{ color:#000 !important; }\n  .qfoot{ margin-top:1.6mm !important; padding-top:0 !important; border:0 !important; }\n  .qfoot .src{ color:#777 !important; font-size:8pt !important; }\n  a{ color:#111 !important; text-decoration:none !important; }\n}\n</style>\n'
PRINT_JS = "<script>\n(function(){\n  var b=document.getElementById('exportPdf');\n  if(!b) return;\n  b.addEventListener('click', function(){\n    document.body.classList.add('exporting');\n    /* 等一帧让打印样式生效，再唤起打印对话框 */\n    requestAnimationFrame(function(){ setTimeout(function(){ window.print(); }, 80); });\n  });\n})();\n</script>\n"

cats = []
for f in ['xssx_1.json', 'xssx_2.json', 'xssx_3.json', 'xssx_4.json']:
    cats.extend(json.loads((D / f).read_text(encoding='utf-8'))['cats'])

CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
EN = {'daolun': 'INTRODUCTION'}
for i in range(1, 13):
    EN['c%d' % i] = 'CHAPTER %d' % i
ICON = {'daolun': '0'}
for i in range(1, 13):
    ICON['c%d' % i] = str(i)


def md(t):
    t = html.escape(str(t), quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    return t


def plain(t):
    return re.sub(r'<[^>]+>', '', md(t)).replace('"', '“')


def card(it, cat_id):
    ans = ''.join('<li>%s</li>' % md(x) for x in it['answer'])
    return '''  <article class="qcard" id="%(id)s" data-cat="%(cat)s" data-type="%(type)s" data-text="%(text)s">
  <header class="qhead">
    <span class="qid">%(idup)s</span>
    <h3>%(title)s</h3>
    <span class="qtype">%(type)s</span>
  </header>
  <ul class="ans">%(ans)s</ul>
  <div class="qfoot"><span class="src">%(src)s</span></div>
</article>''' % {
        'id': it['id'], 'cat': cat_id, 'type': it['type'],
        'text': html.escape(plain(it['title'] + ' ' + ' '.join(it['answer']))[:600], quote=True),
        'idup': it['id'].upper(), 'title': md(it['title']),
        'ans': ans, 'src': md(it['source']),
    }


sections = []
nav = []
for idx, cat in enumerate(cats):
    items = cat['items']
    nav.append('<a class="nav-cat" href="#cat-%s" data-cat="%s" title="%s">'
               '<i class="nc-ico" aria-hidden="true">%s</i><span>%s</span><em>%d</em></a>'
               % (cat['id'], cat['id'], html.escape(cat['name'], quote=True),
                  ICON.get(cat['id'], '•'), cat['short'], len(items)))
    cards = '\n'.join(card(it, cat['id']) for it in items)
    sections.append('''<section class="cat" id="cat-%(id)s">
  <header class="cat-head">
    <div><p class="cat-en">%(en)s</p><h2>%(name)s</h2></div>
    <p class="cat-desc">%(desc)s</p>
  </header>
%(cards)s
</section>''' % {'id': cat['id'], 'en': EN.get(cat['id'], 'CHAPTER'), 'name': md(cat['name']),
                 'desc': md(cat['desc']), 'cards': cards})

n_term = sum(1 for c in cats for it in c['items'] if it['type'] == '名解')
n_short = sum(1 for c in cats for it in c['items'] if it['type'] == '简答')
n_essay = sum(1 for c in cats for it in c['items'] if it['type'] == '论述')
n_all = sum(len(c['items']) for c in cats)

hero = '''<header class="hero"><div class="hero-inner">
  <p class="eyebrow">XI JINPING THOUGHT · 2026 秋</p>
  <h1>考前大题速背</h1>
  <p class="lede">按 <b>导论 + 十二章</b> 编排，覆盖《复习要点（2026 秋）总》的考点清单。每条给出可直接背诵的分点答案，并标注对应的 <b>PPT 章节</b>，按章背诵、按条核对。</p>
  <div class="hero-meta">
    <span><b>%(n)d</b> 条</span><span>简答 <b>%(s)d</b></span><span>论述 <b>%(e)d</b></span><span>覆盖 <b>13</b> 章</span>
  </div>
  <div class="hero-ctas">
    <a class="hero-cta" href="mn/xssx.html">📖 考前速记<em>知识点版</em></a>
    <button class="hero-cta" id="exportPdf" type="button" title="按 A4 打印排版导出为 PDF（在打印对话框里选「另存为 PDF」）">⇩ 导出 PDF<em>A4 · 打印排版</em></button>
    <a class="hero-cta ghost" href="drill.html?s=xssx">✎ 刷题<em>212 题</em></a>
  </div>
</div></header>''' % {'n': n_all, 's': n_short, 'e': n_essay}

intro = '''  <section class="exam-brief" id="intro">
    <div class="eb-head"><span class="eb-icon" aria-hidden="true">📋</span><h2>怎么用这一页</h2>
      <span class="eb-src">依据：复习要点（2026 秋）总 + 课堂 PPT</span></div>
    <div class="eb-grid">
      <div class="eb-cell"><b>覆盖范围</b><p>导论 6 条、第一章 4 条、第二章 2 条、第三章 7 条、第四章 4 条、第五章 7 条、第六章 5 条、第七章 5 条、第八章 2 条、第九章 4 条、第十章 29 条、第十一章 3 条、第十二章 3 条。</p></div>
      <div class="eb-cell"><b>答案怎么用</b><p>每条按「总—分」给分点，加粗处是采分关键词；简答题写 3～5 点，论述题在此基础上展开并举例。</p></div>
      <div class="eb-cell"><b>来源标注</b><p>每条末尾标注「第 X 章 PPT（必要时到节）」，与课堂课件对应；复习要点只列考点，答案以课件表述为准。</p></div>
      <div class="eb-cell"><b>背诵顺序</b><p>先背导论与第一、二章（总论），再按章推进；第十章条目最多，按「强军思想—党的领导—强军目标—备战—现代化—改革—战略体系—方法论」顺序过。</p></div>
    </div>
  </section>'''

main = '<main>\n' + intro + '\n' + '\n'.join(sections) + '\n</main>'

tpl = TPL.read_text(encoding='utf-8')

# 头部：标题 / 描述 / 面包屑 / hero
head_end = tpl.index('<div class="layout">')
prefix = tpl[:head_end]
prefix = re.sub(r'<title>.*?</title>',
                '<title>考前大题速背 · 习近平新时代中国特色社会主义思想概论 | MediLearn</title>',
                prefix, flags=re.S)
prefix = re.sub(r'<meta name="description" content=".*?">',
                '<meta name="description" content="习近平新时代中国特色社会主义思想概论 考前大题速背：按导论与十二章整理 %d 条简答与论述，分点答案＋PPT 来源，可直接背诵。">' % n_all,
                prefix, flags=re.S)
prefix = prefix.replace('<a href="subject.html?s=organ3">器官系统基础IV</a>',
                        '<a href="subject.html?s=xssx">习近平新时代中国特色社会主义思想概论</a>')
prefix = re.sub(r'<header class="hero">.*?</header>', hero, prefix, flags=re.S)

aside = '''<aside class="sidebar">
  <p class="side-title">章节目录</p>
  <input class="side-search" id="sideQ" type="search" placeholder="搜索考点 / 关键词…" aria-label="搜索考点">
  <p id="searchHint" style="margin:-4px 0 8px;font:12px var(--font-kai);color:var(--sub)"></p>
  %s
  <div class="nav-legend" style="grid-template-columns:1fr">
    <div><i style="background:#C0554A"></i>按章背诵，共 %d 条</div>
    <div><i style="background:#D9A75E"></i>来源标注到 PPT 页码</div>
  </div>
</aside>''' % (''.join(nav), n_all)

tail_start = tpl.index('</main>') + len('</main>')
tail = tpl[tail_start:]

out = prefix + '<div class="layout">\n' + aside + '\n' + main + tail
out = out.replace('</head>', PRINT_CSS + '</head>', 1).replace('</body>', PRINT_JS + '</body>', 1)
OUT.write_text(out, encoding='utf-8', newline='\n')
print('written', OUT, len(out), 'bytes')
print('items', n_all, 'term', n_term, 'short', n_short, 'essay', n_essay, 'cats', len(cats))
