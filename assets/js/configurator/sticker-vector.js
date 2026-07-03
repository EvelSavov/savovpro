/**
 * Vector helpers for sticker configurator: opentype text → paths, Potrace PNG → paths.
 * Canvas @font-face: assets/css/sticker-fonts.css (FONT_DIR below).
 */
(function (global) {
  'use strict';

  var FONT_DIR = 'assets/fonts/stickers/';

  var FONT_FILES = {
    'Montserrat': [
      FONT_DIR + 'montserrat-cyrillic-700.woff',
      FONT_DIR + 'montserrat-latin-700.woff',
    ],
    'Playfair Display': [
      FONT_DIR + 'playfair-cyrillic-700.woff',
      FONT_DIR + 'playfair-latin-700.woff',
    ],
    'Caveat': [
      FONT_DIR + 'caveat-cyrillic-700.woff',
      FONT_DIR + 'caveat-latin-700.woff',
    ],
    'Dancing Script': [
      FONT_DIR + 'dancing-script-700.woff',
    ],
    'DM Sans': [
      FONT_DIR + 'dm-sans-700.woff',
    ],
  };

  var fontCache = {};
  var fontFamilyCache = {};
  var fontPromises = {};

  var MAX_VECTOR_PATHS = 12;
  var MAX_POTRACE_CONTOURS = 15;

  var POTRACE_DEFAULTS = {
    turdsize: 4,
    optcurve: true,
    alphamax: 1,
    opttolerance: 0.35,
    turnpolicy: 'minority',
  };

  function ready() {
    return !!(global.opentype && global.PotraceTS);
  }

  function fontFilesForName(fontName) {
    var files = FONT_FILES[fontName] || FONT_FILES.Montserrat;
    return Array.isArray(files) ? files.slice() : [files];
  }

  function loadFontFile(url) {
    return new Promise(function (resolve, reject) {
      global.opentype.load(url, function (err, font) {
        if (err || !font) {
          reject(err || new Error('Font load failed: ' + url));
          return;
        }
        resolve(font);
      });
    });
  }

  function loadFont(fontName) {
    if (!global.opentype) return Promise.reject(new Error('opentype.js not loaded'));
    if (fontCache[fontName] && fontFamilyCache[fontName]) {
      return Promise.resolve(fontCache[fontName]);
    }
    if (fontPromises[fontName]) return fontPromises[fontName];

    fontPromises[fontName] = Promise.all(
      fontFilesForName(fontName).map(function (url) {
        return loadFontFile(url).catch(function () { return null; });
      })
    ).then(function (fonts) {
      delete fontPromises[fontName];
      fonts = fonts.filter(Boolean);
      if (!fonts.length) {
        throw new Error('Font load failed: ' + fontName);
      }
      fontFamilyCache[fontName] = fonts;
      fontCache[fontName] = fonts[0];
      return fontCache[fontName];
    }).catch(function (err) {
      delete fontPromises[fontName];
      throw err;
    });
    return fontPromises[fontName];
  }

  function fontsForFamily(fontName) {
    if (fontFamilyCache[fontName] && fontFamilyCache[fontName].length) {
      return fontFamilyCache[fontName];
    }
    if (fontCache[fontName]) return [fontCache[fontName]];
    return [];
  }

  function preloadFonts(names) {
    var list = names.filter(Boolean);
    return Promise.all(list.map(loadFont));
  }

  function binarizeImageData(imgd) {
    var d = imgd.data;
    var i;
    for (i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) {
        d[i + 3] = 0;
        continue;
      }
      d[i] = 255;
      d[i + 1] = 255;
      d[i + 2] = 255;
      d[i + 3] = 255;
    }
  }

  function assessImageForVectorTrace(canvas) {
    if (!canvas || !canvas.width || !canvas.height) {
      return { suitable: false, reason: 'Празно изображение.' };
    }
    return { suitable: true };
  }

  function validateVectorTrace(vectorData) {
    if (!vectorData || !vectorData.paths || !vectorData.paths.length) {
      return { ok: false, reason: 'Trace не намери контури.' };
    }
    return { ok: true };
  }

  function isNoisyVectorLayer(layer) {
    if (!layer || layer.type !== 'vector' || !layer.paths) return false;
    if (layer.pathCount && layer.pathCount > MAX_POTRACE_CONTOURS) return true;
    if (layer.paths.length > MAX_VECTOR_PATHS) return true;
    var refW = layer.contentW || layer.viewW || 0;
    var refH = layer.contentH || layer.viewH || 0;
    if (layer.paths.length > 3 && Math.max(refW, refH) >= 180) return true;
    return false;
  }

  function parseSvgNumber(raw) {
    if (raw == null || raw === '') return 0;
    return parseFloat(String(raw).replace(/[^\d.+-]/g, '')) || 0;
  }

  function readSvgViewSize(svg) {
    var viewW = 0;
    var viewH = 0;
    if (!svg) return { viewW: viewW, viewH: viewH };
    if (svg.viewBox && svg.viewBox.baseVal) {
      viewW = svg.viewBox.baseVal.width || 0;
      viewH = svg.viewBox.baseVal.height || 0;
    }
    if (!viewW) viewW = parseSvgNumber(svg.getAttribute('width'));
    if (!viewH) viewH = parseSvgNumber(svg.getAttribute('height'));
    return { viewW: viewW, viewH: viewH };
  }

  var measureSvgRoot = null;

  function getMeasureSvgRoot() {
    if (measureSvgRoot && measureSvgRoot.isConnected) return measureSvgRoot;
    measureSvgRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    measureSvgRoot.setAttribute('width', '0');
    measureSvgRoot.setAttribute('height', '0');
    measureSvgRoot.style.cssText = 'position:absolute;left:-99999px;top:-99999px;visibility:hidden;pointer-events:none';
    document.body.appendChild(measureSvgRoot);
    return measureSvgRoot;
  }

  function clearMeasureSvgRoot() {
    var svg = getMeasureSvgRoot();
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.removeAttribute('viewBox');
  }

  function measurePathBBox(pathD, viewW, viewH) {
    if (!pathD) return null;
    var svg = getMeasureSvgRoot();
    clearMeasureSvgRoot();
    if (viewW && viewH) svg.setAttribute('viewBox', '0 0 ' + viewW + ' ' + viewH);
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    svg.appendChild(path);
    var bb;
    try {
      bb = path.getBBox();
    } catch (e) {
      return null;
    }
    if (!bb || !bb.width || !bb.height) return null;
    return { x: bb.x, y: bb.y, width: bb.width, height: bb.height };
  }

  function measurePathsBBox(paths, viewW, viewH) {
    if (!paths || !paths.length) return null;
    var svg = getMeasureSvgRoot();
    clearMeasureSvgRoot();
    if (viewW && viewH) svg.setAttribute('viewBox', '0 0 ' + viewW + ' ' + viewH);
    var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    paths.forEach(function (d) {
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      group.appendChild(path);
    });
    svg.appendChild(group);
    var bb;
    try {
      bb = group.getBBox();
    } catch (e) {
      return null;
    }
    if (!bb || !bb.width || !bb.height) return null;
    return { x: bb.x, y: bb.y, width: bb.width, height: bb.height };
  }

  function filterBackgroundPaths(paths, viewW, viewH) {
    if (!paths || paths.length <= 1 || !viewW || !viewH) return paths || [];
    var canvasArea = viewW * viewH;
    if (!canvasArea) return paths.slice();
    return paths.filter(function (d) {
      var bb = measurePathBBox(d, viewW, viewH);
      if (!bb) return true;
      var area = bb.width * bb.height;
      var coversCanvas = area / canvasArea > 0.82
        && bb.width / viewW > 0.9
        && bb.height / viewH > 0.9;
      return !coversCanvas;
    });
  }

  function normalizeVectorData(data) {
    if (!data) return { paths: [], viewW: 1, viewH: 1, offsetX: 0, offsetY: 0, contentW: 1, contentH: 1 };
    var viewW = data.viewW || 0;
    var viewH = data.viewH || 0;
    var paths = (data.paths || []).slice();
    if (!paths.length) {
      return {
        paths: [],
        viewW: viewW || 1,
        viewH: viewH || 1,
        offsetX: 0,
        offsetY: 0,
        contentW: viewW || 1,
        contentH: viewH || 1,
      };
    }

    paths = filterBackgroundPaths(paths, viewW, viewH);
    if (!paths.length) {
      return {
        paths: [],
        viewW: viewW || 1,
        viewH: viewH || 1,
        offsetX: 0,
        offsetY: 0,
        contentW: viewW || 1,
        contentH: viewH || 1,
      };
    }

    var bb = measurePathsBBox(paths, viewW, viewH);
    if (!bb) {
      return {
        paths: paths,
        viewW: viewW || 1,
        viewH: viewH || 1,
        offsetX: 0,
        offsetY: 0,
        contentW: viewW || 1,
        contentH: viewH || 1,
      };
    }

    var contentW = bb.width;
    var contentH = bb.height;
    if (!viewW || !viewH || viewW / contentW > 4 || viewH / contentH > 4) {
      viewW = contentW;
      viewH = contentH;
    }

    return {
      paths: paths,
      viewW: viewW,
      viewH: viewH,
      offsetX: bb.x,
      offsetY: bb.y,
      contentW: contentW,
      contentH: contentH,
      pathCount: data.pathCount || paths.length,
    };
  }

  function rectToPath(el) {
    var x = parseSvgNumber(el.getAttribute('x'));
    var y = parseSvgNumber(el.getAttribute('y'));
    var w = parseSvgNumber(el.getAttribute('width'));
    var h = parseSvgNumber(el.getAttribute('height'));
    if (!w || !h) return null;
    return 'M' + x + ' ' + y + 'h' + w + 'v' + h + 'h' + (-w) + 'z';
  }

  function circleToPath(el) {
    var cx = parseSvgNumber(el.getAttribute('cx'));
    var cy = parseSvgNumber(el.getAttribute('cy'));
    var r = parseSvgNumber(el.getAttribute('r'));
    if (!r) return null;
    return 'M' + (cx - r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0z';
  }

  function ellipseToPath(el) {
    var cx = parseSvgNumber(el.getAttribute('cx'));
    var cy = parseSvgNumber(el.getAttribute('cy'));
    var rx = parseSvgNumber(el.getAttribute('rx'));
    var ry = parseSvgNumber(el.getAttribute('ry'));
    if (!rx || !ry) return null;
    return 'M' + (cx - rx) + ' ' + cy + 'a' + rx + ' ' + ry + ' 0 1 0 ' + (2 * rx) + ' 0a' + rx + ' ' + ry + ' 0 1 0 ' + (-2 * rx) + ' 0z';
  }

  function pointsToPath(el, close) {
    var raw = el.getAttribute('points');
    if (!raw) return null;
    var nums = raw.trim().split(/[\s,]+/).map(parseFloat).filter(function (n) { return !isNaN(n); });
    if (nums.length < 4) return null;
    var d = 'M' + nums[0] + ' ' + nums[1];
    var i;
    for (i = 2; i < nums.length; i += 2) {
      if (i + 1 >= nums.length) break;
      d += 'L' + nums[i] + ' ' + nums[i + 1];
    }
    if (close) d += 'z';
    return d;
  }

  function collectSvgShapePaths(doc) {
    var paths = [];
    doc.querySelectorAll('path').forEach(function (el) {
      var d = el.getAttribute('d');
      if (d && d.length > 1) paths.push(d);
    });
    doc.querySelectorAll('rect').forEach(function (el) {
      var d = rectToPath(el);
      if (d) paths.push(d);
    });
    doc.querySelectorAll('circle').forEach(function (el) {
      var d = circleToPath(el);
      if (d) paths.push(d);
    });
    doc.querySelectorAll('ellipse').forEach(function (el) {
      var d = ellipseToPath(el);
      if (d) paths.push(d);
    });
    doc.querySelectorAll('polygon').forEach(function (el) {
      var d = pointsToPath(el, true);
      if (d) paths.push(d);
    });
    doc.querySelectorAll('polyline').forEach(function (el) {
      var d = pointsToPath(el, false);
      if (d) paths.push(d);
    });
    return paths;
  }

  function parseSvgPaths(svgString) {
    var doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
    var svg = doc.querySelector('svg');
    var size = readSvgViewSize(svg);
    var paths = collectSvgShapePaths(doc);
    return normalizeVectorData({
      paths: paths,
      viewW: size.viewW,
      viewH: size.viewH,
    });
  }

  function prepareSvgImport(svgString) {
    var doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
    var svg = doc.querySelector('svg');
    if (!svg) return { vectorData: { paths: [], viewW: 1, viewH: 1 }, rasterOnly: true, hasEmbeddedImage: false };
    var size = readSvgViewSize(svg);
    var hasEmbeddedImage = !!doc.querySelector('image');
    var vectorData = normalizeVectorData({
      paths: collectSvgShapePaths(doc),
      viewW: size.viewW,
      viewH: size.viewH,
    });
    var rasterOnly = hasEmbeddedImage && (!vectorData.paths || !vectorData.paths.length);
    return {
      vectorData: vectorData,
      rasterOnly: rasterOnly,
      hasEmbeddedImage: hasEmbeddedImage,
    };
  }

  function curveToPathD(curve, size) {
    size = size || 1;
    function bezier(i) {
      var b = 'C ' + (curve.c[i * 3 + 0].x * size).toFixed(2) + ' ' +
        (curve.c[i * 3 + 0].y * size).toFixed(2) + ' ' +
        (curve.c[i * 3 + 1].x * size).toFixed(2) + ' ' +
        (curve.c[i * 3 + 1].y * size).toFixed(2) + ' ' +
        (curve.c[i * 3 + 2].x * size).toFixed(2) + ' ' +
        (curve.c[i * 3 + 2].y * size).toFixed(2) + ' ';
      return b;
    }
    function segment(i) {
      return 'L ' + (curve.c[i * 3 + 1].x * size).toFixed(2) + ' ' +
        (curve.c[i * 3 + 1].y * size).toFixed(2) + ' ' +
        (curve.c[i * 3 + 2].x * size).toFixed(2) + ' ' +
        (curve.c[i * 3 + 2].y * size).toFixed(2) + ' ';
    }
    var n = curve.n;
    var p = 'M' + (curve.c[(n - 1) * 3 + 2].x * size).toFixed(2) + ' ' +
      (curve.c[(n - 1) * 3 + 2].y * size).toFixed(2) + ' ';
    var i;
    for (i = 0; i < n; i++) {
      if (curve.tag[i] === 'CURVE') p += bezier(i);
      else if (curve.tag[i] === 'CORNER') p += segment(i);
    }
    return p + 'Z';
  }

  function pathListToPathStrings(pathList) {
    if (!pathList || !pathList.length) return [];
    if (pathList.length === 1) return [curveToPathD(pathList[0].curve, 1)];
    return [pathList.map(function (pathItem) {
      return curveToPathD(pathItem.curve, 1);
    }).join(' ')];
  }

  function traceImageDataPotrace(imgd, options) {
    options = options || {};
    if (!global.PotraceTS) {
      return normalizeVectorData({ paths: [], viewW: imgd.width, viewH: imgd.height });
    }

    var threshold = options.threshold != null ? options.threshold : global.PotraceTS.THRESHOLD_AUTO;
    if (threshold === global.PotraceTS.THRESHOLD_AUTO) {
      threshold = global.PotraceTS.calculateAutoThreshold(imgd);
    }

    var potraceOpts = {
      turdsize: options.turdsize != null ? options.turdsize : POTRACE_DEFAULTS.turdsize,
      optcurve: POTRACE_DEFAULTS.optcurve,
      alphamax: POTRACE_DEFAULTS.alphamax,
      opttolerance: options.opttolerance != null ? options.opttolerance : POTRACE_DEFAULTS.opttolerance,
      turnpolicy: POTRACE_DEFAULTS.turnpolicy,
    };

    // White silhouette on transparent → trace light pixels.
    var bitmap = global.PotraceTS.imageDataToBitmap(imgd, threshold, false);
    var pathList = global.PotraceTS.traceBitmap(bitmap, potraceOpts);
    var pathStrings = pathListToPathStrings(pathList);

    return normalizeVectorData({
      paths: pathStrings,
      viewW: imgd.width,
      viewH: imgd.height,
      pathCount: pathList ? pathList.length : 0,
    });
  }

  function traceImageData(imgd) {
    var traced = traceImageDataPotrace(imgd, {});
    if (!traced.viewW) traced.viewW = imgd.width;
    if (!traced.viewH) traced.viewH = imgd.height;
    if (!traced.contentW) traced.contentW = traced.viewW;
    if (!traced.contentH) traced.contentH = traced.viewH;
    return traced;
  }

  function traceCanvas(canvas, maxDim) {
    maxDim = maxDim || 900;
    var w = canvas.width;
    var h = canvas.height;
    if (!w || !h) return { paths: [], viewW: 1, viewH: 1 };
    var scale = Math.min(1, maxDim / Math.max(w, h));
    var tw = Math.max(1, Math.round(w * scale));
    var th = Math.max(1, Math.round(h * scale));
    var off = document.createElement('canvas');
    off.width = tw;
    off.height = th;
    var ctx = off.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(canvas, 0, 0, tw, th);
    var imgd;
    try {
      imgd = ctx.getImageData(0, 0, tw, th);
    } catch (e) {
      return { paths: [], viewW: tw, viewH: th };
    }
    binarizeImageData(imgd);
    return traceImageData(imgd);
  }

  function appendPathCommands(target, source) {
    if (!source || !source.commands) return;
    source.commands.forEach(function (cmd) {
      target.commands.push(cmd);
    });
  }

  var GLYPH_FALLBACK_CHAIN = ['Montserrat', 'DM Sans', 'Playfair Display', 'Caveat', 'Dancing Script'];

  function resolveFontForChar(primaryFont, fontName, ch) {
    if (!primaryFont) return primaryFont;
    var tried = [];
    function tryFonts(fonts) {
      var i;
      for (i = 0; i < fonts.length; i++) {
        if (!fonts[i] || tried.indexOf(fonts[i]) >= 0) continue;
        tried.push(fonts[i]);
        if (fonts[i].charToGlyph(ch).name !== '.notdef') return fonts[i];
      }
      return null;
    }

    var hit = tryFonts(fontsForFamily(fontName));
    if (hit) return hit;

    var i;
    for (i = 0; i < GLYPH_FALLBACK_CHAIN.length; i++) {
      var fam = GLYPH_FALLBACK_CHAIN[i];
      if (fam === fontName) continue;
      hit = tryFonts(fontsForFamily(fam));
      if (hit) return hit;
    }
    return primaryFont;
  }

  function layoutLinePath(font, fontName, text, fontSize, letterSpacing) {
    if (!text) return new global.opentype.Path();
    var combined = new global.opentype.Path();
    var x = 0;
    var i;
    for (i = 0; i < text.length; i++) {
      var ch = text[i];
      var chFont = resolveFontForChar(font, fontName, ch);
      appendPathCommands(combined, chFont.getPath(ch, x, 0, fontSize));
      x += chFont.getAdvanceWidth(ch, fontSize) + letterSpacing;
    }
    return combined;
  }

  function translatePathData(path, dx, dy) {
    var clone = new global.opentype.Path();
    appendPathCommands(clone, path);
    clone.commands.forEach(function (cmd) {
      if (cmd.x != null) cmd.x += dx;
      if (cmd.y != null) cmd.y += dy;
      if (cmd.x1 != null) cmd.x1 += dx;
      if (cmd.y1 != null) cmd.y1 += dy;
      if (cmd.x2 != null) cmd.x2 += dx;
      if (cmd.y2 != null) cmd.y2 += dy;
    });
    return clone.toPathData(2);
  }

  function buildTextPathStrings(font, layer, metrics) {
    var lines = metrics.lines || [''];
    var fontSize = metrics.fontSize;
    var lineStep = metrics.lineStep;
    var startY = metrics.startY;
    var align = metrics.align || 'center';
    var lineX = metrics.lineX || 0;
    var letterSpacing = layer.letterSpacing || 0;
    var fontName = layer.font || 'Montserrat';
    var out = [];
    var i;

    for (i = 0; i < lines.length; i++) {
      var line = lines[i] || '';
      var path = layoutLinePath(font, fontName, line, fontSize, letterSpacing);
      var bbox = path.getBoundingBox();
      var lineW = bbox.x2 - bbox.x1;
      var anchorX;
      if (align === 'center') anchorX = lineX - lineW / 2 - bbox.x1;
      else if (align === 'right') anchorX = lineX - bbox.x2;
      else anchorX = lineX - bbox.x1;
      var y = startY + i * lineStep;
      var dy = y - (bbox.y1 + bbox.y2) / 2;
      out.push(translatePathData(path, anchorX, dy));
    }
    return out;
  }

  function isFontReady(fontName) {
    return !!(fontFamilyCache[fontName] && fontFamilyCache[fontName].length);
  }

  function drawTextPathsOnCanvas(ctx, layer, metrics, fillStyle) {
    var fontName = layer.font || 'Montserrat';
    if (!isFontReady(fontName)) return false;
    var font = fontCache[fontName] || fontFamilyCache[fontName][0];
    var paths = buildTextPathStrings(font, layer, metrics);
    if (!paths.length) return false;
    ctx.save();
    ctx.fillStyle = fillStyle || '#ffffff';
    var i;
    for (i = 0; i < paths.length; i++) {
      try {
        ctx.fill(new Path2D(paths[i]), 'nonzero');
      } catch (e) {
        ctx.restore();
        return false;
      }
    }
    ctx.restore();
    return true;
  }

  function pathsGroupSvg(paths, viewW, viewH, wMm, hMm, esc, offsetX, offsetY, contentW, contentH, fillColor) {
    if (!paths || !paths.length) return '';
    var refW = contentW || viewW;
    var refH = contentH || viewH;
    if (!refW || !refH) return '';
    var sx = wMm / refW;
    var sy = hMm / refH;
    var ox = offsetX || 0;
    var oy = offsetY || 0;
    var fill = fillColor || '#C9A227';
    var inner = paths.map(function (d) {
      return '<path fill="' + fill + '" fill-rule="evenodd" d="' + esc(d) + '"/>';
    }).join('\n');
    return '<g transform="translate(' + (-wMm / 2) + ' ' + (-hMm / 2) + ') scale(' + sx + ' ' + sy + ') translate(' + (-ox) + ' ' + (-oy) + ')">' + inner + '</g>';
  }

  global.ST_VECTOR = {
    ready: ready,
    loadFont: loadFont,
    preloadFonts: preloadFonts,
    traceCanvas: traceCanvas,
    traceImageData: traceImageData,
    parseSvgPaths: parseSvgPaths,
    prepareSvgImport: prepareSvgImport,
    normalizeVectorData: normalizeVectorData,
    assessImageForVectorTrace: assessImageForVectorTrace,
    validateVectorTrace: validateVectorTrace,
    isNoisyVectorLayer: isNoisyVectorLayer,
    MAX_VECTOR_PATHS: MAX_VECTOR_PATHS,
    buildTextPathStrings: buildTextPathStrings,
    drawTextPathsOnCanvas: drawTextPathsOnCanvas,
    isFontReady: isFontReady,
    GLYPH_FALLBACK_CHAIN: GLYPH_FALLBACK_CHAIN,
    pathsGroupSvg: pathsGroupSvg,
    FONT_DIR: FONT_DIR,
    FONT_FILES: FONT_FILES,
  };
})(typeof window !== 'undefined' ? window : this);
