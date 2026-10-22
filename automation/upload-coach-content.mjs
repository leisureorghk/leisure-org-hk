/**
 * 將 data/coach-content/*.json 上傳到 Firestore coachContent/
 * 用法：GOOGLE_APPLICATION_CREDENTIALS=sa.json node upload-coach-content.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'data', 'coach-content');

let admin;
try {
  admin = (await import('firebase-admin')).default;
} catch {
  console.error('請先：cd automation && npm install firebase-admin');
  process.exit(1);
}

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

if (!fs.existsSync(dir)) {
  console.error('找不到', dir, '— 請先 node export-coach-content.mjs');
  process.exit(1);
}

let n = 0;
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.json') || name.startsWith('_')) continue;
  const doc = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  const slug = doc.slug || name.replace(/\.json$/, '');
  await db
    .collection('coachContent')
    .doc(slug)
    .set(
      {
        title: doc.title || slug,
        bodyHtml: doc.bodyHtml || '',
        sourceFile: doc.sourceFile || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  console.log('Uploaded', slug);
  n++;
}
console.log('Done', n);
