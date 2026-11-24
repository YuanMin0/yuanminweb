/* 交叉验证 B：模拟卷 ↔ 题库，同考点答案是否一致 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

function mkCtx() {
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
  return sb;
}

const sb1 = mkCtx();
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/core.js'), 'utf8'), sb1);
sb1.WB = sb1.window.WB;
const files = fs.readdirSync(path.join(ROOT, 'data')).filter(f => f.endsWith('.js'));
files.filter(f => !f.startsWith('exam-') && !['_meta.js', 'quiz-meta.js', 'cdn-config.js', 'extra-subjects.js'].includes(f))
  .forEach(f => { try { vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'), sb1); } catch (e) {} });
files.filter(f => f.startsWith('exam-'))
  .forEach(f => { try { vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'), sb1); } catch (e) {} });
const WB = sb1.WB;

const sb2 = { window: {}, console };
vm.createContext(sb2);
['meta.js', 'p1.js', 'p2.js', 'p3.js'].forEach(f =>
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'exam5/data', f), 'utf8'), sb2));
const EX = sb2.window.EXAM5;

const plain = h => String(h || '').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, '');
const L = 'ABCDEFGH';

/* 题库索引：规范化题干前 16 字 → 记录 */
const bank = new Map();
for (const s of WB.subjects()) {
  (s.chapters || []).forEach(ch => (ch.knowledge || []).forEach(k => (k.quiz || []).forEach(q => {
    if (q.type !== 'single' && q.type !== 'multiple') return;
    const key = plain(q.stem).slice(0, 16);
    if (!bank.has(key)) bank.set(key, []);
    const idx = Array.isArray(q.answer) ? q.answer : [q.answer];
    bank.get(key).push({ tag: `${s.id}/${k.title}`, ansText: idx.map(i => plain((q.options || [])[i])).join('|'), stem: q.stem });
  })));
}

let n = 0;
const mism = [];
EX.papers.forEach(p => {
  p.sections.filter(s => s.key === 'single' || s.key === 'multiple').forEach(sec => {
    sec.items.forEach((q, i) => {
      n++;
      const key = plain(q.q).slice(0, 16);
      const hit = bank.get(key);
      if (!hit) return;
      const idx = Array.isArray(q.a) ? q.a : [q.a];
      const myText = idx.map(x => plain(q.o[x])).join('|');
      hit.forEach(h => {
        if (h.ansText && h.ansText !== myText) {
          mism.push([p.name, sec.key, i + 1, q.q.slice(0, 26), '模拟卷=' + myText.slice(0, 24), '题库=' + h.ansText.slice(0, 24), h.tag]);
        }
      });
    });
  });
});
console.log('模拟卷选择题', n, '| 与题库同题干答案不一致', mism.length);
mism.forEach(m => console.log('  ' + m.join(' | ')));
