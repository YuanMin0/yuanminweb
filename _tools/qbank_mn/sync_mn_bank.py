# -*- coding: utf-8 -*-
"""把 data/<id>.js 的全部题目同步生成到 mn/<id>.html 的题库区。
- 保留原页面知识点与版式，只替换 <section class="question-bank">...</section>
- organ3 已有 209 道精编题，跳过
- 题型、讲次筛选按钮与统计文字同步重算
"""
import glob
import html
import json
import os
import re
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MN = os.path.join(ROOT, 'mn')
SKIP = {'organ3'}

TYPE_LABEL = {
    'single': '单选题', 'multiple': '多选题', 'judge': '判断题', 'fill': '填空题',
    'term': '名词解释', 'short': '简答题', 'essay': '论述题',
}
TYPE_ORDER = ['single', 'multiple', 'judge', 'fill', 'term', 'short', 'essay']
LETTERS = 'ABCDEFGH'

LOADER = r"""
const fs=require('fs');
const id=process.env.SID;
let cap=null,ex=[];
const WB={register:o=>{cap=o;},registerExam:(s,c)=>{ex.push(c);}};
const code=fs.readFileSync('data/'+id+'.js','utf8');
new Function('window','WB',code)({WB},WB);
const pe='data/exam-'+id+'.js';
if(fs.existsSync(pe)){
  const c2=fs.readFileSync(pe,'utf8');
  new Function('window','WB',c2)({WB},WB);
}
const chapters=(cap.chapters||[]).concat(...ex);
console.log(JSON.stringify({name:cap.name,chapters}));
"""


def safe_html(t):
    """保留常见排版标签，转义孤立的 < > &。"""
    if not t:
        return ''
    s = str(t)
    # 先把合法标签占位
    tags = []

    def keep(m):
        tags.append(m.group(0))
        return '\x00%d\x00' % (len(tags) - 1)

    s = re.sub(r'</?(?:b|strong|br|em|i|u|sub|sup|span|div|p|ul|ol|li|table|thead|tbody|tr|td|th|h[1-6]|code|mark|small)(?:\s[^>]*)?/?>', keep, s)
    s = s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    for i, t in enumerate(tags):
        s = s.replace('\x00%d\x00' % i, t)
    return s


def tested_badge(q):
    t = q.get('tested') or ''
    if not t:
        return ''
    if '原题' in t:
        m = re.search(r'（([^）]*)）', t)
        label = '真题 ' + m.group(1) if m and m.group(1) else '真题'
        return '<span class="question-badge src hot">%s</span>' % html.escape(label)
    if '考点' in t:
        return '<span class="question-badge src">课件考点</span>'
    return '<span class="question-badge src low">拓展</span>'


def freq_badge(q):
    f = q.get('freq') or ''
    if not f:
        return ''
    cls = 'past' if '高' in f else ('past mid' if '中' in f else 'past low')
    return '<span class="question-badge %s">%s</span>' % (cls, html.escape(f))


def answer_block(q):
    t = q.get('type')
    out = []
    if t == 'single':
        a = q.get('answer')
        letter = LETTERS[a] if isinstance(a, int) and 0 <= a < len(LETTERS) else '?'
        out.append('<p><strong>答案：</strong>%s</p>' % letter)
    elif t == 'multiple':
        arr = q.get('answer') or []
        out.append('<p><strong>答案：</strong>%s</p>' % ''.join(LETTERS[i] for i in arr if isinstance(i, int)))
    elif t == 'judge':
        out.append('<p><strong>答案：</strong>%s</p>' % ('正确' if q.get('answer') else '错误'))
    elif t == 'fill':
        out.append('<p><strong>答案：</strong>%s</p>' % html.escape(' / '.join(q.get('answer') or [])))
    elif t == 'term':
        if q.get('explain'):
            out.append('<p><strong>完整版：</strong>%s</p>' % safe_html(q['explain']))
        if q.get('explainBrief'):
            out.append('<p><strong>简化版：</strong>%s</p>' % safe_html(q['explainBrief']))
        out.append('')  # 解析留空，避免与完整版重复
    else:
        pts = q.get('answerPoints') or []
        if pts:
            out.append('<p><strong>参考答案：</strong></p><ol>%s</ol>' %
                       ''.join('<li>%s</li>' % safe_html(p) for p in pts))
        if q.get('caseText'):
            out.append('<p><strong>案例：</strong>%s</p>' % safe_html(q['caseText']))

    if t != 'term' and q.get('explain'):
        out.append('<p><strong>解析：</strong>%s</p>' % safe_html(q['explain']))
    if q.get('source'):
        out.append('<p><strong>来源：</strong>%s</p>' % html.escape(str(q['source'])))
    return ''.join(x for x in out if x)


