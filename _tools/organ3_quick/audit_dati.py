# -*- coding: utf-8 -*-
"""考前大题速背页：三轮自检（结构 / 数值 / 交叉一致性）。"""
import json, re
from pathlib import Path
from collections import defaultdict

D = Path(__file__).parent
items = []
for f in ['dati_1.json', 'dati_2.json']:
    for cat in json.loads((D / f).read_text(encoding='utf-8'))['cats']:
        for it in cat['items']:
            it['_cat'] = cat['id']
            items.append(it)

print('=' * 70)
print('第 1 轮：结构完整性')
bad = 0
for it in items:
    for k in ('id', 'type', 'title', 'freq', 'freqNote', 'answer', 'explain', 'source'):
        if k not in it or it[k] in (None, '', []):
            print('  缺字段', it.get('id'), k); bad += 1
    if it['type'] not in ('名解', '简答', '论述'):
        print('  题型异常', it['id'], it['type']); bad += 1
    if not (0 <= it['freq'] <= 9):
        print('  考频异常', it['id'], it['freq']); bad += 1
    if len(it['answer']) < 2:
        print('  答案要点过少', it['id'], len(it['answer'])); bad += 1
    if len(it['explain']) < 40:
        print('  通俗解释过短', it['id'], len(it['explain'])); bad += 1
    if not it['source']:
        print('  缺来源', it['id']); bad += 1
    for a in it['answer']:
        if '<' in a or '>' in a.replace('＞', ''):
            pass
print('  条目 %d，问题 %d' % (len(items), bad))

print('=' * 70)
print('第 2 轮：数值与单位抽取（人工复核用）')
num_pat = re.compile(r'(\d+(?:\.\d+)?)\s*(mmHg|mmol/L|mOsm/L|ml/min|ml/d|ml|g/24h|g/L|g/dl|mg/dl|mg/min|μg/L|dB|Hz|℃|%|次|周|月|年|小时|分钟|天)')
seen = defaultdict(set)
for it in items:
    txt = ' '.join(it['answer']) + ' ' + it['explain']
    for m in num_pat.finditer(txt):
        seen[m.group(2)].add(m.group(1))
for unit in sorted(seen):
    vals = sorted(seen[unit], key=lambda x: float(x))
    print('  %-10s %s' % (unit, ', '.join(vals[:20])))

print('=' * 70)
print('第 3 轮：关键指标交叉一致性')
checks = [
    ('GFR 正常值', r'125\s*ml/min'),
    ('滤过分数', r'19%'),
    ('肾血流量', r'1200\s*ml/min'),
    ('肾糖阈', r'180\s*mg'),
    ('TmG 血糖', r'300\s*mg/dl'),
    ('自身调节', r'80[～\-–]180'),
    ('等渗血钠', r'135[～\-–]150'),
    ('BE 正常', r'[−\-]3\.0\s*[～\-–]\s*\+?3\.0'),
    ('AG 正常', r'12'),
    ('少尿', r'400\s*ml'),
    ('无尿', r'100\s*ml'),
    ('NS 蛋白尿', r'3\.5\s*g'),
    ('NS 白蛋白', r'30\s*g/L'),
]
for name, pat in checks:
    hits = [it['id'] for it in items if re.search(pat, ' '.join(it['answer']))]
    print('  %-12s 命中 %s' % (name, ','.join(hits) if hits else '（无）'))

print('=' * 70)
print('考频分布')
from collections import Counter
c = Counter(it['freq'] for it in items)
print(' ', dict(sorted(c.items(), reverse=True)))
print('  >=4 次：', [it['id'] for it in items if it['freq'] >= 4])
print('  分类计数：', Counter(it['_cat'] for it in items))
print('  题型计数：', Counter(it['type'] for it in items))
