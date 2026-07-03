(function () {
  'use strict';

  if (!window.CFG_CONFIG) return;

  var CFG = window.CFG_CONFIG;
  var canvas = document.getElementById('st-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var CW = canvas.width;
  var CH = canvas.height;

  var layers = [];
  var selectedLayerId = null;
  var selectedLayerIds = [];
  var nextLayerId = 1;
  var elementBoxes = {};
  var layerListDrag = {
    active: false,
    layerId: null,
    item: null,
    ghost: null,
    placeholder: null,
    list: null,
    offsetY: 0,
    ghostLeft: 0,
  };
  var removeBg = CFG.defaults.removeBg !== false;
  var bgTolerance = 40;

  var stickerSize = { widthCm: CFG.defaults.widthCm, heightCm: CFG.defaults.heightCm };
  var VIEW_ZOOM_MIN = 0.4;
  var VIEW_ZOOM_MAX = 6;
  var view = { scale: 1.25, panX: 0, panY: 0 };
  var pinch = { active: false, startDist: 0, startScale: 1 };
  var previewEl = document.querySelector('.st-preview');

  var history = [];
  var historyIdx = -1;
  var MAX_HIST = 40;

  var TEXT_SIZE_MIN = 6;
  var TEXT_SIZE_MAX = 200;
  var TEXT_LAYOUT_FILL_RATIO = 0.98;

  function getTextLayoutArea(rect) {
    return {
      maxW: rect.w * TEXT_LAYOUT_FILL_RATIO,
      maxH: rect.h * TEXT_LAYOUT_FILL_RATIO,
    };
  }

  function normalizeTextLayoutArea(areaOrMaxW, maxH) {
    if (areaOrMaxW && typeof areaOrMaxW === 'object' && areaOrMaxW.maxW != null) {
      return {
        maxW: areaOrMaxW.maxW,
        maxH: areaOrMaxW.maxH != null ? areaOrMaxW.maxH : areaOrMaxW.maxW,
      };
    }
    return {
      maxW: areaOrMaxW,
      maxH: maxH != null ? maxH : areaOrMaxW,
    };
  }

  function getTextSizeMax(rect) {
    return Math.max(TEXT_SIZE_MAX, Math.ceil(Math.max(rect.w, rect.h) * 1.2));
  }
  var ROT_MIN = -360;
  var ROT_MAX = 360;
  var HANDLE_KNOB_PX = 11;
  var HANDLE_HIT_PX = 16;
  var HANDLE_STEM_PX = 26;
  var TEXT_COLOR = '#ffffff';
  var SVG_EXPORT_FILL = '#C9A227';
  var COLOR_OK = { stroke: 'rgba(201,162,39,0.9)', strokeSoft: 'rgba(201,162,39,0.7)', fill: '#C9A227' };
  var COLOR_WARN = { stroke: 'rgba(255,90,90,0.95)', strokeSoft: 'rgba(255,90,90,0.8)', fill: '#ff5a5a' };
  var COLOR_SNAP = 'rgba(255, 120, 200, 0.95)';
  var COLOR_SNAP_STRONG = 'rgba(201, 162, 39, 0.98)';

  var SNAP_POS_PX = 6;
  var SNAP_ROT_DEG = 5;
  var ROT_SNAP_ANGLES = [0, 45, 90, 135, 180, -180, -135, -90, -45];
  var BOUNDS_EPS = 1;
  var DRAFT_KEY = 'savovpro-sticker-draft-v1';
  var UI_MODE_KEY = 'savovpro-sticker-ui-mode';
  var ONBOARDING_KEY = 'savovpro-sticker-onboarding-v1';
  var DRAFT_SAVE_MS = 700;
  var draftSaveTimer = 0;
  var draftSessionDirty = false;
  var snapEnabled = true;
  var uiMode = 'basic';
  var selectionHover = false;
  var lastSelectionHover = false;
  var HANDLE_HIT_TOUCH_MULT = 1.65;
  var HANDLE_KNOB_TOUCH_PX = 13;

  function isCoarsePointer() {
    return window.matchMedia('(pointer: coarse)').matches;
  }

  function getBoundsEpsilon() {
    return Math.max(BOUNDS_EPS, 3 / view.scale);
  }

  var snapGuides = { vLines: [], hLines: [], labels: [], rotationLabel: null };

  function clearSnapGuides() {
    snapGuides.vLines = [];
    snapGuides.hLines = [];
    snapGuides.labels = [];
    snapGuides.rotationLabel = null;
  }

  function getSnapThreshold() {
    return Math.max(SNAP_POS_PX, 7 / view.scale);
  }

  function normalizeDisplayAngle(deg) {
    var n = Math.round(deg);
    while (n > 180) n -= 360;
    while (n <= -180) n += 360;
    if (n === -180) n = 180;
    return n;
  }

  function formatRotLabel(deg) {
    return normalizeDisplayAngle(deg) + '°';
  }

  function snapRotation(deg) {
    var norm = normalizeDisplayAngle(deg);
    var best = norm;
    var snapped = false;
    var i;
    for (i = 0; i < ROT_SNAP_ANGLES.length; i++) {
      var target = ROT_SNAP_ANGLES[i];
      var tNorm = normalizeDisplayAngle(target);
      if (Math.abs(norm - tNorm) <= SNAP_ROT_DEG) {
        best = tNorm;
        snapped = true;
        break;
      }
    }
    return { value: best, snapped: snapped };
  }

  function pushVGuide(x, label, strong, yMin, yMax) {
    snapGuides.vLines.push({ x: x, strong: !!strong, yMin: yMin, yMax: yMax });
    if (label) snapGuides.labels.push({ x: x, y: null, text: label, strong: !!strong, kind: 'v' });
  }

  function pushHGuide(y, label, strong, xMin, xMax) {
    snapGuides.hLines.push({ y: y, strong: !!strong, xMin: xMin, xMax: xMax });
    if (label) snapGuides.labels.push({ x: null, y: y, text: label, strong: !!strong, kind: 'h' });
  }

  function applyAxisMoveSnap(layer, rect, threshold, excludeIds, axis, bounds) {
    var candidates = [];
    var moving = axis === 'x'
      ? [
        { edge: 'left', val: bounds.minX },
        { edge: 'center', val: (bounds.minX + bounds.maxX) / 2 },
        { edge: 'right', val: bounds.maxX },
      ]
      : [
        { edge: 'top', val: bounds.minY },
        { edge: 'center', val: (bounds.minY + bounds.maxY) / 2 },
        { edge: 'bottom', val: bounds.maxY },
      ];

    if (axis === 'x' && Math.abs(layer.x) <= threshold) {
      candidates.push({
        dist: Math.abs(layer.x),
        delta: -layer.x,
        guide: function () { pushVGuide(rect.cx, 'център X', true); },
      });
    }
    if (axis === 'y' && Math.abs(layer.y) <= threshold) {
      candidates.push({
        dist: Math.abs(layer.y),
        delta: -layer.y,
        guide: function () { pushHGuide(rect.cy, 'център Y', true); },
      });
    }

    var stickerTargets = axis === 'x'
      ? [
        { edge: 'left', val: rect.x, label: 'ляво', strong: false },
        { edge: 'right', val: rect.x + rect.w, label: 'дясно', strong: false },
        { edge: 'center', val: rect.cx, label: 'център X', strong: true },
      ]
      : [
        { edge: 'top', val: rect.y, label: 'горе', strong: false },
        { edge: 'bottom', val: rect.y + rect.h, label: 'долу', strong: false },
        { edge: 'center', val: rect.cy, label: 'център Y', strong: true },
      ];

    moving.forEach(function (mp) {
      stickerTargets.forEach(function (tp) {
        var dist = Math.abs(mp.val - tp.val);
        if (dist > threshold) return;
        candidates.push({
          dist: dist,
          delta: tp.val - mp.val,
          guide: function () {
            if (axis === 'x') pushVGuide(tp.val, tp.label, tp.strong);
            else pushHGuide(tp.val, tp.label, tp.strong);
          },
        });
      });
    });

    layers.forEach(function (other) {
      if (!other.visible || excludeIds.indexOf(other.id) >= 0) return;
      var ob = getLayerWorldBounds(getLayerContentBox(other, rect));
      if (!ob) return;
      var otherTargets = axis === 'x'
        ? [
          { edge: 'left', val: ob.minX },
          { edge: 'center', val: (ob.minX + ob.maxX) / 2 },
          { edge: 'right', val: ob.maxX },
        ]
        : [
          { edge: 'top', val: ob.minY },
          { edge: 'center', val: (ob.minY + ob.maxY) / 2 },
          { edge: 'bottom', val: ob.maxY },
        ];
      moving.forEach(function (mp) {
        otherTargets.forEach(function (tp) {
          var dist = Math.abs(mp.val - tp.val);
          if (dist > threshold) return;
          var spanMin;
          var spanMax;
          if (axis === 'x') {
            spanMin = Math.min(bounds.minY, bounds.maxY, ob.minY, ob.maxY);
            spanMax = Math.max(bounds.minY, bounds.maxY, ob.minY, ob.maxY);
          } else {
            spanMin = Math.min(bounds.minX, bounds.maxX, ob.minX, ob.maxX);
            spanMax = Math.max(bounds.minX, bounds.maxX, ob.minX, ob.maxX);
          }
          candidates.push({
            dist: dist,
            delta: tp.val - mp.val,
            guide: function () {
              if (axis === 'x') pushVGuide(tp.val, null, true, spanMin, spanMax);
              else pushHGuide(tp.val, null, true, spanMin, spanMax);
            },
          });
        });
      });
    });

    if (!candidates.length) return false;
    candidates.sort(function (a, b) { return a.dist - b.dist; });
    var best = candidates[0];
    if (axis === 'x') layer.x += best.delta;
    else layer.y += best.delta;
    best.guide();
    return true;
  }

  function applyMoveSnap(layer, rect, threshold, excludeIds) {
    if (!snapEnabled || !layer) return;
    excludeIds = excludeIds || [layer.id];
    var box = getLayerContentBox(layer, rect);
    var bounds = getLayerWorldBounds(box);
    if (!bounds) return;

    var snappedX = applyAxisMoveSnap(layer, rect, threshold, excludeIds, 'x', bounds);
    box = getLayerContentBox(layer, rect);
    bounds = getLayerWorldBounds(box);
    if (!bounds) return;
    var snappedY = applyAxisMoveSnap(layer, rect, threshold, excludeIds, 'y', bounds);

    if (snappedX && snappedY && Math.abs(layer.x) <= threshold && Math.abs(layer.y) <= threshold) {
      snapGuides.labels.push({
        x: rect.cx,
        y: rect.cy - rect.h / 2 - 10 / view.scale,
        text: 'център',
        strong: true,
        kind: 'badge',
      });
    }
  }

  function drawSnapGuides(rect) {
    if (!snapGuides.vLines.length && !snapGuides.hLines.length && !snapGuides.rotationLabel) return;

    ctx.save();
    ctx.lineWidth = 1 / view.scale;
    ctx.setLineDash([5 / view.scale, 4 / view.scale]);
    ctx.font = '600 ' + Math.max(9, 10 / view.scale) + 'px Montserrat, sans-serif';

    snapGuides.vLines.forEach(function (line) {
      ctx.strokeStyle = line.strong ? COLOR_SNAP_STRONG : COLOR_SNAP;
      ctx.beginPath();
      var y1 = line.yMin != null ? line.yMin - 8 / view.scale : rect.y - 8 / view.scale;
      var y2 = line.yMax != null ? line.yMax + 8 / view.scale : rect.y + rect.h + 8 / view.scale;
      ctx.moveTo(line.x, y1);
      ctx.lineTo(line.x, y2);
      ctx.stroke();
    });

    snapGuides.hLines.forEach(function (line) {
      ctx.strokeStyle = line.strong ? COLOR_SNAP_STRONG : COLOR_SNAP;
      ctx.beginPath();
      var x1 = line.xMin != null ? line.xMin - 8 / view.scale : rect.x - 8 / view.scale;
      var x2 = line.xMax != null ? line.xMax + 8 / view.scale : rect.x + rect.w + 8 / view.scale;
      ctx.moveTo(x1, line.y);
      ctx.lineTo(x2, line.y);
      ctx.stroke();
    });

    ctx.setLineDash([]);
    snapGuides.labels.forEach(function (lb) {
      var color = lb.strong ? COLOR_SNAP_STRONG : COLOR_SNAP;
      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 3 / view.scale;
      var tx = lb.x != null ? lb.x : rect.cx;
      var ty = lb.y != null ? lb.y : (lb.kind === 'h' ? lb.y : rect.y - 12 / view.scale);
      if (lb.kind === 'v') ty = rect.y - 12 / view.scale;
      if (lb.kind === 'h') tx = rect.x + rect.w + 10 / view.scale;
      if (lb.kind === 'badge') { tx = lb.x; ty = lb.y; }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(lb.text, tx, ty);
      ctx.fillText(lb.text, tx, ty);
    });

    if (snapGuides.rotationLabel) {
      var rl = snapGuides.rotationLabel;
      ctx.fillStyle = rl.strong ? COLOR_SNAP_STRONG : 'rgba(255,255,255,0.92)';
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 3 / view.scale;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.strokeText(rl.text, rl.x, rl.y);
      ctx.fillText(rl.text, rl.x, rl.y);
    }

    ctx.restore();
  }

  var ptr = {
    active: false, mode: null, layerId: null,
    startX: 0, startY: 0, ox: 0, oy: 0,
    startAngle: 0, startRotation: 0, startDist: 0, startScale: 0,
    panOx: 0, panOy: 0, panClickSelect: false,
  };
  var spacePan = false;

  var TYPE_SVG = {
    text: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4v3h5.5v12h3V7H19V4z"/></svg>',
    image: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    vector: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 12 12 22 2 12"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>',
  };
  var EYE_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>';
  var DUP_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

  document.title = 'SAVOV PRO — ' + CFG.title;
  var titleEl = document.getElementById('cfg-category-title');
  if (titleEl) titleEl.textContent = CFG.title;

  function escHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getLayerText(layer) {
    if (layer.text != null) return layer.text;
    if (layer.line1 != null || layer.line2) {
      var l1 = layer.line1 || '';
      var l2 = layer.line2 || '';
      return l2 ? l1 + '\n' + l2 : l1;
    }
    return layer.text || '';
  }

  function getTextLines(layer) {
    return getLayerText(layer).split(/\r?\n/);
  }

  function getNextTextLayerNumber() {
    var max = 0;
    layers.forEach(function (l) {
      if (l.type !== 'text') return;
      var m = /^текст(\d+)$/i.exec(String(l.name || '').trim());
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return max + 1;
  }

  function defaultTextLayerLabel(num) {
    return 'текст' + num;
  }

  function textLayerDisplayName(layer) {
    var name = (layer && layer.name) ? String(layer.name).trim() : '';
    if (!name) name = 'текст';
    if (name.length > 20) return name.slice(0, 18) + '…';
    return name;
  }

  function makeTextLayer(opts) {
    opts = opts || {};
    var num = opts.layerNum != null ? opts.layerNum : getNextTextLayerNumber();
    var label = defaultTextLayerLabel(num);
    var txt = opts.text !== undefined ? opts.text
      : opts.line1 !== undefined ? (opts.line2 ? opts.line1 + '\n' + opts.line2 : opts.line1)
      : (CFG.defaults.defaultText || 'SAVOV PRO\nMade for you');
    return {
      id: nextLayerId++,
      type: 'text',
      name: label,
      text: txt,
      textAlign: opts.textAlign || 'center',
      font: opts.font || CFG.defaults.font || 'Montserrat',
      size: opts.size !== undefined ? opts.size : 22,
      letterSpacing: opts.letterSpacing || 0,
      x: opts.x || 0, y: opts.y || 0,
      rotation: opts.rotation || 0,
      visible: true,
    };
  }

  function isIconifyId(id) {
    return !!id && /^[a-z0-9-]+:[a-z0-9-]+$/i.test(id);
  }

  function iconifySvgUrl(iconId) {
    if (!isIconifyId(iconId)) return null;
    var parts = iconId.split(':');
    return 'https://api.iconify.design/' + encodeURIComponent(parts[0]) + '/' + encodeURIComponent(parts[1]) + '.svg';
  }

  function tintMonochromeImage(lc, img, x, y, uW, uH, color) {
    lc.drawImage(img, x, y, uW, uH);
    lc.globalCompositeOperation = 'source-in';
    lc.fillStyle = color;
    lc.fillRect(x, y, uW, uH);
  }

  function fetchIconifyVectorData(iconId) {
    var url = iconifySvgUrl(iconId);
    if (!url || !window.ST_VECTOR || !ST_VECTOR.parseSvgPaths) {
      return Promise.reject(new Error('vector unavailable'));
    }
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    }).then(function (svgText) {
      var vd = ST_VECTOR.parseSvgPaths(svgText);
      if (!vd || !vd.paths || !vd.paths.length) throw new Error('no paths');
      return vd;
    });
  }

  function buildVectorLayerFromDraft(data, vd) {
    return {
      id: data.id,
      type: 'vector',
      name: data.name || (data.fileName || 'icon').split(':').pop().replace(/-/g, ' '),
      fileName: data.fileName || 'icon.svg',
      paths: vd.paths.slice(),
      viewW: vd.viewW,
      viewH: vd.viewH,
      offsetX: vd.offsetX || 0,
      offsetY: vd.offsetY || 0,
      contentW: vd.contentW || vd.viewW,
      contentH: vd.contentH || vd.viewH,
      pathCount: vd.pathCount || vd.paths.length,
      size: data.size != null ? data.size : 1,
      x: data.x || 0,
      y: data.y || 0,
      rotation: data.rotation || 0,
      visible: data.visible !== false,
    };
  }

  function addClipartIconLayer(iconId) {
    fetchIconifyVectorData(iconId).then(function (vd) {
      var namePart = iconId.split(':')[1] || iconId;
      addLayer(makeVectorLayer(iconId, vd, { name: namePart.replace(/-/g, ' ') }));
    }).catch(function (err) {
      console.warn('Clipart vector load failed:', iconId, err);
      window.alert('Иконата не може да се зареди. Провери интернет връзката и опитай отново.');
    });
  }

  function makeImageLayer(imgEl, fileName, isSvg, opts) {
    opts = opts || {};
    return {
      id: nextLayerId++,
      type: 'image',
      name: fileName || 'Файл',
      imgEl: imgEl,
      fileName: fileName,
      isSvg: !!isSvg,
      stickerProcessed: !!opts.stickerProcessed,
      size: opts.size !== undefined ? opts.size : 1,
      x: opts.x || 0, y: opts.y || 0,
      rotation: opts.rotation || 0,
      visible: true,
    };
  }

  function makeVectorLayer(fileName, vectorData, opts) {
    opts = opts || {};
    var contentW = vectorData.contentW || vectorData.viewW || 1;
    var contentH = vectorData.contentH || vectorData.viewH || 1;
    return {
      id: nextLayerId++,
      type: 'vector',
      name: opts.name || fileName || 'Вектор',
      fileName: fileName || 'vector.svg',
      paths: (vectorData.paths || []).slice(),
      viewW: vectorData.viewW || contentW,
      viewH: vectorData.viewH || contentH,
      offsetX: vectorData.offsetX || 0,
      offsetY: vectorData.offsetY || 0,
      contentW: contentW,
      contentH: contentH,
      pathCount: vectorData.pathCount || (vectorData.paths || []).length,
      size: opts.size !== undefined ? opts.size : 1,
      x: opts.x || 0, y: opts.y || 0,
      rotation: opts.rotation || 0,
      visible: true,
    };
  }

  function cloneVectorData(data) {
    return {
      paths: (data.paths || []).slice(),
      viewW: data.viewW,
      viewH: data.viewH,
    };
  }

  function snapshotLayers() {
    return layers.map(function (l) {
      var c = {};
      for (var k in l) c[k] = l[k];
      return c;
    });
  }

  function restoreLayers(snap) {
    layers = snap.map(function (l) {
      var c = {};
      for (var k in l) c[k] = l[k];
      if (c.type === 'text' && c.text == null && (c.line1 != null || c.line2)) {
        c.text = c.line2 ? (c.line1 || '') + '\n' + c.line2 : (c.line1 || '');
      }
      return c;
    });
    var maxId = 0;
    layers.forEach(function (l) { if (l.id > maxId) maxId = l.id; });
    if (maxId >= nextLayerId) nextLayerId = maxId + 1;
  }

  function saveHistory(markDraft) {
    var snap = { layers: snapshotLayers(), sel: selectedLayerId, sels: selectedLayerIds.slice() };
    history = history.slice(0, historyIdx + 1);
    history.push(snap);
    if (history.length > MAX_HIST) history.shift();
    historyIdx = history.length - 1;
    updateUndoRedoBtns();
    if (markDraft !== false) markDraftDirty();
    else scheduleDraftSave();
  }

  function serializeLayerForDraft(layer) {
    if (layer.type === 'text') {
      return {
        id: layer.id,
        type: 'text',
        name: layer.name,
        text: layer.text,
        textAlign: layer.textAlign,
        font: layer.font,
        size: layer.size,
        letterSpacing: layer.letterSpacing,
        x: layer.x,
        y: layer.y,
        rotation: layer.rotation,
        visible: layer.visible,
      };
    }
    if (layer.type === 'image') {
      return {
        id: layer.id,
        type: 'image',
        name: layer.name,
        fileName: layer.fileName,
        isSvg: layer.isSvg,
        stickerProcessed: !!layer.stickerProcessed,
        size: layer.size,
        x: layer.x,
        y: layer.y,
        rotation: layer.rotation,
        visible: layer.visible,
        dataUrl: layer.imgEl && layer.imgEl.src ? layer.imgEl.src : null,
      };
    }
    if (layer.type === 'vector') {
      return {
        id: layer.id,
        type: 'vector',
        name: layer.name,
        fileName: layer.fileName,
        paths: layer.paths,
        viewW: layer.viewW,
        viewH: layer.viewH,
        offsetX: layer.offsetX || 0,
        offsetY: layer.offsetY || 0,
        contentW: layer.contentW || layer.viewW,
        contentH: layer.contentH || layer.viewH,
        pathCount: layer.pathCount || (layer.paths || []).length,
        size: layer.size,
        x: layer.x,
        y: layer.y,
        rotation: layer.rotation,
        visible: layer.visible,
      };
    }
    return null;
  }

  function buildDraftPayload() {
    return {
      v: 1,
      touched: true,
      savedAt: Date.now(),
      stickerSize: { widthCm: stickerSize.widthCm, heightCm: stickerSize.heightCm },
      view: { scale: view.scale, panX: view.panX, panY: view.panY },
      removeBg: removeBg,
      bgTolerance: bgTolerance,
      snapEnabled: snapEnabled,
      uiMode: uiMode,
      nextLayerId: nextLayerId,
      selectedLayerId: selectedLayerId,
      selectedLayerIds: selectedLayerIds.slice(),
      layers: layers.map(serializeLayerForDraft).filter(Boolean),
    };
  }

  function normalizeDraftLayerForCompare(layer) {
    if (!layer) return null;
    if (layer.type === 'text') {
      return {
        type: 'text',
        text: String(layer.text != null ? layer.text : '').trim(),
        font: layer.font || CFG.defaults.font || 'Montserrat',
        textAlign: layer.textAlign || 'center',
        letterSpacing: layer.letterSpacing || 0,
      };
    }
    if (layer.type === 'vector') {
      return {
        type: 'vector',
        fileName: layer.fileName || layer.name || '',
        pathCount: layer.pathCount || (layer.paths || []).length,
      };
    }
    if (layer.type === 'image') {
      return {
        type: 'image',
        fileName: layer.fileName || layer.name || '',
        isSvg: !!layer.isSvg,
      };
    }
    return { type: layer.type || 'unknown' };
  }

  function draftContentSignature(payload) {
    payload = payload || buildDraftPayload();
    var size = payload.stickerSize || {};
    return JSON.stringify({
      w: Number(size.widthCm) || 0,
      h: Number(size.heightCm) || 0,
      ui: payload.uiMode || 'basic',
      layers: (payload.layers || []).map(normalizeDraftLayerForCompare).filter(Boolean),
    });
  }

  function defaultDraftContentSignature() {
    return draftContentSignature({
      stickerSize: {
        widthCm: CFG.defaults.widthCm,
        heightCm: CFG.defaults.heightCm,
      },
      uiMode: 'basic',
      layers: [{
        type: 'text',
        text: CFG.defaults.defaultText || 'SAVOV PRO\nMade for you',
        font: CFG.defaults.font || 'Montserrat',
        textAlign: 'center',
        letterSpacing: 0,
      }],
    });
  }

  function isMeaningfulStoredDraft(draft) {
    if (!draft || !draft.layers || !draft.layers.length) return false;
    if (draft.touched) return true;
    return draftContentSignature(draft) !== defaultDraftContentSignature();
  }

  function markDraftDirty() {
    draftSessionDirty = true;
    scheduleDraftSave();
  }

  function scheduleDraftSave() {
    if (draftSaveTimer) clearTimeout(draftSaveTimer);
    draftSaveTimer = setTimeout(function () {
      draftSaveTimer = 0;
      if (!draftSessionDirty) {
        clearDraftStorage();
        return;
      }
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraftPayload()));
      } catch (e) { /* quota / private mode */ }
    }, DRAFT_SAVE_MS);
  }

  function restoreTextLayerFromDraft(data) {
    return {
      id: data.id,
      type: 'text',
      name: data.name || defaultTextLayerLabel(data.id),
      text: data.text != null ? data.text : '',
      textAlign: data.textAlign || 'center',
      font: data.font || CFG.defaults.font || 'Montserrat',
      size: data.size != null ? data.size : 22,
      letterSpacing: data.letterSpacing || 0,
      x: data.x || 0,
      y: data.y || 0,
      rotation: data.rotation || 0,
      visible: data.visible !== false,
    };
  }

  function restoreVectorLayerFromDraft(data) {
    if (!data.paths || !data.paths.length) return null;
    return {
      id: data.id,
      type: 'vector',
      name: data.name || data.fileName || 'Вектор',
      fileName: data.fileName || data.name || 'vector.svg',
      paths: data.paths.slice(),
      viewW: data.viewW || 1,
      viewH: data.viewH || 1,
      offsetX: data.offsetX || 0,
      offsetY: data.offsetY || 0,
      contentW: data.contentW || data.viewW || 1,
      contentH: data.contentH || data.viewH || 1,
      pathCount: data.pathCount || (data.paths || []).length,
      size: data.size != null ? data.size : 1,
      x: data.x || 0,
      y: data.y || 0,
      rotation: data.rotation || 0,
      visible: data.visible !== false,
    };
  }

  function loadImageLayerFromDraft(data) {
    return new Promise(function (resolve) {
      if (isIconifyId(data.fileName)) {
        fetchIconifyVectorData(data.fileName).then(function (vd) {
          resolve(buildVectorLayerFromDraft(data, vd));
        }).catch(function () {
          if (!data.dataUrl) {
            resolve(null);
            return;
          }
          loadRasterImageLayerFromDraft(data).then(resolve);
        });
        return;
      }
      if (!data.dataUrl) {
        resolve(null);
        return;
      }
      loadRasterImageLayerFromDraft(data).then(resolve);
    });
  }

  function loadRasterImageLayerFromDraft(data) {
    return new Promise(function (resolve) {
      if (!data.dataUrl) {
        resolve(null);
        return;
      }
      var img = new Image();
      if (data.dataUrl.indexOf('api.iconify.design') !== -1) img.crossOrigin = 'anonymous';
      img.onload = function () {
        resolve({
          id: data.id,
          type: 'image',
          name: data.name || data.fileName || 'Файл',
          imgEl: img,
          fileName: data.fileName || data.name || 'Файл',
          isSvg: !!data.isSvg,
          stickerProcessed: data.stickerProcessed != null ? !!data.stickerProcessed : !data.isSvg,
          size: data.size != null ? data.size : 1,
          x: data.x || 0,
          y: data.y || 0,
          rotation: data.rotation || 0,
          visible: data.visible !== false,
        });
      };
      img.onerror = function () { resolve(null); };
      img.src = data.dataUrl;
    });
  }

  function applyDraftMeta(draft) {
    if (draft.stickerSize) {
      stickerSize.widthCm = draft.stickerSize.widthCm;
      stickerSize.heightCm = draft.stickerSize.heightCm;
    }
    if (draft.view) {
      view.scale = draft.view.scale != null ? draft.view.scale : view.scale;
      view.panX = draft.view.panX || 0;
      view.panY = draft.view.panY || 0;
    }
    if (draft.removeBg != null) removeBg = draft.removeBg;
    if (draft.bgTolerance != null) bgTolerance = draft.bgTolerance;
    if (draft.snapEnabled != null) snapEnabled = !!draft.snapEnabled;
    if (draft.uiMode === 'advanced' || draft.uiMode === 'basic') uiMode = draft.uiMode;
    if (draft.nextLayerId != null) nextLayerId = draft.nextLayerId;
    selectedLayerIds = draft.selectedLayerIds && draft.selectedLayerIds.length
      ? draft.selectedLayerIds.slice()
      : (draft.selectedLayerId ? [draft.selectedLayerId] : []);
    selectedLayerId = draft.selectedLayerId || (selectedLayerIds.length ? selectedLayerIds[selectedLayerIds.length - 1] : null);

    var wEl = document.getElementById('st-width');
    var hEl = document.getElementById('st-height');
    if (wEl) wEl.value = String(stickerSize.widthCm);
    if (hEl) hEl.value = String(stickerSize.heightCm);
    syncSizeInputsToState();
    updateSnapToggleUi();
    setUiMode(uiMode, { skipSave: true });
    updateZoomUI();
    updateQuickSizeButtons();
    updatePriceDisplay();
  }

  function hideDraftNotice() {
    var el = document.getElementById('st-draft-notice');
    if (!el) return;
    el.hidden = true;
    clearTimeout(showDraftRestoredNotice._timer);
  }

  function showDraftRestoredNotice() {
    var el = document.getElementById('st-draft-notice');
    if (!el) return;
    el.hidden = false;
    clearTimeout(showDraftRestoredNotice._timer);
    showDraftRestoredNotice._timer = setTimeout(hideDraftNotice, 4500);
  }

  function clearDraftStorage() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
  }

  function parseDraftFromStorage() {
    var raw;
    try {
      raw = localStorage.getItem(DRAFT_KEY);
    } catch (e) {
      return null;
    }
    if (!raw) return null;
    try {
      var draft = JSON.parse(raw);
      if (!draft || !draft.layers || !draft.layers.length) return null;
      return draft;
    } catch (e) {
      return null;
    }
  }

  function hasDraftInStorage() {
    var draft = parseDraftFromStorage();
    if (!draft) return false;
    return isMeaningfulStoredDraft(draft);
  }

  function renderDraftResumeSummary() {
    var summaryEl = document.getElementById('st-draft-resume-summary');
    var draft = parseDraftFromStorage();
    if (!summaryEl || !draft) return;
    var lines = [];
    var w = draft.stickerSize && draft.stickerSize.widthCm;
    var h = draft.stickerSize && draft.stickerSize.heightCm;
    if (w && h) lines.push('<div><strong>Размер:</strong> ' + w + ' × ' + h + ' cm</div>');
    lines.push('<div><strong>Слоеве:</strong> ' + draft.layers.length + '</div>');
    if (draft.savedAt) {
      var when = new Date(draft.savedAt);
      if (!isNaN(when.getTime())) {
        lines.push('<div><strong>Запазен:</strong> ' + when.toLocaleString('bg-BG') + '</div>');
      }
    }
    summaryEl.innerHTML = lines.join('');
  }

  function closeDraftResumeDialog() {
    var dialog = document.getElementById('st-draft-resume-dialog');
    if (dialog && dialog.open) dialog.close();
  }

  function openDraftResumeDialog() {
    var dialog = document.getElementById('st-draft-resume-dialog');
    if (!dialog) return;
    renderDraftResumeSummary();
    if (typeof dialog.showModal === 'function') dialog.showModal();
  }

  function bootFreshSession() {
    openSetupWizard();
  }

  function continueWithSavedDraft() {
    closeDraftResumeDialog();
    restoreDraftFromStorage().then(function (restored) {
      if (restored) {
        draftSessionDirty = true;
        finishInitAfterLayers();
      } else {
        bootFreshSession();
      }
    });
  }

  function startNewFromDraftPrompt() {
    closeDraftResumeDialog();
    clearDraftStorage();
    draftSessionDirty = false;
    hideDraftNotice();
    resetDesignShellForWizard();
    openSetupWizard();
  }

  function initDraftResumeDialog() {
    var dialog = document.getElementById('st-draft-resume-dialog');
    if (!dialog) return;
    on('st-draft-resume-continue', 'click', continueWithSavedDraft);
    on('st-draft-resume-new', 'click', startNewFromDraftPrompt);
    dialog.addEventListener('cancel', function (e) {
      e.preventDefault();
    });
  }

  function resetToDefaultDesign() {
    layers = [];
    selectedLayerIds = [];
    selectedLayerId = null;
    nextLayerId = 1;
    stickerSize.widthCm = CFG.defaults.widthCm;
    stickerSize.heightCm = CFG.defaults.heightCm;
    view.scale = 1.25;
    view.panX = 0;
    view.panY = 0;
    removeBg = CFG.defaults.removeBg !== false;
    bgTolerance = 40;
    snapEnabled = true;
    history = [];
    historyIdx = -1;

    var wEl = document.getElementById('st-width');
    var hEl = document.getElementById('st-height');
    if (wEl) wEl.value = String(stickerSize.widthCm);
    if (hEl) hEl.value = String(stickerSize.heightCm);
    syncSizeInputsToState();

    updateSnapToggleUi();
    updateZoomUI();
    updateQuickSizeButtons();
    hideDraftNotice();
    addLayer(makeTextLayer(), true);
    saveHistory(false);
    updateAlignButtons();
    updatePriceDisplay();
    updateLinks();
    drawPreview();
  }

  function startOver() {
    if (!window.confirm('Да изтрием ли текущия дизайн и да започнем отначало?')) return;
    clearDraftStorage();
    draftSessionDirty = false;
    resetDesignShellForWizard();
    openSetupWizard();
  }

  function initStartOverButton() {
    var btn = document.getElementById('st-start-over');
    if (btn) btn.addEventListener('click', startOver);
  }

  function restoreDraftFromStorage() {
    var draft = parseDraftFromStorage();
    if (!draft) return Promise.resolve(false);

    return Promise.all(draft.layers.map(function (data) {
      if (data.type === 'text') return Promise.resolve(restoreTextLayerFromDraft(data));
      if (data.type === 'vector') return Promise.resolve(restoreVectorLayerFromDraft(data));
      if (data.type === 'image') return loadImageLayerFromDraft(data);
      return Promise.resolve(null);
    })).then(function (restoredLayers) {
      var nextLayers = restoredLayers.filter(Boolean);
      if (!nextLayers.length) return false;
      layers = nextLayers;
      applyDraftMeta(draft);
      renderLayersPanel();
      syncControlsToSelectedLayer();
      updateAlignButtons();
      drawPreview();
      updateLinks();
      return true;
    });
  }

  function updateSnapToggleUi() {
    var btn = document.getElementById('st-snap-guides');
    if (!btn) return;
    btn.classList.toggle('is-active', snapEnabled);
    btn.setAttribute('aria-pressed', String(snapEnabled));
    btn.title = snapEnabled ? 'Магнитно подравняване: вкл.' : 'Магнитно подравняване: изкл.';
  }

  function setUiMode(mode, opts) {
    opts = opts || {};
    uiMode = mode === 'advanced' ? 'advanced' : 'basic';
    var layout = document.getElementById('st-layout');
    if (layout) {
      layout.classList.toggle('st-mode-basic', uiMode === 'basic');
      layout.classList.toggle('st-mode-advanced', uiMode === 'advanced');
    }
    var basicBtn = document.getElementById('st-mode-basic');
    var advBtn = document.getElementById('st-mode-advanced');
    if (basicBtn) {
      basicBtn.classList.toggle('is-active', uiMode === 'basic');
      basicBtn.setAttribute('aria-pressed', String(uiMode === 'basic'));
    }
    if (advBtn) {
      advBtn.classList.toggle('is-active', uiMode === 'advanced');
      advBtn.setAttribute('aria-pressed', String(uiMode === 'advanced'));
    }
    if (!opts.skipSave) {
      try { localStorage.setItem(UI_MODE_KEY, uiMode); } catch (e) { /* ignore */ }
      markDraftDirty();
    }
  }

  function initUiModeToggle() {
    try {
      var saved = localStorage.getItem(UI_MODE_KEY);
      if (saved === 'advanced' || saved === 'basic') uiMode = saved;
    } catch (e) { /* ignore */ }
    setUiMode(uiMode, { skipSave: true });
    var basicBtn = document.getElementById('st-mode-basic');
    var advBtn = document.getElementById('st-mode-advanced');
    if (basicBtn) basicBtn.addEventListener('click', function () { setUiMode('basic'); });
    if (advBtn) advBtn.addEventListener('click', function () { setUiMode('advanced'); });
  }

  function initOnboarding() {
    var card = document.getElementById('st-onboarding');
    if (!card) return;
    var seen = false;
    try { seen = localStorage.getItem(ONBOARDING_KEY) === '1'; } catch (e) { /* ignore */ }
    if (seen) card.classList.add('is-dismissed');

    document.addEventListener('click', function (e) {
      if (!e.target.closest('#st-onboarding-dismiss')) return;
      card.classList.add('is-dismissed');
      try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch (err) { /* ignore */ }
    });
  }

  var setupWizardState = {
    stepIndex: 0,
    widthCm: 20,
    heightCm: 10,
    contentType: 'text',
    text: '',
    svgFileName: '',
    svgVectorData: null,
  };

  function markSetupWizardDone() {
    try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch (e) { /* ignore */ }
    var card = document.getElementById('st-onboarding');
    if (card) card.classList.add('is-dismissed');
  }

  function resetDesignShellForWizard() {
    draftSessionDirty = false;
    layers = [];
    selectedLayerIds = [];
    selectedLayerId = null;
    nextLayerId = 1;
    history = [];
    historyIdx = -1;
    hideDraftNotice();
    hideWizardFollowup();
    renderLayersPanel();
    syncControlsToSelectedLayer();
    drawPreview();
  }

  function hideWizardFollowup() {
    var el = document.getElementById('st-wizard-followup');
    if (!el) return;
    el.hidden = true;
    el.textContent = '';
    clearTimeout(hideWizardFollowup._timer);
  }

  function showWizardFollowup(message) {
    var el = document.getElementById('st-wizard-followup');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    clearTimeout(hideWizardFollowup._timer);
    hideWizardFollowup._timer = setTimeout(hideWizardFollowup, 8000);
  }

  function wizardStepIds() {
    var steps = ['intro', 'size', 'content'];
    if (setupWizardState.contentType === 'text' || setupWizardState.contentType === 'both') {
      steps.push('text');
    }
    if (setupWizardState.contentType === 'svg' || setupWizardState.contentType === 'both') {
      steps.push('svg');
    }
    steps.push('done');
    return steps;
  }

  function wizardCurrentStepId() {
    var steps = wizardStepIds();
    return steps[setupWizardState.stepIndex] || 'done';
  }

  function syncSetupWizardFromInputs() {
    var wEl = document.getElementById('st-wizard-width');
    var hEl = document.getElementById('st-wizard-height');
    var textEl = document.getElementById('st-wizard-text');
    if (wEl) setupWizardState.widthCm = parseFloat(wEl.value) || CFG.defaults.widthCm;
    if (hEl) setupWizardState.heightCm = parseFloat(hEl.value) || CFG.defaults.heightCm;
    if (textEl) setupWizardState.text = textEl.value;
  }

  function syncSetupWizardToInputs() {
    var wEl = document.getElementById('st-wizard-width');
    var hEl = document.getElementById('st-wizard-height');
    var textEl = document.getElementById('st-wizard-text');
    if (wEl) wEl.value = String(setupWizardState.widthCm);
    if (hEl) hEl.value = String(setupWizardState.heightCm);
    if (textEl && !textEl.value && setupWizardState.text) textEl.value = setupWizardState.text;
    updateWizardQuickSizeButtons();
    updateWizardSvgUploadUi();
    applyWizardTextFontPreview();
  }

  function clearWizardSvgUploadState() {
    setupWizardState.svgFileName = '';
    setupWizardState.svgVectorData = null;
    var fileEl = document.getElementById('st-wizard-svg-file');
    if (fileEl) fileEl.value = '';
    updateWizardSvgUploadUi();
  }

  function updateWizardSvgUploadUi() {
    var nameEl = document.getElementById('st-wizard-svg-name');
    if (!nameEl) return;
    if (setupWizardState.svgFileName && setupWizardState.svgVectorData) {
      nameEl.textContent = setupWizardState.svgFileName;
      nameEl.classList.add('is-ready');
      nameEl.classList.remove('is-error');
      return;
    }
    nameEl.textContent = 'Няма избран файл';
    nameEl.classList.remove('is-ready', 'is-error');
  }

  function parseWizardSvgFile(file, callback) {
    if (!isSvgUploadFile(file)) {
      callback(new Error(SVG_UPLOAD_ONLY_MSG));
      return;
    }
    readFileAsText(file, function (err, text) {
      if (err || !text) {
        callback(new Error('Файлът не може да се прочете.'));
        return;
      }
      if (window.ST_VECTOR && ST_VECTOR.prepareSvgImport) {
        var svgImport = ST_VECTOR.prepareSvgImport(text);
        if (svgImport.rasterOnly) {
          callback(new Error('Този SVG съдържа само вградена снимка, без path контури. Експортирай отново като векторен SVG.'));
          return;
        }
        var vd = svgImport.vectorData;
        if (vd && vd.paths && vd.paths.length) {
          callback(null, { fileName: file.name, vectorData: vd });
          return;
        }
      } else {
        var legacyVd = (window.ST_VECTOR && ST_VECTOR.parseSvgPaths)
          ? ST_VECTOR.parseSvgPaths(text)
          : null;
        if (legacyVd && legacyVd.paths && legacyVd.paths.length) {
          callback(null, { fileName: file.name, vectorData: legacyVd });
          return;
        }
      }
      callback(new Error('SVG файлът няма path елементи. Нужен е векторен SVG с контури.'));
    });
  }

  function handleWizardSvgFile(file) {
    if (!file) return;
    var nameEl = document.getElementById('st-wizard-svg-name');
    parseWizardSvgFile(file, function (err, result) {
      if (err) {
        setupWizardState.svgFileName = '';
        setupWizardState.svgVectorData = null;
        if (nameEl) {
          nameEl.textContent = err.message || 'Грешка при файла';
          nameEl.classList.add('is-error');
          nameEl.classList.remove('is-ready');
        }
        return;
      }
      setupWizardState.svgFileName = result.fileName;
      setupWizardState.svgVectorData = result.vectorData;
      updateWizardSvgUploadUi();
    });
  }

  function updateWizardQuickSizeButtons() {
    var wrap = document.getElementById('st-wizard-quick-sizes');
    if (!wrap) return;
    wrap.querySelectorAll('.st-pill-btn').forEach(function (btn) {
      var w = parseFloat(btn.dataset.w);
      var h = parseFloat(btn.dataset.h);
      btn.classList.toggle('is-active', w === setupWizardState.widthCm && h === setupWizardState.heightCm);
    });
  }

  function renderWizardQuickSizes() {
    var wrap = document.getElementById('st-wizard-quick-sizes');
    if (!wrap) return;
    wrap.innerHTML = '';
    (CFG.quickSizes || []).forEach(function (sz) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'st-pill-btn';
      btn.dataset.w = String(sz.w);
      btn.dataset.h = String(sz.h);
      btn.textContent = sz.label + ' cm';
      btn.addEventListener('click', function () {
        setupWizardState.widthCm = sz.w;
        setupWizardState.heightCm = sz.h;
        syncSetupWizardToInputs();
      });
      wrap.appendChild(btn);
    });
    updateWizardQuickSizeButtons();
  }

  function applyWizardTextFontPreview() {
    var textEl = document.getElementById('st-wizard-text');
    if (!textEl) return;
    var fontId = CFG.defaults.font || 'Montserrat';
    var family = stickerCanvasFamily(fontId);
    textEl.style.fontFamily = '"' + family + '", sans-serif';
    textEl.style.fontWeight = '700';
    if (!document.fonts || !document.fonts.load) return;
    textEl.classList.add('is-font-loading');
    loadCanvasFontFamily(fontId, [22, 28, 36, 48]).then(function () {
      textEl.classList.remove('is-font-loading');
    }).catch(function () {
      textEl.classList.remove('is-font-loading');
    });
  }

  function updateWizardContentChoices() {
    document.querySelectorAll('[data-wizard-content]').forEach(function (btn) {
      var active = btn.getAttribute('data-wizard-content') === setupWizardState.contentType;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function renderWizardSummary() {
    var summaryEl = document.getElementById('st-wizard-summary');
    var svgReminder = document.getElementById('st-wizard-svg-reminder');
    if (!summaryEl) return;
    var lines = [];
    lines.push('<div><strong>Размер:</strong> ' + setupWizardState.widthCm + ' × ' + setupWizardState.heightCm + ' cm</div>');
    if (setupWizardState.contentType === 'text') {
      lines.push('<div><strong>Съдържание:</strong> само текст</div>');
    } else if (setupWizardState.contentType === 'svg') {
      lines.push('<div><strong>Съдържание:</strong> само SVG лого</div>');
    } else {
      lines.push('<div><strong>Съдържание:</strong> текст + SVG лого</div>');
    }
    if (setupWizardState.contentType === 'text' || setupWizardState.contentType === 'both') {
      var previewText = (setupWizardState.text || CFG.defaults.defaultText || '').replace(/\n/g, '<br>');
      lines.push('<div><strong>Текст:</strong> ' + previewText + '</div>');
    }
    if (setupWizardState.contentType === 'svg' || setupWizardState.contentType === 'both') {
      if (setupWizardState.svgFileName && setupWizardState.svgVectorData) {
        lines.push('<div><strong>Лого:</strong> ' + setupWizardState.svgFileName + '</div>');
      } else {
        lines.push('<div><strong>Лого:</strong> не е качено</div>');
      }
    }
    summaryEl.innerHTML = lines.join('');
    if (svgReminder) {
      svgReminder.hidden = !(
        (setupWizardState.contentType === 'svg' || setupWizardState.contentType === 'both') &&
        !setupWizardState.svgVectorData
      );
    }
  }

  function updateSetupWizardUi() {
    var steps = wizardStepIds();
    var currentId = wizardCurrentStepId();
    var stepLabel = document.getElementById('st-wizard-step-label');
    var progress = document.getElementById('st-wizard-progress');
    var backBtn = document.getElementById('st-wizard-back');
    var nextBtn = document.getElementById('st-wizard-next');
    var doneBtn = document.getElementById('st-wizard-done');
    var foot = document.getElementById('st-wizard-foot');

    ['intro', 'size', 'content', 'text', 'svg', 'done'].forEach(function (id) {
      var panel = document.getElementById('st-wizard-step-' + id);
      if (!panel) return;
      var active = id === currentId;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });

    if (stepLabel) {
      stepLabel.textContent = 'Стъпка ' + (setupWizardState.stepIndex + 1) + ' от ' + steps.length;
    }

    if (progress) {
      if (progress.childElementCount !== steps.length) {
        progress.innerHTML = '';
        for (var di = 0; di < steps.length; di += 1) {
          var newDot = document.createElement('span');
          newDot.className = 'st-wizard-progress__dot';
          progress.appendChild(newDot);
        }
      }
      var dots = progress.querySelectorAll('.st-wizard-progress__dot');
      dots.forEach(function (dot, idx) {
        dot.classList.toggle('is-active', idx === setupWizardState.stepIndex);
        dot.classList.toggle('is-done', idx < setupWizardState.stepIndex);
      });
    }

    if (backBtn) backBtn.hidden = setupWizardState.stepIndex <= 0;
    if (nextBtn) {
      nextBtn.hidden = currentId === 'done';
      nextBtn.textContent = currentId === 'intro' ? 'Започни' : 'Напред';
    }
    if (doneBtn) doneBtn.hidden = currentId !== 'done';
    if (foot) foot.classList.toggle('is-first-step', setupWizardState.stepIndex <= 0);

    if (currentId === 'text') applyWizardTextFontPreview();
    if (currentId === 'svg') updateWizardSvgUploadUi();
    if (currentId === 'done') renderWizardSummary();
  }

  function readDefaultSetupWizardState() {
    return {
      stepIndex: 0,
      widthCm: stickerSize.widthCm || CFG.defaults.widthCm || 20,
      heightCm: stickerSize.heightCm || CFG.defaults.heightCm || 10,
      contentType: 'text',
      text: CFG.defaults.defaultText || 'SAVOV PRO\nMade for you',
      svgFileName: '',
      svgVectorData: null,
    };
  }

  function closeSetupWizard() {
    var dialog = document.getElementById('st-setup-wizard');
    if (dialog && dialog.open) dialog.close();
  }

  function openSetupWizard() {
    var dialog = document.getElementById('st-setup-wizard');
    if (!dialog) return;
    setupWizardState = readDefaultSetupWizardState();
    renderWizardQuickSizes();
    syncSetupWizardToInputs();
    updateWizardContentChoices();
    updateSetupWizardUi();
    if (typeof dialog.showModal === 'function') dialog.showModal();
  }

  function wizardGoNext() {
    syncSetupWizardFromInputs();
    var steps = wizardStepIds();
    if (wizardCurrentStepId() === 'done') {
      finishSetupWizard();
      return;
    }
    if (setupWizardState.stepIndex < steps.length - 1) {
      setupWizardState.stepIndex += 1;
      if (wizardCurrentStepId() === 'text') {
        var textEl = document.getElementById('st-wizard-text');
        if (textEl && !textEl.value) textEl.value = setupWizardState.text || CFG.defaults.defaultText || '';
      }
      updateSetupWizardUi();
    }
  }

  function wizardGoBack() {
    syncSetupWizardFromInputs();
    if (setupWizardState.stepIndex > 0) {
      setupWizardState.stepIndex -= 1;
      updateSetupWizardUi();
    }
  }

  function wizardProducedNonDefaultDesign() {
    syncSetupWizardFromInputs();
    if (setupWizardState.widthCm !== CFG.defaults.widthCm ||
        setupWizardState.heightCm !== CFG.defaults.heightCm) {
      return true;
    }
    if (setupWizardState.contentType !== 'text') return true;
    if (setupWizardState.svgVectorData && setupWizardState.svgVectorData.paths &&
        setupWizardState.svgVectorData.paths.length) {
      return true;
    }
    var text = (setupWizardState.text || '').trim();
    var defaultText = (CFG.defaults.defaultText || 'SAVOV PRO\nMade for you').trim();
    return text !== defaultText;
  }

  function skipSetupWizard() {
    closeSetupWizard();
    markSetupWizardDone();
    draftSessionDirty = false;
    if (!layers.length) resetToDefaultDesign();
    else {
      saveHistory(false);
      updateAlignButtons();
      updatePriceDisplay();
      updateLinks();
      drawPreview();
    }
  }

  function finishSetupWizard() {
    syncSetupWizardFromInputs();
    closeSetupWizard();
    markSetupWizardDone();
    hideWizardFollowup();

    layers = [];
    selectedLayerIds = [];
    selectedLayerId = null;
    nextLayerId = 1;
    history = [];
    historyIdx = -1;

    applyStickerSize(setupWizardState.widthCm, setupWizardState.heightCm, { skipHistory: true });

    if (setupWizardState.contentType === 'text' || setupWizardState.contentType === 'both') {
      var textValue = setupWizardState.text.trim() || CFG.defaults.defaultText || 'SAVOV PRO\nMade for you';
      addLayer(makeTextLayer({
        text: textValue,
        font: CFG.defaults.font || 'Montserrat',
      }), true);
      var textLayer = getSelectedLayer();
      if (textLayer) fitLayerToSticker(textLayer);
    }

    if (setupWizardState.svgVectorData && setupWizardState.svgVectorData.paths && setupWizardState.svgVectorData.paths.length) {
      addLayer(makeVectorLayer(
        setupWizardState.svgFileName || 'logo.svg',
        setupWizardState.svgVectorData
      ), true);
      var vectorLayer = getSelectedLayer();
      if (vectorLayer) fitLayerToSticker(vectorLayer);
    } else if (setupWizardState.contentType === 'svg') {
      renderLayersPanel();
      syncControlsToSelectedLayer();
    }

    saveHistory(false);
    if (wizardProducedNonDefaultDesign()) markDraftDirty();
    updateAlignButtons();
    updatePriceDisplay();
    updateLinks();

    preloadStickerFonts().then(function () {
      drawPreview();
    });

    if (
      (setupWizardState.contentType === 'svg' || setupWizardState.contentType === 'both') &&
      !setupWizardState.svgVectorData
    ) {
      showWizardFollowup('Сега качи SVG файла от + SVG в секция Слоеве.');
      var accLayers = document.getElementById('acc-layers');
      if (accLayers && !accLayers.classList.contains('is-open')) {
        accLayers.classList.add('is-open');
        var head = accLayers.querySelector('.cfg-acc-head');
        if (head) head.setAttribute('aria-expanded', 'true');
      }
    }
  }

  function initSetupWizard() {
    var dialog = document.getElementById('st-setup-wizard');
    if (!dialog) return;

    renderWizardQuickSizes();

    document.querySelectorAll('[data-wizard-content]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var nextType = btn.getAttribute('data-wizard-content') || 'text';
        if (nextType !== 'svg' && nextType !== 'both') {
          clearWizardSvgUploadState();
        }
        setupWizardState.contentType = nextType;
        var steps = wizardStepIds();
        if (setupWizardState.stepIndex >= steps.length) {
          setupWizardState.stepIndex = Math.max(0, steps.length - 1);
        }
        updateWizardContentChoices();
        updateSetupWizardUi();
      });
    });

    ['st-wizard-width', 'st-wizard-height'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function () {
        var val = parseFloat(el.value);
        if (id === 'st-wizard-width') setupWizardState.widthCm = val || setupWizardState.widthCm;
        else setupWizardState.heightCm = val || setupWizardState.heightCm;
        updateWizardQuickSizeButtons();
      });
    });

    on('st-wizard-svg-pick', 'click', function () {
      var fileEl = document.getElementById('st-wizard-svg-file');
      if (fileEl) fileEl.click();
    });
    on('st-wizard-svg-file', 'change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (file) handleWizardSvgFile(file);
      e.target.value = '';
    });

    on('st-wizard-next', 'click', wizardGoNext);
    on('st-wizard-back', 'click', wizardGoBack);
    on('st-wizard-done', 'click', finishSetupWizard);
    on('st-wizard-skip-top', 'click', skipSetupWizard);

    dialog.addEventListener('cancel', function (e) {
      e.preventDefault();
    });
  }

  function finishInitAfterLayers() {
    saveHistory(false);
    updateAlignButtons();
    updatePriceDisplay();
    updateLinks();
    preloadStickerFonts().then(function () {
      drawPreview();
    });
  }

  function stickerCanvasFamily(catalogFontId) {
    return 'SAVOV ' + (catalogFontId || CFG.defaults.font || 'Montserrat');
  }

  function canvasFontSpec(catalogFontId, sizePx) {
    return '700 ' + Math.max(7, Math.ceil(sizePx)) + 'px "' + stickerCanvasFamily(catalogFontId) + '"';
  }

  function isCanvasFontReady(catalogFontId, sizePx) {
    if (!document.fonts || !document.fonts.check) return true;
    return document.fonts.check(canvasFontSpec(catalogFontId, sizePx));
  }

  function loadCanvasFontFamily(catalogFontId, sizesPx) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var loads = [];
    sizesPx.forEach(function (sz) {
      loads.push(document.fonts.load(canvasFontSpec(catalogFontId, sz)).catch(function () { return null; }));
    });
    return Promise.all(loads);
  }

  function preloadStickerFonts() {
    if (!CFG.fonts) return Promise.resolve();
    var ids = CFG.fonts.map(function (f) { return f.id; });
    var loads = [];
    if (document.fonts && document.fonts.load) {
      loads = loads.concat(ids.map(function (id) {
        return loadCanvasFontFamily(id, [22, 48, 64]);
      }));
    }
    if (window.ST_VECTOR && ST_VECTOR.preloadFonts) {
      loads.push(ST_VECTOR.preloadFonts(ids).catch(function () { return null; }));
    }
    if (!loads.length) return Promise.resolve();
    return Promise.all(loads).catch(function () { return null; });
  }

  function syncEditorToLayers() {
    var textInput = document.getElementById('st-text');
    var fontEl = document.getElementById('st-font');
    var spacEl = document.getElementById('st-spacing');
    var layer = getSelectedLayer();
    if (!layer || layer.type !== 'text') return;
    if (textInput) layer.text = textInput.value;
    if (fontEl && fontEl.value) layer.font = fontEl.value;
    if (spacEl) layer.letterSpacing = parseFloat(spacEl.value) || 0;
    clearTextMetricsCache();
  }

  function ensureExportFontsReady() {
    syncEditorToLayers();
    clearTextMetricsCache();
    var rect = getStickerRect();
    var webLoads = [document.fonts ? document.fonts.ready : Promise.resolve()];
    var fontNames = {};
    var fontSizes = {};
    layers.forEach(function (layer) {
      if (!layer.visible || layer.type !== 'text' || !layer.font) return;
      fontNames[layer.font] = true;
      if (!fontSizes[layer.font]) fontSizes[layer.font] = {};
      var baseSize = layer.size || TEXT_SIZE_MIN;
      fontSizes[layer.font][Math.ceil(baseSize)] = true;
      fontSizes[layer.font][48] = true;
      var effective = getEffectiveTextFontSize(layer, rect) || baseSize;
      fontSizes[layer.font][Math.ceil(effective)] = true;
    });
    Object.keys(fontSizes).forEach(function (family) {
      webLoads.push(loadCanvasFontFamily(family, Object.keys(fontSizes[family]).map(Number)));
    });
    if (window.ST_VECTOR && ST_VECTOR.preloadFonts) {
      var opentypeNames = Object.keys(fontNames);
      if (ST_VECTOR.GLYPH_FALLBACK_CHAIN) {
        ST_VECTOR.GLYPH_FALLBACK_CHAIN.forEach(function (name) { opentypeNames.push(name); });
      }
      webLoads.push(ST_VECTOR.preloadFonts(opentypeNames).catch(function () { return null; }));
    }
    return Promise.all(webLoads).then(function () {
      return new Promise(function (resolve) {
        requestAnimationFrame(function () { requestAnimationFrame(resolve); });
      });
    });
  }

  function buildPreviewPngDataUrlAsync() {
    return ensureExportFontsReady().then(function () {
      var off = document.createElement('canvas');
      off.width = CW;
      off.height = CH;
      drawExport(off.getContext('2d'), CW, CH);
      return off.toDataURL('image/png');
    });
  }

  function injectSvgPreviewBackground(svgString) {
    var view = svgString.match(/viewBox="\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*"/);
    var w = view ? view[1] : '100%';
    var h = view ? view[2] : '100%';
    var bg = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="#1a1a1a" data-preview-bg="true"/>';
    var marker = '<g id="cut-contour"';
    if (svgString.indexOf(marker) !== -1) {
      return svgString.replace(marker, bg + marker);
    }
    var openTag = svgString.match(/<svg[\s\S]*?>/);
    if (!openTag) return svgString;
    return svgString.replace(openTag[0], openTag[0] + bg);
  }

  function buildSvgPreviewDataUrlAsync(svgString) {
    var rect = getStickerRect();
    var previewSvg = injectSvgPreviewBackground(svgString);
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var blob = new Blob([previewSvg], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var off = document.createElement('canvas');
        off.width = CW;
        off.height = CH;
        var targetCtx = off.getContext('2d');
        drawCheckerOn(targetCtx, CW, CH);
        targetCtx.strokeStyle = 'rgba(201,162,39,0.85)';
        targetCtx.setLineDash([6, 4]);
        targetCtx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        targetCtx.setLineDash([]);
        targetCtx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
        resolve(off.toDataURL('image/png'));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('SVG preview render failed'));
      };
      img.src = url;
    });
  }

  function initShortcutsDialog() {
    var dialog = document.getElementById('st-shortcuts-dialog');
    var openBtn = document.getElementById('st-shortcuts-btn');
    if (!dialog) return;

    function openDialog() {
      if (dialog.showModal) dialog.showModal();
    }

    function closeDialog() {
      if (dialog.open) dialog.close();
    }

    if (openBtn) openBtn.addEventListener('click', openDialog);
    ['st-shortcuts-close', 'st-shortcuts-close-x'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', closeDialog);
    });
    dialog.addEventListener('cancel', function (e) {
      e.preventDefault();
    });

    window.openStickerShortcutsDialog = openDialog;
  }

  function initQuickActionsDialog() {
    var dialog = document.getElementById('st-quick-actions-dialog');
    if (!dialog) return;

    function openDialog() {
      if (!isMobileShellLayout()) return;
      syncQuickActionStates();
      if (dialog.showModal) dialog.showModal();
    }

    function closeDialog() {
      if (dialog.open) dialog.close();
    }

    function syncQuickActionStates() {
      var undo = document.getElementById('st-undo');
      var redo = document.getElementById('st-redo');
      dialog.querySelectorAll('[data-st-quick="undo"]').forEach(function (btn) {
        btn.disabled = !!(undo && undo.disabled);
      });
      dialog.querySelectorAll('[data-st-quick="redo"]').forEach(function (btn) {
        btn.disabled = !!(redo && redo.disabled);
      });
    }

    function clickIfReady(id) {
      var el = document.getElementById(id);
      if (el && !el.disabled) el.click();
    }

    function runQuickAction(action) {
      closeDialog();
      if (action === 'size') return clickIfReady('st-dim-btn');
      if (action === 'fit') return clickIfReady('st-fit-layer');
      if (action === 'snap') return clickIfReady('st-snap');
      if (action === 'fullscreen') return clickIfReady('st-fullscreen');
      if (action === 'png') return clickIfReady('st-download-order-png');
      if (action === 'svg') return clickIfReady('st-download-svg-basic');
      if (action === 'zoom-in') return clickIfReady('st-zoom-in');
      if (action === 'zoom-out') return clickIfReady('st-zoom-out');
      if (action === 'zoom-reset') return clickIfReady('st-zoom-reset');
      if (action === 'undo') return clickIfReady('st-undo');
      if (action === 'redo') return clickIfReady('st-redo');
      if (action === 'edit-tab') return setMobileTab('edit');
      if (action === 'order-tab') return setMobileTab('order');
    }

    ['st-mobile-quick-btn'].forEach(function (id) {
      on(id, 'click', openDialog);
    });
    on('st-mobile-fit-btn', 'click', function () {
      if (!isMobileShellLayout()) return;
      clickIfReady('st-fit-layer');
    });
    ['st-quick-actions-close', 'st-quick-actions-close-x'].forEach(function (id) {
      on(id, 'click', closeDialog);
    });
    dialog.addEventListener('cancel', function (e) {
      e.preventDefault();
    });
    dialog.querySelectorAll('[data-st-quick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        runQuickAction(btn.dataset.stQuick || '');
      });
    });
    on('st-quick-open-shortcuts', 'click', function () {
      closeDialog();
      if (typeof window.openStickerShortcutsDialog === 'function') window.openStickerShortcutsDialog();
    });
  }

  function isMobileLayout() {
    return window.matchMedia('(max-width: 600px)').matches;
  }

  function isMobileShellLayout() {
    return window.matchMedia('(max-width: 860px)').matches;
  }

  var MOBILE_TAB_KEY = 'savovpro-sticker-mobile-tab';
  var mobileTab = 'design';

  function updateDimLabel() {
    var label = stickerSize.widthCm + ' × ' + stickerSize.heightCm + ' cm';
    var dimEl = document.getElementById('st-dim-label');
    if (dimEl) dimEl.textContent = label;
    var accSummary = document.getElementById('st-size-acc-summary');
    if (accSummary) accSummary.textContent = label;
  }

  function initMobileSizePanel() {
    if (!isMobileLayout()) return;
    var acc = document.getElementById('acc-size');
    if (!acc) return;
    acc.classList.remove('is-open');
    var head = acc.querySelector('.cfg-acc-head');
    if (head) head.setAttribute('aria-expanded', 'false');
  }

  function collapseMobileAccordions() {
    if (!isMobileShellLayout()) return;
    ['acc-layers', 'acc-edit', 'acc-clipart'].forEach(function (id) {
      var acc = document.getElementById(id);
      if (!acc) return;
      acc.classList.remove('is-open');
      var head = acc.querySelector('.cfg-acc-head');
      if (head) head.setAttribute('aria-expanded', 'false');
    });
  }

  function openMobileAccordion(id) {
    var acc = document.getElementById(id);
    if (!acc) return;
    acc.classList.add('is-open');
    var head = acc.querySelector('.cfg-acc-head');
    if (head) head.setAttribute('aria-expanded', 'true');
  }

  function setMobileTab(tab, opts) {
    opts = opts || {};
    tab = tab === 'edit' || tab === 'order' ? tab : 'design';
    mobileTab = tab;
    var layout = document.getElementById('st-layout');
    if (layout && isMobileShellLayout()) {
      layout.classList.remove('st-mobile-tab-design', 'st-mobile-tab-edit', 'st-mobile-tab-order');
      layout.classList.add('st-mobile-tab-' + tab);
    }
    document.querySelectorAll('.st-mobile-tab').forEach(function (btn) {
      var active = btn.dataset.stTab === tab;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    if (tab === 'edit' && isMobileShellLayout()) {
      collapseMobileAccordions();
      openMobileAccordion('acc-edit');
    }
    if (!opts.skipSave) {
      try { localStorage.setItem(MOBILE_TAB_KEY, tab); } catch (e) { /* ignore */ }
    }
    if (tab === 'design') {
      requestAnimationFrame(function () { drawPreview(); });
    }
  }

  function initControlsScrollChaining() {
    if (isMobileShellLayout()) return;
    var panel = document.querySelector('.cfg-layout.st-layout .cfg-controls');
    if (!panel) return;

    function scrollablesFromTarget(target) {
      var list = [];
      var node = target;
      while (node && node !== panel.parentElement) {
        if (node.scrollHeight > node.clientHeight + 1) {
          var oy = window.getComputedStyle(node).overflowY;
          if (oy === 'auto' || oy === 'scroll') list.push(node);
        }
        node = node.parentElement;
      }
      if (panel.scrollHeight > panel.clientHeight + 1) list.push(panel);
      return list;
    }

    panel.addEventListener('wheel', function (e) {
      if (!panel.contains(e.target)) return;
      var chain = scrollablesFromTarget(e.target);
      if (!chain.length) return;

      var remaining = e.deltaY;
      var consumed = false;
      for (var j = 0; j < chain.length && remaining !== 0; j++) {
        var box = chain[j];
        var max = box.scrollHeight - box.clientHeight;
        var next = box.scrollTop + remaining;
        if (next < 0) {
          box.scrollTop = 0;
          remaining = next;
          consumed = true;
          continue;
        }
        if (next > max) {
          box.scrollTop = max;
          remaining = next - max;
          consumed = true;
          continue;
        }
        box.scrollTop = next;
        remaining = 0;
        consumed = true;
      }
      if (remaining !== 0) {
        window.scrollBy(0, remaining);
        consumed = true;
      }
      if (consumed) e.preventDefault();
    }, { passive: false });
  }

  function initMobileShell() {
    var tabs = document.getElementById('st-mobile-tabs');
    if (!tabs) return;

    try {
      var savedTab = localStorage.getItem(MOBILE_TAB_KEY);
      if (savedTab === 'edit' || savedTab === 'order' || savedTab === 'design') mobileTab = savedTab;
    } catch (e) { /* ignore */ }

    function applyShellState() {
      if (!isMobileShellLayout()) {
        var layout = document.getElementById('st-layout');
        if (layout) {
          layout.classList.remove('st-mobile-tab-design', 'st-mobile-tab-edit', 'st-mobile-tab-order');
        }
        var mobileQuick = document.getElementById('st-mobile-toolbar-quick');
        if (mobileQuick) mobileQuick.hidden = true;
        return;
      }
      var mobileQuickBar = document.getElementById('st-mobile-toolbar-quick');
      if (mobileQuickBar) mobileQuickBar.hidden = false;
      initMobileSizePanel();
      setMobileTab(mobileTab, { skipSave: true });
    }

    var shellResizeTimer = 0;
    function scheduleShellState() {
      clearTimeout(shellResizeTimer);
      shellResizeTimer = setTimeout(applyShellState, 120);
    }

    tabs.querySelectorAll('.st-mobile-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setMobileTab(btn.dataset.stTab || 'design');
      });
    });

    on('btn-export-mobile', 'click', downloadPlotterSvg);

    applyShellState();
    window.addEventListener('resize', scheduleShellState);
  }

  function syncSizeInputsToState() {
    var w = String(stickerSize.widthCm);
    var h = String(stickerSize.heightCm);
    ['st-width', 'st-size-dlg-width'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = w;
    });
    ['st-height', 'st-size-dlg-height'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = h;
    });
    updateDimLabel();
  }

  function applyStickerSize(w, h, options) {
    options = options || {};
    var lim = CFG.size;
    if (w != null) stickerSize.widthCm = clampSize(w, lim.minW, lim.maxW);
    else stickerSize.widthCm = clampSize(document.getElementById('st-width').value, lim.minW, lim.maxW);
    if (h != null) stickerSize.heightCm = clampSize(h, lim.minH, lim.maxH);
    else stickerSize.heightCm = clampSize(document.getElementById('st-height').value, lim.minH, lim.maxH);
    syncSizeInputsToState();
    if (options.skipRender) return;
    drawPreview();
    updatePriceDisplay();
    updateLinks();
    updateQuickSizeButtons();
    if (options.skipHistory !== true) saveHistory();
  }

  function applyStickerSizeFromDialogInputs() {
    var dlgW = document.getElementById('st-size-dlg-width');
    var dlgH = document.getElementById('st-size-dlg-height');
    var wMain = document.getElementById('st-width');
    var hMain = document.getElementById('st-height');
    if (dlgW && wMain) wMain.value = dlgW.value;
    if (dlgH && hMain) hMain.value = dlgH.value;
    applyStickerSize();
  }

  function initSizeDialog() {
    var dialog = document.getElementById('st-size-dialog');
    var openBtn = document.getElementById('st-dim-btn');
    if (!dialog) return;

    function openDialog() {
      syncSizeInputsToState();
      updateQuickSizeButtons();
      if (dialog.showModal) dialog.showModal();
    }

    function closeDialog() {
      if (dialog.open) dialog.close();
    }

    if (openBtn) openBtn.addEventListener('click', openDialog);
    ['st-size-done', 'st-size-close-x'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', closeDialog);
    });
    dialog.addEventListener('cancel', function (e) {
      e.preventDefault();
    });
    ['st-size-dlg-width', 'st-size-dlg-height'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', applyStickerSizeFromDialogInputs);
    });

    var accSize = document.getElementById('acc-size');
    var accHead = accSize && accSize.querySelector('.cfg-acc-head');
    if (accHead) {
      accHead.addEventListener('click', function (e) {
        if (!isMobileLayout()) return;
        e.preventDefault();
        e.stopPropagation();
        openDialog();
      }, true);
    }

    initMobileSizePanel();
    window.addEventListener('resize', initMobileSizePanel);
  }

  function applySnapshot(snap) {
    restoreLayers(snap.layers);
    selectedLayerIds = snap.sels && snap.sels.length ? snap.sels.slice() : (snap.sel ? [snap.sel] : []);
    selectedLayerId = snap.sel || (selectedLayerIds.length ? selectedLayerIds[selectedLayerIds.length - 1] : null);
    renderLayersPanel();
    syncControlsToSelectedLayer();
    updateAlignButtons();
    drawPreview();
    updateLinks();
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
    var u = document.getElementById('st-undo');
    var r = document.getElementById('st-redo');
    if (u) u.disabled = historyIdx <= 0;
    if (r) r.disabled = historyIdx >= history.length - 1;
  }

  function getLayerById(id) {
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].id === id) return layers[i];
    }
    return null;
  }

  function getSelectedLayer() {
    return selectedLayerId ? getLayerById(selectedLayerId) : null;
  }

  function getSelectedLayers() {
    return selectedLayerIds.map(getLayerById).filter(function (l) { return l && l.visible; });
  }

  function addLayer(layer, skipHistory) {
    layers.push(layer);
    selectedLayerIds = [layer.id];
    selectedLayerId = layer.id;
    renderLayersPanel();
    syncControlsToSelectedLayer();
    updateAlignButtons();
    drawPreview();
    updateLinks();
    if (!skipHistory) saveHistory();
  }

  function isLayerSelected(id) {
    return selectedLayerIds.indexOf(id) >= 0;
  }

  function isLayerPrimary(id) {
    return selectedLayerId === id;
  }

  function refreshSelectionUi() {
    renderLayersPanel();
    syncControlsToSelectedLayer();
    updateAlignButtons();
    drawPreview();
  }

  function clearSelection() {
    selectedLayerIds = [];
    selectedLayerId = null;
    refreshSelectionUi();
  }

  function selectLayer(id, opts) {
    opts = opts || {};
    if (!id) {
      clearSelection();
      return;
    }
    if (opts.toggle) {
      if (isLayerSelected(id)) {
        selectedLayerIds = selectedLayerIds.filter(function (sid) { return sid !== id; });
        if (selectedLayerId === id) {
          selectedLayerId = selectedLayerIds.length ? selectedLayerIds[selectedLayerIds.length - 1] : null;
        }
      } else {
        selectedLayerIds.push(id);
        selectedLayerId = id;
      }
    } else if (opts.add) {
      if (!isLayerSelected(id)) selectedLayerIds.push(id);
      selectedLayerId = id;
    } else {
      selectedLayerIds = [id];
      selectedLayerId = id;
    }
    refreshSelectionUi();
  }

  function selectAllLayers() {
    selectedLayerIds = layers.filter(function (l) { return l.visible; }).map(function (l) { return l.id; });
    selectedLayerId = selectedLayerIds.length ? selectedLayerIds[selectedLayerIds.length - 1] : null;
    refreshSelectionUi();
  }

  function getLayerContentBox(layer, rect) {
    var lx = rect.cx + layer.x;
    var ly = rect.cy + layer.y;
    if (layer.type === 'text') {
      var m = getTextLayerMetrics(layer, rect);
      return {
        cx: lx,
        cy: ly,
        w: m.boundsW,
        h: m.boundsH,
        rotation: layer.rotation || 0,
        localLeft: m.boundsLeft,
        localTop: m.boundsTop,
      };
    }
    if (layer.type === 'image') {
      var px = getImageLayerPxSize(layer, rect);
      return {
        cx: lx,
        cy: ly,
        w: px.uW,
        h: px.uH,
        rotation: layer.rotation || 0,
        localLeft: -px.uW / 2,
        localTop: -px.uH / 2,
      };
    }
    if (layer.type === 'vector') {
      var vpx = getVectorLayerPxSize(layer, rect);
      return {
        cx: lx,
        cy: ly,
        w: vpx.uW,
        h: vpx.uH,
        rotation: layer.rotation || 0,
        localLeft: -vpx.uW / 2,
        localTop: -vpx.uH / 2,
      };
    }
    return {
      cx: lx,
      cy: ly,
      w: 40,
      h: 40,
      rotation: layer.rotation || 0,
      localLeft: -20,
      localTop: -20,
    };
  }

  function getLayerBox(layer, rect) {
    return getLayerContentBox(layer, rect);
  }

  function getBoxLocalRect(box) {
    var left = box.localLeft != null ? box.localLeft : -box.w / 2;
    var top = box.localTop != null ? box.localTop : -box.h / 2;
    return { left: left, top: top, right: left + box.w, bottom: top + box.h, w: box.w, h: box.h };
  }

  function alignLayerToStickerEdge(layer, rect, align) {
    var pass;
    for (pass = 0; pass < 2; pass++) {
      var box = getLayerContentBox(layer, rect);
      var b = getLayerWorldBounds(box);
      if (!b) return;
      var dx = 0;
      var dy = 0;
      if (align === 'left') dx = rect.x - b.minX;
      else if (align === 'right') dx = (rect.x + rect.w) - b.maxX;
      else if (align === 'centerH') dx = rect.cx - (b.minX + b.maxX) / 2;
      else if (align === 'top') dy = rect.y - b.minY;
      else if (align === 'bottom') dy = (rect.y + rect.h) - b.maxY;
      else if (align === 'middleV') dy = rect.cy - (b.minY + b.maxY) / 2;
      if (!dx && !dy) break;
      layer.x += dx;
      layer.y += dy;
    }
  }

  function alignLayersToSticker(align) {
    var ids = selectedLayerIds.length ? selectedLayerIds.slice() : (selectedLayerId ? [selectedLayerId] : []);
    if (!ids.length) return;
    var rect = getStickerRect();
    ids.forEach(function (id) {
      var layer = getLayerById(id);
      if (!layer || !layer.visible) return;
      alignLayerToStickerEdge(layer, rect, align);
    });
    drawPreview();
    updateLinks();
    saveHistory();
  }

  function alignLayersTogether(align) {
    if (selectedLayerIds.length < 2) return;
    var rect = getStickerRect();
    var items = selectedLayerIds.map(function (id) {
      var layer = getLayerById(id);
      if (!layer || !layer.visible) return null;
      var box = getLayerContentBox(layer, rect);
      return { layer: layer, bounds: getLayerWorldBounds(box) };
    }).filter(Boolean);
    if (items.length < 2) return;
    var minX = Infinity;
    var maxX = -Infinity;
    var minY = Infinity;
    var maxY = -Infinity;
    items.forEach(function (item) {
      minX = Math.min(minX, item.bounds.minX);
      maxX = Math.max(maxX, item.bounds.maxX);
      minY = Math.min(minY, item.bounds.minY);
      maxY = Math.max(maxY, item.bounds.maxY);
    });
    items.forEach(function (item) {
      var b = item.bounds;
      var dx = 0;
      var dy = 0;
      if (align === 'left') dx = minX - b.minX;
      else if (align === 'right') dx = maxX - b.maxX;
      else if (align === 'centerH') dx = (minX + maxX) / 2 - (b.minX + b.maxX) / 2;
      else if (align === 'top') dy = minY - b.minY;
      else if (align === 'bottom') dy = maxY - b.maxY;
      else if (align === 'middleV') dy = (minY + maxY) / 2 - (b.minY + b.maxY) / 2;
      item.layer.x += dx;
      item.layer.y += dy;
    });
    drawPreview();
    updateLinks();
    saveHistory();
  }

  function updateAlignButtons() {
    var multi = selectedLayerIds.length >= 2;
    document.querySelectorAll('.st-layers-tools .st-align-btn[data-scope="layers"]').forEach(function (btn) {
      btn.disabled = !multi;
    });
    var layer = getSelectedLayer();
    var align = (layer && layer.type === 'text' ? layer.textAlign : 'center') || 'center';
    document.querySelectorAll('.st-align-btn[data-text-align]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.textAlign === align);
      btn.disabled = !layer || layer.type !== 'text';
    });
  }

  function duplicateLayerById(id) {
    var src = getLayerById(id);
    if (!src) return;
    var list = document.getElementById('st-layers-list');
    var oldRects = captureLayerItemRects(list);
    var copy = {};
    for (var k in src) copy[k] = src[k];
    copy.id = nextLayerId++;
    copy.x = src.x + 14;
    copy.y = src.y + 14;
    if (src.type === 'text') {
      copy.name = defaultTextLayerLabel(getNextTextLayerNumber());
    } else if (src.type === 'vector') {
      copy.paths = src.paths.slice();
    }
    layers.push(copy);
    selectedLayerIds = [copy.id];
    selectedLayerId = copy.id;
    renderLayersPanel(false);
    animateLayerItemsFlip(list, oldRects, { enterLayerId: copy.id, fromLayerId: src.id });
    syncControlsToSelectedLayer();
    updateAlignButtons();
    drawPreview();
    updateLinks();
    saveHistory();
  }

  function deleteLayerById(id) {
    var idx = -1;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].id === id) { idx = i; break; }
    }
    if (idx === -1) return;
    layers.splice(idx, 1);
    selectedLayerIds = selectedLayerIds.filter(function (sid) { return sid !== id; });
    if (selectedLayerId === id) {
      selectedLayerId = selectedLayerIds.length
        ? selectedLayerIds[selectedLayerIds.length - 1]
        : (layers.length ? layers[layers.length - 1].id : null);
      if (selectedLayerId && !isLayerSelected(selectedLayerId)) selectedLayerIds.push(selectedLayerId);
    }
    renderLayersPanel();
    syncControlsToSelectedLayer();
    updateAlignButtons();
    drawPreview();
    updateLinks();
    saveHistory();
  }

  function clampSize(v, min, max) {
    v = parseFloat(v);
    if (isNaN(v)) return min;
    return Math.min(max, Math.max(min, Math.round(v * 10) / 10));
  }

  function getPrice() {
    if (window.Pricing) {
      return Pricing.calcSticker(stickerSize.widthCm, stickerSize.heightCm);
    }
    var p = CFG.pricing;
    var area = stickerSize.widthCm * stickerSize.heightCm;
    return Math.max(p.minPrice, Math.round((p.setupFee + area * p.pricePerCm2) * 100) / 100);
  }

  function updatePriceDisplay() {
    var el = document.getElementById('st-price-display');
    if (!el) return;
    if (window.Pricing) {
      el.textContent = Pricing.format(getPrice());
    } else {
      el.textContent = getPrice() + ' ' + CFG.currency;
    }
  }

  function updateZoomUI() {
    var pct = Math.round(view.scale * 100);
    var label = document.getElementById('st-zoom-label');
    if (label) label.textContent = pct + '%';
    var slider = document.getElementById('st-zoom-slider');
    if (slider) slider.value = String(Math.min(VIEW_ZOOM_MAX * 100, Math.max(VIEW_ZOOM_MIN * 100, pct)));
  }

  function setViewScale(s) {
    view.scale = Math.min(VIEW_ZOOM_MAX, Math.max(VIEW_ZOOM_MIN, s));
    updateZoomUI();
    drawPreview();
  }

  var hoverWorld = { x: 0, y: 0, valid: false };

  function beginPan(rawX, rawY, opts) {
    opts = opts || {};
    ptr.active = true;
    ptr.mode = 'pan';
    ptr.startX = rawX;
    ptr.startY = rawY;
    ptr.panOx = view.panX;
    ptr.panOy = view.panY;
    ptr.panClickSelect = !!opts.clickSelect;
    canvas.style.cursor = 'grabbing';
  }

  function cursorForScaleHandle(box) {
    var s = scaleHandlePos(box);
    var deg = (Math.atan2(s.y - box.cy, s.x - box.cx) * 180 / Math.PI + 360) % 360;
    if (deg >= 337.5 || deg < 22.5 || (deg >= 157.5 && deg < 202.5)) return 'ew-resize';
    if (deg >= 67.5 && deg < 112.5) return 'ns-resize';
    if (deg >= 22.5 && deg < 67.5) return 'nwse-resize';
    if (deg >= 112.5 && deg < 157.5) return 'nesw-resize';
    if (deg >= 202.5 && deg < 247.5) return 'nwse-resize';
    if (deg >= 247.5 && deg < 292.5) return 'ns-resize';
    return 'nesw-resize';
  }

  function updateSelectionHover(px, py) {
    var next = false;
    if (px != null && py != null && selectedLayerId && elementBoxes[selectedLayerId]) {
      var selBox = elementBoxes[selectedLayerId];
      next = hitBody(selBox, px, py)
        || hitRotHandle(selBox, px, py)
        || hitScaleHandle(selBox, px, py)
        || hitMoveHandle(selBox, px, py);
    }
    if (next !== lastSelectionHover) {
      lastSelectionHover = next;
      selectionHover = next;
      scheduleDrawPreview();
    } else {
      selectionHover = next;
    }
  }

  function updateCanvasCursor(px, py) {
    updateSelectionHover(px, py);
    if (ptr.active) {
      if (ptr.mode === 'pan') canvas.style.cursor = 'grabbing';
      return;
    }
    if (spacePan) {
      canvas.style.cursor = 'grab';
      return;
    }
    if (px != null && py != null && selectedLayerId && elementBoxes[selectedLayerId]) {
      var selBox = elementBoxes[selectedLayerId];
      if (hitRotHandle(selBox, px, py)) {
        canvas.style.cursor = 'alias';
        return;
      }
      if (hitScaleHandle(selBox, px, py)) {
        canvas.style.cursor = cursorForScaleHandle(selBox);
        return;
      }
      if (hitMoveHandle(selBox, px, py)) {
        canvas.style.cursor = 'grab';
        return;
      }
      if (hitBody(selBox, px, py)) {
        canvas.style.cursor = 'grab';
        return;
      }
    }
    canvas.style.cursor = 'grab';
  }

  function refreshCanvasCursor() {
    if (hoverWorld.valid) updateCanvasCursor(hoverWorld.x, hoverWorld.y);
    else updateCanvasCursor();
  }

  function resetView() {
    view.scale = 1;
    view.panX = 0;
    view.panY = 0;
    updateZoomUI();
    drawPreview();
  }

  function toggleFullscreen(forceOff) {
    if (!previewEl) return;
    var on = forceOff === true ? false : !previewEl.classList.contains('is-fullscreen');
    previewEl.classList.toggle('is-fullscreen', on);
    document.body.style.overflow = on ? 'hidden' : '';
    var fsBtn = document.getElementById('st-fullscreen');
    if (fsBtn) {
      fsBtn.setAttribute('aria-pressed', String(on));
      fsBtn.title = on ? 'Изход от цял екран' : 'Цял екран';
    }
  }

  function getStickerRect() {
    var pad = 40;
    var maxW = CW - pad * 2;
    var maxH = CH - pad * 2;
    var aspect = stickerSize.widthCm / stickerSize.heightCm;
    var drawW, drawH;
    if (aspect >= maxW / maxH) {
      drawW = maxW;
      drawH = maxW / aspect;
    } else {
      drawH = maxH;
      drawW = maxH * aspect;
    }
    return {
      x: (CW - drawW) / 2,
      y: (CH - drawH) / 2,
      w: drawW,
      h: drawH,
      cx: CW / 2,
      cy: CH / 2,
    };
  }

  function applyViewTransform() {
    ctx.translate(CW / 2 + view.panX, CH / 2 + view.panY);
    ctx.scale(view.scale, view.scale);
    ctx.translate(-CW / 2, -CH / 2);
  }

  function drawCheckerOn(targetCtx, w, h) {
    var s = 16;
    for (var y = 0; y < h; y += s) {
      for (var x = 0; x < w; x += s) {
        targetCtx.fillStyle = ((x / s + y / s) % 2 === 0) ? '#1a1a1a' : '#222';
        targetCtx.fillRect(x, y, s, s);
      }
    }
  }

  function drawChecker() {
    drawCheckerOn(ctx, CW, CH);
  }

  var drawRaf = 0;

  function scheduleDrawPreview() {
    if (drawRaf) return;
    drawRaf = requestAnimationFrame(function () {
      drawRaf = 0;
      drawPreview();
    });
  }

  function drawPreviewNow() {
    if (drawRaf) {
      cancelAnimationFrame(drawRaf);
      drawRaf = 0;
    }
    drawPreview();
  }

  function drawCutOutline(rect, warn) {
    ctx.strokeStyle = warn ? 'rgba(255,90,90,0.95)' : 'rgba(201,162,39,0.85)';
    ctx.lineWidth = 1.5 / view.scale;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.setLineDash([]);
  }

  function formatDimCm(v) {
    var n = Math.round(v * 10) / 10;
    return (n % 1 === 0 ? String(n) : String(n)) + ' cm';
  }

  function drawDimensionLabels(rect, warn) {
    var color = warn ? 'rgba(255,130,130,0.95)' : 'rgba(201,162,39,0.95)';
    var gap = Math.max(12, Math.min(22, rect.w * 0.06)) / view.scale;
    var tick = 5 / view.scale;
    var fontSize = Math.max(9, Math.min(12, 11 / view.scale));
    var wText = formatDimCm(stickerSize.widthCm);
    var hText = formatDimCm(stickerSize.heightCm);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1 / view.scale;
    ctx.font = '600 ' + fontSize + 'px Montserrat, sans-serif';

    var topY = rect.y - gap;
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y);
    ctx.lineTo(rect.x, topY);
    ctx.moveTo(rect.x + rect.w, rect.y);
    ctx.lineTo(rect.x + rect.w, topY);
    ctx.moveTo(rect.x, topY);
    ctx.lineTo(rect.x + rect.w, topY);
    ctx.moveTo(rect.x, topY - tick);
    ctx.lineTo(rect.x, topY + tick);
    ctx.moveTo(rect.x + rect.w, topY - tick);
    ctx.lineTo(rect.x + rect.w, topY + tick);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(wText, rect.x + rect.w / 2, topY - 3 / view.scale);

    var leftX = rect.x - gap;
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y);
    ctx.lineTo(leftX, rect.y);
    ctx.moveTo(rect.x, rect.y + rect.h);
    ctx.lineTo(leftX, rect.y + rect.h);
    ctx.moveTo(leftX, rect.y);
    ctx.lineTo(leftX, rect.y + rect.h);
    ctx.moveTo(leftX - tick, rect.y);
    ctx.lineTo(leftX + tick, rect.y);
    ctx.moveTo(leftX - tick, rect.y + rect.h);
    ctx.lineTo(leftX + tick, rect.y + rect.h);
    ctx.stroke();
    ctx.translate(leftX - 5 / view.scale, rect.y + rect.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(hText, 0, 0);
    ctx.restore();
  }

  var textMetricsCache = {};

  function clearTextMetricsCache() {
    textMetricsCache = {};
  }

  function cacheTextMetrics(layerId, metrics) {
    textMetricsCache[layerId] = metrics;
  }

  function getTextLayerMetrics(layer, rect, lc) {
    if (textMetricsCache[layer.id]) return textMetricsCache[layer.id];
    return computeTextLayerMetrics(layer, getTextLayoutArea(rect), lc || measureCtx);
  }

  var measureCtx = document.createElement('canvas').getContext('2d');

  function measureLayerDims(layer, rect) {
    if (layer.type === 'text') return drawTextLayer(measureCtx, layer, rect);
    if (layer.type === 'image') return drawImageLayer(measureCtx, layer, rect);
    if (layer.type === 'vector') return drawVectorLayer(measureCtx, layer, rect);
    return { w: 40, h: 40 };
  }

  function getLayerWorldBounds(box) {
    if (!box) return null;
    var lr = getBoxLocalRect(box);
    var rad = box.rotation * Math.PI / 180;
    var cos = Math.cos(rad);
    var sin = Math.sin(rad);
    var corners = [
      [lr.left, lr.top], [lr.right, lr.top], [lr.left, lr.bottom], [lr.right, lr.bottom],
    ];
    var minX = Infinity; var maxX = -Infinity; var minY = Infinity; var maxY = -Infinity;
    corners.forEach(function (c) {
      var wx = c[0] * cos - c[1] * sin + box.cx;
      var wy = c[0] * sin + c[1] * cos + box.cy;
      minX = Math.min(minX, wx); maxX = Math.max(maxX, wx);
      minY = Math.min(minY, wy); maxY = Math.max(maxY, wy);
    });
    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
  }

  function getBoundsTolerance(rect) {
    return Math.max(10, Math.min(rect.w, rect.h) * 0.03);
  }

  function isBoxOutOfSticker(box, rect) {
    var b = getLayerWorldBounds(box);
    if (!b) return false;
    var tol = getBoundsTolerance(rect);
    return b.minX < rect.x - tol
      || b.maxX > rect.x + rect.w + tol
      || b.minY < rect.y - tol
      || b.maxY > rect.y + rect.h + tol;
  }

  function isLayerOutOfSticker(layer, rect) {
    return isBoxOutOfSticker(getLayerInkBox(layer, rect), rect);
  }

  function getLayerOverflowAxes(layer, rect, inkBoxes) {
    var box = inkBoxes && inkBoxes[layer.id] ? inkBoxes[layer.id] : getLayerInkBox(layer, rect);
    var b = getLayerWorldBounds(box);
    if (!b) return [];
    var tol = getBoundsTolerance(rect);
    var axes = [];
    if (b.minX < rect.x - tol || b.maxX > rect.x + rect.w + tol) axes.push('X');
    if (b.minY < rect.y - tol || b.maxY > rect.y + rect.h + tol) axes.push('Y');
    return axes;
  }

  function layerBoundsLabel(layer) {
    if (layer.type === 'text') {
      var name = textLayerDisplayName(layer);
      return name.length > 18 ? name.slice(0, 16) + '…' : name;
    }
    var file = layer.fileName || 'изображение';
    return file.length > 18 ? file.slice(0, 16) + '…' : file;
  }

  function collectOutOfBoundsLayers(rect, inkBoxes) {
    var out = [];
    layers.forEach(function (layer) {
      if (!layer.visible) return;
      var box = inkBoxes && inkBoxes[layer.id] ? inkBoxes[layer.id] : getLayerInkBox(layer, rect);
      if (isBoxOutOfSticker(box, rect)) out.push(layer);
    });
    return out;
  }

  function drawOutOfBoundsMark(box) {
    var lr = getBoxLocalRect(box);
    ctx.save();
    ctx.translate(box.cx, box.cy);
    ctx.rotate(box.rotation * Math.PI / 180);
    ctx.strokeStyle = COLOR_WARN.stroke;
    ctx.lineWidth = 2 / view.scale;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(lr.left, lr.top, lr.w, lr.h);
    ctx.setLineDash([]);
    ctx.restore();
  }

  function updateBoundsWarning(outLayers, rect, inkBoxes) {
    var el = document.getElementById('st-bounds-warn');
    var textEl = document.getElementById('st-bounds-warn-text');
    if (!el) return;
    var show = !!(outLayers && outLayers.length);
    el.hidden = !show;
    el.classList.toggle('is-visible', show);
    if (!show) {
      if (textEl) textEl.textContent = '⚠ Един или повече слоя излизат извън размера на стикера';
      return;
    }
    var msg;
    if (outLayers.length === 1) {
      var axes = getLayerOverflowAxes(outLayers[0], rect, inkBoxes);
      var axisHint = axes.length === 1 ? (axes[0] === 'X' ? 'хоризонтално' : 'вертикално') : 'хоризонтално и вертикално';
      msg = '⚠ „' + layerBoundsLabel(outLayers[0]) + '“ излиза ' + axisHint + ' извън стикера. Натисни „Побери в стикера“.';
    } else {
      msg = '⚠ ' + outLayers.length + ' слоя излизат извън стикера (' + outLayers.map(layerBoundsLabel).join(', ') + '). Натисни „Побери в стикера“.';
    }
    if (textEl) textEl.textContent = msg;
  }

  function fitOutOfBoundsLayers() {
    var rect = getStickerRect();
    var targets = collectOutOfBoundsLayers(rect);
    if (!targets.length) {
      var sel = getSelectedLayer();
      if (sel) fitLayerToSticker(sel);
      return;
    }
    targets.forEach(function (layer) { fitLayerToSticker(layer); });
  }

  function fitLayerToSticker(layer) {
    if (!layer) return;
    var rect = getStickerRect();
    var area = getTextLayoutArea(rect);
    var allowedW = area.maxW;
    var allowedH = area.maxH;

    if (layer.type === 'text') {
      var lo = TEXT_SIZE_MIN;
      var hi = getTextSizeMax(rect);
      var best = lo;
      for (var fitIter = 0; fitIter < 24; fitIter++) {
        var mid = (lo + hi) / 2;
        layer.size = mid;
        var d = measureLayerDims(layer, rect);
        if (d.w <= allowedW && d.h <= allowedH) { best = mid; lo = mid; }
        else hi = mid;
      }
      layer.size = best;
    } else if (layer.type === 'image' || layer.type === 'vector') {
      var dims = measureLayerDims(layer, rect);
      var factor = Math.min(allowedW / dims.w, allowedH / dims.h, 1);
      layer.size = Math.max(0.1, layer.size * factor * 0.98);
    }

    layer.x = 0;
    layer.y = 0;
    syncControlsToSelectedLayer();
    drawPreview();
    updateLinks();
    saveHistory();
  }

  function updateQuickSizeButtons() {
    ['st-quick-sizes', 'st-size-dlg-quick-sizes'].forEach(function (wrapId) {
      var wrap = document.getElementById(wrapId);
      if (!wrap) return;
      wrap.querySelectorAll('.st-pill-btn').forEach(function (btn) {
        var w = parseFloat(btn.dataset.w);
        var h = parseFloat(btn.dataset.h);
        btn.classList.toggle('is-active', w === stickerSize.widthCm && h === stickerSize.heightCm);
      });
    });
  }

  function computeTextLayerMetrics(layer, areaOrMaxW, lc, maxHOpt) {
    var area = normalizeTextLayoutArea(areaOrMaxW, maxHOpt);
    var maxW = area.maxW;
    var maxH = area.maxH;
    var rawLines = getTextLines(layer);
    var lines = rawLines.length ? rawLines : [''];
    var sz = layer.size;
    var align = layer.textAlign || 'center';
    var ff = '"' + stickerCanvasFamily(layer.font) + '", sans-serif';
    lc.letterSpacing = (layer.letterSpacing || 0) + 'px';
    lc.textAlign = align;
    lc.textBaseline = 'middle';

    function setFont(s) { lc.font = '700 ' + s + 'px ' + ff; }

    function layoutAtFontSize(fontSize) {
      setFont(fontSize);
      lc.textAlign = align;
      lc.textBaseline = 'middle';

      var lineStep = fontSize * 1.56;
      var startY = lines.length === 1 ? 0 : -(lines.length - 1) * lineStep / 2;
      var maxLineW = 0;
      lines.forEach(function (line) {
        setFont(fontSize);
        var w = line ? lc.measureText(line).width : 0;
        maxLineW = Math.max(maxLineW, w);
      });
      var blockHalfW = maxLineW / 2;
      var lineX = align === 'left' ? -blockHalfW : align === 'right' ? blockHalfW : 0;
      var halfH = fontSize * 0.55;
      var inkLeft = Infinity;
      var inkRight = -Infinity;
      var inkTop = Infinity;
      var inkBottom = -Infinity;

      lines.forEach(function (line, i) {
        var y = startY + i * lineStep;
        setFont(fontSize);
        lc.textAlign = align;
        lc.textBaseline = 'middle';
        var lineW = line ? lc.measureText(line).width : 0;
        var left;
        var right;
        if (align === 'center') {
          left = lineX - lineW / 2;
          right = lineX + lineW / 2;
        } else if (align === 'right') {
          right = lineX;
          left = lineX - lineW;
        } else {
          left = lineX;
          right = lineX + lineW;
        }
        inkLeft = Math.min(inkLeft, left);
        inkRight = Math.max(inkRight, right);
        inkTop = Math.min(inkTop, y - halfH);
        inkBottom = Math.max(inkBottom, y + halfH);
      });

      if (!isFinite(inkLeft)) {
        inkLeft = -blockHalfW;
        inkRight = blockHalfW;
        inkTop = -halfH;
        inkBottom = halfH;
      }

      var unionLeft = inkLeft;
      var unionRight = inkRight;
      var unionTop = inkTop;
      var unionBottom = inkBottom;
      var blockH = Math.max(fontSize * 1.2, unionBottom - unionTop);
      var pad = Math.max(2, Math.ceil(fontSize * 0.05));

      return {
        lines: lines,
        align: align,
        lineX: lineX,
        fontSize: fontSize,
        lineStep: lineStep,
        startY: startY,
        blockH: blockH,
        maxLineW: maxLineW,
        inkLeft: unionLeft,
        inkRight: unionRight,
        inkTop: unionTop,
        inkBottom: unionBottom,
        boundsLeft: unionLeft - pad,
        boundsRight: unionRight + pad,
        boundsTop: unionTop - pad,
        boundsBottom: unionBottom + pad,
        boundsW: unionRight - unionLeft + pad * 2,
        boundsH: unionBottom - unionTop + pad * 2,
      };
    }

    var fontSize = sz;
    lines.forEach(function (line) {
      setFont(fontSize);
      var w = line ? lc.measureText(line).width : 0;
      if (w > maxW - 8 && isCanvasFontReady(layer.font, sz)) {
        fontSize = Math.min(fontSize, Math.max(7, sz * (maxW - 8) / w));
      }
    });

    var metrics = layoutAtFontSize(fontSize);
    if (maxH < Infinity && metrics.boundsH > maxH && fontSize > TEXT_SIZE_MIN) {
      fontSize = Math.max(TEXT_SIZE_MIN, fontSize * (maxH / metrics.boundsH));
      metrics = layoutAtFontSize(fontSize);
    }

    lc.letterSpacing = '0px';
    return metrics;
  }

  function getLayerInkBox(layer, rect) {
    var lx = rect.cx + layer.x;
    var ly = rect.cy + layer.y;
    if (layer.type === 'text') {
      var m = getTextLayerMetrics(layer, rect);
      var inkLeft = m.inkLeft != null ? m.inkLeft : m.boundsLeft;
      var inkTop = m.inkTop != null ? m.inkTop : m.boundsTop;
      var inkRight = m.inkRight != null ? m.inkRight : m.boundsRight;
      var inkBottom = m.inkBottom != null ? m.inkBottom : m.boundsBottom;
      return {
        cx: lx,
        cy: ly,
        w: inkRight - inkLeft,
        h: inkBottom - inkTop,
        rotation: layer.rotation || 0,
        localLeft: inkLeft,
        localTop: inkTop,
      };
    }
    return getLayerContentBox(layer, rect);
  }

  function drawTextLayer(lc, layer, rectOrArea) {
    var area = rectOrArea && rectOrArea.w != null && rectOrArea.h != null
      ? getTextLayoutArea(rectOrArea)
      : normalizeTextLayoutArea(rectOrArea);
    var m = computeTextLayerMetrics(layer, area, measureCtx);
    cacheTextMetrics(layer.id, m);
    var drawnWithPaths = window.ST_VECTOR && ST_VECTOR.drawTextPathsOnCanvas
      && ST_VECTOR.drawTextPathsOnCanvas(lc, layer, m, TEXT_COLOR);
    if (!drawnWithPaths) {
      var ff = '"' + stickerCanvasFamily(layer.font) + '", sans-serif';
      lc.fillStyle = TEXT_COLOR;
      lc.textAlign = m.align;
      lc.textBaseline = 'middle';
      lc.font = '700 ' + m.fontSize + 'px ' + ff;
      if (layer.letterSpacing) lc.letterSpacing = (layer.letterSpacing || 0) + 'px';
      m.lines.forEach(function (line, i) {
        if (line) lc.fillText(line, m.lineX, m.startY + i * m.lineStep);
      });
      lc.letterSpacing = '0px';
    }
    return {
      w: m.boundsW,
      h: m.boundsH,
      localLeft: m.boundsLeft,
      localTop: m.boundsTop,
      inkLeft: m.inkLeft,
      inkRight: m.inkRight,
      inkTop: m.inkTop,
      inkBottom: m.inkBottom,
    };
  }

  function getVectorLayerPxSize(layer, rect) {
    var refW = layer.contentW || layer.viewW;
    var refH = layer.contentH || layer.viewH;
    if (!refW || !refH) return { uW: 40, uH: 40 };
    var fitW = rect.w * 0.45;
    var fitH = rect.h * 0.45;
    var fitScale = Math.min(fitW / refW, fitH / refH);
    return {
      uW: refW * fitScale * layer.size,
      uH: refH * fitScale * layer.size,
    };
  }

  function drawVectorLayer(lc, layer, rect) {
    if (!layer.paths || !layer.paths.length) {
      return { w: 40, h: 40, localLeft: -20, localTop: -20 };
    }
    var refW = layer.contentW || layer.viewW;
    var refH = layer.contentH || layer.viewH;
    if (!refW || !refH) {
      return { w: 40, h: 40, localLeft: -20, localTop: -20 };
    }
    var px = getVectorLayerPxSize(layer, rect);
    var uW = px.uW;
    var uH = px.uH;
    var offsetX = layer.offsetX || 0;
    var offsetY = layer.offsetY || 0;
    lc.save();
    lc.translate(-uW / 2, -uH / 2);
    lc.scale(uW / refW, uH / refH);
    if (offsetX || offsetY) lc.translate(-offsetX, -offsetY);
    lc.fillStyle = TEXT_COLOR;
    layer.paths.forEach(function (d) {
      try {
        lc.fill(new Path2D(d), 'evenodd');
      } catch (e) { /* skip invalid path */ }
    });
    lc.restore();
    return { w: uW, h: uH, localLeft: -uW / 2, localTop: -uH / 2 };
  }

  function drawImageLayer(lc, layer, rect) {
    var img = layer.imgEl;
    if (!img || !img.complete || !img.naturalWidth) return { w: 40, h: 40 };
    var fitW = rect.w * 0.45;
    var fitH = rect.h * 0.45;
    var fitScale = Math.min(fitW / img.naturalWidth, fitH / img.naturalHeight);
    var uW = img.naturalWidth * fitScale * layer.size;
    var uH = img.naturalHeight * fitScale * layer.size;
    var x = -uW / 2;
    var y = -uH / 2;
    lc.save();
    if (layer.isSvg) {
      tintMonochromeImage(lc, img, x, y, uW, uH, TEXT_COLOR);
    } else {
      lc.drawImage(img, x, y, uW, uH);
    }
    lc.restore();
    return { w: uW, h: uH, localLeft: -uW / 2, localTop: -uH / 2 };
  }

  function drawSelectionOutline(box, warn) {
    var colors = warn ? COLOR_WARN : COLOR_OK;
    var lr = getBoxLocalRect(box);
    ctx.save();
    ctx.translate(box.cx, box.cy);
    ctx.rotate(box.rotation * Math.PI / 180);
    ctx.strokeStyle = colors.strokeSoft;
    ctx.lineWidth = 1.5 / view.scale;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(lr.left, lr.top, lr.w, lr.h);
    ctx.setLineDash([]);
    ctx.restore();
  }

  function getHandleHitR() {
    var px = isCoarsePointer() ? HANDLE_HIT_PX * HANDLE_HIT_TOUCH_MULT : HANDLE_HIT_PX;
    return px / view.scale;
  }

  function getRotDist() {
    return HANDLE_STEM_PX / view.scale;
  }

  function worldToScreen(wx, wy) {
    return {
      x: (wx - CW / 2) * view.scale + CW / 2 + view.panX,
      y: (wy - CH / 2) * view.scale + CH / 2 + view.panY,
    };
  }

  function localToWorld(el, lx, ly) {
    var rad = el.rotation * Math.PI / 180;
    return {
      x: el.cx + lx * Math.cos(rad) - ly * Math.sin(rad),
      y: el.cy + lx * Math.sin(rad) + ly * Math.cos(rad),
    };
  }

  function moveHandlePos(el) {
    var lr = getBoxLocalRect(el);
    var midX = (lr.left + lr.right) / 2;
    return localToWorld(el, midX, lr.bottom + getRotDist() * 0.75);
  }

  function drawSelectionFrame(el, warn) {
    var colors = warn ? COLOR_WARN : COLOR_OK;
    var rad = el.rotation * Math.PI / 180;
    var lr = getBoxLocalRect(el);
    ctx.save();
    ctx.translate(el.cx, el.cy);
    ctx.rotate(rad);
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = Math.max(1, 1.5 / view.scale);
    ctx.setLineDash([5 / view.scale, 4 / view.scale]);
    ctx.strokeRect(lr.left, lr.top, lr.w, lr.h);
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawHandleStemScreen(from, to, accent) {
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawHandleKnobScreen(sx, sy, warn) {
    var r = isCoarsePointer() ? HANDLE_KNOB_TOUCH_PX : HANDLE_KNOB_PX;
    var accent = warn ? '#ff5a5a' : '#C9A227';
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#232323';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, r - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawHandleGlyphScreen(sx, sy, kind, warn) {
    var color = warn ? '#ff8a8a' : '#ffffff';
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (kind === 'move') {
      ctx.beginPath();
      ctx.moveTo(sx, sy - 7);
      ctx.lineTo(sx, sy + 7);
      ctx.moveTo(sx - 7, sy);
      ctx.lineTo(sx + 7, sy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx, sy - 7);
      ctx.lineTo(sx - 3, sy - 3);
      ctx.lineTo(sx + 3, sy - 3);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'rotate') {
      ctx.beginPath();
      ctx.arc(sx, sy, 6, Math.PI * 0.15, Math.PI * 1.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx - 5, sy - 1.5);
      ctx.lineTo(sx - 1.5, sy - 5);
      ctx.lineTo(sx + 0.5, sy - 2);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'scale') {
      ctx.beginPath();
      ctx.moveTo(sx - 6, sy + 6);
      ctx.lineTo(sx + 6, sy - 6);
      ctx.moveTo(sx + 6, sy - 6);
      ctx.lineTo(sx + 1.5, sy - 6);
      ctx.moveTo(sx + 6, sy - 6);
      ctx.lineTo(sx + 6, sy - 1.5);
      ctx.moveTo(sx - 6, sy + 6);
      ctx.lineTo(sx - 6, sy + 1.5);
      ctx.moveTo(sx - 6, sy + 6);
      ctx.lineTo(sx - 1.5, sy + 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function shouldShowMoveHandle() {
    return selectionHover || isCoarsePointer();
  }

  function drawHandlesScreen(el, warn) {
    var lr = getBoxLocalRect(el);
    var midX = (lr.left + lr.right) / 2;
    var accent = warn ? 'rgba(255,90,90,0.95)' : 'rgba(201,162,39,0.95)';
    var topW = localToWorld(el, midX, lr.top);
    var bottomW = localToWorld(el, midX, lr.bottom);
    var top = worldToScreen(topW.x, topW.y);
    var bottom = worldToScreen(bottomW.x, bottomW.y);
    var rotW = rotHandlePos(el);
    var rot = worldToScreen(rotW.x, rotW.y);
    var moveW = moveHandlePos(el);
    var move = worldToScreen(moveW.x, moveW.y);
    var scaleW = scaleHandlePos(el);
    var scale = worldToScreen(scaleW.x, scaleW.y);
    var showMove = shouldShowMoveHandle();

    drawHandleStemScreen(top, rot, accent);
    if (showMove) drawHandleStemScreen(bottom, move, accent);
    drawHandleKnobScreen(rot.x, rot.y, warn);
    drawHandleGlyphScreen(rot.x, rot.y, 'rotate', warn);
    drawHandleKnobScreen(scale.x, scale.y, warn);
    drawHandleGlyphScreen(scale.x, scale.y, 'scale', warn);
    if (showMove) {
      drawHandleKnobScreen(move.x, move.y, warn);
      drawHandleGlyphScreen(move.x, move.y, 'move', warn);
    }
  }

  function drawPreview() {
    var rect = getStickerRect();
    elementBoxes = {};
    var elementInkBoxes = {};
    clearTextMetricsCache();
    ctx.clearRect(0, 0, CW, CH);
    ctx.save();
    applyViewTransform();
    drawChecker();

    layers.forEach(function (layer) {
      if (!layer.visible) return;
      var lx = rect.cx + layer.x;
      var ly = rect.cy + layer.y;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(layer.rotation * Math.PI / 180);
      var dims;
      if (layer.type === 'text') {
        dims = drawTextLayer(ctx, layer, rect);
      } else if (layer.type === 'image') {
        dims = drawImageLayer(ctx, layer, rect);
      } else if (layer.type === 'vector') {
        dims = drawVectorLayer(ctx, layer, rect);
      }
      ctx.restore();
      if (layer.type === 'text' && dims) {
        elementBoxes[layer.id] = {
          cx: lx,
          cy: ly,
          w: dims.w,
          h: dims.h,
          rotation: layer.rotation,
          localLeft: dims.localLeft,
          localTop: dims.localTop,
        };
        elementInkBoxes[layer.id] = {
          cx: lx,
          cy: ly,
          w: dims.inkRight - dims.inkLeft,
          h: dims.inkBottom - dims.inkTop,
          rotation: layer.rotation,
          localLeft: dims.inkLeft,
          localTop: dims.inkTop,
        };
      } else if (layer.type === 'image' && dims) {
        elementBoxes[layer.id] = getLayerContentBox(layer, rect);
        elementInkBoxes[layer.id] = elementBoxes[layer.id];
      } else if (layer.type === 'vector' && dims) {
        elementBoxes[layer.id] = getLayerContentBox(layer, rect);
        elementInkBoxes[layer.id] = elementBoxes[layer.id];
      }
    });

    var outLayers = collectOutOfBoundsLayers(rect, elementInkBoxes);
    var anyOut = outLayers.length > 0;
    outLayers.forEach(function (layer) {
      if (!isLayerSelected(layer.id)) drawOutOfBoundsMark(elementInkBoxes[layer.id] || elementBoxes[layer.id]);
    });

    drawCutOutline(rect, anyOut);
    drawDimensionLabels(rect, anyOut);
    drawSnapGuides(rect);
    updateBoundsWarning(outLayers, rect, elementInkBoxes);

    selectedLayerIds.forEach(function (sid) {
      if (!elementBoxes[sid]) return;
      var selBox = elementBoxes[sid];
      var warn = isBoxOutOfSticker(selBox, rect);
      if (sid === selectedLayerId) drawSelectionFrame(selBox, warn);
      else drawSelectionOutline(selBox, warn);
    });

    ctx.restore();

    if (selectedLayerId && elementBoxes[selectedLayerId]) {
      var primaryBox = elementBoxes[selectedLayerId];
      drawHandlesScreen(primaryBox, isBoxOutOfSticker(primaryBox, rect));
    }

    if (!layers.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '500 13px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Добави текст или SVG', CW / 2, CH / 2);
    }

    var dimEl = document.getElementById('st-dim-label');
    if (dimEl) updateDimLabel();
    updateLayerSizeLabel(rect);
  }

  function drawExport(targetCtx, w, h) {
    var rect = getStickerRect();
    targetCtx.clearRect(0, 0, w, h);
    drawCheckerOn(targetCtx, w, h);
    targetCtx.strokeStyle = 'rgba(201,162,39,0.85)';
    targetCtx.setLineDash([6, 4]);
    targetCtx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    targetCtx.setLineDash([]);
    layers.forEach(function (layer) {
      if (!layer.visible) return;
      var lx = rect.cx + layer.x;
      var ly = rect.cy + layer.y;
      targetCtx.save();
      targetCtx.translate(lx, ly);
      targetCtx.rotate(layer.rotation * Math.PI / 180);
      if (layer.type === 'text') drawTextLayer(targetCtx, layer, rect);
      else if (layer.type === 'image') drawImageLayer(targetCtx, layer, rect);
      else if (layer.type === 'vector') drawVectorLayer(targetCtx, layer, rect);
      targetCtx.restore();
    });
  }

  function escXml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function mm(n) {
    return Math.round(n * 1000) / 1000;
  }

  function pxToMm(px, rectPx, rectMm) {
    return px * (rectMm / rectPx);
  }

  function layerCenterMm(layer, rect, widthMm, heightMm) {
    return {
      x: mm(widthMm / 2 + pxToMm(layer.x, rect.w, widthMm)),
      y: mm(heightMm / 2 + pxToMm(layer.y, rect.h, heightMm)),
    };
  }

  function getTextBlockSize(layer, rectOrArea) {
    var area = rectOrArea && rectOrArea.w != null && rectOrArea.h != null
      ? getTextLayoutArea(rectOrArea)
      : normalizeTextLayoutArea(rectOrArea);
    var m = computeTextLayerMetrics(layer, area, measureCtx);
    return {
      fontSize: m.fontSize,
      lineStep: m.lineStep,
      lines: m.lines,
      maxLineW: m.maxLineW,
      lineX: m.lineX,
    };
  }

  function getEffectiveTextFontSize(layer, rectOrArea) {
    return getTextBlockSize(layer, rectOrArea).fontSize;
  }

  function getImageLayerPxSize(layer, rect) {
    var img = layer.imgEl;
    if (!img || !img.naturalWidth) return { uW: 40, uH: 40 };
    var fitW = rect.w * 0.45;
    var fitH = rect.h * 0.45;
    var fitScale = Math.min(fitW / img.naturalWidth, fitH / img.naturalHeight);
    return {
      uW: img.naturalWidth * fitScale * layer.size,
      uH: img.naturalHeight * fitScale * layer.size,
    };
  }

  function rasterizeImageLayerWhite(layer, uW, uH) {
    try {
      if (!layer.imgEl || !layer.imgEl.naturalWidth) return null;
      if (layer.stickerProcessed) {
        var direct = document.createElement('canvas');
        direct.width = Math.max(1, Math.ceil(uW));
        direct.height = Math.max(1, Math.ceil(uH));
        direct.getContext('2d').drawImage(layer.imgEl, 0, 0, direct.width, direct.height);
        return direct.toDataURL('image/png');
      }
      var off = document.createElement('canvas');
      off.width = Math.max(1, Math.ceil(uW));
      off.height = Math.max(1, Math.ceil(uH));
      var oc = off.getContext('2d');
      tintMonochromeImage(oc, layer.imgEl, 0, 0, off.width, off.height, SVG_EXPORT_FILL);
      return off.toDataURL('image/png');
    } catch (e) {
      return null;
    }
  }

  var SVG_FONT_MAP = {
    'Montserrat': 'Montserrat:wght@700',
    'Playfair Display': 'Playfair+Display:wght@700',
    'Caveat': 'Caveat:wght@700',
    'Dancing Script': 'Dancing+Script:wght@700',
    'DM Sans': 'DM+Sans:wght@700',
  };

  function buildExportSvgAsync(done) {
    if (!window.ST_VECTOR || !ST_VECTOR.ready()) {
      done(buildExportSvgFallback(), null);
      return;
    }

    var rect = getStickerRect();
    var widthCm = stickerSize.widthCm;
    var heightCm = stickerSize.heightCm;
    var widthMm = mm(widthCm * 10);
    var heightMm = mm(heightCm * 10);
    var fontsNeeded = {};
    layers.forEach(function (layer) {
      if (layer.visible && layer.type === 'text' && layer.font) fontsNeeded[layer.font] = true;
    });
    if (window.ST_VECTOR && ST_VECTOR.GLYPH_FALLBACK_CHAIN) {
      ST_VECTOR.GLYPH_FALLBACK_CHAIN.forEach(function (name) { fontsNeeded[name] = true; });
    }

    ST_VECTOR.preloadFonts(Object.keys(fontsNeeded)).then(function () {
      var parts = [];
      parts.push('<?xml version="1.0" encoding="UTF-8"?>');
      parts.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"');
      parts.push(' width="' + widthCm + 'cm" height="' + heightCm + 'cm"');
      parts.push(' viewBox="0 0 ' + widthMm + ' ' + heightMm + '">');
      parts.push('<title>SAVOV PRO — Sticker ' + widthCm + '×' + heightCm + ' cm</title>');
      parts.push('<desc>Plotter export. Physical size: ' + widthCm + ' × ' + heightCm + ' cm. Gold (' + SVG_EXPORT_FILL + ') vector paths on transparent.</desc>');
      parts.push('<g id="cut-contour" data-role="cut">');
      parts.push('<rect x="0" y="0" width="' + widthMm + '" height="' + heightMm + '" fill="none" stroke="#000000" stroke-width="0.1"/>');
      parts.push('</g>');
      parts.push('<g id="sticker-art" data-role="print">');

      var jobs = layers.map(function (layer) {
        if (!layer.visible) return Promise.resolve('');

        var c = layerCenterMm(layer, rect, widthMm, heightMm);
        var rot = layer.rotation || 0;
        function wrap(content) {
          if (!content) return '';
          return '<g transform="translate(' + c.x + ' ' + c.y + ') rotate(' + rot + ')">' + content + '</g>';
        }

        if (layer.type === 'text') {
          return ST_VECTOR.loadFont(layer.font || CFG.defaults.font).then(function (font) {
            var metrics = computeTextLayerMetrics(layer, getTextLayoutArea(rect), measureCtx);
            var pathStrings = ST_VECTOR.buildTextPathStrings(font, layer, metrics);
            if (!pathStrings.length) return '';
            var scaleX = pxToMm(1, rect.w, widthMm);
            var scaleY = pxToMm(1, rect.h, heightMm);
            var inner = pathStrings.map(function (d) {
              return '<path fill="' + SVG_EXPORT_FILL + '" d="' + escXml(d) + '"/>';
            }).join('\n');
            return wrap('<g transform="scale(' + mm(scaleX) + ' ' + mm(scaleY) + ')">' + inner + '</g>');
          });
        }

        if (layer.type === 'vector') {
          var vpx = getVectorLayerPxSize(layer, rect);
          var vwMm = mm(pxToMm(vpx.uW, rect.w, widthMm));
          var vhMm = mm(pxToMm(vpx.uH, rect.h, heightMm));
          return Promise.resolve(wrap(ST_VECTOR.pathsGroupSvg(
            layer.paths,
            layer.viewW,
            layer.viewH,
            vwMm,
            vhMm,
            escXml,
            layer.offsetX,
            layer.offsetY,
            layer.contentW,
            layer.contentH,
            SVG_EXPORT_FILL
          )));
        }

        if (layer.type === 'image') {
          if (layer.stickerProcessed && layer.imgEl && layer.imgEl.naturalWidth && !isIconifyId(layer.fileName)) {
            var off = document.createElement('canvas');
            off.width = layer.imgEl.naturalWidth;
            off.height = layer.imgEl.naturalHeight;
            off.getContext('2d').drawImage(layer.imgEl, 0, 0);
            var traced = ST_VECTOR.traceCanvas(off);
            if (traced.paths && traced.paths.length) {
              var tpx = getImageLayerPxSize(layer, rect);
              var twMm = mm(pxToMm(tpx.uW, rect.w, widthMm));
              var thMm = mm(pxToMm(tpx.uH, rect.h, heightMm));
              return Promise.resolve(wrap(ST_VECTOR.pathsGroupSvg(
                traced.paths,
                traced.viewW,
                traced.viewH,
                twMm,
                thMm,
                escXml,
                traced.offsetX,
                traced.offsetY,
                traced.contentW,
                traced.contentH,
                SVG_EXPORT_FILL
              )));
            }
          }
          var ipx = getImageLayerPxSize(layer, rect);
          var iwMm = mm(pxToMm(ipx.uW, rect.w, widthMm));
          var ihMm = mm(pxToMm(ipx.uH, rect.h, heightMm));
          var href = rasterizeImageLayerWhite(layer, ipx.uW, ipx.uH);
          if (!href) return Promise.resolve('');
          return Promise.resolve(wrap(
            '<image x="' + (-iwMm / 2) + '" y="' + (-ihMm / 2) + '" width="' + iwMm + '" height="' + ihMm + '" href="' + href + '" xlink:href="' + href + '" preserveAspectRatio="xMidYMid meet"/>'
          ));
        }

        return Promise.resolve('');
      });

      return Promise.all(jobs).then(function (chunks) {
        parts.push(chunks.join('\n'));
        parts.push('</g></svg>');
        return parts.join('\n');
      });
    }).then(function (svg) {
      done(svg, null);
    }).catch(function (err) {
      done(null, err);
    });
  }

  function buildExportSvgFallback() {
    var rect = getStickerRect();
    var widthCm = stickerSize.widthCm;
    var heightCm = stickerSize.heightCm;
    var widthMm = mm(widthCm * 10);
    var heightMm = mm(heightCm * 10);
    var fontsUsed = {};
    var parts = [];

    parts.push('<?xml version="1.0" encoding="UTF-8"?>');
    parts.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"');
    parts.push(' width="' + widthCm + 'cm" height="' + heightCm + 'cm"');
    parts.push(' viewBox="0 0 ' + widthMm + ' ' + heightMm + '">');
    parts.push('<title>SAVOV PRO — Sticker ' + widthCm + '×' + heightCm + ' cm</title>');
    parts.push('<desc>Plotter export. Physical size: ' + widthCm + ' × ' + heightCm + ' cm. Gold (' + SVG_EXPORT_FILL + ') art on transparent. Cut contour in group cut-contour.</desc>');

    layers.forEach(function (layer) {
      if (layer.visible && layer.type === 'text' && layer.font) fontsUsed[layer.font] = true;
    });
    var fontFamilies = Object.keys(fontsUsed).map(function (f) {
      return SVG_FONT_MAP[f] || (f.replace(/ /g, '+') + ':wght@700');
    });
    if (fontFamilies.length) {
      parts.push('<defs><style type="text/css"><![CDATA[@import url(\'https://fonts.googleapis.com/css2?family=' +
        fontFamilies.join('&amp;family=') + '&amp;display=swap\');]]></style></defs>');
    }

    parts.push('<g id="cut-contour" data-role="cut">');
    parts.push('<rect x="0" y="0" width="' + widthMm + '" height="' + heightMm + '" fill="none" stroke="#000000" stroke-width="0.1"/>');
    parts.push('</g>');
    parts.push('<g id="sticker-art" data-role="print">');

    layers.forEach(function (layer) {
      if (!layer.visible) return;
      var c = layerCenterMm(layer, rect, widthMm, heightMm);
      var rot = layer.rotation || 0;

      if (layer.type === 'text') {
        var block = getTextBlockSize(layer, rect);
        var fontSizeMm = mm(pxToMm(block.fontSize, rect.h, heightMm));
        var lineStepMm = mm(pxToMm(block.lineStep, rect.h, heightMm));
        var spacingMm = mm(pxToMm(layer.letterSpacing || 0, rect.w, widthMm));
        var align = layer.textAlign || 'center';
        var textAnchor = align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle';
        var axMm = mm(pxToMm(block.lineX, rect.w, widthMm));
        var svgLines = block.lines.length ? block.lines : [''];
        parts.push('<g transform="translate(' + c.x + ' ' + c.y + ') rotate(' + rot + ')">');
        if (svgLines.length === 1) {
          parts.push('<text fill="' + SVG_EXPORT_FILL + '" font-family="' + escXml(layer.font) + ', sans-serif" font-size="' + fontSizeMm + '" font-weight="700" text-anchor="' + textAnchor + '" dominant-baseline="middle" letter-spacing="' + spacingMm + '" x="' + axMm + '">' + escXml(svgLines[0] || '') + '</text>');
        } else {
          var startDyMm = mm(pxToMm(-(svgLines.length - 1) * block.lineStep / 2, rect.h, heightMm));
          parts.push('<text fill="' + SVG_EXPORT_FILL + '" font-family="' + escXml(layer.font) + ', sans-serif" font-size="' + fontSizeMm + '" font-weight="700" text-anchor="' + textAnchor + '" dominant-baseline="middle" letter-spacing="' + spacingMm + '" x="' + axMm + '" y="0">');
          svgLines.forEach(function (line, i) {
            if (i === 0) {
              parts.push('<tspan x="' + axMm + '" dy="' + startDyMm + '">' + escXml(line) + '</tspan>');
            } else {
              parts.push('<tspan x="' + axMm + '" dy="' + lineStepMm + '">' + escXml(line) + '</tspan>');
            }
          });
          parts.push('</text>');
        }
        parts.push('</g>');
      } else if (layer.type === 'image') {
        var px = getImageLayerPxSize(layer, rect);
        var wMm = mm(pxToMm(px.uW, rect.w, widthMm));
        var hMm = mm(pxToMm(px.uH, rect.h, heightMm));
        var href = rasterizeImageLayerWhite(layer, px.uW, px.uH);
        if (!href) return;
        parts.push('<g transform="translate(' + c.x + ' ' + c.y + ') rotate(' + rot + ')">');
        parts.push('<image x="' + (-wMm / 2) + '" y="' + (-hMm / 2) + '" width="' + wMm + '" height="' + hMm + '" href="' + href + '" xlink:href="' + href + '" preserveAspectRatio="xMidYMid meet"/>');
        parts.push('</g>');
      } else if (layer.type === 'vector') {
        var vpx = getVectorLayerPxSize(layer, rect);
        var vwMm = mm(pxToMm(vpx.uW, rect.w, widthMm));
        var vhMm = mm(pxToMm(vpx.uH, rect.h, heightMm));
        var sx = vwMm / layer.viewW;
        var sy = vhMm / layer.viewH;
        parts.push('<g transform="translate(' + c.x + ' ' + c.y + ') rotate(' + rot + ')">');
        parts.push('<g transform="translate(' + (-vwMm / 2) + ' ' + (-vhMm / 2) + ') scale(' + sx + ' ' + sy + ')">');
        layer.paths.forEach(function (d) {
          parts.push('<path fill="' + SVG_EXPORT_FILL + '" d="' + escXml(d) + '"/>');
        });
        parts.push('</g></g>');
      }
    });

    parts.push('</g></svg>');
    return parts.join('\n');
  }

  function downloadBlob(filename, mime, content) {
    try {
      var blob = new Blob([content], { type: mime });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    } catch (e) {
      console.error('downloadBlob failed', e);
      window.alert('Неуспешно изтегляне на файла. Опитай отново.');
    }
  }

  function on(id, event, handler) {
    var el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  }

  function colorDist(r1, g1, b1, r2, g2, b2) {
    return Math.sqrt((r1 - r2) * (r1 - r2) + (g1 - g2) * (g1 - g2) + (b1 - b2) * (b1 - b2));
  }

  function detectBackgroundColor(d, w, h) {
    var pad = Math.max(4, Math.min(24, Math.floor(Math.min(w, h) * 0.08)));
    var regions = [
      [0, 0, pad, pad],
      [w - pad, 0, pad, pad],
      [0, h - pad, pad, pad],
      [w - pad, h - pad, pad, pad],
    ];
    var samples = [];

    function sampleRegion(x0, y0, rw, rh) {
      var r = 0; var g = 0; var b = 0; var n = 0;
      var x; var y;
      for (y = y0; y < y0 + rh && y < h; y++) {
        for (x = x0; x < x0 + rw && x < w; x++) {
          var i = (y * w + x) * 4;
          if (d[i + 3] < 10) continue;
          r += d[i]; g += d[i + 1]; b += d[i + 2];
          n++;
        }
      }
      if (!n) return null;
      return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n), lum: (r + g + b) / (3 * n) };
    }

    regions.forEach(function (reg) {
      var s = sampleRegion(reg[0], reg[1], reg[2], reg[3]);
      if (s) samples.push(s);
    });

    if (!samples.length) return { r: 255, g: 255, b: 255 };

    samples.sort(function (a, b) { return b.lum - a.lum; });
    var bg = samples[0];
    var similar = samples.filter(function (s) {
      return colorDist(s.r, s.g, s.b, bg.r, bg.g, bg.b) <= 28;
    });
    var r = 0; var g = 0; var b = 0;
    similar.forEach(function (s) { r += s.r; g += s.g; b += s.b; });
    return {
      r: Math.round(r / similar.length),
      g: Math.round(g / similar.length),
      b: Math.round(b / similar.length),
    };
  }

  function isSvgUploadFile(file) {
    if (!file) return false;
    return /\.svg$/i.test(file.name) || file.type === 'image/svg+xml';
  }

  function isRasterImageFile(file) {
    if (!file) return false;
    if (/\.svg$/i.test(file.name) || file.type === 'image/svg+xml') return false;
    if (/\.(png|jpe?g|webp)$/i.test(file.name)) return true;
    return /^image\//.test(file.type || '') && file.type !== 'image/svg+xml';
  }

  function countImageAlphaStats(d) {
    var transparent = 0;
    var opaque = 0;
    var i;
    for (i = 3; i < d.length; i += 4) {
      if (d[i] < 20) transparent++;
      else opaque++;
    }
    return { transparent: transparent, opaque: opaque, total: transparent + opaque };
  }

  function updateImportStats(stats, removeBackground) {
    var el = document.getElementById('st-import-stats');
    if (!el) return;
    if (!removeBackground || !stats) {
      el.hidden = true;
      return;
    }
    var pct = stats.total ? Math.round((stats.transparent / stats.total) * 100) : 0;
    el.hidden = false;
    el.textContent = pct > 2
      ? 'Премахнат фон · ' + pct + '% прозрачни пиксели'
      : 'Фонът почти не е премахнат — увеличи чувствителността или ползвай по-контрастно изображение.';
  }

  function analyzeImageForImport(id, bg) {
    var d = id.data;
    var bgLum = 0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b;
    var darkOnLight = bgLum >= 165;
    var lightOnDark = bgLum <= 95;
    var contentLums = [];
    var i;
    var r; var g; var b; var lum;
    var sampleTol = 22;
    var maxSat = 0;

    for (i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 8) continue;
      r = d[i];
      g = d[i + 1];
      b = d[i + 2];
      lum = 0.299 * r + 0.587 * g + 0.114 * b;
      var sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (sat > maxSat) maxSat = sat;
      if (colorDist(r, g, b, bg.r, bg.g, bg.b) > sampleTol) contentLums.push(lum);
    }

    contentLums.sort(function (a, b) { return a - b; });
    var contentLum = contentLums.length
      ? contentLums[Math.floor(contentLums.length * 0.45)]
      : (darkOnLight ? 40 : 220);
    var gap = Math.abs(bgLum - contentLum);
    var suggestedTolerance = 40;

    if (darkOnLight) {
      suggestedTolerance = Math.round(Math.min(56, Math.max(24, gap * 0.28)));
      if (gap >= 120) suggestedTolerance = Math.min(suggestedTolerance, 44);
    } else if (lightOnDark) {
      suggestedTolerance = Math.round(Math.min(64, Math.max(28, gap * 0.32)));
    } else {
      suggestedTolerance = Math.round(Math.min(72, Math.max(32, gap * 0.3)));
    }

    suggestedTolerance = Math.round(suggestedTolerance / 2) * 2;

    var colorful = maxSat >= 36;
    var suggestedSpeckle = colorful ? 6 : (gap >= 100 ? 3 : 4);

    return {
      darkOnLight: darkOnLight,
      lightOnDark: lightOnDark,
      colorful: colorful,
      bgLum: bgLum,
      contentLum: contentLum,
      contrastGap: gap,
      suggestedTolerance: suggestedTolerance,
      suggestedSmooth: gap >= 100 ? 5 : 6,
      suggestedSpeckle: suggestedSpeckle,
    };
  }

  function suggestImportSettingsFromImage(img) {
    if (!img) return null;
    var off = document.createElement('canvas');
    off.width = img.naturalWidth || img.width;
    off.height = img.naturalHeight || img.height;
    if (!off.width || !off.height) return null;
    var ctx = off.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    var id;
    try {
      id = ctx.getImageData(0, 0, off.width, off.height);
    } catch (err) {
      return null;
    }
    var bg = detectBackgroundColor(id.data, off.width, off.height);
    return analyzeImageForImport(id, bg);
  }

  function applySuggestedImportSettings(analysis) {
    if (!analysis) return;
    var tolEl = document.getElementById('st-import-tolerance');
    var tolVal = document.getElementById('st-import-tolerance-val');
    var smoothEl = document.getElementById('st-import-smooth');
    var smoothVal = document.getElementById('st-import-smooth-val');
    var speckleEl = document.getElementById('st-import-speckle');
    var speckleVal = document.getElementById('st-import-speckle-val');

    if (tolEl && analysis.suggestedTolerance != null) {
      tolEl.value = String(analysis.suggestedTolerance);
      bgTolerance = analysis.suggestedTolerance;
      if (tolVal) tolVal.textContent = String(analysis.suggestedTolerance);
    }
    if (smoothEl && analysis.suggestedSmooth != null) {
      smoothEl.value = String(analysis.suggestedSmooth);
      if (smoothVal) smoothVal.textContent = String(analysis.suggestedSmooth);
    }
    if (speckleEl && analysis.suggestedSpeckle != null) {
      speckleEl.value = String(analysis.suggestedSpeckle);
      if (speckleVal) speckleVal.textContent = String(analysis.suggestedSpeckle);
    }
  }

  function removeBackgroundPixels(id, tolerance, bgR, bgG, bgB, analysis) {
    analysis = analysis || {};
    var d = id.data;
    var colorTol = tolerance + 8;
    var darkOnLight = !!analysis.darkOnLight;
    var lightOnDark = !!analysis.lightOnDark;
    var lumCutoff = Math.min(252, Math.max(168, 255 - tolerance * 1.08));
    var i;
    var r; var g; var b; var lum; var sat; var isBg;

    for (i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 8) {
        d[i + 3] = 0;
        continue;
      }
      r = d[i];
      g = d[i + 1];
      b = d[i + 2];
      lum = 0.299 * r + 0.587 * g + 0.114 * b;
      sat = Math.max(r, g, b) - Math.min(r, g, b);
      isBg = colorDist(r, g, b, bgR, bgG, bgB) <= colorTol;

      if (darkOnLight) {
        if (!isBg && lum >= 246 && sat <= 24) isBg = true;
      } else if (lightOnDark) {
        if (!isBg && lum <= Math.max(18, 42 - tolerance * 0.12)) isBg = true;
      } else {
        if (!isBg && lum >= lumCutoff) isBg = true;
        if (!isBg && lum >= 208 && sat <= 32) isBg = true;
      }

      if (isBg) d[i + 3] = 0;
    }

    floodRemoveBackground(id, colorTol, bgR, bgG, bgB, analysis);
  }

  function applyWhiteSilhouette(id) {
    var d = id.data;
    var i;
    for (i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 8) {
        d[i + 3] = 0;
        continue;
      }
      d[i] = 255;
      d[i + 1] = 255;
      d[i + 2] = 255;
      d[i + 3] = 255;
    }
  }

  function floodRemoveBackground(id, tolerance, bgR, bgG, bgB, analysis) {
    analysis = analysis || {};
    var darkOnLight = !!analysis.darkOnLight;
    var lightOnDark = !!analysis.lightOnDark;
    var d = id.data;
    var w = id.width;
    var h = id.height;
    var visited = new Uint8Array(w * h);
    var queue = [];

    function pxIdx(x, y) { return (y * w + x) * 4; }
    function pxAt(x, y) {
      var i = pxIdx(x, y);
      return [d[i], d[i + 1], d[i + 2], d[i + 3]];
    }

    function matchesBg(x, y) {
      var c = pxAt(x, y);
      if (c[3] < 12) return true;
      if (colorDist(c[0], c[1], c[2], bgR, bgG, bgB) <= tolerance) return true;
      if (darkOnLight) return false;
      if (lightOnDark) {
        var lum = (c[0] + c[1] + c[2]) / 3;
        return lum <= 28;
      }
      var lumMixed = (c[0] + c[1] + c[2]) / 3;
      return lumMixed >= 248 - tolerance * 0.35;
    }

    function seed(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      var vi = y * w + x;
      if (visited[vi]) return;
      if (!matchesBg(x, y)) return;
      visited[vi] = 1;
      d[pxIdx(x, y) + 3] = 0;
      queue.push([x, y]);
    }

    var sx; var sy;
    for (sx = 0; sx < w; sx++) {
      seed(sx, 0);
      seed(sx, h - 1);
    }
    for (sy = 0; sy < h; sy++) {
      seed(0, sy);
      seed(w - 1, sy);
    }

    while (queue.length) {
      var p = queue.pop();
      seed(p[0] + 1, p[1]);
      seed(p[0] - 1, p[1]);
      seed(p[0], p[1] + 1);
      seed(p[0], p[1] - 1);
    }
  }

  function pixelLum(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  function computeOtsuThreshold(lums) {
    if (!lums.length) return 128;
    var hist = new Array(256);
    var t;
    for (t = 0; t < 256; t++) hist[t] = 0;
    var total = lums.length;
    var sum = 0;
    var i;
    for (i = 0; i < lums.length; i++) {
      var bin = Math.min(255, Math.max(0, Math.round(lums[i])));
      hist[bin]++;
      sum += bin;
    }
    var sumB = 0;
    var wB = 0;
    var maxVar = 0;
    var threshold = 128;
    for (t = 0; t < 256; t++) {
      wB += hist[t];
      if (!wB) continue;
      var wF = total - wB;
      if (!wF) break;
      sumB += t * hist[t];
      var mB = sumB / wB;
      var mF = (sum - sumB) / wF;
      var varBetween = wB * wF * (mB - mF) * (mB - mF);
      if (varBetween > maxVar) {
        maxVar = varBetween;
        threshold = t;
      }
    }
    return threshold;
  }

  function minDetailAreaFromSpeckle(speckle, w, h) {
    speckle = Math.max(1, Math.min(10, speckle || 4));
    var area = Math.max(1, w * h);
    var base = area * 0.000015;
    var mult = 0.35 + (speckle - 1) * 2.1 / 9;
    return Math.max(12, Math.round(base * mult));
  }

  function boxBlurLums(lums, w, h, fg) {
    var out = new Float32Array(w * h);
    var x; var y; var idx; var n; var s; var dx; var dy;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        idx = y * w + x;
        if (!fg[idx]) {
          out[idx] = 255;
          continue;
        }
        n = 0;
        s = 0;
        for (dy = -1; dy <= 1; dy++) {
          for (dx = -1; dx <= 1; dx++) {
            var nx = x + dx;
            var ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            var ni = ny * w + nx;
            if (!fg[ni]) continue;
            s += lums[ni];
            n++;
          }
        }
        out[idx] = n ? s / n : lums[idx];
      }
    }
    return out;
  }

  function removeSmallMaskComponents(mask, w, h, minArea) {
    var labels = new Int32Array(w * h);
    var areas = [0];
    var label = 0;
    var stack = [];

    function flood(startIdx) {
      label++;
      areas[label] = 0;
      stack.push(startIdx);
      while (stack.length) {
        var idx = stack.pop();
        if (idx < 0 || idx >= w * h) continue;
        if (!mask[idx] || labels[idx]) continue;
        labels[idx] = label;
        areas[label]++;
        var x = idx % w;
        var y = (idx / w) | 0;
        if (x > 0) stack.push(idx - 1);
        if (x < w - 1) stack.push(idx + 1);
        if (y > 0) stack.push(idx - w);
        if (y < h - 1) stack.push(idx + w);
      }
    }

    var i;
    for (i = 0; i < w * h; i++) {
      if (mask[i] && !labels[i]) flood(i);
    }
    for (i = 0; i < w * h; i++) {
      if (labels[i] && areas[labels[i]] < minArea) mask[i] = 0;
    }
  }

  function morphOpenMask(mask, w, h) {
    var eroded = new Uint8Array(w * h);
    var opened = new Uint8Array(w * h);
    var x; var y; var idx; var dx; var dy; var ok;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        idx = y * w + x;
        if (!mask[idx]) continue;
        ok = true;
        for (dy = -1; dy <= 1 && ok; dy++) {
          for (dx = -1; dx <= 1 && ok; dx++) {
            var nx = x + dx;
            var ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h || !mask[ny * w + nx]) ok = false;
          }
        }
        if (ok) eroded[idx] = 1;
      }
    }
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        idx = y * w + x;
        if (!eroded[idx]) continue;
        for (dy = -1; dy <= 1; dy++) {
          for (dx = -1; dx <= 1; dx++) {
            var nx = x + dx;
            var ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            opened[ny * w + nx] = 1;
          }
        }
      }
    }
    for (idx = 0; idx < w * h; idx++) mask[idx] = opened[idx];
  }

  function binarizeForTrace(id, analysis, opts) {
    analysis = analysis || {};
    opts = opts || {};
    var d = id.data;
    var w = id.width;
    var h = id.height;
    var darkOnLight = analysis.darkOnLight !== false;
    var lightOnDark = !!analysis.lightOnDark;
    var fg = new Uint8Array(w * h);
    var lums = new Float32Array(w * h);
    var lumsList = [];
    var maxSat = 0;
    var i; var pi; var r; var g; var b; var lum; var sat;

    for (i = 0; i < d.length; i += 4) {
      pi = i >> 2;
      if (d[i + 3] < 8) continue;
      r = d[i];
      g = d[i + 1];
      b = d[i + 2];
      lum = pixelLum(r, g, b);
      sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (sat > maxSat) maxSat = sat;
      fg[pi] = 1;
      lums[pi] = lum;
      lumsList.push(lum);
    }

    var colorful = maxSat >= 36 && lumsList.length > 64;
    var workLums = colorful ? boxBlurLums(lums, w, h, fg) : lums;
    if (colorful) {
      lumsList = [];
      for (i = 0; i < w * h; i++) {
        if (fg[i]) lumsList.push(workLums[i]);
      }
    }

    var threshold = computeOtsuThreshold(lumsList);
    if (analysis.contentLum != null && analysis.bgLum != null) {
      var mid = (analysis.bgLum + analysis.contentLum) * 0.5;
      threshold = darkOnLight
        ? Math.min(threshold, mid + 12)
        : Math.max(threshold, mid - 12);
    }

    var shape = new Uint8Array(w * h);
    for (i = 0; i < d.length; i += 4) {
      pi = i >> 2;
      if (!fg[pi]) continue;
      lum = workLums[pi];
      var isShape = lightOnDark ? lum >= threshold : lum <= threshold;
      shape[pi] = isShape ? 1 : 0;
    }

    var minArea = opts.minDetailArea != null
      ? opts.minDetailArea
      : minDetailAreaFromSpeckle(opts.speckle || 4, w, h);
    if (colorful && opts.morphOpen !== false) morphOpenMask(shape, w, h);
    removeSmallMaskComponents(shape, w, h, minArea);

    for (i = 0; i < d.length; i += 4) {
      pi = i >> 2;
      if (shape[pi]) {
        d[i] = 255;
        d[i + 1] = 255;
        d[i + 2] = 255;
        d[i + 3] = 255;
      } else {
        d[i] = 0;
        d[i + 1] = 0;
        d[i + 2] = 0;
        d[i + 3] = 0;
      }
    }

    return { threshold: threshold, colorful: colorful, minArea: minArea };
  }

  function getImportMinDetailArea(w, h) {
    var speckleEl = document.getElementById('st-import-speckle');
    var speckle = speckleEl ? parseInt(speckleEl.value, 10) : 4;
    return minDetailAreaFromSpeckle(speckle, w || 1, h || 1);
  }

  function processImageForTrace(img, opts) {
    opts = opts || {};
    var tolerance = opts.tolerance != null ? opts.tolerance : bgTolerance;
    var off = document.createElement('canvas');
    off.width = img.naturalWidth || img.width;
    off.height = img.naturalHeight || img.height;
    if (!off.width || !off.height) return off;
    var oc = off.getContext('2d', { willReadFrequently: true });
    oc.clearRect(0, 0, off.width, off.height);
    oc.drawImage(img, 0, 0);
    var id;
    try {
      id = oc.getImageData(0, 0, off.width, off.height);
    } catch (err) {
      return off;
    }

    var analysis = opts.analysis || null;
    var bg = detectBackgroundColor(id.data, off.width, off.height);
    if (!analysis) analysis = analyzeImageForImport(id, bg);
    removeBackgroundPixels(id, tolerance, bg.r, bg.g, bg.b, analysis);

    var speckleEl = document.getElementById('st-import-speckle');
    var speckle = opts.speckle != null ? opts.speckle : (speckleEl ? parseInt(speckleEl.value, 10) : 4);
    var binMeta = binarizeForTrace(id, analysis, {
      speckle: speckle,
      minDetailArea: opts.minDetailArea != null
        ? opts.minDetailArea
        : minDetailAreaFromSpeckle(speckle, off.width, off.height),
      morphOpen: opts.morphOpen !== false,
    });

    oc.putImageData(id, 0, 0);
    off.__alphaStats = countImageAlphaStats(id.data);
    off.__traceMeta = binMeta;
    off.__importAnalysis = analysis;
    return off;
  }

  function processImageForSticker(img, opts) {
    opts = opts || {};
    var removeBackground = opts.removeBackground !== false;
    var tolerance = opts.tolerance != null ? opts.tolerance : bgTolerance;
    var off = document.createElement('canvas');
    off.width = img.naturalWidth || img.width;
    off.height = img.naturalHeight || img.height;
    if (!off.width || !off.height) return off;
    var oc = off.getContext('2d', { willReadFrequently: true });
    oc.clearRect(0, 0, off.width, off.height);
    oc.drawImage(img, 0, 0);
    var id;
    try {
      id = oc.getImageData(0, 0, off.width, off.height);
    } catch (err) {
      return off;
    }

    var analysis = opts.analysis || null;
    if (removeBackground) {
      var bg = detectBackgroundColor(id.data, off.width, off.height);
      if (!analysis) analysis = analyzeImageForImport(id, bg);
      removeBackgroundPixels(id, tolerance, bg.r, bg.g, bg.b, analysis);
    }

    applyWhiteSilhouette(id);
    oc.putImageData(id, 0, 0);
    off.__alphaStats = countImageAlphaStats(id.data);
    return off;
  }

  function buildBackgroundRemovedCanvas(img, tolerance) {
    return processImageForSticker(img, { removeBackground: true, tolerance: tolerance });
  }

  function removeBackgroundFromImage(img, cb, tolerance) {
    var off = buildBackgroundRemovedCanvas(img, tolerance);
    var out = new Image();
    out.onload = function () { cb(out); };
    out.src = off.toDataURL('image/png');
  }

  var importDialogState = {
    file: null,
    isSvg: false,
    svgText: null,
    vectorData: null,
    svgRasterOnly: false,
    sourceImg: null,
    previewTimer: 0,
    contourTimer: 0,
    processedCanvas: null,
    tracePreviewData: null,
    tracePreviewGen: 0,
    tracePreviewBusy: false,
    confirming: false,
    importAnalysis: null,
  };

  function getImportTraceOptions() {
    if (window.ST_TRACE && ST_TRACE.traceOptionsFromSliders) {
      return ST_TRACE.traceOptionsFromSliders(
        document.getElementById('st-import-smooth'),
        document.getElementById('st-import-speckle')
      );
    }
    var analysis = importDialogState.importAnalysis;
    return {
      smoothness: analysis && analysis.suggestedSmooth ? analysis.suggestedSmooth : 6,
      speckle: analysis && analysis.suggestedSpeckle ? analysis.suggestedSpeckle : 4,
      pathPrecision: 6,
      opttolerance: 0.35,
      filterSpeckle: 4,
      turdsize: 4,
    };
  }

  function setImportConfirmBusy(busy) {
    var confirmSvg = document.getElementById('st-import-confirm-svg');
    if (confirmSvg) confirmSvg.disabled = !!busy;
    updateImportActionRows();
  }

  function updateImportActionRows() {
    var defaultActions = document.getElementById('st-import-actions-default');
    if (defaultActions) defaultActions.hidden = false;

    var hasPaths = !!(importDialogState.vectorData && importDialogState.vectorData.paths && importDialogState.vectorData.paths.length);
    var confirmSvg = document.getElementById('st-import-confirm-svg');
    if (confirmSvg) {
      confirmSvg.disabled = importDialogState.confirming || !hasPaths;
      if (importDialogState.svgRasterOnly && !hasPaths) {
        confirmSvg.textContent = 'Само вградена снимка — нужен е векторен SVG';
      } else {
        confirmSvg.textContent = hasPaths ? 'Добави векторен слой' : 'Няма path елементи';
      }
    }
  }

  function readFileAsText(file, cb) {
    var reader = new FileReader();
    reader.onload = function () { cb(null, reader.result); };
    reader.onerror = function () { cb(new Error('read')); };
    reader.readAsText(file);
  }

  function drawVectorPreviewOnCanvas(vectorData) {
    var canvas = document.getElementById('st-import-preview');
    if (!canvas || !vectorData || !vectorData.paths || !vectorData.paths.length) return false;
    var refW = vectorData.contentW || vectorData.viewW || 100;
    var refH = vectorData.contentH || vectorData.viewH || 100;
    if (!refW || !refH) {
      refW = 100;
      refH = 100;
    }
    var maxW = 360;
    var maxH = 260;
    var scale = Math.min(maxW / refW, maxH / refH, 1);
    var dw = Math.max(1, Math.round(refW * scale));
    var dh = Math.max(1, Math.round(refH * scale));
    canvas.width = dw;
    canvas.height = dh;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, dw, dh);
    ctx.save();
    ctx.scale(dw / refW, dh / refH);
    if (vectorData.offsetX || vectorData.offsetY) {
      ctx.translate(-(vectorData.offsetX || 0), -(vectorData.offsetY || 0));
    }
    ctx.fillStyle = '#ffffff';
    vectorData.paths.forEach(function (d) {
      try {
        ctx.fill(new Path2D(d), 'evenodd');
      } catch (e) { /* skip invalid path */ }
    });
    ctx.restore();
    return true;
  }

  function drawVectorDataOnCanvas(vectorData, canvas, maxDim) {
    if (!canvas || !vectorData || !vectorData.paths || !vectorData.paths.length) return false;
    var refW = vectorData.contentW || vectorData.viewW || 100;
    var refH = vectorData.contentH || vectorData.viewH || 100;
    maxDim = maxDim || 900;
    var scale = Math.min(1, maxDim / Math.max(refW, refH));
    var cw = Math.max(1, Math.round(refW * scale));
    var ch = Math.max(1, Math.round(refH * scale));
    canvas.width = cw;
    canvas.height = ch;
    var ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(cw / refW, ch / refH);
    if (vectorData.offsetX || vectorData.offsetY) {
      ctx.translate(-(vectorData.offsetX || 0), -(vectorData.offsetY || 0));
    }
    ctx.fillStyle = '#ffffff';
    vectorData.paths.forEach(function (d) {
      try {
        ctx.fill(new Path2D(d), 'evenodd');
      } catch (e) { /* skip */ }
    });
    ctx.restore();
    return true;
  }

  function rasterizeSvgTextToCanvas(svgText, cb) {
    if (window.ST_VECTOR && ST_VECTOR.parseSvgPaths) {
      var parsed = ST_VECTOR.parseSvgPaths(svgText);
      if (parsed.paths && parsed.paths.length) {
        var off = document.createElement('canvas');
        if (drawVectorDataOnCanvas(parsed, off, 900)) {
          cb(off);
          return;
        }
      }
    }

    var blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(url);
      var w = img.naturalWidth || 512;
      var h = img.naturalHeight || 512;
      var off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      off.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(off);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      cb(null);
    };
    img.src = url;
  }

  function resetImportDialogState() {
    importDialogState.file = null;
    importDialogState.isSvg = false;
    importDialogState.svgText = null;
    importDialogState.vectorData = null;
    importDialogState.svgRasterOnly = false;
    importDialogState.sourceImg = null;
    importDialogState.processedCanvas = null;
    importDialogState.tracePreviewData = null;
    importDialogState.tracePreviewGen = 0;
    importDialogState.tracePreviewBusy = false;
    importDialogState.confirming = false;
    importDialogState.importAnalysis = null;
    clearTimeout(importDialogState.previewTimer);
    clearTimeout(importDialogState.contourTimer);
    setImportConfirmBusy(false);
  }

  function closeImportDialog() {
    var dialog = document.getElementById('st-import-dialog');
    if (dialog && dialog.open) dialog.close();
    resetImportDialogState();
    var uploadEl = document.getElementById('st-upload');
    if (uploadEl) uploadEl.value = '';
  }

  function drawImportPreviewCanvas(source, contourData) {
    var canvas = document.getElementById('st-import-preview');
    if (!canvas || !source) return;
    var iw = source.naturalWidth || source.width;
    var ih = source.naturalHeight || source.height;
    if (!iw || !ih) return;
    var maxW = 360;
    var maxH = 260;
    var scale = Math.min(maxW / iw, maxH / ih, 1);
    var dw = Math.max(1, Math.round(iw * scale));
    var dh = Math.max(1, Math.round(ih * scale));
    canvas.width = dw;
    canvas.height = dh;
    var pctx = canvas.getContext('2d');
    pctx.fillStyle = '#ffffff';
    pctx.fillRect(0, 0, dw, dh);

    var tmp = document.createElement('canvas');
    tmp.width = iw;
    tmp.height = ih;
    var tctx = tmp.getContext('2d', { willReadFrequently: true });
    tctx.drawImage(source, 0, 0);
    var id;
    try {
      id = tctx.getImageData(0, 0, iw, ih);
    } catch (err) {
      pctx.drawImage(source, 0, 0, dw, dh);
      return;
    }
    var d = id.data;
    var i;
    for (i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 128) {
        d[i] = 0;
        d[i + 1] = 0;
        d[i + 2] = 0;
        d[i + 3] = 255;
      } else {
        d[i] = 255;
        d[i + 1] = 255;
        d[i + 2] = 255;
        d[i + 3] = 255;
      }
    }
    tctx.putImageData(id, 0, 0);
    pctx.drawImage(tmp, 0, 0, dw, dh);

    if (contourData && contourData.paths && contourData.paths.length && window.ST_TRACE) {
      var refW = contourData.viewW || iw;
      var refH = contourData.viewH || ih;
      ST_TRACE.drawContourOverlay(pctx, contourData, refW, refH, dw, dh);
    }
  }

  function refreshImportPreview() {
    var source = importDialogState.sourceImg;
    var previewHint = document.getElementById('st-import-preview-hint');
    if (!source && !importDialogState.isSvg) return;

    if (importDialogState.isSvg) {
      importDialogState.processedCanvas = null;
      if (importDialogState.vectorData && drawVectorPreviewOnCanvas(importDialogState.vectorData)) {
        if (previewHint) {
          previewHint.textContent = importDialogState.svgRasterOnly
            ? 'SVG с вградено изображение — векторният слой не е възможен. Ползвай „Добави като изображение“.'
            : 'Превю на векторните контури (бяло върху прозрачно).';
        }
        updateImportStats(null, false);
        return;
      }
      if (importDialogState.svgText) {
        rasterizeSvgTextToCanvas(importDialogState.svgText, function (canvas) {
          if (canvas) drawImportPreviewCanvas(canvas);
          if (previewHint) {
            previewHint.textContent = canvas
              ? 'SVG превю — ако липсват path елементи, ползвай „Добави като изображение“.'
              : 'Неуспешен преглед на SVG.';
          }
        });
      }
      updateImportStats(null, false);
      return;
    }

    var tolEl = document.getElementById('st-import-tolerance');
    var tolerance = tolEl ? parseFloat(tolEl.value) : bgTolerance;
    importDialogState.processedCanvas = processImageForTrace(source, {
      tolerance: tolerance,
      analysis: importDialogState.importAnalysis,
    });
    importDialogState.tracePreviewData = null;
    drawImportPreviewCanvas(importDialogState.processedCanvas, null);
    updateImportStats(importDialogState.processedCanvas.__alphaStats, true);
    if (previewHint) {
      var meta = importDialogState.processedCanvas.__traceMeta;
      if (importDialogState.tracePreviewBusy) {
        previewHint.textContent = 'Trace на контура… (VTracer + Potrace в worker)';
      } else if (meta && meta.colorful) {
        previewHint.textContent = 'Цветната снимка е сведена до черно-бяло; зеленият контур = trace.';
      } else {
        previewHint.textContent = 'Черно-бяло превю + зелен контур преди векторен слой.';
      }
    }
    updateImportActionRows();
    scheduleImportContourPreview();
  }

  function scheduleImportContourPreview() {
    clearTimeout(importDialogState.contourTimer);
    importDialogState.contourTimer = setTimeout(refreshImportContourPreview, 120);
  }

  function refreshImportContourPreview() {
    if (importDialogState.isSvg) return;
    var canvas = importDialogState.processedCanvas;
    if (!canvas || !window.ST_TRACE || !ST_TRACE.traceCanvasAsync) return;

    var gen = ++importDialogState.tracePreviewGen;
    importDialogState.tracePreviewBusy = true;
    updateImportActionRows();

    var previewHint = document.getElementById('st-import-preview-hint');
    if (previewHint) {
      previewHint.textContent = 'Trace на контура… (VTracer + Potrace в worker)';
    }

    var traceOpts = getImportTraceOptions();
    ST_TRACE.traceCanvasAsync(canvas, traceOpts).then(function (raw) {
      if (gen !== importDialogState.tracePreviewGen) return;
      importDialogState.tracePreviewBusy = false;
      var vectorData = raw;
      if (window.ST_VECTOR && ST_VECTOR.normalizeVectorData) {
        vectorData = ST_VECTOR.normalizeVectorData(raw);
      }
      importDialogState.tracePreviewData = vectorData;
      drawImportPreviewCanvas(canvas, vectorData);

      if (previewHint) {
        if (vectorData.paths && vectorData.paths.length) {
          var engine = raw.engine === 'vtracer' ? 'VTracer' : 'Potrace';
          previewHint.textContent = 'Контур (' + engine + ', ' + vectorData.paths.length + ' path) — готов за векторен слой.';
        } else {
          previewHint.textContent = 'Trace не намери контури — опитай друга чувствителност или speckles.';
        }
      }
      updateImportActionRows();
    }).catch(function () {
      if (gen !== importDialogState.tracePreviewGen) return;
      importDialogState.tracePreviewBusy = false;
      importDialogState.tracePreviewData = null;
      if (previewHint) previewHint.textContent = 'Trace не успя — ползвай растерен слой.';
      updateImportActionRows();
    });
  }

  function scheduleImportPreview() {
    clearTimeout(importDialogState.previewTimer);
    importDialogState.previewTimer = setTimeout(refreshImportPreview, 80);
  }

  function imageFromCanvas(canvas, cb) {
    var out = new Image();
    out.onerror = function () { cb(null); };
    out.onload = function () { cb(out); };
    out.src = canvas.toDataURL('image/png');
  }

  function confirmImportDialog() {
    if (importDialogState.confirming) return;

    var file = importDialogState.file;
    var source = importDialogState.sourceImg;
    if (!file || !source || importDialogState.isSvg) {
      closeImportDialog();
      return;
    }

    var tolEl = document.getElementById('st-import-tolerance');
    removeBg = true;
    if (tolEl) bgTolerance = parseFloat(tolEl.value);

    importDialogState.confirming = true;
    setImportConfirmBusy(true);

    function finish(imgEl, stickerProcessed) {
      if (!imgEl) {
        importDialogState.confirming = false;
        setImportConfirmBusy(false);
        window.alert('Файлът не може да се обработи. Опитай отново или с друг формат.');
        return;
      }
      addLayer(makeImageLayer(imgEl, file.name, false, { stickerProcessed: !!stickerProcessed }));
      closeImportDialog();
      markDraftDirty();
    }

    clearTimeout(importDialogState.previewTimer);
    refreshImportPreview();

    if (importDialogState.processedCanvas) {
      imageFromCanvas(importDialogState.processedCanvas, function (out) {
        finish(out, true);
      });
      return;
    }

    removeBackgroundFromImage(source, function (out) {
      finish(out, true);
    }, bgTolerance);
  }

  function confirmImportDialogSvgRaster() {
    if (importDialogState.confirming) return;

    var file = importDialogState.file;
    var svgText = importDialogState.svgText;
    if (!file || !svgText) {
      closeImportDialog();
      return;
    }

    importDialogState.confirming = true;
    setImportConfirmBusy(true);

    rasterizeSvgTextToCanvas(svgText, function (canvas) {
      if (!canvas) {
        importDialogState.confirming = false;
        setImportConfirmBusy(false);
        window.alert('SVG не може да се растеризира.');
        return;
      }
      imageFromCanvas(canvas, function (imgEl) {
        if (!imgEl) {
          importDialogState.confirming = false;
          setImportConfirmBusy(false);
          window.alert('SVG не може да се добави като изображение.');
          return;
        }
        addLayer(makeImageLayer(imgEl, file.name, false, { stickerProcessed: true }));
        closeImportDialog();
        markDraftDirty();
      });
    });
  }

  function confirmImportDialogVector() {
    if (importDialogState.confirming) return;

    var file = importDialogState.file;
    if (!file) {
      closeImportDialog();
      return;
    }

    if (importDialogState.isSvg) {
      if (importDialogState.svgRasterOnly) {
        window.alert('Този SVG съдържа само вградена снимка, без path контури. Експортирай отново като векторен SVG.');
        return;
      }
      var vd = importDialogState.vectorData;
      if (!vd || !vd.paths || !vd.paths.length) {
        window.alert('SVG файлът няма path елементи. Нужен е векторен SVG с контури.');
        return;
      }
      importDialogState.confirming = true;
      setImportConfirmBusy(true);
      addLayer(makeVectorLayer(file.name, vd));
      closeImportDialog();
      markDraftDirty();
      return;
    }

    closeImportDialog();
  }

  function openImportDialogAfterLoad(file) {
    var dialog = document.getElementById('st-import-dialog');
    if (!dialog) return;

    var nameEl = document.getElementById('st-import-filename');
    var svgNote = document.getElementById('st-import-svg-note');

    importDialogState.confirming = false;
    setImportConfirmBusy(false);

    if (nameEl) nameEl.textContent = file.name;
    if (svgNote) svgNote.hidden = false;
    updateImportActionRows();

    refreshImportPreview();
    if (typeof dialog.showModal === 'function') dialog.showModal();
  }

  function openImportDialog(file) {
    var dialog = document.getElementById('st-import-dialog');
    if (!isSvgUploadFile(file)) {
      window.alert(SVG_UPLOAD_ONLY_MSG);
      return;
    }
    if (!dialog) {
      loadImageFileDirect(file);
      return;
    }

    resetImportDialogState();
    importDialogState.file = file;
    importDialogState.isSvg = true;

    readFileAsText(file, function (err, text) {
      if (err || !text) {
        window.alert('Файлът не може да се прочете.');
        resetImportDialogState();
        return;
      }
      importDialogState.svgText = text;
      if (window.ST_VECTOR && ST_VECTOR.prepareSvgImport) {
        var svgImport = ST_VECTOR.prepareSvgImport(text);
        importDialogState.vectorData = svgImport.vectorData;
        importDialogState.svgRasterOnly = !!svgImport.rasterOnly;
      } else {
        importDialogState.vectorData = (window.ST_VECTOR && ST_VECTOR.parseSvgPaths)
          ? ST_VECTOR.parseSvgPaths(text)
          : { paths: [], viewW: 0, viewH: 0 };
        importDialogState.svgRasterOnly = false;
      }
      openImportDialogAfterLoad(file);
    });
  }

  var SVG_UPLOAD_ONLY_MSG = 'Приемат се само SVG файлове с векторни контури (path). PNG, JPG и WebP не се поддържат — експортирай логото като SVG от Inkscape, Illustrator или Figma.';

  function loadImageFileDirect(file) {
    if (!isSvgUploadFile(file)) {
      window.alert(SVG_UPLOAD_ONLY_MSG);
      return;
    }
    readFileAsText(file, function (err, text) {
      if (err || !text) {
        window.alert('Файлът не може да се прочете.');
        return;
      }
      if (window.ST_VECTOR && ST_VECTOR.prepareSvgImport) {
        var svgImport = ST_VECTOR.prepareSvgImport(text);
        var vd = svgImport.vectorData;
        if (vd && vd.paths && vd.paths.length) {
          addLayer(makeVectorLayer(file.name, vd));
          markDraftDirty();
          return;
        }
        if (svgImport.rasterOnly) {
          window.alert('Този SVG съдържа само вградена снимка, без path контури. Експортирай отново като векторен SVG.');
          return;
        }
      } else {
        var legacyVd = (window.ST_VECTOR && ST_VECTOR.parseSvgPaths)
          ? ST_VECTOR.parseSvgPaths(text)
          : null;
        if (legacyVd && legacyVd.paths && legacyVd.paths.length) {
          addLayer(makeVectorLayer(file.name, legacyVd));
          markDraftDirty();
          return;
        }
      }
      window.alert('SVG файлът няма path елементи. Нужен е векторен SVG с контури.');
    });
  }

  function loadImageFile(file) {
    if (!isSvgUploadFile(file)) {
      window.alert(SVG_UPLOAD_ONLY_MSG);
      return;
    }
    openImportDialog(file);
  }

  function initImportDialog() {
    var dialog = document.getElementById('st-import-dialog');
    if (!dialog) return;

    on('st-import-cancel-svg', 'click', closeImportDialog);
    on('st-import-close-x', 'click', closeImportDialog);
    on('st-import-confirm-svg', 'click', confirmImportDialogVector);

    dialog.addEventListener('cancel', function (e) {
      e.preventDefault();
    });
  }

  function buildMsg() {
    var lines = [
      'Здравейте! Искам да поръчам стикери.',
      '',
      'Категория:   ' + CFG.title,
      'Размер:      ' + stickerSize.widthCm + ' × ' + stickerSize.heightCm + ' cm',
      'Ориент. цена: ' + (window.Pricing ? Pricing.format(getPrice()) : getPrice() + ' ' + CFG.currency),
      '',
      'Слоеве (' + layers.length + '):',
    ];
    layers.forEach(function (layer, i) {
      if (layer.type === 'text') {
        var txt = getLayerText(layer).replace(/\n/g, ' / ');
        var alignLabel = layer.textAlign === 'left' ? ' · ляво' : layer.textAlign === 'right' ? ' · дясно' : '';
        lines.push('  ' + (i + 1) + '. Текст: "' + txt + '" · ' + layer.font + alignLabel);
      } else if (layer.type === 'vector') {
        lines.push('  ' + (i + 1) + '. Вектор: ' + layer.fileName);
      } else {
        lines.push('  ' + (i + 1) + '. Файл: ' + layer.fileName + ' (SVG)');
      }
    });
    lines.push('');
    lines.push('Моля прикачи SVG файла.');
    return lines.join('\n');
  }

  function updateLinks() {
    var msg = buildMsg();
    var waHref = window.getWaLink ? getWaLink(msg) : 'https://wa.me/359884121606?text=' + encodeURIComponent(msg);
    var emailHref = window.getEmailLink
      ? getEmailLink('Поръчка: Стикери', msg)
      : 'mailto:info@savovpro.com?subject=' + encodeURIComponent('Поръчка: Стикери') + '&body=' + encodeURIComponent(msg);
    ['btn-wa', 'btn-wa-mobile'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.href = waHref;
    });
    ['btn-email', 'btn-email-mobile'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.href = emailHref;
    });
  }

  function captureLayerItemRects(list) {
    var rects = {};
    if (!list) return rects;
    list.querySelectorAll('.cfg-layer-item[data-layer-id]').forEach(function (item) {
      rects[item.dataset.layerId] = item.getBoundingClientRect();
    });
    return rects;
  }

  function applyPanelOrderToLayers(panelOrderTopToBottom) {
    var byId = {};
    layers.forEach(function (l) { byId[l.id] = l; });
    var next = panelOrderTopToBottom.slice().reverse().map(function (id) { return byId[id]; }).filter(Boolean);
    if (next.length !== layers.length) return false;
    layers = next;
    return true;
  }

  function collectPanelOrderFromList(list, placeholder, draggedId, draggedItem) {
    var order = [];
    Array.from(list.children).forEach(function (node) {
      if (node === draggedItem) return;
      if (node === placeholder) order.push(draggedId);
      else if (node.dataset && node.dataset.layerId) order.push(Number(node.dataset.layerId));
    });
    return order;
  }

  function updateLayerListPlaceholder(e) {
    if (!layerListDrag.active || !layerListDrag.list || !layerListDrag.placeholder) return;
    var list = layerListDrag.list;
    var placeholder = layerListDrag.placeholder;
    var draggedItem = layerListDrag.item;
    var insertBefore = null;
    var i;
    for (i = 0; i < list.children.length; i++) {
      var node = list.children[i];
      if (node === draggedItem || node === placeholder) continue;
      if (!node.classList || !node.classList.contains('cfg-layer-item')) continue;
      var rect = node.getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        insertBefore = node;
        break;
      }
    }
    if (insertBefore) list.insertBefore(placeholder, insertBefore);
    else list.appendChild(placeholder);
  }

  function finishLayerListDrag(commit) {
    if (!layerListDrag.active) return;
    var list = layerListDrag.list;
    var placeholder = layerListDrag.placeholder;
    var item = layerListDrag.item;
    var ghost = layerListDrag.ghost;
    var layerId = layerListDrag.layerId;
    var panelOrder = collectPanelOrderFromList(list, placeholder, layerId, item);

    document.removeEventListener('pointermove', onLayerListDragMove);
    document.removeEventListener('pointerup', finishLayerListDragOnUp);
    document.removeEventListener('pointercancel', finishLayerListDragOnUp);
    document.body.classList.remove('cfg-layer-dragging');

    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);

    var committed = false;
    if (commit && panelOrder.length === layers.length && applyPanelOrderToLayers(panelOrder)) {
      if (placeholder && placeholder.parentNode && item) {
        list.insertBefore(item, placeholder);
        placeholder.parentNode.removeChild(placeholder);
      }
      if (item) {
        item.classList.remove('is-dragging-source');
        item.style.removeProperty('display');
      }
      committed = true;
      updateLayerHint();
      drawPreview();
      saveHistory();
    } else {
      if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
      if (item) {
        item.classList.remove('is-dragging-source');
        item.style.removeProperty('display');
      }
      renderLayersPanel();
    }

    layerListDrag.active = false;
    layerListDrag.layerId = null;
    layerListDrag.item = null;
    layerListDrag.ghost = null;
    layerListDrag.placeholder = null;
    layerListDrag.list = null;
  }

  function finishLayerListDragOnUp() {
    finishLayerListDrag(true);
  }

  function onLayerListDragMove(e) {
    if (!layerListDrag.active || !layerListDrag.ghost) return;
    e.preventDefault();
    layerListDrag.ghost.style.top = (e.clientY - layerListDrag.offsetY) + 'px';
    layerListDrag.ghost.style.left = layerListDrag.ghostLeft + 'px';
    updateLayerListPlaceholder(e);
  }

  function beginLayerListDrag(e, item, layerId) {
    if (e.button !== 0 || layerListDrag.active) return;
    e.preventDefault();
    e.stopPropagation();

    var list = item.parentElement;
    if (!list) return;
    var rect = item.getBoundingClientRect();

    var ghost = item.cloneNode(true);
    ghost.classList.add('cfg-layer-ghost');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    document.body.appendChild(ghost);

    var placeholder = document.createElement('div');
    placeholder.className = 'cfg-layer-placeholder';
    placeholder.style.height = rect.height + 'px';
    list.insertBefore(placeholder, item);

    item.classList.add('is-dragging-source');
    item.style.display = 'none';

    layerListDrag.active = true;
    layerListDrag.layerId = layerId;
    layerListDrag.item = item;
    layerListDrag.ghost = ghost;
    layerListDrag.placeholder = placeholder;
    layerListDrag.list = list;
    layerListDrag.offsetY = e.clientY - rect.top;
    layerListDrag.ghostLeft = rect.left;

    document.body.classList.add('cfg-layer-dragging');
    document.addEventListener('pointermove', onLayerListDragMove);
    document.addEventListener('pointerup', finishLayerListDragOnUp);
    document.addEventListener('pointercancel', finishLayerListDragOnUp);

    if (e.currentTarget.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  }

  function animateLayerItemsFlip(list, oldRects, opts) {
    if (!list || !oldRects) return;
    opts = opts || {};
    var FLIP_MS = 280;
    var FLIP_EASE = 'cubic-bezier(0.2, 0, 0, 1)';
    var items = list.querySelectorAll('.cfg-layer-item[data-layer-id]');

    items.forEach(function (item) {
      var lid = item.dataset.layerId;
      var last = item.getBoundingClientRect();
      var first = oldRects[lid];
      var isEnter = opts.enterLayerId != null && String(opts.enterLayerId) === lid;

      if (isEnter && opts.fromLayerId != null) {
        first = oldRects[String(opts.fromLayerId)] || first;
      }
      if (!first) return;

      var dx = 0;
      var dy = first.top - last.top;

      item.classList.add('is-flipping');

      if (Math.abs(dy) < 0.5) {
        if (!isEnter) {
          item.classList.remove('is-flipping');
          return;
        }
        var fade = item.animate(
          [{ opacity: 0.5 }, { opacity: 1 }],
          { duration: 160, easing: 'ease-out', fill: 'both' }
        );
        fade.finished.then(function () {
          fade.cancel();
          item.classList.remove('is-flipping');
        }).catch(function () { item.classList.remove('is-flipping'); });
        return;
      }

      var anim = item.animate(
        [
          { transform: 'translate3d(0,' + dy + 'px,0)' },
          { transform: 'translate3d(0,0,0)' },
        ],
        { duration: FLIP_MS, easing: FLIP_EASE, fill: 'both' }
      );
      anim.finished.then(function () {
        anim.cancel();
        item.classList.remove('is-flipping');
      }).catch(function () { item.classList.remove('is-flipping'); });
    });
  }

  function renderLayersPanel(animateReorder) {
    var list = document.getElementById('st-layers-list');
    if (!list) return;
    var oldRects = animateReorder ? captureLayerItemRects(list) : null;
    list.innerHTML = '';
    if (!layers.length) {
      list.innerHTML = '<p class="cfg-layers-empty">Добави текст или SVG файл.</p>';
      updateLayerHint();
      return;
    }
    layers.slice().reverse().forEach(function (layer) {
      var name = layer.type === 'text'
        ? textLayerDisplayName(layer)
        : (layer.fileName || layer.name || 'слой');
      if (name.length > 20) name = name.slice(0, 18) + '…';
      var item = document.createElement('div');
      item.className = 'cfg-layer-item'
        + (isLayerSelected(layer.id) ? ' is-selected' : '')
        + (isLayerPrimary(layer.id) ? ' is-primary' : '')
        + (!layer.visible ? ' is-hidden' : '');
      item.dataset.layerId = String(layer.id);
      item.innerHTML =
        '<span class="cfg-layer-drag">⋮⋮</span>' +
        '<span class="cfg-layer-badge cfg-layer-badge--' + layer.type + '">' + TYPE_SVG[layer.type] + '</span>' +
        '<span class="cfg-layer-name">' + escHtml(name) + '</span>' +
        '<button class="cfg-layer-dup" type="button" title="Дублирай">' + DUP_SVG + '</button>' +
        '<button class="cfg-layer-vis" type="button">' + (layer.visible ? EYE_SVG : EYE_OFF_SVG) + '</button>' +
        '<button class="cfg-layer-del" type="button">✕</button>';
      item.addEventListener('click', function (e) {
        if (e.target.closest('.cfg-layer-drag')) return;
        if (e.target.closest('.cfg-layer-vis') || e.target.closest('.cfg-layer-del') || e.target.closest('.cfg-layer-dup')) return;
        if (e.metaKey || e.ctrlKey) selectLayer(layer.id, { toggle: true });
        else if (e.shiftKey) selectLayer(layer.id, { add: true });
        else selectLayer(layer.id);
      });
      item.querySelector('.cfg-layer-dup').addEventListener('click', function (e) {
        e.stopPropagation();
        duplicateLayerById(layer.id);
      });
      item.querySelector('.cfg-layer-vis').addEventListener('click', function (e) {
        e.stopPropagation();
        layer.visible = !layer.visible;
        renderLayersPanel();
        drawPreview();
      });
      item.querySelector('.cfg-layer-del').addEventListener('click', function (e) {
        e.stopPropagation();
        deleteLayerById(layer.id);
      });
      var dragHandle = item.querySelector('.cfg-layer-drag');
      if (dragHandle) {
        dragHandle.addEventListener('pointerdown', function (e) {
          beginLayerListDrag(e, item, layer.id);
        });
      }
      list.appendChild(item);
    });
    if (oldRects) animateLayerItemsFlip(list, oldRects);
    updateLayerHint();
  }

  function getLayerSizeCm(layer, rect) {
    if (!layer || !rect) return null;
    var box = getLayerContentBox(layer, rect);
    var wb = getLayerWorldBounds(box);
    if (!wb) return null;
    var wCm = pxToMm(wb.maxX - wb.minX, rect.w, stickerSize.widthCm * 10) / 10;
    var hCm = pxToMm(wb.maxY - wb.minY, rect.h, stickerSize.heightCm * 10) / 10;
    return {
      w: Math.round(wCm * 10) / 10,
      h: Math.round(hCm * 10) / 10,
    };
  }

  function updateLayerSizeLabel(rect) {
    var el = document.getElementById('st-layer-size');
    if (!el) return;
    if (selectedLayerIds.length !== 1) {
      el.hidden = true;
      return;
    }
    var layer = getSelectedLayer();
    if (!layer) {
      el.hidden = true;
      return;
    }
    rect = rect || getStickerRect();
    var size = getLayerSizeCm(layer, rect);
    if (!size) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.textContent = 'Размер на слоя: ' + size.w + ' × ' + size.h + ' cm';
  }

  function updateLayerHint() {
    var hint = document.getElementById('st-layer-hint');
    if (!hint) return;
    var sel = getSelectedLayer();
    var n = selectedLayerIds.length;
    if (n > 1) {
      hint.textContent = n + ' избрани слоя · плъзни един = местиш всички · ⌘A = всички';
      return;
    }
    if (sel && sel.type === 'text') hint.textContent = '↻ горе = завърти · ↗ ъгъл = мащаб · ⊕ долу = мести (или влачи текста)';
    else if (sel && sel.type === 'image') hint.textContent = '↻ горе = завърти · ↗ ъгъл = мащаб · ⊕ долу = мести (или влачи изображението)';
    else if (sel && sel.type === 'vector') hint.textContent = '↻ горе = завърти · ↗ ъгъл = мащаб · ⊕ долу = мести (векторен слой)';
    else hint.textContent = layers.length ? 'Кликни слой за избор' : 'Добави поне един слой';
  }

  function syncControlsToSelectedLayer() {
    var layer = getSelectedLayer();
    var fitBtn = document.getElementById('st-fit-layer');
    if (fitBtn) fitBtn.disabled = !layer;
    var textEdit = document.getElementById('st-edit-text');
    var imageEdit = document.getElementById('st-edit-image');
    var vectorEdit = document.getElementById('st-edit-vector');
    var traceBtn = document.getElementById('st-trace-layer');
    var textEl = document.getElementById('st-text');
    var fontEl = document.getElementById('st-font');
    var spacEl = document.getElementById('st-spacing');
    var fileNameEl = document.getElementById('st-file-name');
    var fileTypeEl = document.getElementById('st-file-type-hint');
    var vectorNameEl = document.getElementById('st-vector-name');

    var isText = layer && layer.type === 'text';
    if (textEdit) {
      textEdit.style.opacity = isText ? '1' : '0.4';
      textEdit.style.pointerEvents = isText ? '' : 'none';
    }
    if (imageEdit) imageEdit.hidden = !layer || layer.type !== 'image';
    if (vectorEdit) vectorEdit.hidden = !layer || layer.type !== 'vector';

    if (isText) {
      if (textEl) textEl.value = getLayerText(layer);
      if (fontEl) fontEl.value = layer.font;
      if (spacEl) {
        spacEl.value = layer.letterSpacing;
        document.getElementById('st-spacing-val').textContent = layer.letterSpacing;
      }
      if (traceBtn) traceBtn.hidden = true;
    } else if (layer && layer.type === 'image') {
      if (fileNameEl) fileNameEl.textContent = layer.fileName;
      if (fileTypeEl) {
        fileTypeEl.textContent = layer.isSvg
          ? 'Векторен SVG — подходящ за рязане на плотер.'
          : 'PNG/JPG — може като растерен слой или trace → вектор (SVG paths).';
      }
      if (traceBtn) {
        traceBtn.hidden = !!layer.isSvg;
        traceBtn.disabled = !!layer.isSvg;
        traceBtn.title = '';
      }
    } else if (layer && layer.type === 'vector') {
      if (vectorNameEl) vectorNameEl.textContent = layer.fileName || layer.name;
      var noisyHint = document.getElementById('st-vector-noisy-hint');
      var toRasterBtn = document.getElementById('st-vector-to-raster');
      var noisy = window.ST_VECTOR && ST_VECTOR.isNoisyVectorLayer && ST_VECTOR.isNoisyVectorLayer(layer);
      if (noisyHint) noisyHint.hidden = !noisy;
      if (toRasterBtn) toRasterBtn.hidden = noisy;
      if (traceBtn) traceBtn.hidden = true;
    } else {
      if (fileTypeEl) fileTypeEl.textContent = '';
      if (traceBtn) traceBtn.hidden = true;
    }

    updateLayerHint();
    updateLayerSizeLabel();
    updateAlignButtons();
  }

  function renderFontOptions() {
    var fontEl = document.getElementById('st-font');
    if (!fontEl) return;
    fontEl.innerHTML = '';
    (CFG.fonts || []).forEach(function (f) {
      var opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.label;
      fontEl.appendChild(opt);
    });
  }

  function renderQuickSizesIn(wrapId) {
    var wrap = document.getElementById(wrapId);
    if (!wrap) return;
    wrap.innerHTML = '';
    (CFG.quickSizes || []).forEach(function (sz) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'st-pill-btn';
      btn.dataset.w = String(sz.w);
      btn.dataset.h = String(sz.h);
      btn.textContent = sz.label + ' cm';
      btn.addEventListener('click', function () {
        applyStickerSize(sz.w, sz.h);
      });
      wrap.appendChild(btn);
    });
  }

  function renderQuickSizes() {
    renderQuickSizesIn('st-quick-sizes');
    renderQuickSizesIn('st-size-dlg-quick-sizes');
  }

  function canvasXY(e) {
    var rect = canvas.getBoundingClientRect();
    var src = e.touches ? e.touches[0] : e;
    return {
      rawX: (src.clientX - rect.left) * (CW / rect.width),
      rawY: (src.clientY - rect.top) * (CH / rect.height),
    };
  }

  function canvasWorldXY(e) {
    var p = canvasXY(e);
    return {
      x: (p.rawX - CW / 2 - view.panX) / view.scale + CW / 2,
      y: (p.rawY - CH / 2 - view.panY) / view.scale + CH / 2,
    };
  }

  function hitBody(el, px, py) {
    var lr = getBoxLocalRect(el);
    var dx = px - el.cx;
    var dy = py - el.cy;
    var rad = el.rotation * Math.PI / 180;
    var lx = dx * Math.cos(-rad) - dy * Math.sin(-rad);
    var ly = dx * Math.sin(-rad) + dy * Math.cos(-rad);
    return lx >= lr.left - 10 && lx <= lr.right + 10 && ly >= lr.top - 10 && ly <= lr.bottom + 10;
  }

  function rotHandlePos(el) {
    var lr = getBoxLocalRect(el);
    var midX = (lr.left + lr.right) / 2;
    return localToWorld(el, midX, lr.top - getRotDist());
  }

  function hitRotHandle(el, px, py) {
    var h = rotHandlePos(el);
    return Math.hypot(px - h.x, py - h.y) <= getHandleHitR();
  }

  function scaleHandlePos(el) {
    var lr = getBoxLocalRect(el);
    return localToWorld(el, lr.right, lr.bottom);
  }

  function hitScaleHandle(el, px, py) {
    var s = scaleHandlePos(el);
    return Math.hypot(px - s.x, py - s.y) <= getHandleHitR();
  }

  function hitMoveHandle(el, px, py) {
    var h = moveHandlePos(el);
    return Math.hypot(px - h.x, py - h.y) <= getHandleHitR();
  }

  function findHitLayer(px, py) {
    var hitId = null;
    var mode = 'move';

    if (selectedLayerId && elementBoxes[selectedLayerId]) {
      var selBox = elementBoxes[selectedLayerId];
      if (hitRotHandle(selBox, px, py)) return { hitId: selectedLayerId, mode: 'rotate' };
      if (hitScaleHandle(selBox, px, py)) return { hitId: selectedLayerId, mode: 'scale' };
      if (hitMoveHandle(selBox, px, py)) return { hitId: selectedLayerId, mode: 'move' };
    }

    for (var i = layers.length - 1; i >= 0; i--) {
      var lid = layers[i].id;
      if (!layers[i].visible || !elementBoxes[lid]) continue;
      if (hitBody(elementBoxes[lid], px, py)) {
        hitId = lid;
        mode = 'move';
        break;
      }
    }

    return { hitId: hitId, mode: mode };
  }

  function beginLayerDrag(hitId, mode, px, py) {
    var moveIds;
    if (isLayerSelected(hitId) && selectedLayerIds.length > 1) {
      selectedLayerId = hitId;
      moveIds = selectedLayerIds.slice();
      renderLayersPanel();
      syncControlsToSelectedLayer();
      drawPreview();
    } else if (!isLayerSelected(hitId)) {
      selectLayer(hitId);
      moveIds = [hitId];
    } else {
      moveIds = [hitId];
    }

    ptr.active = true;
    ptr.mode = mode;
    ptr.layerId = hitId;
    ptr.startX = px;
    ptr.startY = py;
    clearSnapGuides();
    ptr.moveLayers = moveIds.map(function (mid) {
      var ml = getLayerById(mid);
      return { id: mid, ox: ml ? ml.x : 0, oy: ml ? ml.y : 0 };
    });

    var layer = getLayerById(hitId);
    var box = elementBoxes[hitId];
    if (mode === 'rotate') canvas.style.cursor = 'alias';
    else if (mode === 'scale' && box) canvas.style.cursor = cursorForScaleHandle(box);
    else canvas.style.cursor = 'grabbing';

    if (mode === 'move') {
      ptr.ox = layer.x;
      ptr.oy = layer.y;
    } else if (mode === 'rotate') {
      ptr.startAngle = Math.atan2(py - box.cy, px - box.cx);
      ptr.startRotation = layer.rotation;
    } else if (mode === 'scale') {
      ptr.startDist = Math.hypot(px - box.cx, py - box.cy);
      ptr.startScale = layer.size;
    }
  }

  function onPointerDown(e) {
    e.preventDefault();
    var raw = canvasXY(e);
    var p = canvasWorldXY(e);
    var px = p.x; var py = p.y;
    var hit = findHitLayer(px, py);
    var hitId = hit.hitId;
    var mode = hit.mode;

    if (e.button === 1) {
      beginPan(raw.rawX, raw.rawY);
      return;
    }

    if (spacePan) {
      beginPan(raw.rawX, raw.rawY);
      return;
    }

    if (e.shiftKey && !hitId) {
      beginPan(raw.rawX, raw.rawY);
      return;
    }

    if (!hitId) {
      beginPan(raw.rawX, raw.rawY, { clickSelect: true });
      return;
    }

    if (e.metaKey || e.ctrlKey) {
      selectLayer(hitId, { toggle: true });
      return;
    }

    if (e.shiftKey && mode === 'move') {
      if (!isLayerSelected(hitId)) selectLayer(hitId, { add: true });
      else {
        selectedLayerId = hitId;
        renderLayersPanel();
        syncControlsToSelectedLayer();
        drawPreview();
      }
      beginLayerDrag(hitId, mode, px, py);
      return;
    }

    beginLayerDrag(hitId, mode, px, py);
  }

  function onPointerMove(e) {
    var pHover = canvasWorldXY(e);
    hoverWorld.x = pHover.x;
    hoverWorld.y = pHover.y;
    hoverWorld.valid = true;

    if (!ptr.active) {
      updateCanvasCursor(pHover.x, pHover.y);
      return;
    }
    e.preventDefault();

    if (ptr.mode === 'pan') {
      var raw = canvasXY(e);
      view.panX = ptr.panOx + (raw.rawX - ptr.startX);
      view.panY = ptr.panOy + (raw.rawY - ptr.startY);
      scheduleDrawPreview();
      return;
    }

    var p = canvasWorldXY(e);
    var px = p.x; var py = p.y;

    var layer = getLayerById(ptr.layerId);
    if (!layer) return;
    var box = elementBoxes[ptr.layerId];

    if (ptr.mode === 'move') {
      var dx = px - ptr.startX;
      var dy = py - ptr.startY;
      clearSnapGuides();
      if (ptr.moveLayers && ptr.moveLayers.length) {
        ptr.moveLayers.forEach(function (m) {
          var ml = getLayerById(m.id);
          if (ml) {
            ml.x = m.ox + dx;
            ml.y = m.oy + dy;
          }
        });
        var primary = getLayerById(ptr.layerId);
        if (primary) {
          var rect = getStickerRect();
          var excludeIds = ptr.moveLayers.map(function (m) { return m.id; });
          var beforeX = primary.x;
          var beforeY = primary.y;
          applyMoveSnap(primary, rect, getSnapThreshold(), excludeIds);
          var snapDx = primary.x - beforeX;
          var snapDy = primary.y - beforeY;
          if (snapDx || snapDy) {
            ptr.moveLayers.forEach(function (m) {
              if (m.id === ptr.layerId) return;
              var ml = getLayerById(m.id);
              if (ml) {
                ml.x += snapDx;
                ml.y += snapDy;
              }
            });
          }
        }
      } else {
        layer.x = ptr.ox + dx;
        layer.y = ptr.oy + dy;
        applyMoveSnap(layer, getStickerRect(), getSnapThreshold(), [layer.id]);
      }
    } else if (ptr.mode === 'rotate') {
      clearSnapGuides();
      var angle = Math.atan2(py - box.cy, px - box.cx);
      var rawRot = ptr.startRotation + (angle - ptr.startAngle) * 180 / Math.PI;
      var finalRot = rawRot;
      var rotSnapped = false;
      if (snapEnabled) {
        var snap = snapRotation(rawRot);
        finalRot = snap.value;
        rotSnapped = snap.snapped;
      }
      layer.rotation = Math.max(ROT_MIN, Math.min(ROT_MAX, finalRot));
      var handleBox = { cx: box.cx, cy: box.cy, w: box.w, h: box.h, rotation: layer.rotation };
      var hPos = rotHandlePos(handleBox);
      snapGuides.rotationLabel = {
        x: hPos.x,
        y: hPos.y - 14 / view.scale,
        text: formatRotLabel(layer.rotation),
        strong: rotSnapped,
      };
    } else if (ptr.mode === 'scale') {
      clearSnapGuides();
      var dist = Math.hypot(px - box.cx, py - box.cy);
      var ratio = dist / ptr.startDist;
      if (layer.type === 'image' || layer.type === 'vector') {
        layer.size = Math.max(0.1, ptr.startScale * ratio);
      } else {
        var stickerRect = getStickerRect();
        var maxTextSz = getTextSizeMax(stickerRect);
        layer.size = Math.max(TEXT_SIZE_MIN, Math.min(maxTextSz, ptr.startScale * ratio));
      }
    }
    scheduleDrawPreview();
  }

  function onPointerUp(e) {
    if (ptr.active) {
      if (ptr.mode === 'pan') {
        if (ptr.panClickSelect && e) {
          var raw = canvasXY(e);
          if (Math.hypot(raw.rawX - ptr.startX, raw.rawY - ptr.startY) < 5) clearSelection();
        }
      } else {
        saveHistory();
      }
      ptr.active = false;
      ptr.panClickSelect = false;
      refreshCanvasCursor();
      clearSnapGuides();
      drawPreviewNow();
    }
  }

  canvas.style.cursor = 'grab';
  canvas.addEventListener('mouseleave', function () {
    hoverWorld.valid = false;
    if (!ptr.active) canvas.style.cursor = 'grab';
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  canvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      ptr.active = false;
      pinch.active = true;
      pinch.startDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinch.startScale = view.scale;
      e.preventDefault();
      return;
    }
    onPointerDown(e);
  }, { passive: false });
  window.addEventListener('touchmove', function (e) {
    if (pinch.active && e.touches.length === 2) {
      e.preventDefault();
      var dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setViewScale(pinch.startScale * (dist / pinch.startDist));
      return;
    }
    onPointerMove(e);
  }, { passive: false });
  window.addEventListener('touchend', function () {
    pinch.active = false;
    onPointerUp();
  });

  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    if (e.shiftKey) {
      view.panX -= e.deltaX || 0;
      view.panY -= e.deltaY || 0;
      scheduleDrawPreview();
      return;
    }
    setViewScale(view.scale * (e.deltaY > 0 ? 0.92 : 1.08));
  }, { passive: false });

  var ST_ALIGN_ICON = {
    left: '<svg class="st-align-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><line x1="5" y1="3" x2="5" y2="21" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><rect x="8" y="5" width="11" height="3.5" rx="0.75" fill="currentColor"/><rect x="8" y="10.25" width="8" height="3.5" rx="0.75" fill="currentColor"/><rect x="8" y="15.5" width="10" height="3.5" rx="0.75" fill="currentColor"/></svg>',
    centerH: '<svg class="st-align-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><rect x="7" y="5" width="10" height="3.5" rx="0.75" fill="currentColor"/><rect x="8.5" y="10.25" width="7" height="3.5" rx="0.75" fill="currentColor"/><rect x="7.5" y="15.5" width="9" height="3.5" rx="0.75" fill="currentColor"/></svg>',
    right: '<svg class="st-align-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><line x1="19" y1="3" x2="19" y2="21" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><rect x="5" y="5" width="11" height="3.5" rx="0.75" fill="currentColor"/><rect x="8" y="10.25" width="8" height="3.5" rx="0.75" fill="currentColor"/><rect x="6" y="15.5" width="10" height="3.5" rx="0.75" fill="currentColor"/></svg>',
    top: '<svg class="st-align-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><line x1="3" y1="5" x2="21" y2="5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><rect x="5" y="8" width="3.5" height="11" rx="0.75" fill="currentColor"/><rect x="10.25" y="8" width="3.5" height="8" rx="0.75" fill="currentColor"/><rect x="15.5" y="8" width="3.5" height="10" rx="0.75" fill="currentColor"/></svg>',
    middleV: '<svg class="st-align-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><rect x="5" y="7" width="3.5" height="10" rx="0.75" fill="currentColor"/><rect x="10.25" y="8.5" width="3.5" height="7" rx="0.75" fill="currentColor"/><rect x="15.5" y="7.5" width="3.5" height="9" rx="0.75" fill="currentColor"/></svg>',
    bottom: '<svg class="st-align-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><line x1="3" y1="19" x2="21" y2="19" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><rect x="5" y="5" width="3.5" height="11" rx="0.75" fill="currentColor"/><rect x="10.25" y="8" width="3.5" height="8" rx="0.75" fill="currentColor"/><rect x="15.5" y="6" width="3.5" height="10" rx="0.75" fill="currentColor"/></svg>',
  };

  var ST_ALIGN_BTNS = [
    { align: 'left', title: 'Подравни ляво' },
    { align: 'centerH', title: 'Центрирай хоризонтално' },
    { align: 'right', title: 'Подравни дясно' },
    { align: 'top', title: 'Подравни горе' },
    { align: 'middleV', title: 'Центрирай вертикално' },
    { align: 'bottom', title: 'Подравни долу' },
  ];

  function initAlignGrids() {
    [
      { id: 'st-align-sticker', scope: 'sticker' },
      { id: 'st-align-layers', scope: 'layers' },
    ].forEach(function (cfg) {
      var wrap = document.getElementById(cfg.id);
      if (!wrap) return;
      wrap.innerHTML = '';
      ST_ALIGN_BTNS.forEach(function (def) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'st-align-btn';
        btn.dataset.scope = cfg.scope;
        btn.dataset.align = def.align;
        btn.title = def.title;
        btn.setAttribute('aria-label', def.title);
        btn.innerHTML = ST_ALIGN_ICON[def.align];
        if (cfg.scope === 'layers') btn.disabled = true;
        wrap.appendChild(btn);
      });
    });
  }

  document.addEventListener('click', function (e) {
    var alignBtn = e.target.closest('.st-layers-tools .st-align-btn[data-scope]');
    if (alignBtn && !alignBtn.disabled) {
      e.preventDefault();
      var scope = alignBtn.dataset.scope;
      var align = alignBtn.dataset.align;
      if (scope === 'sticker') alignLayersToSticker(align);
      else if (scope === 'layers') alignLayersTogether(align);
    }
  });

  on('st-add-text', 'click', function () {
    addLayer(makeTextLayer());
    var textEl = document.getElementById('st-text');
    if (textEl) textEl.focus();
  });

  document.getElementById('st-upload').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (file) loadImageFile(file);
    e.target.value = '';
  });

  initImportDialog();

  (function initSvgUploadInfo() {
    var btn = document.getElementById('st-svg-info-btn');
    var wrap = btn && btn.closest('.st-svg-info');
    if (!btn || !wrap) return;

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var open = wrap.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  })();

  var textInput = document.getElementById('st-text');
  if (textInput) {
    textInput.addEventListener('input', function (e) {
      var layer = getSelectedLayer();
      if (!layer || layer.type !== 'text') return;
      layer.text = e.target.value;
      drawPreview();
      updateLinks();
      markDraftDirty();
    });
    textInput.addEventListener('change', function () {
      var layer = getSelectedLayer();
      if (layer && layer.type === 'text') saveHistory();
    });
  }

  document.querySelectorAll('.st-align-btn[data-text-align]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var layer = getSelectedLayer();
      if (!layer || layer.type !== 'text') return;
      layer.textAlign = btn.dataset.textAlign;
      updateAlignButtons();
      drawPreview();
      updateLinks();
      saveHistory();
    });
  });

  on('st-font', 'change', function (e) {
    var layer = getSelectedLayer();
    if (!layer || layer.type !== 'text') return;
    layer.font = e.target.value;
    var fontLoads = [loadCanvasFontFamily(layer.font, [28, layer.size || 28, 48])];
    if (window.ST_VECTOR && ST_VECTOR.loadFont) {
      fontLoads.push(ST_VECTOR.loadFont(layer.font).catch(function () { return null; }));
    }
    if (document.fonts && document.fonts.load) {
      Promise.all(fontLoads).then(function () {
        drawPreview();
        saveHistory();
      });
    } else {
      drawPreview();
      saveHistory();
    }
  });

  document.getElementById('st-spacing').addEventListener('input', function (e) {
    var layer = getSelectedLayer();
    if (!layer || layer.type !== 'text') return;
    layer.letterSpacing = parseFloat(e.target.value);
    document.getElementById('st-spacing-val').textContent = layer.letterSpacing;
    drawPreview();
  });
  document.getElementById('st-spacing').addEventListener('change', function () { saveHistory(); });

  var snapGuidesBtn = document.getElementById('st-snap-guides');
  if (snapGuidesBtn) {
    snapGuidesBtn.addEventListener('click', function () {
      snapEnabled = !snapEnabled;
      updateSnapToggleUi();
      markDraftDirty();
    });
  }

  document.getElementById('st-snap').addEventListener('click', function () {
    var ids = selectedLayerIds.length ? selectedLayerIds.slice() : (selectedLayerId ? [selectedLayerId] : []);
    ids.forEach(function (id) {
      var layer = getLayerById(id);
      if (layer) { layer.x = 0; layer.y = 0; }
    });
    if (!ids.length) return;
    drawPreview();
    updateLinks();
    saveHistory();
  });

  ['st-width', 'st-height'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', function () {
      applyStickerSize();
    });
  });

  function rasterizeVectorLayerToCanvas(layer, maxDim) {
    if (!layer || layer.type !== 'vector' || !layer.paths || !layer.paths.length) return null;
    var refW = layer.contentW || layer.viewW || 1;
    var refH = layer.contentH || layer.viewH || 1;
    maxDim = maxDim || 1200;
    var scale = Math.min(1, maxDim / Math.max(refW, refH));
    var w = Math.max(1, Math.round(refW * scale));
    var h = Math.max(1, Math.round(refH * scale));
    var off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    var ctx = off.getContext('2d');
    ctx.save();
    ctx.scale(w / refW, h / refH);
    if (layer.offsetX || layer.offsetY) ctx.translate(-(layer.offsetX || 0), -(layer.offsetY || 0));
    ctx.fillStyle = '#ffffff';
    layer.paths.forEach(function (d) {
      try {
        ctx.fill(new Path2D(d), 'evenodd');
      } catch (e) { /* skip */ }
    });
    ctx.restore();
    return off;
  }

  function convertVectorLayerToRaster(layerId) {
    var layer = getLayerById(layerId);
    if (!layer || layer.type !== 'vector') return;
    var off = rasterizeVectorLayerToCanvas(layer);
    if (!off) {
      window.alert('Векторният слой не може да се преобразува.');
      return;
    }
    imageFromCanvas(off, function (imgEl) {
      if (!imgEl) {
        window.alert('Преобразуването не успя.');
        return;
      }
      var idx = -1;
      var i;
      for (i = 0; i < layers.length; i++) {
        if (layers[i].id === layerId) { idx = i; break; }
      }
      if (idx < 0) return;
      var newLayer = makeImageLayer(imgEl, layer.fileName || layer.name, false, {
        stickerProcessed: true,
        size: layer.size,
        x: layer.x,
        y: layer.y,
        rotation: layer.rotation,
      });
      layers[idx] = newLayer;
      selectedLayerIds = [newLayer.id];
      selectedLayerId = newLayer.id;
      renderLayersPanel();
      syncControlsToSelectedLayer();
      updateAlignButtons();
      drawPreview();
      updateLinks();
      saveHistory();
    });
  }

  function vectorDataFromProcessedCanvas(canvas) {
    if (!window.ST_VECTOR || !ST_VECTOR.ready() || !canvas) return null;
    var traced = ST_VECTOR.traceCanvas(canvas);
    if (!traced.paths || !traced.paths.length) return null;
    if (ST_VECTOR.normalizeVectorData) traced = ST_VECTOR.normalizeVectorData(traced);
    if (!traced.paths || !traced.paths.length) return null;
    return traced;
  }

  function vectorDataFromProcessedCanvasAsync(canvas, traceOpts) {
    traceOpts = traceOpts || getImportTraceOptions();
    if (!canvas) return Promise.resolve(null);
    if (window.ST_TRACE && ST_TRACE.traceCanvasAsync) {
      return ST_TRACE.traceCanvasAsync(canvas, traceOpts).then(function (raw) {
        if (!raw || !raw.paths || !raw.paths.length) return null;
        if (window.ST_VECTOR && ST_VECTOR.normalizeVectorData) {
          return ST_VECTOR.normalizeVectorData(raw);
        }
        return raw;
      });
    }
    return Promise.resolve(vectorDataFromProcessedCanvas(canvas, traceOpts));
  }

  function replaceLayerWithVector(layerId, vectorData) {
    var layer = getLayerById(layerId);
    if (!layer || !vectorData || !vectorData.paths || !vectorData.paths.length) return false;
    var idx = -1;
    var i;
    for (i = 0; i < layers.length; i++) {
      if (layers[i].id === layerId) { idx = i; break; }
    }
    if (idx < 0) return false;
    var fileName = layer.fileName || layer.name || 'vector.svg';
    var newLayer = makeVectorLayer(fileName, vectorData, {
      size: layer.size,
      x: layer.x,
      y: layer.y,
      rotation: layer.rotation,
    });
    layers[idx] = newLayer;
    selectedLayerIds = [newLayer.id];
    selectedLayerId = newLayer.id;
    renderLayersPanel();
    syncControlsToSelectedLayer();
    updateAlignButtons();
    drawPreview();
    updateLinks();
    saveHistory();
    return true;
  }

  function traceSelectedImageLayer() {
    var layer = getSelectedLayer();
    if (!layer || layer.type !== 'image' || layer.isSvg) {
      window.alert('Избери растерен PNG/JPG слой за векторизация.');
      return;
    }
    if (!window.ST_VECTOR || !ST_VECTOR.ready()) {
      window.alert('Vector библиотеките не са заредени. Презареди страницата.');
      return;
    }
    var btn = document.getElementById('st-trace-layer');
    if (btn) btn.disabled = true;
    var off = document.createElement('canvas');
    if (layer.stickerProcessed && layer.imgEl && layer.imgEl.naturalWidth) {
      off.width = layer.imgEl.naturalWidth;
      off.height = layer.imgEl.naturalHeight;
      off.getContext('2d').drawImage(layer.imgEl, 0, 0);
    } else if (layer.imgEl && layer.imgEl.naturalWidth) {
      var processed = processImageForTrace(layer.imgEl, { tolerance: bgTolerance });
      off.width = processed.width;
      off.height = processed.height;
      off.getContext('2d').drawImage(processed, 0, 0);
    } else {
      if (btn) btn.disabled = false;
      window.alert('Изображението не е готово за trace.');
      return;
    }

    var smoothEl = document.getElementById('st-import-smooth');
    var speckleEl = document.getElementById('st-import-speckle');
    var traceOpts = (window.ST_TRACE && ST_TRACE.traceOptionsFromSliders)
      ? ST_TRACE.traceOptionsFromSliders(smoothEl, speckleEl)
      : getImportTraceOptions();

    vectorDataFromProcessedCanvasAsync(off, traceOpts).then(function (vectorData) {
      if (btn) btn.disabled = false;
      if (!vectorData) {
        window.alert('Trace не успя — опитай с по-контрастно изображение или промени гладкост/speckles.');
        return;
      }
      if (window.ST_VECTOR && ST_VECTOR.validateVectorTrace) {
        var quality = ST_VECTOR.validateVectorTrace(vectorData);
        if (!quality.ok) {
          window.alert(quality.reason || 'Trace не е подходящ — остави растерния слой.');
          return;
        }
      }
      replaceLayerWithVector(layer.id, vectorData);
    }).catch(function () {
      if (btn) btn.disabled = false;
      window.alert('Trace не успя — опитай отново.');
    });
  }

  var SVG_EXPORT_BTN_IDS = ['st-download-svg', 'st-download-svg-basic'];
  var svgExportBusy = false;

  var exportDialogState = {
    kind: '',
    filename: '',
    mime: '',
    saveContent: null,
    previewUrl: '',
    previewUrlOwned: false,
  };

  function revokeExportPreviewUrl() {
    if (exportDialogState.previewUrlOwned && exportDialogState.previewUrl) {
      try { URL.revokeObjectURL(exportDialogState.previewUrl); } catch (e) { /* ignore */ }
    }
    exportDialogState.previewUrl = '';
    exportDialogState.previewUrlOwned = false;
  }

  function resetExportDialogState() {
    revokeExportPreviewUrl();
    exportDialogState.kind = '';
    exportDialogState.filename = '';
    exportDialogState.mime = '';
    exportDialogState.saveContent = null;
  }

  function closeExportDialog() {
    var dialog = document.getElementById('st-export-dialog');
    if (dialog && dialog.open) dialog.close();
    resetExportDialogState();
    var img = document.getElementById('st-export-preview-img');
    var loading = document.getElementById('st-export-loading');
    var saveBtn = document.getElementById('st-export-save');
    if (img) {
      img.hidden = true;
      img.removeAttribute('src');
    }
    if (loading) loading.hidden = true;
    if (saveBtn) saveBtn.disabled = true;
  }

  function setExportDialogLoading(title, meta) {
    var dialog = document.getElementById('st-export-dialog');
    var titleEl = document.getElementById('st-export-title');
    var metaEl = document.getElementById('st-export-meta');
    var img = document.getElementById('st-export-preview-img');
    var loading = document.getElementById('st-export-loading');
    var saveBtn = document.getElementById('st-export-save');
    if (titleEl) titleEl.textContent = title || 'Export';
    if (metaEl) metaEl.textContent = meta || '';
    if (img) {
      img.hidden = true;
      img.removeAttribute('src');
    }
    if (loading) loading.hidden = false;
    if (saveBtn) saveBtn.disabled = true;
    if (dialog && typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
  }

  function showExportDialogReady(opts) {
    opts = opts || {};
    var dialog = document.getElementById('st-export-dialog');
    var titleEl = document.getElementById('st-export-title');
    var metaEl = document.getElementById('st-export-meta');
    var img = document.getElementById('st-export-preview-img');
    var loading = document.getElementById('st-export-loading');
    var saveBtn = document.getElementById('st-export-save');

    revokeExportPreviewUrl();
    exportDialogState.kind = opts.kind || '';
    exportDialogState.filename = opts.filename || 'export';
    exportDialogState.mime = opts.mime || 'application/octet-stream';
    exportDialogState.saveContent = opts.saveContent;
    exportDialogState.previewUrl = opts.previewUrl || '';
    exportDialogState.previewUrlOwned = !!opts.previewUrlOwned;

    if (titleEl) titleEl.textContent = opts.title || 'Export';
    if (metaEl) metaEl.textContent = opts.meta || exportDialogState.filename;
    if (loading) loading.hidden = true;
    if (img) {
      img.src = exportDialogState.previewUrl;
      img.alt = opts.previewAlt || exportDialogState.filename;
      img.hidden = !exportDialogState.previewUrl;
    }
    if (saveBtn) {
      saveBtn.disabled = !exportDialogState.saveContent;
      saveBtn.removeAttribute('aria-disabled');
    }
    if (dialog && typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
  }

  function saveExportFromDialog() {
    if (!exportDialogState.saveContent) return;
    if (exportDialogState.kind === 'png' && typeof exportDialogState.saveContent === 'string') {
      try {
        var link = document.createElement('a');
        link.download = exportDialogState.filename;
        link.href = exportDialogState.saveContent;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        window.alert('Неуспешно запазване на PNG. Опитай отново.');
      }
      return;
    }
    downloadBlob(exportDialogState.filename, exportDialogState.mime, exportDialogState.saveContent);
  }

  function buildPreviewPngDataUrl() {
    var off = document.createElement('canvas');
    off.width = CW;
    off.height = CH;
    drawExport(off.getContext('2d'), CW, CH);
    return off.toDataURL('image/png');
  }

  function openPngExportPreview() {
    setExportDialogLoading('PNG превю', 'Подготвя се превю…');
    buildPreviewPngDataUrlAsync().then(function (dataUrl) {
      showExportDialogReady({
        kind: 'png',
        title: 'PNG превю',
        meta: 'savovpro-sticker-preview.png · визуализация за поръчка',
        filename: 'savovpro-sticker-preview.png',
        mime: 'image/png',
        previewUrl: dataUrl,
        previewUrlOwned: false,
        saveContent: dataUrl,
        previewAlt: 'PNG превю на стикера',
      });
    }).catch(function () {
      closeExportDialog();
      window.alert('PNG превюто не може да се генерира. Опитай отново.');
    });
  }

  function openSvgExportPreview() {
    if (!layers.length || svgExportBusy) return;
    syncEditorToLayers();
    setExportDialogLoading('SVG файл', 'Подготвя се файл…');
    svgExportBusy = true;
    setSvgExportLoading(true);
    ensureExportFontsReady().then(function () {
      return new Promise(function (resolve, reject) {
        buildExportSvgAsync(function (svg, err) {
          if (err || !svg) reject(err || new Error('svg failed'));
          else resolve(svg);
        });
      });
    }).then(function (svg) {
      svgExportBusy = false;
      setSvgExportLoading(false);
      return buildSvgPreviewDataUrlAsync(svg).then(function (previewUrl) {
        var w = stickerSize.widthCm;
        var h = stickerSize.heightCm;
        var name = 'savovpro-sticker-' + String(w).replace('.', '-') + 'x' + String(h).replace('.', '-') + 'cm.svg';
        showExportDialogReady({
          kind: 'svg',
          title: 'SVG файл',
          meta: name + ' · ' + w + ' × ' + h + ' cm · текстът е автоматично конвертиран в контури',
          filename: name,
          mime: 'image/svg+xml;charset=utf-8',
          previewUrl: previewUrl,
          previewUrlOwned: false,
          saveContent: svg,
          previewAlt: 'Превю на стикера',
        });
      });
    }).catch(function (err) {
      svgExportBusy = false;
      setSvgExportLoading(false);
      closeExportDialog();
      console.error('SVG export failed', err);
      window.alert('SVG експортът не успя. Опитай отново или опрости дизайна.');
    });
  }

  function initExportDialog() {
    var dialog = document.getElementById('st-export-dialog');
    if (!dialog) return;
    on('st-export-close', 'click', closeExportDialog);
    on('st-export-close-x', 'click', closeExportDialog);
    on('st-export-save', 'click', saveExportFromDialog);
    dialog.addEventListener('cancel', function (e) {
      e.preventDefault();
    });
  }

  function setSvgExportLoading(loading) {
    SVG_EXPORT_BTN_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.disabled = loading;
      el.classList.toggle('is-exporting', loading);
      el.setAttribute('aria-busy', String(loading));
      if (loading) {
        if (!el.dataset.origLabel) {
          el.dataset.origLabel = (el.textContent || '').trim() || el.getAttribute('title') || 'SVG';
        }
        if (el.classList.contains('cfg-icon-btn')) {
          el.setAttribute('title', 'Генерира SVG…');
          el.setAttribute('aria-label', 'Генерира SVG…');
        } else {
          el.textContent = 'Генерира SVG…';
        }
      } else {
        el.removeAttribute('aria-busy');
        if (el.classList.contains('cfg-icon-btn')) {
          el.setAttribute('title', 'SVG файл (точен размер)');
          el.setAttribute('aria-label', 'SVG файл');
        } else if (el.dataset.origLabel) {
          el.textContent = el.dataset.origLabel;
        }
      }
    });
  }

  function downloadPlotterSvg() {
    openSvgExportPreview();
  }

  document.getElementById('st-fit-layer').addEventListener('click', function () {
    fitLayerToSticker(getSelectedLayer());
  });
  on('st-fit-basic', 'click', fitOutOfBoundsLayers);
  on('st-bounds-fit', 'click', fitOutOfBoundsLayers);

  document.getElementById('st-undo').addEventListener('click', undo);
  document.getElementById('st-redo').addEventListener('click', redo);

  function isTypingTarget(el) {
    if (!el) return false;
    var tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  document.addEventListener('keydown', function (e) {
    if (isTypingTarget(document.activeElement)) return;

    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      spacePan = true;
      refreshCanvasCursor();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); return; }
    if (e.key === 'Escape' && previewEl && previewEl.classList.contains('is-fullscreen')) {
      toggleFullscreen(true);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      selectAllLayers();
      return;
    }

    var layer = getSelectedLayer();
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      if (layer) duplicateLayerById(layer.id);
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && layer) {
      e.preventDefault();
      deleteLayerById(layer.id);
      return;
    }
    if (layer && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) !== -1) {
      e.preventDefault();
      var step = e.shiftKey ? 5 : 1;
      var moveIds = selectedLayerIds.length ? selectedLayerIds.slice() : [layer.id];
      moveIds.forEach(function (id) {
        var l = getLayerById(id);
        if (!l) return;
        if (e.key === 'ArrowUp') l.y -= step;
        if (e.key === 'ArrowDown') l.y += step;
        if (e.key === 'ArrowLeft') l.x -= step;
        if (e.key === 'ArrowRight') l.x += step;
      });
      drawPreview();
      if (e.repeat) return;
      saveHistory();
    }
  });

  document.addEventListener('keyup', function (e) {
    if (e.code === 'Space') {
      spacePan = false;
      if (!ptr.active) refreshCanvasCursor();
    }
  });

  document.getElementById('st-zoom-in').addEventListener('click', function () { setViewScale(view.scale * 1.15); });
  document.getElementById('st-zoom-out').addEventListener('click', function () { setViewScale(view.scale / 1.15); });
  document.getElementById('st-zoom-in-2').addEventListener('click', function () { setViewScale(view.scale * 1.15); });
  document.getElementById('st-zoom-out-2').addEventListener('click', function () { setViewScale(view.scale / 1.15); });
  document.getElementById('st-zoom-reset').addEventListener('click', resetView);
  document.getElementById('st-zoom-slider').addEventListener('input', function (e) {
    setViewScale(parseInt(e.target.value, 10) / 100);
  });
  document.getElementById('st-fullscreen').addEventListener('click', function () { toggleFullscreen(); });
  document.getElementById('st-fullscreen-hint').addEventListener('click', function () { toggleFullscreen(); });

  function downloadPreviewPng() {
    openPngExportPreview();
  }
  document.getElementById('st-download').addEventListener('click', downloadPreviewPng);
  on('st-download-order-png', 'click', downloadPreviewPng);

  on('st-download-svg', 'click', downloadPlotterSvg);
  on('st-download-svg-basic', 'click', downloadPlotterSvg);

  initExportDialog();

  document.querySelectorAll('.cfg-acc-head').forEach(function (head) {
    head.addEventListener('click', function () {
      var acc = head.closest('.cfg-acc');
      var opening = !acc.classList.contains('is-open');
      acc.classList.toggle('is-open', opening);
      head.setAttribute('aria-expanded', String(opening));
      if (!opening) return;
      requestAnimationFrame(function () {
        if (isMobileShellLayout()) {
          acc.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return;
        }
        var panel = document.querySelector('.cfg-controls');
        if (!panel || panel.scrollHeight <= panel.clientHeight) return;
        var panelRect = panel.getBoundingClientRect();
        var accRect = acc.getBoundingClientRect();
        if (accRect.bottom > panelRect.bottom - 10) {
          panel.scrollTop += accRect.bottom - panelRect.bottom + 14;
        } else if (accRect.top < panelRect.top + 10) {
          panel.scrollTop -= panelRect.top - accRect.top + 14;
        }
      });
    });
  });

  if (window.initConfiguratorClipart) {
    window.initConfiguratorClipart({
      tabsId: 'st-clipart-tabs',
      gridId: 'st-clipart-grid',
      searchId: 'st-clipart-q',
      searchBtnId: 'st-clipart-search-btn',
      onPick: function (iconId) {
        addClipartIconLayer(iconId);
      },
    });
  }

  initUiModeToggle();
  initStartOverButton();
  initOnboarding();
  initDraftResumeDialog();
  initSetupWizard();
  initShortcutsDialog();
  initQuickActionsDialog();
  initControlsScrollChaining();
  initSizeDialog();
  initMobileShell();
  renderFontOptions();
  renderQuickSizes();
  initAlignGrids();
  applyStickerSize(null, null, { skipHistory: true });
  updateQuickSizeButtons();
  updateZoomUI();
  updateSnapToggleUi();

  if (hasDraftInStorage()) {
    openDraftResumeDialog();
  } else {
    bootFreshSession();
  }
})();
