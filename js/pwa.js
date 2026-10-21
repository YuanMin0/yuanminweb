/* ==========================================================================
   PWA：注册 Service Worker + 安装到桌面
   --------------------------------------------------------------------------
   · 支持 beforeinstallprompt 的浏览器（Chrome / Edge）：直接弹系统安装框
   · iOS Safari：给出「分享 → 添加到主屏幕」的指引
   · 已经装过（standalone）就隐藏所有安装入口
   ========================================================================== */
(function () {
  'use strict';

  var DISMISS_KEY = 'medilearn.pwa.dismiss';
  var DONE_KEY = 'medilearn.pwa.done';   // 装过 / 下过桌面版，永不再提示
  var WEEK = 7 * 24 * 3600 * 1000;

  var deferred = null;                       // beforeinstallprompt 事件
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                   window.navigator.standalone === true;
  var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var bar = null;

  /* ---------------- 注册 SW ---------------- */
  function register() {
    if (!('serviceWorker' in navigator)) return;
    var secure = location.protocol === 'https:' ||
                 /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    if (!secure) return;
    navigator.serviceWorker.register('/sw.js')
      .then(function () { document.documentElement.setAttribute('data-sw', 'on'); })
      .catch(function () { /* 静默失败 */ });
  }

  /* ---------------- 底部提示条 ---------------- */
  function isDone() {
    if (standalone) return true;
    try { return localStorage.getItem(DONE_KEY) === '1'; } catch (e) { return false; }
  }

  function markDone() {
    try { localStorage.setItem(DONE_KEY, '1'); } catch (e) {}
    hideBar();
    document.querySelectorAll('[data-pwa-install]').forEach(function (el) {
      el.style.display = 'none';
    });
  }

  function dismissedRecently() {
    try { return Date.now() - (+localStorage.getItem(DISMISS_KEY) || 0) < WEEK; } catch (e) { return false; }
  }

  function showBar(kind) {
    if (isDone() || bar || dismissedRecently()) return;
    bar = document.createElement('div');
    bar.className = 'pwa-bar';
    bar.innerHTML =
      '<img class="pwa-ico" src="/icons/icon-192.png" alt="" width="36" height="36">' +
      '<div class="pwa-txt">' +
        '<b>把 MediLearn 装到桌面</b>' +
        '<span>' + (kind === 'ios'
          ? '点底部的「分享」按钮，选「添加到主屏幕」'
          : '像 App 一样打开，断网也能看已读过的内容') + '</span>' +
      '</div>' +
      (kind === 'ios' ? '' : '<button class="gbtn gbtn-primary gbtn-sm" id="pwaGo">安装</button>') +
      '<button class="pwa-x" aria-label="关闭">✕</button>';

    document.body.appendChild(bar);
    requestAnimationFrame(function () { bar.classList.add('on'); });

    var x = bar.querySelector('.pwa-x');
    x.addEventListener('click', function () {
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
      hideBar();
    });
    var go = bar.querySelector('#pwaGo');
    if (go) go.addEventListener('click', function () { install(); });
  }

  function hideBar() {
    if (!bar) return;
    bar.classList.remove('on');
    var b = bar;
    bar = null;
    setTimeout(function () { if (b && b.parentNode) b.parentNode.removeChild(b); }, 300);
  }

  /* ---------------- 触发安装 ---------------- */
  function install() {
    if (standalone) {
      if (window.WB && WB.toast) WB.toast('已经在桌面上了');
      return;
    }
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.then(function (r) {
        if (r && r.outcome === 'accepted') hideBar();
        deferred = null;
      });
      return;
    }
    if (isIOS) {
      if (window.WB && WB.toast) WB.toast('Safari：分享 → 添加到主屏幕');
      return;
    }
    if (window.WB && WB.toast) WB.toast('请用 Chrome / Edge 打开，或从浏览器菜单选「安装应用」');
  }

  /* ---------------- 事件 ---------------- */
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    setTimeout(function () { showBar('chrome'); }, 2200);
  });

  window.addEventListener('appinstalled', function () {
    deferred = null;
    markDone();
    if (window.WB && WB.toast) WB.toast('已安装到桌面，以后不再提示');
  });

  /* 页脚 / 任意位置的安装入口 */
  document.addEventListener('click', function (e) {
    /* 点了「下载桌面版」：记下来，以后不再弹 PWA 安装条 */
    if (e.target.closest('[data-desktop-dl]')) { markDone(); return; }
    var t = e.target.closest('[data-pwa-install]');
    if (!t) return;
    e.preventDefault();
    install();
  });

  /* 已经装过：隐藏所有安装入口 */
  function markInstalled() {
    if (!standalone) return;
    document.querySelectorAll('[data-pwa-install]').forEach(function (el) {
      el.style.display = 'none';
    });
  }

  window.WB = window.WB || {};
  window.WB.pwa = {
    install: install,
    markDone: markDone,
    isStandalone: function () { return standalone; },
    isDone: isDone,
    canInstall: function () { return !!deferred; }
  };

  register();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      markInstalled();
      if (isIOS) setTimeout(function () { showBar('ios'); }, 3000);
    });
  } else {
    markInstalled();
    if (isIOS) setTimeout(function () { showBar('ios'); }, 3000);
  }
})();
