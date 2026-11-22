# -*- coding: utf-8 -*-
"""重建 mn/organ3.html 的题库区块与侧边栏题库入口。"""
import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import part1, part2, part_extra, part3, part4  # noqa

Q = part1.Q + part2.Q + part_extra.Q + part3.Q + part4.Q

# 筛选：剔除与教材原题/真题重复、或信息量偏低的拓展选择题（保留全部 PPT 原题、习题集原题、真题）
DROP = [
    ('01', '关于球旁器（肾小球旁器）的组成与功能'),          # 与名解、简答重复
    ('04', '关于抗利尿激素（ADH）的作用'),                   # 与习题集 ADH 题、2022N119 重复
    ('05', '呋塞米的不良反应包括'),                           # 与习题集第 22 题重复
    ('05', '氢氯噻嗪的临床应用包括'),                         # 与简答「呋塞米与氢氯噻嗪比较」重复
    ('06', '水肿发生的基本机制包括'),                         # 与简答「三种脱水」外内容重叠，信息密度低
    ('07', '下列指标中，反映代谢性酸碱平衡紊乱的有'),         # 与名解 AG、简答血气特点重复
    ('07', '关于代谢性酸中毒的治疗'),                         # 与论述「代酸处理」重复
    ('08', '休克代偿期（缺血性缺氧期）的代偿意义包括'),       # 与简答「休克三期」重复
    ('08', '休克晚期（微循环衰竭期）的严重后果有'),           # 与简答「休克三期」重复
    ('09', '应激时蓝斑-交感-肾上腺髓质系统兴奋的效应包括'),   # 与简答「应激」重复
    ('09', '长期慢性应激对机体的不利影响有'),                 # 与单选 GC 代偿意义重复
    ('10', '急性肾损伤少尿期可出现'),                         # 与简答「少尿期变化」重复
    ('10', '急性肾损伤的防治原则包括'),                       # 与论述「AKI」重复
    ('11', '慢性肾衰竭晚期可出现'),                           # 与论述「CRF」重复
    ('11', '肾性贫血的发生机制包括'),                         # 与论述「CRF」重复
    ('12', '青少年反复发作性肉眼血尿'),                       # 与 IgA 肾病名解重复
    ('13', '下列药物中属于抑菌药的是'),                       # 与 PPT 单选「杀菌药」重复
    ('13', '抗生素后效应（PAE）是指'),                        # 与 PPT 多选「给药方案」重复
    ('13', '细菌对 β-内酰胺类抗生素耐药的最常见机制是'),      # 与第 14 讲 PPT 第 8 题重复
    ('14', '关于头孢菌素类各代特点'),                         # 与 PPT 第 3、5、6 题重复
    ('15', '克拉霉素在临床上的特殊用途是'),                   # 与简答「大环内酯类」重复
    ('15', '多黏菌素类抗生素的抗菌机制是'),                   # 低频，超出本科重点
    ('16', '氨基糖苷类抗生素的共同特点有'),                   # 与简答「氨基糖苷类共同特点」重复
    ('16', '多西环素（强力霉素）的突出特点是'),               # 低频细节
    ('17', '甲氧苄啶（TMP）与磺胺甲噁唑（SMZ）合用的药理学依据是'),  # 与名解 TMP 重复
    ('18', '抗结核化学治疗的原则包括'),                       # 与论述「肺结核化疗」重复
    ('18', '关于抗真菌药物的作用机制，下列正确的有'),         # 与名解两性霉素 B、单选机制重复
    ('18', '阿昔洛韦抗疱疹病毒的机制是'),                     # 低频，非本科重点
]
Q = [q for q in Q if not (q['src_type'] == '拓展' and (q['g'], q['stem']) in [(g, s) for g, s in DROP])]

PRI = {'真题': 0, 'PPT原题': 1, '习题集': 2, '泡面': 3, '拓展': 4}
for i, q in enumerate(Q):
    q['_i'] = i
Q.sort(key=lambda q: (q['g'], PRI[q['src_type']], q['_i']))

TYPE_CN = {'single': '单选题', 'multiple': '多选题', 'term': '名词解释',
           'short': '简答题', 'essay': '论述题'}
GROUP_CN = {'single': 'single', 'multiple': 'multiple', 'term': 'term',
            'short': 'short', 'essay': 'essay'}


def esc(t):
    return t


def src_badge(q):
    st = q['src_type']
    if st == '真题':
        return '真题 %s' % q.get('year', '')
    if st == 'PPT原题':
        return 'PPT 原题'
    if st == '习题集':
        return '习题集原题'
    if st == '泡面':
        m = re.search(r'「(一次|两次|三次|四次|五次)', q['src'])
        n = {'一次': 1, '两次': 2, '三次': 3, '四次': 4, '五次': 5}
        return '泡面·%d 次' % n[m.group(1)] if m else '泡面笔记'
    return '拓展'


def ans_letters(q):
    a = q['ans']
    if isinstance(a, int):
        return 'ABCDE'[a]
    return ''.join('ABCDE'[i] for i in a)


