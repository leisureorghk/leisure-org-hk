/**
 * 教練專欄：動態載入每週專題與精選文章列表
 */
(function () {
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
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

  function topicsFromText(text) {
    if (window.BlogFilters && window.BlogFilters.topicsFromText) {
      return window.BlogFilters.topicsFromText(text);
    }
    var found = [];
    var hay = String(text || '');
    if (/adhd|專注|紀律/i.test(hay)) found.push('adhd');
    if (/自閉|asd|autism/i.test(hay)) found.push('autism');
    if (/感統|感官|感覺|sensory/i.test(hay)) found.push('sensory');
    if (/安全|防溺|safety/i.test(hay)) found.push('safety');
    if (/信心|溝通|等待|步伐|準備/i.test(hay)) found.push('confidence');
    return found;
  }

  var featuredRoot = document.getElementById('featured-article-root');
  var moreGrid = document.getElementById('blog-more-grid');

  var staticArticles = [
    {
      slug: 'blog-article-sensory.html',
      date: '2026年6月',
      title: '為什麼水中感統訓練對SEN孩子特別有效？',
      excerpt:
        '水是自然界最完美的感統訓練場：浮力、阻力與溫和壓力，能幫助調節過高或過低的感官反應…',
      icon: 'images/icons/icon-target.svg',
      gradient: 'linear-gradient(135deg,var(--ocean-blue),var(--ocean-light))',
      contentType: 'static',
      tag: '常駐文章',
      topics: ['sensory'],
    },
    {
      slug: 'blog-article-waiting.html',
      date: '2026年2月',
      title: '教了三十年游泳，我學會的一件事：等待',
      excerpt:
        '有些孩子需要的不只是教學，而是有人願意在他們旁邊坐著，等到他們準備好的那一刻…',
      icon: 'images/icons/icon-breath.svg',
      gradient: 'linear-gradient(135deg,var(--teal),var(--teal-light))',
      contentType: 'static',
      tag: '常駐文章',
      topics: ['confidence'],
    },
    {
      slug: 'blog-article-adhd.html',
      date: '2025年10月',
      title: 'ADHD孩子學游泳的5個實用技巧',
      excerpt:
        'ADHD 的孩子不是不聽話，只是大腦需要不同的處理方式。分享實用水中教學技巧…',
      icon: 'images/icons/icon-swim.svg',
      gradient: 'linear-gradient(135deg,var(--gold),var(--gold-light))',
      contentType: 'static',
      tag: '常駐文章',
      topics: ['adhd'],
    },
  ];

  function notifyReady() {
    document.dispatchEvent(new CustomEvent('blog:content-ready'));
  }

  function renderFeaturedFallback() {
    if (!featuredRoot) return;
    featuredRoot.setAttribute('data-content-type', 'weekly');
    featuredRoot.setAttribute('data-topics', 'confidence sensory');
    featuredRoot.innerHTML =
      '<div class="custom-icon round teal" style="margin:0 auto 1rem"><img src="images/icons/icon-pen.svg" alt="筆"></div>' +
      '<div class="blog-meta" style="text-align:center;margin-bottom:0.75rem"><span style="color:var(--text-muted);font-size:0.9rem">精選 · 曹教練</span></div>' +
      '<h3 class="featured-article-title">「看著水，不要怕水」——寫給每一個怕水的孩子</h3>' +
      '<div class="featured-article-body">' +
      '<p>對怕水的孩子來說，最需要的不是鼓勵，而是時間。我們願意陪孩子在池邊，用遊戲慢慢建立對水的信任。</p>' +
      '</div>' +
      '<div class="featured-article-byline">—— 曹教練</div>' +
      '<p style="text-align:center;margin-top:1rem"><a class="btn btn-primary" href="blog.html#featured-article-root">查看精選區</a></p>';
  }

  function renderFeaturedWeekly(latest) {
    if (!featuredRoot || !latest || !latest.slug) {
      renderFeaturedFallback();
      return;
    }
    var topicText = [latest.title, latest.description, (latest.keywords || []).join(' ')].join(' ');
    var topics = topicsFromText(topicText);
    featuredRoot.setAttribute('data-content-type', 'weekly');
    featuredRoot.setAttribute('data-topics', topics.join(' ') || 'confidence');
    featuredRoot.innerHTML =
      '<div class="custom-icon round teal" style="margin:0 auto 1rem"><img src="images/icons/icon-pen.svg" alt="筆"></div>' +
      '<div class="blog-meta" style="text-align:center;margin-bottom:0.75rem"><span style="color:var(--text-muted);font-size:0.9rem">' +
      esc(fmtDate(latest.publishedAt) || '每週專題') +
      ' · 曹教練與同行教練</span></div>' +
      '<h3 class="featured-article-title">' +
      esc(latest.title || '本週專題') +
      '</h3>' +
      '<div class="featured-article-body"><p>本週原創專題已發布，涵蓋 SEN 學童游泳教學與家長實務建議。</p></div>' +
      '<div class="featured-article-byline">—— 新天地教練專欄</div>' +
      '<p style="text-align:center;margin-top:1rem"><a class="btn btn-primary" href="' +
      esc(latest.slug) +
      '">閱讀本週全文</a></p>';
  }

  function renderMoreGrid(cards) {
    if (!moreGrid) return;
    moreGrid.innerHTML = cards
      .slice(0, 6)
      .map(function (a, i) {
        var topics = (a.topics && a.topics.length ? a.topics : topicsFromText(a.title + ' ' + a.excerpt)).join(' ');
        return (
          '<div class="blog-card blog-card-' +
          (i + 1) +
          ' card reveal stagger-' +
          (i + 1) +
          '" data-content-type="' +
          esc(a.contentType || 'weekly') +
          '" data-topics="' +
          esc(topics || 'general') +
          '">' +
          '<div class="blog-card-image" style="background:' +
          esc(a.gradient) +
          '">' +
          '<div class="custom-icon" style="padding:2rem"><img src="' +
          esc(a.icon) +
          '" alt=""></div></div>' +
          '<div class="blog-card-content">' +
          '<div class="blog-card-meta"><span class="tag">' +
          esc(a.tag || '文章') +
          '</span><span class="blog-date">' +
          esc(a.date) +
          '</span></div>' +
          '<h3>' +
          esc(a.title) +
          '</h3>' +
          '<p>' +
          esc(a.excerpt) +
          '</p>' +
          '<a class="read-more" href="' +
          esc(a.slug) +
          '">閱讀全文 →</a>' +
          '</div></div>'
        );
      })
      .join('');
  }

  fetch('data/weekly-article-meta.json?_=' + Date.now(), { cache: 'no-store' })
    .then(function (r) {
      return r.ok ? r.json() : { latest: null, history: [] };
    })
    .then(function (meta) {
      renderFeaturedWeekly(meta.latest);
      var history = meta.history || [];
      if (meta.latest && meta.latest.slug) {
        history = [meta.latest].concat(
          history.filter(function (h) {
            return h.slug !== meta.latest.slug;
          })
        );
      }
      return fetch('data/monthly-insights-meta.json?_=' + Date.now(), { cache: 'no-store' })
        .then(function (r) {
          return r.ok ? r.json() : { latest: null };
        })
        .then(function (monthly) {
          var latestEl = document.getElementById('monthly-insights-latest');
          if (latestEl && monthly && monthly.latest && monthly.latest.slug) {
            latestEl.innerHTML =
              '<a href="' +
              esc(monthly.latest.slug) +
              '">' +
              esc(monthly.latest.title || '閱讀本月家長月報') +
              '</a>';
          }

          var cards = [];
          var seen = {};

          if (monthly && monthly.latest && monthly.latest.slug) {
            seen[monthly.latest.slug] = true;
            cards.push({
              slug: monthly.latest.slug,
              date: fmtDate(monthly.latest.publishedAt),
              title: monthly.latest.title || '家長月報',
              excerpt: monthly.latest.description || '整理當月教練專欄與家長實務重點。',
              icon: 'images/icons/icon-pen.svg',
              gradient: 'linear-gradient(135deg,var(--teal),var(--ocean-blue))',
              contentType: 'monthly',
              tag: '家長月報',
              topics: topicsFromText(
                [monthly.latest.title, monthly.latest.description, (monthly.latest.keywords || []).join(' ')].join(
                  ' '
                )
              ),
            });
          }

          history.forEach(function (h) {
            if (!h || !h.slug || seen[h.slug]) return;
            seen[h.slug] = true;
            cards.push({
              slug: h.slug,
              date: fmtDate(h.publishedAt),
              title: h.title || '每週專題',
              excerpt: h.description || '每週原創：SEN 與游泳教學觀察與家長實務。',
              icon: 'images/icons/icon-pen.svg',
              gradient: 'linear-gradient(135deg,var(--ocean-mid),var(--ocean-blue))',
              contentType: 'weekly',
              tag: '每週專題',
              topics: topicsFromText([h.title, h.description, (h.keywords || []).join(' ')].join(' ')),
            });
          });

          staticArticles.forEach(function (a) {
            if (!seen[a.slug]) cards.push(a);
          });

          renderMoreGrid(cards);
          notifyReady();
        });
    })
    .catch(function () {
      renderFeaturedFallback();
      renderMoreGrid(staticArticles);
      notifyReady();
    });
})();
