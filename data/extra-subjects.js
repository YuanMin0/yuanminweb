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
  id: 'fenzi', matCount: 23, name: '分子生物学', en: 'Molecular Biology', icon: '🧬',
  accent: 'var(--violet)', accentSoft: 'var(--violet-soft)', sem: 'daer1',
  desc: '复制、转录、翻译与基因表达调控，配套 23 份课件与真题。',
  matGroups: ['fenzi'], chapters: []
});

WB.register({
  id: 'shenghua', matCount: 42, name: '生物化学', en: 'Biochemistry', icon: '⚡',
  accent: 'var(--amber)', accentSoft: 'var(--amber-soft)', sem: 'daer1',
  desc: '糖、脂、氨基酸代谢与生物氧化，配套 42 份课件与真题。',
  matGroups: ['shenghua'], chapters: []
});

WB.register({
  id: 'shengli', matCount: 13, name: '生理学', en: 'Physiology', icon: '🫀',
  accent: 'var(--rose)', accentSoft: 'var(--rose-soft)', sem: 'daer1',
  desc: '细胞、血液、循环、呼吸、消化与神经系统的功能调节，配套 13 份资料。',
  matGroups: ['shengli'], chapters: []
});

WB.register({
  id: 'shensheng', matCount: 27, name: '神经生物学', en: 'Neurobiology', icon: '🧠',
  accent: 'var(--violet)', accentSoft: 'var(--violet-soft)', sem: 'daer1',
  desc: '学习记忆、情绪、睡眠与神经发育，配套 27 份课件。',
  matGroups: ['shensheng'], chapters: []
});

WB.register({
  id: 'shenjie', matCount: 30, name: '神经解剖学', en: 'Neuroanatomy', icon: '🕸️',
  accent: 'var(--teal)', accentSoft: 'var(--teal-soft)', sem: 'daer1',
  desc: '中枢与周围神经系统的结构与传导通路，配套 30 份图谱与课件。',
  matGroups: ['shenjie'], chapters: []
});

WB.register({
  id: 'chuantong', matCount: 2, name: '中医学基础', en: 'Fundamentals of TCM', icon: '🌿',
  accent: 'var(--teal)', accentSoft: 'var(--teal-soft)', sem: 'daer2',
  desc: '阴阳五行、藏象与辨证思路，配套 2 份讲义。',
  matGroups: ['chuantong'], chapters: []
});

WB.register({
  id: 'jishengchong', matCount: 77, name: '人体寄生虫学', en: 'Human Parasitology', icon: '🪱',
  accent: 'var(--amber)', accentSoft: 'var(--amber-soft)', sem: 'daer2',
  desc: '线虫、吸虫、绦虫与原虫的形态、生活史与致病，配套 77 份课件与题库。',
  matGroups: ['jishengchong'], chapters: []
});

WB.register({
  id: 'weishengwu', matCount: 66, name: '医学微生物学', en: 'Medical Microbiology', icon: '🦠',
  accent: 'var(--cyan)', accentSoft: 'var(--cyan-soft)', sem: 'daer2',
  desc: '细菌、病毒与真菌的生物学性状、致病与免疫，配套 66 份课件与真题。',
  matGroups: ['weishengwu', 'weishengwu2'], chapters: []
});

WB.register({
  id: 'wenxian', matCount: 19, name: '文献检索', en: 'Literature Retrieval', icon: '🔎',
  accent: 'var(--brand)', accentSoft: 'var(--brand-soft)', sem: 'daer2',
  desc: '中文数据库检索、检索式构建与文献管理，配套 19 份资料与习题。',
  matGroups: ['wenxian'], chapters: []
});
