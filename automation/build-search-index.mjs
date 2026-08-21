/**
 * 產出 data/search-index.json：靜態頁、固定專欄、週報、產業摘要（供站內搜尋）。
 * 執行：node automation/build-search-index.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadSeoConfig, collectWeeklyArticleUrls, absUrl } from './seo-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outPath = path.join(root, 'data', 'search-index.json');

function pushItem(items, seen, entry) {
  const key = entry.path || entry.url;
  if (!key || seen.has(key)) return;
  seen.add(key);
  items.push(entry);
}

export function buildSearchIndex(rootDir = root) {
  const config = loadSeoConfig(rootDir);
  const { site, pages } = config;
  const items = [];
  const seen = new Set();
  const builtAt = new Date().toISOString();

  for (const p of pages) {
    if ((p.robots || '').includes('noindex')) continue;
    const type = p.file?.startsWith('blog-article-')
      ? 'article'
      : p.ogType === 'article'
        ? 'article'
        : 'page';
    pushItem(items, seen, {
      type,
      path: p.path === '/' ? '/' : p.path.replace(/^\//, '') || p.file,
      url: absUrl(site, p.path),
      title: (p.title || '').replace(/\s*\|\s*新天地.*$/, '').trim() || p.title,
      description: p.description || '',
      keywords: p.keywords || '',
    });
  }

  const metaPath = path.join(rootDir, 'data', 'weekly-article-meta.json');
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const list = [...(meta.history || []), ...(meta.latest ? [meta.latest] : [])];
    for (const e of list) {
      if (!e?.slug) continue;
      pushItem(items, seen, {
        type: 'weekly',
        path: e.slug,
        url: absUrl(site, `/${e.slug}`),
        title: e.title || '每週專題',
        description: e.description || `${e.title} — 新天地教練專欄每週專題`,
        keywords: (e.keywords || []).join?.(', ') || e.keywords || 'SEN游泳, 教練專欄',
        publishedAt: e.publishedAt,
      });
    }
  }

  for (const w of collectWeeklyArticleUrls(rootDir)) {
    const slug = w.loc.replace(site.baseUrl.replace(/\/$/, '') + '/', '');
    if (!slug || seen.has(slug) || seen.has('/' + slug)) continue;
    pushItem(items, seen, {
      type: 'weekly',
      path: slug,
      url: w.loc,
      title: slug.replace(/^blog-weekly-|\.html$/g, ' ').trim(),
      description: '新天地教練專欄每週專題',
      keywords: 'SEN游泳, 教練專欄',
      publishedAt: w.lastmod,
    });
  }

  const digestPath = path.join(rootDir, 'data', 'sen-swim-digest.json');
  if (fs.existsSync(digestPath)) {
    const digest = JSON.parse(fs.readFileSync(digestPath, 'utf8'));
    for (const it of digest.items || []) {
      if (!it?.url) continue;
      pushItem(items, seen, {
        type: 'digest',
        path: `digest-article.html?u=${encodeURIComponent(it.url)}`,
        url: absUrl(site, `/digest-article.html?u=${encodeURIComponent(it.url)}`),
        title: it.title || '',
        description: it.summary || '',
        keywords: [it.sourceName, 'SEN游泳', '產業摘要'].filter(Boolean).join(', '),
        publishedAt: it.publishedAt,
        featured: !!it.featured,
        externalUrl: it.url,
      });
    }
  }

  const payload = {
    builtAt,
    count: items.length,
    items,
  };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'data', 'search-index.json'), JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  const payload = buildSearchIndex(root);
  console.error(`Wrote ${payload.count} items -> data/search-index.json`);
}
