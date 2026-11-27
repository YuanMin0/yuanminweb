
(function () {
  WB.mountChrome('home');
  var st = WB.stats();

  /* ---------- 统计条 ---------- */
  document.getElementById('stats').innerHTML =
    '<div class="stats">' +
      stat(st.subjects, '科目') + stat(st.chapters, '章节') +
      stat(st.knowledge, '知识点') + stat(st.quiz, '练习题') +
    '</div>';
  function stat(n, l) {
    return '<div class="stat spot rv" style="--accent:var(--brand)">' +
      '<div class="stat-n"><span data-count="' + n + '">0</span></div>' +
      '<div class="stat-l">' + l + '</div></div>';
  }

  /* ---------- 快捷入口 ---------- */
  var last = null;
  try { last = JSON.parse(localStorage.getItem('medilearn.last.v1') || 'null'); } catch (e) {}
  var tiles = [
    { ico: '◈', t: '继续上次学习', d: last ? (last.name + ' · ' + last.kTitle) : '从任一科目开始你的复习',
      href: last ? WB.link('knowledge.html', { s: last.s, k: last.k }) : 'subjects.html' },
    { ico: '✦', t: '错题本', d: '自动收录做错的题，支持重做与移除', href: 'wrongbook.html' },
    { ico: '★', t: '我的收藏', d: '刷题时标记的题，考前集中回看', href: 'favorites.html' },
    { ico: '⚡', t: '随机练习', d: '从全部科目随机抽题，检验掌握程度', href: 'quiz.html?mode=random' }
  ];
  document.getElementById('tiles').innerHTML = tiles.map(function (t, i) {
    return '<a class="tile spot rv rv-d' + (i + 1) + '" style="--accent:var(--teal)" href="' + t.href + '">' +
      '<div class="tile-ico">' + t.ico + '</div><div style="min-width:0">' +
      '<div class="tile-t">' + t.t + '</div><div class="tile-d">' + WB.esc(t.d) + '</div></div></a>';
  }).join('');

  /* ---------- 科目卡片 ---------- */
  document.getElementById('subjGrid').innerHTML = WB.subjects().map(function (s, i) {
    var pct = WB.store.subjectPct(s.id);
    var href = s.ext ? s.ext : WB.link('subject.html', { s: s.id });
    return '<a class="subj-card spot rv rv-d' + ((i % 3) + 1) + '" style="--accent:' + s.accent + ';--accent-soft:' + s.accentSoft + '" href="' + href + '">' +
      '<div class="subj-top">' +
        '<div class="subj-ico">' + s.icon + '</div>' +
        '<div style="min-width:0;flex:1">' +
          '<div class="subj-name">' + WB.esc(s.name) + (s.tag ? '<span class="subj-tag">' + WB.esc(s.tag) + '</span>' : '') + '</div>' +
          '<div class="subj-en">' + WB.esc(s.en || '') + '</div>' +
        '</div>' +
        
      '</div>' +
      '<p class="subj-desc">' + WB.esc(s.desc) + '</p>' +
      WB.subjectProgress(s) +
      '<div class="subj-foot">' +
        '<div class="subj-meta">' +
          '<span><b>' + s._count.chapters + '</b> 章</span>' +
          '<span><b>' + s._count.knowledge + '</b> 知识点</span>' +
          '<span><b>' + s._count.quiz + '</b> 题</span>' +
        '</div>' +
        '<div class="spacer"></div>' +
        (function () {
          var dh = WB.drillHref(s);
          return dh ? '<span class="chip chip-quiz" role="link" tabindex="0" data-alt="' + dh + '" aria-label="' + WB.esc(s.name) + ' 刷题"><span class="chip-quiz-i" aria-hidden="true">✎</span>刷题</span>' : '';
        })() +
        '<span class="chip chip-line">' + (s.ext ? '打开 →' : '进入 →') + '</span>' +
      '</div></a>';
  }).join('');

  /* 卡片内次入口（刷题）：卡片本身是 <a>，用 data-alt 的 span 承载并拦截默认跳转 */
  (function () {
    var g = document.getElementById('subjGrid');
    if (!g) return;
    function goAlt(e) {
      var el = e.target.closest('[data-alt]');
      if (!el) return;
      e.preventDefault(); e.stopPropagation();
      location.href = el.getAttribute('data-alt');
    }
    g.addEventListener('click', goAlt);
    g.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      goAlt(e);
    });
  })();


  /* ---------- 启动特效 ---------- */
  WB.fx.init();
  /* 顶部标签保持静态，不做打字机循环 */
})();
