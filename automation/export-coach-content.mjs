/**
 * 匯出深入 SEN 頁正文為 data/coach-content/*.json（勿部署到 Pages）
 * 本機備份／離線整理用；站上限制內容以 HTML＋登入碼門檻為準。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEEP_SEN_FILES, slugFromFile } from './coach-deep-slugs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'data', 'coach-content');

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return (m && m[1].trim()) || slugFromFile('page');
}

function extractMain(html) {
  // 取第一個 reading-flow 或 article-body 區塊；否則取 <main>／body 內第一個 section
  const flow = html.match(
    /<div class="container reading-flow">([\s\S]*?)<\/div>\s*<\/section>/i
  );
  if (flow) return flow[1].trim();
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return body ? body[1].trim() : html;
}

function stripScripts(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

fs.mkdirSync(outDir, { recursive: true });

const index = [];
const privateDir = path.join(root, 'private', 'coach-html');

for (const file of DEEP_SEN_FILES) {
  const priv = path.join(privateDir, file);
  const pub = path.join(root, file);
  const fp = fs.existsSync(priv) ? priv : pub;
  if (!fs.existsSync(fp)) {
    console.warn('Skip missing', file);
    continue;
  }
  const html = fs.readFileSync(fp, 'utf8');
  if (html.includes('此內容已移至教練會員區') && html.length < 2500) {
    console.warn('Skip stub (run generate first):', file);
    continue;
  }
  const slug = slugFromFile(file);
  const title = extractTitle(html);
  const bodyHtml = stripScripts(extractMain(html));
  const doc = {
    slug,
    title,
    sourceFile: file,
    bodyHtml,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify(doc, null, 2), 'utf8');
  index.push({ slug, title, sourceFile: file });
  console.log('Exported', slug);
}

// Learn 目錄索引（路徑列表；全文仍在 private／本機 Learn，經 Storage 上傳）
const learnRoot = path.join(root, 'Learn');
const learnIndex = [];
function walk(dir, rel) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const r = rel ? `${rel}/${name}` : name;
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, r);
    else if (/\.html?$/i.test(name)) {
      learnIndex.push({ path: r.replace(/\\/g, '/'), title: name.replace(/\.html?$/i, '') });
    }
  }
}
walk(learnRoot, '');
fs.writeFileSync(
  path.join(outDir, '_index.json'),
  JSON.stringify({ senPages: index, learnPages: learnIndex, exportedAt: new Date().toISOString() }, null, 2),
  'utf8'
);
console.log('Wrote', outDir, 'sen=', index.length, 'learn=', learnIndex.length);
