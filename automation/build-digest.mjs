/**
 * 讀取 feed-sources.yaml，抓取各 RSS，合併去重後輸出 data/sen-swim-digest.json。
 * 僅收錄與 SEN／游泳相關之項目；若設 MINIMAX_API_KEY，標題與摘要譯為繁體中文（香港書面語）。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import Parser from 'rss-parser';
import {
  minimaxChat,
  normalizeMinimaxApiKey,
  minimaxApiKeySanityHint,
  stripMinimaxMessageContent,
} from './minimax-chat.mjs';
import { isSenOrSwimRelevant } from './sen-swim-relevance.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const yamlPath = path.join(__dirname, 'feed-sources.yaml');
const outPath = path.join(root, 'data', 'sen-swim-digest.json');

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 360);
}

/** 自 RSS／HTML 擷取較長純文字供全文翻譯（不含 script/style） */
function extractPlainFromHtml(html, maxLen) {
  const cap = Math.min(Math.max(maxLen || 12000, 2000), 50000);
  let t = String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  if (t.length > cap) t = `${t.slice(0, cap)}\n\n（以下節錄；完整內容請見「閱讀原文」）`;
  return t;
}

/** 自 HTML 擷取圖片網址（絕對化）；略過 data: */
function extractImagesFromHtml(html, baseUrl, maxN) {
  const n = Math.min(Math.max(maxN || 8, 1), 20);
  const out = [];
  const re = /<img\b[^>]*>/gi;
  let m;
  while ((m = re.exec(String(html || ''))) && out.length < n) {
    const tag = m[0];
    const sm = tag.match(/\ssrc\s*=\s*["']([^"']+)["']/i) || tag.match(/\ssrc\s*=\s*([^\s>]+)/i);
    const am = tag.match(/\salt\s*=\s*["']([^"']*)["']/i);
    if (!sm) continue;
    let src = String(sm[1] || '').trim();
    if (!src || src.startsWith('data:')) continue;
    try {
      src = new URL(src, baseUrl).href;
    } catch {
      continue;
    }
    if (!/^https?:\/\//i.test(src)) continue;
    const alt = am ? String(am[1] || '').trim() : '';
    if (out.some((x) => x.src === src)) continue;
    out.push({ src, alt });
  }
  return out;
}

/** 自 RSS item 取最長的 HTML 片段（含 content:encoded 等欄位） */
function pickRssContentHtml(it) {
  const parts = [];
  for (const k of Object.keys(it || {})) {
    const v = it[k];
    if (typeof v !== 'string' || !v.trim()) continue;
    if (/<[a-z][\s\S]*>/i.test(v)) parts.push(v.trim());
  }
  const also = [
    it.content,
    it.contentEncoded,
    it['content:encoded'],
    it.description,
    it.summary,
  ]
    .map((x) => String(x || '').trim())
    .filter(Boolean);
  parts.push(...also);
  if (!parts.length) return '';
  return parts.reduce((a, b) => (b.length > a.length ? b : a), '');
}

function normalizeUrl(u) {
  try {
    const x = new URL(String(u).trim());
    x.hash = '';
    let p = x.pathname;
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    x.pathname = p || '/';
    return x.href;
  } catch {
    return String(u || '').trim();
  }
}

function parseDateMs(item) {
  const raw = item.pubDate || item.isoDate || item.date || (item['dc:date'] ?? '');
  const t = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function toIso(ms) {
  if (!ms) return null;
  try {
    return new Date(ms).toISOString();
  } catch {
    return null;
  }
}

function looseJsonParse(s) {
  let t = String(s || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/m, '')
    .trim()
    .replace(/,\s*]/g, ']')
    .replace(/,\s*}/g, '}');
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(t.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function extractJsonArray(text) {
  const raw = String(text || '').trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1].trim() : raw;
  const start = body.indexOf('[');
  const end = body.lastIndexOf(']');
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(body.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** 從模型輸出取出與輸入等長的 {title,summary}[] */
function extractTranslatedRows(text, expectedLen) {
  const cleaned = String(text || '').trim();
  const obj = looseJsonParse(cleaned);
  if (obj && typeof obj === 'object' && Array.isArray(obj.rows)) {
    if (obj.rows.length >= expectedLen) return obj.rows.slice(0, expectedLen);
  }
  const arr = extractJsonArray(cleaned);
  if (arr && arr.length >= expectedLen) return arr.slice(0, expectedLen);
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateDigestOneItem(it, { apiKey, base, model }) {
  const system = `你是繁體中文（香港）翻譯。只輸出一個 JSON 物件，僅含鍵 title、summary；不要 markdown、不要其它字。
將下列英文標題與摘要譯為繁體中文；summary 壓縮在 280 個中文字以內；專有名詞可保留英文。`;
  const user = JSON.stringify({
    title: (it.title || '').slice(0, 500),
    summary: (it.summary || '').slice(0, 900),
  });
  const raw = await minimaxChat({
    apiKey,
    base,
    model,
    system,
    user,
    temperature: 0.2,
    max_completion_tokens: 2048,
  });
  const obj = looseJsonParse(raw);
  if (!obj || typeof obj !== 'object') return it;
  const title = String(obj.title || '').trim();
  const summary = String(obj.summary || '').trim();
  return {
    ...it,
    ...(title ? { title } : {}),
    ...(summary ? { summary } : {}),
  };
}

/**
 * 分批呼叫 MiniMax，將 title／summary 譯為繁中；批次 JSON 失敗則改逐筆。
 */
async function translateDigestItems(items, { apiKey, base, model }) {
  if (!items.length) return items;
  const batchSize = 5;
  const out = [...items];
  const ctx = { apiKey, base, model };

  for (let off = 0; off < items.length; off += batchSize) {
    const slice = items.slice(off, off + batchSize);
    const payload = slice.map((it) => ({
      title: (it.title || '').slice(0, 500),
      summary: (it.summary || '').slice(0, 900),
    }));
    const n = payload.length;

    const system = `你是繁體中文（香港）翻譯助理。只輸出一個 JSON 物件，不要 markdown、不要前言。
格式嚴格如下（rows 陣列長度必須為 ${n}，順序與輸入相同）：
{"rows":[{"title":"…","summary":"…"}, … 共 ${n} 個元素]}
每個 title、summary 為對應輸入的繁體中文譯文；summary 請壓縮在 280 個中文字以內。`;

    const user = `請翻譯下列 in 陣列（長度 ${n}），輸出符合上述格式的 JSON：\n${JSON.stringify({ in: payload })}`;

    let batchOk = false;
    try {
      const raw = await minimaxChat({
        apiKey,
        base,
        model,
        system,
        user,
        temperature: 0.25,
        max_completion_tokens: 8192,
      });
      const rows = extractTranslatedRows(raw, n);
      if (rows && rows.length === n) {
        batchOk = true;
        for (let j = 0; j < n; j++) {
          const t = String(rows[j]?.title || '').trim();
          const sum = String(rows[j]?.summary || '').trim();
          if (t) out[off + j] = { ...out[off + j], title: t };
          if (sum) out[off + j] = { ...out[off + j], summary: sum };
        }
      } else {
        console.error(`translate batch: 無法解析或長度不符（期望 ${n}）`);
      }
    } catch (e) {
      console.error('translate batch:', e.message || e);
    }

    if (!batchOk) {
      console.error(`translate: 改逐筆翻譯第 ${off + 1}–${off + n} 則`);
      for (let j = 0; j < slice.length; j++) {
        try {
          out[off + j] = await translateDigestOneItem(out[off + j], ctx);
        } catch (e) {
          console.error('translate one:', e.message || e);
        }
        await sleep(350);
      }
    }
  }

  return out;
}

/**
 * 將 RSS 全文純文字譯為繁中（香港書面語），供 digest 詳情頁。
 */
async function translateBodyToZh(plain, { apiKey, base, model }) {
  const chunk = String(plain || '').trim();
  if (!chunk || chunk.length < 80) return '';
  const system = `你是繁體中文（香港）翻譯。只輸出一個 JSON 物件，僅含鍵 bodyZh；不要 markdown、不要其它字。
bodyZh 為譯文正文：段落之間用兩個換行 \\n\\n 分隔；保留數字、專有名詞可夾英文；總長建議在 6000 個中文字以內，可節譯次要細節但保留主論點與結論。`;
  const user = `請翻譯以下英文／多語正文為繁體中文（香港書面語）：\n\n${chunk.slice(0, 14000)}`;
  try {
    const raw = await minimaxChat({
      apiKey,
      base,
      model,
      system,
      user,
      temperature: 0.25,
      max_completion_tokens: 12000,
    });
    const obj = looseJsonParse(stripMinimaxMessageContent(raw));
    if (!obj || typeof obj !== 'object') return '';
    const bodyZh = String(obj.bodyZh || '').trim();
    return bodyZh;
  } catch (e) {
    console.error('translateBodyToZh:', e.message || e);
    return '';
  }
}

/** 抓取文章頁 HTML（節錄），供圖片／長文擷取；失敗回傳空字串 */
async function tryFetchArticlePageHtml(url, timeoutMs) {
  const u = String(url || '').trim();
  if (!/^https?:\/\//i.test(u)) return '';
  const ms = Math.min(Math.max(Number(timeoutMs) || 9000, 3000), 30000);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(u, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'LeisureOrgHK-digest-bot/1.0 (+https://www.leisure.org.hk)',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!r.ok) return '';
    const ct = r.headers.get('content-type') || '';
    if (!/html/i.test(ct)) return '';
    const raw = await r.text();
    return raw.slice(0, 450000);
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}
/** 附加圖片列表；有 API 金鑰時為前 N 則附加全文繁中 bodyZh；必要時抓取文章頁 HTML */
async function enrichDigestItemsWithDetail(items, {
  apiKey,
  base,
  model,
  detailMax,
  plainMaxChars,
  tryFetchArticlePage,
  fetchArticleTimeoutMs,
}) {
  const maxIdx = Math.max(0, Number(detailMax) || 0);
  const out = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    let html = String(it.contentHtml || '').trim();
    const { contentHtml: _drop, ...rest } = it;

    if (tryFetchArticlePage && it.url) {
      const short = html.length < 2200 || !/<img\b/i.test(html);
      if (short) {
        const fetched = await tryFetchArticlePageHtml(it.url, fetchArticleTimeoutMs);
        if (fetched.length > html.length) html = fetched;
        await sleep(320);
      }
    }

    const images = extractImagesFromHtml(html, it.url, 10);
    const plain = extractPlainFromHtml(html, plainMaxChars);
    let bodyZh = '';
    if (apiKey && i < maxIdx && plain.length > 400) {
      console.error(`translate body ${i + 1}/${items.length} (${String(it.url || '').slice(0, 60)}…)`);
      bodyZh = await translateBodyToZh(plain, { apiKey, base, model });
      await sleep(450);
    }
    out.push({
      ...rest,
      ...(images.length ? { images } : {}),
      ...(bodyZh ? { bodyZh } : {}),
    });
  }
  return out;
}

async function fetchFeed(parser, src, timeoutMs) {
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error('timeout')), timeoutMs)
  );
  const parse = parser.parseURL(src.rssUrl);
  const feed = await Promise.race([parse, timeout]);
  const items = [];
  for (const it of feed.items || []) {
    const link = it.link || it.guid;
    if (!link) continue;
    items.push({
      title: (it.title || '（無標題）').trim(),
      url: normalizeUrl(link),
      publishedAt: toIso(parseDateMs(it)),
      summary: stripHtml(it.contentSnippet || it.summary || it.description || ''),
      sourceName: src.name,
      sourceId: src.id,
      contentHtml: pickRssContentHtml(it).slice(0, 200000),
    });
  }
  return items;
}

async function main() {
  const apiKey = normalizeMinimaxApiKey(process.env.MINIMAX_API_KEY);
  const model = process.env.MINIMAX_MODEL || 'MiniMax-M2.5';
  const base = process.env.MINIMAX_API_BASE || 'https://api.minimax.io';

  const keyHint = minimaxApiKeySanityHint(apiKey);
  if (keyHint) console.error('MiniMax 金鑰提醒：', keyHint);

  const raw = fs.readFileSync(yamlPath, 'utf8');
  const doc = yaml.load(raw);
  const settings = doc.settings || {};
  const digestMaxItems = settings.digestMaxItems ?? 20;
  const maxItemsPerSource = settings.maxItemsPerSource ?? 4;
  const timeoutMs = settings.requestTimeoutMs ?? 22000;
  const digestDetailTranslateMax = settings.digestDetailTranslateMax ?? 12;
  const digestBodyPlainMaxChars = settings.digestBodyPlainMaxChars ?? 12000;
  const digestTryFetchArticlePage = settings.digestTryFetchArticlePage !== false;
  const digestFetchArticleTimeoutMs = settings.digestFetchArticleTimeoutMs ?? 9000;
  const sources = Array.isArray(doc.sources) ? doc.sources : [];

  const parser = new Parser({
    timeout: timeoutMs,
    headers: { 'User-Agent': 'LeisureOrgHK-digest-bot/1.0 (+https://www.leisure.org.hk)' },
    customFields: {
      item: [['content:encoded', 'contentEncoded']],
    },
  });

  const all = [];
  for (const src of sources) {
    if (!src?.rssUrl || !src?.id || !src?.name) continue;
    try {
      const rows = await fetchFeed(parser, src, timeoutMs);
      all.push(...rows);
      console.error(`OK ${src.id}: ${rows.length} items`);
    } catch (e) {
      console.error(`FAIL ${src.id}:`, e.message || e);
    }
  }

  all.sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });

  const seenUrl = new Set();
  const picked = [];
  const perSource = {};

  for (const it of all) {
    const blob = `${it.title || ''} ${it.summary || ''}`;
    if (!isSenOrSwimRelevant(blob)) continue;
    const u = normalizeUrl(it.url);
    if (seenUrl.has(u)) continue;
    const c = perSource[it.sourceId] || 0;
    if (c >= maxItemsPerSource) continue;
    seenUrl.add(u);
    perSource[it.sourceId] = c + 1;
    picked.push({ ...it, url: u });
    if (picked.length >= digestMaxItems) break;
  }

  let items = picked;
  if (apiKey && items.length) {
    console.error('Translating digest via Minimax...');
    items = await translateDigestItems(items, { apiKey, base, model });
  } else if (!apiKey) {
    console.error('MINIMAX_API_KEY 未設定：摘要維持 RSS 原文語言。');
  }

  items = await enrichDigestItemsWithDetail(items, {
    apiKey,
    base,
    model,
    detailMax: digestDetailTranslateMax,
    plainMaxChars: digestBodyPlainMaxChars,
    tryFetchArticlePage: digestTryFetchArticlePage,
    fetchArticleTimeoutMs: digestFetchArticleTimeoutMs,
  });

  const out = {
    updatedAt: new Date().toISOString(),
    disclaimer: apiKey
      ? '僅收錄與 SEN／游泳相關之公開 RSS 項目；標題與摘要經 API 譯為繁中；詳情頁「全文」係自 RSS 內嵌 HTML 擷取並譯為繁中（可能節錄），圖片連結指向原站；請以「閱讀原文」核對內容與版權歸屬。'
      : '僅收錄與 SEN／游泳相關之公開 RSS 項目；標題與摘要為各來源原文。設定 MINIMAX_API_KEY 後可由排程譯為繁中；詳情頁可顯示 RSS 內嵌圖片（若有）。',
    items,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.error(`Wrote ${items.length} items -> ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
