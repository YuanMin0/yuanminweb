/* 第二轮：题库数据完整性审查 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
function fakeEl() {
  const el = {
    style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, getAttribute: () => null, removeAttribute() {},
    appendChild() {}, removeChild() {}, addEventListener() {}, remove() {},
    querySelector: () => null, querySelectorAll: () => [], insertBefore() {}, cloneNode: () => fakeEl(),
    children: [], innerHTML: '', textContent: '', offsetWidth: 0, scrollHeight: 0
  };
  return el;
}
const doc = {
  documentElement: fakeEl(), body: fakeEl(), head: fakeEl(),
  createElement: () => fakeEl(), querySelector: () => null, querySelectorAll: () => [],
  addEventListener() {}, getElementById: () => null
};
const sandbox = {
  window: {}, document: doc,
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  location: { href: 'http://x/', pathname: '/', search: '' },
  navigator: { userAgent: 'node' },
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  setTimeout, clearTimeout, setInterval, clearInterval,
  URL: { createObjectURL: () => '', revokeObjectURL() {} },
  console
};
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.document = doc;
sandbox.global = sandbox;
sandbox.self = sandbox;
vm.createContext(sandbox);

function load(f) {
  const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
  try { vm.runInContext(code, sandbox, { filename: f }); }
  catch (e) { console.log('!! 加载失败', f, e.message); }
  // 让数据文件里的裸 WB 能解析到
  if (!sandbox.WB && sandbox.window.WB) sandbox.WB = sandbox.window.WB;
}

load('js/core.js');
/* 先注册科目，再挂 exam，最后补 extra/quiz-meta */
const _files = fs.readdirSync(path.join(ROOT, 'data')).filter(f => f.endsWith('.js'));
const _subject = _files.filter(f => !f.startsWith('exam-') && !['_meta.js', 'quiz-meta.js', 'cdn-config.js', 'extra-subjects.js'].includes(f));
const _exam = _files.filter(f => f.startsWith('exam-'));
const DATA_ORDER = _subject.concat(_exam, ['extra-subjects.js', 'quiz-meta.js']).map(f => 'data/' + f);
DATA_ORDER.forEach(load);

const WB = sandbox.window.WB;
const subjects = WB.subjects();
console.log('注册科目数:', subjects.length);

const ALLOWED = new Set(['single', 'multiple', 'judge', 'fill', 'term', 'short', 'essay']);
const problems = [];
let totalQ = 0;
const typeCount = {};
const perSubject = [];

