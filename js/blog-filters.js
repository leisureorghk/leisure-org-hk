/**
 * 教練專欄：內容類型與 SEN 主題篩選
 */
(function () {
  var panel = document.getElementById('blog-filter-panel');
  if (!panel) return;

  var statusEl = document.getElementById('blog-filter-status');
  var state = { type: 'all', topic: 'all' };

  var TOPIC_PATTERNS = {
    adhd: /adhd|專注|紀律/i,
    autism: /自閉|asd|autism/i,
    sensory: /感統|感官|感覺|sensory/i,
    safety: /安全|防溺|safety/i,
    confidence: /信心|溝通|等待|步伐|準備/i,
  };

  function topicsFromText(text) {
    var found = [];
    var hay = String(text || '');
    Object.keys(TOPIC_PATTERNS).forEach(function (key) {
      if (TOPIC_PATTERNS[key].test(hay)) found.push(key);
    });
    return found;
  }

  function setTopicsAttr(el, topics) {
    if (!el) return;
    var unique = [];
    (topics || []).forEach(function (t) {
      if (t && unique.indexOf(t) === -1) unique.push(t);
    });
    el.setAttribute('data-topics', unique.join(' ') || 'general');
  }

  function ensureDigestCardMeta() {
    var cards = document.querySelectorAll('#digest-grid .digest-card');
    cards.forEach(function (card) {
      if (!card.getAttribute('data-content-type')) {
        card.setAttribute('data-content-type', 'digest');
      }
      if (!card.getAttribute('data-topics')) {
        setTopicsAttr(card, topicsFromText(card.textContent || ''));
      }
    });
  }

  function ensurePromoMeta() {
    var promo = document.getElementById('weekly-article-promo');
    if (!promo || promo.hidden) return;
    if (!promo.getAttribute('data-content-type')) {
      promo.setAttribute('data-content-type', 'weekly');
    }
    if (!promo.getAttribute('data-topics') || promo.getAttribute('data-topics').indexOf(' ') === -1) {
      setTopicsAttr(promo, topicsFromText(promo.textContent || ''));
    }
  }

  function topicMatch(el, topic) {
    if (topic === 'all') return true;
    var raw = (el.getAttribute('data-topics') || '').toLowerCase();
    if (!raw) return TOPIC_PATTERNS[topic] ? TOPIC_PATTERNS[topic].test(el.textContent || '') : true;
    return (' ' + raw + ' ').indexOf(' ' + topic + ' ') !== -1;
  }

  function typeMatch(el, type) {
    if (type === 'all') return true;
    var t = el.getAttribute('data-content-type') || '';
    return t === type;
  }

  function setHidden(el, hide) {
    if (!el) return;
    el.hidden = !!hide;
    el.classList.toggle('blog-filter-hidden', !!hide);
    if (hide) {
      el.setAttribute('aria-hidden', 'true');
    } else {
      el.removeAttribute('aria-hidden');
    }
  }

  function applyFilters() {
    ensureDigestCardMeta();
    ensurePromoMeta();

    var type = state.type;
    var topic = state.topic;
    var visible = 0;

    var monthlyPanel = document.querySelector('.monthly-audit-panel');
    if (monthlyPanel) {
      var showMonthly = (type === 'all' || type === 'monthly') && topicMatch(monthlyPanel, topic);
      setHidden(monthlyPanel, !showMonthly);
      if (showMonthly) visible += 1;
    }

    var digestSection = document.querySelector('.digest-section');
    var digestGrid = document.getElementById('digest-grid');
    var digestCards = digestGrid ? digestGrid.querySelectorAll('.digest-card') : [];
    var digestVisible = 0;
    digestCards.forEach(function (card) {
      var searchOk = card.getAttribute('data-search-hit') !== '0';
      var show =
        searchOk && (type === 'all' || type === 'digest') && topicMatch(card, topic);
      setHidden(card, !show);
      if (show) digestVisible += 1;
    });
    if (digestSection) {
      var showDigestBlock = type === 'all' || type === 'digest';
      // Keep search/filters visible; only collapse digest list when type excludes digest
      if (digestGrid) setHidden(digestGrid, !showDigestBlock);
      var metaBar = document.getElementById('digest-meta-bar');
      if (metaBar) setHidden(metaBar, !showDigestBlock);
      if (showDigestBlock) visible += digestVisible;
    }

    var promo = document.getElementById('weekly-article-promo');
    if (promo) {
      var showPromo =
        !promo.hasAttribute('data-empty') &&
        (type === 'all' || type === 'weekly') &&
        topicMatch(promo, topic);
      // Only unhide if content was loaded (innerHTML non-empty and not initially empty)
      if (promo.getAttribute('data-loaded') === '1') {
        setHidden(promo, !showPromo);
        if (showPromo) visible += 1;
      }
    }

    var featuredSection = document.querySelector('section[data-filter-section="weekly"]');
    if (featuredSection) {
      var featuredRoot = document.getElementById('featured-article-root');
      if (featuredRoot) {
        setTopicsAttr(featuredRoot, topicsFromText(featuredRoot.textContent || ''));
        featuredRoot.setAttribute('data-content-type', 'weekly');
      }
      var showFeatured = (type === 'all' || type === 'weekly') && topicMatch(featuredRoot || featuredSection, topic);
      setHidden(featuredSection, !showFeatured);
      if (showFeatured) visible += 1;
    }

    var moreGrid = document.getElementById('blog-more-grid');
    var cardsSection = document.querySelector('section[data-filter-section="cards"]');
    var cardVisible = 0;
    if (moreGrid) {
      moreGrid.querySelectorAll('.blog-card').forEach(function (card) {
        var show = typeMatch(card, type === 'all' ? 'all' : type) && topicMatch(card, topic);
        // typeMatch with 'all' always true; for type filters use data-content-type
        if (type === 'all') {
          show = topicMatch(card, topic);
        } else {
          show = typeMatch(card, type) && topicMatch(card, topic);
        }
        setHidden(card, !show);
        if (show) cardVisible += 1;
      });
    }
    if (cardsSection) {
      var showCards =
        type === 'all' || type === 'monthly' || type === 'weekly' || type === 'static';
      setHidden(cardsSection, !showCards || cardVisible === 0);
      visible += cardVisible;
    }

    var staticSection = document.querySelector('section[data-filter-section="static"]');
    if (staticSection) {
      var staticVisible = 0;
      staticSection.querySelectorAll('[data-content-type="static"]').forEach(function (art) {
        var show = (type === 'all' || type === 'static') && topicMatch(art, topic);
        setHidden(art, !show);
        if (show) staticVisible += 1;
      });
      setHidden(staticSection, !(type === 'all' || type === 'static') || staticVisible === 0);
      if ((type === 'all' || type === 'static') && staticVisible) visible += staticVisible;
    }

    if (statusEl) {
      if (type === 'all' && topic === 'all') {
        statusEl.textContent = '';
      } else {
        statusEl.textContent = '目前篩選結果約 ' + visible + ' 項（可再改類型或主題）。';
      }
    }
  }

  function bindChips(group, key, attr) {
    var chips = panel.querySelectorAll('[data-filter-group="' + group + '"] .blog-filter-chip');
    chips.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var value = btn.getAttribute(attr) || 'all';
        state[key] = value;
        chips.forEach(function (c) {
          var on = c === btn;
          c.classList.toggle('is-active', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        applyFilters();
      });
    });
  }

  bindChips('type', 'type', 'data-filter-type');
  bindChips('topic', 'topic', 'data-filter-topic');

  var applyTimer = null;
  function scheduleApply() {
    if (applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(applyFilters, 50);
  }

  document.addEventListener('blog:content-ready', scheduleApply);
  var observer = new MutationObserver(scheduleApply);
  var digestGrid = document.getElementById('digest-grid');
  var moreGrid = document.getElementById('blog-more-grid');
  if (digestGrid) observer.observe(digestGrid, { childList: true });
  if (moreGrid) observer.observe(moreGrid, { childList: true });

  applyFilters();
  setTimeout(applyFilters, 400);
  setTimeout(applyFilters, 1200);

  window.BlogFilters = {
    apply: applyFilters,
    topicsFromText: topicsFromText,
    setTopicsAttr: setTopicsAttr,
  };
})();
