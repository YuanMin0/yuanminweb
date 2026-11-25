/* ==========================================================================
   MediLearn · 按需加载器
   --------------------------------------------------------------------------
   目的：drill / quiz / subject 这类「只服务一个科目」的页面，不再一次性加载
        全部 38 个 data/*.js（约 4.2 MB），改为只加载当前科目（约 0.1–0.5 MB）。
        科目选择页只读 data/_meta.js（18 KB），首屏几乎瞬时。
   用法：
     WB.ensureSubject(sid, {drill:true}).then(boot)
     sid 为空 → 立即 resolve（页面自己渲染选择器）
   ========================================================================== */
(function () {
  'use strict';
  var WB = window.WB;
  if (!WB) return;

  /* 有 data/<id>.js 的科目；exam 表示另有 data/exam-<id>.js */
  var HAS_DATA = {
    bigdata: 1, cardiology: 1, dermatology: 1, diagnostics: 1, digestive: 1,
    endocrinology: 1, ent: 1, ertong: 1, ethics: 1, fenzi: 1, hangwei: 1, hangxin: 1,
    'health-stats': 1, hematology: 1, infectious: 1, 'internal-nursing': 1,
    jishengchong: 1, laoweisheng: 1, linxin: 1, mianyi: 1, neurology: 1,
    ophthalmology: 1, organ3: 1, pathology: 1, pathophys: 1, pediatrics: 1,
    pharmacology: 1, respiratory: 1, shenghua: 1, shenjie: 1, shensheng: 1,
    shizhen: 1, statistics: 1, surgery: 1, 'surgery-nursing': 1, weishengwu: 1,
    wenxian: 1, xssx: 1, yichuan: 1
  };
  var HAS_EXAM = {
    bigdata: 1, cardiology: 1, diagnostics: 1, endocrinology: 1, ethics: 1,
    hematology: 1, pharmacology: 1, respiratory: 1, statistics: 1, surgery: 1, xssx: 1
  };

  var loading = {};   /* sid -> Promise，避免重复注入 */

  function inject(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('加载失败: ' + src)); };
      (document.head || document.documentElement).appendChild(s);
    });
  }

  /** 从 _meta 取轻量元数据（data 文件未加载时也能拿到名称/计数/入口标记） */
  WB.metaOf = function (sid) {
    var list = WB.meta();
    for (var i = 0; i < list.length; i++) if (list[i].id === sid) return list[i];
    return null;
  };

  /** 先查已注册科目，再退回 _meta；页面统一用它，避免「科目不存在」误判。
      _meta 里的对象没有 chapters，补成空数组，防止 s.chapters.map 报错。 */
  WB.subjectOf = function (sid) {
    var s = WB.getSubject(sid) || WB.metaOf(sid);
    if (!s) return null;
    if (!s.chapters) {
      var copy = {}, k;
      for (k in s) if (Object.prototype.hasOwnProperty.call(s, k)) copy[k] = s[k];
      copy.chapters = [];
      copy._kIndex = {};
      return copy;
    }
    return s;
  };

  /**
   * 确保某科目的完整数据已就绪。
   * @param {string} sid 科目 id；空值表示不需要具体科目
   * @param {{drill?:boolean}} [opt] drill=true 时即使 ext 科目也加载（劳动卫生学有独立题库）
   */
  WB.ensureSubject = function (sid, opt) {
    opt = opt || {};
    if (!sid) return Promise.resolve(null);
    var done = WB.getSubject(sid);
    if (done && !done.ext) return Promise.resolve(done);
    if (loading[sid]) return loading[sid];

    var m = WB.metaOf(sid);
    /* 纯资料型 / 外部文档页：没有可加载的题库数据 */
    if (!HAS_DATA[sid]) return Promise.resolve(m);
    /* ext 科目（知识点在独立 HTML）：subject 页直接跳转，不必加载题库 */
    if (m && m.ext && !opt.drill) return Promise.resolve(m);

    var chain = inject('data/' + sid + '.js');
    if (HAS_EXAM[sid]) {
      chain = chain.then(function () { return inject('data/exam-' + sid + '.js'); });
    }
    loading[sid] = chain.then(function () {
      return WB.getSubject(sid) || m;
    }).catch(function (e) {
      /* 单个文件失败不影响页面骨架：退回 meta，由页面提示 */
      if (window.console && console.warn) console.warn(e.message);
      return m;
    });
    return loading[sid];
  };

  /** 预加载：鼠标悬停/聚焦科目卡时提前取，点击时几乎无等待 */
  WB.prefetchSubject = function (sid, opt) {
    if (!sid || loading[sid] || WB.getSubject(sid)) return;
    WB.ensureSubject(sid, opt);
  };

  /** 全量加载：仅「随机练习 / 全科测验」这类确实需要跨科目的场景使用 */
  WB.ensureAll = function () {
    if (WB._allPromise) return WB._allPromise;
    var ids = [], k;
    for (k in HAS_DATA) if (Object.prototype.hasOwnProperty.call(HAS_DATA, k)) ids.push(k);
    WB._allPromise = Promise.all(ids.map(function (id) { return WB.ensureSubject(id); }));
    return WB._allPromise;
  };
})();
