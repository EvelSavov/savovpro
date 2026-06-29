/**
 * Bootstraps an engraving configurator from ?cat= URL param.
 * Used by configurator-product.html — do not load on the hub page.
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
  var catId = params.get('cat') || '';
  var meta = (window.CONFIGURATOR_CATEGORIES || []).find(function (c) {
    return c.id === catId;
  });

  if (!meta || meta.comingSoon || meta.engine !== 'engrave') {
    window.location.replace('configurator.html');
    return;
  }

  var catalog = document.createElement('script');
  catalog.src = meta.catalog;
  catalog.onload = function () {
    if (!window.CFG_CONFIG || !CFG_CONFIG.models) {
      showBootError('Липсва конфигурация за тази категория. Опитай отново или избери друга.');
      return;
    }
    var core = document.createElement('script');
    core.src = 'assets/js/configurator/core.js';
    core.onerror = function () {
      showBootError('Неуспешно зареждане на конфигуратора. Провери интернет връзката и опитай отново.');
    };
    document.body.appendChild(core);
  };
  catalog.onerror = function () {
    showBootError('Неуспешно зареждане на каталога. Провери интернет връзката и опитай отново.');
  };
  document.body.appendChild(catalog);
})();
