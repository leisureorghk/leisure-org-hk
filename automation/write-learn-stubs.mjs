/**
 * 產生 Learn/教案 五類範本與 modexam 練習頁（避免 404）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const learn = path.join(root, 'Learn');

const plans = [
  {
    file: '自閉症譜系障礙兒童-TEACCH.html',
    title: '自閉症譜系障礙兒童（TEACCH）',
    strategy: 'TEACCH 視覺結構化、PECS／圖卡、SOS 漸進入水',
    unit: '../特殊需要人士教師課程/units/2-6-autism.html',
    unitLabel: '2.6 自閉症譜系障礙',
    extras: ['../特殊需要人士教師課程/units/2-8-communication.html', '../特殊需要人士教師課程/units/cue-cards.html'],
    body: [
      '熱身：固定動線與視覺時間表；短指令＋示範。',
      '主題：仰浮／吹泡；恐慌即退回上一階段，禁止推落水。',
      '遊戲：先－後卡預告「先吹泡，後選浮球」。',
      '緩和：同一結束儀式；與家長對齊圖卡。',
      '備註：游泳協助適應與安全，不能根治自閉症。',
    ],
  },
  {
    file: '唐氏綜合症青少年-STEP.html',
    title: '唐氏綜合症青少年（STEP）',
    strategy: 'STEP 調空間／任務／設備／人員；低衝擊短組',
    unit: '../特殊需要人士教師課程/units/2-3-down.html',
    unitLabel: '2.3 唐氏綜合症',
    extras: ['../特殊需要人士教師課程/units/4-3-safety.html'],
    body: [
      '課前：核對心臟／頸椎文件；寰樞椎不穩則禁跳水與過度頸伸。',
      '熱身：仰浮與慢走；水溫宜偏暖。',
      '主題：低衝擊踢水與短距離，多休息。',
      '緩和：教導「停止／休息」自主表達。',
      '比例：按體能與醫護備註收緊人手。',
    ],
  },
  {
    file: '中度智障兒童-TEACCH.html',
    title: '中度智障兒童（TEACCH）',
    strategy: 'TEACCH、工序分析、視覺工序卡',
    unit: '../特殊需要人士教師課程/units/2-2-intellectual.html',
    unitLabel: '2.2 智障及多重障礙',
    extras: ['../特殊需要人士教師課程/units/2-8-communication.html'],
    body: [
      '比例參考：中度約 1:5；人手不足則減額。',
      '熱身：一次一個步驟；讚賞指明具體動作。',
      '主題：拆短工序（例如「手抓牆 → 踢水」）。',
      '遊戲：完成卡放入完成盒。',
      '避免：一次講三個新動作。',
    ],
  },
  {
    file: 'ADHD兒童-STEP.html',
    title: 'ADHD 兒童（STEP）',
    strategy: 'STEP 短循環、水阻力練習抑制控制',
    unit: '../特殊需要人士教師課程/units/2-5-adhd.html',
    unitLabel: '2.5 注意力不足及過度活躍症',
    extras: ['../特殊需要人士教師課程/units/2-9-behavior.html'],
    body: [
      '課堂：短循環；等待時給可完成小任務。',
      '指令：短、一次一個；回饋即時具體。',
      '安全：衝動風險高者遠離跳台／深水。',
      '避免：罰企聽長篇講解；教師不作診斷、不建議藥物。',
    ],
  },
  {
    file: '聽覺障礙兒童-STEP.html',
    title: '聽覺障礙兒童（STEP）',
    strategy: 'STEP、面對面溝通、視覺緊急信號',
    unit: '../特殊需要人士教師課程/units/2-1-physical.html',
    unitLabel: '2.1 肢體、視覺、聽力障礙',
    extras: ['../特殊需要人士教師課程/units/2-8-communication.html'],
    body: [
      '溝通：面對面、口型／手勢／圖卡；避免背對發指令。',
      '輔具：助聽器／人工耳蝸多數不防水，入水前按家長指示保管。',
      '緊急：預先約定視覺信號（舉臂／閃燈卡）。',
      '位置：較前排、視線清楚。',
    ],
  },
];

function shell({ title, inner }) {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${title}</title>
  <link rel="stylesheet" href="../assets/style.css">
</head>
<body>
  <div class="coach-bar" role="navigation" aria-label="教練分享區">
    <span>教練分享區 · 教案</span>
    <span><a href="../../coach-share.html">返回分享區</a> · <a href="#" data-coach-logout>登出</a></span>
  </div>
  <div class="wrap">
    <header class="site">
      <a class="brand" href="index.html">五類教案</a>
      <nav>
        <a href="../index.html">教材首頁</a>
        <a href="../特殊需要人士教師課程/index.html">單元目錄</a>
        <a href="index.html">教案目錄</a>
      </nav>
    </header>
    ${inner}
    <footer>範本僅供改寫參考；示意圖為原創，不使用學員照片。</footer>
  </div>
  <script src="../../js/coach-gate.js?v=20261021e"></script>
  <script>if(window.CoachGate){CoachGate.requireCoachAccess();document.querySelectorAll('[data-coach-logout]').forEach(function(el){el.addEventListener('click',function(e){e.preventDefault();CoachGate.logout();});});}</script>
</body>
</html>
`;
}

const planDir = path.join(learn, '教案');
fs.mkdirSync(planDir, { recursive: true });

for (const p of plans) {
  const steps = p.body.map((b) => `<li>${b}</li>`).join('');
  const extraLinks = (p.extras || [])
    .map((h) => `<a class="btn ghost" href="${h}">相關單元</a>`)
    .join(' ');
  const inner = `
    <p class="tag">教案範本</p>
    <h1>${p.title}</h1>
    <p class="lead">策略須具名：${p.strategy}。請按當日學員改寫，勿照錄。</p>
    <p class="disclaimer">涉及健康、頸椎、癲癇等情況，須按家長／醫護文件執行。</p>
    <div class="card">
      <h2>五階段建議</h2>
      <ol class="list">${steps}</ol>
    </div>
    <div class="card">
      <h3>策略欄寫法</h3>
      <p>寫全名方法與原因（為何適合該學員）。可對照 <a href="../特殊需要人士教師課程/units/4-4-methods.html">4.4 TOP SECURe</a>。</p>
    </div>
    <div class="toolbar">
      <a class="btn" href="${p.unit}">研讀 ${p.unitLabel}</a>
      ${extraLinks}
      <a class="btn ghost" href="index.html">返回教案目錄</a>
    </div>`;
  fs.writeFileSync(path.join(planDir, p.file), shell({ title: p.title, inner }), 'utf8');
  console.error('wrote', p.file);
}

const modDir = path.join(learn, 'modexam');
fs.mkdirSync(modDir, { recursive: true });
const modHtml = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>選擇題練習｜特殊需要人士游泳教師證書</title>
  <link rel="stylesheet" href="../assets/style.css">
</head>
<body>
  <div class="coach-bar" role="navigation" aria-label="教練分享區">
    <span>教練分享區 · 選擇題</span>
    <span><a href="../../coach-share.html">返回分享區</a> · <a href="#" data-coach-logout>登出</a></span>
  </div>
  <div class="wrap">
    <header class="site">
      <a class="brand" href="../特殊需要人士教師課程/index.html">特殊需要人士游泳教師證書課程</a>
      <nav>
        <a href="../index.html">教材首頁</a>
        <a href="../特殊需要人士教師課程/index.html">單元目錄</a>
        <a href="../教案/index.html">五類教案</a>
      </nav>
    </header>
    <h1>選擇題練習</h1>
    <p class="lead">用以核對理解，不宜作為唯一學習方法。答錯請回到該單元原文覆習。</p>
    <p class="disclaimer">練習題不能代替面授考核。涉及醫療與法律，以課堂與機構政策為準。</p>
    <div class="card">
      <label for="unitPick"><strong>選擇單元</strong></label>
      <select id="unitPick" style="width:100%;margin:0.5rem 0 1rem;padding:0.5rem;font:inherit;border-radius:8px;border:1px solid #e2e8f0"></select>
      <div id="quiz"></div>
      <p class="toolbar"><button type="button" class="btn" id="checkBtn">核對答案</button>
      <button type="button" class="btn ghost" id="resetBtn">重設</button></p>
      <p class="caption" id="result"></p>
    </div>
    <div class="toolbar">
      <a class="btn ghost" href="../特殊需要人士教師課程/index.html">返回單元目錄</a>
      <a class="btn ghost" id="openUnit" href="../特殊需要人士教師課程/index.html">開啟本單元講義</a>
    </div>
    <footer>題目取材自各單元池邊準則（做到／避免）。</footer>
  </div>
  <script src="../../js/coach-gate.js?v=20261021e"></script>
  <script>if(window.CoachGate){CoachGate.requireCoachAccess();document.querySelectorAll('[data-coach-logout]').forEach(function(el){el.addEventListener('click',function(e){e.preventDefault();CoachGate.logout();});});}</script>
  <script src="quiz.js?v=20261021e"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(modDir, 'index.html'), modHtml, 'utf8');

const quizJs = `/**
 * 簡易單元選擇題（從 course-knowledge 的 do/avoid 產生）
 */
