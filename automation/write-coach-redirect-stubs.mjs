/**
 * 僅寫入 Learn/ 入口轉址（深入 SEN 頁已改為登入碼門檻全文，不再覆蓋成 stub）。
 *
 * 用法：
 *   node write-coach-redirect-stubs.mjs --out ../_site
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
let outRoot = root;
const oi = args.indexOf('--out');
if (oi >= 0 && args[oi + 1]) outRoot = path.resolve(args[oi + 1]);

const learnIndex = path.join(outRoot, 'Learn', 'index.html');
fs.mkdirSync(path.dirname(learnIndex), { recursive: true });
fs.writeFileSync(
  learnIndex,
  `<!DOCTYPE html>
<html lang="zh-Hant-HK">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex, nofollow">
  <title>教練教材需登入碼 | 新天地</title>
  <meta http-equiv="refresh" content="3;url=../coach-share.html">
</head>
<body>
  <p style="font-family:sans-serif;padding:2rem">進階教練教材請先於<a href="../coach-share.html">教練分享區</a>輸入登入碼。</p>
</body>
</html>`,
  'utf8'
);
console.log('Stub Learn/index.html only (deep SEN pages use passcode gate)');
