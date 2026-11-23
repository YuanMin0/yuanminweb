/* 深度轮 1：判分逻辑与答案自洽性 */
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

let n = 0, bad = 0, badAns = 0, badText = 0;
const samples = [];
for (const s of WB.subjects()) {
  (s.chapters || []).forEach((ch, ci) => (ch.knowledge || []).forEach((k, ki) => (k.quiz || []).forEach((q, qi) => {
    if (q.type !== 'single' && q.type !== 'multiple') return;
    n++;
    const tag = `${s.id}#c${ci + 1}k${ki + 1}q${qi + 1}`;
    /* 1) 正确答案必须判对 */
    if (!WB.isCorrect(q, q.answer)) { bad++; samples.push(['判分失败', tag, JSON.stringify(q.answer)]); }
    /* 2) 单选：每个错误选项都必须判错 */
    if (q.type === 'single') {
      q.options.forEach((o, i) => {
        if (i !== q.answer && WB.isCorrect(q, i)) { bad++; samples.push(['错项被判对', tag, i]); }
      });
    }
    /* 3) answerText 的字母必须指向正确选项 */
    try {
      const txt = String(WB.answerText(q));
      /* 单选返回「C. 选项正文」，只取前缀字母；多选返回纯字母 */
      const letters = q.type === 'single' ? (txt.split('.')[0] || '').replace(/[^A-H]/g, '') : txt.replace(/[^A-H]/g, '');
      const want = q.type === 'single' ? 'ABCDEFGH'[q.answer] : (q.answer || []).map(i => 'ABCDEFGH'[i]).join('');
      if (letters && letters !== want) { badText++; samples.push(['答案文本不符', tag, letters + ' vs ' + want]); }
    } catch (e) { badText++; samples.push(['answerText 异常', tag, e.message]); }
  })));
}
console.log('选择题总数', n, '| 判分异常', bad, '| 答案文本异常', badText);
samples.slice(0, 20).forEach(x => console.log('  ', x.join(' | ')));

/* 单选答案分布 */
const dist = { single: {}, multiple: {} };
for (const s of WB.subjects()) (s.chapters || []).forEach(ch => (ch.knowledge || []).forEach(k => (k.quiz || []).forEach(q => {
  if (q.type === 'single') { const L = 'ABCDEFGH'[q.answer]; dist.single[L] = (dist.single[L] || 0) + 1; }
  if (q.type === 'multiple') { const L = (q.answer || []).map(i => 'ABCDEFGH'[i]).join(''); dist.multiple[L] = (dist.multiple[L] || 0) + 1; }
})));
console.log('\n单选答案分布:', JSON.stringify(dist.single));
const top = Object.entries(dist.multiple).sort((a, b) => b[1] - a[1]).slice(0, 5);
console.log('多选答案组合 Top5:', JSON.stringify(top));
