/* ==========================================================================
   MediLearn · 访问门禁 (Auth)
   纯前端门禁：源码中只保存密钥的 SHA-256 哈希，不出现明文。
   注意：静态站点没有服务端，这属于「前端门禁」，可阻挡普通访客，
        但不能等同于真正的账号密码安全（懂技术者可绕过）。
   ========================================================================== */
(function () {
  'use strict';

  var WB = window.WB = window.WB || {};

  /* ---------------- 配置 ---------------- */
  var CFG = {
    /* 密钥的 SHA-256（小写十六进制）。明文密钥不写在这里。
       更换密钥见 README「更换登录密钥」。 */
    HASH: '313e7f9bd2dc3b6a1f921165506c3c2dc195613fc89e06b74cfd32a3829f4ca1',
    KEY_TOKEN: 'medilearn.auth.v1',    // 登录令牌
    KEY_FAIL: 'medilearn.authfail.v1', // 失败计数与锁定
    DAYS: 30,                          // 记住天数
    MAX_FAIL: 5,                       // 连续失败上限
    LOCK_SEC: 60,                      // 锁定时长（秒）
    LOGIN_PAGE: 'login.html'
  };

  /* ---------------- SHA-256（纯 JS，无依赖，支持 UTF-8） ---------------- */
  function utf8Bytes(str) {
    var out = [], i, c;
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) {
        out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      } else if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
        var c2 = str.charCodeAt(i + 1);
        if (c2 >= 0xdc00 && c2 <= 0xdfff) {
          var cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
          out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63),
                   0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
          i++;
        } else {
          out.push(0xef, 0xbf, 0xbd);
        }
      } else {
        out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      }
    }
    return out;
  }

  var K256 = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

  function sha256(msg) {
    var bytes = utf8Bytes(msg);
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    /* 64 位长度，高 32 位（消息长度远小于 2^32 位，恒为 0） */
    bytes.push(0, 0, 0, 0);
    bytes.push((bitLen >>> 24) & 255, (bitLen >>> 16) & 255, (bitLen >>> 8) & 255, bitLen & 255);

    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
             0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var w = new Array(64), i, j;

    for (i = 0; i < bytes.length; i += 64) {
      for (j = 0; j < 16; j++) {
        w[j] = (bytes[i + j * 4] << 24) | (bytes[i + j * 4 + 1] << 16) |
               (bytes[i + j * 4 + 2] << 8) | bytes[i + j * 4 + 3];
      }
      for (j = 16; j < 64; j++) {
        var s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        var s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      var a = H[0], b = H[1], c = H[2], d = H[3],
          e = H[4], f = H[5], g = H[6], h = H[7];

      for (j = 0; j < 64; j++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K256[j] + w[j]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0;
        d = c; c = b; b = a; a = (t1 + t2) | 0;
      }

      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0;
      H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0;
      H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }

    var out = '';
    for (i = 0; i < 8; i++) {
      out += ('00000000' + (H[i] >>> 0).toString(16)).slice(-8);
    }
    return out;
  }

  /* ---------------- 存储 ---------------- */
  function read(key, dft) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : dft; }
    catch (e) { return dft; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  function drop(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  /* ---------------- 对外 API ---------------- */
  var auth = {};
  WB.auth = auth;
  auth.sha256 = sha256;

  /** 是否已登录且未过期 */
  auth.isAuthed = function () {
    var t = read(CFG.KEY_TOKEN, null);
    if (!t || !t.exp) return false;
    if (Date.now() > t.exp) { drop(CFG.KEY_TOKEN); return false; }
    return true;
  };

  /** 剩余有效天数（未登录返回 0） */
  auth.daysLeft = function () {
    var t = read(CFG.KEY_TOKEN, null);
    if (!t || !t.exp || Date.now() > t.exp) return 0;
    return Math.max(0, Math.ceil((t.exp - Date.now()) / 86400000));
  };

  /** 当前锁定剩余秒数，0 表示未锁定 */
  auth.lockLeft = function () {
    var f = read(CFG.KEY_FAIL, { n: 0, until: 0 });
    var left = Math.ceil((f.until - Date.now()) / 1000);
    return left > 0 ? left : 0;
  };

  /** 剩余可尝试次数 */
  auth.triesLeft = function () {
    var f = read(CFG.KEY_FAIL, { n: 0, until: 0 });
    if (f.until && Date.now() > f.until) return CFG.MAX_FAIL;  /* 锁定已到期则清零 */
    return Math.max(0, CFG.MAX_FAIL - (f.n || 0));
  };

  /**
   * 校验密钥
   * @returns {{ok:boolean, reason?:string, left?:number, lock?:number}}
   */
  auth.verify = function (input) {
    var lock = auth.lockLeft();
    if (lock > 0) return { ok: false, reason: 'locked', lock: lock };

    var f = read(CFG.KEY_FAIL, { n: 0, until: 0 });
    /* 仅当「锁定已到期」时清空计数；未锁定时 until 为 0，必须保留累计失败次数，
       否则每次调用都会把计数抹掉，锁定永不生效。 */
    if (f.until && Date.now() > f.until) f = { n: 0, until: 0 };

    if (sha256(String(input == null ? '' : input)) === CFG.HASH) {
      write(CFG.KEY_FAIL, { n: 0, until: 0 });
      write(CFG.KEY_TOKEN, {
        ts: Date.now(),
        exp: Date.now() + CFG.DAYS * 86400000,
        sig: sha256(CFG.HASH + '|' + Math.floor(Date.now() / 86400000))
      });
      return { ok: true };
    }

    f.n = (f.n || 0) + 1;
    if (f.n >= CFG.MAX_FAIL) {
      f.until = Date.now() + CFG.LOCK_SEC * 1000;
      f.n = 0;
      write(CFG.KEY_FAIL, f);
      return { ok: false, reason: 'locked', lock: CFG.LOCK_SEC };
    }
    write(CFG.KEY_FAIL, f);
    return { ok: false, reason: 'wrong', left: CFG.MAX_FAIL - f.n };
  };

  /** 退出登录 */
  auth.logout = function () {
    drop(CFG.KEY_TOKEN);
    drop(CFG.KEY_FAIL);
  };

  /** 登录成功后跳回目标页 */
  auth.nextTarget = function () {
    var m = /[?&]next=([^&]*)/.exec(location.search);
    if (!m) return 'index.html';
    var t = decodeURIComponent(m[1] || '');
    /* 只允许站内相对页面，防止跳到外部地址 */
    if (!/^[A-Za-z0-9._-]+\.html(\?[^#]*)?$/.test(t)) return 'index.html';
    return t;
  };

  /** 页面守卫：未登录则跳转到登录页（用 replace，避免回退绕过） */
  auth.guard = function () {
    if (auth.isAuthed()) return true;
    var here = location.pathname.split('/').pop() || 'index.html';
    if (here === CFG.LOGIN_PAGE) return true;   /* 已在登录页则不套娃 */
    var next = here + (location.search || '');
    location.replace(CFG.LOGIN_PAGE + '?next=' + encodeURIComponent(next));
    return false;
  };
})();
