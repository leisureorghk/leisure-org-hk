/**
 * 由 course-knowledge.json 渲染教師課程單元 HTML，並更新 index 卡片／tts-scripts。
 *
 *   node render-course-unit.mjs                 # 重渲全部
 *   node render-course-unit.mjs 4-3-safety      # 只渲指定 slug
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const COURSE_DIR = path.join(root, 'Learn', '特殊需要人士教師課程');
const KNOWLEDGE_PATH = path.join(COURSE_DIR, 'data', 'course-knowledge.json');
const TTS_PATH = path.join(COURSE_DIR, 'data', 'tts-scripts.json');
const UNITS_DIR = path.join(COURSE_DIR, 'units');
const INDEX_PATH = path.join(COURSE_DIR, 'index.html');

const DISCLAIMER =
  '本網站根據課程講義、課堂分享與溝通工具筆記整理，供未能出席面授的學員系統研讀。不能代替醫療診斷、法律意見、課堂實習或面授扶抱示範。涉及健康、用藥、脊柱或癲癇等情況，須按家長／醫護文件執行。';

export function loadCourseKnowledge() {
  return JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf8'));
}

export function saveCourseKnowledge(data) {
  data.generatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(KNOWLEDGE_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 將「情境：…原則：…池邊做法：…」拆成三欄 */
export function splitKeypointBody(body) {
  const text = String(body || '').trim();
  const markers = [
    { key: 'situation', re: /情境[：:]/ },
    { key: 'principle', re: /原則[：:]/ },
    { key: 'practice', re: /池邊(?:做法|執行)[：:]/ },
  ];
  const hits = [];
  for (const m of markers) {
    const match = text.match(m.re);
    if (match && match.index != null) {
      hits.push({ key: m.key, index: match.index, len: match[0].length });
    }
  }
  hits.sort((a, b) => a.index - b.index);
  const out = { situation: '', principle: '', practice: '' };
  if (!hits.length) {
    out.principle = text;
    return out;
  }
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].index + hits[i].len;
    const end = i + 1 < hits.length ? hits[i + 1].index : text.length;
    out[hits[i].key] = text.slice(start, end).trim();
  }
  return out;
}

function siteHeader() {
  return `<div class="coach-bar" role="navigation" aria-label="教練分享區">
      <span>教練分享區 · 教師課程</span>
      <span><a href="../../../coach-share.html">返回分享區</a> · <a href="#" data-coach-logout>登出</a></span>
    </div>
    <header class="site">
    <a class="brand" href="../index.html">特殊需要人士游泳教師證書課程</a>
    <nav>
      <a href="../../../coach-share.html">教練分享區</a>
      <a href="../index.html">單元目錄</a>
      <a href="../../modexam/index.html">選擇題</a>
      <a href="../../教案/index.html">五類教案</a>
    </nav>
  </header>`;
}

function collectUnitFigures(unit) {
  const seen = new Set();
  const list = [];
  for (const f of unit.images || []) {
    if (f && !seen.has(f)) {
      seen.add(f);
      list.push(f);
    }
  }
  for (const kp of unit.keypoints || []) {
    for (const f of kp.figures || []) {
      if (f && !seen.has(f)) {
        seen.add(f);
        list.push(f);
      }
    }
  }
  return list.slice(0, 4);
}

function figAlt(file) {
  return String(file || '')
    .replace(/\.(svg|webp|png|jpe?g)$/i, '')
    .replace(/^anim-/, '')
    .replace(/[-_]/g, ' ');
}

function renderFigures(unit) {
  const figs = collectUnitFigures(unit);
  if (!figs.length) return '';
  return `<div class="fig-grid">${figs
    .map(
      (f) =>
        `<figure class="figure anim"><img src="../images/${esc(f)}" alt="${esc(figAlt(f))}"><figcaption class="caption">${esc(figAlt(f))}（原創，非學員影像）</figcaption></figure>`
    )
    .join('')}</div>`;
}

function renderKeypoints(unit) {
  return (unit.keypoints || [])
    .map((kp) => {
      const parts = splitKeypointBody(kp.body);
      const id = `kp-${esc(kp.id || 'item')}`;
      return `<div class="card pro" id="${id}">
      <h3>${esc(kp.title)}</h3>
      <p class="cite">講義出處：${esc(kp.source || `${unit.id} ${unit.title} · ${kp.title}`)}</p>
      <div class="kp-block"><p class="kp-kicker">課堂情境</p><p>${esc(parts.situation || '—')}</p></div><div class="kp-block"><p class="kp-kicker">教學原則</p><p>${esc(parts.principle || '—')}</p></div><div class="kp-block"><p class="kp-kicker">池邊執行</p><p>${esc(parts.practice || '—')}</p></div>
    </div>`;
    })
    .join('');
}

