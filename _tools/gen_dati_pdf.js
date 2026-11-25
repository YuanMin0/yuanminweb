/* 生成「考前大题速背」PDF：node _tools/gen_dati_pdf.js [--batch=8]
   策略：逐批显示卡片（默认 8 张/批）→ 每批 printToPDF → pymupdf 合并。
*/
const http = require('http'), fs = require('fs'), path = require('path');
const BASE = 'http://127.0.0.1:8765/';
const DBG = 'http://127.0.0.1:9222';
const ROOT = path.resolve(__dirname, '..');
const PARTS = path.join(ROOT, 'pdf', '_parts');
const OUT = path.join(ROOT, 'pdf', 'organ3-dati.pdf');

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
        const { res, rej } = c.p.get(m.id); c.p.delete(m.id);
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
      setTimeout(() => { if (this.p.has(id)) { this.p.delete(id); rej(new Error('timeout ' + method)); } }, 180000);
    });
  }
}

const PRINT_CSS = `
  @page { size: A4; }
  html, body { background:#fff !important; }
  body { font-size: 10.5pt !important; line-height: 1.62 !important; }
  .topbar, .sidebar, .hero-ctas, .ex-btn, .to-top, .hotbox, .footer, .cat-en { display:none !important; }
  .layout { display:block !important; width:100% !important; margin:0 !important; }
  main { padding:0 !important; background:#fff !important; border:0 !important; box-shadow:none !important; }
  .hero { background:#fff !important; color:#000 !important; padding:0 0 8pt !important; border-bottom:1.5pt solid #333 !important; }
  .hero h1 { font-size:19pt !important; color:#000 !important; }
  .hero .lede { color:#333 !important; font-size:9.5pt !important; margin-top:5pt !important; }
  .hero .eyebrow { color:#666 !important; font-size:8pt !important; }
  .hero-meta { color:#333 !important; font-size:8.5pt !important; margin-top:6pt !important; }
  .hero .lede b, .hero-meta b { color:#000 !important; }
  .cat { margin-bottom: 12pt !important; }
  .cat-head { border-bottom:1pt solid #666 !important; margin-bottom:8pt !important; padding-bottom:5pt !important; }
  .cat-head h2 { font-size:14pt !important; color:#000 !important; }
  .cat-desc { color:#444 !important; font-size:8.5pt !important; }
  .qcard { break-inside: avoid !important; page-break-inside: avoid !important;
    box-shadow:none !important; border:0.8pt solid #999 !important; border-left:3pt solid #555 !important;
    margin-bottom:7pt !important; padding:8pt 10pt 6pt !important; background:#fff !important; }
  .qcard.hot { border-left-color:#B03A2E !important; background:#fff !important; }
  .qid { background:#eee !important; color:#333 !important; }
  .qcard.hot .qid { background:#F6DDD8 !important; color:#8C2F26 !important; }
  .qhead { margin-bottom:5pt !important; gap:4pt 7pt !important; }
  .qhead h3 { font-size:11pt !important; }
  .qtype { color:#555 !important; font-size:8pt !important; }
  .freq { font-size:8pt !important; padding:1pt 6pt !important; }
  .freq.hot { background:#B03A2E !important; color:#fff !important; }
  .freq.mid { background:#FBF0DA !important; color:#7A4E12 !important; border:0.5pt solid #C79A50 !important; }
  .freq.low { background:#EDF2E2 !important; color:#40542A !important; border:0.5pt solid #7E9659 !important; }
  .freq.none { background:#F2EEE3 !important; color:#555 !important; }
  .ans { padding-left:16pt !important; }
  .ans li { margin:2.5pt 0 !important; font-size:9.8pt !important; }
  .ans li::marker { color:#333 !important; }
  .qfoot { margin-top:5pt !important; padding-top:4pt !important; border-top:0.5pt dashed #bbb !important; }
  .src { font-size:7.6pt !important; color:#666 !important; }
  .fig { margin:6pt 0 0 !important; padding:4pt !important; border:0.5pt solid #ddd !important; background:#fff !important; }
  .fig-svg { min-width:0 !important; width:100% !important; }
  .fig figcaption { font-size:7.5pt !important; color:#666 !important; }
  .ex { display:none !important; }
`;

