# -*- coding: utf-8 -*-
"""把历年真题（65 题）追加到 mn/organ3.html 的题库，并重建 toolbar 计数。
保留原有 209 道精编题，只在其后追加。
"""
import json
import os
import re
import html

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PAGE = os.path.join(ROOT, 'mn', 'organ3.html')

TYPE_LABEL = {'single': '单选题', 'multiple': '多选题', 'judge': '判断题', 'fill': '填空题',
              'term': '名词解释', 'short': '简答题', 'essay': '论述题'}
TYPE_ORDER = ['single', 'multiple', 'judge', 'fill', 'term', 'short', 'essay']
LETTERS = 'ABCDEFGH'
# 章 → 讲次分组
CH2G = {1: '01', 2: '02', 4: '04', 5: '05', 6: '06', 7: '07', 8: '08',
        9: '09', 10: '10', 11: '11', 12: '12', 13: '13'}
# 讲次标题（用于 badge）
G_TITLE = {'01': '第01讲', '02': '第02讲', '04': '第04讲', '05': '第05讲', '06': '第06讲',
           '07': '第07讲', '08': '第08讲', '09': '第09讲', '10': '第10讲',
           '11': '第11讲', '12': '第12讲', '13': '第13讲'}


def safe_html(t):
    if not t:
        return ''
    s = str(t)
    tags = []

    def keep(m):
        tags.append(m.group(0))
        return '\x00%d\x00' % (len(tags) - 1)

    s = re.sub(r'</?(?:b|strong|br|em|i|u|sub|sup|span|div|p|ul|ol|li|table|thead|tbody|tr|td|th|h[1-6]|code|mark|small)(?:\s[^>]*)?/?>', keep, s)
    s = s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    for i, t in enumerate(tags):
        s = s.replace('\x00%d\x00' % i, t)
    return s


def badges(q, gid):
    out = '<span class="question-badge bank">%s</span>' % G_TITLE.get(gid, '真题')
    f = q.get('freq') or ''
    if f:
        cls = 'past' if '高' in f else ('past mid' if '中' in f else 'past low')
        out += '<span class="question-badge %s">%s</span>' % (cls, html.escape(f))
    ys = q.get('years') or []
    if ys:
        out += '<span class="question-badge src hot">真题 %s</span>' % html.escape('/'.join(ys[:3]))
    return out


def answer_block(q):
    t = q.get('type')
    out = []
    if t == 'single':
        a = q.get('answer')
        out.append('<p><strong>答案：</strong>%s</p>' % (LETTERS[a] if isinstance(a, int) else '?'))
    elif t == 'term':
        if q.get('explain'):
            out.append('<p><strong>完整版：</strong>%s</p>' % safe_html(q['explain']))
        if q.get('explainBrief'):
            out.append('<p><strong>简化版：</strong>%s</p>' % safe_html(q['explainBrief']))
    else:
        pts = q.get('answerPoints') or []
        if pts:
            out.append('<p><strong>参考答案：</strong></p><ol>%s</ol>' %
                       ''.join('<li>%s</li>' % safe_html(p) for p in pts))
        if q.get('caseText'):
            out.append('<p><strong>案例：</strong>%s</p>' % safe_html(q['caseText']))
        if q.get('explain'):
            out.append('<p><strong>解析：</strong>%s</p>' % safe_html(q['explain']))
    if q.get('source'):
        out.append('<p><strong>来源：</strong>%s</p>' % html.escape(str(q['source'])))
    return ''.join(out)


def build_card(q, idx, gid):
    t = q.get('type', 'single')
    body = ['<article class="qa-card reveal" data-group="%s" data-type="%s">' % (gid, t),
            '<div class="question-label">第 %03d 题 · %s%s</div>' % (idx, TYPE_LABEL.get(t, '题目'), badges(q, gid)),
            '<h3>%s</h3>' % safe_html(q.get('stem', ''))]
    if t in ('single', 'multiple') and q.get('options'):
        body.append('<div class="option-list">%s</div>' % ''.join(
            '<div>%s. %s</div>' % (LETTERS[i], safe_html(o)) for i, o in enumerate(q['options'])))
    body.append('<button class="answer-toggle" type="button" aria-expanded="false">点击查看答案</button>')
    body.append('<div class="answer-panel" hidden><div class="knowledge-content">%s</div></div>' % answer_block(q))
    body.append('</article>')
    return ''.join(body)