def render(q, no):
    t = q['t']
    out = ['<article class="qa-card reveal" data-group="%s" data-type="%s">' % (q['g'], t)]
    out.append('<div class="question-label">第 %02d 题 · %s<span class="question-badge bank">第%s讲</span>'
               '<span class="question-badge past">%s</span><span class="question-badge src">%s</span></div>'
               % (no, TYPE_CN[t], q['g'], q['freq'], src_badge(q)))
    out.append('<h3>%s</h3>' % q['stem'])
    if t in ('single', 'multiple'):
        out.append('<div class="option-list">' + ''.join(
            '<div>%s. %s</div>' % ('ABCDE'[i], o) for i, o in enumerate(q['opts'])) + '</div>')
    out.append('<button class="answer-toggle" type="button" aria-expanded="false">点击查看答案</button>')
    out.append('<div class="answer-panel" hidden><div class="knowledge-content">')
    if t in ('single', 'multiple'):
        out.append('<p><strong>答案：</strong>%s</p>' % ans_letters(q))
    elif t == 'term':
        out.append('<p><strong>完整版：</strong>%s</p>' % q['full'])
        out.append('<p><strong>简化版：</strong>%s</p>' % q['brief'])
    else:
        out.append('<p><strong>参考答案：</strong></p><ol>' + ''.join(
            '<li>%s</li>' % p for p in q['points']) + '</ol>')
        if t == 'essay':
            out.append('<p><strong>案例：</strong>%s</p>' % q['case'])
    out.append('<p><strong>解析：</strong>%s</p>' % q['exp'])
    out.append('<p><strong>来源：</strong>%s</p>' % q['src'])
    out.append('</div></div></article>')
    return ''.join(out)


def main():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'mn', 'organ3.html')
    path = os.path.abspath(path)
    s = open(path, encoding='utf-8').read()

    # 统计
    cnt = {k: sum(1 for q in Q if q['t'] == k) for k in TYPE_CN}
    total = len(Q)
    groups = {}
    for q in Q:
        groups[q['g']] = groups.get(q['g'], 0) + 1
    src_cnt = {}
    for q in Q:
        src_cnt[q['src_type']] = src_cnt.get(q['src_type'], 0) + 1

    # 生成卡片
    cards = ''.join(render(q, i + 1) for i, q in enumerate(Q))

    # 工具栏
    tbtns = '<button class="filter-button active" type="button" data-filter-type="all">全部题目 <span>%d</span></button>' % total
    for k in ('single', 'multiple', 'term', 'short', 'essay'):
        tbtns += ('<button class="filter-button" type="button" data-filter-type="%s">%s <span>%d</span></button>'
                  % (k, TYPE_CN[k], cnt[k]))
    gbtns = '<button class="filter-button active" type="button" data-filter-group="all">全部讲次 <span>%d</span></button>' % total
    for g in sorted(groups):
        gbtns += ('<button class="filter-button" type="button" data-filter-group="%s">第%s讲 <span>%d</span></button>'
                  % (g, g, groups[g]))

    toolbar = ('<div class="question-toolbar question-filter-panel" data-question-scope="bank">'
               '<div class="filter-row type-filter-row"><span class="filter-label">题型</span>'
               '<div class="filter-buttons">%s</div></div>'
               '<div class="filter-row source-filter-row"><span class="filter-label">讲次</span>'
               '<div class="filter-buttons">%s</div></div></div>' % (tbtns, gbtns))

    intro = ('共 %d 题：单选题 %d、多选题 %d、名词解释 %d、简答题 %d、论述题 %d。'
             '题目来源已逐题标注：<b>PPT 原题</b>（课件课堂练习与病例）、<b>泡面</b>（师兄笔记，'
             '括号内为原笔记标注的考过次数）、<b>习题集原题</b>（《生理学学习指导与习题集》第 3 版）、'
             '<b>真题</b>（考研西医综合，标注年份与题号）、<b>拓展</b>（依课件整理）。'
             % (total, cnt['single'], cnt['multiple'], cnt['term'], cnt['short'], cnt['essay']))

    new_bank = ('<section class="question-bank" id="question-bank" data-question-list="bank">'
                '<h2>题库 · 拓展练习</h2><p>%s</p>%s%s</section>' % (intro, toolbar, cards))

    # 替换题库区块
    i = s.find('<section class="question-bank" id="question-bank"')
    j = s.find('<footer class="footer"', i)
    assert i > 0 and j > i, 'question-bank 区块定位失败'
    s = s[:i] + new_bank + '\n' + s[j:]

    # 侧边栏题库入口
    nav = '<div class="nav-question-bank"><a class="nav-chapter" href="#question-bank">题库 · %d 题</a></div>' % total
    if '<div class="nav-question-bank">' in s:
        s = re.sub(r'<div class="nav-question-bank">.*?</div>', nav, s, count=1)
    else:
        k = s.find('</aside>')
        s = s[:k] + nav + s[k:]

    # 徽标样式
    if '.question-badge.src' not in s:
        s = s.replace('.question-badge.predicted {',
                      '.question-badge.src { color:#2F6B4F; background:#E8F3EC; border:1px solid #BFDCCB; }\n    '
                      '.question-badge.predicted {', 1)

    open(path, 'w', encoding='utf-8', newline='\n').write(s)

    print('total', total, cnt, 'src', src_cnt)
    print('groups', groups)
    print('ratio ok:', cnt['single'] + cnt['multiple'] > cnt['term'] > cnt['short'] > cnt['essay'])


if __name__ == '__main__':
    main()
