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

  initLoading();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderSearch);
  } else {
    initHeaderSearch();
  }
})();
