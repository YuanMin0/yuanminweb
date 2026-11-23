/* 深度轮 2：解析中「故选X / 正确答案 X」与 answer 字段是否一致 */
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

function plain(html) {
  return String(html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
function lettersOfAnswer(q) {
  if (q.type === 'single') return 'ABCDEFGH'[q.answer];
  if (q.type === 'multiple') return (q.answer || []).map(i => 'ABCDEFGH'[i]).join('');
  return '';
}

/* 只取明确表述答案的句式，避免「C 错」这类辨析被误判 */
const PATTERNS = [
  /故选\s*[:：]?\s*([A-H]{1,8})(?![A-Za-z])/g,
  /应选\s*[:：]?\s*([A-H]{1,8})(?![A-Za-z])/g,
  /正确答案\s*(?:是|为)?\s*[:：]?\s*([A-H]{1,8})(?![A-Za-z])/g,
  /答案\s*[:：]\s*([A-H]{1,8})(?![A-Za-z])/g
];

let checked = 0, hit = 0, mismatch = [];
for (const s of WB.subjects()) {
  (s.chapters || []).forEach((ch, ci) => (ch.knowledge || []).forEach((k, ki) => (k.quiz || []).forEach((q, qi) => {
    if (q.type !== 'single' && q.type !== 'multiple') return;
    const exp = plain(q.explain);
    if (!exp) return;
    const want = lettersOfAnswer(q);
    let found = null;
    for (const re of PATTERNS) {
      re.lastIndex = 0;
      const m = re.exec(exp);
      if (m) { found = m[1]; break; }
    }
    if (!found) return;
    hit++;
    const a = found.split('').sort().join('');
    const b = want.split('').sort().join('');
    if (a !== b) mismatch.push([`${s.id}#c${ci + 1}k${ki + 1}q${qi + 1}`, want, found, exp.slice(0, 90)]);
  })));
}
console.log('解析中含明确答案表述的选择题:', hit, '| 与 answer 不一致:', mismatch.length);
mismatch.slice(0, 40).forEach(m => console.log('  [' + m[0] + '] answer=' + m[1] + ' 解析写=' + m[2] + ' | ' + m[3]));