function norm(s) {
  return String(s == null ? '' : s)
    .replace(/[\uFF01-\uFF5E]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/[－—–−]/g, '-')
    .replace(/\s+/g, '')
    .replace(/[。，、；：！？,.;:!?"'()\[\]【】《》]/g, '')
    .toLowerCase();
}

for (const s of subjects) {
  let qn = 0, choice = 0;
  const stems = new Map();
  const chs = s.chapters || [];
  chs.forEach((ch, ci) => {
    (ch.knowledge || []).forEach((k, ki) => {
      const where = `${s.id}/${ch.title}/${k.title}`;
      if (!k.title) problems.push(['知识点缺标题', where]);
      if (!k.content && !k.summary) problems.push(['知识点无内容', where]);
      (k.quiz || []).forEach((q, qi) => {
        qn++; totalQ++;
        typeCount[q.type] = (typeCount[q.type] || 0) + 1;
        const tag = `${s.id}#c${ci + 1}k${ki + 1}q${qi + 1}`;
        if (!ALLOWED.has(q.type)) problems.push(['未知题型 ' + q.type, tag]);
        if (!q.stem || !String(q.stem).trim()) problems.push(['题干为空', tag]);
        if (!q.explain || String(q.explain).trim().length < 10) problems.push(['解析过短/缺失', tag]);
        if (!q.source || !String(q.source).trim()) problems.push(['缺来源', tag]);

        if (q.type === 'single' || q.type === 'multiple') {
          choice++;
          const op = q.options || [];
          if (op.length < 3) problems.push(['选项<3 (' + op.length + ')', tag]);
          if (op.some(o => !String(o).trim())) problems.push(['存在空选项', tag]);
          const seen = new Set();
          op.forEach((o, i) => {
            const n = norm(o);
            if (n && seen.has(n)) problems.push(['选项重复: ' + String(o).slice(0, 20), tag]);
            seen.add(n);
          });
          if (q.type === 'single') {
            if (typeof q.answer !== 'number') problems.push(['单选答案非数字: ' + JSON.stringify(q.answer), tag]);
            else if (q.answer < 0 || q.answer >= op.length) problems.push(['单选答案越界 ' + q.answer + '/' + op.length, tag]);
          } else {
            if (!Array.isArray(q.answer)) problems.push(['多选答案非数组: ' + JSON.stringify(q.answer), tag]);
            else {
              if (!q.answer.length) problems.push(['多选答案为空', tag]);
              if (q.answer.some(a => typeof a !== 'number' || a < 0 || a >= op.length)) problems.push(['多选答案越界', tag]);
              if (new Set(q.answer).size !== q.answer.length) problems.push(['多选答案有重复索引', tag]);
              if (q.answer.length === op.length && op.length >= 4) problems.push(['多选全选(' + op.length + ')', tag]);
            }
          }
        } else if (q.type === 'judge') {
          if (typeof q.answer !== 'boolean') problems.push(['判断答案非布尔: ' + JSON.stringify(q.answer), tag]);
        } else if (q.type === 'fill') {
          if (!Array.isArray(q.answer) || !q.answer.length) problems.push(['填空答案非数组/为空', tag]);
        } else if (q.type === 'term') {
          if (!q.explainBrief || String(q.explainBrief).trim().length < 8) problems.push(['名词解释缺简化版', tag]);
          else if (String(q.explainBrief).length > String(q.explain).length) problems.push(['简化版比完整版长', tag]);
        } else if (q.type === 'short' || q.type === 'essay') {
          const ap = q.answerPoints || [];
          if (!Array.isArray(ap) || ap.length < 3) problems.push([q.type + ' 分点不足(' + ap.length + ')', tag]);
          if (q.type === 'essay') {
            if (!q.caseText || String(q.caseText).trim().length < 10) problems.push(['论述缺案例', tag]);
            else if (!/^例如/.test(String(q.caseText).trim())) problems.push(['案例未以「例如」开头', tag]);
          }
        }

        const nk = norm(q.stem).slice(0, 30);
        if (nk) {
          if (stems.has(nk)) problems.push(['同科目题干重复: ' + String(q.stem).slice(0, 24), tag + ' ≈ ' + stems.get(nk)]);
          else stems.set(nk, tag);
        }
      });
    });
  });
  perSubject.push({ id: s.id, name: s.name, q: qn, choice, ch: chs.length, declared: s._count, ext: !!s.ext });
}

console.log('总题数:', totalQ, '题型分布:', JSON.stringify(typeCount));

// _count 校验
console.log('\n--- _count 与实际不符 ---');
let cnt = 0;
perSubject.forEach(p => {
  if (p.ext) return;   /* ext 科目内容在独立页，_count 是声明值，不参与比对 */
  const d = p.declared || {};
  if (d.quiz !== p.q || d.chapters !== p.ch) {
    console.log(`  ${p.id}: 声明 quiz=${d.quiz} ch=${d.chapters} / 实际 quiz=${p.q} ch=${p.ch}`);
    cnt++;
  }
});
if (!cnt) console.log('  (无)');

// QUIZ_META 对齐
console.log('\n--- QUIZ_META 长度对齐 ---');
const QM = sandbox.window.QUIZ_META || {};
let qmBad = 0;
perSubject.forEach(p => {
  if (!p.q) return;          /* 资料型/ext 科目没有页内题库 */
  const arr = QM[p.id];
  if (!arr) { console.log(`  ${p.id}: 无 QUIZ_META`); qmBad++; return; }
  if (arr.length !== p.q) { console.log(`  ${p.id}: QUIZ_META ${arr.length} vs 题数 ${p.q}  差 ${arr.length - p.q}`); qmBad++; }
});
if (!qmBad) console.log('  (全部对齐)');

// 题目问题汇总
console.log('\n--- 题目级问题 ---');
if (!problems.length) console.log('  (无)');
const byKind = {};
problems.forEach(([m, t]) => { const k = m.replace(/[:：].*/, '').replace(/\(.*/, ''); byKind[k] = (byKind[k] || 0) + 1; });
Object.entries(byKind).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${v}\t${k}`));
console.log('\n明细（前 80 条）:');
problems.slice(0, 80).forEach(([m, t]) => console.log(`  [${t}] ${m}`));
console.log('\n问题总数:', problems.length);
