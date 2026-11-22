const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
const cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'mn_choice.json'), 'utf8'));

function norm(s) {
  return String(s).replace(/[\s，。、；：？！“”‘’（）()《》【】\[\]<>·—…\-_,.;:?!"']/g, '')
    .replace(/[A-E]\./g, '').toLowerCase();
}
function bigrams(s) {
  const a = [];
  for (let i = 0; i < s.length - 1; i++) a.push(s.slice(i, i + 2));
  return a;
}
function jac(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach(x => { if (B.has(x)) inter++; });
  return inter / (A.size + B.size - inter);
}
function load(code) {
  let cap = null, exams = [];
  const WB = { register: o => { cap = o; }, registerExam: (s, c) => exams.push({ s, c }) };
  new Function('window', 'WB', code)({ WB }, WB);
  return { cap, exams };
}

const report = [];
for (const id of Object.keys(cards)) {
  const p = path.join(root, 'data', id + '.js');
  if (!fs.existsSync(p)) continue;
  const { cap } = load(fs.readFileSync(p, 'utf8'));
  const existing = (cap.chapters || []).flatMap(c => (c.knowledge || []).flatMap(k => k.quiz || []))
    .filter(q => q.type === 'single' || q.type === 'multiple');
  const normStems = new Map();
  existing.forEach(q => normStems.set(norm(q.stem), q));
  const bg = existing.map(q => bigrams(norm(q.stem)));
  let added = 0, dup = 0;
  for (const c of cards[id]) {
    const n = norm(c.stem);
    if (normStems.has(n)) { dup++; continue; }
    const cb = bigrams(n);
    let hit = false;
    for (const e of bg) { if (jac(cb, e) >= 0.8) { hit = true; break; } }
    if (hit) { dup++; continue; }
    added++;
  }
  report.push({ id, existing: existing.length, cards: cards[id].length, added, dup });
}
console.log(JSON.stringify(report, null, 1));
console.log('TOTAL added', report.reduce((a, b) => a + b.added, 0), 'dup', report.reduce((a, b) => a + b.dup, 0));
