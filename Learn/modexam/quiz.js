/**
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
