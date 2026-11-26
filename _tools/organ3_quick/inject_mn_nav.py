# -*- coding: utf-8 -*-
"""给 mn/organ3.html 注入：侧栏折叠 + 滚动跟随高亮。"""
from pathlib import Path

P = Path(r'C:\Users\38815\WorkBuddy AI\2026-10-16-02-21-50\medilearn\mn\organ3.html')
s = P.read_text(encoding='utf-8')

if 'nav-enhance' in s:
    print('已注入，跳过')
    raise SystemExit

CSS = '''<style id="nav-enhance">
/* 侧栏折叠 */
.layout{transition:grid-template-columns .36s cubic-bezier(.22,.61,.36,1),gap .36s}
body.side-collapsed .layout{grid-template-columns:0 minmax(0,1fr)!important;gap:0!important}
body.side-collapsed .sidebar{opacity:0;transform:translateX(-14px);pointer-events:none;overflow:hidden}
.sidebar{transition:opacity .26s ease,transform .3s ease}
.side-collapse{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;
  margin:0 0 12px;padding:7px 10px;border:1px solid var(--gray-200);border-radius:8px;
  background:rgba(255,255,255,.9);color:var(--gray-500);font:600 12px var(--font-heading);
  cursor:pointer;transition:border-color .2s,color .2s,background .2s}
.side-collapse:hover{border-color:var(--gold);color:var(--navy);background:#fff}
.side-collapse svg{width:13px;height:13px}
.side-fab{position:fixed;left:16px;top:16px;z-index:90;display:none;align-items:center;justify-content:center;
  width:40px;height:40px;padding:0;border:1px solid var(--gray-200);border-radius:11px;
  background:rgba(255,253,242,.95);color:var(--navy);cursor:pointer;
  box-shadow:0 10px 26px -14px rgba(61,79,8,.6);backdrop-filter:blur(10px);
  transition:transform .2s,border-color .2s}
.side-fab:hover{transform:translateY(-1px);border-color:var(--gold)}
body.side-collapsed .side-fab{display:flex}
/* 当前章节高亮 */
.nav-chapter{transition:background .2s,color .2s}
.nav-chapter.active{background:var(--gray-100);color:var(--navy-deep);border-radius:6px;
  box-shadow:inset 3px 0 0 var(--navy)}
.nav-section{transition:background .2s,color .2s,box-shadow .2s}
.nav-section.active{background:#fff;color:var(--blue);font-weight:700;border-radius:5px;
  box-shadow:inset 2px 0 0 var(--blue)}
@media print{.side-fab,.side-collapse{display:none!important}}
</style>'''

BTN_IN = ('<button class="side-collapse" id="sideCollapse" type="button" aria-label="收起目录">'
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '
          'stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>收起目录</button>')

FAB = ('<button class="side-fab" id="sideFab" type="button" aria-label="展开目录" title="展开目录">'
       '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" '
       'stroke-width="2.2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>')

JS = '''<script id="nav-enhance-js">
(function(){
  var chapters=[].slice.call(document.querySelectorAll('section.chapter'));
  var sb=document.querySelector('.sidebar');
  var linksCh=[].slice.call(document.querySelectorAll('.nav-chapter'));
  var linksSec=[].slice.call(document.querySelectorAll('.nav-section'));
  var lastId=null, ticking=false;

  function onScroll(){
    if(ticking) return;
    ticking=true;
    requestAnimationFrame(function(){
      var y=window.scrollY+150, curCh=null, curBlk=null;
      chapters.forEach(function(c){ if(c.offsetTop<=y) curCh=c; });
      if(curCh){
        [].forEach.call(curCh.querySelectorAll('article.knowledge-block'), function(b){
          if(b.offsetTop<=y) curBlk=b;
        });
      }
      linksCh.forEach(function(a){
        a.classList.toggle('active', !!curCh && a.getAttribute('href')==='#'+curCh.id);
      });
      linksSec.forEach(function(a){
        a.classList.toggle('active', !!curBlk && a.getAttribute('href')==='#'+curBlk.id);
      });
      var target = curBlk
        ? document.querySelector('.nav-section[href="#'+curBlk.id+'"]')
        : (curCh ? document.querySelector('.nav-chapter[href="#'+curCh.id+'"]') : null);
      var id = target ? target.getAttribute('href') : null;
      if(target && id!==lastId && sb && !document.body.classList.contains('side-collapsed')){
        lastId=id;
        var lr=target.getBoundingClientRect(), sr=sb.getBoundingClientRect();
        if(lr.top<sr.top+40 || lr.bottom>sr.bottom-40){
          var top=sb.scrollTop+(lr.top-sr.top)-sb.clientHeight/2+lr.height/2;
          sb.scrollTo({top:Math.max(0,top),behavior:'smooth'});
        }
      }
      ticking=false;
    });
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll);

  var col=document.getElementById('sideCollapse'), fab=document.getElementById('sideFab');
  var collapsed=localStorage.getItem('medilearn.mn.side')==='0';
  function apply(){
    document.body.classList.toggle('side-collapsed',collapsed);
    if(fab) fab.setAttribute('aria-label', collapsed?'展开目录':'收起目录');
    if(fab) fab.title = collapsed?'展开目录':'收起目录';
  }
  if(col) col.addEventListener('click',function(){
    collapsed=true; localStorage.setItem('medilearn.mn.side','0'); apply(); onScroll();
  });
  if(fab) fab.addEventListener('click',function(){
    collapsed=false; localStorage.setItem('medilearn.mn.side','1'); apply(); onScroll();
  });
  apply();
  onScroll();
})();
</script>'''

# 注入 CSS
assert '</head>' in s
s = s.replace('</head>', CSS + '\n</head>', 1)

# 注入悬浮按钮（body 后）
i = s.find('<body')
j = s.find('>', i) + 1
s = s[:j] + '\n' + FAB + s[j:]

# 注入侧栏内按钮
s = s.replace('<aside class="sidebar">', '<aside class="sidebar">' + BTN_IN, 1)

# 注入 JS
s = s.replace('</body>', JS + '\n</body>', 1)

P.write_text(s, encoding='utf-8', newline='\n')
print('injected, size', len(s))
