/**
 * 教練分享區登入（Spark 免費方案）：Email／密碼 → coach-app
 * 權限由 Firestore coaches/{uid}.active 控制，不需 Cloud Functions。
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const form = document.getElementById('coach-gate-form');
const errEl = document.getElementById('coach-gate-err');

function nextTarget() {
  const next = new URLSearchParams(location.search).get('next') || '';
  const q = next ? `?next=${encodeURIComponent(next)}` : '';
  return `coach-app/index.html${q}`;
}

async function assertCoach(auth, db, user) {
  const snap = await getDoc(doc(db, 'coaches', user.uid));
  if (!snap.exists() || snap.data().active !== true) {
    await signOut(auth);
    throw new Error('此帳戶未在核准教練名單，或尚未啟用。請 WhatsApp 聯絡本會。');
  }
  return snap.data();
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
  const db = getFirestore(app);

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
      await assertCoach(auth, db, user);
      location.replace(nextTarget());
    } catch (e) {
      if (errEl) errEl.textContent = e.message || '沒有教練權限';
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errEl) errEl.textContent = '';
    const email = document.getElementById('coach-email')?.value.trim();
    const password = document.getElementById('coach-pass')?.value || '';
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await assertCoach(auth, db, cred.user);
      location.replace(nextTarget());
    } catch (err) {
      let msg = '登入失敗，請確認電郵與密碼。';
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        msg = '電郵或密碼不正確。';
      } else if (code === 'auth/too-many-requests') {
        msg = '嘗試次數過多，請稍後再試。';
      } else if (err?.message && !String(err.message).startsWith('Firebase:')) {
        msg = err.message;
      }
      if (errEl) errEl.textContent = msg;
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}
