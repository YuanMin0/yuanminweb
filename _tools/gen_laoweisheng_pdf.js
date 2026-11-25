/* 劳动卫生学：逐章打印后合并（整页打印会卡死） */
const http = require('http'), fs = require('fs'), path = require('path');
const BASE = 'http://127.0.0.1:8765/laoweisheng.html';
const DBG = 'http://127.0.0.1:9222';
const ROOT = path.resolve(__dirname, '..');
const PARTS = path.join(ROOT, 'pdf', '_parts');

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
      setTimeout(() => { if (this.p.has(id)) { this.p.delete(id); rej(new Error('timeout ' + method)); } }, 90000);
    });
  }
}

const CSS = `
  .sidebar,.mobile-nav,.footer,.hdr,.top,.tools,.progress,.dock,.tabbar,.menu-btn,
  .nav-question-bank,.question-bank,.hero-ctas,.hero-cta,.qb-exam,
  body::before,body::after,.grain,.scroll-progress,.to-top,.qr-zoom,
  .entry-gate,.entry-canvas,.entry-bloom,.entry-shine,.skip-link{display:none!important}
  .layout{display:block!important;width:100%!important;margin:0!important;padding:0!important}
  main{width:100%!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important}
  body{background:#fff!important;color:#000!important;font-size:10.5pt!important}
  *{position:static!important;mix-blend-mode:normal!important;mask:none!important;will-change:auto!important;
    animation:none!important;transition:none!important;filter:none!important;
    backdrop-filter:none!important;box-shadow:none!important;text-shadow:none!important}
  .reveal{opacity:1!important;transform:none!important}
  .answer-panel[hidden]{display:block!important}
  .chapter,.knowledge-block,table,.table-wrap{break-inside:auto!important}
  tr,figure{break-inside:avoid!important}
  .chapter-header{background:#fff!important;background-image:none!important;color:#000!important;
        border-left:4px solid #5B84A8!important;border-bottom:1px solid #ddd!important}
  .chapter-header *{color:#000!important}
  .chapter-number{color:#5B84A8!important}
  figure svg,figure img{max-height:72mm!important;width:auto!important;max-width:100%!important;display:block!important;margin:0 auto!important}
  .chips{display:flex!important;flex-wrap:wrap!important;gap:6px!important}
  .chip{display:inline-block!important;padding:2px 7px!important;border:1px solid #999!important;
        border-radius:10px!important;background:#f7f7f7!important;color:#000!important;font-size:9pt!important}
  a{color:#000!important;text-decoration:none!important}
`;

(async () => {
  fs.mkdirSync(PARTS, { recursive: true });
  const ver = await getJSON(DBG + '/json/version');
  const b = await CDP.attach(ver.webSocketDebuggerUrl);
  const { targetId } = await b.send('Target.createTarget', { url: 'about:blank' });
  const list = await getJSON(DBG + '/json/list');
  const t = list.find(x => x.id === targetId);
  const pg = await CDP.attach(t.webSocketDebuggerUrl);
  await pg.send('Page.enable');
  await pg.send('Network.enable');
  await pg.send('Network.setCacheDisabled', { cacheDisabled: true });

  // 先数章节
  await pg.send('Page.navigate', { url: BASE });
  await new Promise(r => setTimeout(r, 1800));
  const n = await pg.send('Runtime.evaluate', { expression: 'document.querySelectorAll(".chapter").length', returnByValue: true }).then(r => r.result.value);
  console.log('章节数', n);

  for (let i = 0; i < n; i++) {
    await pg.send('Page.navigate', { url: BASE });
    await new Promise(r => setTimeout(r, 1500));
    await pg.send('Runtime.evaluate', {
      expression: `(function(){
        document.querySelectorAll('.reveal').forEach(e=>e.classList.add('visible'));
        document.querySelectorAll('details').forEach(d=>d.open=true);
        document.querySelectorAll('.chapter').forEach((c,j)=>{ if(j!==${i}) c.remove(); });
        if(${i}>0){ var h=document.querySelector('.hero'); if(h) h.remove(); }
        var st=document.createElement('style'); st.textContent=${JSON.stringify(CSS)}; document.head.appendChild(st);
      })()`
    });
    await new Promise(r => setTimeout(r, 400));
    const { data } = await pg.send('Page.printToPDF', {
      printBackground: true, paperWidth: 8.27, paperHeight: 11.69,
      marginTop: 0.45, marginBottom: 0.45, marginLeft: 0.45, marginRight: 0.45
    });
    fs.writeFileSync(path.join(PARTS, 'laoweisheng_' + i + '.pdf'), Buffer.from(data, 'base64'));
    console.log('  章', i + 1, 'ok', Math.round(data.length * 0.75 / 1024), 'KB');
  }
  await b.send('Target.closeTarget', { targetId });
  process.exit(0);
})().catch(e => { console.error('SPLIT FAIL', e.message); process.exit(1); });
