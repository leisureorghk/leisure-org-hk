/**
 * 共用 SEO：head 標籤、JSON-LD、sitemap 產生
 */
import fs from 'fs';
import path from 'path';

export function loadSeoConfig(root) {
  const p = path.join(root, 'data', 'seo-config.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function absUrl(site, pagePath) {
  const base = site.baseUrl.replace(/\/$/, '');
  if (pagePath === '/' || pagePath === '') return `${base}/`;
  const rel = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
  return `${base}${rel}`;
}

export function imageUrl(site, imagePath) {
  const p = imagePath.startsWith('http') ? imagePath : absUrl(site, imagePath);
  return p;
}

function escAttr(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

export function renderSeoHead(site, page) {
  const url = absUrl(site, page.path);
  const img = imageUrl(site, site.defaultImage);
  const robots = page.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const ogType = page.ogType || 'website';
  const title = page.title;
  const desc = page.description;

  return `    <!-- seo-head -->
    <link rel="canonical" href="${escAttr(url)}">
    <link rel="alternate" hreflang="${escAttr(site.language)}" href="${escAttr(url)}">
    <link rel="alternate" hreflang="x-default" href="${escAttr(url)}">
    <link rel="sitemap" type="application/xml" title="Sitemap" href="${escAttr(absUrl(site, '/sitemap.xml'))}">
    <link rel="manifest" href="${escAttr(absUrl(site, '/site.webmanifest'))}">
    <link rel="alternate" type="application/rss+xml" title="${escAttr(site.name)} 教練專欄" href="${escAttr(absUrl(site, '/rss.xml'))}">
    <meta name="robots" content="${escAttr(robots)}">
    <meta name="googlebot" content="${escAttr(robots)}">
    <meta name="bingbot" content="${escAttr(robots)}">
    <meta name="slurp" content="${escAttr(robots)}">
    <meta name="author" content="${escAttr(site.nameFull)}">
    <meta name="geo.region" content="HK">
    <meta name="geo.placename" content="Hong Kong">
    <meta property="og:locale" content="${escAttr(site.locale)}">
    <meta property="og:type" content="${escAttr(ogType)}">
    <meta property="og:site_name" content="${escAttr(site.name)}">
    <meta property="og:title" content="${escAttr(title)}">
    <meta property="og:description" content="${escAttr(desc)}">
    <meta property="og:url" content="${escAttr(url)}">
    <meta property="og:image" content="${escAttr(img)}">
    <meta property="og:image:alt" content="${escAttr(site.nameFull)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escAttr(title)}">
    <meta name="twitter:description" content="${escAttr(desc)}">
    <meta name="twitter:image" content="${escAttr(img)}">
${site.googleSiteVerification ? `    <meta name="google-site-verification" content="${escAttr(site.googleSiteVerification)}">\n` : ''}${site.bingSiteVerification ? `    <meta name="msvalidate.01" content="${escAttr(site.bingSiteVerification)}">\n` : ''}    <!-- /seo-head -->`;
}

export function renderHeadJsonLd(site, page, config) {
  const blocks = [];
  const schemas = page.schemas || [];

  if (schemas.includes('breadcrumb') && page.breadcrumb?.length) {
    blocks.push(breadcrumbJsonLd(site, page));
  }
  if (schemas.includes('website')) {
    blocks.push(webSiteJsonLd(site));
  }
  if (schemas.includes('faq') && config.faq?.length) {
    blocks.push(faqPageJsonLd(config.faq));
  }
  if (schemas.includes('article') || (page.ogType === 'article' && schemas.includes('breadcrumb'))) {
    // 固定專欄／下載頁：有 article schema 或 og:article + breadcrumb 時輸出 Article
    if (schemas.includes('article') || String(page.file || '').startsWith('blog-article-')) {
      blocks.push(articleJsonLd(site, page));
    }
  }

  if (!blocks.length) return '';

  const scripts = blocks
    .map((obj) => `    <script type="application/ld+json">\n${JSON.stringify(obj, null, 4).replace(/^/gm, '    ')}\n    </script>`)
    .join('\n');

  return `    <!-- seo-jsonld -->\n${scripts}\n    <!-- /seo-jsonld -->`;
}

function breadcrumbJsonLd(site, page) {
  const items = [
    { '@type': 'ListItem', position: 1, name: '首頁', item: absUrl(site, '/') },
    ...page.breadcrumb.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 2,
      name: crumb.name,
      item: absUrl(site, crumb.path),
    })),
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

function webSiteJsonLd(site) {
  const base = site.baseUrl.replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    name: site.name,
    alternateName: site.nameFull,
    url: `${base}/`,
    inLanguage: 'zh-Hant-HK',
    publisher: { '@id': `${base}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${base}/blog.html?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

function faqPageJsonLd(faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

function articleJsonLd(site, page) {
  const url = absUrl(site, page.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.description,
    url,
    inLanguage: 'zh-Hant-HK',
    datePublished: page.datePublished || page.lastmod || site.contentLastmod,
    dateModified: page.dateModified || page.lastmod || site.contentLastmod,
    author: { '@type': 'Organization', name: site.nameFull },
    publisher: { '@id': `${site.baseUrl.replace(/\/$/, '')}/#organization` },
    isPartOf: { '@id': `${site.baseUrl.replace(/\/$/, '')}/#website` },
    image: imageUrl(site, site.defaultImage),
    keywords: page.keywords || undefined,
  };
}

export function localBusinessJsonLd(site) {
  const addr = {
    '@type': 'PostalAddress',
    streetAddress: site.streetAddress || '香港（上課地點請 WhatsApp 查詢）',
    addressLocality: site.addressLocality || '香港',
    addressRegion: site.addressRegion || 'HK',
    addressCountry: 'HK',
    ...(site.postalCode ? { postalCode: site.postalCode } : {}),
  };
  const geo =
    site.geoLatitude != null && site.geoLongitude != null
      ? {
          '@type': 'GeoCoordinates',
          latitude: site.geoLatitude,
          longitude: site.geoLongitude,
        }
      : undefined;

  const obj = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'SportsActivityLocation', 'EducationalOrganization'],
    '@id': `${site.baseUrl}/#organization`,
    name: site.nameFull,
    alternateName: ['新天地', 'Leisure Organization HK', '新天地 SEN游泳'],
    description:
      '香港首間專為 SEN（特殊教育需要）學生設立的游泳及多功能發展中心，提供游泳教學、感統訓練、社交技巧及專注力訓練。',
    url: site.baseUrl,
    image: imageUrl(site, site.defaultImage),
    logo: imageUrl(site, '/images/icons/app-icon.svg'),
    telephone: site.telephone,
    email: site.email,
    areaServed: { '@type': 'Country', name: site.areaServed },
    address: addr,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '10:00',
        closes: '18:00',
      },
    ],
    sameAs: site.sameAs || [],
    knowsAbout: [
      'SEN游泳',
      '特殊教育游泳',
      '自閉症游泳課程',
      'ADHD專注力訓練',
      '感統訓練',
      '香港游泳教學',
    ],
  };
  if (geo) obj.geo = geo;
  if (site.hasMap) obj.hasMap = site.hasMap;
  return obj;
}

