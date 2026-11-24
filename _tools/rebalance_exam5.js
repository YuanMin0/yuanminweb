/* 均衡答案分布：单选打乱选项位置，多选调整错项位置，避免答案集中在 B/A */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const sb = { window: {}, console };
vm.createContext(sb);
['meta.js', 'p1.js', 'p2.js', 'p3.js'].forEach(f =>
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'exam5/data', f), 'utf8'), sb, { filename: f }));
const EX = sb.window.EXAM5;
const LETTER = 'ABCDEFGH';

/* 文本型选项（含中文）才允许重排，数字/单位型保持升序 */
const isText = o => /[\u4e00-\u9fa5]/.test(o);
const hasLetterRef = e => /[A-H]\s*项|选项\s*[A-H]/.test(e);

function rotate(arr, k) {
  k = ((k % arr.length) + arr.length) % arr.length;
  return arr.slice(k).concat(arr.slice(0, k));
}

/* ---------- 单选：把答案挪到使用最少的字母 ---------- */
function balanceSingle(items) {
  const count = {};
  items.forEach(q => { const l = LETTER[q.a]; count[l] = (count[l] || 0) + 1; });
  const n = items.length, target = Math.ceil(n / 4);
  let moved = 0;
  items.forEach(q => {
    if (!q.o.every(isText) || hasLetterRef(q.e)) return;
    const cur = q.a, curL = LETTER[cur];
    if (count[curL] <= target) return;
    /* 找缺口最大的字母 */
    let best = -1, bestNeed = 0;
    for (let i = 0; i < q.o.length; i++) {
      if (i === cur) continue;
      const need = target - (count[LETTER[i]] || 0);
      if (need > bestNeed) { bestNeed = need; best = i; }
    }
    if (best < 0) return;
    /* 旋转使正确答案落到 best 位置 */
    const k = (cur - best + q.o.length) % q.o.length;
    q.o = rotate(q.o, k);
    q.a = best;
    count[curL]--; count[LETTER[best]] = (count[LETTER[best]] || 0) + 1;
    moved++;
  });
  return { moved, count };
}

/* ---------- 多选：显式指定错项位置 ---------- */
const P2_MULTI = [
  { perm: [0, 1, 2, 3, 4] },
  { perm: [4, 0, 1, 2, 3] },
  { perm: [0, 1, 4, 2, 3] },
  { perm: [0, 4, 1, 2, 3], fix: [['E 项', 'B 项']] },
  { perm: [0, 1, 2, 4, 3] },
  { perm: [0, 1, 2, 3, 4] },
  { perm: [4, 0, 1, 2, 3] },
  { add: '二重感染', perm: [0, 3, 1, 2, 4] },
  { add: '肝损害', perm: [3, 0, 1, 4, 2] },
  { add: '牙齿黄染', perm: [0, 1, 3, 4, 2] }
];
const P3_MULTI = [
  { perm: [0, 1, 2, 3, 4] },
  { perm: [4, 0, 1, 2, 3] },
  { perm: [0, 4, 1, 2, 3] },
  { perm: [0, 1, 4, 2, 3] },
  { perm: [0, 1, 2, 4, 3] },
  { perm: [4, 0, 1, 2, 3] },
  { perm: [0, 1, 2, 3, 4] },
  { perm: [0, 2, 3, 4, 1] },
  { perm: [3, 0, 1, 4, 2] },
  { perm: [0, 1, 3, 4, 2] }
];

function applyMulti(items, specs) {
  items.forEach((q, i) => {
    const sp = specs[i];
    if (!sp) return;
    let opts = q.o.slice();
    let correct = q.a.slice();
    if (sp.add) { opts.push(sp.add); }           /* 新增项为错项 */
    /* perm 作用于“原选项序列 + 新增项” */
    const base = opts.slice();
    const newOpts = sp.perm.map(idx => base[idx]);
    const newCorrect = correct.map(ci => sp.perm.indexOf(ci)).filter(x => x > -1).sort((a, b) => a - b);
    q.o = newOpts;
    q.a = newCorrect;
    (sp.fix || []).forEach(([from, to]) => { q.e = q.e.replace(from, to); });
  });
}

const p1 = EX.papers[0], p2 = EX.papers[1], p3 = EX.papers[2];
const r1 = balanceSingle(p1.sections.find(s => s.key === 'single').items);
const r2 = balanceSingle(p2.sections.find(s => s.key === 'single').items);
const r3 = balanceSingle(p3.sections.find(s => s.key === 'single').items);
console.log('单选重排：', r1.moved, r2.moved, r3.moved);
console.log('卷一新分布', JSON.stringify(r1.count));
console.log('卷二新分布', JSON.stringify(r2.count));
console.log('卷三新分布', JSON.stringify(r3.count));

applyMulti(p2.sections.find(s => s.key === 'multiple').items, P2_MULTI);
applyMulti(p3.sections.find(s => s.key === 'multiple').items, P3_MULTI);

function dump(p, file) {
  const body = JSON.stringify(p, null, 2);
  const head = file === 'p1.js' ? '/* 模拟卷一：40 单选 + 6 名解 + 3 论述 */'
    : file === 'p2.js' ? '/* 模拟卷二：10 多选 + 30 单选 + 6 名解 + 3 论述 */'
      : '/* 模拟卷三：10 多选 + 30 单选 + 6 名解 + 3 论述 */';
  const out = head + '\n(window.EXAM5 = window.EXAM5 || { papers: [] }).papers.push(' + body + ');\n';
  fs.writeFileSync(path.join(ROOT, 'exam5/data', file), out, 'utf8');
  console.log('写入', file);
}
dump(p1, 'p1.js'); dump(p2, 'p2.js'); dump(p3, 'p3.js');

/* 复核分布 */
[['卷一', p1], ['卷二', p2], ['卷三', p3]].forEach(([name, p]) => {
  const c = {}, m = {};
  p.sections.filter(s => s.key === 'single').forEach(s => s.items.forEach(q => { c[LETTER[q.a]] = (c[LETTER[q.a]] || 0) + 1; }));
  p.sections.filter(s => s.key === 'multiple').forEach(s => s.items.forEach(q => {
    const k = q.a.map(i => LETTER[i]).join('');
    m[k] = (m[k] || 0) + 1;
  }));
  console.log(name, '单选', JSON.stringify(c), '多选组合', JSON.stringify(m));
});
