/**
 * 將深入 SEN 頁改為轉址殼（需登入提示）。
 * --out <dir> 可寫入 Pages _site；預設寫入倉庫根目錄（覆蓋原文前請先 export）。
 *
 * 用法：
 *   node write-coach-redirect-stubs.mjs
 *   node write-coach-redirect-stubs.mjs --out ../_site
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEEP_SEN_FILES, slugFromFile } from './coach-deep-slugs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
let outRoot = root;
const oi = args.indexOf('--out');
if (oi >= 0 && args[oi + 1]) outRoot = path.resolve(args[oi + 1]);

function stubHtml(file) {
  const slug = slugFromFile(file);
  return `<!DOCTYPE html>
<html lang="zh-Hant-HK">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>需登入教練會員區 | 新天地</title>
  <link rel="stylesheet" href="css/style.css?v=20261021h">
  <meta http-equiv="refresh" content="8;url=coach-share.html?next=${encodeURIComponent(slug)}">
</head>
<body>
  <main class="container" style="max-width:560px;margin:3rem auto;padding:1.5rem;line-height:1.8">
    <h1 style="font-size:1.35rem">此內容已移至教練會員區</h1>
    <p>進階課堂策略與教材僅供核准教練／同行閱讀，以保護學員私隱與教學專業內容。</p>
    <p><a class="btn btn-primary" href="coach-share.html?next=${encodeURIComponent(slug)}">前往教練分享區登入</a></p>
    <p style="font-size:0.9rem;color:#718096">家長入門資料請見 <a href="resources.html">家長資源</a> 與 <a href="sen-guide.html">認識特殊需要</a>。</p>
  </main>
</body>
</html>
`;
}

for (const file of DEEP_SEN_FILES) {
  const dest = path.join(outRoot, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, stubHtml(file), 'utf8');
  console.log('Stub', dest);
}

// Learn 入口轉址（若目錄被清空，至少根入口提示）
const learnIndex = path.join(outRoot, 'Learn', 'index.html');
fs.mkdirSync(path.dirname(learnIndex), { recursive: true });
fs.writeFileSync(
  learnIndex,
  `<!DOCTYPE html>
<html lang="zh-Hant-HK">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex, nofollow">
  <title>教練教材需登入 | 新天地</title>
  <meta http-equiv="refresh" content="3;url=../coach-share.html">
</head>
<body>
  <p style="font-family:sans-serif;padding:2rem">教練教材已改為會員登入後存取。<a href="../coach-share.html">前往登入</a></p>
</body>
</html>`,
  'utf8'
);
console.log('Stub Learn/index.html');