export const OPTIMIZED_FONT_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">`;

export function optimizeFontLinks(html) {
  return html.replace(
    /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">[\s\S]*?family=Playfair[\s\S]*?rel="stylesheet">/gi,
    OPTIMIZED_FONT_LINK
  );
}

const SITE_SCRIPTS = `    <script src="js/site-ui.js?v=20260827b" defer></script>
    <script src="js/share.js?v=20260821a" defer></script>
    <script src="js/analytics.js?v=20260525a" defer></script>
`;

export function injectSiteScripts(html) {
  let out = html;

  // 確保 share.js 在 analytics 之前（或至少存在）
  if (!out.includes('js/share.js')) {
    if (/js\/analytics\.js/.test(out)) {
      out = out.replace(
        /(<script[^>]*src="js\/analytics\.js[^"]*"[^>]*><\/script>)/,
        '    <script src="js/share.js?v=20260821a" defer></script>\n    $1'
      );
    }
  }

  if (out.includes('js/analytics.js')) return out;

  const marker = '<script src="js/security.js">';
  if (out.includes(marker)) {
    return out.replace(marker, SITE_SCRIPTS + marker);
  }
  return out.replace('</body>', SITE_SCRIPTS + '</body>');
}

export function discoverBlogWeeklyFiles(root) {
  const names = fs.readdirSync(root).filter((n) => /^blog-weekly-.+\.html$/i.test(n));
  return names.map((file) => ({
    file,
    path: `/${file}`,
    priority: 0.65,
    changefreq: 'monthly',
  }));
}

