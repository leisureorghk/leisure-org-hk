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

const DISCLAIMER = `<p class="digest-intro" style="margin:1.25rem 0 0;padding:0.85rem 1rem;background:rgba(30,87,153,0.06);border-radius:10px;font-size:0.9rem;line-height:1.7"><strong>溫馨提示：</strong>本頁為家長教育整理，供認識特殊需要與游泳教學方向參考，<strong>並非醫療診斷或治療建議</strong>。孩子個別安排請 WhatsApp 與教練商討。</p>`;

const CTA = (extra = '') => `<div class="text-center" style="margin-top:2rem">
<a href="booking.html" class="btn btn-primary">預約試堂</a>
<a href="${WA}" class="btn btn-secondary" target="_blank" rel="noopener">WhatsApp 查詢</a>
${extra}
</div>`;

/** 學習配圖：頂圖 16:9 */
const learnHero = (file, alt, caption) => `<div class="learn-hero"><figure>
<img src="images/learn/${file}" alt="${alt}" width="960" height="540" loading="lazy" decoding="async">
<figcaption>${caption}</figcaption>
</figure></div>`;

/** 學習配圖：中段示意 */
const learnFigure = (file, alt, caption) => `<figure class="learn-figure">
<img src="images/learn/${file}" alt="${alt}" width="720" height="405" loading="lazy" decoding="async">
<figcaption>${caption}</figcaption>
</figure>`;

const cardThumb = (file, alt) =>
  `<img class="learn-card-thumb" src="images/learn/${file}" alt="${alt}" width="480" height="360" loading="lazy" decoding="async">`;

function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadLandingExtras() {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'data', 'monthly-audit-extras.json'), 'utf8'));
  } catch {
    return { landings: {} };
  }
}

