/**
 * 刷新 sitemap、rss、llms、search-index（不改 HTML head）
 */
import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadSeoConfig,
  writeLlmsTxt,
  writeSitemap,
  writeRssFeed,
  collectWeeklyArticleUrls,
} from './seo-lib.mjs';
import { buildSearchIndex } from './build-search-index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const config = loadSeoConfig(root);
writeLlmsTxt(root, config);
writeSitemap(root, config, collectWeeklyArticleUrls(root));
writeRssFeed(root, config);
const search = buildSearchIndex(root);
console.error(
  `Refreshed discovery files; search-index ${search.count} items`
);