(async () => {
  const ver = await getJSON(DBG + '/json/version');
  const b = await CDP.attach(ver.webSocketDebuggerUrl);
  const { targetId } = await b.send('Target.createTarget', { url: 'about:blank' });
  const list = await getJSON(DBG + '/json/list');
  const t = list.find(x => x.id === targetId);
  const pg = await CDP.attach(t.webSocketDebuggerUrl);
  await pg.send('Page.enable');
  await pg.send('Network.enable');
  await pg.send('Network.setCacheDisabled', { cacheDisabled: true });
  await pg.send('Emulation.setDeviceMetricsOverride', { width: 1000, height: 1400, deviceScaleFactor: 1, mobile: false });
  await pg.send('Page.navigate', { url: BASE + 'organ3-dati.html' });
  await new Promise(r => setTimeout(r, 2500));

  const info = await pg.send('Runtime.evaluate', {
    expression: `(function(){
      var cards=[...document.querySelectorAll('.qcard')];
      return JSON.stringify({n:cards.length, cats:[...document.querySelectorAll('.cat')].map(function(s){return s.id;})});
    })()`, returnByValue: true
  });
  const meta = JSON.parse(info.result.value);
  const N = meta.n;
  const BATCH = Number((process.argv.find(a => a.startsWith('--batch=')) || '--batch=8').slice(8));
  console.log('卡片 %d 张，每批 %d 张，分类 %s', N, BATCH, meta.cats.join(','));

  // 注入打印样式
  await pg.send('Runtime.evaluate', {
    expression: `(function(){var st=document.createElement('style');st.id='print-css';st.textContent=${JSON.stringify(PRINT_CSS)};document.head.appendChild(st);})()`
  });
  await new Promise(r => setTimeout(r, 400));

  fs.mkdirSync(PARTS, { recursive: true });
  const pdfOpts = { printBackground: true, paperWidth: 8.27, paperHeight: 11.69, marginTop: 0.4, marginBottom: 0.4, marginLeft: 0.42, marginRight: 0.42 };
  const files = [];
  let idx = 0, batchNo = 0;

  while (idx < N) {
    const s = idx, e = Math.min(idx + BATCH, N);
    batchNo++;
    // 只显示 [s, e) 的卡片；首批保留 hero，其余隐藏
    await pg.send('Runtime.evaluate', {
      expression: `(function(){
        var cards=[...document.querySelectorAll('.qcard')];
        cards.forEach(function(c,i){ c.style.display = (i>=${s} && i<${e}) ? '' : 'none'; });
        var gi=0;
        document.querySelectorAll('.cat').forEach(function(sec){
          var cardsInSec=[...sec.querySelectorAll('.qcard')];
          var firstIdx=gi; gi+=cardsInSec.length;
          var shown=cardsInSec.filter(function(c){return c.style.display!=='none';}).length;
          sec.style.display = shown?'':'none';
          var head=sec.querySelector('.cat-head');
          if(head) head.style.display = (shown && firstIdx>=${s} && firstIdx<${e}) ? '' : 'none';
        });
        var hero=document.querySelector('.hero'); if(hero) hero.style.display = (${s}===0)?'':'none';
        var hot=document.querySelector('.hotbox'); if(hot) hot.style.display='none';
        window.scrollTo(0,0);
      })()`
    });
    await new Promise(r => setTimeout(r, 650));
    const { data } = await pg.send('Page.printToPDF', pdfOpts);
    const f = path.join(PARTS, 'dati_b' + String(batchNo).padStart(2, '0') + '.pdf');
    fs.writeFileSync(f, Buffer.from(data, 'base64'));
    files.push(f);
    console.log('  批 %d：卡片 %d–%d  %s KB', batchNo, s + 1, e, (data.length * 0.75 / 1024).toFixed(0));
    idx = e;
  }

  await b.send('Target.closeTarget', { targetId });
  fs.writeFileSync(path.join(PARTS, 'dati_files.json'), JSON.stringify(files), 'utf-8');
  console.log('完成 %d 批，待合并', files.length);
  process.exit(0);
})().catch(e => { console.error('PDF FAIL', e.message); process.exit(1); });
