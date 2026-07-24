/**
 * SAVOV PRO — Service page UI (section reveal)
 */
(function () {
  'use strict';

  var sections = document.querySelectorAll('.svc-section, .svc-cta');
  if (!sections.length) return;

  if (!window.IntersectionObserver) {
    sections.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  sections.forEach(function (el) { io.observe(el); });
})();
