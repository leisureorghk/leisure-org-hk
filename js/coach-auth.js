/**
 * 教練分享區登入：Callable verifyCoachAccess → custom token → coach-app
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  getFunctions,
  httpsCallable,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js';

const form = document.getElementById('coach-gate-form');
const errEl = document.getElementById('coach-gate-err');

function nextTarget() {
  const next = new URLSearchParams(location.search).get('next') || '';
  const q = next ? `?next=${encodeURIComponent(next)}` : '';
  return `coach-app/index.html${q}`;
}

if (!window.LEISURE_FIREBASE_READY || !window.LEISURE_FIREBASE_READY()) {
  if (errEl) {
    errEl.textContent =
      '會員系統尚未設定 Firebase。請管理員完成 docs/COACH_FIREBASE.md 後再開放登入。';
  }
  if (form) {
    form.querySelector('button[type="submit"]')?.setAttribute('disabled', 'disabled');
  }
} else {
  const app = initializeApp(window.LEISURE_FIREBASE_CONFIG);
  const auth = getAuth(app);
  const functions = getFunctions(app, 'asia-east1');

  onAuthStateChanged(auth, (user) => {
    if (user) {
      user.getIdTokenResult().then((t) => {
        if (t.claims.coach) location.replace(nextTarget());
      });
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errEl) errEl.textContent = '';
    const name = document.getElementById('coach-name')?.value.trim();
    const phone = document.getElementById('coach-phone')?.value.trim();
    const code = document.getElementById('coach-pass')?.value || '';
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      const fn = httpsCallable(functions, 'verifyCoachAccess');
      const res = await fn({ name, phone, code });
      const token = res.data?.token;
      if (!token) throw new Error('伺服器未回傳登入憑證');
      await signInWithCustomToken(auth, token);
      location.replace(nextTarget());
    } catch (err) {
      const msg =
        err?.message?.replace(/^Firebase:\s*/i, '') ||
        err?.code ||
        '登入失敗，請確認姓名、電話與登入碼。';
      if (errEl) errEl.textContent = msg;
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}
