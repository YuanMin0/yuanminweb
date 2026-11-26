/* 按知识块逐块打印后合并：用于整页/整章打印会卡死的大页面 */
const http = require('http'), fs = require('fs'), path = require('path');
const ID = process.argv[2];
if (!ID) { console.error('用法: node gen_mn_pdf_blocks.js <id>'); process.exit(1); }
const ROOT = path.resolve(__dirname, '..');
const lst = fs.readFileSync(path.join(ROOT, 'mn', 'list.js'), 'utf8');
const MAP = JSON.parse(lst.replace(/^window\.WB_MN\s*=\s*/, '').replace(/;\s*$/, ''));
const BASE = 'http://127.0.0.1:8765/' + (MAP[ID] || ('mn/' + ID + '.html'));
const DBG = 'http://127.0.0.1:9222';
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
      setTimeout(() => { if (this.p.has(id)) { this.p.delete(id); rej(new Error('timeout ' + method)); } }, 240000);
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

  await pg.send('Page.navigate', { url: BASE });
  await new Promise(r => setTimeout(r, 1800));
  const info = await pg.send('Runtime.evaluate', {
    expression: `(function(){
      var blocks=[...document.querySelectorAll('.knowledge-block')];
      return blocks.map(function(bk){
        var ch=bk.closest('.chapter');
        var chs=[...document.querySelectorAll('.chapter')];
        var ci=chs.indexOf(ch);
        var first=ch.querySelectorAll('.knowledge-block')[0]===bk;
        return {ci:ci,first:first};
      });
    })()`, returnByValue: true
  }).then(r => r.result.value);
  const fromArg = process.argv.find(a => a.startsWith('--from='));
  const toArg = process.argv.find(a => a.startsWith('--to='));
  const from = fromArg ? +fromArg.slice(7) : 0;
  const to = toArg ? +toArg.slice(5) : info.length;
  console.log(ID, '知识块', info.length, '范围', from, '-', to - 1);

  for (let i = from; i < to; i++) {
    await pg.send('Page.navigate', { url: BASE });
    await new Promise(r => setTimeout(r, 1200));
    const ci = info[i].ci, first = info[i].first;
    await pg.send('Runtime.evaluate', {
      expression: `(function(){
        document.querySelectorAll('.reveal').forEach(e=>e.classList.add('visible'));
        var blocks=[...document.querySelectorAll('.knowledge-block')];
        var bk=blocks[${i}];
        var ch=bk.closest('.chapter');
        [...document.querySelectorAll('.chapter')].forEach(function(c){ if(c!==ch) c.remove(); });
        [...ch.querySelectorAll('.knowledge-block')].forEach(function(x){ if(x!==bk) x.remove(); });
        ${first ? '' : "var hd=ch.querySelector('.chapter-header'); if(hd) hd.remove();"}
        if(${ci}>0){ var h=document.querySelector('.hero'); if(h) h.remove(); }
        var st=document.createElement('style'); st.textContent=${JSON.stringify(CSS)}; document.head.appendChild(st);
      })()`
    });
    await new Promise(r => setTimeout(r, 350));

    const pdfOpts = {
      printBackground: true, paperWidth: 8.27, paperHeight: 11.69,
      marginTop: 0.45, marginBottom: 0.45, marginLeft: 0.45, marginRight: 0.45
    };
    if (ID === 'organ3' && i === 23) {
      /* 该块宽表 + 6 张图，整块打印会卡死：先打印文字/表格，再打印图片 */
      await pg.send('Runtime.evaluate', { expression: `(function(){var st=document.createElement('style');st.textContent='figure{display:none!important}.table-wrap{display:none!important}';document.head.appendChild(st);})()` });
      let r1 = await pg.send('Page.printToPDF', pdfOpts);
      fs.writeFileSync(path.join(PARTS, ID + '_b' + i + 'a.pdf'), Buffer.from(r1.data, 'base64'));
      const figs = await pg.send('Runtime.evaluate', {
        expression: `(function(){var bk=document.querySelectorAll('.knowledge-block')[${i}];return [...bk.querySelectorAll('figure')].map(function(f){return f.outerHTML}).join('')})()`,
        returnByValue: true
      }).then(r => r.result.value);
      await pg.send('Runtime.evaluate', {
        expression: `(function(){document.head.innerHTML='<style>body{font-family:"Microsoft YaHei",sans-serif;margin:0;color:#000}figure{margin:0 0 10px;break-inside:avoid;page-break-inside:avoid}img{max-width:100%;height:auto;display:block;margin:0 auto}figcaption{font-size:10pt;color:#333;margin-top:4px}h3{font-size:14pt;margin:0 0 10px}</style>';document.body.innerHTML='<h3>肾小球肾炎与肾病综合征 · 病理配图</h3>'+${JSON.stringify(figs)};})()`
      });
      await new Promise(r => setTimeout(r, 800));
      let r2 = await pg.send('Page.printToPDF', pdfOpts);
      fs.writeFileSync(path.join(PARTS, ID + '_b' + i + 'b.pdf'), Buffer.from(r2.data, 'base64'));
      console.log('  块', i + 1, '(拆 2 份) ok', Math.round((r1.data.length + r2.data.length) * 0.75 / 1024), 'KB');
      continue;
    }
    const { data } = await pg.send('Page.printToPDF', pdfOpts);
    fs.writeFileSync(path.join(PARTS, ID + '_b' + i + '.pdf'), Buffer.from(data, 'base64'));
    console.log('  块', i + 1, '/', info.length, 'ok', Math.round(data.length * 0.75 / 1024), 'KB');
  }
  await b.send('Target.closeTarget', { targetId });
  process.exit(0);
})().catch(e => { console.error('BLOCK FAIL', e.message); process.exit(1); });
