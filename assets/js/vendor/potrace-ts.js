var PotraceTS = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod2) => function __require2() {
    try {
      return mod2 || (0, cb[__getOwnPropNames(cb)[0]])((mod2 = { exports: {} }).exports, mod2), mod2.exports;
    } catch (e) {
      throw mod2 = 0, e;
    }
  };
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
  var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
    mod2
  ));
  var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);

  // node_modules/pako/lib/utils/common.js
  var require_common = __commonJS({
    "node_modules/pako/lib/utils/common.js"(exports) {
      "use strict";
      var TYPED_OK = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
      function _has(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
      }
      exports.assign = function(obj) {
        var sources = Array.prototype.slice.call(arguments, 1);
        while (sources.length) {
          var source = sources.shift();
          if (!source) {
            continue;
          }
          if (typeof source !== "object") {
            throw new TypeError(source + "must be non-object");
          }
          for (var p in source) {
            if (_has(source, p)) {
              obj[p] = source[p];
            }
          }
        }
        return obj;
      };
      exports.shrinkBuf = function(buf, size) {
        if (buf.length === size) {
          return buf;
        }
        if (buf.subarray) {
          return buf.subarray(0, size);
        }
        buf.length = size;
        return buf;
      };
      var fnTyped = {
        arraySet: function(dest, src, src_offs, len, dest_offs) {
          if (src.subarray && dest.subarray) {
            dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
            return;
          }
          for (var i = 0; i < len; i++) {
            dest[dest_offs + i] = src[src_offs + i];
          }
        },
        // Join array of chunks to single array.
        flattenChunks: function(chunks) {
          var i, l, len, pos, chunk, result;
          len = 0;
          for (i = 0, l = chunks.length; i < l; i++) {
            len += chunks[i].length;
          }
          result = new Uint8Array(len);
          pos = 0;
          for (i = 0, l = chunks.length; i < l; i++) {
            chunk = chunks[i];
            result.set(chunk, pos);
            pos += chunk.length;
          }
          return result;
        }
      };
      var fnUntyped = {
        arraySet: function(dest, src, src_offs, len, dest_offs) {
          for (var i = 0; i < len; i++) {
            dest[dest_offs + i] = src[src_offs + i];
          }
        },
        // Join array of chunks to single array.
        flattenChunks: function(chunks) {
          return [].concat.apply([], chunks);
        }
      };
      exports.setTyped = function(on) {
        if (on) {
          exports.Buf8 = Uint8Array;
          exports.Buf16 = Uint16Array;
          exports.Buf32 = Int32Array;
          exports.assign(exports, fnTyped);
        } else {
          exports.Buf8 = Array;
          exports.Buf16 = Array;
          exports.Buf32 = Array;
          exports.assign(exports, fnUntyped);
        }
      };
      exports.setTyped(TYPED_OK);
    }
  });

  // node_modules/pako/lib/zlib/trees.js
  var require_trees = __commonJS({
    "node_modules/pako/lib/zlib/trees.js"(exports) {
      "use strict";
      var utils = require_common();
      var Z_FIXED = 4;
      var Z_BINARY = 0;
      var Z_TEXT = 1;
      var Z_UNKNOWN = 2;
      function zero(buf) {
        var len = buf.length;
        while (--len >= 0) {
          buf[len] = 0;
        }
      }
      var STORED_BLOCK = 0;
      var STATIC_TREES = 1;
      var DYN_TREES = 2;
      var MIN_MATCH = 3;
      var MAX_MATCH = 258;
      var LENGTH_CODES = 29;
      var LITERALS = 256;
      var L_CODES = LITERALS + 1 + LENGTH_CODES;
      var D_CODES = 30;
      var BL_CODES = 19;
      var HEAP_SIZE = 2 * L_CODES + 1;
      var MAX_BITS = 15;
      var Buf_size = 16;
      var MAX_BL_BITS = 7;
      var END_BLOCK = 256;
      var REP_3_6 = 16;
      var REPZ_3_10 = 17;
      var REPZ_11_138 = 18;
      var extra_lbits = (
        /* extra bits for each length code */
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
      );
      var extra_dbits = (
        /* extra bits for each distance code */
        [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
      );
      var extra_blbits = (
        /* extra bits for each bit length code */
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]
      );
      var bl_order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
      var DIST_CODE_LEN = 512;
      var static_ltree = new Array((L_CODES + 2) * 2);
      zero(static_ltree);
      var static_dtree = new Array(D_CODES * 2);
      zero(static_dtree);
      var _dist_code = new Array(DIST_CODE_LEN);
      zero(_dist_code);
      var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
      zero(_length_code);
      var base_length = new Array(LENGTH_CODES);
      zero(base_length);
      var base_dist = new Array(D_CODES);
      zero(base_dist);
      function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
        this.static_tree = static_tree;
        this.extra_bits = extra_bits;
        this.extra_base = extra_base;
        this.elems = elems;
        this.max_length = max_length;
        this.has_stree = static_tree && static_tree.length;
      }
      var static_l_desc;
      var static_d_desc;
      var static_bl_desc;
      function TreeDesc(dyn_tree, stat_desc) {
        this.dyn_tree = dyn_tree;
        this.max_code = 0;
        this.stat_desc = stat_desc;
      }
      function d_code(dist) {
        return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
      }
      function put_short(s, w) {
        s.pending_buf[s.pending++] = w & 255;
        s.pending_buf[s.pending++] = w >>> 8 & 255;
      }
      function send_bits(s, value, length) {
        if (s.bi_valid > Buf_size - length) {
          s.bi_buf |= value << s.bi_valid & 65535;
          put_short(s, s.bi_buf);
          s.bi_buf = value >> Buf_size - s.bi_valid;
          s.bi_valid += length - Buf_size;
        } else {
          s.bi_buf |= value << s.bi_valid & 65535;
          s.bi_valid += length;
        }
      }
      function send_code(s, c, tree) {
        send_bits(
          s,
          tree[c * 2],
          tree[c * 2 + 1]
          /*.Len*/
        );
      }
      function bi_reverse(code, len) {
        var res = 0;
        do {
          res |= code & 1;
          code >>>= 1;
          res <<= 1;
        } while (--len > 0);
        return res >>> 1;
      }
      function bi_flush(s) {
        if (s.bi_valid === 16) {
          put_short(s, s.bi_buf);
          s.bi_buf = 0;
          s.bi_valid = 0;
        } else if (s.bi_valid >= 8) {
          s.pending_buf[s.pending++] = s.bi_buf & 255;
          s.bi_buf >>= 8;
          s.bi_valid -= 8;
        }
      }
      function gen_bitlen(s, desc) {
        var tree = desc.dyn_tree;
        var max_code = desc.max_code;
        var stree = desc.stat_desc.static_tree;
        var has_stree = desc.stat_desc.has_stree;
        var extra = desc.stat_desc.extra_bits;
        var base = desc.stat_desc.extra_base;
        var max_length = desc.stat_desc.max_length;
        var h;
        var n, m;
        var bits;
        var xbits;
        var f;
        var overflow = 0;
        for (bits = 0; bits <= MAX_BITS; bits++) {
          s.bl_count[bits] = 0;
        }
        tree[s.heap[s.heap_max] * 2 + 1] = 0;
        for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
          n = s.heap[h];
          bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
          if (bits > max_length) {
            bits = max_length;
            overflow++;
          }
          tree[n * 2 + 1] = bits;
          if (n > max_code) {
            continue;
          }
          s.bl_count[bits]++;
          xbits = 0;
          if (n >= base) {
            xbits = extra[n - base];
          }
          f = tree[n * 2];
          s.opt_len += f * (bits + xbits);
          if (has_stree) {
            s.static_len += f * (stree[n * 2 + 1] + xbits);
          }
        }
        if (overflow === 0) {
          return;
        }
        do {
          bits = max_length - 1;
          while (s.bl_count[bits] === 0) {
            bits--;
          }
          s.bl_count[bits]--;
          s.bl_count[bits + 1] += 2;
          s.bl_count[max_length]--;
          overflow -= 2;
        } while (overflow > 0);
        for (bits = max_length; bits !== 0; bits--) {
          n = s.bl_count[bits];
          while (n !== 0) {
            m = s.heap[--h];
            if (m > max_code) {
              continue;
            }
            if (tree[m * 2 + 1] !== bits) {
              s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
              tree[m * 2 + 1] = bits;
            }
            n--;
          }
        }
      }
      function gen_codes(tree, max_code, bl_count) {
        var next_code = new Array(MAX_BITS + 1);
        var code = 0;
        var bits;
        var n;
        for (bits = 1; bits <= MAX_BITS; bits++) {
          next_code[bits] = code = code + bl_count[bits - 1] << 1;
        }
        for (n = 0; n <= max_code; n++) {
          var len = tree[n * 2 + 1];
          if (len === 0) {
            continue;
          }
          tree[n * 2] = bi_reverse(next_code[len]++, len);
        }
      }
      function tr_static_init() {
        var n;
        var bits;
        var length;
        var code;
        var dist;
        var bl_count = new Array(MAX_BITS + 1);
        length = 0;
        for (code = 0; code < LENGTH_CODES - 1; code++) {
          base_length[code] = length;
          for (n = 0; n < 1 << extra_lbits[code]; n++) {
            _length_code[length++] = code;
          }
        }
        _length_code[length - 1] = code;
        dist = 0;
        for (code = 0; code < 16; code++) {
          base_dist[code] = dist;
          for (n = 0; n < 1 << extra_dbits[code]; n++) {
            _dist_code[dist++] = code;
          }
        }
        dist >>= 7;
        for (; code < D_CODES; code++) {
          base_dist[code] = dist << 7;
          for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
            _dist_code[256 + dist++] = code;
          }
        }
        for (bits = 0; bits <= MAX_BITS; bits++) {
          bl_count[bits] = 0;
        }
        n = 0;
        while (n <= 143) {
          static_ltree[n * 2 + 1] = 8;
          n++;
          bl_count[8]++;
        }
        while (n <= 255) {
          static_ltree[n * 2 + 1] = 9;
          n++;
          bl_count[9]++;
        }
        while (n <= 279) {
          static_ltree[n * 2 + 1] = 7;
          n++;
          bl_count[7]++;
        }
        while (n <= 287) {
          static_ltree[n * 2 + 1] = 8;
          n++;
          bl_count[8]++;
        }
        gen_codes(static_ltree, L_CODES + 1, bl_count);
        for (n = 0; n < D_CODES; n++) {
          static_dtree[n * 2 + 1] = 5;
          static_dtree[n * 2] = bi_reverse(n, 5);
        }
        static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
        static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS);
        static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS);
      }
      function init_block(s) {
        var n;
        for (n = 0; n < L_CODES; n++) {
          s.dyn_ltree[n * 2] = 0;
        }
        for (n = 0; n < D_CODES; n++) {
          s.dyn_dtree[n * 2] = 0;
        }
        for (n = 0; n < BL_CODES; n++) {
          s.bl_tree[n * 2] = 0;
        }
        s.dyn_ltree[END_BLOCK * 2] = 1;
        s.opt_len = s.static_len = 0;
        s.last_lit = s.matches = 0;
      }
      function bi_windup(s) {
        if (s.bi_valid > 8) {
          put_short(s, s.bi_buf);
        } else if (s.bi_valid > 0) {
          s.pending_buf[s.pending++] = s.bi_buf;
        }
        s.bi_buf = 0;
        s.bi_valid = 0;
      }
      function copy_block(s, buf, len, header) {
        bi_windup(s);
        if (header) {
          put_short(s, len);
          put_short(s, ~len);
        }
        utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
        s.pending += len;
      }
      function smaller(tree, n, m, depth) {
        var _n2 = n * 2;
        var _m2 = m * 2;
        return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
      }
      function pqdownheap(s, tree, k) {
        var v = s.heap[k];
        var j = k << 1;
        while (j <= s.heap_len) {
          if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
            j++;
          }
          if (smaller(tree, v, s.heap[j], s.depth)) {
            break;
          }
          s.heap[k] = s.heap[j];
          k = j;
          j <<= 1;
        }
        s.heap[k] = v;
      }
      function compress_block(s, ltree, dtree) {
        var dist;
        var lc;
        var lx = 0;
        var code;
        var extra;
        if (s.last_lit !== 0) {
          do {
            dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
            lc = s.pending_buf[s.l_buf + lx];
            lx++;
            if (dist === 0) {
              send_code(s, lc, ltree);
            } else {
              code = _length_code[lc];
              send_code(s, code + LITERALS + 1, ltree);
              extra = extra_lbits[code];
              if (extra !== 0) {
                lc -= base_length[code];
                send_bits(s, lc, extra);
              }
              dist--;
              code = d_code(dist);
              send_code(s, code, dtree);
              extra = extra_dbits[code];
              if (extra !== 0) {
                dist -= base_dist[code];
                send_bits(s, dist, extra);
              }
            }
          } while (lx < s.last_lit);
        }
        send_code(s, END_BLOCK, ltree);
      }
      function build_tree(s, desc) {
        var tree = desc.dyn_tree;
        var stree = desc.stat_desc.static_tree;
        var has_stree = desc.stat_desc.has_stree;
        var elems = desc.stat_desc.elems;
        var n, m;
        var max_code = -1;
        var node;
        s.heap_len = 0;
        s.heap_max = HEAP_SIZE;
        for (n = 0; n < elems; n++) {
          if (tree[n * 2] !== 0) {
            s.heap[++s.heap_len] = max_code = n;
            s.depth[n] = 0;
          } else {
            tree[n * 2 + 1] = 0;
          }
        }
        while (s.heap_len < 2) {
          node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
          tree[node * 2] = 1;
          s.depth[node] = 0;
          s.opt_len--;
          if (has_stree) {
            s.static_len -= stree[node * 2 + 1];
          }
        }
        desc.max_code = max_code;
        for (n = s.heap_len >> 1; n >= 1; n--) {
          pqdownheap(s, tree, n);
        }
        node = elems;
        do {
          n = s.heap[
            1
            /*SMALLEST*/
          ];
          s.heap[
            1
            /*SMALLEST*/
          ] = s.heap[s.heap_len--];
          pqdownheap(
            s,
            tree,
            1
            /*SMALLEST*/
          );
          m = s.heap[
            1
            /*SMALLEST*/
          ];
          s.heap[--s.heap_max] = n;
          s.heap[--s.heap_max] = m;
          tree[node * 2] = tree[n * 2] + tree[m * 2];
          s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
          tree[n * 2 + 1] = tree[m * 2 + 1] = node;
          s.heap[
            1
            /*SMALLEST*/
          ] = node++;
          pqdownheap(
            s,
            tree,
            1
            /*SMALLEST*/
          );
        } while (s.heap_len >= 2);
        s.heap[--s.heap_max] = s.heap[
          1
          /*SMALLEST*/
        ];
        gen_bitlen(s, desc);
        gen_codes(tree, max_code, s.bl_count);
      }
      function scan_tree(s, tree, max_code) {
        var n;
        var prevlen = -1;
        var curlen;
        var nextlen = tree[0 * 2 + 1];
        var count = 0;
        var max_count = 7;
        var min_count = 4;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        }
        tree[(max_code + 1) * 2 + 1] = 65535;
        for (n = 0; n <= max_code; n++) {
          curlen = nextlen;
          nextlen = tree[(n + 1) * 2 + 1];
          if (++count < max_count && curlen === nextlen) {
            continue;
          } else if (count < min_count) {
            s.bl_tree[curlen * 2] += count;
          } else if (curlen !== 0) {
            if (curlen !== prevlen) {
              s.bl_tree[curlen * 2]++;
            }
            s.bl_tree[REP_3_6 * 2]++;
          } else if (count <= 10) {
            s.bl_tree[REPZ_3_10 * 2]++;
          } else {
            s.bl_tree[REPZ_11_138 * 2]++;
          }
          count = 0;
          prevlen = curlen;
          if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
          } else if (curlen === nextlen) {
            max_count = 6;
            min_count = 3;
          } else {
            max_count = 7;
            min_count = 4;
          }
        }
      }
      function send_tree(s, tree, max_code) {
        var n;
        var prevlen = -1;
        var curlen;
        var nextlen = tree[0 * 2 + 1];
        var count = 0;
        var max_count = 7;
        var min_count = 4;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        }
        for (n = 0; n <= max_code; n++) {
          curlen = nextlen;
          nextlen = tree[(n + 1) * 2 + 1];
          if (++count < max_count && curlen === nextlen) {
            continue;
          } else if (count < min_count) {
            do {
              send_code(s, curlen, s.bl_tree);
            } while (--count !== 0);
          } else if (curlen !== 0) {
            if (curlen !== prevlen) {
              send_code(s, curlen, s.bl_tree);
              count--;
            }
            send_code(s, REP_3_6, s.bl_tree);
            send_bits(s, count - 3, 2);
          } else if (count <= 10) {
            send_code(s, REPZ_3_10, s.bl_tree);
            send_bits(s, count - 3, 3);
          } else {
            send_code(s, REPZ_11_138, s.bl_tree);
            send_bits(s, count - 11, 7);
          }
          count = 0;
          prevlen = curlen;
          if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
          } else if (curlen === nextlen) {
            max_count = 6;
            min_count = 3;
          } else {
            max_count = 7;
            min_count = 4;
          }
        }
      }
      function build_bl_tree(s) {
        var max_blindex;
        scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
        scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
        build_tree(s, s.bl_desc);
        for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
          if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
            break;
          }
        }
        s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
        return max_blindex;
      }
      function send_all_trees(s, lcodes, dcodes, blcodes) {
        var rank;
        send_bits(s, lcodes - 257, 5);
        send_bits(s, dcodes - 1, 5);
        send_bits(s, blcodes - 4, 4);
        for (rank = 0; rank < blcodes; rank++) {
          send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], 3);
        }
        send_tree(s, s.dyn_ltree, lcodes - 1);
        send_tree(s, s.dyn_dtree, dcodes - 1);
      }
      function detect_data_type(s) {
        var black_mask = 4093624447;
        var n;
        for (n = 0; n <= 31; n++, black_mask >>>= 1) {
          if (black_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
            return Z_BINARY;
          }
        }
        if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
          return Z_TEXT;
        }
        for (n = 32; n < LITERALS; n++) {
          if (s.dyn_ltree[n * 2] !== 0) {
            return Z_TEXT;
          }
        }
        return Z_BINARY;
      }
      var static_init_done = false;
      function _tr_init(s) {
        if (!static_init_done) {
          tr_static_init();
          static_init_done = true;
        }
        s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
        s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
        s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
        s.bi_buf = 0;
        s.bi_valid = 0;
        init_block(s);
      }
      function _tr_stored_block(s, buf, stored_len, last) {
        send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
        copy_block(s, buf, stored_len, true);
      }
      function _tr_align(s) {
        send_bits(s, STATIC_TREES << 1, 3);
        send_code(s, END_BLOCK, static_ltree);
        bi_flush(s);
      }
      function _tr_flush_block(s, buf, stored_len, last) {
        var opt_lenb, static_lenb;
        var max_blindex = 0;
        if (s.level > 0) {
          if (s.strm.data_type === Z_UNKNOWN) {
            s.strm.data_type = detect_data_type(s);
          }
          build_tree(s, s.l_desc);
          build_tree(s, s.d_desc);
          max_blindex = build_bl_tree(s);
          opt_lenb = s.opt_len + 3 + 7 >>> 3;
          static_lenb = s.static_len + 3 + 7 >>> 3;
          if (static_lenb <= opt_lenb) {
            opt_lenb = static_lenb;
          }
        } else {
          opt_lenb = static_lenb = stored_len + 5;
        }
        if (stored_len + 4 <= opt_lenb && buf !== -1) {
          _tr_stored_block(s, buf, stored_len, last);
        } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {
          send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
          compress_block(s, static_ltree, static_dtree);
        } else {
          send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
          send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
          compress_block(s, s.dyn_ltree, s.dyn_dtree);
        }
        init_block(s);
        if (last) {
          bi_windup(s);
        }
      }
      function _tr_tally(s, dist, lc) {
        s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 255;
        s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 255;
        s.pending_buf[s.l_buf + s.last_lit] = lc & 255;
        s.last_lit++;
        if (dist === 0) {
          s.dyn_ltree[lc * 2]++;
        } else {
          s.matches++;
          dist--;
          s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]++;
          s.dyn_dtree[d_code(dist) * 2]++;
        }
        return s.last_lit === s.lit_bufsize - 1;
      }
      exports._tr_init = _tr_init;
      exports._tr_stored_block = _tr_stored_block;
      exports._tr_flush_block = _tr_flush_block;
      exports._tr_tally = _tr_tally;
      exports._tr_align = _tr_align;
    }
  });

  // node_modules/pako/lib/zlib/adler32.js
  var require_adler32 = __commonJS({
    "node_modules/pako/lib/zlib/adler32.js"(exports, module) {
      "use strict";
      function adler32(adler, buf, len, pos) {
        var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
        while (len !== 0) {
          n = len > 2e3 ? 2e3 : len;
          len -= n;
          do {
            s1 = s1 + buf[pos++] | 0;
            s2 = s2 + s1 | 0;
          } while (--n);
          s1 %= 65521;
          s2 %= 65521;
        }
        return s1 | s2 << 16 | 0;
      }
      module.exports = adler32;
    }
  });

  // node_modules/pako/lib/zlib/crc32.js
  var require_crc32 = __commonJS({
    "node_modules/pako/lib/zlib/crc32.js"(exports, module) {
      "use strict";
      function makeTable() {
        var c, table = [];
        for (var n = 0; n < 256; n++) {
          c = n;
          for (var k = 0; k < 8; k++) {
            c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
          }
          table[n] = c;
        }
        return table;
      }
      var crcTable = makeTable();
      function crc32(crc, buf, len, pos) {
        var t = crcTable, end = pos + len;
        crc ^= -1;
        for (var i = pos; i < end; i++) {
          crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
        }
        return crc ^ -1;
      }
      module.exports = crc32;
    }
  });

  // node_modules/pako/lib/zlib/messages.js
  var require_messages = __commonJS({
    "node_modules/pako/lib/zlib/messages.js"(exports, module) {
      "use strict";
      module.exports = {
        2: "need dictionary",
        /* Z_NEED_DICT       2  */
        1: "stream end",
        /* Z_STREAM_END      1  */
        0: "",
        /* Z_OK              0  */
        "-1": "file error",
        /* Z_ERRNO         (-1) */
        "-2": "stream error",
        /* Z_STREAM_ERROR  (-2) */
        "-3": "data error",
        /* Z_DATA_ERROR    (-3) */
        "-4": "insufficient memory",
        /* Z_MEM_ERROR     (-4) */
        "-5": "buffer error",
        /* Z_BUF_ERROR     (-5) */
        "-6": "incompatible version"
        /* Z_VERSION_ERROR (-6) */
      };
    }
  });

  // node_modules/pako/lib/zlib/deflate.js
  var require_deflate = __commonJS({
    "node_modules/pako/lib/zlib/deflate.js"(exports) {
      "use strict";
      var utils = require_common();
      var trees = require_trees();
      var adler32 = require_adler32();
      var crc32 = require_crc32();
      var msg = require_messages();
      var Z_NO_FLUSH = 0;
      var Z_PARTIAL_FLUSH = 1;
      var Z_FULL_FLUSH = 3;
      var Z_FINISH = 4;
      var Z_BLOCK = 5;
      var Z_OK = 0;
      var Z_STREAM_END = 1;
      var Z_STREAM_ERROR = -2;
      var Z_DATA_ERROR = -3;
      var Z_BUF_ERROR = -5;
      var Z_DEFAULT_COMPRESSION = -1;
      var Z_FILTERED = 1;
      var Z_HUFFMAN_ONLY = 2;
      var Z_RLE = 3;
      var Z_FIXED = 4;
      var Z_DEFAULT_STRATEGY = 0;
      var Z_UNKNOWN = 2;
      var Z_DEFLATED = 8;
      var MAX_MEM_LEVEL = 9;
      var MAX_WBITS = 15;
      var DEF_MEM_LEVEL = 8;
      var LENGTH_CODES = 29;
      var LITERALS = 256;
      var L_CODES = LITERALS + 1 + LENGTH_CODES;
      var D_CODES = 30;
      var BL_CODES = 19;
      var HEAP_SIZE = 2 * L_CODES + 1;
      var MAX_BITS = 15;
      var MIN_MATCH = 3;
      var MAX_MATCH = 258;
      var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
      var PRESET_DICT = 32;
      var INIT_STATE = 42;
      var EXTRA_STATE = 69;
      var NAME_STATE = 73;
      var COMMENT_STATE = 91;
      var HCRC_STATE = 103;
      var BUSY_STATE = 113;
      var FINISH_STATE = 666;
      var BS_NEED_MORE = 1;
      var BS_BLOCK_DONE = 2;
      var BS_FINISH_STARTED = 3;
      var BS_FINISH_DONE = 4;
      var OS_CODE = 3;
      function err(strm, errorCode) {
        strm.msg = msg[errorCode];
        return errorCode;
      }
      function rank(f) {
        return (f << 1) - (f > 4 ? 9 : 0);
      }
      function zero(buf) {
        var len = buf.length;
        while (--len >= 0) {
          buf[len] = 0;
        }
      }
      function flush_pending(strm) {
        var s = strm.state;
        var len = s.pending;
        if (len > strm.avail_out) {
          len = strm.avail_out;
        }
        if (len === 0) {
          return;
        }
        utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
        strm.next_out += len;
        s.pending_out += len;
        strm.total_out += len;
        strm.avail_out -= len;
        s.pending -= len;
        if (s.pending === 0) {
          s.pending_out = 0;
        }
      }
      function flush_block_only(s, last) {
        trees._tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
        s.block_start = s.strstart;
        flush_pending(s.strm);
      }
      function put_byte(s, b) {
        s.pending_buf[s.pending++] = b;
      }
      function putShortMSB(s, b) {
        s.pending_buf[s.pending++] = b >>> 8 & 255;
        s.pending_buf[s.pending++] = b & 255;
      }
      function read_buf(strm, buf, start, size) {
        var len = strm.avail_in;
        if (len > size) {
          len = size;
        }
        if (len === 0) {
          return 0;
        }
        strm.avail_in -= len;
        utils.arraySet(buf, strm.input, strm.next_in, len, start);
        if (strm.state.wrap === 1) {
          strm.adler = adler32(strm.adler, buf, len, start);
        } else if (strm.state.wrap === 2) {
          strm.adler = crc32(strm.adler, buf, len, start);
        }
        strm.next_in += len;
        strm.total_in += len;
        return len;
      }
      function longest_match(s, cur_match) {
        var chain_length = s.max_chain_length;
        var scan = s.strstart;
        var match;
        var len;
        var best_len = s.prev_length;
        var nice_match = s.nice_match;
        var limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
        var _win = s.window;
        var wmask = s.w_mask;
        var prev = s.prev;
        var strend = s.strstart + MAX_MATCH;
        var scan_end1 = _win[scan + best_len - 1];
        var scan_end = _win[scan + best_len];
        if (s.prev_length >= s.good_match) {
          chain_length >>= 2;
        }
        if (nice_match > s.lookahead) {
          nice_match = s.lookahead;
        }
        do {
          match = cur_match;
          if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
            continue;
          }
          scan += 2;
          match++;
          do {
          } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
          len = MAX_MATCH - (strend - scan);
          scan = strend - MAX_MATCH;
          if (len > best_len) {
            s.match_start = cur_match;
            best_len = len;
            if (len >= nice_match) {
              break;
            }
            scan_end1 = _win[scan + best_len - 1];
            scan_end = _win[scan + best_len];
          }
        } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
        if (best_len <= s.lookahead) {
          return best_len;
        }
        return s.lookahead;
      }
      function fill_window(s) {
        var _w_size = s.w_size;
        var p, n, m, more, str;
        do {
          more = s.window_size - s.lookahead - s.strstart;
          if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
            utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
            s.match_start -= _w_size;
            s.strstart -= _w_size;
            s.block_start -= _w_size;
            n = s.hash_size;
            p = n;
            do {
              m = s.head[--p];
              s.head[p] = m >= _w_size ? m - _w_size : 0;
            } while (--n);
            n = _w_size;
            p = n;
            do {
              m = s.prev[--p];
              s.prev[p] = m >= _w_size ? m - _w_size : 0;
            } while (--n);
            more += _w_size;
          }
          if (s.strm.avail_in === 0) {
            break;
          }
          n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
          s.lookahead += n;
          if (s.lookahead + s.insert >= MIN_MATCH) {
            str = s.strstart - s.insert;
            s.ins_h = s.window[str];
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + 1]) & s.hash_mask;
            while (s.insert) {
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
              s.prev[str & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = str;
              str++;
              s.insert--;
              if (s.lookahead + s.insert < MIN_MATCH) {
                break;
              }
            }
          }
        } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
      }
      function deflate_stored(s, flush) {
        var max_block_size = 65535;
        if (max_block_size > s.pending_buf_size - 5) {
          max_block_size = s.pending_buf_size - 5;
        }
        for (; ; ) {
          if (s.lookahead <= 1) {
            fill_window(s);
            if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            if (s.lookahead === 0) {
              break;
            }
          }
          s.strstart += s.lookahead;
          s.lookahead = 0;
          var max_start = s.block_start + max_block_size;
          if (s.strstart === 0 || s.strstart >= max_start) {
            s.lookahead = s.strstart - max_start;
            s.strstart = max_start;
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
          if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        }
        s.insert = 0;
        if (flush === Z_FINISH) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.strstart > s.block_start) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_NEED_MORE;
      }
      function deflate_fast(s, flush) {
        var hash_head;
        var bflush;
        for (; ; ) {
          if (s.lookahead < MIN_LOOKAHEAD) {
            fill_window(s);
            if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            if (s.lookahead === 0) {
              break;
            }
          }
          hash_head = 0;
          if (s.lookahead >= MIN_MATCH) {
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
          }
          if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
            s.match_length = longest_match(s, hash_head);
          }
          if (s.match_length >= MIN_MATCH) {
            bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
            s.lookahead -= s.match_length;
            if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
              s.match_length--;
              do {
                s.strstart++;
                s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = s.strstart;
              } while (--s.match_length !== 0);
              s.strstart++;
            } else {
              s.strstart += s.match_length;
              s.match_length = 0;
              s.ins_h = s.window[s.strstart];
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + 1]) & s.hash_mask;
            }
          } else {
            bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
            s.lookahead--;
            s.strstart++;
          }
          if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        }
        s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
        if (flush === Z_FINISH) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.last_lit) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      }
      function deflate_slow(s, flush) {
        var hash_head;
        var bflush;
        var max_insert;
        for (; ; ) {
          if (s.lookahead < MIN_LOOKAHEAD) {
            fill_window(s);
            if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            if (s.lookahead === 0) {
              break;
            }
          }
          hash_head = 0;
          if (s.lookahead >= MIN_MATCH) {
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
          }
          s.prev_length = s.match_length;
          s.prev_match = s.match_start;
          s.match_length = MIN_MATCH - 1;
          if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
            s.match_length = longest_match(s, hash_head);
            if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
              s.match_length = MIN_MATCH - 1;
            }
          }
          if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
            max_insert = s.strstart + s.lookahead - MIN_MATCH;
            bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
            s.lookahead -= s.prev_length - 1;
            s.prev_length -= 2;
            do {
              if (++s.strstart <= max_insert) {
                s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = s.strstart;
              }
            } while (--s.prev_length !== 0);
            s.match_available = 0;
            s.match_length = MIN_MATCH - 1;
            s.strstart++;
            if (bflush) {
              flush_block_only(s, false);
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            }
          } else if (s.match_available) {
            bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
            if (bflush) {
              flush_block_only(s, false);
            }
            s.strstart++;
            s.lookahead--;
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          } else {
            s.match_available = 1;
            s.strstart++;
            s.lookahead--;
          }
        }
        if (s.match_available) {
          bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
          s.match_available = 0;
        }
        s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
        if (flush === Z_FINISH) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.last_lit) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      }
      function deflate_rle(s, flush) {
        var bflush;
        var prev;
        var scan, strend;
        var _win = s.window;
        for (; ; ) {
          if (s.lookahead <= MAX_MATCH) {
            fill_window(s);
            if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            if (s.lookahead === 0) {
              break;
            }
          }
          s.match_length = 0;
          if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
            scan = s.strstart - 1;
            prev = _win[scan];
            if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
              strend = s.strstart + MAX_MATCH;
              do {
              } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
              s.match_length = MAX_MATCH - (strend - scan);
              if (s.match_length > s.lookahead) {
                s.match_length = s.lookahead;
              }
            }
          }
          if (s.match_length >= MIN_MATCH) {
            bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);
            s.lookahead -= s.match_length;
            s.strstart += s.match_length;
            s.match_length = 0;
          } else {
            bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
            s.lookahead--;
            s.strstart++;
          }
          if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        }
        s.insert = 0;
        if (flush === Z_FINISH) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.last_lit) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      }
      function deflate_huff(s, flush) {
        var bflush;
        for (; ; ) {
          if (s.lookahead === 0) {
            fill_window(s);
            if (s.lookahead === 0) {
              if (flush === Z_NO_FLUSH) {
                return BS_NEED_MORE;
              }
              break;
            }
          }
          s.match_length = 0;
          bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
          s.lookahead--;
          s.strstart++;
          if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        }
        s.insert = 0;
        if (flush === Z_FINISH) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.last_lit) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      }
      function Config(good_length, max_lazy, nice_length, max_chain, func) {
        this.good_length = good_length;
        this.max_lazy = max_lazy;
        this.nice_length = nice_length;
        this.max_chain = max_chain;
        this.func = func;
      }
      var configuration_table;
      configuration_table = [
        /*      good lazy nice chain */
        new Config(0, 0, 0, 0, deflate_stored),
        /* 0 store only */
        new Config(4, 4, 8, 4, deflate_fast),
        /* 1 max speed, no lazy matches */
        new Config(4, 5, 16, 8, deflate_fast),
        /* 2 */
        new Config(4, 6, 32, 32, deflate_fast),
        /* 3 */
        new Config(4, 4, 16, 16, deflate_slow),
        /* 4 lazy matches */
        new Config(8, 16, 32, 32, deflate_slow),
        /* 5 */
        new Config(8, 16, 128, 128, deflate_slow),
        /* 6 */
        new Config(8, 32, 128, 256, deflate_slow),
        /* 7 */
        new Config(32, 128, 258, 1024, deflate_slow),
        /* 8 */
        new Config(32, 258, 258, 4096, deflate_slow)
        /* 9 max compression */
      ];
      function lm_init(s) {
        s.window_size = 2 * s.w_size;
        zero(s.head);
        s.max_lazy_match = configuration_table[s.level].max_lazy;
        s.good_match = configuration_table[s.level].good_length;
        s.nice_match = configuration_table[s.level].nice_length;
        s.max_chain_length = configuration_table[s.level].max_chain;
        s.strstart = 0;
        s.block_start = 0;
        s.lookahead = 0;
        s.insert = 0;
        s.match_length = s.prev_length = MIN_MATCH - 1;
        s.match_available = 0;
        s.ins_h = 0;
      }
      function DeflateState() {
        this.strm = null;
        this.status = 0;
        this.pending_buf = null;
        this.pending_buf_size = 0;
        this.pending_out = 0;
        this.pending = 0;
        this.wrap = 0;
        this.gzhead = null;
        this.gzindex = 0;
        this.method = Z_DEFLATED;
        this.last_flush = -1;
        this.w_size = 0;
        this.w_bits = 0;
        this.w_mask = 0;
        this.window = null;
        this.window_size = 0;
        this.prev = null;
        this.head = null;
        this.ins_h = 0;
        this.hash_size = 0;
        this.hash_bits = 0;
        this.hash_mask = 0;
        this.hash_shift = 0;
        this.block_start = 0;
        this.match_length = 0;
        this.prev_match = 0;
        this.match_available = 0;
        this.strstart = 0;
        this.match_start = 0;
        this.lookahead = 0;
        this.prev_length = 0;
        this.max_chain_length = 0;
        this.max_lazy_match = 0;
        this.level = 0;
        this.strategy = 0;
        this.good_match = 0;
        this.nice_match = 0;
        this.dyn_ltree = new utils.Buf16(HEAP_SIZE * 2);
        this.dyn_dtree = new utils.Buf16((2 * D_CODES + 1) * 2);
        this.bl_tree = new utils.Buf16((2 * BL_CODES + 1) * 2);
        zero(this.dyn_ltree);
        zero(this.dyn_dtree);
        zero(this.bl_tree);
        this.l_desc = null;
        this.d_desc = null;
        this.bl_desc = null;
        this.bl_count = new utils.Buf16(MAX_BITS + 1);
        this.heap = new utils.Buf16(2 * L_CODES + 1);
        zero(this.heap);
        this.heap_len = 0;
        this.heap_max = 0;
        this.depth = new utils.Buf16(2 * L_CODES + 1);
        zero(this.depth);
        this.l_buf = 0;
        this.lit_bufsize = 0;
        this.last_lit = 0;
        this.d_buf = 0;
        this.opt_len = 0;
        this.static_len = 0;
        this.matches = 0;
        this.insert = 0;
        this.bi_buf = 0;
        this.bi_valid = 0;
      }
      function deflateResetKeep(strm) {
        var s;
        if (!strm || !strm.state) {
          return err(strm, Z_STREAM_ERROR);
        }
        strm.total_in = strm.total_out = 0;
        strm.data_type = Z_UNKNOWN;
        s = strm.state;
        s.pending = 0;
        s.pending_out = 0;
        if (s.wrap < 0) {
          s.wrap = -s.wrap;
        }
        s.status = s.wrap ? INIT_STATE : BUSY_STATE;
        strm.adler = s.wrap === 2 ? 0 : 1;
        s.last_flush = Z_NO_FLUSH;
        trees._tr_init(s);
        return Z_OK;
      }
      function deflateReset(strm) {
        var ret = deflateResetKeep(strm);
        if (ret === Z_OK) {
          lm_init(strm.state);
        }
        return ret;
      }
      function deflateSetHeader(strm, head) {
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        if (strm.state.wrap !== 2) {
          return Z_STREAM_ERROR;
        }
        strm.state.gzhead = head;
        return Z_OK;
      }
      function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
        if (!strm) {
          return Z_STREAM_ERROR;
        }
        var wrap = 1;
        if (level === Z_DEFAULT_COMPRESSION) {
          level = 6;
        }
        if (windowBits < 0) {
          wrap = 0;
          windowBits = -windowBits;
        } else if (windowBits > 15) {
          wrap = 2;
          windowBits -= 16;
        }
        if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) {
          return err(strm, Z_STREAM_ERROR);
        }
        if (windowBits === 8) {
          windowBits = 9;
        }
        var s = new DeflateState();
        strm.state = s;
        s.strm = strm;
        s.wrap = wrap;
        s.gzhead = null;
        s.w_bits = windowBits;
        s.w_size = 1 << s.w_bits;
        s.w_mask = s.w_size - 1;
        s.hash_bits = memLevel + 7;
        s.hash_size = 1 << s.hash_bits;
        s.hash_mask = s.hash_size - 1;
        s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
        s.window = new utils.Buf8(s.w_size * 2);
        s.head = new utils.Buf16(s.hash_size);
        s.prev = new utils.Buf16(s.w_size);
        s.lit_bufsize = 1 << memLevel + 6;
        s.pending_buf_size = s.lit_bufsize * 4;
        s.pending_buf = new utils.Buf8(s.pending_buf_size);
        s.d_buf = 1 * s.lit_bufsize;
        s.l_buf = (1 + 2) * s.lit_bufsize;
        s.level = level;
        s.strategy = strategy;
        s.method = method;
        return deflateReset(strm);
      }
      function deflateInit(strm, level) {
        return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
      }
      function deflate(strm, flush) {
        var old_flush, s;
        var beg, val;
        if (!strm || !strm.state || flush > Z_BLOCK || flush < 0) {
          return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
        }
        s = strm.state;
        if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH) {
          return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
        }
        s.strm = strm;
        old_flush = s.last_flush;
        s.last_flush = flush;
        if (s.status === INIT_STATE) {
          if (s.wrap === 2) {
            strm.adler = 0;
            put_byte(s, 31);
            put_byte(s, 139);
            put_byte(s, 8);
            if (!s.gzhead) {
              put_byte(s, 0);
              put_byte(s, 0);
              put_byte(s, 0);
              put_byte(s, 0);
              put_byte(s, 0);
              put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
              put_byte(s, OS_CODE);
              s.status = BUSY_STATE;
            } else {
              put_byte(
                s,
                (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16)
              );
              put_byte(s, s.gzhead.time & 255);
              put_byte(s, s.gzhead.time >> 8 & 255);
              put_byte(s, s.gzhead.time >> 16 & 255);
              put_byte(s, s.gzhead.time >> 24 & 255);
              put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
              put_byte(s, s.gzhead.os & 255);
              if (s.gzhead.extra && s.gzhead.extra.length) {
                put_byte(s, s.gzhead.extra.length & 255);
                put_byte(s, s.gzhead.extra.length >> 8 & 255);
              }
              if (s.gzhead.hcrc) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
              }
              s.gzindex = 0;
              s.status = EXTRA_STATE;
            }
          } else {
            var header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8;
            var level_flags = -1;
            if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
              level_flags = 0;
            } else if (s.level < 6) {
              level_flags = 1;
            } else if (s.level === 6) {
              level_flags = 2;
            } else {
              level_flags = 3;
            }
            header |= level_flags << 6;
            if (s.strstart !== 0) {
              header |= PRESET_DICT;
            }
            header += 31 - header % 31;
            s.status = BUSY_STATE;
            putShortMSB(s, header);
            if (s.strstart !== 0) {
              putShortMSB(s, strm.adler >>> 16);
              putShortMSB(s, strm.adler & 65535);
            }
            strm.adler = 1;
          }
        }
        if (s.status === EXTRA_STATE) {
          if (s.gzhead.extra) {
            beg = s.pending;
            while (s.gzindex < (s.gzhead.extra.length & 65535)) {
              if (s.pending === s.pending_buf_size) {
                if (s.gzhead.hcrc && s.pending > beg) {
                  strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                flush_pending(strm);
                beg = s.pending;
                if (s.pending === s.pending_buf_size) {
                  break;
                }
              }
              put_byte(s, s.gzhead.extra[s.gzindex] & 255);
              s.gzindex++;
            }
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            if (s.gzindex === s.gzhead.extra.length) {
              s.gzindex = 0;
              s.status = NAME_STATE;
            }
          } else {
            s.status = NAME_STATE;
          }
        }
        if (s.status === NAME_STATE) {
          if (s.gzhead.name) {
            beg = s.pending;
            do {
              if (s.pending === s.pending_buf_size) {
                if (s.gzhead.hcrc && s.pending > beg) {
                  strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                flush_pending(strm);
                beg = s.pending;
                if (s.pending === s.pending_buf_size) {
                  val = 1;
                  break;
                }
              }
              if (s.gzindex < s.gzhead.name.length) {
                val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
              } else {
                val = 0;
              }
              put_byte(s, val);
            } while (val !== 0);
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            if (val === 0) {
              s.gzindex = 0;
              s.status = COMMENT_STATE;
            }
          } else {
            s.status = COMMENT_STATE;
          }
        }
        if (s.status === COMMENT_STATE) {
          if (s.gzhead.comment) {
            beg = s.pending;
            do {
              if (s.pending === s.pending_buf_size) {
                if (s.gzhead.hcrc && s.pending > beg) {
                  strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                flush_pending(strm);
                beg = s.pending;
                if (s.pending === s.pending_buf_size) {
                  val = 1;
                  break;
                }
              }
              if (s.gzindex < s.gzhead.comment.length) {
                val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
              } else {
                val = 0;
              }
              put_byte(s, val);
            } while (val !== 0);
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            if (val === 0) {
              s.status = HCRC_STATE;
            }
          } else {
            s.status = HCRC_STATE;
          }
        }
        if (s.status === HCRC_STATE) {
          if (s.gzhead.hcrc) {
            if (s.pending + 2 > s.pending_buf_size) {
              flush_pending(strm);
            }
            if (s.pending + 2 <= s.pending_buf_size) {
              put_byte(s, strm.adler & 255);
              put_byte(s, strm.adler >> 8 & 255);
              strm.adler = 0;
              s.status = BUSY_STATE;
            }
          } else {
            s.status = BUSY_STATE;
          }
        }
        if (s.pending !== 0) {
          flush_pending(strm);
          if (strm.avail_out === 0) {
            s.last_flush = -1;
            return Z_OK;
          }
        } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) {
          return err(strm, Z_BUF_ERROR);
        }
        if (s.status === FINISH_STATE && strm.avail_in !== 0) {
          return err(strm, Z_BUF_ERROR);
        }
        if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH && s.status !== FINISH_STATE) {
          var bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
          if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
            s.status = FINISH_STATE;
          }
          if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
            if (strm.avail_out === 0) {
              s.last_flush = -1;
            }
            return Z_OK;
          }
          if (bstate === BS_BLOCK_DONE) {
            if (flush === Z_PARTIAL_FLUSH) {
              trees._tr_align(s);
            } else if (flush !== Z_BLOCK) {
              trees._tr_stored_block(s, 0, 0, false);
              if (flush === Z_FULL_FLUSH) {
                zero(s.head);
                if (s.lookahead === 0) {
                  s.strstart = 0;
                  s.block_start = 0;
                  s.insert = 0;
                }
              }
            }
            flush_pending(strm);
            if (strm.avail_out === 0) {
              s.last_flush = -1;
              return Z_OK;
            }
          }
        }
        if (flush !== Z_FINISH) {
          return Z_OK;
        }
        if (s.wrap <= 0) {
          return Z_STREAM_END;
        }
        if (s.wrap === 2) {
          put_byte(s, strm.adler & 255);
          put_byte(s, strm.adler >> 8 & 255);
          put_byte(s, strm.adler >> 16 & 255);
          put_byte(s, strm.adler >> 24 & 255);
          put_byte(s, strm.total_in & 255);
          put_byte(s, strm.total_in >> 8 & 255);
          put_byte(s, strm.total_in >> 16 & 255);
          put_byte(s, strm.total_in >> 24 & 255);
        } else {
          putShortMSB(s, strm.adler >>> 16);
          putShortMSB(s, strm.adler & 65535);
        }
        flush_pending(strm);
        if (s.wrap > 0) {
          s.wrap = -s.wrap;
        }
        return s.pending !== 0 ? Z_OK : Z_STREAM_END;
      }
      function deflateEnd(strm) {
        var status;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        status = strm.state.status;
        if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) {
          return err(strm, Z_STREAM_ERROR);
        }
        strm.state = null;
        return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
      }
      function deflateSetDictionary(strm, dictionary) {
        var dictLength = dictionary.length;
        var s;
        var str, n;
        var wrap;
        var avail;
        var next;
        var input;
        var tmpDict;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        s = strm.state;
        wrap = s.wrap;
        if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
          return Z_STREAM_ERROR;
        }
        if (wrap === 1) {
          strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
        }
        s.wrap = 0;
        if (dictLength >= s.w_size) {
          if (wrap === 0) {
            zero(s.head);
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
          tmpDict = new utils.Buf8(s.w_size);
          utils.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0);
          dictionary = tmpDict;
          dictLength = s.w_size;
        }
        avail = strm.avail_in;
        next = strm.next_in;
        input = strm.input;
        strm.avail_in = dictLength;
        strm.next_in = 0;
        strm.input = dictionary;
        fill_window(s);
        while (s.lookahead >= MIN_MATCH) {
          str = s.strstart;
          n = s.lookahead - (MIN_MATCH - 1);
          do {
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
            s.prev[str & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = str;
            str++;
          } while (--n);
          s.strstart = str;
          s.lookahead = MIN_MATCH - 1;
          fill_window(s);
        }
        s.strstart += s.lookahead;
        s.block_start = s.strstart;
        s.insert = s.lookahead;
        s.lookahead = 0;
        s.match_length = s.prev_length = MIN_MATCH - 1;
        s.match_available = 0;
        strm.next_in = next;
        strm.input = input;
        strm.avail_in = avail;
        s.wrap = wrap;
        return Z_OK;
      }
      exports.deflateInit = deflateInit;
      exports.deflateInit2 = deflateInit2;
      exports.deflateReset = deflateReset;
      exports.deflateResetKeep = deflateResetKeep;
      exports.deflateSetHeader = deflateSetHeader;
      exports.deflate = deflate;
      exports.deflateEnd = deflateEnd;
      exports.deflateSetDictionary = deflateSetDictionary;
      exports.deflateInfo = "pako deflate (from Nodeca project)";
    }
  });

  // node_modules/pako/lib/utils/strings.js
  var require_strings = __commonJS({
    "node_modules/pako/lib/utils/strings.js"(exports) {
      "use strict";
      var utils = require_common();
      var STR_APPLY_OK = true;
      var STR_APPLY_UIA_OK = true;
      try {
        String.fromCharCode.apply(null, [0]);
      } catch (__) {
        STR_APPLY_OK = false;
      }
      try {
        String.fromCharCode.apply(null, new Uint8Array(1));
      } catch (__) {
        STR_APPLY_UIA_OK = false;
      }
      var _utf8len = new utils.Buf8(256);
      for (q = 0; q < 256; q++) {
        _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
      }
      var q;
      _utf8len[254] = _utf8len[254] = 1;
      exports.string2buf = function(str) {
        var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
        for (m_pos = 0; m_pos < str_len; m_pos++) {
          c = str.charCodeAt(m_pos);
          if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
            c2 = str.charCodeAt(m_pos + 1);
            if ((c2 & 64512) === 56320) {
              c = 65536 + (c - 55296 << 10) + (c2 - 56320);
              m_pos++;
            }
          }
          buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
        }
        buf = new utils.Buf8(buf_len);
        for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
          c = str.charCodeAt(m_pos);
          if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
            c2 = str.charCodeAt(m_pos + 1);
            if ((c2 & 64512) === 56320) {
              c = 65536 + (c - 55296 << 10) + (c2 - 56320);
              m_pos++;
            }
          }
          if (c < 128) {
            buf[i++] = c;
          } else if (c < 2048) {
            buf[i++] = 192 | c >>> 6;
            buf[i++] = 128 | c & 63;
          } else if (c < 65536) {
            buf[i++] = 224 | c >>> 12;
            buf[i++] = 128 | c >>> 6 & 63;
            buf[i++] = 128 | c & 63;
          } else {
            buf[i++] = 240 | c >>> 18;
            buf[i++] = 128 | c >>> 12 & 63;
            buf[i++] = 128 | c >>> 6 & 63;
            buf[i++] = 128 | c & 63;
          }
        }
        return buf;
      };
      function buf2binstring(buf, len) {
        if (len < 65534) {
          if (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray && STR_APPLY_OK) {
            return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
          }
        }
        var result = "";
        for (var i = 0; i < len; i++) {
          result += String.fromCharCode(buf[i]);
        }
        return result;
      }
      exports.buf2binstring = function(buf) {
        return buf2binstring(buf, buf.length);
      };
      exports.binstring2buf = function(str) {
        var buf = new utils.Buf8(str.length);
        for (var i = 0, len = buf.length; i < len; i++) {
          buf[i] = str.charCodeAt(i);
        }
        return buf;
      };
      exports.buf2string = function(buf, max) {
        var i, out, c, c_len;
        var len = max || buf.length;
        var utf16buf = new Array(len * 2);
        for (out = 0, i = 0; i < len; ) {
          c = buf[i++];
          if (c < 128) {
            utf16buf[out++] = c;
            continue;
          }
          c_len = _utf8len[c];
          if (c_len > 4) {
            utf16buf[out++] = 65533;
            i += c_len - 1;
            continue;
          }
          c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
          while (c_len > 1 && i < len) {
            c = c << 6 | buf[i++] & 63;
            c_len--;
          }
          if (c_len > 1) {
            utf16buf[out++] = 65533;
            continue;
          }
          if (c < 65536) {
            utf16buf[out++] = c;
          } else {
            c -= 65536;
            utf16buf[out++] = 55296 | c >> 10 & 1023;
            utf16buf[out++] = 56320 | c & 1023;
          }
        }
        return buf2binstring(utf16buf, out);
      };
      exports.utf8border = function(buf, max) {
        var pos;
        max = max || buf.length;
        if (max > buf.length) {
          max = buf.length;
        }
        pos = max - 1;
        while (pos >= 0 && (buf[pos] & 192) === 128) {
          pos--;
        }
        if (pos < 0) {
          return max;
        }
        if (pos === 0) {
          return max;
        }
        return pos + _utf8len[buf[pos]] > max ? pos : max;
      };
    }
  });

  // node_modules/pako/lib/zlib/zstream.js
  var require_zstream = __commonJS({
    "node_modules/pako/lib/zlib/zstream.js"(exports, module) {
      "use strict";
      function ZStream() {
        this.input = null;
        this.next_in = 0;
        this.avail_in = 0;
        this.total_in = 0;
        this.output = null;
        this.next_out = 0;
        this.avail_out = 0;
        this.total_out = 0;
        this.msg = "";
        this.state = null;
        this.data_type = 2;
        this.adler = 0;
      }
      module.exports = ZStream;
    }
  });

  // node_modules/pako/lib/deflate.js
  var require_deflate2 = __commonJS({
    "node_modules/pako/lib/deflate.js"(exports) {
      "use strict";
      var zlib_deflate = require_deflate();
      var utils = require_common();
      var strings = require_strings();
      var msg = require_messages();
      var ZStream = require_zstream();
      var toString = Object.prototype.toString;
      var Z_NO_FLUSH = 0;
      var Z_FINISH = 4;
      var Z_OK = 0;
      var Z_STREAM_END = 1;
      var Z_SYNC_FLUSH = 2;
      var Z_DEFAULT_COMPRESSION = -1;
      var Z_DEFAULT_STRATEGY = 0;
      var Z_DEFLATED = 8;
      function Deflate(options) {
        if (!(this instanceof Deflate)) return new Deflate(options);
        this.options = utils.assign({
          level: Z_DEFAULT_COMPRESSION,
          method: Z_DEFLATED,
          chunkSize: 16384,
          windowBits: 15,
          memLevel: 8,
          strategy: Z_DEFAULT_STRATEGY,
          to: ""
        }, options || {});
        var opt = this.options;
        if (opt.raw && opt.windowBits > 0) {
          opt.windowBits = -opt.windowBits;
        } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
          opt.windowBits += 16;
        }
        this.err = 0;
        this.msg = "";
        this.ended = false;
        this.chunks = [];
        this.strm = new ZStream();
        this.strm.avail_out = 0;
        var status = zlib_deflate.deflateInit2(
          this.strm,
          opt.level,
          opt.method,
          opt.windowBits,
          opt.memLevel,
          opt.strategy
        );
        if (status !== Z_OK) {
          throw new Error(msg[status]);
        }
        if (opt.header) {
          zlib_deflate.deflateSetHeader(this.strm, opt.header);
        }
        if (opt.dictionary) {
          var dict;
          if (typeof opt.dictionary === "string") {
            dict = strings.string2buf(opt.dictionary);
          } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
            dict = new Uint8Array(opt.dictionary);
          } else {
            dict = opt.dictionary;
          }
          status = zlib_deflate.deflateSetDictionary(this.strm, dict);
          if (status !== Z_OK) {
            throw new Error(msg[status]);
          }
          this._dict_set = true;
        }
      }
      Deflate.prototype.push = function(data, mode) {
        var strm = this.strm;
        var chunkSize = this.options.chunkSize;
        var status, _mode;
        if (this.ended) {
          return false;
        }
        _mode = mode === ~~mode ? mode : mode === true ? Z_FINISH : Z_NO_FLUSH;
        if (typeof data === "string") {
          strm.input = strings.string2buf(data);
        } else if (toString.call(data) === "[object ArrayBuffer]") {
          strm.input = new Uint8Array(data);
        } else {
          strm.input = data;
        }
        strm.next_in = 0;
        strm.avail_in = strm.input.length;
        do {
          if (strm.avail_out === 0) {
            strm.output = new utils.Buf8(chunkSize);
            strm.next_out = 0;
            strm.avail_out = chunkSize;
          }
          status = zlib_deflate.deflate(strm, _mode);
          if (status !== Z_STREAM_END && status !== Z_OK) {
            this.onEnd(status);
            this.ended = true;
            return false;
          }
          if (strm.avail_out === 0 || strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH)) {
            if (this.options.to === "string") {
              this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
            } else {
              this.onData(utils.shrinkBuf(strm.output, strm.next_out));
            }
          }
        } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);
        if (_mode === Z_FINISH) {
          status = zlib_deflate.deflateEnd(this.strm);
          this.onEnd(status);
          this.ended = true;
          return status === Z_OK;
        }
        if (_mode === Z_SYNC_FLUSH) {
          this.onEnd(Z_OK);
          strm.avail_out = 0;
          return true;
        }
        return true;
      };
      Deflate.prototype.onData = function(chunk) {
        this.chunks.push(chunk);
      };
      Deflate.prototype.onEnd = function(status) {
        if (status === Z_OK) {
          if (this.options.to === "string") {
            this.result = this.chunks.join("");
          } else {
            this.result = utils.flattenChunks(this.chunks);
          }
        }
        this.chunks = [];
        this.err = status;
        this.msg = this.strm.msg;
      };
      function deflate(input, options) {
        var deflator = new Deflate(options);
        deflator.push(input, true);
        if (deflator.err) {
          throw deflator.msg || msg[deflator.err];
        }
        return deflator.result;
      }
      function deflateRaw(input, options) {
        options = options || {};
        options.raw = true;
        return deflate(input, options);
      }
      function gzip(input, options) {
        options = options || {};
        options.gzip = true;
        return deflate(input, options);
      }
      exports.Deflate = Deflate;
      exports.deflate = deflate;
      exports.deflateRaw = deflateRaw;
      exports.gzip = gzip;
    }
  });

  // node_modules/pako/lib/zlib/inffast.js
  var require_inffast = __commonJS({
    "node_modules/pako/lib/zlib/inffast.js"(exports, module) {
      "use strict";
      var BAD = 30;
      var TYPE = 12;
      module.exports = function inflate_fast(strm, start) {
        var state;
        var _in;
        var last;
        var _out;
        var beg;
        var end;
        var dmax;
        var wsize;
        var whave;
        var wnext;
        var s_window;
        var hold;
        var bits;
        var lcode;
        var dcode;
        var lmask;
        var dmask;
        var here;
        var op;
        var len;
        var dist;
        var from;
        var from_source;
        var input, output;
        state = strm.state;
        _in = strm.next_in;
        input = strm.input;
        last = _in + (strm.avail_in - 5);
        _out = strm.next_out;
        output = strm.output;
        beg = _out - (start - strm.avail_out);
        end = _out + (strm.avail_out - 257);
        dmax = state.dmax;
        wsize = state.wsize;
        whave = state.whave;
        wnext = state.wnext;
        s_window = state.window;
        hold = state.hold;
        bits = state.bits;
        lcode = state.lencode;
        dcode = state.distcode;
        lmask = (1 << state.lenbits) - 1;
        dmask = (1 << state.distbits) - 1;
        top:
          do {
            if (bits < 15) {
              hold += input[_in++] << bits;
              bits += 8;
              hold += input[_in++] << bits;
              bits += 8;
            }
            here = lcode[hold & lmask];
            dolen:
              for (; ; ) {
                op = here >>> 24;
                hold >>>= op;
                bits -= op;
                op = here >>> 16 & 255;
                if (op === 0) {
                  output[_out++] = here & 65535;
                } else if (op & 16) {
                  len = here & 65535;
                  op &= 15;
                  if (op) {
                    if (bits < op) {
                      hold += input[_in++] << bits;
                      bits += 8;
                    }
                    len += hold & (1 << op) - 1;
                    hold >>>= op;
                    bits -= op;
                  }
                  if (bits < 15) {
                    hold += input[_in++] << bits;
                    bits += 8;
                    hold += input[_in++] << bits;
                    bits += 8;
                  }
                  here = dcode[hold & dmask];
                  dodist:
                    for (; ; ) {
                      op = here >>> 24;
                      hold >>>= op;
                      bits -= op;
                      op = here >>> 16 & 255;
                      if (op & 16) {
                        dist = here & 65535;
                        op &= 15;
                        if (bits < op) {
                          hold += input[_in++] << bits;
                          bits += 8;
                          if (bits < op) {
                            hold += input[_in++] << bits;
                            bits += 8;
                          }
                        }
                        dist += hold & (1 << op) - 1;
                        if (dist > dmax) {
                          strm.msg = "invalid distance too far back";
                          state.mode = BAD;
                          break top;
                        }
                        hold >>>= op;
                        bits -= op;
                        op = _out - beg;
                        if (dist > op) {
                          op = dist - op;
                          if (op > whave) {
                            if (state.sane) {
                              strm.msg = "invalid distance too far back";
                              state.mode = BAD;
                              break top;
                            }
                          }
                          from = 0;
                          from_source = s_window;
                          if (wnext === 0) {
                            from += wsize - op;
                            if (op < len) {
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = _out - dist;
                              from_source = output;
                            }
                          } else if (wnext < op) {
                            from += wsize + wnext - op;
                            op -= wnext;
                            if (op < len) {
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = 0;
                              if (wnext < len) {
                                op = wnext;
                                len -= op;
                                do {
                                  output[_out++] = s_window[from++];
                                } while (--op);
                                from = _out - dist;
                                from_source = output;
                              }
                            }
                          } else {
                            from += wnext - op;
                            if (op < len) {
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = _out - dist;
                              from_source = output;
                            }
                          }
                          while (len > 2) {
                            output[_out++] = from_source[from++];
                            output[_out++] = from_source[from++];
                            output[_out++] = from_source[from++];
                            len -= 3;
                          }
                          if (len) {
                            output[_out++] = from_source[from++];
                            if (len > 1) {
                              output[_out++] = from_source[from++];
                            }
                          }
                        } else {
                          from = _out - dist;
                          do {
                            output[_out++] = output[from++];
                            output[_out++] = output[from++];
                            output[_out++] = output[from++];
                            len -= 3;
                          } while (len > 2);
                          if (len) {
                            output[_out++] = output[from++];
                            if (len > 1) {
                              output[_out++] = output[from++];
                            }
                          }
                        }
                      } else if ((op & 64) === 0) {
                        here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                        continue dodist;
                      } else {
                        strm.msg = "invalid distance code";
                        state.mode = BAD;
                        break top;
                      }
                      break;
                    }
                } else if ((op & 64) === 0) {
                  here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
                  continue dolen;
                } else if (op & 32) {
                  state.mode = TYPE;
                  break top;
                } else {
                  strm.msg = "invalid literal/length code";
                  state.mode = BAD;
                  break top;
                }
                break;
              }
          } while (_in < last && _out < end);
        len = bits >> 3;
        _in -= len;
        bits -= len << 3;
        hold &= (1 << bits) - 1;
        strm.next_in = _in;
        strm.next_out = _out;
        strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
        strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
        state.hold = hold;
        state.bits = bits;
        return;
      };
    }
  });

  // node_modules/pako/lib/zlib/inftrees.js
  var require_inftrees = __commonJS({
    "node_modules/pako/lib/zlib/inftrees.js"(exports, module) {
      "use strict";
      var utils = require_common();
      var MAXBITS = 15;
      var ENOUGH_LENS = 852;
      var ENOUGH_DISTS = 592;
      var CODES = 0;
      var LENS = 1;
      var DISTS = 2;
      var lbase = [
        /* Length codes 257..285 base */
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        13,
        15,
        17,
        19,
        23,
        27,
        31,
        35,
        43,
        51,
        59,
        67,
        83,
        99,
        115,
        131,
        163,
        195,
        227,
        258,
        0,
        0
      ];
      var lext = [
        /* Length codes 257..285 extra */
        16,
        16,
        16,
        16,
        16,
        16,
        16,
        16,
        17,
        17,
        17,
        17,
        18,
        18,
        18,
        18,
        19,
        19,
        19,
        19,
        20,
        20,
        20,
        20,
        21,
        21,
        21,
        21,
        16,
        72,
        78
      ];
      var dbase = [
        /* Distance codes 0..29 base */
        1,
        2,
        3,
        4,
        5,
        7,
        9,
        13,
        17,
        25,
        33,
        49,
        65,
        97,
        129,
        193,
        257,
        385,
        513,
        769,
        1025,
        1537,
        2049,
        3073,
        4097,
        6145,
        8193,
        12289,
        16385,
        24577,
        0,
        0
      ];
      var dext = [
        /* Distance codes 0..29 extra */
        16,
        16,
        16,
        16,
        17,
        17,
        18,
        18,
        19,
        19,
        20,
        20,
        21,
        21,
        22,
        22,
        23,
        23,
        24,
        24,
        25,
        25,
        26,
        26,
        27,
        27,
        28,
        28,
        29,
        29,
        64,
        64
      ];
      module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
        var bits = opts.bits;
        var len = 0;
        var sym = 0;
        var min = 0, max = 0;
        var root = 0;
        var curr = 0;
        var drop = 0;
        var left = 0;
        var used = 0;
        var huff = 0;
        var incr;
        var fill;
        var low;
        var mask;
        var next;
        var base = null;
        var base_index = 0;
        var end;
        var count = new utils.Buf16(MAXBITS + 1);
        var offs = new utils.Buf16(MAXBITS + 1);
        var extra = null;
        var extra_index = 0;
        var here_bits, here_op, here_val;
        for (len = 0; len <= MAXBITS; len++) {
          count[len] = 0;
        }
        for (sym = 0; sym < codes; sym++) {
          count[lens[lens_index + sym]]++;
        }
        root = bits;
        for (max = MAXBITS; max >= 1; max--) {
          if (count[max] !== 0) {
            break;
          }
        }
        if (root > max) {
          root = max;
        }
        if (max === 0) {
          table[table_index++] = 1 << 24 | 64 << 16 | 0;
          table[table_index++] = 1 << 24 | 64 << 16 | 0;
          opts.bits = 1;
          return 0;
        }
        for (min = 1; min < max; min++) {
          if (count[min] !== 0) {
            break;
          }
        }
        if (root < min) {
          root = min;
        }
        left = 1;
        for (len = 1; len <= MAXBITS; len++) {
          left <<= 1;
          left -= count[len];
          if (left < 0) {
            return -1;
          }
        }
        if (left > 0 && (type === CODES || max !== 1)) {
          return -1;
        }
        offs[1] = 0;
        for (len = 1; len < MAXBITS; len++) {
          offs[len + 1] = offs[len] + count[len];
        }
        for (sym = 0; sym < codes; sym++) {
          if (lens[lens_index + sym] !== 0) {
            work[offs[lens[lens_index + sym]]++] = sym;
          }
        }
        if (type === CODES) {
          base = extra = work;
          end = 19;
        } else if (type === LENS) {
          base = lbase;
          base_index -= 257;
          extra = lext;
          extra_index -= 257;
          end = 256;
        } else {
          base = dbase;
          extra = dext;
          end = -1;
        }
        huff = 0;
        sym = 0;
        len = min;
        next = table_index;
        curr = root;
        drop = 0;
        low = -1;
        used = 1 << root;
        mask = used - 1;
        if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
          return 1;
        }
        for (; ; ) {
          here_bits = len - drop;
          if (work[sym] < end) {
            here_op = 0;
            here_val = work[sym];
          } else if (work[sym] > end) {
            here_op = extra[extra_index + work[sym]];
            here_val = base[base_index + work[sym]];
          } else {
            here_op = 32 + 64;
            here_val = 0;
          }
          incr = 1 << len - drop;
          fill = 1 << curr;
          min = fill;
          do {
            fill -= incr;
            table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
          } while (fill !== 0);
          incr = 1 << len - 1;
          while (huff & incr) {
            incr >>= 1;
          }
          if (incr !== 0) {
            huff &= incr - 1;
            huff += incr;
          } else {
            huff = 0;
          }
          sym++;
          if (--count[len] === 0) {
            if (len === max) {
              break;
            }
            len = lens[lens_index + work[sym]];
          }
          if (len > root && (huff & mask) !== low) {
            if (drop === 0) {
              drop = root;
            }
            next += min;
            curr = len - drop;
            left = 1 << curr;
            while (curr + drop < max) {
              left -= count[curr + drop];
              if (left <= 0) {
                break;
              }
              curr++;
              left <<= 1;
            }
            used += 1 << curr;
            if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
              return 1;
            }
            low = huff & mask;
            table[low] = root << 24 | curr << 16 | next - table_index | 0;
          }
        }
        if (huff !== 0) {
          table[next + huff] = len - drop << 24 | 64 << 16 | 0;
        }
        opts.bits = root;
        return 0;
      };
    }
  });

  // node_modules/pako/lib/zlib/inflate.js
  var require_inflate = __commonJS({
    "node_modules/pako/lib/zlib/inflate.js"(exports) {
      "use strict";
      var utils = require_common();
      var adler32 = require_adler32();
      var crc32 = require_crc32();
      var inflate_fast = require_inffast();
      var inflate_table = require_inftrees();
      var CODES = 0;
      var LENS = 1;
      var DISTS = 2;
      var Z_FINISH = 4;
      var Z_BLOCK = 5;
      var Z_TREES = 6;
      var Z_OK = 0;
      var Z_STREAM_END = 1;
      var Z_NEED_DICT = 2;
      var Z_STREAM_ERROR = -2;
      var Z_DATA_ERROR = -3;
      var Z_MEM_ERROR = -4;
      var Z_BUF_ERROR = -5;
      var Z_DEFLATED = 8;
      var HEAD = 1;
      var FLAGS = 2;
      var TIME = 3;
      var OS = 4;
      var EXLEN = 5;
      var EXTRA = 6;
      var NAME = 7;
      var COMMENT = 8;
      var HCRC = 9;
      var DICTID = 10;
      var DICT = 11;
      var TYPE = 12;
      var TYPEDO = 13;
      var STORED = 14;
      var COPY_ = 15;
      var COPY = 16;
      var TABLE = 17;
      var LENLENS = 18;
      var CODELENS = 19;
      var LEN_ = 20;
      var LEN = 21;
      var LENEXT = 22;
      var DIST = 23;
      var DISTEXT = 24;
      var MATCH = 25;
      var LIT = 26;
      var CHECK = 27;
      var LENGTH = 28;
      var DONE = 29;
      var BAD = 30;
      var MEM = 31;
      var SYNC = 32;
      var ENOUGH_LENS = 852;
      var ENOUGH_DISTS = 592;
      var MAX_WBITS = 15;
      var DEF_WBITS = MAX_WBITS;
      function zswap32(q) {
        return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
      }
      function InflateState() {
        this.mode = 0;
        this.last = false;
        this.wrap = 0;
        this.havedict = false;
        this.flags = 0;
        this.dmax = 0;
        this.check = 0;
        this.total = 0;
        this.head = null;
        this.wbits = 0;
        this.wsize = 0;
        this.whave = 0;
        this.wnext = 0;
        this.window = null;
        this.hold = 0;
        this.bits = 0;
        this.length = 0;
        this.offset = 0;
        this.extra = 0;
        this.lencode = null;
        this.distcode = null;
        this.lenbits = 0;
        this.distbits = 0;
        this.ncode = 0;
        this.nlen = 0;
        this.ndist = 0;
        this.have = 0;
        this.next = null;
        this.lens = new utils.Buf16(320);
        this.work = new utils.Buf16(288);
        this.lendyn = null;
        this.distdyn = null;
        this.sane = 0;
        this.back = 0;
        this.was = 0;
      }
      function inflateResetKeep(strm) {
        var state;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        strm.total_in = strm.total_out = state.total = 0;
        strm.msg = "";
        if (state.wrap) {
          strm.adler = state.wrap & 1;
        }
        state.mode = HEAD;
        state.last = 0;
        state.havedict = 0;
        state.dmax = 32768;
        state.head = null;
        state.hold = 0;
        state.bits = 0;
        state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
        state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);
        state.sane = 1;
        state.back = -1;
        return Z_OK;
      }
      function inflateReset(strm) {
        var state;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        state.wsize = 0;
        state.whave = 0;
        state.wnext = 0;
        return inflateResetKeep(strm);
      }
      function inflateReset2(strm, windowBits) {
        var wrap;
        var state;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        if (windowBits < 0) {
          wrap = 0;
          windowBits = -windowBits;
        } else {
          wrap = (windowBits >> 4) + 1;
          if (windowBits < 48) {
            windowBits &= 15;
          }
        }
        if (windowBits && (windowBits < 8 || windowBits > 15)) {
          return Z_STREAM_ERROR;
        }
        if (state.window !== null && state.wbits !== windowBits) {
          state.window = null;
        }
        state.wrap = wrap;
        state.wbits = windowBits;
        return inflateReset(strm);
      }
      function inflateInit2(strm, windowBits) {
        var ret;
        var state;
        if (!strm) {
          return Z_STREAM_ERROR;
        }
        state = new InflateState();
        strm.state = state;
        state.window = null;
        ret = inflateReset2(strm, windowBits);
        if (ret !== Z_OK) {
          strm.state = null;
        }
        return ret;
      }
      function inflateInit(strm) {
        return inflateInit2(strm, DEF_WBITS);
      }
      var virgin = true;
      var lenfix;
      var distfix;
      function fixedtables(state) {
        if (virgin) {
          var sym;
          lenfix = new utils.Buf32(512);
          distfix = new utils.Buf32(32);
          sym = 0;
          while (sym < 144) {
            state.lens[sym++] = 8;
          }
          while (sym < 256) {
            state.lens[sym++] = 9;
          }
          while (sym < 280) {
            state.lens[sym++] = 7;
          }
          while (sym < 288) {
            state.lens[sym++] = 8;
          }
          inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
          sym = 0;
          while (sym < 32) {
            state.lens[sym++] = 5;
          }
          inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
          virgin = false;
        }
        state.lencode = lenfix;
        state.lenbits = 9;
        state.distcode = distfix;
        state.distbits = 5;
      }
      function updatewindow(strm, src, end, copy) {
        var dist;
        var state = strm.state;
        if (state.window === null) {
          state.wsize = 1 << state.wbits;
          state.wnext = 0;
          state.whave = 0;
          state.window = new utils.Buf8(state.wsize);
        }
        if (copy >= state.wsize) {
          utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
          state.wnext = 0;
          state.whave = state.wsize;
        } else {
          dist = state.wsize - state.wnext;
          if (dist > copy) {
            dist = copy;
          }
          utils.arraySet(state.window, src, end - copy, dist, state.wnext);
          copy -= dist;
          if (copy) {
            utils.arraySet(state.window, src, end - copy, copy, 0);
            state.wnext = copy;
            state.whave = state.wsize;
          } else {
            state.wnext += dist;
            if (state.wnext === state.wsize) {
              state.wnext = 0;
            }
            if (state.whave < state.wsize) {
              state.whave += dist;
            }
          }
        }
        return 0;
      }
      function inflate(strm, flush) {
        var state;
        var input, output;
        var next;
        var put;
        var have, left;
        var hold;
        var bits;
        var _in, _out;
        var copy;
        var from;
        var from_source;
        var here = 0;
        var here_bits, here_op, here_val;
        var last_bits, last_op, last_val;
        var len;
        var ret;
        var hbuf = new utils.Buf8(4);
        var opts;
        var n;
        var order = (
          /* permutation of code lengths */
          [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
        );
        if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        if (state.mode === TYPE) {
          state.mode = TYPEDO;
        }
        put = strm.next_out;
        output = strm.output;
        left = strm.avail_out;
        next = strm.next_in;
        input = strm.input;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        _in = have;
        _out = left;
        ret = Z_OK;
        inf_leave:
          for (; ; ) {
            switch (state.mode) {
              case HEAD:
                if (state.wrap === 0) {
                  state.mode = TYPEDO;
                  break;
                }
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (state.wrap & 2 && hold === 35615) {
                  state.check = 0;
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc32(state.check, hbuf, 2, 0);
                  hold = 0;
                  bits = 0;
                  state.mode = FLAGS;
                  break;
                }
                state.flags = 0;
                if (state.head) {
                  state.head.done = false;
                }
                if (!(state.wrap & 1) || /* check if zlib header allowed */
                (((hold & 255) << 8) + (hold >> 8)) % 31) {
                  strm.msg = "incorrect header check";
                  state.mode = BAD;
                  break;
                }
                if ((hold & 15) !== Z_DEFLATED) {
                  strm.msg = "unknown compression method";
                  state.mode = BAD;
                  break;
                }
                hold >>>= 4;
                bits -= 4;
                len = (hold & 15) + 8;
                if (state.wbits === 0) {
                  state.wbits = len;
                } else if (len > state.wbits) {
                  strm.msg = "invalid window size";
                  state.mode = BAD;
                  break;
                }
                state.dmax = 1 << len;
                strm.adler = state.check = 1;
                state.mode = hold & 512 ? DICTID : TYPE;
                hold = 0;
                bits = 0;
                break;
              case FLAGS:
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.flags = hold;
                if ((state.flags & 255) !== Z_DEFLATED) {
                  strm.msg = "unknown compression method";
                  state.mode = BAD;
                  break;
                }
                if (state.flags & 57344) {
                  strm.msg = "unknown header flags set";
                  state.mode = BAD;
                  break;
                }
                if (state.head) {
                  state.head.text = hold >> 8 & 1;
                }
                if (state.flags & 512) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc32(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
                state.mode = TIME;
              /* falls through */
              case TIME:
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (state.head) {
                  state.head.time = hold;
                }
                if (state.flags & 512) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  hbuf[2] = hold >>> 16 & 255;
                  hbuf[3] = hold >>> 24 & 255;
                  state.check = crc32(state.check, hbuf, 4, 0);
                }
                hold = 0;
                bits = 0;
                state.mode = OS;
              /* falls through */
              case OS:
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (state.head) {
                  state.head.xflags = hold & 255;
                  state.head.os = hold >> 8;
                }
                if (state.flags & 512) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc32(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
                state.mode = EXLEN;
              /* falls through */
              case EXLEN:
                if (state.flags & 1024) {
                  while (bits < 16) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.length = hold;
                  if (state.head) {
                    state.head.extra_len = hold;
                  }
                  if (state.flags & 512) {
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc32(state.check, hbuf, 2, 0);
                  }
                  hold = 0;
                  bits = 0;
                } else if (state.head) {
                  state.head.extra = null;
                }
                state.mode = EXTRA;
              /* falls through */
              case EXTRA:
                if (state.flags & 1024) {
                  copy = state.length;
                  if (copy > have) {
                    copy = have;
                  }
                  if (copy) {
                    if (state.head) {
                      len = state.head.extra_len - state.length;
                      if (!state.head.extra) {
                        state.head.extra = new Array(state.head.extra_len);
                      }
                      utils.arraySet(
                        state.head.extra,
                        input,
                        next,
                        // extra field is limited to 65536 bytes
                        // - no need for additional size check
                        copy,
                        /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                        len
                      );
                    }
                    if (state.flags & 512) {
                      state.check = crc32(state.check, input, copy, next);
                    }
                    have -= copy;
                    next += copy;
                    state.length -= copy;
                  }
                  if (state.length) {
                    break inf_leave;
                  }
                }
                state.length = 0;
                state.mode = NAME;
              /* falls through */
              case NAME:
                if (state.flags & 2048) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  copy = 0;
                  do {
                    len = input[next + copy++];
                    if (state.head && len && state.length < 65536) {
                      state.head.name += String.fromCharCode(len);
                    }
                  } while (len && copy < have);
                  if (state.flags & 512) {
                    state.check = crc32(state.check, input, copy, next);
                  }
                  have -= copy;
                  next += copy;
                  if (len) {
                    break inf_leave;
                  }
                } else if (state.head) {
                  state.head.name = null;
                }
                state.length = 0;
                state.mode = COMMENT;
              /* falls through */
              case COMMENT:
                if (state.flags & 4096) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  copy = 0;
                  do {
                    len = input[next + copy++];
                    if (state.head && len && state.length < 65536) {
                      state.head.comment += String.fromCharCode(len);
                    }
                  } while (len && copy < have);
                  if (state.flags & 512) {
                    state.check = crc32(state.check, input, copy, next);
                  }
                  have -= copy;
                  next += copy;
                  if (len) {
                    break inf_leave;
                  }
                } else if (state.head) {
                  state.head.comment = null;
                }
                state.mode = HCRC;
              /* falls through */
              case HCRC:
                if (state.flags & 512) {
                  while (bits < 16) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (hold !== (state.check & 65535)) {
                    strm.msg = "header crc mismatch";
                    state.mode = BAD;
                    break;
                  }
                  hold = 0;
                  bits = 0;
                }
                if (state.head) {
                  state.head.hcrc = state.flags >> 9 & 1;
                  state.head.done = true;
                }
                strm.adler = state.check = 0;
                state.mode = TYPE;
                break;
              case DICTID:
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                strm.adler = state.check = zswap32(hold);
                hold = 0;
                bits = 0;
                state.mode = DICT;
              /* falls through */
              case DICT:
                if (state.havedict === 0) {
                  strm.next_out = put;
                  strm.avail_out = left;
                  strm.next_in = next;
                  strm.avail_in = have;
                  state.hold = hold;
                  state.bits = bits;
                  return Z_NEED_DICT;
                }
                strm.adler = state.check = 1;
                state.mode = TYPE;
              /* falls through */
              case TYPE:
                if (flush === Z_BLOCK || flush === Z_TREES) {
                  break inf_leave;
                }
              /* falls through */
              case TYPEDO:
                if (state.last) {
                  hold >>>= bits & 7;
                  bits -= bits & 7;
                  state.mode = CHECK;
                  break;
                }
                while (bits < 3) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.last = hold & 1;
                hold >>>= 1;
                bits -= 1;
                switch (hold & 3) {
                  case 0:
                    state.mode = STORED;
                    break;
                  case 1:
                    fixedtables(state);
                    state.mode = LEN_;
                    if (flush === Z_TREES) {
                      hold >>>= 2;
                      bits -= 2;
                      break inf_leave;
                    }
                    break;
                  case 2:
                    state.mode = TABLE;
                    break;
                  case 3:
                    strm.msg = "invalid block type";
                    state.mode = BAD;
                }
                hold >>>= 2;
                bits -= 2;
                break;
              case STORED:
                hold >>>= bits & 7;
                bits -= bits & 7;
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
                  strm.msg = "invalid stored block lengths";
                  state.mode = BAD;
                  break;
                }
                state.length = hold & 65535;
                hold = 0;
                bits = 0;
                state.mode = COPY_;
                if (flush === Z_TREES) {
                  break inf_leave;
                }
              /* falls through */
              case COPY_:
                state.mode = COPY;
              /* falls through */
              case COPY:
                copy = state.length;
                if (copy) {
                  if (copy > have) {
                    copy = have;
                  }
                  if (copy > left) {
                    copy = left;
                  }
                  if (copy === 0) {
                    break inf_leave;
                  }
                  utils.arraySet(output, input, next, copy, put);
                  have -= copy;
                  next += copy;
                  left -= copy;
                  put += copy;
                  state.length -= copy;
                  break;
                }
                state.mode = TYPE;
                break;
              case TABLE:
                while (bits < 14) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.nlen = (hold & 31) + 257;
                hold >>>= 5;
                bits -= 5;
                state.ndist = (hold & 31) + 1;
                hold >>>= 5;
                bits -= 5;
                state.ncode = (hold & 15) + 4;
                hold >>>= 4;
                bits -= 4;
                if (state.nlen > 286 || state.ndist > 30) {
                  strm.msg = "too many length or distance symbols";
                  state.mode = BAD;
                  break;
                }
                state.have = 0;
                state.mode = LENLENS;
              /* falls through */
              case LENLENS:
                while (state.have < state.ncode) {
                  while (bits < 3) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.lens[order[state.have++]] = hold & 7;
                  hold >>>= 3;
                  bits -= 3;
                }
                while (state.have < 19) {
                  state.lens[order[state.have++]] = 0;
                }
                state.lencode = state.lendyn;
                state.lenbits = 7;
                opts = { bits: state.lenbits };
                ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
                state.lenbits = opts.bits;
                if (ret) {
                  strm.msg = "invalid code lengths set";
                  state.mode = BAD;
                  break;
                }
                state.have = 0;
                state.mode = CODELENS;
              /* falls through */
              case CODELENS:
                while (state.have < state.nlen + state.ndist) {
                  for (; ; ) {
                    here = state.lencode[hold & (1 << state.lenbits) - 1];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (here_val < 16) {
                    hold >>>= here_bits;
                    bits -= here_bits;
                    state.lens[state.have++] = here_val;
                  } else {
                    if (here_val === 16) {
                      n = here_bits + 2;
                      while (bits < n) {
                        if (have === 0) {
                          break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                      }
                      hold >>>= here_bits;
                      bits -= here_bits;
                      if (state.have === 0) {
                        strm.msg = "invalid bit length repeat";
                        state.mode = BAD;
                        break;
                      }
                      len = state.lens[state.have - 1];
                      copy = 3 + (hold & 3);
                      hold >>>= 2;
                      bits -= 2;
                    } else if (here_val === 17) {
                      n = here_bits + 3;
                      while (bits < n) {
                        if (have === 0) {
                          break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                      }
                      hold >>>= here_bits;
                      bits -= here_bits;
                      len = 0;
                      copy = 3 + (hold & 7);
                      hold >>>= 3;
                      bits -= 3;
                    } else {
                      n = here_bits + 7;
                      while (bits < n) {
                        if (have === 0) {
                          break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                      }
                      hold >>>= here_bits;
                      bits -= here_bits;
                      len = 0;
                      copy = 11 + (hold & 127);
                      hold >>>= 7;
                      bits -= 7;
                    }
                    if (state.have + copy > state.nlen + state.ndist) {
                      strm.msg = "invalid bit length repeat";
                      state.mode = BAD;
                      break;
                    }
                    while (copy--) {
                      state.lens[state.have++] = len;
                    }
                  }
                }
                if (state.mode === BAD) {
                  break;
                }
                if (state.lens[256] === 0) {
                  strm.msg = "invalid code -- missing end-of-block";
                  state.mode = BAD;
                  break;
                }
                state.lenbits = 9;
                opts = { bits: state.lenbits };
                ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
                state.lenbits = opts.bits;
                if (ret) {
                  strm.msg = "invalid literal/lengths set";
                  state.mode = BAD;
                  break;
                }
                state.distbits = 6;
                state.distcode = state.distdyn;
                opts = { bits: state.distbits };
                ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
                state.distbits = opts.bits;
                if (ret) {
                  strm.msg = "invalid distances set";
                  state.mode = BAD;
                  break;
                }
                state.mode = LEN_;
                if (flush === Z_TREES) {
                  break inf_leave;
                }
              /* falls through */
              case LEN_:
                state.mode = LEN;
              /* falls through */
              case LEN:
                if (have >= 6 && left >= 258) {
                  strm.next_out = put;
                  strm.avail_out = left;
                  strm.next_in = next;
                  strm.avail_in = have;
                  state.hold = hold;
                  state.bits = bits;
                  inflate_fast(strm, _out);
                  put = strm.next_out;
                  output = strm.output;
                  left = strm.avail_out;
                  next = strm.next_in;
                  input = strm.input;
                  have = strm.avail_in;
                  hold = state.hold;
                  bits = state.bits;
                  if (state.mode === TYPE) {
                    state.back = -1;
                  }
                  break;
                }
                state.back = 0;
                for (; ; ) {
                  here = state.lencode[hold & (1 << state.lenbits) - 1];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (here_op && (here_op & 240) === 0) {
                  last_bits = here_bits;
                  last_op = here_op;
                  last_val = here_val;
                  for (; ; ) {
                    here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (last_bits + here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= last_bits;
                  bits -= last_bits;
                  state.back += last_bits;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                state.back += here_bits;
                state.length = here_val;
                if (here_op === 0) {
                  state.mode = LIT;
                  break;
                }
                if (here_op & 32) {
                  state.back = -1;
                  state.mode = TYPE;
                  break;
                }
                if (here_op & 64) {
                  strm.msg = "invalid literal/length code";
                  state.mode = BAD;
                  break;
                }
                state.extra = here_op & 15;
                state.mode = LENEXT;
              /* falls through */
              case LENEXT:
                if (state.extra) {
                  n = state.extra;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.length += hold & (1 << state.extra) - 1;
                  hold >>>= state.extra;
                  bits -= state.extra;
                  state.back += state.extra;
                }
                state.was = state.length;
                state.mode = DIST;
              /* falls through */
              case DIST:
                for (; ; ) {
                  here = state.distcode[hold & (1 << state.distbits) - 1];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if ((here_op & 240) === 0) {
                  last_bits = here_bits;
                  last_op = here_op;
                  last_val = here_val;
                  for (; ; ) {
                    here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (last_bits + here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= last_bits;
                  bits -= last_bits;
                  state.back += last_bits;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                state.back += here_bits;
                if (here_op & 64) {
                  strm.msg = "invalid distance code";
                  state.mode = BAD;
                  break;
                }
                state.offset = here_val;
                state.extra = here_op & 15;
                state.mode = DISTEXT;
              /* falls through */
              case DISTEXT:
                if (state.extra) {
                  n = state.extra;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.offset += hold & (1 << state.extra) - 1;
                  hold >>>= state.extra;
                  bits -= state.extra;
                  state.back += state.extra;
                }
                if (state.offset > state.dmax) {
                  strm.msg = "invalid distance too far back";
                  state.mode = BAD;
                  break;
                }
                state.mode = MATCH;
              /* falls through */
              case MATCH:
                if (left === 0) {
                  break inf_leave;
                }
                copy = _out - left;
                if (state.offset > copy) {
                  copy = state.offset - copy;
                  if (copy > state.whave) {
                    if (state.sane) {
                      strm.msg = "invalid distance too far back";
                      state.mode = BAD;
                      break;
                    }
                  }
                  if (copy > state.wnext) {
                    copy -= state.wnext;
                    from = state.wsize - copy;
                  } else {
                    from = state.wnext - copy;
                  }
                  if (copy > state.length) {
                    copy = state.length;
                  }
                  from_source = state.window;
                } else {
                  from_source = output;
                  from = put - state.offset;
                  copy = state.length;
                }
                if (copy > left) {
                  copy = left;
                }
                left -= copy;
                state.length -= copy;
                do {
                  output[put++] = from_source[from++];
                } while (--copy);
                if (state.length === 0) {
                  state.mode = LEN;
                }
                break;
              case LIT:
                if (left === 0) {
                  break inf_leave;
                }
                output[put++] = state.length;
                left--;
                state.mode = LEN;
                break;
              case CHECK:
                if (state.wrap) {
                  while (bits < 32) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold |= input[next++] << bits;
                    bits += 8;
                  }
                  _out -= left;
                  strm.total_out += _out;
                  state.total += _out;
                  if (_out) {
                    strm.adler = state.check = /*UPDATE(state.check, put - _out, _out);*/
                    state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
                  }
                  _out = left;
                  if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                    strm.msg = "incorrect data check";
                    state.mode = BAD;
                    break;
                  }
                  hold = 0;
                  bits = 0;
                }
                state.mode = LENGTH;
              /* falls through */
              case LENGTH:
                if (state.wrap && state.flags) {
                  while (bits < 32) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (hold !== (state.total & 4294967295)) {
                    strm.msg = "incorrect length check";
                    state.mode = BAD;
                    break;
                  }
                  hold = 0;
                  bits = 0;
                }
                state.mode = DONE;
              /* falls through */
              case DONE:
                ret = Z_STREAM_END;
                break inf_leave;
              case BAD:
                ret = Z_DATA_ERROR;
                break inf_leave;
              case MEM:
                return Z_MEM_ERROR;
              case SYNC:
              /* falls through */
              default:
                return Z_STREAM_ERROR;
            }
          }
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
          if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
            state.mode = MEM;
            return Z_MEM_ERROR;
          }
        }
        _in -= strm.avail_in;
        _out -= strm.avail_out;
        strm.total_in += _in;
        strm.total_out += _out;
        state.total += _out;
        if (state.wrap && _out) {
          strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
          state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
        }
        strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
        if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) {
          ret = Z_BUF_ERROR;
        }
        return ret;
      }
      function inflateEnd(strm) {
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        var state = strm.state;
        if (state.window) {
          state.window = null;
        }
        strm.state = null;
        return Z_OK;
      }
      function inflateGetHeader(strm, head) {
        var state;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        if ((state.wrap & 2) === 0) {
          return Z_STREAM_ERROR;
        }
        state.head = head;
        head.done = false;
        return Z_OK;
      }
      function inflateSetDictionary(strm, dictionary) {
        var dictLength = dictionary.length;
        var state;
        var dictid;
        var ret;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        if (state.wrap !== 0 && state.mode !== DICT) {
          return Z_STREAM_ERROR;
        }
        if (state.mode === DICT) {
          dictid = 1;
          dictid = adler32(dictid, dictionary, dictLength, 0);
          if (dictid !== state.check) {
            return Z_DATA_ERROR;
          }
        }
        ret = updatewindow(strm, dictionary, dictLength, dictLength);
        if (ret) {
          state.mode = MEM;
          return Z_MEM_ERROR;
        }
        state.havedict = 1;
        return Z_OK;
      }
      exports.inflateReset = inflateReset;
      exports.inflateReset2 = inflateReset2;
      exports.inflateResetKeep = inflateResetKeep;
      exports.inflateInit = inflateInit;
      exports.inflateInit2 = inflateInit2;
      exports.inflate = inflate;
      exports.inflateEnd = inflateEnd;
      exports.inflateGetHeader = inflateGetHeader;
      exports.inflateSetDictionary = inflateSetDictionary;
      exports.inflateInfo = "pako inflate (from Nodeca project)";
    }
  });

  // node_modules/pako/lib/zlib/constants.js
  var require_constants = __commonJS({
    "node_modules/pako/lib/zlib/constants.js"(exports, module) {
      "use strict";
      module.exports = {
        /* Allowed flush values; see deflate() and inflate() below for details */
        Z_NO_FLUSH: 0,
        Z_PARTIAL_FLUSH: 1,
        Z_SYNC_FLUSH: 2,
        Z_FULL_FLUSH: 3,
        Z_FINISH: 4,
        Z_BLOCK: 5,
        Z_TREES: 6,
        /* Return codes for the compression/decompression functions. Negative values
        * are errors, positive values are used for special but normal events.
        */
        Z_OK: 0,
        Z_STREAM_END: 1,
        Z_NEED_DICT: 2,
        Z_ERRNO: -1,
        Z_STREAM_ERROR: -2,
        Z_DATA_ERROR: -3,
        //Z_MEM_ERROR:     -4,
        Z_BUF_ERROR: -5,
        //Z_VERSION_ERROR: -6,
        /* compression levels */
        Z_NO_COMPRESSION: 0,
        Z_BEST_SPEED: 1,
        Z_BEST_COMPRESSION: 9,
        Z_DEFAULT_COMPRESSION: -1,
        Z_FILTERED: 1,
        Z_HUFFMAN_ONLY: 2,
        Z_RLE: 3,
        Z_FIXED: 4,
        Z_DEFAULT_STRATEGY: 0,
        /* Possible values of the data_type field (though see inflate()) */
        Z_BINARY: 0,
        Z_TEXT: 1,
        //Z_ASCII:                1, // = Z_TEXT (deprecated)
        Z_UNKNOWN: 2,
        /* The deflate compression method */
        Z_DEFLATED: 8
        //Z_NULL:                 null // Use -1 or null inline, depending on var type
      };
    }
  });

  // node_modules/pako/lib/zlib/gzheader.js
  var require_gzheader = __commonJS({
    "node_modules/pako/lib/zlib/gzheader.js"(exports, module) {
      "use strict";
      function GZheader() {
        this.text = 0;
        this.time = 0;
        this.xflags = 0;
        this.os = 0;
        this.extra = null;
        this.extra_len = 0;
        this.name = "";
        this.comment = "";
        this.hcrc = 0;
        this.done = false;
      }
      module.exports = GZheader;
    }
  });

  // node_modules/pako/lib/inflate.js
  var require_inflate2 = __commonJS({
    "node_modules/pako/lib/inflate.js"(exports) {
      "use strict";
      var zlib_inflate = require_inflate();
      var utils = require_common();
      var strings = require_strings();
      var c = require_constants();
      var msg = require_messages();
      var ZStream = require_zstream();
      var GZheader = require_gzheader();
      var toString = Object.prototype.toString;
      function Inflate(options) {
        if (!(this instanceof Inflate)) return new Inflate(options);
        this.options = utils.assign({
          chunkSize: 16384,
          windowBits: 0,
          to: ""
        }, options || {});
        var opt = this.options;
        if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
          opt.windowBits = -opt.windowBits;
          if (opt.windowBits === 0) {
            opt.windowBits = -15;
          }
        }
        if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
          opt.windowBits += 32;
        }
        if (opt.windowBits > 15 && opt.windowBits < 48) {
          if ((opt.windowBits & 15) === 0) {
            opt.windowBits |= 15;
          }
        }
        this.err = 0;
        this.msg = "";
        this.ended = false;
        this.chunks = [];
        this.strm = new ZStream();
        this.strm.avail_out = 0;
        var status = zlib_inflate.inflateInit2(
          this.strm,
          opt.windowBits
        );
        if (status !== c.Z_OK) {
          throw new Error(msg[status]);
        }
        this.header = new GZheader();
        zlib_inflate.inflateGetHeader(this.strm, this.header);
        if (opt.dictionary) {
          if (typeof opt.dictionary === "string") {
            opt.dictionary = strings.string2buf(opt.dictionary);
          } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
            opt.dictionary = new Uint8Array(opt.dictionary);
          }
          if (opt.raw) {
            status = zlib_inflate.inflateSetDictionary(this.strm, opt.dictionary);
            if (status !== c.Z_OK) {
              throw new Error(msg[status]);
            }
          }
        }
      }
      Inflate.prototype.push = function(data, mode) {
        var strm = this.strm;
        var chunkSize = this.options.chunkSize;
        var dictionary = this.options.dictionary;
        var status, _mode;
        var next_out_utf8, tail, utf8str;
        var allowBufError = false;
        if (this.ended) {
          return false;
        }
        _mode = mode === ~~mode ? mode : mode === true ? c.Z_FINISH : c.Z_NO_FLUSH;
        if (typeof data === "string") {
          strm.input = strings.binstring2buf(data);
        } else if (toString.call(data) === "[object ArrayBuffer]") {
          strm.input = new Uint8Array(data);
        } else {
          strm.input = data;
        }
        strm.next_in = 0;
        strm.avail_in = strm.input.length;
        do {
          if (strm.avail_out === 0) {
            strm.output = new utils.Buf8(chunkSize);
            strm.next_out = 0;
            strm.avail_out = chunkSize;
          }
          status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);
          if (status === c.Z_NEED_DICT && dictionary) {
            status = zlib_inflate.inflateSetDictionary(this.strm, dictionary);
          }
          if (status === c.Z_BUF_ERROR && allowBufError === true) {
            status = c.Z_OK;
            allowBufError = false;
          }
          if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
            this.onEnd(status);
            this.ended = true;
            return false;
          }
          if (strm.next_out) {
            if (strm.avail_out === 0 || status === c.Z_STREAM_END || strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH)) {
              if (this.options.to === "string") {
                next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
                tail = strm.next_out - next_out_utf8;
                utf8str = strings.buf2string(strm.output, next_out_utf8);
                strm.next_out = tail;
                strm.avail_out = chunkSize - tail;
                if (tail) {
                  utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0);
                }
                this.onData(utf8str);
              } else {
                this.onData(utils.shrinkBuf(strm.output, strm.next_out));
              }
            }
          }
          if (strm.avail_in === 0 && strm.avail_out === 0) {
            allowBufError = true;
          }
        } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);
        if (status === c.Z_STREAM_END) {
          _mode = c.Z_FINISH;
        }
        if (_mode === c.Z_FINISH) {
          status = zlib_inflate.inflateEnd(this.strm);
          this.onEnd(status);
          this.ended = true;
          return status === c.Z_OK;
        }
        if (_mode === c.Z_SYNC_FLUSH) {
          this.onEnd(c.Z_OK);
          strm.avail_out = 0;
          return true;
        }
        return true;
      };
      Inflate.prototype.onData = function(chunk) {
        this.chunks.push(chunk);
      };
      Inflate.prototype.onEnd = function(status) {
        if (status === c.Z_OK) {
          if (this.options.to === "string") {
            this.result = this.chunks.join("");
          } else {
            this.result = utils.flattenChunks(this.chunks);
          }
        }
        this.chunks = [];
        this.err = status;
        this.msg = this.strm.msg;
      };
      function inflate(input, options) {
        var inflator = new Inflate(options);
        inflator.push(input, true);
        if (inflator.err) {
          throw inflator.msg || msg[inflator.err];
        }
        return inflator.result;
      }
      function inflateRaw(input, options) {
        options = options || {};
        options.raw = true;
        return inflate(input, options);
      }
      exports.Inflate = Inflate;
      exports.inflate = inflate;
      exports.inflateRaw = inflateRaw;
      exports.ungzip = inflate;
    }
  });

  // node_modules/pako/index.js
  var require_pako = __commonJS({
    "node_modules/pako/index.js"(exports, module) {
      "use strict";
      var assign = require_common().assign;
      var deflate = require_deflate2();
      var inflate = require_inflate2();
      var constants = require_constants();
      var pako = {};
      assign(pako, deflate, inflate, constants);
      module.exports = pako;
    }
  });

  // node_modules/upng-js/UPNG.js
  var require_UPNG = __commonJS({
    "node_modules/upng-js/UPNG.js"(exports, module) {
      (function() {
        var UPNG2 = {};
        var pako;
        if (typeof module == "object") {
          module.exports = UPNG2;
        } else {
          window.UPNG = UPNG2;
        }
        if (typeof __require == "function") {
          pako = require_pako();
        } else {
          pako = window.pako;
        }
        function log() {
          if (typeof process == "undefined" || true) console.log.apply(console, arguments);
        }
        (function(UPNG3, pako2) {
          UPNG3.toRGBA8 = function(out) {
            var w = out.width, h = out.height;
            if (out.tabs.acTL == null) return [UPNG3.toRGBA8.decodeImage(out.data, w, h, out).buffer];
            var frms = [];
            if (out.frames[0].data == null) out.frames[0].data = out.data;
            var img, empty = new Uint8Array(w * h * 4);
            for (var i = 0; i < out.frames.length; i++) {
              var frm = out.frames[i];
              var fx = frm.rect.x, fy = frm.rect.y, fw = frm.rect.width, fh = frm.rect.height;
              var fdata = UPNG3.toRGBA8.decodeImage(frm.data, fw, fh, out);
              if (i == 0) img = fdata;
              else if (frm.blend == 0) UPNG3._copyTile(fdata, fw, fh, img, w, h, fx, fy, 0);
              else if (frm.blend == 1) UPNG3._copyTile(fdata, fw, fh, img, w, h, fx, fy, 1);
              frms.push(img.buffer);
              img = img.slice(0);
              if (frm.dispose == 0) {
              } else if (frm.dispose == 1) UPNG3._copyTile(empty, fw, fh, img, w, h, fx, fy, 0);
              else if (frm.dispose == 2) {
                var pi = i - 1;
                while (out.frames[pi].dispose == 2) pi--;
                img = new Uint8Array(frms[pi]).slice(0);
              }
            }
            return frms;
          };
          UPNG3.toRGBA8.decodeImage = function(data, w, h, out) {
            var area = w * h, bpp = UPNG3.decode._getBPP(out);
            var bpl = Math.ceil(w * bpp / 8);
            var bf = new Uint8Array(area * 4), bf32 = new Uint32Array(bf.buffer);
            var ctype = out.ctype, depth = out.depth;
            var rs = UPNG3._bin.readUshort;
            if (ctype == 6) {
              var qarea = area << 2;
              if (depth == 8) for (var i = 0; i < qarea; i++) {
                bf[i] = data[i];
              }
              if (depth == 16) for (var i = 0; i < qarea; i++) {
                bf[i] = data[i << 1];
              }
            } else if (ctype == 2) {
              var ts = out.tabs["tRNS"], tr = -1, tg = -1, tb = -1;
              if (ts) {
                tr = ts[0];
                tg = ts[1];
                tb = ts[2];
              }
              if (depth == 8) for (var i = 0; i < area; i++) {
                var qi = i << 2, ti = i * 3;
                bf[qi] = data[ti];
                bf[qi + 1] = data[ti + 1];
                bf[qi + 2] = data[ti + 2];
                bf[qi + 3] = 255;
                if (tr != -1 && data[ti] == tr && data[ti + 1] == tg && data[ti + 2] == tb) bf[qi + 3] = 0;
              }
              if (depth == 16) for (var i = 0; i < area; i++) {
                var qi = i << 2, ti = i * 6;
                bf[qi] = data[ti];
                bf[qi + 1] = data[ti + 2];
                bf[qi + 2] = data[ti + 4];
                bf[qi + 3] = 255;
                if (tr != -1 && rs(data, ti) == tr && rs(data, ti + 2) == tg && rs(data, ti + 4) == tb) bf[qi + 3] = 0;
              }
            } else if (ctype == 3) {
              var p = out.tabs["PLTE"], ap = out.tabs["tRNS"], tl = ap ? ap.length : 0;
              if (depth == 1) for (var y = 0; y < h; y++) {
                var s0 = y * bpl, t0 = y * w;
                for (var i = 0; i < w; i++) {
                  var qi = t0 + i << 2, j = data[s0 + (i >> 3)] >> 7 - ((i & 7) << 0) & 1, cj = 3 * j;
                  bf[qi] = p[cj];
                  bf[qi + 1] = p[cj + 1];
                  bf[qi + 2] = p[cj + 2];
                  bf[qi + 3] = j < tl ? ap[j] : 255;
                }
              }
              if (depth == 2) for (var y = 0; y < h; y++) {
                var s0 = y * bpl, t0 = y * w;
                for (var i = 0; i < w; i++) {
                  var qi = t0 + i << 2, j = data[s0 + (i >> 2)] >> 6 - ((i & 3) << 1) & 3, cj = 3 * j;
                  bf[qi] = p[cj];
                  bf[qi + 1] = p[cj + 1];
                  bf[qi + 2] = p[cj + 2];
                  bf[qi + 3] = j < tl ? ap[j] : 255;
                }
              }
              if (depth == 4) for (var y = 0; y < h; y++) {
                var s0 = y * bpl, t0 = y * w;
                for (var i = 0; i < w; i++) {
                  var qi = t0 + i << 2, j = data[s0 + (i >> 1)] >> 4 - ((i & 1) << 2) & 15, cj = 3 * j;
                  bf[qi] = p[cj];
                  bf[qi + 1] = p[cj + 1];
                  bf[qi + 2] = p[cj + 2];
                  bf[qi + 3] = j < tl ? ap[j] : 255;
                }
              }
              if (depth == 8) for (var i = 0; i < area; i++) {
                var qi = i << 2, j = data[i], cj = 3 * j;
                bf[qi] = p[cj];
                bf[qi + 1] = p[cj + 1];
                bf[qi + 2] = p[cj + 2];
                bf[qi + 3] = j < tl ? ap[j] : 255;
              }
            } else if (ctype == 4) {
              if (depth == 8) for (var i = 0; i < area; i++) {
                var qi = i << 2, di = i << 1, gr = data[di];
                bf[qi] = gr;
                bf[qi + 1] = gr;
                bf[qi + 2] = gr;
                bf[qi + 3] = data[di + 1];
              }
              if (depth == 16) for (var i = 0; i < area; i++) {
                var qi = i << 2, di = i << 2, gr = data[di];
                bf[qi] = gr;
                bf[qi + 1] = gr;
                bf[qi + 2] = gr;
                bf[qi + 3] = data[di + 2];
              }
            } else if (ctype == 0) {
              var tr = out.tabs["tRNS"] ? out.tabs["tRNS"] : -1;
              if (depth == 1) for (var i = 0; i < area; i++) {
                var gr = 255 * (data[i >> 3] >> 7 - (i & 7) & 1), al = gr == tr * 255 ? 0 : 255;
                bf32[i] = al << 24 | gr << 16 | gr << 8 | gr;
              }
              if (depth == 2) for (var i = 0; i < area; i++) {
                var gr = 85 * (data[i >> 2] >> 6 - ((i & 3) << 1) & 3), al = gr == tr * 85 ? 0 : 255;
                bf32[i] = al << 24 | gr << 16 | gr << 8 | gr;
              }
              if (depth == 4) for (var i = 0; i < area; i++) {
                var gr = 17 * (data[i >> 1] >> 4 - ((i & 1) << 2) & 15), al = gr == tr * 17 ? 0 : 255;
                bf32[i] = al << 24 | gr << 16 | gr << 8 | gr;
              }
              if (depth == 8) for (var i = 0; i < area; i++) {
                var gr = data[i], al = gr == tr ? 0 : 255;
                bf32[i] = al << 24 | gr << 16 | gr << 8 | gr;
              }
              if (depth == 16) for (var i = 0; i < area; i++) {
                var gr = data[i << 1], al = rs(data, i << 1) == tr ? 0 : 255;
                bf32[i] = al << 24 | gr << 16 | gr << 8 | gr;
              }
            }
            return bf;
          };
          UPNG3.decode = function(buff) {
            var data = new Uint8Array(buff), offset = 8, bin = UPNG3._bin, rUs = bin.readUshort, rUi = bin.readUint;
            var out = { tabs: {}, frames: [] };
            var dd = new Uint8Array(data.length), doff = 0;
            var fd, foff = 0;
            var mgck = [137, 80, 78, 71, 13, 10, 26, 10];
            for (var i = 0; i < 8; i++) if (data[i] != mgck[i]) throw "The input is not a PNG file!";
            while (offset < data.length) {
              var len = bin.readUint(data, offset);
              offset += 4;
              var type = bin.readASCII(data, offset, 4);
              offset += 4;
              if (type == "IHDR") {
                UPNG3.decode._IHDR(data, offset, out);
              } else if (type == "IDAT") {
                for (var i = 0; i < len; i++) dd[doff + i] = data[offset + i];
                doff += len;
              } else if (type == "acTL") {
                out.tabs[type] = { num_frames: rUi(data, offset), num_plays: rUi(data, offset + 4) };
                fd = new Uint8Array(data.length);
              } else if (type == "fcTL") {
                if (foff != 0) {
                  var fr = out.frames[out.frames.length - 1];
                  fr.data = UPNG3.decode._decompress(out, fd.slice(0, foff), fr.rect.width, fr.rect.height);
                  foff = 0;
                }
                var rct = { x: rUi(data, offset + 12), y: rUi(data, offset + 16), width: rUi(data, offset + 4), height: rUi(data, offset + 8) };
                var del = rUs(data, offset + 22);
                del = rUs(data, offset + 20) / (del == 0 ? 100 : del);
                var frm = { rect: rct, delay: Math.round(del * 1e3), dispose: data[offset + 24], blend: data[offset + 25] };
                out.frames.push(frm);
              } else if (type == "fdAT") {
                for (var i = 0; i < len - 4; i++) fd[foff + i] = data[offset + i + 4];
                foff += len - 4;
              } else if (type == "pHYs") {
                out.tabs[type] = [bin.readUint(data, offset), bin.readUint(data, offset + 4), data[offset + 8]];
              } else if (type == "cHRM") {
                out.tabs[type] = [];
                for (var i = 0; i < 8; i++) out.tabs[type].push(bin.readUint(data, offset + i * 4));
              } else if (type == "tEXt") {
                if (out.tabs[type] == null) out.tabs[type] = {};
                var nz = bin.nextZero(data, offset);
                var keyw = bin.readASCII(data, offset, nz - offset);
                var text = bin.readASCII(data, nz + 1, offset + len - nz - 1);
                out.tabs[type][keyw] = text;
              } else if (type == "iTXt") {
                if (out.tabs[type] == null) out.tabs[type] = {};
                var nz = 0, off = offset;
                nz = bin.nextZero(data, off);
                var keyw = bin.readASCII(data, off, nz - off);
                off = nz + 1;
                var cflag = data[off], cmeth = data[off + 1];
                off += 2;
                nz = bin.nextZero(data, off);
                var ltag = bin.readASCII(data, off, nz - off);
                off = nz + 1;
                nz = bin.nextZero(data, off);
                var tkeyw = bin.readUTF8(data, off, nz - off);
                off = nz + 1;
                var text = bin.readUTF8(data, off, len - (off - offset));
                out.tabs[type][keyw] = text;
              } else if (type == "PLTE") {
                out.tabs[type] = bin.readBytes(data, offset, len);
              } else if (type == "hIST") {
                var pl = out.tabs["PLTE"].length / 3;
                out.tabs[type] = [];
                for (var i = 0; i < pl; i++) out.tabs[type].push(rUs(data, offset + i * 2));
              } else if (type == "tRNS") {
                if (out.ctype == 3) out.tabs[type] = bin.readBytes(data, offset, len);
                else if (out.ctype == 0) out.tabs[type] = rUs(data, offset);
                else if (out.ctype == 2) out.tabs[type] = [rUs(data, offset), rUs(data, offset + 2), rUs(data, offset + 4)];
              } else if (type == "gAMA") out.tabs[type] = bin.readUint(data, offset) / 1e5;
              else if (type == "sRGB") out.tabs[type] = data[offset];
              else if (type == "bKGD") {
                if (out.ctype == 0 || out.ctype == 4) out.tabs[type] = [rUs(data, offset)];
                else if (out.ctype == 2 || out.ctype == 6) out.tabs[type] = [rUs(data, offset), rUs(data, offset + 2), rUs(data, offset + 4)];
                else if (out.ctype == 3) out.tabs[type] = data[offset];
              } else if (type == "IEND") {
                if (foff != 0) {
                  var fr = out.frames[out.frames.length - 1];
                  fr.data = UPNG3.decode._decompress(out, fd.slice(0, foff), fr.rect.width, fr.rect.height);
                  foff = 0;
                }
                out.data = UPNG3.decode._decompress(out, dd, out.width, out.height);
                break;
              }
              offset += len;
              var crc = bin.readUint(data, offset);
              offset += 4;
            }
            delete out.compress;
            delete out.interlace;
            delete out.filter;
            return out;
          };
          UPNG3.decode._decompress = function(out, dd, w, h) {
            if (out.compress == 0) dd = UPNG3.decode._inflate(dd);
            if (out.interlace == 0) dd = UPNG3.decode._filterZero(dd, out, 0, w, h);
            else if (out.interlace == 1) dd = UPNG3.decode._readInterlace(dd, out);
            return dd;
          };
          UPNG3.decode._inflate = function(data) {
            return pako2["inflate"](data);
          };
          UPNG3.decode._readInterlace = function(data, out) {
            var w = out.width, h = out.height;
            var bpp = UPNG3.decode._getBPP(out), cbpp = bpp >> 3, bpl = Math.ceil(w * bpp / 8);
            var img = new Uint8Array(h * bpl);
            var di = 0;
            var starting_row = [0, 0, 4, 0, 2, 0, 1];
            var starting_col = [0, 4, 0, 2, 0, 1, 0];
            var row_increment = [8, 8, 8, 4, 4, 2, 2];
            var col_increment = [8, 8, 4, 4, 2, 2, 1];
            var pass = 0;
            while (pass < 7) {
              var ri = row_increment[pass], ci = col_increment[pass];
              var sw = 0, sh = 0;
              var cr = starting_row[pass];
              while (cr < h) {
                cr += ri;
                sh++;
              }
              var cc = starting_col[pass];
              while (cc < w) {
                cc += ci;
                sw++;
              }
              var bpll = Math.ceil(sw * bpp / 8);
              UPNG3.decode._filterZero(data, out, di, sw, sh);
              var y = 0, row = starting_row[pass];
              while (row < h) {
                var col = starting_col[pass];
                var cdi = di + y * bpll << 3;
                while (col < w) {
                  if (bpp == 1) {
                    var val = data[cdi >> 3];
                    val = val >> 7 - (cdi & 7) & 1;
                    img[row * bpl + (col >> 3)] |= val << 7 - ((col & 3) << 0);
                  }
                  if (bpp == 2) {
                    var val = data[cdi >> 3];
                    val = val >> 6 - (cdi & 7) & 3;
                    img[row * bpl + (col >> 2)] |= val << 6 - ((col & 3) << 1);
                  }
                  if (bpp == 4) {
                    var val = data[cdi >> 3];
                    val = val >> 4 - (cdi & 7) & 15;
                    img[row * bpl + (col >> 1)] |= val << 4 - ((col & 1) << 2);
                  }
                  if (bpp >= 8) {
                    var ii = row * bpl + col * cbpp;
                    for (var j = 0; j < cbpp; j++) img[ii + j] = data[(cdi >> 3) + j];
                  }
                  cdi += bpp;
                  col += ci;
                }
                y++;
                row += ri;
              }
              if (sw * sh != 0) di += sh * (1 + bpll);
              pass = pass + 1;
            }
            return img;
          };
          UPNG3.decode._getBPP = function(out) {
            var noc = [1, null, 3, 1, 2, null, 4][out.ctype];
            return noc * out.depth;
          };
          UPNG3.decode._filterZero = function(data, out, off, w, h) {
            var bpp = UPNG3.decode._getBPP(out), bpl = Math.ceil(w * bpp / 8), paeth = UPNG3.decode._paeth;
            bpp = Math.ceil(bpp / 8);
            for (var y = 0; y < h; y++) {
              var i = off + y * bpl, di = i + y + 1;
              var type = data[di - 1];
              if (type == 0) for (var x = 0; x < bpl; x++) data[i + x] = data[di + x];
              else if (type == 1) {
                for (var x = 0; x < bpp; x++) data[i + x] = data[di + x];
                for (var x = bpp; x < bpl; x++) data[i + x] = data[di + x] + data[i + x - bpp] & 255;
              } else if (y == 0) {
                for (var x = 0; x < bpp; x++) data[i + x] = data[di + x];
                if (type == 2) for (var x = bpp; x < bpl; x++) data[i + x] = data[di + x] & 255;
                if (type == 3) for (var x = bpp; x < bpl; x++) data[i + x] = data[di + x] + (data[i + x - bpp] >> 1) & 255;
                if (type == 4) for (var x = bpp; x < bpl; x++) data[i + x] = data[di + x] + paeth(data[i + x - bpp], 0, 0) & 255;
              } else {
                if (type == 2) {
                  for (var x = 0; x < bpl; x++) data[i + x] = data[di + x] + data[i + x - bpl] & 255;
                }
                if (type == 3) {
                  for (var x = 0; x < bpp; x++) data[i + x] = data[di + x] + (data[i + x - bpl] >> 1) & 255;
                  for (var x = bpp; x < bpl; x++) data[i + x] = data[di + x] + (data[i + x - bpl] + data[i + x - bpp] >> 1) & 255;
                }
                if (type == 4) {
                  for (var x = 0; x < bpp; x++) data[i + x] = data[di + x] + paeth(0, data[i + x - bpl], 0) & 255;
                  for (var x = bpp; x < bpl; x++) data[i + x] = data[di + x] + paeth(data[i + x - bpp], data[i + x - bpl], data[i + x - bpp - bpl]) & 255;
                }
              }
            }
            return data;
          };
          UPNG3.decode._paeth = function(a, b, c) {
            var p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
            if (pa <= pb && pa <= pc) return a;
            else if (pb <= pc) return b;
            return c;
          };
          UPNG3.decode._IHDR = function(data, offset, out) {
            var bin = UPNG3._bin;
            out.width = bin.readUint(data, offset);
            offset += 4;
            out.height = bin.readUint(data, offset);
            offset += 4;
            out.depth = data[offset];
            offset++;
            out.ctype = data[offset];
            offset++;
            out.compress = data[offset];
            offset++;
            out.filter = data[offset];
            offset++;
            out.interlace = data[offset];
            offset++;
          };
          UPNG3._bin = {
            nextZero: function(data, p) {
              while (data[p] != 0) p++;
              return p;
            },
            readUshort: function(buff, p) {
              return buff[p] << 8 | buff[p + 1];
            },
            writeUshort: function(buff, p, n) {
              buff[p] = n >> 8 & 255;
              buff[p + 1] = n & 255;
            },
            readUint: function(buff, p) {
              return buff[p] * (256 * 256 * 256) + (buff[p + 1] << 16 | buff[p + 2] << 8 | buff[p + 3]);
            },
            writeUint: function(buff, p, n) {
              buff[p] = n >> 24 & 255;
              buff[p + 1] = n >> 16 & 255;
              buff[p + 2] = n >> 8 & 255;
              buff[p + 3] = n & 255;
            },
            readASCII: function(buff, p, l) {
              var s = "";
              for (var i = 0; i < l; i++) s += String.fromCharCode(buff[p + i]);
              return s;
            },
            writeASCII: function(data, p, s) {
              for (var i = 0; i < s.length; i++) data[p + i] = s.charCodeAt(i);
            },
            readBytes: function(buff, p, l) {
              var arr = [];
              for (var i = 0; i < l; i++) arr.push(buff[p + i]);
              return arr;
            },
            pad: function(n) {
              return n.length < 2 ? "0" + n : n;
            },
            readUTF8: function(buff, p, l) {
              var s = "", ns;
              for (var i = 0; i < l; i++) s += "%" + UPNG3._bin.pad(buff[p + i].toString(16));
              try {
                ns = decodeURIComponent(s);
              } catch (e) {
                return UPNG3._bin.readASCII(buff, p, l);
              }
              return ns;
            }
          };
          UPNG3._copyTile = function(sb, sw, sh, tb, tw, th, xoff, yoff, mode) {
            var w = Math.min(sw, tw), h = Math.min(sh, th);
            var si = 0, ti = 0;
            for (var y = 0; y < h; y++)
              for (var x = 0; x < w; x++) {
                if (xoff >= 0 && yoff >= 0) {
                  si = y * sw + x << 2;
                  ti = (yoff + y) * tw + xoff + x << 2;
                } else {
                  si = (-yoff + y) * sw - xoff + x << 2;
                  ti = y * tw + x << 2;
                }
                if (mode == 0) {
                  tb[ti] = sb[si];
                  tb[ti + 1] = sb[si + 1];
                  tb[ti + 2] = sb[si + 2];
                  tb[ti + 3] = sb[si + 3];
                } else if (mode == 1) {
                  var fa = sb[si + 3] * (1 / 255), fr = sb[si] * fa, fg = sb[si + 1] * fa, fb = sb[si + 2] * fa;
                  var ba = tb[ti + 3] * (1 / 255), br = tb[ti] * ba, bg = tb[ti + 1] * ba, bb = tb[ti + 2] * ba;
                  var ifa = 1 - fa, oa = fa + ba * ifa, ioa = oa == 0 ? 0 : 1 / oa;
                  tb[ti + 3] = 255 * oa;
                  tb[ti + 0] = (fr + br * ifa) * ioa;
                  tb[ti + 1] = (fg + bg * ifa) * ioa;
                  tb[ti + 2] = (fb + bb * ifa) * ioa;
                } else if (mode == 2) {
                  var fa = sb[si + 3], fr = sb[si], fg = sb[si + 1], fb = sb[si + 2];
                  var ba = tb[ti + 3], br = tb[ti], bg = tb[ti + 1], bb = tb[ti + 2];
                  if (fa == ba && fr == br && fg == bg && fb == bb) {
                    tb[ti] = 0;
                    tb[ti + 1] = 0;
                    tb[ti + 2] = 0;
                    tb[ti + 3] = 0;
                  } else {
                    tb[ti] = fr;
                    tb[ti + 1] = fg;
                    tb[ti + 2] = fb;
                    tb[ti + 3] = fa;
                  }
                } else if (mode == 3) {
                  var fa = sb[si + 3], fr = sb[si], fg = sb[si + 1], fb = sb[si + 2];
                  var ba = tb[ti + 3], br = tb[ti], bg = tb[ti + 1], bb = tb[ti + 2];
                  if (fa == ba && fr == br && fg == bg && fb == bb) continue;
                  if (fa < 220 && ba > 20) return false;
                }
              }
            return true;
          };
          UPNG3.encode = function(bufs, w, h, ps, dels, forbidPlte) {
            if (ps == null) ps = 0;
            if (forbidPlte == null) forbidPlte = false;
            var data = new Uint8Array(bufs[0].byteLength * bufs.length + 100);
            var wr = [137, 80, 78, 71, 13, 10, 26, 10];
            for (var i = 0; i < 8; i++) data[i] = wr[i];
            var offset = 8, bin = UPNG3._bin, crc = UPNG3.crc.crc, wUi = bin.writeUint, wUs = bin.writeUshort, wAs = bin.writeASCII;
            var nimg = UPNG3.encode.compressPNG(bufs, w, h, ps, forbidPlte);
            wUi(data, offset, 13);
            offset += 4;
            wAs(data, offset, "IHDR");
            offset += 4;
            wUi(data, offset, w);
            offset += 4;
            wUi(data, offset, h);
            offset += 4;
            data[offset] = nimg.depth;
            offset++;
            data[offset] = nimg.ctype;
            offset++;
            data[offset] = 0;
            offset++;
            data[offset] = 0;
            offset++;
            data[offset] = 0;
            offset++;
            wUi(data, offset, crc(data, offset - 17, 17));
            offset += 4;
            wUi(data, offset, 1);
            offset += 4;
            wAs(data, offset, "sRGB");
            offset += 4;
            data[offset] = 1;
            offset++;
            wUi(data, offset, crc(data, offset - 5, 5));
            offset += 4;
            var anim = bufs.length > 1;
            if (anim) {
              wUi(data, offset, 8);
              offset += 4;
              wAs(data, offset, "acTL");
              offset += 4;
              wUi(data, offset, bufs.length);
              offset += 4;
              wUi(data, offset, 0);
              offset += 4;
              wUi(data, offset, crc(data, offset - 12, 12));
              offset += 4;
            }
            if (nimg.ctype == 3) {
              var dl = nimg.plte.length;
              wUi(data, offset, dl * 3);
              offset += 4;
              wAs(data, offset, "PLTE");
              offset += 4;
              for (var i = 0; i < dl; i++) {
                var ti = i * 3, c = nimg.plte[i], r = c & 255, g = c >> 8 & 255, b = c >> 16 & 255;
                data[offset + ti + 0] = r;
                data[offset + ti + 1] = g;
                data[offset + ti + 2] = b;
              }
              offset += dl * 3;
              wUi(data, offset, crc(data, offset - dl * 3 - 4, dl * 3 + 4));
              offset += 4;
              if (nimg.gotAlpha) {
                wUi(data, offset, dl);
                offset += 4;
                wAs(data, offset, "tRNS");
                offset += 4;
                for (var i = 0; i < dl; i++) data[offset + i] = nimg.plte[i] >> 24 & 255;
                offset += dl;
                wUi(data, offset, crc(data, offset - dl - 4, dl + 4));
                offset += 4;
              }
            }
            var fi = 0;
            for (var j = 0; j < nimg.frames.length; j++) {
              var fr = nimg.frames[j];
              if (anim) {
                wUi(data, offset, 26);
                offset += 4;
                wAs(data, offset, "fcTL");
                offset += 4;
                wUi(data, offset, fi++);
                offset += 4;
                wUi(data, offset, fr.rect.width);
                offset += 4;
                wUi(data, offset, fr.rect.height);
                offset += 4;
                wUi(data, offset, fr.rect.x);
                offset += 4;
                wUi(data, offset, fr.rect.y);
                offset += 4;
                wUs(data, offset, dels[j]);
                offset += 2;
                wUs(data, offset, 1e3);
                offset += 2;
                data[offset] = fr.dispose;
                offset++;
                data[offset] = fr.blend;
                offset++;
                wUi(data, offset, crc(data, offset - 30, 30));
                offset += 4;
              }
              var imgd = fr.cimg, dl = imgd.length;
              wUi(data, offset, dl + (j == 0 ? 0 : 4));
              offset += 4;
              var ioff = offset;
              wAs(data, offset, j == 0 ? "IDAT" : "fdAT");
              offset += 4;
              if (j != 0) {
                wUi(data, offset, fi++);
                offset += 4;
              }
              for (var i = 0; i < dl; i++) data[offset + i] = imgd[i];
              offset += dl;
              wUi(data, offset, crc(data, ioff, offset - ioff));
              offset += 4;
            }
            wUi(data, offset, 0);
            offset += 4;
            wAs(data, offset, "IEND");
            offset += 4;
            wUi(data, offset, crc(data, offset - 4, 4));
            offset += 4;
            return data.buffer.slice(0, offset);
          };
          UPNG3.encode.compressPNG = function(bufs, w, h, ps, forbidPlte) {
            var out = UPNG3.encode.compress(bufs, w, h, ps, false, forbidPlte);
            for (var i = 0; i < bufs.length; i++) {
              var frm = out.frames[i], nw = frm.rect.width, nh = frm.rect.height, bpl = frm.bpl, bpp = frm.bpp;
              var fdata = new Uint8Array(nh * bpl + nh);
              frm.cimg = UPNG3.encode._filterZero(frm.img, nh, bpp, bpl, fdata);
            }
            return out;
          };
          UPNG3.encode.compress = function(bufs, w, h, ps, forGIF, forbidPlte) {
            if (forbidPlte == null) forbidPlte = false;
            var ctype = 6, depth = 8, bpp = 4, alphaAnd = 255;
            for (var j = 0; j < bufs.length; j++) {
              var img = new Uint8Array(bufs[j]), ilen = img.length;
              for (var i = 0; i < ilen; i += 4) alphaAnd &= img[i + 3];
            }
            var gotAlpha = alphaAnd != 255;
            var cmap = {}, plte = [];
            if (bufs.length != 0) {
              cmap[0] = 0;
              plte.push(0);
              if (ps != 0) ps--;
            }
            if (ps != 0) {
              var qres = UPNG3.quantize(bufs, ps, forGIF);
              bufs = qres.bufs;
              for (var i = 0; i < qres.plte.length; i++) {
                var c = qres.plte[i].est.rgba;
                if (cmap[c] == null) {
                  cmap[c] = plte.length;
                  plte.push(c);
                }
              }
            } else {
              for (var j = 0; j < bufs.length; j++) {
                var img32 = new Uint32Array(bufs[j]), ilen = img32.length;
                for (var i = 0; i < ilen; i++) {
                  var c = img32[i];
                  if ((i < w || c != img32[i - 1] && c != img32[i - w]) && cmap[c] == null) {
                    cmap[c] = plte.length;
                    plte.push(c);
                    if (plte.length >= 300) break;
                  }
                }
              }
            }
            var brute = gotAlpha ? forGIF : false;
            var cc = plte.length;
            if (cc <= 256 && forbidPlte == false) {
              if (cc <= 2) depth = 1;
              else if (cc <= 4) depth = 2;
              else if (cc <= 16) depth = 4;
              else depth = 8;
              if (forGIF) depth = 8;
              gotAlpha = true;
            }
            var frms = [];
            for (var j = 0; j < bufs.length; j++) {
              var cimg = new Uint8Array(bufs[j]), cimg32 = new Uint32Array(cimg.buffer);
              var nx = 0, ny = 0, nw = w, nh = h, blend = 0;
              if (j != 0 && !brute) {
                var tlim = forGIF || j == 1 || frms[frms.length - 2].dispose == 2 ? 1 : 2, tstp = 0, tarea = 1e9;
                for (var it = 0; it < tlim; it++) {
                  var pimg = new Uint8Array(bufs[j - 1 - it]), p32 = new Uint32Array(bufs[j - 1 - it]);
                  var mix = w, miy = h, max = -1, may = -1;
                  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
                    var i = y * w + x;
                    if (cimg32[i] != p32[i]) {
                      if (x < mix) mix = x;
                      if (x > max) max = x;
                      if (y < miy) miy = y;
                      if (y > may) may = y;
                    }
                  }
                  var sarea = max == -1 ? 1 : (max - mix + 1) * (may - miy + 1);
                  if (sarea < tarea) {
                    tarea = sarea;
                    tstp = it;
                    if (max == -1) {
                      nx = ny = 0;
                      nw = nh = 1;
                    } else {
                      nx = mix;
                      ny = miy;
                      nw = max - mix + 1;
                      nh = may - miy + 1;
                    }
                  }
                }
                var pimg = new Uint8Array(bufs[j - 1 - tstp]);
                if (tstp == 1) frms[frms.length - 1].dispose = 2;
                var nimg = new Uint8Array(nw * nh * 4), nimg32 = new Uint32Array(nimg.buffer);
                UPNG3._copyTile(pimg, w, h, nimg, nw, nh, -nx, -ny, 0);
                if (UPNG3._copyTile(cimg, w, h, nimg, nw, nh, -nx, -ny, 3)) {
                  UPNG3._copyTile(cimg, w, h, nimg, nw, nh, -nx, -ny, 2);
                  blend = 1;
                } else {
                  UPNG3._copyTile(cimg, w, h, nimg, nw, nh, -nx, -ny, 0);
                  blend = 0;
                }
                cimg = nimg;
                cimg32 = new Uint32Array(cimg.buffer);
              }
              var bpl = 4 * nw;
              if (cc <= 256 && forbidPlte == false) {
                bpl = Math.ceil(depth * nw / 8);
                var nimg = new Uint8Array(bpl * nh);
                for (var y = 0; y < nh; y++) {
                  var i = y * bpl, ii = y * nw;
                  if (depth == 8) for (var x = 0; x < nw; x++) nimg[i + x] = cmap[cimg32[ii + x]];
                  else if (depth == 4) for (var x = 0; x < nw; x++) nimg[i + (x >> 1)] |= cmap[cimg32[ii + x]] << 4 - (x & 1) * 4;
                  else if (depth == 2) for (var x = 0; x < nw; x++) nimg[i + (x >> 2)] |= cmap[cimg32[ii + x]] << 6 - (x & 3) * 2;
                  else if (depth == 1) for (var x = 0; x < nw; x++) nimg[i + (x >> 3)] |= cmap[cimg32[ii + x]] << 7 - (x & 7) * 1;
                }
                cimg = nimg;
                ctype = 3;
                bpp = 1;
              } else if (gotAlpha == false && bufs.length == 1) {
                var nimg = new Uint8Array(nw * nh * 3), area = nw * nh;
                for (var i = 0; i < area; i++) {
                  var ti = i * 3, qi = i * 4;
                  nimg[ti] = cimg[qi];
                  nimg[ti + 1] = cimg[qi + 1];
                  nimg[ti + 2] = cimg[qi + 2];
                }
                cimg = nimg;
                ctype = 2;
                bpp = 3;
                bpl = 3 * nw;
              }
              frms.push({ rect: { x: nx, y: ny, width: nw, height: nh }, img: cimg, bpl, bpp, blend, dispose: brute ? 1 : 0 });
            }
            return { ctype, depth, plte, gotAlpha, frames: frms };
          };
          UPNG3.encode._filterZero = function(img, h, bpp, bpl, data) {
            var fls = [];
            for (var t = 0; t < 5; t++) {
              if (h * bpl > 5e5 && (t == 2 || t == 3 || t == 4)) continue;
              for (var y = 0; y < h; y++) UPNG3.encode._filterLine(data, img, y, bpl, bpp, t);
              fls.push(pako2["deflate"](data));
              if (bpp == 1) break;
            }
            var ti, tsize = 1e9;
            for (var i = 0; i < fls.length; i++) if (fls[i].length < tsize) {
              ti = i;
              tsize = fls[i].length;
            }
            return fls[ti];
          };
          UPNG3.encode._filterLine = function(data, img, y, bpl, bpp, type) {
            var i = y * bpl, di = i + y, paeth = UPNG3.decode._paeth;
            data[di] = type;
            di++;
            if (type == 0) for (var x = 0; x < bpl; x++) data[di + x] = img[i + x];
            else if (type == 1) {
              for (var x = 0; x < bpp; x++) data[di + x] = img[i + x];
              for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] - img[i + x - bpp] + 256 & 255;
            } else if (y == 0) {
              for (var x = 0; x < bpp; x++) data[di + x] = img[i + x];
              if (type == 2) for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x];
              if (type == 3) for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] - (img[i + x - bpp] >> 1) + 256 & 255;
              if (type == 4) for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] - paeth(img[i + x - bpp], 0, 0) + 256 & 255;
            } else {
              if (type == 2) {
                for (var x = 0; x < bpl; x++) data[di + x] = img[i + x] + 256 - img[i + x - bpl] & 255;
              }
              if (type == 3) {
                for (var x = 0; x < bpp; x++) data[di + x] = img[i + x] + 256 - (img[i + x - bpl] >> 1) & 255;
                for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] + 256 - (img[i + x - bpl] + img[i + x - bpp] >> 1) & 255;
              }
              if (type == 4) {
                for (var x = 0; x < bpp; x++) data[di + x] = img[i + x] + 256 - paeth(0, img[i + x - bpl], 0) & 255;
                for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] + 256 - paeth(img[i + x - bpp], img[i + x - bpl], img[i + x - bpp - bpl]) & 255;
              }
            }
          };
          UPNG3.crc = {
            table: (function() {
              var tab = new Uint32Array(256);
              for (var n = 0; n < 256; n++) {
                var c = n;
                for (var k = 0; k < 8; k++) {
                  if (c & 1) c = 3988292384 ^ c >>> 1;
                  else c = c >>> 1;
                }
                tab[n] = c;
              }
              return tab;
            })(),
            update: function(c, buf, off, len) {
              for (var i = 0; i < len; i++) c = UPNG3.crc.table[(c ^ buf[off + i]) & 255] ^ c >>> 8;
              return c;
            },
            crc: function(b, o, l) {
              return UPNG3.crc.update(4294967295, b, o, l) ^ 4294967295;
            }
          };
          UPNG3.quantize = function(bufs, ps, roundAlpha) {
            var imgs = [], totl = 0;
            for (var i = 0; i < bufs.length; i++) {
              imgs.push(UPNG3.encode.alphaMul(new Uint8Array(bufs[i]), roundAlpha));
              totl += bufs[i].byteLength;
            }
            var nimg = new Uint8Array(totl), nimg32 = new Uint32Array(nimg.buffer), noff = 0;
            for (var i = 0; i < imgs.length; i++) {
              var img = imgs[i], il = img.length;
              for (var j = 0; j < il; j++) nimg[noff + j] = img[j];
              noff += il;
            }
            var root = { i0: 0, i1: nimg.length, bst: null, est: null, tdst: 0, left: null, right: null };
            root.bst = UPNG3.quantize.stats(nimg, root.i0, root.i1);
            root.est = UPNG3.quantize.estats(root.bst);
            var leafs = [root];
            while (leafs.length < ps) {
              var maxL = 0, mi = 0;
              for (var i = 0; i < leafs.length; i++) if (leafs[i].est.L > maxL) {
                maxL = leafs[i].est.L;
                mi = i;
              }
              if (maxL < 1e-3) break;
              var node = leafs[mi];
              var s0 = UPNG3.quantize.splitPixels(nimg, nimg32, node.i0, node.i1, node.est.e, node.est.eMq255);
              var ln = { i0: node.i0, i1: s0, bst: null, est: null, tdst: 0, left: null, right: null };
              ln.bst = UPNG3.quantize.stats(nimg, ln.i0, ln.i1);
              ln.est = UPNG3.quantize.estats(ln.bst);
              var rn = { i0: s0, i1: node.i1, bst: null, est: null, tdst: 0, left: null, right: null };
              rn.bst = { R: [], m: [], N: node.bst.N - ln.bst.N };
              for (var i = 0; i < 16; i++) rn.bst.R[i] = node.bst.R[i] - ln.bst.R[i];
              for (var i = 0; i < 4; i++) rn.bst.m[i] = node.bst.m[i] - ln.bst.m[i];
              rn.est = UPNG3.quantize.estats(rn.bst);
              node.left = ln;
              node.right = rn;
              leafs[mi] = ln;
              leafs.push(rn);
            }
            leafs.sort(function(a2, b2) {
              return b2.bst.N - a2.bst.N;
            });
            for (var ii = 0; ii < imgs.length; ii++) {
              var planeDst = UPNG3.quantize.planeDst;
              var sb = new Uint8Array(imgs[ii].buffer), tb = new Uint32Array(imgs[ii].buffer), len = sb.length;
              var stack = [], si = 0;
              for (var i = 0; i < len; i += 4) {
                var r = sb[i] * (1 / 255), g = sb[i + 1] * (1 / 255), b = sb[i + 2] * (1 / 255), a = sb[i + 3] * (1 / 255);
                var nd = root;
                while (nd.left) nd = planeDst(nd.est, r, g, b, a) <= 0 ? nd.left : nd.right;
                tb[i >> 2] = nd.est.rgba;
              }
              imgs[ii] = tb.buffer;
            }
            return { bufs: imgs, plte: leafs };
          };
          UPNG3.quantize.getNearest = function(nd, r, g, b, a) {
            if (nd.left == null) {
              nd.tdst = UPNG3.quantize.dist(nd.est.q, r, g, b, a);
              return nd;
            }
            var planeDst = UPNG3.quantize.planeDst(nd.est, r, g, b, a);
            var node0 = nd.left, node1 = nd.right;
            if (planeDst > 0) {
              node0 = nd.right;
              node1 = nd.left;
            }
            var ln = UPNG3.quantize.getNearest(node0, r, g, b, a);
            if (ln.tdst <= planeDst * planeDst) return ln;
            var rn = UPNG3.quantize.getNearest(node1, r, g, b, a);
            return rn.tdst < ln.tdst ? rn : ln;
          };
          UPNG3.quantize.planeDst = function(est, r, g, b, a) {
            var e = est.e;
            return e[0] * r + e[1] * g + e[2] * b + e[3] * a - est.eMq;
          };
          UPNG3.quantize.dist = function(q, r, g, b, a) {
            var d0 = r - q[0], d1 = g - q[1], d2 = b - q[2], d3 = a - q[3];
            return d0 * d0 + d1 * d1 + d2 * d2 + d3 * d3;
          };
          UPNG3.quantize.splitPixels = function(nimg, nimg32, i0, i1, e, eMq) {
            var vecDot = UPNG3.quantize.vecDot;
            i1 -= 4;
            var shfs = 0;
            while (i0 < i1) {
              while (vecDot(nimg, i0, e) <= eMq) i0 += 4;
              while (vecDot(nimg, i1, e) > eMq) i1 -= 4;
              if (i0 >= i1) break;
              var t = nimg32[i0 >> 2];
              nimg32[i0 >> 2] = nimg32[i1 >> 2];
              nimg32[i1 >> 2] = t;
              i0 += 4;
              i1 -= 4;
            }
            while (vecDot(nimg, i0, e) > eMq) i0 -= 4;
            return i0 + 4;
          };
          UPNG3.quantize.vecDot = function(nimg, i, e) {
            return nimg[i] * e[0] + nimg[i + 1] * e[1] + nimg[i + 2] * e[2] + nimg[i + 3] * e[3];
          };
          UPNG3.quantize.stats = function(nimg, i0, i1) {
            var R = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            var m = [0, 0, 0, 0];
            var N = i1 - i0 >> 2;
            for (var i = i0; i < i1; i += 4) {
              var r = nimg[i] * (1 / 255), g = nimg[i + 1] * (1 / 255), b = nimg[i + 2] * (1 / 255), a = nimg[i + 3] * (1 / 255);
              m[0] += r;
              m[1] += g;
              m[2] += b;
              m[3] += a;
              R[0] += r * r;
              R[1] += r * g;
              R[2] += r * b;
              R[3] += r * a;
              R[5] += g * g;
              R[6] += g * b;
              R[7] += g * a;
              R[10] += b * b;
              R[11] += b * a;
              R[15] += a * a;
            }
            R[4] = R[1];
            R[8] = R[2];
            R[12] = R[3];
            R[9] = R[6];
            R[13] = R[7];
            R[14] = R[11];
            return { R, m, N };
          };
          UPNG3.quantize.estats = function(stats) {
            var R = stats.R, m = stats.m, N = stats.N;
            var m0 = m[0], m1 = m[1], m2 = m[2], m3 = m[3], iN = N == 0 ? 0 : 1 / N;
            var Rj = [
              R[0] - m0 * m0 * iN,
              R[1] - m0 * m1 * iN,
              R[2] - m0 * m2 * iN,
              R[3] - m0 * m3 * iN,
              R[4] - m1 * m0 * iN,
              R[5] - m1 * m1 * iN,
              R[6] - m1 * m2 * iN,
              R[7] - m1 * m3 * iN,
              R[8] - m2 * m0 * iN,
              R[9] - m2 * m1 * iN,
              R[10] - m2 * m2 * iN,
              R[11] - m2 * m3 * iN,
              R[12] - m3 * m0 * iN,
              R[13] - m3 * m1 * iN,
              R[14] - m3 * m2 * iN,
              R[15] - m3 * m3 * iN
            ];
            var A = Rj, M = UPNG3.M4;
            var b = [0.5, 0.5, 0.5, 0.5], mi = 0, tmi = 0;
            if (N != 0)
              for (var i = 0; i < 10; i++) {
                b = M.multVec(A, b);
                tmi = Math.sqrt(M.dot(b, b));
                b = M.sml(1 / tmi, b);
                if (Math.abs(tmi - mi) < 1e-9) break;
                mi = tmi;
              }
            var q = [m0 * iN, m1 * iN, m2 * iN, m3 * iN];
            var eMq255 = M.dot(M.sml(255, q), b);
            var ia = q[3] < 1e-3 ? 0 : 1 / q[3];
            return {
              Cov: Rj,
              q,
              e: b,
              L: mi,
              eMq255,
              eMq: M.dot(b, q),
              rgba: (Math.round(255 * q[3]) << 24 | Math.round(255 * q[2] * ia) << 16 | Math.round(255 * q[1] * ia) << 8 | Math.round(255 * q[0] * ia) << 0) >>> 0
            };
          };
          UPNG3.M4 = {
            multVec: function(m, v) {
              return [
                m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3] * v[3],
                m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[7] * v[3],
                m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[11] * v[3],
                m[12] * v[0] + m[13] * v[1] + m[14] * v[2] + m[15] * v[3]
              ];
            },
            dot: function(x, y) {
              return x[0] * y[0] + x[1] * y[1] + x[2] * y[2] + x[3] * y[3];
            },
            sml: function(a, y) {
              return [a * y[0], a * y[1], a * y[2], a * y[3]];
            }
          };
          UPNG3.encode.alphaMul = function(img, roundA) {
            var nimg = new Uint8Array(img.length), area = img.length >> 2;
            for (var i = 0; i < area; i++) {
              var qi = i << 2, ia = img[qi + 3];
              if (roundA) ia = ia < 128 ? 0 : 255;
              var a = ia * (1 / 255);
              nimg[qi + 0] = img[qi + 0] * a;
              nimg[qi + 1] = img[qi + 1] * a;
              nimg[qi + 2] = img[qi + 2] * a;
              nimg[qi + 3] = ia;
            }
            return nimg;
          };
        })(UPNG2, pako);
      })();
    }
  });

  // node_modules/jpeg-js/lib/encoder.js
  var require_encoder = __commonJS({
    "node_modules/jpeg-js/lib/encoder.js"(exports, module) {
      var btoa = btoa || function(buf) {
        return Buffer.from(buf).toString("base64");
      };
      function JPEGEncoder(quality) {
        var self = this;
        var fround = Math.round;
        var ffloor = Math.floor;
        var YTable = new Array(64);
        var UVTable = new Array(64);
        var fdtbl_Y = new Array(64);
        var fdtbl_UV = new Array(64);
        var YDC_HT;
        var UVDC_HT;
        var YAC_HT;
        var UVAC_HT;
        var bitcode = new Array(65535);
        var category = new Array(65535);
        var outputfDCTQuant = new Array(64);
        var DU = new Array(64);
        var byteout = [];
        var bytenew = 0;
        var bytepos = 7;
        var YDU = new Array(64);
        var UDU = new Array(64);
        var VDU = new Array(64);
        var clt = new Array(256);
        var RGB_YUV_TABLE = new Array(2048);
        var currentQuality;
        var ZigZag = [
          0,
          1,
          5,
          6,
          14,
          15,
          27,
          28,
          2,
          4,
          7,
          13,
          16,
          26,
          29,
          42,
          3,
          8,
          12,
          17,
          25,
          30,
          41,
          43,
          9,
          11,
          18,
          24,
          31,
          40,
          44,
          53,
          10,
          19,
          23,
          32,
          39,
          45,
          52,
          54,
          20,
          22,
          33,
          38,
          46,
          51,
          55,
          60,
          21,
          34,
          37,
          47,
          50,
          56,
          59,
          61,
          35,
          36,
          48,
          49,
          57,
          58,
          62,
          63
        ];
        var std_dc_luminance_nrcodes = [0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
        var std_dc_luminance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        var std_ac_luminance_nrcodes = [0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 125];
        var std_ac_luminance_values = [
          1,
          2,
          3,
          0,
          4,
          17,
          5,
          18,
          33,
          49,
          65,
          6,
          19,
          81,
          97,
          7,
          34,
          113,
          20,
          50,
          129,
          145,
          161,
          8,
          35,
          66,
          177,
          193,
          21,
          82,
          209,
          240,
          36,
          51,
          98,
          114,
          130,
          9,
          10,
          22,
          23,
          24,
          25,
          26,
          37,
          38,
          39,
          40,
          41,
          42,
          52,
          53,
          54,
          55,
          56,
          57,
          58,
          67,
          68,
          69,
          70,
          71,
          72,
          73,
          74,
          83,
          84,
          85,
          86,
          87,
          88,
          89,
          90,
          99,
          100,
          101,
          102,
          103,
          104,
          105,
          106,
          115,
          116,
          117,
          118,
          119,
          120,
          121,
          122,
          131,
          132,
          133,
          134,
          135,
          136,
          137,
          138,
          146,
          147,
          148,
          149,
          150,
          151,
          152,
          153,
          154,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          178,
          179,
          180,
          181,
          182,
          183,
          184,
          185,
          186,
          194,
          195,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          210,
          211,
          212,
          213,
          214,
          215,
          216,
          217,
          218,
          225,
          226,
          227,
          228,
          229,
          230,
          231,
          232,
          233,
          234,
          241,
          242,
          243,
          244,
          245,
          246,
          247,
          248,
          249,
          250
        ];
        var std_dc_chrominance_nrcodes = [0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
        var std_dc_chrominance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        var std_ac_chrominance_nrcodes = [0, 0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 119];
        var std_ac_chrominance_values = [
          0,
          1,
          2,
          3,
          17,
          4,
          5,
          33,
          49,
          6,
          18,
          65,
          81,
          7,
          97,
          113,
          19,
          34,
          50,
          129,
          8,
          20,
          66,
          145,
          161,
          177,
          193,
          9,
          35,
          51,
          82,
          240,
          21,
          98,
          114,
          209,
          10,
          22,
          36,
          52,
          225,
          37,
          241,
          23,
          24,
          25,
          26,
          38,
          39,
          40,
          41,
          42,
          53,
          54,
          55,
          56,
          57,
          58,
          67,
          68,
          69,
          70,
          71,
          72,
          73,
          74,
          83,
          84,
          85,
          86,
          87,
          88,
          89,
          90,
          99,
          100,
          101,
          102,
          103,
          104,
          105,
          106,
          115,
          116,
          117,
          118,
          119,
          120,
          121,
          122,
          130,
          131,
          132,
          133,
          134,
          135,
          136,
          137,
          138,
          146,
          147,
          148,
          149,
          150,
          151,
          152,
          153,
          154,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          178,
          179,
          180,
          181,
          182,
          183,
          184,
          185,
          186,
          194,
          195,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          210,
          211,
          212,
          213,
          214,
          215,
          216,
          217,
          218,
          226,
          227,
          228,
          229,
          230,
          231,
          232,
          233,
          234,
          242,
          243,
          244,
          245,
          246,
          247,
          248,
          249,
          250
        ];
        function initQuantTables(sf) {
          var YQT = [
            16,
            11,
            10,
            16,
            24,
            40,
            51,
            61,
            12,
            12,
            14,
            19,
            26,
            58,
            60,
            55,
            14,
            13,
            16,
            24,
            40,
            57,
            69,
            56,
            14,
            17,
            22,
            29,
            51,
            87,
            80,
            62,
            18,
            22,
            37,
            56,
            68,
            109,
            103,
            77,
            24,
            35,
            55,
            64,
            81,
            104,
            113,
            92,
            49,
            64,
            78,
            87,
            103,
            121,
            120,
            101,
            72,
            92,
            95,
            98,
            112,
            100,
            103,
            99
          ];
          for (var i = 0; i < 64; i++) {
            var t = ffloor((YQT[i] * sf + 50) / 100);
            if (t < 1) {
              t = 1;
            } else if (t > 255) {
              t = 255;
            }
            YTable[ZigZag[i]] = t;
          }
          var UVQT = [
            17,
            18,
            24,
            47,
            99,
            99,
            99,
            99,
            18,
            21,
            26,
            66,
            99,
            99,
            99,
            99,
            24,
            26,
            56,
            99,
            99,
            99,
            99,
            99,
            47,
            66,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99,
            99
          ];
          for (var j = 0; j < 64; j++) {
            var u = ffloor((UVQT[j] * sf + 50) / 100);
            if (u < 1) {
              u = 1;
            } else if (u > 255) {
              u = 255;
            }
            UVTable[ZigZag[j]] = u;
          }
          var aasf = [
            1,
            1.387039845,
            1.306562965,
            1.175875602,
            1,
            0.785694958,
            0.5411961,
            0.275899379
          ];
          var k = 0;
          for (var row = 0; row < 8; row++) {
            for (var col = 0; col < 8; col++) {
              fdtbl_Y[k] = 1 / (YTable[ZigZag[k]] * aasf[row] * aasf[col] * 8);
              fdtbl_UV[k] = 1 / (UVTable[ZigZag[k]] * aasf[row] * aasf[col] * 8);
              k++;
            }
          }
        }
        function computeHuffmanTbl(nrcodes, std_table) {
          var codevalue = 0;
          var pos_in_table = 0;
          var HT = new Array();
          for (var k = 1; k <= 16; k++) {
            for (var j = 1; j <= nrcodes[k]; j++) {
              HT[std_table[pos_in_table]] = [];
              HT[std_table[pos_in_table]][0] = codevalue;
              HT[std_table[pos_in_table]][1] = k;
              pos_in_table++;
              codevalue++;
            }
            codevalue *= 2;
          }
          return HT;
        }
        function initHuffmanTbl() {
          YDC_HT = computeHuffmanTbl(std_dc_luminance_nrcodes, std_dc_luminance_values);
          UVDC_HT = computeHuffmanTbl(std_dc_chrominance_nrcodes, std_dc_chrominance_values);
          YAC_HT = computeHuffmanTbl(std_ac_luminance_nrcodes, std_ac_luminance_values);
          UVAC_HT = computeHuffmanTbl(std_ac_chrominance_nrcodes, std_ac_chrominance_values);
        }
        function initCategoryNumber() {
          var nrlower = 1;
          var nrupper = 2;
          for (var cat = 1; cat <= 15; cat++) {
            for (var nr = nrlower; nr < nrupper; nr++) {
              category[32767 + nr] = cat;
              bitcode[32767 + nr] = [];
              bitcode[32767 + nr][1] = cat;
              bitcode[32767 + nr][0] = nr;
            }
            for (var nrneg = -(nrupper - 1); nrneg <= -nrlower; nrneg++) {
              category[32767 + nrneg] = cat;
              bitcode[32767 + nrneg] = [];
              bitcode[32767 + nrneg][1] = cat;
              bitcode[32767 + nrneg][0] = nrupper - 1 + nrneg;
            }
            nrlower <<= 1;
            nrupper <<= 1;
          }
        }
        function initRGBYUVTable() {
          for (var i = 0; i < 256; i++) {
            RGB_YUV_TABLE[i] = 19595 * i;
            RGB_YUV_TABLE[i + 256 >> 0] = 38470 * i;
            RGB_YUV_TABLE[i + 512 >> 0] = 7471 * i + 32768;
            RGB_YUV_TABLE[i + 768 >> 0] = -11059 * i;
            RGB_YUV_TABLE[i + 1024 >> 0] = -21709 * i;
            RGB_YUV_TABLE[i + 1280 >> 0] = 32768 * i + 8421375;
            RGB_YUV_TABLE[i + 1536 >> 0] = -27439 * i;
            RGB_YUV_TABLE[i + 1792 >> 0] = -5329 * i;
          }
        }
        function writeBits(bs) {
          var value = bs[0];
          var posval = bs[1] - 1;
          while (posval >= 0) {
            if (value & 1 << posval) {
              bytenew |= 1 << bytepos;
            }
            posval--;
            bytepos--;
            if (bytepos < 0) {
              if (bytenew == 255) {
                writeByte(255);
                writeByte(0);
              } else {
                writeByte(bytenew);
              }
              bytepos = 7;
              bytenew = 0;
            }
          }
        }
        function writeByte(value) {
          byteout.push(value);
        }
        function writeWord(value) {
          writeByte(value >> 8 & 255);
          writeByte(value & 255);
        }
        function fDCTQuant(data, fdtbl) {
          var d0, d1, d2, d3, d4, d5, d6, d7;
          var dataOff = 0;
          var i;
          var I8 = 8;
          var I64 = 64;
          for (i = 0; i < I8; ++i) {
            d0 = data[dataOff];
            d1 = data[dataOff + 1];
            d2 = data[dataOff + 2];
            d3 = data[dataOff + 3];
            d4 = data[dataOff + 4];
            d5 = data[dataOff + 5];
            d6 = data[dataOff + 6];
            d7 = data[dataOff + 7];
            var tmp0 = d0 + d7;
            var tmp7 = d0 - d7;
            var tmp1 = d1 + d6;
            var tmp6 = d1 - d6;
            var tmp2 = d2 + d5;
            var tmp5 = d2 - d5;
            var tmp3 = d3 + d4;
            var tmp4 = d3 - d4;
            var tmp10 = tmp0 + tmp3;
            var tmp13 = tmp0 - tmp3;
            var tmp11 = tmp1 + tmp2;
            var tmp12 = tmp1 - tmp2;
            data[dataOff] = tmp10 + tmp11;
            data[dataOff + 4] = tmp10 - tmp11;
            var z1 = (tmp12 + tmp13) * 0.707106781;
            data[dataOff + 2] = tmp13 + z1;
            data[dataOff + 6] = tmp13 - z1;
            tmp10 = tmp4 + tmp5;
            tmp11 = tmp5 + tmp6;
            tmp12 = tmp6 + tmp7;
            var z5 = (tmp10 - tmp12) * 0.382683433;
            var z2 = 0.5411961 * tmp10 + z5;
            var z4 = 1.306562965 * tmp12 + z5;
            var z3 = tmp11 * 0.707106781;
            var z11 = tmp7 + z3;
            var z13 = tmp7 - z3;
            data[dataOff + 5] = z13 + z2;
            data[dataOff + 3] = z13 - z2;
            data[dataOff + 1] = z11 + z4;
            data[dataOff + 7] = z11 - z4;
            dataOff += 8;
          }
          dataOff = 0;
          for (i = 0; i < I8; ++i) {
            d0 = data[dataOff];
            d1 = data[dataOff + 8];
            d2 = data[dataOff + 16];
            d3 = data[dataOff + 24];
            d4 = data[dataOff + 32];
            d5 = data[dataOff + 40];
            d6 = data[dataOff + 48];
            d7 = data[dataOff + 56];
            var tmp0p2 = d0 + d7;
            var tmp7p2 = d0 - d7;
            var tmp1p2 = d1 + d6;
            var tmp6p2 = d1 - d6;
            var tmp2p2 = d2 + d5;
            var tmp5p2 = d2 - d5;
            var tmp3p2 = d3 + d4;
            var tmp4p2 = d3 - d4;
            var tmp10p2 = tmp0p2 + tmp3p2;
            var tmp13p2 = tmp0p2 - tmp3p2;
            var tmp11p2 = tmp1p2 + tmp2p2;
            var tmp12p2 = tmp1p2 - tmp2p2;
            data[dataOff] = tmp10p2 + tmp11p2;
            data[dataOff + 32] = tmp10p2 - tmp11p2;
            var z1p2 = (tmp12p2 + tmp13p2) * 0.707106781;
            data[dataOff + 16] = tmp13p2 + z1p2;
            data[dataOff + 48] = tmp13p2 - z1p2;
            tmp10p2 = tmp4p2 + tmp5p2;
            tmp11p2 = tmp5p2 + tmp6p2;
            tmp12p2 = tmp6p2 + tmp7p2;
            var z5p2 = (tmp10p2 - tmp12p2) * 0.382683433;
            var z2p2 = 0.5411961 * tmp10p2 + z5p2;
            var z4p2 = 1.306562965 * tmp12p2 + z5p2;
            var z3p2 = tmp11p2 * 0.707106781;
            var z11p2 = tmp7p2 + z3p2;
            var z13p2 = tmp7p2 - z3p2;
            data[dataOff + 40] = z13p2 + z2p2;
            data[dataOff + 24] = z13p2 - z2p2;
            data[dataOff + 8] = z11p2 + z4p2;
            data[dataOff + 56] = z11p2 - z4p2;
            dataOff++;
          }
          var fDCTQuant2;
          for (i = 0; i < I64; ++i) {
            fDCTQuant2 = data[i] * fdtbl[i];
            outputfDCTQuant[i] = fDCTQuant2 > 0 ? fDCTQuant2 + 0.5 | 0 : fDCTQuant2 - 0.5 | 0;
          }
          return outputfDCTQuant;
        }
        function writeAPP0() {
          writeWord(65504);
          writeWord(16);
          writeByte(74);
          writeByte(70);
          writeByte(73);
          writeByte(70);
          writeByte(0);
          writeByte(1);
          writeByte(1);
          writeByte(0);
          writeWord(1);
          writeWord(1);
          writeByte(0);
          writeByte(0);
        }
        function writeAPP1(exifBuffer) {
          if (!exifBuffer) return;
          writeWord(65505);
          if (exifBuffer[0] === 69 && exifBuffer[1] === 120 && exifBuffer[2] === 105 && exifBuffer[3] === 102) {
            writeWord(exifBuffer.length + 2);
          } else {
            writeWord(exifBuffer.length + 5 + 2);
            writeByte(69);
            writeByte(120);
            writeByte(105);
            writeByte(102);
            writeByte(0);
          }
          for (var i = 0; i < exifBuffer.length; i++) {
            writeByte(exifBuffer[i]);
          }
        }
        function writeSOF0(width, height) {
          writeWord(65472);
          writeWord(17);
          writeByte(8);
          writeWord(height);
          writeWord(width);
          writeByte(3);
          writeByte(1);
          writeByte(17);
          writeByte(0);
          writeByte(2);
          writeByte(17);
          writeByte(1);
          writeByte(3);
          writeByte(17);
          writeByte(1);
        }
        function writeDQT() {
          writeWord(65499);
          writeWord(132);
          writeByte(0);
          for (var i = 0; i < 64; i++) {
            writeByte(YTable[i]);
          }
          writeByte(1);
          for (var j = 0; j < 64; j++) {
            writeByte(UVTable[j]);
          }
        }
        function writeDHT() {
          writeWord(65476);
          writeWord(418);
          writeByte(0);
          for (var i = 0; i < 16; i++) {
            writeByte(std_dc_luminance_nrcodes[i + 1]);
          }
          for (var j = 0; j <= 11; j++) {
            writeByte(std_dc_luminance_values[j]);
          }
          writeByte(16);
          for (var k = 0; k < 16; k++) {
            writeByte(std_ac_luminance_nrcodes[k + 1]);
          }
          for (var l = 0; l <= 161; l++) {
            writeByte(std_ac_luminance_values[l]);
          }
          writeByte(1);
          for (var m = 0; m < 16; m++) {
            writeByte(std_dc_chrominance_nrcodes[m + 1]);
          }
          for (var n = 0; n <= 11; n++) {
            writeByte(std_dc_chrominance_values[n]);
          }
          writeByte(17);
          for (var o = 0; o < 16; o++) {
            writeByte(std_ac_chrominance_nrcodes[o + 1]);
          }
          for (var p = 0; p <= 161; p++) {
            writeByte(std_ac_chrominance_values[p]);
          }
        }
        function writeCOM(comments) {
          if (typeof comments === "undefined" || comments.constructor !== Array) return;
          comments.forEach((e) => {
            if (typeof e !== "string") return;
            writeWord(65534);
            var l = e.length;
            writeWord(l + 2);
            var i;
            for (i = 0; i < l; i++)
              writeByte(e.charCodeAt(i));
          });
        }
        function writeSOS() {
          writeWord(65498);
          writeWord(12);
          writeByte(3);
          writeByte(1);
          writeByte(0);
          writeByte(2);
          writeByte(17);
          writeByte(3);
          writeByte(17);
          writeByte(0);
          writeByte(63);
          writeByte(0);
        }
        function processDU(CDU, fdtbl, DC, HTDC, HTAC) {
          var EOB = HTAC[0];
          var M16zeroes = HTAC[240];
          var pos;
          var I16 = 16;
          var I63 = 63;
          var I64 = 64;
          var DU_DCT = fDCTQuant(CDU, fdtbl);
          for (var j = 0; j < I64; ++j) {
            DU[ZigZag[j]] = DU_DCT[j];
          }
          var Diff = DU[0] - DC;
          DC = DU[0];
          if (Diff == 0) {
            writeBits(HTDC[0]);
          } else {
            pos = 32767 + Diff;
            writeBits(HTDC[category[pos]]);
            writeBits(bitcode[pos]);
          }
          var end0pos = 63;
          for (; end0pos > 0 && DU[end0pos] == 0; end0pos--) {
          }
          ;
          if (end0pos == 0) {
            writeBits(EOB);
            return DC;
          }
          var i = 1;
          var lng;
          while (i <= end0pos) {
            var startpos = i;
            for (; DU[i] == 0 && i <= end0pos; ++i) {
            }
            var nrzeroes = i - startpos;
            if (nrzeroes >= I16) {
              lng = nrzeroes >> 4;
              for (var nrmarker = 1; nrmarker <= lng; ++nrmarker)
                writeBits(M16zeroes);
              nrzeroes = nrzeroes & 15;
            }
            pos = 32767 + DU[i];
            writeBits(HTAC[(nrzeroes << 4) + category[pos]]);
            writeBits(bitcode[pos]);
            i++;
          }
          if (end0pos != I63) {
            writeBits(EOB);
          }
          return DC;
        }
        function initCharLookupTable() {
          var sfcc = String.fromCharCode;
          for (var i = 0; i < 256; i++) {
            clt[i] = sfcc(i);
          }
        }
        this.encode = function(image, quality2) {
          var time_start = (/* @__PURE__ */ new Date()).getTime();
          if (quality2) setQuality(quality2);
          byteout = new Array();
          bytenew = 0;
          bytepos = 7;
          writeWord(65496);
          writeAPP0();
          writeCOM(image.comments);
          writeAPP1(image.exifBuffer);
          writeDQT();
          writeSOF0(image.width, image.height);
          writeDHT();
          writeSOS();
          var DCY = 0;
          var DCU = 0;
          var DCV = 0;
          bytenew = 0;
          bytepos = 7;
          this.encode.displayName = "_encode_";
          var imageData = image.data;
          var width = image.width;
          var height = image.height;
          var quadWidth = width * 4;
          var tripleWidth = width * 3;
          var x, y = 0;
          var r, g, b;
          var start, p, col, row, pos;
          while (y < height) {
            x = 0;
            while (x < quadWidth) {
              start = quadWidth * y + x;
              p = start;
              col = -1;
              row = 0;
              for (pos = 0; pos < 64; pos++) {
                row = pos >> 3;
                col = (pos & 7) * 4;
                p = start + row * quadWidth + col;
                if (y + row >= height) {
                  p -= quadWidth * (y + 1 + row - height);
                }
                if (x + col >= quadWidth) {
                  p -= x + col - quadWidth + 4;
                }
                r = imageData[p++];
                g = imageData[p++];
                b = imageData[p++];
                YDU[pos] = (RGB_YUV_TABLE[r] + RGB_YUV_TABLE[g + 256 >> 0] + RGB_YUV_TABLE[b + 512 >> 0] >> 16) - 128;
                UDU[pos] = (RGB_YUV_TABLE[r + 768 >> 0] + RGB_YUV_TABLE[g + 1024 >> 0] + RGB_YUV_TABLE[b + 1280 >> 0] >> 16) - 128;
                VDU[pos] = (RGB_YUV_TABLE[r + 1280 >> 0] + RGB_YUV_TABLE[g + 1536 >> 0] + RGB_YUV_TABLE[b + 1792 >> 0] >> 16) - 128;
              }
              DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
              DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
              DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
              x += 32;
            }
            y += 8;
          }
          if (bytepos >= 0) {
            var fillbits = [];
            fillbits[1] = bytepos + 1;
            fillbits[0] = (1 << bytepos + 1) - 1;
            writeBits(fillbits);
          }
          writeWord(65497);
          if (typeof module === "undefined") return new Uint8Array(byteout);
          return Buffer.from(byteout);
          var jpegDataUri = "data:image/jpeg;base64," + btoa(byteout.join(""));
          byteout = [];
          var duration = (/* @__PURE__ */ new Date()).getTime() - time_start;
          return jpegDataUri;
        };
        function setQuality(quality2) {
          if (quality2 <= 0) {
            quality2 = 1;
          }
          if (quality2 > 100) {
            quality2 = 100;
          }
          if (currentQuality == quality2) return;
          var sf = 0;
          if (quality2 < 50) {
            sf = Math.floor(5e3 / quality2);
          } else {
            sf = Math.floor(200 - quality2 * 2);
          }
          initQuantTables(sf);
          currentQuality = quality2;
        }
        function init() {
          var time_start = (/* @__PURE__ */ new Date()).getTime();
          if (!quality) quality = 50;
          initCharLookupTable();
          initHuffmanTbl();
          initCategoryNumber();
          initRGBYUVTable();
          setQuality(quality);
          var duration = (/* @__PURE__ */ new Date()).getTime() - time_start;
        }
        init();
      }
      if (typeof module !== "undefined") {
        module.exports = encode;
      } else if (typeof window !== "undefined") {
        window["jpeg-js"] = window["jpeg-js"] || {};
        window["jpeg-js"].encode = encode;
      }
      function encode(imgData, qu) {
        if (typeof qu === "undefined") qu = 50;
        var encoder = new JPEGEncoder(qu);
        var data = encoder.encode(imgData, qu);
        return {
          data,
          width: imgData.width,
          height: imgData.height
        };
      }
    }
  });

  // node_modules/jpeg-js/lib/decoder.js
  var require_decoder = __commonJS({
    "node_modules/jpeg-js/lib/decoder.js"(exports, module) {
      var JpegImage = (function jpegImage() {
        "use strict";
        var dctZigZag = new Int32Array([
          0,
          1,
          8,
          16,
          9,
          2,
          3,
          10,
          17,
          24,
          32,
          25,
          18,
          11,
          4,
          5,
          12,
          19,
          26,
          33,
          40,
          48,
          41,
          34,
          27,
          20,
          13,
          6,
          7,
          14,
          21,
          28,
          35,
          42,
          49,
          56,
          57,
          50,
          43,
          36,
          29,
          22,
          15,
          23,
          30,
          37,
          44,
          51,
          58,
          59,
          52,
          45,
          38,
          31,
          39,
          46,
          53,
          60,
          61,
          54,
          47,
          55,
          62,
          63
        ]);
        var dctCos1 = 4017;
        var dctSin1 = 799;
        var dctCos3 = 3406;
        var dctSin3 = 2276;
        var dctCos6 = 1567;
        var dctSin6 = 3784;
        var dctSqrt2 = 5793;
        var dctSqrt1d2 = 2896;
        function constructor() {
        }
        function buildHuffmanTable(codeLengths, values) {
          var k = 0, code = [], i, j, length = 16;
          while (length > 0 && !codeLengths[length - 1])
            length--;
          code.push({ children: [], index: 0 });
          var p = code[0], q;
          for (i = 0; i < length; i++) {
            for (j = 0; j < codeLengths[i]; j++) {
              p = code.pop();
              p.children[p.index] = values[k];
              while (p.index > 0) {
                if (code.length === 0)
                  throw new Error("Could not recreate Huffman Table");
                p = code.pop();
              }
              p.index++;
              code.push(p);
              while (code.length <= i) {
                code.push(q = { children: [], index: 0 });
                p.children[p.index] = q.children;
                p = q;
              }
              k++;
            }
            if (i + 1 < length) {
              code.push(q = { children: [], index: 0 });
              p.children[p.index] = q.children;
              p = q;
            }
          }
          return code[0].children;
        }
        function decodeScan(data, offset, frame, components, resetInterval, spectralStart, spectralEnd, successivePrev, successive, opts) {
          var precision = frame.precision;
          var samplesPerLine = frame.samplesPerLine;
          var scanLines = frame.scanLines;
          var mcusPerLine = frame.mcusPerLine;
          var progressive = frame.progressive;
          var maxH = frame.maxH, maxV = frame.maxV;
          var startOffset = offset, bitsData = 0, bitsCount = 0;
          function readBit() {
            if (bitsCount > 0) {
              bitsCount--;
              return bitsData >> bitsCount & 1;
            }
            bitsData = data[offset++];
            if (bitsData == 255) {
              var nextByte = data[offset++];
              if (nextByte) {
                throw new Error("unexpected marker: " + (bitsData << 8 | nextByte).toString(16));
              }
            }
            bitsCount = 7;
            return bitsData >>> 7;
          }
          function decodeHuffman(tree) {
            var node = tree, bit;
            while ((bit = readBit()) !== null) {
              node = node[bit];
              if (typeof node === "number")
                return node;
              if (typeof node !== "object")
                throw new Error("invalid huffman sequence");
            }
            return null;
          }
          function receive(length) {
            var n2 = 0;
            while (length > 0) {
              var bit = readBit();
              if (bit === null) return;
              n2 = n2 << 1 | bit;
              length--;
            }
            return n2;
          }
          function receiveAndExtend(length) {
            var n2 = receive(length);
            if (n2 >= 1 << length - 1)
              return n2;
            return n2 + (-1 << length) + 1;
          }
          function decodeBaseline(component2, zz) {
            var t = decodeHuffman(component2.huffmanTableDC);
            var diff = t === 0 ? 0 : receiveAndExtend(t);
            zz[0] = component2.pred += diff;
            var k2 = 1;
            while (k2 < 64) {
              var rs = decodeHuffman(component2.huffmanTableAC);
              var s = rs & 15, r = rs >> 4;
              if (s === 0) {
                if (r < 15)
                  break;
                k2 += 16;
                continue;
              }
              k2 += r;
              var z = dctZigZag[k2];
              zz[z] = receiveAndExtend(s);
              k2++;
            }
          }
          function decodeDCFirst(component2, zz) {
            var t = decodeHuffman(component2.huffmanTableDC);
            var diff = t === 0 ? 0 : receiveAndExtend(t) << successive;
            zz[0] = component2.pred += diff;
          }
          function decodeDCSuccessive(component2, zz) {
            zz[0] |= readBit() << successive;
          }
          var eobrun = 0;
          function decodeACFirst(component2, zz) {
            if (eobrun > 0) {
              eobrun--;
              return;
            }
            var k2 = spectralStart, e = spectralEnd;
            while (k2 <= e) {
              var rs = decodeHuffman(component2.huffmanTableAC);
              var s = rs & 15, r = rs >> 4;
              if (s === 0) {
                if (r < 15) {
                  eobrun = receive(r) + (1 << r) - 1;
                  break;
                }
                k2 += 16;
                continue;
              }
              k2 += r;
              var z = dctZigZag[k2];
              zz[z] = receiveAndExtend(s) * (1 << successive);
              k2++;
            }
          }
          var successiveACState = 0, successiveACNextValue;
          function decodeACSuccessive(component2, zz) {
            var k2 = spectralStart, e = spectralEnd, r = 0;
            while (k2 <= e) {
              var z = dctZigZag[k2];
              var direction = zz[z] < 0 ? -1 : 1;
              switch (successiveACState) {
                case 0:
                  var rs = decodeHuffman(component2.huffmanTableAC);
                  var s = rs & 15, r = rs >> 4;
                  if (s === 0) {
                    if (r < 15) {
                      eobrun = receive(r) + (1 << r);
                      successiveACState = 4;
                    } else {
                      r = 16;
                      successiveACState = 1;
                    }
                  } else {
                    if (s !== 1)
                      throw new Error("invalid ACn encoding");
                    successiveACNextValue = receiveAndExtend(s);
                    successiveACState = r ? 2 : 3;
                  }
                  continue;
                case 1:
                // skipping r zero items
                case 2:
                  if (zz[z])
                    zz[z] += (readBit() << successive) * direction;
                  else {
                    r--;
                    if (r === 0)
                      successiveACState = successiveACState == 2 ? 3 : 0;
                  }
                  break;
                case 3:
                  if (zz[z])
                    zz[z] += (readBit() << successive) * direction;
                  else {
                    zz[z] = successiveACNextValue << successive;
                    successiveACState = 0;
                  }
                  break;
                case 4:
                  if (zz[z])
                    zz[z] += (readBit() << successive) * direction;
                  break;
              }
              k2++;
            }
            if (successiveACState === 4) {
              eobrun--;
              if (eobrun === 0)
                successiveACState = 0;
            }
          }
          function decodeMcu(component2, decode3, mcu2, row, col) {
            var mcuRow = mcu2 / mcusPerLine | 0;
            var mcuCol = mcu2 % mcusPerLine;
            var blockRow = mcuRow * component2.v + row;
            var blockCol = mcuCol * component2.h + col;
            if (component2.blocks[blockRow] === void 0 && opts.tolerantDecoding)
              return;
            decode3(component2, component2.blocks[blockRow][blockCol]);
          }
          function decodeBlock(component2, decode3, mcu2) {
            var blockRow = mcu2 / component2.blocksPerLine | 0;
            var blockCol = mcu2 % component2.blocksPerLine;
            if (component2.blocks[blockRow] === void 0 && opts.tolerantDecoding)
              return;
            decode3(component2, component2.blocks[blockRow][blockCol]);
          }
          var componentsLength = components.length;
          var component, i, j, k, n;
          var decodeFn;
          if (progressive) {
            if (spectralStart === 0)
              decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
            else
              decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
          } else {
            decodeFn = decodeBaseline;
          }
          var mcu = 0, marker;
          var mcuExpected;
          if (componentsLength == 1) {
            mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
          } else {
            mcuExpected = mcusPerLine * frame.mcusPerColumn;
          }
          if (!resetInterval) resetInterval = mcuExpected;
          var h, v;
          while (mcu < mcuExpected) {
            for (i = 0; i < componentsLength; i++)
              components[i].pred = 0;
            eobrun = 0;
            if (componentsLength == 1) {
              component = components[0];
              for (n = 0; n < resetInterval; n++) {
                decodeBlock(component, decodeFn, mcu);
                mcu++;
              }
            } else {
              for (n = 0; n < resetInterval; n++) {
                for (i = 0; i < componentsLength; i++) {
                  component = components[i];
                  h = component.h;
                  v = component.v;
                  for (j = 0; j < v; j++) {
                    for (k = 0; k < h; k++) {
                      decodeMcu(component, decodeFn, mcu, j, k);
                    }
                  }
                }
                mcu++;
                if (mcu === mcuExpected) break;
              }
            }
            if (mcu === mcuExpected) {
              do {
                if (data[offset] === 255) {
                  if (data[offset + 1] !== 0) {
                    break;
                  }
                }
                offset += 1;
              } while (offset < data.length - 2);
            }
            bitsCount = 0;
            marker = data[offset] << 8 | data[offset + 1];
            if (marker < 65280) {
              throw new Error("marker was not found");
            }
            if (marker >= 65488 && marker <= 65495) {
              offset += 2;
            } else
              break;
          }
          return offset - startOffset;
        }
        function buildComponentData(frame, component) {
          var lines = [];
          var blocksPerLine = component.blocksPerLine;
          var blocksPerColumn = component.blocksPerColumn;
          var samplesPerLine = blocksPerLine << 3;
          var R = new Int32Array(64), r = new Uint8Array(64);
          function quantizeAndInverse(zz, dataOut, dataIn) {
            var qt = component.quantizationTable;
            var v0, v1, v2, v3, v4, v5, v6, v7, t;
            var p = dataIn;
            var i2;
            for (i2 = 0; i2 < 64; i2++)
              p[i2] = zz[i2] * qt[i2];
            for (i2 = 0; i2 < 8; ++i2) {
              var row = 8 * i2;
              if (p[1 + row] == 0 && p[2 + row] == 0 && p[3 + row] == 0 && p[4 + row] == 0 && p[5 + row] == 0 && p[6 + row] == 0 && p[7 + row] == 0) {
                t = dctSqrt2 * p[0 + row] + 512 >> 10;
                p[0 + row] = t;
                p[1 + row] = t;
                p[2 + row] = t;
                p[3 + row] = t;
                p[4 + row] = t;
                p[5 + row] = t;
                p[6 + row] = t;
                p[7 + row] = t;
                continue;
              }
              v0 = dctSqrt2 * p[0 + row] + 128 >> 8;
              v1 = dctSqrt2 * p[4 + row] + 128 >> 8;
              v2 = p[2 + row];
              v3 = p[6 + row];
              v4 = dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128 >> 8;
              v7 = dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128 >> 8;
              v5 = p[3 + row] << 4;
              v6 = p[5 + row] << 4;
              t = v0 - v1 + 1 >> 1;
              v0 = v0 + v1 + 1 >> 1;
              v1 = t;
              t = v2 * dctSin6 + v3 * dctCos6 + 128 >> 8;
              v2 = v2 * dctCos6 - v3 * dctSin6 + 128 >> 8;
              v3 = t;
              t = v4 - v6 + 1 >> 1;
              v4 = v4 + v6 + 1 >> 1;
              v6 = t;
              t = v7 + v5 + 1 >> 1;
              v5 = v7 - v5 + 1 >> 1;
              v7 = t;
              t = v0 - v3 + 1 >> 1;
              v0 = v0 + v3 + 1 >> 1;
              v3 = t;
              t = v1 - v2 + 1 >> 1;
              v1 = v1 + v2 + 1 >> 1;
              v2 = t;
              t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
              v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
              v7 = t;
              t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
              v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
              v6 = t;
              p[0 + row] = v0 + v7;
              p[7 + row] = v0 - v7;
              p[1 + row] = v1 + v6;
              p[6 + row] = v1 - v6;
              p[2 + row] = v2 + v5;
              p[5 + row] = v2 - v5;
              p[3 + row] = v3 + v4;
              p[4 + row] = v3 - v4;
            }
            for (i2 = 0; i2 < 8; ++i2) {
              var col = i2;
              if (p[1 * 8 + col] == 0 && p[2 * 8 + col] == 0 && p[3 * 8 + col] == 0 && p[4 * 8 + col] == 0 && p[5 * 8 + col] == 0 && p[6 * 8 + col] == 0 && p[7 * 8 + col] == 0) {
                t = dctSqrt2 * dataIn[i2 + 0] + 8192 >> 14;
                p[0 * 8 + col] = t;
                p[1 * 8 + col] = t;
                p[2 * 8 + col] = t;
                p[3 * 8 + col] = t;
                p[4 * 8 + col] = t;
                p[5 * 8 + col] = t;
                p[6 * 8 + col] = t;
                p[7 * 8 + col] = t;
                continue;
              }
              v0 = dctSqrt2 * p[0 * 8 + col] + 2048 >> 12;
              v1 = dctSqrt2 * p[4 * 8 + col] + 2048 >> 12;
              v2 = p[2 * 8 + col];
              v3 = p[6 * 8 + col];
              v4 = dctSqrt1d2 * (p[1 * 8 + col] - p[7 * 8 + col]) + 2048 >> 12;
              v7 = dctSqrt1d2 * (p[1 * 8 + col] + p[7 * 8 + col]) + 2048 >> 12;
              v5 = p[3 * 8 + col];
              v6 = p[5 * 8 + col];
              t = v0 - v1 + 1 >> 1;
              v0 = v0 + v1 + 1 >> 1;
              v1 = t;
              t = v2 * dctSin6 + v3 * dctCos6 + 2048 >> 12;
              v2 = v2 * dctCos6 - v3 * dctSin6 + 2048 >> 12;
              v3 = t;
              t = v4 - v6 + 1 >> 1;
              v4 = v4 + v6 + 1 >> 1;
              v6 = t;
              t = v7 + v5 + 1 >> 1;
              v5 = v7 - v5 + 1 >> 1;
              v7 = t;
              t = v0 - v3 + 1 >> 1;
              v0 = v0 + v3 + 1 >> 1;
              v3 = t;
              t = v1 - v2 + 1 >> 1;
              v1 = v1 + v2 + 1 >> 1;
              v2 = t;
              t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
              v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
              v7 = t;
              t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
              v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
              v6 = t;
              p[0 * 8 + col] = v0 + v7;
              p[7 * 8 + col] = v0 - v7;
              p[1 * 8 + col] = v1 + v6;
              p[6 * 8 + col] = v1 - v6;
              p[2 * 8 + col] = v2 + v5;
              p[5 * 8 + col] = v2 - v5;
              p[3 * 8 + col] = v3 + v4;
              p[4 * 8 + col] = v3 - v4;
            }
            for (i2 = 0; i2 < 64; ++i2) {
              var sample2 = 128 + (p[i2] + 8 >> 4);
              dataOut[i2] = sample2 < 0 ? 0 : sample2 > 255 ? 255 : sample2;
            }
          }
          requestMemoryAllocation(samplesPerLine * blocksPerColumn * 8);
          var i, j;
          for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
            var scanLine = blockRow << 3;
            for (i = 0; i < 8; i++)
              lines.push(new Uint8Array(samplesPerLine));
            for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
              quantizeAndInverse(component.blocks[blockRow][blockCol], r, R);
              var offset = 0, sample = blockCol << 3;
              for (j = 0; j < 8; j++) {
                var line = lines[scanLine + j];
                for (i = 0; i < 8; i++)
                  line[sample + i] = r[offset++];
              }
            }
          }
          return lines;
        }
        function clampTo8bit(a) {
          return a < 0 ? 0 : a > 255 ? 255 : a;
        }
        constructor.prototype = {
          load: function load(path) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", path, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = (function() {
              var data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
              this.parse(data);
              if (this.onload)
                this.onload();
            }).bind(this);
            xhr.send(null);
          },
          parse: function parse(data) {
            var maxResolutionInPixels = this.opts.maxResolutionInMP * 1e3 * 1e3;
            var offset = 0, length = data.length;
            function readUint16() {
              var value = data[offset] << 8 | data[offset + 1];
              offset += 2;
              return value;
            }
            function readDataBlock() {
              var length2 = readUint16();
              var array = data.subarray(offset, offset + length2 - 2);
              offset += array.length;
              return array;
            }
            function prepareComponents(frame2) {
              var maxH2 = 1, maxV2 = 1;
              var component2, componentId2;
              for (componentId2 in frame2.components) {
                if (frame2.components.hasOwnProperty(componentId2)) {
                  component2 = frame2.components[componentId2];
                  if (maxH2 < component2.h) maxH2 = component2.h;
                  if (maxV2 < component2.v) maxV2 = component2.v;
                }
              }
              var mcusPerLine = Math.ceil(frame2.samplesPerLine / 8 / maxH2);
              var mcusPerColumn = Math.ceil(frame2.scanLines / 8 / maxV2);
              for (componentId2 in frame2.components) {
                if (frame2.components.hasOwnProperty(componentId2)) {
                  component2 = frame2.components[componentId2];
                  var blocksPerLine = Math.ceil(Math.ceil(frame2.samplesPerLine / 8) * component2.h / maxH2);
                  var blocksPerColumn = Math.ceil(Math.ceil(frame2.scanLines / 8) * component2.v / maxV2);
                  var blocksPerLineForMcu = mcusPerLine * component2.h;
                  var blocksPerColumnForMcu = mcusPerColumn * component2.v;
                  var blocksToAllocate = blocksPerColumnForMcu * blocksPerLineForMcu;
                  var blocks = [];
                  requestMemoryAllocation(blocksToAllocate * 256);
                  for (var i2 = 0; i2 < blocksPerColumnForMcu; i2++) {
                    var row = [];
                    for (var j2 = 0; j2 < blocksPerLineForMcu; j2++)
                      row.push(new Int32Array(64));
                    blocks.push(row);
                  }
                  component2.blocksPerLine = blocksPerLine;
                  component2.blocksPerColumn = blocksPerColumn;
                  component2.blocks = blocks;
                }
              }
              frame2.maxH = maxH2;
              frame2.maxV = maxV2;
              frame2.mcusPerLine = mcusPerLine;
              frame2.mcusPerColumn = mcusPerColumn;
            }
            var jfif = null;
            var adobe = null;
            var pixels = null;
            var frame, resetInterval;
            var quantizationTables = [], frames = [];
            var huffmanTablesAC = [], huffmanTablesDC = [];
            var fileMarker = readUint16();
            var malformedDataOffset = -1;
            this.comments = [];
            if (fileMarker != 65496) {
              throw new Error("SOI not found");
            }
            fileMarker = readUint16();
            while (fileMarker != 65497) {
              var i, j, l;
              switch (fileMarker) {
                case 65280:
                  break;
                case 65504:
                // APP0 (Application Specific)
                case 65505:
                // APP1
                case 65506:
                // APP2
                case 65507:
                // APP3
                case 65508:
                // APP4
                case 65509:
                // APP5
                case 65510:
                // APP6
                case 65511:
                // APP7
                case 65512:
                // APP8
                case 65513:
                // APP9
                case 65514:
                // APP10
                case 65515:
                // APP11
                case 65516:
                // APP12
                case 65517:
                // APP13
                case 65518:
                // APP14
                case 65519:
                // APP15
                case 65534:
                  var appData = readDataBlock();
                  if (fileMarker === 65534) {
                    var comment = String.fromCharCode.apply(null, appData);
                    this.comments.push(comment);
                  }
                  if (fileMarker === 65504) {
                    if (appData[0] === 74 && appData[1] === 70 && appData[2] === 73 && appData[3] === 70 && appData[4] === 0) {
                      jfif = {
                        version: { major: appData[5], minor: appData[6] },
                        densityUnits: appData[7],
                        xDensity: appData[8] << 8 | appData[9],
                        yDensity: appData[10] << 8 | appData[11],
                        thumbWidth: appData[12],
                        thumbHeight: appData[13],
                        thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
                      };
                    }
                  }
                  if (fileMarker === 65505) {
                    if (appData[0] === 69 && appData[1] === 120 && appData[2] === 105 && appData[3] === 102 && appData[4] === 0) {
                      this.exifBuffer = appData.subarray(5, appData.length);
                    }
                  }
                  if (fileMarker === 65518) {
                    if (appData[0] === 65 && appData[1] === 100 && appData[2] === 111 && appData[3] === 98 && appData[4] === 101 && appData[5] === 0) {
                      adobe = {
                        version: appData[6],
                        flags0: appData[7] << 8 | appData[8],
                        flags1: appData[9] << 8 | appData[10],
                        transformCode: appData[11]
                      };
                    }
                  }
                  break;
                case 65499:
                  var quantizationTablesLength = readUint16();
                  var quantizationTablesEnd = quantizationTablesLength + offset - 2;
                  while (offset < quantizationTablesEnd) {
                    var quantizationTableSpec = data[offset++];
                    requestMemoryAllocation(64 * 4);
                    var tableData = new Int32Array(64);
                    if (quantizationTableSpec >> 4 === 0) {
                      for (j = 0; j < 64; j++) {
                        var z = dctZigZag[j];
                        tableData[z] = data[offset++];
                      }
                    } else if (quantizationTableSpec >> 4 === 1) {
                      for (j = 0; j < 64; j++) {
                        var z = dctZigZag[j];
                        tableData[z] = readUint16();
                      }
                    } else
                      throw new Error("DQT: invalid table spec");
                    quantizationTables[quantizationTableSpec & 15] = tableData;
                  }
                  break;
                case 65472:
                // SOF0 (Start of Frame, Baseline DCT)
                case 65473:
                // SOF1 (Start of Frame, Extended DCT)
                case 65474:
                  readUint16();
                  frame = {};
                  frame.extended = fileMarker === 65473;
                  frame.progressive = fileMarker === 65474;
                  frame.precision = data[offset++];
                  frame.scanLines = readUint16();
                  frame.samplesPerLine = readUint16();
                  frame.components = {};
                  frame.componentsOrder = [];
                  var pixelsInFrame = frame.scanLines * frame.samplesPerLine;
                  if (pixelsInFrame > maxResolutionInPixels) {
                    var exceededAmount = Math.ceil((pixelsInFrame - maxResolutionInPixels) / 1e6);
                    throw new Error(`maxResolutionInMP limit exceeded by ${exceededAmount}MP`);
                  }
                  var componentsCount = data[offset++], componentId;
                  var maxH = 0, maxV = 0;
                  for (i = 0; i < componentsCount; i++) {
                    componentId = data[offset];
                    var h = data[offset + 1] >> 4;
                    var v = data[offset + 1] & 15;
                    var qId = data[offset + 2];
                    if (h <= 0 || v <= 0) {
                      throw new Error("Invalid sampling factor, expected values above 0");
                    }
                    frame.componentsOrder.push(componentId);
                    frame.components[componentId] = {
                      h,
                      v,
                      quantizationIdx: qId
                    };
                    offset += 3;
                  }
                  prepareComponents(frame);
                  frames.push(frame);
                  break;
                case 65476:
                  var huffmanLength = readUint16();
                  for (i = 2; i < huffmanLength; ) {
                    var huffmanTableSpec = data[offset++];
                    var codeLengths = new Uint8Array(16);
                    var codeLengthSum = 0;
                    for (j = 0; j < 16; j++, offset++) {
                      codeLengthSum += codeLengths[j] = data[offset];
                    }
                    requestMemoryAllocation(16 + codeLengthSum);
                    var huffmanValues = new Uint8Array(codeLengthSum);
                    for (j = 0; j < codeLengthSum; j++, offset++)
                      huffmanValues[j] = data[offset];
                    i += 17 + codeLengthSum;
                    (huffmanTableSpec >> 4 === 0 ? huffmanTablesDC : huffmanTablesAC)[huffmanTableSpec & 15] = buildHuffmanTable(codeLengths, huffmanValues);
                  }
                  break;
                case 65501:
                  readUint16();
                  resetInterval = readUint16();
                  break;
                case 65500:
                  readUint16();
                  readUint16();
                  break;
                case 65498:
                  var scanLength = readUint16();
                  var selectorsCount = data[offset++];
                  var components = [], component;
                  for (i = 0; i < selectorsCount; i++) {
                    component = frame.components[data[offset++]];
                    var tableSpec = data[offset++];
                    component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
                    component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
                    components.push(component);
                  }
                  var spectralStart = data[offset++];
                  var spectralEnd = data[offset++];
                  var successiveApproximation = data[offset++];
                  var processed = decodeScan(
                    data,
                    offset,
                    frame,
                    components,
                    resetInterval,
                    spectralStart,
                    spectralEnd,
                    successiveApproximation >> 4,
                    successiveApproximation & 15,
                    this.opts
                  );
                  offset += processed;
                  break;
                case 65535:
                  if (data[offset] !== 255) {
                    offset--;
                  }
                  break;
                default:
                  if (data[offset - 3] == 255 && data[offset - 2] >= 192 && data[offset - 2] <= 254) {
                    offset -= 3;
                    break;
                  } else if (fileMarker === 224 || fileMarker == 225) {
                    if (malformedDataOffset !== -1) {
                      throw new Error(`first unknown JPEG marker at offset ${malformedDataOffset.toString(16)}, second unknown JPEG marker ${fileMarker.toString(16)} at offset ${(offset - 1).toString(16)}`);
                    }
                    malformedDataOffset = offset - 1;
                    const nextOffset = readUint16();
                    if (data[offset + nextOffset - 2] === 255) {
                      offset += nextOffset - 2;
                      break;
                    }
                  }
                  throw new Error("unknown JPEG marker " + fileMarker.toString(16));
              }
              fileMarker = readUint16();
            }
            if (frames.length != 1)
              throw new Error("only single frame JPEGs supported");
            for (var i = 0; i < frames.length; i++) {
              var cp = frames[i].components;
              for (var j in cp) {
                cp[j].quantizationTable = quantizationTables[cp[j].quantizationIdx];
                delete cp[j].quantizationIdx;
              }
            }
            this.width = frame.samplesPerLine;
            this.height = frame.scanLines;
            this.jfif = jfif;
            this.adobe = adobe;
            this.components = [];
            for (var i = 0; i < frame.componentsOrder.length; i++) {
              var component = frame.components[frame.componentsOrder[i]];
              this.components.push({
                lines: buildComponentData(frame, component),
                scaleX: component.h / frame.maxH,
                scaleY: component.v / frame.maxV
              });
            }
          },
          getData: function getData(width, height) {
            var scaleX = this.width / width, scaleY = this.height / height;
            var component1, component2, component3, component4;
            var component1Line, component2Line, component3Line, component4Line;
            var x, y;
            var offset = 0;
            var Y, Cb, Cr, K, C, M, Ye, R, G, B;
            var colorTransform;
            var dataLength = width * height * this.components.length;
            requestMemoryAllocation(dataLength);
            var data = new Uint8Array(dataLength);
            switch (this.components.length) {
              case 1:
                component1 = this.components[0];
                for (y = 0; y < height; y++) {
                  component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
                  for (x = 0; x < width; x++) {
                    Y = component1Line[0 | x * component1.scaleX * scaleX];
                    data[offset++] = Y;
                  }
                }
                break;
              case 2:
                component1 = this.components[0];
                component2 = this.components[1];
                for (y = 0; y < height; y++) {
                  component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
                  component2Line = component2.lines[0 | y * component2.scaleY * scaleY];
                  for (x = 0; x < width; x++) {
                    Y = component1Line[0 | x * component1.scaleX * scaleX];
                    data[offset++] = Y;
                    Y = component2Line[0 | x * component2.scaleX * scaleX];
                    data[offset++] = Y;
                  }
                }
                break;
              case 3:
                colorTransform = true;
                if (this.adobe && this.adobe.transformCode)
                  colorTransform = true;
                else if (typeof this.opts.colorTransform !== "undefined")
                  colorTransform = !!this.opts.colorTransform;
                component1 = this.components[0];
                component2 = this.components[1];
                component3 = this.components[2];
                for (y = 0; y < height; y++) {
                  component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
                  component2Line = component2.lines[0 | y * component2.scaleY * scaleY];
                  component3Line = component3.lines[0 | y * component3.scaleY * scaleY];
                  for (x = 0; x < width; x++) {
                    if (!colorTransform) {
                      R = component1Line[0 | x * component1.scaleX * scaleX];
                      G = component2Line[0 | x * component2.scaleX * scaleX];
                      B = component3Line[0 | x * component3.scaleX * scaleX];
                    } else {
                      Y = component1Line[0 | x * component1.scaleX * scaleX];
                      Cb = component2Line[0 | x * component2.scaleX * scaleX];
                      Cr = component3Line[0 | x * component3.scaleX * scaleX];
                      R = clampTo8bit(Y + 1.402 * (Cr - 128));
                      G = clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                      B = clampTo8bit(Y + 1.772 * (Cb - 128));
                    }
                    data[offset++] = R;
                    data[offset++] = G;
                    data[offset++] = B;
                  }
                }
                break;
              case 4:
                if (!this.adobe)
                  throw new Error("Unsupported color mode (4 components)");
                colorTransform = false;
                if (this.adobe && this.adobe.transformCode)
                  colorTransform = true;
                else if (typeof this.opts.colorTransform !== "undefined")
                  colorTransform = !!this.opts.colorTransform;
                component1 = this.components[0];
                component2 = this.components[1];
                component3 = this.components[2];
                component4 = this.components[3];
                for (y = 0; y < height; y++) {
                  component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
                  component2Line = component2.lines[0 | y * component2.scaleY * scaleY];
                  component3Line = component3.lines[0 | y * component3.scaleY * scaleY];
                  component4Line = component4.lines[0 | y * component4.scaleY * scaleY];
                  for (x = 0; x < width; x++) {
                    if (!colorTransform) {
                      C = component1Line[0 | x * component1.scaleX * scaleX];
                      M = component2Line[0 | x * component2.scaleX * scaleX];
                      Ye = component3Line[0 | x * component3.scaleX * scaleX];
                      K = component4Line[0 | x * component4.scaleX * scaleX];
                    } else {
                      Y = component1Line[0 | x * component1.scaleX * scaleX];
                      Cb = component2Line[0 | x * component2.scaleX * scaleX];
                      Cr = component3Line[0 | x * component3.scaleX * scaleX];
                      K = component4Line[0 | x * component4.scaleX * scaleX];
                      C = 255 - clampTo8bit(Y + 1.402 * (Cr - 128));
                      M = 255 - clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                      Ye = 255 - clampTo8bit(Y + 1.772 * (Cb - 128));
                    }
                    data[offset++] = 255 - C;
                    data[offset++] = 255 - M;
                    data[offset++] = 255 - Ye;
                    data[offset++] = 255 - K;
                  }
                }
                break;
              default:
                throw new Error("Unsupported color mode");
            }
            return data;
          },
          copyToImageData: function copyToImageData(imageData, formatAsRGBA) {
            var width = imageData.width, height = imageData.height;
            var imageDataArray = imageData.data;
            var data = this.getData(width, height);
            var i = 0, j = 0, x, y;
            var Y, K, C, M, R, G, B;
            switch (this.components.length) {
              case 1:
                for (y = 0; y < height; y++) {
                  for (x = 0; x < width; x++) {
                    Y = data[i++];
                    imageDataArray[j++] = Y;
                    imageDataArray[j++] = Y;
                    imageDataArray[j++] = Y;
                    if (formatAsRGBA) {
                      imageDataArray[j++] = 255;
                    }
                  }
                }
                break;
              case 3:
                for (y = 0; y < height; y++) {
                  for (x = 0; x < width; x++) {
                    R = data[i++];
                    G = data[i++];
                    B = data[i++];
                    imageDataArray[j++] = R;
                    imageDataArray[j++] = G;
                    imageDataArray[j++] = B;
                    if (formatAsRGBA) {
                      imageDataArray[j++] = 255;
                    }
                  }
                }
                break;
              case 4:
                for (y = 0; y < height; y++) {
                  for (x = 0; x < width; x++) {
                    C = data[i++];
                    M = data[i++];
                    Y = data[i++];
                    K = data[i++];
                    R = 255 - clampTo8bit(C * (1 - K / 255) + K);
                    G = 255 - clampTo8bit(M * (1 - K / 255) + K);
                    B = 255 - clampTo8bit(Y * (1 - K / 255) + K);
                    imageDataArray[j++] = R;
                    imageDataArray[j++] = G;
                    imageDataArray[j++] = B;
                    if (formatAsRGBA) {
                      imageDataArray[j++] = 255;
                    }
                  }
                }
                break;
              default:
                throw new Error("Unsupported color mode");
            }
          }
        };
        var totalBytesAllocated = 0;
        var maxMemoryUsageBytes = 0;
        function requestMemoryAllocation(increaseAmount = 0) {
          var totalMemoryImpactBytes = totalBytesAllocated + increaseAmount;
          if (totalMemoryImpactBytes > maxMemoryUsageBytes) {
            var exceededAmount = Math.ceil((totalMemoryImpactBytes - maxMemoryUsageBytes) / 1024 / 1024);
            throw new Error(`maxMemoryUsageInMB limit exceeded by at least ${exceededAmount}MB`);
          }
          totalBytesAllocated = totalMemoryImpactBytes;
        }
        constructor.resetMaxMemoryUsage = function(maxMemoryUsageBytes_) {
          totalBytesAllocated = 0;
          maxMemoryUsageBytes = maxMemoryUsageBytes_;
        };
        constructor.getBytesAllocated = function() {
          return totalBytesAllocated;
        };
        constructor.requestMemoryAllocation = requestMemoryAllocation;
        return constructor;
      })();
      if (typeof module !== "undefined") {
        module.exports = decode2;
      } else if (typeof window !== "undefined") {
        window["jpeg-js"] = window["jpeg-js"] || {};
        window["jpeg-js"].decode = decode2;
      }
      function decode2(jpegData, userOpts = {}) {
        var defaultOpts = {
          // "undefined" means "Choose whether to transform colors based on the image’s color model."
          colorTransform: void 0,
          useTArray: false,
          formatAsRGBA: true,
          tolerantDecoding: true,
          maxResolutionInMP: 100,
          // Don't decode more than 100 megapixels
          maxMemoryUsageInMB: 512
          // Don't decode if memory footprint is more than 512MB
        };
        var opts = { ...defaultOpts, ...userOpts };
        var arr = new Uint8Array(jpegData);
        var decoder = new JpegImage();
        decoder.opts = opts;
        JpegImage.resetMaxMemoryUsage(opts.maxMemoryUsageInMB * 1024 * 1024);
        decoder.parse(arr);
        var channels = opts.formatAsRGBA ? 4 : 3;
        var bytesNeeded = decoder.width * decoder.height * channels;
        try {
          JpegImage.requestMemoryAllocation(bytesNeeded);
          var image = {
            width: decoder.width,
            height: decoder.height,
            exifBuffer: decoder.exifBuffer,
            data: opts.useTArray ? new Uint8Array(bytesNeeded) : Buffer.alloc(bytesNeeded)
          };
          if (decoder.comments.length > 0) {
            image["comments"] = decoder.comments;
          }
        } catch (err) {
          if (err instanceof RangeError) {
            throw new Error("Could not allocate enough memory for the image. Required: " + bytesNeeded);
          }
          if (err instanceof ReferenceError) {
            if (err.message === "Buffer is not defined") {
              throw new Error("Buffer is not globally defined in this environment. Consider setting useTArray to true");
            }
          }
          throw err;
        }
        decoder.copyToImageData(image, opts.formatAsRGBA);
        return image;
      }
    }
  });

  // node_modules/jpeg-js/index.js
  var require_jpeg_js = __commonJS({
    "node_modules/jpeg-js/index.js"(exports, module) {
      var encode = require_encoder();
      var decode2 = require_decoder();
      module.exports = {
        encode,
        decode: decode2
      };
    }
  });

  // node_modules/@cadit-app/potrace-ts/dist/index.js
  var index_exports = {};
  __export(index_exports, {
    Bitmap: () => Bitmap,
    Curve: () => Curve,
    DEFAULT_OPTIONS: () => DEFAULT_OPTIONS,
    Path: () => Path,
    Point: () => Point,
    THRESHOLD_AUTO: () => THRESHOLD_AUTO,
    buildLuminanceHistogram: () => buildLuminanceHistogram,
    calculateAutoThreshold: () => calculateAutoThreshold,
    createBitmap: () => createBitmap,
    decodeImageBytes: () => decodeImageBytes,
    decodeImageDataUrl: () => decodeImageDataUrl,
    getPaths: () => getPaths,
    getSVG: () => getSVG,
    imageDataToBitmap: () => imageDataToBitmap,
    imageToLuminanceData: () => imageToLuminanceData,
    loadImage: () => loadImage,
    luminance: () => luminance,
    otsuThreshold: () => otsuThreshold,
    traceBitmap: () => traceBitmap,
    traceCanvas: () => traceCanvas,
    traceDataUrl: () => traceDataUrl,
    traceImage: () => traceImage,
    traceImageData: () => traceImageData,
    traceUrl: () => traceUrl
  });

  // node_modules/@cadit-app/potrace-ts/dist/Point.js
  var Point = class _Point {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
    copy() {
      return new _Point(this.x, this.y);
    }
    toIndex(width, height) {
      if (this.x < 0 || this.y < 0 || this.x >= width || this.y >= height)
        return null;
      return width * this.y + this.x;
    }
    lerp(point, lambda) {
      const x = this.x + lambda * (point.x - this.x);
      const y = this.y + lambda * (point.y - this.y);
      return new _Point(x, y);
    }
    dorthInfty(point) {
      const x = -sign(point.y - this.y);
      const y = sign(point.x - this.x);
      return new _Point(x, y);
    }
    ddenom(point) {
      const r = this.dorthInfty(point);
      return r.y * (point.x - this.x) - r.x * (point.y - this.y);
    }
    dpara(p1, p2) {
      const x1 = p1.x - this.x;
      const y1 = p1.y - this.y;
      const x2 = p2.x - this.x;
      const y2 = p2.y - this.y;
      return x1 * y2 - x2 * y1;
    }
    interval(p1, p2) {
      const denom = this.ddenom(p2);
      if (denom === 0)
        return 1e7;
      return -this.dpara(p1, p2) / denom;
    }
    subtract(p) {
      return new _Point(this.x - p.x, this.y - p.y);
    }
    add(p) {
      return new _Point(this.x + p.x, this.y + p.y);
    }
    multiply(s) {
      return new _Point(this.x * s, this.y * s);
    }
    dot(p) {
      return this.x * p.x + this.y * p.y;
    }
    cross(p) {
      return this.x * p.y - this.y * p.x;
    }
  };
  function sign(i) {
    return i > 0 ? 1 : i < 0 ? -1 : 0;
  }

  // node_modules/@cadit-app/potrace-ts/dist/Bitmap.js
  var Bitmap = class _Bitmap {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.size = width * height;
      this.data = new Int8Array(this.size);
    }
    /**
     * Check if pixel at (x, y) is set (black/foreground)
     */
    at(x, y) {
      return x >= 0 && x < this.width && y >= 0 && y < this.height && this.data[this.width * y + x] === 1;
    }
    /**
     * Toggle pixel at (x, y)
     */
    flip(x, y) {
      if (this.at(x, y)) {
        this.data[this.width * y + x] = 0;
      } else {
        this.data[this.width * y + x] = 1;
      }
    }
    /**
     * Create a copy of this bitmap
     */
    copy() {
      const bitmap = new _Bitmap(this.width, this.height);
      for (let i = 0; i < this.size; i++) {
        bitmap.data[i] = this.data[i];
      }
      return bitmap;
    }
    /**
     * Convert flat index to Point
     */
    index(i) {
      const x = i % this.width;
      const y = Math.floor(i / this.width);
      return new Point(x, y);
    }
    /**
     * XOR a path with the bitmap
     */
    xOrPath(path) {
      let y1 = path.points[0].y;
      for (let i = 1; i < path.points.length; i++) {
        const x = path.points[i].x;
        const y = path.points[i].y;
        if (y !== y1) {
          const minY = Math.min(y1, y);
          const maxX = path.maxX;
          for (let j = x; j < maxX; j++) {
            this.flip(j, minY);
          }
          y1 = y;
        }
      }
    }
  };

  // node_modules/@cadit-app/potrace-ts/dist/utils.js
  function sign2(i) {
    return i > 0 ? 1 : i < 0 ? -1 : 0;
  }
  function imageDataToBitmap(imageData, threshold = 128, blackOnWhite = true) {
    const { width, height, data } = imageData;
    const bitmap = new Bitmap(width, height);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      const opacity = data[idx + 3] / 255;
      const r = 255 + (data[idx + 0] - 255) * opacity;
      const g = 255 + (data[idx + 1] - 255) * opacity;
      const b = 255 + (data[idx + 2] - 255) * opacity;
      const lum = Math.round(0.2126 * r + 0.7153 * g + 0.0721 * b);
      if (blackOnWhite) {
        bitmap.data[i] = lum > threshold ? 0 : 1;
      } else {
        bitmap.data[i] = lum < threshold ? 0 : 1;
      }
    }
    return bitmap;
  }
  function loadImage(url) {
    if (typeof document === "undefined" || typeof Image === "undefined") {
      throw new Error("loadImage requires a DOM environment. Use imageDataToBitmap for worker-compatible tracing.");
    }
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
  }
  function createBitmap(canvas, threshold = 128) {
    const { width, height } = canvas;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not get 2D context from canvas");
    }
    const imageData = context.getImageData(0, 0, width, height);
    return imageDataToBitmap(imageData, threshold);
  }

  // node_modules/@cadit-app/potrace-ts/dist/imageDecoder.js
  var import_upng_js = __toESM(require_UPNG(), 1);
  var jpeg = __toESM(require_jpeg_js(), 1);
  function luminance(r, g, b) {
    return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  }
  function imageToLuminanceData(imageData) {
    const { width, height, data } = imageData;
    const luminanceData = new Uint8Array(width * height);
    for (let i = 0; i < luminanceData.length; i++) {
      const idx = i * 4;
      const opacity = data[idx + 3] / 255;
      const r = 255 + (data[idx + 0] - 255) * opacity;
      const g = 255 + (data[idx + 1] - 255) * opacity;
      const b = 255 + (data[idx + 2] - 255) * opacity;
      luminanceData[i] = luminance(r, g, b);
    }
    return luminanceData;
  }
  function decodeImageDataUrl(dataUrl) {
    const match = dataUrl.match(/^data:([^;,]+)(?:;base64)?,(.+)$/);
    if (!match) {
      throw new Error("Invalid data URL format");
    }
    const mimeType = match[1].toLowerCase();
    const base64Data = match[2];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return decodeImageBytes(bytes, mimeType);
  }
  function decodeImageBytes(bytes, mimeType) {
    const detectedType = mimeType?.toLowerCase() || detectImageFormat(bytes);
    if (detectedType === "image/png") {
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      const pngData = import_upng_js.default.decode(buffer);
      const rgba = import_upng_js.default.toRGBA8(pngData)[0];
      return {
        width: pngData.width,
        height: pngData.height,
        data: new Uint8ClampedArray(rgba)
      };
    } else if (detectedType === "image/jpeg" || detectedType === "image/jpg") {
      const jpegData = jpeg.decode(bytes, { useTArray: true });
      return {
        width: jpegData.width,
        height: jpegData.height,
        data: new Uint8ClampedArray(jpegData.data)
      };
    } else {
      throw new Error(`Unsupported image format: ${detectedType}. Supported formats: PNG, JPEG`);
    }
  }
  function detectImageFormat(bytes) {
    if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) {
      return "image/png";
    }
    if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
      return "image/jpeg";
    }
    return "unknown";
  }
  function buildHistogramFromLuminance(luminanceData) {
    const histogram = new Uint32Array(256);
    for (let i = 0; i < luminanceData.length; i++) {
      histogram[luminanceData[i]]++;
    }
    return histogram;
  }
  function buildLuminanceHistogram(imageData) {
    const luminanceData = imageToLuminanceData(imageData);
    return buildHistogramFromLuminance(luminanceData);
  }
  function otsuThreshold(histogram) {
    const totalPixels = histogram.reduce((sum, count) => sum + count, 0);
    if (totalPixels === 0)
      return 128;
    let totalSum = 0;
    for (let i = 0; i < 256; i++) {
      totalSum += i * histogram[i];
    }
    let sumBackground = 0;
    let weightBackground = 0;
    let maxVariance = 0;
    let threshold = 128;
    for (let t = 0; t < 256; t++) {
      weightBackground += histogram[t];
      if (weightBackground === 0)
        continue;
      const weightForeground = totalPixels - weightBackground;
      if (weightForeground === 0)
        break;
      sumBackground += t * histogram[t];
      const meanBackground = sumBackground / weightBackground;
      const meanForeground = (totalSum - sumBackground) / weightForeground;
      const variance = weightBackground * weightForeground * Math.pow(meanBackground - meanForeground, 2);
      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = t;
      }
    }
    return threshold;
  }
  function calculateAutoThreshold(imageData) {
    const histogram = buildLuminanceHistogram(imageData);
    return otsuThreshold(histogram);
  }

  // node_modules/@cadit-app/potrace-ts/dist/Path.js
  var Path = class {
    constructor(points, area, isHole) {
      this.points = points;
      this.area = area;
      this.isHole = isHole;
      const xValues = this.points.map(({ x }) => x);
      const yValues = this.points.map(({ y }) => y);
      this.minX = Math.min(...xValues);
      this.minY = Math.min(...yValues);
      this.maxX = Math.max(...xValues);
      this.maxY = Math.max(...yValues);
      this.curve = {};
    }
    reverse() {
      if (this.curve && this.curve.vertex) {
        this.curve.vertex.reverse();
      }
    }
  };

  // node_modules/@cadit-app/potrace-ts/dist/bitmapToPathList.js
  function bitmapToPathList(bitmap, options) {
    const bitmapTarget = bitmap.copy();
    const pathList = [];
    for (let point = findNext(new Point(0, 0), bitmapTarget); point; point = findNext(point, bitmapTarget)) {
      const path = findPath(point, bitmap, bitmapTarget, options);
      if (path.area > options.turdsize)
        pathList.push(path);
      bitmapTarget.xOrPath(path);
    }
    return pathList;
  }
  function findNext(point, bitmapTarget) {
    const startIndex = point.toIndex(bitmapTarget.width, bitmapTarget.height);
    if (startIndex === null)
      return false;
    for (let i = startIndex; i < bitmapTarget.size; i++) {
      if (bitmapTarget.data[i])
        return bitmapTarget.index(i);
    }
    return false;
  }
  function findPath(point, bitmap, bitmapTarget, options) {
    let { x, y } = point;
    let dirX = 0;
    let dirY = 1;
    const points = [];
    let area = 0;
    const isHole = !bitmap.at(x, y);
    while (true) {
      points.push(new Point(x, y));
      x += dirX;
      y += dirY;
      area -= x * dirY;
      if (x === point.x && y === point.y)
        break;
      const left = bitmapTarget.at(x + (dirX + dirY - 1) / 2, y + (dirY - dirX - 1) / 2);
      const right = bitmapTarget.at(x + (dirX - dirY - 1) / 2, y + (dirY + dirX - 1) / 2);
      if (right && !left) {
        if (turn(options.turnpolicy, isHole, bitmapTarget, x, y)) {
          const tmp = dirX;
          dirX = -dirY;
          dirY = tmp;
        } else {
          const tmp = dirX;
          dirX = dirY;
          dirY = -tmp;
        }
      } else if (right) {
        const tmp = dirX;
        dirX = -dirY;
        dirY = tmp;
      } else if (!left) {
        const tmp = dirX;
        dirX = dirY;
        dirY = -tmp;
      }
    }
    return new Path(points, area, isHole);
  }
  function turn(turnpolicy, isHole, bitmap, x, y) {
    switch (turnpolicy) {
      case "right":
        return true;
      case "black":
        return !isHole;
      case "white":
        return isHole;
      case "majority":
        return majority(x, y, bitmap);
      case "minority":
        return !majority(x, y, bitmap);
      default:
        return true;
    }
  }
  function majority(x, y, bitmap) {
    for (let i = 2; i < 5; i++) {
      let ct = 0;
      for (let a = -i + 1; a <= i - 1; a++) {
        ct += bitmap.at(x + a, y + i - 1) ? 1 : -1;
        ct += bitmap.at(x + i - 1, y + a - 1) ? 1 : -1;
        ct += bitmap.at(x + a - 1, y - i) ? 1 : -1;
        ct += bitmap.at(x - i, y + a) ? 1 : -1;
      }
      if (ct > 0) {
        return true;
      } else if (ct < 0) {
        return false;
      }
    }
    return false;
  }

  // node_modules/@cadit-app/potrace-ts/dist/Curve.js
  var Curve = class {
    constructor(n) {
      this.n = n;
      this.tag = new Array(n);
      this.c = new Array(n * 3);
      this.alphaCurve = 0;
      this.vertex = new Array(n);
      this.alpha = new Array(n);
      this.alpha0 = new Array(n);
      this.beta = new Array(n);
    }
  };

  // node_modules/@cadit-app/potrace-ts/dist/Quad.js
  var Quad = class {
    constructor() {
      this.data = [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ];
    }
    at(x, y) {
      return this.data[x * 3 + y];
    }
  };

  // node_modules/@cadit-app/potrace-ts/dist/Sum.js
  var Sum = class {
    constructor(x, y, xy, x2, y2) {
      this.x = x;
      this.y = y;
      this.xy = xy;
      this.x2 = x2;
      this.y2 = y2;
    }
  };

  // node_modules/@cadit-app/potrace-ts/dist/processPath.js
  function processPath(pathList, options) {
    for (const path of pathList) {
      calcSums(path);
      calcLon(path);
      bestPolygon(path);
      adjustVertices(path);
      if (path.isHole)
        path.reverse();
      smooth(path, options);
      if (options.optcurve)
        optiCurve(path, options);
    }
  }
  function mod(a, n) {
    return a >= n ? a % n : a >= 0 ? a : n - 1 - (-1 - a) % n;
  }
  function xprod(p1, p2) {
    return p1.x * p2.y - p1.y * p2.x;
  }
  function cyclic(a, b, c) {
    if (a <= c) {
      return a <= b && b < c;
    } else {
      return a <= b || b < c;
    }
  }
  function quadform(Q, w) {
    const v = [w.x, w.y, 1];
    let sum = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        sum += v[i] * Q.at(i, j) * v[j];
      }
    }
    return sum;
  }
  function dpara(p0, p1, p2) {
    const x1 = p1.x - p0.x;
    const y1 = p1.y - p0.y;
    const x2 = p2.x - p0.x;
    const y2 = p2.y - p0.y;
    return x1 * y2 - x2 * y1;
  }
  function cprod(p0, p1, p2, p3) {
    const x1 = p1.x - p0.x;
    const y1 = p1.y - p0.y;
    const x2 = p3.x - p2.x;
    const y2 = p3.y - p2.y;
    return x1 * y2 - x2 * y1;
  }
  function iprod(p0, p1, p2) {
    const x1 = p1.x - p0.x;
    const y1 = p1.y - p0.y;
    const x2 = p2.x - p0.x;
    const y2 = p2.y - p0.y;
    return x1 * x2 + y1 * y2;
  }
  function iprod1(p0, p1, p2, p3) {
    const x1 = p1.x - p0.x;
    const y1 = p1.y - p0.y;
    const x2 = p3.x - p2.x;
    const y2 = p3.y - p2.y;
    return x1 * x2 + y1 * y2;
  }
  function ddist(p, q) {
    return Math.sqrt((p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y));
  }
  function bezier(t, p0, p1, p2, p3) {
    const s = 1 - t;
    const res = new Point();
    res.x = s * s * s * p0.x + 3 * (s * s * t) * p1.x + 3 * (t * t * s) * p2.x + t * t * t * p3.x;
    res.y = s * s * s * p0.y + 3 * (s * s * t) * p1.y + 3 * (t * t * s) * p2.y + t * t * t * p3.y;
    return res;
  }
  function tangent(p0, p1, p2, p3, q0, q1) {
    const A = cprod(p0, p1, q0, q1);
    const B = cprod(p1, p2, q0, q1);
    const C = cprod(p2, p3, q0, q1);
    const a = A - 2 * B + C;
    const b = -2 * A + 2 * B;
    const c = A;
    const d = b * b - 4 * a * c;
    if (a === 0 || d < 0) {
      return -1;
    }
    const s = Math.sqrt(d);
    const r1 = (-b + s) / (2 * a);
    const r2 = (-b - s) / (2 * a);
    if (r1 >= 0 && r1 <= 1) {
      return r1;
    } else if (r2 >= 0 && r2 <= 1) {
      return r2;
    } else {
      return -1;
    }
  }
  function calcSums(path) {
    path.x0 = path.points[0].x;
    path.y0 = path.points[0].y;
    path.sums = [];
    const s = path.sums;
    s.push(new Sum(0, 0, 0, 0, 0));
    for (let i = 0; i < path.points.length; i++) {
      const x = path.points[i].x - path.x0;
      const y = path.points[i].y - path.y0;
      s.push(new Sum(s[i].x + x, s[i].y + y, s[i].xy + x * y, s[i].x2 + x * x, s[i].y2 + y * y));
    }
  }
  function calcLon(path) {
    const n = path.points.length;
    const pt = path.points;
    const pivk = new Array(n);
    const nc = new Array(n);
    const ct = [0, 0, 0, 0];
    path.lon = new Array(n);
    const constraint = [new Point(), new Point()];
    const cur = new Point();
    const off = new Point();
    const dk = new Point();
    let k = 0;
    for (let i = n - 1; i >= 0; i--) {
      if (pt[i].x !== pt[k].x && pt[i].y !== pt[k].y) {
        k = i + 1;
      }
      nc[i] = k;
    }
    for (let i = n - 1; i >= 0; i--) {
      ct[0] = ct[1] = ct[2] = ct[3] = 0;
      let dir = Math.floor((3 + 3 * (pt[mod(i + 1, n)].x - pt[i].x) + (pt[mod(i + 1, n)].y - pt[i].y)) / 2);
      ct[dir]++;
      constraint[0].x = 0;
      constraint[0].y = 0;
      constraint[1].x = 0;
      constraint[1].y = 0;
      k = nc[i];
      let k1 = i;
      let foundk = 0;
      while (true) {
        dir = Math.floor((3 + 3 * sign2(pt[k].x - pt[k1].x) + sign2(pt[k].y - pt[k1].y)) / 2);
        ct[dir]++;
        if (ct[0] && ct[1] && ct[2] && ct[3]) {
          pivk[i] = k1;
          foundk = 1;
          break;
        }
        cur.x = pt[k].x - pt[i].x;
        cur.y = pt[k].y - pt[i].y;
        if (xprod(constraint[0], cur) < 0 || xprod(constraint[1], cur) > 0) {
          break;
        }
        if (Math.abs(cur.x) <= 1 && Math.abs(cur.y) <= 1) {
        } else {
          off.x = cur.x + (cur.y >= 0 && (cur.y > 0 || cur.x < 0) ? 1 : -1);
          off.y = cur.y + (cur.x <= 0 && (cur.x < 0 || cur.y < 0) ? 1 : -1);
          if (xprod(constraint[0], off) >= 0) {
            constraint[0].x = off.x;
            constraint[0].y = off.y;
          }
          off.x = cur.x + (cur.y <= 0 && (cur.y < 0 || cur.x < 0) ? 1 : -1);
          off.y = cur.y + (cur.x >= 0 && (cur.x > 0 || cur.y < 0) ? 1 : -1);
          if (xprod(constraint[1], off) <= 0) {
            constraint[1].x = off.x;
            constraint[1].y = off.y;
          }
        }
        k1 = k;
        k = nc[k1];
        if (!cyclic(k, i, k1)) {
          break;
        }
      }
      if (foundk === 0) {
        dk.x = sign2(pt[k].x - pt[k1].x);
        dk.y = sign2(pt[k].y - pt[k1].y);
        cur.x = pt[k1].x - pt[i].x;
        cur.y = pt[k1].y - pt[i].y;
        const a = xprod(constraint[0], cur);
        const b = xprod(constraint[0], dk);
        const c = xprod(constraint[1], cur);
        const d = xprod(constraint[1], dk);
        let j2 = 1e7;
        if (b < 0) {
          j2 = Math.floor(a / -b);
        }
        if (d > 0) {
          j2 = Math.min(j2, Math.floor(-c / d));
        }
        pivk[i] = mod(k1 + j2, n);
      }
    }
    let j = pivk[n - 1];
    path.lon[n - 1] = j;
    for (let i = n - 2; i >= 0; i--) {
      if (cyclic(i + 1, pivk[i], j)) {
        j = pivk[i];
      }
      path.lon[i] = j;
    }
    for (let i = n - 1; cyclic(mod(i + 1, n), j, path.lon[i]); i--) {
      path.lon[i] = j;
    }
  }
  function bestPolygon(path) {
    function penalty3(path2, i2, j2) {
      const n2 = path2.points.length;
      const pt = path2.points;
      const sums = path2.sums;
      let x, y, xy, x2, y2;
      let k, a, b, c, s;
      let px, py, ex, ey;
      let r = 0;
      if (j2 >= n2) {
        j2 -= n2;
        r = 1;
      }
      if (r === 0) {
        x = sums[j2 + 1].x - sums[i2].x;
        y = sums[j2 + 1].y - sums[i2].y;
        x2 = sums[j2 + 1].x2 - sums[i2].x2;
        xy = sums[j2 + 1].xy - sums[i2].xy;
        y2 = sums[j2 + 1].y2 - sums[i2].y2;
        k = j2 + 1 - i2;
      } else {
        x = sums[j2 + 1].x - sums[i2].x + sums[n2].x;
        y = sums[j2 + 1].y - sums[i2].y + sums[n2].y;
        x2 = sums[j2 + 1].x2 - sums[i2].x2 + sums[n2].x2;
        xy = sums[j2 + 1].xy - sums[i2].xy + sums[n2].xy;
        y2 = sums[j2 + 1].y2 - sums[i2].y2 + sums[n2].y2;
        k = j2 + 1 - i2 + n2;
      }
      px = (pt[i2].x + pt[j2].x) / 2 - pt[0].x;
      py = (pt[i2].y + pt[j2].y) / 2 - pt[0].y;
      ey = pt[j2].x - pt[i2].x;
      ex = -(pt[j2].y - pt[i2].y);
      a = (x2 - 2 * x * px) / k + px * px;
      b = (xy - x * py - y * px) / k + px * py;
      c = (y2 - 2 * y * py) / k + py * py;
      s = ex * ex * a + 2 * ex * ey * b + ey * ey * c;
      return Math.sqrt(s);
    }
    const n = path.points.length;
    const pen = new Array(n + 1);
    const prev = new Array(n + 1);
    const clip0 = new Array(n);
    const clip1 = new Array(n + 1);
    const seg0 = new Array(n + 1);
    const seg1 = new Array(n + 1);
    for (let i2 = 0; i2 < n; i2++) {
      let c = mod(path.lon[mod(i2 - 1, n)] - 1, n);
      if (c === i2) {
        c = mod(i2 + 1, n);
      }
      if (c < i2) {
        clip0[i2] = n;
      } else {
        clip0[i2] = c;
      }
    }
    let j = 1;
    for (let i2 = 0; i2 < n; i2++) {
      while (j <= clip0[i2]) {
        clip1[j] = i2;
        j++;
      }
    }
    let i = 0;
    for (j = 0; i < n; j++) {
      seg0[j] = i;
      i = clip0[i];
    }
    seg0[j] = n;
    const m = j;
    i = n;
    for (j = m; j > 0; j--) {
      seg1[j] = i;
      i = clip1[i];
    }
    seg1[0] = 0;
    pen[0] = 0;
    for (j = 1; j <= m; j++) {
      for (i = seg1[j]; i <= seg0[j]; i++) {
        let best = -1;
        for (let k = seg0[j - 1]; k >= clip1[i]; k--) {
          const thispen = penalty3(path, k, i) + pen[k];
          if (best < 0 || thispen < best) {
            prev[i] = k;
            best = thispen;
          }
        }
        pen[i] = best;
      }
    }
    path.m = m;
    path.po = new Array(m);
    for (i = n, j = m - 1; i > 0; j--) {
      i = prev[i];
      path.po[j] = i;
    }
  }
  function adjustVertices(path) {
    function pointslope(path2, i, j, ctr2, dir2) {
      const n2 = path2.points.length;
      const sums = path2.sums;
      let r = 0;
      while (j >= n2) {
        j -= n2;
        r += 1;
      }
      while (i >= n2) {
        i -= n2;
        r -= 1;
      }
      while (j < 0) {
        j += n2;
        r -= 1;
      }
      while (i < 0) {
        i += n2;
        r += 1;
      }
      const x = sums[j + 1].x - sums[i].x + r * sums[n2].x;
      const y = sums[j + 1].y - sums[i].y + r * sums[n2].y;
      const x2 = sums[j + 1].x2 - sums[i].x2 + r * sums[n2].x2;
      const xy = sums[j + 1].xy - sums[i].xy + r * sums[n2].xy;
      const y2 = sums[j + 1].y2 - sums[i].y2 + r * sums[n2].y2;
      const k = j + 1 - i + r * n2;
      ctr2.x = x / k;
      ctr2.y = y / k;
      let a = (x2 - x * x / k) / k;
      const b = (xy - x * y / k) / k;
      let c = (y2 - y * y / k) / k;
      const lambda2 = (a + c + Math.sqrt((a - c) * (a - c) + 4 * b * b)) / 2;
      a -= lambda2;
      c -= lambda2;
      let l;
      if (Math.abs(a) >= Math.abs(c)) {
        l = Math.sqrt(a * a + b * b);
        if (l !== 0) {
          dir2.x = -b / l;
          dir2.y = a / l;
        }
      } else {
        l = Math.sqrt(c * c + b * b);
        if (l !== 0) {
          dir2.x = -c / l;
          dir2.y = b / l;
        }
      }
      if (l === 0) {
        dir2.x = dir2.y = 0;
      }
    }
    const m = path.m;
    const po = path.po;
    const n = path.points.length;
    const pt = path.points;
    const x0 = path.x0;
    const y0 = path.y0;
    const ctr = new Array(m);
    const dir = new Array(m);
    const q = new Array(m);
    const v = [0, 0, 0];
    const s = new Point();
    path.curve = new Curve(m);
    for (let i = 0; i < m; i++) {
      let j = po[mod(i + 1, m)];
      j = mod(j - po[i], n) + po[i];
      ctr[i] = new Point();
      dir[i] = new Point();
      pointslope(path, po[i], j, ctr[i], dir[i]);
    }
    for (let i = 0; i < m; i++) {
      q[i] = new Quad();
      const d = dir[i].x * dir[i].x + dir[i].y * dir[i].y;
      if (d === 0) {
        for (let j = 0; j < 3; j++) {
          for (let k = 0; k < 3; k++) {
            q[i].data[j * 3 + k] = 0;
          }
        }
      } else {
        v[0] = dir[i].y;
        v[1] = -dir[i].x;
        v[2] = -v[1] * ctr[i].y - v[0] * ctr[i].x;
        for (let l = 0; l < 3; l++) {
          for (let k = 0; k < 3; k++) {
            q[i].data[l * 3 + k] = v[l] * v[k] / d;
          }
        }
      }
    }
    const w = new Point();
    for (let i = 0; i < m; i++) {
      const Q = new Quad();
      s.x = pt[po[i]].x - x0;
      s.y = pt[po[i]].y - y0;
      const j = mod(i - 1, m);
      for (let l = 0; l < 3; l++) {
        for (let k = 0; k < 3; k++) {
          Q.data[l * 3 + k] = q[j].at(l, k) + q[i].at(l, k);
        }
      }
      while (true) {
        const det = Q.at(0, 0) * Q.at(1, 1) - Q.at(0, 1) * Q.at(1, 0);
        if (det !== 0) {
          w.x = (-Q.at(0, 2) * Q.at(1, 1) + Q.at(1, 2) * Q.at(0, 1)) / det;
          w.y = (Q.at(0, 2) * Q.at(1, 0) - Q.at(1, 2) * Q.at(0, 0)) / det;
          break;
        }
        if (Q.at(0, 0) > Q.at(1, 1)) {
          v[0] = -Q.at(0, 1);
          v[1] = Q.at(0, 0);
        } else if (Q.at(1, 1)) {
          v[0] = -Q.at(1, 1);
          v[1] = Q.at(1, 0);
        } else {
          v[0] = 1;
          v[1] = 0;
        }
        const d = v[0] * v[0] + v[1] * v[1];
        v[2] = -v[1] * s.y - v[0] * s.x;
        for (let l = 0; l < 3; l++) {
          for (let k = 0; k < 3; k++) {
            Q.data[l * 3 + k] += v[l] * v[k] / d;
          }
        }
      }
      const dx = Math.abs(w.x - s.x);
      const dy = Math.abs(w.y - s.y);
      if (dx <= 0.5 && dy <= 0.5) {
        path.curve.vertex[i] = new Point(w.x + x0, w.y + y0);
        continue;
      }
      let min = quadform(Q, s);
      let xmin = s.x;
      let ymin = s.y;
      if (Q.at(0, 0) !== 0) {
        for (let z = 0; z < 2; z++) {
          w.y = s.y - 0.5 + z;
          w.x = -(Q.at(0, 1) * w.y + Q.at(0, 2)) / Q.at(0, 0);
          const dx2 = Math.abs(w.x - s.x);
          const cand = quadform(Q, w);
          if (dx2 <= 0.5 && cand < min) {
            min = cand;
            xmin = w.x;
            ymin = w.y;
          }
        }
      }
      if (Q.at(1, 1) !== 0) {
        for (let z = 0; z < 2; z++) {
          w.x = s.x - 0.5 + z;
          w.y = -(Q.at(1, 0) * w.x + Q.at(1, 2)) / Q.at(1, 1);
          const dy2 = Math.abs(w.y - s.y);
          const cand = quadform(Q, w);
          if (dy2 <= 0.5 && cand < min) {
            min = cand;
            xmin = w.x;
            ymin = w.y;
          }
        }
      }
      for (let l = 0; l < 2; l++) {
        for (let k = 0; k < 2; k++) {
          w.x = s.x - 0.5 + l;
          w.y = s.y - 0.5 + k;
          const cand = quadform(Q, w);
          if (cand < min) {
            min = cand;
            xmin = w.x;
            ymin = w.y;
          }
        }
      }
      path.curve.vertex[i] = new Point(xmin + x0, ymin + y0);
    }
  }
  function smooth(path, info) {
    const m = path.curve.n;
    const curve = path.curve;
    for (let i = 0; i < m; i++) {
      const j = mod(i + 1, m);
      const k = mod(i + 2, m);
      const p4 = curve.vertex[k].lerp(curve.vertex[j], 0.5);
      const denom = curve.vertex[i].ddenom(curve.vertex[k]);
      let alpha;
      if (denom !== 0) {
        const dd = dpara(curve.vertex[i], curve.vertex[j], curve.vertex[k]) / denom;
        const ddAbs = Math.abs(dd);
        alpha = ddAbs > 1 ? 1 - 1 / ddAbs : 0;
        alpha = alpha / 0.75;
      } else {
        alpha = 4 / 3;
      }
      curve.alpha0[j] = alpha;
      if (alpha >= info.alphamax) {
        curve.tag[j] = "CORNER";
        curve.c[3 * j + 1] = curve.vertex[j];
        curve.c[3 * j + 2] = p4;
      } else {
        if (alpha < 0.55) {
          alpha = 0.55;
        } else if (alpha > 1) {
          alpha = 1;
        }
        const lambda = 0.5 + 0.5 * alpha;
        const p2 = curve.vertex[i].lerp(curve.vertex[j], lambda);
        const p3 = curve.vertex[k].lerp(curve.vertex[j], lambda);
        curve.tag[j] = "CURVE";
        curve.c[3 * j + 0] = p2;
        curve.c[3 * j + 1] = p3;
        curve.c[3 * j + 2] = p4;
      }
      curve.alpha[j] = alpha;
      curve.beta[j] = 0.5;
    }
    curve.alphaCurve = 1;
  }
  var Opti = class {
    constructor() {
      this.pen = 0;
      this.c = [new Point(), new Point()];
      this.t = 0;
      this.s = 0;
      this.alpha = 0;
    }
  };
  function optiCurve(path, info) {
    function opti_penalty(path2, i, j2, res, opttolerance, convc2, areac2) {
      const m2 = path2.curve.n;
      const curve2 = path2.curve;
      const vertex = curve2.vertex;
      if (i === j2) {
        return 1;
      }
      let k = i;
      const i1 = mod(i + 1, m2);
      let k1 = mod(k + 1, m2);
      const conv = convc2[k1];
      if (conv === 0) {
        return 1;
      }
      const d = ddist(vertex[i], vertex[i1]);
      for (k = k1; k !== j2; k = k1) {
        k1 = mod(k + 1, m2);
        const k2 = mod(k + 2, m2);
        if (convc2[k1] !== conv) {
          return 1;
        }
        if (sign2(cprod(vertex[i], vertex[i1], vertex[k1], vertex[k2])) !== conv) {
          return 1;
        }
        if (iprod1(vertex[i], vertex[i1], vertex[k1], vertex[k2]) < d * ddist(vertex[k1], vertex[k2]) * -0.999847695156) {
          return 1;
        }
      }
      const p02 = curve2.c[mod(i, m2) * 3 + 2].copy();
      const p1 = vertex[mod(i + 1, m2)].copy();
      const p2 = vertex[mod(j2, m2)].copy();
      const p3 = curve2.c[mod(j2, m2) * 3 + 2].copy();
      let area2 = areac2[j2] - areac2[i];
      area2 -= dpara(vertex[0], curve2.c[i * 3 + 2], curve2.c[j2 * 3 + 2]) / 2;
      if (i >= j2) {
        area2 += areac2[m2];
      }
      const A1 = dpara(p02, p1, p2);
      const A2 = dpara(p02, p1, p3);
      const A3 = dpara(p02, p2, p3);
      const A4 = A1 + A3 - A2;
      if (A2 === A1) {
        return 1;
      }
      const t2 = A3 / (A3 - A4);
      const s2 = A2 / (A2 - A1);
      const A = A2 * t2 / 2;
      if (A === 0) {
        return 1;
      }
      const R = area2 / A;
      const alpha = 2 - Math.sqrt(4 - R / 0.3);
      res.c[0] = p02.lerp(p1, t2 * alpha);
      res.c[1] = p3.lerp(p2, s2 * alpha);
      res.alpha = alpha;
      res.t = t2;
      res.s = s2;
      const newP1 = res.c[0].copy();
      const newP2 = res.c[1].copy();
      res.pen = 0;
      for (k = mod(i + 1, m2); k !== j2; k = k1) {
        k1 = mod(k + 1, m2);
        const t3 = tangent(p02, newP1, newP2, p3, vertex[k], vertex[k1]);
        if (t3 < -0.5) {
          return 1;
        }
        const pt2 = bezier(t3, p02, newP1, newP2, p3);
        const d2 = ddist(vertex[k], vertex[k1]);
        if (d2 === 0) {
          return 1;
        }
        const d1 = dpara(vertex[k], vertex[k1], pt2) / d2;
        if (Math.abs(d1) > opttolerance) {
          return 1;
        }
        if (iprod(vertex[k], vertex[k1], pt2) < 0 || iprod(vertex[k1], vertex[k], pt2) < 0) {
          return 1;
        }
        res.pen += d1 * d1;
      }
      for (k = i; k !== j2; k = k1) {
        k1 = mod(k + 1, m2);
        const t3 = tangent(p02, newP1, newP2, p3, curve2.c[k * 3 + 2], curve2.c[k1 * 3 + 2]);
        if (t3 < -0.5) {
          return 1;
        }
        const pt2 = bezier(t3, p02, newP1, newP2, p3);
        const d2 = ddist(curve2.c[k * 3 + 2], curve2.c[k1 * 3 + 2]);
        if (d2 === 0) {
          return 1;
        }
        let d1 = dpara(curve2.c[k * 3 + 2], curve2.c[k1 * 3 + 2], pt2) / d2;
        let d22 = dpara(curve2.c[k * 3 + 2], curve2.c[k1 * 3 + 2], vertex[k1]) / d2;
        d22 *= 0.75 * curve2.alpha[k1];
        if (d22 < 0) {
          d1 = -d1;
          d22 = -d22;
        }
        if (d1 < d22 - opttolerance) {
          return 1;
        }
        if (d1 < d22) {
          res.pen += (d1 - d22) * (d1 - d22);
        }
      }
      return 0;
    }
    const curve = path.curve;
    const m = curve.n;
    const vert = curve.vertex;
    const pt = new Array(m + 1);
    const pen = new Array(m + 1);
    const len = new Array(m + 1);
    const opt = new Array(m + 1);
    const convc = new Array(m);
    const areac = new Array(m + 1);
    for (let i = 0; i < m; i++) {
      if (curve.tag[i] === "CURVE") {
        convc[i] = sign2(dpara(vert[mod(i - 1, m)], vert[i], vert[mod(i + 1, m)]));
      } else {
        convc[i] = 0;
      }
    }
    let area = 0;
    areac[0] = 0;
    const p0 = curve.vertex[0];
    for (let i = 0; i < m; i++) {
      const i1 = mod(i + 1, m);
      if (curve.tag[i1] === "CURVE") {
        const alpha = curve.alpha[i1];
        area += 0.3 * alpha * (4 - alpha) * dpara(curve.c[i * 3 + 2], vert[i1], curve.c[i1 * 3 + 2]) / 2;
        area += dpara(p0, curve.c[i * 3 + 2], curve.c[i1 * 3 + 2]) / 2;
      }
      areac[i + 1] = area;
    }
    pt[0] = -1;
    pen[0] = 0;
    len[0] = 0;
    let o = new Opti();
    for (let j2 = 1; j2 <= m; j2++) {
      pt[j2] = j2 - 1;
      pen[j2] = pen[j2 - 1];
      len[j2] = len[j2 - 1] + 1;
      for (let i = j2 - 2; i >= 0; i--) {
        const r = opti_penalty(path, i, mod(j2, m), o, info.opttolerance, convc, areac);
        if (r) {
          break;
        }
        if (len[j2] > len[i] + 1 || len[j2] === len[i] + 1 && pen[j2] > pen[i] + o.pen) {
          pt[j2] = i;
          pen[j2] = pen[i] + o.pen;
          len[j2] = len[i] + 1;
          opt[j2] = o;
          o = new Opti();
        }
      }
    }
    const om = len[m];
    const ocurve = new Curve(om);
    const s = new Array(om);
    const t = new Array(om);
    let j = m;
    for (let i = om - 1; i >= 0; i--) {
      if (pt[j] === j - 1) {
        ocurve.tag[i] = curve.tag[mod(j, m)];
        ocurve.c[i * 3 + 0] = curve.c[mod(j, m) * 3 + 0];
        ocurve.c[i * 3 + 1] = curve.c[mod(j, m) * 3 + 1];
        ocurve.c[i * 3 + 2] = curve.c[mod(j, m) * 3 + 2];
        ocurve.vertex[i] = curve.vertex[mod(j, m)];
        ocurve.alpha[i] = curve.alpha[mod(j, m)];
        ocurve.alpha0[i] = curve.alpha0[mod(j, m)];
        ocurve.beta[i] = curve.beta[mod(j, m)];
        s[i] = t[i] = 1;
      } else {
        ocurve.tag[i] = "CURVE";
        ocurve.c[i * 3 + 0] = opt[j].c[0];
        ocurve.c[i * 3 + 1] = opt[j].c[1];
        ocurve.c[i * 3 + 2] = curve.c[mod(j, m) * 3 + 2];
        ocurve.vertex[i] = curve.c[mod(j, m) * 3 + 2].lerp(vert[mod(j, m)], opt[j].s);
        ocurve.alpha[i] = opt[j].alpha;
        ocurve.alpha0[i] = opt[j].alpha;
        s[i] = opt[j].s;
        t[i] = opt[j].t;
      }
      j = pt[j];
    }
    for (let i = 0; i < om; i++) {
      const i1 = mod(i + 1, om);
      ocurve.beta[i] = s[i] / (s[i] + t[i1]);
    }
    ocurve.alphaCurve = 1;
    path.curve = ocurve;
  }

  // node_modules/@cadit-app/potrace-ts/dist/getSVG.js
  function getSVG(pathList, size = 1, optType) {
    function pathToSvg(curve) {
      function bezier2(i) {
        let b = "C " + (curve.c[i * 3 + 0].x * size).toFixed(3) + " " + (curve.c[i * 3 + 0].y * size).toFixed(3) + ",";
        b += (curve.c[i * 3 + 1].x * size).toFixed(3) + " " + (curve.c[i * 3 + 1].y * size).toFixed(3) + ",";
        b += (curve.c[i * 3 + 2].x * size).toFixed(3) + " " + (curve.c[i * 3 + 2].y * size).toFixed(3) + " ";
        return b;
      }
      function segment(i) {
        let s = "L " + (curve.c[i * 3 + 1].x * size).toFixed(3) + " " + (curve.c[i * 3 + 1].y * size).toFixed(3) + " ";
        s += (curve.c[i * 3 + 2].x * size).toFixed(3) + " " + (curve.c[i * 3 + 2].y * size).toFixed(3) + " ";
        return s;
      }
      const n = curve.n;
      let p = "M" + (curve.c[(n - 1) * 3 + 2].x * size).toFixed(3) + " " + (curve.c[(n - 1) * 3 + 2].y * size).toFixed(3) + " ";
      for (let i = 0; i < n; i++) {
        if (curve.tag[i] === "CURVE") {
          p += bezier2(i);
        } else if (curve.tag[i] === "CORNER") {
          p += segment(i);
        }
      }
      return p;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const path of pathList) {
      minX = Math.min(minX, path.minX);
      minY = Math.min(minY, path.minY);
      maxX = Math.max(maxX, path.maxX);
      maxY = Math.max(maxY, path.maxY);
    }
    const w = Math.ceil((maxX - minX) * size);
    const h = Math.ceil((maxY - minY) * size);
    let svg = '<svg id="svg" version="1.1" width="' + w + '" height="' + h + '" xmlns="http://www.w3.org/2000/svg">';
    svg += '<path d="';
    for (const path of pathList) {
      svg += pathToSvg(path.curve);
    }
    let strokec, fillc, fillrule;
    if (optType === "curve") {
      strokec = "black";
      fillc = "none";
      fillrule = "";
    } else {
      strokec = "none";
      fillc = "black";
      fillrule = ' fill-rule="evenodd"';
    }
    svg += '" stroke="' + strokec + '" fill="' + fillc + '"' + fillrule + "/></svg>";
    return svg;
  }

  // node_modules/@cadit-app/potrace-ts/dist/getPaths.js
  function getPaths(pathlist) {
    function path(curve) {
      function bezier2(i) {
        return {
          type: "CURVE",
          x1: curve.c[i * 3 + 0].x,
          y1: curve.c[i * 3 + 0].y,
          x2: curve.c[i * 3 + 1].x,
          y2: curve.c[i * 3 + 1].y,
          x: curve.c[i * 3 + 2].x,
          y: curve.c[i * 3 + 2].y
        };
      }
      function segment(i) {
        return [
          {
            type: "POINT",
            x: curve.c[i * 3 + 1].x,
            y: curve.c[i * 3 + 1].y
          },
          {
            type: "POINT",
            x: curve.c[i * 3 + 2].x,
            y: curve.c[i * 3 + 2].y
          }
        ];
      }
      const p = [];
      const n = curve.n;
      const x = curve.c[(n - 1) * 3 + 2].x;
      const y = curve.c[(n - 1) * 3 + 2].y;
      p.push({
        type: "POINT",
        x,
        y
      });
      for (let i = 0; i < n; i++) {
        if (curve.tag[i] === "CURVE") {
          p.push(bezier2(i));
        } else if (curve.tag[i] === "CORNER") {
          const s = segment(i);
          p.push(s[0], s[1]);
        }
      }
      return p;
    }
    const paths = [];
    for (const pathItem of pathlist) {
      paths.push(path(pathItem.curve));
    }
    return paths;
  }

  // node_modules/@cadit-app/potrace-ts/dist/index.js
  var DEFAULT_OPTIONS = {
    turnpolicy: "right",
    turdsize: 2,
    optcurve: true,
    alphamax: 1,
    opttolerance: 0.2
  };
  async function traceUrl(url, options) {
    const image = await loadImage(url);
    return traceImage(image, options);
  }
  function traceImage(image, options) {
    if (typeof document === "undefined") {
      throw new Error("traceImage requires a DOM environment. Use traceBitmap for worker-compatible tracing.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not get 2D context from canvas");
    }
    context.drawImage(image, 0, 0);
    return traceCanvas(canvas, options);
  }
  function traceCanvas(canvas, options) {
    const bitmap = createBitmap(canvas);
    return traceBitmap(bitmap, options);
  }
  function traceImageData(imageData, options, threshold = 128) {
    const bitmap = imageDataToBitmap(imageData, threshold);
    return traceBitmap(bitmap, options);
  }
  var THRESHOLD_AUTO = -1;
  function traceDataUrl(dataUrl, options) {
    const imageData = decodeImageDataUrl(dataUrl);
    const threshold = options?.threshold === void 0 || options.threshold === THRESHOLD_AUTO ? calculateAutoThreshold(imageData) : options.threshold;
    let blackOnWhite = true;
    if (options?.blackOnWhite !== void 0) {
      blackOnWhite = options.blackOnWhite;
    } else if (options?.invert !== void 0) {
      blackOnWhite = !options.invert;
    }
    console.log("[potrace-ts] traceDataUrl:", {
      imageSize: `${imageData.width}x${imageData.height}`,
      totalPixels: imageData.data.length / 4,
      threshold,
      blackOnWhite
    });
    const bitmap = imageDataToBitmap(imageData, threshold, blackOnWhite);
    const paths = traceBitmap(bitmap, options);
    console.log("[potrace-ts] Tracing complete:", {
      pathCount: paths.length,
      bitmapSize: `${bitmap.width}x${bitmap.height}`
    });
    return paths;
  }
  function traceBitmap(bitmap, options) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const pathList = bitmapToPathList(bitmap, opts);
    processPath(pathList, opts);
    return pathList;
  }
  return __toCommonJS(index_exports);
})();
