/**
 * 從 weeklyPool 來源隨機挑選 RSS 摘要，呼叫 MiniMax 文字生成 API（JSON／REST），
 * 產出繁中原創 HTML 文章與 weekly-article-meta.json。
 *
 * 環境變數：
 *   MINIMAX_API_KEY（必填才會產出週報 HTML）
 *   MINIMAX_MODEL（預設 MiniMax-M2.5）
 *   MINIMAX_API_BASE（預設 https://api.minimax.io；可設 https://api.minimaxi.com/v1）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import Parser from 'rss-parser';
import { minimaxChat } from './minimax-chat.mjs';
import { isSenOrSwimRelevant } from './sen-swim-relevance.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const yamlPath = path.join(__dirname, 'feed-sources.yaml');
const metaPath = path.join(root, 'data', 'weekly-article-meta.json');

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

function buildStandalonePage({ title, bodyHtml, refs, slug }) {
  const esc = (s) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const refBlock = refs
    .map(
      (r) =>
        `<li><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>（${esc(r.sourceName)}）</li>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="zh-HK">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} | 新天地</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="images/icons/app-icon.svg">
  <link rel="stylesheet" href="css/style.css?v=20260512f">
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
    .weekly-ai-refs { margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid var(--gray-mist); }
    .weekly-ai-refs h2 { font-size: 1.1rem; margin-bottom: 0.5rem; }
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
    <div class="weekly-ai-banner">
      <strong>聲明：</strong>本篇依多個公開 RSS 摘要與連結作為靈感參考，由撰寫流程輔助以繁體中文重新組織與改寫，主題<strong>僅限 SEN 學童／青少年與游泳教學實務</strong>，<strong>非原文翻譯或抄襲</strong>。內容可能仍有疏漏，請讀者自行查證原文；發布前建議由機構負責人審閱。
    </div>
    <div class="weekly-ai-body">
      <article>
        ${bodyHtml}
      </article>
      <section class="weekly-ai-refs">
        <h2>參考靈感來源（公開連結）</h2>
        <ul>${refBlock}</ul>
      </section>
    </div>
    <p style="margin-top:2rem;"><a href="blog.html" class="btn btn-primary">返回教練專欄</a></p>
  </main>
</body>
</html>`;
}

async function main() {
  const apiKey = process.env.MINIMAX_API_KEY;
  const model = process.env.MINIMAX_MODEL || 'MiniMax-M2.5';
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
- 全文只討論「有特殊教育需要（SEN）的學童／青少年」以及「游泳」相關內容，例如：水中適應、泳姿學習節奏、安全感、小組／個別化安排、家長溝通、教練策略、泳池環境與安全、與 SEN 常見特質（如感官、專注、焦慮）在「游泳課」情境下的連結。
- 禁止寫與 SEN／游泳無明顯關聯的議題（例如：一般成人健身減重、無關的傳染病新聞、泛泛的國際政治經濟、純學科升學策略等）。若參考摘要偏離主題，請忽略該部分，仍只圍繞 SEN＋游泳寫作。

硬性規則：
- 絕對禁止逐句翻譯或複製英文原文；不可出現長段外文引句。
- 必須重新組織論點，加入與「SEN 學童／家長／游泳教學現場」相關的在地化例子與實務建議（可合理虛構教學情境，但不可捏造醫療或法規「新聞」）。
- 輸出格式：僅輸出「文章主體」的 HTML 片段，不要 <!DOCTYPE> 或 <html> 包裹。
- 只可使用標籤：h2, h3, p, ul, li, strong, em。不要使用 markdown。
- 篇幅約 900–1300 字（中文）。
- 正文語氣以機構教練觀點撰寫，避免提及「自動程式撰稿」或類似技術製作描述。`;

  const user = `以下是本週隨機選出、且已篩選為與 SEN 或游泳相關的公開 RSS 摘要（僅作靈感，請勿抄寫句子）：\n\n${refText}\n\n請撰寫一篇獨立文章，協助家長與教練，且全文必須只圍繞 SEN 與游泳（含水中安全與教學實務）；不要引入與游泳無關的長篇醫療或新聞敘述。`;

  const rawHtml = await minimaxChat({ apiKey, base, model, system, user });
  const bodyHtml = softenPublicArticleHtml(sanitizeArticleHtml(rawHtml));

  const titleMatch = bodyHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  const titlePlain = titleMatch
    ? stripHtml(titleMatch[1]).slice(0, 80) || '本週專題：SEN 與游泳教學觀察'
    : '本週專題：SEN 與游泳教學觀察';

  const { slug } = isoWeekInfo();
  const outHtmlPath = path.join(root, slug);
  const page = buildStandalonePage({
    title: titlePlain,
    bodyHtml,
    refs,
    slug,
  });

  fs.writeFileSync(outHtmlPath, page, 'utf8');
  console.error('Wrote', outHtmlPath);

  const publishedAt = new Date().toISOString();
  let meta = { latest: null, history: [] };
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch {
    /* fresh */
  }
  const entry = { slug, title: titlePlain, publishedAt };
  meta.latest = entry;
  meta.history = [entry, ...(meta.history || []).filter((h) => h.slug !== slug)].slice(0, 36);
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
  console.error('Updated', metaPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
