/**
 * 上傳核准名單到 Firestore allowlist/
 * 用法：GOOGLE_APPLICATION_CREDENTIALS=sa.json node upload-allowlist.mjs ../data/my-allowlist.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2];
if (!file) {
  console.error('Usage: node upload-allowlist.mjs <allowlist.json>');
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
const members = Array.isArray(raw.members) ? raw.members : Array.isArray(raw) ? raw : [];

function phoneId(phone) {
  let s = String(phone || '').replace(/\D/g, '');
  if (s.length === 8) s = `852${s}`;
  return s.replace(/^\+/, '');
}

let n = 0;
for (const m of members) {
  const id = phoneId(m.phone);
  if (!id || id.length < 10) {
    console.warn('Skip bad phone', m);
    continue;
  }
  await db
    .collection('allowlist')
    .doc(id)
    .set(
      {
        name: String(m.name || '').trim(),
        active: m.active !== false,
        note: m.note || '',
        phone: `+${id}`,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  console.log('Upsert', id, m.name);
  n++;
}
console.log('Done', n);
