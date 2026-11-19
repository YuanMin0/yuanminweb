/* ==========================================================================
   生成题目「难度 / 考频」标注 → data/quiz-meta.js
   --------------------------------------------------------------------------
   依据（教育测量学 / 布鲁姆认知层次 / 高频考点统计口径）：

   难度
     真正的难度应由难度系数 P（通过率）决定：P<0.3 偏难、0.3–0.7 适中、>0.7 偏易。
     本站没有作答数据，无法计算 P，改用两类有实证依据的代理指标：
       a) 题型猜测率：判断 50% → 四选一 25% → 多选全对约 9% → 填空无选项（需主动回忆）
          基础分 判断 0 / 单选 1 / 填空 2 / 多选 3
       b) 布鲁姆认知层次：记忆型（定义/概念/属于/称为）降一档；
          高阶信号（最可能/首选/最恰当/鉴别/机制/原理/计算/推断/下一步/
          哪种/属于哪…）升两档。只取指向推理与辨析的强信号，
          不用「分析/诊断/治疗」这类在医学题里多为名词的泛词，避免误伤。
          否定式题干、40 字以上长题干各升一档。
     分档：score ≥ 4，或 score ≥ 3 且含高阶信号 → 难点；score ≥ 2 → 重点；其余 → 基础。
     （多选本身只给 3 分，不自动算难点，避免高估。）

   考频
     权威口径是「考点在历年真题中的出现频次」。本站唯一可信的真题信号是
     各科 exam-*.js 的「往年真题精析」章节，因此：
       真题章节内的题                 → 高频（真题命中）
       同科目有真题数据、但此题未命中 → 中频（有参考基准）
       该科目没有真题数据             → 不标注（null，界面不显示考频贴纸）
     不使用解析长度推断考频——解析详略反映整理者写法，与考频无关。
     26 科中仅 11 科有真题数据，其余 15 科找不到依据就不贴标签。

   规则只依赖题型、题干文本特征与章节性质，任何人重跑结果一致。
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data');
const SKIP = /^(exam-|_meta|materials|changelog|cdn-config|docs|readers|lectures|extra-subjects|quiz-meta)/;

/* ---- 最小运行时，模拟 core.js 的注册与索引 ---- */
const WB = {
  _s: [],
  register(s) { this._s.push(s); return s; },
  getSubject(id) { return this._s.find(x => x.id === id) || null; },
  registerExam(sid, chapters) {
    const s = this.getSubject(sid);
    if (!s || !chapters || !chapters.length) return null;
    chapters.forEach(ch => { ch._exam = true; s.chapters.push(ch); });
    return s;
  }
};
global.WB = WB;
global.window = global;

/* ---- 加载全部科目与真题章节 ---- */
fs.readdirSync(DIR).filter(f => f.endsWith('.js') && !SKIP.test(f)).forEach(f => {
  try { eval(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { console.error('加载失败', f, e.message); }
});
const examFiles = fs.readdirSync(DIR).filter(f => /^exam-/.test(f));
const hasExam = new Set(examFiles.map(f => f.replace(/^exam-/, '').replace(/\.js$/, '')));
examFiles.forEach(f => {
  try { eval(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { console.error('加载失败', f, e.message); }
});

/* ---- 规则 ---- */
const HIGH = /最可能|首选|最恰当|最佳|最符合|鉴别|判断依据|机制|原理|计算|推断|提示|下一步|应选择|宜采用|不宜|禁用|属于哪|哪种/;
const NEG = /错误|不正确|不属于|不包括|除外|除了|不是|不能|无关/;
const MEM = /定义|概念|称为|属于|是指/;
const BASE = { judge: 0, single: 1, fill: 2, multiple: 3 };

function judgeLevel(q) {
  const stem = (q.stem || '').trim();
  /* 主观题按题型定档：论述需综合运用与举例 → 难点；名词解释与简答 → 重点 */
  if (q.type === 'essay') return '难点';
  if (q.type === 'term' || q.type === 'short') return '重点';
  let sc = BASE[q.type] !== undefined ? BASE[q.type] : 1;
  const hi = HIGH.test(stem), ng = NEG.test(stem), mem = MEM.test(stem);
  if (hi) sc += 2;
  if (ng) sc += 1;
  if (stem.length >= 40) sc += 1;
  if (mem) sc -= 1;
  if (sc >= 4 || (sc >= 3 && hi)) return '难点';
  if (sc >= 2) return '重点';
  return '基础';
}

function judgeFreq(ch, hasExamData) {
  if (ch._exam) return '高频';
  return hasExamData ? '中频' : null;
}

/* ---- 输出 ---- */
const out = {};
const stat = { level: {}, freq: {}, total: 0, subjects: 0, examSubjects: hasExam.size };

WB._s.forEach(s => {
  const rows = [];
  const se = hasExam.has(s.id);
  (s.chapters || []).forEach(ch => {
    (ch.knowledge || []).forEach(k => {
      (k.quiz || []).forEach(q => {
        const lv = judgeLevel(q);
        const fq = judgeFreq(ch, se);
        rows.push([lv, fq]);
        stat.level[lv] = (stat.level[lv] || 0) + 1;
        if (fq) stat.freq[fq] = (stat.freq[fq] || 0) + 1;
        else stat.freq['未标注'] = (stat.freq['未标注'] || 0) + 1;
      });
    });
  });
  if (rows.length) { out[s.id] = rows; stat.subjects++; stat.total += rows.length; }
});

const body = '/* 题目难度与考频标注（由 _tools/gen_quiz_meta.js 生成，请勿手改）\n' +
  '   格式：{ 科目id: [[难度, 考频], ...] }，数组顺序与该科目题目扁平顺序一致。\n' +
  '   难度按题型猜测率 + 布鲁姆认知层次判定；考频依据是否有往年真题数据。 */\n' +
  'window.QUIZ_META = ' + JSON.stringify(out) + ';\n';

fs.writeFileSync(path.join(DIR, 'quiz-meta.js'), body, 'utf8');

console.log('科目', stat.subjects, '| 题目', stat.total, '| 有真题的科目', stat.examSubjects);
console.log('难度分布', JSON.stringify(stat.level));
console.log('考频分布', JSON.stringify(stat.freq));
console.log('文件大小', (body.length / 1024).toFixed(1) + ' KB');
