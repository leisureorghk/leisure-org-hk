/**
 * 產生著陸頁與獨立部落格文章 HTML 殼層（SEO 由 apply-seo.mjs 套用）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const WA =
  'https://wa.me/85297083907?text=' +
  encodeURIComponent('多謝家長的查詢（由網站著陸頁）');

function shell({ title, description, keywords, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="zh-Hant-HK">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="description" content="${description}">
    <meta name="keywords" content="${keywords}">
    <title>${title}</title>
    <link rel="icon" type="image/svg+xml" href="images/icons/app-icon.svg">
    <link rel="stylesheet" href="css/style.css?v=20260525b">
</head>
<body>
    <div class="loading" id="loading"><div class="loading-spinner"></div></div>
    <div class="nav-backdrop" id="nav-backdrop"></div>
    <header class="header" id="header">
        <div class="header-inner">
            <a href="index.html" class="logo">
                <div class="logo-icon"><img src="images/icons/logo-header.svg" alt="新天地"></div>
                <div class="logo-text">新天地<span>SEN學生游泳及多功能發展</span></div>
            </a>
            <nav class="nav" id="nav">
                <div class="nav-drawer-header">
                    <div class="logo-text">新天地<span>導航選單</span></div>
                    <button class="nav-close-btn" id="nav-close-btn" aria-label="關閉選單">×</button>
                </div>
                <div class="nav-drawer-links">
                    <a href="index.html" class="nav-link">首頁</a>
                    <a href="about.html" class="nav-link">關於我們</a>
                    <a href="services.html" class="nav-link">服務項目</a>
                    <a href="resources.html" class="nav-link">家長資源</a>
                    <a href="blog.html" class="nav-link">教練專欄</a>
                    <a href="booking.html" class="nav-link">預約課程</a>
                    <a href="contact.html" class="nav-link">聯絡我們</a>
                </div>
                <div class="nav-drawer-footer">
                    <a href="${WA}" target="_blank" rel="noopener" class="btn btn-primary">WhatsApp 查詢</a>
                </div>
            </nav>
            <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="開啟選單">☰</button>
        </div>
    </header>
    ${bodyHtml}
    <footer class="footer">
        <div class="container">
            <div class="footer-bottom">
                <p>&copy; 2026 新天地 SEN學生游泳及多功能發展中心 · <a href="sitemap.xml">網站地圖</a></p>
            </div>
        </div>
    </footer>
    <script src="js/security.js"></script>
    <script>
        const mobileMenuBtn=document.getElementById('mobile-menu-btn'),nav=document.getElementById('nav'),navBackdrop=document.getElementById('nav-backdrop'),navCloseBtn=document.getElementById('nav-close-btn');
        function openNav(){nav.classList.add('active');navBackdrop.classList.add('active');document.body.style.overflow='hidden';}
        function closeNav(){nav.classList.remove('active');navBackdrop.classList.remove('active');document.body.style.overflow='';}
        mobileMenuBtn&&mobileMenuBtn.addEventListener('click',openNav);
        navCloseBtn&&navCloseBtn.addEventListener('click',closeNav);
        navBackdrop&&navBackdrop.addEventListener('click',closeNav);
    </script>
</body>
</html>`;
}

const landings = [
  {
    file: 'sen-swim-autism.html',
    title: '自閉症游泳課程 | 新天地 — 香港 SEN 游泳',
    description:
      '香港自閉症兒童專項游泳教學：視覺提示、感官調節、小步進階。三十年 SEN 經驗，一對一或小組，WhatsApp 查詢合適班別。',
    keywords: '自閉症游泳, 自閉症游泳課程, 香港SEN游泳, 視覺提示, 感官友善游泳',
    body: `<section class="page-header"><div class="container"><h1>自閉症游泳課程（香港）</h1><p>專為自閉症譜系孩子設計的水中學習環境</p></div></section>
<section class="section"><div class="container">
<h2>為何選擇水中學習？</h2>
<p>水能提供可預測的感官輸入，許多自閉症孩子在陸地上感到過載，卻能在結構化的游泳課中建立安全感。我們使用視覺提示卡、固定流程與可預期的節奏，減少焦慮。</p>
<h2>教學重點</h2>
<ul><li>池邊適應與遊戲化入水，不強迫</li><li>視覺日程表與提示卡</li><li>情緒升溫時即時降刺激</li><li>家長可參與的溝通策略</li></ul>
<div class="text-center" style="margin-top:2rem"><a href="booking.html" class="btn btn-primary">預約試堂</a> <a href="${WA}" class="btn btn-secondary" target="_blank" rel="noopener">WhatsApp 查詢</a></div>
</div></section>`,
  },
  {
    file: 'sen-swim-adhd.html',
    title: 'ADHD 游泳專注力訓練 | 新天地 — 香港',
    description:
      'ADHD 兒童游泳課程：分段指令、即時回饋、水中專注力訓練。香港 SEN 游泳中心，由專業教練一對一或小組授課。',
    keywords: 'ADHD游泳, ADHD專注力訓練, SEN游泳香港, 特殊需要游泳',
    body: `<section class="page-header"><div class="container"><h1>ADHD 孩子學游泳</h1><p>用水中結構化活動建立專注與自我調節</p></div></section>
<section class="section"><div class="container">
<p>ADHD 孩子並非不聽話，而是需要更清晰的指令與即時回饋。我們把課堂拆成短單元，配合視覺提示與正向強化，讓孩子在水中練習「開始—專注—完成」。</p>
<h2>五個實用方向</h2>
<ol><li>每節 3–5 個小目標，完成即給具體讚賞</li><li>減少同時多指令，先口頭後示範</li><li>固定熱身流程，建立預測感</li><li>允許短暫動態休息，再回任務</li><li>與家長分享家中可延續的練習</li></ol>
<p><a href="blog-article-adhd.html">閱讀：ADHD 孩子學游泳的 5 個實用技巧</a></p>
<div class="text-center" style="margin-top:2rem"><a href="booking.html" class="btn btn-primary">預約課程</a></div>
</div></section>`,
  },
  {
    file: 'areas-hong-kong.html',
    title: '香港各區 SEN 游泳服務 | 新天地',
    description:
      '服務香港九龍、新界及港島家庭。SEN 游泳、感統與專注力課程，上課地點與班別請 WhatsApp 9708 3907 查詢。',
    keywords: '香港SEN游泳, 九龍游泳, 新界游泳, 港島游泳, 特殊需要兒童游泳',
    body: `<section class="page-header"><div class="container"><h1>服務香港各區家庭</h1><p>九龍 · 新界 · 港島 — 歡迎查詢合適上課地點</p></div></section>
<section class="section"><div class="container">
<p>新天地專注 SEN 學童游泳及多功能發展，家長可透過 WhatsApp 查詢就近班別與時間。我們會按孩子需要建議個別或小組課程。</p>
<h2>常見查詢</h2>
<ul><li>首次評估與試堂安排</li><li>交通與更衣室無障礙需要</li><li>兄弟姊妹／家長陪同政策</li></ul>
<p>詳細地址與泳池資料請<a href="contact.html">聯絡我們</a>，以便提供最新資訊。</p>
<div class="text-center" style="margin-top:2rem"><a href="${WA}" class="btn btn-primary" target="_blank" rel="noopener">WhatsApp 查詢地區與班別</a></div>
</div></section>`,
  },
];

const articles = [
  {
    file: 'blog-article-sensory.html',
    title: '水中感統訓練為何對 SEN 孩子特別有效 | 新天地',
    description: '曹柏林教練解釋水中感統訓練如何幫助 SEN 孩子調節感官、建立專注與情緒穩定。',
    keywords: '感統訓練, SEN游泳, 水中感統',
    body: `<section class="page-header"><div class="container"><h1>為什麼水中感統訓練對 SEN 孩子特別有效？</h1><p>2026年6月 · 曹柏林教練</p></div></section>
<section class="section"><div class="container article-body">
<p>水同時提供浮力、阻力和溫和壓力，對感覺統合困難的孩子來說，這是一個非常友善的訓練環境。當孩子在水中活動時，身體可得到穩定而連續的本體覺輸入，能幫助調節過高或過低的感官反應。</p>
<p>另外，水中動作節奏清晰，容易建立「預測感」，能減少焦慮。很多孩子在陸地上難以維持專注，但在水中反而更願意跟從指令。</p>
<p>建議家長把目標設定為「先穩定，再進步」：先讓孩子喜歡水、信任教練，再逐步加入技巧訓練。</p>
<p><a href="sen-swim-autism.html">了解自閉症游泳課程</a> · <a href="booking.html">預約試堂</a></p>
</div></section>`,
  },
  {
    file: 'blog-article-waiting.html',
    title: '教了三十年游泳，我學會的一件事：等待 | 新天地',
    description: '三十年 SEN 游泳教學心得：等待孩子準備好，比催促進步更重要。',
    keywords: 'SEN游泳教學, 游泳教練心得',
    body: `<section class="page-header"><div class="container"><h1>教了三十年游泳，我學會的一件事：等待</h1><p>2026年2月 · 曹柏林教練</p></div></section>
<section class="section"><div class="container article-body">
<p>年輕的時候，我總是急著看到學生進步。現在我明白了：有些孩子需要的不只是教學，他們需要的是有人願意在他們旁邊坐著，等到他們準備好的那一刻。</p>
<p>在 SEN 游泳課裡，「等」不是偷懶，而是讓孩子保留對水的正面感受——這才是能學一輩子的禮物。</p>
</div></section>`,
  },
  {
    file: 'blog-article-adhd.html',
    title: 'ADHD 孩子學游泳的 5 個實用技巧 | 新天地',
    description: '五個實用技巧協助 ADHD 孩子在游泳課建立專注、遵守流程與水中安全。',
    keywords: 'ADHD游泳, 專注力訓練, SEN游泳',
    body: `<section class="page-header"><div class="container"><h1>ADHD 孩子學游泳的 5 個實用技巧</h1><p>2025年10月 · 曹柏林教練</p></div></section>
<section class="section"><div class="container article-body">
<ol><li>短單元教學，每完成一項即具體稱讚</li><li>視覺提示卡列出課堂流程</li><li>一次一個指令，避免訊息堆疊</li><li>預留動態休息，再溫和回到任務</li><li>課後與家長溝通，延伸家中練習</li></ol>
<p><a href="sen-swim-adhd.html">ADHD 游泳專項課程</a></p>
</div></section>`,
  },
];

for (const p of [...landings, ...articles]) {
  const html = shell({
    title: p.title,
    description: p.description,
    keywords: p.keywords,
    bodyHtml: p.body,
  });
  fs.writeFileSync(path.join(root, p.file), html, 'utf8');
  console.log('Wrote', p.file);
}
