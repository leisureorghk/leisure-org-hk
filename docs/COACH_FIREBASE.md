# 教練會員區（Firebase）設定 — Spark 免費方案

公開站（GitHub Pages）只放家長入門與轉址殼；深入教材與留言需 Firebase 會員登入。

## 為什麼用免費方案（Spark）

| 項目 | Spark（免費） | Blaze（按量付費） |
|------|---------------|-------------------|
| Authentication（電郵／密碼） | ✅ | ✅ |
| Firestore／Storage（有額度） | ✅ | ✅ |
| Cloud Functions | ❌ 不可用 | ✅ |
| 自訂 Token（姓名＋電話＋登入碼） | ❌ 需 Functions | ✅ |

**建議：** 會員人數不多時用 **Spark + 電郵／密碼** 即可。日後要自動審批、自訂登入碼再升級 Blaze。

免費額度大致夠用（教練數十人、教材與留言量中等）；Storage 媒體請控制檔案大小（規則已限 50MB）。

## 1. 建立專案（維持 Spark，不要升級 Blaze）

1. 到 [Firebase Console](https://console.firebase.google.com/) 建立專案（選 **Spark／免費用量**）
2. 啟用 **Authentication** → 登入方式開啟 **Email/Password**
3. 建立 **Cloud Firestore**（生產模式亦可，稍後部署本 repo 的 rules）
4. 建立 **Storage**
5. 註冊 **Web App**，把設定貼到 [`js/firebase-config.js`](../js/firebase-config.js)（取代所有 `REPLACE_ME`）  
   或複製為本機 [`js/firebase-config.local.js`](../js/firebase-config.local.js)（已 gitignore）再於頁面先載入

## 2. 部署規則（不部署 Functions）

```bash
npm install -g firebase-tools
firebase login
copy .firebaserc.example .firebaserc
# 編輯 .firebaserc 填入專案 ID
firebase use <your-project-id>
firebase deploy --only firestore:rules,storage
```

`functions/` 資料夾保留給日後 Blaze 選用，**Spark 請勿** `firebase deploy --only functions`。

## 3. 新增一位教練（手動，免費）

1. Console → **Authentication** → **Add user**  
   - 電郵：例如 `coach.chen@example.com`（可用教練私人電郵）  
   - 密碼：暫訂後用 WhatsApp 告知，請對方登入後自行在裝置記住  
2. 複製該使用者的 **User UID**
3. Console → **Firestore** → 集合 `coaches` → 文件 ID = 該 **UID**，欄位：

| 欄位 | 類型 | 說明 |
|------|------|------|
| `active` | boolean | 必須 `true` 才可進會員區 |
| `name` | string | 顯示名稱 |
| `email` | string | 與 Auth 電郵一致（方便管理） |
| `note` | string | 可選備註 |

範例見 [`data/coaches.example.json`](../data/coaches.example.json)。批量可用：

```bash
# 需 GOOGLE_APPLICATION_CREDENTIALS=服務帳戶 JSON（本機腳本，不需 Blaze）
node automation/upload-coaches.mjs path/to/coaches.json
```

停用教練：把 `active` 改 `false`，或刪 Auth 使用者。

## 4. 上傳深入教材到 Firestore

```bash
node automation/generate-content-pages.mjs
node automation/export-coach-content.mjs
node automation/upload-coach-content.mjs   # 需 Admin SDK 服務帳戶
```

集合：`coachContent/{slug}`，欄位含 `title`、`bodyHtml`。  
Admin SDK 本機上傳**不需要** Blaze。

## 5. 前台頁面

| 頁 | 用途 |
|----|------|
| `coach-share.html` | 公開招募（WhatsApp）＋電郵／密碼登入 |
| `coach-app/index.html` | 會員區：教材、留言、媒體 |

權限判斷：`coaches/{uid}.active == true`（見 `firestore.rules`／`storage.rules`）。

## 6. Pages 防護

[`deploy-pages.yml`](../.github/workflows/deploy-pages.yml) 會：

- 排除 `Learn/`、`private/`、`functions/`、`data/coach-content`
- 強制深入 `sen-swim-*.html` 為轉址殼

未登入無法從公開站讀取全文。

## 7. 驗收清單（Spark）

- [ ] `firebase-config.js` 已填真實專案
- [ ] Auth 已開 Email/Password
- [ ] 已 `deploy` firestore／storage rules
- [ ] 測試教練：Auth 使用者 + `coaches/{uid}` 且 `active: true`
- [ ] 錯誤密碼 → 拒絕；無 `coaches` 文件 → 拒絕
- [ ] 正確登入 → 進入 `coach-app`，可讀 `coachContent`、發文、上載
- [ ] 公開站 `sen-swim-classroom.html` 僅見轉址提示

## 8. 日後若升級 Blaze（可選）

可再啟用 `functions/verifyCoachAccess`（姓名＋電話＋登入碼 → Custom Token）。目前前台已改為電郵登入；升級時需另改回表單與 claims，見 `functions/index.js`。
