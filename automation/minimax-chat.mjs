/**
 * MiniMax Chat Completions（與 weekly-article 相同端點）
 */
export async function minimaxChat({
  apiKey,
  base,
  model,
  system,
  user,
  temperature = 0.65,
  max_completion_tokens = 2048,
}) {
  const url = `${String(base || '').replace(/\/$/, '')}/v1/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature,
      max_completion_tokens,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || JSON.stringify(data).slice(0, 400);
    throw new Error(`Minimax HTTP ${res.status}: ${msg}`);
  }
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Minimax: empty choices[0].message.content');
  return String(content);
}
