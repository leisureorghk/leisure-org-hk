/**
 * 全站 UI：縮短 loading 遮罩（同 session 僅首次顯示）、共用導覽關閉
 */
(function () {
  var LOADING_KEY = 'leisure_loading_seen';

  function hideLoading() {
    var loading = document.getElementById('loading');
    if (loading) loading.classList.add('hidden');
  }

  function initLoading() {
    try {
      if (sessionStorage.getItem(LOADING_KEY)) {
        hideLoading();
        return;
      }
      sessionStorage.setItem(LOADING_KEY, '1');
    } catch (e) {
      /* private mode */
    }
    window.addEventListener('DOMContentLoaded', function () {
      setTimeout(hideLoading, 150);
    });
    window.addEventListener('load', function () {
      setTimeout(hideLoading, 280);
    });
    setTimeout(hideLoading, 2500);
  }

  function initHeaderSearch() {
    var inner = document.querySelector('.header-inner');
    if (!inner || document.getElementById('site-search-form')) return;

    var form = document.createElement('form');
    form.id = 'site-search-form';
    form.className = 'site-search';
    form.setAttribute('role', 'search');
    form.action = 'blog.html';
    form.method = 'get';
    form.innerHTML =
      '<label class="visually-hidden" for="site-search-input">搜尋網站</label>' +
      '<input type="search" id="site-search-input" name="q" placeholder="搜尋" maxlength="80" autocomplete="off">' +
      '<button type="submit" class="site-search-btn" aria-label="搜尋">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">' +
      '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>' +
      '</button>';

    var menuBtn = document.getElementById('mobile-menu-btn');
    if (menuBtn && menuBtn.parentNode === inner) {
      inner.insertBefore(form, menuBtn);
    } else {
      inner.appendChild(form);
    }
  }

  function injectCoachShareNav() {
    var links = document.querySelectorAll('.nav-drawer-links');
    if (!links.length) return;
    links.forEach(function (nav) {
      // 已有手寫或先前注入的連結時不要再加（避免「教練分享區」重複）
      if (
        nav.querySelector('[data-coach-share]') ||
        nav.querySelector('a[href="coach-share.html"]') ||
        nav.querySelector('a[href$="/coach-share.html"]')
      ) {
        return;
      }
      var a = document.createElement('a');
      a.href = 'coach-share.html';
      a.className = 'nav-link';
      a.setAttribute('data-coach-share', '1');
      a.textContent = '教練分享區';
      var blog = nav.querySelector('a[href="blog.html"]');
      if (blog && blog.parentNode === nav) {
        if (blog.nextSibling) nav.insertBefore(a, blog.nextSibling);
        else nav.appendChild(a);
      } else {
        nav.appendChild(a);
      }
      try {
        var path = location.pathname || '';
        if (/coach-share\.html$/i.test(path)) a.classList.add('active');
      } catch (e) {
        /* ignore */
      }
    });
  }

  /** 手機抽屜選單（委託事件，後注入的連結也可關閉抽屜） */
  function initMobileNav() {
    var mobileMenuBtn = document.getElementById('mobile-menu-btn');
    var nav = document.getElementById('nav');
    var navBackdrop = document.getElementById('nav-backdrop');
    var navCloseBtn = document.getElementById('nav-close-btn');
    if (!mobileMenuBtn || !nav) return;
    if (nav.getAttribute('data-site-ui-nav') === '1') return;
    nav.setAttribute('data-site-ui-nav', '1');

    function openNav(e) {
      if (e) e.preventDefault();
      nav.classList.add('active');
      if (navBackdrop) navBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
    }

    function closeNav() {
      nav.classList.remove('active');
      if (navBackdrop) navBackdrop.classList.remove('active');
      document.body.style.overflow = '';
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }

    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    mobileMenuBtn.addEventListener('click', openNav);
    if (navCloseBtn) navCloseBtn.addEventListener('click', closeNav);
    if (navBackdrop) navBackdrop.addEventListener('click', closeNav);

    nav.addEventListener('click', function (e) {
      var link = e.target && e.target.closest ? e.target.closest('a.nav-link') : null;
      if (link && nav.contains(link)) closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('active')) closeNav();
    });
  }

  /** 捲動顯現：全站 .reveal 卡片 */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    function show(el) {
      el.classList.add('visible');
    }
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(show);
      return;
    }
    if (!('IntersectionObserver' in window)) {
      els.forEach(show);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            show(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  }

  initLoading();
  function onReady() {
    initHeaderSearch();
    injectCoachShareNav();
    initMobileNav();
    initReveal();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
