/**
 * 從 weeklyPool 來源隨機挑選 RSS 摘要，呼叫 MiniMax 文字生成 API（JSON／REST），
 * 產出繁中原創 HTML 文章與 weekly-article-meta.json。
 *
 * 環境變數：
 *   MINIMAX_API_KEY（必填才會產出週報 HTML）
 *   MINIMAX_MODEL（預設 MiniMax-M3）
 *   MINIMAX_API_BASE（預設 https://api.minimax.io；可設 https://api.minimaxi.com/v1）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import Parser from 'rss-parser';
import { minimaxChat } from './minimax-chat.mjs';
import { isSenOrSwimRelevant } from './sen-swim-relevance.mjs';
import {
  loadSeoConfig,
  renderSeoHead,
  renderHeadJsonLd,
  absUrl,
  writeSitemap,
  writeRssFeed,
  writeLlmsTxt,
  collectWeeklyArticleUrls,
  pickRelatedLandingPages,
} from './seo-lib.mjs';
import { buildSearchIndex } from './build-search-index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const yamlPath = path.join(__dirname, 'feed-sources.yaml');
const metaPath = path.join(root, 'data', 'weekly-article-meta.json');
const socialPath = path.join(root, 'data', 'weekly-social-copy.txt');

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseDateMs(item) {
  const raw = item.pubDate || item.isoDate || item.date || '';
  const t = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function isoWeekInfo(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  const y = date.getUTCFullYear();
  return { year: y, week: weekNo, slug: `blog-weekly-${y}-W${String(weekNo).padStart(2, '0')}.html` };
}

function stripThinking(text) {
  return String(text || '')
    .replace(/<think>[\s\S]*?<\/redacted_thinking>/gi, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();
}

function sanitizeArticleHtml(html) {
  let s = stripThinking(html);
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, '');
  s = s.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  s = s.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  return s.trim();
}

function softenPublicArticleHtml(html) {
  return String(html || '')
    .replace(/\bAI\b/g, '相關工具')
    .replace(/人工智能/g, '相關技術');
}

function extractJsonPayload(raw) {
  const text = stripThinking(raw);
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : text.trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeKeywords(raw) {
  let list = [];
  if (Array.isArray(raw)) list = raw.map((x) => String(x || '').trim()).filter(Boolean);
  else if (typeof raw === 'string') {
    list = raw
      .split(/[,，、]/)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  const defaults = ['SEN游泳', '香港特殊教育游泳', '特殊需要兒童游泳'];
  for (const d of defaults) {
    if (!list.some((k) => k.toLowerCase() === d.toLowerCase())) list.push(d);
  }
  return list.slice(0, 8);
}

function normalizeFaqs(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f) => ({
      question: String(f?.question || '').trim(),
      answer: String(f?.answer || '').trim(),
    }))
    .filter((f) => f.question && f.answer)
    .slice(0, 4);
}

async function fetchFeedItems(parser, src, limit, timeoutMs) {
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error('timeout')), timeoutMs)
  );
  const feed = await Promise.race([parser.parseURL(src.rssUrl), timeout]);
  const out = [];
  for (const it of feed.items || []) {
    const link = it.link || it.guid;
    if (!link) continue;
    out.push({
      title: (it.title || '').trim(),
      url: String(link).trim(),
      summary: stripHtml(it.contentSnippet || it.summary || it.description || ''),
      sourceName: src.name,
      sourceId: src.id,
      sortKey: parseDateMs(it),
    });
    if (out.length >= limit) break;
  }
  out.sort((a, b) => b.sortKey - a.sortKey);
  return out.filter((row) => isSenOrSwimRelevant(`${row.title} ${row.summary}`));
}

function buildStandalonePage({
  title,
  description,
  keywords,
  faqs,
  bodyHtml,
  refs,
  related,
  slug,
  site,
  publishedAt,
}) {
  const esc = (s) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const pagePath = `/${slug}`;
  const kwStr = Array.isArray(keywords) ? keywords.join(', ') : String(keywords || '');
  const seoPage = {
    path: pagePath,
    title: `${title} | 新天地教練專欄`,
    description,
    keywords: kwStr,
    ogType: 'article',
    breadcrumb: [
      { name: '教練專欄', path: '/blog.html' },
      { name: title.slice(0, 40), path: pagePath },
    ],
    schemas: ['breadcrumb'],
    datePublished: publishedAt,
    dateModified: publishedAt,
  };
  const seoHead = site ? renderSeoHead(site, seoPage) : '';
  const pageFaqs = faqs?.length ? faqs : [];
  const seoJsonLd = site
    ? renderHeadJsonLd(site, seoPage, { faq: pageFaqs })
    : '';

  const refBlock = refs
    .map(
      (r) =>
        `<li><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>（${esc(r.sourceName)}）</li>`
    )
    .join('\n');

  const relatedBlock =
    related?.length > 0
      ? `<section class="weekly-related" aria-labelledby="weekly-related-h">
        <h2 id="weekly-related-h">延伸閱讀</h2>
        <ul>
          ${related
            .map(
              (r) =>
                `<li><a href="${esc(r.path.replace(/^\//, ''))}">${esc(r.title)}</a>${
                  r.description
                    ? ` — <span style="color:var(--text-muted);font-size:0.9rem">${esc(
                        r.description.slice(0, 80)
                      )}${r.description.length > 80 ? '…' : ''}</span>`
                    : ''
                }</li>`
            )
            .join('\n')}
        </ul>
      </section>`
      : '';

  const faqBlock =
    pageFaqs.length > 0
      ? `<section class="weekly-faq" aria-labelledby="weekly-faq-h">
        <h2 id="weekly-faq-h">家長常見問題</h2>
        <div class="faq-list">
          ${pageFaqs
            .map(
              (f) => `<div class="faq-item">
            <h3 class="faq-question" style="font-size:1rem;margin:1rem 0 0.35rem">${esc(f.question)}</h3>
            <p class="faq-answer-content" style="margin:0 0 0.75rem;line-height:1.8">${esc(f.answer)}</p>
          </div>`
            )
            .join('\n')}
        </div>
      </section>`
      : '';

  const articleJsonLd = site
    ? `  <script type="application/ld+json">
  ${JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      keywords: kwStr,
      url: absUrl(site, pagePath),
      inLanguage: 'zh-Hant-HK',
      datePublished: publishedAt,
      dateModified: publishedAt,
      author: { '@type': 'Organization', name: site.nameFull },
      publisher: { '@id': `${site.baseUrl}/#organization` },
      isPartOf: { '@id': `${site.baseUrl}/#website` },
      image: absUrl(site, site.defaultImage || '/images/hero-banner.webp'),
    },
    null,
    2
  )}
  </script>`
    : '';

  const faqJsonLd =
    site && pageFaqs.length
      ? `  <script type="application/ld+json">
  ${JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: pageFaqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
    null,
    2
  )}
  </script>`
      : '';

  const pageUrl = site ? absUrl(site, pagePath) : slug;

  return `<!DOCTYPE html>
<html lang="zh-Hant-HK">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="description" content="${esc(description)}">
  <meta name="keywords" content="${esc(kwStr)}">
  <title>${esc(seoPage.title)}</title>
${seoHead}
${seoJsonLd}
${articleJsonLd}
${faqJsonLd}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="images/icons/app-icon.svg">
  <link rel="stylesheet" href="css/style.css?v=20260514a">
  <style>
    .weekly-ai-shell { max-width: 820px; margin: 0 auto; padding: 2rem 1rem 4rem; }
    .weekly-ai-banner {
      background: linear-gradient(135deg, rgba(30,87,153,0.08), rgba(42,157,143,0.08));
      border: 1px solid rgba(13,40,71,0.08);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.7;
    }
    .weekly-ai-body article h2 { font-size: 1.35rem; margin: 1.5rem 0 0.75rem; color: var(--ocean-blue); }
    .weekly-ai-body article h3 { font-size: 1.1rem; margin: 1.25rem 0 0.5rem; }
    .weekly-ai-body article p { margin-bottom: 1rem; line-height: 2; }
    .weekly-ai-body article ul { margin: 0.5rem 0 1rem 1.25rem; list-style: disc; }
    .weekly-ai-body article li { margin-bottom: 0.35rem; }
    .weekly-ai-refs, .weekly-related, .weekly-faq { margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid var(--gray-mist); }
    .weekly-ai-refs h2, .weekly-related h2, .weekly-faq h2 { font-size: 1.1rem; margin-bottom: 0.5rem; }
    .weekly-share { display:flex; flex-wrap:wrap; gap:0.5rem; margin: 1rem 0 1.5rem; }
  </style>
</head>
<body style="font-family:'Noto Sans TC',sans-serif;background:var(--cream);color:var(--text-body);">
  <header class="header" style="position:relative">
    <div class="header-inner">
      <a href="index.html" class="logo">
        <div class="logo-text">新天地<span>每週專題</span></div>
      </a>
      <nav class="nav" style="display:flex;gap:1rem;flex-wrap:wrap;justify-content:flex-end">
        <a href="blog.html" class="nav-link">返回教練專欄</a>
        <a href="index.html" class="nav-link">首頁</a>
      </nav>
    </div>
  </header>
  <main class="weekly-ai-shell container">
    <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem;">${esc(slug)}</p>
    <h1 style="font-size:clamp(1.35rem,4vw,1.85rem);color:var(--text-dark);margin-bottom:1rem;line-height:1.3;">${esc(title)}</h1>
    <div class="weekly-share" data-share-root
         data-share-title="${esc(title)}"
         data-share-text="${esc(description)}"
         data-share-url="${esc(pageUrl)}">
      <button type="button" class="btn btn-outline" data-share-native>分享</button>
      <button type="button" class="btn btn-outline" data-share-copy>複製連結</button>
      <a class="btn btn-outline" data-share-whatsapp target="_blank" rel="noopener">WhatsApp</a>
      <a class="btn btn-outline" data-share-facebook target="_blank" rel="noopener">Facebook</a>
    </div>
    <div class="weekly-ai-banner">
      <strong>聲明：</strong>本篇依多個公開 RSS 摘要與連結作為靈感參考，由撰寫流程輔助以繁體中文重新組織與改寫，主題<strong>僅限 SEN 學童／青少年與游泳教學實務</strong>，<strong>非原文翻譯或抄襲</strong>。內容可能仍有疏漏，請讀者自行查證原文；發布前建議由機構負責人審閱。
    </div>
    <div class="weekly-ai-body">
      <article>
        ${bodyHtml}
      </article>
      ${faqBlock}
      ${relatedBlock}
      <section class="weekly-ai-refs">
        <h2>參考靈感來源（公開連結）</h2>
        <ul>${refBlock}</ul>
      </section>
    </div>
    <p style="margin-top:2rem;"><a href="blog.html" class="btn btn-primary">返回教練專欄</a></p>
  </main>
  <script src="js/share.js?v=20260821a" defer></script>
  <script src="js/analytics.js?v=20260525a" defer></script>
</body>
</html>`;
}

async function main() {
  const apiKey = process.env.MINIMAX_API_KEY;
  const model = process.env.MINIMAX_MODEL || 'MiniMax-M3';
  const base = process.env.MINIMAX_API_BASE || 'https://api.minimax.io';

  if (!apiKey) {
    console.error('MINIMAX_API_KEY 未設定：略過週報產生（本地或測試環境屬正常）。');
    process.exit(0);
  }

  const raw = fs.readFileSync(yamlPath, 'utf8');
  const doc = yaml.load(raw);
  const settings = doc.settings || {};
  const timeoutMs = settings.requestTimeoutMs ?? 22000;
  const pool = (Array.isArray(doc.sources) ? doc.sources : []).filter((s) => s?.weeklyPool && s.rssUrl);

  if (pool.length < 2) {
    console.error('weeklyPool 來源不足 2 個，請檢查 feed-sources.yaml');
    process.exit(1);
  }

  const parser = new Parser({
    timeout: timeoutMs,
    headers: { 'User-Agent': 'LeisureOrgHK-weekly-bot/1.0 (+https://www.leisure.org.hk)' },
  });

  const pickedSources = shuffle(pool).slice(0, Math.min(4, pool.length));
  const bucket = [];
  for (const src of pickedSources) {
    try {
      const rows = await fetchFeedItems(parser, src, 24, timeoutMs);
      bucket.push(...rows);
      console.error(`weekly pool ${src.id}: +${rows.length}`);
    } catch (e) {
      console.error(`weekly skip ${src.id}:`, e.message || e);
    }
  }

  if (bucket.length < 2) {
    console.error('篩選後與 SEN／游泳相關的 RSS 不足 2 則，中止。');
    process.exit(1);
  }

  const refs = shuffle(bucket).slice(0, Math.min(4, bucket.length));
  const refText = refs
    .map(
      (r, i) =>
        `【${i + 1}】來源：${r.sourceName}\n標題：${r.title}\n連結：${r.url}\n摘要：${r.summary.slice(0, 500)}`
    )
    .join('\n\n');

  const system = `你是「新天地」香港 SEN 游泳及多功能發展中心的寫作助理。
寫作語言：繁體中文（香港書面語習慣）。

主題範圍（必須嚴格遵守，不可偏題）：
- 全文只討論「有特殊教育需要（SEN）的學童／青少年」以及「游泳」相關內容。
- 禁止寫與 SEN／游泳無明顯關聯的議題。

硬性規則：
- 絕對禁止逐句翻譯或複製英文原文；不可出現長段外文引句。
- 必須重新組織論點，加入與「SEN 學童／家長／游泳教學現場」相關的在地化例子與實務建議。
- 標題要具體、可搜尋（避免空泛如「給家長的一些建議」）；正文第一段約 80 字內直接回答搜尋意圖。
- 正文語氣以機構教練觀點撰寫，避免提及「自動程式撰稿」或類似技術製作描述。
- 只輸出一個 JSON 物件（不要 markdown 圍欄以外的說明文字）。JSON 結構：
{
  "title": "文章標題（繁中，≤40字）",
  "description": "SEO meta 描述一句，約 70–110 字，含 SEN／游泳關鍵語",
  "keywords": ["3至6個香港家長會搜尋的關鍵字，例：SEN游水、自閉症游泳、ADHD泳池"],
  "faqs": [
    {"question":"家長會問的問題1","answer":"簡短實務回答"},
    {"question":"家長會問的問題2","answer":"簡短實務回答"}
  ],
  "bodyHtml": "文章主體 HTML 片段（只用 h2,h3,p,ul,li,strong,em；約 900–1300 字；第一個 h2 可與 title 呼應但勿重複整段）"
}`;

  const user = `以下是本週隨機選出、且已篩選為與 SEN 或游泳相關的公開 RSS 摘要（僅作靈感，請勿抄寫句子）：\n\n${refText}\n\n請依規定只輸出 JSON。`;

  const rawOut = await minimaxChat({ apiKey, base, model, system, user });
  let parsed = extractJsonPayload(rawOut);

  let titlePlain;
  let description;
  let keywords;
  let faqs;
  let bodyHtml;

  if (parsed && (parsed.bodyHtml || parsed.body_html)) {
    titlePlain = String(parsed.title || '').trim() || '本週專題：SEN 與游泳教學觀察';
    description =
      String(parsed.description || '').trim() ||
      `${titlePlain} — 新天地教練專欄每週原創文章，聚焦香港 SEN 學童游泳教學與家長實務。`;
    keywords = normalizeKeywords(parsed.keywords);
    faqs = normalizeFaqs(parsed.faqs || parsed.faq);
    bodyHtml = softenPublicArticleHtml(
      sanitizeArticleHtml(parsed.bodyHtml || parsed.body_html)
    );
  } else {
    console.error('JSON 解析失敗，回退為純 HTML 模式。');
    bodyHtml = softenPublicArticleHtml(sanitizeArticleHtml(rawOut));
    const titleMatch = bodyHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    titlePlain = titleMatch
      ? stripHtml(titleMatch[1]).slice(0, 80) || '本週專題：SEN 與游泳教學觀察'
      : '本週專題：SEN 與游泳教學觀察';
    description = `${titlePlain} — 新天地教練專欄每週原創文章，聚焦香港 SEN 學童游泳教學與家長實務。`;
    keywords = normalizeKeywords([]);
    faqs = [];
  }

  if (!bodyHtml || bodyHtml.length < 80) {
    console.error('正文過短，中止。');
    process.exit(1);
  }

  const { slug } = isoWeekInfo();
  const publishedAt = new Date().toISOString();
  const seoConfig = loadSeoConfig(root);
  const related = pickRelatedLandingPages(
    seoConfig,
    `${titlePlain} ${description} ${keywords.join(' ')} ${stripHtml(bodyHtml)}`,
    3
  );

  const page = buildStandalonePage({
    title: titlePlain,
    description,
    keywords,
    faqs,
    bodyHtml,
    refs,
    related,
    slug,
    site: seoConfig.site,
    publishedAt,
  });

  const outHtmlPath = path.join(root, slug);
  fs.writeFileSync(outHtmlPath, page, 'utf8');
  console.error('Wrote', outHtmlPath);

  let meta = { latest: null, history: [] };
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch {
    /* fresh */
  }
  const entry = {
    slug,
    title: titlePlain,
    description,
    keywords,
    faqs,
    publishedAt,
  };
  meta.latest = entry;
  meta.history = [entry, ...(meta.history || []).filter((h) => h.slug !== slug)].slice(0, 36);
  meta.note =
    '由 automation/weekly-article.mjs 於每週 workflow 成功執行後更新；latest 指向最新 HTML 檔名與標題。';
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
  console.error('Updated', metaPath);

  const pageUrl = absUrl(seoConfig.site, `/${slug}`);
  const socialCopy = [
    `【新天地教練專欄｜本週專題】`,
    titlePlain,
    '',
    description,
    '',
    pageUrl,
    '',
    `WhatsApp 查詢：https://wa.me/${String(seoConfig.site.telephone || '').replace(/\D/g, '')}`,
    '',
    '（可貼上 Google 商家檔案／WhatsApp Status／家長群組）',
  ].join('\n');
  fs.writeFileSync(socialPath, socialCopy, 'utf8');
  console.error('Updated', socialPath);
  console.error('--- social copy ---\n' + socialCopy + '\n---');

  // 輕量把本週 FAQ 合併提示寫入（不覆寫全站 FAQ，避免膨脹）
  seoConfig.site.contentLastmod = publishedAt.slice(0, 10);
  fs.writeFileSync(
    path.join(root, 'data', 'seo-config.json'),
    JSON.stringify(seoConfig, null, 2) + '\n',
    'utf8'
  );

  writeSitemap(root, seoConfig, collectWeeklyArticleUrls(root));
  writeRssFeed(root, seoConfig);
  writeLlmsTxt(root, seoConfig);
  buildSearchIndex(root);
  console.error('Updated sitemap.xml, rss.xml, llms.txt, search-index.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
