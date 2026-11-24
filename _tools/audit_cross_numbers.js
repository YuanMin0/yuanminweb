/* 交叉验证 A：知识点正文 ↔ 题目解析 的数值一致性
   找出「解析里出现、但正文从未出现」的数值，供人工判断是否张冠李戴
*/
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

const plain = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function nums(t) {
  const out = new Set();
  const re = /-?\d+(?:\.\d+)?/g;
  let m;
  while ((m = re.exec(t))) out.add(parseFloat(m[0]));
  return out;
}
function contentText(k) {
  const parts = [];
  (k.content || []).forEach(x => {
    if (x.text) parts.push(x.text);
    if (x.items) parts.push(x.items.join(' '));
    if (x.head) parts.push(x.head.join(' '));
    if (x.rows) x.rows.forEach(r => parts.push(r.join(' ')));
  });
  return plain(parts.join(' '));
}

let checked = 0;
const hits = [];
for (const s of WB.subjects()) {
  (s.chapters || []).forEach((ch, ci) => (ch.knowledge || []).forEach((k, ki) => {
    const body = contentText(k);
    if (body.length < 80) return;
    const bn = nums(body);
    (k.quiz || []).forEach((q, qi) => {
      if (!q.explain) return;
      checked++;
      const en = nums(plain(q.explain));
      const extra = [...en].filter(v => !bn.has(v));
      /* 只关心「有意义」的数值：>=2 位或带小数，排除 1-9 的序数 */
      const sig = extra.filter(v => Math.abs(v) >= 10 || (v % 1 !== 0 && Math.abs(v) >= 1));
      if (sig.length >= 2) {
        hits.push({ tag: `${s.id}#c${ci + 1}k${ki + 1}q${qi + 1}`, subj: s.name, kp: k.title,
          stem: q.stem.slice(0, 26), nums: sig.slice(0, 6).join(','), exp: plain(q.explain).slice(0, 70) });
      }
    });
  }));
}
console.log('检查题目', checked, '| 解析含正文未出现的显著数值', hits.length);
hits.slice(0, 40).forEach(h => console.log(`  [${h.tag}] ${h.subj}/${h.kp} | ${h.stem} | 数值 ${h.nums} | ${h.exp}`));
