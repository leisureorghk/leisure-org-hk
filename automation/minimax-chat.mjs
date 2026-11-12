/**
 * MiniMax Chat Completions（與 weekly-article 相同端點）
 *
 * 預設用最省 token 的 Flash + reasoning_effort=low
 *（Flash 無法關閉 thinking；none 會 HTTP 400）
 */

/** 目前平台最省的文字模型（相對 MiniMax-M3） */
export const DEFAULT_MINIMAX_MODEL = 'MiniMax-M3.1-Flash';

/** Flash 可調思考深度：low｜medium｜high｜xhigh｜max；省略時平台預設為 max */
export const DEFAULT_REASONING_EFFORT = 'low';

/** 讀取環境變數或回傳預設模型 */
export function resolveMinimaxModel(envModel) {
  const m = String(envModel || process.env.MINIMAX_MODEL || '')
    .trim();
  return m || DEFAULT_MINIMAX_MODEL;
}

/** 讀取環境變數或回傳預設思考深度（僅 Flash 有效） */
export function resolveReasoningEffort(envEffort) {
  const e = String(
    envEffort || process.env.MINIMAX_REASONING_EFFORT || ''
  )
    .trim()
    .toLowerCase();
  const allowed = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
  return allowed.has(e) ? e : DEFAULT_REASONING_EFFORT;
}

/** 部分模型會先輸出思考區塊，解析 JSON／HTML 前應移除 */
export function stripMinimaxMessageContent(text) {
  return String(text || '')
    .replace(/<think>[\s\S]*?<\/redacted_thinking>/gi, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<reasoning[^>]*>[\s\S]*?<\/reasoning>/gi, '')
    .trim();
}

/** 去除前後空白、BOM、誤貼的 `Bearer ` 前綴 */
export function normalizeMinimaxApiKey(raw) {
  let k = String(raw ?? '')
    .trim()
    .replace(/^\ufeff/, '');
  if (/^bearer\s+/i.test(k)) k = k.replace(/^bearer\s+/i, '').trim();
  return k;
}

/**
 * OpenAI 相容 `chat/completions` 完整 URL。
 * `base` 可為 `https://api.minimax.io`，或已含版本路徑的 `https://api.minimaxi.com/v1`（避免重複 `/v1/v1/`）。
 */
export function resolveMinimaxChatCompletionsUrl(baseRaw) {
  let b = String(baseRaw || 'https://api.minimax.io')
    .trim()
    .replace(/\/+$/, '');
  if (!b) b = 'https://api.minimax.io';
  if (/\/v1$/i.test(b)) {
    return `${b}/chat/completions`;
  }
  return `${b}/v1/chat/completions`;
}

function formatMinimaxErrorPayload(data) {
  if (!data || typeof data !== 'object') return '';
  const br = data.base_resp;
  if (br && (br.status_msg != null || br.status_code != null)) {
    const msg = br.status_msg != null && String(br.status_msg).trim() ? String(br.status_msg).trim() : 'error';
    return `${msg} (${br.status_code})`;
  }
  const err = data.error;
  if (err && typeof err === 'object') {
    const m = err.message || err.msg || err.code;
    if (m) return String(m);
  }
  if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
  try {
    return JSON.stringify(data).slice(0, 400);
  } catch {
    return '';
  }
}

/** 本機除錯用：常見誤用金鑰型態提醒（不會輸出金鑰內容） */
export function minimaxApiKeySanityHint(rawKey) {
  const k = normalizeMinimaxApiKey(rawKey);
  if (!k) return '';
  const parts = [];
  if (k.startsWith('ey')) {
    parts.push(
      '金鑰以 ey 開頭時多為 JWT，OpenAI 相容介面通常需使用「帳戶／API Keys」裡的 sk- 開頭 API Key（若平台只給 ey，請改建立或複製正確類型的金鑰）。'
    );
  }
  if (k.length < 24) {
    parts.push('金鑰長度偏短，請確認是否複製完整、沒有多餘空格或換行。');
  }
  return parts.join(' ');
}

function normalizeMessageContent(content) {
  if (content == null) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          if (typeof part.text === 'string') return part.text;
          if (typeof part.content === 'string') return part.content;
        }
        return '';
      })
      .join('');
  }
  return String(content);
}

export async function minimaxChat({
  apiKey,
  base,
  model,
  system,
  user,
  temperature = 0.65,
  max_completion_tokens = 2048,
  reasoning_effort,
}) {
  const key = normalizeMinimaxApiKey(apiKey);
  if (!key) throw new Error('Minimax: API key 為空');

  const resolvedModel = resolveMinimaxModel(model);
  const effort = resolveReasoningEffort(reasoning_effort);
  const url = resolveMinimaxChatCompletionsUrl(base || 'https://api.minimax.io');
  const body = {
    model: resolvedModel,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature,
    max_completion_tokens,
  };
  // Flash：明確設 low，避免平台預設 max 浪費思考 token
  if (/flash/i.test(resolvedModel) || effort) {
    body.reasoning_effort = effort;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = formatMinimaxErrorPayload(data) || res.statusText || 'request failed';
    throw new Error(`Minimax HTTP ${res.status}: ${detail}`);
  }
  const br = data?.base_resp;
  if (br && br.status_code != null && Number(br.status_code) !== 0) {
    const detail = formatMinimaxErrorPayload(data);
    throw new Error(`Minimax API error: ${detail}`);
  }
  const msg = data?.choices?.[0]?.message || {};
  const raw = normalizeMessageContent(msg.content);
  if (!raw) throw new Error('Minimax: empty choices[0].message.content');
  return stripMinimaxMessageContent(raw);
}
