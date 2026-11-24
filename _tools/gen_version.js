/* 生成 version.json：桌面版增量更新清单（路径 → 大小 + SHA1）
   用法：node _tools/gen_version.js [版本号]
   收录范围：站点实际对外提供的静态资源；排除 _bak/_tools/.git/files 之外的非站点文件。
*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'version.json');
const VER = process.argv[2] || '1.4.4';

const ROOT_FILES = ['404.html', 'about.html', 'bank.html', 'download.html', 'index.html',
  'knowledge.html', 'login.html', 'materials.html', 'offline.html', 'quiz.html', 'subject.html',
  'subjects.html', 'wrongbook.html', 'drill.html', 'huanjingweisheng.html', 'huanjingweisheng-quiz.html',
  'laoweisheng.html', 'favorites.html', 'manifest.webmanifest', 'robots.txt', 'sw.js'];
const DIRS = ['css', 'js', 'data', 'doc', 'reader', 'mn', 'icons', 'img', 'files', 'exam5'];
const EXT = /\.(html|css|js|json|webmanifest|png|jpg|jpeg|webp|svg|ico|woff2?|txt|pdf)$/i;
const SKIP_FILE = /(^|\/)(_tmp_|audit_|probe)/;

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else {
      const rel = path.relative(ROOT, p).replace(/\\/g, '/');
      if (EXT.test(rel) && !SKIP_FILE.test(rel)) out.push(rel);
    }
  }
}

const files = [];
ROOT_FILES.forEach(f => { if (fs.existsSync(path.join(ROOT, f))) files.push(f); });
DIRS.forEach(d => { if (fs.existsSync(path.join(ROOT, d))) walk(path.join(ROOT, d), files); });

const map = {};
let bytes = 0;
files.sort().forEach(rel => {
  const buf = fs.readFileSync(path.join(ROOT, rel));
  map[rel] = { size: buf.length, sha1: crypto.createHash('sha1').update(buf).digest('hex') };
  bytes += buf.length;
});

const now = new Date();
const pad = n => (n < 10 ? '0' : '') + n;
const tz = -now.getTimezoneOffset() / 60;
const build = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + 'T' +
  pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':00' + (tz >= 0 ? '+' : '-') + pad(Math.abs(tz)) + '00';

const json = { v: VER, build, count: files.length, bytes, files: map };
fs.writeFileSync(OUT, JSON.stringify(json), 'utf8');
console.log('写入 version.json：' + files.length + ' 个文件，' + (bytes / 1048576).toFixed(2) + ' MB，版本 ' + VER);
