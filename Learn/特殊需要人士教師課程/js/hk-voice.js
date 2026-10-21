/**
 * hk-voice.js — 備援 TTS 一律揀香港粵語聲線
 *
 * 問題：只設 utt.lang = 'zh-HK' 時，瀏覽器可能仍然用普通話（zh-CN）聲線
 * 朗讀，令備援音同主音檔口音不一致。這裡集中處理：
 *   - 等待 voices 載入完成
 *   - 依優先次序挑香港粵語聲線
 *   - 無港式聲線時退回最接近的粵語／中文聲線
 *
 * 用法：<script src="js/hk-voice.js"></script> 然後 HK_VOICE.speak(text, rate)
 *
 * 專用詞讀法（readTerm）：
 *   全大寫縮寫如 AAC、TEACCH、ID、WPW 直接交畀 TTS 會讀錯（甚至讀成長寫全名），
 *   這裡改為逐字母唸，例如 A A C、T E A C C H。
 *   中文詞（例如「寰樞椎不穩」）同普通英文詞（GoTalk NOW、Mirroring）維持直接讀。
 */
window.HK_VOICE = (function () {
  'use strict';

  // 由最似香港口音到最不似排序
  var PREFERRED = [
    'zh-HK', 'yue-Hant-HK', 'yue-HK', 'zh-Hant-HK', 'zh-Hant'
  ];
  var NAME_HINTS = ['香港', '廣東話', '粤語', '粵語', 'Cantonese', 'HiuGaai', 'HiuMaan', 'WanLung', 'Hiu'];

  function norm(s) { return String(s || '').toLowerCase(); }

  function loadVoices() {
    return new Promise(function (resolve) {
      if (!('speechSynthesis' in window)) return resolve([]);
      var got = speechSynthesis.getVoices();
      if (got && got.length) return resolve(got);
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve(speechSynthesis.getVoices() || []);
      }
      speechSynthesis.addEventListener('voiceschanged', finish, { once: true });
      setTimeout(finish, 1200);
    });
  }

  function pick(voices) {
    var i, v;
    for (i = 0; i < PREFERRED.length; i++) {
      for (v = 0; v < voices.length; v++) {
        if (norm(voices[v].lang) === norm(PREFERRED[i])) return voices[v];
      }
    }
    for (i = 0; i < voices.length; i++) {
      if (norm(voices[i].lang).indexOf('yue') === 0) return voices[i];
    }
    for (i = 0; i < voices.length; i++) {
      for (var n = 0; n < NAME_HINTS.length; n++) {
        if (norm(voices[i].name).indexOf(norm(NAME_HINTS[n])) >= 0) return voices[i];
      }
    }
    return null;
  }

  var cache = null;
  var rateKey = 'sen-tts-glossary-rate';

  function getRate() {
    var r = parseFloat(localStorage.getItem(rateKey));
    return isFinite(r) ? Math.min(1.4, Math.max(0.6, r)) : 1;
  }

  function setRate(r) {
    try { localStorage.setItem(rateKey, String(r)); } catch (e) {}
  }

  function speak(text, rate) {
    if (!('speechSynthesis' in window)) { alert('此瀏覽器不支援備援 TTS'); return; }
    if (!text) { alert('此段無備援文字'); return; }
    var useRate = rate == null ? getRate() : rate;
    var run = function (voices) {
      var utt = new SpeechSynthesisUtterance(text);
      var v = cache || pick(voices);
      if (v) { utt.voice = v; utt.lang = v.lang; } else { utt.lang = 'zh-HK'; }
      utt.rate = useRate;
      speechSynthesis.cancel();
      speechSynthesis.speak(utt);
    };
    if (cache) { run([cache]); return; }
    loadVoices().then(function (voices) {
      cache = pick(voices);
      run(voices);
    });
  }

  // 全大寫、冇任何小寫字母（例如 AAC、TEACCH、ID、WPW）＝縮寫，要逐字母唸，
  // 否則 TTS 會亂讀成一個詞（甚至讀成長寫全名）。
  var SPELLED = /^[A-Z][A-Z0-9]*(?:[ \-][A-Z0-9]+)*$/;

  // 大小寫混用嘅縮寫／產品名：逐字母唸唔自然，指定讀法
  var PRONOUNCE = {
    'bal': 'B A L',                 // BaL　　基線
    'col': 'C O L',                 // CoL　　Chain of Learning
    'mru': 'M R U',                 // MRu　　修改規則
    'meq': 'M E Q',                 // MEq　　修改設備
    'men': 'M E N',                 // MEn　　修改環境
    'udfpe': 'U D F P E',           // UDfPE　體育普遍設計
    'top secure': 'Top Secure',     // TOP SECURe 係框架名，唔係逐字母
    'gotalk now': 'GoTalk Now',     // GoTalk NOW 係產品名
    'magic sound': 'Magic Sound',
    'magic tool': 'Magic Tool'
  };

  function pronounceOne(t) {
    var key = String(t).toLowerCase().replace(/\s+/g, ' ');
    if (Object.prototype.hasOwnProperty.call(PRONOUNCE, key)) return PRONOUNCE[key];
    if (SPELLED.test(t) && /[A-Z]{2,}/.test(t)) return t.split('').join(' ');
    return t;                       // 中文、普通英文詞一律直接讀
  }

  // 把術語轉成適合 TTS 朗讀嘅文字
  function pronounce(term) {
    var t = String(term || '').trim();
    if (!t) return '';
    // 複合寫法（如 UDL／UDfPE）逐段唸
    var parts = t.split(/[\/／|｜、]/).map(function (s) { return s.trim(); })
      .filter(function (s) { return s; });
    if (parts.length > 1) return parts.map(pronounceOne).join('、');
    return pronounceOne(t);
  }

  function readTerm(term) {
    var t = String(term || '').trim();
    if (!t) { alert('此詞沒有文字'); return; }
    speak(pronounce(t));
  }

  function stop() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  function mountBar(host) {
    if (!host || host.dataset.hkBar) return;
    host.dataset.hkBar = '1';
    var wrap = document.createElement('div');
    wrap.className = 'hk-voice-bar';

    var stopBtn = document.createElement('button');
    stopBtn.type = 'button';
    stopBtn.className = 'btn ghost';
    stopBtn.textContent = '停止';
    stopBtn.addEventListener('click', stop);

    var label = document.createElement('label');
    label.className = 'hk-rate';
    label.textContent = '詞彙語速 ';
    var rate = document.createElement('input');
    rate.type = 'range';
    rate.min = '0.6'; rate.max = '1.4'; rate.step = '0.05';
    rate.value = String(getRate());
    var out = document.createElement('span');
    out.textContent = Number(rate.value).toFixed(2) + '×';
    rate.addEventListener('input', function () {
      setRate(parseFloat(rate.value));
      out.textContent = Number(rate.value).toFixed(2) + '×';
    });

    label.appendChild(rate);
    label.appendChild(out);
    wrap.appendChild(stopBtn);
    wrap.appendChild(label);
    host.appendChild(wrap);
  }

  return {
    speak: speak,
    stop: stop,
    readTerm: readTerm,
    pronounce: pronounce,
    loadVoices: loadVoices,
    pick: pick,
    getRate: getRate,
    setRate: setRate,
    mountBar: mountBar
  };
})();