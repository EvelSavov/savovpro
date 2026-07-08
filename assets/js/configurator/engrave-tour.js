/**
 * Engrave configurator interactive product tour.
 *
 * Spotlight: 4 dark overlay panels with a gold ring around the target.
 * Tooltip: always fixed at the bottom of the viewport, with ← dots → layout.
 *
 * Exposed as window.ENGRAVE_TOUR = { start(), shouldAutoStart() }.
 */
(function () {
  'use strict';

  var TOUR_KEY = 'savovpro-engrave-tour-v1';
  var PAD = 10;

  var STEPS = [
    {
      target: '#kc-canvas',
      title: 'Виж продукта на живо',
      body: 'Тук виждаш гравирания продукт в реално время. Влачи текста с мишка или пръст, за да го наместиш.',
    },
    {
      target: '#kc-line1',
      title: 'Въведи текста за гравиране',
      body: 'Напиши името или надписа на ред 1. Можеш да добавиш втори ред по желание.',
    },
    {
      target: '#kc-font',
      title: 'Избери шрифт',
      body: 'Смени шрифта от падащото меню. Промяната се вижда веднага на превюто.',
    },
    {
      target: '#kc-model-grid',
      title: 'Избери модел',
      body: 'Кликни върху модел, за да смениш продукта. Цената се обновява автоматично.',
    },
    {
      target: '#kc-download-order',
      title: 'Свали и поръчай',
      body: 'Свали PNG превю и го прикачи при поръчка в WhatsApp или по имейл.',
    },
  ];

  var st = {
    active: false,
    step: 0,
    panels: [],
    ring: null,
    beacon: null,
    tooltip: null,
    resizeTimer: 0,
    rafId: 0,
    /* last known rect — used to skip redundant DOM writes */
    lastLeft: -1, lastTop: -1, lastWidth: -1, lastHeight: -1,
  };

  /* ─── Helpers ────────────────────────────────────────────────── */

  function px(v) { return Math.round(v) + 'px'; }

  /* ─── DOM build ──────────────────────────────────────────────── */

  function buildUI() {
    /* 4 dark panels forming the overlay "frame" around the target */
    ['top', 'right', 'bottom', 'left'].forEach(function (side) {
      var div = document.createElement('div');
      div.className = 'st-tour-panel';
      div.setAttribute('data-side', side);
      div.setAttribute('aria-hidden', 'true');
      document.body.appendChild(div);
      st.panels.push(div);
    });

    /* Gold ring */
    st.ring = document.createElement('div');
    st.ring.className = 'st-tour-ring';
    st.ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(st.ring);

    /* Pulsing beacon */
    st.beacon = document.createElement('div');
    st.beacon.className = 'st-tour-beacon';
    st.beacon.setAttribute('aria-hidden', 'true');
    document.body.appendChild(st.beacon);

    /* Bottom-fixed tooltip card */
    st.tooltip = document.createElement('div');
    st.tooltip.className = 'st-tour-tooltip';
    st.tooltip.setAttribute('role', 'dialog');
    st.tooltip.setAttribute('aria-modal', 'false');
    st.tooltip.setAttribute('aria-labelledby', 'ett-title');
    st.tooltip.innerHTML = [
      '<div class="st-tour-tt-top">',
      '  <span class="st-tour-tt-badge" id="ett-badge" aria-live="polite"></span>',
      '  <h3 class="st-tour-tt-title" id="ett-title"></h3>',
      '  <button type="button" class="st-tour-tt-skip" id="ett-skip" aria-label="Пропусни тура">✕</button>',
      '</div>',
      '<p class="st-tour-tt-desc" id="ett-desc"></p>',
      '<div class="st-tour-tt-foot">',
      '  <button type="button" class="st-tour-back-btn" id="ett-prev" aria-label="Назад">',
      '    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>',
      '  </button>',
      '  <div class="st-tour-dots" id="ett-dots" aria-hidden="true"></div>',
      '  <button type="button" class="st-tour-next-btn" id="ett-next">Напред <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg></button>',
      '  <button type="button" class="st-tour-done-btn" id="ett-done">Готово ✓</button>',
      '</div>',
    ].join('');
    document.body.appendChild(st.tooltip);

    document.getElementById('ett-skip').addEventListener('click', end);
    document.getElementById('ett-prev').addEventListener('click', prev);
    document.getElementById('ett-next').addEventListener('click', next);
    document.getElementById('ett-done').addEventListener('click', end);

    window.addEventListener('keydown', function (e) {
      if (!st.active) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      else if (e.key === 'Escape') end();
    });
  }

  /* ─── Spotlight positioning ──────────────────────────────────── */

  function applyPanels(rect) {
    var t = rect.top - PAD;
    var l = rect.left - PAD;
    var r = rect.right + PAD;
    var b = rect.bottom + PAD;
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    var sides = {
      top:    { l: 0,              t: 0,              w: vw,                  h: Math.max(0, t)       },
      right:  { l: Math.max(0, r), t: Math.max(0, t), w: Math.max(0, vw - r), h: Math.max(0, b - t) },
      bottom: { l: 0,              t: Math.max(0, b),  w: vw,                  h: Math.max(0, vh - b) },
      left:   { l: 0,              t: Math.max(0, t),  w: Math.max(0, l),      h: Math.max(0, b - t) },
    };

    st.panels.forEach(function (panel) {
      var s = sides[panel.getAttribute('data-side')];
      panel.style.left   = px(s.l);
      panel.style.top    = px(s.t);
      panel.style.width  = px(s.w);
      panel.style.height = px(s.h);
    });

    st.ring.style.left   = px(rect.left - PAD);
    st.ring.style.top    = px(rect.top  - PAD);
    st.ring.style.width  = px(rect.width  + PAD * 2);
    st.ring.style.height = px(rect.height + PAD * 2);

    var bs = 14;
    st.beacon.style.left = px(rect.right + PAD - bs / 2);
    st.beacon.style.top  = px(rect.top   - PAD - bs / 2);
  }

  /* rAF tracking loop — keeps the spotlight glued to the target element
     regardless of which container is scrolling (sidebar, page, etc.). */
  function startTrackingLoop() {
    cancelAnimationFrame(st.rafId);
    st.lastLeft = st.lastTop = st.lastWidth = st.lastHeight = -1;

    function loop() {
      if (!st.active) return;
      var step = STEPS[st.step];
      var el = document.querySelector(step.target);
      if (el) {
        var rect = el.getBoundingClientRect();
        if (rect.left !== st.lastLeft || rect.top !== st.lastTop ||
            rect.width !== st.lastWidth || rect.height !== st.lastHeight) {
          st.lastLeft   = rect.left;
          st.lastTop    = rect.top;
          st.lastWidth  = rect.width;
          st.lastHeight = rect.height;
          applyPanels(rect);
        }
      }
      st.rafId = requestAnimationFrame(loop);
    }

    st.rafId = requestAnimationFrame(loop);
  }

  function stopTrackingLoop() {
    cancelAnimationFrame(st.rafId);
    st.rafId = 0;
  }

  /* ─── Step logic ─────────────────────────────────────────────── */

  function updateDots() {
    var el = document.getElementById('ett-dots');
    if (!el) return;
    el.innerHTML = '';
    STEPS.forEach(function (_, i) {
      var dot = document.createElement('span');
      dot.className = 'st-tour-dot' + (i === st.step ? ' is-active' : '');
      el.appendChild(dot);
    });
  }

  function renderStep(index) {
    var step = STEPS[index];

    var el = document.querySelector(step.target);
    if (!el) {
      if (index < STEPS.length - 1) { st.step++; renderStep(st.step); }
      else end();
      return;
    }

    document.getElementById('ett-badge').textContent = (index + 1) + ' / ' + STEPS.length;
    document.getElementById('ett-title').textContent = step.title;
    document.getElementById('ett-desc').textContent  = step.body;

    var prevBtn = document.getElementById('ett-prev');
    var nextBtn = document.getElementById('ett-next');
    var doneBtn = document.getElementById('ett-done');
    prevBtn.hidden = index === 0;
    nextBtn.hidden = index === STEPS.length - 1;
    doneBtn.hidden = index !== STEPS.length - 1;

    updateDots();

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function next() {
    if (!st.active) return;
    if (st.step < STEPS.length - 1) { st.step++; renderStep(st.step); }
    else end();
  }

  function prev() {
    if (!st.active || st.step === 0) return;
    st.step--;
    renderStep(st.step);
  }

  /* ─── Show / hide ────────────────────────────────────────────── */

  function setVisible(on) {
    var action = on ? 'add' : 'remove';
    st.panels.forEach(function (p) { p.classList[action]('is-active'); });
    st.ring.classList[action]('is-active');
    st.beacon.classList[action]('is-active');
    st.tooltip.classList[action]('is-active');
  }

  /* ─── Public API ─────────────────────────────────────────────── */

  function start() {
    if (!st.panels.length) buildUI();
    st.active = true;
    st.step = 0;
    setVisible(true);
    startTrackingLoop();
    renderStep(0);
  }

  function end() {
    st.active = false;
    stopTrackingLoop();
    setVisible(false);
    try { localStorage.setItem(TOUR_KEY, '1'); } catch (e) { /* ignore */ }
  }

  function shouldAutoStart() {
    try { return localStorage.getItem(TOUR_KEY) !== '1'; } catch (e) { return false; }
  }

  window.ENGRAVE_TOUR = { start: start, shouldAutoStart: shouldAutoStart };
})();
