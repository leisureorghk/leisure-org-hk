(() => {
  const KEY = "sen-study-v1";
  const ASSIGN_KEY = "sen-assign-4.4";

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {}
  }
  function isDone(slug) {
    return Boolean(load()[slug]);
  }
  function setDone(slug, done) {
    const st = load();
    if (done) st[slug] = Date.now();
    else delete st[slug];
    save(st);
  }

  function paintCatalog() {
    const st = load();
    document.querySelectorAll("[data-slug]").forEach((el) => {
      el.classList.toggle("is-done", Boolean(st[el.getAttribute("data-slug")]));
    });
    const cards = document.querySelectorAll(".grid .card[data-slug]");
    let n = 0;
    cards.forEach((el) => {
      if (st[el.getAttribute("data-slug")]) n += 1;
    });
    const meter = document.querySelector("[data-study-count]");
    const totalAttr = meter && meter.getAttribute("data-study-total");
    const total = cards.length || Number(totalAttr) || 0;
    if (meter && total) {
      const n2 = cards.length ? n : pathDone(st, meter.getAttribute("data-path"));
      meter.textContent = "已讀完 " + (cards.length ? n : n2) + "／" + total + " 單元（本機記住）";
    }
  }

  function pathDone(st, pathAttr) {
    if (!pathAttr) {
      return Object.keys(st).length;
    }
    return pathAttr.split(",").filter((s) => st[s.trim()]).length;
  }

  function bindUnit() {
    const box = document.querySelector("[data-mark-unit]");
    if (!box) return;
    const slug = box.getAttribute("data-mark-unit");
    box.checked = isDone(slug);
    box.addEventListener("change", () => setDone(slug, box.checked));
  }

  function bindCheck() {
    const form = document.querySelector("[data-unit-check]");
    if (!form) return;
    const btn = form.querySelector("[data-check-btn]");
    const out = form.querySelector("[data-check-result]");
    const mark = document.querySelector("[data-mark-unit]");
    if (!btn || !out) return;
    btn.addEventListener("click", () => {
      const items = [...form.querySelectorAll("[data-ok]")];
      let right = 0;
      let answered = 0;
      items.forEach((row) => {
        const ok = row.getAttribute("data-ok") === "1";
        const picked = row.querySelector("input:checked");
        row.classList.remove("ok", "bad");
        if (!picked) return;
        answered += 1;
        const sayYes = picked.value === "1";
        if (sayYes === ok) {
          right += 1;
          row.classList.add("ok");
        } else row.classList.add("bad");
      });
      if (answered < items.length) {
        out.textContent = "請先完成三題，再核對。";
        return;
      }
      out.textContent = "核對結果：" + right + "／" + items.length + "。" + (right === items.length
        ? "準則已對齊，可把本單元標為已讀完。"
        : "請回到「做到／避免」覆習後再核對。");
      if (right === items.length && mark) {
        mark.checked = true;
        setDone(mark.getAttribute("data-mark-unit"), true);
        paintCatalog();
      }
    });
  }

  function bindAssign() {
    const box = document.querySelector("[data-assign]");
    if (!box) return;
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(ASSIGN_KEY) || "[]") || [];
    } catch (e) {
      saved = [];
    }
    const inputs = [...box.querySelectorAll("input[type=checkbox]")];
    inputs.forEach((inp, i) => {
      inp.checked = Boolean(saved[i]);
      inp.addEventListener("change", () => {
        localStorage.setItem(ASSIGN_KEY, JSON.stringify(inputs.map((x) => x.checked)));
      });
    });
  }

  function bindContinue() {
    const a = document.querySelector("[data-continue]");
    if (!a) return;
    const path = (a.getAttribute("data-path") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const base = a.getAttribute("data-base") || "";
    const st = load();
    const next = path.find((s) => !st[s]);
    if (next) {
      a.href = base + "units/" + next + ".html";
      a.textContent = "繼續研讀下一課";
    } else if (path.length) {
      a.href = base + "index.html";
      a.textContent = "建議路徑已完成，可做練習或教案";
    }
  }

  paintCatalog();
  bindUnit();
  bindCheck();
  bindAssign();
  bindContinue();
})();
