/* 校验三套模拟卷的数据完整性 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const sb = { window: {}, console };
vm.createContext(sb);
['meta.js', 'p1.js', 'p2.js', 'p3.js'].forEach(f => {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'exam5/data', f), 'utf8'), sb, { filename: f });
});
const EX = sb.window.EXAM5;
let bad = 0;
const allStems = new Map();
console.log('卷数', EX.papers.length);
for (const p of EX.papers) {
  const sec = {};
  p.sections.forEach(s => sec[s.key] = s.items);
  const single = sec.single || [], multi = sec.multiple || [], terms = sec.term || [], essays = sec.essay || [];
  const choice = single.length + multi.length;
  console.log(`\n=== ${p.name} === 单选 ${single.length} 多选 ${multi.length} 选择合计 ${choice} 名解 ${terms.length} 论述 ${essays.length}`);
  if (choice !== 40) { console.log('  ✗ 选择题不是 40 道'); bad++; }
  if (terms.length !== 6) { console.log('  ✗ 名解不是 6 道'); bad++; }
  if (essays.length !== 3) { console.log('  ✗ 论述不是 3 道'); bad++; }

  const checkOpt = (q, i, isMulti) => {
    const tag = `${p.name} ${isMulti ? '多选' : '单选'}${i + 1}`;
    if (!q.q || !q.q.trim()) { console.log('  ✗ 题干为空', tag); bad++; }
    if (!q.e || q.e.length < 20) { console.log('  ✗ 解析过短', tag); bad++; }
    if (!q.s || q.s.length < 4) { console.log('  ✗ 缺来源', tag); bad++; }
    if (!Array.isArray(q.o) || q.o.length < 4) { console.log('  ✗ 选项不足', tag); bad++; }
    const set = new Set(q.o.map(x => String(x).trim()));
    if (set.size !== q.o.length) { console.log('  ✗ 选项重复', tag); bad++; }
    if (isMulti) {
      if (!Array.isArray(q.a) || !q.a.length) { console.log('  ✗ 多选答案为空', tag); bad++; }
      else if (q.a.some(x => x < 0 || x >= q.o.length)) { console.log('  ✗ 多选答案越界', tag); bad++; }
      else if (q.a.length === q.o.length) { console.log('  ✗ 多选全选', tag); bad++; }
    } else {
      if (typeof q.a !== 'number' || q.a < 0 || q.a >= q.o.length) { console.log('  ✗ 单选答案越界', tag, q.a); bad++; }
    }
    const key = q.q.replace(/\s+/g, '').slice(0, 28);
    if (allStems.has(key)) { console.log('  ✗ 题干重复:', tag, '≈', allStems.get(key)); bad++; }
    else allStems.set(key, tag);
  };
  single.forEach((q, i) => checkOpt(q, i, false));
  multi.forEach((q, i) => checkOpt(q, i, true));

  terms.forEach((t, i) => {
    if (!t.q || !t.a || !t.brief) { console.log('  ✗ 名解缺字段', i + 1); bad++; }
    if (!t.e || !t.s) { console.log('  ✗ 名解缺解析/来源', i + 1); bad++; }
    if (t.a.length < 60) { console.log('  ✗ 名解答案过短', i + 1, t.a.length); bad++; }
  });
  essays.forEach((e, i) => {
    if (!Array.isArray(e.a) || e.a.length < 4) { console.log('  ✗ 论述分点不足', i + 1); bad++; }
    if (!e.e || !e.s) { console.log('  ✗ 论述缺评分/来源', i + 1); bad++; }
  });
}
/* 名解与论述跨卷重复检查 */
const termStems = new Map(), essayStems = new Map();
EX.papers.forEach(p => {
  (p.sections.find(s => s.key === 'term') || { items: [] }).items.forEach(t => {
    const k = t.q.replace(/\s+/g, '');
    if (termStems.has(k)) { console.log('✗ 名解跨卷重复:', t.q, termStems.get(k), p.name); bad++; }
    else termStems.set(k, p.name);
  });
  (p.sections.find(s => s.key === 'essay') || { items: [] }).items.forEach(t => {
    const k = t.q.replace(/\s+/g, '').slice(0, 20);
    if (essayStems.has(k)) { console.log('✗ 论述跨卷重复:', t.q.slice(0, 20), essayStems.get(k), p.name); bad++; }
    else essayStems.set(k, p.name);
  });
});
console.log('\n总问题数', bad);
