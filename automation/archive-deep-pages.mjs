/**
 * 將深入頁全文備份到 private/coach-html/（不進 Pages），再寫根目錄轉址殼。
 * 應在 export-coach-content 之後執行。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEEP_SEN_FILES } from './coach-deep-slugs.mjs';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const archive = path.join(root, 'private', 'coach-html');

fs.mkdirSync(archive, { recursive: true });

for (const file of DEEP_SEN_FILES) {
  const src = path.join(root, file);
  if (!fs.existsSync(src)) {
    console.warn('Missing', file);
    continue;
  }
  const html = fs.readFileSync(src, 'utf8');
  // 已是短轉址殼則略過備份覆寫
  if (html.includes('此內容已移至教練會員區') && html.length < 2500) {
    console.log('Already stub', file);
    continue;
  }
  fs.writeFileSync(path.join(archive, file), html, 'utf8');
  console.log('Archived', file);
}

const r = spawnSync(process.execPath, [path.join(__dirname, 'write-coach-redirect-stubs.mjs')], {
  cwd: __dirname,
  stdio: 'inherit',
});
process.exit(r.status || 0);
