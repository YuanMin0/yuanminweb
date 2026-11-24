/* 深度审核：用解析结论反查答案，找出「解析指向的选项 ≠ answer」的高风险题 */
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
const files = fs.readdirSync(path.join(ROOT, 'data')).filter(f => f.endsWith('.js'));
files.filter(f => !f.startsWith('exam-') && !['_meta.js', 'quiz-meta.js', 'cdn-config.js', 'extra-subjects.js'].includes(f)).forEach(f => load('data/' + f));
files.filter(f => f.startsWith('exam-')).forEach(f => load('data/' + f));
const WB = sb.window.WB;
const L = 'ABCDEFGH';

const plain = h => String(h || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, '');

/* 最长公共子串长度（字符级） */
function lcs(a, b) {
  if (!a || !b) return 0;
  let best = 0;
  const prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let last = 0;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      if (a[i - 1] === b[j - 1]) {
        prev[j] = last + 1;
        if (prev[j] > best) best = prev[j];
      } else prev[j] = 0;
      last = tmp;
    }
  }
  return best;
}

const risky = [], conflict = [], upperAll = [];
const stemMap = new Map();
let n = 0;
for (const s of WB.subjects()) {
  (s.chapters || []).forEach((ch, ci) => (ch.knowledge || []).forEach((k, ki) => (k.quiz || []).forEach((q, qi) => {
    if (q.type !== 'single' && q.type !== 'multiple') return;
    n++;
    const tag = `${s.id}#c${ci + 1}k${ki + 1}q${qi + 1}`;
    const opts = (q.options || []).map(plain);
    const ansIdx = Array.isArray(q.answer) ? q.answer : [q.answer];
    const ansText = ansIdx.map(i => opts[i] || '').join('');

    /* 规则 1：解析末尾结论与选项的最长公共子串 */
    const exp = plain(q.explain);
    const tail = exp.slice(-80);
    if (tail.length >= 20 && ansText.length >= 4) {
      const scores = opts.map(o => lcs(tail, o));
      const maxOther = Math.max(...scores.filter((_, i) => ansIdx.indexOf(i) < 0), 0);
      const ansScore = Math.max(...ansIdx.map(i => scores[i] || 0), 0);
      if (maxOther >= 8 && maxOther >= ansScore + 4) {
        const wi = scores.indexOf(maxOther);
        risky.push({ tag, subj: s.name, stem: q.stem.slice(0, 34), ans: ansIdx.map(i => L[i]).join(''),
          better: L[wi], betterText: (q.options[wi] || '').slice(0, 26), tail: tail.slice(-40) });
      }
    }

    /* 规则 2：含「以上都是」却未选该项 / 含「以上都不是」却选了前面的项 */
    opts.forEach((o, i) => {
      if (/^以上都(是|正确|对)$/.test(o) && ansIdx.indexOf(i) < 0) {
        upperAll.push({ tag, subj: s.name, stem: q.stem.slice(0, 30), ans: ansIdx.map(x => L[x]).join(''), note: '含「以上都是」但未选' });
      }
    });

    /* 规则 3：同科目近似题干但答案不同 */
    const key = s.id + '|' + plain(q.stem).slice(0, 24);
    if (stemMap.has(key)) {
      const prev = stemMap.get(key);
      const a1 = prev.ans, a2 = ansIdx.slice().sort().join(',');
      if (a1 !== a2) conflict.push({ tag, subj: s.name, stem: q.stem.slice(0, 30), a1: prev.tag + '=' + a1, a2: a2 });
    } else stemMap.set(key, { tag, ans: ansIdx.slice().sort().join(',') });
  })));
}

console.log('选择题总数', n);
console.log('\n=== 规则1：解析结论指向其他选项（高风险）', risky.length, '===');
risky.slice(0, 40).forEach(r => console.log(`  [${r.tag}] ${r.subj} | ${r.stem} | 答案 ${r.ans} 但解析更像 ${r.better}.${r.betterText} | …${r.tail}`));
console.log('\n=== 规则2：含「以上都是」却未选', upperAll.length, '===');
upperAll.slice(0, 20).forEach(r => console.log(`  [${r.tag}] ${r.stem} | 答案 ${r.ans}`));
console.log('\n=== 规则3：近似题干答案冲突', conflict.length, '===');
conflict.slice(0, 20).forEach(r => console.log(`  [${r.tag}] ${r.stem} | ${r.a1} vs ${r.a2}`));
