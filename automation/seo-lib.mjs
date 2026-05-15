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
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.baseUrl}/#website`,
    name: site.name,
    alternateName: site.nameFull,
    url: `${site.baseUrl}/`,
    inLanguage: 'zh-Hant-HK',
    publisher: { '@id': `${site.baseUrl}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${site.baseUrl}/blog.html?q={search_term_string}`,
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

export function localBusinessJsonLd(site) {
  return {
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
    address: {
      '@type': 'PostalAddress',
      addressLocality: '香港',
      addressRegion: 'HK',
      addressCountry: 'HK',
    },
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
    sameAs: site.sameAs,
    knowsAbout: [
      'SEN游泳',
      '特殊教育游泳',
      '自閉症游泳課程',
      'ADHD專注力訓練',
      '感統訓練',
      '香港游泳教學',
    ],
  };
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

  const urls = [
    ...indexed.map((p) => ({
      loc: absUrl(site, p.path),
      priority: p.priority ?? 0.5,
      changefreq: p.changefreq ?? 'monthly',
      lastmod: p.lastmod || defaultLastmod,
    })),
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
        <lastmod>${u.lastmod || today}</lastmod>
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
  const metaPath = path.join(root, 'data', 'weekly-article-meta.json');
  if (!fs.existsSync(metaPath)) return [];
  const config = loadSeoConfig(root);
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const urls = [];
  const add = (entry) => {
    if (!entry?.slug) return;
    urls.push({
      loc: absUrl(config.site, `/${entry.slug}`),
      priority: 0.6,
      changefreq: 'monthly',
      lastmod: entry.publishedAt?.slice(0, 10),
    });
  };
  if (meta.latest) add(meta.latest);
  for (const h of meta.history || []) add(h);
  return urls;
}
