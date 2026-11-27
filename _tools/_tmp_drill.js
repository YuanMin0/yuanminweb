
(function () {
  'use strict';

  var sid = WB.qs('s');
  /* 只加载当前科目的题库（约 0.1–0.5 MB）；无 s 参数时仅读 _meta 渲染选择器 */
  WB.ensureSubject(sid, { drill: true }).then(boot);
  function boot() {
  var subject = sid ? WB.subjectOf(sid) : null;
  /* 有独立刷题页的科目（环境卫生学）：给出明确入口，不静默跳转 */
  if (subject && subject.extAlt) {
    document.getElementById('stage').innerHTML =
      '<div class="card"><p class="stem" style="margin:0">' + WB.esc(subject.name) +
      ' 的题目在独立刷题页。</p>' +
      '<p style="margin-top:14px"><a class="btn" href="' + subject.extAlt + '">前往刷题 →</a></p></div>';
    var _pos = document.getElementById('pos'); if (_pos) _pos.textContent = '— / —';
    var _pt = document.getElementById('progressText'); if (_pt) _pt.textContent = '独立刷题页';
    return;
  }
  var single = !!subject;

  /* ---------------- 收集题目 ---------------- */
  function uidOf(s, k, i) { return s + '|' + k + '|' + i; }

  var base = [];   /* 原始顺序的全量题池 */
  function collect(s) {
    var out = [];
    /* 难度/考频标注：按科目扁平顺序对齐；长度不符则整体忽略，避免错位 */
    var qm = (window.QUIZ_META || {})[s.id] || [];
    var total = 0;
    (s.chapters || []).forEach(function (ch) {
      (ch.knowledge || []).forEach(function (k) { total += (k.quiz || []).length; });
    });
    if (qm.length !== total) qm = [];
    var flat = 0;

    (s.chapters || []).forEach(function (ch) {
      (ch.knowledge || []).forEach(function (k) {
        (k.quiz || []).forEach(function (q, i) {
          var m = qm[flat++] || [];
          out.push({
            type: q.type, stem: q.stem, options: q.options, answer: q.answer, explain: q.explain,
            /* 主观题与来源字段必须一并带出，否则渲染时拿不到 */
            explainBrief: q.explainBrief, answerPoints: q.answerPoints,
            caseText: q.caseText, source: q.source, sourceUrl: q.sourceUrl,
            freq: q.freq || m[1], level: q.level || m[0], years: q.years, tested: q.tested,
            uid: uidOf(s.id, k.id, i),
            subjectId: s.id, subjectName: s.name,
            chapterTitle: ch.title, kTitle: k.title, kid: k.id,
            _exam: !!ch._exam
          });
        });
      });
    });
    return out;
  }

  /* ---------------- 科目选择页（按年级分组） ---------------- */
  function hasPool(s) {
    /* 只加载 _meta 时没有 chapters，用 choice 计数判断有没有可刷的题 */
    if (!s.chapters) return !!(s._count && s._count.choice > 0);
    return s.chapters.some(function (c) {
      return (c.knowledge || []).some(function (k) { return (k.quiz || []).length; });
    });
  }

  function doneOf(sid) {
    try {
      var d = JSON.parse(localStorage.getItem('medilearn.drill.v2|' + sid) || '{}');
      var c = d.checked || {}, n = 0;
      for (var k in c) if (c[k]) n++;
      return n;
    } catch (e) { return 0; }
  }

  function renderPicker() {
    document.body.classList.add('mode-pick');
    document.title = '刷题 · MediLearn';

    var brand = document.getElementById('brand');
    if (brand) brand.textContent = '刷题';
    var back = document.getElementById('backLink');
    if (back) { back.href = 'bank.html'; back.textContent = '← 返回题库'; }
    var pos = document.getElementById('pos');
    if (pos) pos.textContent = '— / —';
    var pt = document.getElementById('progressText');
    if (pt) pt.textContent = '请先选择科目';

    var subs = WB.subjects().filter(function (s) {
      return s._count && s._count.quiz > 0;
    });

    var groups = {}, order = [];
    (WB.CATS || []).forEach(function (c) {
      if (c.id !== 'all') order.push({ id: c.id, name: c.name });
    });
    subs.forEach(function (s) {
      var g = s.sem || 'other';
      if (!groups[g]) groups[g] = [];
      groups[g].push(s);
    });
    /* 兜底：sem 不在 CATS 里的归到「其他」 */
    Object.keys(groups).forEach(function (g) {
      if (!order.some(function (o) { return o.id === g; })) order.push({ id: g, name: '其他' });
    });

    var html = '<div class="pick-head"><h2>选一个科目开始</h2>' +
      '<p>按年级分类 · 共 ' + subs.length + ' 个科目有题目</p>' +
      '<p class="pick-note"><b>部分学期暂未开放</b>：由于参考资料不足，大一下、大二上、大二下、大三下及其他学期的刷题暂不可进入（仍显示题量）。' +
      '相关资料可在<a href="materials.html">资料库</a>下载或在线预览。</p></div>';

    order.forEach(function (cat) {
      var list = groups[cat.id];
      if (!list || !list.length) return;
      list = list.slice().sort(function (a, b) { return (a.order || 99) - (b.order || 99); });
      var totalQ = 0;
      list.forEach(function (s) { totalQ += (s._count.choice || 0); });

      html += '<section class="grade"><h2 class="grade-h"><b>' + WB.esc(cat.name) + '</b>' +
        '<span>' + list.length + ' 科 · ' + totalQ + ' 题</span></h2><div class="sg">';

      list.forEach(function (s) {
        if (s.sem !== 'dasan1') {
          html += '<div class="scard is-locked" aria-disabled="true" title="参考资料不足，暂未开放">' +
            '<div class="scard-t">' + WB.esc(s.name) + '<span class="scard-tag scard-tag-lock">暂未开放</span></div>' +
            '<div class="scard-m"><span>' + (s._count.choice || 0) + ' 题</span><span>—</span></div>' +
            '<div class="scard-bar"><i style="width:0%"></i></div>' +
            '</div>';
          return;
        }
        var href = WB.drillHref(s);
        /* 没有刷题入口但有外部文档页（如劳动卫生学）：仍列出，标「文档页」，
           避免用户以为它消失了，也不会误点成刷题 */
        var isDoc = !href && !!s.ext;
        if (!href && !isDoc) return;
        var link = href || s.ext;
        var pool = hasPool(s);
        var done = pool ? doneOf(s.id) : 0;
        var pct = (pool && s._count.choice) ? Math.min(100, Math.round(done / s._count.choice * 100)) : 0;
        html += '<a class="scard" href="' + link + '">' +
          '<div class="scard-t">' + WB.esc(s.name) +
            (isDoc ? '<span class="scard-tag scard-tag-doc">文档页</span>' : (pool ? '' : '<span class="scard-tag">独立页</span>')) + '</div>' +
          '<div class="scard-m"><span>' + (s._count.choice || 0) + ' 题</span>' +
            '<span>' + (pool ? (done ? '已答 ' + done + ' · ' + pct + '%' : '未开始') : '—') + '</span></div>' +
          '<div class="scard-bar"><i style="width:' + pct + '%"></i></div>' +
          '</a>';
      });

      html += '</div></section>';
    });

    document.getElementById('stage').innerHTML = html;
  }

  /* 刷题只出选择题：单选 + 多选；名词解释/简答/论述归「全科测验」 */
  function isChoice(q) { return q.type === 'single' || q.type === 'multiple'; }

  if (single) {
    base = collect(subject).filter(isChoice);
  } else {
    /* 无科目参数：先按年级选科目，不加载全量题池 */
    renderPicker();
    return;
  }

  if (!base.length) {
    document.getElementById('stage').innerHTML =
      '<div class="card"><p class="stem" style="margin:0">这个科目还没有题目。</p></div>';
    document.getElementById('pos').textContent = '— / —';
    document.getElementById('progressText').textContent = '暂无题目';
    return;
  }

  /* ---------------- 状态 ---------------- */
  var KEY = 'medilearn.drill.v2|' + (single ? subject.id : 'all');
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        ans: st.ans, checked: st.checked, revealed: st.revealed,
        i: st.i, ch: st.ch, wrongOnly: st.wrongOnly, favOnly: st.favOnly, order: st.order, src: st.src
      }));
    } catch (e) {}
  }
  var st = load();
  st.ans = st.ans || {};
  st.checked = st.checked || {};
  st.i = st.i || 0;
  st.ch = st.ch || '';
  st.src = st.src || '';            /* 来源筛选：'' = 全部 */
  st.wrongOnly = !!st.wrongOnly;
  st.favOnly = !!st.favOnly;          /* 只看收藏 */
  st.order = st.order || 'seq';
  st.revealed = st.revealed || {};   /* 主观题是否已展开参考答案 */

  /* ---------------- 题池（受筛选影响） ---------------- */
  var pool = [];

  function rebuild() {
    var list = base.slice();
    if (st.order === 'rand') {
      /* 稳定打乱：以 uid 的哈希为种子，保证刷新后顺序不变 */
      list.sort(function (a, b) {
        function h(x) { var n = 0; for (var i = 0; i < x.length; i++) n = (n * 31 + x.charCodeAt(i)) >>> 0; return n; }
        return h(a.uid) - h(b.uid);
      });
    }
    if (st.ch) list = list.filter(function (q) { return q._chKey === st.ch; });
    if (st.src) list = list.filter(function (q) { return WB.srcType(q) === st.src; });
    if (st.favOnly) list = list.filter(function (q) { return WB.store.isFav(q.uid); });
    if (st.wrongOnly) {
      var w = WB.store.wrong();
      list = list.filter(function (q) { return !!w[q.uid]; });
    }
    pool = list;
    if (st.i >= pool.length) st.i = Math.max(0, pool.length - 1);
    if (st.i < 0) st.i = 0;
  }

  /* 分组 key：单科按章节，全科按科目（否则 151 个章节会把抽屉撑爆） */
  base.forEach(function (q) {
    q._chKey = single ? q.chapterTitle : q.subjectName;
    q._chFull = single ? q.chapterTitle : (q.subjectName + ' · ' + q.chapterTitle);
  });

  /* ---------------- 渲染 ---------------- */
  var stage = document.getElementById('stage');
  var posEl = document.getElementById('pos');
  var scoreEl = document.getElementById('score');
  var barEl = document.getElementById('bar');
  var ptextEl = document.getElementById('progressText');
  var wrongCountEl = document.getElementById('wrongCount');
  var orderBtn = document.getElementById('orderBtn');
  var wrongBtn = document.getElementById('wrongBtn');
  var favBtn = document.getElementById('favBtn');
  var favCountEl = document.getElementById('favCount');
  var brandEl = document.getElementById('brand');
  var backLink = document.getElementById('backLink');

  brandEl.textContent = single ? (subject.name + ' · 刷题') : '全科刷题';
  document.title = (single ? subject.name : '全科') + ' 刷题 · MediLearn';
  backLink.href = single ? ('subject.html?s=' + encodeURIComponent(subject.id)) : 'bank.html';
  backLink.textContent = single ? '← 返回科目' : '← 返回题库';

  function sticker(cls, text, title) {
    return '<span class="sticker ' + cls + '"' + (title ? ' title="' + WB.esc(title) + '"' : '') + '><span>' + WB.esc(text) + '</span></span>';
  }

  function clip(s, n) { return s.length > n ? s.slice(0, n) + '…' : s; }

  function lvCls(v) { return v === '难点' ? 'hard' : (v === '重点' ? 'key' : 'base'); }
  function fqCls(v) { return v === '高频' ? 'high' : 'mid'; }
  function lvHint(v) {
    return v === '难点' ? '多选 / 高阶认知（分析·鉴别·诊断）/ 否定式 / 长题干'
      : (v === '重点' ? '需理解或应用，非纯识记' : '识记类，题型较易');
  }
  function fqHint(v) {
    return v === '高频' ? '往年真题精析中出现' : '本科目有真题数据，此题未直接命中';
  }

  function typeText(t) { return WB.typeLabel(t); }

  function esc4(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* 来源行：所有解析底部统一标注 */
  function srcLine(q) {
    if (!q.source) return '';
    var txt = WB.esc(q.source);
    if (q.sourceUrl) {
      txt = '<a href="' + WB.esc(q.sourceUrl) + '" target="_blank" rel="noopener">' + txt + '</a>';
    }
    return '<div class="src-line">来源：' + txt + '</div>';
  }

  /* 主观题参考答案 */
  function subjBody(q) {
    var out = '';
    if (q.type === 'term') {
      out += '<div class="term-full">' + (q.explain || '') + '</div>';
      if (q.explainBrief) {
        out += '<div class="term-brief"><span class="brief-tag">简化版</span>' + q.explainBrief + '</div>';
      }
    } else {
      var pts = q.answerPoints || [];
      if (pts.length) {
        out += '<ol class="points">' + pts.map(function (p) {
          return '<li>' + p + '</li>';
        }).join('') + '</ol>';
      } else if (q.explain) {
        out += '<div>' + q.explain + '</div>';
      }
      if (q.caseText) {
        out += '<div class="case-box"><span class="case-tag">案例</span>' + q.caseText + '</div>';
      }
      if (q.explain && pts.length) {
        out += '<div class="subj-note">' + q.explain + '</div>';
      }
    }
    return out;
  }

  function answerText(q) {
    if (q.type === 'single') return 'ABCDEFGH'[q.answer] || String(q.answer);
    if (q.type === 'multiple') return (q.answer || []).map(function (i) { return 'ABCDEFGH'[i]; }).join('');
    if (q.type === 'judge') return q.answer ? '正确' : '错误';
    if (q.type === 'fill') return (q.answer || []).join(' / ');
    return '';
  }

  /* 主观题没有标准答案字母，用自评结果（true/false）判对错 */
  function isRight(q, ans) {
    if (WB.isSubjective(q.type)) return ans === true;
    return WB.isCorrect(q, ans);
  }

  function render() {
    rebuild();

    /* 从收藏夹/错题本点进来时，用 ?q=<uid> 直接定位到该题 */
    var wantQ = WB.qs('q');
    if (wantQ && !st._jumped) {
      var at = -1;
      for (var qi = 0; qi < pool.length; qi++) { if (pool[qi].uid === wantQ) { at = qi; break; } }
      if (at < 0 && (st.ch || st.src || st.favOnly || st.wrongOnly)) {
        st.ch = ''; st.src = ''; st.favOnly = false; st.wrongOnly = false;
        rebuild();
        for (var qj = 0; qj < pool.length; qj++) { if (pool[qj].uid === wantQ) { at = qj; break; } }
      }
      if (at > -1) { st.i = at; st._jumped = true; }
    }

    if (!pool.length) {
      stage.innerHTML = '<div class="card"><p class="stem" style="margin:0 0 14px">这里没有题。</p>' +
        '<p style="margin:0;font-weight:700;font-size:14px">当前筛选下没有可练的题目，可能都答对了、该讲暂无题，或收藏夹为空。</p>' +
        '<div class="actions"><button class="btn" id="toAll" type="button">回到全部题目</button></div></div>';
      posEl.textContent = '— / —';
      ptextEl.textContent = '没有可练的题';
      barEl.style.width = '0%';
      var b = document.getElementById('toAll');
      if (b) b.addEventListener('click', function () {
        st.ch = ''; st.src = ''; st.wrongOnly = false; st.favOnly = false; st.i = 0; save(); renderAll();
      });
      updateTools();
      return;
    }

    var q = pool[st.i];
    var my = st.ans[q.uid];
    var checked = !!st.checked[q.uid];
    var right = checked && isRight(q, my);
    var subjective = WB.isSubjective(q.type);
    var revealed = !!st.revealed[q.uid];

    /* 贴纸：来源 / 题型 / 章节（有 freq、level 时优先展示） */
    var sticks = '';
    sticks += sticker('st-src', WB.srcName(WB.srcType(q)), '来源：' + (q.source || '未标注'));
    sticks += sticker('st-type', typeText(q.type));
    if (q.level) {
      var lv = Array.isArray(q.level) ? q.level.join(' · ') : q.level;
      sticks += sticker('st-lv st-lv-' + lvCls(lv), lv, lvHint(lv));
    }
    if (q.freq) sticks += sticker('st-freq st-fq-' + fqCls(q.freq), q.freq, fqHint(q.freq));
    if (q.tested) {
      var tcls = /原题/.test(q.tested) ? 'high' : (/考点/.test(q.tested) ? 'mid' : 'low');
      sticks += sticker('st-freq st-fq-' + tcls, q.tested.replace(/（.*?）/, ''), q.tested);
    }
    sticks += sticker('st-ch', clip(q.chapterTitle, 10), q._chFull);
    var favOn = WB.store.isFav(q.uid);
    sticks += '<button class="fav-star' + (favOn ? ' on' : '') + '" id="favStar" type="button" aria-pressed="' +
      favOn + '" title="' + (favOn ? '取消收藏' : '收藏本题') + '">' + (favOn ? '★ 已收藏' : '☆ 收藏') + '</button>';

    var body = '';
    if (subjective) {
      body = '<p class="subj-hint">' + (revealed ? '对照参考答案，自评是否掌握：' : '先在心里默答，再展开参考答案对照。') + '</p>';
    } else if (q.type === 'fill') {
      body = '<div class="fillwrap"><input id="fillInput" type="text" aria-label="填空作答" autocomplete="off" ' +
        'placeholder="输入答案，多个答案用 / 分隔" value="' + (my == null ? '' : esc4(my)) + '"' +
        (checked ? ' disabled' : '') + '></div>';
    } else if (q.type === 'judge') {
      body = '<div class="opts">' +
        judgeOpt(q, my, checked, true) + judgeOpt(q, my, checked, false) + '</div>';
    } else {
      body = '<div class="opts">' + (q.options || []).map(function (o, idx) {
        var cls = 'opt';
        if (checked) {
          var isAns = q.type === 'multiple' ? (q.answer || []).indexOf(idx) > -1 : idx === q.answer;
          var isMine = q.type === 'multiple' ? (Array.isArray(my) && my.indexOf(idx) > -1) : idx === my;
          if (isAns) cls += ' ok';
          else if (isMine) cls += ' bad';
        } else if (q.type === 'multiple' ? (Array.isArray(my) && my.indexOf(idx) > -1) : idx === my) {
          cls += ' sel';
        }
        return '<button class="' + cls + '" type="button" data-i="' + idx + '"' + (checked ? ' disabled' : '') + '>' +
          '<span class="k">' + 'ABCDEFGH'[idx] + '</span><span>' + WB.esc(o) + '</span></button>';
      }).join('') + '</div>';
    }

    var actions = '';
    if (subjective && !checked) {
      actions = revealed
        ? '<button class="btn" data-self="1" type="button">✓ 记住了</button>' +
          '<button class="btn btn-ghost" data-self="0" type="button">✕ 没记住</button>'
        : '<button class="btn" id="revealBtn" type="button">查看参考答案</button>';
    } else if (checked) {
      actions = '<button class="btn" id="nextInline" type="button">下一题 →</button>' +
        (right && WB.store.wrong()[q.uid]
          ? '<button class="btn btn-ghost" id="dropWrong" type="button">✓ 移出错题本</button>'
          : '');
    } else if (q.type === 'multiple') {
      actions = '<button class="btn" id="submitBtn" type="button">确认作答</button>';
    } else if (q.type === 'fill') {
      actions = '<button class="btn" id="submitBtn" type="button">确认作答</button>';
    }

    var expHtml = '';
    if (subjective) {
      if (revealed) {
        expHtml = '<div class="exp">' +
          '<h4>参考答案</h4>' +
          subjBody(q) + srcLine(q) +
          '</div>';
      }
    } else if (checked) {
      expHtml = '<div class="exp">' +
        '<h4>解析</h4>' +
        '<span class="verdict ' + (right ? 'v-ok' : 'v-bad') + '">' + (right ? '✓ 答对了' : '✕ 答错了') + '</span>' +
        '<p class="ansline">正确答案：' + esc4(answerText(q)) + '</p>' +
        (q.explain ? '<div>' + q.explain + '</div>' : '<div style="color:#5B6B80">这道题暂无解析。</div>') +
        srcLine(q) +
        '</div>';
    }

    stage.innerHTML = '<div class="card">' +
      '<div class="stickers">' + sticks + '</div>' +
      '<h2 class="stem">' + esc4(q.stem) + '</h2>' +
      body +
      (actions ? '<div class="actions">' + actions + '</div>' : '') +
      expHtml +
      '</div>';

    posEl.textContent = WB.pad(st.i + 1) + ' / ' + WB.pad(pool.length);
    ptextEl.textContent = '已答 ' + answeredCount() + ' / ' + pool.length +
      (st.src ? ' · ' + WB.srcName(st.src) : '') + (st.ch ? ' · ' + st.ch : '');
    barEl.style.width = (pool.length ? Math.round(answeredCount() / pool.length * 100) : 0) + '%';
    updateScore();
    updateTools();
    bind();
  }

  function judgeOpt(q, my, checked, val) {
    var cls = 'opt';
    if (checked) {
      if (q.answer === val) cls += ' ok';
      else if (my === val) cls += ' bad';
    } else if (my === val) cls += ' sel';
    return '<button class="' + cls + '" type="button" data-v="' + val + '"' + (checked ? ' disabled' : '') + '>' +
      '<span class="k">' + (val ? 'T' : 'F') + '</span><span>' + (val ? '正确' : '错误') + '</span></button>';
  }

  function answeredCount() {
    var n = 0;
    pool.forEach(function (q) { if (st.checked[q.uid]) n++; });
    return n;
  }

  function updateScore() {
    var ok = 0, bad = 0;
    base.forEach(function (q) {
      if (!st.checked[q.uid]) return;
      if (isRight(q, st.ans[q.uid])) ok++; else bad++;
    });
    scoreEl.textContent = '✓ ' + ok + '　✕ ' + bad;
  }

  function updateTools() {
    orderBtn.textContent = st.order === 'rand' ? '随机出题' : '顺序出题';
    orderBtn.classList.toggle('on', st.order === 'rand');
    wrongBtn.classList.toggle('on', st.wrongOnly);
    var w = WB.store.wrong();
    var n = base.filter(function (q) { return !!w[q.uid]; }).length;
    wrongCountEl.textContent = n;
    favBtn.classList.toggle('on', st.favOnly);
    /* 计数按当前科目范围，避免「收藏夹 1」点进去却是空池 */
    favCountEl.textContent = base.filter(function (q) { return WB.store.isFav(q.uid); }).length;
  }

  /* ---------------- 交互 ---------------- */
  function pick(i) {
    if (st.checked[pool[st.i].uid] === undefined) { /* noop */ }
    st.ans[pool[st.i].uid] = i;
    save();
    render();
  }

  function bind() {
    var q = pool[st.i];

    var favStar = document.getElementById('favStar');
    if (favStar) favStar.addEventListener('click', function () {
      var on = WB.store.toggleFav(q);
      if (WB.toast) WB.toast(on ? '已加入收藏' : '已取消收藏');
      render();
    });

    stage.querySelectorAll('.opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (st.checked[q.uid]) return;
        if (q.type === 'judge') {
          st.ans[q.uid] = btn.getAttribute('data-v') === 'true';
          save(); render();
          return;
        }
        var idx = +btn.getAttribute('data-i');
        if (q.type === 'multiple') {
          var arr = Array.isArray(st.ans[q.uid]) ? st.ans[q.uid].slice() : [];
          var at = arr.indexOf(idx);
          if (at > -1) arr.splice(at, 1); else arr.push(idx);
          st.ans[q.uid] = arr;
          save(); render();
        } else {
          st.ans[q.uid] = idx;
          save(); render();
          /* 单选：选中即判分 */
          setTimeout(function () { check(); }, 120);
        }
      });
    });

    var reveal = document.getElementById('revealBtn');
    if (reveal) reveal.addEventListener('click', function () {
      st.revealed[q.uid] = true;
      save(); render();
    });

    stage.querySelectorAll('[data-self]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var ok = btn.getAttribute('data-self') === '1';
        st.ans[q.uid] = ok;
        st.checked[q.uid] = true;
        save(); render();
      });
    });

    var submit = document.getElementById('submitBtn');
    if (submit) submit.addEventListener('click', function () {
      if (q.type === 'fill') {
        var inp = document.getElementById('fillInput');
        st.ans[q.uid] = inp ? inp.value : '';
      }
      check();
    });

    var nx = document.getElementById('nextInline');
    if (nx) nx.addEventListener('click', function () { go(1); });

    var dw = document.getElementById('dropWrong');
    if (dw) dw.addEventListener('click', function () {
      WB.store.removeWrong(q.uid);
      if (WB.toast) WB.toast('已移出错题本');
      save(); render();
    });

    var inp = document.getElementById('fillInput');
    if (inp) inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); st.ans[q.uid] = inp.value; check(); }
    });
  }

  function check() {
    var q = pool[st.i];
    var my = st.ans[q.uid];
    if (q.type === 'multiple' && (!Array.isArray(my) || !my.length)) return;
    if (q.type === 'fill' && !String(my == null ? '' : my).trim()) return;
    if (my === undefined) return;
    st.checked[q.uid] = true;
    if (!WB.isCorrect(q, my)) {
      WB.store.addWrong({
        uid: q.uid, subjectId: q.subjectId, subjectName: q.subjectName,
        kid: q.uid, kTitle: q.kTitle, chapterTitle: q.chapterTitle,
        stem: q.stem, type: q.type, options: q.options || null,
        answer: q.answer, explain: q.explain || '', myAnswer: my
      });
    }
    /* 做对后不再自动移出：由用户在解析区点「移出错题本」自行决定 */
    /* 写入答题日志：drill 此前不记录，导致连续天数与周报统计缺失 */
    WB.store.addLog({ uid: q.uid, subjectId: q.subjectId, kid: q.kid, ok: WB.isCorrect(q, my) });
    save(); render();
  }

  function go(d) {
    rebuild();
    if (!pool.length) return;
    st.i = (st.i + d + pool.length) % pool.length;
    save(); render();
  }

  document.getElementById('prevBtn').addEventListener('click', function () { go(-1); });
  document.getElementById('nextBtn').addEventListener('click', function () { go(1); });

  orderBtn.addEventListener('click', function () {
    st.order = st.order === 'rand' ? 'seq' : 'rand';
    st.i = 0; save(); render();
  });

  wrongBtn.addEventListener('click', function () {
    st.wrongOnly = !st.wrongOnly;
    /* 错题本是一个独立集合：进入时清掉章节/来源/收藏筛选，保证看到全部错题 */
    if (st.wrongOnly) { st.ch = ''; st.src = ''; st.favOnly = false; }
    st.i = 0; save(); render();
  });

  favBtn.addEventListener('click', function () {
    st.favOnly = !st.favOnly;
    st.i = 0; save(); render();
  });

  document.getElementById('resetBtn').addEventListener('click', function () {
    if (!confirm('清空本科目的刷题进度与已判记录？（错题本不受影响）')) return;
    st.ans = {}; st.checked = {}; st.i = 0; save(); render();
  });

  /* 抽屉 */
  var drawer = document.getElementById('drawer');
  var mask = document.getElementById('mask');
  var srcbar = document.getElementById('srcbar');
  var chbar = document.getElementById('chbar');
  var gridWrap = document.getElementById('gridWrap');

  var pickBtnEl = document.getElementById('pickBtn');
  function openDrawer() {
    renderDrawer();
    drawer.classList.add('on'); mask.classList.add('on');
    drawer.setAttribute('aria-hidden', 'false');
    if (pickBtnEl) pickBtnEl.setAttribute('aria-expanded', 'true');
    var c = document.getElementById('drClose');
    if (c) c.focus();
  }
  function closeDrawer() {
    drawer.classList.remove('on'); mask.classList.remove('on');
    drawer.setAttribute('aria-hidden', 'true');
    if (pickBtnEl) { pickBtnEl.setAttribute('aria-expanded', 'false'); pickBtnEl.focus(); }
  }
  document.getElementById('pickBtn').addEventListener('click', openDrawer);
  document.getElementById('drClose').addEventListener('click', closeDrawer);
  mask.addEventListener('click', closeDrawer);

  function chList() {
    var seen = {}, out = [];
    base.forEach(function (q) {
      if (seen[q._chKey]) return;
      seen[q._chKey] = 1; out.push(q._chKey);
    });
    return out;
  }

  function renderDrawer() {
    var chs = chList();
    var counts = {};
    base.forEach(function (q) { counts[q._chKey] = (counts[q._chKey] || 0) + 1; });

    /* 来源筛选：计数以当前章节范围为基准，避免「选了 PPT 又选章节」后为空 */
    var scope = st.ch ? base.filter(function (q) { return q._chKey === st.ch; }) : base;
    var sc = {};
    scope.forEach(function (q) { var t = WB.srcType(q); sc[t] = (sc[t] || 0) + 1; });
    srcbar.innerHTML = '<button class="chip' + (st.src ? '' : ' on') + '" type="button" data-src="">全部 ' + scope.length + '</button>' +
      WB.SRC_TYPES.map(function (t) {
        if (!sc[t.id]) return '';
        var tip = t.name + ' · ' + sc[t.id] + ' 题';
        if (t.id === 'mix') tip += '（课件/复习资料/题库等多种来源混合）';
        if (t.id === 'ppt') tip += '（仅收课件原文题，不含复习资料）';
        return '<button class="chip' + (st.src === t.id ? ' on' : '') + '" type="button" data-src="' + t.id + '" title="' + tip + '">' +
          t.name + ' ' + sc[t.id] + '</button>';
      }).join('');
    srcbar.querySelectorAll('.chip').forEach(function (b) {
      b.addEventListener('click', function () {
        st.src = b.getAttribute('data-src'); st.i = 0; save(); render(); renderDrawer();
      });
    });

    chbar.innerHTML = '<button class="chip' + (st.ch ? '' : ' on') + '" type="button" data-ch="">全部 ' + base.length + '</button>' +
      chs.map(function (c) {
        return '<button class="chip' + (st.ch === c ? ' on' : '') + '" type="button" data-ch="' + WB.esc(c) + '" title="' + WB.esc(c) + ' · ' + counts[c] + ' 题">' +
          WB.esc(shortCh(c)) + '</button>';
      }).join('');

    /* 题号网格按章节分组（用当前顺序下的序号） */
    var ordered = base.slice();
    if (st.order === 'rand') {
      ordered.sort(function (a, b) {
        function h(x) { var n = 0; for (var i = 0; i < x.length; i++) n = (n * 31 + x.charCodeAt(i)) >>> 0; return n; }
        return h(a.uid) - h(b.uid);
      });
    }
    var groups = [], map = {};
    ordered.forEach(function (q, idx) {
      if (!map[q._chKey]) { map[q._chKey] = { key: q._chKey, items: [] }; groups.push(map[q._chKey]); }
      map[q._chKey].items.push({ q: q, n: idx });
    });

    var curUid = pool.length ? pool[st.i].uid : '';
    gridWrap.innerHTML = groups.map(function (g) {
      var done = g.items.filter(function (it) { return st.checked[it.q.uid]; }).length;
      var cells = g.items.map(function (it) {
        var cls = 'gcell';
        if (st.checked[it.q.uid]) cls += WB.isCorrect(it.q, st.ans[it.q.uid]) ? ' ok' : ' bad';
        if (it.q.uid === curUid) cls += ' cur';
        return '<button class="' + cls + '" type="button" data-uid="' + it.q.uid + '" data-n="' + it.n + '">' + WB.pad(it.n + 1) + '</button>';
      }).join('');
      return '<div class="grp"><div class="grp-h"><span class="grp-t" title="' + WB.esc(g.key) + '">' + WB.esc(g.key) + '</span>' +
        '<span class="grp-n">' + done + '/' + g.items.length + '</span></div><div class="grid">' + cells + '</div></div>';
    }).join('');

    chbar.querySelectorAll('.chip').forEach(function (b) {
      b.addEventListener('click', function () {
        st.ch = b.getAttribute('data-ch'); st.i = 0; save(); render(); renderDrawer();
      });
    });
    gridWrap.querySelectorAll('.gcell').forEach(function (b) {
      b.addEventListener('click', function () {
        var uid = b.getAttribute('data-uid');
        /* 若目标题不在当前筛选范围内，自动把范围切到它所属章节 */
        var target = base.filter(function (q) { return q.uid === uid; })[0];
        if (!target) return;
        var inPool = pool.some(function (q) { return q.uid === uid; });
        if (!inPool) {
          if (st.wrongOnly && !WB.store.wrong()[uid]) st.wrongOnly = false;
          st.ch = target._chKey;
          save(); render();
          rebuild();
        }
        var at = -1;
        pool.forEach(function (q, i) { if (q.uid === uid) at = i; });
        if (at > -1) { st.i = at; save(); render(); }
        closeDrawer();
      });
    });
  }

  function shortCh(s) {
    return s.length > 10 ? s.slice(0, 9) + '…' : s;
  }

  /* 键盘 */
  document.addEventListener('keydown', function (e) {
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (drawer.classList.contains('on')) {
      if (e.key === 'Escape') closeDrawer();
      return;
    }

    var cq = pool[st.i];
    var answered = cq ? !!st.checked[cq.uid] : true;

    /* 数字键 1–4 选答（单选题） */
    if (cq && cq.type === 'single' && !answered && /^[1-9]$/.test(e.key)) {
      var btn = document.querySelector('.opt[data-v="' + (parseInt(e.key, 10) - 1) + '"]');
      if (btn) { e.preventDefault(); btn.click(); return; }
    }

    /* Enter：未作答则提交，已作答则进入下一题 */
    if (e.key === 'Enter') {
      if (!answered) {
        var sb = document.getElementById('submitBtn');
        if (sb) { e.preventDefault(); sb.click(); return; }
      } else {
        e.preventDefault(); go(1); return;
      }
    }

    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  });

  /* 移动端：左右滑动切题 */
  (function () {
    var sx = 0, sy = 0, tracking = false;
    document.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      /* 横向位移超过 60px 且明显大于纵向，才判定为切题，避免误触滚动 */
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        go(dx > 0 ? -1 : 1);
      }
    }, { passive: true });
  })();

  function renderAll() { render(); }

  renderAll();
  }
})();
