# Google 商家檔案（Google Business Profile）設定指引

此為**營運步驟**（非程式自動化），可提升本地搜尋曝光與地圖顯示。

## 建立或认领商家

1. 前往 [Google Business Profile](https://business.google.com/)
2. 商家名稱建議：**新天地 SEN學生游泳及多功能發展中心**（與官網一致）
3. 類別建議：游泳學校、特殊教育學校、兒童游泳課程（可選多個）
4. 網站：`https://www.leisure.org.hk`
5. 電話：**9708 3907**（與官網一致）
6. WhatsApp：與官網相同號碼

## 地址與服務範圍

- 若有多個上課泳池：在商家檔案說明欄註明「上課地點因班別而異，請先 WhatsApp 查詢」
- 服務範圍：香港（九龍、新界、港島）
- 官網結構化資料已含 `geo` 與 `hasMap`（見 `data/seo-config.json`）；有**確定主要泳池地址**時請更新該檔並執行 `npm run seo`

## 內容營運（引流）

- 每週發佈 1 則貼文：連結最新 `blog-weekly-*.html` 或教練專欄
- 自動化產出建議文案：合併週報後可直接複製 [`data/weekly-social-copy.txt`](data/weekly-social-copy.txt)（標題＋一句＋網址）貼到商家檔案／WhatsApp Status
- 上傳課堂／中心照片（需家長授權）
- 鼓勵滿意家長在 Google 留下**真實**評價（勿捏造評分）

## 與 Search Console 配合

- Search Console 已驗證後，提交 `https://www.leisure.org.hk/sitemap.xml`
- 可另於 Bing [Webmaster Tools](https://www.bing.com/webmasters) 匯入或驗證同一網站

## GA4 轉化追蹤

在 `data/site-public.json` 填入 `ga4MeasurementId`（格式 `G-XXXXXXXXXX`），推送後全站會追蹤 WhatsApp 點擊等事件。
