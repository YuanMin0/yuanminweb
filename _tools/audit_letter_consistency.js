/* 全库检查：解析里出现的 A/B/C/D 结论字母 与 answer 是否一致（区分肯定式/否定式题干） */
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
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f }); } catch (e) { console.log('ERR', f, e.message); }
  if (!sb.WB && sb.window.WB) sb.WB = sb.window.WB;
}
load('js/core.js');
const files = fs.readdirSync(path.join(ROOT, 'data')).filter(f => f.endsWith('.js'));
files.filter(f => !f.startsWith('exam-') && !['_meta.js', 'quiz-meta.js', 'cdn-config.js', 'extra-subjects.js'].includes(f)).forEach(f => load('data/' + f));
files.filter(f => f.startsWith('exam-')).forEach(f => load('data/' + f));
const WB = sb.window.WB;

const L = ['A', 'B', 'C', 'D', 'E', 'F'];
const NEG_STEM = /错误|不正确|不包括|不属于|不符合|不是|不宜|除外|例外|不恰当|不准确|有误|不应/;

function lettersOfAnswer(q) {
  if (q.type === 'single') return [L[q.answer]];
  if (q.type === 'multiple') return (q.answer || []).map(i => L[i]).sort();
  return null;
}

function positiveSets(t) {
  const out = [];
  let m;
  const re1 = /(?<![A-Za-z])([A-F](?:\s*[、，,\/和与]\s*[A-F])+)\s*(?:项|选项)?\s*(?:均|都)?\s*(?:是)?\s*(?:正确|对|符合|成立)/g;
  while ((m = re1.exec(t))) out.push(m[1].replace(/[^A-F]/g, '').split(''));
  const re2 = /(?:^|[^A-Za-z])([A-F])\s*(?:项|选项)?\s*(?:是)?\s*(?:正确|对|符合|成立)/g;
  while ((m = re2.exec(t))) out.push([m[1]]);
  const re3 = /(?:答案|应选|故选|选)\s*(?:为|是|：|:)?\s*([A-F]{1,6})(?![A-Za-z0-9])/g;
  while ((m = re3.exec(t))) out.push(m[1].split(''));
  return out;
}
function negativeSets(t) {
  const out = [];
  let m;
  const re1 = /(?<![A-Za-z])([A-F](?:\s*[、，,\/和与]\s*[A-F])*)\s*(?:项|选项)?\s*(?:均|都)?\s*(?:是)?\s*(?:错误|不正确|错|不选|不符合|排除|不成立|不严谨)/g;
  while ((m = re1.exec(t))) out.push(m[1].replace(/[^A-F]/g, '').split(''));
  return out;
}

let total = 0, withLetters = 0, bad = 0;
const rows = [];
for (const s of WB.subjects()) {
  (s.chapters || []).forEach(ch => (ch.knowledge || []).forEach(k => (k.quiz || []).forEach(q => {
    if (q.type !== 'single' && q.type !== 'multiple') return;
    total++;
    const ex = String(q.explain || '');
    const ans = lettersOfAnswer(q);
    const neg = NEG_STEM.test(String(q.stem || ''));
    const P = new Set(), N = new Set();
    positiveSets(ex).forEach(a => a.forEach(x => P.add(x)));
    negativeSets(ex).forEach(a => a.forEach(x => N.add(x)));
    if (!P.size && !N.size) return;
    withLetters++;

    /* 答案选项本身的文字里若写了「B 或 C」这类，视为合法 */
    const ansOptText = ans.map(x => String((q.options || [])[L.indexOf(x)] || '')).join(' ');
    const ansOptLetters = new Set(ansOptText.match(/[A-F]/g) || []);

    const issues = [];
    if (!neg) {
      if (P.size) {
        const same = P.size === ans.length && [...P].every(x => ans.indexOf(x) > -1);
        const coveredByOption = [...P].every(x => ansOptLetters.has(x));
        if (!same && !coveredByOption) issues.push('解析肯定={' + [...P].sort().join('') + '} 答案={' + ans.join('') + '}');
      }
      ans.forEach(a => { if (N.has(a)) issues.push('答案 ' + a + ' 被解析判错'); });
    } else {
      if (N.size) {
        const ok = ans.every(a => N.has(a));
        if (!ok) issues.push('否定式题干：答案={' + ans.join('') + '} 但解析判错={' + [...N].sort().join('') + '}');
      }
      ans.forEach(a => {
        if (!P.has(a)) return;
        const ok = new RegExp('(故选|应选|答案|为本题答案)[^。；]{0,6}' + a + '|' + a + '[^。；]{0,14}(符合题意|为本题答案|故选|应选)').test(ex);
        if (!ok) issues.push('否定式题干：答案 ' + a + ' 被解析判对');
      });
    }
    if (issues.length) {
      bad++;
      rows.push({ s: s.id, k: k.title, type: q.type, stem: q.stem, ans: ans.join(''), issues: issues.join('；'), ex: ex.slice(0, 260), options: q.options });
    }
  })));
}
console.log('选择题总数', total, '｜ 解析含字母结论', withLetters, '｜ 可疑', bad);
rows.forEach((r, i) => {
  console.log('\n[' + (i + 1) + '] ' + r.s + ' / ' + r.k + ' / ' + r.type + ' / 答案 ' + r.ans);
  console.log('  题干：' + String(r.stem).slice(0, 70));
  console.log('  问题：' + r.issues);
  console.log('  解析：' + r.ex.replace(/\n/g, ' '));
});
fs.writeFileSync(path.join(ROOT, '_tools/_letter_issues.json'), JSON.stringify(rows, null, 1), 'utf8');
