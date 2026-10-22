/**
 * 全站共用 header／footer／腳本引用（單一來源）
 */
export const CSS_HREF = 'css/style.css?v=20261022b';

export const SCRIPT_TAGS = `<script src="js/site-ui.js?v=20261022b" defer></script>
    <script src="js/share.js?v=20261021a" defer></script>
    <script src="js/analytics.js?v=20260525a" defer></script>
    <script src="js/security.js"></script>`;

export const WA_NAV =
  'https://wa.me/85297083907?text=' + encodeURIComponent('多謝家長的查詢');

/** @type {{ href: string, label: string, id: string }[]} */
export const NAV_ITEMS = [
  { href: 'index.html', label: '首頁', id: 'index' },
  { href: 'about.html', label: '關於我們', id: 'about' },
  { href: 'services.html', label: '服務項目', id: 'services' },
  { href: 'why-us.html', label: '為何選擇我們', id: 'why-us' },
  { href: 'resources.html', label: '家長資源', id: 'resources' },
  { href: 'blog.html', label: '教練專欄', id: 'blog' },
  { href: 'booking.html', label: '預約課程', id: 'booking' },
  { href: 'contact.html', label: '聯絡我們', id: 'contact' },
];

const ICON_CLOSE = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const ICON_MENU = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;

/**
 * @param {{ active?: string }} [opts]
 */
export function renderHeader({ active = '' } = {}) {
  const links = NAV_ITEMS.map((item) => {
    const cls = item.id === active || item.href === active ? 'nav-link active' : 'nav-link';
    return `                    <a href="${item.href}" class="${cls}">${item.label}</a>`;
  }).join('\n');

  return `    <header class="header" id="header">
        <div class="header-inner">
            <a href="index.html" class="logo">
                <div class="logo-icon"><img src="images/icons/logo-header.svg" alt="新天地"></div>
                <div class="logo-text">新天地<span>SEN學生游泳及多功能發展</span></div>
            </a>
            <nav class="nav" id="nav">
                <div class="nav-drawer-header">
                    <div class="logo-text">新天地<span>導航選單</span></div>
                    <button class="nav-close-btn" id="nav-close-btn" aria-label="關閉選單">${ICON_CLOSE}</button>
                </div>
                <div class="nav-drawer-links">
${links}
                </div>
                <div class="nav-drawer-footer">
                    <a href="${WA_NAV}" target="_blank" rel="noopener" class="btn btn-primary">WhatsApp 查詢</a>
                </div>
            </nav>
            <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="開啟選單">${ICON_MENU}</button>
        </div>
    </header>`;
}

/**
 * @param {{ variant?: 'full' | 'compact' }} [opts]
 */
export function renderFooter({ variant = 'compact' } = {}) {
  if (variant === 'full') {
    return `    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-section">
                    <h4>新天地</h4>
                    <p>香港專為SEN學生設立的游泳及多功能發展機構，致力於為有特殊教育需要的兒童提供專業、關愛的服務。</p>
                    <div class="footer-social">
                        <a href="https://wa.me/85297083907" class="footer-social-link" target="_blank" rel="noopener" aria-label="WhatsApp 查詢"><img src="images/icons/icon-whatsapp.svg" alt=""><span class="footer-social-label">WhatsApp</span></a>
                    </div>
                </div>
                <div class="footer-section">
                    <h4>快速連結</h4>
                    <a href="about.html">關於我們</a>
                    <a href="services.html">服務項目</a>
                    <a href="why-us.html">為何選擇我們</a>
                    <a href="resources.html">家長資源</a>
                    <a href="sen-guide.html">認識特殊需要</a>
                    <a href="blog.html">教練專欄</a>
                    <a href="booking.html">預約課程</a>
                    <a href="contact.html">聯絡我們</a>
                </div>
                <div class="footer-section">
                    <h4>服務類別</h4>
                    <a href="services.html#swim">游泳教學</a>
                    <a href="services.html#sensory">感統訓練</a>
                    <a href="services.html#social">社交技巧訓練</a>
                    <a href="services.html#focus">專注力訓練</a>
                    <a href="services.html#parent">親子游泳</a>
                </div>
                <div class="footer-section">
                    <h4>聯絡我們</h4>
                    <p><span class="contact-detail-icon"><img src="images/icons/icon-phone.svg" alt="電話" style="width:16px;height:16px;filter:brightness(0)invert(0.7);display:inline;vertical-align:middle;margin-right:6px;"></span> 9708 3907</p>
                    <p><span class="contact-detail-icon"><img src="images/icons/icon-email.svg" alt="電郵" style="width:16px;height:16px;filter:brightness(0)invert(0.7);display:inline;vertical-align:middle;margin-right:6px;"></span> info@leisure.org.hk</p>
                    <p><span class="contact-detail-icon"><img src="images/icons/icon-time.svg" alt="時間" style="width:16px;height:16px;filter:brightness(0)invert(0.7);display:inline;vertical-align:middle;margin-right:6px;"></span> 星期一至六: 9:00 - 20:00</p>
                    <p class="footer-hours-secondary" style="padding-left:22px;">星期日: 10:00 - 18:00</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 新天地 SEN學生游泳及多功能發展中心 · <a href="sitemap.xml">網站地圖</a> · <a href="sen-guide.html">認識特殊需要</a></p>
            </div>
        </div>
    </footer>`;
  }

  return `    <footer class="footer">
        <div class="container">
            <div class="footer-bottom">
                <p>&copy; 2026 新天地 SEN學生游泳及多功能發展中心 · <a href="sitemap.xml">網站地圖</a> · <a href="sen-guide.html">認識特殊需要</a></p>
            </div>
        </div>
    </footer>`;
}

/** 著陸頁殼層用的簡易選單腳本（手維頁可另有更完整 inline） */
export function renderNavInlineScript() {
  return `<script>
        const mobileMenuBtn=document.getElementById('mobile-menu-btn'),nav=document.getElementById('nav'),navBackdrop=document.getElementById('nav-backdrop'),navCloseBtn=document.getElementById('nav-close-btn');
        function openNav(){nav.classList.add('active');navBackdrop.classList.add('active');document.body.style.overflow='hidden';}
        function closeNav(){nav.classList.remove('active');navBackdrop.classList.remove('active');document.body.style.overflow='';}
        mobileMenuBtn&&mobileMenuBtn.addEventListener('click',openNav);
        navCloseBtn&&navCloseBtn.addEventListener('click',closeNav);
        navBackdrop&&navBackdrop.addEventListener('click',closeNav);
    </script>`;
}

/**
 * 依檔名推導 active nav id
 * @param {string} file
 */
export function activeFromFile(file) {
  const base = String(file || '').replace(/\.html$/i, '');
  if (base === 'index' || base === '') return 'index';
  if (NAV_ITEMS.some((n) => n.id === base)) return base;
  if (base.startsWith('blog')) return 'blog';
  if (base.startsWith('sen-') || base.startsWith('download-')) return 'resources';
  if (base === 'areas-hong-kong') return 'contact';
  return '';
}

/** 行銷頁：完整 footer */
export const FULL_FOOTER_FILES = new Set([
  'index.html',
  'about.html',
  'services.html',
  'why-us.html',
  'resources.html',
  'blog.html',
  'booking.html',
  'contact.html',
  'sen-guide.html',
  'areas-hong-kong.html',
]);