function renderLandingExtras(file) {
  const e = loadLandingExtras().landings?.[file];
  if (!e) return '';
  const faqs = Array.isArray(e.faqs) ? e.faqs.filter((x) => x.q && x.a).slice(0, 4) : [];
  const links = Array.isArray(e.links)
    ? e.links.filter((x) => x.href && x.label && /^[a-z0-9][-a-z0-9]*\.html(?:[?#].*)?$/i.test(x.href)).slice(0, 6)
    : [];
  if (!faqs.length && !links.length) return '';
  let html =
    '<section class="weekly-faq monthly-audit-extras" data-monthly-audit="1"><h2>家長補充問答</h2>';
  for (const f of faqs) {
    html += `<h3>${escHtml(f.q)}</h3><p>${escHtml(f.a)}</p>`;
  }
  if (links.length) {
    html += `<p>延伸閱讀：${links
      .map((l) => `<a href="${escHtml(l.href)}">${escHtml(l.label)}</a>`)
      .join(' · ')}</p>`;
  }
  html += '</section>';
  return html;
}

function attachExtras(file, body) {
  const block = renderLandingExtras(file);
  if (!block) return body;
  const cta = '<div class="text-center" style="margin-top:2rem">';
  const i = body.lastIndexOf(cta);
  if (i >= 0) return body.slice(0, i) + block + '\n' + body.slice(i);
  return body + block;
}

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
    <link rel="stylesheet" href="css/style.css?v=20260914a">
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
                <p>&copy; 2026 新天地 SEN學生游泳及多功能發展中心 · <a href="sitemap.xml">網站地圖</a> · <a href="sen-guide.html">認識特殊需要</a></p>
            </div>
        </div>
    </footer>
    <script src="js/site-ui.js?v=20260827b" defer></script>
    <script src="js/share.js?v=20260827a" defer></script>
    <script src="js/analytics.js?v=20260525a" defer></script>
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
    file: 'sen-guide.html',
    title: '認識特殊需要與 SEN 游泳 | 新天地',
    description:
      '認識香港特殊教育需要（SEN）與游泳教學：支援系統、運動發展，以及肢體、感官、智力障礙與唐氏綜合症的水中學習方向。',
    keywords: 'SEN游泳, 特殊需要游泳, 香港SEN, 特殊教育需要, 新天地',
    body: `<section class="page-header"><div class="container"><h1>認識特殊需要與 SEN 游泳</h1><p>從認識孩子的需要開始，再到水中安全學習</p></div></section>
${learnHero('hero-sen-guide.webp', '共融插畫：香港泳池邊，教練歡迎多樣特殊需要兒童學游泳', 'SEN 游泳總覽：以尊嚴與共融方式認識不同需要')}
<section class="section"><div class="container">
<p>每一位孩子的學習節奏都不同。新天地以游泳及多功能發展為核心，陪伴自閉症、ADHD、肢體／感官障礙、智力障礙、唐氏綜合症等家庭，用可預期的流程與個別化安排，讓孩子在水中建立安全感與自信。我們相信特殊需要不是「污名」，而是需要被理解與適切支援的個別差異。</p>
${DISCLAIMER}
<div class="features-grid" style="margin-top:2rem">
  <div class="card">${cardThumb('card-support.webp', '香港支援系統示意插畫')}<h3><a href="sen-support-hk.html">香港支援系統</a></h3><p>認識特殊需要的基本概念，以及教育、社福等本地支援如何與游泳課銜接。</p></div>
  <div class="card">${cardThumb('card-development.webp', '特殊需要游泳運動發展示意')}<h3><a href="sen-swim-development.html">游泳運動發展</a></h3><p>帕運與香港殘疾／智障體育協會、普及游泳與精英培訓的脈絡。</p></div>
  <div class="card">${cardThumb('card-physical.webp', '肢體與感官游泳支援示意')}<h3><a href="sen-swim-physical.html">肢體・視覺・聽力</a></h3><p>泳池安全、溝通方式與教學調整，讓感官與肢體需要的孩子也能下水。</p></div>
  <div class="card">${cardThumb('card-intellectual.webp', '智力及多重障礙游泳示意')}<h3><a href="sen-swim-intellectual.html">智力及多重障礙</a></h3><p>分步、重複與安全意識：適合智力障礙及多重需要的水中學習節奏。</p></div>
  <div class="card">${cardThumb('card-down.webp', '唐氏綜合症游泳示意')}<h3><a href="sen-swim-down-syndrome.html">唐氏綜合症</a></h3><p>肌張力、健康注意與循序漸進的游泳課設計重點。</p></div>
  <div class="card">${cardThumb('card-autism.webp', '自閉症游泳視覺提示示意')}<h3><a href="sen-swim-autism.html">自閉症游泳</a></h3><p>視覺提示、感官調節與固定流程。</p></div>
  <div class="card">${cardThumb('card-adhd.webp', 'ADHD 短單元游泳示意')}<h3><a href="sen-swim-adhd.html">ADHD 游泳</a></h3><p>短單元、即時回饋與專注力訓練。</p></div>
  <div class="card">${cardThumb('card-overview.webp', '家長資源與 SEN 游泳總覽示意')}<h3><a href="resources.html">家長資源</a></h3><p>育兒錦囊、免費下載與常見問題。</p></div>
</div>
${CTA('<p style="margin-top:1rem"><a href="services.html">查看服務項目</a></p>')}
</div></section>`,
  },
  {
    file: 'sen-support-hk.html',
    title: '認識特殊需要及香港支援系統 | 新天地',
    description:
      '認識特殊教育需要（SEN）的基本概念，以及香港教育、社福相關支援如何與 SEN 游泳課程互相配合。',
    keywords: '特殊教育需要, SEN支援, 香港SEN, 特殊需要兒童, 融合教育',
    body: `<section class="page-header"><div class="container"><h1>認識特殊需要及香港支援系統</h1><p>家長入門：概念層面的認識，方便與學校、服務及游泳課溝通</p></div></section>
${learnHero('hero-sen-support.webp', '共融插畫：家庭、學校與游泳教練組成的支援網絡', '香港支援系統：教育、社福與水中學習如何銜接')}
<section class="section"><div class="container">
<h2>什麼是特殊教育需要（SEN）？</h2>
<p>特殊教育需要泛指孩子在學習、溝通、感官、肢體或行為情緒上，需要額外或個別化支援，才能更公平地參與日常學習與活動。常見類別包括：自閉症譜系、專注力不足／過度活躍症（ADHD）、讀寫障礙、肢體／視覺／聽力障礙、智力障礙、唐氏綜合症等。同一標籤下，每位孩子的能力與需要仍可以差別很大。</p>
<p>社會對特殊需要的理解亦在轉變：早期標籤式稱呼容易帶來偏見，現今更強調<strong>去污名化</strong>與尊重個體差異，並受《聯合國殘疾人權利公約》等理念影響——每位孩子都有平等參與學習與社區生活的權利。</p>
${learnFigure('card-support.webp', '支援系統概念插畫：多方協作圍繞孩子', '家長可把學校與治療建議告訴教練，統一小步驟目標')}
<h2>香港常見的支援途徑（概念層）</h2>
<ul>
<li><strong>評估與醫療：</strong>兒童體能智力測驗服務、兒科／專科跟進、復康治療（例如職業治療、物理治療、言語治療）。評估常涵蓋智力、肌能、語言等多方面，以理解孩子的實際需要。</li>
<li><strong>學前支援（概念）：</strong>特殊幼兒中心（較密集訓練）、普通幼稚園／幼兒中心的兼收安排，以及治療師到校服務等；學前階段往往是及早識別與介入的重要時期。</li>
<li><strong>學校「三層支援」概念：</strong>第一層優化課堂照顧全體差異；第二層小組輔導／訓練；第三層個別化支援或轉介。特殊教育需要統籌主任（SENCO）、學習支援組與教學助理常是家校溝通的重要橋樑。</li>
<li><strong>社福與社區：</strong>社會福利署及非政府機構的康復、日間訓練、家長資源中心等服務；照顧者的情緒與資訊支援同樣重要。</li>
<li><strong>體育與康樂：</strong>傷健共融運動、智障人士體育協會、特殊奧運相關活動，以及普及游泳課程。</li>
</ul>
<p>以上屬公開資訊層面的整理，實際資格與申請以相關部門／機構最新指引為準。</p>
<h2>游泳課如何與支援系統銜接？</h2>
<p>游泳不是取代醫療或學校支援，而是<strong>補足身體活動、安全感與生活技能</strong>的一環。新天地會請家長簡述：孩子已有的評估重點、學校或治療師的建議、泳池環境的敏感點（聲音、觸覺、水深）。課堂上我們會用可預期流程、分步目標與安全守則，讓水中學習與日常生活節奏互相配合。</p>
<h2>家長可以先準備什麼？</h2>
<ol>
<li>用簡單句子寫下孩子的長處、觸發不安的因素、有效安撫方法。</li>
<li>帶備泳衣、泳帽；若有視覺／聽力輔具或醫療注意事項，請提前告知教練。</li>
<li>第一次可先預約短時間試堂，觀察孩子對更衣室與池邊的反應。</li>
<li>若學校有 SENCO 或治療師建議，可摘錄與水中活動相關的幾點給教練參考。</li>
</ol>
${DISCLAIMER}
<section class="weekly-faq" style="margin-top:2rem" aria-labelledby="faq-h">
<h2 id="faq-h">家長常見問題</h2>
<h3>沒有正式診斷，也可以報游泳課嗎？</h3>
<p>可以。我們重視孩子在水中的實際需要多於標籤。若家長觀察到感官敏感、專注短暫或溝通節奏不同，歡迎先 WhatsApp 描述情況，我們會建議合適的起步方式。</p>
<h3>游泳課會不會跟學校／治療撞期？</h3>
<p>我們可按家庭時間商量班別；亦鼓勵家長把學校與治療師的建議告訴教練，方便統一「小步驟」目標，避免孩子同時面對太多新要求。</p>
<h3>孩子何時才算「追上」？</h3>
<p>每位孩子節奏不同。游泳課的目標是安全、自信與可持續的進步，而不是與他人比較「何時康復」。把小進步寫下來，往往比焦慮「何時正常」更有幫助。</p>
</section>
<p style="margin-top:1.5rem">延伸閱讀：<a href="sen-swim-development.html">特殊需要游泳運動發展</a> · <a href="sen-guide.html">認識特殊需要總覽</a> · <a href="resources.html">家長資源</a></p>
${CTA()}
</div></section>`,
  },
  {
    file: 'sen-swim-development.html',
    title: '國際及香港特殊需要人士游泳運動發展 | 新天地',
    description:
      '認識帕運游泳分級、香港傷殘／智障人士體育協會及普及游泳培訓脈絡，了解特殊需要游泳如何從復康走向競技與共融。',
    keywords: '帕運游泳, 殘疾人游泳, 智障人士游泳, HKSAPD, HKSAPID, 特殊需要游泳香港',
    body: `<section class="page-header"><div class="container"><h1>國際及香港特殊需要人士游泳運動發展</h1><p>從帕運精神到本地普及游泳：家長可認識的發展脈絡</p></div></section>
${learnHero('hero-sen-development.webp', '共融插畫：孩子從池邊到踢水的游泳發展進程', '特殊需要游泳：從普及習泳到競技路徑的認識')}
<section class="section"><div class="container">
<h2>為什麼特別談「游泳」？</h2>
<p>游泳同時鍛鍊全身協調、呼吸節奏與水中安全意識，對許多有特殊需要的孩子來說，是既可復康又可社交、甚至可走向競技的運動。國際帕運（Paralympic）精神強調「精神在運動中」（Spirit in Motion）：運動員以表現激勵世界，持續向前。</p>
${learnFigure('card-development.webp', '游泳技能循序發展示意插畫', '多數家庭的目標是安全與自信；競技只是其中一條路')}
<h2>帕運游泳的簡要脈絡</h2>
<ul>
<li>起源可追溯至 1948 年史托克曼德維爾運動會，最初服務脊椎損傷復健。</li>
<li>1960 年羅馬舉行第一屆夏季帕運；其後逐步納入截肢、視障、腦性麻痺等類別。</li>
<li>1989 年國際帕拉林匹克委員會（IPC）成立；2012 年倫敦帕運智障組別重返賽場。</li>
</ul>
<h2>游泳項目的分級概念（家長版）</h2>
<p>帕運游泳以字母＋數字標示影響程度（數字愈小通常代表影響愈大）：</p>
<ul>
<li><strong>肢體障礙：</strong>S1–S10（自由泳／背泳／蝶泳）、SB（蛙泳）、SM（混合泳）等。</li>
<li><strong>視力障礙：</strong>S11–S13；S11 全盲／極度弱視比賽須佩戴不透光泳鏡，並可由引導員（Tapper）在轉身處輕敲提示。</li>
<li><strong>智力障礙：</strong>S14，須符合國際智障運動相關認證要求。</li>
</ul>
<p>一般習泳課<strong>不必先做競賽分級</strong>；分級主要用於正式賽事。了解這些概念，有助家長明白「不同程度的身體條件，都有對應的游泳參與方式」。</p>
<h2>香港的主要體育組織</h2>
<ul>
<li><strong>中國香港傷殘人士體育協會（HKSAPD）：</strong>推動肢體殘疾運動，游泳屬精英體育項目之一，從社區體驗、青少年訓練班到培訓發展隊／精英資助，形成培育階梯。</li>
<li><strong>中國香港智障人士體育協會（HKSAPID）：</strong>組織智障人士康體活動與競技培訓；游泳亦有新星隊至 A 隊等梯隊機制，並可銜接 Virtus、特殊奧運等賽事路徑。</li>
<li><strong>中國香港殘疾人奧委會：</strong>推廣殘奧精神與專業知識，支援殘疾運動員發展。</li>
<li><strong>國際智障人士運動聯會（Virtus）：</strong>推動智障人士參與運動及國際賽事。</li>
</ul>
<h2>普及游泳與教師培訓</h2>
<p>香港游泳教師總會（HKSTA）設有特殊需要人士游泳教師證書課程，並於 2016 年創立「香港特殊需要人士游泳學院」，目標包括：提供普及與持續的習泳機會、強化身心與人際關係、鼓勵教師投身特殊需要游泳教學。學院曾於多區舉辦課程，並推動學員參與水上安全活動及相關比賽。</p>
<p>這類培訓的重點往往不只是「教會泳姿」，而是幫助教師<strong>認識學員需要、建立安全愉快的學習環境，以及掌握溝通與輔助方法</strong>——與新天地「以人為本、先安全再技巧」的方向一致。</p>
<h2>新天地如何對接這條路？</h2>
<p>我們聚焦<strong>普及與持續的水中學習</strong>：先建立安全感與基本水感，再按能力進階。若家庭日後有興趣參加體驗日、社區訓練班或協會活動，我們可協助理解方向，並強調安全與個別節奏永遠優先於比賽成績。</p>
${DISCLAIMER}
<section class="weekly-faq" style="margin-top:2rem">
<h2>家長常見問題</h2>
<h3>孩子一定要走競技路線嗎？</h3>
<p>不必。大多數家庭的目標是水中安全、自信與健康。競技是其中一條路徑，不是唯一標準。</p>
<h3>在新天地上課，將來可否參加協會活動？</h3>
<p>視乎孩子能力、年齡與相關會籍／資格要求。我們可先把基礎打穩，再按家長意願介紹公開資訊與查詢渠道。</p>
</section>
<p style="margin-top:1.5rem">延伸閱讀：<a href="sen-swim-physical.html">肢體・視覺・聽力與游泳</a> · <a href="sen-swim-intellectual.html">智力及多重障礙</a> · <a href="sen-guide.html">總覽</a></p>
${CTA()}
</div></section>`,
  },
  {
    file: 'sen-swim-physical.html',
    title: '肢體、視覺、聽力障礙游泳教學 | 新天地',
    description:
      '肢體、視覺、聽力障礙兒童的游泳教學重點：泳池安全、溝通調整與個別化水中學習，香港 SEN 游泳中心。',
    keywords: '肢體障礙游泳, 視障游泳, 聽障游泳, 感官障礙游泳, SEN游泳香港',
    body: `<section class="page-header"><div class="container"><h1>肢體、視覺、聽力障礙與游泳</h1><p>安全第一，溝通清楚，讓身體條件不同的孩子也能享受水中學習</p></div></section>
${learnHero('hero-sen-physical.webp', '共融插畫：輪椅輔具與泳池安全轉移、視覺引導', '肢體・視覺・聽力：尊嚴與安全並重的水中學習')}
<section class="section"><div class="container">
<h2>共同原則</h2>
<p>無論肢體、視覺或聽力需要，課堂都以<strong>安全、尊嚴與可預期流程</strong>為先。教練會先了解孩子的移動方式、輔具、疲勞訊號與溝通偏好，再決定入水步驟與輔助用具（浮板、助浮衣等按需要使用）。教學重點是<strong>觀察與引導</strong>：從孩子已有的能力與優勢側開始，而不是硬套一般兒童的標準流程。</p>
${learnFigure('teach-safe-guidance.webp', '水中安全引導示意：教練輕觸提示再引導手部動作', '安全引導示意（非官方賽事標誌）：清楚溝通比硬背動作更重要')}
<h2>肢體障礙：泳池中的實務調整</h2>
<ul>
<li>入水／離水改為較慢、有支撐的步驟；必要時由教練或家長協助轉移，避免急拉關節。落水、上水本身也是訓練的一部分。</li>
<li>利用水的浮力減輕負重；可先練習仰浮或穩定頭部位置，建立「不會嗆水」的安全感，再談划水效率。</li>
<li>從優勢側或孩子已能做到的動作入手（例如單側划水），目標是安全前進與自信心，而非刻板模仿標準泳姿。</li>
<li>注意皮膚、支架接觸面與長時間浸水的舒適度；課後更換乾燥衣物。肌肉較緊張的孩子移動時需格外緩慢。</li>
<li><strong>課時建議：</strong>首次試水宜短，很多家庭以約 15 分鐘起步，按反應延長；一般也不宜一次浸水過久，視疲勞與水溫調整。</li>
</ul>
<h2>視覺障礙：空間與提示</h2>
<ul>
<li>先以口語描述泳池環境（池邊、水深、扶梯位置），讓孩子建立心智地圖；環境盡量平坦、固定，減少臨時障礙物。</li>
<li>固定出發點與休息位置；轉身或到邊時可用聲音或輕觸提示（正式賽事中的 Tapper 概念，在教學中以溫和、預告式提示代替）。</li>
<li>避免突然從背後觸碰；先說明「我現在會扶你的手肘」。亦可讓孩子用手觸摸教練示範動作。</li>
<li>弱視孩子可配合高對比浮具與清晰的邊界標記；部分孩子的搖晃等重複動作可能與視覺補償有關，宜理解而非硬性制止。</li>
</ul>
<h2>聽力障礙：看得見的指令</h2>
<ul>
<li>教練面向孩子、光線充足時示範；重要指令配合手勢、圖卡或書寫板。</li>
<li>下水前先講解本節目標；水中盡量減少長句，改為短促、可重複的訊號。聽障孩子往往視覺觀察力強，示範比長篇講解更有效。</li>
<li>若使用助聽器／人工耳蝸，請家長說明是否可於水中配戴防水配件；否則下水前妥善保管（設備通常昂貴）。以視覺溝通為主。</li>
<li>緊急情況以預先約定的手勢（例如「停、扶邊」）為優先。</li>
</ul>
<h2>安全溝通：請家長主動告知的事項</h2>
<p>若孩子有已知的發作病史、用藥或活動限制，請課前告訴教練。課堂會以<strong>預防與預案</strong>為先：熟悉孩子訊號、保護頭部與池邊、並確保有熟悉孩子的成人可即時聯絡。具體醫療安排以醫生意見為準，游泳課不能取代急救訓練或醫療判斷。</p>
<h2>家長可如何配合？</h2>
<ol>
<li>提供醫療／復康師的活動限制（若有），例如承重或頸椎注意。</li>
<li>第一次可觀課，協助建立「更衣室→沖身→池邊」的固定儀式。</li>
<li>回家以短句重溫：今天做到的一件小事，比批評「未達標準泳姿」更有用。</li>
</ol>
${DISCLAIMER}
<section class="weekly-faq" style="margin-top:2rem">
<h2>家長常見問題</h2>
<h3>有支架或輪椅，泳池場地怎麼辦？</h3>
<p>請先 WhatsApp 告知需要，我們會協助查詢更衣室通道與入水方式。不同泳池設施不一，個別安排最重要。</p>
<h3>全盲孩子適合學游泳嗎？</h3>
<p>可以，關鍵是環境預告與穩定的教練關係。許多視障運動員亦以游泳作為主要項目；普及課則以安全與樂趣為先。</p>
<h3>第一次課要游多久？</h3>
<p>寧短勿長。先看孩子對水溫、更衣室與池邊的反應；能帶著正面感受離開，比「完成一整節標準課」更重要。</p>
</section>
<p style="margin-top:1.5rem">延伸閱讀：<a href="sen-swim-development.html">游泳運動發展與分級概念</a> · <a href="sen-swim-intellectual.html">智力及多重障礙</a> · <a href="sen-guide.html">總覽</a></p>
${CTA()}
</div></section>`,
  },
  {
    file: 'sen-swim-intellectual.html',
    title: '智力障礙及多重障礙游泳教學 | 新天地',
    description:
      '智力障礙（智障）及多重障礙學童的游泳教學：分步指令、重複練習、安全意識與耐心節奏，香港 SEN 游泳。',
    keywords: '智力障礙游泳, 智障游泳, 多重障礙游泳, SEN游泳, 特殊需要游泳教學',
    body: `<section class="page-header"><div class="container"><h1>智力障礙及多重障礙與游泳</h1><p>把大目標拆成小步驟，用重複與安全感建立水中能力</p></div></section>
${learnHero('hero-sen-intellectual.webp', '共融插畫：教練以圖像提示協助智力障礙孩子學游泳', '智力及多重障礙：分步、重複與具體安全規則')}
<section class="section"><div class="container">
<h2>教學核心：清楚、重複、可預期</h2>
<p>智力障礙（亦常稱智障）的理解，專業上通常同時看重<strong>智力功能</strong>與<strong>適應行為</strong>（溝通、社交、生活自理等），而不是單一分數。孩子可能在理解抽象指令、記憶步驟或判斷危險上需要更多時間；多重障礙則可能同時面對肢體、感官或溝通限制。游泳課宜採<strong>單一焦點</strong>：每節只強調一至兩個動作，完成即<strong>具體讚賞</strong>（說出他做到了什麼），而不是空泛的「你好叻」。</p>
${learnFigure('card-intellectual.webp', '分步圖像提示的游泳教學示意', '把「學會游泳」拆成看得見的小目標，孩子更易跟上')}
<h2>課堂設計建議</h2>
<ul>
<li><strong>工序分析（分步）：</strong>把「換泳衣→沖身→坐池邊→踢水→休息」拆成看得見的步驟卡，一次只做一小步。</li>
<li><strong>具體化：</strong>用實物、圖片、短口訣（例如「揸實手」「眼望前」），少用抽象長句。</li>
<li><strong>視覺＋口語雙軌：</strong>圖卡或手勢顯示流程；口語保持短、可重複。</li>
<li><strong>短時多次：</strong>20–30 分鐘高品質練習，往往比過長課堂更有效；減少環境干擾。</li>
<li><strong>固定教練與流程：</strong>減少陌生變數，讓孩子把能量用在學習而非適應環境。</li>
<li><strong>安全意識要教得具體：</strong>「未得教練叫，唔好自己行近池邊」比抽象說「小心」更有效。</li>
<li><strong>等待與輪流：</strong>小組課時用明確次序，縮短空白等待，降低焦慮或衝動。</li>
</ul>
<h2>多重障礙時的優先次序</h2>
<p>當孩子同時有多種需要（例如智力障礙＋自閉症特質），我們會先處理<strong>安全與溝通</strong>，再談泳姿。例如：先能安心浸水與求助，才練習划手；若伴隨感官過敏，先降刺激再增加動作難度。家長與學校／復康團隊的資訊，有助我們避免互相矛盾的目標。</p>
<h2>與競技路徑的關係</h2>
<p>國際與本地智障人士體育（例如 Virtus、HKSAPID 相關活動）為有潛質的運動員提供進階路徑。普及課階段不必急於分級；先享受游泳、建立規律出席，已是很大的成就。</p>
${DISCLAIMER}
<section class="weekly-faq" style="margin-top:2rem">
<h2>家長常見問題</h2>
<h3>孩子語言少，教練怎樣教？</h3>
<p>以示範、觸覺引導與圖卡為主，口語保持短句。家長可提供孩子慣用的手勢或圖卡系統，課堂盡量沿用。</p>
<h3>會否永遠只是「玩水」？</h3>
<p>初期確實以適應為主。當安全感足夠，我們會逐步加入踢水、浮板前進等可量度的小目標，讓家長看到具體進展。</p>
<h3>讚賞怎樣說才有效？</h3>
<p>說出具體行為：「你今日肯坐池邊踢水，好專心。」比只說「叻」更能幫助孩子知道哪一步做得好。</p>
</section>
<p style="margin-top:1.5rem">延伸閱讀：<a href="sen-swim-down-syndrome.html">唐氏綜合症游泳</a> · <a href="sen-swim-development.html">運動發展</a> · <a href="sen-guide.html">總覽</a></p>
${CTA()}
</div></section>`,
  },
  {
    file: 'sen-swim-down-syndrome.html',
    title: '唐氏綜合症游泳課程 | 新天地 — 香港',
    description:
      '唐氏綜合症兒童游泳教學：肌張力、健康注意事項與循序漸進的水中學習，香港 SEN 游泳中心個別化安排。',
    keywords: '唐氏綜合症游泳, 唐氏游泳, Down syndrome 游泳, SEN游泳香港',
    body: `<section class="page-header"><div class="container"><h1>唐氏綜合症與游泳</h1><p>尊重身體節奏，在水中建立力量、協調與快樂</p></div></section>
${learnHero('hero-sen-down.webp', '共融插畫：唐氏綜合症孩子在泳池快樂學游泳', '唐氏綜合症游泳：尊重身體節奏，循序建立水中自信')}
<section class="section"><div class="container">
<h2>為什麼許多家庭選擇游泳？</h2>
<p>水的浮力可減少關節負重，有助在較安全的環境練習平衡與全身協調。對肌張力較低（hypotonia）的孩子，游泳能以遊戲化方式強化核心與四肢控制，同時提供明確的社交與規律活動。</p>
${learnFigure('card-down.webp', '唐氏綜合症水中學習快樂示意', '浮力與遊戲化練習，幫助建立力量與協調')}
<h2>健康與安全：請先與醫生溝通的重點</h2>
<ul>
<li><strong>頸椎穩定性：</strong>部分唐氏綜合症人士需注意寰樞椎不穩；若醫生有活動限制，請務必提前告知教練，課堂會避免過度屈伸頸部的動作。</li>
<li><strong>心臟或其他內科狀況：</strong>按醫生建議調整強度與休息頻率。</li>
<li><strong>呼吸與耳鼻喉：</strong>練習時留意疲勞、咳嗽或耳部不適，必要時暫停並離水休息。</li>
</ul>
<p>以上為常見教學提醒，<strong>個別醫療決定以醫生意見為準</strong>。</p>
<h2>課堂節奏</h2>
<ul>
<li>熱身由陸地或淺水開始，動作幅度由小至大。</li>
<li>多用示範與手牽引導；指令短、具體、可重複。</li>
<li>每完成小步驟（例如願意坐池邊踢水）即給予清楚讚賞。</li>
<li>社交動機強的孩子，可適度加入與教練的互動遊戲，但始終以安全距離與規則為先。</li>
</ul>
<h2>家長在家可以做什麼？</h2>
<ol>
<li>浴缸玩水：用杯子倒水、吹泡泡，建立對臉部濕水的正面經驗。</li>
<li>保持「游泳日」常規：同一天、同一準備流程，減少不安。</li>
<li>與教練分享醫生最新建議及孩子當日身體狀況。</li>
</ol>
${DISCLAIMER}
<section class="weekly-faq" style="margin-top:2rem">
<h2>家長常見問題</h2>
<h3>一定要有醫生證明才能上課嗎？</h3>
<p>若孩子有已知的頸椎、心臟或其他限制，我們強烈建議先咨詢醫生，並把注意事項告訴教練。一般健康狀況亦可先 WhatsApp 說明，我們會評估是否適合試堂。</p>
<h3>進度會不會很慢？</h3>
<p>每位孩子不同。我們重視「穩定出席＋享受水中」多於短期泳姿完美。小步進展累積起來，往往比催促更持久。</p>
</section>
<p style="margin-top:1.5rem">延伸閱讀：<a href="sen-swim-intellectual.html">智力及多重障礙</a> · <a href="sen-swim-physical.html">肢體・視覺・聽力</a> · <a href="sen-guide.html">總覽</a></p>
${CTA()}
</div></section>`,
  },
  {
    file: 'sen-swim-autism.html',
    title: '自閉症游泳課程 | 新天地 — 香港 SEN 游泳',
    description:
      '香港自閉症兒童專項游泳教學：視覺提示、感官調節、小步進階。三十年 SEN 經驗，一對一或小組，WhatsApp 查詢合適班別。',
    keywords: '自閉症游泳, 自閉症游泳課程, 香港SEN游泳, 視覺提示, 感官友善游泳',
    body: `<section class="page-header"><div class="container"><h1>自閉症游泳課程（香港）</h1><p>專為自閉症譜系孩子設計的水中學習環境</p></div></section>
${learnHero('hero-sen-autism.webp', '共融插畫：自閉症友善泳池與視覺提示學習環境', '自閉症游泳：視覺提示、感官調節與固定流程')}
<section class="section"><div class="container">
<h2>為何選擇水中學習？</h2>
<p>水能提供可預測的感官輸入，許多自閉症孩子在陸地上感到過載，卻能在結構化的游泳課中建立安全感。我們使用視覺提示卡、固定流程與可預期的節奏，減少焦慮。每位孩子差異很大：有人對水特別熱衷、專注力強；有人需要更長時間適應新環境——我們會按個別節奏調整。</p>
${learnFigure('teach-visual-schedule.webp', '視覺流程示意：換衣服、池邊、踢水三步驟', '視覺流程卡：換衣服 → 池邊 → 踢水，幫助預知下一步')}
<h2>教學重點</h2>
<ul>
<li>池邊適應與遊戲化入水，不強迫；先建立正面感受再加難度</li>
<li>視覺日程表與簡單、形象的提示卡；指令短而具體</li>
<li>善用孩子的優勢（例如對喜歡活動的熱情與堅持），用「小挑戰＋即時肯定」維持動力</li>
<li>情緒升溫時即時降刺激；強度由低至高，避免一開始過量導致放棄</li>
<li>留意關節負荷與疲勞訊號，動作幅度循序漸進</li>
<li>家長可參與的溝通策略：課前說明當日流程，課後重溫一件成功小事</li>
</ul>
<p style="margin-top:1.25rem">認識其他需要：<a href="sen-guide.html">特殊需要總覽</a> · <a href="sen-swim-adhd.html">ADHD</a> · <a href="sen-swim-down-syndrome.html">唐氏綜合症</a> · <a href="sen-swim-intellectual.html">智力及多重障礙</a></p>
${CTA()}
</div></section>`,
  },
  {
    file: 'sen-swim-adhd.html',
    title: 'ADHD 游泳專注力訓練 | 新天地 — 香港',
    description:
      'ADHD 兒童游泳課程：分段指令、即時回饋、水中專注力訓練。香港 SEN 游泳中心，由專業教練一對一或小組授課。',
    keywords: 'ADHD游泳, ADHD專注力訓練, SEN游泳香港, 特殊需要游泳',
    body: `<section class="page-header"><div class="container"><h1>ADHD 孩子學游泳</h1><p>用水中結構化活動建立專注與自我調節</p></div></section>
${learnHero('hero-sen-adhd.webp', '共融插畫：ADHD 孩子以短單元方式練習踢水', 'ADHD 游泳：短單元、即時回饋與水中專注力')}
<section class="section"><div class="container">
<p>ADHD 孩子並非不聽話，而是需要更清晰的指令與即時回饋。我們把課堂拆成短單元，配合視覺提示與正向強化，讓孩子在水中練習「開始—專注—完成」。</p>
${learnFigure('teach-adhd-focus.webp', 'ADHD 短單元專注練習示意插畫', '短單元專注：每節幾個小目標，完成即具體讚賞')}
<h2>五個實用方向</h2>
<ol><li>每節 3–5 個小目標，完成即給具體讚賞</li><li>減少同時多指令，先口頭後示範</li><li>固定熱身流程，建立預測感</li><li>允許短暫動態休息，再回任務</li><li>與家長分享家中可延續的練習</li></ol>
<p><a href="blog-article-adhd.html">閱讀：ADHD 孩子學游泳的 5 個實用技巧</a></p>
<p style="margin-top:1.25rem">認識其他需要：<a href="sen-guide.html">特殊需要總覽</a> · <a href="sen-swim-autism.html">自閉症</a> · <a href="sen-swim-physical.html">肢體・視覺・聽力</a></p>
${CTA()}
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
<p><a href="sen-guide.html">認識特殊需要與課程方向</a></p>
${CTA()}
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
<p><a href="sen-swim-autism.html">了解自閉症游泳課程</a> · <a href="sen-guide.html">認識特殊需要</a> · <a href="booking.html">預約試堂</a></p>
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
<p><a href="sen-swim-adhd.html">ADHD 游泳專項課程</a> · <a href="sen-guide.html">認識特殊需要</a></p>
</div></section>`,
  },
];

for (const p of [...landings, ...articles]) {
  const html = shell({
    title: p.title,
    description: p.description,
    keywords: p.keywords,
    bodyHtml: attachExtras(p.file, p.body),
  });
  fs.writeFileSync(path.join(root, p.file), html, 'utf8');
  console.log('Wrote', p.file);
}
