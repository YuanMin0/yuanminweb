const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
const dataDir = path.join(root, 'data');
const cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'mn_choice.json'), 'utf8'));
const WRITE = process.argv.includes('--write');

function norm(s) {
  return String(s).replace(/[\s，。、；：？！“”‘’（）()《》【】\[\]<>·—…\-_,.;:?!"']/g, '')
    .replace(/[A-E]\./g, '').toLowerCase();
}
function bigrams(s) { const a = []; for (let i = 0; i < s.length - 1; i++) a.push(s.slice(i, i + 2)); return a; }
function jac(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0; A.forEach(x => { if (B.has(x)) inter++; });
  return inter / (A.size + B.size - inter);
}
function load(code) {
  let cap = null;
  const WB = { register: o => { cap = o; }, registerExam: () => { } };
  new Function('window', 'WB', code)({ WB }, WB);
  return cap;
}

const summary = [];
for (const id of Object.keys(cards)) {
  const p = path.join(dataDir, id + '.js');
  if (!fs.existsSync(p)) continue;
  const cap = load(fs.readFileSync(p, 'utf8'));
  if (!cap) continue;
  const chapters = cap.chapters || [];
  const existing = chapters.flatMap(c => (c.knowledge || []).flatMap(k => k.quiz || []))
    .filter(q => q.type === 'single' || q.type === 'multiple');
  const stems = new Set(existing.map(q => norm(q.stem)));
  const bgs = existing.map(q => bigrams(norm(q.stem)));

  let added = 0, dup = 0;
  for (const c of cards[id]) {
    const n = norm(c.stem);
    if (stems.has(n)) { dup++; continue; }
    const cb = bigrams(n);
    if (bgs.some(e => jac(cb, e) >= 0.8)) { dup++; continue; }

    // 找目标章节：优先 group 匹配，其次按讲次序号
    let ch = chapters.find(x => String(x.group || '') === c.group);
    if (!ch) {
      const idx = Math.min(Math.max(parseInt(c.group, 10) - 1, 0), chapters.length - 1);
      ch = chapters[idx];
    }
    if (!ch) continue;
    if (!Array.isArray(ch.knowledge) || !ch.knowledge.length) {
      ch.knowledge = [{ title: '速记选择题', summary: '《考前速记》同步选择题。', tags: ['速记题库'], content: [], quiz: [] }];
    }
    const k = ch.knowledge[ch.knowledge.length - 1];
    if (!Array.isArray(k.quiz)) k.quiz = [];
    const item = {
      type: c.type, stem: c.stem, options: c.options, answer: c.answer,
      explain: c.explain, source: c.source
    };
    if (c.freq) item.freq = c.freq;
    if (c.years && c.years.length) item.years = c.years;
    k.quiz.push(item);
    stems.add(n); bgs.push(cb);
    added++;
  }

  if (added && WRITE) {
    fs.writeFileSync(p, 'WB.register(' + JSON.stringify(cap, null, 2) + ');\n', 'utf8');
  }
  summary.push({ id, added, dup, total: existing.length + added });
}

console.log(JSON.stringify(summary, null, 1));
console.log('ADDED', summary.reduce((a, b) => a + b.added, 0), 'DUP', summary.reduce((a, b) => a + b.dup, 0));
console.log(WRITE ? 'WRITTEN' : 'DRY RUN');
