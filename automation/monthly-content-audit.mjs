/**
 * 每月內容審計：消化當月週報與 RSS 摘要，補齊常駐頁並產出家長月報。
 *
 * 環境變數：MINIMAX_API_KEY（必填才會呼叫模型）
 *   MINIMAX_MODEL、MINIMAX_API_BASE（與週報相同）
 *
 * 執行：node monthly-content-audit.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { minimaxChat } from './minimax-chat.mjs';
import { loadSeoConfig, absUrl, pickRelatedLandingPages } from './seo-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const HUB_FILES = ['index.html', 'services.html', 'resources.html', 'blog.html'];
const LANDING_FILES = [
  'sen-guide.html',
  'sen-support-hk.html',
  'sen-swim-development.html',
  'sen-swim-physical.html',
  'sen-swim-intellectual.html',
  'sen-swim-down-syndrome.html',
  'sen-swim-autism.html',
  'sen-swim-adhd.html',
  'sen-swim-learning.html',
];
const SEO_FILES = [...HUB_FILES, ...LANDING_FILES, 'blog.html'];
const INTERNAL_HREF =
  /^(?:[a-z0-9][-a-z0-9]*\.html)(?:[?#][^\s"']*)?$/i;
const FROZEN_RE =
  /(\$[\d,]|HKD|港幣\s*\d|97083907|G-L4D38|ga4Measurement|google-site-verification|msvalidate)/i;
const MARK_START = '<!-- monthly-audit:start -->';
const MARK_END = '<!-- monthly-audit:end -->';

function hkParts(d = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [year, month, day] = fmt.format(d).split('-').map(Number);
  return { year, month, day, ym: `${year}-${String(month).padStart(2, '0')}` };
}

function monthRange(ym) {
  const [y, m] = ym.split('-').map(Number);
  const start = new Date(`${ym}-01T00:00:00+08:00`);
  const endMonth = m === 12 ? 1 : m + 1;
  const endYear = m === 12 ? y + 1 : y;
  const end = new Date(
    `${endYear}-${String(endMonth).padStart(2, '0')}-01T00:00:00+08:00`
  );
  return { start, end, ym };
}

function isoWeekMonday(year, week) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay() || 7;
  const monday = new Date(simple);
  monday.setUTCDate(simple.getUTCDate() - dow + 1);
  return monday;
}

function inRange(iso, start, end) {
  const t = Date.parse(iso || '');
  return Number.isFinite(t) && t >= start.getTime() && t < end.getTime();
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractJsonPayload(raw) {
  const text = String(raw || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function sanitizeFragment(html, maxLen = 4000) {
  let s = String(html || '');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, '');
  s = s.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  s = s.replace(/javascript:/gi, '');
  s = s.replace(/<(?!\/?(p|ul|ol|li|strong|em|a|h2|h3|h4|br)\b)[^>]*>/gi, '');
  s = s.replace(/href\s*=\s*(["'])([^"']*)\1/gi, (_, q, href) => {
    const h = String(href || '').trim();
    if (INTERNAL_HREF.test(h) || h.startsWith('https://www.leisure.org.hk/')) {
      return `href=${q}${h}${q}`;
    }
    return `href=${q}#${q}`;
  });
  if (FROZEN_RE.test(s)) return '';
  return s.slice(0, maxLen).trim();
}

function outlinePage(file) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) return { file, missing: true };
  const html = fs.readFileSync(p, 'utf8');
  const h1 = stripHtml((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
  const h2 = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map((m) => stripHtml(m[1]))
    .filter(Boolean)
    .slice(0, 12);
  const faqs = [...html.matchAll(/class="faq-question"[^>]*>([\s\S]*?)<\/button>/gi)]
    .map((m) => stripHtml(m[1]))
    .slice(0, 12);
  const faqH3 = [...html.matchAll(/<h3>([^<]{4,80})<\/h3>\s*<p>/g)]
    .map((m) => stripHtml(m[1]))
    .slice(0, 8);
  return { file, h1, h2, faqs: faqs.length ? faqs : faqH3 };
}

function collectMonthSources(ym) {
  const { start, end } = monthRange(ym);
  const weeklyMeta = readJson(path.join(root, 'data', 'weekly-article-meta.json'), {
    latest: null,
    history: [],
  });
  const weekly = [...(weeklyMeta.history || []), weeklyMeta.latest]
    .filter(Boolean)
    .filter((e, i, arr) => arr.findIndex((x) => x.slug === e.slug) === i)
    .filter((e) => inRange(e.publishedAt, start, end))
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      description: (e.description || '').slice(0, 180),
      publishedAt: e.publishedAt,
    }));

  for (const name of fs.readdirSync(root).filter((n) => /^blog-weekly-.+\.html$/i.test(n))) {
    if (weekly.some((w) => w.slug === name)) continue;
    const m = name.match(/^blog-weekly-(\d{4})-W(\d{2})\.html$/i);
    if (!m) continue;
    const year = Number(m[1]);
    const week = Number(m[2]);
    const monday = isoWeekMonday(year, week);
    if (!monday || !inRange(monday.toISOString(), start, end)) continue;
    try {
      const html = fs.readFileSync(path.join(root, name), 'utf8');
      weekly.push({
        slug: name,
        title: stripHtml((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || name),
        description: stripHtml((html.match(/<meta name="description"[^>]*content="([^"]*)"/i) || [])[1] || '').slice(0, 180),
        publishedAt: monday.toISOString(),
      });
    } catch {
      /* skip */
    }
  }

  const digest = readJson(path.join(root, 'data', 'sen-swim-digest.json'), { items: [] });
  const digestItems = (digest.items || [])
    .filter((it) => inRange(it.publishedAt, start, end))
    .slice(0, 24)
    .map((it) => ({
      title: it.title,
      summary: String(it.summary || '').slice(0, 220),
      sourceName: it.sourceName,
      publishedAt: it.publishedAt,
    }));

  const seo = loadSeoConfig(root);
  const seoBrief = (seo.pages || [])
    .filter((p) => SEO_FILES.includes(p.file))
    .map((p) => ({
      file: p.file,
      description: p.description,
      keywords: p.keywords,
    }));

  return {
    ym,
    weekly,
    digestItems,
    outlines: [...HUB_FILES, ...LANDING_FILES].map(outlinePage),
    seoBrief,
  };
}

