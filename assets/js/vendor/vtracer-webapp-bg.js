var VTracerBg = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/vtracer-webapp/vtracer_webapp_bg.js
  var vtracer_webapp_bg_exports = {};
  __export(vtracer_webapp_bg_exports, {
    BinaryImageConverter: () => BinaryImageConverter,
    ColorImageConverter: () => ColorImageConverter,
    __wbg_call_669127b9d730c650: () => __wbg_call_669127b9d730c650,
    __wbg_createElementNS_6a08d8f33e767e18: () => __wbg_createElementNS_6a08d8f33e767e18,
    __wbg_data_f2cf019dc3a2c762: () => __wbg_data_f2cf019dc3a2c762,
    __wbg_debug_8f9a97dc395d342f: () => __wbg_debug_8f9a97dc395d342f,
    __wbg_document_183cf1eecfdbffee: () => __wbg_document_183cf1eecfdbffee,
    __wbg_error_94a25ece8eeb7bca: () => __wbg_error_94a25ece8eeb7bca,
    __wbg_error_f851667af71bcfc6: () => __wbg_error_f851667af71bcfc6,
    __wbg_getContext_a29bad1d160bec3d: () => __wbg_getContext_a29bad1d160bec3d,
    __wbg_getElementById_328f8c4a5bb51ba8: () => __wbg_getElementById_328f8c4a5bb51ba8,
    __wbg_getImageData_f55fb8cd70493ea6: () => __wbg_getImageData_f55fb8cd70493ea6,
    __wbg_globalThis_17eff828815f7d84: () => __wbg_globalThis_17eff828815f7d84,
    __wbg_global_46f939f6541643c5: () => __wbg_global_46f939f6541643c5,
    __wbg_height_646e862bac72cff1: () => __wbg_height_646e862bac72cff1,
    __wbg_info_1d035e3d63b89260: () => __wbg_info_1d035e3d63b89260,
    __wbg_instanceof_CanvasRenderingContext2d_e264df6db9ec5a3d: () => __wbg_instanceof_CanvasRenderingContext2d_e264df6db9ec5a3d,
    __wbg_instanceof_HtmlCanvasElement_838d8b92f3c55028: () => __wbg_instanceof_HtmlCanvasElement_838d8b92f3c55028,
    __wbg_instanceof_Window_cde2416cf5126a72: () => __wbg_instanceof_Window_cde2416cf5126a72,
    __wbg_log_00bb83da94eb9ca8: () => __wbg_log_00bb83da94eb9ca8,
    __wbg_log_7811587c4c6d2844: () => __wbg_log_7811587c4c6d2844,
    __wbg_new_abda76e883ba8a5f: () => __wbg_new_abda76e883ba8a5f,
    __wbg_newnoargs_ccdcae30fd002262: () => __wbg_newnoargs_ccdcae30fd002262,
    __wbg_prepend_78bb3ef0d1f21108: () => __wbg_prepend_78bb3ef0d1f21108,
    __wbg_self_3fad056edded10bd: () => __wbg_self_3fad056edded10bd,
    __wbg_setAttribute_aebcae2169f2f869: () => __wbg_setAttribute_aebcae2169f2f869,
    __wbg_set_wasm: () => __wbg_set_wasm,
    __wbg_stack_658279fe44541cf6: () => __wbg_stack_658279fe44541cf6,
    __wbg_warn_fab4b297e5c436a0: () => __wbg_warn_fab4b297e5c436a0,
    __wbg_width_b813b325b323728a: () => __wbg_width_b813b325b323728a,
    __wbg_window_a4f46c98a61d4089: () => __wbg_window_a4f46c98a61d4089,
    __wbindgen_debug_string: () => __wbindgen_debug_string,
    __wbindgen_is_undefined: () => __wbindgen_is_undefined,
    __wbindgen_object_clone_ref: () => __wbindgen_object_clone_ref,
    __wbindgen_object_drop_ref: () => __wbindgen_object_drop_ref,
    __wbindgen_string_new: () => __wbindgen_string_new,
    __wbindgen_throw: () => __wbindgen_throw,
    main: () => main
  });
  var wasm;
  function __wbg_set_wasm(val) {
    wasm = val;
  }
  var heap = new Array(128).fill(void 0);
  heap.push(void 0, null, true, false);
  function getObject(idx) {
    return heap[idx];
  }
  var heap_next = heap.length;
  function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
  }
  function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
  }
  var lTextDecoder = typeof TextDecoder === "undefined" ? (0, module.require)("util").TextDecoder : TextDecoder;
  var cachedTextDecoder = new lTextDecoder("utf-8", { ignoreBOM: true, fatal: true });
  cachedTextDecoder.decode();
  var cachedUint8Memory0 = null;
  function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
      cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
  }
  function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
  }
  function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];
    heap[idx] = obj;
    return idx;
  }
  function debugString(val) {
    const type = typeof val;
    if (type == "number" || type == "boolean" || val == null) {
      return `${val}`;
    }
    if (type == "string") {
      return `"${val}"`;
    }
    if (type == "symbol") {
      const description = val.description;
      if (description == null) {
        return "Symbol";
      } else {
        return `Symbol(${description})`;
      }
    }
    if (type == "function") {
      const name = val.name;
      if (typeof name == "string" && name.length > 0) {
        return `Function(${name})`;
      } else {
        return "Function";
      }
    }
    if (Array.isArray(val)) {
      const length = val.length;
      let debug = "[";
      if (length > 0) {
        debug += debugString(val[0]);
      }
      for (let i = 1; i < length; i++) {
        debug += ", " + debugString(val[i]);
      }
      debug += "]";
      return debug;
    }
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
      className = builtInMatches[1];
    } else {
      return toString.call(val);
    }
    if (className == "Object") {
      try {
        return "Object(" + JSON.stringify(val) + ")";
      } catch (_) {
        return "Object";
      }
    }
    if (val instanceof Error) {
      return `${val.name}: ${val.message}
${val.stack}`;
    }
    return className;
  }
  var WASM_VECTOR_LEN = 0;
  var lTextEncoder = typeof TextEncoder === "undefined" ? (0, module.require)("util").TextEncoder : TextEncoder;
  var cachedTextEncoder = new lTextEncoder("utf-8");
  var encodeString = typeof cachedTextEncoder.encodeInto === "function" ? function(arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
  } : function(arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
      read: arg.length,
      written: buf.length
    };
  };
  function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === void 0) {
      const buf = cachedTextEncoder.encode(arg);
      const ptr2 = malloc(buf.length, 1) >>> 0;
      getUint8Memory0().subarray(ptr2, ptr2 + buf.length).set(buf);
      WASM_VECTOR_LEN = buf.length;
      return ptr2;
    }
    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;
    const mem = getUint8Memory0();
    let offset = 0;
    for (; offset < len; offset++) {
      const code = arg.charCodeAt(offset);
      if (code > 127) break;
      mem[ptr + offset] = code;
    }
    if (offset !== len) {
      if (offset !== 0) {
        arg = arg.slice(offset);
      }
      ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
      const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
      const ret = encodeString(arg, view);
      offset += ret.written;
    }
    WASM_VECTOR_LEN = offset;
    return ptr;
  }
  var cachedInt32Memory0 = null;
  function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
      cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
  }
  function main() {
    wasm.main();
  }
  function handleError(f, args) {
    try {
      return f.apply(this, args);
    } catch (e) {
      wasm.__wbindgen_exn_store(addHeapObject(e));
    }
  }
  function isLikeNone(x) {
    return x === void 0 || x === null;
  }
  function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
  }
  var BinaryImageConverter = class _BinaryImageConverter {
    static __wrap(ptr) {
      ptr = ptr >>> 0;
      const obj = Object.create(_BinaryImageConverter.prototype);
      obj.__wbg_ptr = ptr;
      return obj;
    }
    __destroy_into_raw() {
      const ptr = this.__wbg_ptr;
      this.__wbg_ptr = 0;
      return ptr;
    }
    free() {
      const ptr = this.__destroy_into_raw();
      wasm.__wbg_binaryimageconverter_free(ptr);
    }
    /**
    * @param {string} params
    * @returns {BinaryImageConverter}
    */
    static new_with_string(params) {
      const ptr0 = passStringToWasm0(params, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len0 = WASM_VECTOR_LEN;
      const ret = wasm.binaryimageconverter_new_with_string(ptr0, len0);
      return _BinaryImageConverter.__wrap(ret);
    }
    /**
    */
    init() {
      wasm.binaryimageconverter_init(this.__wbg_ptr);
    }
    /**
    * @returns {boolean}
    */
    tick() {
      const ret = wasm.binaryimageconverter_tick(this.__wbg_ptr);
      return ret !== 0;
    }
    /**
    * @returns {number}
    */
    progress() {
      const ret = wasm.binaryimageconverter_progress(this.__wbg_ptr);
      return ret >>> 0;
    }
  };
  var ColorImageConverter = class _ColorImageConverter {
    static __wrap(ptr) {
      ptr = ptr >>> 0;
      const obj = Object.create(_ColorImageConverter.prototype);
      obj.__wbg_ptr = ptr;
      return obj;
    }
    __destroy_into_raw() {
      const ptr = this.__wbg_ptr;
      this.__wbg_ptr = 0;
      return ptr;
    }
    free() {
      const ptr = this.__destroy_into_raw();
      wasm.__wbg_colorimageconverter_free(ptr);
    }
    /**
    * @param {string} params
    * @returns {ColorImageConverter}
    */
    static new_with_string(params) {
      const ptr0 = passStringToWasm0(params, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len0 = WASM_VECTOR_LEN;
      const ret = wasm.colorimageconverter_new_with_string(ptr0, len0);
      return _ColorImageConverter.__wrap(ret);
    }
    /**
    */
    init() {
      wasm.colorimageconverter_init(this.__wbg_ptr);
    }
    /**
    * @returns {boolean}
    */
    tick() {
      const ret = wasm.colorimageconverter_tick(this.__wbg_ptr);
      return ret !== 0;
    }
    /**
    * @returns {number}
    */
    progress() {
      const ret = wasm.colorimageconverter_progress(this.__wbg_ptr);
      return ret;
    }
  };
  function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
  }
  function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
  }
  function __wbg_new_abda76e883ba8a5f() {
    const ret = new Error();
    return addHeapObject(ret);
  }
  function __wbg_stack_658279fe44541cf6(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
  }
  function __wbg_error_f851667af71bcfc6(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
      deferred0_0 = arg0;
      deferred0_1 = arg1;
      console.error(getStringFromWasm0(arg0, arg1));
    } finally {
      wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
  }
  function __wbg_createElementNS_6a08d8f33e767e18() {
    return handleError(function(arg0, arg1, arg2, arg3, arg4) {
      const ret = getObject(arg0).createElementNS(arg1 === 0 ? void 0 : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
      return addHeapObject(ret);
    }, arguments);
  }
  function __wbg_getElementById_328f8c4a5bb51ba8(arg0, arg1, arg2) {
    const ret = getObject(arg0).getElementById(getStringFromWasm0(arg1, arg2));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
  }
  function __wbg_instanceof_Window_cde2416cf5126a72(arg0) {
    let result;
    try {
      result = getObject(arg0) instanceof Window;
    } catch (_) {
      result = false;
    }
    const ret = result;
    return ret;
  }
  function __wbg_document_183cf1eecfdbffee(arg0) {
    const ret = getObject(arg0).document;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
  }
  function __wbg_setAttribute_aebcae2169f2f869() {
    return handleError(function(arg0, arg1, arg2, arg3, arg4) {
      getObject(arg0).setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments);
  }
  function __wbg_prepend_78bb3ef0d1f21108() {
    return handleError(function(arg0, arg1) {
      getObject(arg0).prepend(getObject(arg1));
    }, arguments);
  }
  function __wbg_instanceof_CanvasRenderingContext2d_e264df6db9ec5a3d(arg0) {
    let result;
    try {
      result = getObject(arg0) instanceof CanvasRenderingContext2D;
    } catch (_) {
      result = false;
    }
    const ret = result;
    return ret;
  }
  function __wbg_getImageData_f55fb8cd70493ea6() {
    return handleError(function(arg0, arg1, arg2, arg3, arg4) {
      const ret = getObject(arg0).getImageData(arg1, arg2, arg3, arg4);
      return addHeapObject(ret);
    }, arguments);
  }
  function __wbg_debug_8f9a97dc395d342f(arg0, arg1, arg2, arg3) {
    console.debug(getObject(arg0), getObject(arg1), getObject(arg2), getObject(arg3));
  }
  function __wbg_error_94a25ece8eeb7bca(arg0, arg1, arg2, arg3) {
    console.error(getObject(arg0), getObject(arg1), getObject(arg2), getObject(arg3));
  }
  function __wbg_info_1d035e3d63b89260(arg0, arg1, arg2, arg3) {
    console.info(getObject(arg0), getObject(arg1), getObject(arg2), getObject(arg3));
  }
  function __wbg_log_7811587c4c6d2844(arg0) {
    console.log(getObject(arg0));
  }
  function __wbg_log_00bb83da94eb9ca8(arg0, arg1, arg2, arg3) {
    console.log(getObject(arg0), getObject(arg1), getObject(arg2), getObject(arg3));
  }
  function __wbg_warn_fab4b297e5c436a0(arg0, arg1, arg2, arg3) {
    console.warn(getObject(arg0), getObject(arg1), getObject(arg2), getObject(arg3));
  }
  function __wbg_data_f2cf019dc3a2c762(arg0, arg1) {
    const ret = getObject(arg1).data;
    const ptr1 = passArray8ToWasm0(ret, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
  }
  function __wbg_instanceof_HtmlCanvasElement_838d8b92f3c55028(arg0) {
    let result;
    try {
      result = getObject(arg0) instanceof HTMLCanvasElement;
    } catch (_) {
      result = false;
    }
    const ret = result;
    return ret;
  }
  function __wbg_width_b813b325b323728a(arg0) {
    const ret = getObject(arg0).width;
    return ret;
  }
  function __wbg_height_646e862bac72cff1(arg0) {
    const ret = getObject(arg0).height;
    return ret;
  }
  function __wbg_getContext_a29bad1d160bec3d() {
    return handleError(function(arg0, arg1, arg2) {
      const ret = getObject(arg0).getContext(getStringFromWasm0(arg1, arg2));
      return isLikeNone(ret) ? 0 : addHeapObject(ret);
    }, arguments);
  }
  function __wbg_newnoargs_ccdcae30fd002262(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
  }
  function __wbg_call_669127b9d730c650() {
    return handleError(function(arg0, arg1) {
      const ret = getObject(arg0).call(getObject(arg1));
      return addHeapObject(ret);
    }, arguments);
  }
  function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
  }
  function __wbg_self_3fad056edded10bd() {
    return handleError(function() {
      const ret = self.self;
      return addHeapObject(ret);
    }, arguments);
  }
  function __wbg_window_a4f46c98a61d4089() {
    return handleError(function() {
      const ret = window.window;
      return addHeapObject(ret);
    }, arguments);
  }
  function __wbg_globalThis_17eff828815f7d84() {
    return handleError(function() {
      const ret = globalThis.globalThis;
      return addHeapObject(ret);
    }, arguments);
  }
  function __wbg_global_46f939f6541643c5() {
    return handleError(function() {
      const ret = global.global;
      return addHeapObject(ret);
    }, arguments);
  }
  function __wbindgen_is_undefined(arg0) {
    const ret = getObject(arg0) === void 0;
    return ret;
  }
  function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
  }
  function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
  }
  return __toCommonJS(vtracer_webapp_bg_exports);
})();
