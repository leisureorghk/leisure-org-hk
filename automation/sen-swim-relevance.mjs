/**
 * 判斷 RSS 標題＋摘要是否與「有特殊教育需要（SEN）／障礙與發展支援」或「游泳／水中活動」相關。
 * 用於摘要清單與週報參考素材篩選（避免無關健康新聞）。
 */
export function isSenOrSwimRelevant(text) {
  const s = String(text || '').toLowerCase();
  if (!s.trim()) return false;

  const swim =
    /\b(swim|swimming|swimmer|swimmers|pool|pools|aquatic|aquatics|hydrotherapy|water safety|backstroke|breaststroke|freestyle|butterfly|medley|open water|olympic swim|para.?swim|paralym|synchronised|synchronized|water polo|diving\b|lifeguard)\b/i.test(
      s
    ) || /游泳|泳池|水中|泳班|泳證|泳手|跳水|水球|救生員/.test(s);

  const sen =
    /\b(autis|asd\b|adhd|neurodiver|neurodiversity|neurodevelop|special need|special educat|\bsen\b|learning disabilit|intellectual disabilit|cerebral palsy|down syndrome|tourette|dyslex|dysprax|sensory processing|developmental disabilit|developmental delay|ehcp|\biep\b|inclusive educat|inclusive school|disabilit(y|ies)|disabled|children with|students with|special school|adaptive|accessibility|wheelchair|non-verbal|nonverbal|speech.?language|stimming|meltdown|executive function|occupational therap|speech therap|neurodisabilit|developmental disorder)\b/i.test(
      s
    ) ||
    /自閉|過動|專注力|亞氏保加|特殊學習|特教|障礙學童|\bSEN\b|融合教育|感統|發展障礙|讀寫障礙|智障|腦麻|唐氏|言語治療|職業治療/.test(
      s
    );

  return swim || sen;
}

/** 分數愈高愈適合置頂（同時命中 SEN＋游泳優先） */
export function relevanceScore(text) {
  const s = String(text || '').toLowerCase();
  if (!s.trim()) return 0;
  let score = 0;
  if (/\b(swim|swimming|pool|aquatic)|游泳|泳池|水中|泳班/.test(s)) {
    score += 2;
  }
  if (/\b(autis|asd|adhd|\bsen\b)|自閉|過動|專注力|感統|特殊學習|特教/.test(s)) {
    score += 2;
  }
  if (score >= 4) score += 2;
  if (/香港|hong kong|\bhk\b/.test(s)) score += 1;
  return score;
}
