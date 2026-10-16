/* ==========================================================================
   MediLearn · 高级视觉特效引擎 (FX)
   极光背景 / 滚动揭示 / 光斑跟随 / 涟漪 / 数字滚动 / 视差 / 彩带
   纯原生实现，无依赖；自动尊重 prefers-reduced-motion
   ========================================================================== */
(function () {
  'use strict';

  var WB = window.WB;
  if (!WB) return;

  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var fx = {};
  WB.fx = fx;

  /* ---------------- 1. 极光背景 ---------------- */
  fx.aurora = function () {
    if (document.querySelector('.fx-bg')) return;
    var d = document.createElement('div');
    d.className = 'fx-bg';
    d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<i></i><i></i><i></i><div class="fx-grid"></div>';
    document.body.insertBefore(d, document.body.firstChild);

    if (reduce) return;
    // 鼠标轻微视差
    var orbs = d.querySelectorAll('i');
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    window.addEventListener('mousemove', function (e) {
      tx = (e.clientX / window.innerWidth - .5) * 2;
      ty = (e.clientY / window.innerHeight - .5) * 2;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    function step() {
      cx += (tx - cx) * .06; cy += (ty - cy) * .06;
      for (var i = 0; i < orbs.length; i++) {
        var k = (i + 1) * 9;
        orbs[i].style.marginLeft = (cx * k) + 'px';
        orbs[i].style.marginTop = (cy * k) + 'px';
      }
      if (Math.abs(tx - cx) > .002 || Math.abs(ty - cy) > .002) raf = requestAnimationFrame(step);
      else raf = 0;
    }
  };

  /* ---------------- 2. 滚动揭示 ---------------- */
  var io = null;
  var revealFailsafe = 0;

  /* 安全兜底：把当前位于视口内却仍未显现的元素强制显现，
     避免因观察器未回调（隐藏标签页 / 打印 / 老引擎）导致内容永久不可见。
     视口外的元素保持原样，滚动动画不受影响。 */
  function revealVisible() {
    var left = document.querySelectorAll('.rv:not(.rv-in)');
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    for (var i = 0; i < left.length; i++) {
      var r = left[i].getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) left[i].classList.add('rv-in');
    }
  }

  fx.reveal = function (root) {
    root = root || document;
    var els = root.querySelectorAll('.rv:not(.rv-in)');
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('rv-in');
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('rv-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    }
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
    clearTimeout(revealFailsafe);
    revealFailsafe = setTimeout(revealVisible, 1000);
  };

  /* ---------------- 3. 光斑跟随 ---------------- */
  fx.spotlight = function (root) {
    root = root || document;
    var els = root.querySelectorAll('.spot:not([data-spot])');
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        el.setAttribute('data-spot', '1');
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
          el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        }, { passive: true });
      })(els[i]);
    }
  };

  /* ---------------- 4. 涟漪 ---------------- */
  fx.ripple = function (root) {
    root = root || document;
    root.addEventListener('click', function (e) {
      if (reduce) return;
      var t = e.target.closest ? e.target.closest('.gbtn, .btn, .tab, .tile, .qdot') : null;
      if (!t) return;
      t.classList.add('ripple-host');
      var r = t.getBoundingClientRect();
      var size = Math.max(r.width, r.height);
      var s = document.createElement('span');
      s.className = 'ripple';
      s.style.width = s.style.height = size + 'px';
      s.style.left = (e.clientX - r.left - size / 2) + 'px';
      s.style.top = (e.clientY - r.top - size / 2) + 'px';
      t.appendChild(s);
      setTimeout(function () { s.remove(); }, 660);
    });
  };

  /* ---------------- 5. 数字滚动 ---------------- */
  fx.countUp = function (el, to, opt) {
    opt = opt || {};
    var dur = opt.dur || 900, from = opt.from || 0, dec = opt.dec || 0, suf = opt.suffix || '';
    if (reduce) { el.textContent = to.toFixed(dec) + suf; return; }
    var t0 = 0, done = false;
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function settle() {
      if (done) return;
      done = true;
      el.textContent = to.toFixed(dec) + suf;
    }
    function frame(ts) {
      if (done) return;
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      el.textContent = (from + (to - from) * ease(p)).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(frame);
      else settle();
    }
    requestAnimationFrame(frame);
    /* 完成保证：若 rAF 被节流/暂停（后台标签页、省电模式、打印、无头环境），
       定时器兜底写入最终值，确保数字不会停留在初始值。 */
    setTimeout(settle, dur + 120);
  };
  /** 自动扫描 [data-count] 元素 */
  fx.autoCount = function (root) {
    root = root || document;
    var els = root.querySelectorAll('[data-count]:not([data-counted])');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      el.setAttribute('data-counted', '1');
      var to = parseFloat(el.getAttribute('data-count')) || 0;
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      var suf = el.getAttribute('data-suffix') || '';
      (function (el, to, dec, suf) {
        function run() {
          if (el.getAttribute('data-count-run')) return;
          el.setAttribute('data-count-run', '1');
          fx.countUp(el, to, { dec: dec, suffix: suf });
        }
        if (reduce || !('IntersectionObserver' in window)) { run(); return; }
        var ob = new IntersectionObserver(function (en) {
          if (en[0].isIntersecting) { run(); ob.disconnect(); }
        }, { threshold: .3 });
        ob.observe(el);
        /* 安全兜底：观察器未回调时，对已在视口内的元素延时启动计数，
           避免数字长期停留在初始值 0。 */
        setTimeout(function () {
          if (el.getAttribute('data-count-run')) return;
          var r = el.getBoundingClientRect();
          var vh = window.innerHeight || document.documentElement.clientHeight || 0;
          if (r.top < vh && r.bottom > 0) run();
        }, 1200);
      })(el, to, dec, suf);
    }
  };

  /* ---------------- 6. 顶部滚动进度 ---------------- */
  fx.scrollBar = function () {
    if (document.querySelector('.fx-prog')) return;
    var d = document.createElement('div');
    d.className = 'fx-prog';
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:fixed;left:0;top:0;height:3px;z-index:99;width:0;pointer-events:none;' +
      'background:linear-gradient(90deg,var(--brand),var(--teal),var(--violet));transition:width .12s linear';
    document.body.appendChild(d);
    function upd() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      d.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + '%';
    }
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  };

  /* ---------------- 7. 悬浮操作坞 ---------------- */
  fx.dock = function (items) {
    if (!items || !items.length || document.querySelector('.dock')) return;
    var d = document.createElement('div');
    d.className = 'dock';
    d.innerHTML = items.map(function (it) {
      return '<a class="gbtn gbtn-sm" href="' + it.href + '">' +
        (it.ico ? '<span class="gbtn-ico">' + it.ico + '</span>' : '') +
        '<span>' + WB.esc(it.label) + '</span></a>';
    }).join('');
    document.body.appendChild(d);
    requestAnimationFrame(function () { d.classList.add('on'); });
    // 滚过一屏后出现
    function toggle() { d.classList.toggle('on', window.scrollY > 260); }
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  };

  /* ---------------- 8. 彩带庆祝 ---------------- */
  fx.confetti = function (n) {
    if (reduce) return;
    n = n || 46;
    var colors = ['#2563eb', '#0d9488', '#e11d48', '#d97706', '#7c3aed', '#0891b2'];
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span');
      s.className = 'confetti';
      s.style.left = Math.random() * 100 + 'vw';
      s.style.background = colors[(Math.random() * colors.length) | 0];
      s.style.animationDuration = (1.9 + Math.random() * 1.7) + 's';
      s.style.animationDelay = (Math.random() * .5) + 's';
      s.style.opacity = .85;
      document.body.appendChild(s);
      (function (el) { setTimeout(function () { el.remove(); }, 4200); })(s);
    }
  };

  /* ---------------- 9. 卡片 3D 倾斜 ---------------- */
  fx.tilt = function (root) {
    if (reduce) return;
    root = root || document;
    var els = root.querySelectorAll('[data-tilt]:not([data-tilted])');
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        el.setAttribute('data-tilted', '1');
        var max = parseFloat(el.getAttribute('data-tilt')) || 6;
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - .5;
          var py = (e.clientY - r.top) / r.height - .5;
          el.style.transform = 'perspective(900px) rotateY(' + (px * max) + 'deg) rotateX(' + (-py * max) + 'deg) translateY(-4px)';
        }, { passive: true });
        el.addEventListener('mouseleave', function () { el.style.transform = ''; });
      })(els[i]);
    }
  };

  /* ---------------- 10. 打字机 ---------------- */
  fx.typewriter = function (el, texts, opt) {
    opt = opt || {};
    var speed = opt.speed || 68, pause = opt.pause || 1500;
    if (reduce) { el.textContent = texts[0] || ''; return; }
    var i = 0, j = 0, del = false;
    (function tick() {
      var cur = texts[i % texts.length];
      if (!del) {
        el.textContent = cur.slice(0, ++j);
        if (j >= cur.length) { del = true; return setTimeout(tick, pause); }
        return setTimeout(tick, speed);
      }
      el.textContent = cur.slice(0, --j);
      if (j <= 0) { del = false; i++; return setTimeout(tick, 320); }
      setTimeout(tick, speed / 2.4);
    })();
  };

  /* ---------------- 11. 一键初始化 ---------------- */
  fx.init = function (opts) {
    opts = opts || {};
    fx.aurora();
    fx.scrollBar();
    fx.ripple(document);
    fx.spotlight(document);
    fx.autoCount(document);
    fx.reveal(document);
    fx.tilt(document);
    if (opts.dock) fx.dock(opts.dock);
  };

  /** 内容动态插入后调用，重新绑定特效 */
  fx.refresh = function () {
    fx.spotlight(document);
    fx.reveal(document);
    fx.autoCount(document);
    fx.tilt(document);
  };
})();
