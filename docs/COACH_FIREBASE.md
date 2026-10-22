# 教練會員區（Firebase）設定

公開站（GitHub Pages）只放家長入門與轉址殼；深入教材與留言需 Firebase 會員登入。

## 1. 建立專案

1. 到 [Firebase Console](https://console.firebase.google.com/) 建立專案  
2. 啟用 **Authentication** → 登入方式可先關閉 Email；我們用 **Custom Token**（由 Functions 簽發）  
3. 建立 **Firestore**、**Storage**  
4. 升級 **Blaze** 方案（Cloud Functions 需要）  
5. 註冊 Web App，把設定貼到 [`js/firebase-config.js`](../js/firebase-config.js)（取代 `REPLACE_ME`）

## 2. 部署規則與 Functions

```bash
npm install -g firebase-tools
firebase login
copy .firebaserc.example .firebaserc
# 編輯 .firebaserc 填入專案 ID
firebase use <your-project-id>
cd functions && npm install && cd ..
firebase deploy --only firestore:rules,storage,functions
```

設定登入碼雜湊（與舊 `coach-gate` 相同算法：UTF-8 字串的 SHA-256 hex）：

```bash
# PowerShell 範例：計算雜湊後寫入參數
node -e "console.log(require('crypto').createHash('sha256').update('你的登入碼','utf8').digest('hex'))"
firebase functions:secrets:set COACH_ACCESS_CODE_HASH
# 或使用 params：部署時依提示填入 defineString('COACH_ACCESS_CODE_HASH')
```

若使用 `defineString`，部署後到 Console → Functions → 參數設定 `COACH_ACCESS_CODE_HASH`。

## 3. 核准名單（allowlist）

文件 ID = 電話 E.164 去掉 `+`（例如 `85297083907`）。

欄位：

| 欄位 | 說明 |
|------|------|
| `name` | 必須與登入表單姓名完全一致（去頭尾空白） |
| `active` | `true`／`false` |
| `note` | 可選備註 |

範例格式見 [`data/allowlist.example.json`](../data/allowlist.example.json)。可用 Console 手動加，或：

```bash
# 需 GOOGLE_APPLICATION_CREDENTIALS=服務帳戶 JSON
node automation/upload-allowlist.mjs path/to/allowlist.json
```

## 4. 上傳深入教材到 Firestore

```bash
node automation/generate-content-pages.mjs   # 深入全文 → private/coach-html + 根目錄轉址殼
node automation/export-coach-content.mjs    # → data/coach-content/*.json
node automation/upload-coach-content.mjs    # 需 Admin SDK
```

集合：`coachContent/{slug}`，欄位含 `title`、`bodyHtml`。

## 5. 前台頁面

| 頁 | 用途 |
|----|------|
| `coach-share.html` | 公開招募（WhatsApp）＋姓名／電話／登入碼 |
| `coach-app/index.html` | 會員區：教材、留言、媒體 |

## 6. Pages 防護

[`deploy-pages.yml`](../.github/workflows/deploy-pages.yml) 會：

- 排除 `Learn/`、`private/`、`functions/`、`data/coach-content`  
- 強制深入 `sen-swim-*.html` 為轉址殼  

未登入無法從公開站讀取全文。

## 7. 驗收清單

- [ ] `firebase-config.js` 已填真實專案  
- [ ] Functions `verifyCoachAccess` 可呼叫  
- [ ] allowlist 至少一名測試教練  
- [ ] 錯碼／名單外 → 拒絕  
- [ ] 正確登入 → 進入 `coach-app`，可讀 `coachContent`、發文、上載  
- [ ] 公開站 `sen-swim-classroom.html` 僅見轉址提示  