export function renderFooterLocalBusiness(site) {
  const obj = localBusinessJsonLd(site);
  return `        <!-- SEO JSON-LD Structured Data -->
        <script type="application/ld+json">
${JSON.stringify(obj, null, 8).replace(/^/gm, '        ')}
        </script>`;
}

export function injectSeoHead(html, seoBlock) {
  if (html.includes('<!-- seo-head -->')) {
    return html.replace(/<!-- seo-head -->[\s\S]*?<!-- \/seo-head -->/, seoBlock.trim());
  }
  const afterTitle = /(<title>[^<]*<\/title>\s*)/i;
  if (afterTitle.test(html)) {
    return html.replace(afterTitle, `$1\n${seoBlock}\n`);
  }
  return html.replace(/<head>/i, `<head>\n${seoBlock}\n`);
}

export function injectHeadJsonLd(html, jsonLdBlock) {
  if (!jsonLdBlock) return html;
  if (html.includes('<!-- seo-jsonld -->')) {
    return jsonLdBlock
      ? html.replace(/<!-- seo-jsonld -->[\s\S]*?<!-- \/seo-jsonld -->/, jsonLdBlock.trim())
      : html.replace(/\s*<!-- seo-jsonld -->[\s\S]*?<!-- \/seo-jsonld -->\s*/g, '\n');
  }
  return html.replace(/<!-- \/seo-head -->/, `<!-- /seo-head -->\n${jsonLdBlock}`);
}

export function updateTitleAndMeta(html, page) {
  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${page.title}</title>`);
  if (page.description) {
    if (/<meta name="description"[^>]*>/i.test(out)) {
      out = out.replace(
        /<meta name="description"[^>]*>/i,
        `<meta name="description" content="${escAttr(page.description)}">`
      );
    } else {
      out = out.replace(
        /<meta name="viewport"[^>]*>/i,
        (m) => `${m}\n    <meta name="description" content="${escAttr(page.description)}">`
      );
    }
  }
  if (page.keywords) {
    if (/<meta name="keywords"[^>]*>/i.test(out)) {
      out = out.replace(
        /<meta name="keywords"[^>]*>/i,
        `<meta name="keywords" content="${escAttr(page.keywords)}">`
      );
    } else if (page.description) {
      out = out.replace(
        /<meta name="description"[^>]*>/i,
        (m) => `${m}\n    <meta name="keywords" content="${escAttr(page.keywords)}">`
      );
    }
  }
  return out;
}

export function replaceFooterJsonLd(html, footerBlock) {
  const re = /<!-- SEO JSON-LD Structured Data -->[\s\S]*?<\/script>\s*/;
  if (re.test(html)) {
    return html.replace(re, `${footerBlock}\n`);
  }
  return html.replace(/<\/footer>/, `\n${footerBlock}    </footer>`);
}

export function writeSitemap(root, config, extraUrls = []) {
  const { site, pages } = config;
  const defaultLastmod = site.contentLastmod || new Date().toISOString().slice(0, 10);
  const indexed = pages.filter((p) => !(p.robots || '').includes('noindex'));

  const fileLastmod = (file) => {
    try {
      const st = fs.statSync(path.join(root, file));
      return st.mtime.toISOString().slice(0, 10);
    } catch {
      return null;
    }
  };

  const urls = [
    ...indexed.map((p) => {
      const fromFile = p.file ? fileLastmod(p.file) : null;
      let lastmod = p.lastmod || fromFile || defaultLastmod;
      if (fromFile && (!p.lastmod || fromFile > (p.lastmod || ''))) lastmod = fromFile;
      return {
        loc: absUrl(site, p.path),
        priority: p.priority ?? 0.5,
        changefreq: p.changefreq ?? 'monthly',
        lastmod,
      };
    }),
    ...extraUrls,
  ];

  const seen = new Set();
  const unique = urls.filter((u) => {
    if (seen.has(u.loc)) return false;
    seen.add(u.loc);
    return true;
  });

  const body = unique
    .map(
      (u) => `    <url>
        <loc>${u.loc}</loc>
        <lastmod>${u.lastmod || defaultLastmod}</lastmod>
        <changefreq>${u.changefreq}</changefreq>
        <priority>${Number(u.priority).toFixed(1)}</priority>
    </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;

  fs.writeFileSync(path.join(root, 'sitemap.xml'), xml, 'utf8');
}

