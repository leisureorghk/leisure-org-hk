/**
 * Firebase Web 設定（可公開）。部署前請改成你的專案值，或複製 firebase-config.local.js。
 * 若尚未開專案，會員登入會顯示設定提示。
 *
 * LEISURE_ENABLE_STORAGE：僅在已升級 Blaze 並建立 Storage 後改為 true。
 * Spark 免費、未開 Storage 時請保持 false（會員區媒體分頁會改導 WhatsApp）。
 */
window.LEISURE_FIREBASE_CONFIG = window.LEISURE_FIREBASE_CONFIG || {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  projectId: 'REPLACE_ME',
  storageBucket: 'REPLACE_ME.appspot.com',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
};

/** 已升級 Blaze 並建立 Storage 後才改為 true */
window.LEISURE_ENABLE_STORAGE = false;

window.LEISURE_FIREBASE_READY = function () {
  var c = window.LEISURE_FIREBASE_CONFIG;
  return c && c.apiKey && c.apiKey !== 'REPLACE_ME' && c.projectId && c.projectId !== 'REPLACE_ME';
};