def main():
    items = json.load(open(os.path.join(ROOT, '_tools', 'organ3_real', 'exam.json'), encoding='utf-8'))
    s = open(PAGE, encoding='utf-8').read()

    # 现有题干去重
    norm = lambda x: re.sub(r'[\s，。、；：？！“”‘’（）()《》【】\[\]<>·—…\-_,.;:?!\"\']', '', x).lower()
    exist = set(norm(html.unescape(re.sub('<[^>]+>', '', m)))
                for m in re.findall(r'<h3>(.*?)</h3>', s, re.S))

    bank_start = s.find('<section class="question-bank"')
    bank_end = s.find('</section>', bank_start)
    bank = s[bank_start:bank_end]

    old_cards = re.findall(r'<article class="qa-card.*?</article>', bank, re.S)
    start_idx = len(old_cards)
    new_cards, added = [], 0
    for it in items:
        q = it['q']
        key = norm(q['stem'])
        if key in exist:
            continue
        exist.add(key)
        added += 1
        new_cards.append(build_card(q, start_idx + added, CH2G.get(it['ch'], '01')))

    if not new_cards:
        print('no new cards'); return

    # 重建 toolbar：基于全部卡片
    all_html = ''.join(old_cards) + ''.join(new_cards)
    cnt_type, cnt_group = {}, {}
    for c in re.findall(r'<article class="qa-card.*?</article>', all_html, re.S):
        t = re.search(r'data-type="(\w+)"', c).group(1)
        g = re.search(r'data-group="(\d+)"', c).group(1)
        cnt_type[t] = cnt_type.get(t, 0) + 1
        cnt_group[g] = cnt_group.get(g, 0) + 1
    total = sum(cnt_type.values())

    type_btns = ['<button class="filter-button active" type="button" data-filter-type="all">全部题目 <span>%d</span></button>' % total]
    for t in TYPE_ORDER:
        if cnt_type.get(t):
            type_btns.append('<button class="filter-button" type="button" data-filter-type="%s">%s <span>%d</span></button>'
                             % (t, TYPE_LABEL[t], cnt_type[t]))
    grp_btns = ['<button class="filter-button active" type="button" data-filter-group="all">全部讲次 <span>%d</span></button>' % total]
    for g in sorted(cnt_group):
        grp_btns.append('<button class="filter-button" type="button" data-filter-group="%s">第%s讲 <span>%d</span></button>'
                        % (g, g, cnt_group[g]))

    toolbar = ('<div class="question-toolbar question-filter-panel" data-question-scope="bank">'
               '<div class="filter-row type-filter-row"><span class="filter-label">题型</span>'
               '<div class="filter-buttons">%s</div></div>'
               '<div class="filter-row source-filter-row"><span class="filter-label">讲次</span>'
               '<div class="filter-buttons">%s</div></div></div>' % (''.join(type_btns), ''.join(grp_btns)))

    parts = '%s %d' % ('', total)
    intro_parts = '、'.join('%s %d' % (TYPE_LABEL[t], cnt_type[t]) for t in TYPE_ORDER if cnt_type.get(t))
    intro = '共 %d 题：%s。答案与解析依据课件、历年期末真题与教材编写，每题标注来源、考频与考过情况。' % (total, intro_parts)

    # 替换题库内容
    new_bank = re.sub(r'<p>共 \d+ 题：.*?</p>', '<p>%s</p>' % intro, bank, count=1, flags=re.S)
    new_bank = re.sub(r'<div class="question-toolbar.*?</div></div></div>', toolbar, new_bank, count=1, flags=re.S)
    new_bank = new_bank + ''.join(new_cards)

    s = s[:bank_start] + new_bank + s[bank_end:]
    # 侧栏两个导航题数
    s = re.sub(r'(<div class="nav-question-bank"[^>]*><a class="nav-chapter" href="#question-bank">)题库 · \d+ 题',
               r'\g<1>题库 · %d 题' % total, s)

    open(PAGE, 'w', encoding='utf-8', newline='\n').write(s)
    print('added', added, 'total', total)
    print('type', cnt_type)
    print('group', dict(sorted(cnt_group.items())))


if __name__ == '__main__':
    main()
