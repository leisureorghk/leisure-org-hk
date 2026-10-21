/**
 * 每月 SEN 教師課程 AI 升級：
 * 蒐集 digest → 分類 → 升級 1 個單元（可選新章）→ 備份 → 渲染 → SVG → 公開 extras
 *
 * 環境：MINIMAX_API_KEY（未設則安靜結束）
 * 執行：node monthly-sen-course-upgrade.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { minimaxChat } from './minimax-chat.mjs';
import {
  loadCourseKnowledge,
  saveCourseKnowledge,
  writeUnitFiles,
} from './render-course-unit.mjs';
import { generateCourseSvg } from './generate-course-svg.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const COURSE_DIR = path.join(root, 'Learn', '特殊需要人士教師課程');
const STATE_PATH = path.join(root, 'data', 'sen-course-upgrade-state.json');
const LOG_PATH = path.join(root, 'data', 'sen-course-upgrade-log.json');
const DIGEST_PATH = path.join(root, 'data', 'sen-swim-digest.json');
const EXTRAS_PATH = path.join(root, 'data', 'monthly-audit-extras.json');
const MAP_PATH = path.join(__dirname, 'sen-unit-public-map.json');

const FROZEN_RE =
  /(\$[\d,]|HKD|港幣\s*\d|97083907|G-L4D38|ga4Measurement|google-site-verification|msvalidate)/i;
const BAD_CLAIM_RE =
  /(保證學會|包學會|根治|治癒自閉|診斷為|自行改藥|停藥|開藥方)/i;
const INTERNAL_HREF = /^(?:[a-z0-9][-a-z0-9]*\.html)(?:[?#][^\s"']*)?$/i;

function hkParts(d = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [year, month, day] = fmt.format(d).split('-').map(Number);
  return { year, month, day, ym: `${year}-${String(month).padStart(2, '0')}` };
}

function monthRange(ym) {
  const [y, m] = ym.split('-').map(Number);
  const start = new Date(`${ym}-01T00:00:00+08:00`);
  const endMonth = m === 12 ? 1 : m + 1;
  const endYear = m === 12 ? y + 1 : y;
  const end = new Date(
    `${endYear}-${String(endMonth).padStart(2, '0')}-01T00:00:00+08:00`
  );
  return { start, end };
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function extractJsonPayload(raw) {
  const text = String(raw || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function collectDigestForMonth(ym) {
  const digest = readJson(DIGEST_PATH, { items: [] });
  const { start, end } = monthRange(ym);
  const items = (digest.items || [])
    .filter((it) => {
      const t = Date.parse(it.publishedAt || it.updatedAt || '');
      return Number.isFinite(t) && t >= start.getTime() && t < end.getTime();
    })
    .slice(0, 24)
    .map((it) => ({
      title: String(it.title || '').slice(0, 120),
      url: String(it.url || '').slice(0, 300),
      summary: String(it.summary || it.bodyZh || '').slice(0, 280),
      sourceName: String(it.sourceName || '').slice(0, 60),
      publishedAt: it.publishedAt || '',
    }));
  // 若當月不足，取最新若干則作升級線索
  if (items.length < 4) {
    return (digest.items || []).slice(0, 16).map((it) => ({
      title: String(it.title || '').slice(0, 120),
      url: String(it.url || '').slice(0, 300),
      summary: String(it.summary || it.bodyZh || '').slice(0, 280),
      sourceName: String(it.sourceName || '').slice(0, 60),
      publishedAt: it.publishedAt || '',
    }));
  }
  return items;
}

function pickTargetUnit(state, knowledge) {
  const byId = new Map((knowledge.units || []).map((u) => [u.id, u]));
  const queue = Array.isArray(state.queue) ? state.queue : [];
  for (const id of queue) {
    if (byId.has(id)) return byId.get(id);
  }
  return knowledge.units?.[0] || null;
}

function rotateQueue(state, unitId) {
  const q = Array.isArray(state.queue) ? [...state.queue] : [];
  const i = q.indexOf(unitId);
  if (i >= 0) {
    q.splice(i, 1);
    q.push(unitId);
  }
  state.queue = q;
}

function backupUnit(unit, ym) {
  const dest = path.join(COURSE_DIR, 'history', ym, unit.slug);
  fs.mkdirSync(dest, { recursive: true });
  const unitHtml = path.join(COURSE_DIR, 'units', `${unit.slug}.html`);
  if (fs.existsSync(unitHtml)) {
    fs.copyFileSync(unitHtml, path.join(dest, `${unit.slug}.html`));
  }
  fs.writeFileSync(
    path.join(dest, 'unit-snapshot.json'),
    JSON.stringify(unit, null, 2) + '\n',
    'utf8'
  );
  return dest;
}

function sanitizeKeypoint(kp, unit) {
  const title = String(kp.title || '').trim().slice(0, 40);
  let body = String(kp.body || '').trim().slice(0, 1200);
  if (BAD_CLAIM_RE.test(body) || FROZEN_RE.test(body)) {
    body = body
      .replace(BAD_CLAIM_RE, '（已略）')
      .replace(FROZEN_RE, '（已略）');
  }
  if (!/情境[：:]/.test(body)) {
    body = `情境：課堂出現相關需要。原則：${body}池邊做法：以可觀察行為調整教學，不作診斷。`;
  } else if (!/池邊(?:做法|執行)[：:]/.test(body)) {
    body += '池邊做法：以可觀察行為調整，並與家長／SENCO 對齊。';
  }
  const id =
    String(kp.id || title)
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff-]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32) || 'kp';
  return {
    id,
    title: title || '教學重點',
    body,
    source: String(kp.source || `${unit.id} ${unit.title} · ${title}`).slice(0, 80),
    figures: Array.isArray(kp.figures)
      ? kp.figures.filter((f) => /\.svg$/i.test(f)).slice(0, 3)
      : [],
  };
}

function mergeUnitUpgrade(existing, patch) {
  const next = { ...existing };
  if (patch.selfStudyIntro) {
    next.selfStudyIntro = String(patch.selfStudyIntro).trim().slice(0, 400);
  }
  if (Array.isArray(patch.objectives) && patch.objectives.length) {
    next.objectives = patch.objectives.map((o) => String(o).slice(0, 120)).slice(0, 5);
  }
  if (Array.isArray(patch.keypoints) && patch.keypoints.length) {
    const byId = new Map((existing.keypoints || []).map((k) => [k.id, { ...k }]));
    for (const kp of patch.keypoints.map((k) => sanitizeKeypoint(k, existing))) {
      const prev = byId.get(kp.id);
      byId.set(kp.id, prev ? { ...prev, ...kp, figures: kp.figures?.length ? kp.figures : prev.figures } : kp);
    }
    // 保留原有順序，新 id 附加於後
    const order = [...(existing.keypoints || []).map((k) => k.id)];
    for (const id of byId.keys()) {
      if (!order.includes(id)) order.push(id);
    }
    next.keypoints = order.map((id) => byId.get(id)).filter(Boolean).slice(0, 12);
  }
  if (Array.isArray(patch.do) && patch.do.length) {
    next.do = [...new Set([...(patch.do || []), ...(existing.do || [])].map((t) => String(t).slice(0, 160)))].slice(0, 6);
  }
  if (Array.isArray(patch.avoid) && patch.avoid.length) {
    next.avoid = [...new Set([...(patch.avoid || []), ...(existing.avoid || [])].map((t) => String(t).slice(0, 160)))].slice(0, 6);
  }
  if (Array.isArray(patch.glossary) && patch.glossary.length) {
    const gmap = new Map((existing.glossary || []).map((g) => [g.term, g]));
    for (const g of patch.glossary) {
      const term = String(g.term || '').trim().slice(0, 40);
      if (!term) continue;
      gmap.set(term, {
        term,
        def: String(g.def || '').trim().slice(0, 160),
        anchor: String(g.anchor || `kp-${term}`).slice(0, 40),
      });
    }
    next.glossary = [...gmap.values()].slice(0, 16);
  }
  if (patch.cantoneseScript) {
    next.cantoneseScript = String(patch.cantoneseScript).trim().slice(0, 2000);
  }
  if (Array.isArray(patch.images) && patch.images.length) {
    next.images = [...new Set([...(patch.images || []), ...(existing.images || [])])].slice(0, 8);
  }
  if (Array.isArray(patch.sources)) {
    next.upgradeSources = patch.sources
      .map((s) => ({
        title: String(s.title || '').slice(0, 100),
        url: String(s.url || '').slice(0, 300),
      }))
      .filter((s) => s.url.startsWith('http'))
      .slice(0, 8);
  }
  next.lastUpgradedAt = new Date().toISOString();
  return next;
}

function buildNewChapter(patch, knowledge) {
  const id = String(patch.id || '').trim().slice(0, 12);
  const slug = String(patch.slug || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  if (!id || !slug) return null;
  if ((knowledge.units || []).some((u) => u.id === id || u.slug === slug)) return null;
  const title = String(patch.title || '').trim().slice(0, 40);
  if (!title) return null;
  const unit = {
    id,
    slug,
    category: String(patch.category || '實務').slice(0, 12),
    title,
    selfStudyIntro: String(patch.selfStudyIntro || '').slice(0, 400),
    objectives: (patch.objectives || []).map((o) => String(o).slice(0, 120)).slice(0, 5),
    keypoints: (patch.keypoints || []).map((k) => sanitizeKeypoint(k, { id, title })),
    do: (patch.do || []).map((t) => String(t).slice(0, 160)).slice(0, 5),
    avoid: (patch.avoid || []).map((t) => String(t).slice(0, 160)).slice(0, 5),
    glossary: (patch.glossary || [])
      .map((g) => ({
        term: String(g.term || '').slice(0, 40),
        def: String(g.def || '').slice(0, 160),
        anchor: String(g.anchor || '').slice(0, 40),
      }))
      .filter((g) => g.term),
    cantoneseScript: String(patch.cantoneseScript || '').slice(0, 2000),
    images: (patch.images || []).filter((f) => /\.svg$/i.test(f)).slice(0, 4),
    lastUpgradedAt: new Date().toISOString(),
  };
  if (!unit.objectives.length || !unit.keypoints.length) return null;
  if (BAD_CLAIM_RE.test(JSON.stringify(unit))) return null;
  return unit;
}

function writePublicExtras(unitId, publicFaqs, publicLinks, ym) {
  const map = readJson(MAP_PATH, { map: {} }).map || {};
  const file = map[unitId];
  if (!file) return { applied: [] };

  const extras = readJson(EXTRAS_PATH, { landings: {} });
  extras.landings = extras.landings || {};
  extras.updatedAt = new Date().toISOString();
  extras.month = ym;

  const faqs = (Array.isArray(publicFaqs) ? publicFaqs : [])
    .map((f) => ({
      q: String(f.q || f.question || '').trim().slice(0, 80),
      a: String(f.a || f.answer || '').trim().slice(0, 400),
    }))
    .filter((f) => f.q && f.a && !FROZEN_RE.test(f.q + f.a) && !BAD_CLAIM_RE.test(f.q + f.a))
    .slice(0, 4);

  const links = (Array.isArray(publicLinks) ? publicLinks : [])
    .map((l) => ({
      href: String(l.href || l.path || '').replace(/^\//, ''),
      label: String(l.label || l.title || '').trim().slice(0, 40),
    }))
    .filter((l) => INTERNAL_HREF.test(l.href) && l.label)
    .slice(0, 6);

  if (!faqs.length && !links.length) return { applied: [] };

  const prev = extras.landings[file] || { faqs: [], links: [] };
  const mergedFaqs = [...faqs, ...(prev.faqs || [])]
    .filter((f, i, arr) => arr.findIndex((x) => x.q === f.q) === i)
    .slice(0, 4);
  const mergedLinks = [...links, ...(prev.links || [])]
    .filter((l, i, arr) => arr.findIndex((x) => x.href === l.href) === i)
    .slice(0, 6);
  extras.landings[file] = {
    faqs: mergedFaqs,
    links: mergedLinks,
  };
  fs.writeFileSync(EXTRAS_PATH, JSON.stringify(extras, null, 2) + '\n', 'utf8');
  return { applied: [file] };
}

async function callUpgradeModel({ ym, target, digestItems, unitCatalog }) {
  const apiKey = process.env.MINIMAX_API_KEY;
  const model = process.env.MINIMAX_MODEL || 'MiniMax-M3';
  const base = process.env.MINIMAX_API_BASE || 'https://api.minimax.io';
  if (!apiKey) return { skipped: true };

  const system = `你是香港「特殊需要人士游泳教師證書課程」教材編輯。只用繁體中文（香港書面語）。
任務：根據公開 SEN／教育／游泳摘要，升級指定單元，使之更現代化、可教學（情境→原則→池邊執行）。
硬性規則：
- 只輸出一個 JSON，不要 markdown。
- 禁止療效承諾、診斷、改藥、收費／電話。
- 不可抄襲外文全文；sources 只列標題與 URL。
- keypoints[].body 必須含「情境：」「原則：」「池邊做法：」。
- 公開 FAQ 須家長向、精簡、不作診斷。
- 僅當摘要明確指向現有單元未涵蓋的教學主題，才填 newChapter；否則 newChapter 為 null。
JSON：
{
  "summary": "本月升級摘要 ≤80字",
  "unitPatch": {
    "selfStudyIntro": "",
    "objectives": ["",""],
    "keypoints": [{"id":"","title":"","body":"情境：…原則：…池邊做法：…","source":"","figures":[]}],
    "do": [""],
    "avoid": [""],
    "glossary": [{"term":"","def":"","anchor":""}],
    "cantoneseScript": "粵語講稿",
    "images": [],
    "sources": [{"title":"","url":""}],
    "needSvg": {"fileName":"upgrade-xxx.svg","title":"","topic":""}
  },
  "newChapter": null,
  "publicFaqs": [{"q":"","a":""}],
  "publicLinks": [{"href":"sen-swim-safety.html","label":""}]
}`;

  const user = `月份：${ym}
目標單元：${JSON.stringify({
    id: target.id,
    slug: target.slug,
    title: target.title,
    category: target.category,
    selfStudyIntro: target.selfStudyIntro,
    objectives: target.objectives,
    keypoints: (target.keypoints || []).map((k) => ({
      id: k.id,
      title: k.title,
      body: String(k.body || '').slice(0, 400),
    })),
    do: target.do,
    avoid: target.avoid,
  }).slice(0, 7000)}
現有單元目錄：${JSON.stringify(unitCatalog).slice(0, 2500)}
本月公開摘要：${JSON.stringify(digestItems).slice(0, 5000)}
請升級目標單元，補強現代化教學要點；可新增 1–2 個 keypoints。只輸出 JSON。`;

  const raw = await minimaxChat({
    apiKey,
    base,
    model,
    system,
    user,
    temperature: 0.4,
    max_completion_tokens: 4096,
  });
  return extractJsonPayload(raw) || {};
}

function writeLog(entry) {
  const log = readJson(LOG_PATH, { runs: [] });
  log.runs = [entry, ...(log.runs || [])].slice(0, 36);
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + '\n', 'utf8');
}

async function main() {
  const { ym } = hkParts();
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    console.error('MINIMAX_API_KEY 未設定：略過 SEN 課程升級。');
    process.exit(0);
  }

  const state = readJson(STATE_PATH, { queue: [], history: [], quota: {} });
  const knowledge = loadCourseKnowledge();
  const target = pickTargetUnit(state, knowledge);
  if (!target) {
    console.error('找不到可升級單元，略過。');
    process.exit(0);
  }

  const digestItems = collectDigestForMonth(ym);
  console.error(
    `SEN course upgrade ${ym}: target=${target.id} ${target.slug}; digest=${digestItems.length}`
  );

  const unitCatalog = (knowledge.units || []).map((u) => ({
    id: u.id,
    slug: u.slug,
    title: u.title,
    category: u.category,
  }));

  let parsed = {};
  try {
    parsed = await callUpgradeModel({ ym, target, digestItems, unitCatalog });
  } catch (e) {
    console.error('MiniMax 升級失敗：', e.message || e);
    writeLog({
      at: new Date().toISOString(),
      ym,
      unitId: target.id,
      ok: false,
      error: String(e.message || e).slice(0, 240),
    });
    process.exit(1);
  }

  if (parsed.skipped) {
    console.error('略過。');
    process.exit(0);
  }

  const changes = [];
  const backupPath = backupUnit(target, ym);
  changes.push(`backup:${backupPath}`);

  const patch = parsed.unitPatch && typeof parsed.unitPatch === 'object' ? parsed.unitPatch : {};
  const upgraded = mergeUnitUpgrade(target, patch);
  const idx = knowledge.units.findIndex((u) => u.id === target.id);
  knowledge.units[idx] = upgraded;

  let newChapterId = null;
  const maxNew = state.quota?.maxNewChaptersPerMonth ?? 1;
  if (maxNew > 0 && parsed.newChapter && typeof parsed.newChapter === 'object') {
    const chapter = buildNewChapter(parsed.newChapter, knowledge);
    if (chapter) {
      knowledge.units.push(chapter);
      newChapterId = chapter.id;
      changes.push(`newChapter:${chapter.id}`);
      if (!state.queue.includes(chapter.id)) state.queue.push(chapter.id);
    }
  }

  // 教學圖
  const needSvg = patch.needSvg && typeof patch.needSvg === 'object' ? patch.needSvg : null;
  if (needSvg && needSvg.fileName) {
    try {
      const svg = await generateCourseSvg({
        fileName: String(needSvg.fileName).endsWith('.svg')
          ? needSvg.fileName
          : `${needSvg.fileName}.svg`,
        title: needSvg.title || upgraded.title,
        topic: needSvg.topic || parsed.summary || upgraded.title,
        unitId: upgraded.id,
      });
      upgraded.images = [...new Set([...(upgraded.images || []), svg.fileName])].slice(0, 8);
      knowledge.units[idx] = upgraded;
      changes.push(`svg:${svg.fileName}:${svg.source}`);
    } catch (e) {
      console.error('SVG 生成略過：', e.message || e);
    }
  }

  saveCourseKnowledge(knowledge);
  changes.push('course-knowledge.json');

  const slugsToRender = [upgraded.slug];
  if (newChapterId) {
    const ch = knowledge.units.find((u) => u.id === newChapterId);
    if (ch) slugsToRender.push(ch.slug);
  }
  writeUnitFiles(knowledge, slugsToRender);
  changes.push(...slugsToRender.map((s) => `unit:${s}`));

  const pub = writePublicExtras(upgraded.id, parsed.publicFaqs, parsed.publicLinks, ym);
  if (pub.applied.length) {
    changes.push(...pub.applied.map((f) => `extras:${f}`));
    const gen = spawnSync(process.execPath, [path.join(__dirname, 'generate-content-pages.mjs')], {
      cwd: root,
      stdio: 'inherit',
    });
    if (gen.status) {
      console.error('generate-content-pages 結束碼', gen.status);
    } else {
      changes.push('generate-content-pages');
    }
  }

  rotateQueue(state, upgraded.id);
  state.lastRun = {
    at: new Date().toISOString(),
    ym,
    unitId: upgraded.id,
    slug: upgraded.slug,
    newChapterId,
    summary: String(parsed.summary || '').slice(0, 120),
  };
  state.history = [
    {
      ym,
      unitId: upgraded.id,
      slug: upgraded.slug,
      newChapterId,
      at: state.lastRun.at,
    },
    ...(state.history || []),
  ].slice(0, 48);
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
  changes.push('sen-course-upgrade-state.json');

  writeLog({
    at: new Date().toISOString(),
    ym,
    unitId: upgraded.id,
    slug: upgraded.slug,
    newChapterId,
    summary: state.lastRun.summary,
    sources: upgraded.upgradeSources || [],
    changes,
    ok: true,
  });

  console.error('SEN course upgrade done:', changes.join(', '));
}

const isCli =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
