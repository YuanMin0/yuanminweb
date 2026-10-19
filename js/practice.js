/* ==========================================================================
   资料练习模式 · 交互逻辑
   数据：window.__PRACTICE = [{ q: '题干', o: ['A 项', 'B 项'], a: 2 }, ...]
   ========================================================================== */
(function () {
  'use strict';

  var DATA = window.__PRACTICE || [];
  var pane = document.getElementById('paneQuiz');
  if (!DATA.length || !pane) return;

  var LETTER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  var st = {
    order: DATA.map(function (_, i) { return i; }),
    pos: 0,
    picked: {},          // qi -> 选中的下标
    right: 0,
    wrong: [],
    finished: false
  };

  /* ---------------- 骨架 ---------------- */
  pane.innerHTML =
    '<div class="qp">' +
      '<div class="qp-head">' +
        '<div class="qp-bar"><i id="qpFill"></i></div>' +
        '<div class="qp-meta">' +
          '<span><b id="qpIdx">1</b> / <span id="qpTot"></span></span>' +
          '<span class="ok">✓ <b id="qpOk">0</b></span>' +
          '<span class="no">✗ <b id="qpNo">0</b></span>' +
        '</div>' +
      '</div>' +
      '<div class="qcard" id="qcard">' +
        '<div class="q-num">QUESTION <span id="qNo">1</span></div>' +
        '<div class="q-stem" id="qStem"></div>' +
        '<div class="q-opts" id="qOpts"></div>' +
        '<div class="q-fb" id="qFb"></div>' +
      '</div>' +
      '<div class="qp-actions">' +
        '<button class="gbtn" id="qPrev">← 上一题</button>' +
        '<span class="qp-hint">按 <kbd>A</kbd>–<kbd>E</kbd> 选择 · <kbd>Enter</kbd> 下一题</span>' +
        '<button class="gbtn gbtn-primary" id="qNext">下一题 →</button>' +
      '</div>' +
    '</div>' +
    '<div class="qdone hide" id="qDone"></div>';

  var el = {
    fill: document.getElementById('qpFill'),
    idx: document.getElementById('qpIdx'),
    tot: document.getElementById('qpTot'),
    ok: document.getElementById('qpOk'),
    no: document.getElementById('qpNo'),
    card: document.getElementById('qcard'),
    no2: document.getElementById('qNo'),
    stem: document.getElementById('qStem'),
    opts: document.getElementById('qOpts'),
    fb: document.getElementById('qFb'),
    prev: document.getElementById('qPrev'),
    next: document.getElementById('qNext'),
    done: document.getElementById('qDone'),
    wrap: document.querySelector('.qp')
  };
  el.tot.textContent = DATA.length;

  /* ---------------- 渲染 ---------------- */
  function cur() { return DATA[st.order[st.pos]]; }
  function curKey() { return st.order[st.pos]; }

  function render() {
    var q = cur();
    var qi = curKey();

    el.idx.textContent = st.pos + 1;
    el.no2.textContent = st.pos + 1;
    el.fill.style.width = ((st.pos) / DATA.length * 100) + '%';

    el.stem.innerHTML = esc(q.q);
    el.opts.innerHTML = q.o.map(function (t, i) {
      return '<button class="q-opt" data-i="' + i + '">' +
        '<span class="badge">' + LETTER[i] + '</span><span>' + esc(t) + '</span>' +
        '</button>';
    }).join('');

    el.fb.className = 'q-fb';
    el.fb.textContent = '';

    el.card.classList.remove('enter', 'shake', 'pop');
    void el.card.offsetWidth;
    el.card.classList.add('enter');

    var picked = st.picked[qi];
    if (picked !== undefined) lock(picked, true);

    el.prev.disabled = st.pos === 0;
    el.prev.style.opacity = st.pos === 0 ? .45 : 1;
    el.next.textContent = st.pos === DATA.length - 1 ? '查看结果 →' : '下一题 →';
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function lock(pick, silent) {
    var q = cur();
    var btns = el.opts.querySelectorAll('.q-opt');
    btns.forEach(function (b, i) {
      b.classList.add('locked');
      if (i === q.a) b.classList.add('right');
      else if (i === pick) b.classList.add('wrong');
      else b.classList.add('dim');
    });

    var ok = pick === q.a;
    el.fb.className = 'q-fb on ' + (ok ? 'ok' : 'no');
    el.fb.innerHTML = ok
      ? '<b>✓ 回答正确</b>　正确答案：' + LETTER[q.a]
      : '<b>✗ 回答错误</b>　你选了 ' + LETTER[pick] + '，正确答案：<b>' + LETTER[q.a] + '</b>';

    if (!silent) {
      if (ok) {
        el.card.classList.add('pop');
        spark(btns[pick]);
      } else {
        el.card.classList.add('shake');
      }
    }
  }

  function pick(i) {
    var qi = curKey();
    if (st.picked[qi] !== undefined) return;
    st.picked[qi] = i;
    if (i === cur().a) st.right++;
    else st.wrong.push(qi);

    el.ok.textContent = st.right;
    el.no.textContent = st.wrong.length;
    lock(i, false);
  }

  /* ---------------- 粒子 ---------------- */
  function spark(node) {
    if (!node) return;
    var r = node.getBoundingClientRect();
    var cx = r.left + 40, cy = r.top + r.height / 2;
    var colors = ['#2563eb', '#14b8a6', '#8b5cf6', '#f59e0b'];
    for (var i = 0; i < 14; i++) {
      var d = document.createElement('i');
      d.className = 'spark';
      var ang = Math.random() * Math.PI * 2;
      var dist = 40 + Math.random() * 70;
      d.style.left = cx + 'px';
      d.style.top = cy + 'px';
      d.style.background = colors[i % colors.length];
      d.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      d.style.setProperty('--dy', Math.sin(ang) * dist - 30 + 'px');
      document.body.appendChild(d);
      setTimeout(function (n) { return function () { n.remove(); }; }(d), 760);
    }
  }

  /* ---------------- 导航 ---------------- */
  function next() {
    if (st.pos < DATA.length - 1) { st.pos++; render(); scrollTop(); return; }
    finish();
  }
  function prev() {
    if (st.pos > 0) { st.pos--; render(); scrollTop(); }
  }
  function scrollTop() {
    var y = pane.getBoundingClientRect().top + window.scrollY - 90;
    if (window.scrollY > y + 40) window.scrollTo({ top: y, behavior: 'smooth' });
  }

  function finish() {
    st.finished = true;
    var total = Object.keys(st.picked).length;
    var pct = total ? Math.round(st.right / total * 100) : 0;
    var C = 2 * Math.PI * 62;
    el.wrap.classList.add('hide');
    el.done.classList.remove('hide');
    el.done.innerHTML =
      '<div class="ring">' +
        '<svg width="148" height="148">' +
          '<circle cx="74" cy="74" r="62" fill="none" stroke="var(--surface-3)" stroke-width="12"/>' +
          '<circle cx="74" cy="74" r="62" fill="none" stroke="url(#g1)" stroke-width="12" ' +
            'stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '" id="ringFg"/>' +
          '<defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#8b5cf6"/>' +
          '</linearGradient></defs>' +
        '</svg>' +
        '<div class="val" id="ringVal">0%</div>' +
      '</div>' +
      '<h3>' + (pct >= 85 ? '🎉 掌握得不错' : pct >= 60 ? '👍 再巩固一下' : '📚 建议回头看看原文') + '</h3>' +
      '<p>已作答 ' + total + ' 题 · 正确 <b>' + st.right + '</b> 题 · 错误 <b>' + st.wrong.length + '</b> 题</p>' +
      '<div class="acts">' +
        '<button class="gbtn" id="qAgain">重做全部</button>' +
        (st.wrong.length ? '<button class="gbtn gbtn-primary" id="qWrong">只做错题（' + st.wrong.length + '）</button>' : '') +
      '</div>';

    var fg = document.getElementById('ringFg');
    var val = document.getElementById('ringVal');
    setTimeout(function () {
      fg.style.transition = 'stroke-dashoffset 1s cubic-bezier(.2,.8,.3,1)';
      fg.style.strokeDashoffset = String(C * (1 - pct / 100));
    }, 60);
    var t0 = performance.now();
    (function tick() {
      var k = Math.min(1, (performance.now() - t0) / 900);
      val.textContent = Math.round(pct * (1 - Math.pow(1 - k, 3))) + '%';
      if (k < 1) requestAnimationFrame(tick);
    })();

    var again = document.getElementById('qAgain');
    if (again) again.addEventListener('click', function () { reset(); });
    var wrongBtn = document.getElementById('qWrong');
    if (wrongBtn) wrongBtn.addEventListener('click', function () { reset(st.wrong.slice()); });
  }

  function reset(list) {
    st.order = list && list.length ? list : DATA.map(function (_, i) { return i; });
    st.pos = 0; st.picked = {}; st.right = 0; st.wrong = []; st.finished = false;
    el.ok.textContent = '0'; el.no.textContent = '0';
    el.done.classList.add('hide');
    el.done.innerHTML = '';
    el.wrap.classList.remove('hide');
    render();
  }

  /* ---------------- 事件 ---------------- */
  el.opts.addEventListener('click', function (e) {
    var b = e.target.closest('.q-opt');
    if (!b || b.classList.contains('locked')) return;
    pick(+b.getAttribute('data-i'));
  });
  el.next.addEventListener('click', next);
  el.prev.addEventListener('click', prev);

  document.addEventListener('keydown', function (e) {
    if (document.getElementById('paneQuiz').classList.contains('hide')) return;
    if (/input|textarea/i.test(e.target.tagName)) return;
    var k = e.key.toUpperCase();
    var i = LETTER.indexOf(k);
    if (i > -1 && i < cur().o.length) { pick(i); e.preventDefault(); return; }
    if (e.key === 'Enter' || e.key === 'ArrowRight') { next(); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { prev(); e.preventDefault(); }
  });

  render();
})();
