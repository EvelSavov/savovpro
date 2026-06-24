/**
 * Bootstraps an engraving configurator from ?cat= URL param.
 * Used by configurator-product.html — do not load on the hub page.
 */
(function () {
  'use strict';

  var yEl = document.getElementById('year');
  if (yEl) yEl.textContent = String(new Date().getFullYear());

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
      window.location.replace('configurator.html');
      return;
    }
    var core = document.createElement('script');
    core.src = 'assets/js/configurator/core.js';
    document.body.appendChild(core);
  };
  catalog.onerror = function () {
    window.location.replace('configurator.html');
  };
  document.body.appendChild(catalog);
})();
