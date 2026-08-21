/**
 * IndexNow：通知 Bing 等搜尋引擎有 URL 更新。
 *
 * 環境變數：
 *   INDEXNOW_KEY（必填）— 與根目錄 {key}.txt 內容相同
 *   INDEXNOW_HOST（可選，預設 www.leisure.org.hk）
 *   INDEXNOW_URLS（可選，逗號分隔；未設則從 sitemap + 最新週報推斷）
 *
 * 執行：node automation/notify-indexnow.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadSeoConfig, collectWeeklyArticleUrls, absUrl } from './seo-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function ensureKeyFile(rootDir, key, host) {
  const file = path.join(rootDir, `${key}.txt`);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, key, 'utf8');
    console.error('Wrote key file', file);
  }
  // IndexNow 也接受 https://{host}/{key}.txt
  void host;
  return file;
}

function collectDefaultUrls(rootDir) {
  const config = loadSeoConfig(rootDir);
  const base = config.site.baseUrl.replace(/\/$/, '');
  const urls = [
    `${base}/`,
    `${base}/blog.html`,
    `${base}/sitemap.xml`,
    `${base}/llms.txt`,
  ];
  for (const w of collectWeeklyArticleUrls(rootDir).slice(0, 5)) {
    urls.push(w.loc);
  }
  const metaPath = path.join(rootDir, 'data', 'weekly-article-meta.json');
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    if (meta.latest?.slug) urls.push(absUrl(config.site, `/${meta.latest.slug}`));
  }
  return [...new Set(urls)];
}

async function main() {
  const key = (process.env.INDEXNOW_KEY || '').trim();
  if (!key) {
    console.error('INDEXNOW_KEY 未設定：略過 IndexNow 通知。');
    process.exit(0);
  }

  const config = loadSeoConfig(root);
  const host = (process.env.INDEXNOW_HOST || new URL(config.site.baseUrl).host).replace(
    /^https?:\/\//,
    ''
  );
  ensureKeyFile(root, key, host);

  let urlList =
    process.env.INDEXNOW_URLS &&
    process.env.INDEXNOW_URLS.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  if (!urlList || !urlList.length) urlList = collectDefaultUrls(root);

  const payload = {
    host,
    key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList: urlList.slice(0, 100),
  };

  console.error('IndexNow notify', payload.urlList.length, 'urls →', host);

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => '');
  if (res.status === 200 || res.status === 202) {
    console.error('IndexNow OK', res.status, text.slice(0, 200));
    process.exit(0);
  }
  // 已提交過／無新變更等亦常為 200；其他錯誤不讓 workflow 整段失敗
  console.error('IndexNow response', res.status, text.slice(0, 500));
  if (res.status >= 500) process.exit(1);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
