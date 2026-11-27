
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


  /* ---------- 功能说明 ---------- */
  function guideCard(x, i) {
    return '<article class="guide-card spot rv rv-d' + ((i % 3) + 1) + '" style="--accent:' + x.c + ';--accent-soft:' + x.cs + '">' +
      '<div class="guide-row"><span class="guide-ico">' + x.i + '</span>' +
        '<div><b class="guide-name">' + x.t + '</b><span class="guide-tag">' + x.tag + '</span></div></div>' +
      '<p class="guide-d">' + x.d + '</p>' +
      '<div class="guide-use"><b>什么时候用</b>　' + x.u + '</div>' +
    '</article>';
  }
  function renderGuide(id, list) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = list.map(guideCard).join('');
  }

  renderGuide('guideNav', [
    { i: '◈', c: 'var(--brand)', cs: 'var(--brand-soft)', t: '学习', tag: '看内容',
      d: '按「科目 → 章节 → 知识点」逐层展开，表格、要点框、术语卡、配图与口诀都在这里。',
      u: '第一次系统过内容、查漏补缺、考前回看知识点。' },
    { i: '✎', c: 'var(--teal)', cs: 'var(--teal-soft)', t: '刷题', tag: '只考选择题',
      d: '只出单选与多选，提交后立即判分并给出解析；可按章节筛选、只刷错题，进度自动保存。',
      u: '碎片时间刷题、课后快速检验、考前刷手感。' },
    { i: '▤', c: 'var(--violet)', cs: 'var(--violet-soft)', t: '资料库', tag: '原始材料',
      d: '按科目归档课件 PDF、复习总结、讲义等原始文件，可在线预览或下载。',
      u: '想对照老师原版课件、找某张图或某个表格的出处。' },
    { i: '◐', c: 'var(--amber)', cs: 'var(--amber-soft)', t: '我的', tag: '错题与进度',
      d: '错题本、学习进度与站点设置集中在这里；答错的题会自动收录，可重做或移除。',
      u: '定期清理错题、查看各科完成度。' },
    { i: '✦', c: 'var(--rose)', cs: 'var(--rose-soft)', t: '考前速记', tag: '冲刺用',
      d: '每科一页精编速记：知识块 + 配图 + 口诀，顶部有「刷题 N 题」按钮直达该科选择题。',
      u: '考前 1–2 天快速过一遍，配合刷题查漏。' }
  ]);

  renderGuide('guideActs', [
    { i: '✎', c: 'var(--brand)', cs: 'var(--brand-soft)', t: '开始刷题', tag: '只出选择题',
      d: '只抽单选与多选，即时判分；答错自动进错题本，可按章节筛选。按钮上的题量就是该科选择题总数。',
      u: '日常刷题、课后自测。需要主观题请用「全科测验」。' },
    { i: '◉', c: 'var(--violet)', cs: 'var(--violet-soft)', t: '全科测验', tag: '全部题型',
      d: '覆盖单选、多选、判断、填空、名词解释、简答、论述。主观题先自行作答，再展开参考答案，按「基本答对 / 要点缺失」自评。',
      u: '整章或整科模拟，检验主观题能否写出要点。' },
    { i: '⇩', c: 'var(--teal)', cs: 'var(--teal-soft)', t: '下载讲义', tag: '导出 Markdown',
      d: '把该科知识点与题目导出为 Markdown 文件，可用任意编辑器二次整理，或打印成 PDF。',
      u: '需要离线复习、自己补充笔记、打印随身看。' },
    { i: '📂', c: 'var(--amber)', cs: 'var(--amber-soft)', t: '资料汇总', tag: '按类型分组',
      d: '该科目的全部原始资料，按课件、复习总结、试题等类型分组，标注页数与大小。',
      u: '想找某份课件、某年试题的原文件。' }
  ]);

  renderGuide('guideTags', [
    { i: '▤', c: 'var(--teal)', cs: 'var(--teal-soft)', t: '来源', tag: '这道题从哪来',
      d: '标注 PPT 原题、习题集原题、历年真题、讲义整理或拓展题，并写明讲次 / 页码 / 年份题号，可回溯核查。',
      u: '想知道一道题是老师课件原题，还是整理时补充的拓展题。' },
    { i: '◉', c: 'var(--amber)', cs: 'var(--amber-soft)', t: '考频', tag: '考得多不多',
      d: '分高频、中频、低频三档：真题反复命中的为高频，课件与习题集覆盖的为中频，拓展补充的为低频。',
      u: '时间紧时优先刷高频，低频题留到最后。' },
    { i: '✓', c: 'var(--rose)', cs: 'var(--rose-soft)', t: '考过', tag: '什么时候考的',
      d: '「考过·原题（2020）」表示该题在对应年份考过；无年份记录的真题标「年份未标」；课件覆盖的考点标「考过·考点」；整理时新增的标「未考过」。',
      u: '判断一道题是真题原题、课件考点，还是纯拓展。' }
  ]);
  WB.fx.refresh();

  /* ---------- 启动特效 ---------- */
  WB.fx.init();
  /* 顶部标签保持静态，不做打字机循环 */
})();
