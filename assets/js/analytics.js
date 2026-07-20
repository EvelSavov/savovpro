/**
 * SAVOV PRO — Analytics
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  ЗАМЕНИ ТЕЗИ ДВА ID-а СЛЕД КАТ ГИ ПОЛУЧИШ:                     │
 * │                                                                   │
 * │  1. Clarity ID  → clarity.microsoft.com → Projects → Settings    │
 * │  2. GA4 ID      → analytics.google.com  → Admin → Data streams  │
 * └─────────────────────────────────────────────────────────────────┘
 */
(function () {
  'use strict';

  var CLARITY_ID  = 'xj5e6k6fci';
  var GA4_ID      = 'G-4L6S5VSTF2';
  var CONSENT_KEY = 'savovpro-analytics-consent';

  /* ── Consent helpers ───────────────────────────────────────────── */

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }

  function hasConsent() {
    return getConsent() === 'true';
  }

  /* ── Load Microsoft Clarity ────────────────────────────────────── */

  function loadClarity() {
    if (typeof window.clarity !== 'undefined') return;
    if (CLARITY_ID === 'REPLACE_ME_CLARITY') return; // not configured yet

    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }

  /* ── Load Google Analytics 4 ───────────────────────────────────── */

  function loadGA4() {
    if (window._ga4Loaded) return;
    if (GA4_ID === 'G-REPLACE_ME_GA4') return; // not configured yet
    window._ga4Loaded = true;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA4_ID, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure',
    });
  }

  /* ── Public: fire a GA4 / Clarity event ───────────────────────── */

  /**
   * Fires a custom event if analytics consent has been given.
   * Call this from anywhere in the app:
   *   window.trackEvent('configurator_download', { category: 'keychains' });
   *
   * @param {string} eventName
   * @param {Object} [params]
   */
  window.trackEvent = function (eventName, params) {
    if (!hasConsent()) return;
    if (window.gtag) gtag('event', eventName, params || {});
    if (window.clarity) clarity('set', eventName, params ? JSON.stringify(params) : '1');
  };

  /* ── Auto-tracked events (delegate on common buttons) ─────────── */

  function attachAutoEvents() {
    document.addEventListener('click', function (e) {
      var el = e.target;

      /* Order via WhatsApp */
      if (el.id === 'btn-wa' || el.id === 'btn-wa-mobile' ||
          el.closest && el.closest('#btn-wa, #btn-wa-mobile')) {
        window.trackEvent('order_click_whatsapp');
      }

      /* Order via Email */
      if (el.id === 'btn-email' || el.id === 'btn-email-mobile' ||
          el.closest && el.closest('#btn-email, #btn-email-mobile')) {
        window.trackEvent('order_click_email');
      }

      /* Phone number click */
      var phoneLink = el.closest && el.closest('a[href^="tel:"]');
      if (!phoneLink && el.tagName === 'A' && el.href && el.href.indexOf('tel:') === 0) {
        phoneLink = el;
      }
      if (phoneLink) {
        window.trackEvent('phone_click', { phone: phoneLink.href.replace('tel:', '') });
      }

      /* Social media link click */
      var socialLink = el.closest && el.closest('a[href*="facebook.com"], a[href*="instagram.com"], a[href*="tiktok.com"]');
      if (!socialLink && el.tagName === 'A') {
        if (el.href && (el.href.indexOf('facebook.com') !== -1 ||
                        el.href.indexOf('instagram.com') !== -1 ||
                        el.href.indexOf('tiktok.com') !== -1)) {
          socialLink = el;
        }
      }
      if (socialLink) {
        var network = 'unknown';
        if (socialLink.href.indexOf('facebook.com') !== -1)  network = 'facebook';
        if (socialLink.href.indexOf('instagram.com') !== -1) network = 'instagram';
        if (socialLink.href.indexOf('tiktok.com') !== -1)    network = 'tiktok';
        window.trackEvent('social_click', { network: network });
      }

      /* Configurator download button */
      if (el.id === 'kc-download-order' || el.id === 'st-download' ||
          el.closest && el.closest('#kc-download-order, #st-download')) {
        window.trackEvent('configurator_download');
      }

      /* Hub category card click */
      if (el.closest && el.closest('.cfg-hub-card')) {
        var card = el.closest('.cfg-hub-card');
        var title = card.querySelector('.cfg-hub-card-title');
        window.trackEvent('configurator_open', { category: title ? title.textContent.trim() : 'unknown' });
      }

      /* Wizard complete */
      if (el.id === 'kc-wizard-done' || el.id === 'st-wizard-done') {
        window.trackEvent('wizard_complete');
      }

      /* Wizard skip */
      if (el.id === 'kc-wizard-skip' || el.id === 'st-wizard-skip') {
        window.trackEvent('wizard_skip');
      }
    }, true);
  }

  /* ── Scroll depth — section visibility tracking ──────────────── */

  function attachScrollTracking() {
    if (!window.IntersectionObserver) return;

    var sections = [
      { selector: '#services', label: 'Услуги' },
      { selector: '#gallery',  label: 'Галерия' },
      { selector: '#about',    label: 'За нас' },
      { selector: '#contact',  label: 'Контакт' },
    ];

    var seen = {};

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !seen[entry.target.id]) {
          seen[entry.target.id] = true;
          window.trackEvent('section_view', { section: entry.target.id });
        }
      });
    }, { threshold: 0.3 });

    sections.forEach(function (s) {
      var el = document.querySelector(s.selector);
      if (el) observer.observe(el);
    });
  }

  /* ── Init ──────────────────────────────────────────────────────── */

  function init() {
    if (!hasConsent()) return;
    loadClarity();
    loadGA4();
    attachAutoEvents();
    attachScrollTracking();
  }

  /**
   * Called by cookie-consent.js when the user clicks "Приемам".
   */
  window.initAnalyticsAfterConsent = function () {
    loadClarity();
    loadGA4();
    attachAutoEvents();
    attachScrollTracking();
  };

  /* Fire immediately if consent was already given in a previous visit */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
