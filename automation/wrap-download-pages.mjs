/**
 * 為下載單張頁加上全站 header／footer／腳本（保留 sheet 內容與 PNG 下載）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CSS_HREF,
  SCRIPT_TAGS,
  renderFooter,
  renderHeader,
  renderNavInlineScript,
} from './site-chrome.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const FILES = [
  'download-parent-guide-first-swim.html',
  'download-sensory-games-home-guide.html',
  'download-visual-cue-cards-pack.html',
];

const chromeCss = `
    .site-download-nav { max-width:900px; margin:12px auto 0; padding:0 8px; display:flex; flex-wrap:wrap; gap:0.75rem; font-size:0.9rem; }
    .site-download-nav a { color:#0b6fb3; }
    @media print {
      .header, .footer, .loading, .nav-backdrop, .actions, .site-download-nav { display:none !important; }
    }
`;

const navStrip = `  <p class="site-download-nav">
    <a href="resources.html">← 家長資源</a>
    <a href="sen-swim-first-lesson.html">第一次 SEN 泳課會發生什麼</a>
    <a href="booking.html">預約試堂</a>
  </p>`;

for (const file of FILES) {
  const fp = path.join(root, file);
  let html = fs.readFileSync(fp, 'utf8');

  if (/href="css\/style\.css/.test(html)) {
    html = html.replace(/href="css\/style\.css\?v=[^"]+"/i, `href="${CSS_HREF}"`);
  } else {
    html = html.replace(
      /<\/head>/i,
      `  <link rel="stylesheet" href="${CSS_HREF}">\n</head>`
    );
  }

  if (!html.includes('.site-download-nav')) {
    html = html.replace(/<\/style>/i, `${chromeCss}\n  </style>`);
  }

  if (!/<header\s+class="header"/i.test(html)) {
    html = html.replace(
      /<body[^>]*>/i,
      `<body>
  <div class="loading" id="loading"><div class="loading-spinner"></div></div>
  <div class="nav-backdrop" id="nav-backdrop"></div>
${renderHeader({ active: 'resources' })}
${navStrip}`
    );
  } else if (!html.includes('site-download-nav')) {
    html = html.replace(
      /(<header\s+class="header"[\s\S]*?<\/header>)/i,
      `$1\n${navStrip}`
    );
  }

  const footerHtml = renderFooter({ variant: 'compact' });
  if (!/<footer\s+class="footer">/i.test(html)) {
    // 插在 html2canvas／頁尾腳本之前
    if (/html2canvas/i.test(html)) {
      html = html.replace(
        /(<script[^>]*html2canvas)/i,
        `${footerHtml}\n  $1`
      );
    } else {
      html = html.replace(/<\/body>/i, `${footerHtml}\n</body>`);
    }
  } else {
    html = html.replace(/<footer\s+class="footer">[\s\S]*?<\/footer>/i, footerHtml.trimStart());
  }

  html = html.replace(/<script\s+src="js\/site-ui\.js[^"]*"\s+defer><\/script>\s*/gi, '');
  html = html.replace(/<script\s+src="js\/share\.js[^"]*"\s+defer><\/script>\s*/gi, '');
  html = html.replace(/<script\s+src="js\/analytics\.js[^"]*"\s+defer><\/script>\s*/gi, '');
  html = html.replace(/<script\s+src="js\/security\.js[^"]*"><\/script>\s*/gi, '');
  html = html.replace(/\s*<script>\s*const mobileMenuBtn[\s\S]*?<\/script>\s*/i, '\n');

  if (!/js\/site-ui\.js/.test(html)) {
    html = html.replace(
      /<\/body>/i,
      `    ${SCRIPT_TAGS}\n    ${renderNavInlineScript()}\n</body>`
    );
  }

  fs.writeFileSync(fp, html, 'utf8');
  console.log('Wrapped', file);
}
