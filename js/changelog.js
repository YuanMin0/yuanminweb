/* ==========================================================================
   更新公告浮层
   用法：<script src="data/changelog.js"></script><script src="js/changelog.js"></script>
   首次进入自动弹出（同一版本只弹一次）；页脚「更新日志」可随时重看。
   ========================================================================== */
(function () {
  'use strict';

  var LIST = window.CHANGELOG || [];
  if (!LIST.length) return;

  var K_SEEN = 'medilearn.cl.seen';     // 已读版本号
  var K_DAY = 'medilearn.cl.day';       // 上次自动弹出的日期
  var K_OFF = 'medilearn.cl.off';       // 用户勾了「不再自动弹出」
  var TAG = { new: ['新增', 'new'], fix: ['修复', 'fix'], opt: ['优化', 'opt'] };

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var mask = null;

  function build() {
    var latest = LIST[0];
    var older = LIST.slice(1);
    var groups = { new: [], opt: [], fix: [] };
    latest.items.forEach(function (it) {
      (groups[it.t] || groups.new).push(it.text);
    });

    function block(t, title, arr) {
      if (!arr.length) return '';
      return '<div class="cl-group">' +
        '<div class="cl-gt"><span class="cl-dot cl-' + t + '"></span>' + title + '</div>' +
        arr.map(function (x, i) {
          return '<div class="cl-item" style="--i:' + i + '">' + esc(x) + '</div>';
        }).join('') +
        '</div>';
    }

    var hist = older.length
      ? '<details class="cl-more"><summary>查看历史版本（' + older.length + '）</summary>' +
        older.map(function (h) {
          return '<div class="cl-hist"><b>' + esc(h.v) + '</b> · ' + esc(h.date) +
            '　' + esc(h.title) + '</div>';
        }).join('') + '</details>'
      : '';

    mask = document.createElement('div');
    mask.className = 'cl-mask';
    mask.innerHTML =
      '<div class="cl-box" role="dialog" aria-modal="true" aria-label="更新公告">' +
        '<div class="cl-top">' +
          '<span class="cl-ver">' + esc(latest.v) + '</span>' +
          '<span class="cl-date">' + esc(latest.date) + '</span>' +
          '<button class="cl-x" aria-label="关闭">✕</button>' +
        '</div>' +
        '<h3 class="cl-title">' + esc(latest.title) + '</h3>' +
        (latest.sub ? '<p class="cl-sub">' + esc(latest.sub) + '</p>' : '') +
        '<div class="cl-body">' +
          block('new', '新增', groups.new) +
          block('opt', '优化', groups.opt) +
          block('fix', '修复', groups.fix) +
          hist +
        '</div>' +
        '<div class="cl-foot">' +
          '<label class="cl-never"><input type="checkbox" id="clNever"> 以后不再自动弹出</label>' +
          '<button class="gbtn gbtn-primary" id="clOk">知道了</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(mask);
    requestAnimationFrame(function () { mask.classList.add('on'); });
    setTimeout(function () { mask.classList.add('on'); }, 30);

    mask.querySelector('.cl-x').addEventListener('click', close);
    mask.querySelector('#clOk').addEventListener('click', close);
    mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mask && mask.classList.contains('on')) close();
    });
  }

  function close() {
    if (!mask) return;
    var never = document.getElementById('clNever');
    if (never && never.checked) lsSet(K_OFF, '1');
    lsSet(K_SEEN, LIST[0].v);
    mask.classList.remove('on');
    setTimeout(function () { if (mask) { mask.remove(); mask = null; } }, 200);
  }

  function open() {
    if (!mask) build();
    else mask.classList.add('on');
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function autoShow() {
    // 只在首页自动弹；其他页面保留页脚入口
    var path = location.pathname;
    var isHome = path === '/' || /\/index\.html$/.test(path) || /\/$/.test(path);
    if (!isHome) return;

    if (ls(K_OFF) === '1') return;                 // 用户关掉了自动提示
    if (ls(K_SEEN) === LIST[0].v) return;          // 这一版已经看过
    if (ls(K_DAY) === today()) return;             // 今天已经弹过一次

    lsSet(K_DAY, today());                          // 先记日期，避免刷新重复弹
    setTimeout(open, 700);
  }

  window.WB = window.WB || {};
  window.WB.changelog = { open: open };

  // 页脚入口：给带 data-changelog 的元素绑定点击
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-changelog], a[href="#changelog"]');
    if (!t) return;
    e.preventDefault();
    open();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoShow);
  } else {
    autoShow();
  }
})();
