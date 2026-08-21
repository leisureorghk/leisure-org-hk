/**
 * 依 data/seo-config.json 更新全站 head SEO 標籤、JSON-LD 與 sitemap.xml
 * 執行：node automation/apply-seo.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadSeoConfig,
  renderSeoHead,
  renderHeadJsonLd,
  renderFooterLocalBusiness,
  injectSeoHead,
  injectHeadJsonLd,
  updateTitleAndMeta,
  replaceFooterJsonLd,
  writeSitemap,
  writeRssFeed,
  writeLlmsTxt,
  collectWeeklyArticleUrls,
  optimizeFontLinks,
  injectSiteScripts,
} from './seo-lib.mjs';
import { buildSearchIndex } from './build-search-index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function applyPage(site, page, config) {
  const filePath = path.join(root, page.file);
  if (!fs.existsSync(filePath)) {
    console.warn('Skip missing:', page.file);
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  if (page.robots) {
    html = html.replace(/<meta name="robots"[^>]*>\s*/gi, '');
  }
  html = updateTitleAndMeta(html, page);
  html = injectSeoHead(html, renderSeoHead(site, page));
  html = injectHeadJsonLd(html, renderHeadJsonLd(site, page, config));

  const schemas = page.schemas || [];
  if (schemas.includes('localBusiness')) {
    html = replaceFooterJsonLd(html, renderFooterLocalBusiness(site));
  }

  html = optimizeFontLinks(html);
  html = injectSiteScripts(html);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log('Updated', page.file);
}

const config = loadSeoConfig(root);
for (const page of config.pages) {
  applyPage(config.site, page, config);
}

const weeklyUrls = collectWeeklyArticleUrls(root);
writeSitemap(root, config, weeklyUrls);
writeRssFeed(root, config);
writeLlmsTxt(root, config);
const search = buildSearchIndex(root);
console.log(
  'Updated sitemap.xml + rss.xml + llms.txt (%d indexed + %d weekly); search-index %d items',
  config.pages.filter((p) => !(p.robots || '').includes('noindex')).length,
  weeklyUrls.length,
  search.count
);
