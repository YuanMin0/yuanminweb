const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
const dataDir = path.join(root, 'data');
const ids = fs.readdirSync(path.join(root, 'mn'))
  .filter(f => f.endsWith('.html') && f !== 'index.html')
  .map(f => f.replace(/\.html$/, ''));

function load(code) {
  let cap = null, exams = [];
  const WB = {
    register: o => { cap = o; },
    registerExam: (sid, chapters) => { exams.push({ sid, chapters }); }
  };
  new Function('window', 'WB', code)({ WB }, WB);
  return { cap, exams };
}

const out = [];
for (const id of ids) {
  const rec = { id };
  const p1 = path.join(dataDir, id + '.js');
  if (fs.existsSync(p1)) {
    const { cap } = load(fs.readFileSync(p1, 'utf8'));
    if (cap) {
      const inline = (cap.chapters || []).flatMap(c => c.quiz || []);
      rec.inline = inline.length;
      rec.chapters = (cap.chapters || []).length;
    }
  }
  const p2 = path.join(dataDir, 'exam-' + id + '.js');
  if (fs.existsSync(p2)) {
    const { exams } = load(fs.readFileSync(p2, 'utf8'));
    rec.exam = exams.reduce((n, e) => n + (e.chapters || []).reduce((m, c) => m + (c.quiz || []).length, 0), 0);
    rec.examChapters = exams.reduce((n, e) => n + (e.chapters || []).length, 0);
  }
  out.push(rec);
}
console.log(JSON.stringify(out, null, 1));