function defaultHubHtml(ym, weekly, digestItems, file) {
  const n = weekly.length;
  const d = digestItems.length;
  const links = weekly
    .slice(0, 4)
    .map((w) => `<li><a href="${esc(w.slug)}">${esc(w.title)}</a></li>`)
    .join('');
  const report = `monthly-insights-${esc(ym)}.html`;
  const heading =
    file === 'blog.html' ? '家長月報' : file === 'services.html' ? '本月課程相關重點' : '本月家長重點';
  return `<h2>${heading}（${esc(ym)}）</h2>
<p>本月教練專欄新增 ${n} 篇專題，產業摘要收錄 ${d} 則與 SEN／游泳相關的公開資訊。歡迎先讀月報，再按孩子需要進入專頁。</p>
<p id="monthly-insights-latest"><a href="${report}">閱讀 ${esc(ym)} 家長月報</a></p>
${links ? `<ul>${links}</ul>` : ''}`;
}

function applyHubBlock(file, innerHtml) {
  const p = path.join(root, file);
  let html = fs.readFileSync(p, 'utf8');
  const clean = sanitizeFragment(innerHtml, 3500);
  if (!clean) return { ok: false, reason: 'empty-or-frozen' };
  const block = `${MARK_START}
<section class="section section-light monthly-audit-panel" aria-labelledby="monthly-audit-heading-${file.replace(/\W/g, '')}">
<div class="container">${clean}</div>
</section>
${MARK_END}`;
  if (html.includes(MARK_START) && html.includes(MARK_END)) {
    html = html.replace(
      new RegExp(`${MARK_START}[\\s\\S]*?${MARK_END}`),
      block
    );
  } else {
    return { ok: false, reason: 'missing-markers' };
  }
  fs.writeFileSync(p, html, 'utf8');
  return { ok: true };
}

