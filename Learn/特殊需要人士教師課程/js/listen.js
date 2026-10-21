(() => {
  const RATE_KEY = "sen-tts-rate";
  const STATE_KEY = "sen-listen-v1";
  const audio = document.getElementById("player");
  const listEl = document.getElementById("playlist");
  const nowEl = document.getElementById("nowPlaying");
  const statusEl = document.getElementById("listenStatus");
  const seek = document.getElementById("seek");
  const timeEl = document.getElementById("timeLabel");
  const rateInput = document.getElementById("listenRate");
  const rateLabel = document.getElementById("listenRateLabel");
  const autoNext = document.getElementById("autoNext");
  const resumeBar = document.getElementById("resumeBar");
  if (!audio || !listEl) return;

  let tracks = [];
  let index = 0;
  let seeking = false;

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STATE_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function saveState(patch) {
    const next = { ...loadState(), ...patch, updated: Date.now() };
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(next));
    } catch (e) {}
    return next;
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
  function fmt(t) {
    if (!Number.isFinite(t) || t < 0) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m + ":" + String(s).padStart(2, "0");
  }
  function selectedSlugs() {
    const boxes = [...listEl.querySelectorAll("input[type=checkbox]")];
    const picked = boxes.filter((b) => b.checked).map((b) => b.value);
    return picked.length ? picked : tracks.map((t) => t.slug);
  }
  function queue() {
    const set = new Set(selectedSlugs());
    return tracks.filter((t) => set.has(t.slug));
  }
  function findIndex(slug) {
    const q = queue();
    const i = q.findIndex((t) => t.slug === slug);
    return i >= 0 ? i : 0;
  }
  function currentTrack() {
    return queue()[index] || tracks[0];
  }
  function applyRate() {
    const r = clampRate(rateInput ? rateInput.value : localStorage.getItem(RATE_KEY) || "1");
    audio.playbackRate = r;
    audio.preservesPitch = true;
    if (rateLabel) rateLabel.textContent = rateText(r) + " " + r.toFixed(2) + "×";
    if (rateInput) rateInput.value = String(r);
    try {
      localStorage.setItem(RATE_KEY, String(r));
    } catch (e) {}
    saveState({ rate: r });
  }
  function highlight() {
    const slug = currentTrack()?.slug;
    listEl.querySelectorAll(".pl-item").forEach((row) => {
      row.classList.toggle("playing", row.dataset.slug === slug);
    });
    const t = currentTrack();
    if (nowEl && t) {
      nowEl.textContent = t.id + "　" + t.title;
    }
  }
  function bindMediaSession(t) {
    if (!navigator.mediaSession || !t) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.id + " " + t.title,
        artist: "SEN 游泳教師粵語說明",
        album: "聲音學習播放清單"
      });
      navigator.mediaSession.setActionHandler("play", () => audio.play());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("previoustrack", () => skip(-1));
      navigator.mediaSession.setActionHandler("nexttrack", () => skip(1));
      navigator.mediaSession.setActionHandler("seekto", (d) => {
        if (d.seekTime != null) audio.currentTime = d.seekTime;
      });
    } catch (e) {}
  }
  async function playAt(i, startTime) {
    const q = queue();
    if (!q.length) return;
    index = (i + q.length) % q.length;
    const t = q[index];
    audio.src = t.src;
    audio.playbackRate = clampRate(rateInput?.value || 1);
    highlight();
    bindMediaSession(t);
    saveState({ slug: t.slug, autoNext: !!(autoNext && autoNext.checked) });
    const st = loadState();
    const resume = startTime != null ? startTime : t.slug === st.slug ? Number(st.time) || 0 : 0;
    const onMeta = () => {
      if (resume > 1 && resume < (audio.duration || 999) - 1.5) audio.currentTime = resume;
    };
    audio.addEventListener("loadedmetadata", onMeta, { once: true });
    try {
      await audio.play();
      if (statusEl) statusEl.textContent = "正在播放。聽完會自動轉下一章（可取消）。安卓請保持本頁開啟，可用通知列控制。";
    } catch (e) {
      if (statusEl) statusEl.textContent = "請再按一次播放（瀏覽器需你親手開始）。";
    }
  }
  function skip(dir) {
    const q = queue();
    const next = index + dir;
    if (next < 0 || next >= q.length) {
      if (statusEl) statusEl.textContent = dir > 0 ? "已到清單最後一章。" : "已是清單第一章。";
      return;
    }
    playAt(next, 0);
  }
  function renderList() {
    const st = loadState();
    const savedSel = Array.isArray(st.queue) ? new Set(st.queue) : null;
    listEl.innerHTML = tracks
      .map((t) => {
        const checked = !savedSel || savedSel.has(t.slug) ? "checked" : "";
        return `<label class="pl-item" data-slug="${t.slug}">
          <input type="checkbox" value="${t.slug}" ${checked}>
          <button type="button" class="pl-play" data-play="${t.slug}">▶</button>
          <span class="pl-id">${t.id}</span>
          <span class="pl-title">${t.title}</span>
          <a class="pl-page" href="${t.page}">單元</a>
        </label>`;
      })
      .join("");
    try {
      const done = JSON.parse(localStorage.getItem("sen-study-v1") || "{}");
      listEl.querySelectorAll(".pl-item").forEach((row) => {
        row.classList.toggle("is-done", Boolean(done[row.dataset.slug]));
      });
    } catch (e) {}
  }
  function publicBase() {
    return "https://cpoffice203.diskstation.me/sen/特殊需要人士游泳教師證書課程/";
  }
  function m3uText() {
    const base = new URL(publicBase());
    const q = queue();
    const lines = ["#EXTM3U"];
    for (const t of q) {
      const abs = new URL(t.src, base).href;
      lines.push("#EXTINF:-1," + t.id + " " + t.title);
      lines.push(abs);
    }
    return lines.join("\r\n") + "\r\n";
  }
  function downloadM3u() {
    const blob = new Blob([m3uText()], { type: "audio/x-mpegurl" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "SEN游泳教師-粵語說明.m3u";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    if (statusEl) {
      statusEl.textContent =
        "已下載 M3U。安卓可用 VLC、Poweramp 或 MX Player 開啟此檔，即成為可自選的播放清單。";
    }
  }

  audio.addEventListener("timeupdate", () => {
    const t = currentTrack();
    if (!t) return;
    saveState({
      slug: t.slug,
      time: audio.currentTime,
      dur: audio.duration || 0,
      autoNext: !!(autoNext && autoNext.checked),
      queue: selectedSlugs()
    });
    if (!seeking && seek && audio.duration) {
      seek.value = String((audio.currentTime / audio.duration) * 100);
    }
    if (timeEl) timeEl.textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration);
  });
  audio.addEventListener("ended", () => {
    const t = currentTrack();
    saveState({ slug: t?.slug, time: 0 });
    if (autoNext && autoNext.checked) skip(1);
    else if (statusEl) statusEl.textContent = "本章已完。可按下一章，或開啟「聽完自動下一章」。";
  });
  if (seek) {
    seek.addEventListener("input", () => {
      seeking = true;
    });
    seek.addEventListener("change", () => {
      if (audio.duration) audio.currentTime = (Number(seek.value) / 100) * audio.duration;
      seeking = false;
    });
  }
  if (rateInput) {
    const saved = clampRate(localStorage.getItem(RATE_KEY) || loadState().rate || "1");
    rateInput.value = String(saved);
    rateInput.addEventListener("input", applyRate);
    applyRate();
  }
  if (autoNext) {
    const st = loadState();
    autoNext.checked = st.autoNext !== false;
    autoNext.addEventListener("change", () => saveState({ autoNext: autoNext.checked }));
  }

  document.getElementById("btnPlay")?.addEventListener("click", () => {
    if (!audio.src) playAt(findIndex(loadState().slug || tracks[0]?.slug));
    else audio.play();
  });
  document.getElementById("btnPause")?.addEventListener("click", () => audio.pause());
  document.getElementById("btnPrev")?.addEventListener("click", () => skip(-1));
  document.getElementById("btnNext")?.addEventListener("click", () => skip(1));
  document.getElementById("btnAll")?.addEventListener("click", () => {
    listEl.querySelectorAll("input[type=checkbox]").forEach((b) => {
      b.checked = true;
    });
    saveState({ queue: selectedSlugs() });
  });
  document.getElementById("btnNone")?.addEventListener("click", () => {
    listEl.querySelectorAll("input[type=checkbox]").forEach((b) => {
      b.checked = false;
    });
  });
  document.getElementById("btnM3u")?.addEventListener("click", downloadM3u);
  document.getElementById("btnResume")?.addEventListener("click", () => {
    const st = loadState();
    const slug = st.slug || tracks[0]?.slug;
    playAt(findIndex(slug), Number(st.time) || 0);
  });

  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-play]");
    if (!btn) return;
    e.preventDefault();
    const slug = btn.getAttribute("data-play");
    const box = listEl.querySelector(`input[value="${slug}"]`);
    if (box) box.checked = true;
    playAt(findIndex(slug), 0);
  });
  listEl.addEventListener("change", () => saveState({ queue: selectedSlugs() }));

  fetch("data/playlist.json")
    .then((r) => r.json())
    .then((data) => {
      tracks = data.tracks || [];
      renderList();
      const st = loadState();
      const params = new URLSearchParams(location.search);
      const want = params.get("slug") || st.slug;
      const auto = params.get("play") === "1";
      if (want) {
        const t = tracks.find((x) => x.slug === want);
        if (t && resumeBar) {
          resumeBar.hidden = false;
          resumeBar.querySelector("[data-resume-label]").textContent =
            "上次聽到：" + t.id + " " + t.title + "　" + fmt(Number(st.time) || 0);
        }
        index = findIndex(want);
        highlight();
        if (auto) playAt(index, Number(st.slug === want ? st.time : 0) || 0);
      } else if (st.slug && resumeBar) {
        const t = tracks.find((x) => x.slug === st.slug);
        if (t) {
          resumeBar.hidden = false;
          resumeBar.querySelector("[data-resume-label]").textContent =
            "上次聽到：" + t.id + " " + t.title + "　" + fmt(Number(st.time) || 0);
        }
      }
    })
    .catch(() => {
      if (statusEl) statusEl.textContent = "未能載入播放清單。";
    });
})();
