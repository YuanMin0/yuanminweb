const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
const metaPath = path.join(root, 'data', '_meta.js');
const txt = fs.readFileSync(metaPath, 'utf8');
const json = txt.replace(/^[\s\S]*?window\.WB_META\s*=\s*/, '').replace(/;\s*$/, '');
const meta = JSON.parse(json);

function load(code) {
  let cap = null, exams = [];
  const WB = { register: o => { cap = o; }, registerExam: (s, c) => exams.push(c) };
  new Function('window', 'WB', code)({ WB }, WB);
  return { cap, exams };
}

const changes = [];
for (const m of meta) {
  const p = path.join(root, 'data', m.id + '.js');
  if (!fs.existsSync(p)) continue;
  const { cap, exams } = load(fs.readFileSync(p, 'utf8'));
  if (!cap) continue;
  const pe = path.join(root, 'data', 'exam-' + m.id + '.js');
  if (fs.existsSync(pe)) {
    const r2 = load(fs.readFileSync(pe, 'utf8'));
    exams.push(...r2.exams);
  }
  const chapters = (cap.chapters || []).concat(...exams);
  const knowledge = chapters.reduce((n, c) => n + (c.knowledge || []).length, 0);
  const quiz = chapters.reduce((n, c) => n + (c.knowledge || []).reduce((k, x) => k + (x.quiz || []).length, 0), 0);
  const old = m._count ? m._count.quiz : null;
  if (old !== quiz || !m._count) {
    m._count = { chapters: chapters.length, knowledge, quiz };
    changes.push({ id: m.id, old, now: quiz });
  }
}
fs.writeFileSync(metaPath, 'window.WB_META = ' + JSON.stringify(meta) + ';\n', 'utf8');
console.log('updated', changes.length);
console.log(changes.map(c => `${c.id}: ${c.old} -> ${c.now}`).join('\n'));
