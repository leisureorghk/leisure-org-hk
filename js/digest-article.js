/**
 * 產業摘要詳情：依 ?u= 之原文網址在 data/sen-swim-digest.json 中查找，顯示站內繁中版面；
 * 若有 bodyZh／images（由排程 build-digest 產生）則顯示全文譯文與圖片；「閱讀原文」才開外連。
 */
(function () {
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function escAttr(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function softenDisplayText(s) {
    return String(s || '')
      .replace(/\bAI\b/g, '相關工具')
      .replace(/\bA\.I\.\b/gi, '相關工具')
      .replace(/人工智能/g, '相關技術');
  }

  function fmtDate(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('zh-HK', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return iso;
    }
  }

  function textToParagraphs(text) {
    var t = String(text || '').trim();
    if (!t) return '<p>（此則暫無內文。）</p>';
    var parts = t.split(/\n{2,}/).map(function (p) {
      return p.trim();
    }).filter(Boolean);
    if (!parts.length) return '<p>（此則暫無內文。）</p>';
    return parts.map(function (p) {
      return '<p>' + esc(softenDisplayText(p)) + '</p>';
    }).join('');
  }

  function renderImageGallery(images) {
    if (!images || !images.length) return '';
    var html =
      '<div class="digest-article-gallery" role="group" aria-label="文章附圖">';
    for (var i = 0; i < images.length; i++) {
      var im = images[i];
      var src = im && im.src ? String(im.src) : '';
      if (!src) continue;
      var alt = im && im.alt != null ? String(im.alt) : '';
      html +=
        '<figure class="digest-article-fig">' +
        '<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="' +
        escAttr(src) +
        '" alt="' +
        esc(alt) +
        '">' +
        '</figure>';
    }
    html += '</div>';
    return html;
  }

  var root = document.getElementById('digest-article-root');
  var breadcrumb = document.getElementById('digest-article-breadcrumb');
  var statusEl = document.getElementById('digest-article-status');
  if (!root) return;

  function digestJsonUrl() {
    return 'data/sen-swim-digest.json?_=' + String(Date.now());
  }

  var params = new URLSearchParams(window.location.search);
  var rawU = params.get('u') || '';
  var from = (params.get('from') || 'home').toLowerCase();

  var backHref = 'index.html#home-digest-section';
  var backLabel = '首頁 · SEN・游泳相關資訊';
  if (from === 'blog') {
    backHref = 'blog.html#digest-heading';
    backLabel = '教練專欄 · 產業資訊摘要';
  }

  if (breadcrumb) {
    breadcrumb.innerHTML =
      '<a href="index.html">首頁</a> <span class="digest-article-bc-sep" aria-hidden="true">/</span> ' +
      '<a href="' +
      esc(backHref) +
      '">' +
      esc(backLabel) +
      '</a>';
  }

  function showStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'digest-article-status' + (isError ? ' digest-article-status-error' : '');
    statusEl.setAttribute('role', isError ? 'alert' : 'status');
  }

  if (!rawU) {
    showStatus('缺少文章連結參數。請從摘要列表點選標題進入。', true);
    return;
  }

  var targetUrl;
  try {
    targetUrl = decodeURIComponent(rawU);
  } catch (e) {
    showStatus('連結參數無效。', true);
    return;
  }

  showStatus('載入中…', false);

  fetch(digestJsonUrl(), { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      var items = data.items || [];
      var it = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].url === targetUrl) {
          it = items[i];
          break;
        }
      }
      if (!it) {
        showStatus('找不到此摘要，可能已更新清單。請返回摘要區重新選擇。', true);
        root.innerHTML = '';
        return;
      }

      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'digest-article-status hidden';
        statusEl.setAttribute('aria-live', 'polite');
      }

      var title = softenDisplayText(it.title || '（無標題）');
      var source = it.sourceName || it.sourceId || '來源';
      var dateStr = fmtDate(it.publishedAt) || '';
      var orig = String(it.url || '').trim();
      var bodyZh = String(it.bodyZh || '').trim();
      var images = Array.isArray(it.images) ? it.images : [];
      var mainBody = bodyZh ? textToParagraphs(bodyZh) : textToParagraphs(it.summary || '');
      var gallery = renderImageGallery(images);

      document.title = title + ' | 產業摘要 | 新天地';

      var note =
        bodyZh || images.length
          ? '<strong>說明</strong>：正文為自動擷取與翻譯（若有），可能節錄；圖片連結至原站資源。完整內容、數據與立場請以「閱讀原文」核對，版權歸原發布者。'
          : '<strong>說明</strong>：本站僅整理公開 RSS 之繁中標題與摘要，方便家長瀏覽；完整論述請以「閱讀原文」前往原網站核對，版權歸原發布者。';

      var h1Id = 'digest-article-title';
      root.innerHTML =
        '<article class="digest-article-shell card reveal visible" aria-labelledby="' +
        h1Id +
        '">' +
        '<div class="blog-article-meta digest-article-meta">' +
        '<span class="digest-article-meta-source">' +
        esc(source) +
        '</span>' +
        (dateStr ? '<span class="digest-article-meta-date">' + esc(dateStr) + '</span>' : '') +
        '</div>' +
        '<h1 id="' +
        h1Id +
        '" class="digest-article-title">' +
        esc(title) +
        '</h1>' +
        gallery +
        '<div class="digest-article-body">' +
        mainBody +
        '</div>' +
        '<div class="highlight-box digest-article-note">' +
        note +
        '</div>' +
        '<div class="digest-article-actions">' +
        (orig
          ? '<a class="btn btn-primary" href="' +
            esc(orig) +
            '" target="_blank" rel="noopener noreferrer">閱讀原文</a>'
          : '') +
        '<a class="btn btn-outline" href="' +
        esc(backHref) +
        '">返回摘要列表</a>' +
        '</div>' +
        '</article>';
    })
    .catch(function () {
      showStatus('無法載入摘要資料，請稍後再試。', true);
      root.innerHTML = '';
    });
})();
