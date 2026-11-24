/* 运行时体检：CDP 驱动 Edge headless
   用法: node _tools/probe.js <url-path> [--mobile] [--wait=ms] [--eval="js"]
*/
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:8765/';
const DBG = 'http://127.0.0.1:9222';

function getJSON(url) {
  return new Promise((res, rej) => {
    http.get(url, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej);
  });
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = []; }
  static async attach(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    const c = new CDP(ws);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && c.pending.has(msg.id)) {
        const { res, rej } = c.pending.get(msg.id);
        c.pending.delete(msg.id);
        msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
      } else if (msg.method) c.handlers.forEach(h => h(msg));
    };
    return c;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout ' + method)); } }, 60000);
    });
  }
  on(fn) { this.handlers.push(fn); }
}

const arg = process.argv[2] || 'index.html';
const mobile = process.argv.includes('--mobile');
const waitArg = process.argv.find(a => a.startsWith('--wait='));
const extraWait = waitArg ? +waitArg.split('=')[1] : 1200;
const evalArg = process.argv.find(a => a.startsWith('--eval='));

(async () => {
  const ver = await getJSON(DBG + '/json/version');
  const browser = await CDP.attach(ver.webSocketDebuggerUrl);
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const list = await getJSON(DBG + '/json/list');
  const t = list.find(x => x.id === targetId);
  const page = await CDP.attach(t.webSocketDebuggerUrl);

  const errors = [], warns = [], logs = [];
  page.on(m => {
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      errors.push((d.exception && (d.exception.description || d.exception.value)) || d.text);
    }
    if (m.method === 'Runtime.consoleAPICalled') {
      const txt = (m.params.args || []).map(a => a.value !== undefined ? String(a.value) : (a.description || '')).join(' ');
      if (m.params.type === 'error') errors.push('[console.error] ' + txt);
      else if (m.params.type === 'warning') warns.push('[warn] ' + txt);
      else logs.push(txt);
    }
    if (m.method === 'Log.entryAdded') {
      const e = m.params.entry;
      if (e.level === 'error') errors.push('[log] ' + e.text + ' ' + (e.url || ''));
      else if (e.level === 'warning') warns.push('[logwarn] ' + e.text);
    }
  });

  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Log.enable');
  await page.send('Network.enable');
  await page.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (mobile) {
    await page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  }
  const cpuArg = process.argv.find(a => a.startsWith('--cpu='));
  if (cpuArg) await page.send('Emulation.setCPUThrottlingRate', { rate: +cpuArg.split('=')[1] });
  const netArg = process.argv.find(a => a.startsWith('--net='));
  if (netArg) {
    const prof = netArg.split('=')[1];
    const presets = {
      '4g': { offline: false, latency: 70, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 },
      '3g': { offline: false, latency: 300, downloadThroughput: 400 * 1024 / 8, uploadThroughput: 400 * 1024 / 8 }
    };
    if (presets[prof]) await page.send('Network.emulateNetworkConditions', presets[prof]);
  }

  // 先落地同源页面，写入登录令牌
  await page.send('Page.navigate', { url: BASE + 'login.html' });
  await new Promise(r => setTimeout(r, 500));
  await page.send('Runtime.evaluate', {
    expression: `localStorage.setItem('medilearn.auth.v1', JSON.stringify({exp: Date.now()+86400000*30}));`
  });

  const t0 = Date.now();
  const target = /^https?:/.test(arg) ? arg : BASE + arg;
  await page.send('Page.navigate', { url: target });
  // 等 load
  await new Promise(r => setTimeout(r, extraWait));

  const perf = await page.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const res = performance.getEntriesByType('resource');
      let bytes = 0, n = 0, jsN = 0, jsBytes = 0;
      res.forEach(r => {
        const s = r.transferSize || 0; bytes += s; n++;
        if (/\\.js(\\?|$)/.test(r.name)) { jsN++; jsBytes += s; }
      });
      return {
        dcl: Math.round(nav.domContentLoadedEventEnd || 0),
        load: Math.round(nav.loadEventEnd || 0),
        fcp: Math.round((performance.getEntriesByName('first-contentful-paint')[0]||{}).startTime||0),
        resources: n, kb: Math.round(bytes/1024), jsN, jsKb: Math.round(jsBytes/1024),
        title: document.title,
        bodyH: document.body.scrollHeight,
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        qaCards: document.querySelectorAll('.qa-card').length,
        scripts: document.querySelectorAll('script[src]').length,
        nodes: document.querySelectorAll('*').length
      };
    })()`
  });

  let custom = null;
  if (evalArg) {
    const js = evalArg.slice('--eval='.length);
    const r = await page.send('Runtime.evaluate', { returnByValue: true, expression: js, awaitPromise: true });
    custom = r.result && r.result.value;
  }

  const p = perf.result.value;
  console.log('=== ' + arg + (mobile ? ' [mobile 390px]' : '') + ' ===');
  console.log('title        :', p.title);
  console.log('DOMContentLoaded:', p.dcl + ' ms   load:', p.load + ' ms   FCP:', p.fcp + ' ms');
  console.log('资源          :', p.resources, '个 /', p.kb, 'KB  (其中 JS', p.jsN, '个 /', p.jsKb, 'KB)');
  console.log('DOM 节点      :', p.nodes, '  qa-card:', p.qaCards, '  body 高:', p.bodyH);
  console.log('横向溢出      :', p.scrollW > p.clientW ? ('是 ' + p.scrollW + ' > ' + p.clientW) : '否');
  if (custom !== null) console.log('自定义        :', JSON.stringify(custom));
  console.log('错误          :', errors.length);
  errors.slice(0, 12).forEach(e => console.log('   ✗', String(e).split('\n')[0].slice(0, 220)));
  if (warns.length) { console.log('警告          :', warns.length); warns.slice(0, 6).forEach(w => console.log('   !', w.slice(0, 160))); }

  await browser.send('Target.closeTarget', { targetId });
  process.exit(0);
})().catch(e => { console.error('PROBE FAIL', e.message); process.exit(1); });
