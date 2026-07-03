/**
 * Async trace orchestration: VTracer WASM (flat art) + Potrace in Web Worker.
 */
(function (global) {
  'use strict';

  var WORKER_URL = 'assets/js/configurator/sticker-trace-worker.js?v=20260702';
  var WASM_URL = 'assets/js/vendor/vtracer_webapp_bg.wasm?v=20260702';

  var worker = null;
  var workerJobId = 0;
  var workerPending = {};
  var vtracerInitPromise = null;
  var vtracerReady = false;

  function deg2rad(deg) {
    return deg / 180 * Math.PI;
  }

  function mapSmoothness(slider) {
    slider = Math.max(1, Math.min(10, slider || 6));
    return {
      pathPrecision: Math.round(3 + (slider - 1) * (8 - 3) / 9),
      opttolerance: 0.55 - (slider - 1) * (0.55 - 0.15) / 9,
    };
  }

  function mapSpeckle(slider) {
    slider = Math.max(1, Math.min(10, slider || 4));
    return {
      filterSpeckle: slider,
      turdsize: Math.round(2 + (slider - 1) * 16 / 9),
    };
  }

  function traceOptionsFromSliders(smoothEl, speckleEl) {
    var smooth = smoothEl ? parseInt(smoothEl.value, 10) : 6;
    var speckle = speckleEl ? parseInt(speckleEl.value, 10) : 4;
    var sm = mapSmoothness(smooth);
    var sp = mapSpeckle(speckle);
    return {
      smoothness: smooth,
      speckle: speckle,
      pathPrecision: sm.pathPrecision,
      opttolerance: sm.opttolerance,
      filterSpeckle: sp.filterSpeckle,
      turdsize: sp.turdsize,
    };
  }

  function ensureWorker() {
    if (worker) return worker;
    try {
      worker = new Worker(WORKER_URL);
      worker.onmessage = function (e) {
        var msg = e.data || {};
        var pending = workerPending[msg.id];
        if (!pending) return;
        delete workerPending[msg.id];
        if (msg.ok) pending.resolve(msg.vectorData);
        else pending.reject(new Error(msg.error || 'trace failed'));
      };
      worker.onerror = function (err) {
        Object.keys(workerPending).forEach(function (id) {
          workerPending[id].reject(err || new Error('worker error'));
        });
        workerPending = {};
      };
    } catch (e) {
      worker = null;
    }
    return worker;
  }

  function tracePotraceWorker(imageData, options) {
    var w = ensureWorker();
    if (!w) {
      return Promise.reject(new Error('Worker not available'));
    }
    var id = ++workerJobId;
    return new Promise(function (resolve, reject) {
      workerPending[id] = { resolve: resolve, reject: reject };
      try {
        w.postMessage({
          type: 'trace',
          id: id,
          imageData: imageData,
          options: {
            turdsize: options.turdsize,
            opttolerance: options.opttolerance,
          },
        }, [imageData.data.buffer]);
      } catch (err) {
        delete workerPending[id];
        reject(err);
      }
    });
  }

  function initVTracer() {
    if (vtracerReady) return Promise.resolve();
    if (vtracerInitPromise) return vtracerInitPromise;
    if (!global.VTracerBg) {
      return Promise.reject(new Error('VTracer not loaded'));
    }
    vtracerInitPromise = fetch(WASM_URL)
      .then(function (r) {
        if (!r.ok) throw new Error('WASM fetch failed');
        return r.arrayBuffer();
      })
      .then(function (bytes) {
        return WebAssembly.instantiate(bytes, {});
      })
      .then(function (result) {
        global.VTracerBg.__wbg_set_wasm(result.instance.exports);
        vtracerReady = true;
      })
      .catch(function (err) {
        vtracerInitPromise = null;
        throw err;
      });
    return vtracerInitPromise;
  }

  function collectSvgPaths(svgEl) {
    if (!svgEl) return [];
    var paths = [];
    svgEl.querySelectorAll('path').forEach(function (el) {
      var d = el.getAttribute('d');
      if (d && d.length > 1) paths.push(d);
    });
    return paths;
  }

  function runVTracerTickLoop(converter) {
    return new Promise(function (resolve, reject) {
      function loop() {
        try {
          if (converter.tick()) resolve();
          else setTimeout(loop, 0);
        } catch (err) {
          reject(err);
        }
      }
      setTimeout(loop, 0);
    });
  }

  function traceVTracerCanvas(sourceCanvas, options) {
    options = options || {};
    return initVTracer().then(function () {
      var srcCanvas = document.getElementById('st-vtrace-src');
      var svgEl = document.getElementById('st-vtrace-out');
      if (!srcCanvas || !svgEl) {
        throw new Error('VTracer DOM missing');
      }

      var w = sourceCanvas.width;
      var h = sourceCanvas.height;
      if (!w || !h) {
        return { paths: [], viewW: 1, viewH: 1, pathCount: 0, engine: 'vtracer' };
      }

      srcCanvas.width = w;
      srcCanvas.height = h;
      var ctx = srcCanvas.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(sourceCanvas, 0, 0);

      svgEl.innerHTML = '';
      svgEl.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      svgEl.setAttribute('width', String(w));
      svgEl.setAttribute('height', String(h));

      var speckle = options.filterSpeckle != null ? options.filterSpeckle : 4;
      var params = {
        canvas_id: 'st-vtrace-src',
        svg_id: 'st-vtrace-out',
        colormode: 'binary',
        hierarchical: 'stacked',
        mode: 'spline',
        corner_threshold: deg2rad(60),
        length_threshold: 4.0,
        max_iterations: 10,
        splice_threshold: deg2rad(45),
        filter_speckle: speckle * speckle,
        color_precision: 6,
        layer_difference: 16,
        path_precision: options.pathPrecision != null ? options.pathPrecision : 6,
      };

      var converter = global.VTracerBg.BinaryImageConverter.new_with_string(JSON.stringify(params));
      converter.init();
      return runVTracerTickLoop(converter).then(function () {
        converter.free();
        var paths = collectSvgPaths(svgEl);
        return {
          paths: paths,
          viewW: w,
          viewH: h,
          pathCount: paths.length,
          engine: 'vtracer',
        };
      });
    });
  }

  function canvasToScaledImageData(canvas, maxDim) {
    maxDim = maxDim || 900;
    var w = canvas.width;
    var h = canvas.height;
    if (!w || !h) return null;
    var scale = Math.min(1, maxDim / Math.max(w, h));
    var tw = Math.max(1, Math.round(w * scale));
    var th = Math.max(1, Math.round(h * scale));
    var off = document.createElement('canvas');
    off.width = tw;
    off.height = th;
    var ctx = off.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(canvas, 0, 0, tw, th);
    return ctx.getImageData(0, 0, tw, th);
  }

  function copyImageData(imgd) {
    return new ImageData(new Uint8ClampedArray(imgd.data), imgd.width, imgd.height);
  }

  function traceCanvasAsync(sourceCanvas, options) {
    options = options || {};
    var engine = options.engine || 'auto';
    var preferVTracer = engine === 'vtracer' || engine === 'auto';

    if (preferVTracer && global.VTracerBg) {
      return traceVTracerCanvas(sourceCanvas, options).then(function (vd) {
        if (vd.paths && vd.paths.length) return vd;
        if (engine === 'vtracer') return vd;
        var imgd = canvasToScaledImageData(sourceCanvas, options.maxDim || 900);
        if (!imgd) return vd;
        return tracePotraceWorker(copyImageData(imgd), options).then(function (fallback) {
          if (fallback.paths && fallback.paths.length) return fallback;
          return vd;
        });
      }).catch(function () {
        if (engine === 'vtracer') {
          return { paths: [], viewW: sourceCanvas.width, viewH: sourceCanvas.height, engine: 'vtracer' };
        }
        var imgd = canvasToScaledImageData(sourceCanvas, options.maxDim || 900);
        if (!imgd) return { paths: [], viewW: sourceCanvas.width, viewH: sourceCanvas.height };
        return tracePotraceWorker(copyImageData(imgd), options);
      });
    }

    var imgd = canvasToScaledImageData(sourceCanvas, options.maxDim || 900);
    if (!imgd) {
      return Promise.resolve({ paths: [], viewW: sourceCanvas.width, viewH: sourceCanvas.height });
    }
    return tracePotraceWorker(copyImageData(imgd), options);
  }

  function drawContourOverlay(ctx, vectorData, refW, refH, dw, dh) {
    if (!vectorData || !vectorData.paths || !vectorData.paths.length) return;
    var ox = vectorData.offsetX || 0;
    var oy = vectorData.offsetY || 0;
    ctx.save();
    ctx.scale(dw / refW, dh / refH);
    if (ox || oy) ctx.translate(-ox, -oy);
    ctx.strokeStyle = 'rgba(0, 200, 160, 0.85)';
    ctx.lineWidth = Math.max(1, 1.5 * refW / dw);
    vectorData.paths.forEach(function (d) {
      try {
        ctx.stroke(new Path2D(d));
      } catch (e) { /* skip */ }
    });
    ctx.restore();
  }

  global.ST_TRACE = {
    ready: function () {
      return !!(global.PotraceTS || ensureWorker());
    },
    vtracerReady: function () { return vtracerReady; },
    initVTracer: initVTracer,
    traceCanvasAsync: traceCanvasAsync,
    traceOptionsFromSliders: traceOptionsFromSliders,
    mapSmoothness: mapSmoothness,
    mapSpeckle: mapSpeckle,
    drawContourOverlay: drawContourOverlay,
  };
})(typeof window !== 'undefined' ? window : this);
