/**
 * 為教師課程產生簡潔教學 SVG（無寫實人臉／學員影像）。
 * 優先用 MiniMax；失敗時寫入本機範本 SVG。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minimaxChat } from './minimax-chat.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(root, 'Learn', '特殊需要人士教師課程', 'images');

const FORBIDDEN =
  /(療效|治癒|根治|診斷為|改藥|保證學會|包學會|真人照片|學員臉)/i;

function sanitizeSvg(raw) {
  let s = String(raw || '')
    .replace(/```(?:svg|xml)?\s*/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = s.indexOf('<svg');
  const end = s.lastIndexOf('</svg>');
  if (start < 0 || end < 0) return null;
  s = s.slice(start, end + 6);
  if (!/^<svg[\s>]/i.test(s)) return null;
  if (/<script|onclick|javascript:/i.test(s)) return null;
  if (s.length > 28000) return null;
  return s;
}

function fallbackSvg({ title, subtitle }) {
  const t = String(title || '教學示意').slice(0, 40);
  const sub = String(subtitle || '原創教學圖，非學員影像').slice(0, 60);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 300">
  <rect width="960" height="300" fill="#f8fafc"/>
  <rect x="40" y="40" width="880" height="220" rx="12" fill="#ecfeff" stroke="#0e7490" stroke-width="2"/>
  <text x="80" y="120" font-family="Microsoft JhengHei, sans-serif" font-size="28" font-weight="700" fill="#155e75">${escapeXml(t)}</text>
  <text x="80" y="170" font-family="Microsoft JhengHei, sans-serif" font-size="18" fill="#334155">${escapeXml(sub)}</text>
  <circle cx="820" cy="150" r="36" fill="#fde68a" stroke="#0f172a" stroke-width="2"/>
  <rect x="800" y="120" width="40" height="24" fill="#0e7490"/>
</svg>
`;
}

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {{ fileName: string, title: string, topic: string, unitId?: string }} opts
 * @returns {Promise<{ fileName: string, path: string, source: 'minimax'|'fallback' }>}
 */
export async function generateCourseSvg(opts) {
  const fileName = String(opts.fileName || '')
    .replace(/[^a-z0-9._-]/gi, '-')
    .replace(/\.+/g, '.')
    .replace(/^-|-$/g, '');
  if (!fileName.endsWith('.svg')) {
    throw new Error('fileName 必須以 .svg 結尾');
  }
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const outPath = path.join(IMAGES_DIR, fileName);

  const apiKey = process.env.MINIMAX_API_KEY;
  const model = process.env.MINIMAX_MODEL || 'MiniMax-M3';
  const base = process.env.MINIMAX_API_BASE || 'https://api.minimax.io';

  let svg = null;
  let source = 'fallback';

  if (apiKey && !FORBIDDEN.test(`${opts.title} ${opts.topic}`)) {
    try {
      const raw = await minimaxChat({
        apiKey,
        base,
        model,
        temperature: 0.35,
        max_completion_tokens: 2048,
        system: `你是特殊教育游泳教師教材插畫師。只輸出一個完整 SVG（viewBox="0 0 960 300"），不要 markdown。
規則：扁平教學示意、繁中短標籤、色系 #0e7490 / #fde68a / #f8fafc；禁止寫實人臉、照片、學員可辨識影像、script、外部連結。`,
        user: `單元 ${opts.unitId || ''}：${opts.title}\n主題：${opts.topic}\n請產出教學 SVG。`,
      });
      svg = sanitizeSvg(raw);
      if (svg) source = 'minimax';
    } catch (e) {
      console.error('SVG MiniMax 失敗，改用範本：', e.message || e);
    }
  }

  if (!svg) {
    svg = fallbackSvg({
      title: opts.title || fileName,
      subtitle: opts.topic || '原創教學示意',
    });
    source = 'fallback';
  }

  fs.writeFileSync(outPath, svg, 'utf8');
  return { fileName, path: outPath, source };
}

const isCli =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const title = process.argv[2] || '教學示意';
  const topic = process.argv[3] || '池邊結構化教學';
  const fileName = process.argv[4] || `upgrade-${Date.now()}.svg`;
  generateCourseSvg({ fileName, title, topic })
    .then((r) => {
      console.error('Wrote', r.path, r.source);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
