# -*- coding: utf-8 -*-
"""合并六章 JSON，生成 data/ertong.js。"""
import json, re
from pathlib import Path

D = Path(r'C:\Users\38815\WorkBuddy AI\2026-10-16-02-21-50\medilearn\_tools\child_deep')
SITE = Path(r'C:\Users\38815\WorkBuddy AI\2026-10-16-02-21-50\medilearn')

FILES = ['ch04.json', 'ch06.json', 'ch07.json', 'ch08.json', 'ch09.json', 'ch10.json']
chapters = []
for f in FILES:
    chapters.append(json.loads((D / f).read_text(encoding='utf-8')))

sub = {
    "id": "ertong",
    "name": "儿童少年卫生学",
    "en": "Child and Adolescent Hygiene",
    "icon": "🧒",
    "accent": "var(--amber)",
    "accentSoft": "var(--amber-soft)",
    "order": 15.8,
    "cat": "yufang",
    "sem": "dasan1",
    "tag": "预防医学",
    "desc": "按 2026 秋课件章序编排：青春期生长发育、生长发育影响因素、儿童少年健康状况、心理卫生问题、青少年健康危险行为、教学卫生与学校卫生服务 6 章 56 个知识点、284 道题。第 1～3、5 章课件未到，暂未收录。",
    "intro": "本页按**本学期已开课的 6 章**课件顺序编排，对应教材第 4、6、7、8、9、10 章。前两章讲「怎么长、受什么影响」，中间三章讲「有什么健康问题」，最后一章讲「学校怎么管」。第 1、2、3、5 章（儿童少年生长发育、身体发育、心理行为发育、青春期）课件尚未提供，后续补齐。",
    "source": "G:/学习资料/大三上/儿童少年卫生学/PPT（2026 秋课件 6 份，共 470 页）",
    "chapters": chapters,
}

# 裸 < 检查（除 &lt; 等实体）
raw = json.dumps(sub, ensure_ascii=False, indent=2)
bad = re.findall(r'<(?!/?(b|i|br|em|strong)\b)[^>]{0,20}', raw)
if bad:
    print('WARN bare < count:', len(bad), bad[:5])

js = 'WB.register(' + raw + ');\n'
(SITE / 'data' / 'ertong.js').write_text(js, encoding='utf-8')

ks = sum(len(c['knowledge']) for c in chapters)
qz = sum(len(k.get('quiz', [])) for c in chapters for k in c['knowledge'])
from collections import Counter
cc = Counter(q['type'] for c in chapters for k in c['knowledge'] for q in k.get('quiz', []))
print('chapters', len(chapters), 'knowledge', ks, 'quiz', qz, dict(cc))
print('bytes', len(js.encode('utf-8')))
