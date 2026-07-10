/**
 * SAVOV PRO — Cookie Consent Banner
 *
 * Показва banner при първо посещение.
 * Записва избора в localStorage (key: savovpro-analytics-consent).
 * При "Приемам" → зарежда Clarity + GA4.
 * При "Отхвърлям" → нищо не се зарежда.
 */
(function () {
  'use strict';

  var CONSENT_KEY = 'savovpro-analytics-consent';

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }

  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
  }

  function hideBanner(banner) {
    banner.classList.add('is-hiding');
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 400);
  }

  function buildBanner() {
    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Съгласие за бисквитки');
    banner.setAttribute('aria-live', 'polite');

    banner.innerHTML = [
      '<div class="cookie-banner-inner">',
      '  <p class="cookie-banner-text">',
      '    Използваме бисквитки за анализ на посещенията и подобряване на сайта.',
      '    <a class="cookie-banner-link" href="privacy.html">Научи повече</a>',
      '  </p>',
      '  <div class="cookie-banner-actions">',
      '    <button class="btn btn-primary btn-compact" id="cookie-accept">Приемам</button>',
      '    <button class="btn btn-ghost btn-compact" id="cookie-decline">Не, благодаря</button>',
      '  </div>',
      '</div>',
    ].join('');

    return banner;
  }

  function init() {
    /* Already answered — nothing to show */
    if (getConsent() !== null) return;

    var banner = buildBanner();
    document.body.appendChild(banner);

    /* Animate in after paint */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('is-visible');
      });
    });

    document.getElementById('cookie-accept').addEventListener('click', function () {
      setConsent('true');
      hideBanner(banner);
      if (window.initAnalyticsAfterConsent) window.initAnalyticsAfterConsent();
    });

    document.getElementById('cookie-decline').addEventListener('click', function () {
      setConsent('false');
      hideBanner(banner);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
