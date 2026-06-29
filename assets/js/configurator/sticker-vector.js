/**
 * Vector helpers for sticker configurator: opentype text → paths, ImageTracer PNG → paths.
 */
(function (global) {
  'use strict';

  var FONT_FILES = {
    'Montserrat': 'assets/fonts/montserrat-700.woff',
    'Playfair Display': 'assets/fonts/playfair-700.woff',
    'Caveat': 'assets/fonts/caveat-700.woff',
    'Dancing Script': 'assets/fonts/dancing-script-700.woff',
    'DM Sans': 'assets/fonts/dm-sans-700.woff',
  };

  var fontCache = {};
  var fontPromises = {};

  var TRACE_OPTIONS = {
    ltres: 0.5,
    qtres: 0.5,
    pathomit: 6,
    colorsampling: 0,
    numberofcolors: 2,
    mincolorratio: 0.01,
    colorquantcycles: 1,
    scale: 1,
    strokewidth: 0,
    linefilter: false,
    blurradius: 0,
    roundcoords: 1,
    viewbox: false,
    desc: false,
  };

  function ready() {
    return !!(global.opentype && global.ImageTracer);
  }

  function loadFont(fontName) {
    if (!global.opentype) return Promise.reject(new Error('opentype.js not loaded'));
    if (fontCache[fontName]) return Promise.resolve(fontCache[fontName]);
    if (fontPromises[fontName]) return fontPromises[fontName];

    var url = FONT_FILES[fontName] || FONT_FILES.Montserrat;
    fontPromises[fontName] = new Promise(function (resolve, reject) {
      global.opentype.load(url, function (err, font) {
        delete fontPromises[fontName];
        if (err || !font) {
          reject(err || new Error('Font load failed: ' + fontName));
          return;
        }
        fontCache[fontName] = font;
        resolve(font);
      });
    });
    return fontPromises[fontName];
  }

  function preloadFonts(names) {
    var list = names.filter(Boolean);
    return Promise.all(list.map(loadFont));
  }

  function parseSvgPaths(svgString) {
    var doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
    var svg = doc.querySelector('svg');
    var viewW = svg ? parseFloat(svg.getAttribute('width')) || 0 : 0;
    var viewH = svg ? parseFloat(svg.getAttribute('height')) || 0 : 0;
    if (svg && svg.viewBox && svg.viewBox.baseVal) {
      viewW = svg.viewBox.baseVal.width || viewW;
      viewH = svg.viewBox.baseVal.height || viewH;
    }
    var paths = [];
    doc.querySelectorAll('path').forEach(function (el) {
      var d = el.getAttribute('d');
      if (d && d.length > 1) paths.push(d);
    });
    return { paths: paths, viewW: viewW, viewH: viewH };
  }

  function traceImageData(imgd) {
    if (!global.ImageTracer) return { paths: [], viewW: imgd.width, viewH: imgd.height };
    var svg = global.ImageTracer.imagedataToSVG(imgd, TRACE_OPTIONS);
    var parsed = parseSvgPaths(svg);
    if (!parsed.viewW) parsed.viewW = imgd.width;
    if (!parsed.viewH) parsed.viewH = imgd.height;
    return parsed;
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
    return traceImageData(imgd);
  }

  function appendPathCommands(target, source) {
    if (!source || !source.commands) return;
    source.commands.forEach(function (cmd) {
      target.commands.push(cmd);
    });
  }

  function layoutLinePath(font, text, fontSize, letterSpacing) {
    if (!text) return new global.opentype.Path();
    if (!letterSpacing) return font.getPath(text, 0, 0, fontSize);

    var combined = new global.opentype.Path();
    var x = 0;
    var i;
    for (i = 0; i < text.length; i++) {
      var ch = text[i];
      appendPathCommands(combined, font.getPath(ch, x, 0, fontSize));
      x += font.getAdvanceWidth(ch, fontSize) + letterSpacing;
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
    var out = [];
    var i;

    for (i = 0; i < lines.length; i++) {
      var line = lines[i] || '';
      var path = layoutLinePath(font, line, fontSize, letterSpacing);
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

  function pathsGroupSvg(paths, viewW, viewH, wMm, hMm, esc) {
    if (!paths || !paths.length || !viewW || !viewH) return '';
    var sx = wMm / viewW;
    var sy = hMm / viewH;
    var inner = paths.map(function (d) {
      return '<path fill="#FFFFFF" d="' + esc(d) + '"/>';
    }).join('\n');
    return '<g transform="translate(' + (-wMm / 2) + ' ' + (-hMm / 2) + ') scale(' + sx + ' ' + sy + ')">' + inner + '</g>';
  }

  global.ST_VECTOR = {
    ready: ready,
    loadFont: loadFont,
    preloadFonts: preloadFonts,
    traceCanvas: traceCanvas,
    traceImageData: traceImageData,
    parseSvgPaths: parseSvgPaths,
    buildTextPathStrings: buildTextPathStrings,
    pathsGroupSvg: pathsGroupSvg,
    FONT_FILES: FONT_FILES,
  };
})(typeof window !== 'undefined' ? window : this);
