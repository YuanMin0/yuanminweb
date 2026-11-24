# -*- coding: utf-8 -*-
"""页面级计数一致性审查：
1) 侧栏「题库 · N 题」 vs 实际题卡数
2) 题库标题「共 N 题：名解 A、单选 B…」 vs 实际各题型数
3) 题型筛选按钮上的计数 vs 实际
4) 讲次筛选按钮上的计数 vs 实际 data-group
5) 页内重复 id
"""
import os, re, sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CARD = re.compile(r'<article class="qa-card[^"]*"[^>]*>', re.S)
TYPE = re.compile(r'data-type="([^"]+)"')
GROUP = re.compile(r'data-group="([^"]*)"')
ID = re.compile(r'\bid="([^"]+)"')

def section_body(s, sid='question-bank'):
    m = re.search(r'<section class="question-bank"[^>]*id="%s"' % sid, s)
    if not m:
        return None
    start = m.start()
    nxt = s.find('<section class="question-bank"', m.end())
    return s[start: nxt if nxt > 0 else len(s)]

problems = []
scanned = 0
for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in ('_bak', '.git', '_tools', '_tmp', 'node_modules', 'files', 'img', 'reader', 'doc')]
    for f in files:
        if not f.endswith('.html'):
            continue
        p = os.path.join(root, f)
        rel = os.path.relpath(p, ROOT).replace('\\', '/')
        s = open(p, encoding='utf-8', errors='ignore').read()
        body = section_body(s)
        if body is None:
            continue
        scanned += 1
        cards = CARD.findall(body)
        types = Counter()
        groups = Counter()
        for attrs in cards:
            m = TYPE.search(attrs)
            if m:
                types[m.group(1)] += 1
            m = GROUP.search(attrs)
            if m:
                groups[m.group(1)] += 1
        total = len(cards)

        # 1) 侧栏
        for m in re.finditer(r'<div class="nav-question-bank">.*?题库\s*·\s*(\d+)\s*题', s, re.S):
            n = int(m.group(1))
            if n != total:
                problems.append((rel, '侧栏题量', n, total))

        # 2) 标题
        m = re.search(r'共\s*(\d+)\s*题[：:]\s*名词解释\s*(\d+)[、,]\s*单选题\s*(\d+)[、,]\s*多选题\s*(\d+)[、,]\s*简答题\s*(\d+)[、,]\s*论述题\s*(\d+)', body)
        if m:
            nums = [int(x) for x in m.groups()]
            actual = [total, types['term'], types['single'], types['multiple'], types['short'], types['essay']]
            if nums != actual:
                problems.append((rel, '标题计数', nums, actual))

        # 3) 题型筛选按钮
        for m in re.finditer(r'data-filter-type="([^"]+)"[^>]*>[^<]*<span>(\d+)</span>', body):
            key, n = m.group(1), int(m.group(2))
            act = total if key == 'all' else types[key]
            if n != act:
                problems.append((rel, '题型按钮 %s' % key, n, act))

        # 4) 讲次筛选按钮
        for m in re.finditer(r'data-filter-group="([^"]*)"[^>]*>[^<]*<span>(\d+)</span>', body):
            key, n = m.group(1), int(m.group(2))
            act = total if key == 'all' else groups[key]
            if n != act:
                problems.append((rel, '讲次按钮 %s' % key, n, act))

        # 5) 重复 id
        ids = ID.findall(s)
        dup = [k for k, v in Counter(ids).items() if v > 1]
        if dup:
            problems.append((rel, '重复 id', dup[:5], ''))

print('扫描含题库的页面', scanned, '| 问题', len(problems))
for x in problems:
    print('  ', x[0], '|', x[1], '| 标注', x[2], '| 实际', x[3])
sys.exit(1 if problems else 0)
