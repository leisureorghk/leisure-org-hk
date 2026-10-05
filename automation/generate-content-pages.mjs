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

const motionFig = (file, alt, caption) => `<figure class="learn-figure motion-figure">
<img src="images/learn/${file}?v=20261005b" alt="${alt}" width="720" height="240" loading="lazy" decoding="async">
<figcaption>${caption}</figcaption>
</figure>`;

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
    <link rel="stylesheet" href="css/style.css?v=20261005a">
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
      '認識香港特殊教育需要（SEN）與游泳教學：支援系統、運動發展，以及自閉症、ADHD、讀寫／動作協調、肢體、感官、智力障礙與唐氏綜合症的水中學習方向。',
    keywords: 'SEN游泳, 特殊需要游泳, 香港SEN, 特殊教育需要, 新天地',
    body: `<section class="page-header"><div class="container"><h1>認識特殊需要與 SEN 游泳</h1><p>從認識孩子的需要開始，再到水中安全學習</p></div></section>
${learnHero('hero-sen-guide.webp', '共融插畫：香港泳池邊，教練歡迎多樣特殊需要兒童學游泳', 'SEN 游泳總覽：以尊嚴與共融方式認識不同需要')}
<section class="section"><div class="container reading-flow">
<p>每一位孩子的學習節奏都不同。新天地以游泳及多功能發展為核心，陪伴自閉症、ADHD、讀寫／動作協調困難、肢體／感官障礙、智力障礙、唐氏綜合症等家庭，用可預期的流程與個別化安排，讓孩子在水中建立安全感與自信。我們相信特殊需要不是「污名」，而是需要被理解與適切支援的個別差異。</p>
${DISCLAIMER}
<div class="features-grid" style="margin-top:2rem">
  <div class="card">${cardThumb('card-support.webp', '香港支援系統示意插畫')}<h3><a href="sen-support-hk.html">香港支援系統</a></h3><p>認識特殊需要的基本概念，以及教育、社福等本地支援如何與游泳課銜接。</p></div>
  <div class="card">${cardThumb('card-overview.webp', 'SEN 習泳價值示意')}<h3><a href="sen-swim-benefits.html">習泳的價值</a></h3><p>從感覺統合、動作、專注到情緒與社交：水中活動如何幫助孩子。</p></div>
  <div class="card">${cardThumb('card-adhd.webp', '正向行為與課堂結構示意')}<h3><a href="sen-swim-behavior.html">正向行為與課堂</a></h3><p>行為是訊息：可預測結構、具體讚賞、先調節再教學。</p></div>
  <div class="card">${cardThumb('card-autism.webp', '視覺與輔助溝通示意')}<h3><a href="sen-swim-communication.html">泳池溝通與 AAC</a></h3><p>圖卡、手勢、短指令與孩子慣用的溝通方式，讓低口語孩子也能參與。</p></div>
  <div class="card">${cardThumb('card-physical.webp', '水中安全示意')}<h3><a href="sen-swim-safety.html">游泳安全家長指引</a></h3><p>課前準備、更衣室、泳池與課後交接的安全重點。</p></div>
  <div class="card">${cardThumb('card-development.webp', '特殊需要游泳運動發展示意')}<h3><a href="sen-swim-development.html">游泳運動發展</a></h3><p>帕運與香港殘疾／智障體育協會、普及游泳與精英培訓的脈絡。</p></div>
  <div class="card">${cardThumb('card-physical.webp', '肢體與感官游泳支援示意')}<h3><a href="sen-swim-physical.html">肢體・視覺・聽力</a></h3><p>泳池安全、溝通方式與教學調整，讓感官與肢體需要的孩子也能下水。</p></div>
  <div class="card">${cardThumb('card-intellectual.webp', '智力及多重障礙游泳示意')}<h3><a href="sen-swim-intellectual.html">智力及多重障礙</a></h3><p>分步、重複與安全意識：適合智力障礙及多重需要的水中學習節奏。</p></div>
  <div class="card">${cardThumb('card-down.webp', '唐氏綜合症游泳示意')}<h3><a href="sen-swim-down-syndrome.html">唐氏綜合症</a></h3><p>肌張力、健康注意與循序漸進的游泳課設計重點。</p></div>
  <div class="card">${cardThumb('card-autism.webp', '自閉症游泳視覺提示示意')}<h3><a href="sen-swim-autism.html">自閉症游泳</a></h3><p>視覺提示、感官調節與固定流程。</p></div>
  <div class="card">${cardThumb('card-adhd.webp', 'ADHD 短單元游泳示意')}<h3><a href="sen-swim-adhd.html">ADHD 游泳</a></h3><p>短單元、即時回饋與專注力訓練。</p></div>
  <div class="card">${cardThumb('card-overview.webp', '讀寫與動作協調游泳示意')}<h3><a href="sen-swim-learning.html">讀寫／動作協調</a></h3><p>示範為主、分步練習與多感官提示，減少文字負擔。</p></div>
  <div class="card">${cardThumb('card-overview.webp', '家長資源與 SEN 游泳總覽示意')}<h3><a href="resources.html">家長資源</a></h3><p>育兒錦囊、免費下載與常見問題。</p></div>
  <div class="card">${cardThumb('card-support.webp', '公開學習資源示意')}<h3><a href="resources.html#public-learning">公開學習資源</a></h3><p>包括香港教育大學健康與體育學系高級講師 Roy Chan 的 Padlet《List of Disorder》（第三方教材，非醫療診斷）。</p></div>
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
<section class="section"><div class="container reading-flow">
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
<h2>公開學習資源</h2>
<p>若想先認識不同身心狀況的名稱與教材入口，可參閱香港教育大學（EdUHK）健康與體育學系高級講師 Roy Chan 公開的 Padlet《<a href="https://padlet.com/roychan500ywc/list-of-disorder-z6xo27qut3kp3vg2" target="_blank" rel="noopener noreferrer">List of Disorder</a>》。這是第三方教學整理，<strong>並非醫療診斷</strong>；內容與更新以原作者為準。本站家長資源頁亦有同一連結。</p>
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
<section class="section"><div class="container reading-flow">
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
<p>不必。大多數家庭的目標是水中安全、自信與健康。競技是其中一條路徑，不是唯一標準。若日後參加特殊奧運或體驗賽，我們亦認同「重在參與、建立自信」——完成比賽本身已是成功，不必只看獎牌。</p>
<h3>在新天地上課，將來可否參加協會活動？</h3>
<p>視乎孩子能力、年齡與相關會籍／資格要求。我們可先把基礎打穩，再按家長意願介紹公開資訊與查詢渠道。交通與人手往往是家長最實際的挑戰，宜提早與其他家庭或機構協調。</p>
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
<section class="section"><div class="container reading-flow">
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
<p>家長可簡單準備：發作大概樣子與常見時長、用藥時間、緊急聯絡人，以及「哪些觸發要避免」。這不是要嚇怕任何人，而是讓教練團隊有準備地守護安全。</p>
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
<h3>助聽器下水怎麼辦？</h3>
<p>多數設備不宜直接浸水。請課前確認是否有防水配件；否則下水前由家長妥善保管，課堂改以手勢、圖卡與示範溝通。</p>
</section>
<p style="margin-top:1.5rem">延伸閱讀：<a href="sen-swim-safety.html">安全家長指引</a> · <a href="sen-swim-development.html">游泳運動發展與分級概念</a> · <a href="sen-swim-intellectual.html">智力及多重障礙</a> · <a href="sen-guide.html">總覽</a></p>
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
<section class="section"><div class="container reading-flow">
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
<li><strong>體能節奏：</strong>部分孩子心肺耐力與肌力較一般同齡人慢熱，宜多休息、先求質素；不要用陸上體適能常模硬比進度。</li>
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
<section class="section"><div class="container reading-flow">
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
<li>多用示範與圖片日程表；指令短、具體、可重複。模仿學習往往比長篇講解更快。</li>
<li>每完成小步驟（例如願意坐池邊踢水）即給予清楚讚賞。</li>
<li>課時宜適中，穿插休息；低肌張力孩子較易疲勞，不必與一般泳班比耐力。</li>
<li>仰臥漂浮可先在陸上或池邊練習姿勢，再逐步增加獨立性。</li>
<li>社交動機強的孩子，可適度加入與教練或同學的互動遊戲，但始終以安全距離與規則為先。</li>
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
<section class="section"><div class="container reading-flow">
<h2>為何選擇水中學習？</h2>
<p>水能提供可預測的感官輸入，許多自閉症孩子在陸地上感到過載，卻能在結構化的游泳課中建立安全感。自閉症譜系是先天的神經發展差異，能力和語言程度可以相差很大；即或語言與認知不錯，社交溝通、情緒調節與突發轉變仍可能需要系統支援。我們使用視覺提示卡、固定流程與可預期節奏，減少焦慮。</p>
<p><strong>重要澄清：</strong>游泳<strong>不能「根治」自閉症</strong>。合理目標是減少日常困難、提升水中安全感與生活適應力，而不是承諾治癒。詳見<a href="sen-swim-benefits.html">習泳的價值</a>。</p>
${learnFigure('teach-visual-schedule.webp', '視覺流程示意：換衣服、池邊、踢水三步驟', '視覺流程卡：換衣服 → 池邊 → 踢水，幫助預知下一步')}
${motionFig('anim-visual-schedule.svg', '視覺流程卡依序發亮的動態示意', '動態流程：換衣服 → 池邊 → 踢水 → 休息')}
<h2>看見優勢，不只看見困難</h2>
<p>不少自閉症孩子在感興趣的事物上專注力與堅持度很高。課堂上我們會用清晰、形象的步驟，以及「看得見的小挑戰」建立成功感；強度由低開始，避免一開始就過勞或受傷。關節柔軟度、耐力與疲勞訊號因人而異，請家長分享孩子平日活動的觀察。</p>
<h2>教學重點</h2>
<ul>
<li><strong>視覺提示：</strong>用圖卡顯示課堂流程（熱身→踢水→划手→自由活動→離水）與規則（例如池邊慢行、輪流）。這呼應結構化教學（視覺時間表、固定常規），善用許多孩子的視覺優勢。</li>
<li><strong>短而具體的指令：</strong>「一指令一動作」（例如「手揸板、腳踢水」）；少用比喻或抽象長句；非語言示範往往比長篇講解更有效。詳見<a href="sen-swim-communication.html">泳池溝通專頁</a>。</li>
<li><strong>輔助溝通：</strong>歡迎帶孩子慣用的 PECS 圖卡、溝通簿或 AAC App；我們會沿用同一套符號，而不是另發明一套。</li>
<li><strong>結構化與預告改變：</strong>固定水道／入水點；若換教練、換水道，先用圖或短句預告。</li>
<li><strong>冷靜區與感官調節：</strong>預先約定較安靜的休息位置；可用耳塞減低回音；感官超載時先離水安全，再降刺激（<strong>先調節，再教學</strong>）。</li>
<li><strong>漸進入水：</strong>池邊拍水、用手捧水吹泡泡（可用吸管輔助）、局部浸水、再全身入水；嚴禁強行推落水中。</li>
<li><strong>選擇權與掌控感：</strong>在安全範圍內給有限選擇（先踢水定划手）；孩子覺得有掌控，更願意參與。</li>
<li><strong>模仿建立信任：</strong>可先短暫跟隨孩子的節奏或動作，再引導他跟從教練示範；初期可允許家長陪同，再逐步獨立。</li>
</ul>
${DISCLAIMER}
<section class="weekly-faq" style="margin-top:2rem">
<h2>家長常見問題</h2>
<h3>游泳可以治好自閉症嗎？</h3>
<p>不可以。自閉症是終身的神經發展差異。游泳的價值在於感官調節、安全技能、自信與社交練習——減少症狀對生活的影響，而不是「根治」。</p>
<h3>孩子極度怕水，要強迫下水嗎？</h3>
<p>不要。我們會用分週、分步的水適應計劃；出現極度恐慌即停，退回較安全步驟。強行入水可能造成創傷與長期恐水。</p>
<h3>孩子不看著教練，是不是故意不聽話？</h3>
<p>通常不是。強迫對眼接觸會帶來很大壓力。我們會讓孩子身體面向教練或跟從圖卡，而不是強迫對眼。</p>
<h3>情緒崩潰時，要不要即時大聲講道理？</h3>
<p>不要。當下先確保水中安全，帶到安靜位置，減少說話，給時間自我調節。平復後再短句回顧。</p>
<h3>「高功能」還需要視覺提示嗎？</h3>
<p>需要。認知好不代表面對抽象指令或突然轉變時不焦慮；可視化、結構化仍能大幅提升安全感與成功率。</p>
</section>
<p style="margin-top:1.25rem">認識其他需要：<a href="sen-guide.html">特殊需要總覽</a> · <a href="sen-swim-communication.html">泳池溝通</a> · <a href="sen-swim-behavior.html">正向行為</a> · <a href="sen-swim-adhd.html">ADHD</a> · <a href="sen-swim-learning.html">讀寫／動作協調</a></p>
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
<section class="section"><div class="container reading-flow">
<p>注意力不足／過度活躍症（ADHD）常見表現包括活動量高、衝動、以及專注維持困難——孩子並非「不聽話」，而是需要更清晰的指令與即時回饋。臨床上可分為複合型、專注不足為主、或過度活躍／衝動為主等不同組合，同一標籤下表現仍可以很不同。我們把課堂拆成短單元，配合視覺提示與正向強化，讓孩子練習「開始—專注—完成」。</p>
${learnFigure('teach-adhd-focus.webp', 'ADHD 短單元專注練習示意插畫', '短單元專注：每節幾個小目標，完成即具體讚賞')}
${motionFig('anim-kick.svg', '短單元踢水動態示意', '高密度短活動：完成一小組，再休息一下')}
<h2>泳池安全與課堂節奏</h2>
<ul>
<li><strong>清楚界線：</strong>用地墊或浮線標示等待區；未得教練訊號，不可自行下水。</li>
<li><strong>近距離監管：</strong>衝動較高的孩子需保持在視線與伸手可及範圍，預防突然跳水或走開。</li>
<li><strong>短講多練：</strong>少長篇講解、少長時間排隊；高密度短活動。</li>
<li><strong>一指令一動作：</strong>例如「手揸板，踢五下」，完成再加下一步。</li>
<li><strong>正向代幣：</strong>完成一組練習可得貼紙／代幣，累積換最後幾分鐘自由玩水時間。</li>
<li><strong>遊戲化：</strong>把體能練習變成簡單水中遊戲（尋寶、短距離競賽），維持動力。</li>
</ul>
<h2>五個實用方向</h2>
<ol><li>每節 3–5 個小目標，完成即給具體讚賞</li><li>減少同時多指令，先口頭後示範</li><li>固定熱身流程，建立預測感</li><li>允許短暫動態休息，再回任務</li><li>與家長分享家中可延續的練習</li></ol>
${DISCLAIMER}
<p><a href="blog-article-adhd.html">閱讀：ADHD 孩子學游泳的 5 個實用技巧</a></p>
<p style="margin-top:1.25rem">認識其他需要：<a href="sen-guide.html">特殊需要總覽</a> · <a href="sen-swim-autism.html">自閉症</a> · <a href="sen-swim-learning.html">讀寫／動作協調</a> · <a href="sen-swim-physical.html">肢體・視覺・聽力</a></p>
${CTA()}
</div></section>`,
  },
  {
    file: 'sen-swim-learning.html',
    title: '讀寫障礙與動作協調障礙游泳 | 新天地',
    description:
      '讀寫障礙（Dyslexia）與發展性動作協調障礙（DCD）兒童的游泳教學：示範為主、分步練習、多感官提示，香港 SEN 游泳。',
    keywords: '讀寫障礙游泳, 動作協調障礙, DCD游泳, 特殊學習困難, SEN游泳香港',
    body: `<section class="page-header"><div class="container"><h1>讀寫障礙與動作協調障礙游泳</h1><p>減少文字負擔，把動作拆清楚，讓孩子在水中累積成功經驗</p></div></section>
${learnHero('hero-sen-guide.webp', '共融插畫：教練以示範與圖示協助特殊學習需要孩子', '特殊學習困難：示範、分步與多感官學習')}
<section class="section"><div class="container reading-flow">
<h2>什麼是特殊學習困難（概念）？</h2>
<p>特殊學習困難泛指整體智力可以在一般範圍，但在讀寫、數學或動作協調等特定能力上有持續明顯困難。常見包括<strong>讀寫障礙</strong>（文字解碼、拼寫與閱讀處理）與<strong>發展性動作協調障礙（DCD）</strong>（動作計劃、協調與學習新動作）。兩者可以並存，也可與專注或發展需要同時出現——教學應看孩子實際表現，而不是只看標籤。</p>
${DISCLAIMER}
${learnFigure('teach-visual-schedule.webp', '示範為主、分步練習的游泳教學示意', '少文字、多示範：一次只加一個新動作')}
${motionFig('anim-kick.svg', '踢水動作動態示意', '動態示意：把大動作拆成看得見的小步驟')}
<h2>讀寫障礙：對游泳課的影響</h2>
<p>讀寫障礙<strong>不是</strong>智力低、懶惰或欠缺動機。口語理解與創意可能很強，但長文字規則、技術名稱或書面評估會較吃力。水中動作本身未必受影響，但接收文字資訊、一次記住多個技術要求會較困難。</p>
<ul>
<li>先示範，再用短文字／短口語提示；多用圖、箭嘴、流程圖。</li>
<li>「一指令一動作」：完成一步再加下一步；同一動作用固定用語。</li>
<li>多感官：看示範、聽短提示、親身做；練完可請孩子用自己的話說出重點。</li>
<li>不要把閱讀慢解讀成「不投入」；理論或書面表現未必等於實際游泳能力。</li>
</ul>
<h2>動作協調障礙（DCD）：水中怎樣教？</h2>
<p>DCD 影響動作協調與學習，孩子可能顯得笨拙、節奏不穩，或難同時控制四肢與呼吸。這<strong>不代表不能學游泳</strong>——浮力環境反而適合用重複與分步建立動作模式。</p>
<ul>
<li><strong>動作拆解：</strong>例如先流線 → 踢水 → 單臂划 → 再加呼吸；一次只加一個新元素。</li>
<li><strong>重複穩定：</strong>練習流程固定，給足次數，不要因「慢」就過早加難。</li>
<li><strong>外在提示：</strong>浮板、水道線幫助孩子感受身體位置；需觸覺引導時先徵得同意。</li>
<li><strong>環境調整：</strong>減少干擾，先求動作質素再求速度／距離；注意池邊步行、上落水與器材搬運的協調安全。</li>
<li>由易成功的動作開始，給足重複次數，保護自信；不要因「慢」就一次示範整套泳式。</li>
</ul>
<section class="weekly-faq" style="margin-top:2rem">
<h2>家長常見問題</h2>
<h3>讀寫障礙會否學不會游泳？</h3>
<p>一般不會。重點是少依賴長文字，多示範與分步。游泳甚至可以成為孩子建立自信的強項。</p>
<h3>DCD 孩子游自由泳／蛙泳特別難？</h3>
<p>初學時四肢與呼吸協調確實較吃力。我們會拆細步驟、放慢要求，並留意池邊安全；進步往往靠重複與成功經驗堆疊。</p>
</section>
<p style="margin-top:1.5rem">延伸閱讀：<a href="sen-swim-adhd.html">ADHD</a> · <a href="sen-swim-autism.html">自閉症</a> · <a href="sen-swim-communication.html">泳池溝通</a> · <a href="sen-guide.html">總覽</a></p>
${CTA()}
</div></section>`,
  },
  {
    file: 'sen-swim-benefits.html',
    title: '特殊需要兒童習泳的價值 | 新天地',
    description:
      'SEN 兒童習泳的生理、心理、家庭與社交價值：浮力、靜水壓、感覺統合、專注力、情緒與自信。家長教育參考，非醫療診斷。',
    keywords: 'SEN游泳好處, 特殊需要習泳價值, 水中感覺統合, 自閉症游泳好處, ADHD游泳',
    body: `<section class="page-header"><div class="container"><h1>特殊需要兒童習泳的價值</h1><p>從感覺統合、動作發展到情緒與社交：水中活動如何成為全方位支援</p></div></section>
${learnHero('hero-sen-guide.webp', '共融插畫：SEN 孩子在水中建立自信與安全感', '習泳價值：身體被承托、感覺被整理、努力被看見')}
<section class="section"><div class="container reading-flow">
<p>游泳不是要把 SEN 孩子變成競技泳手，而是給他們一個身體被承托、感覺被整理、努力被看見的空間。水的浮力、阻力與均勻壓力，往往正好對準許多特殊需要孩子的共同挑戰。</p>
${DISCLAIMER}
<h2>為甚麼是水？</h2>
<ul>
<li><strong>浮力：</strong>水可大幅減輕體重負擔；陸上難站立或步行的孩子，在水中較易體驗直立與移動。</li>
<li><strong>靜水壓：</strong>水均勻包裹全身，提供穩定的深壓觸覺，對感覺敏感或焦慮的孩子常帶來安穩感。</li>
<li><strong>阻力：</strong>每個動作都對抗阻力，等於可自我調節強度的全身肌力訓練。</li>
<li><strong>溫度與節奏：</strong>合適水溫有助放鬆；划水與呼吸節奏同時訓練心肺與自我調節。</li>
</ul>
${learnFigure('teach-safe-guidance.webp', '水中安全引導與承托示意', '安全承托：先適應水，再談泳式')}
${motionFig('anim-bubbles.svg', '水中氣泡上升動態示意', '吹泡泡、洗臉、坐池邊拍水，都是有效的第一步')}
<h2>六大發展方向</h2>
<ol>
<li><strong>感覺統合：</strong>前庭、本體、觸覺同時啟動，幫助大腦整理感官訊息。</li>
<li><strong>動作與肌力：</strong>低衝擊、高參與，改善平衡、協調、核心與耐力。</li>
<li><strong>專注與執行功能：</strong>記住動作序列、等待輪到自己、變換任務——練習工作記憶、抑制控制與認知彈性。</li>
<li><strong>情緒調節：</strong>深壓與節奏呼吸有助降低喚醒水平，提升安全感。</li>
<li><strong>社交溝通：</strong>輪流、模仿、共同注意，在水中往往比陸上更容易練習。</li>
<li><strong>自信與自主：</strong>學會終身可用的水中安全技能，建立「我做得到」的自我形象。</li>
</ol>
<h2>不同需要，水中各有重點（概念）</h2>
<ul>
<li><strong>自閉症：</strong>可預測的水溫與壓力；視覺示範多於複雜口語。</li>
<li><strong>ADHD：</strong>全身活動調節喚醒；阻力令動作變慢、變清晰。</li>
<li><strong>唐氏綜合症：</strong>低衝擊有氧，強化肌力與心肺（健康注意見專頁）。</li>
<li><strong>肢體／協調困難：</strong>浮力減壓，反覆練習動作序列並即時獲得身體回饋。</li>
</ul>
<p>延伸：<a href="sen-swim-autism.html">自閉症</a> · <a href="sen-swim-adhd.html">ADHD</a> · <a href="sen-swim-down-syndrome.html">唐氏綜合症</a> · <a href="sen-swim-physical.html">肢體・視覺・聽力</a> · <a href="sen-swim-learning.html">讀寫／動作協調</a></p>
<h2>如何開始：安全、節奏、適配</h2>
<ol>
<li><strong>安全先行：</strong>合適師生安排、合格教練；部分孩子若有癲癇、心臟或脊柱情況，請先諮詢醫生。</li>
<li><strong>由水適應開始：</strong>不必急於學泳式。吹泡泡、洗臉、坐池邊拍水都是有效第一步。</li>
<li><strong>感覺先行：</strong>觸覺過敏可先短時接觸；尋求強烈刺激者可逐步加入翻滾等活動。</li>
<li><strong>結構要清晰：</strong>固定流程、視覺時間表、短指令、即時具體讚賞。</li>
<li><strong>與其他專業連結：</strong>可與職治、物治、言語治療目標對齊，把課堂進步帶回日常。</li>
</ol>
<section class="weekly-faq" style="margin-top:2rem">
<h2>家長常見問題</h2>
<h3>習泳能「根治」特殊需要嗎？</h3>
<p>不能。目標是減少困難、提升適應與安全，而不是治癒診斷。把期望放在「可見的小進步」最健康。</p>
<h3>怕水的孩子適合開始嗎？</h3>
<p>適合，但要由水適應起步，寧短勿長。詳見<a href="sen-swim-safety.html">安全家長指引</a>與<a href="sen-swim-behavior.html">正向行為與課堂</a>。</p>
</section>
<p style="margin-top:1.5rem"><a href="sen-guide.html">返回特殊需要總覽</a> · <a href="resources.html">家長資源</a></p>
${CTA()}
</div></section>`,
  },
  {
    file: 'sen-swim-behavior.html',
    title: '正向行為管理與 SEN 游泳課堂 | 新天地',
    description:
      '特殊需要游泳課的正向行為策略：可預測結構、具體讚賞、ABC 行為分析、先調節再教學。家長與教練共通語言。',
    keywords: '正向行為管理, SEN游泳行為, ABC行為分析, 視覺流程, 特殊需要課堂管理',
    body: `<section class="page-header"><div class="container"><h1>正向行為與 SEN 游泳課堂</h1><p>行為是訊息：先理解原因，再調整環境與教學</p></div></section>
${learnHero('hero-sen-adhd.webp', '共融插畫：教練以清晰結構與正向回饋引導孩子', '正向行為：清晰、簡潔、一致、可預測')}
<section class="section"><div class="container reading-flow">
<p>正向行為管理<strong>不是</strong>單純「控制孩子」或「懲罰不當行為」，而是用清晰課堂結構、正面溝通、環境安排與一致回饋，提高孩子成功參與的機會。核心問題不是「怎樣令他聽話」，而是「他為甚麼這樣做？我可以怎樣調整，令合適行為更容易出現？」</p>
${DISCLAIMER}
<h2>常見課堂行為，往往是訊息</h2>
<p>例如：不肯下水、不跟指令、離開水道、等候時走來走去、哭喊、對流程改變不安、對水花／觸感強烈反應。請先考慮：他是否不明白要求、焦慮、感官過載、面對突變、難度太高、疲倦，或無法用語言表達需要？</p>
${learnFigure('teach-visual-schedule.webp', '視覺流程卡示意', '可預測流程：集合 → 熱身 → 練習 → 遊戲 → 離水')}
${motionFig('anim-visual-schedule.svg', '課堂步驟卡依序發亮', '看得見下一步，比空喊「乖啲」更有用')}
<h2>核心策略（家長也能配合）</h2>
<ol>
<li><strong>可預測的課堂結構：</strong>固定集合點與入水程序；用視覺流程卡；活動轉換前先預告；清楚開始與結束。</li>
<li><strong>正面、具體的規則：</strong>說「輪到你才入水」「完成後在紅線等位」，比抽象「乖啲」或只說「唔好」更有效。</li>
<li><strong>具體正向強化：</strong>即時說出他做到甚麼（「聽到停就停，好專心」），可用讚賞、貼紙或喜愛活動時間；強化物要因人而異。</li>
<li><strong>安全行為即時處理：</strong>推人、池邊奔跑、未經指示跳水等，用短句即時停下來並重申規則，再盡快回到活動，避免長篇責罵。</li>
<li><strong>描述行為，不標籤人：</strong>用「而家返去紅線」代替「你又唔聽話」；避免公開羞辱或與其他孩子比較。</li>
<li><strong>提供有限選擇：</strong>「想先練踢水定划手？」「而家用唔用浮板？」在安全範圍內增加自主感。</li>
<li><strong>先調節，再教學：</strong>情緒升溫時先保安全、少說話、降刺激、給空間；平復後才繼續練。</li>
</ol>
<h2>ABC：前因—行為—結果</h2>
<p>簡單記錄有助找出模式：行為前發生了甚麼（前因）？孩子實際做了甚麼（行為）？之後發生了甚麼（結果）？例如：教練要求由淺水到較深水域（前因）→ 孩子哭著拒絕（行為）→ 若每次都因此取消練習（結果），「哭鬧＝逃避」的連結可能被強化。較佳做法是預告、拆細步驟、先在熟悉環境練習、給選擇，並對小成功即時讚賞。</p>
<section class="weekly-faq" style="margin-top:2rem">
<h2>家長常見問題</h2>
<h3>正向行為是否等於沒有規矩？</h3>
<p>不是。規矩仍然重要，尤其涉及泳池安全。差別在於：以預防與教導為主，懲罰不是唯一工具。</p>
<h3>孩子一哭就停課，會否養成習慣？</h3>
<p>要分辨「恐懼／感官過載」與「學會用哭逃避任務」。前者需要降難度與調節；後者需要輔助完成一小步或提供替代溝通，而不是每次都完全取消目標。詳情可與教練討論。</p>
</section>
<p style="margin-top:1.5rem">延伸：<a href="sen-swim-safety.html">安全指引</a> · <a href="sen-swim-autism.html">自閉症</a> · <a href="sen-swim-adhd.html">ADHD</a> · <a href="resources.html">家長資源</a> · <a href="sen-guide.html">總覽</a></p>
${CTA()}
</div></section>`,
  },
  {
    file: 'sen-swim-safety.html',
    title: '特殊需要游泳安全家長指引 | 新天地',
    description:
      'SEN 游泳安全：課前健康溝通、更衣室注意、泳池環境、教學過程觀察與課後交接。家長教育參考。',
    keywords: 'SEN游泳安全, 特殊需要泳池安全, 兒童游泳安全, 更衣室安全, 香港SEN游泳',
    body: `<section class="page-header"><div class="container"><h1>特殊需要游泳安全家長指引</h1><p>由更衣室到交回家長：把安全做成可預期的流程</p></div></section>
${learnHero('hero-sen-physical.webp', '共融插畫：泳池安全引導與家長交接', '安全先行：互信、清楚溝通、全程交接')}
<section class="section"><div class="container reading-flow">
<p>水中學習的第一步永遠是安全。以下整理課前、更衣室、泳池與課後重點，方便家長與教練對齊——個別安排仍以孩子實際情況與場地設施為準。</p>
${DISCLAIMER}
${learnFigure('teach-safe-guidance.webp', '水中安全引導示意', '安全引導：清楚溝通比硬背動作更重要')}
${motionFig('anim-breath.svg', '呼吸節奏動態示意', '先看呼吸，再看動作：圓圈慢放慢收，提醒節奏要穩')}
<h2>1. 課堂前的準備</h2>
<ul>
<li>建立互信：用恰當、溫和的語言與身體語言，讓孩子感到被尊重。</li>
<li>向教練說明身體狀況、近況、自理能力，以及有效安撫方法。</li>
<li>如有醫生叮囑的活動限制、近期病況或藥物影響，請提前告知。</li>
<li><strong>暫不宜游泳的常見情況（請先諮詢醫生／教練）：</strong>高燒未退的傳染病、中耳炎／耳管治療、嚴重對氯過敏、開放性傷口、醫生指示不宜劇烈活動的心臟病等。</li>
<li>唐氏綜合症等孩子上呼吸道較易受感染，不適時宜休息。</li>
<li>考慮進膳與訓練時間間隔；核對帶備物品（泳衣、泳帽、毛巾等）。</li>
<li>師生安排視乎需要個別調整；嚴重需要時傾向更緊密監管。</li>
</ul>
<h2>2. 更衣室</h2>
<ul>
<li>注意地面濕滑與障礙物；視障孩子需要清晰定向與通道預告。</li>
<li>介紹設施位置；留意孩子對吹風機、花灑、洗手間的恐懼或抗拒。</li>
<li>輪椅家庭請提前查詢無障礙通道、斜坡或升降設施是否可用。</li>
<li>留意花灑水溫；進出更衣室要有清晰交接。</li>
</ul>
<h2>3. 泳池與教學過程</h2>
<ul>
<li>了解水深、水溫與防滑地面；初學／適應期通常需要較舒適的水溫。</li>
<li>訓練強度視身體狀況而定；留意嘴唇發紺、打顫、起雞皮等寒冷或不適訊號。</li>
<li>安排充分休息；教導孩子如何求助；留意情緒與行為變化。</li>
<li>輔助工具妥善使用與存放；避開尖銳或粗糙池面。</li>
<li>危險行為（奔跑、推人、未經指示跳水）必須即時用短句制止。</li>
<li><strong>先看呼吸，再看動作：</strong>留意咳嗽、嗆水、嘴唇或臉色發白／發青；臥姿時更要定期觀察。發現異常即停，必要時啟動場地急救流程。</li>
<li><strong>已知發作病史：</strong>請課前說明發作模式與緊急聯絡。課堂以預防為先；若水中出現疑似發作，優先保護頭部、避免撞擊池邊，並依教練預案與現場救生安排處理——具體步驟以醫生建議及場地急救流程為準，本頁不作醫療指引。</li>
<li><strong>醫療裝置：</strong>如餵食管、氣管造口、分流管、脊椎支架等，必須課前告知。我們會按醫生限制調整，不會自行更改醫護設定。</li>
</ul>
<h2>4. 轉移與扶抱（尊嚴與同意）</h2>
<p>若孩子需要協助入水、離水或在池邊移動，我們會<strong>先說明、再徵得同意</strong>，用穩定、可預期的方式協助，而不是突然抱起。家長請告訴我們：孩子慣用哪一側、哪裡不能拉、是否怕觸碰。扶抱屬於受訓技巧，本頁<strong>不公開操作步驟</strong>，以免在家中或泳池自行模仿造成受傷。</p>
<h2>5. 課堂後</h2>
<ul>
<li>確認由指定家人／照顧者接回；不要讓孩子無人看管離開。</li>
<li>觀察訓練後身體狀況；與教練短短交接今日成功點與明日注意。</li>
</ul>
<section class="weekly-faq" style="margin-top:2rem">
<h2>家長常見問題</h2>
<h3>第一次來要帶甚麼資料？</h3>
<p>簡單列出診斷重點（如有）、觸發不安因素、有效安撫方法、醫生活動限制即可。不一定要完整病歷本，但關鍵安全資訊愈清楚愈好。</p>
<h3>孩子當天輕微不適可以上課嗎？</h3>
<p>若發燒、耳痛、開放傷口或醫生囑咐休息，請改期。寧可多休息一天，也不要冒險下水。</p>
<h3>有發作病史還可以學游泳嗎？</h3>
<p>許多家庭在醫生評估許可下仍可參與水中活動，但必須課前充分溝通、場地有應變預案，並由熟悉孩子的成人配合。請先 WhatsApp 說明情況，我們再建議合適起步方式。</p>
</section>
<p style="margin-top:1.5rem">延伸：<a href="booking.html">預約試堂</a> · <a href="sen-swim-communication.html">泳池溝通</a> · <a href="sen-swim-behavior.html">正向行為</a> · <a href="sen-swim-physical.html">肢體・視覺・聽力</a> · <a href="sen-guide.html">總覽</a></p>
${CTA()}
</div></section>`,
  },
  {
    file: 'sen-swim-communication.html',
    title: 'SEN 游泳溝通與 AAC | 新天地',
    description:
      '低口語、語言障礙與自閉症孩子的泳池溝通：短指令、視覺圖卡、PECS／AAC，沿用孩子慣用的溝通方式。香港 SEN 游泳。',
    keywords: 'PECS游泳, AAC溝通, 圖卡溝通, SEN游泳溝通, 低口語游泳, 匡智溝通易',
    body: `<section class="page-header"><div class="container"><h1>泳池裡怎樣溝通？</h1><p>語言不只是說話：手勢、圖卡、表情與孩子慣用的 AAC，都可以成為課堂語言</p></div></section>
${learnHero('hero-sen-autism.webp', '共融插畫：教練以圖卡與手勢協助孩子理解課堂', '溝通先行：找到孩子聽得懂、表達得出的平台')}
<section class="section"><div class="container reading-flow">
<p>有些孩子怕說話、句子短；有些滔滔不絕但組織弱；有些口語不錯，卻難輪流、難對題。這都可能是<strong>語言或社交溝通需要</strong>，不是「不聽話」。游泳課會先找出合適的語言平台：孩子現有能力、家中慣用語言（單語／雙語），以及他已經在用的圖卡或 App。</p>
${DISCLAIMER}
${learnFigure('teach-visual-schedule.webp', '圖卡交換溝通示意', '視覺安排：孩子看得見下一步，焦慮往往會下降')}
${motionFig('anim-pecs.svg', '圖卡交換動態示意', '動態示意：主動遞出圖片，讓溝通變得有用')}
<h2>課堂溝通原則</h2>
<ol>
<li><strong>簡化、示範、重複：</strong>少長句、少比喻；一次一個重點；示範比講解更有效。</li>
<li><strong>預告流程：</strong>「事先張揚」下一節做甚麼；一堂拆成多個短小節。</li>
<li><strong>給時間回應：</strong>問完等一等，不要立刻再講第二句。</li>
<li><strong>沿用孩子的系統：</strong>若家中／學校用 PECS、溝通簿或 AAC App，請帶同一套來泳池。</li>
<li><strong>位置與環境：</strong>需要較多支援的孩子可較靠近教練、光線足夠看見口型或圖卡；被動與容易激動的孩子分組時宜分開。</li>
</ol>
<h2>圖卡交換（PECS）概念</h2>
<p>圖片交換溝通系統教導孩子<strong>主動遞出圖片</strong>來表達需要，而不是只等待別人猜。階段由單張圖卡易物，逐步到走去找溝通夥伴、分辨圖卡、組合「我想要＋物品」、再回應問題與評論。好處是建立「溝通有用」的動機，減少因表達不出而哭鬧。</p>
<p>泳池實用例子：帶「休息」「再試一次」「耳塞」「上岸」等圖卡，讓孩子在水中仍有方法表達，而不是只能用掙扎或喊叫。</p>
<h2>電子 AAC（輔助溝通）</h2>
<p>當紙本圖卡需要更多詞彙或發聲支援，家庭可考慮 AAC App。香港本地有志願機構研發、針對粵語及在地生活情境的免費選擇（例如匡智會「匡智溝通易」），亦有國際 AAC 工具。我們<strong>不指定、不代售任何 App</strong>，但歡迎你把已設定好的溝通版面帶來課堂，讓學校、家中與泳池用同一套符號。</p>
<ul>
<li>請先告訴教練：孩子用點選、掃描，還是需要我們幫忙拿穩裝置。</li>
<li>電子產品怕水，請用防水袋或由岸上家長協助出示圖卡。</li>
<li>課堂目標是「孩子能表達需要」，不是學會某一款軟件。</li>
</ul>
<h2>視障／聽障的額外提示</h2>
<ul>
<li>視障：口語描述環境、固定出發點；可用聲音提示轉換活動。</li>
<li>聽障：面對面、光線足夠、手勢與圖卡；助聽器／耳蝸下水前按家長指示保管。</li>
</ul>
<section class="weekly-faq" style="margin-top:2rem">
<h2>家長常見問題</h2>
<h3>孩子完全沒有口語，可以學游泳嗎？</h3>
<p>可以。我們會用示範、圖卡與固定流程。請把孩子慣用的溝通方法告訴教練，第一次試堂就可以帶圖卡來。</p>
<h3>一定要用 PECS 或買 App 嗎？</h3>
<p>不必。紙本圖卡、手勢、物件提示都可以。選擇應配合孩子現有能力與言語治療師建議。</p>
<h3>孩子懂說話，為甚麼還要用圖？</h3>
<p>水中嘈雜、焦慮時，口語理解會下降。視覺提示能減輕負擔，對「高口語」孩子同樣有用。</p>
</section>
<p style="margin-top:1.5rem">延伸：<a href="sen-swim-autism.html">自閉症</a> · <a href="sen-swim-intellectual.html">智力及多重障礙</a> · <a href="sen-swim-physical.html">肢體・視覺・聽力</a> · <a href="sen-swim-behavior.html">正向行為</a> · <a href="resources.html">家長資源</a></p>
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
${learnHero('hero-booking.webp', '共融插畫：家庭查詢各區 SEN 游泳課程', '各區家庭歡迎查詢合適上課地點與班別')}
<section class="section"><div class="container reading-flow">
<p>新天地專注 SEN 學童游泳及多功能發展，家長可透過 WhatsApp 查詢就近班別與時間。我們會按孩子需要建議個別或小組課程。</p>
<h2>常見查詢</h2>
<ul><li>首次評估與試堂安排</li><li>交通與更衣室無障礙需要</li><li>兄弟姊妹／家長陪同政策</li></ul>
<p>詳細地址與泳池資料請<a href="contact.html">聯絡我們</a>，以便提供最新資訊。</p>
<p><a href="sen-guide.html">認識特殊需要與課程方向</a> · <a href="sen-swim-safety.html">游泳安全家長指引</a> · <a href="sen-swim-communication.html">泳池溝通</a></p>
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
<h2>課堂實用三步驟：觀察 → 理解 → 調整</h2>
<ol>
<li><strong>觀察：</strong>孩子對水花、聲音、觸感是回避還是尋求？何時開始焦慮或興奮？</li>
<li><strong>理解：</strong>過高反應可能需要降刺激（少人、少聲、短課）；過低反應可能需要更清晰節奏與本體覺輸入。</li>
<li><strong>調整：</strong>改水深、用具、指令長度或休息節奏——目標是「先穩定，再進步」，而不是硬撐完整堂課。</li>
</ol>
<p>建議家長把目標設定為「先穩定，再進步」：先讓孩子喜歡水、信任教練，再逐步加入技巧訓練。</p>
${DISCLAIMER}
<p><a href="sen-swim-autism.html">了解自閉症游泳課程</a> · <a href="services.html#sensory">水中感統訓練</a> · <a href="sen-guide.html">認識特殊需要</a> · <a href="booking.html">預約試堂</a></p>
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
<p>ADHD 孩子並非不聽話，而是需要更清晰的界線與即時回饋。課堂上我們會保持視線與伸手可及範圍、少長篇講解，並用短而密的練習維持動力。</p>
<ol>
<li>短單元教學，每完成一項即具體稱讚</li>
<li>視覺提示卡列出課堂流程；用地墊／浮線標示等待區</li>
<li>「一指令一動作」，避免訊息堆疊</li>
<li>正向代幣或貼紙：完成一組練習可換最後幾分鐘自由玩水</li>
<li>預留動態休息／簡單水中遊戲，再溫和回到任務；課後與家長溝通延伸練習</li>
</ol>
<p><a href="sen-swim-adhd.html">ADHD 游泳專項課程</a> · <a href="sen-swim-learning.html">讀寫／動作協調</a> · <a href="sen-guide.html">認識特殊需要</a></p>
</div></section>`,
  },
  {
    file: 'blog-article-coach-notes.html',
    title: '教練培訓錄音整理：家長最該知道的五件事 | 新天地',
    description:
      '從特殊需要游泳教練培訓與家長分享錄音整理：行為是訊息、游泳非根治、漸進入水、安全交接、具體讚賞。',
    keywords: 'SEN游泳家長須知, 正向行為, 游泳安全, 自閉症游泳, 教練培訓',
    body: `<section class="page-header"><div class="container"><h1>教練培訓錄音整理：家長最該知道的五件事</h1><p>2026年9月 · 新天地教練團隊</p></div></section>
<section class="section"><div class="container article-body">
<p>我們把近期教練培訓與經驗分享錄音，消化成家長聽得懂的五個重點——不公開錄音原文，只留下對家校合作真正有用的共識。</p>
${DISCLAIMER}
<ol>
<li><strong>行為是訊息，不是「壞」：</strong>哭鬧、摀耳、拒絕下水，可能是不明白、焦慮、感官過載或難度太高。先問「為甚麼」，再調環境與步驟。詳見<a href="sen-swim-behavior.html">正向行為專頁</a>。</li>
<li><strong>游泳不能根治診斷：</strong>水中活動有助感覺調節、安全技能與自信，但目標是減少生活困難，不是「治好」自閉症或 ADHD。把期望放在可見的小進步最健康。詳見<a href="sen-swim-benefits.html">習泳的價值</a>。</li>
<li><strong>怕水就漸進，絕不強推：</strong>池邊拍水 → 局部浸水 → 再全身入水。極度恐慌時退回上一階段；強行入水可能造成長期恐水。詳見<a href="sen-swim-autism.html">自閉症專頁</a>。</li>
<li><strong>安全從更衣室做到交接手：</strong>課前說清楚健康限制與安撫方法；下課必須由指定照顧者接回。助聽器等貴重輔具下水前妥善保管。詳見<a href="sen-swim-safety.html">安全家長指引</a>。</li>
<li><strong>讚賞要說出他做到甚麼：</strong>「你今日聽到停就停，好專心」比只說「叻」更能幫助孩子重複合適行為；規則用正面、具體的句子寫清楚。</li>
<li><strong>帶孩子慣用的溝通方式來：</strong>圖卡、手勢或 AAC App 都可以；泳池嘈雜時視覺比長句更穩。詳見<a href="sen-swim-communication.html">泳池溝通專頁</a>。</li>
</ol>
<p>課堂常用結構是：熱身 → 主題練習 → 遊戲 → 緩和 → 課後一句延伸。先看孩子、不先看標籤；安全永遠比踢腿姿勢標準更重要。</p>
<p>若家庭日後有興趣認識特殊奧運或協會體驗活動，我們認同「重在參與」——完成比賽、建立自信，比獎牌更重要。詳見<a href="sen-swim-development.html">游泳運動發展</a>。</p>
<p><a href="resources.html">家長資源</a> · <a href="sen-guide.html">認識特殊需要</a> · <a href="booking.html">預約試堂</a></p>
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
