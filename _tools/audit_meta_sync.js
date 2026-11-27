/* 比对 _meta._count 与实际注册数据（含 choice） */
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
function load(f) { try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f }); } catch (e) { console.log('ERR', f, e.message); } if (!sb.WB && sb.window.WB) sb.WB = sb.window.WB; }
load('js/core.js');
load('data/_meta.js');
/* 先注册科目，再挂 exam，最后补 extra/quiz-meta */
const _files = fs.readdirSync(path.join(ROOT, 'data')).filter(f => f.endsWith('.js'));
const _subject = _files.filter(f => !f.startsWith('exam-') && !['_meta.js', 'quiz-meta.js', 'cdn-config.js', 'extra-subjects.js'].includes(f));
const _exam = _files.filter(f => f.startsWith('exam-'));
const DATA_ORDER = _subject.concat(_exam, ['extra-subjects.js', 'quiz-meta.js']).map(f => 'data/' + f);
DATA_ORDER.forEach(load);
const WB = sb.window.WB, META = sb.window.WB_META || [];
const metaById = {}; META.forEach(m => metaById[m.id] = m);
let bad = 0;
for (const s of WB.subjects()) {
  const m = metaById[s.id];
  if (!m) { console.log('meta 缺失:', s.id); bad++; continue; }
  const a = Object.assign({}, s._count || {}), b = m._count || {};
  /* 章节/知识点以速记页为准：卡片与页面显示要一致，试卷章节不计入 */
  const mnFile = path.join(ROOT, 'mn', s.id + '.html');
  if (fs.existsSync(mnFile)) {
    const t = fs.readFileSync(mnFile, 'utf8');
    const hm = t.match(/共\s*(\d+)\s*讲\s*·\s*(\d+)\s*个知识点/);
    if (hm) { a.chapters = +hm[1]; a.knowledge = +hm[2]; }
  }
  const diff = [];
  ['chapters', 'knowledge', 'quiz', 'choice'].forEach(k => {
    if ((a[k] || 0) !== (b[k] || 0)) diff.push(`${k}: 速记 ${a[k]} / meta ${b[k]}`);
  });
  if (diff.length) { console.log(s.id.padEnd(18), diff.join('  |  ')); bad++; }
}
console.log('不一致科目数:', bad, '/', WB.subjects().length);
