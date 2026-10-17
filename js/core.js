/* ==========================================================================
   MediLearn · 核心运行时
   数据注册表 / 本地存储 / 主题 / 内容渲染 / Markdown 导出 / 通用 UI
   无依赖、无构建，file:// 直接打开亦可运行
   ========================================================================== */
(function () {
  'use strict';

  /* 复用已存在的命名空间（auth.js 可能已在 <head> 中先于本文件加载），
     不能直接覆盖，否则会丢掉先前挂载的 WB.auth。 */
  var WB = window.WB || (window.WB = {});

  /* ---------------- 数据注册表 ---------------- */
  var _subjects = [];

  WB.register = function (s) {
    if (!s || !s.id) return;
    // 预计算索引
    var kIndex = {}, chapters = s.chapters || [], n = 0, q = 0;
    chapters.forEach(function (ch, ci) {
      ch.id = ch.id || (s.id + '-c' + (ci + 1));
      (ch.knowledge || []).forEach(function (k, ki) {
        k.id = k.id || (ch.id + '-k' + (ki + 1));
        k.chapterId = ch.id;
        k.chapterTitle = ch.title;
        k.subjectId = s.id;
        k.subjectName = s.name;
        k._ci = ci;
        k._ki = ki;
        kIndex[k.id] = k;
        n++;
        q += (k.quiz || []).length;
      });
    });
    s._kIndex = kIndex;
    s._count = { chapters: chapters.length, knowledge: n, quiz: q };
    _subjects.push(s);
    _subjects.sort(function (a, b) { return (a.order || 99) - (b.order || 99); });
    return s;
  };

  WB.subjects = function () { return _subjects.slice(); };
  WB.getSubject = function (id) {
    for (var i = 0; i < _subjects.length; i++) if (_subjects[i].id === id) return _subjects[i];
    return null;
  };
  WB.getKnowledge = function (sid, kid) {
    var s = WB.getSubject(sid);
    return s && s._kIndex[kid] ? s._kIndex[kid] : null;
  };
  /** 扁平化某科目的全部知识点（按章节顺序），带 prev/next 链接 */
  WB.flatKnowledge = function (sid) {
    var s = WB.getSubject(sid);
    if (!s) return [];
    var out = [];
    s.chapters.forEach(function (ch) { (ch.knowledge || []).forEach(function (k) { out.push(k); }); });
    return out;
  };
  WB.stats = function () {
    var t = { subjects: _subjects.length, chapters: 0, knowledge: 0, quiz: 0 };
    _subjects.forEach(function (s) {
      t.chapters += s._count.chapters; t.knowledge += s._count.knowledge; t.quiz += s._count.quiz;
    });
    return t;
  };

  /* ---------------- URL 参数 ---------------- */
  WB.qs = function (name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  };
  WB.link = function (page, params) {
    var q = [];
    for (var k in params) if (params[k] !== undefined && params[k] !== null && params[k] !== '')
      q.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
    return page + (q.length ? '?' + q.join('&') : '');
  };

  /* ---------------- 工具 ---------------- */
  WB.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  /** 允许内联 <b> <em> <code> <br> 的轻量富文本 */
  WB.rich = function (s) {
    var out = WB.esc(s);
    out = out.replace(/&lt;(\/?)(b|strong|em|i|code|br|mark|sub|sup)\s*\/?&gt;/g, '<$1$2>');
    out = out.replace(/\[\[([^\]]+)\]\]/g, '<code>$1</code>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    return out;
  };
  WB.pct = function (a, b) { return b ? Math.round((a / b) * 100) : 0; };
  WB.pad = function (n) { return (n < 10 ? '0' : '') + n; };
  WB.fmtDate = function (ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + WB.pad(d.getMonth() + 1) + '-' + WB.pad(d.getDate()) +
      ' ' + WB.pad(d.getHours()) + ':' + WB.pad(d.getMinutes());
  };
  WB.fmtDay = function (ts) {
    var d = new Date(ts);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  };
  WB.slug = function (s) {
    return String(s).replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 80);
  };
  WB.toast = function (msg, ms) {
    var el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(WB._tt);
    WB._tt = setTimeout(function () { el.classList.remove('on'); }, ms || 2000);
  };

  /* ---------------- 本地存储 ---------------- */
  var K = { prog: 'medilearn.progress.v1', wrong: 'medilearn.wrong.v1', log: 'medilearn.quizlog.v1', theme: 'medilearn.theme' };

  function read(key, dft) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : dft; } catch (e) { return dft; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 隐私模式忽略 */ }
  }

  WB.store = {
    /* 学习进度：{ [sid]: { [kid]: ts } } */
    progress: function () { return read(K.prog, {}); },
    isLearned: function (sid, kid) { var p = read(K.prog, {}); return !!(p[sid] && p[sid][kid]); },
    setLearned: function (sid, kid, on) {
      var p = read(K.prog, {});
      p[sid] = p[sid] || {};
      if (on === false) delete p[sid][kid]; else p[sid][kid] = Date.now();
      write(K.prog, p);
      return !!(p[sid] && p[sid][kid]);
    },
    toggleLearned: function (sid, kid) { return WB.store.setLearned(sid, kid, !WB.store.isLearned(sid, kid)); },
    learnedCount: function (sid) {
      var p = read(K.prog, {});
      return p[sid] ? Object.keys(p[sid]).length : 0;
    },
    subjectPct: function (sid) {
      var s = WB.getSubject(sid);
      return s ? WB.pct(WB.store.learnedCount(sid), s._count.knowledge) : 0;
    },
    /* 做题记录 */
    log: function () { return read(K.log, []); },
    addLog: function (rec) {
      var l = read(K.log, []);
      rec.ts = Date.now();
      l.unshift(rec);
      write(K.log, l.slice(0, 300));
      return rec;
    },
    /* 错题本 */
    wrong: function () { return read(K.wrong, {}); },
    addWrong: function (q) {
      var w = read(K.wrong, {});
      var it = w[q.uid] || { times: 0, firstTs: Date.now() };
      it.times++;
      it.ts = Date.now();
      it.uid = q.uid; it.subjectId = q.subjectId; it.subjectName = q.subjectName;
      it.kid = q.kid; it.kTitle = q.kTitle; it.chapterTitle = q.chapterTitle;
      it.stem = q.stem; it.type = q.type; it.options = q.options || null;
      it.answer = q.answer; it.explain = q.explain || '';
      it.myAnswer = q.myAnswer;
      w[q.uid] = it;
      write(K.wrong, w);
    },
    removeWrong: function (uid) {
      var w = read(K.wrong, {});
      if (w[uid]) { delete w[uid]; write(K.wrong, w); }
    },
    wrongList: function () {
      var w = read(K.wrong, {}), out = [];
      for (var k in w) out.push(w[k]);
      out.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
      return out;
    },
    reset: function () {
      write(K.prog, {}); write(K.wrong, {}); write(K.log, []);
    }
  };

  /* ---------------- 主题 ---------------- */
  WB.applyTheme = function (t) {
    document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
    try { localStorage.setItem(K.theme, t); } catch (e) {}
    var b = document.querySelector('[data-theme-btn]');
    if (b) {
      b.textContent = '◑';
      b.title = t === 'dark' ? '切换到浅色' : '切换到深色';
      b.setAttribute('aria-label', b.title);
    }
  };
  WB.initTheme = function () {
    var saved = null;
    try { saved = localStorage.getItem(K.theme); } catch (e) {}
    var t = saved || 'light';
    WB.applyTheme(t);
    var b = document.querySelector('[data-theme-btn]');
    if (b) b.addEventListener('click', function () {
      WB.applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  };
  // 首屏防闪：尽早设置
  (function () {
    try {
      var t = localStorage.getItem(K.theme) || 'light';
      document.documentElement.setAttribute('data-theme', t);
    } catch (e) { document.documentElement.setAttribute('data-theme', 'light'); }
  })();

  /* ---------------- 站点外壳（页头 / 页脚） ---------------- */
  var NAV = [
    { href: 'index.html', label: '总览', key: 'home' },
    { href: 'subjects.html', label: '全部科目', key: 'subjects' },
    { href: 'wrongbook.html', label: '错题本', key: 'wrong' },
    { href: 'about.html', label: '关于', key: 'about' }
  ];
  WB.mountChrome = function (active) {
    var hdr = document.querySelector('[data-hdr]');
    if (hdr) {
      var links = NAV.map(function (n) {
        return '<a href="' + n.href + '"' + (n.key === active ? ' class="on"' : '') + '>' + n.label + '</a>';
      }).join('');
      hdr.innerHTML =
        '<div class="wrap hdr-in">' +
        '<a class="logo" href="index.html"><span class="logo-mark">✚</span><span>MediLearn</span></a>' +
        '<nav class="nav" id="site-nav" data-nav>' + links + '</nav>' +
        '<div class="hdr-tools">' +
        '<button class="icon-btn" data-theme-btn title="切换主题" aria-label="切换主题">◑</button>' +
        '<button class="icon-btn" data-logout-btn title="退出登录">⏻</button>' +
        '<button class="icon-btn menu-btn" data-menu-btn title="菜单" aria-label="打开菜单" aria-expanded="false" aria-controls="site-nav">☰</button>' +
        '</div></div>';
      var mb = hdr.querySelector('[data-menu-btn]'), nav = hdr.querySelector('[data-nav]');
      if (mb && nav) {
        var scrim = document.createElement('div');
        scrim.className = 'nav-scrim';
        document.body.appendChild(scrim);
        var setNav = function (open) {
          nav.classList.toggle('open', open);
          scrim.classList.toggle('on', open);
          document.body.classList.toggle('nav-lock', open);
          mb.setAttribute('aria-expanded', open ? 'true' : 'false');
          mb.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
          mb.textContent = open ? '✕' : '☰';
        };
        mb.addEventListener('click', function () { setNav(!nav.classList.contains('open')); });
        scrim.addEventListener('click', function () { setNav(false); });
        nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
        window.addEventListener('resize', function () { if (window.innerWidth > 760) setNav(false); });
        window.addEventListener('orientationchange', function () { setNav(false); });
      }
      var lb = hdr.querySelector('[data-logout-btn]');
      if (lb) lb.addEventListener('click', function () {
        var days = WB.auth ? WB.auth.daysLeft() : 0;
        WB.confirm({
          title: '退出登录',
          desc: '退出后需要重新输入访问密钥。' +
            (days ? '（当前登录状态原本还将保持 ' + days + ' 天）' : ''),
          ok: '退出',
          cancel: '再想想',
          onOk: function () {
            if (WB.auth) WB.auth.logout();
            location.replace('login.html');
          }
        });
      });
    }
    var ftr = document.querySelector('[data-ftr]');
    if (ftr) {
      var st = WB.stats();
      ftr.innerHTML =
        '<div class="wrap ftr-in">' +
        '<div>MediLearn · 医学学习站 · 纯静态站点，可离线使用</div>' +
        '<div class="ftr-author">作者 <b>元泯</b> · ' +
          '<a href="mailto:1959940664@qq.com" title="给作者发邮件">1959940664@qq.com</a></div>' +
        '<div class="small">' + st.subjects + ' 个科目 · ' + st.knowledge + ' 个知识点 · ' + st.quiz + ' 道题</div>' +
        '</div>';
    }
    WB.initTheme();
  };

  /* ---------------- 进度环 ---------------- */
  WB.ring = function (pct, opts) {
    opts = opts || {};
    var size = opts.size || 52, sw = opts.sw || 5, color = opts.color || 'var(--brand)';
    var r = (size - sw) / 2, c = 2 * Math.PI * r;
    var off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    var uid = 'g' + Math.random().toString(36).slice(2, 8);
    return '<div class="ring' + (opts.lg ? ' ring-lg' : '') + '" style="width:' + size + 'px;height:' + size + 'px;flex:0 0 ' + size + 'px">' +
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + color + '"/><stop offset="100%" stop-color="' + color + '" stop-opacity=".55"/>' +
      '</linearGradient></defs>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--surface-3)" stroke-width="' + sw + '"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="url(#' + uid + ')" stroke-width="' + sw +
      '" stroke-linecap="round" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '"/>' +
      '</svg><div class="ring-txt">' + pct + '%</div></div>';
  };

  /* ---------------- 内容块渲染 ---------------- */
  WB.renderBlocks = function (blocks) {
    if (!blocks) return '';
    return blocks.map(function (b) {
      switch (b.type) {
        case 'h':
          return '<h' + (b.level || 3) + ' id="' + WB.esc(b.id || WB.slug(b.text)) + '">' + WB.rich(b.text) + '</h' + (b.level || 3) + '>';
        case 'p':
          return '<p>' + WB.rich(b.text) + '</p>';
        case 'list':
          var tag = b.ordered ? 'ol' : 'ul';
          return '<' + tag + '>' + (b.items || []).map(function (i) { return '<li>' + WB.rich(i) + '</li>'; }).join('') + '</' + tag + '>';
        case 'table':
          return '<div class="blk-table"><table>' +
            (b.head ? '<thead><tr>' + b.head.map(function (h) { return '<th>' + WB.rich(h) + '</th>'; }).join('') + '</tr></thead>' : '') +
            '<tbody>' + (b.rows || []).map(function (r) {
              return '<tr>' + r.map(function (c) { return '<td>' + WB.rich(c) + '</td>'; }).join('') + '</tr>';
            }).join('') + '</tbody></table></div>';
        case 'note':
          var icons = { info: 'ℹ', tip: '✓', warn: '⚠', key: '★' };
          var v = b.variant || 'info';
          return '<div class="note note-' + v + '"><div class="note-t">' + (icons[v] || 'ℹ') + ' ' + WB.esc(b.title || '提示') +
            '</div>' + WB.rich(b.text) + '</div>';
        case 'terms':
          return '<div class="term-grid">' + (b.items || []).map(function (t) {
            return '<div class="term">' + (t.en ? '<div class="term-en">' + WB.esc(t.en) + '</div>' : '') +
              '<div class="term-cn">' + WB.rich(t.cn) + '</div>' +
              (t.note ? '<div class="term-no">' + WB.rich(t.note) + '</div>' : '') + '</div>';
          }).join('') + '</div>';
        case 'kv':
          return '<div class="kv">' + (b.items || []).map(function (i) {
            return '<div class="kv-row"><div class="kv-k">' + WB.rich(i.k) + '</div><div>' + WB.rich(i.v) + '</div></div>';
          }).join('') + '</div>';
        case 'svg':
          return '<figure class="fig">' + b.svg + (b.caption ? '<figcaption>' + WB.esc(b.caption) + '</figcaption>' : '') + '</figure>';
        case 'code':
          return '<div class="blk-table"><pre style="margin:0;padding:14px 16px;font-family:var(--font-mono);font-size:13px;overflow:auto"><code>' + WB.esc(b.text) + '</code></pre></div>';
        case 'quote':
          return '<blockquote style="margin:0 0 18px;padding:10px 18px;border-left:3px solid var(--border-2);color:var(--text-2)">' + WB.rich(b.text) + '</blockquote>';
        case 'viz':
          return '<div class="viz-slot" data-viz="' + WB.esc(b.kind) + '"></div>';
        default:
          return '';
      }
    }).join('');
  };

  /* 从内容块提取目录（h3） */
  WB.outline = function (blocks) {
    var out = [];
    (blocks || []).forEach(function (b) {
      if (b.type === 'h' && (b.level || 3) === 3) out.push({ id: b.id || WB.slug(b.text), text: b.text });
    });
    return out;
  };

  /* ---------------- Markdown 导出 ---------------- */
  function blocksToMd(blocks) {
    var L = [];
    (blocks || []).forEach(function (b) {
      switch (b.type) {
        case 'h': L.push('', '#'.repeat(b.level || 3) + ' ' + plain(b.text), ''); break;
        case 'p': L.push(plain(b.text), ''); break;
        case 'list':
          (b.items || []).forEach(function (i, idx) { L.push((b.ordered ? (idx + 1) + '. ' : '- ') + plain(i)); });
          L.push(''); break;
        case 'table':
          if (b.head) { L.push('| ' + b.head.map(plain).join(' | ') + ' |'); L.push('|' + b.head.map(function () { return ' --- '; }).join('|') + '|'); }
          (b.rows || []).forEach(function (r) { L.push('| ' + r.map(plain).join(' | ') + ' |'); });
          L.push(''); break;
        case 'note':
          L.push('> **' + (b.title || '提示') + '**：' + plain(b.text), ''); break;
        case 'terms':
          (b.items || []).forEach(function (t) {
            L.push('- **' + (t.en || t.cn) + '**' + (t.en ? ' — ' + t.cn : '') + (t.note ? '（' + t.note + '）' : ''));
          });
          L.push(''); break;
        case 'kv':
          (b.items || []).forEach(function (i) { L.push('- **' + plain(i.k) + '**：' + plain(i.v)); });
          L.push(''); break;
        case 'svg': L.push('> [图示] ' + (b.caption || ''), ''); break;
        case 'code': L.push('```', b.text, '```', ''); break;
        case 'quote': L.push('> ' + plain(b.text), ''); break;
        case 'viz': L.push('> [交互图示] 见网页版', ''); break;
      }
    });
    return L.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function plain(s) {
    return String(s == null ? '' : s)
      .replace(/<br\s*\/?>/g, ' ')
      .replace(/\[\[([^\]]+)\]\]/g, '`$1`')
      .replace(/\*\*([^*]+)\*\*/g, '**$1**');
  }
  WB.knowledgeToMd = function (k, opt) {
    opt = opt || {};
    var L = [];
    L.push('# ' + k.title);
    L.push('');
    L.push('> 科目：' + k.subjectName + ' ｜ 章节：' + k.chapterTitle + (k.tags && k.tags.length ? ' ｜ 标签：' + k.tags.join('、') : ''));
    L.push('');
    if (k.summary) { L.push('**概要**：' + plain(k.summary), ''); }
    L.push('---', '');
    L.push(blocksToMd(k.content));
    if (opt.withQuiz && (k.quiz || []).length) {
      L.push('', '---', '', '## 自测练习', '');
      k.quiz.forEach(function (q, i) {
        L.push('**' + (i + 1) + '. ' + plain(q.stem) + '**');
        if (q.options) q.options.forEach(function (o, oi) { L.push('- ' + 'ABCDEF'[oi] + '. ' + plain(o)); });
        L.push('');
      });
      L.push('## 参考答案', '');
      k.quiz.forEach(function (q, i) {
        L.push((i + 1) + '. **' + fmtAnswer(q) + '**' + (q.explain ? ' — ' + plain(q.explain) : ''));
      });
    }
    L.push('', '---', '', '_本文档由 MediLearn 医学学习站导出_');
    return L.join('\n');
  };
  WB.subjectToMd = function (s, opt) {
    opt = opt || {};
    var L = ['# ' + s.name + ' · 知识点全册', '', '> ' + (s.desc || ''), '',
      '- 章节数：' + s._count.chapters, '- 知识点：' + s._count.knowledge, '- 练习题：' + s._count.quiz, '', '---', ''];
    s.chapters.forEach(function (ch, ci) {
      L.push('', '# 第 ' + (ci + 1) + ' 章　' + ch.title, '');
      if (ch.desc) L.push('_' + plain(ch.desc) + '_', '');
      (ch.knowledge || []).forEach(function (k, ki) {
        L.push('', '## ' + (ci + 1) + '.' + (ki + 1) + '　' + k.title, '');
        if (k.summary) L.push('**概要**：' + plain(k.summary), '');
        L.push(blocksToMd(k.content));
        if (opt.withQuiz && (k.quiz || []).length) {
          L.push('', '### 自测练习', '');
          k.quiz.forEach(function (q, i) {
            L.push('**' + (i + 1) + '. ' + plain(q.stem) + '**');
            if (q.options) q.options.forEach(function (o, oi) { L.push('- ' + 'ABCDEF'[oi] + '. ' + plain(o)); });
            L.push('');
          });
          L.push('### 参考答案', '');
          k.quiz.forEach(function (q, i) {
            L.push((i + 1) + '. **' + fmtAnswer(q) + '**' + (q.explain ? ' — ' + plain(q.explain) : ''));
          });
        }
        L.push('', '---');
      });
    });
    L.push('', '_本册由 MediLearn 医学学习站导出_');
    return L.join('\n');
  };
  WB.fmtAnswer = fmtAnswer;
  function fmtAnswer(q) {
    if (q.type === 'single') return 'ABCDEF'[(q.answer || 0)];
    if (q.type === 'multiple') return (q.answer || []).map(function (i) { return 'ABCDEF'[i]; }).join('');
    if (q.type === 'judge') return q.answer ? '正确' : '错误';
    return (q.answer || []).join(' / ');
  }

  WB.download = function (filename, text) {
    var blob = new Blob(['\ufeff' + text], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
  };
  WB.copy = function (text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { WB.toast(okMsg || '已复制到剪贴板'); },
        function () { WB.toast('复制失败，请手动选择'); });
    } else { WB.toast('当前环境不支持自动复制'); }
  };

  /* ---------------- 全站搜索 ---------------- */
  WB.search = function (q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return [];
    var res = [];
    _subjects.forEach(function (s) {
      s.chapters.forEach(function (ch) {
        (ch.knowledge || []).forEach(function (k) {
          var hay = (k.title + ' ' + (k.summary || '') + ' ' + (k.tags || []).join(' ') + ' ' +
            JSON.stringify(k.content || [])).toLowerCase();
          if (hay.indexOf(q) > -1) {
            var i = hay.indexOf(q);
            res.push({ subject: s, k: k, snippet: makeSnippet(hay, i) });
          }
        });
      });
    });
    return res.slice(0, 40);
  };
  function makeSnippet(hay, i) {
    var a = Math.max(0, i - 26), b = Math.min(hay.length, i + 46);
    return (a > 0 ? '…' : '') + hay.slice(a, b).replace(/[{}[\]"]/g, ' ').replace(/\s+/g, ' ') + (b < hay.length ? '…' : '');
  }

  /* ---------------- 遮罩显隐 ----------------
     .mask 默认 opacity:0 / pointer-events:none，必须加上 .on 才可见可点。
     仅用 requestAnimationFrame 会在 rAF 被节流时（后台标签页、省电模式、
     打印、部分引擎）导致弹窗永远不显示，故用 setTimeout 兜底。 */
  function showMask(mask) {
    var done = false;
    function on() { if (done) return; done = true; mask.classList.add('on'); }
    requestAnimationFrame(on);
    setTimeout(on, 60);
  }

  /* ---------------- 下载选择弹窗 ---------------- */
  WB.downloadModal = function (title, opts) {
    // opts: [{icon, label, desc, run}]
    var mask = document.createElement('div');
    mask.className = 'mask';
    mask.innerHTML = '<div class="modal"><h3>' + WB.esc(title) + '</h3>' +
      '<p class="small muted">选择导出方式。Markdown 便于二次编辑与导入笔记软件；打印可另存为 PDF。</p>' +
      '<div data-opts></div><div class="mt-3 row" style="justify-content:flex-end"><button class="btn" data-close>取消</button></div></div>';
    var box = mask.querySelector('[data-opts]');
    opts.forEach(function (o, i) {
      var d = document.createElement('div');
      d.className = 'dl-opt';
      d.innerHTML = '<div class="dl-ico">' + o.icon + '</div><div style="min-width:0"><div style="font-weight:700">' + WB.esc(o.label) +
        '</div><div class="small muted">' + WB.esc(o.desc) + '</div></div>';
      d.addEventListener('click', function () { mask.remove(); o.run(); });
      box.appendChild(d);
    });
    mask.querySelector('[data-close]').addEventListener('click', function () { mask.remove(); });
    mask.addEventListener('click', function (e) { if (e.target === mask) mask.remove(); });
    document.body.appendChild(mask);
    showMask(mask);
  };

  /* ---------------- 通用确认弹窗 ---------------- */
  WB.confirm = function (opts) {
    opts = opts || {};
    var mask = document.createElement('div');
    mask.className = 'mask';
    mask.innerHTML = '<div class="modal"><h3>' + WB.esc(opts.title || '请确认') + '</h3>' +
      (opts.desc ? '<p class="small muted">' + WB.esc(opts.desc) + '</p>' : '') +
      '<div class="mt-3 row" style="justify-content:flex-end">' +
      '<button class="btn" data-no>' + WB.esc(opts.cancel || '取消') + '</button>' +
      '<button class="btn btn-primary" data-yes>' + WB.esc(opts.ok || '确定') + '</button>' +
      '</div></div>';
    function close() {
      mask.classList.remove('on');
      setTimeout(function () { if (mask.parentNode) mask.remove(); }, 260);
    }
    mask.querySelector('[data-no]').addEventListener('click', close);
    mask.querySelector('[data-yes]').addEventListener('click', function () {
      close();
      if (opts.onOk) opts.onOk();
    });
    mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
    document.body.appendChild(mask);
    showMask(mask);
    var y = mask.querySelector('[data-yes]');
    if (y) y.focus();
  };

  /* ---------------- 面包屑 ---------------- */
  WB.crumb = function (items) {
    return '<div class="crumb">' + items.map(function (it, i) {
      var s = i ? '<span class="sep">/</span>' : '';
      return s + (it.href ? '<a href="' + it.href + '">' + WB.esc(it.text) + '</a>' : '<span>' + WB.esc(it.text) + '</span>');
    }).join('') + '</div>';
  };

  /* ---------------- 判定答案是否正确 ---------------- */
  WB.isCorrect = function (q, ans) {
    if (q.type === 'single') return ans === q.answer;
    if (q.type === 'multiple') {
      if (!Array.isArray(ans)) return false;
      var a = ans.slice().sort().join(','), b = (q.answer || []).slice().sort().join(',');
      return a === b;
    }
    if (q.type === 'judge') return ans === q.answer;
    if (q.type === 'fill') {
      var t = String(ans == null ? '' : ans).trim().toLowerCase().replace(/\s+/g, '');
      if (!t) return false;
      return (q.answer || []).some(function (a) { return String(a).trim().toLowerCase().replace(/\s+/g, '') === t; });
    }
    return false;
  };
  WB.typeLabel = function (t) {
    return { single: '单选题', multiple: '多选题', judge: '判断题', fill: '填空题' }[t] || '题目';
  };
  /* perm 可选：显示位次 → 原始下标 的映射数组；用于选项乱序后仍输出正确的字母标号 */
  function letterOf(i, perm) {
    var d = perm ? perm.indexOf(i) : i;
    return d > -1 && d < 6 ? 'ABCDEF'[d] : '?';
  }
  function lettersOf(arr, perm) {
    return (arr || []).map(function (i) { return letterOf(i, perm); }).sort().join('、');
  }
  WB.answerText = function (q, perm) {
    if (q.type === 'single') return letterOf(q.answer, perm) + '. ' + plain((q.options || [])[q.answer] || '');
    if (q.type === 'multiple') return lettersOf(q.answer, perm);
    if (q.type === 'judge') return q.answer ? '正确' : '错误';
    return (q.answer || []).join(' / ');
  };
  WB.myAnswerText = function (q, ans, perm) {
    if (ans === undefined || ans === null || ans === '' || (Array.isArray(ans) && !ans.length)) return '（未作答）';
    if (q.type === 'single') return letterOf(ans, perm) + '. ' + plain((q.options || [])[ans] || '');
    if (q.type === 'multiple') return lettersOf(ans, perm);
    if (q.type === 'judge') return ans ? '正确' : '错误';
    return String(ans);
  };
  /* 不带字母标号的答案文本：选项顺序被打乱过、或不在同一页面时使用，避免字母误导 */
  WB.answerPlain = function (q, ans) {
    var arr = arguments.length > 1 ? ans : q.answer;
    if (arr === undefined || arr === null || arr === '' || (Array.isArray(arr) && !arr.length)) return '（未作答）';
    if (q.type === 'single') return plain((q.options || [])[arr] || '');
    if (q.type === 'multiple') return (arr || []).map(function (i) { return plain((q.options || [])[i] || ''); }).join('；');
    if (q.type === 'judge') return arr ? '正确' : '错误';
    if (q.type === 'fill') return (arr || []).join(' / ');
    return String(arr == null ? '' : arr);
  };
  WB.plain = plain;

  /* ---------------- 空状态 ---------------- */
  WB.empty = function (icon, title, desc, actionHtml) {
    return '<div class="empty"><div class="ico">' + icon + '</div><div style="font-weight:700;color:var(--text);font-size:16px">' +
      WB.esc(title) + '</div><div class="mt-1">' + WB.esc(desc || '') + '</div>' +
      (actionHtml ? '<div class="mt-3">' + actionHtml + '</div>' : '') + '</div>';
  };
})();
