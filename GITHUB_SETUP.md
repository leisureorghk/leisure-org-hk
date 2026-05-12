# GitHub 完整設定步驟（新天地靜態站 + Actions + Pages）

我無法代替你登入 GitHub，請依下列順序在瀏覽器與終端機完成。**約 15–20 分鐘**可做完。

---

## 一、本機：安裝 Git（若尚未安裝）

- 下載：[Git for Windows](https://git-scm.com/download/win)  
- 安裝後重新開啟 PowerShell 或 Cursor 終端機。

---

## 二、在 GitHub 建立空倉庫

1. 登入 [GitHub](https://github.com)，右上角 **+** → **New repository**。  
2. **Repository name**：例如 `leisure-org-hk`（可自訂）。  
3. 選 **Public**（GitHub 免費帳戶的 Pages 與 Actions 較單純）。  
4. **不要**勾選「Add a README」等（保持空倉庫）。  
5. 建立後，複製倉庫 HTTPS 網址，例如：  
   `https://github.com/你的帳號/leisure-org-hk.git`

---

## 三、本機：首次提交並推送

在專案資料夾 `leisure_org_hk` 內開啟終端機，執行（請把 `你的帳號` 與 `leisure-org-hk` 改成實際值）：

```powershell
cd "c:\Users\Jeff Cho\Hkcompass\Communication site - 文件\AI_Project\Project\leisure_org_hk"

git init
git branch -M main
git add .
git commit -m "Initial commit: static site, RSS digest and weekly workflows"

git remote add origin https://github.com/你的帳號/leisure-org-hk.git
git push -u origin main
```

若 GitHub 要求登入，請依提示使用 **Personal Access Token（PAT）** 作為密碼（建議 scope 勾 `repo`）。  
建立 PAT：**GitHub → Settings → Developer settings → Personal access tokens**。

---

## 四、啟用 GitHub Actions 寫入權限（digest／週報會開 PR）

1. 進入倉庫 **Settings** → **Actions** → **General**。  
2. 找到 **Workflow permissions**，改選 **Read and write permissions**。  
3. 勾選 **Allow GitHub Actions to create and approve pull requests**（若介面有）。  
4. 儲存。

否則 `daily-digest`／`weekly-article` 無法建立 PR。

---

## 五、設定 Secrets（週報需要）

1. 倉庫 **Settings** → **Secrets and variables** → **Actions** → **New repository secret**。  
2. 新增：

| Name | 說明 |
|------|------|
| `MINIMAX_API_KEY` | 於 [MiniMax 平台](https://platform.minimax.io) 取得之 API Key（週報腳本使用）。 |

選填：`MINIMAX_MODEL`、`MINIMAX_API_BASE`（見根目錄 `AUTOMATION.md`）。

---

## 六、啟用 GitHub Pages（靜態網站網址）

1. **Settings** → **Pages**。  
2. **Build and deployment** → **Source** 選 **GitHub Actions**（不要選 Deploy from a branch，除非你改用手動 branch 部署）。  
3. 儲存後，到 **Actions** 分頁，手動執行一次 **Deploy GitHub Pages**（或再 `push` 到 `main` 觸發）。  
4. 完成後 Pages 網址約為：  
   `https://你的帳號.github.io/leisure-org-hk/`  
   （若倉庫名為 `username.github.io` 則網域規則不同，請依 GitHub 說明。）

**注意**：站內連結若為相對路徑（如 `css/style.css`），在子路徑 Pages 下通常可正常運作；若你改用自訂網域，再於 DNS 與 Pages 設定綁定即可。

---

## 七、確認三個 Workflows

| 檔案 | 用途 |
|------|------|
| `.github/workflows/deploy-pages.yml` | `main` 推送後部署靜態站到 Pages。 |
| `.github/workflows/daily-digest.yml` | 每日更新 `data/sen-swim-digest.json` 並開 PR。 |
| `.github/workflows/weekly-article.yml` | 每週產週報（需 `MINIMAX_API_KEY`）並開 PR。 |

在 **Actions** 可對各 workflow 按 **Run workflow** 手動測試。

---

## 八、（選用）安裝 GitHub CLI `gh`

可之後在終端機管理 PR／Secrets：

- 安裝：[GitHub CLI](https://cli.github.com/)  
- `gh auth login` 登入後，可執行例如：  
  `gh secret set MINIMAX_API_KEY`（依提示貼上金鑰）

---

## 九、合併自動化 PR 的習慣

- **digest PR**：檢查 JSON 與來源合理後合併，再觸發或等待 **Deploy GitHub Pages**，網站即更新摘要。  
- **週報 PR**：務必先閱讀 HTML 內文再合併。

更細的合規與重試說明見 [`AUTOMATION.md`](./AUTOMATION.md)。
