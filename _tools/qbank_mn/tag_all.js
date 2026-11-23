/* ==========================================================================
   全站题目统一标注：考频 freq + 是否考过 tested（含年份）
   --------------------------------------------------------------------------
   规则（只依据题目已有的 source / years，不臆造年份）：
     真题类来源（真题 / 考研 / 往年 / 期末 / 期中）
        有 years → tested = 考过·原题（2020）        freq = 高频
        无 years → tested = 考过·原题（年份未标）    freq = 高频
     课件类来源（PPT / 课件 / 习题集 / 讲义 / 重点 / 题库 / 复习总结 / 名解）
        tested = 考过·考点                            freq = 中频
     拓展题（source 含「拓展」）
        tested = 未考过                               freq = 低频
     其余（自编定位来源）
        tested = 未考过                               freq = 低频
   已有 freq / tested / years 一律保留，不覆盖。
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', '..', 'data');

const RE_REAL = /真题|考研|往年|期末|期中|统考/;
const RE_COURSE = /PPT|课件|习题集|讲义|重点|题库|复习总结|名解|大题|考点|学习指导/;
const RE_EXT = /拓展/;

function tag(q) {
  const src = String(q.source || '');
  const ys = Array.isArray(q.years) ? q.years.filter(Boolean) : [];
  let changed = false;

  if (!q.freq) {
    if (RE_REAL.test(src)) q.freq = '高频';
    else if (RE_COURSE.test(src)) q.freq = '中频';
    else q.freq = '低频';
    changed = true;
  }
  if (!q.tested) {
    if (ys.length) {
      q.tested = '考过·原题（' + ys.slice(0, 2).join('/') + '）';
    } else if (RE_REAL.test(src)) {
      q.tested = '考过·原题（年份未标）';
    } else if (RE_COURSE.test(src)) {
      q.tested = '考过·考点';
    } else {
      q.tested = '未考过';
    }
    changed = true;
  }
  return changed;
}

function load(code) {
  let cap = null, exams = [];
  const WB = { register: o => { cap = o; }, registerExam: (s, c) => exams.push(c) };
  new Function('window', 'WB', code)({ WB }, WB);
  return { cap, exams };
}

let files = 0, qs = 0, touched = 0;
const stat = {};

for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith('.js')) continue;
  if (/^(_meta|materials|changelog|cdn-config|docs|readers|lectures|extra-subjects|quiz-meta)/.test(f)) continue;
  const p = path.join(DIR, f);
  const code = fs.readFileSync(p, 'utf8');
  const { cap, exams } = load(code);
  let ch = false;

  if (cap && Array.isArray(cap.chapters)) {
    for (const c of cap.chapters) for (const k of c.knowledge || []) for (const q of k.quiz || []) {
      qs++;
      if (tag(q)) touched++;
      stat[q.tested] = (stat[q.tested] || 0) + 1;
      ch = true;
    }
  }
  for (const chs of exams) for (const c of chs) for (const k of c.knowledge || []) for (const q of k.quiz || []) {
    qs++;
    if (tag(q)) touched++;
    stat[q.tested] = (stat[q.tested] || 0) + 1;
    ch = true;
  }

  if (ch && cap) {
    fs.writeFileSync(p, 'WB.register(' + JSON.stringify(cap, null, 2) + ');\n', 'utf8');
    files++;
  } else if (ch && exams.length) {
    const sid = f.replace(/^exam-/, '').replace(/\.js$/, '');
    fs.writeFileSync(p, "WB.registerExam('" + sid + "', " + JSON.stringify(exams[0], null, 2) + ");\n", 'utf8');
    files++;
  }
}

console.log('files', files, 'questions', qs, 'touched', touched);
console.log(stat);
