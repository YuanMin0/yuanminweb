# -*- coding: utf-8 -*-
"""给所有速记页注入「导出 PDF」悬浮按钮。
用法：python _tools/add_pdf_button.py [--check]
"""
import json, os, re, sys, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIST = os.path.join(ROOT, 'mn', 'list.js')

STYLE = """<style>
.pdf-export{position:fixed;right:18px;bottom:78px;z-index:9998;display:inline-flex;align-items:center;gap:6px;
  padding:10px 15px;border-radius:999px;background:#3E5F7D;color:#fff!important;text-decoration:none!important;
  font:700 13px/1 -apple-system,'PingFang SC','Microsoft YaHei',sans-serif;letter-spacing:.02em;
  box-shadow:0 8px 22px rgba(20,35,55,.28);border:1px solid rgba(255,255,255,.18);transition:transform .15s ease,box-shadow .15s ease}
.pdf-export:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(20,35,55,.34)}
.pdf-export:active{transform:translateY(0)}
@media (max-width:600px){.pdf-export{right:12px;bottom:84px;padding:9px 13px;font-size:12px}}
@media print{.pdf-export{display:none!important}}
</style>"""


def main():
    check = '--check' in sys.argv
    lst = open(LIST, encoding='utf-8').read()
    m = re.search(r'\{[\s\S]*\}', lst)
    obj = json.loads(m.group(0))
    added = 0
    missing = []
    for sid, rel in obj.items():
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            missing.append(rel)
            continue
        s = open(path, encoding='utf-8').read()
        if 'class="pdf-export"' in s:
            continue
        if check:
            added += 1
            continue
        pdf_rel = ('../pdf/' if rel.startswith('mn/') else 'pdf/') + sid + '.pdf'
        if not os.path.exists(os.path.join(ROOT, pdf_rel.replace('../', ''))):
            missing.append(pdf_rel)
            continue
        # 取标题做下载文件名
        tm = re.search(r'<title>(.*?)</title>', s, re.S)
        title = html.unescape(tm.group(1)).strip() if tm else sid
        title = re.sub(r'\s*[|｜].*$', '', title).strip()
        title = re.sub(r'[\\/:*?"<>|]', ' ', title).strip() or sid
        btn = ('<a class="pdf-export" href="%s" download="%s-考前速记.pdf" '
               'title="导出为 PDF（A4，含知识点与图示）">⇩ 导出 PDF</a>\n</body>') % (pdf_rel, title)
        assert s.count('</body>') == 1, rel
        assert s.count('</head>') == 1, rel
        s = s.replace('</head>', STYLE + '\n</head>', 1)
        s = s.replace('</body>', btn, 1)
        open(path, 'w', encoding='utf-8', newline='\n').write(s)
        added += 1
    print('注入', added, '页；缺失', len(missing))
    for x in missing[:10]:
        print('  ', x)


if __name__ == '__main__':
    main()
