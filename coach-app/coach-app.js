/**
 * 教練會員區：教材／留言／媒體（需 Firebase Auth coach claim）
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js';
import {
  getFunctions,
  httpsCallable,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js';

const root = document.getElementById('coach-app-root');
const boot = document.getElementById('coach-boot');
const userLabel = document.getElementById('coach-user-label');
const logoutBtn = document.getElementById('coach-logout');
const loading = document.getElementById('loading');

function hideLoading() {
  if (loading) loading.style.display = 'none';
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function params() {
  return new URLSearchParams(location.search);
}

if (!window.LEISURE_FIREBASE_READY || !window.LEISURE_FIREBASE_READY()) {
  hideLoading();
  root.innerHTML = `<div class="coach-card">
    <h3>尚未連接 Firebase</h3>
    <p class="coach-muted">請管理員於 <code>js/firebase-config.js</code> 填入專案設定，並依 <code>docs/COACH_FIREBASE.md</code> 部署 Functions 與名單。</p>
    <p><a class="btn btn-primary" href="../coach-share.html">返回教練分享區</a></p>
  </div>`;
  throw new Error('Firebase config missing');
}

const app = initializeApp(window.LEISURE_FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'asia-east1');

let currentUser = null;

logoutBtn?.addEventListener('click', async () => {
  await signOut(auth);
  location.href = '../coach-share.html';
});

function renderShell(name) {
  userLabel.textContent = name ? `已登入：${name}` : '';
  logoutBtn.hidden = !name;
  const next = params().get('next') || '';
  root.innerHTML = `
    <h1 style="font-size:1.45rem;margin:0 0 0.35rem">教練會員交流區</h1>
    <p class="coach-muted">深入教材、同行留言與媒體分享。請尊重學員私隱，勿公開可識別個人資料。</p>
    <div class="coach-tabs" role="tablist">
      <button type="button" data-tab="content" class="is-active">深入教材</button>
      <button type="button" data-tab="board">留言板</button>
      <button type="button" data-tab="media">媒體上載</button>
    </div>
    <section class="coach-panel is-open" id="panel-content"></section>
    <section class="coach-panel" id="panel-board"></section>
    <section class="coach-panel" id="panel-media"></section>
  `;
  root.querySelectorAll('.coach-tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.coach-tabs button').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      root.querySelectorAll('.coach-panel').forEach((p) => p.classList.remove('is-open'));
      document.getElementById(`panel-${btn.dataset.tab}`)?.classList.add('is-open');
    });
  });
  loadContentIndex(next);
  loadBoard();
  loadMedia();
}

async function loadContentIndex(focusSlug) {
  const panel = document.getElementById('panel-content');
  panel.innerHTML = '<p class="coach-muted">載入教材目錄…</p>';
  try {
    const snap = await getDocs(collection(db, 'coachContent'));
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    items.sort((a, b) => String(a.title || a.id).localeCompare(String(b.title || b.id), 'zh-Hant'));
    if (!items.length) {
      panel.innerHTML = `<div class="coach-card"><p class="coach-muted">尚未匯入教材。管理員請執行 <code>export-coach-content.mjs</code> 後上傳至 Firestore <code>coachContent</code>。</p></div>`;
      return;
    }
    let html = '<ul class="coach-list">';
    for (const it of items) {
      html += `<li><a href="#" data-slug="${esc(it.id)}">${esc(it.title || it.id)}</a></li>`;
    }
    html += '</ul><div id="coach-article-view"></div>';
    panel.innerHTML = html;
    panel.querySelectorAll('a[data-slug]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openArticle(a.getAttribute('data-slug'));
      });
    });
    if (focusSlug) openArticle(focusSlug);
  } catch (err) {
    panel.innerHTML = `<p class="coach-err">無法載入教材：${esc(err.message || err)}</p>`;
  }
}

async function openArticle(slug) {
  const view = document.getElementById('coach-article-view');
  if (!view) return;
  view.innerHTML = '<p class="coach-muted">載入中…</p>';
  try {
    const snap = await getDoc(doc(db, 'coachContent', slug));
    if (!snap.exists()) {
      view.innerHTML = `<p class="coach-err">找不到「${esc(slug)}」。可能尚未上傳至 Firestore。</p>`;
      return;
    }
    const d = snap.data();
    view.innerHTML = `<article class="coach-card coach-article"><h2>${esc(d.title || slug)}</h2>${d.bodyHtml || ''}</article>`;
  } catch (err) {
    view.innerHTML = `<p class="coach-err">${esc(err.message || err)}</p>`;
  }
}

function loadBoard() {
  const panel = document.getElementById('panel-board');
  panel.innerHTML = `
    <div class="coach-card">
      <h3>發表留言</h3>
      <form class="coach-form" id="post-form">
        <label for="post-body">內容</label>
        <textarea id="post-body" maxlength="4000" required placeholder="分享課堂觀察、資源連結（請勿寫出學員全名）"></textarea>
        <div class="coach-actions"><button type="submit" class="btn btn-primary">發布</button></div>
        <p class="coach-err" id="post-err"></p>
      </form>
    </div>
    <div id="posts-list"><p class="coach-muted">載入留言…</p></div>
  `;
  document.getElementById('post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('post-err');
    errEl.textContent = '';
    const body = document.getElementById('post-body').value.trim();
    if (!body) return;
    try {
      await addDoc(collection(db, 'posts'), {
        authorUid: currentUser.uid,
        authorName: currentUser.displayName || '教練',
        body,
        createdAt: serverTimestamp(),
      });
      document.getElementById('post-body').value = '';
    } catch (err) {
      errEl.textContent = err.message || String(err);
    }
  });

  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(40));
  onSnapshot(
    q,
    (snap) => {
      const list = document.getElementById('posts-list');
      if (!snap.size) {
        list.innerHTML = '<p class="coach-muted">尚無留言，來發表第一則吧。</p>';
        return;
      }
      let html = '';
      snap.forEach((d) => {
        const p = d.data();
        html += `<div class="coach-card" data-post="${esc(d.id)}">
          <div class="coach-meta">${esc(p.authorName || '')}</div>
          <p style="white-space:pre-wrap;margin:0.5rem 0 0">${esc(p.body)}</p>
          <form class="coach-form comment-form" data-post="${esc(d.id)}" style="margin-top:0.75rem">
            <input type="text" maxlength="2000" placeholder="回覆…" required>
            <div class="coach-actions"><button type="submit" class="btn btn-outline">回覆</button></div>
          </form>
          <div class="comments" id="comments-${esc(d.id)}"></div>
        </div>`;
      });
      list.innerHTML = html;
      list.querySelectorAll('.comment-form').forEach((form) => {
        form.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const postId = form.getAttribute('data-post');
          const input = form.querySelector('input');
          const body = input.value.trim();
          if (!body) return;
          try {
            await addDoc(collection(db, 'posts', postId, 'comments'), {
              authorUid: currentUser.uid,
              authorName: currentUser.displayName || '教練',
              body,
              createdAt: serverTimestamp(),
            });
            input.value = '';
          } catch (err) {
            alert(err.message || err);
          }
        });
        const postId = form.getAttribute('data-post');
        watchComments(postId);
      });
    },
    (err) => {
      document.getElementById('posts-list').innerHTML = `<p class="coach-err">${esc(err.message)}</p>`;
    }
  );
}

function watchComments(postId) {
  const box = document.getElementById(`comments-${postId}`);
  if (!box) return;
  const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'), limit(30));
  onSnapshot(q, (snap) => {
    let html = '';
    snap.forEach((d) => {
      const c = d.data();
      html += `<div class="coach-comment"><span class="coach-meta">${esc(c.authorName)}</span>
        <div style="white-space:pre-wrap">${esc(c.body)}</div></div>`;
    });
    box.innerHTML = html;
  });
}

function loadMedia() {
  const panel = document.getElementById('panel-media');
  panel.innerHTML = `
    <div class="coach-card">
      <h3>上載圖片／短片</h3>
      <p class="coach-muted">圖片建議 ≤ 5MB；短片 ≤ 50MB。禁止上載可識別學員面部之內容（除非已獲家長書面同意）。</p>
      <input type="file" id="media-file" accept="image/*,video/*">
      <div class="coach-actions"><button type="button" class="btn btn-primary" id="media-upload">上載</button></div>
      <p class="coach-err" id="media-err"></p>
      <p class="coach-ok" id="media-ok"></p>
    </div>
    <div class="coach-media-preview" id="media-list"></div>
  `;
  document.getElementById('media-upload').addEventListener('click', async () => {
    const err = document.getElementById('media-err');
    const ok = document.getElementById('media-ok');
    err.textContent = '';
    ok.textContent = '';
    const file = document.getElementById('media-file').files?.[0];
    if (!file) {
      err.textContent = '請先選擇檔案。';
      return;
    }
    if (file.type.startsWith('image/') && file.size > 5 * 1024 * 1024) {
      err.textContent = '圖片請小於 5MB。';
      return;
    }
    if (file.type.startsWith('video/') && file.size > 50 * 1024 * 1024) {
      err.textContent = '短片請小於 50MB。';
      return;
    }
    try {
      const path = `media/${currentUser.uid}/${Date.now()}_${file.name.replace(/[^\w.\-一-龥]/g, '_')}`;
      const r = ref(storage, path);
      await uploadBytes(r, file, { contentType: file.type });
      ok.textContent = '上載成功。';
      refreshMediaList();
    } catch (e) {
      err.textContent = e.message || String(e);
    }
  });
  refreshMediaList();
}

async function refreshMediaList() {
  const box = document.getElementById('media-list');
  if (!box || !currentUser) return;
  box.innerHTML = '<p class="coach-muted">載入媒體…</p>';
  try {
    const folder = ref(storage, `media/${currentUser.uid}`);
    const listed = await listAll(folder);
    if (!listed.items.length) {
      box.innerHTML = '<p class="coach-muted">尚未上載檔案。</p>';
      return;
    }
    const parts = await Promise.all(
      listed.items.slice(-24).reverse().map(async (item) => {
        const url = await getDownloadURL(item);
        const isVid = /\.(mp4|webm|mov)$/i.test(item.name);
        return isVid
          ? `<video src="${url}" controls></video>`
          : `<a href="${url}" target="_blank" rel="noopener"><img src="${url}" alt=""></a>`;
      })
    );
    box.innerHTML = parts.join('');
  } catch (e) {
    box.innerHTML = `<p class="coach-muted">${esc(e.message || '尚無可列出的媒體')}</p>`;
  }
}

/** 供 coach-share 頁呼叫：完成登入後導向此處 */
export async function loginWithCredentials(name, phone, code) {
  const fn = httpsCallable(functions, 'verifyCoachAccess');
  const res = await fn({ name, phone, code });
  const token = res.data?.token;
  if (!token) throw new Error('伺服器未回傳 token');
  await signInWithCustomToken(auth, token);
  return res.data;
}

onAuthStateChanged(auth, async (user) => {
  hideLoading();
  if (boot) boot.remove();
  if (!user) {
    currentUser = null;
    const next = params().get('next');
    const q = next ? `?next=${encodeURIComponent(next)}` : '';
    location.replace(`../coach-share.html${q}`);
    return;
  }
  // 強制有 coach claim（token 刷新）
  const token = await user.getIdTokenResult(true);
  if (!token.claims.coach) {
    await signOut(auth);
    root.innerHTML = `<div class="coach-card"><p class="coach-err">此帳戶沒有教練權限。</p>
      <a href="../coach-share.html">返回</a></div>`;
    return;
  }
  currentUser = user;
  renderShell(user.displayName || '教練');
});

// 暴露給同域 coach-share（非 module 頁用 session 導向，不直接呼叫）
window.LeisureCoachApp = { loginWithCredentials };
