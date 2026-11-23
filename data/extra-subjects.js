/* ==========================================================================
   低年级科目（大一下 / 大二上 / 大二下）
   --------------------------------------------------------------------------
   这批课程目前以「资料」为主：章节 / 知识点 / 题目尚未整理，
   所以 chapters 为空，改用 matGroups 指向资料汇总里的分组。
   科目页与科目卡会据此显示「资料型科目」，并给出直达入口。
   ========================================================================== */

WB.register({
  id: 'yiwuli', matCount: 29, name: '医用物理学', en: 'Medical Physics', icon: '🧲',
  accent: 'var(--cyan)', accentSoft: 'var(--cyan-soft)', sem: 'dayi1',
  desc: '力学、流体、电磁与光学在医学中的应用，配套 29 份资料。',
  matGroups: ['yiwuli'], chapters: []
});

WB.register({
  id: 'jichuchem', matCount: 4, name: '基础化学', en: 'Basic Chemistry', icon: '⚗️',
  accent: 'var(--amber)', accentSoft: 'var(--amber-soft)', sem: 'dayi1',
  desc: '无机与分析化学基础，配套 4 份复习资料。',
  matGroups: ['jichuchem'], chapters: []
});

WB.register({
  id: 'jupou', matCount: 153, name: '局部解剖学', en: 'Regional Anatomy', icon: '🦴',
  accent: 'var(--rose)', accentSoft: 'var(--rose-soft)', sem: 'dayi1',
  desc: '按部位学习人体结构，上肢、颈部、腹部、盆部与头面，配套 153 份资料与图谱。',
  matGroups: ['jupou'], chapters: []
});

WB.register({
  id: 'youjichem', matCount: 110, name: '有机化学', en: 'Organic Chemistry', icon: '🧪',
  accent: 'var(--violet)', accentSoft: 'var(--violet-soft)', sem: 'dayi1',
  desc: '烃、卤代烃、醇酚醚、醛酮与羧酸衍生物，配套 110 份课件与习题。',
  matGroups: ['youjichem'], chapters: []
});

WB.register({
  id: 'cellbio', matCount: 36, name: '细胞生物学', en: 'Cell Biology', icon: '🧫',
  accent: 'var(--teal)', accentSoft: 'var(--teal-soft)', sem: 'dayi1',
  desc: '细胞膜、内膜系统、细胞骨架与细胞周期，配套课件与复习总结。',
  matGroups: ['cellbio1', 'cellbio2'], chapters: []
});

WB.register({
  id: 'english', matCount: 22, name: '大学英语', en: 'College English', icon: '🔤',
  accent: 'var(--brand)', accentSoft: 'var(--brand-soft)', sem: 'dayi1',
  desc: '课文、词汇与四级真题，配套 22 份资料。',
  matGroups: ['english'], chapters: []
});

WB.register({
  id: 'computer', matCount: 64, name: '计算机基础', en: 'Computer Fundamentals', icon: '💻',
  accent: 'var(--cyan)', accentSoft: 'var(--cyan-soft)', sem: 'dayi1',
  desc: 'Office 与医学数据处理、数据库查询，配套 64 份课件与上机题。',
  matGroups: ['computer'], chapters: []
});

WB.register({
  id: 'mayuan', matCount: 34, name: '马克思主义基本原理', en: 'Principles of Marxism', icon: '📕',
  accent: 'var(--rose)', accentSoft: 'var(--rose-soft)', sem: 'dayi1',
  desc: '唯物论、辩证法、认识论与政治经济学，配套 34 份重点与题库。',
  matGroups: ['mayuan'], chapters: []
});

WB.register({
  id: 'shengli', matCount: 13, name: '生理学', en: 'Physiology', icon: '🫀',
  accent: 'var(--rose)', accentSoft: 'var(--rose-soft)', sem: 'daer1',
  desc: '细胞、血液、循环、呼吸、消化与神经系统的功能调节，配套 13 份资料。',
  matGroups: ['shengli'], chapters: []
});

WB.register({
  id: 'chuantong', matCount: 2, name: '中医学基础', en: 'Fundamentals of TCM', icon: '🌿',
  accent: 'var(--teal)', accentSoft: 'var(--teal-soft)', sem: 'daer2',
  desc: '阴阳五行、藏象与辨证思路，配套 2 份讲义。',
  matGroups: ['chuantong'], chapters: []
});

/* ==========================================================================
   劳动卫生学 — 独立 HTML 页面接入
   --------------------------------------------------------------------------
   该科目以完整的自包含 HTML 页面呈现（知识点 + 题库 + 答案解析），
   不走 subject.html 动态渲染，通过 ext 字段直接跳转。
   ========================================================================== */

/* ==========================================================================
   环境卫生学 — 知识点页 + 刷题页（双入口）
   --------------------------------------------------------------------------
   ext    : 知识点精编（主入口）
   extAlt : 选择题刷题（次入口，卡片上单独一个按钮）
   ========================================================================== */
WB.register({
  id: 'huanjingweisheng', name: '环境卫生学', en: 'Environmental Hygiene', icon: '🌍',
  accent: 'var(--teal)', accentSoft: 'var(--teal-soft)', sem: 'dasan1', order: 15.7,
  tag: '预防医学',
  desc: '大气、水体、饮用水、土壤、公共场所、环境质量评价与家用化学品，13 讲 60 个知识点、191 题，另配 113 题选择题刷题页。',
  ext: 'huanjingweisheng.html',
  extAlt: 'huanjingweisheng-quiz.html',
  chapters: [], _count: { chapters: 13, knowledge: 60, quiz: 191, choice: 113 }
});
