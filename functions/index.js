/**
 * verifyCoachAccess：姓名＋電話＋登入碼 → custom token（claim coach=true）
 *
 * 參數 COACH_ACCESS_CODE_HASH：登入碼 UTF-8 的 SHA-256 hex（小寫）
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('crypto');

if (!admin.apps.length) {
  admin.initializeApp();
}

const coachCodeHash = defineString('COACH_ACCESS_CODE_HASH', {
  description: 'SHA-256 hex of coach access code',
  default: '',
});

function normalizePhoneHK(raw) {
  let s = String(raw || '').replace(/\D/g, '');
  if (s.startsWith('852') && s.length >= 11) s = s.slice(3);
  if (s.length === 8) return `+852${s}`;
  if (String(raw || '').trim().startsWith('+') && s.length >= 10) {
    return `+${s}`;
  }
  throw new HttpsError('invalid-argument', '請輸入有效的香港手機號碼（8 位）。');
}

function normalizeName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function sha256Hex(text) {
  return crypto.createHash('sha256').update(String(text), 'utf8').digest('hex');
}

function phoneDocId(e164) {
  return e164.replace(/^\+/, '');
}

async function ensureCoachUser(uid, name) {
  try {
    await admin.auth().getUser(uid);
    await admin.auth().updateUser(uid, { displayName: name, disabled: false });
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      await admin.auth().createUser({ uid, displayName: name, disabled: false });
    } else {
      throw e;
    }
  }
  await admin.auth().setCustomUserClaims(uid, { coach: true });
}

exports.verifyCoachAccess = onCall(
  {
    region: 'asia-east1',
    cors: true,
  },
  async (request) => {
    const name = normalizeName(request.data?.name);
    const code = String(request.data?.code || '');
    let phoneE164;
    try {
      phoneE164 = normalizePhoneHK(request.data?.phone);
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      throw new HttpsError('invalid-argument', '電話格式不正確。');
    }

    if (!name || name.length < 2) {
      throw new HttpsError('invalid-argument', '請填寫姓名。');
    }
    if (!code) {
      throw new HttpsError('invalid-argument', '請填寫登入碼。');
    }

    const expected = String(coachCodeHash.value() || '').trim().toLowerCase();
    if (!expected) {
      throw new HttpsError(
        'failed-precondition',
        '伺服器尚未設定登入碼，請聯絡本會管理員。'
      );
    }
    if (sha256Hex(code) !== expected) {
      throw new HttpsError('permission-denied', '登入碼不正確。');
    }

    const docId = phoneDocId(phoneE164);
    const snap = await admin.firestore().collection('allowlist').doc(docId).get();
    if (!snap.exists) {
      throw new HttpsError('permission-denied', '此電話不在核准名單。請先向本會申請。');
    }
    const row = snap.data() || {};
    if (row.active === false) {
      throw new HttpsError('permission-denied', '此帳戶已停用，請聯絡本會。');
    }
    const listedName = normalizeName(row.name);
    if (listedName && listedName !== name) {
      throw new HttpsError('permission-denied', '姓名與名單不符，請確認後再試。');
    }

    const uid = `coach_${docId}`;
    await ensureCoachUser(uid, name);

    await admin.firestore().collection('members').doc(uid).set(
      {
        name,
        phone: phoneE164,
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const token = await admin.auth().createCustomToken(uid, { coach: true });
    return { token, uid, name };
  }
);
