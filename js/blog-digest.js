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

  var grid = document.getElementById('digest-grid');
  var metaBar = document.getElementById('digest-meta-bar');
  var weeklyBox = document.getElementById('weekly-article-promo');

  if (grid) {
    fetch('data/sen-swim-digest.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (metaBar && data.updatedAt) {
          metaBar.innerHTML =
            '<span class="digest-badge" role="status">RSS 摘要</span>' +
            '<span class="digest-updated">最後更新：' +
            esc(fmtDate(data.updatedAt)) +
            '</span>';
        }
        var items = data.items || [];
        if (!items.length) {
          grid.innerHTML = '<p class="digest-empty" role="status">暫無摘要資料。請稍後再試，或確認已執行自動化更新。</p>';
          return;
        }
        grid.innerHTML = items
          .map(function (it) {
            var sum = softenDisplayText((it.summary || '').trim());
            if (sum.length > 220) sum = sum.slice(0, 217) + '…';
            var title = softenDisplayText(it.title || '（無標題）');
            return (
              '<article class="digest-card">' +
              '<div class="digest-card-source">' +
              esc(it.sourceName || it.sourceId || '來源') +
              '</div>' +
              '<h3 class="digest-card-title"><a href="' +
              esc(it.url) +
              '" target="_blank" rel="noopener noreferrer">' +
              esc(title) +
              '</a></h3>' +
              '<p class="digest-card-summary">' +
              esc(sum) +
              '</p>' +
              '<div class="digest-card-footer">' +
              '<span class="digest-card-date">' +
              esc(fmtDate(it.publishedAt) || '') +
              '</span>' +
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
          '<p class="digest-error" role="alert">無法載入摘要列表。請檢查網路連線，或確認 <code>data/sen-swim-digest.json</code> 是否存在。</p>';
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
          weeklyBox.innerHTML =
            '<h3>每週專題精選</h3>' +
            '<p>尚未產生週報。於 GitHub 設定週報產生所需之倉庫密鑰後，每週排程會撰寫一篇參考國際公開資訊的原創文章（合併 PR 後此處會顯示連結）。</p>';
          return;
        }
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
        weeklyBox.innerHTML =
          '<h3>每週專題精選</h3><p class="digest-error">無法載入週報資訊。</p>';
      });
  }
})();
