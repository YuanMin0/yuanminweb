/* ==========================================================================
   MediLearn Service Worker
   --------------------------------------------------------------------------
   策略：
   - 导航请求（HTML）：网络优先，3.5 秒超时后回退缓存；全都没有则离线页
   - 同源静态资源（css/js/字体/图标）：stale-while-revalidate
   - 跨域资源（PDF、外链图片）：不拦截，直接走网络
   缓存版本号跟随发布版本，升级后旧缓存自动清理。
   ========================================================================== */

const VERSION = 'v1.0.15a';
const CACHE = 'medilearn-' + VERSION;
const OFFLINE = '/offline';   // 线上无扩展名地址

/* 首次安装就预缓存的核心文件 */
const PRECACHE = [
  '/',
  '/offline',
  '/offline.html',
  '/manifest.webmanifest',
  '/css/style.css',
  '/css/practice.css',
  '/css/changelog.css',
  '/js/core.js',
  '/js/fx.js',
  '/js/auth.js',
  '/js/pwa.js',
  '/data/_meta.js',
  '/js/changelog.js',
  '/js/export.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      /* 单个失败不影响整体安装 */
      Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('medilearn-') && k !== CACHE)
        .map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isSameOrigin(url) {
  return new URL(url, self.location.origin).origin === self.location.origin;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (!isSameOrigin(url.href)) return;            /* 跨域交给浏览器 */

  /* 1) 页面导航 */
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await Promise.race([
          fetch(req),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3500))
        ]);
        if (fresh && fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        const hit = await cache.match(req, { ignoreSearch: true });
        if (hit) return hit;
        const home = (await cache.match('/')) || (await cache.match('/index.html'));
        if (home) return home;
        const off = (await cache.match(OFFLINE)) || (await cache.match('/offline.html'));
        return off || new Response('离线中', { status: 503 });
      }
    })());
    return;
  }

  /* 2) 静态资源 */
  const dest = req.destination;
  const isStatic = ['style', 'script', 'image', 'font', 'manifest'].includes(dest) ||
                   /\.(css|js|json|png|jpg|jpeg|svg|webp|woff2?|webmanifest)$/.test(url.pathname);
  if (!isStatic) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return hit || (await network) || new Response('', { status: 504 });
  })());
});

/* 页面可主动要求更新 */
self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});
