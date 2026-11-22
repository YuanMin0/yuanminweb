const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', '..', 'data');
const ids = fs.readdirSync(path.join(__dirname, '..', '..', 'mn'))
  .filter(f => f.endsWith('.html') && f !== 'index.html')
  .map(f => f.replace(/\.html$/, ''));
let out = [];
for (const id of ids) {
  const f = id + '.js';
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) { out.push({ id, err: 'no data file' }); continue; }
  const code = fs.readFileSync(p, 'utf8');
  let cap = null;
  const WB = { register: o => { cap = o; }, registerExam: () => { } };
  try { new Function('window', 'WB', code)({ WB }, WB); } catch (e) { out.push({ id, err: e.message }); continue; }
  if (!cap) { out.push({ id, err: 'no register' }); continue; }
  const chs = cap.chapters || [];
  const qs = chs.flatMap(c => c.quiz || []);
  out.push({
    id, keys: Object.keys(cap), chapters: chs.length, quiz: qs.length,
    types: qs.reduce((a, q) => (a[q.type] = (a[q.type] || 0) + 1, a), {}),
    chIds: chs.map(c => c.id).slice(0, 3)
  });
}
console.log(JSON.stringify(out, null, 1));
