/**
 * 教練專欄：站內關鍵字搜尋（摘要標題 + 週報 meta）
 */
(function () {
  var input = document.getElementById('blog-search-input');
  var grid = document.getElementById('digest-grid');
  if (!input || !grid) return;

  var allCards = [];
  var weeklyItems = [];

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function storeCards() {
    allCards = Array.prototype.slice.call(grid.querySelectorAll('.digest-card'));
  }

  function filterDigest(q) {
    var needle = String(q || '')
      .trim()
      .toLowerCase();
    allCards.forEach(function (card) {
      var text = (card.textContent || '').toLowerCase();
      card.style.display = !needle || text.indexOf(needle) !== -1 ? '' : 'none';
    });
    var visible = allCards.filter(function (c) {
      return c.style.display !== 'none';
    }).length;
    var status = document.getElementById('blog-search-status');
    if (status) {
      status.textContent = needle
        ? '摘要：顯示 ' + visible + ' / ' + allCards.length + ' 則'
        : '';
    }
  }

  input.addEventListener('input', function () {
    filterDigest(input.value);
  });

  var obs = new MutationObserver(storeCards);
  obs.observe(grid, { childList: true });
  storeCards();

  fetch('data/weekly-article-meta.json', { cache: 'no-store' })
    .then(function (r) {
      return r.ok ? r.json() : {};
    })
    .then(function (meta) {
      weeklyItems = (meta.history || []).concat(meta.latest ? [meta.latest] : []);
    })
    .catch(function () {});
})();
