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

  var catalog = document.createElement('script');
  catalog.src = meta.catalog;
  catalog.onload = function () {
    if (!window.CFG_CONFIG) {
      window.location.replace('configurator.html');
      return;
    }
    var clipart = document.createElement('script');
    clipart.src = 'assets/js/configurator/clipart.js';
    clipart.onload = function () {
      var core = document.createElement('script');
      core.src = 'assets/js/configurator/sticker-core.js?v=20250623';
      document.body.appendChild(core);
    };
    document.body.appendChild(clipart);
  };
  catalog.onerror = function () {
    window.location.replace('configurator.html');
  };
  document.body.appendChild(catalog);
})();
