/**
 * 教練專欄：站內關鍵字搜尋（摘要卡片 + search-index：週報／專欄／靜態頁）
 */
(function () {
  var input = document.getElementById('blog-search-input');
  var grid = document.getElementById('digest-grid');
  var resultsEl = document.getElementById('blog-search-results');
  if (!input) return;

  var allCards = [];
  var indexItems = [];
  var waPhone = '85297083907';

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function storeCards() {
    if (!grid) return;
    allCards = Array.prototype.slice.call(grid.querySelectorAll('.digest-card'));
  }

  function matchText(hay, needle) {
    return String(hay || '')
      .toLowerCase()
      .indexOf(needle) !== -1;
  }

  function scoreItem(item, needle) {
    var title = (item.title || '').toLowerCase();
    var desc = (item.description || '').toLowerCase();
    var keys = (item.keywords || '').toLowerCase();
    var s = 0;
    if (title.indexOf(needle) !== -1) s += 3;
    if (keys.indexOf(needle) !== -1) s += 2;
    if (desc.indexOf(needle) !== -1) s += 1;
    if (item.featured) s += 0.5;
    return s;
  }

  function hrefFor(item) {
    if (item.type === 'digest' && item.externalUrl) {
      return 'digest-article.html?u=' + encodeURIComponent(item.externalUrl);
    }
    var p = item.path || '';
    if (p === '/' || p === '') return 'index.html';
    return p.replace(/^\//, '');
  }

  function typeLabel(t) {
    if (t === 'weekly') return '每週專題';
    if (t === 'article') return '教練專欄';
    if (t === 'digest') return '產業摘要';
    return '網站頁面';
  }

  function filterDigest(q) {
    var needle = String(q || '')
      .trim()
      .toLowerCase();
    var digestVisible = 0;

    if (grid) {
      allCards.forEach(function (card) {
        var text = (card.textContent || '').toLowerCase();
        var show = !needle || text.indexOf(needle) !== -1;
        card.style.display = show ? '' : 'none';
        if (show) digestVisible += 1;
      });
    }

    var pageHits = [];
    if (needle && indexItems.length) {
      pageHits = indexItems
        .filter(function (it) {
          return it.type !== 'digest' && scoreItem(it, needle) > 0;
        })
        .sort(function (a, b) {
          return scoreItem(b, needle) - scoreItem(a, needle);
        })
        .slice(0, 12);
    }

    if (resultsEl) {
      if (!needle) {
        resultsEl.hidden = true;
        resultsEl.innerHTML = '';
      } else if (pageHits.length) {
        resultsEl.hidden = false;
        resultsEl.innerHTML =
          '<p class="digest-intro" style="margin-bottom:0.75rem">站內相關結果（' +
          pageHits.length +
          '）</p><ul class="blog-search-hit-list" style="list-style:none;padding:0;margin:0 0 1rem;display:grid;gap:0.65rem">' +
          pageHits
            .map(function (it) {
              return (
                '<li class="card" style="padding:0.85rem 1rem">' +
                '<span style="font-size:0.75rem;color:var(--text-muted)">' +
                esc(typeLabel(it.type)) +
                '</span>' +
                '<a href="' +
                esc(hrefFor(it)) +
                '" style="display:block;font-weight:600;color:var(--ocean-blue);margin:0.15rem 0">' +
                esc(it.title) +
                '</a>' +
                (it.description
                  ? '<p style="margin:0;font-size:0.88rem;color:var(--text-muted);line-height:1.5">' +
                    esc(it.description.slice(0, 120)) +
                    (it.description.length > 120 ? '…' : '') +
                    '</p>'
                  : '') +
                '</li>'
              );
            })
            .join('') +
          '</ul>';
      } else {
        resultsEl.hidden = false;
        resultsEl.innerHTML = '';
      }
    }

    var status = document.getElementById('blog-search-status');
    if (status) {
      if (!needle) {
        status.textContent = '';
      } else {
        var parts = [];
        if (pageHits.length) parts.push('站內 ' + pageHits.length + ' 則');
        if (grid) parts.push('摘要 ' + digestVisible + ' / ' + allCards.length + ' 則');
        var empty = !pageHits.length && (!grid || digestVisible === 0);
        if (empty) {
          status.innerHTML =
            '找不到符合「' +
            esc(q.trim()) +
            '」的結果。可改關鍵字，或 <a href="https://wa.me/' +
            waPhone +
            '?text=' +
            encodeURIComponent('你好，想查詢：' + q.trim()) +
            '" target="_blank" rel="noopener">WhatsApp 查詢</a>';
        } else {
          status.textContent = '顯示：' + parts.join('；');
        }
      }
    }
  }

  function applyQueryFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      var q = params.get('q');
      if (q) {
        input.value = q;
        filterDigest(q);
      }
    } catch (e) {
      /* ignore */
    }
  }

  input.addEventListener('input', function () {
    filterDigest(input.value);
  });

  if (grid) {
    var obs = new MutationObserver(function () {
      storeCards();
      if (input.value) filterDigest(input.value);
    });
    obs.observe(grid, { childList: true });
    storeCards();
  }

  fetch('data/site-public.json', { cache: 'no-store' })
    .then(function (r) {
      return r.ok ? r.json() : {};
    })
    .then(function (cfg) {
      if (cfg.whatsappPhone) waPhone = String(cfg.whatsappPhone).replace(/\D/g, '') || waPhone;
    })
    .catch(function () {});

  fetch('data/search-index.json', { cache: 'no-store' })
    .then(function (r) {
      return r.ok ? r.json() : { items: [] };
    })
    .then(function (data) {
      indexItems = data.items || [];
      applyQueryFromUrl();
    })
    .catch(function () {
      indexItems = [];
      applyQueryFromUrl();
    });
})();
