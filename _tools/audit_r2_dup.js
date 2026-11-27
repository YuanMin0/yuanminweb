/* 精确查重：保留比较运算符，只统一全半角与空白 */
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
const WB = sb.window.WB;

function norm(s) {
  return String(s == null ? '' : s)
    .replace(/[\uFF01-\uFF5E]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)) // 全角转半角
    .replace(/\u3000/g, ' ')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/[－—–−]/g, '-')
    .replace(/\s+/g, '')
    .replace(/[。，、；：！？,.;:!?"'()\[\]【】《》]/g, '')
    .toLowerCase();
}

const dupOpt = [], dupStem = [], nearStem = [], allSel = [];
const typeBySubj = {};
for (const s of WB.subjects()) {
  const stemMap = new Map();
  const headMap = new Map();
  (s.chapters || []).forEach((ch, ci) => (ch.knowledge || []).forEach((k, ki) => (k.quiz || []).forEach((q, qi) => {
    const tag = `${s.id}#c${ci + 1}k${ki + 1}q${qi + 1}`;
    typeBySubj[s.id] = typeBySubj[s.id] || {};
    typeBySubj[s.id][q.type] = (typeBySubj[s.id][q.type] || 0) + 1;
    if (q.options && (q.type === 'single' || q.type === 'multiple')) {
      const seen = new Map();
      q.options.forEach((o, i) => {
        const n = norm(o);
        if (!n) return;
        if (seen.has(n)) dupOpt.push({ tag, a: seen.get(n), b: i, text: String(o) });
        else seen.set(n, i);
      });
      if (q.type === 'multiple' && Array.isArray(q.answer) && q.answer.length === q.options.length && q.options.length >= 4)
        allSel.push({ tag, n: q.options.length });
    }
    /* 用完整题干判重：只看前 40 字会把「同一病例、不同问法」误判成重复 */
    const nFull = norm(q.stem);
    const nHead = nFull.slice(0, 40);
    if (nFull) {
      if (stemMap.has(nFull)) dupStem.push({ tag, prev: stemMap.get(nFull), stem: String(q.stem).slice(0, 40) });
      else stemMap.set(nFull, tag);
    }
    if (nHead) {
      if (headMap.has(nHead) && !stemMap.has(nFull)) nearStem.push({ tag, prev: headMap.get(nHead), stem: String(q.stem).slice(0, 46) });
      else headMap.set(nHead, tag);
    }
  })));
}

console.log('=== 真·选项重复 (' + dupOpt.length + ') ===');
dupOpt.forEach(d => console.log(`  [${d.tag}] ${String.fromCharCode(65 + d.a)} 与 ${String.fromCharCode(65 + d.b)} 同为「${d.text}」`));
console.log('\n=== 同科目题干重复 (' + dupStem.length + ') ===');
dupStem.forEach(d => console.log(`  [${d.tag}] ≈ [${d.prev}] ${d.stem}`));
console.log('\n=== 同题干开头·不同问法 (' + nearStem.length + ') ===');
nearStem.forEach(d => console.log(`  [${d.tag}] ≈ [${d.prev}] ${d.stem}`));
console.log('\n=== 多选全选分布 (' + allSel.length + ') ===');
const bySubj = {};
allSel.forEach(a => { const s = a.tag.split('#')[0]; bySubj[s] = (bySubj[s] || 0) + 1; });
Object.entries(bySubj).sort((a, b) => b[1] - a[1]).forEach(([s, n]) => {
  const total = typeBySubj[s] && typeBySubj[s].multiple || 0;
  console.log(`  ${s.padEnd(18)} ${String(n).padStart(3)} / ${total}  (${Math.round(n / total * 100)}%)`);
});
