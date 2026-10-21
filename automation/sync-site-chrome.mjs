/**
 * 對齊手維 HTML 的 header／footer／共用腳本（不重寫頁面內容）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CSS_HREF,
  SCRIPT_TAGS,
  FULL_FOOTER_FILES,
  activeFromFile,
  renderFooter,
  renderHeader,
} from './site-chrome.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/** 手維行銷／資源頁；其餘根目錄 HTML 若有 header 亦一併對齊 */
const HAND_PAGES = [
  'index.html',
  'about.html',
  'services.html',
  'why-us.html',
  'resources.html',
  'blog.html',
  'booking.html',
  'contact.html',
  'areas-hong-kong.html',
  'coach-share.html',
  'digest-article.html',
  'download-parent-guide-first-swim.html',
  'download-visual-cue-cards-pack.html',
  'sen-support-hk.html',
];

function listRootHtml() {
  const fromHand = HAND_PAGES.slice();
  const extras = fs
    .readdirSync(root)
    .filter((f) => /\.html$/i.test(f) && !HAND_PAGES.includes(f));
  return [...fromHand, ...extras];
}

function replaceHeader(html, file) {
  const next = renderHeader({ active: activeFromFile(file) });
  const re = /<header\s+class="header"[^>]*>[\s\S]*?<\/header>/i;
  if (!re.test(html)) {
    console.warn('No header:', file);
    return html;
  }
  return html.replace(re, next.trimStart());
}

function replaceFooter(html, file) {
  const variant = FULL_FOOTER_FILES.has(file) ? 'full' : 'compact';
  const next = renderFooter({ variant }).trimStart();
  // 只替換 footer 元素本身；其後的 script／JSON-LD 保留
  const re = /<footer\s+class="footer">[\s\S]*?<\/footer>/i;
  if (re.test(html)) {
    return html.replace(re, next);
  }
  // 週報等頁原本無 footer：插在共用腳本或 </body> 之前
  if (/js\/site-ui\.js/i.test(html)) {
    return html.replace(
      /(\s*)(<script\s+src="js\/site-ui\.js)/i,
      `\n${next}\n$1$2`
    );
  }
  return html.replace(/<\/body>/i, `${next}\n</body>`);
}

function replaceScripts(html) {
  // 統一四支共用腳本版本；保留其後頁面專屬 script
  let out = html;
  out = out.replace(
    /<script\s+src="js\/site-ui\.js[^"]*"\s+defer><\/script>\s*/i,
    ''
  );
  out = out.replace(/<script\s+src="js\/share\.js[^"]*"\s+defer><\/script>\s*/i, '');
  out = out.replace(
    /<script\s+src="js\/analytics\.js[^"]*"\s+defer><\/script>\s*/i,
    ''
  );
  out = out.replace(/<script\s+src="js\/security\.js[^"]*"><\/script>\s*/i, '');

  // 插在 </body> 前
  if (!/js\/site-ui\.js/.test(out)) {
    out = out.replace(
      /<\/body>/i,
      `    ${SCRIPT_TAGS}\n</body>`
    );
  }
  return out;
}

function bumpCss(html) {
  return html.replace(
    /href="css\/style\.css\?v=[^"]+"/i,
    `href="${CSS_HREF}"`
  );
}

let n = 0;
for (const file of listRootHtml()) {
  const fp = path.join(root, file);
  if (!fs.existsSync(fp)) {
    console.warn('Missing', file);
    continue;
  }
  let html = fs.readFileSync(fp, 'utf8');
  if (!/<header\s+class="header"/i.test(html)) {
    // 下載殼等無導覽頁：只統一腳本／CSS
    const before = html;
    html = replaceScripts(html);
    html = bumpCss(html);
    if (html !== before) {
      fs.writeFileSync(fp, html, 'utf8');
      console.log('Scripts/CSS', file);
      n++;
    }
    continue;
  }
  html = replaceHeader(html, file);
  html = replaceFooter(html, file);
  html = replaceScripts(html);
  html = bumpCss(html);
  fs.writeFileSync(fp, html, 'utf8');
  console.log('Synced', file);
  n++;
}
console.log('Done', n, 'pages');
