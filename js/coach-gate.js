/**
 * 教練分享區登入碼門檻（靜態站，無需 Firebase）
 * 登入狀態存 sessionStorage；深入頁呼叫 requireCoachAccess()。
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'leisure_coach_share_ok';
  /** SHA-256(登入碼) — 不在原始碼存放明文 */
  var PASS_HASH =
    '839f32c060771ad5d54eccd06bd4b91d4b3f8be41194f7d188eb2dae37d0e898';

  function hrefToSiteFile(fileName) {
    var path = String(location.pathname || '').replace(/\\/g, '/');
    var i = path.indexOf('/Learn/');
    if (i === -1) {
      if (/\/coach\//.test(path) || /\/coach-app\//.test(path)) {
        return '../' + fileName;
      }
      if (/特殊需要人士教師課程/.test(path)) {
        var segs = path.split('/').filter(Boolean);
        var learnAt = segs.indexOf('Learn');
        if (learnAt >= 0) {
          var ups = segs.length - 1 - learnAt;
          return '../'.repeat(Math.max(ups, 1)) + fileName;
        }
      }
      return fileName;
    }
    var after = path.slice(i + 1);
    var ups2 = after.split('/').length - 1;
    return '../'.repeat(ups2) + fileName;
  }

  function isUnlocked() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setUnlocked(ok) {
    try {
      if (ok) sessionStorage.setItem(STORAGE_KEY, '1');
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* private mode */
    }
  }

  function sha256Hex(text) {
    if (!global.crypto || !global.crypto.subtle) {
      return Promise.reject(new Error('此瀏覽器不支援安全雜湊，請改用較新版本瀏覽器。'));
    }
    var data = new TextEncoder().encode(String(text));
    return global.crypto.subtle.digest('SHA-256', data).then(function (buf) {
      return Array.from(new Uint8Array(buf))
        .map(function (b) {
          return b.toString(16).padStart(2, '0');
        })
        .join('');
    });
  }

  function verifyPasscode(input) {
    return sha256Hex(String(input || '').trim()).then(function (hex) {
      return hex === PASS_HASH;
    });
  }

  function markNoIndex() {
    try {
      if (document.querySelector('meta[name="robots"][data-coach-gate]')) return;
      var m = document.createElement('meta');
      m.name = 'robots';
      m.content = 'noindex, nofollow';
      m.setAttribute('data-coach-gate', '1');
      document.head.appendChild(m);
    } catch (e) {
      /* ignore */
    }
  }

  function resolveNext(nextRaw) {
    var next = String(nextRaw || '').trim();
    if (!next) return hrefToSiteFile('coach-app/index.html');
    try {
      next = decodeURIComponent(next);
    } catch (e) {
      /* keep */
    }
    if (/^https?:\/\//i.test(next) || next.indexOf('//') === 0) {
      return hrefToSiteFile('coach-app/index.html');
    }
    if (next.charAt(0) === '/') next = next.slice(1);
    if (!/\.html($|\?)/i.test(next) && next.indexOf('/') === -1) {
      next = next + '.html';
    }
    return hrefToSiteFile(next);
  }

  /** 深入頁／會員區：未登入則導向教練分享區 */
  function requireCoachAccess() {
    markNoIndex();
    if (isUnlocked()) return;
    var gate = hrefToSiteFile('coach-share.html');
    var next = encodeURIComponent(location.pathname.split('/').pop() || 'coach-app/index.html');
    location.replace(gate + (gate.indexOf('?') >= 0 ? '&' : '?') + 'next=' + next);
  }

  function logout() {
    setUnlocked(false);
    location.href = hrefToSiteFile('coach-share.html');
  }

  global.CoachGate = {
    STORAGE_KEY: STORAGE_KEY,
    isUnlocked: isUnlocked,
    setUnlocked: setUnlocked,
    verifyPasscode: verifyPasscode,
    requireCoachAccess: requireCoachAccess,
    hrefToSiteFile: hrefToSiteFile,
    resolveNext: resolveNext,
    logout: logout,
    markNoIndex: markNoIndex,
  };
})(typeof window !== 'undefined' ? window : globalThis);
