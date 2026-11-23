# -*- coding: utf-8 -*-
"""第一轮：HTML 结构审查 —— 未闭合标签、重复 id、空 href、非法嵌套"""
import os, re, sys, io, json
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {'_bak', '.git', 'js/vendor', 'files', 'img', 'icons'}

VOID = {'area','base','br','col','embed','hr','img','input','link','meta',
        'param','source','track','wbr'}
# 允许隐式闭合的标签
IMPLICIT = {'p','li','td','th','tr','option','dt','dd','thead','tbody','tfoot'}

class Checker(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.stack = []
        self.ids = {}
        self.dup_ids = []
        self.errors = []
        self.empty_href = []
        self.line = 1

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            self._check_attrs(tag, attrs)
            return
        self.stack.append((tag, self.getpos()[0]))
        self._check_attrs(tag, attrs)

    def _check_attrs(self, tag, attrs):
        d = dict(attrs)
        if 'id' in d and d['id']:
            i = d['id']
            if i in self.ids:
                self.dup_ids.append((i, self.ids[i], self.getpos()[0]))
            else:
                self.ids[i] = self.getpos()[0]
        if tag == 'a':
            h = d.get('href')
            if h is not None and h.strip() in ('', '#'):
                self.empty_href.append((h, self.getpos()[0]))
        if tag == 'img':
            if not d.get('alt') and d.get('alt') != '':
                self.errors.append(('img 缺 alt', self.getpos()[0]))
            src = d.get('src', '')
            if not src:
                self.errors.append(('img 缺 src', self.getpos()[0]))

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        # 找到最近的同名标签
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                # 中间未闭合的标签
                unclosed = self.stack[i+1:]
                if unclosed:
                    for t, ln in unclosed:
                        if t not in IMPLICIT:
                            self.errors.append(('未闭合 <%s> 起于 %d 行，被 </%s> 于 %d 行截断'
                                                % (t, ln, tag, self.getpos()[0]), ln))
                del self.stack[i:]
                return
        # 多余的结束标签
        if tag not in ('html', 'body'):
            self.errors.append(('多余 </%s>' % tag, self.getpos()[0]))

def walk():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        rel = os.path.relpath(dirpath, ROOT).replace('\\', '/')
        if rel == '.':
            rel = ''
        if any(rel == s or rel.startswith(s + '/') for s in SKIP_DIRS):
            dirnames[:] = []
            continue
        for fn in filenames:
            if fn.endswith('.html'):
                yield os.path.join(dirpath, fn)

total = 0
report = []
for path in sorted(walk()):
    total += 1
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        s = f.read()
    c = Checker(path)
    try:
        c.feed(s)
        c.close()
    except Exception as e:
        report.append((path, [('解析异常: %s' % e, 0)], [], []))
        continue
    leftover = [(t, ln) for t, ln in c.stack if t not in IMPLICIT]
    errs = list(c.errors)
    for t, ln in leftover:
        errs.append(('文档结束仍未闭合 <%s>' % t, ln))
    rel = os.path.relpath(path, ROOT).replace('\\', '/')
    if errs or c.dup_ids or c.empty_href:
        report.append((rel, errs[:12], c.dup_ids[:12], c.empty_href[:12]))

print('扫描 HTML 文件数: %d' % total)
print('有问题文件数: %d' % len(report))
print('=' * 70)
for rel, errs, dups, empt in report:
    print('\n### ' + rel)
    for msg, ln in errs:
        print('  [结构] 行%-6d %s' % (ln, msg))
    for i, a, b in dups:
        print('  [重复id] #%s 首次 %d 行，重复 %d 行' % (i, a, b))
    for h, ln in empt:
        print('  [空链接] href=%r 行%d' % (h, ln))
