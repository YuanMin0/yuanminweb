/* 第9层：健壮性与边界
   非法参数、损坏存储、空数据、重复提交
*/
const http = require('http');
const BASE = 'http://127.0.0.1:8765/';
const DBG = 'http://127.0.0.1:9222';
function getJSON(u) { return new Promise((res, rej) => { http.get(u, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej); }); }
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.p = new Map(); }
  static async attach(u) { const ws = new WebSocket(u); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }); const c = new CDP(ws); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && c.p.has(m.id)) { const { res, rej } = c.p.get(m.id); c.p.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); } }; return c; }
  send(method, params = {}) { const id = ++this.id; return new Promise((res, rej) => { this.p.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })); setTimeout(() => { if (this.p.has(id)) { this.p.delete(id); rej(new Error('timeout ' + method)); } }, 30000); }); }
}
let pass = 0, fail = 0; const fails = [];
function check(n, ok, d) { if (ok) { pass++; console.log('  ✓ ' + n); } else { fail++; fails.push(n + (d ? ' :: ' + d : '')); console.log('  ✗ ' + n + (d ? ' :: ' + d : '')); } }

(async () => {
  const ver = await getJSON(DBG + '/json/version');
  const browser = await CDP.attach(ver.webSocketDebuggerUrl);
  const errors = [];

  async function open(url, wait = 1200) {
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
    const list = await getJSON(DBG + '/json/list');
    const t = list.find(x => x.id === targetId);
    const pg = await CDP.attach(t.webSocketDebuggerUrl);
    await pg.send('Page.enable'); await pg.send('Runtime.enable'); await pg.send('Log.enable');
    await pg.send('Network.enable'); await pg.send('Network.setCacheDisabled', { cacheDisabled: true });
    pg.ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data);
      if (m.method === 'Runtime.exceptionThrown') errors.push((m.params.exceptionDetails.exception || {}).description || 'exc');
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || '')) errors.push(m.params.entry.text);
    });
    await pg.send('Page.navigate', { url: BASE + url });
    await new Promise(r => setTimeout(r, wait));
    return { pg, targetId };
  }
  const ev = async (pg, expr, awaitPromise = false) => {
    const r = await pg.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise });
    return r.result && r.result.value;
  };
  const close = (pg, id) => browser.send('Target.closeTarget', { targetId: id });

  /* 1. 非法参数 */
  console.log('\n[边界] 非法与超长参数');
  for (const [name, url] of [
    ['XSS 片段', 'subject.html?s=%3Cscript%3Ealert(1)%3C%2Fscript%3E'],
    ['路径穿越', 'drill.html?s=..%2F..%2Fdata%2Fstatistics'],
    ['超长参数', 'subject.html?s=' + 'a'.repeat(2000)],
    ['空科目', 'drill.html?s=']
  ]) {
    errors.length = 0;
    const { pg, targetId } = await open(url, 1200);
    const title = await ev(pg, 'document.title');
    const injected = await ev(pg, 'window.__xss === 1');
    check(name + ' 不报错', errors.length === 0, errors.slice(0, 1).join(''));
    check(name + ' 无脚本执行', injected !== true);
    check(name + ' 有兜底页面', typeof title === 'string' && title.length > 0, title);
    await close(pg, targetId);
  }

  /* 2. 损坏的本地存储 */
  console.log('\n[边界] 损坏的 localStorage');
  {
    errors.length = 0;
    let r = await open('drill.html?s=organ3', 1200);
    await ev(r.pg, `localStorage.setItem('medilearn.drill.v2|organ3','{bad json');
      localStorage.setItem('medilearn.wrong.v1','not-json');
      localStorage.setItem('medilearn.learned.v1','[]');`);
    await close(r.pg, r.targetId);

    r = await open('drill.html?s=organ3', 1400);
    const opts = await ev(r.pg, `document.querySelectorAll('.opt').length`);
    check('drill 在损坏存储下仍可作答', opts >= 3, 'opts=' + opts);
    check('drill 无异常', errors.length === 0, errors.slice(0, 1).join(''));
    await close(r.pg, r.targetId);

    errors.length = 0;
    const w = await open('wrongbook.html', 1400);
    const txt = await ev(w.pg, `document.body.innerText.replace(/\\s+/g,' ').slice(0,60)`);
    check('错题本在损坏存储下正常渲染', typeof txt === 'string' && txt.length > 0, txt);
    check('错题本无异常', errors.length === 0, errors.slice(0, 1).join(''));
    await close(w.pg, w.targetId);
  }

  /* 3. 空题库 */
  console.log('\n[边界] 空题库');
  {
    errors.length = 0;
    const { pg, targetId } = await open('drill.html?s=yiwuli', 1200);
    const t = await ev(pg, `document.getElementById('stage').innerText.replace(/\\s+/g,' ').slice(0,40)`);
    check('空题库有提示', /还没有题目|没有可练/.test(t || ''), t);
    check('空题库无异常', errors.length === 0, errors.slice(0, 1).join(''));
    await close(pg, targetId);
  }

  /* 4. 重复提交 */
  console.log('\n[边界] 重复提交');
  {
    errors.length = 0;
    const { pg, targetId } = await open('quiz.html?s=statistics', 1300);
    const r = await ev(pg, `new Promise(function(res){
      var s=document.getElementById('startBtn'); if(!s){res({err:'no start'});return;}
      s.click();
      setTimeout(function(){
        var lab=document.querySelector('label.opt'); if(!lab){res({err:'no label'});return;}
        lab.click();
        setTimeout(function(){
          var sub=document.getElementById('submitBtn');
          if(sub){ sub.click(); sub.click(); sub.click(); }
          setTimeout(function(){
            res({right:document.querySelectorAll('label.opt.right').length,
                 wrong:document.querySelectorAll('label.opt.wrong').length,
                 fb:document.querySelectorAll('.fb').length,
                 rightN:(document.getElementById('rightN')||{}).textContent});
          },300);
        },150);
      },300);
    })`, true);
    check('连点提交不重复判分', r && r.fb === 1, JSON.stringify(r));
    check('连点提交无异常', errors.length === 0, errors.slice(0, 1).join(''));
    await close(pg, targetId);
  }

  /* 5. 快速连点选项 */
  console.log('\n[边界] 快速连点选项');
  {
    errors.length = 0;
    const { pg, targetId } = await open('drill.html?s=organ3', 1200);
    const r = await ev(pg, `new Promise(function(res){
      var o=document.querySelectorAll('.opt');
      if(!o.length){res({err:'no opts'});return;}
      o[0].click(); o[1].click(); o[2].click();
      setTimeout(function(){
        res({ok:document.querySelectorAll('.opt.ok').length,bad:document.querySelectorAll('.opt.bad').length});
      },400);
    })`, true);
    check('连点只判一次', r && (r.ok + r.bad) <= 2, JSON.stringify(r));
    check('连点无异常', errors.length === 0, errors.slice(0, 1).join(''));
    await close(pg, targetId);
  }

  console.log('\n==== 通过 ' + pass + ' / 失败 ' + fail + ' ====');
  if (fail) fails.forEach(f => console.log('  ✗ ' + f));
  process.exit(0);
})().catch(e => { console.error('EDGE FAIL', e.message); process.exit(1); });
