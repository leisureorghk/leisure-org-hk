# 教練分享區 — 登入碼方案（無 Firebase）

靜態 GitHub Pages：**公開資料**人人可看；**限制內容**需本會發出的登入碼（瀏覽器 `sessionStorage`）。

## 流程

1. **公開區**（`coach-share.html`）：列出入門連結；訪客可用 WhatsApp **申請登入碼**  
2. **登入**：輸入登入碼 → 進入 `coach-app/`  
3. **限制內容**：`sen-swim-classroom.html` 等深入頁會呼叫 `CoachGate.requireCoachAccess()`；未登入會導回分享區  
4. **留言**：會員區表單以 WhatsApp 傳給本會（無雲端留言板）

## 更換登入碼

1. 計算 SHA-256 hex（小寫）：

```bash
node -e "console.log(require('crypto').createHash('sha256').update('你的新登入碼','utf8').digest('hex'))"
```

2. 更新 [`js/coach-gate.js`](../js/coach-gate.js) 內的 `PASS_HASH`  
3. 推送後部署 Pages；舊 session 關閉分頁即失效

**注意：** 靜態站無法做到真正「伺服器端保密」；登入碼＋`noindex` 是降低外洩與搜尋曝光，不是軍事級防護。勿把含敏感學員資料的內容放上網。

## 公開 vs 限制

| 類型 | 例子 | 門檻 |
|------|------|------|
| 公開 | `sen-guide`、第一次課、安全、自閉症／ADHD 家長向、`resources` | 無 |
| 限制 | 課堂結構、行為、溝通、感統細節、發展路徑等 | 登入碼 |

重新產生限制頁：

```bash
node automation/generate-content-pages.mjs
```

## 與舊 Firebase 方案

已停用 Firebase Auth／Firestore／Storage。相關檔案（`functions/`、`firestore.rules` 等）可保留在倉庫但不部署。見已封存說明 [`COACH_FIREBASE.md`](./COACH_FIREBASE.md)（僅作歷史參考）。