(function () {
  var bank = {};
  var currentId = '';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pickUnitFromQuery() {
    var q = new URLSearchParams(location.search).get('unit');
    return q || '';
  }

  function buildItems(unit) {
    var items = [];
    (unit.avoid || []).slice(0, 2).forEach(function (t) {
      items.push({ text: t, ok: false });
    });
    (unit.do || []).slice(0, 2).forEach(function (t) {
      items.push({ text: t, ok: true });
    });
    while (items.length < 3) {
      items.push({ text: '教師不作診斷、不承諾療效。', ok: true });
    }
    return items.slice(0, 4);
  }

  function renderQuiz(unit) {
    var items = buildItems(unit);
    var html = items
      .map(function (it, i) {
        return (
          '<fieldset class="judge" data-ok="' +
          (it.ok ? '1' : '0') +
          '"><legend>第 ' +
          (i + 1) +
          ' 題</legend><p>' +
          esc(it.text) +
          '</p><label><input type="radio" name="q' +
          i +
          '" value="1"> 符合準則</label> <label><input type="radio" name="q' +
          i +
          '" value="0"> 違反準則</label></fieldset>'
        );
      })
      .join('');
    document.getElementById('quiz').innerHTML = html;
    document.getElementById('result').textContent = '';
    var open = document.getElementById('openUnit');
    if (open) open.href = '../特殊需要人士教師課程/units/' + unit.slug + '.html';
  }

  function load() {
    fetch('../特殊需要人士教師課程/data/course-knowledge.json')
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        var sel = document.getElementById('unitPick');
        (data.units || []).forEach(function (u) {
          bank[u.id] = u;
          var opt = document.createElement('option');
          opt.value = u.id;
          opt.textContent = u.id + ' ' + u.title;
          sel.appendChild(opt);
        });
        var want = pickUnitFromQuery();
        if (want && bank[want]) sel.value = want;
        else if (data.units && data.units[0]) sel.value = data.units[0].id;
        currentId = sel.value;
        renderQuiz(bank[currentId]);
        sel.addEventListener('change', function () {
          currentId = sel.value;
          var url = new URL(location.href);
          url.searchParams.set('unit', currentId);
          history.replaceState(null, '', url);
          renderQuiz(bank[currentId]);
        });
      })
      .catch(function () {
        document.getElementById('quiz').innerHTML =
          '<p class="caption">無法載入題庫，請確認已登入教練分享區並可讀取 course-knowledge.json。</p>';
      });
  }

  document.getElementById('checkBtn').addEventListener('click', function () {
    var fields = document.querySelectorAll('#quiz .judge');
    var correct = 0;
    var total = fields.length;
    fields.forEach(function (fs, i) {
      var ok = fs.getAttribute('data-ok');
      var chosen = fs.querySelector('input[name="q' + i + '"]:checked');
      if (chosen && chosen.value === ok) correct++;
    });
    document.getElementById('result').textContent =
      '答對 ' + correct + '／' + total + '。請回到單元講義覆習未掌握的池邊準則。';
  });

  document.getElementById('resetBtn').addEventListener('click', function () {
    if (bank[currentId]) renderQuiz(bank[currentId]);
  });

  load();
})();
`;
fs.writeFileSync(path.join(modDir, 'quiz.js'), quizJs, 'utf8');
console.error('wrote modexam');
