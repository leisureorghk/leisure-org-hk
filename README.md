# 新天地 · leisure.org.hk

香港 SEN 學生游泳及多功能發展機構靜態網站（GitHub Pages → `www.leisure.org.hk`）。

## 目錄分類

| 路徑 | 用途 |
|------|------|
| `*.html`（根目錄） | **公開頁**；路徑即網址，勿隨意搬進子資料夾 |
| `css/`、`js/`、`images/` | 站內樣式、腳本、圖像 |
| `data/` | SEO、搜尋索引、摘要與週報 meta（JSON） |
| `automation/` | 內容生成、SEO、摘要／週報腳本（Node） |
| `Learn/` | 教練區教材（coach-gate，`noindex`） |
| `docs/` | 營運與設定說明（不部署到 Pages） |
| `tools/` | 本機舊檢查／同步腳本（不部署到 Pages） |

公開頁分組見 [`docs/SITE_MAP.md`](docs/SITE_MAP.md)。

## 重要提醒

- **公開 HTML 路徑不要搬家**：會改壞既有網址與 SEO。
- 自動化說明：[`docs/AUTOMATION.md`](docs/AUTOMATION.md)、[`docs/GITHUB_SETUP.md`](docs/GITHUB_SETUP.md)。
- 本機同步 GitHub：`.\tools\sync-from-github.ps1`。

## 常用指令

```powershell
cd automation
npm run generate   # 或: node generate-content-pages.mjs
node apply-seo.mjs
node build-search-index.mjs
```
