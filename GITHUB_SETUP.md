# GitHub 完整設定步驟（新天地靜態站 + Actions + Pages）

我無法代替你登入 GitHub，請依下列順序在瀏覽器與終端機完成。**約 15–20 分鐘**可做完。完成後，日常只要在本機改檔、`commit`、`push` 到 `main`，**Deploy GitHub Pages** 會自動更新公開站（含自訂網域，DNS 與 Pages 設定正確時）。

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

## 五、設定 Secrets（`MINIMAX_API_KEY`：每週專題必填；每日摘要若要「英→繁」也需同一筆）

你要做的是：在 GitHub **網頁**上新增一筆「倉庫密鑰」，讓週報與（選用）摘要翻譯能讀取 MiniMax 的金鑰。**路徑與你截圖相同**（Settings → Secrets and variables → **Actions** → **Secrets** 分頁 → **New repository secret**）。

### 正確填法（請對照）

1. 按 **New repository secret**。  
2. **Name（名稱）**：請**完整、逐字**輸入（大小寫一致）：

   `MINIMAX_API_KEY`

   **不要**寫成 `MINIMAX`、`minimax`、`MINIMAX_KEY` 等——名稱若不同，Actions 讀不到；週報 workflow 會略過產文，**每日摘要 workflow 也不會做英→繁翻譯**（JSON 內會維持 RSS 原文）。

