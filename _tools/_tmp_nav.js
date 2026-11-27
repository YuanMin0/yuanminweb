(function(){
  var chapters=[].slice.call(document.querySelectorAll('section.chapter'));
  var sb=document.querySelector('.sidebar');
  var linksCh=[].slice.call(document.querySelectorAll('.nav-chapter'));
  var linksSec=[].slice.call(document.querySelectorAll('.nav-section'));
  var ticking=false, sbHold=0, marks=[], sbSticky=true;

  /* 手动滚侧栏后 1.2s 内暂停跟随，避免抢操作 */
  if(sb){
    ['wheel','touchstart','pointerdown'].forEach(function(ev){
      sb.addEventListener(ev, function(){ sbHold=Date.now(); }, {passive:true});
    });
  }

  /* 建立「正文位置 → 侧栏位置」映射：每一条目录对应它在页面中的起点 */
  function measure(){
    if(!sb) return;
    sbSticky = getComputedStyle(sb).position==='sticky';
    marks=[];
    linksCh.concat(linksSec).forEach(function(a){
      var href=a.getAttribute('href')||'';
      if(href.charAt(0)!=='#' || href==='#question-bank') return;
      var el=document.getElementById(href.slice(1));
      if(!el) return;
      marks.push({ y: el.getBoundingClientRect().top + window.scrollY, s: a.offsetTop });
    });
    marks.sort(function(p,q){ return p.y-q.y; });
  }

  /* 连续跟随：正文滚多少，侧栏就同步滑多少，当前项始终停在侧栏 30% 高度处 */
  function syncSide(){
    if(!sb || !marks.length || !sbSticky) return;
    if(document.body.classList.contains('side-collapsed')) return;
    if(Date.now()-sbHold < 1200) return;
    var max=sb.scrollHeight-sb.clientHeight;
    if(max<=0) return;
    var y=window.scrollY, i=0;
    while(i+1<marks.length && marks[i+1].y<=y) i++;
    var a=marks[i], b=marks[i+1], t=0;
    if(b && b.y>a.y) t=Math.max(0,Math.min(1,(y-a.y)/(b.y-a.y)));
    var pos = b ? a.s+(b.s-a.s)*t : a.s;
    var target=Math.max(0,Math.min(max, pos - sb.clientHeight*0.30));
    if(Math.abs(target-sb.scrollTop)>0.6) sb.scrollTop=target;
  }

  function onScroll(){
    if(ticking) return;
    ticking=true;
    requestAnimationFrame(function(){
      var y=window.scrollY+150, curCh=null, curBlk=null;
      /* offsetTop 相对的是 offsetParent（章节 section），必须换算成页面绝对位置 */
      function absTop(el){ return el.getBoundingClientRect().top + window.scrollY; }
      chapters.forEach(function(c){ if(absTop(c)<=y) curCh=c; });
      if(curCh){
        [].forEach.call(curCh.querySelectorAll('article.knowledge-block'), function(b){
          if(absTop(b)<=y) curBlk=b;
        });
      }
      linksCh.forEach(function(a){
        a.classList.toggle('active', !!curCh && a.getAttribute('href')==='#'+curCh.id);
      });
      linksSec.forEach(function(a){
        a.classList.toggle('active', !!curBlk && a.getAttribute('href')==='#'+curBlk.id);
      });
      syncSide();
      updateHandle();
      ticking=false;
    });
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',function(){ measure(); onScroll(); });
  window.addEventListener('load',function(){ measure(); onScroll(); });
  measure(); onScroll();
  setTimeout(function(){ measure(); onScroll(); }, 600);
  setTimeout(function(){ measure(); onScroll(); }, 1800);

  var handle=document.getElementById('sideHandle');
  var sbEl=document.querySelector('.sidebar');
  var collapsed=localStorage.getItem('medilearn.mn.side')==='0';

  /* 把手始终贴在侧栏右缘、垂直居中；收起后贴到窗口左侧 */
  function placeHandle(){
    if(!handle) return;
    if(collapsed){ handle.style.left='10px'; return; }
    if(!sbEl) return;
    /* 优先用实际渲染矩形（跟随展开动画），矩形无效时退回布局坐标 */
    var r=sbEl.getBoundingClientRect();
    var x = r.width > 10 ? r.right : (sbEl.offsetLeft + sbEl.offsetWidth);
    if(x>0) handle.style.left = Math.round(x-1)+'px';
  }
  var firstCh=document.querySelector('section.chapter');
  /* 顶部（hero 区）不显示把手，滚到第一章才淡入 */
  function updateHandle(){
    if(!handle) return;
    var show;
    if(collapsed || !firstCh){ show=true; }
    else{
      var th=firstCh.getBoundingClientRect().top + window.scrollY - 240;
      show = window.scrollY >= th;
    }
    handle.classList.toggle('show', show);
  }
  function apply(){
    document.body.classList.toggle('side-collapsed',collapsed);
    if(handle){
      handle.setAttribute('aria-expanded', collapsed?'false':'true');
      handle.setAttribute('aria-label', collapsed?'展开目录':'收起目录');
      handle.title = collapsed?'展开目录':'收起目录';
    }
    placeHandle();
    updateHandle();
  }
  if(handle) handle.addEventListener('click',function(){
    collapsed=!collapsed;
    localStorage.setItem('medilearn.mn.side', collapsed?'0':'1');
    apply();
    setTimeout(function(){ placeHandle(); onScroll(); }, 340);
  });
  window.addEventListener('resize', function(){ setTimeout(placeHandle, 60); });
  window.addEventListener('load', placeHandle);
  var phTick=false;
  window.addEventListener('scroll', function(){
    if(phTick) return; phTick=true;
    requestAnimationFrame(function(){ placeHandle(); phTick=false; });
  }, {passive:true});
  if(window.ResizeObserver && sbEl){ try{ new ResizeObserver(function(){ placeHandle(); }).observe(sbEl); }catch(e){} }
  apply();
  setTimeout(placeHandle, 400);
  setTimeout(placeHandle, 1200);
  onScroll();
})();
