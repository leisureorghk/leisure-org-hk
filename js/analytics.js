/**
 * GA4 + 轉化事件（WhatsApp、預約表單、摘要點擊）
 * 設定：data/site-public.json → ga4MeasurementId
 */
(function () {
  var cfg = null;
  var gaReady = false;

  function esc(s) {
    return String(s || '').slice(0, 120);
  }

  function gtagSafe() {
    if (typeof window.gtag === 'function') {
      window.gtag.apply(window, arguments);
    }
  }

  function trackEvent(name, params) {
    gtagSafe('event', name, params || {});
  }

  function attachClickTracking() {
    document.addEventListener(
      'click',
      function (e) {
        var el = e.target && e.target.closest ? e.target.closest('a') : null;
        if (!el || !el.href) return;
        var href = el.href;
        if (/wa\.me\/85297083907/i.test(href)) {
          trackEvent('whatsapp_click', {
            link_url: href,
            link_text: esc(el.textContent),
            page_path: location.pathname,
          });
          return;
        }
        if (el.closest && el.closest('.digest-card-title a, .digest-card-link')) {
          trackEvent('digest_card_click', {
            link_url: href,
            page_path: location.pathname,
          });
        }
        if (el.closest && el.closest('#bookingForm')) {
          trackEvent('booking_cta_click', { page_path: location.pathname });
        }
      },
      true
    );

    var form = document.getElementById('bookingForm');
    if (form) {
      form.addEventListener('submit', function () {
        trackEvent('booking_form_submit', { page_path: location.pathname });
      });
    }
  }

  function loadGtag(id) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', id, { send_page_view: true });
    gaReady = true;
    attachClickTracking();
  }

  function init() {
    fetch('data/site-public.json?_=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        return r.ok ? r.json() : {};
      })
      .then(function (data) {
        cfg = data || {};
        var id = String(cfg.ga4MeasurementId || '').trim();
        if (id && /^G-[A-Z0-9]+$/i.test(id)) {
          loadGtag(id);
        } else {
          attachClickTracking();
        }
      })
      .catch(function () {
        attachClickTracking();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
