# -*- coding: utf-8 -*-
"""生成 organ3-dati.html：器官系统基础IV · 考前大题速背。"""
import json, re, html, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from svg_lib import FIGURES

FIG_TITLES = {
    'svg-nephron': '两类肾单位的结构对比',
    'svg-filtration': '滤过膜三层与分子/电荷双重屏障',
    'svg-efp': '有效滤过压的构成与滤过平衡点',
    'svg-tgf': '管-球反馈的负反馈环路',
    'svg-countercurrent': '逆流倍增与尿液浓缩',
    'svg-raas': '肾素-血管紧张素-醛固酮系统',
    'svg-dehydration': '三种脱水类型的对比',
    'svg-shock': '休克三期的微循环变化与临床表现',
    'svg-acidbase': '酸碱失衡的五步判断法',
    'svg-antibacterial': '抗菌药物作用机制的五个位点',
    'svg-ns': '肾病综合征「三高一低」的形成链条',
    'svg-crescent': '新月体的构成与急进性肾炎三型',
    'svg-arf': '急性肾衰少尿期「一低四高」',
    'svg-dic': 'DIC 的发生过程与四大表现',
    'svg-diuretics': '利尿药的作用部位与强度',
    'svg-ns-types': '肾病综合征五大病理类型对比',
}

D = Path(__file__).parent
SITE = D.parent.parent
OUT = SITE / 'organ3-dati.html'

data = []
for f in ['dati_1.json', 'dati_2.json']:
    data.extend(json.loads((D / f).read_text(encoding='utf-8'))['cats'])