def build_card(q, idx, group, chapter_title):
    t = q.get('type', 'single')
    label = TYPE_LABEL.get(t, '题目')
    badges = '<span class="question-badge bank">%s</span>' % html.escape(chapter_title[:10])
    badges += freq_badge(q) + tested_badge(q)

    body = []
    body.append('<article class="qa-card reveal" data-group="%s" data-type="%s">' % (group, t))
    body.append('<div class="question-label">第 %02d 题 · %s%s</div>' % (idx, label, badges))
    body.append('<h3>%s</h3>' % safe_html(q.get('stem', '')))

    if t in ('single', 'multiple') and q.get('options'):
        body.append('<div class="option-list">%s</div>' % ''.join(
            '<div>%s. %s</div>' % (LETTERS[i], safe_html(o)) for i, o in enumerate(q['options'])
        ))
    elif t == 'judge':
        body.append('<div class="option-list"><div>A. 正确</div><div>B. 错误</div></div>')

    body.append('<button class="answer-toggle" type="button" aria-expanded="false">点击查看答案</button>')
    body.append('<div class="answer-panel" hidden><div class="knowledge-content">%s</div></div>' % answer_block(q))
    body.append('</article>')
    return ''.join(body)


def build_section(name, chapters):
    all_q = []
    groups = []
    for gi, ch in enumerate(chapters, 1):
        gid = '%02d' % gi
        qs = []
        for k in ch.get('knowledge') or []:
            for q in k.get('quiz') or []:
                qs.append(q)
        if qs:
            groups.append((gid, ch.get('title', ''), qs))
            all_q.extend(qs)

    if not all_q:
        return None, 0

    # 统计
    cnt = {}
    for q in all_q:
        cnt[q.get('type')] = cnt.get(q.get('type'), 0) + 1

    parts = ['%s %d' % (TYPE_LABEL[t], cnt[t]) for t in TYPE_ORDER if cnt.get(t)]
    intro = '共 %d 题：%s。答案与解析依据课件与教材编写，每题标注来源、考频与考过情况。' % (
        len(all_q), '、'.join(parts))

    # 题型按钮
    type_btns = ['<button class="filter-button active" type="button" data-filter-type="all">全部题目 <span>%d</span></button>' % len(all_q)]
    for t in TYPE_ORDER:
        if cnt.get(t):
            type_btns.append('<button class="filter-button" type="button" data-filter-type="%s">%s <span>%d</span></button>'
                             % (t, TYPE_LABEL[t], cnt[t]))

    # 讲次按钮
    grp_btns = ['<button class="filter-button active" type="button" data-filter-group="all">全部讲次 <span>%d</span></button>' % len(all_q)]
    for gid, title, qs in groups:
        grp_btns.append('<button class="filter-button" type="button" data-filter-group="%s" title="%s">第%s讲 <span>%d</span></button>'
                        % (gid, html.escape(title), gid, len(qs)))

    cards = []
    idx = 0
    for gid, title, qs in groups:
        for q in qs:
            idx += 1
            cards.append(build_card(q, idx, gid, title))

    return (
        '<section class="question-bank" id="question-bank" data-question-list="bank">'
        '<h2>题库 · 拓展练习</h2><p>%s</p>'
        '<div class="question-toolbar question-filter-panel" data-question-scope="bank">'
        '<div class="filter-row type-filter-row"><span class="filter-label">题型</span>'
        '<div class="filter-buttons">%s</div></div>'
        '<div class="filter-row source-filter-row"><span class="filter-label">讲次</span>'
        '<div class="filter-buttons">%s</div></div></div>%s</section>'
    ) % (intro, ''.join(type_btns), ''.join(grp_btns), ''.join(cards)), len(all_q)


def main():
    ids = sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(MN, '*.html'))
                 if not p.endswith('index.html'))
    rows = []
    for sid in ids:
        if sid in SKIP:
            continue
        dp = os.path.join(ROOT, 'data', sid + '.js')
        mp = os.path.join(MN, sid + '.html')
        if not os.path.exists(dp) or not os.path.exists(mp):
            rows.append((sid, 0, 'missing'))
            continue
        env = dict(os.environ, SID=sid)
        out = subprocess.check_output(
            ['node', '-e', LOADER], cwd=ROOT, text=True, encoding='utf-8', env=env)
        data = json.loads(out)
        sec, n = build_section(data.get('name', sid), data.get('chapters') or [])
        if not sec:
            rows.append((sid, 0, 'no-quiz'))
            continue

        s = open(mp, encoding='utf-8').read()
        # 替换题库 section（从 <section class="question-bank" 到下一个 </section>）
        m = re.search(r'<section class="question-bank".*?</section>', s, re.S)
        if not m:
            rows.append((sid, n, 'no-section'))
            continue
        s = s[:m.start()] + sec + s[m.end():]

        # 更新侧栏导航题数
        s = re.sub(r'(<div class="nav-question-bank"><a class="nav-chapter" href="#question-bank">)[^<]*(</a></div>)',
                   r'\g<1>题库 · %d 题 →\g<2>' % n, s, count=1)

        open(mp, 'w', encoding='utf-8', newline='\n').write(s)
        rows.append((sid, n, 'ok'))

    for sid, n, st in rows:
        flag = '' if n >= 100 else '  ← 不足 100'
        print(f'{sid:20} {n:>4}  {st}{flag}')
    print('done', len(rows))


if __name__ == '__main__':
    main()
