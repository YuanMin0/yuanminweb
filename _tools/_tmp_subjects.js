
(function () {
  WB.mountChrome('subjects');

  var sortBy = 'order';
  var curCat = 'all';

  function subjList() {
    var list = WB.subjects().slice();
    if (curCat !== 'all') list = list.filter(function (s) { return WB.catOf(s) === curCat; });
    if (sortBy === 'quiz') list.sort(function (a, b) { return b._count.quiz - a._count.quiz; });
    else if (sortBy === 'progress') list.sort(function (a, b) { return WB.store.subjectPct(b.id) - WB.store.subjectPct(a.id); });
    else if (sortBy === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name, 'zh'); });
    else list.sort(function (a, b) { return (a.order || 99) - (b.order || 99); });
    return list;
  }

  function card(s, i) {
    var pct = WB.store.subjectPct(s.id);
    var href = s.ext ? s.ext : WB.link('subject.html', { s: s.id });
    var locked = s.sem !== 'dasan1';           /* 只有大三上开放学习功能 */
    var tag = locked ? 'div' : 'a';
    var attrs = locked
      ? 'class="subj-card spot is-locked rv rv-d' + ((i % 3) + 1) + '" aria-disabled="true" title="参考资料不足，暂未开放"'
      : 'class="subj-card spot rv rv-d' + ((i % 3) + 1) + '" href="' + href + '"';
    return '<' + tag + ' ' + attrs + ' style="--accent:' + s.accent + ';--accent-soft:' + s.accentSoft + '">' +
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
          (s._count.chapters
            ? '<span><b>' + s._count.chapters + '</b> 章</span>' +
              '<span><b>' + s._count.knowledge + '</b> 知识点</span>' +
              '<span><b>' + s._count.quiz + '</b> 题</span>'
            : '<span class="chip chip-teal">资料型</span>' +
              '<span><b>' + (s.matCount || 0) + '</b> 份资料</span>') +
        '</div><div class="spacer"></div>' +
        (locked
          ? '<span class="chip chip-line">暂未开放</span>'
          : (function () {
              var dh = WB.drillHref(s);
              return dh ? '<span class="chip chip-quiz" role="link" tabindex="0" data-alt="' + dh + '" aria-label="' + WB.esc(s.name) + ' 刷题"><span class="chip-quiz-i" aria-hidden="true">✎</span>刷题</span>' : '';
            })() +
            '<span class="chip chip-line">' + (s.ext ? '打开 →' : '进入 →') + '</span>') +
      '</div></' + tag + '>';
  }

  function render() {
    var list = subjList();
    document.getElementById('sCount').textContent = list.length;
    document.getElementById('grid').innerHTML = list.map(card).join('');
    document.getElementById('lockNote').classList.toggle('hide', curCat === 'dasan1');
    WB.fx.refresh();
  }
  function renderTabs() {
    var all = WB.subjects();
    document.getElementById('catTabs').innerHTML = WB.CATS.map(function (c) {
      var n = c.id === 'all' ? all.length
        : all.filter(function (s) { return WB.catOf(s) === c.id; }).length;
      if (!n && c.id !== 'all') return '';
      return '<button role="tab" class="cat-tab' + (curCat === c.id ? ' on' : '') +
        '" data-cat="' + c.id + '" aria-selected="' + (curCat === c.id) + '">' +
        WB.esc(c.name) + '<span class="cat-n">' + n + '</span></button>';
    }).join('');
  }

  document.getElementById('catTabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]');
    if (!b) return;
    curCat = b.getAttribute('data-cat');
    renderTabs();
    render();
  });

  /* 卡片内的次入口（刷题）：卡片本身是 <a>，不能嵌套链接，
     所以用带 data-alt 的 span 承载，这里拦下默认跳转。 */
  var gridEl = document.getElementById('grid');
  function goAlt(e) {
    var el = e.target.closest('[data-alt]');
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    location.href = el.getAttribute('data-alt');
  }
  gridEl.addEventListener('click', goAlt);
  gridEl.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    goAlt(e);
  });

  renderTabs();
  render();

  /* 排序 */
  document.getElementById('sortSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    this.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
    b.classList.add('on'); sortBy = b.getAttribute('data-sort'); render();
  });

  /* 搜索 + 联想 */
  var qEl = document.getElementById('q'), sugEl = document.getElementById('sug');
  var sWrap = document.getElementById('searchWrap'), sList = document.getElementById('searchList'), sSub = document.getElementById('searchSub');
  var tmr = null;

  function hl(text, q) {
    var t = WB.esc(text);
    if (!q) return t;
    var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return t.replace(re, '<mark>$1</mark>');
  }

  qEl.addEventListener('input', function () {
    clearTimeout(tmr);
    var q = qEl.value.trim();
    if (!q) { sugEl.innerHTML = ''; sWrap.classList.add('hide'); return; }
    tmr = setTimeout(function () { runSearch(q); }, 160);
  });

  qEl.addEventListener('keydown', function (e) { if (e.key === 'Escape') { qEl.value = ''; sugEl.innerHTML = ''; sWrap.classList.add('hide'); } });
  document.addEventListener('click', function (e) { if (!e.target.closest('.search')) sugEl.innerHTML = ''; });

  function runSearch(q) {
    var res = WB.search(q);
    /* 联想层：前 6 条 */
    sugEl.innerHTML = res.length
      ? '<div class="sug">' + res.slice(0, 6).map(function (r) {
          return '<a class="sug-item" href="' + WB.link('knowledge.html', { s: r.subject.id, k: r.k.id }) + '">' +
            '<div class="sug-t">' + hl(r.k.title, q) + '</div>' +
            '<div class="sug-d">' + WB.esc(r.subject.name) + ' · ' + WB.esc(r.k.chapterTitle) + '</div></a>';
        }).join('') + '</div>'
      : '<div class="sug"><div class="sug-item"><div class="sug-d">没有匹配的知识点</div></div></div>';

    /* 结果列表 */
    sWrap.classList.remove('hide');
    sSub.textContent = '关键词「' + q + '」命中 ' + res.length + ' 个知识点';
    if (!res.length) {
      sList.innerHTML = WB.empty('🔍', '没有找到相关内容', '换个关键词试试，例如「构词法」「t 检验」「强军目标」「两山」', '', 'search');
    } else {
      sList.innerHTML = res.map(function (r) {
        var k = r.k;
        return '<div class="chapter open spot" style="--accent:' + r.subject.accent + ';--accent-soft:' + r.subject.accentSoft + '">' +
          '<div class="chapter-hd" style="cursor:default">' +
            '<div class="chapter-no">' + r.subject.icon + '</div>' +
            '<div style="flex:1;min-width:0">' +
              '<div class="chapter-t">' + hl(k.title, q) + '</div>' +
              '<div class="chapter-s">' + WB.esc(r.subject.name) + ' · ' + WB.esc(k.chapterTitle) + ' · ' + k.quiz.length + ' 题</div>' +
            '</div>' +
            '<a class="gbtn gbtn-sm" href="' + WB.link('knowledge.html', { s: r.subject.id, k: k.id }) + '">查看</a>' +
          '</div>' +
          '<div class="chapter-bd" style="max-height:none;opacity:1">' +
            '<div class="krow" style="border-bottom:0"><div class="krow-main">' +
              '<div class="krow-d" style="white-space:normal">' + WB.esc(r.snippet) + '</div>' +
            '</div></div>' +
          '</div></div>';
      }).join('');
    }
    WB.fx.refresh();
  }

  document.getElementById('clearSearch').addEventListener('click', function () {
    qEl.value = ''; sugEl.innerHTML = ''; sWrap.classList.add('hide');
  });

  /* 快捷键 / 聚焦搜索 */
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== qEl) { e.preventDefault(); qEl.focus(); }
  });

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

  WB.fx.init();
})();
