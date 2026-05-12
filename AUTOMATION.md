# 自動化與 GitHub Actions 說明

首次建立 Git 遠端倉庫、啟用 Pages、Actions 權限與推送流程，請見 **[GITHUB_SETUP.md](./GITHUB_SETUP.md)**。

本專案透過 **GitHub Actions** 每日彙整公開 RSS 摘要，以及每週（可選）使用 **MiniMax API** 產出原創繁中週報 HTML。

## Repository secrets

在 GitHub 倉庫 **Settings → Secrets and variables → Actions** 新增：

| Secret | 必填 | 說明 |
|--------|------|------|
| `MINIMAX_API_KEY` | 週報功能必填 | [MiniMax 平台](https://platform.minimax.io) 取得之 API Key；Bearer 驗證。 |
| `MINIMAX_MODEL` | 否 | 預設為 `MiniMax-M2.5`；可改為文件支援之其他模型。 |
| `MINIMAX_API_BASE` | 否 | 預設 `https://api.minimax.io`；自架代理時可覆寫。 |

未設定 `MINIMAX_API_KEY` 時，`automation/weekly-article.mjs` 會**安靜結束**（exit 0），不會更新週報檔案；週期 workflow 仍會成功，但不會產生可合併的變更。

## Workflows

| 檔案 | 排程 | 說明 |
|------|------|------|
| [`.github/workflows/daily-digest.yml`](.github/workflows/daily-digest.yml) | 每日 UTC 01:00（約香港 09:00） | 執行 `automation/build-digest.mjs`，更新 [`data/sen-swim-digest.json`](data/sen-swim-digest.json)，並以 **Pull Request** 提交（預設分支 `automated/digest-update`）。 |
| [`.github/workflows/weekly-article.yml`](.github/workflows/weekly-article.yml) | 每週一 UTC 03:00（約香港 11:00） | 執行 `automation/weekly-article.mjs`；若有變更則開 PR `automated/weekly-article`。 |

兩者皆支援 **Actions 手動執行**（`workflow_dispatch`）。

## 審核與合規建議

1. **每日 digest PR**：快速檢查 JSON 內來源與連結是否正常即可合併。
2. **每週專題 PR**：務必由機構負責人閱讀全文；頁面已含「非抄襲／參考來源」聲明，仍可能有事實錯誤。
3. **著作權**：摘要僅使用 RSS 之標題與短描述並連結至原文；站內不轉載全文。週報為模型依摘要**改寫與在地化**之文稿，文末列出參考連結。

## 本機執行

見 [`automation/README.md`](automation/README.md)。

## 失敗重試

- RSS 單一來源失敗時，`build-digest.mjs` 會記錄於 log 並繼續其他來源。
- MiniMax 請求失敗時 `weekly-article.mjs` 以 **exit 1** 結束，該次 workflow 顯示失敗，可於 Actions 介面重跑。
