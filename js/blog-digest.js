/**
 * 教練專欄：載入產業 RSS 摘要與每週專題 meta
 */
(function () {
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  /** 列表顯示用：避免出現特定英文字串（標題仍連結至原文） */
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

  function renderPublishedDate(iso) {
    var d = fmtDate(iso);
    if (!d) return '';
    return (
      '<span class="digest-card-date" title="原文發布日期">原文 ' + esc(d) + '</span>'
    );
  }

  var grid = document.getElementById('digest-grid');
  var metaBar = document.getElementById('digest-meta-bar');
  var weeklyBox = document.getElementById('weekly-article-promo');

  function hideWeeklyPromo() {
    if (!weeklyBox) return;
    weeklyBox.innerHTML = '';
    weeklyBox.hidden = true;
  }

  if (grid) {
    function digestJsonUrl() {
      return 'data/sen-swim-digest.json?_=' + String(Date.now());
    }

    fetch(digestJsonUrl(), { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (metaBar && data.updatedAt) {
          metaBar.innerHTML =
            '<span class="digest-badge" role="status">摘要清單</span>' +
            '<span class="digest-updated">最後更新：' +
            esc(fmtDateTime(data.updatedAt)) +
            '</span>';
        }
        var items = data.items || [];
        if (!items.length) {
          grid.innerHTML = '<p class="digest-empty" role="status">暫無摘要。請稍後再試或確認已執行更新。</p>';
          return;
        }
        grid.innerHTML = items
          .map(function (it) {
            var sum = softenDisplayText((it.summary || '').trim());
            if (sum.length > 220) sum = sum.slice(0, 217) + '…';
            var title = softenDisplayText(it.title || '（無標題）');
            var detailHref =
              'digest-article.html?u=' +
              encodeURIComponent(it.url || '') +
              '&from=blog';
            return (
              '<article class="digest-card">' +
              '<div class="digest-card-source">' +
              esc(it.sourceName || it.sourceId || '來源') +
              '</div>' +
              '<h3 class="digest-card-title"><a href="' +
              esc(detailHref) +
              '">' +
              esc(title) +
              '</a></h3>' +
              '<p class="digest-card-summary">' +
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
      })
      .catch(function () {
        grid.innerHTML =
          '<p class="digest-error" role="alert">無法載入摘要。</p>';
      });
  }

  if (weeklyBox) {
    fetch('data/weekly-article-meta.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (meta) {
        var latest = meta.latest;
        if (!latest || !latest.slug) {
          hideWeeklyPromo();
          return;
        }
        weeklyBox.hidden = false;
        weeklyBox.innerHTML =
          '<h3>每週專題精選</h3>' +
          '<p>' +
          esc(softenDisplayText(latest.title || '本週專題')) +
          '</p>' +
          '<p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:1rem;">發布：' +
          esc(fmtDate(latest.publishedAt) || '') +
          '</p>' +
          '<a class="btn btn-primary" href="' +
          esc(latest.slug) +
          '">閱讀本週專題</a>';
      })
      .catch(function () {
        hideWeeklyPromo();
      });
  }
})();
