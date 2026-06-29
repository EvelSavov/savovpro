/**
 * Bootstraps the sticker configurator from ?cat= URL param.
 */
(function () {
  'use strict';

  var yEl = document.getElementById('year');
  if (yEl) yEl.textContent = String(new Date().getFullYear());

  var params = new URLSearchParams(window.location.search);
  var catId = params.get('cat') || 'stickers';
  var meta = (window.CONFIGURATOR_CATEGORIES || []).find(function (c) {
    return c.id === catId;
  });

  if (!meta || meta.comingSoon || meta.engine !== 'sticker') {
    window.location.replace('configurator.html');
    return;
  }

  function loadScript(src, next) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = next;
    s.onerror = function () {
      window.location.replace('configurator.html');
    };
    document.body.appendChild(s);
  }

  var catalog = document.createElement('script');
  catalog.src = meta.catalog;
  catalog.onload = function () {
    if (!window.CFG_CONFIG) {
      window.location.replace('configurator.html');
      return;
    }
    loadScript('assets/js/configurator/clipart.js', function () {
      loadScript('assets/js/vendor/opentype.min.js', function () {
        loadScript('assets/js/vendor/imagetracer.js', function () {
          loadScript('assets/js/configurator/sticker-vector.js?v=20250629', function () {
            loadScript('assets/js/configurator/sticker-core.js?v=20250629', function () {});
          });
        });
      });
    });
  };
  catalog.onerror = function () {
    window.location.replace('configurator.html');
  };
  document.body.appendChild(catalog);
})();