3. **Secret（內容）**：貼上你在 [MiniMax 平台](https://platform.minimax.io) 複製的 **API Key**（一整串字元）。  
4. 按 **Add secret** 儲存。

若你已新增名稱為 **`MINIMAX`** 的那一筆：請在列表中**刪除**它，再依上表**重新新增**一筆，**Name** 必須是 **`MINIMAX_API_KEY`**。

### 選填（可不設）

| Name | 說明 |
|------|------|
| `MINIMAX_MODEL` | 不設則腳本用預設模型 `MiniMax-M3`。 |
| `MINIMAX_API_BASE` | 不設則用 `https://api.minimax.io`。若需 **`https://api.minimaxi.com/v1`**（國內／另一線路），請設為該字串（可含結尾 `/v1`）。 |

### 若出現 `401`／`invalid api key`（錯誤碼 **2049**）

代表 MiniMax **不承認**目前送出的金鑰，請依序檢查：

1. **金鑰種類**：在 [MiniMax 平台](https://platform.minimax.io) → **帳戶／API Keys**（或「介面金鑰」）複製 **API Key**（常見為 **`sk-` 開頭**）。若你拿到的是 **`ey` 開頭的 JWT**，多半不能當作本專案用的 Bearer Key，請改建立或選用 **sk-** 類型。  
2. **完整貼上**：不要缺字、前後不要多空格；PowerShell 建議 `$env:MINIMAX_API_KEY = '貼上整串'`（單引號可避免 `$` 被解讀）。  
3. **不要重複加 `Bearer`**：程式已會加上 `Bearer`，環境變數裡**只放金鑰本身**。  
4. **端點**：預設 `https://api.minimax.io`。若平台給的是 **`https://api.minimaxi.com/v1`**，請設 **`MINIMAX_API_BASE`** 為該網址（專案會自動接上 `chat/completions`，不會變成 `/v1/v1/`）。  
5. **帳戶狀態**：金鑰已撤銷、過期或餘額不足時，也可能出現類似訊息；請在平台確認。

詳見根目錄 [`AUTOMATION.md`](./AUTOMATION.md)。

---

## 六、啟用 GitHub Pages（靜態網站網址）— 詳細步驟

本專案已內建 [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)：每次 **`main` 分支有新推送**時，會把倉庫**根目錄**的靜態檔（`index.html`、`css/`、`data/` 等）打包上傳到 **GitHub Pages**。因此 Pages 的「來源」要選 **GitHub Actions**，而不是「從某個 branch 資料夾直接發布」。

以下除啟用步驟、自訂網域與常見問題外，並含**部署完成後**的站內維護備忘（CSS 快取字串、預約入口與對外用語）。

### 步驟 A：在 Settings 裡指定用 Actions 建置

1. 打開你的 GitHub **倉庫**（不是個人帳號總覽）。  
2. 點頂部選單 **Settings**（設定）。  
3. 左側選單往下找 **Pages**（頁面）。  
4. 在 **Build and deployment**（建置與部署）區塊：  
   - **Source**（來源）下拉選單：選 **GitHub Actions**。  
   - 若原本是 **Deploy from a branch**，請改成 **GitHub Actions**（與本專案 workflow 設計一致）。  
5. 若頁面有 **Save**（儲存）按鈕，請按一下儲存。（有時變更會自動生效，視介面版本而定。）

### 步驟 B：觸發第一次部署

GitHub 要知道用哪個 workflow 來「建 Pages」。第一次請**手動跑一次**：

1. 點倉庫頂部 **Actions**。  
2. 左側列表點 **Deploy GitHub Pages**（名稱須與 `.github/workflows/deploy-pages.yml` 裡的 `name:` 一致）。  
3. 右側點 **Run workflow** → 確認分支為 **`main`** → 再按綠色 **Run workflow**。  
4. 等約 1–3 分鐘，點入該次執行記錄：全部步驟打綠勾即成功。若失敗，點進紅色步驟查看 **log** 錯誤訊息。

之後只要有人 **`git push` 到 `main`**，同一個 workflow 會**自動再部署**，不必每次手動（除非你想立刻重跑）。

### 步驟 C：查看網站網址

1. 再回到 **Settings** → **Pages**。  
2. 成功後，頁面上方或 **Build and deployment** 附近會出現類似 **「Your site is live at …」** 的綠色提示，裡面就是公開網址。  
3. 一般格式為：

   `https://<你的-GitHub-使用者名稱>.github.io/<倉庫名稱>/`

   例：使用者名 `jeffcho`、倉庫名 `leisure-org-hk` →  
   `https://jeffcho.github.io/leisure-org-hk/`

4. **特別情況**：若倉庫名稱剛好是 `<使用者名>.github.io`，網址規則會變成使用者頁（根網域），請依 [GitHub 官方說明：GitHub Pages 類型](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#types-of-github-pages-sites) 對照。

### 與站內連結的關係

- 本站多用**相對路徑**（例如 `css/style.css`、`data/sen-swim-digest.json`），在 `https://使用者.github.io/倉庫名/` 這種**子路徑**底下，瀏覽器會自動對應到正確檔案，**通常不必改 HTML**。  
- 若日後改用**自訂網域**（例如 `www.leisure.org.hk`），需在網域商設定 **DNS**（如 `CNAME` 或 `A` 記錄），並在 **Settings → Pages → Custom domain** 填寫網域；GitHub 會引導 HTTPS 憑證申請。
- 本倉庫根目錄已含 **`CNAME`** 檔（內容為 `www.leisure.org.hk`），與 GitHub Pages 官方建議一致；部署後請仍須在 **Pages** 設定中確認自訂網域與 **Enforce HTTPS**（憑證就緒後才可勾選）。

### 部署後維護：CSS `?v=`、預約與對外用語

以下不影響 Actions 是否部署成功，但常解釋「為何訪客仍看到舊樣式或舊文案」。

**CSS 快取（`?v=`）**  
多個 HTML 以 `css/style.css?v=…` 查詢字串避免瀏覽器長期快取舊 CSS。若**只修改** [`css/style.css`](./css/style.css) 而沒有更新各頁 `<link>` 上的版本參數，部分訪客可能仍看到舊版面。建議在**較大樣式變更**時，**統一**將各頁（含 [`automation/weekly-article.mjs`](./automation/weekly-article.mjs) 產文模板若有用到）的 `?v=` 改成新後綴，再一併提交並 `push`。

**預約與 WhatsApp**  
- **網上表單**：[根目錄 `booking.html`](./booking.html)（導覽列「預約課程」）；送出後會組好訊息並以 **WhatsApp** 開啟對話。  
- **主要轉換**：首頁與多數內頁以 **WhatsApp** 為主按鈕，表單為輔助路徑。

**對外用語**  
全站行銷與 CTA 已統一為「**預約合適課程**」，**不再**使用「免費試堂」作為承諾或按鈕主文案。若日後調整說法，請同步檢查 `index.html`、`booking.html`、`services.html`、`contact.html` 及頁尾 CTA 區塊。收費與優惠以各頁實際文字為準。

### 自訂網域出現 Firefox「HSTS／憑證錯誤」或 `SEC_E_WRONG_PRINCIPAL`

代表瀏覽器收到的 **TLS 憑證主體與網址不符**。常見情況是 DNS 已指向 GitHub Pages，但 **尚未在「實際發佈 Pages 的倉庫」完成自訂網域綁定**，邊緣節點仍回傳 **`*.github.io`** 預設憑證。

請依序檢查（皆在**負責部署本站**的 GitHub 倉庫操作）：

1. **Settings → Pages → Custom domain** 填寫 **`www.leisure.org.hk`**，儲存後等待 **DNS 檢查** 通過（綠勾）。  
2. **網域商 DNS**：`www` 使用 **CNAME** 指向 **`<你的-GitHub-使用者名稱>.github.io`**（專案站亦用此格式；勿指向舊 FTP 主機）。  
3. 憑證由 GitHub 簽發，**需數分鐘至數小時**；就緒後再勾選 **Enforce HTTPS**。  
4. 確認 **`main` 已含根目錄 `CNAME` 檔**（與上方自訂網域一致），並已成功跑過 **Deploy GitHub Pages**。  
5. 若曾用錯誤憑證測試，Firefox 可至 `about:networking#dns` 或清除該站 **HSTS** 快取後再試（根本修復仍須憑證正確）。

### GitHub 顯示「NotServedByPagesError」／`leisure.org.hk is improperly configured`

代表你在 **Settings → Pages → Custom domain** 填的是 **頂層網域**（`leisure.org.hk`，沒有 `www`），但 **DNS 的 `@`（apex）尚未指向 GitHub Pages**。僅把 `www` 設成 CNAME **不夠**，GitHub 檢查頂層時仍會失敗。

請擇一處理：

**做法一（建議與本站 `CNAME` 檔一致）：只用 `www` 當自訂網域**

1. Pages 的 **Custom domain** 改填 **`www.leisure.org.hk`**（不要填 `leisure.org.hk`），儲存。  
2. 網域商保留 **`www` → CNAME → `<使用者名>.github.io`**。  
3. 頂層 `leisure.org.hk` 若要導向 `www`，在網域商加 **URL 轉址／轉址規則**（若有），或之後再補 apex 的 A 記錄後改回頂層為主網域。

**做法二：要讓 `leisure.org.hk`（頂層）直接開 GitHub Pages**

在網域商為 **`@`（或主機名留空、代表 apex）** 新增 **四筆 `A` 記錄**，值分別為（與 [GitHub 官方文件](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain) 一致）：

| 類型 | 名稱 | 值 |
|------|------|-----|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

- 若網域商支援 **ALIAS／ANAME／Flattening**，也可把 `@` 指到 **`<使用者名>.github.io`**（依該商介面說明）。  
- 刪除或改掉仍指向 **舊主機／FTP／停車頁** 的 `@` 記錄，否則永遠不會通過檢查。  
- DNS 傳播可能 **數分鐘至 24 小時**；完成後回到 GitHub **Save** 或重新整理 Pages，直到綠勾出現。

**以 Actions 部署時**：官方說明指出 **不必**依賴倉庫內的 `CNAME` 檔也能設自訂網域；但 **`Custom domain` 欄位填的網址**必須與你實際要給訪客使用的 **DNS 記錄**一致（`www` 用 CNAME；`apex` 用 A 或 ALIAS）。

Windows 本機可粗查 apex 是否已指到 GitHub：

```powershell
Resolve-DnsName leisure.org.hk -Type A
```

若回傳的 IPv4 為上表四個之一（或輪詢到其中幾個），再回 GitHub 重試儲存自訂網域。

### 常見問題

| 情況 | 可檢查 |
|------|--------|
| Actions 顯示成功但網址 404 | 等 1–5 分鐘再重新整理；或確認 Pages **Source** 仍是 **GitHub Actions**。 |
| **`NotServedByPagesError`／頂層網域未指向 Pages** | 見上一節；`leisure.org.hk` 須為 `@` 設四筆 GitHub **A** 記錄（或 ALIAS 至 **`<使用者名>.github.io`**），或改只用 **`www.leisure.org.hk`** 為 Custom domain。 |
| **HTTPS 錯誤、憑證顯示 `*.github.io`** | 見上一節「自訂網域出現 Firefox HSTS…」；完成 Pages 自訂網域與 `CNAME` 檔後重新部署。 |
| 沒有出現 **Deploy GitHub Pages** | 確認 `main` 上已有 `.github/workflows/deploy-pages.yml` 並已 push。 |
| 只想用 branch 發布、不用 Actions | 須另改部署方式；與本專案目前文件不一致，不建議混用除非你知道差異。 |
| **Annotations 仍出現「Node.js 20…checkout@v4」等** | 警告內若仍寫 **v4／v5 舊版 action**，代表 GitHub 跑的是**舊提交**：請在本機 `git pull`／確認已 **`git push` 到 `main`**，再開**最新一次** workflow run；舊 run 的警告不會消失。亦可到倉庫網頁打開 `.github/workflows/deploy-pages.yml` 確認是否已為 `checkout@v6`、`deploy-pages@v5` 等。 |

---

## 七、確認三個 Workflows

| 檔案 | 用途 |
|------|------|
| `.github/workflows/deploy-pages.yml` | `main` 推送後部署靜態站到 Pages。 |
| `.github/workflows/daily-digest.yml` | 每日更新 `data/sen-swim-digest.json` 並 push、部署 Pages。 |
| `.github/workflows/weekly-article.yml` | 每週產週報（需 `MINIMAX_API_KEY`）並 push、部署 Pages。 |

在 **Actions** 可對各 workflow 按 **Run workflow** 手動測試。

---

## 八、（選用）安裝 GitHub CLI `gh`

可之後在終端機管理 PR／Secrets：

- 安裝：[GitHub CLI](https://cli.github.com/)  
- `gh auth login` 登入後，可執行例如：  
  `gh secret set MINIMAX_API_KEY`（依提示貼上金鑰）

---

## 九、自動化內容如何出現在網站

- **每日游泳／SEN 摘要**（`data/sen-swim-digest.json`）：`daily-digest` workflow 會 push 到 `main` 並**自動部署 GitHub Pages**（`www.leisure.org.hk`）。
- **每週專題文章**（曹教練專欄）：`weekly-article` workflow 成功後會 push `blog-weekly-*.html` 與 `data/weekly-article-meta.json` 至 `main`，並自動部署 Pages。
- 若曾累積未合併的舊 **digest PR**（例如 #1），可關閉即可，與現行流程無關。
- **Google 商家檔案（本地搜尋）**：見 [`GOOGLE_BUSINESS_PROFILE.md`](./GOOGLE_BUSINESS_PROFILE.md)。
- **GA4**：在 [`data/site-public.json`](./data/site-public.json) 填入 `ga4MeasurementId` 後 push，即可追蹤 WhatsApp 等轉化。

更細的合規與重試說明見 [`AUTOMATION.md`](./AUTOMATION.md)。

---

## 十、本機日常更新與同步（請記錄此流程）

### 重點：本機改檔**不會**自動上 GitHub

你在電腦（本機）用編輯器改 `index.html`、`css/style.css` 等，**儲存後不會**自動同步到 GitHub，也**不會**自動更新公開網址（例如 `https://leisureorghk.github.io/leisure-org-hk/`）。

必須執行 **Git 提交 + 推送到 `main`**，GitHub 才會收到新版本；推送後 **Deploy GitHub Pages** 會自動再部署，數分鐘內網站才會跟新。

### 每次本機改完網站後（建議照做）

在專案資料夾 `leisure_org_hk` 開啟終端機：

```powershell
cd "c:\Users\Jeff Cho\Hkcompass\Communication site - 文件\AI_Project\Project\leisure_org_hk"

git status
git add .
git commit -m "說明本次修改（例如：更新聯絡電話或統一 css/style.css 的 ?v= 版本）"
git push origin main
```

- `git status`：確認有哪些檔案被改動。  
- `git add .`：把變更加入本次提交（若有不想提交的檔案，可改為只 `git add` 指定路徑）。  
- `git commit`：建立一個版本紀錄。  
- `git push origin main`：上傳到 GitHub 的 **main** 分支。

推送成功後，到倉庫 **Actions** 可看到 **Deploy GitHub Pages** 自動執行；完成後重新整理 Pages 網址即可看到更新。

### 若 GitHub 上曾有「自動化 PR」（digest／週報）

他人或 Actions 在 GitHub 上合併了 PR 後，**遠端 `main` 會比你本機新**。下次在本機開工前建議先：

```powershell
git pull origin main
```

再開始編輯，可減少之後 `push` 時的合併衝突。

### 官網更新方式

`www.leisure.org.hk` 已指向 **GitHub Pages**，只需 **`git push origin main`** 或由 Actions 自動 push，即會透過 **Deploy GitHub Pages** 上線；**無需 FTP 上傳**。
