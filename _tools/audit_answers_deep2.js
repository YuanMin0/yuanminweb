/* 深度审核 v2：只比对「结论句」与选项，降低误报 */
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

function lcs(a, b) {
  if (!a || !b) return 0;
  let best = 0;
  const prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let last = 0;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      if (a[i - 1] === b[j - 1]) { prev[j] = last + 1; if (prev[j] > best) best = prev[j]; }
      else prev[j] = 0;
      last = tmp;
    }
  }
  return best;
}

/* 抽取结论句：故/因此/所以/应选/答案是/正确答案/综上 之后到句末 */
function conclusion(exp) {
  const m = exp.match(/(?:故|因此|所以|应选|答案是|正确答案是|正确答案为|综上)[，,：:]?([^。；;]{4,60})/g);
  return m ? m.join('|') : '';
}

const NEG = /不包括|不属于|不适用|不是|错误|不正确|除外|不能/;
const hits = [];
let n = 0, negN = 0;
for (const s of WB.subjects()) {
  (s.chapters || []).forEach((ch, ci) => (ch.knowledge || []).forEach((k, ki) => (k.quiz || []).forEach((q, qi) => {
    if (q.type !== 'single' && q.type !== 'multiple') return;
    n++;
    const tag = `${s.id}#c${ci + 1}k${ki + 1}q${qi + 1}`;
    const opts = (q.options || []).map(plain);
    const ansIdx = Array.isArray(q.answer) ? q.answer : [q.answer];
    const exp = plain(q.explain);
    const isNeg = NEG.test(q.stem);
    if (isNeg) negN++;

    const conc = conclusion(exp);
    if (conc && conc.length >= 4) {
      const scores = opts.map(o => lcs(conc, o));
      const maxOther = Math.max(...scores.filter((_, i) => ansIdx.indexOf(i) < 0), 0);
      const ansScore = Math.max(...ansIdx.map(i => scores[i] || 0), 0);
      if (maxOther >= 8 && maxOther >= ansScore + 5) {
        hits.push({ kind: '结论句指向他项', tag, subj: s.name, stem: q.stem.slice(0, 32),
          ans: ansIdx.map(i => L[i]).join(''), other: L[scores.indexOf(maxOther)], conc: conc.slice(0, 50) });
      }
    }

    /* 否定题：解析里「X 不包括/不是/错误」指向的选项应当就是答案 */
    if (isNeg) {
      const m = exp.match(/([^。；;]{6,40})(?:不包括|不属于|不适用|不是|错误|不正确)/g);
      if (m) {
        const seg = m.join('');
        const scores = opts.map(o => lcs(seg, o));
        const best = scores.indexOf(Math.max(...scores));
        const bestScore = scores[best];
        if (bestScore >= 10 && ansIdx.indexOf(best) < 0) {
          hits.push({ kind: '否定题答案疑与解析不符', tag, subj: s.name, stem: q.stem.slice(0, 32),
            ans: ansIdx.map(i => L[i]).join(''), other: L[best], conc: seg.slice(0, 50) });
        }
      }
    }
  })));
}
console.log('选择题', n, '其中否定型题干', negN);
console.log('可疑', hits.length);
const byKind = {};
hits.forEach(h => byKind[h.kind] = (byKind[h.kind] || 0) + 1);
console.log(byKind);
hits.forEach(h => console.log(`[${h.kind}] ${h.tag} ${h.subj} | ${h.stem} | 答案 ${h.ans} vs ${h.other} | ${h.conc}`));
