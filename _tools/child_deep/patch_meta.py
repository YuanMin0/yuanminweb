# -*- coding: utf-8 -*-
"""把儿童少年卫生学条目插入 data/_meta.js（保持原格式与顺序）。"""
import json, re
from pathlib import Path

SITE = Path(r'C:\Users\38815\WorkBuddy AI\2026-10-16-02-21-50\medilearn')
p = SITE / 'data' / '_meta.js'
s = p.read_text(encoding='utf-8')

m = re.search(r'window\.WB_META\s*=\s*(\[.*\]);', s, re.S)
arr = json.loads(m.group(1))

if any(x['id'] == 'ertong' for x in arr):
    print('already exists')
else:
    entry = {
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
        "_count": {"chapters": 6, "knowledge": 56, "quiz": 284, "choice": 218}
    }
    # 插到 huanjingweisheng（15.7）之后
    idx = next((i for i, x in enumerate(arr) if x['id'] == 'huanjingweisheng'), None)
    if idx is None:
        arr.append(entry)
    else:
        arr.insert(idx + 1, entry)
    out = 'window.WB_META = ' + json.dumps(arr, ensure_ascii=False, separators=(',', ':')) + ';\n'
    p.write_text(out, encoding='utf-8')
    print('inserted at', idx + 1 if idx is not None else 'end')
print('total subjects', len(arr))
