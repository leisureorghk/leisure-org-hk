/**
 * 首頁：顯示產業摘要前 3 則（data/sen-swim-digest.json）
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

  function fmtDateTime(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString('zh-HK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return iso;
    }
  }

  function renderUpdatedMeta(updatedAt) {
    var metaBar = document.getElementById('home-digest-meta-bar');
    if (!metaBar || !updatedAt) return;
    metaBar.innerHTML =
      '<span class="digest-badge" role="status">摘要清單</span>' +
      '<span class="digest-updated">最後更新：' +
      esc(fmtDateTime(updatedAt)) +
      '</span>';
    metaBar.hidden = false;
    metaBar.removeAttribute('hidden');
  }

  function renderPublishedDate(iso) {
    var d = fmtDate(iso);
    if (!d) return '';
    return (
      '<span class="digest-card-date" title="原文發布日期">原文 ' + esc(d) + '</span>'
    );
  }

  var section = document.getElementById('home-digest-section');
  var grid = document.getElementById('home-digest-grid');
  if (!section || !grid) return;

  function showSection() {
    section.hidden = false;
    section.removeAttribute('aria-hidden');
  }

  function digestJsonUrl() {
    return 'data/sen-swim-digest.json?_=' + String(Date.now());
  }

  grid.innerHTML = '<p class="digest-loading-msg" role="status">載入摘要中…</p>';

  fetch(digestJsonUrl(), { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      renderUpdatedMeta(data.updatedAt);
      var items = (data.items || []).slice(0, 3);
      if (!items.length) {
        showSection();
        grid.innerHTML =
          '<p class="digest-empty" role="status">目前沒有可顯示的相關摘要。請稍後再試，或前往<a href="blog.html">教練專欄</a>查看完整清單。</p>';
        return;
      }
      var stagger = ['stagger-1', 'stagger-2', 'stagger-3'];
      grid.innerHTML = items
        .map(function (it, i) {
          var sum = softenDisplayText((it.summary || '').trim());
          if (sum.length > 160) sum = sum.slice(0, 157) + '…';
          var title = softenDisplayText(it.title || '（無標題）');
          var detailHref =
            'digest-article.html?u=' +
            encodeURIComponent(it.url || '') +
            '&from=home';
          var st = stagger[Math.min(i, stagger.length - 1)];
          return (
            '<article class="digest-card reveal ' +
            st +
            '">' +
            '<div class="digest-card-source">' +
            esc(it.sourceName || it.sourceId || '來源') +
            '</div>' +
            '<h3 class="digest-card-title"><a href="' +
            esc(detailHref) +
            '">' +
            esc(title) +
            '</a></h3>' +
            '<p class="digest-card-summary home-digest-card-summary">' +
            esc(sum) +
            '</p>' +
            '<div class="digest-card-footer">' +
            renderPublishedDate(it.publishedAt) +
            '<a class="digest-card-link" href="' +
            esc(it.url) +
            '" target="_blank" rel="noopener noreferrer">閱讀原文</a>' +
            '</div></article>'
          );
        })
        .join('');
      showSection();
      var cards = grid.querySelectorAll('.reveal');
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (en) {
              if (en.isIntersecting) {
                en.target.classList.add('visible');
                io.unobserve(en.target);
              }
            });
          },
          { rootMargin: '0px 0px -5% 0px', threshold: 0.08 }
        );
        cards.forEach(function (el) {
          io.observe(el);
        });
      } else {
        cards.forEach(function (el) {
          el.classList.add('visible');
        });
      }
    })
    .catch(function () {
      showSection();
      grid.innerHTML =
        '<p class="digest-error" role="alert">無法載入摘要（可能為網路或快取問題）。請重新整理頁面，或前往<a href="blog.html">教練專欄</a>查看。</p>';
    });
})();