export function collectWeeklyArticleUrls(root) {
  const config = loadSeoConfig(root);
  const urls = [];
  const seen = new Set();

  const add = (entry) => {
    if (!entry?.slug || seen.has(entry.slug)) return;
    seen.add(entry.slug);
    urls.push({
      loc: absUrl(config.site, `/${entry.slug}`),
      priority: 0.65,
      changefreq: 'monthly',
      lastmod: entry.publishedAt?.slice(0, 10),
    });
  };

  const metaPath = path.join(root, 'data', 'weekly-article-meta.json');
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    if (meta.latest) add(meta.latest);
    for (const h of meta.history || []) add(h);
  }

  for (const w of discoverBlogWeeklyFiles(root)) {
    if (seen.has(w.file)) continue;
    seen.add(w.file);
    urls.push({
      loc: absUrl(config.site, w.path),
      priority: w.priority,
      changefreq: w.changefreq,
      lastmod: config.site.contentLastmod,
    });
  }
  return urls;
}

export function writeRssFeed(root, config) {
  const { site } = config;
  const items = [];
  const metaPath = path.join(root, 'data', 'weekly-article-meta.json');
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const list = [...(meta.history || []), ...(meta.latest ? [meta.latest] : [])];
    for (const e of list) {
      if (!e?.slug) continue;
      items.push({
        title: e.title || '每週專題',
        link: absUrl(site, `/${e.slug}`),
        pubDate: e.publishedAt || new Date().toISOString(),
      });
    }
  }
  const escXml = (s) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const channelItems = items
    .slice(0, 20)
    .map(
      (it) => `    <item>
      <title>${escXml(it.title)}</title>
      <link>${escXml(it.link)}</link>
      <pubDate>${new Date(it.pubDate).toUTCString()}</pubDate>
      <guid isPermaLink="true">${escXml(it.link)}</guid>
    </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escXml(site.nameFull)} — 教練專欄</title>
    <link>${escXml(site.baseUrl)}/blog.html</link>
    <description>SEN 游泳教學週報與專題文章</description>
    <language>zh-HK</language>
${channelItems}
  </channel>
</rss>
`;
  fs.writeFileSync(path.join(root, 'rss.xml'), xml, 'utf8');
}

/**
 * 產出根目錄 llms.txt（給大型語言模型／AI 搜尋引用的機構摘要）
 */
