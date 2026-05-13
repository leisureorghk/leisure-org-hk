# 自動化腳本（RSS 摘要與每週專題）

此目錄由 **GitHub Actions** 或本機手動執行，用來更新：

- `../data/sen-swim-digest.json` — 每日產業資訊摘要（約 20 則）
- `../data/weekly-article-meta.json` + `../blog-weekly-*.html` — 每週參考外文公開摘要後撰寫的原創文章
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

```bash
cd automation
npm install
node build-digest.mjs
```

摘要翻譯／週報（需環境變數 `MINIMAX_API_KEY`）。若出現 **401 invalid api key** 且金鑰正確，請一併指定 API 網域（與 [MiniMax 文件](https://platform.minimax.io) 帳戶所屬端點一致）：

```bash
export MINIMAX_API_KEY="你的金鑰"
export MINIMAX_API_BASE="https://api.minimaxi.com/v1"
export MINIMAX_MODEL="MiniMax-M2.5"   # 可選，預設見腳本
node build-digest.mjs
# 或
node weekly-article.mjs
```

Windows PowerShell 範例：

```powershell
$env:MINIMAX_API_KEY="你的金鑰"
$env:MINIMAX_API_BASE="https://api.minimaxi.com/v1"
node build-digest.mjs
```

## 相關文件

專案根目錄的 [`AUTOMATION.md`](../AUTOMATION.md) 說明 GitHub Secrets、Workflow 與審核流程。
