/* 题库总览：每科实际题数 / 选择数 / 声明数 / QUIZ_META 对齐 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

function fakeEl() {
  return { style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, getAttribute: () => null, removeAttribute() {}, appendChild() {}, removeChild() {},
    addEventListener() {}, remove() {}, querySelector: () => null, querySelectorAll: () => [], insertBefore() {},
    cloneNode: () => fakeEl(), children: [], innerHTML: '', textContent: '' };
}
const doc = { documentElement: fakeEl(), body: fakeEl(), head: fakeEl(), createElement: () => fakeEl(),
  querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, getElementById: () => null };
const sb = { window: {}, document: doc, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  location: { href: 'http://x/', pathname: '/', search: '' }, navigator: { userAgent: 'node' },
  matchMedia: () => ({ matches: false, addEventListener() {} }), setTimeout, clearTimeout, setInterval, clearInterval,
  URL: { createObjectURL: () => '', revokeObjectURL() {} }, console };
sb.window.localStorage = sb.localStorage; sb.window.document = doc; sb.global = sb; sb.self = sb;
vm.createContext(sb);
function load(f) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f }); }
  catch (e) { console.log('ERR', f, e.message); }
  if (!sb.WB && sb.window.WB) sb.WB = sb.window.WB;
}
load('js/core.js');
/* 先注册科目，再挂 exam，最后补 extra/quiz-meta */
const _files = fs.readdirSync(path.join(ROOT, 'data')).filter(f => f.endsWith('.js'));
const _subject = _files.filter(f => !f.startsWith('exam-') && !['_meta.js', 'quiz-meta.js', 'cdn-config.js', 'extra-subjects.js'].includes(f));
const _exam = _files.filter(f => f.startsWith('exam-'));
const DATA_ORDER = _subject.concat(_exam, ['extra-subjects.js', 'quiz-meta.js']).map(f => 'data/' + f);
DATA_ORDER.forEach(load);
const WB = sb.window.WB, QM = sb.window.QUIZ_META || {};
const rows = [];
for (const s of WB.subjects()) {
  let q = 0, ch = 0, kn = 0, choice = 0, subj = 0;
  (s.chapters || []).forEach(c => { ch++; (c.knowledge || []).forEach(k => { kn++; (k.quiz || []).forEach(x => {
    q++; if (x.type === 'single' || x.type === 'multiple') choice++;
    if (x.type === 'term' || x.type === 'short' || x.type === 'essay') subj++;
  }); }); });
  const d = s._count || {};
  const arr = QM[s.id];
  rows.push({ id: s.id, ch, kn, q, choice, subj, dq: d.quiz, dch: d.chapters, dkn: d.knowledge, dch2: d.choice, qm: arr ? arr.length : -1, ext: !!s.ext });
}
const pad = (v, n) => String(v == null ? '-' : v).padStart(n);
console.log('id'.padEnd(18) + pad('ch', 4) + pad('kn', 4) + pad('题', 5) + pad('选', 5) + pad('主观', 5) + pad('声明q', 6) + pad('声明选', 7) + pad('QM', 5) + '  问题');
let sumQ = 0, sumC = 0;
for (const r of rows) {
  sumQ += r.q; sumC += r.choice;
  const bad = [];
  if (r.dq !== undefined && r.dq !== r.q) bad.push('quiz ' + r.dq + '≠' + r.q);
  if (r.dch !== undefined && r.dch !== r.ch) bad.push('ch ' + r.dch + '≠' + r.ch);
  if (r.dkn !== undefined && r.dkn !== r.kn) bad.push('kn ' + r.dkn + '≠' + r.kn);
  if (r.dch2 !== undefined && r.dch2 !== r.choice) bad.push('choice ' + r.dch2 + '≠' + r.choice);
  if (r.q > 0 && r.qm !== r.q) bad.push('QM ' + (r.qm < 0 ? '缺失' : r.qm + '≠' + r.q));
  console.log(r.id.padEnd(18) + pad(r.ch, 4) + pad(r.kn, 4) + pad(r.q, 5) + pad(r.choice, 5) + pad(r.subj, 5) +
    pad(r.dq, 6) + pad(r.dch2, 7) + pad(r.qm, 5) + '  ' + (bad.length ? '<<< ' + bad.join('; ') : ''));
}
console.log('\n合计: 题 ' + sumQ + ' / 选择 ' + sumC + ' / 科目 ' + rows.length);