function mergeLandingExtras(parsed, ym) {
  const extrasPath = path.join(root, 'data', 'monthly-audit-extras.json');
  const extras = readJson(extrasPath, { landings: {} });
  extras.landings = extras.landings || {};
  extras.updatedAt = new Date().toISOString();
  extras.month = ym;
  const skipped = [];
  const applied = [];
  const incoming = parsed.landingExtras || parsed.landings || {};
  for (const file of LANDING_FILES) {
    const raw = incoming[file];
    if (!raw || typeof raw !== 'object') continue;
    const faqs = (Array.isArray(raw.faqs) ? raw.faqs : [])
      .map((f) => ({
        q: String(f.q || f.question || '')
          .trim()
          .slice(0, 80),
        a: String(f.a || f.answer || '')
          .trim()
          .slice(0, 400),
      }))
      .filter((f) => f.q && f.a && !FROZEN_RE.test(f.q + f.a))
      .slice(0, 4);
    const links = (Array.isArray(raw.links) ? raw.links : [])
      .map((l) => ({
        href: String(l.href || l.path || '').replace(/^\//, ''),
        label: String(l.label || l.title || '').trim().slice(0, 40),
      }))
      .filter((l) => INTERNAL_HREF.test(l.href) && l.label)
      .slice(0, 6);
    if (!faqs.length && !links.length) {
      skipped.push({ file, reason: 'invalid-extras' });
      continue;
    }
    extras.landings[file] = { faqs, links };
    applied.push(file);
  }
  fs.writeFileSync(extrasPath, JSON.stringify(extras, null, 2) + '\n', 'utf8');
  return { applied, skipped };
}

function applySeoUpdates(parsed) {
  const skipped = [];
  const applied = [];
  const updates = Array.isArray(parsed.seoUpdates) ? parsed.seoUpdates : [];
  if (!updates.length) return { applied, skipped };
  const cfgPath = path.join(root, 'data', 'seo-config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  for (const u of updates.slice(0, 12)) {
    const file = String(u.file || '');
    if (!SEO_FILES.includes(file)) {
      skipped.push({ file, reason: 'not-whitelisted' });
      continue;
    }
    const page = (cfg.pages || []).find((p) => p.file === file);
    if (!page) {
      skipped.push({ file, reason: 'not-in-seo-config' });
      continue;
    }
    const desc = String(u.description || '').trim().slice(0, 160);
    const kw = String(u.keywords || '').trim().slice(0, 180);
    if ((desc && FROZEN_RE.test(desc)) || (kw && FROZEN_RE.test(kw))) {
      skipped.push({ file, reason: 'frozen-pattern' });
      continue;
    }
    if (desc && desc.length >= 40) page.description = desc;
    if (kw && kw.length >= 8) page.keywords = kw;
    applied.push(file);
  }
  if (applied.length) {
    cfg.site.contentLastmod = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
  }
  return { applied, skipped };
}

function buildMonthlyPage({ ym, title, description, keywords, bodyHtml, related, weekly }) {
  const site = loadSeoConfig(root).site;
  const slug = `monthly-insights-${ym}.html`;
  const kw = Array.isArray(keywords) ? keywords.join(', ') : String(keywords || 'SEN游泳, 家長資源');
  const relatedHtml = (related || [])
    .map((r) => {
      const href = String(r.path || r.href || '').replace(/^\//, '');
      return `<li><a href="${esc(href)}">${esc(r.title || href)}</a></li>`;
    })
    .join('');
  const weeklyHtml = weekly
    .map((w) => `<li><a href="${esc(w.slug)}">${esc(w.title)}</a></li>`)
    .join('');
  return `<!DOCTYPE html>
<html lang="zh-Hant-HK">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="description" content="${esc(description)}">
    <meta name="keywords" content="${esc(kw)}">
    <title>${esc(title)} | 新天地</title>
    <link rel="canonical" href="${esc(absUrl(site, '/' + slug))}">
    <link rel="icon" type="image/svg+xml" href="images/icons/app-icon.svg">
    <link rel="stylesheet" href="css/style.css?v=20260914a">
</head>
<body>
    <div class="loading" id="loading"><div class="loading-spinner"></div></div>
    <header class="header" id="header">
        <div class="header-inner">
            <a href="index.html" class="logo">
                <div class="logo-icon"><img src="images/icons/logo-header.svg" alt="新天地"></div>
                <div class="logo-text">新天地<span>SEN學生游泳及多功能發展</span></div>
            </a>
            <nav class="nav" id="nav">
                <div class="nav-drawer-links">
                    <a href="index.html" class="nav-link">首頁</a>
                    <a href="resources.html" class="nav-link">家長資源</a>
                    <a href="blog.html" class="nav-link">教練專欄</a>
                    <a href="booking.html" class="nav-link">預約課程</a>
                </div>
            </nav>
        </div>
    </header>
    <section class="page-header"><div class="container"><h1>${esc(title)}</h1><p>把本月週報與公開資訊，整理成家長可讀的重點</p></div></section>
    <section class="section"><div class="container article-body">
    <p class="digest-intro" style="margin:0 0 1.25rem;padding:0.85rem 1rem;background:rgba(30,87,153,0.06);border-radius:10px;font-size:0.9rem;line-height:1.7"><strong>溫馨提示：</strong>本頁為教育整理，<strong>並非醫療診斷</strong>。個別安排請 WhatsApp 與教練商討。第三方摘要請以原文為準。</p>
    ${bodyHtml}
    ${weeklyHtml ? `<h2>本月教練專欄</h2><ul>${weeklyHtml}</ul>` : ''}
    ${relatedHtml ? `<h2>相關專頁</h2><ul>${relatedHtml}</ul>` : ''}
    <div class="text-center" style="margin-top:2rem">
      <a href="blog.html" class="btn btn-outline">返回教練專欄</a>
      <a href="booking.html" class="btn btn-primary">預約試堂</a>
    </div>
    </div></section>
    <footer class="footer"><div class="container"><div class="footer-bottom"><p>&copy; ${new Date().getFullYear()} 新天地 · <a href="sitemap.xml">網站地圖</a></p></div></div></footer>
    <script src="js/site-ui.js?v=20260827b" defer></script>
    <script src="js/analytics.js?v=20260525a" defer></script>
</body>
</html>`;
}

function writeMetaAndLog({ ym, title, description, keywords, slug, sources, changes, skipped }) {
  const metaPath = path.join(root, 'data', 'monthly-insights-meta.json');
  const meta = readJson(metaPath, { latest: null, history: [] });
  const entry = {
    slug,
    ym,
    title,
    description,
    keywords,
    publishedAt: new Date().toISOString(),
  };
  meta.latest = entry;
  meta.history = [entry, ...(meta.history || []).filter((h) => h.slug !== slug)].slice(0, 24);
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');

  const logPath = path.join(root, 'data', 'monthly-audit-log.json');
  const log = readJson(logPath, { runs: [] });
  log.runs = [
    {
      at: new Date().toISOString(),
      ym,
      weeklyCount: sources.weekly.length,
      digestCount: sources.digestItems.length,
      changes,
      skipped,
    },
    ...(log.runs || []),
  ].slice(0, 24);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2) + '\n', 'utf8');
}

