# 自動化與 GitHub Actions 說明

## 這份文件在講什麼？

**`AUTOMATION.md` 只負責兩件事：**（1）要在 GitHub 哪裡填哪些 **Secrets**；（2）兩個排程（每日摘要、每週專題）各自做什麼、合併 PR 時要注意什麼。

**第一次把專案放上 GitHub**（建立倉庫、`git push`、開 Pages、開 Actions 寫入權限）請先看 **[GITHUB_SETUP.md](./GITHUB_SETUP.md)**，那份才是「從零到網站上線」的完整步驟。`AUTOMATION.md` 假設你**已經**有 GitHub 倉庫，只是要開自動化。

---

## 你要設定的其實只有這幾步（對照做即可）

1. **（若還沒做）** 依 `GITHUB_SETUP.md` 開好倉庫，並在 **Settings → Actions → General** 把 **Workflow permissions** 設成可寫入、允許建立 PR，否則下面的排程無法幫你開 Pull Request。
2. **（可選，但建議）** 打開瀏覽器 → 你的倉庫 → **Settings** → 左欄 **Secrets and variables** → **Actions** → **New repository secret**。
3. **若只要「每日產業摘要」且標題／摘要維持 RSS 原文語言**：**不必**新增任何 Secret；排程仍會跑，會開 PR 更新 `data/sen-swim-digest.json`（合併後網站才會看到新摘要）。
4. **若要「每週專題文章」或「摘要英→繁」**：新增一筆 Secret，**Name** 填 `MINIMAX_API_KEY`，**Secret** 貼上你在 MiniMax 平台複製的金鑰；存檔即可。`daily-digest` 與 `weekly-article` 會共用此金鑰（摘要翻譯與週報撰寫）。其餘 `MINIMAX_MODEL`、`MINIMAX_API_BASE` **可不填**（用預設即可）。**若本機或 Actions 出現 `401 invalid api key`，金鑰已確認無誤時**，請再新增 Secret **`MINIMAX_API_BASE`**，值設為 **`https://api.minimaxi.com/v1`**（與本機 PowerShell `$env:MINIMAX_API_BASE` 相同效果）。
5. 到倉庫 **Actions** 分頁，可手動點 **Run workflow** 測試 **Daily digest** 或 **Weekly featured article**，成功後會出現 **Pull Request**，你（或同事）在 GitHub 上 **Merge** 後，再依 `GITHUB_SETUP.md` 讓網站重新部署，讀者才會看到更新。

---

**本機改完如何同步到 GitHub Pages**：見 [`GITHUB_SETUP.md`](./GITHUB_SETUP.md) **第十節**。

## Repository secrets（在 GitHub 網頁上設定）

在 GitHub 倉庫 **Settings → Secrets and variables → Actions** 新增：

| Secret | 必填 | 說明 |
|--------|------|------|
| `MINIMAX_API_KEY` | 週報必填；**摘要若要英→繁亦必填**（同一筆） | [MiniMax 平台](https://platform.minimax.io) 取得之 API Key；Bearer 驗證。 |
| `MINIMAX_MODEL` | 否 | 預設為 `MiniMax-M3`；可改為文件支援之其他模型。 |
| `MINIMAX_API_BASE` | 否 | 預設 `https://api.minimax.io`。部分帳戶／地區需改為 **`https://api.minimaxi.com/v1`** 才能通過驗證（否則可能出現 **401 invalid api key**）；設為此值時腳本會正確接上 `chat/completions`。 |
| `INDEXNOW_KEY` | 否（建議） | [IndexNow](https://www.indexnow.org/) 金鑰（UUID 或任意字串）。**GitHub Secret 與網站根目錄 `{金鑰}.txt` 必須相同**；digest／週報 workflow 會用此金鑰通知 Bing 等引擎。 |

未設定 `MINIMAX_API_KEY` 時，`automation/weekly-article.mjs` 會**安靜結束**（exit 0），不會更新週報檔案；週期 workflow 仍會成功，但不會產生可合併的變更。`build-digest.mjs` 則不會翻譯，摘要 JSON 內標題／摘要維持 RSS 原文。

**官網部署（GitHub Pages）**：`www.leisure.org.hk` 已 CNAME 指向 `leisureorghk.github.io` 時，digest／週報 workflow 會在 push 後**自動部署 Pages**。若內容仍舊，請到 Actions 手動執行 **Deploy GitHub Pages** 或 **Daily RSS digest**（`workflow_dispatch` 會強制重新部署）。

## Workflows

| 檔案 | 排程 | 說明 |
|------|------|------|
| [`.github/workflows/daily-digest.yml`](.github/workflows/daily-digest.yml) | 每日 UTC 01:00（約香港 09:00） | 執行 `automation/build-digest.mjs`，更新 [`data/sen-swim-digest.json`](data/sen-swim-digest.json)、搜尋索引／llms／sitemap，可選 IndexNow，**直接 commit 並 push 到 `main`**（觸發 Pages 部署；無需手動合併 PR）。 |
| [`.github/workflows/weekly-article.yml`](.github/workflows/weekly-article.yml) | 每週一 UTC 03:00（約香港 11:00） | 執行 `automation/weekly-article.mjs`，成功後 **直接 push 到 `main`**（含 `blog-weekly-*.html`、sitemap、rss、llms、社群文案、IndexNow），並部署 Pages。建議發布前快速閱讀週報文稿。 |
| [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) | `main` push；digest／週報成功後 | GitHub Pages 部署至 `www.leisure.org.hk`。 |

digest 與週報 workflow 皆支援 **Actions 手動執行**（`workflow_dispatch`）。

## 審核與合規建議

1. **每日 digest**：已自動 push 至 `main` 並部署 Pages；若需抽查，可在 Actions 日誌或 `data/sen-swim-digest.json` 的 `updatedAt` 確認。
2. **每週專題**：務必由機構負責人閱讀全文；頁面已含「非抄襲／參考來源」聲明，仍可能有事實錯誤。
3. **著作權**：摘要僅使用 RSS 之標題與短描述並連結至原文；站內不轉載全文。週報為模型依摘要**改寫與在地化**之文稿，文末列出參考連結。

## 本機執行

見 [`automation/README.md`](automation/README.md)。

## 失敗重試

- RSS 單一來源失敗時，`build-digest.mjs` 會記錄於 log 並繼續其他來源。
- MiniMax 請求失敗時 `weekly-article.mjs` 以 **exit 1** 結束，該次 workflow 顯示失敗，可於 Actions 介面重跑。
- MiniMax 出現 **`401`／`invalid api key`** 而金鑰種類與複製內容已確認正確時：本機設 `$env:MINIMAX_API_BASE="https://api.minimaxi.com/v1"`（或 bash `export …`）後重跑；GitHub 則新增 Repository secret **`MINIMAX_API_BASE`** 同上值，再 **Re-run workflow**。
