/**
 * 一次性／維護用：為 Learn 教師課程 HTML 注入教練分享區護欄
 * node inject-coach-gate.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const course = path.join(root, 'Learn', '特殊需要人士教師課程');

const GATE_UNITS = `
  <script src="../../../js/coach-gate.js?v=20261021a"></script>
  <script>if(window.CoachGate){CoachGate.requireCoachAccess();document.querySelectorAll('[data-coach-logout]').forEach(function(el){el.addEventListener('click',function(e){e.preventDefault();CoachGate.logout();});});}</script>
`;
const GATE_COURSE = `
  <script src="../../js/coach-gate.js?v=20261021a"></script>
  <script>if(window.CoachGate){CoachGate.requireCoachAccess();document.querySelectorAll('[data-coach-logout]').forEach(function(el){el.addEventListener('click',function(e){e.preventDefault();CoachGate.logout();});});}</script>
`;
const BAR_UNITS = `<div class="coach-bar" role="navigation" aria-label="教練分享區">
      <span>教練分享區 · 教師課程</span>
      <span><a href="../../../coach-share.html">返回分享區</a> · <a href="#" data-coach-logout>登出</a></span>
    </div>
`;
const BAR_COURSE = `<div class="coach-bar" role="navigation" aria-label="教練分享區">
      <span>教練分享區 · 教師課程</span>
      <span><a href="../../coach-share.html">返回分享區</a> · <a href="#" data-coach-logout>登出</a></span>
    </div>
`;

function inject(file, depth) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('coach-gate.js')) {
    console.error('skip', path.relative(root, file));
    return;
  }
  const bar = depth === 'units' ? BAR_UNITS : BAR_COURSE;
  const gate = depth === 'units' ? GATE_UNITS : GATE_COURSE;
  if (html.includes('<div class="wrap">')) {
    html = html.replace('<div class="wrap">', `<div class="wrap">\n${bar}`);
  } else if (html.includes('<body>')) {
    html = html.replace('<body>', `<body>\n${bar}`);
  }
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${gate}\n</body>`);
  } else {
    html += gate;
  }
  if (!/name=["']robots["']/i.test(html) && html.includes('</head>')) {
    html = html.replace('</head>', '  <meta name="robots" content="noindex, nofollow">\n</head>');
  }
  fs.writeFileSync(file, html, 'utf8');
  console.error('ok', path.relative(root, file));
}

for (const name of fs.readdirSync(path.join(course, 'units'))) {
  if (!name.endsWith('.html')) continue;
  inject(path.join(course, 'units', name), 'units');
}
for (const name of ['index.html', 'listen.html', 'glossary.html']) {
  const f = path.join(course, name);
  if (fs.existsSync(f)) inject(f, 'course');
}
