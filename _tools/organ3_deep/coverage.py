# -*- coding: utf-8 -*-
"""课件覆盖分析：
1) 按内容去重课件（根目录/子目录重复）
2) 抽取每页标题（首行）与候选术语（2-6 字 n-gram）
3) 与 mn/organ3.html、data/organ3.js 文本比对，输出缺失候选
"""
import json, re, html, os
from pathlib import Path
from collections import Counter, defaultdict

ROOT = Path(r'C:\Users\38815\WorkBuddy AI\2026-10-16-02-21-50')
OUT = ROOT / '_ext' / 'organ3_full'
MN = ROOT / 'medilearn' / 'mn' / 'organ3.html'

slides = json.loads((OUT / 'all_slides.json').read_text(encoding='utf-8'))

# 去重：同一讲只保留内容最长的一份
by_lec = defaultdict(list)
for s in slides:
    by_lec[s['lecture']].append(s)

# 根目录与子目录同名课件：按文本总长取大者
uniq = {}
for name, arr in by_lec.items():
    txt = ''.join(x['text'] for x in arr)
    if name not in uniq or len(txt) > uniq[name][0]:
        uniq[name] = (len(txt), arr)
print('课件讲数', len(uniq), '总页数', sum(len(v[1]) for v in uniq.values()))

# 现有页面文本
mn_raw = MN.read_text(encoding='utf-8')
mn_text = html.unescape(re.sub(r'<[^>]+>', '', mn_raw))
mn_text = re.sub(r'\s+', '', mn_text)

STOP = set('''我们 可以 因此 所以 由于 如果 进行 出现 增加 减少 以及 同时 主要 作用 影响 情况
患者 临床 正常 异常 需要 引起 导致 发生 机制 细胞 功能 水平 浓度 时间 大量 明显 进一步
不同 相关 这种 这种 一种 以上 以下 如下 如图 如表 例如 包括 具有 通过 产生 形成 造成 表示
第一 第二 第三 第四 第五 分别 一般 通常 往往 可能 应该 必须 不能 没有 已经 还是 就是
'''.split())

CN = re.compile(r'[\u4e00-\u9fa5]{2,}')

def terms_of(text):
    out = Counter()
    for run in CN.findall(text):
        L = len(run)
        for n in range(2, 7):
            for i in range(L - n + 1):
                g = run[i:i+n]
                if g in STOP:
                    continue
                out[g] += 1
    return out

report = {}
for name, (ln, arr) in sorted(uniq.items()):
    heads = []
    alltext = []
    term_slides = defaultdict(set)
    for s in arr:
        t = s['text'].strip()
        if not t:
            continue
        alltext.append(t)
        first = re.sub(r'\s+', ' ', t.split('\n')[0]).strip()
        if 2 <= len(first) <= 40:
            heads.append((s['n'], first))
        for g in terms_of(t):
            term_slides[g].add(s['n'])
    joined = re.sub(r'\s+', '', ''.join(alltext))
    tf = Counter()
    for run in CN.findall(joined):
        L = len(run)
        for n in range(2, 7):
            for i in range(L - n + 1):
                g = run[i:i+n]
                if g not in STOP:
                    tf[g] += 1
    # 只保留出现 >=2 次且不在现有页面的术语；去掉被更长术语包含的短词
    cand = {g: c for g, c in tf.items() if c >= 2 and g not in mn_text}
    drop = set()
    for g in cand:
        for n in range(len(g) + 1, 7):
            for i in range(0, len(g) + 1):
                # 任意更长且同频的包含词存在则丢弃短词
                pass
    # 简化：按长度降序，若短词是某个保留长词的子串则丢弃
    keep = []
    for g in sorted(cand, key=lambda x: (-len(x), -cand[x])):
        if any(g in k for k in keep):
            continue
        keep.append(g)
    keep = sorted(keep, key=lambda x: (-len(x) * cand[x], -cand[x]))[:40]
    report[name] = {
        'slides': len(arr),
        'chars': len(joined),
        'heads': heads,
        'missing': [(g, cand[g], sorted(term_slides[g])[:6]) for g in keep],
    }

(OUT / 'coverage.json').write_text(json.dumps(report, ensure_ascii=False), encoding='utf-8')

for name, r in report.items():
    print('\n### %s  页=%d 字=%d' % (name, r['slides'], r['chars']))
    print('  标题:', ' / '.join(h for _, h in r['heads'][:6]))
    print('  缺失候选:', ', '.join('%s(%d)' % (g, c) for g, c, _ in r['missing'][:18]))
