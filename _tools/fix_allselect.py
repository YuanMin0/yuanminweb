# -*- coding: utf-8 -*-
"""把「多选全选」题改造成 4 正 + 1 错的五选多选。
用法：python _tools/fix_allselect.py <科目id> <patches.json>
patches: [{"stem":..., "add":..., "note":...}, ...]
"""
import json, re, sys, os

def patch_file(path, patches):
    s = open(path, encoding='utf-8').read()
    ok = 0
    for idx, p in enumerate(patches):
        stem = p['stem']; add = p['add']; note = p['note']
        pos = p.get('pos', idx % 5)
        i = s.find('"stem": ' + json.dumps(stem, ensure_ascii=False))
        if i < 0:
            print('  未找到题干:', stem[:30]); continue
        # ---- options ----
        j = s.find('"options": [', i)
        k = s.find('[', j); m = s.find(']', k)
        arr = json.loads(s[k:m+1])
        if len(arr) not in (4, 5) or add in arr:
            print('  跳过（选项数不是 4/5 或已存在）:', stem[:24]); continue
        new = arr[:pos] + [add] + arr[pos:]
        opt_txt = '[\n' + ',\n'.join('                ' + json.dumps(x, ensure_ascii=False) for x in new) + '\n              ]'
        s = s[:k] + opt_txt + s[m + 1:]
        # ---- answer ----
        j = s.find('"answer": [', i)
        k = s.find('[', j); m = s.find(']', k)
        ans = json.loads(s[k:m+1])
        newans = sorted([a + 1 if a >= pos else a for a in ans])
        ans_txt = '[\n' + ',\n'.join('                %d' % a for a in newans) + '\n              ]'
        s = s[:k] + ans_txt + s[m + 1:]
        # ---- explain ----
        em = re.search(r'"explain": ("(?:[^"\\]|\\.)*")', s[i:])
        if em:
            raw = em.group(1)
            txt = json.loads(raw)
            txt = txt.replace('四项均', '上述四项均').replace('四项分别对应', '前四项分别对应')
            txt = txt.rstrip() + ' <b>' + add + '</b>：' + note
            s = s[:i + em.start(1)] + json.dumps(txt, ensure_ascii=False) + s[i + em.end(1):]
        ok += 1
    open(path, 'w', encoding='utf-8', newline='').write(s)
    return ok

if __name__ == '__main__':
    sid = sys.argv[1]
    data = json.load(open(sys.argv[2], encoding='utf-8'))
    path = os.path.join('data', sid + '.js')
    n = patch_file(path, data)
    print(sid, '改造', n, '/', len(data))