function renderGlossaryChips(unit) {
  const gloss = unit.glossary || [];
  if (!gloss.length) return '';
  return `<p class="term-chips">${gloss
    .map((g) => {
      const href = g.anchor ? `#${esc(g.anchor)}` : `#term-${esc(g.term)}`;
      return `<a class="term-chip term-link" href="${href}" title="${esc(g.def)}">${esc(g.term)}</a>`;
    })
    .join('')}</p>`;
}

function renderGlossaryDl(unit) {
  const gloss = unit.glossary || [];
  if (!gloss.length) return '';
  return `<h2>詞彙</h2>
    <dl class="glossary">${gloss
      .map((g) => {
        const href = g.anchor ? `#${esc(g.anchor)}` : '#';
        return `<dt id="term-${esc(g.term)}"><a class="term-link" href="${href}">${esc(g.term)}</a></dt><dd>${esc(g.def)}</dd>`;
      })
      .join('')}</dl>`;
}

function renderSelfCheck(unit) {
  const avoid = (unit.avoid || []).slice(0, 1);
  const dos = (unit.do || []).slice(0, 2);
  const items = [
    ...avoid.map((t) => ({ text: t, ok: 0 })),
    ...dos.map((t) => ({ text: t, ok: 1 })),
  ].slice(0, 3);
  while (items.length < 3) {
    items.push({ text: '教師不作診斷、不承諾療效。', ok: 1 });
  }
  return `<section class="card self-check" id="unit-check">
      <h2>讀完先核對</h2>
      <p class="caption">三題判斷：下列做法是否符合本單元池邊準則。</p>
      <form data-unit-check>
        ${items
          .map(
            (it, i) => `<fieldset class="judge" data-ok="${it.ok}">
          <legend>第 ${i + 1} 題</legend>
          <p>${esc(it.text)}</p>
          <label><input type="radio" name="j${i}" value="1"> 符合準則</label>
          <label><input type="radio" name="j${i}" value="0"> 違反準則</label>
        </fieldset>`
          )
          .join('')}
        <p class="toolbar"><button type="button" data-check-btn>核對</button></p>
        <p class="caption" data-check-result></p>
      </form>
    </section>`;
}

function navNeighbors(units, slug) {
  const idx = units.findIndex((u) => u.slug === slug);
  const prev = idx > 0 ? units[idx - 1] : null;
  const next = idx >= 0 && idx < units.length - 1 ? units[idx + 1] : null;
  return { prev, next };
}

export function renderUnitHtml(unit, allUnits) {
  const { prev, next } = navNeighbors(allUnits, unit.slug);
  const nextSlug = next?.slug || '';
  const nextTitle = next ? `下一單元：${next.title}` : '返回目錄';
  const nextHref = next ? `${next.slug}.html` : '../index.html';
  const prevHref = prev ? `${prev.slug}.html` : '../index.html';
  const prevLabel = prev ? `上一單元：${prev.title}` : '返回目錄';
  const captionNext = next ? `下一單元「${esc(next.title)}」` : '返回單元目錄';

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(unit.id)} ${esc(unit.title)}</title>
  <link rel="stylesheet" href="../../assets/style.css">
</head>
<body>
  <div class="wrap">
    ${siteHeader()}
    <p class="tag">${esc(unit.category)} · ${esc(unit.id)}</p>
    <h1>${esc(unit.title)}</h1>
    <p class="lead">請依序研讀導讀、重點與池邊準則，聽粵語說明，再以練習核對理解。</p>
    <p class="disclaimer">${esc(DISCLAIMER)}</p>
    <div class="card self-intro">
      <h2>單元導讀</h2>
      <p>${esc(unit.selfStudyIntro)}</p>
      <p class="caption">研讀次序：重點 → 粵語說明 → <a href="../../modexam/index.html?unit=${esc(unit.id)}">本單元練習</a> → ${captionNext}。</p>
    </div>
    <div class="audio-bar">
      <strong>粵語說明</strong>
      <button type="button" class="play-cantonese" data-slug="${esc(unit.slug)}" data-next="${esc(nextSlug)}">播放本單元說明</button>
      <button type="button" class="ghost stop-cantonese">暫停</button>
      <label class="rate-ctl">語速
        <input type="range" min="0.7" max="1.4" step="0.05" value="1" data-tts-rate>
        <span data-tts-rate-label>正常</span>
      </label>
      <label class="chk"><input type="checkbox" data-auto-next checked> 聽完自動下一章</label>
      <a class="btn ghost" href="../listen.html?slug=${esc(unit.slug)}">播放清單</a>
      <span class="caption" data-tts-status>會記住進度。聽完可自動轉下一章；安卓請用「播放清單」頁自選章節或下載 M3U。</span>
    </div>
    <h2>學完應能掌握</h2>
    <ul class="list check-self">${(unit.objectives || []).map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
    <h2>重點</h2>
    ${renderFigures(unit)}
    ${renderKeypoints(unit)}
    ${renderGlossaryChips(unit)}
    
    <h2>池邊準則：做到／避免</h2>
    <div class="two-col">
      <div class="card do"><h3>做到</h3><ul class="list">${(unit.do || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
      <div class="card avoid"><h3>避免</h3><ul class="list">${(unit.avoid || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
    </div>
    ${renderSelfCheck(unit)}
    
    <label class="chk done-mark"><input type="checkbox" data-mark-unit="${esc(unit.slug)}"> 已讀完本單元（本機記住進度）</label>
    ${renderGlossaryDl(unit)}
    <h2>粵語講稿（可邊聽邊看）</h2>
    <p class="caption">以下與本頁錄音同一份講稿。建議先讀重點，再聽說明，把判斷次序聽清楚。</p>
    <div class="card" id="script">${esc(unit.cantoneseScript || '')}</div>
    <div class="toolbar">
      <a class="btn ghost" href="../../modexam/index.html?unit=${esc(unit.id)}">本單元練習題</a>
      <a class="btn ghost" href="${esc(prevHref)}">${esc(prevLabel)}</a>
      <a class="btn" href="${esc(nextHref)}">${esc(nextTitle)}</a>
    </div>
    <p class="toolbar"><button type="button" class="ghost to-top" onclick="window.scrollTo({top:0,behavior:'smooth'})">回到頂部</button></p>
    <footer>本教材供系統自學。示意圖為原創教學圖，不使用學員照片、不翻印講義版面。</footer>
  </div>
  <script src="../../../js/coach-gate.js?v=20261021a"></script>
  <script>if(window.CoachGate){CoachGate.requireCoachAccess();document.querySelectorAll('[data-coach-logout]').forEach(function(el){el.addEventListener('click',function(e){e.preventDefault();CoachGate.logout();});});}</script>
  <script src="../js/tts.js"></script>
  <script src="../js/progress.js"></script>
</body>
</html>
`;
}

