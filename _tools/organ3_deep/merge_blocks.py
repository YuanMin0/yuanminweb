# -*- coding: utf-8 -*-
"""合并「（课件补充）」块到主块（v2，按 article 解析后重建）。"""
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PATH = os.path.join(ROOT, 'mn', 'organ3.html')
NUM = '一二三四五六七八九十'

MAP = {
    '01': [('01-01', [-1, 1, 2, 3, 4, 5]), ('01-02', [6])],
    '02': [('02-01', [1, 2]), ('02-02', [3]), ('02-04', [4, 5, 6])],
    '03': [('03-01', 'all')], '04': [('04-02', 'all')], '05': [('05-01', 'all')],
    '06': [('06-01', [1, 2, 3]), ('06-02', [4])], '07': [('07-01', 'all')],
    '08': [('08-01', [1]), ('08-02', [2, 3, 4, 5, 6])],
    '09': [('09-01', 'all')], '10': [('10-01', 'all')], '11': [('11-02', 'all')],
    '12': [('12-01', [1, 2, 3, 4]), ('12-03', [5]), ('12-04', [6])],
    '13': [('13-01', 'all')], '14': [('14-01', 'all')], '15': [('15-01', 'all')],
    '16': [('16-01', 'all')], '17': [('17-01', 'all')], '18': [('18-01', 'all')],
}

RENAME = {
    '01-01': '肾单位、球旁器与两套毛细血管网',
    '03-01': '近端小管、各段转运与肾糖阈',
    '04-02': '尿生成的调节：神经、体液与自身调节',
    '05-01': '利尿药的分类、作用部位与逐药对比',
    '07-01': '酸碱平衡紊乱与血气判断',
    '08-02': '休克的分期、代偿与器官功能障碍',
    '09-01': '应激的神经内分泌反应与应激性疾病',
    '10-01': '急性肾损伤（AKI）：分类、机制与临床过程',
    '11-02': '慢性肾衰竭的发病机制、分期与系统损害',
    '13-01': '抗菌药物概论：术语、机制、耐药与合理用药',
    '14-01': 'β-内酰胺类抗生素：青霉素、头孢五代与特殊品种',
    '15-01': '大环内酯类、林可霉素类、糖肽类与多黏菌素',
    '16-01': '氨基糖苷类、四环素类与氯霉素',
    '17-01': '喹诺酮类、磺胺类与硝基咪唑类',
    '18-01': '抗结核、抗真菌与抗病毒药物',
}

DROP_OLD = {'03','09','10','13','14','15','16','17','18'}

REQ = {
    '03': ('掌握', '近端小管重吸收与分泌、肾糖阈'),
    '04': ('掌握', '尿生成的调节与尿液浓缩稀释'),
    '05': ('掌握', '利尿药分类及呋塞米、氢氯噻嗪、螺内酯的作用、应用与不良反应；理解乙酰唑胺、甘露醇；了解其他利尿药'),
    '06': ('掌握', '三型脱水的鉴别与钾代谢紊乱'),
    '07': ('掌握', '酸碱平衡调节、常用指标、四型紊乱的发生机制；理解代偿及其影响'),
    '08': ('掌握', '休克的分期与微循环机制'),
    '09': ('掌握', '应激的神经内分泌反应与应激性溃疡'),
    '10': ('掌握', '急性肾损伤的病因分类与发病机制'),
    '11': ('掌握', '慢性肾衰竭的发病机制与功能代谢变化；了解尿毒症'),
    '12': ('重点', '病因和发病机制、原发肾小球病病理类型'),
    '13': ('掌握', '抗菌药物作用机制与细菌耐药机制'),
    '14': ('掌握', 'β-内酰胺类共性、青霉素类、头孢菌素类'),
    '15': ('掌握', '大环内酯类机制与抗菌谱、林可霉素类机制、万古霉素；理解多黏菌素'),
    '16': ('掌握', '氨基糖苷类抗菌谱/机制/应用/不良反应、四环素类机制/谱、氯霉素特点与不良反应'),
    '17': ('掌握', '喹诺酮类机制/谱/应用/不良反应、磺胺类机制、硝基咪唑类应用'),
    '18': ('掌握', '一线抗结核药机制与不良反应、抗真菌药机制与应用、抗HIV与广谱抗病毒药机制'),
}


def norm(t):
    return re.sub(r'[\s，。、；：？！“”‘’（）()《》【】\[\]<>·—…\-_,.;:?!"\']', '', re.sub(r'<[^>]+>', '', t))


def split_sections(content):
    pat = re.compile(r'(<p>(?:<b>)?[一二三四五六七八九十]+、)')
    parts = pat.split(content)
    intro = parts[0]
    secs = [parts[i] + parts[i + 1] for i in range(1, len(parts), 2)]
    return intro, secs


def max_num(text):
    nums = re.findall(r'<p>(?:<b>)?([一二三四五六七八九十]+)、', text)
    return max((NUM.index(n) + 1 for n in nums if n in NUM), default=0)


