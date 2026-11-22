# -*- coding: utf-8 -*-
"""从 mn/*.html 提取选择题（含来源/考频/年份），输出 JSON 供合并脚本使用。"""
import glob
import html
import json
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(os.path.dirname(__file__), 'mn_choice.json')


def strip_tags(t):
    return html.unescape(re.sub(r'<[^>]+>', '', t)).strip()


def parse(path):
    s = open(path, encoding='utf-8').read()
    cards = re.findall(r'<article class="qa-card.*?</article>', s, re.S)
    items = []
    for c in cards:
        t = re.search(r'data-type="(\w+)"', c).group(1)
        if t not in ('single', 'multiple'):
            continue
        g = re.search(r'data-group="(\d+)"', c).group(1)
        stem = strip_tags(re.search(r'<h3>(.*?)</h3>', c, re.S).group(1))
        opts = [strip_tags(x) for x in re.findall(r'<div>([A-E]\.\s.*?)</div>', c, re.S)]
        opts = [re.sub(r'^[A-E]\.\s*', '', o) for o in opts]
        ans = re.search(r'<p><strong>答案：</strong>([A-E]+)</p>', c)
        if not ans or not opts:
            continue
        letters = ans.group(1)
        answer = [ord(x) - 65 for x in letters] if t == 'multiple' else ord(letters) - 65
        exp = strip_tags(re.search(r'<p><strong>解析：</strong>(.*?)</p>', c, re.S).group(1))
        src = strip_tags(re.search(r'<p><strong>来源：</strong>(.*?)</p>', c, re.S).group(1))
        freq = strip_tags(re.search(r'question-badge past">([^<]+)<', c).group(1))
        sb = re.search(r'question-badge src">([^<]+)<', c)
        badge = strip_tags(sb.group(1)) if sb else ''
        years = [int(y) for y in re.findall(r'(20\d\d)', badge)] if '真题' in badge else []
        items.append({
            'group': g, 'type': t, 'stem': stem, 'options': opts,
            'answer': answer, 'explain': exp, 'source': src,
            'freq': freq, 'years': years, 'badge': badge,
        })
    return items


def main():
    data = {}
    for p in sorted(glob.glob(os.path.join(ROOT, 'mn', '*.html'))):
        sid = os.path.splitext(os.path.basename(p))[0]
        if sid == 'index':
            continue
        items = parse(p)
        data[sid] = items
    json.dump(data, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    total = sum(len(v) for v in data.values())
    print('subjects', len(data), 'choice cards', total)
    for k, v in data.items():
        print(f'  {k}: {len(v)}')


if __name__ == '__main__':
    main()
