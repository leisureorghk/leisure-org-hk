(() => {
  const KEY = "sen-tts-rate";
  const STATE_KEY = "sen-listen-v1";
  const status = document.querySelector("[data-tts-status]");
  const playBtn = document.querySelector(".play-cantonese");
  const stopBtn = document.querySelector(".stop-cantonese");
  const rateInput = document.querySelector("[data-tts-rate]");
  const rateLabel = document.querySelector("[data-tts-rate-label]");
  const autoBox = document.querySelector("[data-auto-next]");
  if (!playBtn) return;
  let audio;
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function saveState(patch) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify({ ...loadState(), ...patch, updated: Date.now() })); } catch (e) {}
  }
  function clampRate(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? Math.min(1.4, Math.max(0.7, n)) : 1;
  }
  function rateText(r) {
    if (r <= 0.8) return "較慢";
    if (r <= 0.95) return "演講";
    if (r >= 1.2) return "較快";
    return "正常";
  }
  function getRate() {
    return clampRate(rateInput ? rateInput.value : localStorage.getItem(KEY) || "1");
  }
  function applyRate() {
    const r = getRate();
    if (rateLabel) rateLabel.textContent = rateText(r) + " " + Number(r).toFixed(2) + "×";
    if (rateInput) rateInput.value = String(r);
    try { localStorage.setItem(KEY, String(r)); } catch (e) {}
    if (audio) audio.playbackRate = r;
  }
  if (rateInput) {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) rateInput.value = String(clampRate(saved));
    } catch (e) {}
    rateInput.addEventListener("input", applyRate);
  }
  applyRate();
  if (autoBox) {
    autoBox.checked = loadState().autoNext !== false;
    autoBox.addEventListener("change", () => saveState({ autoNext: autoBox.checked }));
  }
  const st0 = loadState();
  if (status && st0.slug === playBtn.dataset.slug && st0.time > 2) {
    const m = Math.floor(st0.time / 60);
    const s = String(Math.floor(st0.time % 60)).padStart(2, "0");
    status.textContent = "上次聽到 " + m + ":" + s + "，按播放會從該處繼續。";
  }
  function pauseKeep() {
    if (audio) audio.pause();
    if (window.speechSynthesis) speechSynthesis.cancel();
  }
  stopBtn && stopBtn.addEventListener("click", pauseKeep);
  playBtn.addEventListener("click", async () => {
    const slug = playBtn.dataset.slug;
    if (audio && !audio.paused) { audio.pause(); return; }
    if (audio && audio.paused && audio.src) {
      audio.playbackRate = getRate();
      audio.play().catch(() => {});
      return;
    }
    const mp3 = new URL("../audio/" + slug + ".mp3", location.href);
    const r = getRate();
    const resume = loadState().slug === slug ? Number(loadState().time) || 0 : 0;
    audio = new Audio(mp3);
    audio.playbackRate = r;
    audio.preservesPitch = true;
    audio.addEventListener("timeupdate", () => {
      saveState({ slug, time: audio.currentTime, dur: audio.duration || 0, autoNext: !autoBox || autoBox.checked });
    });
    audio.addEventListener("ended", () => {
      saveState({ slug, time: 0 });
      const next = playBtn.dataset.next;
      if (autoBox && autoBox.checked && next) {
        location.href = "../listen.html?slug=" + encodeURIComponent(next) + "&play=1";
      } else if (status) status.textContent = "本章已完。可開啟播放清單繼續。";
    });
    audio.addEventListener("loadedmetadata", () => {
      if (resume > 1 && resume < (audio.duration || 0) - 1.5) audio.currentTime = resume;
    }, { once: true });
    try {
      await audio.play();
      if (status) status.textContent = resume > 2 ? "由上次位置繼續播放。" : "正在播放。聽完可自動轉下一章。";
      return;
    } catch (e) {}
    if (status) status.textContent = "未能播放錄音。請改用聲音學習播放清單頁。";
  });
})();