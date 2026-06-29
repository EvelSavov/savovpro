  (function () {
    'use strict';

    if (!window.CFG_CONFIG || !CFG_CONFIG.models) {
      console.error('CFG_CONFIG missing or invalid');
      return;
    }
    var CFG = window.CFG_CONFIG;
    var MODELS = CFG.models;
    var TEMPLATES = CFG.templates || [];
    var CFG_FEATURES = CFG.features || {};

    function getModelName(id) {
      return (MODELS[id] && MODELS[id].name) || id;
    }

    function applyCategoryUI() {
      document.title = 'SAVOV PRO — ' + CFG.title;
      var titleEl = document.getElementById('cfg-category-title');
      if (titleEl) titleEl.textContent = CFG.title;
      var sidesAcc = document.getElementById('acc-engrave');
      if (CFG_FEATURES.doubleSided === false && sidesAcc) {
        sidesAcc.style.display = 'none';
        state.sides = 1;
        state.sameDesign = true;
      }
      var simBtn = document.getElementById('kc-engrave-sim');
      if (simBtn) {
        if (CFG_FEATURES.engraveSim === false) {
          simBtn.style.display = 'none';
          state.engraveSim = false;
        } else {
          simBtn.style.display = '';
        }
      }
    }

    function renderModelGrid() {
      var grid = document.getElementById('kc-model-grid');
      if (!grid) return;
      grid.innerHTML = '';
      Object.keys(MODELS).forEach(function (id) {
        var m = MODELS[id];
        var btn = document.createElement('button');
        btn.className = 'cfg-model-btn' + (state.model === id ? ' is-active' : '');
        btn.type = 'button';
        btn.dataset.model = id;
        btn.title = m.name;
        var shortName = m.shortName || m.name;
        btn.innerHTML =
          '<img src="' + m.src + '" alt="' + escHtml(m.name) + '" />' +
          '<span class="cfg-model-name">' + escHtml(shortName) + '</span>' +
          '<span class="cfg-model-price">' + m.price + ' ' + m.currency + '</span>';
        btn.addEventListener('click', function () {
          document.querySelectorAll('.cfg-model-btn').forEach(function (b) { b.classList.remove('is-active'); });
          btn.classList.add('is-active');
          state.model = id;
          updatePriceDisplay();
          draw();
          updateLinks();
          scheduleDraftSave();
        });
        grid.appendChild(btn);
      });
    }

    /* ── Year ── */
    var yEl = document.getElementById('year');
    if (yEl) yEl.textContent = String(new Date().getFullYear());

    /* ── Canvas setup ── */
    var canvas = document.getElementById('kc-canvas');
    var ctx = canvas.getContext('2d');
    var CW = canvas.width;   // 440
    var CH = canvas.height;  // 440

    /* ── Global state (model / sides / engrave — NOT text/image, those live in layers) ── */
    var state = {
      model:      CFG.defaultModel,
      engraveSim: false,
      sides:      1,
      sameDesign: true,
      activeSide: 0,
    };

    /* ── Layers system ── */
    var layers = [];
    var selectedLayerId = null;
    var nextLayerId = 1;
    var DEFAULT_COLOR = '#2D1005';

    function makeTextLayer(opts) {
      opts = opts || {};
      return {
        id: nextLayerId++,
        type: 'text',
        name: opts.line1 || 'Текст',
        x: opts.x || 0, y: opts.y || 0,
        size: opts.size !== undefined ? opts.size : 18,
        rotation: opts.rotation || 0,
        color: opts.color || DEFAULT_COLOR,
        visible: true,
        line1: opts.line1 !== undefined ? opts.line1 : 'ИМЕ',
        line2: opts.line2 || '',
        font: opts.font || 'Montserrat',
        letterSpacing: opts.letterSpacing || 0,
      };
    }

    function makeIconLayer(iconId, iconImg, opts) {
      opts = opts || {};
      var namePart = iconId.split(':')[1] || iconId;
      return {
        id: nextLayerId++,
        type: 'icon',
        name: namePart.replace(/-/g, ' '),
        x: opts.x || 0, y: opts.y || 0,
        size: opts.size || 60,
        rotation: opts.rotation || 0,
        color: opts.color || DEFAULT_COLOR,
        visible: true,
        iconId: iconId,
        iconImg: iconImg,
      };
    }

    function makeImageLayer(imgEl, opts) {
      opts = opts || {};
      return {
        id: nextLayerId++,
        type: 'image',
        name: 'Лого',
        x: opts.x || 0, y: opts.y || 0,
        size: opts.size !== undefined ? opts.size : 1.0,
        rotation: opts.rotation || 0,
        color: DEFAULT_COLOR,
        visible: true,
        imgEl: imgEl,
      };
    }

    function getSelectedLayer() {
      if (!selectedLayerId) return null;
      for (var i = 0; i < layers.length; i++) {
        if (layers[i].id === selectedLayerId) return layers[i];
      }
      return null;
    }

    function getLayerById(id) {
      for (var i = 0; i < layers.length; i++) {
        if (layers[i].id === id) return layers[i];
      }
      return null;
    }

    function addLayer(layer) {
      layers.push(layer);
      selectedLayerId = layer.id;
      renderLayersPanel();
      syncControlsToSelectedLayer();
      saveHistory();
      draw();
    }

    function deleteLayerById(id) {
      var idx = -1;
      for (var i = 0; i < layers.length; i++) {
        if (layers[i].id === id) { idx = i; break; }
      }
      if (idx === -1) return;
      layers.splice(idx, 1);
      if (selectedLayerId === id) {
        selectedLayerId = layers.length > 0 ? layers[layers.length - 1].id : null;
      }
      renderLayersPanel();
      syncControlsToSelectedLayer();
      saveHistory();
      draw();
    }

    function selectLayerById(id) {
      selectedLayerId = id;
      renderLayersPanel();
      syncControlsToSelectedLayer();
      draw();
    }

    /* Snapshot layers array (shallow copy, keeps img references) */
    function snapshotLayers() {
      return layers.map(function(l) {
        var c = {}; for (var k in l) c[k] = l[k]; return c;
      });
    }

    function restoreLayers(snap) {
      layers = snap.map(function(l) {
        var c = {}; for (var k in l) c[k] = l[k]; return c;
      });
      var maxId = 0;
      layers.forEach(function(l) { if (l.id > maxId) maxId = l.id; });
      if (maxId >= nextLayerId) nextLayerId = maxId + 1;
    }

    function escHtml(s) {
      return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    /* track which text input was last focused for symbol insertion */
    var lastFocusedInput = document.getElementById('kc-line1');

    /* ── Multi-side constants ── */
    var EXTRA_DOUBLE_SAME = 3;
    var EXTRA_DOUBLE_DIFF = 5;
    var sideStorage = [null, null];  /* stores snapshotLayers() per side */

    var DRAFT_KEY = 'savovpro-engrave-draft-v1';
    var DRAFT_SAVE_MS = 700;
    var draftSaveTimer = 0;
    var ICONIFY_CDN = 'https://api.iconify.design';

    function iconSvgUrl(iconId, colorHex) {
      var parts = iconId.split(':');
      var url = ICONIFY_CDN + '/' + parts[0] + '/' + parts[1] + '.svg';
      if (colorHex) url += '?color=%23' + colorHex;
      return url;
    }

    function serializeLayerForDraft(layer) {
      if (layer.type === 'text') {
        return {
          id: layer.id,
          type: 'text',
          name: layer.name,
          line1: layer.line1,
          line2: layer.line2,
          font: layer.font,
          size: layer.size,
          letterSpacing: layer.letterSpacing,
          x: layer.x,
          y: layer.y,
          rotation: layer.rotation,
          color: layer.color,
          visible: layer.visible,
        };
      }
      if (layer.type === 'icon') {
        return {
          id: layer.id,
          type: 'icon',
          name: layer.name,
          iconId: layer.iconId,
          size: layer.size,
          x: layer.x,
          y: layer.y,
          rotation: layer.rotation,
          color: layer.color,
          visible: layer.visible,
        };
      }
      if (layer.type === 'image') {
        return {
          id: layer.id,
          type: 'image',
          name: layer.name,
          size: layer.size,
          x: layer.x,
          y: layer.y,
          rotation: layer.rotation,
          visible: layer.visible,
          dataUrl: layer.imgEl && layer.imgEl.src ? layer.imgEl.src : null,
        };
      }
      return null;
    }

    function serializeSideLayers(sideLayers) {
      if (!sideLayers || !sideLayers.length) return null;
      return sideLayers.map(serializeLayerForDraft).filter(Boolean);
    }

    function buildDraftPayload() {
      var sidesCopy = sideStorage.slice();
      if (state.sides === 2 && !state.sameDesign) {
        sidesCopy[state.activeSide] = snapshotLayers();
      }
      return {
        v: 1,
        catId: CFG.id,
        savedAt: Date.now(),
        model: state.model,
        sides: state.sides,
        sameDesign: state.sameDesign,
        activeSide: state.activeSide,
        nextLayerId: nextLayerId,
        selectedLayerId: selectedLayerId,
        layers: layers.map(serializeLayerForDraft).filter(Boolean),
        sideStorage: sidesCopy.map(serializeSideLayers),
      };
    }

    function scheduleDraftSave() {
      if (draftSaveTimer) clearTimeout(draftSaveTimer);
      draftSaveTimer = setTimeout(function () {
        draftSaveTimer = 0;
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraftPayload()));
        } catch (e) { /* quota / private mode */ }
      }, DRAFT_SAVE_MS);
    }

    function restoreTextLayerFromDraft(data) {
      return {
        id: data.id,
        type: 'text',
        name: data.name || data.line1 || 'Текст',
        line1: data.line1 != null ? data.line1 : '',
        line2: data.line2 || '',
        font: data.font || 'Montserrat',
        size: data.size != null ? data.size : 18,
        letterSpacing: data.letterSpacing || 0,
        x: data.x || 0,
        y: data.y || 0,
        rotation: data.rotation || 0,
        color: data.color || DEFAULT_COLOR,
        visible: data.visible !== false,
      };
    }

    function loadImageLayerFromDraft(data) {
      return new Promise(function (resolve) {
        if (!data.dataUrl) {
          resolve(null);
          return;
        }
        var img = new Image();
        img.onload = function () {
          resolve({
            id: data.id,
            type: 'image',
            name: data.name || 'Лого',
            imgEl: img,
            size: data.size != null ? data.size : 1,
            x: data.x || 0,
            y: data.y || 0,
            rotation: data.rotation || 0,
            color: DEFAULT_COLOR,
            visible: data.visible !== false,
          });
        };
        img.onerror = function () { resolve(null); };
        img.src = data.dataUrl;
      });
    }

    function loadIconLayerFromDraft(data) {
      return new Promise(function (resolve) {
        if (!data.iconId) {
          resolve(null);
          return;
        }
        var colorHex = (data.color || DEFAULT_COLOR).replace('#', '');
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
          resolve({
            id: data.id,
            type: 'icon',
            name: data.name || (data.iconId.split(':')[1] || data.iconId).replace(/-/g, ' '),
            iconId: data.iconId,
            iconImg: img,
            size: data.size != null ? data.size : 60,
            x: data.x || 0,
            y: data.y || 0,
            rotation: data.rotation || 0,
            color: data.color || DEFAULT_COLOR,
            visible: data.visible !== false,
          });
        };
        img.onerror = function () {
          if (img.src.indexOf('?') !== -1) {
            img.src = iconSvgUrl(data.iconId);
          } else {
            resolve(null);
          }
        };
        img.src = iconSvgUrl(data.iconId, colorHex);
      });
    }

    function restoreLayersFromDraftData(layerDataList) {
      if (!layerDataList || !layerDataList.length) return Promise.resolve([]);
      return Promise.all(layerDataList.map(function (data) {
        if (data.type === 'text') return Promise.resolve(restoreTextLayerFromDraft(data));
        if (data.type === 'icon') return loadIconLayerFromDraft(data);
        if (data.type === 'image') return loadImageLayerFromDraft(data);
        return Promise.resolve(null);
      })).then(function (restored) {
        return restored.filter(Boolean);
      });
    }

    function applyDraftMeta(draft) {
      if (draft.model && MODELS[draft.model]) state.model = draft.model;
      if (draft.sides != null) state.sides = draft.sides;
      if (draft.sameDesign != null) state.sameDesign = draft.sameDesign;
      if (draft.activeSide != null) state.activeSide = draft.activeSide;
      if (draft.nextLayerId != null) nextLayerId = draft.nextLayerId;
      selectedLayerId = draft.selectedLayerId != null ? draft.selectedLayerId : selectedLayerId;

      document.querySelectorAll('.cfg-model-btn').forEach(function (b) {
        b.classList.toggle('is-active', b.dataset.model === state.model);
      });
      updateSidesUI();
      updatePriceDisplay();
    }

    function hideDraftNotice() {
      var el = document.getElementById('kc-draft-notice');
      if (!el) return;
      el.hidden = true;
      clearTimeout(hideDraftNotice._timer);
    }

    function showDraftRestoredNotice() {
      var el = document.getElementById('kc-draft-notice');
      if (!el) return;
      el.hidden = false;
      clearTimeout(hideDraftNotice._timer);
      hideDraftNotice._timer = setTimeout(hideDraftNotice, 4500);
    }

    function clearDraftStorage() {
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
    }

    function resetToDefaultDesign() {
      layers = [];
      selectedLayerId = null;
      nextLayerId = 1;
      state.model = CFG.defaultModel;
      state.sides = 1;
      state.sameDesign = true;
      state.activeSide = 0;
      sideStorage = [null, null];
      history = [];
      historyIdx = -1;

      document.querySelectorAll('.cfg-model-btn').forEach(function (b) {
        b.classList.toggle('is-active', b.dataset.model === state.model);
      });

      hideDraftNotice();
      layers = [makeTextLayer({ line1: 'ИМЕ' })];
      selectedLayerId = layers[0].id;
      renderLayersPanel();
      syncControlsToSelectedLayer();
      updateSidesUI();
      updateLinks();
      saveHistory();
      draw();
    }

    function startOver() {
      if (!window.confirm('Да изтрием ли текущия дизайн и да започнем отначало?')) return;
      clearDraftStorage();
      resetToDefaultDesign();
    }

    function initStartOverButton() {
      var btn = document.getElementById('kc-start-over');
      if (btn) btn.addEventListener('click', startOver);
    }

    function restoreDraftFromStorage() {
      var raw;
      try {
        raw = localStorage.getItem(DRAFT_KEY);
      } catch (e) {
        return Promise.resolve(false);
      }
      if (!raw) return Promise.resolve(false);

      var draft;
      try {
        draft = JSON.parse(raw);
      } catch (e) {
        return Promise.resolve(false);
      }
      if (!draft || draft.catId !== CFG.id || !draft.layers || !draft.layers.length) {
        return Promise.resolve(false);
      }

      return restoreLayersFromDraftData(draft.layers).then(function (restoredLayers) {
        if (!restoredLayers.length) return false;
        layers = restoredLayers;

        var sidePromise = Promise.resolve();
        if (draft.sideStorage && draft.sideStorage.length) {
          sidePromise = Promise.all(draft.sideStorage.map(function (sideData) {
            if (!sideData) return Promise.resolve(null);
            return restoreLayersFromDraftData(sideData);
          })).then(function (sides) {
            sideStorage[0] = sides[0] && sides[0].length ? sides[0] : null;
            sideStorage[1] = sides[1] && sides[1].length ? sides[1] : null;
          });
        }

        return sidePromise.then(function () {
          applyDraftMeta(draft);
          renderLayersPanel();
          syncControlsToSelectedLayer();
          draw();
          updateLinks();
          showDraftRestoredNotice();
          return true;
        });
      });
    }

    function getPrice() {
      var m = MODELS[state.model];
      if (!m) return 0;
      var extra = state.sides === 2 ? (state.sameDesign ? EXTRA_DOUBLE_SAME : EXTRA_DOUBLE_DIFF) : 0;
      return m.price + extra;
    }

    function updatePriceDisplay() {
      var priceEl = document.getElementById('kc-price-display');
      var m = MODELS[state.model];
      if (priceEl) priceEl.textContent = getPrice() + ' ' + (m ? m.currency : '€');
    }

    function updateSidesUI() {
      var isDouble = state.sides === 2;
      var isDiff   = !state.sameDesign;

      var dmodeEl = document.getElementById('kc-design-mode');
      if (dmodeEl) dmodeEl.style.display = isDouble ? '' : 'none';

      var tabsEl = document.getElementById('kc-side-tabs');
      if (tabsEl) tabsEl.style.display = (isDouble && isDiff) ? '' : 'none';

      document.querySelectorAll('.cfg-sides-btn').forEach(function(b) {
        b.classList.toggle('is-active', +b.dataset.sides === state.sides);
      });
      document.querySelectorAll('.cfg-dmode-btn').forEach(function(b) {
        b.classList.toggle('is-active', (b.dataset.dmode === 'same') === state.sameDesign);
      });
      document.querySelectorAll('.cfg-side-tab').forEach(function(b) {
        b.classList.toggle('is-active', +b.dataset.side === state.activeSide);
      });

      var indicator = document.getElementById('kc-side-indicator');
      if (indicator) {
        if (isDouble && isDiff) {
          indicator.textContent = state.activeSide === 0 ? 'Редактираш Страна 1 — Лице' : 'Редактираш Страна 2 — Гръб';
          indicator.style.display = '';
        } else if (isDouble) {
          indicator.textContent = 'Еднакъв дизайн от двете страни';
          indicator.style.display = '';
        } else {
          indicator.style.display = 'none';
        }
      }

      /* Update the extra cost label next to "Двустранно" */
      var extraDoubleEl = document.getElementById('kc-extra-double');
      if (extraDoubleEl) {
        var extra = state.sameDesign ? EXTRA_DOUBLE_SAME : EXTRA_DOUBLE_DIFF;
        extraDoubleEl.textContent = '+' + extra + ' €';
      }

      updatePriceDisplay();
    }

    function switchSide(newSide) {
      if (state.activeSide === newSide) return;
      sideStorage[state.activeSide] = snapshotLayers();
      state.activeSide = newSide;
      var stored = sideStorage[newSide];
      if (stored && stored.length) {
        restoreLayers(stored);
        selectedLayerId = layers.length ? layers[layers.length - 1].id : null;
      } else {
        layers = [makeTextLayer({ line1: '' })];
        selectedLayerId = layers[0].id;
      }
      renderLayersPanel();
      syncControlsToSelectedLayer();
      updateSidesUI();
      draw();
      scheduleDraftSave();
    }

    /* ── Undo / Redo ── */
    var history    = [];
    var historyIdx = -1;
    var MAX_HIST   = 30;

    function saveHistory() {
      var snap = { layers: snapshotLayers(), sel: selectedLayerId };
      history = history.slice(0, historyIdx + 1);
      history.push(snap);
      if (history.length > MAX_HIST) history.shift(); else historyIdx++;
      updateUndoRedoBtns();
      scheduleDraftSave();
    }

    function applySnapshot(snap) {
      restoreLayers(snap.layers);
      selectedLayerId = snap.sel;
      renderLayersPanel();
      syncControlsToSelectedLayer();
      draw(); updateLinks();
    }

    function undo() {
      if (historyIdx <= 0) return;
      historyIdx--;
      applySnapshot(history[historyIdx]);
      updateUndoRedoBtns();
    }

    function redo() {
      if (historyIdx >= history.length - 1) return;
      historyIdx++;
      applySnapshot(history[historyIdx]);
      updateUndoRedoBtns();
    }

    function updateUndoRedoBtns() {
      document.getElementById('kc-undo').disabled = historyIdx <= 0;
      document.getElementById('kc-redo').disabled = historyIdx >= history.length - 1;
    }



    /* ── Clipart library (SVG strings; {c} replaced with engraving color) ── */
    /* ── Iconify icon library — predefined categories ── */
    var CLIPART_CATS = [
      {
        label: '♥ Любов',
        ids: ['mdi:heart', 'mdi:heart-outline', 'mdi:infinity', 'ph:ring-bold', 'mdi:flower', 'mdi:hand-heart', 'mdi:heart-multiple-outline', 'ph:butterfly-bold'],
      },
      {
        label: '★ Символи',
        ids: ['mdi:crown', 'mdi:star', 'mdi:anchor', 'mdi:key-variant', 'mdi:fire', 'mdi:lightning-bolt', 'mdi:compass', 'mdi:shield-star', 'mdi:trophy', 'mdi:medal', 'mdi:peace', 'mdi:yin-yang'],
      },
      {
        label: '✿ Природа',
        ids: ['mdi:leaf', 'mdi:tree', 'mdi:weather-sunny', 'mdi:weather-night', 'mdi:snowflake', 'mdi:mountain', 'mdi:flower-petal-outline', 'mdi:wave', 'mdi:pine-tree', 'mdi:weather-cloudy', 'mdi:grass', 'mdi:seed-outline'],
      },
      {
        label: '✦ Животни',
        ids: ['mdi:paw', 'mdi:cat', 'mdi:dog', 'mdi:bird', 'mdi:fish', 'mdi:rabbit', 'mdi:butterfly', 'mdi:owl', 'mdi:horse', 'mdi:elephant', 'mdi:shark', 'mdi:bee-outline'],
      },
      {
        label: '✝ Вяра',
        ids: ['mdi:cross', 'mdi:star-david', 'mdi:yin-yang', 'mdi:hand-heart', 'mdi:peace', 'mdi:hands-pray'],
      },
      {
        label: '◉ Спорт',
        ids: ['mdi:soccer', 'mdi:basketball', 'mdi:tennis', 'mdi:bicycle', 'mdi:run', 'mdi:swim', 'mdi:weight-lifter', 'mdi:ski', 'mdi:golf', 'mdi:boxing-glove'],
      },
      {
        label: '♪ Музика',
        ids: ['mdi:music-note', 'mdi:guitar-acoustic', 'mdi:piano', 'mdi:headphones', 'mdi:music-clef-treble', 'mdi:microphone', 'mdi:violin', 'mdi:trumpet'],
      },
    ];

    /* ── Image cache ── */
    var imgCache = {};

    function getImg(src, cb) {
      if (imgCache[src] && imgCache[src].complete) { cb(imgCache[src]); return; }
      var img = imgCache[src] || new Image();
      imgCache[src] = img;
      img.onload  = function () { cb(img); };
      img.onerror = function () { cb(null); };
      if (!img.src) img.src = src;
    }

    /* ── Layer draw helpers ── */

    function drawTextLayer(lc, layer, maxW) {
      var l1 = layer.line1 || '';
      var l2 = layer.line2 || '';
      var sz = layer.size;
      var ff = '"' + layer.font + '", sans-serif';
      if ('letterSpacing' in lc) lc.letterSpacing = layer.letterSpacing + 'px';
      lc.fillStyle = layer.color;
      lc.textAlign = 'center';
      lc.textBaseline = 'middle';
      lc.shadowColor = 'rgba(0,0,0,0.30)';
      lc.shadowBlur = 2; lc.shadowOffsetX = 1; lc.shadowOffsetY = 1;
      function setFont(s) { lc.font = s + 'px ' + ff; }
      var s1 = sz, s2 = sz;
      setFont(s1);
      while (l1 && lc.measureText(l1).width > maxW - 8 && s1 > 7) { s1 -= 0.5; setFont(s1); }
      if (l2) {
        var gap = s1 * 0.28;
        setFont(s1); lc.fillText(l1, 0, -s1 / 2 - gap);
        s2 = sz; setFont(s2);
        while (lc.measureText(l2).width > maxW - 8 && s2 > 7) { s2 -= 0.5; setFont(s2); }
        lc.fillText(l2, 0, s2 / 2 + gap);
      } else {
        setFont(s1); lc.fillText(l1, 0, 0);
      }
      lc.shadowColor = 'transparent'; lc.shadowBlur = 0; lc.shadowOffsetX = 0; lc.shadowOffsetY = 0;
      if ('letterSpacing' in lc) lc.letterSpacing = '0px';
      var rw = l1 ? lc.measureText(l1).width : sz * 4;
      if (l2) { setFont(s1); rw = Math.max(rw, lc.measureText(l2).width); }
      var rh = l2 ? s1 + s2 + s1 * 0.56 : s1 * 1.2;
      return { w: (rw || sz * 4) + 20, h: (rh || sz * 1.2) + 16 };
    }

    function drawIconLayer(lc, layer) {
      var img = layer.iconImg;
      if (!img || !img.complete || !img.naturalWidth) return { w: layer.size + 16, h: layer.size + 16 };
      var s = layer.size;
      lc.drawImage(img, -s / 2, -s / 2, s, s);
      return { w: s + 16, h: s + 16 };
    }

    function drawImageLayer(lc, layer, iw, ih) {
      var uImg = layer.imgEl;
      if (!uImg || !uImg.naturalWidth) return { w: 40, h: 40 };
      var fitW = iw * 0.22;
      var fitH = ih * 0.40;
      var fitScale = Math.min(fitW / uImg.naturalWidth, fitH / uImg.naturalHeight);
      var uW = uImg.naturalWidth  * fitScale * layer.size;
      var uH = uImg.naturalHeight * fitScale * layer.size;
      lc.drawImage(uImg, -uW / 2, -uH / 2, uW, uH);
      return { w: uW + 16, h: uH + 16 };
    }

    /* ── Bounding boxes ── */
    var elementBoxes = {};   /* layerId → {cx, cy, w, h, rotation} */

    /* ── Main draw ──
       Uses PNG mask + destination-in compositing so all layers are
       automatically clipped to the engraving area (mask is optional).  */
    function draw() {
      var m = MODELS[state.model];

      function doRender(img, maskImg) {
          ctx.clearRect(0, 0, CW, CH);
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, CW, CH);
          if (!img) return;

          var pad = 0.95;
          var scale = Math.min(CW / img.naturalWidth, CH / img.naturalHeight) * pad;
          var iw = img.naturalWidth * scale;
          var ih = img.naturalHeight * scale;
          var ix = (CW - iw) / 2;
          var iy = (CH - ih) / 2;

          /* 1. Draw the product */
          ctx.drawImage(img, ix, iy, iw, ih);

          /* 2. Offscreen layer for all decoration */
          var offscreen = document.createElement('canvas');
          offscreen.width = CW; offscreen.height = CH;
          var lc = offscreen.getContext('2d');
          var maxW = iw * m.textMaxW;
          var centerX = ix + iw * 0.5;
          var centerY = iy + ih * m.textCY;

          elementBoxes = {};

          /* 3. Draw each visible layer */
          layers.forEach(function (layer) {
            if (!layer.visible) return;
            var lx = centerX + layer.x;
            var ly = centerY + layer.y;
            lc.save();
            lc.translate(lx, ly);
            lc.rotate(layer.rotation * Math.PI / 180);
            var dims;
            if (layer.type === 'text')        dims = drawTextLayer(lc, layer, maxW);
            else if (layer.type === 'icon')   dims = drawIconLayer(lc, layer);
            else if (layer.type === 'image')  dims = drawImageLayer(lc, layer, iw, ih);
            lc.restore();
            if (dims) elementBoxes[layer.id] = { cx: lx, cy: ly, w: dims.w, h: dims.h, rotation: layer.rotation };
          });

          /* 4. Clip to mask or rectangular engraving zone */
          if (maskImg) {
            lc.globalCompositeOperation = 'destination-in';
            lc.drawImage(maskImg, ix, iy, iw, ih);
            lc.globalCompositeOperation = 'source-over';
          } else if (m.textMaxW) {
            var clipW = iw * m.textMaxW;
            var clipH = ih * (m.clipH != null ? m.clipH : m.textMaxW * 0.55);
            lc.globalCompositeOperation = 'destination-in';
            lc.fillStyle = '#000';
            lc.fillRect(centerX - clipW / 2, centerY - clipH / 2, clipW, clipH);
            lc.globalCompositeOperation = 'source-over';
          }

          /* 5. Composite — normal or engraving-simulation mode */
          if (state.engraveSim) {
            ctx.filter = 'blur(0.7px)';
            ctx.globalCompositeOperation = 'multiply';
          }
          ctx.drawImage(offscreen, 0, 0);
          ctx.filter = 'none';
          ctx.globalCompositeOperation = 'source-over';

          /* 6. Selection handles */
          if (selectedLayerId && elementBoxes[selectedLayerId]) {
            drawHandles(elementBoxes[selectedLayerId]);
          }
        }

      getImg(m.src, function (img) {
        if (m.mask) {
          getImg(m.mask, function (maskImg) { doRender(img, maskImg); });
        } else {
          doRender(img, null);
        }
      });
    }

    /* ── Selection handles ── */
    var HANDLE_R = 6;   /* corner handle half-size */
    var ROT_DIST = 28;  /* rotation handle distance above element */

    function drawHandles(el) {
      var rad = el.rotation * Math.PI / 180;
      var hw = el.w / 2;
      var hh = el.h / 2;

      ctx.save();
      ctx.translate(el.cx, el.cy);
      ctx.rotate(rad);

      /* dashed border */
      ctx.strokeStyle = 'rgba(201,162,39,0.9)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(-hw, -hh, el.w, el.h);
      ctx.setLineDash([]);

      /* corner handles */
      ctx.fillStyle = '#C9A227';
      [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]].forEach(function (c) {
        ctx.fillRect(c[0] - HANDLE_R, c[1] - HANDLE_R, HANDLE_R * 2, HANDLE_R * 2);
      });

      /* rotation handle (circle above top-center) */
      ctx.beginPath();
      ctx.moveTo(0, -hh);
      ctx.lineTo(0, -hh - ROT_DIST + 8);
      ctx.strokeStyle = 'rgba(201,162,39,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -hh - ROT_DIST, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#C9A227';
      ctx.fill();
      /* rotation icon inside the handle */
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, -hh - ROT_DIST, 4, -Math.PI * 0.8, Math.PI * 0.8);
      ctx.stroke();

      ctx.restore();
    }

    /* ── Order links ── */

    function describeLayersForMsg(layersArr) {
      var lines = [];
      var textLayers  = layersArr.filter(function(l) { return l.type === 'text'; });
      var iconLayers  = layersArr.filter(function(l) { return l.type === 'icon'; });
      var imageLayers = layersArr.filter(function(l) { return l.type === 'image'; });
      textLayers.forEach(function(l, i) {
        if (textLayers.length > 1) lines.push('Текст ' + (i + 1) + ':');
        var p = textLayers.length > 1 ? '  ' : '';
        lines.push(p + 'Ред 1:  ' + (l.line1 || '—'));
        if (l.line2) lines.push(p + 'Ред 2:  ' + l.line2);
        lines.push(p + 'Шрифт:  ' + l.font);
      });
      if (iconLayers.length)  lines.push('Икони:  ' + iconLayers.map(function(l) { return l.iconId; }).join(', '));
      if (imageLayers.length) lines.push('Лого:   да');
      return lines;
    }

    function buildMsg() {
      var m = MODELS[state.model];
      var price = getPrice();
      var sidesLabel = state.sides === 1
        ? 'Едностранно'
        : (state.sameDesign ? 'Двустранно — еднакъв дизайн' : 'Двустранно — различни дизайни');

      var lines = [
        'Здравейте! Искам да поръчам персонализиран продукт.',
        '',
        'Категория:   ' + CFG.title,
        'Модел:       ' + getModelName(state.model) + (m ? ' (' + price + ' ' + m.currency + ')' : ''),
        'Гравиране:   ' + sidesLabel,
        '',
      ];

      if (state.sides === 1 || state.sameDesign) {
        describeLayersForMsg(layers).forEach(function(l) { lines.push(l); });
        if (state.sides === 2) lines.push('Страна 2 — Гръб:  (еднакъв дизайн)');
      } else {
        var side0layers = state.activeSide === 0 ? layers : (sideStorage[0] || layers);
        var side1layers = state.activeSide === 1 ? layers : (sideStorage[1] || null);
        lines.push('Страна 1 — Лице:');
        describeLayersForMsg(side0layers).forEach(function(l) { lines.push('  ' + l); });
        lines.push('');
        lines.push('Страна 2 — Гръб:');
        if (side1layers) {
          describeLayersForMsg(side1layers).forEach(function(l) { lines.push('  ' + l); });
        } else {
          lines.push('  (все още не е настроена)');
        }
      }

      lines.push('');
      lines.push('Моля свали превю PNG от конфигуратора и го прикачи в чата.');

      return lines.join('\n');
    }

    function updateLinks() {
      var msg = buildMsg();
      var waHref = window.getWaLink ? getWaLink(msg) : 'https://wa.me/359884121606?text=' + encodeURIComponent(msg);
      var emailHref = window.getEmailLink
        ? getEmailLink('Поръчка: Персонализиран продукт', msg)
        : 'mailto:info@savovpro.com?subject=' + encodeURIComponent('Поръчка: Персонализиран продукт') + '&body=' + encodeURIComponent(msg);
      document.getElementById('btn-wa').href    = waHref;
      document.getElementById('btn-email').href = emailHref;
      /* Sync mobile sticky bar buttons */
      var mWa    = document.getElementById('btn-wa-mobile');
      var mEmail = document.getElementById('btn-email-mobile');
      if (mWa)    mWa.href    = waHref;
      if (mEmail) mEmail.href = emailHref;
    }

    /* ── Layers Panel ── */

    var EYE_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    var EYE_OFF_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>';
    var TYPE_SVG = {
      text:  '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 4v3h5.5v12h3V7H19V4z"/></svg>',
      icon:  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
      image: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    };

    var dragSrcId = null;

    function renderLayersPanel() {
      var list = document.getElementById('kc-layers-list');
      if (!list) return;
      list.innerHTML = '';

      if (!layers.length) {
        list.innerHTML = '<p class="cfg-layers-empty">Натисни "+ Текст" за да добавиш текст.</p>';
        updateTextLayerHint();
        return;
      }

      /* Show layers top-first (reverse of array order) */
      var reversed = layers.slice().reverse();
      reversed.forEach(function (layer) {
        var displayName = layer.type === 'text' ? (layer.line1 || 'Текст') : layer.name;
        if (displayName.length > 18) displayName = displayName.slice(0, 16) + '…';
        var isSelected = layer.id === selectedLayerId;

        var item = document.createElement('div');
        item.className = 'cfg-layer-item' + (isSelected ? ' is-selected' : '') + (!layer.visible ? ' is-hidden' : '');
        item.setAttribute('data-id', String(layer.id));
        item.draggable = true;
        item.innerHTML =
          '<span class="cfg-layer-drag" aria-label="Премести">⋮⋮</span>' +
          '<span class="cfg-layer-badge cfg-layer-badge--' + layer.type + '">' + (TYPE_SVG[layer.type] || '?') + '</span>' +
          '<span class="cfg-layer-name">' + escHtml(displayName) + '</span>' +
          '<button class="cfg-layer-vis" type="button" title="' + (layer.visible ? 'Скрий' : 'Покажи') + '">' + (layer.visible ? EYE_SVG : EYE_OFF_SVG) + '</button>' +
          '<button class="cfg-layer-del" type="button" title="Изтрий слой">✕</button>';

        item.addEventListener('click', function (e) {
          if (e.target.closest('.cfg-layer-vis') || e.target.closest('.cfg-layer-del')) return;
          selectLayerById(layer.id);
        });
        item.querySelector('.cfg-layer-vis').addEventListener('click', function (e) {
          e.stopPropagation();
          layer.visible = !layer.visible;
          renderLayersPanel(); draw();
        });
        item.querySelector('.cfg-layer-del').addEventListener('click', function (e) {
          e.stopPropagation();
          deleteLayerById(layer.id);
        });

        /* Drag-and-drop */
        item.addEventListener('dragstart', function (e) {
          dragSrcId = layer.id;
          item.classList.add('is-dragging');
          e.dataTransfer.effectAllowed = 'move';
        });
        item.addEventListener('dragend', function () {
          dragSrcId = null;
          list.querySelectorAll('.cfg-layer-item').forEach(function (i) {
            i.classList.remove('is-dragging', 'drag-over');
          });
        });
        item.addEventListener('dragover', function (e) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          list.querySelectorAll('.cfg-layer-item').forEach(function (i) { i.classList.remove('drag-over'); });
          if (layer.id !== dragSrcId) item.classList.add('drag-over');
        });
        item.addEventListener('drop', function (e) {
          e.preventDefault();
          if (!dragSrcId || layer.id === dragSrcId) return;
          var srcIdx = -1, tgtIdx = -1;
          for (var i = 0; i < layers.length; i++) {
            if (layers[i].id === dragSrcId) srcIdx = i;
            if (layers[i].id === layer.id)  tgtIdx = i;
          }
          if (srcIdx === -1 || tgtIdx === -1) return;
          var moved = layers.splice(srcIdx, 1)[0];
          /* recalculate target after splice */
          tgtIdx = -1;
          for (var j = 0; j < layers.length; j++) {
            if (layers[j].id === layer.id) { tgtIdx = j; break; }
          }
          layers.splice(tgtIdx, 0, moved);
          renderLayersPanel(); draw(); saveHistory();
        });

        list.appendChild(item);
      });

      updateTextLayerHint();
    }

    function updateTextLayerHint() {
      var hint = document.getElementById('kc-text-layer-hint');
      if (!hint) return;
      var sel = getSelectedLayer();
      if (sel && sel.type === 'text') {
        hint.textContent = '';
      } else {
        var hasText = layers.some(function(l) { return l.type === 'text'; });
        hint.textContent = hasText
          ? 'Избери текстов слой от "Слоеве" за редактиране'
          : 'Натисни "+ Текст" за да добавиш текст';
      }
    }

    /* ── Controls sync ── */
    function syncControlsToSelectedLayer() {
      var layer = getSelectedLayer();

      /* Text controls — dim when non-text layer selected */
      var isText  = layer && layer.type === 'text';
      var textWrap = document.getElementById('kc-text-inputs');
      if (textWrap) {
        textWrap.style.opacity = isText ? '1' : '0.4';
        textWrap.style.pointerEvents = isText ? '' : 'none';
      }

      if (isText) {
        document.getElementById('kc-line1').value = layer.line1;
        document.getElementById('kc-line2').value = layer.line2;
        updateCharCount('kc-line1', layer.line1);
        updateCharCount('kc-line2', layer.line2);
        var fontEl = document.getElementById('kc-font');
        if (fontEl) fontEl.value = layer.font;
        var spacEl = document.getElementById('kc-spacing');
        if (spacEl) {
          spacEl.value = layer.letterSpacing;
          document.getElementById('kc-spacing-val').textContent = layer.letterSpacing;
        }
      }

      /* Style controls */
      var rotEl = document.getElementById('kc-rotation');
      var sizeEl = document.getElementById('kc-size');
      var sizeValEl = document.getElementById('kc-size-val');
      var sizeLabel = document.getElementById('kc-size-label');

      if (layer) {
        if (rotEl) {
          rotEl.value = layer.rotation;
          document.getElementById('kc-rotation-val').textContent = layer.rotation + '°';
        }
        document.querySelectorAll('.cfg-color-btn').forEach(function(b) {
          b.classList.toggle('is-active', b.dataset.color === layer.color);
        });
        if (sizeEl) {
          if (layer.type === 'text') {
            sizeEl.min = 10; sizeEl.max = 38; sizeEl.step = 1; sizeEl.value = layer.size;
            if (sizeValEl) sizeValEl.textContent = layer.size;
            if (sizeLabel) sizeLabel.textContent = 'Размер на текста';
          } else if (layer.type === 'icon') {
            sizeEl.min = 10; sizeEl.max = 120; sizeEl.step = 1; sizeEl.value = layer.size;
            if (sizeValEl) sizeValEl.textContent = layer.size;
            if (sizeLabel) sizeLabel.textContent = 'Размер на иконата';
          } else {
            var pct = Math.round(layer.size * 100);
            sizeEl.min = 20; sizeEl.max = 300; sizeEl.step = 1; sizeEl.value = pct;
            if (sizeValEl) sizeValEl.textContent = pct + '%';
            if (sizeLabel) sizeLabel.textContent = 'Размер на логото';
          }
        }
      } else {
        /* Nothing selected — show neutral state */
        if (rotEl) { rotEl.value = 0; document.getElementById('kc-rotation-val').textContent = '0°'; }
      }

      updateTextLayerHint();
    }

    /* ── Event wiring ── */


    /* Text inputs — update selected text layer */
    document.getElementById('kc-line1').addEventListener('focus', function () { lastFocusedInput = this; });
    document.getElementById('kc-line2').addEventListener('focus', function () { lastFocusedInput = this; });

    document.getElementById('kc-line1').addEventListener('input', function () {
      var layer = getSelectedLayer();
      if (!layer || layer.type !== 'text') return;
      layer.line1 = this.value;
      layer.name  = this.value || 'Текст';
      updateCharCount('kc-line1', this.value);
      renderLayersPanel(); draw(); updateLinks();
      scheduleDraftSave();
    });
    document.getElementById('kc-line1').addEventListener('change', function () {
      var layer = getSelectedLayer();
      if (layer && layer.type === 'text') saveHistory();
    });

    document.getElementById('kc-line2').addEventListener('input', function () {
      var layer = getSelectedLayer();
      if (!layer || layer.type !== 'text') return;
      layer.line2 = this.value;
      updateCharCount('kc-line2', this.value);
      draw(); updateLinks();
      scheduleDraftSave();
    });
    document.getElementById('kc-line2').addEventListener('change', function () {
      var layer = getSelectedLayer();
      if (layer && layer.type === 'text') saveHistory();
    });

    document.getElementById('kc-font').addEventListener('change', function () {
      var layer = getSelectedLayer();
      if (!layer || layer.type !== 'text') return;
      saveHistory(); layer.font = this.value; draw();
    });

    document.getElementById('kc-size').addEventListener('input', function () {
      var layer = getSelectedLayer();
      if (!layer) return;
      var v = parseInt(this.value, 10);
      if (layer.type === 'image') {
        layer.size = v / 100;
        document.getElementById('kc-size-val').textContent = v + '%';
      } else {
        layer.size = v;
        document.getElementById('kc-size-val').textContent = v;
      }
      draw();
    });
    document.getElementById('kc-size').addEventListener('change', function () { saveHistory(); });

    document.querySelectorAll('.cfg-color-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var layer = getSelectedLayer();
        document.querySelectorAll('.cfg-color-btn').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        if (layer) { layer.color = btn.dataset.color; saveHistory(); draw(); }
      });
    });

    document.getElementById('kc-rotation').addEventListener('input', function () {
      var layer = getSelectedLayer();
      if (!layer) return;
      var deg = parseInt(this.value, 10);
      layer.rotation = deg;
      document.getElementById('kc-rotation-val').textContent = deg + '°';
      draw();
    });
    document.getElementById('kc-rotation').addEventListener('change', function () { saveHistory(); });

    document.getElementById('kc-spacing').addEventListener('input', function () {
      var layer = getSelectedLayer();
      if (!layer || layer.type !== 'text') return;
      layer.letterSpacing = parseFloat(this.value);
      document.getElementById('kc-spacing-val').textContent = layer.letterSpacing;
      draw();
    });
    document.getElementById('kc-spacing').addEventListener('change', function () { saveHistory(); });

    /* ── Symbol picker ── */
    document.querySelectorAll('.cfg-sym-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sym = btn.dataset.sym;
        var el  = lastFocusedInput || document.getElementById('kc-line1');
        var start = el.selectionStart, end = el.selectionEnd;
        el.value = el.value.slice(0, start) + sym + el.value.slice(end);
        el.selectionStart = el.selectionEnd = start + sym.length;
        el.dispatchEvent(new Event('input'));
        el.focus();
      });
    });

    /* ── Add text layer ── */
    document.getElementById('kc-add-text').addEventListener('click', function () {
      var sel = getSelectedLayer();
      var color = sel ? sel.color : DEFAULT_COLOR;
      addLayer(makeTextLayer({ line1: '', color: color }));
      var accText = document.getElementById('acc-text');
      if (accText && !accText.classList.contains('is-open')) {
        accText.classList.add('is-open');
        accText.querySelector('.cfg-acc-head').setAttribute('aria-expanded', 'true');
      }
      setTimeout(function() { document.getElementById('kc-line1').focus(); }, 50);
    });

    /* ── Upload image → new image layer ── */
    document.getElementById('kc-upload').addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () { addLayer(makeImageLayer(img)); };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
      this.value = '';
    });

    /* ── Sides / design-mode / side-tab buttons ── */
    document.querySelectorAll('.cfg-sides-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var newSides = +btn.dataset.sides;
        if (newSides === state.sides) return;
        state.sides = newSides;
        if (newSides === 1 && state.activeSide === 1) {
          sideStorage[1] = snapshotLayers();
          state.activeSide = 0;
          var s0 = sideStorage[0];
          if (s0 && s0.length) { restoreLayers(s0); selectedLayerId = layers.length ? layers[layers.length - 1].id : null; }
          sideStorage[0] = null; sideStorage[1] = null;
          renderLayersPanel(); syncControlsToSelectedLayer();
        }
        updateSidesUI(); draw(); updateLinks();
        scheduleDraftSave();
      });
    });

    document.querySelectorAll('.cfg-dmode-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var isDiff = btn.dataset.dmode === 'diff';
        if (!isDiff === state.sameDesign) return;
        if (isDiff) {
          state.sameDesign = false;
          sideStorage[state.activeSide] = snapshotLayers();
        } else {
          state.sameDesign = true;
          sideStorage[0] = null; sideStorage[1] = null;
          state.activeSide = 0;
        }
        updateSidesUI(); draw(); updateLinks();
        scheduleDraftSave();
      });
    });

    document.querySelectorAll('.cfg-side-tab').forEach(function(btn) {
      btn.addEventListener('click', function() { switchSide(+btn.dataset.side); });
    });

    /* ── Reset position & rotation (selected layer) ── */
    document.getElementById('kc-reset').addEventListener('click', function () {
      var layer = getSelectedLayer();
      if (!layer) return;
      saveHistory();
      layer.x = 0; layer.y = 0; layer.rotation = 0;
      syncControlsToSelectedLayer(); draw();
    });

    /* ── Pointer interaction (move / rotate / scale on layers) ── */

    function canvasXY(e) {
      var rect = canvas.getBoundingClientRect();
      var src  = e.touches ? e.touches[0] : e;
      return {
        x: (src.clientX - rect.left) * (CW / rect.width),
        y: (src.clientY - rect.top)  * (CH / rect.height),
      };
    }

    function hitBody(el, px, py) {
      var dx = px - el.cx, dy = py - el.cy;
      var rad = el.rotation * Math.PI / 180;
      var lx = dx * Math.cos(-rad) - dy * Math.sin(-rad);
      var ly = dx * Math.sin(-rad) + dy * Math.cos(-rad);
      return Math.abs(lx) <= el.w / 2 + 10 && Math.abs(ly) <= el.h / 2 + 10;
    }

    function rotHandlePos(el) {
      var rad = el.rotation * Math.PI / 180;
      var dist = el.h / 2 + ROT_DIST;
      return { x: el.cx + dist * Math.sin(rad), y: el.cy - dist * Math.cos(rad) };
    }

    function hitRotHandle(el, px, py) {
      var h = rotHandlePos(el);
      return Math.hypot(px - h.x, py - h.y) <= 14;
    }

    function scaleHandlePos(el) {
      var rad = el.rotation * Math.PI / 180;
      return {
        x: el.cx + (el.w / 2) * Math.cos(rad) + (el.h / 2) * Math.sin(rad),
        y: el.cy + (el.w / 2) * Math.sin(rad) - (el.h / 2) * Math.cos(rad),
      };
    }

    function hitScaleHandle(el, px, py) {
      var s = scaleHandlePos(el);
      return Math.hypot(px - s.x, py - s.y) <= 14;
    }

    var ptr = {
      active: false, mode: null, layerId: null,
      startX: 0, startY: 0,
      ox: 0, oy: 0,
      startAngle: 0, startRotation: 0,
      startDist: 0, startScale: 0,
    };

    function onPointerDown(e) {
      e.preventDefault();
      var p = canvasXY(e);
      var px = p.x, py = p.y;
      var hitId = null, mode = 'move';

      /* Check handles of currently selected layer first */
      if (selectedLayerId && elementBoxes[selectedLayerId]) {
        var selBox = elementBoxes[selectedLayerId];
        if (hitRotHandle(selBox, px, py))        { hitId = selectedLayerId; mode = 'rotate'; }
        else if (hitScaleHandle(selBox, px, py)) { hitId = selectedLayerId; mode = 'scale'; }
        else if (hitBody(selBox, px, py))        { hitId = selectedLayerId; mode = 'move'; }
      }

      /* Check other layers (topmost first) */
      if (!hitId) {
        for (var i = layers.length - 1; i >= 0; i--) {
          var lid = layers[i].id;
          if (!layers[i].visible || lid === selectedLayerId) continue;
          if (elementBoxes[lid] && hitBody(elementBoxes[lid], px, py)) {
            hitId = lid; mode = 'move'; break;
          }
        }
      }

      if (!hitId) {
        selectedLayerId = null;
        renderLayersPanel(); syncControlsToSelectedLayer(); draw();
        return;
      }

      if (hitId !== selectedLayerId) selectLayerById(hitId);

      ptr.active = true; ptr.mode = mode; ptr.layerId = hitId;
      ptr.startX = px; ptr.startY = py;
      canvas.style.cursor = mode === 'rotate' ? 'alias' : mode === 'scale' ? 'nwse-resize' : 'grabbing';

      var layer = getLayerById(hitId);
      var box   = elementBoxes[hitId];
      if (mode === 'move') {
        ptr.ox = layer.x; ptr.oy = layer.y;
      } else if (mode === 'rotate') {
        ptr.startAngle = Math.atan2(py - box.cy, px - box.cx);
        ptr.startRotation = layer.rotation;
      } else if (mode === 'scale') {
        ptr.startDist  = Math.hypot(px - box.cx, py - box.cy);
        ptr.startScale = layer.size;
      }
    }

    function onPointerMove(e) {
      if (!ptr.active) return;
      e.preventDefault();
      var p = canvasXY(e);
      var px = p.x, py = p.y;
      var layer = getLayerById(ptr.layerId);
      if (!layer) return;
      var box = elementBoxes[ptr.layerId];

      if (ptr.mode === 'move') {
        layer.x = ptr.ox + (px - ptr.startX);
        layer.y = ptr.oy + (py - ptr.startY);
      } else if (ptr.mode === 'rotate') {
        var angle = Math.atan2(py - box.cy, px - box.cx);
        var newRot = Math.round(ptr.startRotation + (angle - ptr.startAngle) * 180 / Math.PI);
        layer.rotation = newRot;
        document.getElementById('kc-rotation').value = newRot;
        document.getElementById('kc-rotation-val').textContent = newRot + '°';
      } else if (ptr.mode === 'scale') {
        var dist = Math.hypot(px - box.cx, py - box.cy);
        var newScale = ptr.startScale * (dist / ptr.startDist);
        if (layer.type === 'image') {
          layer.size = Math.max(0.1, newScale);
          var pct = Math.round(layer.size * 100);
          document.getElementById('kc-size').value = Math.min(300, Math.max(20, pct));
          document.getElementById('kc-size-val').textContent = pct + '%';
        } else {
          var newSize = Math.round(Math.max(7, Math.min(layer.type === 'icon' ? 120 : 60, newScale)));
          layer.size = newSize;
          document.getElementById('kc-size').value = Math.min(+document.getElementById('kc-size').max, newSize);
          document.getElementById('kc-size-val').textContent = newSize;
        }
      }
      draw();
    }

    function onPointerUp() {
      if (ptr.active) { saveHistory(); ptr.active = false; canvas.style.cursor = 'default'; }
    }

    canvas.addEventListener('mousedown',  onPointerDown);
    window.addEventListener('mousemove',  onPointerMove);
    window.addEventListener('mouseup',    onPointerUp);
    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove',  onPointerMove, { passive: false });
    window.addEventListener('touchend',   onPointerUp);

    /* ── Engraving simulation toggle ── */
    document.getElementById('kc-engrave-sim').addEventListener('click', function () {
      state.engraveSim = !state.engraveSim;
      this.classList.toggle('is-on', state.engraveSim);
      draw();
    });

    /* ── Templates — apply to selected (or first) text layer ── */
    (function () {
      var wrap = document.getElementById('kc-templates');
      TEMPLATES.forEach(function (tpl) {
        var btn = document.createElement('button');
        btn.className = 'cfg-tpl-btn';
        btn.type = 'button';
        btn.innerHTML = '<span class="cfg-tpl-name">' + tpl.name + '</span>'
          + '<span class="cfg-tpl-preview">' + tpl.line1 + (tpl.line2 ? ' / ' + tpl.line2 : '') + '</span>';
        btn.addEventListener('click', function () {
          /* Find or create the target text layer */
          var layer = getSelectedLayer();
          if (!layer || layer.type !== 'text') {
            layer = null;
            for (var i = 0; i < layers.length; i++) { if (layers[i].type === 'text') { layer = layers[i]; break; } }
          }
          if (!layer) { layer = makeTextLayer({}); layers.push(layer); }
          saveHistory();
          layer.line1 = tpl.line1; layer.line2 = tpl.line2;
          layer.font  = tpl.font;  layer.size  = tpl.size;
          layer.color = tpl.color; layer.letterSpacing = tpl.letterSpacing;
          layer.rotation = 0; layer.x = 0; layer.y = 0;
          layer.name = tpl.line1 || 'Текст';
          selectedLayerId = layer.id;
          renderLayersPanel(); syncControlsToSelectedLayer();
          draw(); updateLinks();
        });
        wrap.appendChild(btn);
      });
    })();

    /* ── Clipart — Iconify live search + category tabs ── */
    (function () {
      var ICONIFY     = 'https://api.iconify.design';
      var GOLD_HEX    = 'c9a227';

      /* ── Bulgarian → English keyword dictionary ── */
      var BG_EN = {
        /* Любов */
        'сърце':'heart','сърца':'heart','любов':'love','влюбен':'love heart',
        'безкрайност':'infinity','пръстен':'ring','целувка':'kiss','рози':'rose',
        /* Символи */
        'звезда':'star','звезди':'stars','корона':'crown','диамант':'diamond',
        'котва':'anchor','ключ':'key','огън':'fire','пламък':'flame',
        'мълния':'lightning','компас':'compass','щит':'shield',
        'трофей':'trophy','медал':'medal','камбана':'bell','книга':'book',
        'стрела':'arrow','самолет':'airplane','ракета':'rocket',
        /* Природа */
        'лист':'leaf','листо':'leaf','листа':'leaf','дърво':'tree','гора':'forest',
        'слънце':'sun','луна':'moon','снежинка':'snowflake','сняг':'snow',
        'планина':'mountain','планини':'mountain','цвете':'flower','цветя':'flower',
        'роза':'rose','вълна':'wave','море':'ocean','вода':'water',
        'облак':'cloud','дъга':'rainbow','вятър':'wind','трева':'grass',
        /* Животни */
        'котка':'cat','коте':'cat','куче':'dog','кученце':'dog',
        'лапа':'paw','птица':'bird','риба':'fish','заек':'rabbit',
        'пеперуда':'butterfly','лъв':'lion','тигър':'tiger','мечка':'bear',
        'вълк':'wolf','лисица':'fox','кон':'horse','елен':'deer',
        'орел':'eagle','сова':'owl','делфин':'dolphin','акула':'shark',
        'слон':'elephant','жираф':'giraffe','маймуна':'monkey','змия':'snake',
        'крокодил':'crocodile','папагал':'parrot','прасе':'pig','крава':'cow',
        /* Спорт */
        'футбол':'football','баскетбол':'basketball','тенис':'tennis',
        'велосипед':'bicycle','колело':'bicycle','плуване':'swim',
        'тичане':'running','бокс':'boxing','волейбол':'volleyball',
        'скейт':'skateboard','ски':'ski','голф':'golf',
        /* Музика */
        'музика':'music','нота':'music note','китара':'guitar',
        'пиано':'piano','слушалки':'headphones','барабани':'drums',
        /* Хора/Семейство */
        'семейство':'family','майка':'mother','баща':'father',
        'бебе':'baby','деца':'children','приятели':'friends',
        /* Превозни средства */
        'кола':'car','автомобил':'car','мотор':'motorcycle','лодка':'boat',
        'кораб':'ship','камион':'truck','влак':'train','хеликоптер':'helicopter',
        /* Храна & напитки */
        'кафе':'coffee','пица':'pizza','торта':'cake','сладолед':'ice cream',
        'ябълка':'apple','череша':'cherry',
        /* Предмети */
        'подарък':'gift','часовник':'clock','камера':'camera','телефон':'phone',
        'очила':'glasses','шапка':'hat','дом':'home','замък':'castle',
        /* Вяра */
        'кръст':'cross','молитва':'prayer','мир':'peace','йога':'yoga',
        /* Игри */
        'игра':'game','шах':'chess','карти':'cards','зар':'dice',
        /* Общи */
        'монета':'coin','пари':'money','смайли':'smiley','усмивка':'smile',
        'слънчоглед':'sunflower','пчела':'bee','паяк':'spider',
      };

      function translateQuery(q) {
        var lower = q.toLowerCase().trim();
        /* 1. Exact full phrase */
        if (BG_EN[lower]) return BG_EN[lower];
        /* 2. Word-by-word translation */
        var translated = lower.split(/\s+/).map(function(w) {
          return BG_EN[w] || w;
        }).join(' ');
        return translated;
      }

      var tabsWrap    = document.getElementById('kc-clipart-tabs');
      var gridWrap    = document.getElementById('kc-clipart-grid');
      var searchInput = document.getElementById('kc-clipart-q');
      var searchBtn   = document.getElementById('kc-clipart-search-btn');
      var activeXhr   = null;

      /* Load an Iconify icon and add as a new icon layer */
      function addIconLayerFromId(iconId) {
        var sel = getSelectedLayer();
        var colorHex = (sel ? sel.color : DEFAULT_COLOR).replace('#', '');
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
          addLayer(makeIconLayer(iconId, img));
        };
        img.onerror = function () {
          /* retry without color param */
          if (img.src.indexOf('?') !== -1) { img.src = iconSvgUrl(iconId); }
        };
        img.src = iconSvgUrl(iconId, colorHex);
      }

      /* Create a single clipart button with a preview image */
      function makeIconBtn(iconId) {
        var btn = document.createElement('button');
        btn.className = 'cfg-clipart-btn';
        btn.type = 'button';
        var namePart = iconId.split(':')[1] || iconId;
        btn.title = namePart.replace(/-/g, ' ');

        var img = document.createElement('img');
        img.src     = iconSvgUrl(iconId, GOLD_HEX);
        img.alt     = btn.title;
        img.loading = 'lazy';
        img.onerror = function () { btn.style.display = 'none'; }; /* hide broken icons */
        btn.appendChild(img);

        btn.addEventListener('click', function () { addIconLayerFromId(iconId); });
        return btn;
      }

      /* Render an array of Iconify IDs into the grid */
      function renderIds(ids) {
        gridWrap.innerHTML = '';
        if (!ids || !ids.length) {
          var empty = document.createElement('p');
          empty.className = 'cfg-clipart-empty';
          empty.textContent = 'Няма резултати. Опитай с друга дума.';
          gridWrap.appendChild(empty);
          return;
        }
        ids.forEach(function (id) { gridWrap.appendChild(makeIconBtn(id)); });
      }

      /* Show a spinner inside the grid */
      function showLoading() {
        gridWrap.innerHTML =
          '<p class="cfg-clipart-empty"><span class="cfg-clipart-spinner"></span>Зарежда…</p>';
      }

      /* Live search via Iconify search API */
      function doSearch(query) {
        query = (query || '').trim();
        if (!query) return;
        query = translateQuery(query);

        /* deactivate all category tabs */
        tabsWrap.querySelectorAll('.cfg-clipart-tab').forEach(function (t) {
          t.classList.remove('is-active');
        });

        if (activeXhr) { try { activeXhr.abort(); } catch (e) {} }
        showLoading();

        var xhr = new XMLHttpRequest();
        activeXhr = xhr;
        /* restrict to monochrome icon sets — "prefixes" (plural) is the correct param */
        var MONO_SETS = 'mdi,ph,tabler,lucide,heroicons,carbon,bi,feather,iconoir,mingcute,ri,material-symbols,ion,fluent';
        xhr.open('GET', ICONIFY + '/search?query=' + encodeURIComponent(query) + '&limit=40&palette=false&prefixes=' + MONO_SETS, true);
        xhr.onreadystatechange = function () {
          if (xhr.readyState !== 4) return;
          activeXhr = null;
          if (xhr.status === 200) {
            try {
              var data = JSON.parse(xhr.responseText);
              renderIds(data.icons || []);
            } catch (e) {
              renderIds([]);
            }
          } else {
            gridWrap.innerHTML =
              '<p class="cfg-clipart-empty">Грешка при зареждане. Провери интернет връзката.</p>';
          }
        };
        xhr.onerror = function () {
          activeXhr = null;
          gridWrap.innerHTML =
            '<p class="cfg-clipart-empty">Няма връзка с библиотеката с икони.</p>';
        };
        xhr.send();
      }

      /* Wire search button and Enter key */
      searchBtn.addEventListener('click', function () { doSearch(searchInput.value); });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); doSearch(this.value); }
      });

      /* Build category pill tabs */
      CLIPART_CATS.forEach(function (cat, idx) {
        var tab = document.createElement('button');
        tab.className = 'cfg-clipart-tab' + (idx === 0 ? ' is-active' : '');
        tab.type      = 'button';
        tab.textContent = cat.label;
        tab.addEventListener('click', function () {
          tabsWrap.querySelectorAll('.cfg-clipart-tab').forEach(function (t) {
            t.classList.remove('is-active');
          });
          tab.classList.add('is-active');
          searchInput.value = '';
          renderIds(cat.ids);
        });
        tabsWrap.appendChild(tab);
      });

      /* Initial render — first category */
      renderIds(CLIPART_CATS[0].ids);
    })();

    /* ── Undo / Redo buttons + keyboard ── */
    document.getElementById('kc-undo').addEventListener('click', undo);
    document.getElementById('kc-redo').addEventListener('click', redo);
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
    });

    /* ── Snap to center ── */
    document.getElementById('kc-snap').addEventListener('click', function () {
      var layer = getSelectedLayer();
      if (!layer) return;
      saveHistory();
      layer.x = 0; layer.y = 0;
      draw();
    });

    /* ── Download preview ── */
    function downloadPreview() {
      var link = document.createElement('a');
      link.download = 'savovpro-preview.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
    document.getElementById('kc-download').addEventListener('click', downloadPreview);
    var kcDownloadOrder = document.getElementById('kc-download-order');
    if (kcDownloadOrder) kcDownloadOrder.addEventListener('click', downloadPreview);

    /* ── Character counters ── */
    function updateCharCount(inputId, val) {
      var max = 24;
      var el  = document.getElementById(inputId + '-count');
      if (!el) return;
      el.textContent = val.length + ' / ' + max;
      el.classList.toggle('is-warn', val.length > max * 0.8);
    }

    /* ── Preload all product images and masks ── */
    Object.values(MODELS).forEach(function (m) {
      getImg(m.src, function () {});
      if (m.mask) getImg(m.mask, function () {});
    });

    /* ── Accordion toggle ── */
    document.querySelectorAll('.cfg-acc-head').forEach(function (head) {
      head.addEventListener('click', function () {
        var acc = head.closest('.cfg-acc');
        var opening = !acc.classList.contains('is-open');
        acc.classList.toggle('is-open', opening);
        head.setAttribute('aria-expanded', String(opening));
      });
    });

    applyCategoryUI();
    renderModelGrid();
    initStartOverButton();

    function finishInit() {
      renderLayersPanel();
      syncControlsToSelectedLayer();
      updateSidesUI();
      updateLinks();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { draw(); saveHistory(); });
      } else {
        setTimeout(function () { draw(); saveHistory(); }, 600);
      }
    }

    restoreDraftFromStorage().then(function (restored) {
      if (!restored) {
        layers = [makeTextLayer({ line1: 'ИМЕ' })];
        selectedLayerId = layers[0].id;
      }
      finishInit();
    });

  })();
