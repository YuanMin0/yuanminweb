/* ==========================================================================
   一键导出 HTML
   --------------------------------------------------------------------------
   把知识点（或整门科目）渲染成一个自包含的 HTML 文件：
   样式、内容、题目全部内联，不依赖网络、不依赖本站，双击即可离线阅读。
   版式参考「公文 / 学术讲义」：宋体标题、仿宋正文、三线表、金色分隔线。
   ========================================================================== */
(function () {
  'use strict';

  var LETTER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  /* ---------------- 样式 ---------------- */
  var CSS = [
    ':root{--navy:#0d2c4c;--deep:#071b30;--blue:#1b5b8d;--gold:#b88a3b;',
    '--ink:#172638;--paper:#fff;--g50:#f5f7f9;--g100:#eef2f5;--g200:#dce3e9;--g500:#5d6d7d;',
    '--title:"方正小标宋简体","FZXiaoBiaoSong-B05S","STZhongsong","SimSun",serif;',
    '--head:"黑体","SimHei","Microsoft YaHei",sans-serif;',
    '--body:"仿宋_GB2312","FangSong_GB2312","仿宋","FangSong","Songti SC",serif;}',
    '*{box-sizing:border-box}',
    'html{scroll-behavior:smooth;scroll-padding-top:20px}',
    'body{margin:0;color:var(--ink);background:var(--g50);',
    'font:17px/1.8 var(--body);-webkit-font-smoothing:antialiased}',

    /* 封面 */
    '.cover{background:linear-gradient(160deg,var(--deep) 0%,var(--navy) 60%,#12456f 100%);',
    'color:#fff;padding:64px 28px 54px;position:relative;overflow:hidden}',
    '.cover::after{content:"";position:absolute;right:-80px;top:-80px;width:340px;height:340px;',
    'border:1px solid rgba(184,138,59,.35);border-radius:50%}',
    '.cover::before{content:"";position:absolute;right:40px;bottom:-120px;width:260px;height:260px;',
    'border:1px solid rgba(255,255,255,.12);border-radius:50%}',
    '.cv-in{max-width:860px;margin:0 auto;position:relative;z-index:1}',
    '.kicker{font-family:var(--head);font-size:13px;letter-spacing:.22em;color:var(--gold);',
    'text-transform:uppercase;margin-bottom:18px}',
    '.cover h1{font-family:var(--title);font-weight:400;font-size:42px;line-height:1.35;',
    'margin:0 0 20px;letter-spacing:.01em}',
    '.cover .rule{width:64px;height:3px;background:var(--gold);margin:0 0 20px}',
    '.cover .meta{font-family:var(--head);font-size:13px;color:#a9c2d8;letter-spacing:.06em}',
    '.cover .meta span{margin-right:16px}',

    /* 纸张 */
    '.paper{max-width:860px;margin:-34px auto 60px;background:var(--paper);',
    'padding:52px 60px 60px;box-shadow:0 20px 60px rgba(9,37,66,.10);border-radius:4px}',
    '@media(max-width:760px){.paper{margin:0;padding:28px 20px 40px;border-radius:0}',
    '.cover{padding:44px 20px 40px}.cover h1{font-size:29px}}',

    /* 概要 */
    '.lead{background:var(--g50);border-left:4px solid var(--gold);padding:16px 20px;',
    'margin:0 0 30px;font-size:16px;line-height:1.85;color:#33475c}',
    '.lead b{font-family:var(--head);font-size:13px;letter-spacing:.14em;color:var(--gold);',
    'display:block;margin-bottom:6px}',

    /* 目录 */
    '.toc{border-top:1px solid var(--g200);border-bottom:1px solid var(--g200);',
    'padding:16px 0;margin:0 0 34px}',
    '.toc h4{font-family:var(--head);font-size:12px;letter-spacing:.2em;color:var(--g500);',
    'margin:0 0 10px}',
    '.toc ol{margin:0;padding-left:22px;columns:2;column-gap:32px}',
    '.toc li{font-size:14.5px;line-height:2;color:#33475c}',
    '.toc a{color:#33475c;text-decoration:none}',
    '.toc a:hover{color:var(--blue)}',

    /* 正文 */
    'article h3{font-family:var(--head);font-size:19px;font-weight:600;color:var(--navy);',
    'margin:38px 0 14px;padding-left:13px;border-left:4px solid var(--gold);line-height:1.5}',
    'article h4{font-family:var(--head);font-size:16px;margin:24px 0 10px;color:var(--navy)}',
    'article p{margin:0 0 1.05em;text-indent:2em;text-align:justify;',
    'text-justify:inter-ideograph;hanging-punctuation:allow-end}',
    'article ul,article ol{margin:0 0 1.1em;padding-left:1.9em}',
    'article li{margin-bottom:.4em;line-height:1.85}',
    'article b,article strong{font-family:var(--head);font-weight:600;color:var(--navy)}',
    'mark.hl{background:#fdecec;color:#b4232c;padding:1px 3px;border-radius:3px;',
    'font-family:var(--head);font-weight:600}',
    'article code{font-family:ui-monospace,Consolas,monospace;font-size:.9em;',
    'background:var(--g100);padding:2px 5px;border-radius:4px}',

    /* 三线表 */
    '.blk-table{margin:0 0 1.3em;overflow-x:auto}',
    '.blk-table table{width:100%;border-collapse:collapse;font-size:15px;line-height:1.7;',
    'border-top:2px solid var(--navy);border-bottom:2px solid var(--navy)}',
    '.blk-table th{font-family:var(--head);font-weight:600;color:var(--navy);text-align:left;',
    'padding:10px 12px;border-bottom:1px solid var(--navy);background:#fbfcfd}',
    '.blk-table td{padding:10px 12px;border-bottom:1px solid var(--g200);vertical-align:top}',
    '.blk-table tr:last-child td{border-bottom:0}',

    /* 提示框 */
    '.note{margin:0 0 1.2em;padding:14px 18px;border-left:4px solid var(--blue);',
    'background:var(--g50);border-radius:0 6px 6px 0;font-size:15.5px;line-height:1.8}',
    '.note-t{font-family:var(--head);font-weight:600;font-size:13px;letter-spacing:.08em;',
    'margin-bottom:6px;color:var(--blue)}',
    '.note-key{border-left-color:var(--gold);background:#fdf9f1}',
    '.note-key .note-t{color:var(--gold)}',
    '.note-warn{border-left-color:#c0392b;background:#fdf3f2}',
    '.note-warn .note-t{color:#c0392b}',
    '.note-tip{border-left-color:#12855f;background:#f2faf6}',
    '.note-tip .note-t{color:#12855f}',

    /* 术语 / 键值 */
    '.term-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin:0 0 1.2em}',
    '.term{border:1px solid var(--g200);border-radius:8px;padding:12px 14px}',
    '.term-en{font-size:12px;color:var(--g500);letter-spacing:.06em}',
    '.term-cn{font-family:var(--head);font-weight:600;color:var(--navy);margin:2px 0 4px}',
    '.term-no{font-size:14px;color:#33475c;line-height:1.7}',
    '.kv{border:1px solid var(--g200);border-radius:8px;overflow:hidden;margin:0 0 1.2em}',
    '.kv-row{display:flex;gap:16px;padding:10px 14px;border-bottom:1px solid var(--g100);font-size:15px}',
    '.kv-row:last-child{border-bottom:0}',
    '.kv-k{font-family:var(--head);font-weight:600;color:var(--navy);flex:0 0 32%}',
    'blockquote{margin:0 0 1.2em;padding:10px 18px;border-left:3px solid var(--g200);color:var(--g500)}',

    /* 习题 */
    '.quiz{margin-top:56px;padding-top:26px;border-top:2px solid var(--navy)}',
    '.quiz h2{font-family:var(--title);font-weight:400;font-size:26px;color:var(--navy);margin:0 0 6px}',
    '.quiz .qsub{font-size:14px;color:var(--g500);margin-bottom:22px}',
    '.q{border:1px solid var(--g200);border-radius:8px;margin-bottom:12px;overflow:hidden}',
    '.q summary{cursor:pointer;padding:14px 18px;list-style:none;display:flex;gap:12px;',
    'align-items:flex-start;background:#fbfcfd}',
    '.q summary::-webkit-details-marker{display:none}',
    '.q summary:hover{background:var(--g50)}',
    '.q .num{font-family:var(--head);font-weight:600;color:var(--gold);flex:none}',
    '.q .stem{flex:1;font-size:16px;line-height:1.75}',
    '.q[open] summary{border-bottom:1px solid var(--g200)}',
    '.q .body{padding:14px 18px 18px}',
    '.q .opt{display:flex;gap:10px;padding:6px 0;font-size:15px;line-height:1.7}',
    '.q .opt .k{font-family:var(--head);font-weight:600;color:var(--blue);flex:none;width:18px}',
    '.q .ans{margin-top:10px;font-size:15px;color:#12855f;font-family:var(--head);font-weight:600}',
    '.q .exp{margin-top:8px;padding:10px 14px;background:var(--g50);border-radius:6px;',
    'font-size:14.5px;line-height:1.8;color:#33475c}',

    /* 页脚 */
    '.doc-foot{margin-top:46px;padding-top:16px;border-top:1px solid var(--g200);',
    'font-size:12.5px;color:var(--g500);display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}',

    /* 打印 */
    '@media print{body{background:#fff}.cover{padding:28px 0;background:#fff;color:#000;',
    'border-bottom:2px solid #000}.cover::before,.cover::after{display:none}',
    '.cover h1{font-size:26px}.kicker{color:#000}.cover .meta{color:#333}',
    '.paper{box-shadow:none;margin:0;padding:0;max-width:none}',
    '.toc{display:none}article h3{break-after:avoid}.q{break-inside:avoid}',
    '.q .body{display:block}}'
  ].join('\n');

  /* ---------------- 组装 ---------------- */
  function blocksHtml(k) {
    return window.WB.renderBlocks ? WB.renderBlocks(k.content) : '';
  }

  function quizHtml(k) {
    if (!k.quiz || !k.quiz.length) return '';
    var items = k.quiz.map(function (q, i) {
      var opts = (q.options || []).map(function (o, j) {
        return '<div class="opt"><span class="k">' + LETTER[j] + '</span><span>' + esc(o) + '</span></div>';
      }).join('');
      var ans;
      if (q.type === 'multiple') {
        ans = (q.answer || []).map(function (x) { return LETTER[x]; }).join('、');
      } else if (q.type === 'judge') {
        ans = q.answer ? '正确' : '错误';
      } else if (q.type === 'fill') {
        ans = (q.answer || []).join(' / ');
      } else {
        ans = LETTER[q.answer];
      }
      return '<details class="q"><summary><span class="num">' + (i + 1) + '.</span>' +
        '<span class="stem">' + esc(q.stem) + '</span></summary>' +
        '<div class="body">' + opts +
        '<div class="ans">答案：' + esc(ans) + '</div>' +
        (q.explain ? '<div class="exp">解析：' + esc(q.explain) + '</div>' : '') +
        '</div></details>';
    }).join('');
    return '<section class="quiz"><h2>自测题</h2>' +
      '<div class="qsub">共 ' + k.quiz.length + ' 题 · 点击题目展开答案与解析</div>' +
      items + '</section>';
  }

  function tocHtml(k) {
    var out = [];
    (k.content || []).forEach(function (b) {
      if (b.type === 'h' && (b.level || 3) === 3) out.push(b.text);
    });
    if (out.length < 2) return '';
    return '<nav class="toc"><h4>本节目录</h4><ol>' +
      out.map(function (t) { return '<li>' + esc(String(t).replace(/==|\*\*/g, '')) + '</li>'; }).join('') +
      '</ol></nav>';
  }

  function build(s, c, k) {
    var tags = (k.tags || []).map(function (t) { return '#' + t; }).join('　');
    return '<!doctype html>\n<html lang="zh-CN">\n<head>\n' +
      '<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<meta name="author" content="元泯">\n' +
      '<meta name="description" content="' + esc(s.name + ' · ' + k.title) + '（离线导出版）">\n' +
      '<title>' + esc(k.title) + ' · ' + esc(s.name) + '</title>\n' +
      '<style>\n' + CSS + '\n</style>\n</head>\n<body>\n' +
      '<header class="cover"><div class="cv-in">' +
      '<div class="kicker">' + esc(s.name) + '　·　' + esc(c ? c.title : '') + '</div>' +
      '<h1>' + esc(k.title) + '</h1>' +
      '<div class="rule"></div>' +
      '<div class="meta"><span>' + esc(tags || '学习笔记') + '</span><span>导出日期 ' + today() + '</span></div>' +
      '</div></header>\n' +
      '<main class="paper">' +
      (k.summary ? '<div class="lead"><b>概要</b>' + esc(String(k.summary).replace(/==|\*\*/g, '')) + '</div>' : '') +
      tocHtml(k) +
      '<article>' + blocksHtml(k) + '</article>' +
      quizHtml(k) +
      '<div class="doc-foot"><span>' + esc(s.name) + ' · ' + esc(k.title) + '</span>' +
      '<span>离线版 · 双击本文件即可阅读，无需联网</span></div>' +
      '</main>\n</body>\n</html>';
  }

  /* ---------------- 对外 ---------------- */
  WB.exportKnowledge = function (s, c, k, silent) {
    var html = build(s, c, k);
    var name = (s.name + '-' + k.title).replace(/[\\/:*?"<>|\s]+/g, '-') + '.html';
    WB.download(name, html, 'text/html;charset=utf-8');
    if (!silent) WB.toast('已导出 HTML，双击即可离线阅读');
  };

  WB.exportSubject = function (s) {
    var parts = [];
    s.chapters.forEach(function (c) {
      c.knowledge.forEach(function (k) {
        parts.push(build(s, c, k));
      });
    });
    // 整本：把多份文档拼成一个（取每份的 body 片段）
    var head = parts[0].split('<body>')[0] + '<body>';
    var bodies = parts.map(function (p) {
      return p.split('<body>')[1].split('</body>')[0];
    }).join('<hr style="border:0;border-top:1px dashed #dce3e9;margin:56px 0">');
    var html = head + bodies + '</body></html>';
    var name = (s.name + '-全册').replace(/[\\/:*?"<>|\s]+/g, '-') + '.html';
    WB.download(name, html, 'text/html;charset=utf-8');
    WB.toast('已导出全册 HTML（' + s._count.knowledge + ' 个知识点）');
  };
})();
