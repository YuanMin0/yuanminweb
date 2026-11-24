/* 生成 exam5 的三套试卷页与目录页 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'exam5');
const sb = { window: {}, console };
vm.createContext(sb);
['meta.js', 'p1.js', 'p2.js', 'p3.js'].forEach(f => {
  vm.runInContext(fs.readFileSync(path.join(OUT, 'data', f), 'utf8'), sb, { filename: f });
});
const EX = sb.window.EXAM5;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LETTER = 'ABCDEFGH';

function tagHTML(t) {
  if (!t) return '';
  return `<span class="q-tag">${esc(t)}</span>`;
}

function choiceHTML(q, no, isMulti) {
  const opts = q.o.map((o, i) =>
    `<div class="opt"><span class="k">${LETTER[i]}.</span><span class="t">${o}</span></div>`
  ).join('');
  const ans = isMulti
    ? q.a.slice().sort((x, y) => x - y).map(i => LETTER[i]).join('、')
    : LETTER[q.a];
  return `<div class="q" id="q${no}">
  <div class="q-head"><span class="q-no">${no}.</span>${tagHTML(q.tag)}<span class="q-stem">${q.q}</span></div>
  <div class="opts">${opts}</div>
  <details class="ans"><summary>查看答案与解析</summary>
    <div class="ans-body">
      <p class="ans-line"><span class="lbl">答案：</span><span class="ans-key">${ans}</span></p>
      <p class="ans-line"><span class="lbl">解析：</span><span class="ans-exp">${q.e}</span></p>
      <p class="ans-line ans-src"><span class="lbl">来源：</span>${esc(q.s)}</p>
    </div>
  </details>
</div>`;
}

function stripPrefix(t, p) {
  return String(t || '').replace(new RegExp('^' + p + '[:：]\\s*'), '');
}

function termHTML(q, no) {
  return `<div class="q" id="q${no}">
  <div class="q-head"><span class="q-no">${no}.</span>${tagHTML(q.tag)}<span class="q-stem">${q.q}</span></div>
  <details class="ans"><summary>查看答案与解析</summary>
    <div class="ans-body">
      <p class="ans-line"><span class="lbl">答案：</span><span class="ans-key">${q.a}</span></p>
      <p class="ans-line"><span class="lbl">记忆版：</span><span class="ans-brief">${q.brief}</span></p>
      <p class="ans-line"><span class="lbl">答题要点：</span><span class="ans-exp">${stripPrefix(q.e, '答题要点')}</span></p>
      <p class="ans-line ans-src"><span class="lbl">来源：</span>${esc(q.s)}</p>
    </div>
  </details>
</div>`;
}

function essayHTML(q, no) {
  const list = q.a.map(x => `<li>${x}</li>`).join('');
  return `<div class="q" id="q${no}">
  <div class="q-head"><span class="q-no">${no}.</span>${tagHTML(q.tag)}<span class="q-stem">${q.q}</span></div>
  <div class="write" aria-hidden="true"></div>
  <details class="ans"><summary>查看参考答案与评分要点</summary>
    <div class="ans-body">
      <p class="ans-line"><span class="lbl">参考答案：</span></p>
      <ul class="ans-list">${list}</ul>
      <p class="ans-line" style="margin-top:6px"><span class="lbl">评分要点：</span><span class="ans-exp">${stripPrefix(q.e, '评分要点')}</span></p>
      <p class="ans-line ans-src"><span class="lbl">来源：</span>${esc(q.s)}</p>
    </div>
  </details>
</div>`;
}

function renderPaper(p, meta) {
  let no = 0;
  const body = p.sections.map(sec => {
    const isChoice = sec.key === 'single' || sec.key === 'multiple';
    const items = sec.items.map(it => {
      no++;
      if (sec.key === 'single') return choiceHTML(it, no, false);
      if (sec.key === 'multiple') return choiceHTML(it, no, true);
      if (sec.key === 'term') return termHTML(it, no);
      return essayHTML(it, no);
    }).join('\n');
    return `<section class="sec">
  <h2 class="sec-title">${sec.title}</h2>
  <p class="sec-desc">${sec.desc}</p>
  ${items}
</section>`;
  }).join('\n');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#e8e8e8">
<title>${esc(p.name)} · ${esc(meta.exam)}</title>
<meta name="description" content="${esc(meta.course)}${esc(meta.exam)}（${esc(p.name)}）：选择题 40 道、名词解释 6 道、论述题 3 道，含答案、解析与来源。">
<link rel="icon" href="../icons/icon-192.png">
<link rel="stylesheet" href="exam.css">
</head>
<body>
<div class="tools">
  <a href="index.html">← 返回目录</a>
  <button type="button" data-act="open">展开全部答案</button>
  <button type="button" data-act="close">收起全部</button>
  <button type="button" data-act="print">打印试卷</button>
</div>

<div class="page">
  <header class="exam-head">
    <div class="org">期末考试</div>
    <h1>${esc(meta.exam)}<br>${esc(p.name)}</h1>
    <div class="sub">考试时间：90 分钟　　满分：100 分</div>
    <div class="meta-line">${esc(meta.format)}</div>
    <div class="candidate"><span>姓名 <i></i></span><span>学号 <i></i></span><span>班级 <i></i></span><span>得分 <i></i></span></div>
  </header>

  <div class="notice">
    <b>注意事项：</b><br>
    1. 答题前请将姓名、学号、班级填写清楚。<br>
    2. 选择题请将答案填写在题号后的括号内或答题卡上。<br>
    3. 名词解释与论述题请分点作答，条理清楚。<br>
    4. 题号旁的方框标注该考点在往年出现的次数或预测等级，仅供复习参考，不影响作答。
  </div>

  ${body}
</div>

<script>
(function () {
  document.querySelectorAll('.tools [data-act]').forEach(function (b) {
    b.addEventListener('click', function () {
      var act = b.getAttribute('data-act');
      if (act === 'print') { window.print(); return; }
      var open = act === 'open';
      document.querySelectorAll('details.ans').forEach(function (d) { d.open = open; });
    });
  });
})();
</script>
</body>
</html>`;
}

/* ---------- 目录页 ---------- */
function renderIndex() {
  const cards = EX.papers.map(p => {
    const sec = {};
    p.sections.forEach(s => sec[s.key] = s.items);
    const nSingle = (sec.single || []).length, nMulti = (sec.multiple || []).length;
    const counts = nMulti
      ? `单项 ${nSingle} 道 · 多项 ${nMulti} 道`
      : `单项选择 ${nSingle} 道`;
    const focus = p.id === 1 ? '基础覆盖：生理、病理、病生、药理四大板块的基本概念与常规判断。'
      : p.id === 2 ? '机制与鉴别：侧重发生机制、类型鉴别与常用药物特点。'
        : '综合与病例：侧重跨章节综合、病例分析与用药注意事项。';
    return `<a class="card" href="paper${p.id}.html">
      <h2>${esc(p.name)}</h2>
      <p class="tag">${esc(p.tagline)}</p>
      <ul>
        <li>${counts}</li>
        <li>名词解释 6 道（病生 4 · 病理 1 · 药理 1）</li>
        <li>论述题 3 道（生理、病生、药理各 1 道）</li>
        <li>${focus}</li>
      </ul>
      <div class="go">开始作答 →</div>
    </a>`;
  }).join('\n');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#e8e8e8">
<title>器官系统基础IV模拟卷（三套）</title>
<meta name="description" content="器官系统基础IV模拟卷（三套）：选择题 40 道、名词解释 6 道、论述题 3 道，按学时占比配分，含答案、解析与来源。">
<link rel="icon" href="../icons/icon-192.png">
<link rel="stylesheet" href="exam.css">
</head>
<body>
<div class="index-wrap">
  <header class="index-head">
    <p style="letter-spacing:.28em;font-size:13px">期末考试</p>
    <h1>${esc(EX.meta.exam)}</h1>
    <p>${esc(EX.meta.scope)}</p>
    <p>${esc(EX.meta.format)}</p>
    <p>${esc(EX.meta.marks)}</p>
    <p>${esc(EX.meta.marks2)}</p>
  </header>
  <div class="cards">
    ${cards}
  </div>
  <p class="foot-note">${esc(EX.meta.note)}</p>
</div>
</body>
</html>`;
}

EX.papers.forEach(p => {
  fs.writeFileSync(path.join(OUT, `paper${p.id}.html`), renderPaper(p, EX.meta), 'utf8');
  console.log('写入 paper' + p.id + '.html');
});
fs.writeFileSync(path.join(OUT, 'index.html'), renderIndex(), 'utf8');
console.log('写入 index.html');
