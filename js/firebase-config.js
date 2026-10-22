/**
 * Firebase Web 設定（可公開）。部署前請改成你的專案值，或複製 firebase-config.local.js。
 * 若尚未開專案，會員登入會顯示設定提示。
 */
window.LEISURE_FIREBASE_CONFIG = window.LEISURE_FIREBASE_CONFIG || {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  projectId: 'REPLACE_ME',
  storageBucket: 'REPLACE_ME.appspot.com',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
};

window.LEISURE_FIREBASE_READY = function () {
  var c = window.LEISURE_FIREBASE_CONFIG;
  return c && c.apiKey && c.apiKey !== 'REPLACE_ME' && c.projectId && c.projectId !== 'REPLACE_ME';
};
