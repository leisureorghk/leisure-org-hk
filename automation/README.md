# 自動化腳本（RSS 摘要與每週專題）

此目錄由 **GitHub Actions** 或本機手動執行，用來更新：

- `../data/sen-swim-digest.json` — 每日產業資訊摘要（約 20 則）
- `../data/weekly-article-meta.json` + `../blog-weekly-*.html` — 每週參考外文公開摘要後撰寫的原創文章
- `../data/monthly-insights-meta.json` + `../monthly-insights-YYYY-MM.html` — 每月 28 日內容審計產出的家長月報
- `../data/monthly-audit-extras.json` — 合併進 SEN 專頁的補充 FAQ／連結
- `../data/monthly-audit-log.json` — 審計紀錄（改了哪些檔、略過哪些建議）
- `../data/sen-course-upgrade-state.json` — 教師課程升級佇列與上次執行
- `../data/sen-course-upgrade-log.json` — 每月課程升級紀錄
- `../Learn/特殊需要人士教師課程/` — 教師證書自學教材（每月逐步升級單元／可增章／教學 SVG）

## SEN 教師課程每月升級

排程與「每月內容審計」相同（每月 28 日）。腳本：

| 腳本 | 說明 |
|------|------|
| [`monthly-sen-course-upgrade.mjs`](./monthly-sen-course-upgrade.mjs) | 讀 digest → MiniMax 升級佇列中下一單元 → 備份 → 寫入 course-knowledge → 渲染 HTML → 可選 SVG → 公開 extras |
| [`render-course-unit.mjs`](./render-course-unit.mjs) | 由 `course-knowledge.json` 重渲單元 HTML／index 卡片／tts 講稿文字 |
| [`generate-course-svg.mjs`](./generate-course-svg.mjs) | 產出教學 SVG（無寫實人臉） |
| [`sen-unit-public-map.json`](./sen-unit-public-map.json) | 單元 id → 公開 `sen-*.html` 對照 |
| [`inject-coach-gate.mjs`](./inject-coach-gate.mjs) | 為 Learn HTML 注入教練分享區登入護欄（維護用） |

網上入口：根目錄 [`coach-share.html`](../coach-share.html)（教練分享區，需登入碼；`noindex`）。通過後開啟 `Learn/特殊需要人士教師課程/`。全站導覽由 `js/site-ui.js` 自動加入「教練分享區」連結。

本機（需 `MINIMAX_API_KEY`）：

```bash
cd automation
node monthly-sen-course-upgrade.mjs
# 或只重渲單元（不呼叫 AI）
node render-course-unit.mjs 4-3-safety
```

## 擴充 RSS 來源

編輯 [`feed-sources.yaml`](./feed-sources.yaml)：

| 欄位 | 說明 |
|------|------|
| `id` | 唯一識別（英數與連字號） |
| `name` | 顯示在網站上的「來源」名稱 |
| `rssUrl` | 公開 RSS 或 Atom URL |
| `language` | 語言代碼（僅供紀錄） |
| `tags` | 分類標籤（僅供紀錄／篩選擴充用） |
| `weeklyPool` | 設為 `true` 時，該來源會納入「每週專題」隨機參考池 |

**注意**：請確認目標網站允許透過 RSS 摘要與連結導流；勿轉載全文。若某 feed 失效，請移除或更換 URL。

## 本機執行

自動化排程會把新內容寫進 GitHub；本機過時請先在專案**根目錄**執行：

```powershell
.\tools\sync-from-github.ps1
```

然後才跑下列腳本。

```bash
cd automation
npm install
node build-digest.mjs
node build-search-index.mjs   # 站內搜尋索引
node apply-seo.mjs            # SEO head、sitemap、llms.txt、search-index
```

摘要翻譯／週報（需環境變數 `MINIMAX_API_KEY`）。若出現 **401 invalid api key** 且金鑰正確，請一併指定 API 網域（與 [MiniMax 文件](https://platform.minimax.io) 帳戶所屬端點一致）：

```bash
export MINIMAX_API_KEY="你的金鑰"
export MINIMAX_API_BASE="https://api.minimaxi.com/v1"
export MINIMAX_MODEL="MiniMax-M3"   # 可選，預設見腳本
node build-digest.mjs
# 或
node weekly-article.mjs
node monthly-content-audit.mjs
node monthly-sen-course-upgrade.mjs
# 可選：通知搜尋引擎（需 INDEXNOW_KEY）
export INDEXNOW_KEY="你的-uuid"
node notify-indexnow.mjs
```

Windows PowerShell 範例：

```powershell
$env:MINIMAX_API_KEY="你的金鑰"
$env:MINIMAX_API_BASE="https://api.minimaxi.com/v1"
node build-digest.mjs
```

## 相關文件

[`docs/AUTOMATION.md`](../docs/AUTOMATION.md) 說明 GitHub Secrets、Workflow 與審核流程。
