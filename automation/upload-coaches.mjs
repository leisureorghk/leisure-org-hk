/**
 * 上傳教練檔到 Firestore coaches/{uid}（Spark 免費方案用）
 * 用法：GOOGLE_APPLICATION_CREDENTIALS=sa.json node upload-coaches.mjs ../data/my-coaches.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2];
if (!file) {
  console.error('Usage: node upload-coaches.mjs <coaches.json>');
  process.exit(1);
}

let admin;
try {
  admin = (await import('firebase-admin')).default;
} catch {
  console.error('請先：cd automation && npm install firebase-admin');
  process.exit(1);
}

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const raw = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
const coaches = Array.isArray(raw.coaches) ? raw.coaches : Array.isArray(raw) ? raw : [];

let n = 0;
for (const c of coaches) {
  const uid = String(c.uid || '').trim();
  if (!uid || uid.includes('PASTE_')) {
    console.warn('Skip bad uid', c);
    continue;
  }
  await db
    .collection('coaches')
    .doc(uid)
    .set(
      {
        name: String(c.name || '').trim(),
        email: String(c.email || '').trim().toLowerCase(),
        active: c.active !== false,
        note: c.note || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  console.log('Upsert coaches/', uid, c.name || c.email);
  n++;
}
console.log('Done', n);
