/* eslint-disable no-restricted-globals */
/**
 * Off-main-thread Potrace tracing for sticker import preview / vector layers.
 */
importScripts('../vendor/potrace-ts.js');

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

function curveToPathD(curve) {
  function bezier(i) {
    return 'C ' + curve.c[i * 3 + 0].x.toFixed(2) + ' ' +
      curve.c[i * 3 + 0].y.toFixed(2) + ' ' +
      curve.c[i * 3 + 1].x.toFixed(2) + ' ' +
      curve.c[i * 3 + 1].y.toFixed(2) + ' ' +
      curve.c[i * 3 + 2].x.toFixed(2) + ' ' +
      curve.c[i * 3 + 2].y.toFixed(2) + ' ';
  }
  function segment(i) {
    return 'L ' + curve.c[i * 3 + 1].x.toFixed(2) + ' ' +
      curve.c[i * 3 + 1].y.toFixed(2) + ' ' +
      curve.c[i * 3 + 2].x.toFixed(2) + ' ' +
      curve.c[i * 3 + 2].y.toFixed(2) + ' ';
  }
  var n = curve.n;
  var p = 'M' + curve.c[(n - 1) * 3 + 2].x.toFixed(2) + ' ' +
    curve.c[(n - 1) * 3 + 2].y.toFixed(2) + ' ';
  var i;
  for (i = 0; i < n; i++) {
    if (curve.tag[i] === 'CURVE') p += bezier(i);
    else if (curve.tag[i] === 'CORNER') p += segment(i);
  }
  return p + 'Z';
}

function pathListToPathStrings(pathList) {
  if (!pathList || !pathList.length) return [];
  if (pathList.length === 1) return [curveToPathD(pathList[0].curve)];
  return [pathList.map(function (pathItem) {
    return curveToPathD(pathItem.curve);
  }).join(' ')];
}

function tracePotrace(imgd, options) {
  options = options || {};
  if (!self.PotraceTS) {
    return { paths: [], viewW: imgd.width, viewH: imgd.height, pathCount: 0 };
  }

  var threshold = options.threshold != null ? options.threshold : self.PotraceTS.THRESHOLD_AUTO;
  if (threshold === self.PotraceTS.THRESHOLD_AUTO) {
    threshold = self.PotraceTS.calculateAutoThreshold(imgd);
  }

  var potraceOpts = {
    turdsize: options.turdsize != null ? options.turdsize : 4,
    optcurve: true,
    alphamax: 1,
    opttolerance: options.opttolerance != null ? options.opttolerance : 0.35,
    turnpolicy: 'minority',
  };

  var bitmap = self.PotraceTS.imageDataToBitmap(imgd, threshold, false);
  var pathList = self.PotraceTS.traceBitmap(bitmap, potraceOpts);
  var pathStrings = pathListToPathStrings(pathList);

  return {
    paths: pathStrings,
    viewW: imgd.width,
    viewH: imgd.height,
    pathCount: pathList ? pathList.length : 0,
    engine: 'potrace',
  };
}

self.onmessage = function (e) {
  var msg = e.data || {};
  if (msg.type !== 'trace') return;
  try {
    var imgd = msg.imageData;
    if (!imgd || !imgd.width || !imgd.height) {
      self.postMessage({ id: msg.id, ok: false, error: 'empty image' });
      return;
    }
    binarizeImageData(imgd);
    var vectorData = tracePotrace(imgd, msg.options || {});
    self.postMessage({ id: msg.id, ok: true, vectorData: vectorData }, [imgd.data.buffer]);
  } catch (err) {
    self.postMessage({ id: msg.id, ok: false, error: err && err.message ? err.message : String(err) });
  }
};
