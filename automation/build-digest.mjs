/**
 * 讀取 feed-sources.yaml，抓取各 RSS，合併去重後輸出 data/sen-swim-digest.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import Parser from 'rss-parser';

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
    });
  }
  return items;
}

async function main() {
  const raw = fs.readFileSync(yamlPath, 'utf8');
  const doc = yaml.load(raw);
  const settings = doc.settings || {};
  const digestMaxItems = settings.digestMaxItems ?? 20;
  const maxItemsPerSource = settings.maxItemsPerSource ?? 4;
  const timeoutMs = settings.requestTimeoutMs ?? 22000;
  const sources = Array.isArray(doc.sources) ? doc.sources : [];

  const parser = new Parser({
    timeout: timeoutMs,
    headers: { 'User-Agent': 'LeisureOrgHK-digest-bot/1.0 (+https://www.leisure.org.hk)' },
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
    const u = normalizeUrl(it.url);
    if (seenUrl.has(u)) continue;
    const c = perSource[it.sourceId] || 0;
    if (c >= maxItemsPerSource) continue;
    seenUrl.add(u);
    perSource[it.sourceId] = c + 1;
    picked.push({ ...it, url: u });
    if (picked.length >= digestMaxItems) break;
  }

  const out = {
    updatedAt: new Date().toISOString(),
    disclaimer:
      '本摘要由公開 RSS 自動彙整，僅列出標題與短摘要並連結至原文；版權歸各來源網站所有。',
    items: picked,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.error(`Wrote ${picked.length} items -> ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