function cardSearchText(unit) {
  const parts = [
    unit.title,
    unit.id,
    ...(unit.objectives || []),
    ...(unit.keypoints || []).map((k) => k.title),
  ];
  return parts.join(' ').toLowerCase();
}

function renderIndexCard(unit) {
  const blurb = String(unit.selfStudyIntro || '').slice(0, 120);
  return `<article class="card" data-slug="${esc(unit.slug)}" data-search="${esc(cardSearchText(unit))}">
          <span class="tag">${esc(unit.id)}</span>
          <a class="title" href="units/${esc(unit.slug)}.html">${esc(unit.title)}</a>
          <p>${esc(blurb)}</p></article>`;
}

const CATEGORY_ORDER = ['基礎', '類別', '教學支援', '實務'];

/** 重寫 index.html 各分類的單元卡片區（保留頁首自學路徑與工具列） */
export function updateCourseIndex(knowledge) {
  let html = fs.readFileSync(INDEX_PATH, 'utf8');
  const byCat = new Map();
  for (const u of knowledge.units || []) {
    const c = u.category || '實務';
    if (!byCat.has(c)) byCat.set(c, []);
    byCat.get(c).push(u);
  }
  const cats = [
    ...CATEGORY_ORDER.filter((c) => byCat.has(c)),
    ...[...byCat.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
  ];
  const grids = cats
    .map((c) => {
      const cards = byCat
        .get(c)
        .map((u) => renderIndexCard(u))
        .join('');
      return `      <h2>${esc(c)}</h2>
      <div class="grid">
        ${cards}
      </div>`;
    })
    .join('\n');

  const startMarker = '      <h2>基礎</h2>';
  const endMarker = '    <h2>給 AI／學員的知識檔</h2>';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error('index.html：找不到單元卡片區標記（基礎／給 AI）');
  }
  html = html.slice(0, start) + grids + '\n' + html.slice(end);
  fs.writeFileSync(INDEX_PATH, html, 'utf8');
}

export function updateTtsScript(slug, script) {
  if (!script) return;
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(TTS_PATH, 'utf8'));
  } catch {
    data = {};
  }
  data[slug] = String(script);
  fs.writeFileSync(TTS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function writeUnitFiles(knowledge, slugs = null) {
  const units = knowledge.units || [];
  const want = slugs ? new Set(slugs) : null;
  const written = [];
  for (const unit of units) {
    if (want && !want.has(unit.slug)) continue;
    const html = renderUnitHtml(unit, units);
    const out = path.join(UNITS_DIR, `${unit.slug}.html`);
    fs.writeFileSync(out, html, 'utf8');
    if (unit.cantoneseScript) updateTtsScript(unit.slug, unit.cantoneseScript);
    written.push(unit.slug);
  }
  updateCourseIndex(knowledge);
  return written;
}

function main() {
  const knowledge = loadCourseKnowledge();
  const arg = process.argv[2];
  const slugs = arg ? [arg] : null;
  const written = writeUnitFiles(knowledge, slugs);
  console.error(`Rendered ${written.length} unit(s):`, written.join(', ') || '(none)');
}

const isCli =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    main();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