async function callModel(sources) {
  const apiKey = process.env.MINIMAX_API_KEY;
  const model = process.env.MINIMAX_MODEL || 'MiniMax-M3';
  const base = process.env.MINIMAX_API_BASE || 'https://api.minimax.io';
  if (!apiKey) return { skipped: true };

  const system = `你是香港「新天地」SEN 游泳中心的內容編輯。只用繁體中文（香港書面語）。
任務：根據本月新增資訊，補齊網站常駐頁，幫助家長與參加者更快找到重點。
硬性規則：
- 只輸出一個 JSON 物件，不要 markdown 說明。
- 禁止編造收費、優惠、地址、電話、診斷或藥物建議。
- 禁止抄襲外文；第三方資訊只作主題線索。
- hubHtml 只能用 p,ul,li,strong,em,a,h2,h3；連結必須是站內 .html 檔名。
- landingExtras 的 faqs 每頁最多 3 則；不要重複頁上已有問句。
JSON 結構：
{
  "insightsTitle": "≤36字月報標題",
  "insightsDescription": "70-120字 SEO 描述",
  "insightsKeywords": ["SEN游泳","家長資源"],
  "insightsHtml": "月報正文 HTML（h2/p/ul，600-900字）",
  "hubHtml": {
    "index.html": "插入首頁的本月重點 HTML",
    "services.html": "插入服務頁的本月重點 HTML",
    "resources.html": "插入家長資源頁的本月重點 HTML"
  },
  "landingExtras": {
    "sen-guide.html": { "faqs": [{"q":"","a":""}], "links": [{"href":"blog.html","label":"教練專欄"}] }
  },
  "seoUpdates": [{ "file": "resources.html", "description": "", "keywords": "" }]
}`;

  const user = `本月（香港 ${sources.ym}）新增：\n週報：${JSON.stringify(sources.weekly).slice(0, 3500)}\n摘要：${JSON.stringify(sources.digestItems).slice(0, 4500)}\n現有頁大綱：${JSON.stringify(sources.outlines).slice(0, 5000)}\nSEO 現況：${JSON.stringify(sources.seoBrief).slice(0, 2500)}\n請只輸出 JSON。`;

  const raw = await minimaxChat({
    apiKey,
    base,
    model,
    system,
    user,
    temperature: 0.4,
    max_completion_tokens: 4096,
  });
  return extractJsonPayload(raw) || {};
}

