/* 生成速记页 PDF：node _tools/gen_mn_pdf.js [--only=id] [--full] */
const http = require('http'), fs = require('fs'), path = require('path');
const BASE = 'http://127.0.0.1:8765/';
const DBG = 'http://127.0.0.1:9222';
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'pdf');

function getJSON(u) {
  return new Promise((res, rej) => {
    http.get(u, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej);
  });
}
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.p = new Map(); }
  static async attach(u) {
    const ws = new WebSocket(u);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    const c = new CDP(ws);
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && c.p.has(m.id)) {
        const { res, rej } = c.p.get(m.id);
        c.p.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
      }
    };
    return c;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.p.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.p.has(id)) { this.p.delete(id); rej(new Error('timeout ' + method)); } }, 120000);
    });
  }
}

const CSS = `
  .sidebar,.mobile-nav,.footer,.hdr,.top,.tools,.progress,.dock,.tabbar,.menu-btn,
  .nav-question-bank,.question-bank,.hero-ctas,.hero-cta,.qb-exam,
  body::before,body::after,.grain,.scroll-progress,.to-top,.qr-zoom{display:none!important}
  .layout{display:block!important;width:100%!important;margin:0!important;padding:0!important}
  main{width:100%!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important}
  .wrap{max-width:none!important;margin:0!important;padding:0!important}
  body{background:#fff!important;color:#000!important;font-size:10.5pt!important}
  *{mix-blend-mode:normal!important;mask:none!important;will-change:auto!important;
    animation:none!important;transition:none!important;filter:none!important;
    backdrop-filter:none!important;box-shadow:none!important;text-shadow:none!important}
  .reveal{opacity:1!important;transform:none!important}
  .answer-panel[hidden]{display:block!important}
  .chapter,.knowledge-block,table,.table-wrap{break-inside:auto!important}
  tr,figure{break-inside:avoid!important}
  .chapter + .chapter{break-before:page}
  .hero,.hero::before,.hero::after{background:#fff!important;background-image:none!important;
        border:0!important;box-shadow:none!important}
  .hero::before,.hero::after{display:none!important}
  .hero h1{background:none!important;-webkit-text-fill-color:#000!important;color:#000!important;
        font-size:22pt!important;line-height:1.35!important}
  .hero p,.hero-meta,.hero-meta span{color:#333!important}
  .hero .orb,.hero-tag{display:none!important}
  .chapter-header{background:#fff!important;background-image:none!important;color:#000!important;
        border-left:4px solid #5B84A8!important;border-bottom:1px solid #ddd!important;box-shadow:none!important}
  .chapter-header *{color:#000!important}
  .chapter-number{color:#5B84A8!important}
  figure svg,figure img{max-height:72mm!important;width:auto!important;max-width:100%!important;
        display:block!important;margin:0 auto!important}
  .chips{display:flex!important;flex-wrap:wrap!important;gap:6px!important}
  .chip{display:inline-block!important;padding:2px 7px!important;border:1px solid #999!important;
        border-radius:10px!important;background:#f7f7f7!important;color:#000!important;font-size:9pt!important}
  a{color:#000!important;text-decoration:none!important}
`;

async function gen(pg, id, full, rel) {
  const url = BASE + (rel || ('mn/' + id + '.html'));
  await pg.send('Page.navigate', { url });
  await new Promise(r => setTimeout(r, 1500));
  // 展开答案、强制 reveal
  await pg.send('Runtime.evaluate', { expression: `(function(){
    document.querySelectorAll('.chapter .reveal,.knowledge-block .reveal').forEach(e=>e.classList.add('visible'));
    document.querySelectorAll('.knowledge-block details').forEach(d=>d.open=true);
    document.querySelectorAll('.knowledge-block .answer-panel').forEach(p=>p.hidden=false);
  })()` });
  let css = CSS + (full ? '\n.question-bank{display:block!important}' : '');
  /* 独立文档页含固定定位装饰层，打印会卡死，强制静态布局 */
  if (id === 'huanjingweisheng' || id === 'laoweisheng') css += '\n*{position:static!important}';
  await pg.send('Runtime.evaluate', { expression: `(function(){var st=document.createElement('style');st.id='pdf-css';st.textContent=${JSON.stringify(css)};document.head.appendChild(st);})()` });
  // 等图片与字体
  await pg.send('Runtime.evaluate', { expression: `(async function(){
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const imgs=[...document.images].filter(i=>!i.complete);
    await Promise.all(imgs.map(i=>new Promise(r=>{i.onload=i.onerror=r;})));
  })()`, awaitPromise: true });
  await new Promise(r => setTimeout(r, 600));
  const { data } = await pg.send('Page.printToPDF', {
    printBackground: true, paperWidth: 8.27, paperHeight: 11.69,
    marginTop: 0.45, marginBottom: 0.45, marginLeft: 0.45, marginRight: 0.45,
    preferCSSPageSize: false
  });
  const buf = Buffer.from(data, 'base64');
  fs.writeFileSync(path.join(OUT, id + '.pdf'), buf);
  return buf.length;
}

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);
  const onlyArg = process.argv.find(a => a.startsWith('--only='));
  const full = process.argv.includes('--full');
  const lst = fs.readFileSync(path.join(ROOT, 'mn/list.js'), 'utf8');
  const relMap = JSON.parse(lst.replace(/^window\.WB_MN\s*=\s*/, '').replace(/;\s*$/, ''));
  let ids;
  if (onlyArg) ids = onlyArg.slice(7).split(',');
  else ids = Object.keys(relMap);
  const ver = await getJSON(DBG + '/json/version');
  const b = await CDP.attach(ver.webSocketDebuggerUrl);
  let total = 0;
  for (const id of ids) {
    let targetId = null;
    try {
      const created = await b.send('Target.createTarget', { url: 'about:blank' });
      targetId = created.targetId;
      const list = await getJSON(DBG + '/json/list');
      const t = list.find(x => x.id === targetId);
      const pg = await CDP.attach(t.webSocketDebuggerUrl);
      await pg.send('Page.enable');
      await pg.send('Network.enable');
      await pg.send('Network.setCacheDisabled', { cacheDisabled: true });
      const size = await gen(pg, id, full, relMap[id]);
      total += size;
      console.log('  %s  %s KB', id.padEnd(22), (size / 1024).toFixed(0));
    } catch (e) {
      console.log('  FAIL', id, e.message);
    }
    if (targetId) {
      try { await b.send('Target.closeTarget', { targetId }); } catch (e) {}
    }
  }
  console.log('合计 %.1f MB', total / 1048576);
  process.exit(0);
})().catch(e => { console.error('PDF FAIL', e.message); process.exit(1); });