def dedupe_append(target, add):
    tn = norm(target)
    out = []
    tokens = re.split(r'(<p>.*?</p>|<ul>.*?</ul>|<ol>.*?</ol>|<div class="table-wrap">.*?</div>)', add, flags=re.S)
    for tk in tokens:
        if not tk.strip():
            continue
        if tk.startswith('<ul>') or tk.startswith('<ol>'):
            items = re.findall(r'<li>(.*?)</li>', tk, re.S)
            keep = [x for x in items if norm(x) and norm(x) not in tn]
            if keep:
                tag = 'ul' if tk.startswith('<ul>') else 'ol'
                out.append('<%s>%s</%s>' % (tag, ''.join('<li>%s</li>' % x for x in keep), tag))
        elif tk.startswith('<div class="table-wrap">'):
            first = re.search(r'<tr>(.*?)</tr>', tk, re.S)
            if not first or norm(first.group(1)) not in tn:
                out.append(tk)
        elif tk.startswith('<p>'):
            n = norm(tk)
            if len(n) < 12 or n not in tn:
                out.append(tk)
        else:
            out.append(tk)
    return ''.join(out)


def content_of(full):
    i = full.find('<div class="knowledge-content">')
    if i < 0:
        return ''
    body = full[i + len('<div class="knowledge-content">'):]
    body = body[:-len('</div></article>')] if body.endswith('</div></article>') else body
    body = re.sub(r'^<div class="chips".*?</div>', '', body, count=1, flags=re.S)
    return body


def main():
    s = open(PATH, encoding='utf-8').read()
    arts = {}
    spans = []
    for m in re.finditer(r'<article class="knowledge-block" id="(section-\d+-\d+)">.*?</article>', s, re.S):
        arts[m.group(1)] = m.group(0)
        spans.append((m.start(), m.end(), m.group(1)))
    print('articles', len(arts))

    removed = []
    req_done = set()
    for ch, plans in MAP.items():
        sup = 'section-%s-%02d' % (ch, max(int(k.split('-')[-1]) for k in arts if k.startswith('section-%s-' % ch)))
        if sup not in arts:
            print('no supplement', ch); continue
        full = arts[sup]
        title = re.search(r'<h3>(.*?)</h3>', full).group(1)
        if '课件补充' not in title:
            print('not supplement', sup, title); continue
        content = content_of(full)
        intro, secs = split_sections(content)
        for target, which in plans:
            tid = 'section-%s' % target
            if tid not in arts:
                print('no target', tid); continue
            tf = arts[tid]
            old = content_of(tf)
            idxs = list(range(len(secs))) if which == 'all' else [i - 1 for i in which if i > 0]
            chunks = ([intro] if (which == 'all' or -1 in which) else []) + [secs[i] for i in idxs if 0 <= i < len(secs)]
            add = ''.join(chunks)
            # 课件内容为主：先把 add 的编号规范为「一、二、…」
            start = 0
            def repl0(mm):
                nonlocal start
                start += 1
                return '<p>%s、' % NUM[start - 1] if start <= 10 else mm.group(0)
            add = re.sub(r'<p>(?:<b>)?[一二三四五六七八九十]+、', repl0, add)
            if ch in DROP_OLD:
                figs = ''.join(re.findall(r'<figure class="fig">.*?</figure>', old, re.S))
                new_body = add + figs
            else:
                rest = dedupe_append(add, old)
                start2 = max_num(add)
                def repl2(mm):
                    nonlocal start2
                    start2 += 1
                    return '<p>%s、' % NUM[start2 - 1] if start2 <= 10 else mm.group(0)
                rest = re.sub(r'<p>(?:<b>)?[一二三四五六七八九十]+、', repl2, rest)
                new_body = add + rest
            # 标题
            if target in RENAME:
                tf = re.sub(r'(<h3>).*?(</h3>)', r'\g<1>%s\g<2>' % RENAME[target], tf, count=1)
            # 课件要求
            if ch in REQ and ch not in req_done:
                level, txt = REQ[ch]
                note = '<blockquote><b>课件要求（%s）：</b>%s。</blockquote>' % (level, txt)
                if re.search(r'<div class="chips"[^>]*>.*?</div>', tf, re.S):
                    tf = re.sub(r'(<div class="chips"[^>]*>.*?</div>)', r'\g<1>' + note, tf, count=1, flags=re.S)
                else:
                    tf = tf.replace('<div class="knowledge-content">', '<div class="knowledge-content">' + note, 1)
                req_done.add(ch)
            # 重建：在旧正文位置替换为「旧正文 + 新增」
            pos = tf.find(old)
            if pos >= 0:
                tf = tf[:pos] + new_body + tf[pos + len(old):]
            else:
                tf = tf.replace('</div></article>', new_body + '</div></article>', 1)
            arts[tid] = tf
        removed.append(sup)

    for sup in removed:
        arts.pop(sup, None)

    # 重建全文
    out = []
    last = 0
    for a, b, aid in spans:
        out.append(s[last:a])
        if aid in arts:
            out.append(arts[aid])
        last = b
    out.append(s[last:])
    s = ''.join(out)

    for sup in removed:
        s = re.sub(r'<a class="nav-section" href="#%s">[^<]*</a>' % sup, '', s, count=1)

    total = len(re.findall(r'<article class="knowledge-block"', s))
    s = re.sub(r'(共 18 讲 · )\d+( 个知识点)', r'\g<1>%d\g<2>' % total, s)
    open(PATH, 'w', encoding='utf-8', newline='\n').write(s)
    print('removed', len(removed), 'blocks now', total)


if __name__ == '__main__':
    main()
