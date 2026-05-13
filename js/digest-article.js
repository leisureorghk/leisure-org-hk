/**
 * 產業摘要詳情：依 ?u= 之原文網址在 data/sen-swim-digest.json 中查找，顯示站內繁中版面；「閱讀原文」才開外連。
 */
(function () {
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
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

  function summaryToParagraphs(text) {
    var t = String(text || '').trim();
    if (!t) return '<p>（此則暫無摘要文字。）</p>';
    var parts = t.split(/\n+/).map(function (p) {
      return p.trim();
    }).filter(Boolean);
    if (!parts.length) return '<p>（此則暫無摘要文字。）</p>';
    return parts.map(function (p) {
      return '<p>' + esc(softenDisplayText(p)) + '</p>';
    }).join('');
  }

  var root = document.getElementById('digest-article-root');
  var breadcrumb = document.getElementById('digest-article-breadcrumb');
  var statusEl = document.getElementById('digest-article-status');
  if (!root) return;

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

  fetch('data/sen-swim-digest.json', { cache: 'no-cache' })
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

      document.title = title + ' | 產業摘要 | 新天地';

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
        '<div class="digest-article-body">' +
        summaryToParagraphs(it.summary || '') +
        '</div>' +
        '<div class="highlight-box digest-article-note">' +
        '<strong>說明</strong>：本站僅整理公開 RSS 之繁中標題與摘要，方便家長瀏覽；完整論述、數據與立場請以「閱讀原文」前往原網站核對，版權歸原發布者。' +
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
