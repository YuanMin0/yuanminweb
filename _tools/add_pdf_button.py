# -*- coding: utf-8 -*-
"""速记页：把「导出 PDF」从悬浮按钮移到 hero（刷题旁），并补「回到顶部」按钮。
用法：python _tools/add_pdf_button.py [--check]
"""
import json, os, re, sys, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIST = os.path.join(ROOT, 'mn', 'list.js')

CSS = """<style id="pdf-cta-css">
.hero-ctas{display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px;margin-top:16px;
  grid-column:1;grid-row:4;justify-self:start;max-width:100%}
.hero-ctas .hero-cta{margin-top:0}
.hero-cta-pdf{background:linear-gradient(180deg,#FFFFFF,#E4EDF7)!important;color:#1E3A5F!important;border-color:#FFFFFF!important}
.hero-cta-pdf em{color:#4A6684!important}
@media (max-width:600px){.hero-ctas{gap:8px 10px}}
@media print{.hero-cta-pdf,.to-top{display:none!important}}
</style>"""

TOTOP = """<button class="to-top" type="button" aria-label="回到顶部" title="回到顶部">
<svg viewBox="0 0 54 54" aria-hidden="true"><circle class="ring-bg" cx="27" cy="27" r="24"/><circle class="ring-fg" cx="27" cy="27" r="24"/></svg>
<span class="arrow">↑</span>
</button>
<script>
(function(){
  var b=document.querySelector('.to-top'); if(!b) return;
  var ring=b.querySelector('.ring-fg');
  var C=2*Math.PI*24;
  function upd(){
    var h=document.documentElement.scrollHeight-window.innerHeight;
    var p=h>0?Math.min(1,Math.max(0,window.scrollY/h)):0;
    if(ring){ ring.style.strokeDasharray=C; ring.style.strokeDashoffset=C*(1-p); }
    b.classList.toggle('show', window.scrollY>480);
  }
  window.addEventListener('scroll',upd,{passive:true});
  window.addEventListener('resize',upd);
  b.addEventListener('click',function(){ window.scrollTo({top:0,behavior:'smooth'}); });
  upd();
})();
</script>
</body>"""


def main():
    check = '--check' in sys.argv
    lst = open(LIST, encoding='utf-8').read()
    m = re.search(r'\{[\s\S]*\}', lst)
    obj = json.loads(m.group(0))
    done = 0
    for sid, rel in obj.items():
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            continue
        s = open(path, encoding='utf-8').read()

        # 1) 移除旧的悬浮按钮与样式；移除旧的 hero 按钮以便重排
        s = re.sub(r'<style>\s*\.pdf-export\{.*?</style>\s*', '', s, flags=re.S)
        s = re.sub(r'<a class="pdf-export"[^>]*>.*?</a>\s*', '', s, flags=re.S)
        s = re.sub(r'<a class="hero-cta hero-cta-pdf"[^>]*>.*?</a>\s*', '', s, flags=re.S)

        # 2) hero 按钮
        if 'class="hero-cta hero-cta-pdf"' not in s:
            pdf_rel = ('../pdf/' if rel.startswith('mn/') else 'pdf/') + sid + '.pdf'
            tm = re.search(r'<title>(.*?)</title>', s, re.S)
            title = html.unescape(tm.group(1)).strip() if tm else sid
            title = re.sub(r'\s*[|｜].*$', '', title).strip()
            title = re.sub(r'[\\/:*?"<>|]', ' ', title).strip() or sid
            btn = ('<a class="hero-cta hero-cta-pdf" href="%s" download="%s-考前速记.pdf" '
                   'title="导出为 PDF（A4，含知识点与图示）"><span class="hero-cta-ico" aria-hidden="true">⇩</span>'
                   '导出 PDF</a>') % (pdf_rel, title)
            anchors = list(re.finditer(r'<a[^>]*class="[^"]*hero-cta[^"]*"[^>]*>.*?</a>', s, re.S))
            if anchors:
                if 'class="hero-ctas"' in s:
                    last = anchors[-1]
                    s = s[:last.end()] + btn + s[last.end():]
                else:
                    a = anchors[0]
                    s = s[:a.start()] + '<div class="hero-ctas">' + a.group(0) + btn + '</div>' + s[a.end():]

        # 3) CSS
        if 'id="pdf-cta-css"' not in s:
            assert s.count('</head>') == 1
            s = s.replace('</head>', CSS + '\n</head>', 1)

        # 4) 回到顶部
        if 'class="to-top"' not in s:
            assert s.count('</body>') == 1
            s = s.replace('</body>', TOTOP, 1)

        if not check:
            open(path, 'w', encoding='utf-8', newline='\n').write(s)
        done += 1
    print('处理', done, '页')


if __name__ == '__main__':
    main()
