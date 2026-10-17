/* ==========================================================================
   MediLearn · 交互式可视化（医学统计学）
   纯 SVG + 原生 JS，无第三方依赖；随主题切换自动变色
   ========================================================================== */
(function () {
  'use strict';
  var WB = window.WB || (window.WB = {});
  var V = WB.viz = {};
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==================== 一、数学工具 ==================== */
  function erf(x) {
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  function Phi(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  function phi(z) { return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI); }

  function lnGamma(x) {
    var g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    var ser = 1.000000000190015;
    for (var j = 0; j < 6; j++) ser += g[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function betacf(a, b, x) {
    var MAXIT = 240, EPS = 3e-12, FPMIN = 1e-300;
    var qab = a + b, qap = a + 1, qam = a - 1;
    var c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; var h = d;
    for (var m = 1; m <= MAXIT; m++) {
      var m2 = 2 * m;
      var aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  function betai(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function tcdf(t, df) {
    var x = df / (df + t * t);
    var p = 0.5 * betai(df / 2, 0.5, x);
    return t > 0 ? 1 - p : p;
  }
  function tpdf(t, df) {
    return Math.exp(lnGamma((df + 1) / 2) - lnGamma(df / 2)) / Math.sqrt(df * Math.PI) *
      Math.pow(1 + t * t / df, -(df + 1) / 2);
  }

  /* ==================== 二、格式化与绘图基件 ==================== */
  function fx(v, d) {
    var n = Math.pow(10, d == null ? 2 : d);
    return String(Math.round(v * n) / n);
  }
  function pct(v, d) { return fx(v * 100, d == null ? 2 : d) + '%'; }
  /* 把坐标轴上界取整成好看的刻度（1/2/2.5/5 × 10^k） */
  function niceMax(max, div) {
    var raw = max / div, mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
    var step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
    return step * div;
  }

  var W = 640, H = 250;
  var INSTANCES = [];

  /* 按容器实际宽度绘制：保证文字在任何屏幕上都是 1:1 像素，不被缩放糊掉。
     宽度做缓存，拖动滑块时不再触发强制布局（这是卡顿的主要来源之一）。 */
  function fitW(box, force) {
    if (!force && box._w) { W = box._w; H = box._h; return; }
    var st = box.querySelector('.viz-stage');
    var w = st ? Math.round(st.getBoundingClientRect().width) : 0;
    if (!w || w < 240) w = 640;
    W = Math.min(w, 900);
    H = W < 420 ? 196 : (W < 560 ? 222 : 250);
    box._w = W; box._h = H;
  }

  /* 把高频的 input 事件合并到一帧里执行；rAF 被节流时用定时器兜底 */
  function raf(fn) {
    var queued = false, args = null, t = null;
    return function () {
      args = arguments;
      if (queued) return;
      queued = true;
      var run = function () {
        if (!queued) return;
        queued = false;
        if (t) { clearTimeout(t); t = null; }
        fn.apply(null, args);
      };
      if (window.requestAnimationFrame) requestAnimationFrame(run);
      t = setTimeout(run, 90);
    };
  }

  /* 坐标映射 */
  function scale(d0, d1, p0, p1) {
    return function (v) { return p0 + (v - d0) / (d1 - d0) * (p1 - p0); };
  }

  /* 贴边标签改用 start/end 对齐，避免被裁切 */
  function anch(x, p0, p1) {
    return x < p0 + 14 ? 'start' : (x > p1 - 14 ? 'end' : 'middle');
  }

  /* 底部 x 轴 + 刻度 */
  function xAxis(o) {
    var s = o.s, y = o.y, ticks = o.ticks, out = '';
    out += '<line class="vz-axis" x1="' + o.pad.l + '" y1="' + y + '" x2="' + (W - o.pad.r) + '" y2="' + y + '"/>';
    ticks.forEach(function (t) {
      var x = s(t.v);
      out += '<line class="vz-tick" x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y + 5) + '"/>';
      out += '<text class="vz-txt" x="' + x + '" y="' + (y + 17) + '" text-anchor="' + anch(x, o.pad.l, W - o.pad.r) + '">' + t.t + '</text>';
    });
    if (o.label) out += '<text class="vz-txt" x="' + (W - o.pad.r) + '" y="' + (y + 30) + '" text-anchor="end">' + o.label + '</text>';
    return out;
  }

  /* 曲线路径 */
  function curvePath(s, fy, f, d0, d1, n) {
    n = n || 220;
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var x = d0 + (d1 - d0) * i / n;
      pts.push((i ? 'L' : 'M') + fx(s(x), 2) + ' ' + fx(fy(f(x)), 2));
    }
    return pts.join(' ');
  }

  /* 区域填充（曲线下介于 a、b 之间） */
  function areaPath(s, fy, f, a, b, base, n) {
    n = n || 160;
    var pts = ['M' + fx(s(a), 2) + ' ' + fx(base, 2)];
    for (var i = 0; i <= n; i++) {
      var x = a + (b - a) * i / n;
      pts.push('L' + fx(s(x), 2) + ' ' + fx(fy(f(x)), 2));
    }
    pts.push('L' + fx(s(b), 2) + ' ' + fx(base, 2) + ' Z');
    return pts.join(' ');
  }

  /* ==================== 三、控件基件 ==================== */
  function row(label, min, max, step, val, unit, onInput) {
    var el = document.createElement('label');
    el.className = 'vz-row';
    var dec = step < 1 ? (String(step).split('.')[1] || '').length : 0;
    el.innerHTML = '<span class="vz-lab">' + label + '</span>' +
      '<input type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '">' +
      '<span class="vz-val"></span>';
    var inp = el.querySelector('input'), out = el.querySelector('.vz-val');
    function paint() { out.textContent = fx(+inp.value, dec) + (unit || ''); }
    inp.addEventListener('input', function () { paint(); onInput(+inp.value); });
    paint();
    return el;
  }

  function seg(items, active, onPick) {
    var el = document.createElement('div');
    el.className = 'vz-seg';
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'vz-segbtn' + (it.v === active ? ' on' : '');
      b.textContent = it.t;
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(el.children, function (c) { c.classList.remove('on'); });
        b.classList.add('on');
        onPick(it.v);
      });
      el.appendChild(b);
    });
    return el;
  }

  function shell(o) {
    var box = document.createElement('div');
    box.className = 'viz';
    box.innerHTML =
      '<div class="viz-hd">' +
        '<span class="viz-dot"></span><b class="viz-title">' + o.title + '</b>' +
        (o.tag ? '<span class="viz-tag">' + o.tag + '</span>' : '') +
      '</div>' +
      (o.desc ? '<div class="viz-desc">' + o.desc + '</div>' : '') +
      '<div class="viz-stage"></div>' +
      '<div class="viz-ctl"></div>' +
      '<div class="viz-out"></div>';
    return box;
  }

  /* 只更新 <svg> 的子内容，节点本身复用：
     避免每次拖动都重建 DOM、重放入场动画（原来会闪一下，看起来卡） */
  function paint(box, inner) {
    var st = box.querySelector('.viz-stage');
    var svg = st.firstChild;
    if (!svg || svg.tagName.toLowerCase() !== 'svg') {
      st.innerHTML = '<svg class="vz-svg" preserveAspectRatio="xMidYMid meet" role="img"></svg>';
      svg = st.firstChild;
      var tt = box.querySelector('.viz-title');
      svg.setAttribute('aria-label', (tt ? tt.textContent : '统计图') + '（交互式图表）');
      if (!REDUCED) svg.style.animation = 'vzIn .34s cubic-bezier(.4,0,.2,1) both';
    }
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = inner;
  }

  function out(box, html) { box.querySelector('.viz-out').innerHTML = html; }
  function kv(k, v, tone) {
    return '<div class="vz-kv' + (tone ? ' ' + tone : '') + '"><span>' + k + '</span><b>' + v + '</b></div>';
  }

  /* ==================== 四、组件 1：频数分布直方图 ==================== */
  V.hist = function (box) {
    var FREQ = [2, 3, 9, 14, 22, 30, 21, 15, 10, 6, 4, 2];
    var START = 3.07, STEP = 0.2, N = 138;
    var merge = 1, mode = 'f';

    var ui = shell({
      title: '频数分布直方图 · 组距怎么定',
      tag: '拖动试试',
      desc: '同一批 138 名正常成年女子的红细胞数据，组距由 0.2 改为 0.4、0.6 后，图形会怎样变化？'
    });
    box.appendChild(ui);

    var ctl = ui.querySelector('.viz-ctl');
    var segMerge = seg([{ v: 1, t: '组距 0.2' }, { v: 2, t: '组距 0.4' }, { v: 3, t: '组距 0.6' }], 1, function (v) { merge = v; draw(); });
    var segMode = seg([{ v: 'f', t: '纵轴：频数' }, { v: 'd', t: '纵轴：频率密度' }], 'f', function (v) { mode = v; draw(); });
    ctl.appendChild(segMerge);
    ctl.appendChild(segMode);

    function draw() {
      fitW(ui);
      var bins = [], i, j;
      for (i = 0; i < FREQ.length; i += merge) {
        var c = 0;
        for (j = i; j < Math.min(i + merge, FREQ.length); j++) c += FREQ[j];
        bins.push({ x0: START + i * STEP, x1: START + Math.min(i + merge, FREQ.length) * STEP, f: c, iw: STEP * merge });
      }
      var vals = bins.map(function (b) { return mode === 'f' ? b.f : b.f / N / b.iw; });
      var maxV = Math.max.apply(null, vals);
      var yMax = niceMax(maxV * 1.1, 4);
      var pad = { l: 48, r: 16, t: 18, b: 44 };
      var s = scale(START, START + STEP * FREQ.length, pad.l, W - pad.r);
      var fy = scale(0, yMax, H - pad.b, pad.t);
      var base = H - pad.b;

      var g = '<g class="vz-anim">';
      /* 网格与 y 轴刻度 */
      for (var t = 0; t <= 4; t++) {
        var yv = yMax * t / 4, y = fy(yv);
        g += '<line class="vz-grid" x1="' + pad.l + '" y1="' + y + '" x2="' + (W - pad.r) + '" y2="' + y + '"/>';
        g += '<text class="vz-txt" x="' + (pad.l - 8) + '" y="' + (y + 3.5) + '" text-anchor="end">' + fx(yv, yMax < 1 ? 2 : (yMax < 10 ? 1 : 0)) + '</text>';
      }
      /* 直条：无间隔、等宽 */
      bins.forEach(function (b) {
        var x = s(b.x0), w = s(b.x1) - s(b.x0);
        var v = mode === 'f' ? b.f : b.f / N / b.iw;
        var y = fy(v), hgt = base - y;
        g += '<rect class="vz-bar" x="' + fx(x + 0.5, 2) + '" y="' + fx(y, 2) + '" width="' + fx(Math.max(w - 1, 1), 2) + '" height="' + fx(hgt, 2) + '" rx="1.5"/>';
        if (w > 30) g += '<text class="vz-txt vz-txt-b" x="' + fx(x + w / 2, 2) + '" y="' + fx(y - 6, 2) + '" text-anchor="middle">' + (mode === 'f' ? b.f : fx(v, 2)) + '</text>';
      });
      /* 均数参考线 */
      var xm = s(4.23);
      g += '<line class="vz-ref" x1="' + xm + '" y1="' + pad.t + '" x2="' + xm + '" y2="' + base + '"/>';
      g += '<text class="vz-txt vz-txt-b" x="' + (xm + 5) + '" y="' + (pad.t + 12) + '">X̄ = 4.23</text>';
      /* x 轴 */
      g += xAxis({ s: s, y: base, pad: pad, ticks: [3.07, 3.67, 4.27, 4.87, 5.47].map(function (v) { return { v: v, t: fx(v, 2) }; }), label: '红细胞数（×10¹²/L）' });
      g += '</g>';

      paint(ui, g);
      out(ui,
        kv('组段数', bins.length + ' 组') +
        kv('组距 i', fx(STEP * merge, 1)) +
        kv('最高组段', fx(bins.reduce(function (a, b) { return b.f > a.f ? b : a; }, bins[0]).x0, 2) + '~') +
        '<div class="vz-note">组段太少会掩盖分布特征，太多则各组频数过少、规律不明显——教材建议 <b>8～15 组</b>。' +
        (merge === 1 ? '当前 12 组，形态最清楚。' : merge === 2 ? '当前 6 组，已低于建议范围，细节被抹平。' : '当前 4 组，集中趋势仍可见，但分布形态已失真。') + '</div>'
      );
    }
    ui._draw = draw;
    draw();
    draw = raf(draw);
  };

  /* ==================== 五、组件 2：正态曲线 μ 与 σ ==================== */
  V.normal = function (box) {
    var mu = 4.23, sd = 0.45, k = 1.96;
    var ui = shell({
      title: '正态分布：μ 定位置，σ 定胖瘦',
      tag: '拖动试试',
      desc: '拖动 μ 与 σ，观察曲线如何平移与伸缩；再切换阴影带，注意面积比例始终不变。'
    });
    box.appendChild(ui);

    var ctl = ui.querySelector('.viz-ctl');
    ctl.appendChild(row('μ 均数', 2, 8, 0.01, mu, '', function (v) { mu = v; draw(); }));
    ctl.appendChild(row('σ 标准差', 0.3, 1.6, 0.05, sd, '', function (v) { sd = v; draw(); }));
    ctl.appendChild(seg([{ v: 1, t: 'μ±1σ' }, { v: 1.96, t: 'μ±1.96σ' }, { v: 2.58, t: 'μ±2.58σ' }], 1.96, function (v) { k = v; draw(); }));

    function draw() {
      fitW(ui);
      var d0 = 0, d1 = 10, pad = { l: 16, r: 16, t: 16, b: 40 };
      var s = scale(d0, d1, pad.l, W - pad.r);
      var f = function (x) { return phi((x - mu) / sd) / sd; };
      var peak = phi(0) / sd;
      var fy = scale(0, peak * 1.12, H - pad.b, pad.t);
      var base = H - pad.b;
      var a = mu - k * sd, b = mu + k * sd;
      var area = Phi(k) - Phi(-k);

      var g = '<g class="vz-anim">';
      g += '<line class="vz-axis" x1="' + pad.l + '" y1="' + base + '" x2="' + (W - pad.r) + '" y2="' + base + '"/>';
      g += '<path class="vz-area" d="' + areaPath(s, fy, f, Math.max(a, d0), Math.min(b, d1), base) + '"/>';
      g += '<path class="vz-curve" d="' + curvePath(s, fy, f, d0, d1) + '"/>';
      g += '<line class="vz-ref" x1="' + s(mu) + '" y1="' + pad.t + '" x2="' + s(mu) + '" y2="' + base + '"/>';
      g += '<text class="vz-txt vz-txt-b" x="' + s(mu) + '" y="' + (pad.t + 11) + '" text-anchor="middle">μ</text>';
      [[a, 'μ−' + k + 'σ'], [b, 'μ+' + k + 'σ']].forEach(function (p) {
        if (p[0] < d0 || p[0] > d1) return;
        g += '<line class="vz-dash" x1="' + s(p[0]) + '" y1="' + fy(peak * 0.42) + '" x2="' + s(p[0]) + '" y2="' + base + '"/>';
      });
      var crowd = (s(mu) - s(a) < 34) || (s(b) - s(mu) < 34);
      var yA = base + (crowd ? 29 : 17);
      g += '<text class="vz-txt" x="' + s(mu) + '" y="' + (base + 17) + '" text-anchor="' + anch(s(mu), pad.l, W - pad.r) + '">' + fx(mu, 2) + '</text>';
      g += '<text class="vz-txt" x="' + s(a) + '" y="' + yA + '" text-anchor="' + anch(s(a), pad.l, W - pad.r) + '">' + fx(a, 2) + '</text>';
      g += '<text class="vz-txt" x="' + s(b) + '" y="' + yA + '" text-anchor="' + anch(s(b), pad.l, W - pad.r) + '">' + fx(b, 2) + '</text>';
      g += '<text class="vz-txt vz-txt-b" x="' + s(mu) + '" y="' + (fy(peak * 0.42) - 6) + '" text-anchor="middle">' + pct(area, 2) + '</text>';
      g += '</g>';

      paint(ui, g);
      out(ui,
        kv('区间', fx(a, 2) + ' ~ ' + fx(b, 2)) +
        kv('曲线下面积', pct(area, 2), 'ok') +
        kv('峰值', fx(peak, 3)) +
        '<div class="vz-note">μ 只改变曲线的<b>位置</b>，σ 只改变曲线的<b>胖瘦</b>；无论 μ、σ 取何值，' +
        '曲线与横轴围成的总面积恒为 1，μ±1σ 内恒为 68.27%，μ±1.96σ 内恒为 95.00%，μ±2.58σ 内恒为 99.00%。</div>'
      );
    }
    ui._draw = draw;
    draw();
    draw = raf(draw);
  };

  /* ==================== 六、组件 3：u 变换 ==================== */
  V.u = function (box) {
    var x = 4.0, mu = 4.23, sd = 0.45;
    var ui = shell({
      title: '标准化变换 u = (X − μ) / σ',
      tag: '算一算',
      desc: '把任意正态分布换算成标准正态分布，再用 u 值查面积。拖动 X，看阴影面积怎么变。'
    });
    box.appendChild(ui);

    var ctl = ui.querySelector('.viz-ctl');
    ctl.appendChild(row('观察值 X', 2.4, 6.2, 0.01, x, '', function (v) { x = v; draw(); }));
    ctl.appendChild(row('μ', 3, 5.5, 0.01, mu, '', function (v) { mu = v; draw(); }));
    ctl.appendChild(row('σ', 0.2, 1.2, 0.01, sd, '', function (v) { sd = v; draw(); }));

    function draw() {
      fitW(ui);
      var u = (x - mu) / sd;
      var left = Phi(u);
      var d0 = -4, d1 = 4, pad = { l: 16, r: 16, t: 16, b: 42 };
      var s = scale(d0, d1, pad.l, W - pad.r);
      var fy = scale(0, phi(0) * 1.14, H - pad.b, pad.t);
      var base = H - pad.b;
      var uu = Math.max(d0, Math.min(d1, u));

      var g = '<g class="vz-anim">';
      g += '<path class="vz-area" d="' + areaPath(s, fy, phi, d0, uu, base) + '"/>';
      g += '<path class="vz-curve" d="' + curvePath(s, fy, phi, d0, d1) + '"/>';
      g += '<line class="vz-axis" x1="' + pad.l + '" y1="' + base + '" x2="' + (W - pad.r) + '" y2="' + base + '"/>';
      [-3, -2, -1, 0, 1, 2, 3].forEach(function (t) {
        g += '<line class="vz-tick" x1="' + s(t) + '" y1="' + base + '" x2="' + s(t) + '" y2="' + (base + 5) + '"/>';
        g += '<text class="vz-txt" x="' + s(t) + '" y="' + (base + 17) + '" text-anchor="middle">' + t + '</text>';
      });
      g += '<line class="vz-ref vz-ref-bad" x1="' + s(uu) + '" y1="' + pad.t + '" x2="' + s(uu) + '" y2="' + base + '"/>';
      g += '<circle class="vz-dot" cx="' + s(uu) + '" cy="' + fy(phi(uu)) + '" r="4.5"/>';
      g += '<text class="vz-txt vz-txt-b" x="' + s(uu) + '" y="' + (pad.t + 10) + '" text-anchor="middle">u = ' + fx(u, 2) + '</text>';
      g += '<text class="vz-txt" x="' + pad.l + '" y="' + (H - 6) + '">左侧面积 ' + pct(left, 2) + '　｜　右侧面积 ' + pct(1 - left, 2) + '</text>';
      g += '</g>';

      paint(ui, g);
      out(ui,
        kv('u = (X − μ)/σ', '(' + fx(x, 2) + ' − ' + fx(mu, 2) + ') / ' + fx(sd, 2) + ' = ' + fx(u, 2), 'ok') +
        kv('Φ(u)：小于 X 的比例', pct(left, 2)) +
        kv('大于 X 的比例', pct(1 - left, 2)) +
        '<div class="vz-note">教材例：138 名女子红细胞 μ = 4.23、σ = 0.45。求 4.0 以下者所占百分比，u = (4.0 − 4.23)/0.45 ≈ −0.51，查表 Φ(−0.51) = 30.5%。' +
        (Math.abs(u + 0.51) < 0.06 ? ' <b>当前取值正对应这道例题。</b>' : '') + '</div>'
      );
    }
    ui._draw = draw;
    draw();
    draw = raf(draw);
  };

  /* ==================== 七、组件 4：医学参考值范围 ==================== */
  V.ref = function (box) {
    var mu = 4.23, sd = 0.45, side = 'two', lv = 0.95;
    var ui = shell({
      title: '医学参考值范围：单双侧与百分界值',
      tag: '切换看看',
      desc: '同一组数据，选双侧还是单侧、取 95% 还是 99%，切出来的界值完全不同。'
    });
    box.appendChild(ui);

    var ctl = ui.querySelector('.viz-ctl');
    ctl.appendChild(row('μ', 3, 6, 0.01, mu, '', function (v) { mu = v; draw(); }));
    ctl.appendChild(row('σ', 0.2, 1.2, 0.05, sd, '', function (v) { sd = v; draw(); }));
    ctl.appendChild(seg([{ v: 'two', t: '双侧' }, { v: 'up', t: '单侧上限' }, { v: 'low', t: '单侧下限' }], 'two', function (v) { side = v; draw(); }));
    ctl.appendChild(seg([{ v: 0.9, t: '90%' }, { v: 0.95, t: '95%' }, { v: 0.99, t: '99%' }], 0.95, function (v) { lv = v; draw(); }));

    function zOf(p) {
      /* 二分法反解 Φ(z) = p */
      var lo = -6, hi = 6, mid = 0;
      for (var i = 0; i < 90; i++) { mid = (lo + hi) / 2; if (Phi(mid) < p) lo = mid; else hi = mid; }
      return mid;
    }

    function draw() {
      fitW(ui);
      var tail = 1 - lv;
      var zTwo = zOf(1 - tail / 2), zOne = zOf(lv);
      var a = side === 'two' ? mu - zTwo * sd : (side === 'up' ? -Infinity : mu - zOne * sd);
      var b = side === 'two' ? mu + zTwo * sd : (side === 'up' ? mu + zOne * sd : Infinity);
      var zUsed = side === 'two' ? zTwo : zOne;

      var d0 = mu - 4.1 * sd, d1 = mu + 4.1 * sd;
      var pad = { l: 16, r: 16, t: 16, b: 42 };
      var s = scale(d0, d1, pad.l, W - pad.r);
      var f = function (x) { return phi((x - mu) / sd) / sd; };
      var peak = phi(0) / sd;
      var fy = scale(0, peak * 1.14, H - pad.b, pad.t);
      var base = H - pad.b;

      var g = '<g class="vz-anim">';
      var pa = Math.max(d0, Math.min(d1, a === -Infinity ? d0 : a));
      var pb = Math.max(d0, Math.min(d1, b === Infinity ? d1 : b));
      g += '<path class="vz-area" d="' + areaPath(s, fy, f, pa, pb, base) + '"/>';
      g += '<path class="vz-curve" d="' + curvePath(s, fy, f, d0, d1) + '"/>';
      g += '<line class="vz-axis" x1="' + pad.l + '" y1="' + base + '" x2="' + (W - pad.r) + '" y2="' + base + '"/>';
      [pa, pb].forEach(function (v, i) {
        if (!isFinite(i === 0 ? a : b)) return;
        g += '<line class="vz-dash" x1="' + s(v) + '" y1="' + fy(peak * 0.4) + '" x2="' + s(v) + '" y2="' + base + '"/>';
        g += '<text class="vz-txt vz-txt-b" x="' + s(v) + '" y="' + (base + 17) + '" text-anchor="' + anch(s(v), pad.l, W - pad.r) + '">' + fx(v, 2) + '</text>';
      });
      g += '<text class="vz-txt vz-txt-b" x="' + (W / 2) + '" y="' + (pad.t + 12) + '" text-anchor="middle">阴影 = ' + Math.round(lv * 100) + '% 的正常人</text>';
      g += '</g>';

      paint(ui, g);

      var formula, range;
      if (side === 'two') {
        formula = 'X̄ ± u<sub>' + fx(zTwo, 3) + '</sub> · S';
        range = fx(a, 2) + ' ~ ' + fx(b, 2);
      } else if (side === 'up') {
        formula = 'X̄ + u<sub>' + fx(zOne, 3) + '</sub> · S （上限）';
        range = '< ' + fx(b, 2);
      } else {
        formula = 'X̄ − u<sub>' + fx(zOne, 3) + '</sub> · S （下限）';
        range = '> ' + fx(a, 2);
      }
      out(ui,
        kv('界值 u', fx(zUsed, 3), 'ok') +
        kv('范围', range) +
        kv('公式', formula) +
        '<div class="vz-note">双侧 95% 用 u = 1.96；单侧 95% 用 u = 1.645。<b>只有单侧界值才用 1.645</b>，这是最常考的一处混淆。' +
        '判断顺序：先看分布（正态用正态法、偏态用百分位数法），再看单双侧（过高异常取上限、过低异常取下限）。</div>'
      );
    }
    ui._draw = draw;
    draw();
    draw = raf(draw);
  };

  /* ==================== 八、组件 5：标准误与样本量 ==================== */
  V.sem = function (box) {
    var n = 5, sigma = 4, mu = 176;
    var ui = shell({
      title: '标准误：样本量越大，抽样误差越小',
      tag: '拖动试试',
      desc: '实线是个体观察值的分布，虚线是样本均数的分布。拖动 n，看虚线如何「变瘦」。'
    });
    box.appendChild(ui);

    var ctl = ui.querySelector('.viz-ctl');
    ctl.appendChild(row('样本量 n', 1, 100, 1, n, '', function (v) { n = v; draw(); }));
    ctl.appendChild(row('个体标准差 σ', 1, 8, 0.5, sigma, '', function (v) { sigma = v; draw(); }));

    function draw() {
      fitW(ui);
      var se = sigma / Math.sqrt(n);
      var d0 = mu - 20, d1 = mu + 20;
      var pad = { l: 16, r: 16, t: 16, b: 42 };
      var s = scale(d0, d1, pad.l, W - pad.r);
      var base = H - pad.b;
      var peak = phi(0); /* 两条曲线按等高绘制，便于比较宽度 */
      var fy = scale(0, peak * 1.16, base, pad.t);
      var fPop = function (x) { return phi((x - mu) / sigma); };
      var fMean = function (x) { return phi((x - mu) / se); };

      var g = '<g class="vz-anim">';
      g += '<path class="vz-area vz-area-2" d="' + areaPath(s, fy, fPop, d0, d1, base) + '"/>';
      g += '<path class="vz-curve vz-curve-2" d="' + curvePath(s, fy, fPop, d0, d1) + '"/>';
      g += '<path class="vz-curve" d="' + curvePath(s, fy, fMean, d0, d1) + '"/>';
      g += '<line class="vz-axis" x1="' + pad.l + '" y1="' + base + '" x2="' + (W - pad.r) + '" y2="' + base + '"/>';
      [mu - 2 * sigma, mu - sigma, mu, mu + sigma, mu + 2 * sigma].forEach(function (t) {
        if (t < d0 || t > d1) return;
        g += '<line class="vz-tick" x1="' + s(t) + '" y1="' + base + '" x2="' + s(t) + '" y2="' + (base + 5) + '"/>';
        g += '<text class="vz-txt" x="' + s(t) + '" y="' + (base + 17) + '" text-anchor="middle">' + fx(t, 0) + '</text>';
      });
      g += '<text class="vz-txt" x="' + pad.l + '" y="' + (H - 6) + '">两条曲线按等高绘制，仅比较宽度</text>';
      g += '</g>';

      paint(ui, g);
      out(ui,
        kv('S<sub>X̄</sub> = σ / √n', fx(sigma, 1) + ' / √' + n + ' = ' + fx(se, 3), 'ok') +
        kv('n = 5 时', (sigma / Math.sqrt(5)).toFixed(2)) +
        kv('n = 100 时', (sigma / 10).toFixed(2)) +
        '<div class="vz-note">标准误与 <b>√n</b> 成反比：样本量增大 4 倍，标准误只缩小一半。这也解释了为什么「把 n 从 5 加到 20」的收益远大于「从 80 加到 95」。' +
        '注意：减小 S 不能从根本上降低抽样误差，因为 S 反映个体变异，由研究对象本身决定。</div>'
      );
    }
    ui._draw = draw;
    draw();
    draw = raf(draw);
  };

  /* ==================== 九、组件 6：t 分布与自由度 ==================== */
  V.tdist = function (box) {
    var df = 5, t0 = 2.0, tail = 'two';
    var ui = shell({
      title: 't 分布：自由度越小，尾巴越厚',
      tag: '拖动试试',
      desc: '虚线是标准正态分布。拖动自由度，观察 t 曲线如何向正态逼近；再拖动 t 值看尾部面积。'
    });
    box.appendChild(ui);

    var ctl = ui.querySelector('.viz-ctl');
    ctl.appendChild(row('自由度 ν', 1, 40, 1, df, '', function (v) { df = v; draw(); }));
    ctl.appendChild(row('t 值', 0, 4, 0.05, t0, '', function (v) { t0 = v; draw(); }));
    ctl.appendChild(seg([{ v: 'two', t: '双侧 P' }, { v: 'one', t: '单侧 P' }], 'two', function (v) { tail = v; draw(); }));

    function draw() {
      fitW(ui);
      var d0 = -4.4, d1 = 4.4;
      var pad = { l: 16, r: 16, t: 16, b: 42 };
      var s = scale(d0, d1, pad.l, W - pad.r);
      var base = H - pad.b;
      var peak = Math.max(tpdf(0, df), phi(0));
      var fy = scale(0, peak * 1.14, base, pad.t);

      var g = '<g class="vz-anim">';
      /* 尾部面积 */
      var p = tail === 'two' ? 2 * (1 - tcdf(t0, df)) : 1 - tcdf(t0, df);
      if (tail === 'two') {
        g += '<path class="vz-area" d="' + areaPath(s, fy, function (x) { return tpdf(x, df); }, t0, d1, base) + '"/>';
        g += '<path class="vz-area" d="' + areaPath(s, fy, function (x) { return tpdf(x, df); }, d0, -t0, base) + '"/>';
      } else {
        g += '<path class="vz-area" d="' + areaPath(s, fy, function (x) { return tpdf(x, df); }, t0, d1, base) + '"/>';
      }
      g += '<path class="vz-curve vz-curve-2 vz-dashline" d="' + curvePath(s, fy, phi, d0, d1) + '"/>';
      g += '<path class="vz-curve" d="' + curvePath(s, fy, function (x) { return tpdf(x, df); }, d0, d1) + '"/>';
      g += '<line class="vz-axis" x1="' + pad.l + '" y1="' + base + '" x2="' + (W - pad.r) + '" y2="' + base + '"/>';
      [-4, -2, 0, 2, 4].forEach(function (t) {
        g += '<line class="vz-tick" x1="' + s(t) + '" y1="' + base + '" x2="' + s(t) + '" y2="' + (base + 5) + '"/>';
        g += '<text class="vz-txt" x="' + s(t) + '" y="' + (base + 17) + '" text-anchor="middle">' + t + '</text>';
      });
      g += '<line class="vz-ref" x1="' + s(t0) + '" y1="' + pad.t + '" x2="' + s(t0) + '" y2="' + base + '"/>';
      g += '<text class="vz-txt vz-txt-b" x="' + (s(t0) + 6) + '" y="' + (pad.t + 11) + '">t = ' + fx(t0, 2) + '</text>';
      g += '<text class="vz-txt" x="' + pad.l + '" y="' + (H - 6) + '">实线：t(ν = ' + df + ')　虚线：标准正态 N(0,1)</text>';
      g += '</g>';

      paint(ui, g);
      var tCrit = 0, lo = 0, hi = 12;
      var target = tail === 'two' ? 0.95 : 0.95;
      for (var i = 0; i < 80; i++) {
        tCrit = (lo + hi) / 2;
        var pp = tail === 'two' ? 1 - 2 * (1 - tcdf(tCrit, df)) : tcdf(tCrit, df);
        if (pp < target) lo = tCrit; else hi = tCrit;
      }
      out(ui,
        kv(tail === 'two' ? '双侧 P 值' : '单侧 P 值', pct(p, 3), p < 0.05 ? 'ok' : '') +
        kv('双侧 95% 界值', fx(tCrit, 3)) +
        kv('自由度 ν', df + (df >= 30 ? '（已接近正态）' : '')) +
        '<div class="vz-note">ν → ∞ 时 t 分布就是标准正态分布。ν 较小时尾部更厚，同一置信水平需要更大的界值——这就是小样本必须查 t 表而不能用 1.96 的原因。' +
        'ν = 5 时双侧 95% 的界值是 2.571，而正态只用 1.960。</div>'
      );
    }
    ui._draw = draw;
    draw();
    draw = raf(draw);
  };

  /* ==================== 十、组件 7：两类错误与把握度 ==================== */
  V.errors = function (box) {
    var d = 2.0, c = 1.96;
    var ui = shell({
      title: '两类错误：α、β 与把握度 1−β',
      tag: '拖动试试',
      desc: '左曲线是 H₀ 成立时的分布，右曲线是 H₁ 成立时的分布。拖动临界值，看 α 与 β 此消彼长。'
    });
    box.appendChild(ui);

    var ctl = ui.querySelector('.viz-ctl');
    ctl.appendChild(row('H₁ 与 H₀ 的距离 δ', 0.5, 4, 0.1, d, '', function (v) { d = v; draw(); }));
    ctl.appendChild(row('临界值 c', -1, 4, 0.01, c, '', function (v) { c = v; draw(); }));

    function draw() {
      fitW(ui);
      var d0 = -4, d1 = 6.5;
      var pad = { l: 16, r: 16, t: 16, b: 42 };
      var s = scale(d0, d1, pad.l, W - pad.r);
      var base = H - pad.b;
      var fy = scale(0, phi(0) * 1.16, base, pad.t);
      var f0 = function (x) { return phi(x); };
      var f1 = function (x) { return phi(x - d); };
      var alpha = 1 - Phi(c), beta = Phi(c - d), power = 1 - beta;

      var g = '<g class="vz-anim">';
      g += '<path class="vz-area vz-area-bad" d="' + areaPath(s, fy, f0, c, d1, base) + '"/>';
      g += '<path class="vz-area vz-area-2" d="' + areaPath(s, fy, f1, d0, c, base) + '"/>';
      g += '<path class="vz-curve vz-curve-2" d="' + curvePath(s, fy, f0, d0, d1) + '"/>';
      g += '<path class="vz-curve" d="' + curvePath(s, fy, f1, d0, d1) + '"/>';
      g += '<line class="vz-axis" x1="' + pad.l + '" y1="' + base + '" x2="' + (W - pad.r) + '" y2="' + base + '"/>';
      g += '<line class="vz-ref" x1="' + s(c) + '" y1="' + pad.t + '" x2="' + s(c) + '" y2="' + base + '"/>';
      g += '<text class="vz-txt vz-txt-b" x="' + (s(c) + 5) + '" y="' + (pad.t + 11) + '">c = ' + fx(c, 2) + '</text>';
      g += '<text class="vz-txt vz-txt-b" x="' + s(0) + '" y="' + (pad.t + 28) + '" text-anchor="middle">H₀</text>';
      g += '<text class="vz-txt vz-txt-b" x="' + s(d) + '" y="' + (pad.t + 28) + '" text-anchor="middle">H₁</text>';
      g += '<text class="vz-txt" x="' + pad.l + '" y="' + (H - 6) + '">红 = α（弃真）　蓝 = β（存伪）</text>';
      g += '</g>';

      paint(ui, g);
      out(ui,
        kv('α（第一类错误·弃真）', pct(alpha, 2), 'bad') +
        kv('β（第二类错误·存伪）', pct(beta, 2)) +
        kv('把握度 1−β', pct(power, 2), 'ok') +
        '<div class="vz-note">样本量固定时，<b>α 减小则 β 增大</b>，两者不能同时减小；要同时减小只能增大样本量或提高两总体间的实际差异 δ。' +
        '检验效能 1−β 通常要求不低于 0.80。</div>'
      );
    }
    ui._draw = draw;
    draw();
    draw = raf(draw);
  };

  /* ==================== 十一、组件 8：量效关系（药理学） ==================== */
  V.dose = function (box) {
    var logECB = -1, emaxB = 60, hill = 1;

    var ui = shell({
      title: '量效关系：效价强度 vs 最大效能',
      tag: '拖动试试',
      desc: '横轴是剂量的对数值。蓝色是标准药 A（EC₅₀ = 1，Emax = 100），紫色是药 B。拖动 B 的 EC₅₀ 与 Emax，看曲线如何左右平移、上下压缩。'
    });
    box.appendChild(ui);

    var ctl = ui.querySelector('.viz-ctl');
    ctl.appendChild(row('B 的 log EC₅₀', -2, 2, 0.02, logECB, '', function (v) { logECB = v; draw(); }));
    ctl.appendChild(row('B 的最大效能 Emax', 20, 120, 5, emaxB, '%', function (v) { emaxB = v; draw(); }));
    ctl.appendChild(row('Hill 系数（陡度）', 0.5, 3, 0.1, hill, '', function (v) { hill = v; draw(); }));

    function draw() {
      fitW(ui);
      var ecB = Math.pow(10, logECB);
      var d0 = -3, d1 = 2.5;
      var pad = { l: 38, r: 18, t: 26, b: 44 };
      var s = scale(d0, d1, pad.l, W - pad.r);
      var base = H - pad.b;
      var fy = scale(0, 120, base, pad.t);

      function E(logD, ec50, emax) {
        var p = Math.pow(Math.pow(10, logD), hill);
        return emax * p / (Math.pow(ec50, hill) + p);
      }
      var fA = function (x) { return E(x, 1, 100); };
      var fB = function (x) { return E(x, ecB, emaxB); };
      var logB = Math.log(ecB) / Math.LN10;

      var g = '<g class="vz-anim">';
      g += '<path class="vz-area vz-area-2" d="' + areaPath(s, fy, fB, d0, d1, base) + '"/>';
      g += '<path class="vz-curve" d="' + curvePath(s, fy, fA, d0, d1) + '"/>';
      g += '<path class="vz-curve vz-curve-v" d="' + curvePath(s, fy, fB, d0, d1) + '"/>';
      g += '<line class="vz-axis" x1="' + pad.l + '" y1="' + base + '" x2="' + (W - pad.r) + '" y2="' + base + '"/>';
      g += '<line class="vz-axis" x1="' + pad.l + '" y1="' + pad.t + '" x2="' + pad.l + '" y2="' + base + '"/>';
      [0, 50, 100].forEach(function (v) {
        g += '<line class="vz-grid" x1="' + pad.l + '" y1="' + fy(v) + '" x2="' + (W - pad.r) + '" y2="' + fy(v) + '"/>';
        g += '<text class="vz-txt" x="' + (pad.l - 6) + '" y="' + (fy(v) + 4) + '" text-anchor="end">' + v + '%</text>';
      });
      var ticks = [[-3, '10⁻³'], [-2, '10⁻²'], [-1, '10⁻¹'], [0, '1'], [1, '10'], [2, '100']];
      ticks.forEach(function (t) {
        g += '<line class="vz-tick" x1="' + s(t[0]) + '" y1="' + base + '" x2="' + s(t[0]) + '" y2="' + (base + 5) + '"/>';
        g += '<text class="vz-txt" x="' + s(t[0]) + '" y="' + (base + 18) + '" text-anchor="middle">' + t[1] + '</text>';
      });
      g += '<text class="vz-txt" x="' + (W - pad.r) + '" y="' + (base + 32) + '" text-anchor="end">剂量（对数刻度）</text>';
      /* EC50 参考线：竖虚线 + 50% 处的小圆点，标签错开放在顶部 */
      [[0, 'A', 'vz-ref', pad.t + 10], [logB, 'B', 'vz-ref vz-ref-bad', pad.t + 24]].forEach(function (p) {
        if (p[0] < d0 || p[0] > d1) return;
        g += '<line class="' + p[2] + '" x1="' + s(p[0]) + '" y1="' + fy(50) + '" x2="' + s(p[0]) + '" y2="' + base + '"/>';
        g += '<circle class="vz-dot" cx="' + s(p[0]) + '" cy="' + fy(50) + '" r="3.5"/>';
        g += '<text class="vz-txt vz-txt-b" x="' + (s(p[0]) + 5) + '" y="' + p[3] + '">' + p[1] + ' 的 EC₅₀</text>';
      });
      g += '<text class="vz-txt vz-txt-b" x="' + (W - pad.r) + '" y="' + (fy(emaxB) - 6) + '" text-anchor="end">B 的 Emax = ' + fx(emaxB, 0) + '%</text>';
      g += '</g>';

      paint(ui, g);

      var morePotent = ecB < 1 ? '更强' : (ecB > 1 ? '更弱' : '相同');
      var moreEff = emaxB > 100 ? '更高' : (emaxB < 100 ? '更低' : '相同');
      out(ui,
        kv('A：效能 / 效价', '100% / EC₅₀ = 1') +
        kv('B：效能 / 效价', fx(emaxB, 0) + '% / EC₅₀ = ' + fx(ecB, 2), 'ok') +
        kv('B 的效价强度', morePotent, ecB < 1 ? 'ok' : '') +
        '<div class="vz-note"><b>效能（efficacy）</b>看曲线能爬多高，即 Emax；<b>效价强度（potency）</b>看曲线在横轴上的位置，EC₅₀ 越小越靠左、效价越强。' +
        '两者可以不一致：B 的效价强度' + morePotent + '，最大效能却' + moreEff + '。' +
        '临床上「效价强」只意味着用量小，不代表能获得更好的疗效。</div>'
      );
    }
    ui._draw = draw;
    draw();
    draw = raf(draw);
  };

  /* ==================== 十二、组件 9：药时曲线与半衰期（药理学） ==================== */
  V.pk = function (box) {
    var th = 4, tau = 8, multi = true;

    var ui = shell({
      title: '药时曲线：半衰期与给药间隔',
      tag: '拖动试试',
      desc: '单次静注后血药浓度按指数衰减。拖动半衰期，看浓度降到一半需要多久；切换为重复给药，观察药物蓄积到稳态。'
    });
    box.appendChild(ui);

    var ctl = ui.querySelector('.viz-ctl');
    ctl.appendChild(row('半衰期 t₁/₂', 0.5, 12, 0.1, th, ' h', function (v) { th = v; draw(); }));
    ctl.appendChild(row('给药间隔 τ', 1, 24, 1, tau, ' h', function (v) { tau = v; draw(); }));
    ctl.appendChild(seg([{ v: 0, t: '单次给药' }, { v: 1, t: '重复给药' }], 1, function (v) { multi = !!v; draw(); }));

    function conc(t) {
      var k = Math.LN2 / th, sum = 0;
      var n = multi ? Math.floor(t / tau + 1e-9) : 0;
      for (var i = 0; i <= n; i++) sum += 100 * Math.exp(-k * (t - i * tau));
      return sum;
    }

    function draw() {
      fitW(ui);
      var k = Math.LN2 / th;
      var T = 48;
      var pad = { l: 42, r: 18, t: 18, b: 44 };
      var s = scale(0, T, pad.l, W - pad.r);
      var base = H - pad.b;
      var cmax = multi ? 100 / (1 - Math.exp(-k * tau)) : 100;
      var yMax = niceMax(cmax * 1.1, 4);
      var fy = scale(0, yMax, base, pad.t);

      var g = '<g class="vz-anim">';
      g += '<line class="vz-axis" x1="' + pad.l + '" y1="' + base + '" x2="' + (W - pad.r) + '" y2="' + base + '"/>';
      g += '<line class="vz-axis" x1="' + pad.l + '" y1="' + pad.t + '" x2="' + pad.l + '" y2="' + base + '"/>';
      [0, 0.25, 0.5, 0.75, 1].forEach(function (p) {
        var v = yMax * p;
        g += '<line class="vz-grid" x1="' + pad.l + '" y1="' + fy(v) + '" x2="' + (W - pad.r) + '" y2="' + fy(v) + '"/>';
        g += '<text class="vz-txt" x="' + (pad.l - 6) + '" y="' + (fy(v) + 4) + '" text-anchor="end">' + fx(v, 0) + '</text>';
      });
      for (var t = 0; t <= T; t += 8) {
        g += '<line class="vz-tick" x1="' + s(t) + '" y1="' + base + '" x2="' + s(t) + '" y2="' + (base + 5) + '"/>';
        g += '<text class="vz-txt" x="' + s(t) + '" y="' + (base + 18) + '" text-anchor="middle">' + t + '</text>';
      }
      g += '<text class="vz-txt" x="' + (W - pad.r) + '" y="' + (base + 32) + '" text-anchor="end">时间（h）</text>';

      /* 曲线 */
      var pts = [];
      var N = 480;
      for (var i = 0; i <= N; i++) {
        var tt = T * i / N;
        pts.push((i ? 'L' : 'M') + fx(s(tt), 2) + ' ' + fx(fy(conc(tt)), 2));
      }
      var areaD = 'M' + fx(s(0), 2) + ' ' + fx(base, 2) + ' L' + pts.join(' ').slice(1) + ' L' + fx(s(T), 2) + ' ' + fx(base, 2) + ' Z';
      g += '<path class="vz-area" d="' + areaD + '"/>';
      g += '<path class="vz-curve" d="' + pts.join(' ') + '"/>';

      /* 半衰期标记（单次给药） */
      if (!multi) {
        for (var h = 1; h <= 4; h++) {
          var tH = h * th;
          if (tH > T) break;
          g += '<line class="vz-dash" x1="' + s(tH) + '" y1="' + fy(100 * Math.pow(0.5, h)) + '" x2="' + s(tH) + '" y2="' + base + '"/>';
          g += '<text class="vz-txt" x="' + s(tH) + '" y="' + (fy(100 * Math.pow(0.5, h)) - 5) + '" text-anchor="middle">' + fx(100 * Math.pow(0.5, h), 0) + '</text>';
        }
      }
      /* 给药时点 */
      if (multi) {
        for (var d = 0; d <= T; d += tau) {
          g += '<line class="vz-dash" x1="' + s(d) + '" y1="' + pad.t + '" x2="' + s(d) + '" y2="' + base + '"/>';
        }
      }
      g += '</g>';

      paint(ui, g);

      var css = multi ? 100 / (1 - Math.exp(-k * tau)) : 0;
      out(ui,
        kv('消除速率常数 k', fx(k, 3) + ' /h') +
        kv('t₁/₂ 与 τ 的关系', 'τ = ' + fx(tau / th, 1) + ' 个半衰期') +
        (multi
          ? kv('稳态峰浓度', fx(css, 1), 'ok') + kv('蓄积因子 R', fx(1 / (1 - Math.exp(-k * tau)), 2))
          : kv('5 个半衰期后残余', fx(100 * Math.pow(0.5, 5), 1) + '%', 'ok') + kv('消除 96.9% 需时', fx(5 * th, 1) + ' h')) +
        '<div class="vz-note">一级动力学药物<b>按固定比例</b>消除：每经过一个 t₁/₂ 浓度减半，' +
        '所以「5 个半衰期基本消除干净」是通用规律，与剂量无关。' +
        (multi ? '重复给药时，<b>给药间隔等于 t₁/₂</b> 时约 4～5 个半衰期达到稳态，蓄积因子约 2；间隔越短蓄积越明显。' : '') +
        '</div>'
      );
    }
    ui._draw = draw;
    draw();
    draw = raf(draw);
  };

  /* ==================== 十三、组件 10：ROC 曲线（医学大数据） ==================== */
  V.roc = function (box) {
    var d = 1.5, c = 0.75;

    var ui = shell({
      title: 'ROC 曲线：阈值怎么定',
      tag: '拖动试试',
      desc: '两条分布分别代表健康人与患者。拖动诊断阈值 c，看敏感度与特异度此消彼长，工作点在 ROC 曲线上滑动。'
    });
    box.appendChild(ui);

    var ctl = ui.querySelector('.viz-ctl');
    ctl.appendChild(row('两组分布的距离 δ', 0.2, 4, 0.1, d, '', function (v) { d = v; draw(); }));
    ctl.appendChild(row('诊断阈值 c', -2, 4, 0.05, c, '', function (v) { c = v; draw(); }));

    function draw() {
      fitW(ui);
      var pad = { l: 44, r: 18, t: 16, b: 46 };
      var base = H - pad.b;
      var sx = scale(0, 1, pad.l, W - pad.r);
      var sy = scale(0, 1, base, pad.t);

      var sens = 1 - Phi(c - d), fpr = 1 - Phi(c);
      var auc = Phi(d / Math.SQRT2);
      var youden = sens - fpr;

      var pts = [];
      for (var i = 0; i <= 220; i++) {
        var u = 4 - 8 * i / 220;
        pts.push((i ? 'L' : 'M') + fx(sx(1 - Phi(u)), 2) + ' ' + fx(sy(1 - Phi(u - d)), 2));
      }

      var g = '<g class="vz-anim">';
      g += '<path class="vz-area" d="' + pts.join(' ') + ' L' + fx(sx(1), 2) + ' ' + fx(sy(0), 2) + ' L' + fx(sx(0), 2) + ' ' + fx(sy(0), 2) + ' Z"/>';
      g += '<line class="vz-dash" x1="' + sx(0) + '" y1="' + sy(0) + '" x2="' + sx(1) + '" y2="' + sy(1) + '"/>';
      g += '<path class="vz-curve" d="' + pts.join(' ') + '"/>';
      g += '<line class="vz-axis" x1="' + pad.l + '" y1="' + base + '" x2="' + (W - pad.r) + '" y2="' + base + '"/>';
      g += '<line class="vz-axis" x1="' + pad.l + '" y1="' + pad.t + '" x2="' + pad.l + '" y2="' + base + '"/>';
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
        g += '<line class="vz-tick" x1="' + sx(v) + '" y1="' + base + '" x2="' + sx(v) + '" y2="' + (base + 5) + '"/>';
        g += '<text class="vz-txt" x="' + sx(v) + '" y="' + (base + 18) + '" text-anchor="middle">' + fx(v, 2) + '</text>';
        g += '<line class="vz-tick" x1="' + (pad.l - 4) + '" y1="' + sy(v) + '" x2="' + pad.l + '" y2="' + sy(v) + '"/>';
        g += '<text class="vz-txt" x="' + (pad.l - 7) + '" y="' + (sy(v) + 4) + '" text-anchor="end">' + fx(v, 2) + '</text>';
      });
      g += '<text class="vz-txt" x="' + (W / 2) + '" y="' + (base + 34) + '" text-anchor="middle">1 − 特异度（假阳性率）</text>';
      g += '<text class="vz-txt" x="' + (pad.l - 34) + '" y="' + (pad.t + 4) + '">敏感度</text>';
      /* 工作点 */
      var px = sx(fpr), py = sy(sens);
      g += '<line class="vz-dash" x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + base + '"/>';
      g += '<line class="vz-dash" x1="' + pad.l + '" y1="' + py + '" x2="' + px + '" y2="' + py + '"/>';
      g += '<circle class="vz-dot" cx="' + px + '" cy="' + py + '" r="5"/>';
      g += '<text class="vz-txt vz-txt-b" x="' + (px + 8) + '" y="' + (py - 8) + '">c = ' + fx(c, 2) + '</text>';
      g += '<text class="vz-txt vz-txt-b" x="' + (W - pad.r) + '" y="' + (pad.t + 10) + '" text-anchor="end">AUC = ' + fx(auc, 3) + '</text>';
      g += '</g>';

      paint(ui, g);
      out(ui,
        kv('敏感度（真阳性率）', pct(sens, 1), 'ok') +
        kv('特异度（真阴性率）', pct(1 - fpr, 1)) +
        kv('约登指数', fx(youden, 3)) +
        kv('漏诊率 / 误诊率', pct(1 - sens, 1) + ' / ' + pct(fpr, 1)) +
        '<div class="vz-note">阈值 c 往<b>左</b>移：敏感度升高、特异度下降（宁可错杀）；往<b>右</b>移则相反。' +
        '约登指数 = 敏感度 + 特异度 − 1，最大处即最佳截断点。AUC 只由两条分布的重叠程度决定（δ 越大越接近 1），' +
        '与阈值无关——这正是用 AUC 评价诊断试验整体价值的原因。</div>'
      );
    }
    ui._draw = draw;
    draw();
    draw = raf(draw);
  };

  /* ==================== 十一、挂载 ==================== */
  var rt = null;
  window.addEventListener('resize', function () {
    if (rt) clearTimeout(rt);
    rt = setTimeout(function () {
      INSTANCES.forEach(function (b) {
        if (!b._draw || !document.body.contains(b)) return;
        b._w = 0; b._h = 0;   /* 尺寸变了，强制重新测量 */
        b._draw();
      });
    }, 220);
  });

  V.mount = function (root) {
    var nodes = (root || document).querySelectorAll('[data-viz]');
    Array.prototype.forEach.call(nodes, function (n) {
      if (n.getAttribute('data-viz-done')) return;
      var kind = n.getAttribute('data-viz');
      if (typeof V[kind] !== 'function') return;
      n.setAttribute('data-viz-done', '1');
      try {
        V[kind](n);
        var box = n.querySelector('.viz');
        if (box) INSTANCES.push(box);
      } catch (e) {
        n.innerHTML = '<div class="viz viz-err">交互组件加载失败，请刷新页面重试。</div>';
      }
    });
  };

  if (document.readyState !== 'loading') {
    if (document.querySelector('[data-viz]')) V.mount(document);
  } else {
    document.addEventListener('DOMContentLoaded', function () { V.mount(document); });
  }
})();
