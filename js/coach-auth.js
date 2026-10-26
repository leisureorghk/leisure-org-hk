/**
 * 教練分享區：登入碼驗證（取代 Firebase）
 */
(function () {
  'use strict';

  var form = document.getElementById('coach-gate-form');
  var errEl = document.getElementById('coach-gate-err');
  var portal = document.getElementById('coach-portal');
  var gatePanel = document.getElementById('coach-gate-panel');

  function goNext() {
    var next = new URLSearchParams(location.search).get('next') || '';
    location.replace(window.CoachGate.resolveNext(next));
  }

  function showPortal() {
    if (gatePanel) gatePanel.classList.add('is-hidden');
    if (form) form.classList.add('is-hidden');
    if (portal) portal.classList.add('is-open');
  }

  if (!window.CoachGate) {
    if (errEl) errEl.textContent = '門檻腳本未載入，請重新整理。';
    return;
  }

  if (CoachGate.isUnlocked()) {
    var nextQ = new URLSearchParams(location.search).get('next');
    if (nextQ) {
      goNext();
      return;
    }
    showPortal();
  }

  form &&
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errEl) errEl.textContent = '';
      var code = document.getElementById('coach-pass') && document.getElementById('coach-pass').value;
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      CoachGate.verifyPasscode(code)
        .then(function (ok) {
          if (!ok) {
            if (errEl) errEl.textContent = '登入碼不正確，請向本會 WhatsApp 索取。';
            return;
          }
          CoachGate.setUnlocked(true);
          goNext();
        })
        .catch(function (err) {
          if (errEl) errEl.textContent = (err && err.message) || '驗證失敗';
        })
        .then(function () {
          if (btn) btn.disabled = false;
        });
    });

  var logoutBtn = document.getElementById('coach-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      CoachGate.logout();
    });
  }
})();
