/* 深度轮 2：内容质量与格式一致性 */
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

const VOID = new Set(['br', 'img', 'hr', 'input', 'meta', 'link']);
function tagBalance(html) {
  const stack = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let m;
  while ((m = re.exec(html))) {
    const full = m[0], tag = m[1].toLowerCase();
    if (VOID.has(tag) || full.endsWith('/>')) continue;
    if (full[1] === '/') {
      if (stack[stack.length - 1] === tag) stack.pop();
      else if (stack.includes(tag)) return '交叉闭合 </' + tag + '>';
    } else stack.push(tag);
  }
  return stack.length ? '未闭合 <' + stack.join('>,<') + '>' : '';
}

const issues = { tag: [], src: [], freq: [], tested: [], brief: [], emptyOpt: [], shortExplain: [], dupExplain: [] };
const seenExplain = new Map();
let total = 0;
for (const s of WB.subjects()) {
  (s.chapters || []).forEach((ch, ci) => (ch.knowledge || []).forEach((k, ki) => (k.quiz || []).forEach((q, qi) => {
    total++;
    const tag = `${s.id}#c${ci + 1}k${ki + 1}q${qi + 1}`;
    [q.stem, q.explain, q.explainBrief, ...(q.options || []), ...(q.answerPoints || []), q.caseText]
      .filter(Boolean).forEach(t => {
        const bad = tagBalance(String(t));
        if (bad) issues.tag.push([tag, bad, String(t).slice(0, 50)]);
      });
    if (q.source) {
      if (/^(file|ext|todo|待补|无)$/i.test(String(q.source).trim())) issues.src.push([tag, q.source]);
      else if (String(q.source).length < 4) issues.src.push([tag, q.source]);
    }
    if (q.freq && !['高频', '中频', '低频'].includes(q.freq)) issues.freq.push([tag, q.freq]);
    if (q.tested && !/^(考过|未考过|暂无)/.test(String(q.tested))) issues.tested.push([tag, q.tested]);
    if (q.type === 'term') {
      const a = String(q.explain || '').length, b = String(q.explainBrief || '').length;
      if (a && b && (b < a * 0.25 || b > a * 0.98)) issues.brief.push([tag, `完整 ${a} / 简化 ${b}`]);
    }
    if ((q.type === 'single' || q.type === 'multiple') && (q.options || []).some(o => !String(o).trim())) issues.emptyOpt.push([tag]);
    if (String(q.explain || '').replace(/<[^>]+>/g, '').length < 25) issues.shortExplain.push([tag, String(q.explain || '').slice(0, 40)]);
    const ex = String(q.explain || '').replace(/<[^>]+>/g, '').trim();
    if (ex.length > 60) {
      const key = ex.slice(0, 60);
      if (seenExplain.has(key)) issues.dupExplain.push([tag, seenExplain.get(key)]);
      else seenExplain.set(key, tag);
    }
  })));
}
console.log('总题数', total);
Object.entries(issues).forEach(([k, arr]) => {
  console.log(`\n[${k}] ${arr.length}`);
  arr.slice(0, 8).forEach(x => console.log('   ', x.join(' | ')));
});