def md(t):
    t = html.escape(str(t), quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    return t

def freq_badge(n, note):
    if n >= 4:
        return '<span class="freq hot" title="%s">★ 考过 %d 次</span>' % (html.escape(note), n)
    if n >= 2:
        return '<span class="freq mid" title="%s">考过 %d 次</span>' % (html.escape(note), n)
    if n == 1:
        return '<span class="freq low" title="%s">考过 1 次</span>' % html.escape(note)
    return '<span class="freq none" title="%s">未标次数</span>' % html.escape(note)

def stars(n):
    if n >= 5:
        return '<span class="star hot" title="考过 %d 次 · 最高频">★★★</span>' % n
    if n == 4:
        return '<span class="star hot" title="考过 %d 次 · 高频">★★</span>' % n
    if n >= 2:
        return '<span class="star" title="考过 %d 次">★</span>' % n
    if n == 1:
        return '<span class="star low" title="考过 1 次">☆</span>'
    return ''


def real_badge(it):
    ys = it.get('realYears') or []
    if not ys:
        return ''
    short = []
    for y in ys:
        if y == '未知':
            t = '?'
        elif y == '划重点':
            t = '重点'
        else:
            t = y.replace('临床', '').replace('级', '')
        if t not in short:
            short.append(t)
    return ('<span class="real" title="历年真题：%s">真题 %s</span>'
            % (html.escape('、'.join(ys)), '·'.join(short)))


def exam_badge(it):
    e = it.get('exam')
    if not e:
        return ''
    r = it.get('examRank', 0)
    note = html.escape(it.get('examNote') or '')
    if e == '名解':
        cls = 'mn' if r == 1 else 'mn2'
        txt = '名解 · 必背' if r == 1 else '名解 · 候选'
    elif e == '论述':
        cls = 'ln' if r == 1 else 'ln2'
        txt = '论述 · 必背' if r == 1 else '论述 · 候选'
    elif e == '选择':
        cls, txt = 'sel', '选择'
    else:
        cls, txt = 'ign', '仅了解'
    return '<span class="exam %s" title="%s">%s</span>' % (cls, note, txt)


def render_item(it, ci):
    hot = ' hot' if it['freq'] >= 4 else ''
    qtype = '' if it.get('exam') == it['type'] else '<span class="qtype">%s</span>' % it['type']
    # 以「一、二、三、」开头的要点当作小标题，不参与编号
    ans = ''
    for x in it['answer']:
        if re.match(r'^(\*\*)?[一二三四五六七八九十]+、', x):
            ans += '<li class="sec">%s</li>' % md(x)
        else:
            ans += '<li>%s</li>' % md(x)
    tip = ''
    if it.get('tip'):
        tip = '<div class="tipbox"><b>★ 重点提示：</b>%s</div>' % md(it['tip'])
    fig = ''
    if it.get('figure') and it['figure'] in FIGURES:
        svg = FIGURES[it['figure']]
        uid = 'i' + it['id']
        svg = svg.replace('id="ah', 'id="ah' + uid).replace('url(#ah', 'url(#ah' + uid)
        fig = ('<figure class="fig">%s<figcaption>%s</figcaption></figure>'
               % (svg, md(it.get('figcap') or FIG_TITLES.get(it['figure'], '示意图'))))
    return '''<article class="qcard%s" id="%s" data-cat="%s" data-freq="%d" data-type="%s" data-text="%s">
  <header class="qhead">
    <span class="qid">%s</span>
    <h3>%s</h3>
    %s
    %s
    %s
    %s
  </header>
  <ul class="ans">%s</ul>
  %s
  %s
  <div class="qfoot">
    <button class="ex-btn" type="button" aria-expanded="false" aria-controls="ex-%s"><span class="bulb">💡</span>通俗解释</button>
    <span class="src">%s</span>
  </div>
  <div class="ex" id="ex-%s" hidden><div class="ex-inner">%s</div></div>
</article>''' % (
        hot, it['id'], ci, it['freq'], it['type'],
        html.escape(it['title'] + ' ' + ' '.join(it['answer']))[:400],
        it['id'].upper(), stars(it['freq']) + md(it['title']), qtype, exam_badge(it), real_badge(it), freq_badge(it['freq'], it['freqNote']),
        ans, tip, fig, it['id'], md(it['source']), it['id'], md(it['explain']))

EXAM_LINE = {
    'physio': '本次考法：论述 1 道（P18 尿生成最可能；P15 / P19 / P20 / P21 为备选）＋ 选择题。生理不考名解。',
    'patho': '本次考法：名解 4 道（水电解质 / 酸碱 / 休克 / 肾衰 各 1 个）＋ 论述 1 道（休克）。',
    'path': '本次考法：名解 1 道（新月体最可能）；病理没有论述题，其余按选择题准备。',
    'pharm': '本次考法：名解 1 道（概论里的概念，如化疗指数 / 抗生素后效应）＋ 论述 1 道（考整体：机制 / 耐药 / 应用原则）；各药特点与利尿药只考选择题。',
}

sections = []
nav = []
all_items = []
for cat in data:
    items = cat['items']
    all_items.extend(items)
    nav.append('<a class="nav-cat" href="#cat-%s"><span>%s</span><em>%d</em></a>'
               % (cat['id'], cat.get('short') or cat['name'], len(items)))
    cards = '\n'.join(render_item(it, cat['id']) for it in items)
    sections.append('''<section class="cat" id="cat-%s">
  <header class="cat-head">
    <div><p class="cat-en">%s</p><h2>%s</h2></div>
    <p class="cat-desc">%s</p>
    <p class="cat-exam">%s</p>
  </header>
  %s
</section>''' % (cat['id'], cat['en'], cat['name'], md(cat['desc']), md(EXAM_LINE.get(cat['id'], '')), cards))

# 本次必背（examRank==1）
must_items = [x for x in all_items if x.get('examRank') == 1]
must_html = ''.join(
    '<a class="must-link %s" href="#%s"><em>%s</em><b>%s</b><span>%s</span></a>'
    % ('mn' if x['exam'] == '名解' else 'ln', x['id'], x['exam'], x['id'].upper(), md(x['title']))
    for x in must_items)

# 最常考（>=4 次）
hot_items = sorted([x for x in all_items if x['freq'] >= 4], key=lambda x: (-x['freq'], x['id']))
hot_html = ''.join(
    '<a class="hot-link" href="#%s"><b>%s</b><span>%s</span><em>%d 次</em></a>'
    % (x['id'], x['type'], md(x['title']), x['freq']) for x in hot_items)

n_term = sum(1 for x in all_items if x['type'] == '名解')
n_short = sum(1 for x in all_items if x['type'] == '简答')
n_essay = sum(1 for x in all_items if x['type'] == '论述')

CSS = r'''
:root{
  --paper:#FAF6EC; --paper2:#FDFBF4; --ink:#2E2A24; --sub:#6B6255; --line:#E0D6C0;
  --blue:#5B84A8; --blueD:#3E5F7D; --blueL:#E3EDF5;
  --red:#C0554A; --redL:#F8E4E0; --gold:#D9A75E; --goldL:#FBF0DA;
  --green:#8FA96B; --greenL:#EDF2E2; --violet:#8E7BA8; --violetL:#EFE9F4;
  --shadow:0 14px 40px -18px rgba(62,95,125,.35);
  --font-title:"方正小标宋简体","STZhongsong","SimSun",serif;
  --font-head:"黑体","SimHei","Microsoft YaHei",sans-serif;
  --font-body:"仿宋_GB2312","FangSong","Microsoft YaHei",serif;
  --font-kai:"楷体_GB2312","KaiTi",serif;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:80px}
body{margin:0;color:var(--ink);background:var(--paper);font:17px/1.78 var(--font-body)}
h1,h2{font-family:var(--font-title);font-weight:400;margin:0}
h3{font-family:var(--font-head);margin:0;font-size:1.06em;line-height:1.5}
b{font-family:var(--font-head);color:var(--blueD)}
a{color:var(--blueD)}
.topbar{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:14px;
  padding:10px 22px;background:rgba(250,246,236,.94);border-bottom:1px solid var(--line);
  backdrop-filter:blur(12px);font:13px var(--font-head)}
.topbar a{text-decoration:none;color:var(--sub)}
.topbar a:hover{color:var(--blueD)}
.topbar .sep{color:var(--line)}
.hero{position:relative;overflow:hidden;padding:54px 26px 44px;color:#FFF9EC;
  background:linear-gradient(135deg,#3E5F7D 0%,#5B84A8 55%,#7FA0BE 100%)}
.hero::after{content:"";position:absolute;inset:auto -10% -60% -10%;height:220px;
  background:radial-gradient(closest-side,rgba(217,167,94,.30),transparent 70%);pointer-events:none}
.hero-inner{position:relative;z-index:1;width:min(1180px,100%);margin:0 auto}
.eyebrow{margin:0 0 8px;font:13px var(--font-kai);letter-spacing:.18em;color:#F0DCB4}
.hero h1{font-size:clamp(2rem,4.4vw,3.3rem);letter-spacing:.02em}
.lede{max-width:820px;margin:14px 0 0;color:#EAF2F8;font-size:1.02em}
.hero .lede b,.hero-meta b{color:#FFF3D6!important;font-family:var(--font-head)}
.hero-meta{display:flex;flex-wrap:wrap;gap:10px 22px;margin-top:18px;color:#D9E6F0;font:14px var(--font-kai)}
.hero-meta b{color:#FFF3D6;font-family:var(--font-head)}
.hero-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
.hero-cta{display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border-radius:999px;
  text-decoration:none;font:700 14px var(--font-head);color:#3A2A12;
  background:linear-gradient(180deg,#F4D79F,#D9A75E);border:1px solid #FFEBC8;
  box-shadow:0 10px 22px -14px rgba(0,0,0,.5)}
.hero-cta.ghost{background:rgba(255,255,255,.10);color:#FFF6E2;border-color:rgba(255,235,200,.55)}
.hero-cta em{font:400 12px var(--font-kai);font-style:normal;opacity:.8}
.layout{display:grid;grid-template-columns:250px minmax(0,1fr);gap:26px;
  width:min(1280px,calc(100% - 36px));margin:26px auto 80px;align-items:start}
.sidebar{position:sticky;top:64px;max-height:calc(100vh - 84px);overflow:auto;
  padding:16px 12px;background:var(--paper2);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow)}
.side-title{margin:0 0 10px;padding:0 6px 8px;border-bottom:1px solid var(--line);
  font:700 13px var(--font-head);color:var(--sub);letter-spacing:.08em}
.side-search{width:100%;margin-bottom:12px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;
  background:#fff;font:14px var(--font-body);color:var(--ink)}
.side-search:focus{outline:2px solid var(--blue);outline-offset:1px}
.nav-cat{display:flex;justify-content:space-between;align-items:center;gap:8px;
  padding:8px 8px;border-radius:7px;text-decoration:none;color:var(--ink);font:600 13.5px var(--font-head)}
.nav-cat em{font:400 12px var(--font-kai);color:var(--sub);font-style:normal}
.nav-cat:hover{background:var(--blueL)}
.nav-hot{display:block;margin-top:10px;padding:9px 8px;border-radius:7px;text-decoration:none;
  color:var(--red);font:700 13px var(--font-head);background:var(--redL)}
.nav-legend{margin-top:14px;padding-top:12px;border-top:1px solid var(--line);
  font:12px/1.7 var(--font-kai);color:var(--sub)}
.nav-legend i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px}
main{min-width:0}
.hotbox{margin-bottom:30px;padding:20px 22px;background:var(--redL);border:1px solid #EBC3BB;border-radius:14px}
.hotbox h2{font-size:1.35rem;color:var(--red);margin-bottom:4px}
.hotbox p{margin:0 0 14px;font:13px var(--font-kai);color:#8A4A42}
.hot-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:9px}
.hot-link{display:flex;align-items:baseline;gap:8px;padding:8px 11px;border-radius:8px;
  background:#FFF9F7;border:1px solid #EFD3CD;text-decoration:none;color:var(--ink);font-size:13.5px}
.hot-link:hover{border-color:var(--red)}
.hot-link b{color:var(--red);font-size:11.5px;flex:none}
.hot-link span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hot-link em{flex:none;font:400 12px var(--font-kai);color:var(--red);font-style:normal}
.cat{margin-bottom:44px}
.cat-head{margin-bottom:18px;padding-bottom:12px;border-bottom:2px solid var(--line)}
.cat-en{margin:0 0 4px;font:12px var(--font-kai);letter-spacing:.16em;color:var(--gold);text-transform:uppercase}
.cat-head h2{font-size:clamp(1.5rem,2.6vw,2rem);color:var(--blueD)}
.cat-desc{max-width:820px;margin:8px 0 0;font:13.5px/1.7 var(--font-kai);color:var(--sub)}
.qcard{position:relative;margin-bottom:18px;padding:20px 22px 16px;background:#fff;
  border:1px solid var(--line);border-left:4px solid var(--blue);border-radius:10px;box-shadow:0 6px 20px -16px rgba(0,0,0,.35)}
.qcard.hot{border-left-color:var(--red);background:linear-gradient(180deg,#FFF9F7,#fff 120px)}
.qhead{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;margin-bottom:12px}
.qid{flex:none;padding:2px 7px;border-radius:5px;background:var(--blueL);color:var(--blueD);
  font:700 11.5px var(--font-head);letter-spacing:.05em}
.qcard.hot .qid{background:var(--redL);color:var(--red)}
.qhead h3{flex:1 1 320px;min-width:0}
.star{display:inline-block;margin-right:7px;padding:1px 7px 2px;border-radius:5px;
  background:var(--goldL);border:1px solid #E3C48C;color:#8A5B18;
  font:700 11px/1.5 var(--font-head);letter-spacing:1.5px;vertical-align:2px}
.star.hot{background:var(--red);border-color:#A8413A;color:#FFF4EE}
.star.low{background:#F2EEE3;border-color:#DCD3BE;color:#8A8375}
.tipbox{margin-top:12px;padding:11px 14px;border-radius:9px;background:#F1F5E9;
  border-left:4px solid var(--green);font:14.5px/1.75 var(--font-body);color:#43502F}
.tipbox b{color:var(--red);font-family:var(--font-head);margin-right:2px}
/* 考试情报 */
.exam-brief{margin-bottom:24px;padding:20px 22px;border-radius:14px;
  background:linear-gradient(180deg,#FFFDF6,#FFF8E8);border:1px solid #E8D5A8}
.eb-head{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:14px}
.eb-head h2{font-size:1.25rem;color:#8A5B18}
.eb-icon{font-size:1.05em}
.eb-src{margin-left:auto;font:11.5px var(--font-kai);color:var(--sub)}
.eb-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:10px}
.eb-cell{padding:10px 12px;border-radius:9px;background:#fff;border:1px solid #EFE2C6}
.eb-cell b{display:block;margin-bottom:3px;color:var(--red);font:700 12.5px var(--font-head)}
.eb-cell p{margin:0;font:13px/1.65 var(--font-body);color:#4A4234}
.eb-cell strong{color:var(--red)}
/* 历年真题 */
.realbox{margin-bottom:22px;padding:14px 20px;border-radius:12px;background:#F2F6FA;border:1px solid #C9D8E6}
.realbox summary{cursor:pointer;list-style:none;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;
  font:700 14.5px var(--font-head);color:var(--blueD)}
.realbox summary::-webkit-details-marker{display:none}
.realbox summary em{font:400 12px var(--font-kai);color:var(--sub);font-style:normal;margin-left:auto}
.rb-ico{font-size:1em}
.rb-body{margin-top:12px}
.rb-lead{margin:0 0 12px;font:13px/1.7 var(--font-body);color:#3C4A57}
.rb-lead strong{color:var(--blueD)}
.rb-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:9px}
.rb-cell{padding:9px 11px;border-radius:8px;background:#fff;border:1px solid #D5E1EC}
.rb-cell b{display:block;margin-bottom:2px;color:var(--blueD);font:700 12px var(--font-head)}
.rb-cell p{margin:0;font:12.5px/1.6 var(--font-body);color:#46525E}
/* 真题徽章 */
.real{flex:none;padding:2px 7px;border-radius:5px;background:#EAF1F8;border:1px solid #B9CDE0;
  color:#3E5F7D;font:700 10.5px var(--font-head);white-space:nowrap}
/* 本次必背 */
.mustbox{margin-bottom:28px;padding:18px 22px;border-radius:14px;background:#FFF4F0;border:1px solid #EBC3BB}
.mb-head h2{font-size:1.25rem;color:var(--red)}
.mb-head p{margin:3px 0 13px;font:12.5px var(--font-kai);color:#8A4A42}
.must-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}
.must-link{display:flex;align-items:baseline;gap:8px;padding:8px 11px;border-radius:8px;
  background:#fff;border:1px solid #EFD3CD;text-decoration:none;color:var(--ink);font-size:13.5px}
.must-link:hover{border-color:var(--red)}
.must-link em{flex:none;font-style:normal;font:700 10.5px var(--font-head);padding:1px 5px;border-radius:4px}
.must-link.mn em{background:var(--red);color:#fff}
.must-link.ln em{background:var(--violet);color:#fff}
.must-link b{flex:none;color:var(--sub);font-size:11px}
.must-link span{flex:1;min-width:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;
  -webkit-box-orient:vertical;line-height:1.45}
/* 本次考法徽章 */
.exam{flex:none;padding:2px 8px;border-radius:999px;font:700 11px var(--font-head);white-space:nowrap}
.exam.mn{background:var(--red);color:#fff}
.exam.mn2{background:var(--redL);color:var(--red);border:1px solid #E0B0A8}
.exam.ln{background:var(--violet);color:#fff}
.exam.ln2{background:var(--violetL);color:var(--violet);border:1px solid #C9BBD8}
.exam.sel{background:#F2EEE3;color:#6B6255;border:1px solid var(--line)}
.exam.ign{background:transparent;color:#A79E8C;border:1px dashed #D6CDB8}
/* 分类考法行 */
.cat-exam{margin:8px 0 0;padding:7px 11px;border-radius:7px;background:#FFF6E4;
  border-left:3px solid var(--gold);font:12.5px/1.6 var(--font-kai);color:#6B4A1E}
.qtype{flex:none;padding:2px 8px;border-radius:999px;border:1px solid var(--line);
  color:var(--sub);font:12px var(--font-kai)}
.freq{flex:none;padding:2px 9px;border-radius:999px;font:700 11.5px var(--font-head);white-space:nowrap}
.freq.hot{background:var(--red);color:#fff}
.freq.mid{background:var(--goldL);color:#8A5B18;border:1px solid var(--gold)}
.freq.low{background:var(--greenL);color:#4F6634;border:1px solid var(--green)}
.freq.none{background:#F2EEE3;color:var(--sub);border:1px solid var(--line)}
.ans{margin:0;padding-left:24px;list-style:none;counter-reset:q}
.ans li{margin:5px 0;padding-left:5px;position:relative;counter-increment:q}
.ans li::before{content:counter(q) ".";position:absolute;left:-24px;width:18px;
  color:var(--blue);font-weight:700;text-align:right}
.ans li.sec{counter-increment:none;list-style:none;margin:14px 0 4px -24px;padding:3px 0 3px 10px;
  border-left:3px solid var(--blue);font:700 1.02em var(--font-head);color:var(--blueD);background:var(--blueL);border-radius:0 5px 5px 0}
.ans li.sec::before{content:none}
.qcard.hot .ans li.sec{border-left-color:var(--red);background:var(--redL);color:var(--red)}
.qcard.hot .ans li::before{color:var(--red)}
.qfoot{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:14px;padding-top:10px;border-top:1px dashed var(--line)}
.ex-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;
  border:1px solid var(--gold);background:var(--goldL);color:#7A4E12;
  font:700 12.5px var(--font-head);cursor:pointer}
.ex-btn:hover{background:#F7E7C4}
.ex-btn[aria-expanded="true"]{background:var(--gold);color:#3A2A12}
.ex-btn .bulb{font-size:13px}
.src{flex:1 1 240px;min-width:0;font:12px/1.55 var(--font-kai);color:var(--sub);text-align:right}
.ex{margin-top:12px;padding:14px 16px;border-radius:10px;background:var(--goldL);
  border:1px solid #EBD3A6;border-left:4px solid var(--gold);animation:exin .22s ease}
@keyframes exin{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.ex-inner{font:15.5px/1.8 var(--font-body);color:#4A3A22}
.ex-inner b{color:#8A5B18}
.fig{margin:14px 0 2px;padding:10px;background:var(--paper2);border:1px solid var(--line);border-radius:10px;
  max-width:100%;overflow-x:auto}
.fig-svg{display:block;width:100%;min-width:520px;height:auto}
.fig figcaption{margin-top:6px;font:12px var(--font-kai);color:var(--sub);text-align:center}
.empty{padding:40px;text-align:center;color:var(--sub);font:14px var(--font-kai)}
.to-top{position:fixed;right:20px;bottom:22px;z-index:60;display:flex;align-items:center;justify-content:center;width:46px;height:46px;border:0;border-radius:50%;
  background:var(--blueD);color:#fff;font:700 18px/1 var(--font-head);cursor:pointer;
  opacity:0;transform:translateY(10px);pointer-events:none;transition:.24s ease;box-shadow:0 12px 26px -12px rgba(62,95,125,.8)}
.to-top.show{opacity:1;transform:none;pointer-events:auto}
.footer{padding:30px 20px 50px;text-align:center;color:var(--sub);font:13px var(--font-kai)}
@media (max-width:900px){
  .layout{grid-template-columns:1fr;width:calc(100% - 24px)}
  .sidebar{position:static;max-height:none;order:-1}
  .nav-cat{display:inline-flex;margin:2px 4px 2px 0;padding:6px 10px;background:var(--blueL)}
  .side-search{max-width:100%}
  .src{text-align:left}
}
@media print{
  .topbar,.sidebar,.hero-ctas,.ex-btn,.to-top,.hotbox{display:none!important}
  body{background:#fff;font-size:11pt}
  .layout{display:block;width:100%;margin:0}
  .hero{background:#fff!important;color:#000;padding:0 0 12px;border-bottom:2px solid #000}
  .hero h1{font-size:20pt}.lede,.hero-meta{color:#000}
  .qcard{break-inside:avoid;page-break-inside:avoid;box-shadow:none;border:1px solid #999;margin-bottom:10px}
  .ex{display:none!important}
  .cat{break-before:auto}
}
'''

JS = r'''
(function(){
  var cards=[].slice.call(document.querySelectorAll('.qcard'));
  /* 通俗解释折叠 */
  document.addEventListener('click',function(e){
    var b=e.target.closest('.ex-btn'); if(!b) return;
    var id=b.getAttribute('aria-controls'); var box=document.getElementById(id);
    var open=b.getAttribute('aria-expanded')==='true';
    b.setAttribute('aria-expanded',open?'false':'true');
    b.querySelector('.bulb').textContent=open?'💡':'🔽';
    if(box) box.hidden=open;
  });
  /* 搜索 */
  var q=document.getElementById('sideQ');
  if(q){
    q.addEventListener('input',function(){
      var v=q.value.trim().toLowerCase();
      var shown=0;
      cards.forEach(function(c){
        var hit=!v||(c.dataset.text||'').toLowerCase().indexOf(v)>=0;
        c.style.display=hit?'':'none';
        if(hit) shown++;
      });
      document.querySelectorAll('.cat').forEach(function(sec){
        var any=sec.querySelectorAll('.qcard:not([style*="display: none"])').length;
        sec.style.display=any?'':'none';
      });
      var em=document.getElementById('searchHint');
      if(em) em.textContent=v?('匹配 '+shown+' 条'):'';
    });
  }
  /* 回到顶部 */
  var t=document.querySelector('.to-top');
  window.addEventListener('scroll',function(){
    t.classList.toggle('show',window.scrollY>600);
  },{passive:true});
  t.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});
})();
'''

html_doc = '''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>考前大题速背 · 器官系统基础IV | MediLearn</title>
<meta name="description" content="器官系统基础IV 考前大题速背：按生理、病生、病理、药理四类整理 85 道大题与名解，标注考频、配通俗解释与示意图，可直接背诵。">
<script src="js/auth.js"></script><script>if(window.WB&&WB.auth)WB.auth.guard();</script>
<style>%s</style>
</head>
<body>
<div class="topbar">
  <a href="index.html">MediLearn</a><span class="sep">/</span>
  <a href="subject.html?s=organ3">器官系统基础IV</a><span class="sep">/</span>
  <span>考前大题速背</span>
</div>
<header class="hero"><div class="hero-inner">
  <p class="eyebrow">ORGAN SYSTEM BASICS IV · 2026 秋</p>
  <h1>考前大题速背</h1>
  <p class="lede">按 <b>生理 · 病生 · 病理 · 药理</b> 四类整理，只收泌尿系统当前要考的内容。每条给出可直接背诵的分点答案、考频（来自「泡面往年」的次数标注）与一段通俗解释——解释默认折叠，点开才看，避免干扰背诵。</p>
  <div class="hero-meta">
    <span><b>%d</b> 条</span><span>本次必背 <b>%d</b></span><span>名解 <b>%d</b></span><span>简答 <b>%d</b></span><span>论述 <b>%d</b></span>
    <span>★ 标红 = 考过 <b>4</b> 次及以上</span>
  </div>
  <div class="hero-ctas">
    <a class="hero-cta" href="mn/organ3.html">📖 考前速记<em>知识点版</em></a>
    <a class="hero-cta ghost" href="drill.html?s=organ3">✎ 刷题<em>344 题</em></a>
    <a class="hero-cta ghost" href="exam5/index.html">🎯 模拟卷<em>3 套</em></a>
    <a class="hero-cta ghost" href="pdf/organ3-dati.pdf" download="器官系统基础IV-考前大题速背.pdf" title="导出本页为 PDF（A4，含题干、答案、考频、重点提示与示意图）">⇩ 导出大题速背<em>PDF · 65 页</em></a>
    <a class="hero-cta ghost" href="pdf/organ3.pdf" download>⇩ 速记 PDF<em>知识点版</em></a>
  </div>
</div></header>

<div class="layout">
<aside class="sidebar">
  <p class="side-title">分类目录</p>
  <input class="side-search" id="sideQ" type="search" placeholder="搜索题目 / 关键词…" aria-label="搜索题目">
  <p id="searchHint" style="margin:-4px 0 8px;font:12px var(--font-kai);color:var(--sub)"></p>
  %s
  <a class="nav-hot" href="#must" style="background:#FBE9E4;color:#A8413A">★ 本次必背 · %d 条</a>
  <a class="nav-hot" href="#hot">★ 最常考（≥4 次）· %d 条</a>
  <div class="nav-legend">
    <div><i style="background:#C0554A"></i>考过 4 次及以上（标红）</div>
    <div><i style="background:#D9A75E"></i>考过 2～3 次</div>
    <div><i style="background:#8FA96B"></i>考过 1 次</div>
    <div><i style="background:#E0D6C0"></i>未标次数</div>
  </div>
</aside>
<main>
  <section class="exam-brief" id="exam">
    <div class="eb-head"><span class="eb-icon" aria-hidden="true">📋</span><h2>本次考试情报</h2>
      <span class="eb-src">来源：教员与课代表群消息（11-24～11-26）</span></div>
    <div class="eb-grid">
      <div class="eb-cell"><b>题型与分值</b><p>选择 <strong>40</strong> 道 · 名解 <strong>6</strong> 道 · 论述 <strong>3</strong> 道；各科分值按学时占比：生理 4 / 病理 2 / 病生 10 / 药理 7。</p></div>
      <div class="eb-cell"><b>名解 6 道</b><p>病生 <strong>4</strong>（一章一个）· 病理 <strong>1</strong> · 药理 <strong>1</strong>；名解<strong>没有英文</strong>。</p></div>
      <div class="eb-cell"><b>论述 3 道</b><p>生理 <strong>1</strong> · 病生 <strong>1</strong>（休克）· 药理 <strong>1</strong>；<strong>病理没有论述</strong>。</p></div>
      <div class="eb-cell"><b>药理怎么考</b><p>论述考<strong>整体</strong>（机制 / 耐药 / 应用原则）；各药特点与<strong>利尿药只考选择题</strong>。</p></div>
      <div class="eb-cell"><b>不考</b><p>抗寄生虫药（自学）· 名解无英文；其余基本根据 PPT。</p></div>
      <div class="eb-cell"><b>抗菌药概论提示</b><p>概论里的概念可出名解（如<strong>抗生素后效应</strong>）；机制与耐药机制偏整体，可作论述。</p></div>
    </div>
  </section>

  <details class="realbox" id="real" open>
    <summary><span class="rb-ico" aria-hidden="true">🗂️</span>历年真题（器官 3 相关）<em>点击展开 16/17/19/20 级清单</em></summary>
    <div class="rb-body">
      <p class="rb-lead">来自「资料」里的历年真题记录。反复出现的是：<strong>急性肾衰少尿期（4 次）</strong>、<strong>等渗性脱水 / DIC / 碱剩余 / 肾性高血压 / 失血性休克代偿（各 3 次）</strong>。</p>
      <div class="rb-grid">
        <div class="rb-cell"><b>16 临床</b><p>肾（肺）性高血压 · DIC · 等渗性脱水 · 急性肾衰少尿期 · 失血性休克的代偿</p></div>
        <div class="rb-cell"><b>17 级</b><p>DIC · 原尿返漏 · 碱剩余（BE）· 何种脱水引起失液性休克</p></div>
        <div class="rb-cell"><b>19 临床</b><p>碱剩余 · 自身输血 · 哪一种脱水会休克（原因）</p></div>
        <div class="rb-cell"><b>20 临床</b><p>反常性碱性尿 · 超极化阻滞 · 急性反应期蛋白 · 微血管病性溶血性贫血 · 应激原 · 肾性骨营养不良 · 低渗性脱水 · 反常性酸性尿 · 休克Ⅰ期表现及意义 · 休克难治的原因</p></div>
        <div class="rb-cell"><b>划重点</b><p>等渗性脱水 · DIC · 肾性高血压 · 急性肾功能不全少尿期 · 失血性休克代偿 · 三种脱水比较 · 水肿机制 · 酸碱四型计算大题</p></div>
        <div class="rb-cell"><b>用法</b><p>带「真题」徽章的条目 = 历年考过；结合「必背」徽章判断本次优先级。</p></div>
      </div>
    </div>
  </details>

  <section class="mustbox" id="must">
    <div class="mb-head"><h2>★ 本次必背 · 9 条</h2><p>按情报只背这 9 条：名解 6（病生 4 · 病理 1 · 药理 1）＋ 论述 3（生理 1 · 病生 1 · 药理 1）。</p></div>
    <div class="must-grid">%s</div>
  </section>

  <section class="hotbox" id="hot">
    <h2>★ 最常考 · 优先背这些</h2>
    <p>考过 4 次及以上，或课件明确标为重点；按次数从高到低排列。</p>
    <div class="hot-grid">%s</div>
  </section>
  %s
  <p class="footer">考频来自「生理泌尿泡面往年」「病生泡面往年」「泌尿病理泡面」「药理泡面」的次数标注（一次＝1 次）；<br>
  答案以 2026 秋课件为主、往年题答案为辅整理，已做三轮交叉核对。<br>
  <a href="mn/organ3.html">← 返回考前速记</a> · <a href="subject.html?s=organ3">科目主页</a></p>
</main>
</div>
<button class="to-top" type="button" aria-label="回到顶部"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 19V6M12 6l-6 6M12 6l6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
<script>%s</script>
</body>
</html>''' % (CSS, len(all_items), len(must_items), n_term, n_short, n_essay,
               ''.join(nav), len(must_items), len(hot_items), must_html, hot_html, '\n'.join(sections), JS)

OUT.write_text(html_doc, encoding='utf-8', newline='\n')
print('written', OUT, len(html_doc), 'bytes')
print('items', len(all_items), 'term', n_term, 'short', n_short, 'essay', n_essay, 'hot', len(hot_items))