async function main() {
  const { ym } = hkParts();
  const sources = collectMonthSources(ym);
  console.error(
    `Monthly audit ${ym}: weekly=${sources.weekly.length} digest=${sources.digestItems.length}`
  );

  if (!sources.weekly.length && !sources.digestItems.length) {
    console.error('本月沒有週報或摘要可審計，略過。');
    process.exit(0);
  }

  const skipped = [];
  const changes = [];
  let parsed = {};
  try {
    parsed = await callModel(sources);
  } catch (e) {
    console.error('MiniMax 失敗，改用本機摘要：', e.message || e);
    skipped.push({ reason: 'minimax-error', detail: String(e.message || e).slice(0, 200) });
    parsed = {};
  }

  if (parsed.skipped) {
    console.error('MINIMAX_API_KEY 未設定：略過每月審計。');
    process.exit(0);
  }

  const title =
    String(parsed.insightsTitle || '').trim().slice(0, 40) ||
    `${ym} 家長月報：SEN 游泳重點`;
  const description =
    String(parsed.insightsDescription || '').trim().slice(0, 160) ||
    `整理 ${ym} 教練專欄與 SEN／游泳公開資訊，幫助香港家長掌握水中學習重點。`;
  const keywords = Array.isArray(parsed.insightsKeywords)
    ? parsed.insightsKeywords.map((k) => String(k).slice(0, 24)).slice(0, 8)
    : ['SEN游泳', '家長資源', '特殊需要游泳'];
  let bodyHtml = sanitizeFragment(parsed.insightsHtml || '', 8000);
  if (!bodyHtml || bodyHtml.length < 80) {
    bodyHtml = `<h2>本月我們讀到什麼？</h2><p>本月共有 ${sources.weekly.length} 篇教練專欄與 ${sources.digestItems.length} 則產業摘要。建議家長先看與孩子情況相近的專頁，再預約試堂溝通細節。</p>
<ul>${sources.digestItems
      .slice(0, 6)
      .map((d) => `<li>${esc(d.title)}（${esc(d.sourceName || '')}）</li>`)
      .join('')}</ul>`;
  }

  const seoConfig = loadSeoConfig(root);
  const related = pickRelatedLandingPages(
    seoConfig,
    `${title} ${description} ${stripHtml(bodyHtml)}`,
    3
  );
  const slug = `monthly-insights-${ym}.html`;
  const page = buildMonthlyPage({
    ym,
    title,
    description,
    keywords,
    bodyHtml,
    related,
    weekly: sources.weekly,
  });
  fs.writeFileSync(path.join(root, slug), page, 'utf8');
  changes.push(slug);

  const hubHtml = parsed.hubHtml && typeof parsed.hubHtml === 'object' ? parsed.hubHtml : {};
  for (const file of HUB_FILES) {
    const fallback = defaultHubHtml(ym, sources.weekly, sources.digestItems, file);
    const html = hubHtml[file] || fallback;
    const r = applyHubBlock(file, html);
    if (r.ok) changes.push(file);
    else skipped.push({ file, reason: r.reason });
  }

  const land = mergeLandingExtras(parsed, ym);
  changes.push(...land.applied.map((f) => `extras:${f}`));
  skipped.push(...land.skipped);
  if (land.applied.length) {
    const gen = spawnSync(process.execPath, [path.join(__dirname, 'generate-content-pages.mjs')], {
      cwd: root,
      stdio: 'inherit',
    });
    if (gen.status) process.exit(gen.status || 1);
    changes.push('generate-content-pages');
  }

  const seo = applySeoUpdates(parsed);
  changes.push(...seo.applied.map((f) => `seo:${f}`));
  skipped.push(...seo.skipped);

  writeMetaAndLog({ ym, title, description, keywords, slug, sources, changes, skipped });
  console.error('Monthly audit wrote', slug, 'changes', changes.length, 'skipped', skipped.length);
}

const isCli =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
