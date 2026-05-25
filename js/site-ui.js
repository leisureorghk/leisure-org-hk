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

  initLoading();
})();
