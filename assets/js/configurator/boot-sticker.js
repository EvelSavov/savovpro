/**
 * Bootstraps the sticker configurator from ?cat= URL param.
 */
(function () {
  'use strict';

  var yEl = document.getElementById('year');
  if (yEl) yEl.textContent = String(new Date().getFullYear());

  function showBootError(message) {
    var root = document.querySelector('.cfg-wrap') || document.getElementById('main');
    if (!root) return;
    root.innerHTML =
      '<div class="container"><div class="cfg-boot-error" role="alert">' +
      '<p class="cfg-boot-error__title">Конфигураторът не се зареди</p>' +
      '<p class="cfg-boot-error__msg">' + message + '</p>' +
      '<p><a class="btn btn-outline" href="configurator.html">← Към категориите</a></p>' +
      '</div></div>';
  }

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
      showBootError('Неуспешно зареждане на ' + src.split('/').pop() + '. Провери интернет връзката и опитай отново.');
    };
    document.body.appendChild(s);
  }

  var catalog = document.createElement('script');
  catalog.src = meta.catalog;
  catalog.onload = function () {
    if (!window.CFG_CONFIG) {
      showBootError('Липсва конфигурация за тази категория. Опитай отново или избери друга.');
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
    showBootError('Неуспешно зареждане на каталога. Провери интернет връзката и опитай отново.');
  };
  document.body.appendChild(catalog);
})();
