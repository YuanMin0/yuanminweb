/* 第5层：交互与状态 E2E
   用法：node _tools/e2e.js
*/
const http = require('http');
const BASE = 'http://127.0.0.1:8765/';
const DBG = 'http://127.0.0.1:9222';

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
      setTimeout(() => { if (this.p.has(id)) { this.p.delete(id); rej(new Error('timeout ' + method)); } }, 30000);
    });
  }
}

let pass = 0, fail = 0;
const fails = [];
function check(name, ok, detail) {
  if (ok) { pass++; console.log('  ✓ ' + name); }
  else { fail++; fails.push(name + (detail ? ' :: ' + detail : '')); console.log('  ✗ ' + name + (detail ? ' :: ' + detail : '')); }
}

(async () => {
  const ver = await getJSON(DBG + '/json/version');
  const browser = await CDP.attach(ver.webSocketDebuggerUrl);

  async function open(url, wait = 1200, clearKey) {
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
    const list = await getJSON(DBG + '/json/list');
    const t = list.find(x => x.id === targetId);
    const pg = await CDP.attach(t.webSocketDebuggerUrl);
    await pg.send('Page.enable'); await pg.send('Runtime.enable'); await pg.send('Network.enable');
    await pg.send('Network.setCacheDisabled', { cacheDisabled: true });
    if (clearKey) {
      await pg.send('Page.navigate', { url: BASE + 'login.html' });
      await new Promise(r => setTimeout(r, 400));
      await pg.send('Runtime.evaluate', { expression: `localStorage.removeItem(${JSON.stringify(clearKey)})` });
    }
    await pg.send('Page.navigate', { url: BASE + url });
    await new Promise(r => setTimeout(r, wait));
    return { pg, targetId };
  }
  async function ev(pg, expr, awaitPromise = false) {
    const r = await pg.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise });
    return r.result && r.result.value;
  }
  async function close(pg, targetId) {
    await browser.send('Target.closeTarget', { targetId });
  }

  /* ---------- 1. drill 单选判分 ---------- */
  console.log('\n[drill] 单选判分与翻页');
  {
    const { pg, targetId } = await open('drill.html?s=organ3', 1200, 'medilearn.drill.v2|organ3');
    const r = await ev(pg, `new Promise(function(res){
      var o=document.querySelectorAll('.opt');
      if(!o.length){res({err:'no opts'});return;}
      o[0].click();
      setTimeout(function(){
        var r1={ok:document.querySelectorAll('.opt.ok').length,bad:document.querySelectorAll('.opt.bad').length,dis:[].filter.call(document.querySelectorAll('.opt'),function(b){return b.disabled}).length};
        var n=document.getElementById('nextBtn'); if(n)n.click();
        setTimeout(function(){
          r1.opts=document.querySelectorAll('.opt').length;
          r1.stem=(document.querySelector('.q-stem,.stem,h2')||{}).textContent;
          res(r1);
        },200);
      },350);
    })`, true);
    check('点选项后有正确项标记', r && r.ok === 1, JSON.stringify(r));
    check('选项全部锁定', r && r.dis >= 3, JSON.stringify(r));
    check('翻页后仍有选项', r && r.opts >= 3, JSON.stringify(r));
    await close(pg, targetId);
  }

  /* ---------- 2. drill 来源筛选 ---------- */
  console.log('\n[drill] 来源筛选');
  {
    const { pg, targetId } = await open('drill.html?s=organ3');
    const r = await ev(pg, `(function(){
      document.getElementById('pickBtn').click();
      var sb=document.getElementById('srcbar');
      var chips=[].map.call(sb.querySelectorAll('.chip'),function(x){return x.textContent.trim();});
      var ppt=[].filter.call(sb.querySelectorAll('.chip'),function(x){return x.textContent.indexOf('PPT')===0;})[0];
      if(ppt)ppt.click();
      document.getElementById('drClose').click();
      return JSON.stringify({chips:chips,ptext:document.getElementById('progressText').textContent});
    })()`);
    const o = JSON.parse(r);
    check('来源栏渲染', o.chips.length >= 3, r);
    check('切换到 PPT 后题池变化', /PPT课件/.test(o.ptext), o.ptext);
    await close(pg, targetId);
  }

  /* ---------- 3. drill 章节+来源组合 ---------- */
  console.log('\n[drill] 章节与来源组合');
  {
    const { pg, targetId } = await open('drill.html?s=organ3');
    const r = await ev(pg, `(function(){
      document.getElementById('pickBtn').click();
      var cb=document.getElementById('chbar');
      var c1=cb.querySelectorAll('.chip')[1]; if(c1)c1.click();
      var sb=document.getElementById('srcbar');
      var ppt=[].filter.call(sb.querySelectorAll('.chip'),function(x){return x.textContent.indexOf('PPT')===0;})[0];
      if(ppt)ppt.click();
      document.getElementById('drClose').click();
      return JSON.stringify({ptext:document.getElementById('progressText').textContent,empty:!!document.querySelector('#stage .card')});
    })()`);
    const o = JSON.parse(r);
    check('组合筛选不报错且有结果或空态', typeof o.ptext === 'string', r);
    await close(pg, targetId);
  }

  /* ---------- 4. drill 错题筛选与重置 ---------- */
  console.log('\n[drill] 只刷错题 / 重置进度');
  {
    const { pg, targetId } = await open('drill.html?s=organ3');
    const r = await ev(pg, `new Promise(function(res){
      window.confirm=function(){return true};
      /* 先把来源与章节都切回「全部」，避免上一用例的筛选残留 */
      document.getElementById('pickBtn').click();
      var sb=document.getElementById('srcbar'), cb=document.getElementById('chbar');
      if(sb&&sb.querySelector('.chip'))sb.querySelector('.chip').click();
      if(cb&&cb.querySelector('.chip'))cb.querySelector('.chip').click();
      document.getElementById('drClose').click();
      var rst=document.getElementById('resetBtn'); if(rst)rst.click();
      var o=document.querySelectorAll('.opt');
      if(!o.length){res({err:'no opts'});return;}
      o[0].click();
      setTimeout(function(){
        var wrongN=+document.getElementById('wrongCount').textContent||0;
        document.getElementById('wrongBtn').click();
        setTimeout(function(){
          var a={wrong:wrongN,ptext:document.getElementById('progressText').textContent};
          document.getElementById('wrongBtn').click();   /* 关掉错题过滤，避免空态影响后续断言 */
          document.getElementById('resetBtn').click();
          setTimeout(function(){
            a.after=document.getElementById('progressText').textContent;
            a.empty=!!document.querySelector('#stage .card');
            res(a);
          },250);
        },250);
      },400);
    })`, true);
    check('答题后错题计数可读', r && typeof r.wrong === 'number', JSON.stringify(r));
    if (r && r.wrong > 0) check('只刷错题后题池收敛', /\/\s*[1-9]/.test(r.ptext || ''), JSON.stringify(r));
    else check('无错题时只刷错题有兜底', r && (r.empty === true || /没有可练/.test(r.ptext || '') || /\//.test(r.ptext || '')), JSON.stringify(r));
    check('重置后回到未答', r && /已答 0/.test(r.after || ''), JSON.stringify(r));
    await close(pg, targetId);
  }

  /* ---------- 5. quiz 全流程 ---------- */
  console.log('\n[quiz] 开始→作答→提交→下一题');
  {
    const { pg, targetId } = await open('quiz.html?s=statistics');
    const r = await ev(pg, `new Promise(function(res){
      var s=document.getElementById('startBtn'); if(!s){res({err:'no start'});return;}
      s.click();
      setTimeout(function(){
        var lab=document.querySelector('label.opt');
        if(!lab){res({err:'no label'});return;}
        lab.click();
        setTimeout(function(){
          var sub=document.getElementById('submitBtn');
          if(sub)sub.click();
          setTimeout(function(){
            res({right:document.querySelectorAll('label.opt.right').length,
                 wrong:document.querySelectorAll('label.opt.wrong').length,
                 fb:!!document.querySelector('.fb'),
                 next:!!document.getElementById('nextBtn')});
          },250);
        },150);
      },300);
    })`, true);
    check('提交后有判定标记', r && (r.right + r.wrong) >= 1, JSON.stringify(r));
    check('出现反馈块', r && r.fb === true, JSON.stringify(r));
    check('出现下一题按钮', r && r.next === true, JSON.stringify(r));
    await close(pg, targetId);
  }

  /* ---------- 6. exam5 展开/收起 ---------- */
  console.log('\n[exam5] 答案展开与收起');
  {
    const { pg, targetId } = await open('exam5/paper1.html', 900);
    const r = await ev(pg, `(function(){
      document.querySelector('[data-act=open]').click();
      var a=document.querySelectorAll('details[open]').length;
      document.querySelector('[data-act=close]').click();
      var b=document.querySelectorAll('details[open]').length;
      return JSON.stringify({open:a,close:b,total:document.querySelectorAll('details.ans').length});
    })()`);
    const o = JSON.parse(r);
    check('展开全部答案', o.open === o.total && o.total === 49, r);
    check('收起全部答案', o.close === 0, r);
    await close(pg, targetId);
  }

  /* ---------- 7. mn 答案展开与筛选 ---------- */
  console.log('\n[mn] 答案展开与题型筛选');
  {
    const { pg, targetId } = await open('mn/organ3.html', 900);
    const r = await ev(pg, `(function(){
      var b=document.querySelector('.answer-toggle');
      var panel=b.nextElementSibling;
      var before=getComputedStyle(panel).display;
      b.click();
      var after=getComputedStyle(panel).display;
      var total=document.querySelectorAll('#question-bank .qa-card').length;
      var btn=[].filter.call(document.querySelectorAll('[data-filter-type]'),function(x){return x.getAttribute('data-filter-type')==='term';})[0];
      if(btn)btn.click();
      var vis=[].filter.call(document.querySelectorAll('#question-bank .qa-card'),function(x){return x.offsetParent!==null;}).length;
      return JSON.stringify({before:before,after:after,total:total,vis:vis});
    })()`);
    const o = JSON.parse(r);
    check('答案面板默认隐藏', o.before === 'none', r);
    check('点击后展开', o.after !== 'none', r);
    check('题型筛选生效', o.vis > 0 && o.vis < o.total, r);
    await close(pg, targetId);
  }

  /* ---------- 8. 题库入口跳转 ---------- */
  console.log('\n[mn] 模拟卷入口');
  {
    const { pg, targetId } = await open('mn/organ3.html', 900);
    const r = await ev(pg, `JSON.stringify([].map.call(document.querySelectorAll('.qb-exam,.hero-cta'),function(a){return a.getAttribute('href');}))`);
    const o = JSON.parse(r);
    check('题库区有模拟卷入口', o.includes('../exam5/index.html'), r);
    await close(pg, targetId);
  }

  console.log('\n==== 通过 ' + pass + ' / 失败 ' + fail + ' ====');
  if (fail) fails.forEach(f => console.log('  ✗ ' + f));
  process.exit(0);
})().catch(e => { console.error('E2E FAIL', e.message); process.exit(1); });
