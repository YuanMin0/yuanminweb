/* 生成知识点检索索引：data/ksearch.js
   用法：node _tools/gen_ksearch.js
   说明：读取全部科目数据，抽取「科目 / 章节 / 知识点标题 / 摘要 / 标签」，
        供 search.html 做纯前端检索。不包含题库正文，体积可控。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

function fakeEl() {
  const el = {
    style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, getAttribute: () => null, removeAttribute() {},
    appendChild() {}, removeChild() {}, addEventListener() {}, remove() {},
    querySelector: () => null, querySelectorAll: () => [], insertBefore() {}, cloneNode: () => fakeEl(),
    children: [], innerHTML: '', textContent: '', offsetWidth: 0, scrollHeight: 0
  };
  return el;
}
const doc = {
  documentElement: fakeEl(), body: fakeEl(), head: fakeEl(),
  createElement: () => fakeEl(), querySelector: () => null, querySelectorAll: () => [],
  addEventListener() {}, getElementById: () => null
};
const sandbox = {
  window: {}, document: doc,
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  location: { href: 'http://x/', pathname: '/', search: '' },
  navigator: { userAgent: 'node' },
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  setTimeout, clearTimeout, setInterval, clearInterval,
  URL: { createObjectURL: () => '', revokeObjectURL() {} },
  console
};
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.document = doc;
sandbox.global = sandbox;
sandbox.self = sandbox;
vm.createContext(sandbox);

function load(f) {
  const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
  try { vm.runInContext(code, sandbox, { filename: f }); }
  catch (e) { console.log('!! 加载失败', f, e.message); }
  if (!sandbox.WB && sandbox.window.WB) sandbox.WB = sandbox.window.WB;
}

load('js/core.js');
const files = fs.readdirSync(path.join(ROOT, 'data')).filter(f => f.endsWith('.js'));
const skip = new Set(['_meta.js', 'quiz-meta.js', 'cdn-config.js', 'extra-subjects.js', 'changelog.js', 'ksearch.js', 'desktop.js', 'docs.js']);
const order = files
  .filter(f => !f.startsWith('exam-') && !skip.has(f))
  .concat(files.filter(f => f.startsWith('exam-')))
  .map(f => 'data/' + f);
order.forEach(load);

const WB = sandbox.window.WB;

/* 把 content 里的段落拼成纯文本，供摘要与全文匹配 */
function plain(blocks) {
  const out = [];
  (blocks || []).forEach(b => {
    if (!b) return;
    if (b.text) out.push(b.text);
    if (b.items) out.push(b.items.join(' '));
    if (b.head) out.push(b.head.join(' '));
    if (b.rows) b.rows.forEach(r => out.push(r.join(' ')));
  });
  return out.join(' ')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const items = [];
WB.subjects().forEach(s => {
  (s.chapters || []).forEach((ch, ci) => {
    (ch.knowledge || []).forEach((k, ki) => {
      const kid = (ch.id || (s.id + '-c' + (ci + 1))) + '-k' + (ki + 1);
      const text = plain(k.content);
      const sum = String(k.summary || '').replace(/\*\*/g, '').trim() || text.slice(0, 110);
      items.push({
        s: s.id,
        sn: s.name,
        c: ch.title,
        ci: ci + 1,
        kid: kid,
        t: k.title || '',
        d: sum.slice(0, 140),
        g: (k.tags || []).slice(0, 4).join(' '),
        /* 全文只保留前 400 字，用于命中排序，不落全文以控制体积 */
        x: text.slice(0, 400)
      });
    });
  });
});

const out = {
  v: new Date().toISOString().slice(0, 10),
  n: items.length,
  items: items
};
const js = '/* 自动生成，请勿手改。重新生成：node _tools/gen_ksearch.js */\n' +
  'window.KSEARCH = ' + JSON.stringify(out) + ';\n';
fs.writeFileSync(path.join(ROOT, 'data/ksearch.js'), js, 'utf8');
console.log('知识点', items.length, '条，输出', (js.length / 1024).toFixed(0) + ' KB');
