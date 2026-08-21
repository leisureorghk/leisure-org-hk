/**
 * 文章／週報分享：Web Share API、複製連結、WhatsApp、Facebook
 * 標記：[data-share-root] 可選 data-share-title / data-share-text / data-share-url
 */
(function () {
  function findRoots() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-share-root]'));
  }

  function pageMeta(root) {
    var title =
      (root && root.getAttribute('data-share-title')) ||
      document.title ||
      '';
    var text =
      (root && root.getAttribute('data-share-text')) ||
      (document.querySelector('meta[name="description"]') &&
        document.querySelector('meta[name="description"]').getAttribute('content')) ||
      '';
    var url =
      (root && root.getAttribute('data-share-url')) ||
      (document.querySelector('link[rel="canonical"]') &&
        document.querySelector('link[rel="canonical"]').getAttribute('href')) ||
      location.href;
    return { title: title, text: text, url: url };
  }

  function toast(msg) {
    var el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.textContent = msg;
    el.style.cssText =
      'position:fixed;bottom:1.25rem;left:50%;transform:translateX(-50%);background:#0d2847;color:#fff;padding:0.55rem 1rem;border-radius:999px;font-size:0.9rem;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.2)';
    document.body.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 2200);
  }

  function wire(root) {
    var meta = pageMeta(root);
    var wa = root.querySelector('[data-share-whatsapp]');
    if (wa) {
      wa.href =
        'https://wa.me/?text=' +
        encodeURIComponent(meta.title + '\n' + meta.url);
    }
    var fb = root.querySelector('[data-share-facebook]');
    if (fb) {
      fb.href =
        'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(meta.url);
    }

    var nativeBtn = root.querySelector('[data-share-native]');
    if (nativeBtn) {
      nativeBtn.addEventListener('click', function () {
        if (navigator.share) {
          navigator
            .share({ title: meta.title, text: meta.text, url: meta.url })
            .catch(function () {});
        } else {
          toast('請使用下方按鈕分享');
        }
      });
      if (!navigator.share) {
        nativeBtn.hidden = true;
      }
    }

    var copyBtn = root.querySelector('[data-share-copy]');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var done = function () {
          toast('已複製連結');
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(meta.url).then(done).catch(function () {
            fallbackCopy(meta.url, done);
          });
        } else {
          fallbackCopy(meta.url, done);
        }
      });
    }
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      done();
    } catch (e) {
      toast('請手動複製網址列連結');
    }
    ta.remove();
  }

  findRoots().forEach(wire);
})();