export function writeLlmsTxt(root, config) {
  const { site, pages, faq } = config;
  const base = site.baseUrl.replace(/\/$/, '');
  const lines = [
    `# ${site.nameFull}`,
    '',
    `> 香港專為 SEN（特殊教育需要）學童設立的游泳及多功能發展中心。網站：${base}/`,
    '',
    '## 關於',
    '',
    `${site.name} 提供個人化游泳教學、感統訓練、專注力與社交技巧課程，服務自閉症、ADHD、讀寫障礙等特殊需要家庭。電話 ${site.telephone}；WhatsApp https://wa.me/${String(site.telephone || '').replace(/\D/g, '')}`,
    '',
    '## 主要頁面',
    '',
  ];

  const mainPages = (pages || []).filter(
    (p) =>
      !(p.robots || '').includes('noindex') &&
      !String(p.file || '').startsWith('download-') &&
      !String(p.file || '').startsWith('digest-')
  );
  for (const p of mainPages) {
    lines.push(`- [${p.title}](${absUrl(site, p.path)}): ${p.description || ''}`);
  }

  lines.push('', '## 最新教練專欄週報', '');
  const metaPath = path.join(root, 'data', 'weekly-article-meta.json');
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const list = [meta.latest, ...(meta.history || [])].filter(Boolean);
    const seen = new Set();
    for (const e of list.slice(0, 8)) {
      if (!e?.slug || seen.has(e.slug)) continue;
      seen.add(e.slug);
      lines.push(`- [${e.title}](${absUrl(site, `/${e.slug}`)})`);
    }
  } else {
    lines.push('- （尚無週報）');
  }

  if (faq?.length) {
    lines.push('', '## 常見問題', '');
    for (const item of faq.slice(0, 8)) {
      lines.push(`### ${item.question}`);
      lines.push('');
      lines.push(item.answer);
      lines.push('');
    }
  }

  lines.push('## 選用檔案', '');
  lines.push(`- [網站地圖](${base}/sitemap.xml)`);
  lines.push(`- [RSS 教練專欄](${base}/rss.xml)`);
  lines.push(`- [完整說明（llms-full）](${base}/llms-full.txt)`);
  lines.push('');

  fs.writeFileSync(path.join(root, 'llms.txt'), lines.join('\n'), 'utf8');

  const full = [
    ...lines,
    '## 服務關鍵字',
    '',
    'SEN游泳、香港特殊教育游泳、自閉症游泳課程、ADHD游泳、感統訓練、特殊需要兒童游泳、新天地',
    '',
  ];
  fs.writeFileSync(path.join(root, 'llms-full.txt'), full.join('\n'), 'utf8');
}

/**
 * 依週報／頁面關鍵字挑選 2–3 則內鏈著陸頁
 */
export function pickRelatedLandingPages(config, textBlob, limit = 3) {
  const blob = String(textBlob || '').toLowerCase();
  const candidates = [
    {
      path: '/sen-swim-autism.html',
      title: '自閉症游泳課程',
      keys: ['自閉', 'autism', 'asd', '感官', '視覺提示'],
    },
    {
      path: '/sen-swim-adhd.html',
      title: 'ADHD 游泳專注力訓練',
      keys: ['adhd', '專注', '過動', '衝動'],
    },
    {
      path: '/areas-hong-kong.html',
      title: '香港各區 SEN 游泳服務',
      keys: ['九龍', '新界', '港島', '地區', '泳池'],
    },
    {
      path: '/services.html',
      title: '服務項目',
      keys: ['課程', '感統', '社交', '親子'],
    },
    {
      path: '/booking.html',
      title: '預約課程',
      keys: ['預約', '報名', '查詢'],
    },
    {
      path: '/resources.html',
      title: '家長資源',
      keys: ['家長', '指南', '資源'],
    },
  ];
  const scored = candidates
    .map((c) => ({
      ...c,
      score: c.keys.reduce((n, k) => n + (blob.includes(k.toLowerCase()) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score);

  const picked = [];
  for (const c of scored) {
    if (picked.length >= limit) break;
    if (c.score > 0 || picked.length < 2) picked.push(c);
  }
  return picked.slice(0, limit).map((c) => {
    const page = (config.pages || []).find((p) => p.path === c.path);
    return {
      path: c.path,
      title: page?.title?.split('|')[0]?.trim() || c.title,
      description: page?.description || '',
      url: absUrl(config.site, c.path),
    };
  });
}
