var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../node_modules/.bun/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
var init_utils = __esm({
  "../../node_modules/.bun/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
  }
});

// ../../node_modules/.bun/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance;
var init_performance = __esm({
  "../../node_modules/.bun/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
      name: "node",
      entryType: "node",
      startTime: 0,
      duration: 0,
      nodeStart: 0,
      v8Start: 0,
      bootstrapComplete: 0,
      environment: 0,
      loopStart: 0,
      loopExit: 0,
      idleTime: 0,
      uvMetricsInfo: {
        loopCount: 0,
        events: 0,
        eventsWaiting: 0
      },
      detail: void 0,
      toJSON() {
        return this;
      }
    };
    PerformanceEntry = class {
      static {
        __name(this, "PerformanceEntry");
      }
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || _performanceNow();
        this.detail = options?.detail;
      }
      get duration() {
        return _performanceNow() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    };
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
      static {
        __name(this, "PerformanceMark");
      }
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    };
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceResourceTiming");
      }
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    };
    PerformanceObserverEntryList = class {
      static {
        __name(this, "PerformanceObserverEntryList");
      }
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type) {
        return [];
      }
    };
    Performance = class {
      static {
        __name(this, "Performance");
      }
      __unenv__ = true;
      timeOrigin = _timeOrigin;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = void 0;
      timing = void 0;
      timerify(_fn, _options) {
        throw createNotImplementedError("Performance.timerify");
      }
      get nodeTiming() {
        return nodeTiming;
      }
      eventLoopUtilization() {
        return {};
      }
      markResourceTiming() {
        return new PerformanceResourceTiming("");
      }
      onresourcetimingbufferfull = null;
      now() {
        if (this.timeOrigin === _timeOrigin) {
          return _performanceNow();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
      }
      getEntriesByType(type) {
        return this._entries.filter((e) => e.entryType === type);
      }
      mark(name, options) {
        const entry = new PerformanceMark(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
        }
        const entry = new PerformanceMeasure(measureName, {
          startTime: start,
          detail: {
            start,
            end
          }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      addEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.addEventListener");
      }
      removeEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw createNotImplementedError("Performance.dispatchEvent");
      }
      toJSON() {
        return this;
      }
    };
    PerformanceObserver = class {
      static {
        __name(this, "PerformanceObserver");
      }
      __unenv__ = true;
      static supportedEntryTypes = [];
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw createNotImplementedError("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw createNotImplementedError("PerformanceObserver.observe");
      }
      bind(fn) {
        return fn;
      }
      runInAsyncScope(fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      asyncId() {
        return 0;
      }
      triggerAsyncId() {
        return 0;
      }
      emitDestroy() {
        return this;
      }
    };
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// ../../node_modules/.bun/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "../../node_modules/.bun/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_performance2();
    init_performance();
  }
});

// ../../node_modules/.bun/@cloudflare+unenv-preset@2.15.0+e3aad81d78762d27/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "../../node_modules/.bun/@cloudflare+unenv-preset@2.15.0+e3aad81d78762d27/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});

// ../../node_modules/.bun/gnosis_runtime@file+open-source+gnosis+runtime+pkg/node_modules/gnosis_runtime/gnosis_runtime.js
var gnosis_runtime_exports = {};
__export(gnosis_runtime_exports, {
  FlowFrame: () => FlowFrame,
  QuantumRuntime: () => QuantumRuntime,
  default: () => __wbg_init,
  initSync: () => initSync
});
function __wbg_get_imports() {
  const import0 = {
    __proto__: null,
    __wbg___wbindgen_throw_6ddd609b62940d55: /* @__PURE__ */ __name(function(arg0, arg1) {
      throw new Error(getStringFromWasm0(arg0, arg1));
    }, "__wbg___wbindgen_throw_6ddd609b62940d55"),
    __wbindgen_cast_0000000000000001: /* @__PURE__ */ __name(function(arg0, arg1) {
      const ret = getStringFromWasm0(arg0, arg1);
      return ret;
    }, "__wbindgen_cast_0000000000000001"),
    __wbindgen_init_externref_table: /* @__PURE__ */ __name(function() {
      const table = wasm.__wbindgen_externrefs;
      const offset = table.grow(4);
      table.set(0, void 0);
      table.set(offset + 0, void 0);
      table.set(offset + 1, null);
      table.set(offset + 2, true);
      table.set(offset + 3, false);
    }, "__wbindgen_init_externref_table")
  };
  return {
    __proto__: null,
    "./gnosis_runtime_bg.js": import0
  };
}
function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}
function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return decodeText(ptr, len);
}
function getUint8ArrayMemory0() {
  if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}
function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1, 1) >>> 0;
  getUint8ArrayMemory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}
function takeFromExternrefTable0(idx) {
  const value = wasm.__wbindgen_externrefs.get(idx);
  wasm.__externref_table_dealloc(idx);
  return value;
}
function decodeText(ptr, len) {
  numBytesDecoded += len;
  if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
    cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
    cachedTextDecoder.decode();
    numBytesDecoded = len;
  }
  return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
function __wbg_finalize_init(instance, module) {
  wasm = instance.exports;
  wasmModule = module;
  cachedUint8ArrayMemory0 = null;
  wasm.__wbindgen_start();
  return wasm;
}
async function __wbg_load(module, imports) {
  if (typeof Response === "function" && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        const validResponse = module.ok && expectedResponseType(module.type);
        if (validResponse && module.headers.get("Content-Type") !== "application/wasm") {
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
        } else {
          throw e;
        }
      }
    }
    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);
    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };
    } else {
      return instance;
    }
  }
  function expectedResponseType(type) {
    switch (type) {
      case "basic":
      case "cors":
      case "default":
        return true;
    }
    return false;
  }
  __name(expectedResponseType, "expectedResponseType");
}
function initSync(module) {
  if (wasm !== void 0) return wasm;
  if (module !== void 0) {
    if (Object.getPrototypeOf(module) === Object.prototype) {
      ({ module } = module);
    } else {
      console.warn("using deprecated parameters for `initSync()`; pass a single object instead");
    }
  }
  const imports = __wbg_get_imports();
  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module);
  }
  const instance = new WebAssembly.Instance(module, imports);
  return __wbg_finalize_init(instance, module);
}
async function __wbg_init(module_or_path) {
  if (wasm !== void 0) return wasm;
  if (module_or_path !== void 0) {
    if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
      ({ module_or_path } = module_or_path);
    } else {
      console.warn("using deprecated parameters for the initialization function; pass a single object instead");
    }
  }
  if (module_or_path === void 0) {
    module_or_path = new URL("gnosis_runtime_bg.wasm", import.meta.url);
  }
  const imports = __wbg_get_imports();
  if (typeof module_or_path === "string" || typeof Request === "function" && module_or_path instanceof Request || typeof URL === "function" && module_or_path instanceof URL) {
    module_or_path = fetch(module_or_path);
  }
  const { instance, module } = await __wbg_load(await module_or_path, imports);
  return __wbg_finalize_init(instance, module);
}
var FlowFrame, QuantumRuntime, FlowFrameFinalization, QuantumRuntimeFinalization, cachedUint8ArrayMemory0, cachedTextDecoder, MAX_SAFARI_DECODE_BYTES, numBytesDecoded, WASM_VECTOR_LEN, wasmModule, wasm;
var init_gnosis_runtime = __esm({
  "../../node_modules/.bun/gnosis_runtime@file+open-source+gnosis+runtime+pkg/node_modules/gnosis_runtime/gnosis_runtime.js"() {
    init_performance2();
    FlowFrame = class _FlowFrame {
      static {
        __name(this, "FlowFrame");
      }
      static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(_FlowFrame.prototype);
        obj.__wbg_ptr = ptr;
        FlowFrameFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
      }
      __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FlowFrameFinalization.unregister(this);
        return ptr;
      }
      free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_flowframe_free(ptr, 0);
      }
      /**
       * @param {number} stream_id
       * @param {number} sequence
       * @param {number} flags
       * @param {Uint8Array} payload
       * @returns {FlowFrame}
       */
      static create(stream_id, sequence, flags, payload) {
        const ptr0 = passArray8ToWasm0(payload, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.flowframe_create(stream_id, sequence, flags, ptr0, len0);
        if (ret[2]) {
          throw takeFromExternrefTable0(ret[1]);
        }
        return _FlowFrame.__wrap(ret[0]);
      }
      /**
       * @param {Uint8Array} bytes
       * @param {number} offset
       * @returns {FlowFrame}
       */
      static decode(bytes, offset) {
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.flowframe_decode(ptr0, len0, offset);
        if (ret[2]) {
          throw takeFromExternrefTable0(ret[1]);
        }
        return _FlowFrame.__wrap(ret[0]);
      }
      /**
       * @returns {Uint8Array}
       */
      encode() {
        const ret = wasm.flowframe_encode(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
      }
      /**
       * @returns {Uint8Array}
       */
      get_payload() {
        const ret = wasm.flowframe_get_payload(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
      }
      /**
       * @returns {number}
       */
      get flags() {
        const ret = wasm.__wbg_get_flowframe_flags(this.__wbg_ptr);
        return ret;
      }
      /**
       * @returns {number}
       */
      get sequence() {
        const ret = wasm.__wbg_get_flowframe_sequence(this.__wbg_ptr);
        return ret >>> 0;
      }
      /**
       * @returns {number}
       */
      get stream_id() {
        const ret = wasm.__wbg_get_flowframe_stream_id(this.__wbg_ptr);
        return ret;
      }
      /**
       * @param {number} arg0
       */
      set flags(arg0) {
        wasm.__wbg_set_flowframe_flags(this.__wbg_ptr, arg0);
      }
      /**
       * @param {number} arg0
       */
      set sequence(arg0) {
        wasm.__wbg_set_flowframe_sequence(this.__wbg_ptr, arg0);
      }
      /**
       * @param {number} arg0
       */
      set stream_id(arg0) {
        wasm.__wbg_set_flowframe_stream_id(this.__wbg_ptr, arg0);
      }
    };
    if (Symbol.dispose) FlowFrame.prototype[Symbol.dispose] = FlowFrame.prototype.free;
    QuantumRuntime = class {
      static {
        __name(this, "QuantumRuntime");
      }
      __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        QuantumRuntimeFinalization.unregister(this);
        return ptr;
      }
      free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_quantumruntime_free(ptr, 0);
      }
      /**
       * @returns {string}
       */
      get_trace() {
        let deferred1_0;
        let deferred1_1;
        try {
          const ret = wasm.quantumruntime_get_trace(this.__wbg_ptr);
          deferred1_0 = ret[0];
          deferred1_1 = ret[1];
          return getStringFromWasm0(ret[0], ret[1]);
        } finally {
          wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
      }
      /**
       * @returns {string}
       */
      metrics() {
        let deferred1_0;
        let deferred1_1;
        try {
          const ret = wasm.quantumruntime_metrics(this.__wbg_ptr);
          deferred1_0 = ret[0];
          deferred1_1 = ret[1];
          return getStringFromWasm0(ret[0], ret[1]);
        } finally {
          wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
      }
      constructor() {
        const ret = wasm.quantumruntime_new();
        this.__wbg_ptr = ret >>> 0;
        QuantumRuntimeFinalization.register(this, this.__wbg_ptr, this);
        return this;
      }
      /**
       * Takes a raw Aeon FlowFrame byte buffer, processes the topology based on flags,
       * and returns a resulting frame (simulating a zero-copy pass-through).
       * @param {Uint8Array} encoded_bytes
       * @returns {Uint8Array}
       */
      process_frame(encoded_bytes) {
        const ptr0 = passArray8ToWasm0(encoded_bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.quantumruntime_process_frame(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
          throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v2;
      }
    };
    if (Symbol.dispose) QuantumRuntime.prototype[Symbol.dispose] = QuantumRuntime.prototype.free;
    __name(__wbg_get_imports, "__wbg_get_imports");
    FlowFrameFinalization = typeof FinalizationRegistry === "undefined" ? { register: /* @__PURE__ */ __name(() => {
    }, "register"), unregister: /* @__PURE__ */ __name(() => {
    }, "unregister") } : new FinalizationRegistry((ptr) => wasm.__wbg_flowframe_free(ptr >>> 0, 1));
    QuantumRuntimeFinalization = typeof FinalizationRegistry === "undefined" ? { register: /* @__PURE__ */ __name(() => {
    }, "register"), unregister: /* @__PURE__ */ __name(() => {
    }, "unregister") } : new FinalizationRegistry((ptr) => wasm.__wbg_quantumruntime_free(ptr >>> 0, 1));
    __name(getArrayU8FromWasm0, "getArrayU8FromWasm0");
    __name(getStringFromWasm0, "getStringFromWasm0");
    cachedUint8ArrayMemory0 = null;
    __name(getUint8ArrayMemory0, "getUint8ArrayMemory0");
    __name(passArray8ToWasm0, "passArray8ToWasm0");
    __name(takeFromExternrefTable0, "takeFromExternrefTable0");
    cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
    cachedTextDecoder.decode();
    MAX_SAFARI_DECODE_BYTES = 2146435072;
    numBytesDecoded = 0;
    __name(decodeText, "decodeText");
    WASM_VECTOR_LEN = 0;
    __name(__wbg_finalize_init, "__wbg_finalize_init");
    __name(__wbg_load, "__wbg_load");
    __name(initSync, "initSync");
    __name(__wbg_init, "__wbg_init");
  }
});

// src/worker.ts
init_performance2();

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/index.js
init_performance2();

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/hono.js
init_performance2();

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/hono-base.js
init_performance2();

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/compose.js
init_performance2();
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/context.js
init_performance2();

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/request.js
init_performance2();

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/http-exception.js
init_performance2();

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/request/constants.js
init_performance2();
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/utils/body.js
init_performance2();
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/utils/url.js
init_performance2();
var splitPath = /* @__PURE__ */ __name((path3) => {
  const paths = path3.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path: path3 } = extractGroupsFromPath(routePath);
  const paths = splitPath(path3);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path3) => {
  const groups = [];
  path3 = path3.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path: path3 };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder3) => {
  try {
    return decoder3(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder3(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path3 = url.slice(start, end);
      return tryDecodeURI(path3.includes("%25") ? path3.replace(/%25/g, "%2525") : path3);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path3) => {
  if (path3.charCodeAt(path3.length - 1) !== 63 || !path3.includes(":")) {
    return null;
  }
  const segments = path3.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path3 = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path3;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text2) => JSON.parse(text2));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/utils/html.js
init_performance2();
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text2, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text2) : this.#newResponse(
      text2,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/router.js
init_performance2();
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/utils/constants.js
init_performance2();
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path3, ...handlers) => {
      for (const p of [path3].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path3, app2) {
    const subApp = this.basePath(path3);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path3) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path3);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path3, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path3);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path3, "*"), handler);
    return this;
  }
  #addRoute(method, path3, handler) {
    method = method.toUpperCase();
    path3 = mergePath(this._basePath, path3);
    const r = { basePath: this._basePath, path: path3, method, handler };
    this.router.add(method, path3, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path3 = this.getPath(request, { env });
    const matchResult = this.router.match(method, path3);
    const c = new Context(request, {
      path: path3,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/router/reg-exp-router/index.js
init_performance2();

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/router/reg-exp-router/router.js
init_performance2();

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/router/reg-exp-router/matcher.js
init_performance2();
var emptyParam = [];
function match(method, path3) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path22) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path22];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path22.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path3);
}
__name(match, "match");

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/router/reg-exp-router/node.js
init_performance2();
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/router/reg-exp-router/trie.js
init_performance2();
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path3, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path3 = path3.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path3.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path3) {
  return wildcardRegExpCache[path3] ??= new RegExp(
    path3 === "*" ? "" : `^${path3.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path3, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path3] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path3, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path3) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path3) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path3)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path3, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path3 === "/*") {
      path3 = "*";
    }
    const paramCount = (path3.match(/\/:/g) || []).length;
    if (/\*$/.test(path3)) {
      const re = buildWildcardRegExp(path3);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path3] ||= findMiddleware(middleware[m], path3) || findMiddleware(middleware[METHOD_NAME_ALL], path3) || [];
        });
      } else {
        middleware[method][path3] ||= findMiddleware(middleware[method], path3) || findMiddleware(middleware[METHOD_NAME_ALL], path3) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path3) || [path3];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path22 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path22] ||= [
            ...findMiddleware(middleware[m], path22) || findMiddleware(middleware[METHOD_NAME_ALL], path22) || []
          ];
          routes[m][path22].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path3) => [path3, r[method][path3]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path3) => [path3, r[METHOD_NAME_ALL][path3]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/router/reg-exp-router/prepared-router.js
init_performance2();

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/router/smart-router/index.js
init_performance2();

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/router/smart-router/router.js
init_performance2();
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path3, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path3, handler]);
  }
  match(method, path3) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path3);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/router/trie-router/index.js
init_performance2();

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/router/trie-router/router.js
init_performance2();

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/router/trie-router/node.js
init_performance2();
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path3, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path3);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path3) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path3);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path3[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path3.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path3, handler) {
    const results = checkOptionalParameter(path3);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path3, handler);
  }
  match(method, path3) {
    return this.#node.search(method, path3);
  }
};

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// ../../node_modules/.bun/hono@4.12.7/node_modules/hono/dist/middleware/cors/index.js
init_performance2();
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// ../../shared-utils/src/services/skills/index.ts
init_performance2();

// ../../shared-utils/src/services/skills/discovery.ts
init_performance2();
function normalizeArray(values) {
  if (!values || values.length === 0) {
    return void 0;
  }
  const unique = [
    ...new Set(values.map((value) => value.trim()).filter(Boolean))
  ];
  return unique.length > 0 ? unique : void 0;
}
__name(normalizeArray, "normalizeArray");
function normalizeSkillEntry(skill) {
  return {
    id: skill.id,
    name: skill.name,
    uri: skill.uri,
    description: skill.description,
    tools: normalizeArray(skill.tools),
    tags: normalizeArray(skill.tags),
    publicUrl: skill.publicUrl,
    source: skill.source
  };
}
__name(normalizeSkillEntry, "normalizeSkillEntry");
function buildPublicSkillsIndex(options) {
  return {
    server: options.server,
    discovery: options.discovery ?? {},
    skills: options.skills.map(normalizeSkillEntry),
    featuredSkills: options.featuredSkills && options.featuredSkills.length > 0 ? [...new Set(options.featuredSkills)] : void 0,
    features: options.features && options.features.length > 0 ? options.features.map((feature) => ({
      ...feature,
      tools: normalizeArray(feature.tools),
      resources: normalizeArray(feature.resources)
    })) : void 0,
    examples: options.examples && options.examples.length > 0 ? options.examples.map((example) => ({ ...example })) : void 0
  };
}
__name(buildPublicSkillsIndex, "buildPublicSkillsIndex");
function buildSkillsListPayload(options) {
  return {
    skills: buildPublicSkillsIndex(options).skills
  };
}
__name(buildSkillsListPayload, "buildSkillsListPayload");
function buildSkillResources(skills) {
  return skills.map((skill) => ({
    uri: skill.uri,
    name: skill.name,
    description: skill.description,
    mimeType: "text/markdown"
  }));
}
__name(buildSkillResources, "buildSkillResources");
function renderSkillMarkdown(skill) {
  if (typeof skill.content === "string" && skill.content.trim().length > 0) {
    return skill.content;
  }
  const lines = [
    `# ${skill.name}`,
    "",
    "## When to use",
    skill.description,
    "",
    "## Workflow",
    "1. Confirm the goal and required inputs.",
    "2. Select the tools listed below that best fit the task.",
    "3. Execute the tools in a sensible order, preserving context between steps.",
    "4. Summarize the outcome clearly and call out any missing information.",
    "",
    "## Tool sequence"
  ];
  const tools = normalizeArray(skill.tools) ?? [];
  if (tools.length > 0) {
    for (const tool of tools) {
      lines.push(`- \`${tool}\``);
    }
  } else {
    lines.push("- No explicit tool mapping declared.");
  }
  lines.push("", "## Failure handling");
  lines.push(
    "- If a tool call fails, report the failing step and retry only with corrected inputs."
  );
  lines.push(
    "- If required context is missing, ask for that context before making assumptions."
  );
  lines.push("", "## Examples");
  lines.push(
    `- Use this skill when you need to complete the "${skill.name}" workflow reliably.`
  );
  const tags = normalizeArray(skill.tags);
  if (tags && tags.length > 0) {
    lines.push("", "## Tags");
    for (const tag of tags) {
      lines.push(`- ${tag}`);
    }
  }
  return lines.join("\n");
}
__name(renderSkillMarkdown, "renderSkillMarkdown");
function buildSkillMetadata(skill) {
  const lines = [`name: ${skill.name}`, `description: ${skill.description}`];
  const tags = normalizeArray(skill.tags);
  if (tags && tags.length > 0) {
    lines.push(`metadata.tags: ${tags.join(", ")}`);
  }
  const tools = normalizeArray(skill.tools);
  if (tools && tools.length > 0) {
    lines.push(`allowed-tools: ${tools.join(" ")}`);
  }
  return lines.join("\n") + "\n";
}
__name(buildSkillMetadata, "buildSkillMetadata");
function findSkillByUri(skills, uri) {
  const normalizedUri = uri.trim();
  const exact = skills.find(
    (entry) => normalizedUri === entry.uri || normalizedUri === `${entry.uri}/metadata` || normalizedUri === `${entry.uri}/full`
  );
  if (exact) {
    return exact;
  }
  if (!normalizedUri.startsWith("skill://")) {
    return null;
  }
  const withoutPrefix = normalizedUri.slice("skill://".length);
  const segments = withoutPrefix.split("/").map((segment) => segment.trim()).filter(Boolean);
  if (segments.length === 0) {
    return null;
  }
  const candidateSlug = segments[segments.length - 1] === "metadata" || segments[segments.length - 1] === "full" ? segments[segments.length - 2] : segments[segments.length - 1];
  if (!candidateSlug) {
    return null;
  }
  return skills.find((entry) => {
    const entrySegments = entry.uri.slice("skill://".length).split("/").map((segment) => segment.trim()).filter(Boolean);
    const entrySlug = entrySegments[entrySegments.length - 1];
    return entrySlug?.toLowerCase() === candidateSlug.toLowerCase();
  }) ?? null;
}
__name(findSkillByUri, "findSkillByUri");
function readSkillResource(skills, uri) {
  const normalizedUri = uri.trim();
  const skill = findSkillByUri(skills, normalizedUri);
  if (!skill) {
    return null;
  }
  if (normalizedUri.endsWith("/metadata")) {
    return {
      uri: normalizedUri,
      mimeType: "text/yaml",
      text: buildSkillMetadata(skill)
    };
  }
  return {
    uri: normalizedUri,
    mimeType: "text/markdown",
    text: renderSkillMarkdown(skill)
  };
}
__name(readSkillResource, "readSkillResource");
function getSkillByName(skills, skillName) {
  const normalizedName = skillName.trim().toLowerCase();
  return skills.find((skill) => {
    const candidateNames = [
      skill.name,
      skill.id,
      skill.uri.split("/").pop() ?? ""
    ];
    return candidateNames.some(
      (candidate) => candidate.trim().toLowerCase() === normalizedName
    );
  }) ?? null;
}
__name(getSkillByName, "getSkillByName");

// src/durables/GnosisDebugSessionDO.ts
init_performance2();

// ../../open-source/gnosis/src/crdt/index.ts
init_performance2();

// ../../open-source/gnosis/src/crdt/qdoc.ts
init_performance2();
var QDoc = class {
  static {
    __name(this, "QDoc");
  }
  guid;
  _replicaId;
  _clock = 0;
  _beta1 = 0;
  // Append-only topology state — this IS the document
  _nodes = /* @__PURE__ */ new Map();
  _edges = [];
  // Pending deltas not yet synced
  _pendingNodes = [];
  _pendingEdges = [];
  // Observable
  _updateHandlers = /* @__PURE__ */ new Set();
  _observeHandlers = /* @__PURE__ */ new Map();
  // Typed accessors (lazy, cached)
  _maps = /* @__PURE__ */ new Map();
  _arrays = /* @__PURE__ */ new Map();
  _texts = /* @__PURE__ */ new Map();
  _xmlFragments = /* @__PURE__ */ new Map();
  _counters = /* @__PURE__ */ new Map();
  // Presence (INTERFERE — never collapses)
  _presence = /* @__PURE__ */ new Map();
  _presenceHandlers = /* @__PURE__ */ new Set();
  _mapStrategy;
  _sequenceStrategy;
  constructor(options = {}) {
    this.guid = options.guid ?? crypto.randomUUID();
    this._replicaId = `replica-${crypto.randomUUID().slice(0, 8)}`;
    this._mapStrategy = options.mapStrategy ?? "lww";
    this._sequenceStrategy = options.sequenceStrategy ?? "ot-transform";
    this._appendNode({
      id: "root",
      labels: ["QDoc"],
      properties: { guid: this.guid }
    });
  }
  // ── Typed Accessors (replaces Y.Doc.getMap, getArray, getText) ──────────
  getMap(name) {
    let map = this._maps.get(name);
    if (!map) {
      map = new QMap(this, name, this._mapStrategy);
      this._maps.set(name, map);
    }
    return map;
  }
  getArray(name) {
    let arr = this._arrays.get(name);
    if (!arr) {
      arr = new QArray(this, name, this._sequenceStrategy);
      this._arrays.set(name, arr);
    }
    return arr;
  }
  getText(name) {
    let text2 = this._texts.get(name);
    if (!text2) {
      text2 = new QText(this, name);
      this._texts.set(name, text2);
    }
    return text2;
  }
  getXmlFragment(name) {
    let fragment = this._xmlFragments.get(name);
    if (!fragment) {
      fragment = new QXmlFragment(this, name);
      this._xmlFragments.set(name, fragment);
    }
    return fragment;
  }
  getCounter(name) {
    let counter = this._counters.get(name);
    if (!counter) {
      counter = new QCounter(this, name);
      this._counters.set(name, counter);
    }
    return counter;
  }
  /**
   * Execute a function in a transaction scope.
   * In QDoc, every operation is atomic (append-only topology), so this
   * is a compatibility shim for Y.Doc.transact() migration.
   * The function runs immediately and notifications fire after.
   */
  transact(fn, origin = "local") {
    fn();
  }
  /**
   * Destroy the document (compatibility with Y.Doc.destroy()).
   * Clears handlers. The topology itself is immutable/append-only.
   */
  destroy() {
    this._updateHandlers.clear();
    this._observeHandlers.clear();
    this._presenceHandlers.clear();
  }
  // ── Topology Mutation (internal — called by typed accessors) ────────────
  /** @internal Append a node to the topology */
  _appendNode(node) {
    this._nodes.set(node.id, node);
    this._pendingNodes.push(node);
  }
  /** @internal Append an edge to the topology */
  _appendEdge(edge) {
    this._edges.push(edge);
    this._pendingEdges.push(edge);
    if (edge.type === "FORK") {
      this._beta1 += edge.targetIds.length - 1;
    } else if (edge.type === "FOLD" || edge.type === "COLLAPSE" || edge.type === "OBSERVE") {
      this._beta1 = 0;
    } else if (edge.type === "RACE") {
      this._beta1 = Math.max(0, this._beta1 - (edge.sourceIds.length - 1));
    } else if (edge.type === "VENT" || edge.type === "TUNNEL") {
      this._beta1 = Math.max(0, this._beta1 - 1);
    }
    this._clock++;
  }
  /** @internal Get the current beta1 (superposition count) */
  get beta1() {
    return this._beta1;
  }
  /** @internal Get the logical clock */
  get clock() {
    return this._clock;
  }
  /** @internal Get the replica ID */
  get replicaId() {
    return this._replicaId;
  }
  /** @internal Emit an observe event */
  _emitObserve(path3, event) {
    const handlers = this._observeHandlers.get(path3);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch {
        }
      }
    }
  }
  /** @internal Notify update handlers */
  _notifyUpdate(origin) {
    if (this._pendingNodes.length === 0 && this._pendingEdges.length === 0) {
      return;
    }
    const delta = this.encodePendingDelta();
    for (const handler of this._updateHandlers) {
      try {
        handler(delta, origin);
      } catch {
      }
    }
  }
  // ── Sync Protocol (replaces Y.encodeStateAsUpdate / Y.applyUpdate) ─────
  /**
   * Encode the full topology state as a Uint8Array.
   * Replaces Y.encodeStateAsUpdate(doc).
   */
  encodeStateAsUpdate(_stateVector) {
    const state = {
      nodes: [...this._nodes.values()],
      edges: this._edges,
      clock: this._clock,
      replicaId: this._replicaId
    };
    return new TextEncoder().encode(JSON.stringify(state));
  }
  encodeStateVector() {
    return new Uint8Array(0);
  }
  /**
   * Encode only pending (unsynced) operations.
   * More efficient than full state for incremental sync.
   */
  encodePendingDelta() {
    const delta = {
      nodes: this._pendingNodes,
      edges: this._pendingEdges,
      clock: this._clock,
      replicaId: this._replicaId
    };
    const encoded = new TextEncoder().encode(JSON.stringify(delta));
    this._pendingNodes = [];
    this._pendingEdges = [];
    return encoded;
  }
  /**
   * Apply a remote topology delta.
   * Replaces Y.applyUpdate(doc, update).
   * Append-only — remote operations are FORK branches that get merged via OBSERVE.
   */
  applyUpdate(update, origin = "remote") {
    let delta;
    try {
      delta = JSON.parse(new TextDecoder().decode(update));
    } catch {
      return;
    }
    for (const node of delta.nodes) {
      if (!this._nodes.has(node.id)) {
        this._nodes.set(node.id, node);
      }
    }
    for (const edge of delta.edges) {
      this._edges.push(edge);
      if (edge.type === "FORK") {
        this._beta1 += edge.targetIds.length - 1;
      } else if (edge.type === "FOLD" || edge.type === "COLLAPSE" || edge.type === "OBSERVE") {
        this._beta1 = 0;
      }
    }
    if (delta.clock > this._clock) {
      this._clock = delta.clock;
    }
    for (const edge of delta.edges) {
      if (edge.properties.path) {
        this._emitObserve(edge.properties.path, {
          type: "set",
          path: edge.properties.path,
          key: edge.properties.key,
          value: edge.properties.value,
          origin
        });
      }
    }
  }
  on(event, handler) {
    if (event === "update") {
      this._updateHandlers.add(handler);
    }
  }
  off(event, handler) {
    if (event === "update") {
      this._updateHandlers.delete(handler);
    }
  }
  /**
   * Observe changes at a specific path.
   */
  observe(path3, handler) {
    let handlers = this._observeHandlers.get(path3);
    if (!handlers) {
      handlers = /* @__PURE__ */ new Set();
      this._observeHandlers.set(path3, handlers);
    }
    handlers.add(handler);
  }
  unobserve(path3, handler) {
    this._observeHandlers.get(path3)?.delete(handler);
  }
  // ── Presence (INTERFERE — never collapses) ─────────────────────────────
  /**
   * Set local presence state (replaces awareness.setLocalState).
   * Presence uses INTERFERE — it never collapses, cursors coexist.
   */
  setPresence(state) {
    this._presence.set(this._replicaId, state);
    this._notifyPresence();
  }
  /**
   * Get all presence states (replaces awareness.getStates).
   */
  getPresenceStates() {
    return new Map(this._presence);
  }
  /**
   * Apply remote presence (INTERFERE — append, never merge).
   */
  applyPresence(replicaId, state) {
    this._presence.set(replicaId, state);
    this._notifyPresence();
  }
  removePresence(replicaId) {
    this._presence.delete(replicaId);
    this._notifyPresence();
  }
  onPresenceChange(handler) {
    this._presenceHandlers.add(handler);
  }
  offPresenceChange(handler) {
    this._presenceHandlers.delete(handler);
  }
  _notifyPresence() {
    for (const handler of this._presenceHandlers) {
      try {
        handler(this.getPresenceStates());
      } catch {
      }
    }
  }
  // ── Topology Metrics ──────────────────────────────────────────────────
  get nodeCount() {
    return this._nodes.size;
  }
  get edgeCount() {
    return this._edges.length;
  }
  /**
   * Get the full topology as a GG source string (for model checking).
   */
  toGG() {
    const lines = [];
    for (const node of this._nodes.values()) {
      const label = node.labels.length > 0 ? `: ${node.labels[0]}` : "";
      const props = Object.entries(node.properties);
      const propsStr = props.length > 0 ? ` { ${props.map(([k, v]) => `${k}: '${v}'`).join(", ")} }` : "";
      lines.push(`(${node.id}${label}${propsStr})`);
    }
    for (const edge of this._edges) {
      const sources = edge.sourceIds.join(" | ");
      const targets = edge.targetIds.join(" | ");
      const props = Object.entries(edge.properties);
      const propsStr = props.length > 0 ? ` { ${props.map(([k, v]) => `${k}: '${v}'`).join(", ")} }` : "";
      lines.push(`(${sources})-[:${edge.type}${propsStr}]->(${targets})`);
    }
    return lines.join("\n");
  }
};
var QMap = class {
  static {
    __name(this, "QMap");
  }
  _doc;
  _name;
  _strategy;
  _data = /* @__PURE__ */ new Map();
  _observeHandlers = /* @__PURE__ */ new Map();
  _branchCounter = 0;
  constructor(doc, name, strategy) {
    this._doc = doc;
    this._name = name;
    this._strategy = strategy;
    doc._appendNode({
      id: `map_${name}`,
      labels: ["QMap"],
      properties: { name, strategy }
    });
    doc._appendEdge({
      sourceIds: ["root"],
      targetIds: [`map_${name}`],
      type: "PROCESS",
      properties: { path: name }
    });
  }
  set(key, value) {
    const hadPreviousValue = this._data.has(key);
    const previousValue = this._data.get(key);
    const branchId = `map_${this._name}_${key}_${this._branchCounter++}`;
    const valueStr = typeof value === "string" ? value : JSON.stringify(value);
    this._doc._appendNode({
      id: branchId,
      labels: ["Write"],
      properties: { key, value: valueStr, ts: String(this._doc.clock) }
    });
    this._doc._appendEdge({
      sourceIds: [`map_${this._name}`],
      targetIds: [branchId],
      type: "FORK",
      properties: { path: this._name, key, op: "set" }
    });
    const observeId = `map_${this._name}_${key}_obs_${this._branchCounter}`;
    this._doc._appendNode({
      id: observeId,
      labels: ["Observed"],
      properties: { key, value: valueStr }
    });
    this._doc._appendEdge({
      sourceIds: [branchId],
      targetIds: [observeId],
      type: "OBSERVE",
      properties: {
        strategy: this._strategy,
        path: this._name,
        key,
        value: valueStr
      }
    });
    this._data.set(key, value);
    this._doc._emitObserve(
      this._name,
      hadPreviousValue ? {
        type: "set",
        path: this._name,
        key,
        value,
        previousValue,
        origin: "local"
      } : {
        type: "set",
        path: this._name,
        key,
        value,
        origin: "local"
      }
    );
    this._doc._notifyUpdate("local");
  }
  get(key) {
    return this._data.get(key);
  }
  has(key) {
    return this._data.has(key);
  }
  delete(key) {
    const hadPreviousValue = this._data.has(key);
    const previousValue = this._data.get(key);
    if (!this._data.delete(key)) {
      return;
    }
    const branchId = `map_${this._name}_${key}_del_${this._branchCounter++}`;
    this._doc._appendNode({
      id: branchId,
      labels: ["Delete"],
      properties: { key }
    });
    this._doc._appendEdge({
      sourceIds: [`map_${this._name}`],
      targetIds: [branchId],
      type: "FORK",
      properties: { path: this._name, key, op: "delete" }
    });
    this._doc._emitObserve(
      this._name,
      hadPreviousValue ? {
        type: "delete",
        path: this._name,
        key,
        previousValue,
        origin: "local"
      } : {
        type: "delete",
        path: this._name,
        key,
        origin: "local"
      }
    );
    this._doc._notifyUpdate("local");
  }
  toJSON() {
    const result = {};
    for (const [key, value] of this._data) {
      result[key] = value;
    }
    return result;
  }
  get size() {
    return this._data.size;
  }
  forEach(fn) {
    this._data.forEach(fn);
  }
  entries() {
    return this._data.entries();
  }
  keys() {
    return this._data.keys();
  }
  values() {
    return this._data.values();
  }
  // Y.Map compat surface used by downstream apps.
  get doc() {
    return this._doc;
  }
  observe(handler) {
    if (this._observeHandlers.has(handler)) {
      return;
    }
    const wrapped = /* @__PURE__ */ __name((event) => {
      if (!event.key) {
        return;
      }
      const hasPreviousValue = Object.prototype.hasOwnProperty.call(
        event,
        "previousValue"
      );
      const action = event.type === "delete" ? "delete" : hasPreviousValue ? "update" : "add";
      const change = action === "add" ? { action } : { action, oldValue: event.previousValue };
      handler({
        keysChanged: /* @__PURE__ */ new Set([event.key]),
        changes: {
          keys: /* @__PURE__ */ new Map([[event.key, change]])
        }
      });
    }, "wrapped");
    this._observeHandlers.set(handler, wrapped);
    this._doc.observe(this._name, wrapped);
  }
  unobserve(handler) {
    const wrapped = this._observeHandlers.get(handler);
    if (!wrapped) {
      return;
    }
    this._doc.unobserve(this._name, wrapped);
    this._observeHandlers.delete(handler);
  }
};
var QXmlFragment = class {
  static {
    __name(this, "QXmlFragment");
  }
  _doc;
  _name;
  _children = [];
  constructor(doc, name) {
    this._doc = doc;
    this._name = name;
  }
  insert(index, content) {
    this._children.splice(index, 0, ...content);
    this._doc._notifyUpdate("local");
  }
  delete(index, length) {
    this._children.splice(index, length);
    this._doc._notifyUpdate("local");
  }
  get(index) {
    return this._children[index];
  }
  get length() {
    return this._children.length;
  }
  toArray() {
    return [...this._children];
  }
  toString() {
    return this._children.map((child) => String(child)).join("");
  }
  toJSON() {
    return [...this._children];
  }
  observe(handler) {
    this._doc.observe(this._name, handler);
  }
  unobserve(handler) {
    this._doc.unobserve(this._name, handler);
  }
};
var QArray = class {
  static {
    __name(this, "QArray");
  }
  _doc;
  _name;
  _strategy;
  _data = [];
  _branchCounter = 0;
  constructor(doc, name, strategy) {
    this._doc = doc;
    this._name = name;
    this._strategy = strategy;
    doc._appendNode({
      id: `arr_${name}`,
      labels: ["QArray"],
      properties: { name, strategy }
    });
    doc._appendEdge({
      sourceIds: ["root"],
      targetIds: [`arr_${name}`],
      type: "PROCESS",
      properties: { path: name }
    });
  }
  push(items) {
    for (const item of items) {
      const branchId = `arr_${this._name}_push_${this._branchCounter++}`;
      const valueStr = typeof item === "string" ? item : JSON.stringify(item);
      this._doc._appendNode({
        id: branchId,
        labels: ["Insert"],
        properties: { pos: String(this._data.length), value: valueStr }
      });
      this._doc._appendEdge({
        sourceIds: [`arr_${this._name}`],
        targetIds: [branchId],
        type: "FORK",
        properties: { path: this._name, op: "push", value: valueStr }
      });
      this._data.push(item);
    }
    this._doc._notifyUpdate("local");
  }
  delete(index, length = 1) {
    this._data.splice(index, length);
    const branchId = `arr_${this._name}_del_${this._branchCounter++}`;
    this._doc._appendNode({
      id: branchId,
      labels: ["Delete"],
      properties: { pos: String(index), len: String(length) }
    });
    this._doc._appendEdge({
      sourceIds: [`arr_${this._name}`],
      targetIds: [branchId],
      type: "FORK",
      properties: {
        path: this._name,
        op: "delete",
        pos: String(index),
        len: String(length)
      }
    });
    this._doc._notifyUpdate("local");
  }
  get(index) {
    return this._data[index];
  }
  get length() {
    return this._data.length;
  }
  toArray() {
    return [...this._data];
  }
  toJSON() {
    return this.toArray();
  }
  forEach(fn) {
    this._data.forEach(fn);
  }
  observe(handler) {
    this._doc.observe(this._name, (event) => {
      if (event.value !== void 0) {
        handler({
          changes: {
            delta: [{ insert: [event.value] }]
          }
        });
      }
    });
  }
  unobserve(handler) {
  }
};
var QText = class {
  static {
    __name(this, "QText");
  }
  _doc;
  _name;
  _content = "";
  _branchCounter = 0;
  constructor(doc, name) {
    this._doc = doc;
    this._name = name;
    doc._appendNode({
      id: `text_${name}`,
      labels: ["QText"],
      properties: { name }
    });
    doc._appendEdge({
      sourceIds: ["root"],
      targetIds: [`text_${name}`],
      type: "PROCESS",
      properties: { path: name }
    });
  }
  insert(index, text2) {
    this._content = this._content.slice(0, index) + text2 + this._content.slice(index);
    const branchId = `text_${this._name}_ins_${this._branchCounter++}`;
    this._doc._appendNode({
      id: branchId,
      labels: ["Insert"],
      properties: { pos: String(index), text: text2 }
    });
    this._doc._appendEdge({
      sourceIds: [`text_${this._name}`],
      targetIds: [branchId],
      type: "FORK",
      properties: { path: this._name, op: "insert", pos: String(index), text: text2 }
    });
    this._doc._notifyUpdate("local");
  }
  delete(index, length) {
    this._content = this._content.slice(0, index) + this._content.slice(index + length);
    const branchId = `text_${this._name}_del_${this._branchCounter++}`;
    this._doc._appendNode({
      id: branchId,
      labels: ["Delete"],
      properties: { pos: String(index), len: String(length) }
    });
    this._doc._appendEdge({
      sourceIds: [`text_${this._name}`],
      targetIds: [branchId],
      type: "FORK",
      properties: {
        path: this._name,
        op: "delete",
        pos: String(index),
        len: String(length)
      }
    });
    this._doc._notifyUpdate("local");
  }
  toString() {
    return this._content;
  }
  get length() {
    return this._content.length;
  }
  toJSON() {
    return this._content;
  }
};
var QCounter = class {
  static {
    __name(this, "QCounter");
  }
  _doc;
  _name;
  _value = 0;
  _branchCounter = 0;
  constructor(doc, name) {
    this._doc = doc;
    this._name = name;
    doc._appendNode({
      id: `ctr_${name}`,
      labels: ["QCounter"],
      properties: { name, initial: "0" }
    });
    doc._appendEdge({
      sourceIds: ["root"],
      targetIds: [`ctr_${name}`],
      type: "PROCESS",
      properties: { path: name }
    });
  }
  increment(delta = 1) {
    this._value += delta;
    const branchId = `ctr_${this._name}_inc_${this._branchCounter++}`;
    this._doc._appendNode({
      id: branchId,
      labels: ["Increment"],
      properties: { delta: String(delta) }
    });
    this._doc._appendEdge({
      sourceIds: [`ctr_${this._name}`],
      targetIds: [branchId],
      type: "FOLD",
      properties: {
        strategy: "fold-sum",
        path: this._name,
        delta: String(delta)
      }
    });
    this._doc._notifyUpdate("local");
  }
  decrement(delta = 1) {
    this.increment(-delta);
  }
  get value() {
    return this._value;
  }
  toJSON() {
    return this._value;
  }
};

// ../../open-source/gnosis/src/crdt/dashrelay-adapter.ts
init_performance2();

// ../../open-source/gnosis/src/crdt/yjs-compat.ts
init_performance2();

// src/durables/GnosisDebugSessionDO.ts
var DEBUG_STORAGE_KEY = "gnosis-debug-session";
var DEBUG_TTL_MS = 3 * 24 * 60 * 60 * 1e3;
var DEBUG_ALARM_INTERVAL_MS = 60 * 60 * 1e3;
var GnosisDebugSessionDurableObject = class {
  static {
    __name(this, "GnosisDebugSessionDurableObject");
  }
  state;
  initialized = false;
  session = null;
  constructor(state, _env) {
    this.state = state;
  }
  async fetch(request) {
    await this.ensureInitialized();
    const url = new URL(request.url);
    const path3 = url.pathname;
    try {
      if (path3 === "/qdoc/create" && request.method === "POST") {
        const body = await request.json();
        return this.handleQDocCreate(body);
      }
      if (path3 === "/qdoc/state" && request.method === "GET") {
        return this.handleQDocState();
      }
      if (path3 === "/qdoc/apply-update" && request.method === "POST") {
        const body = await request.json();
        return this.handleQDocApplyUpdate(body);
      }
      if (path3 === "/qdoc/transact" && request.method === "POST") {
        const body = await request.json();
        return this.handleQDocTransact(body);
      }
      if (path3 === "/qdoc/get-delta" && request.method === "GET") {
        return this.handleQDocGetDelta();
      }
      if (path3 === "/dashrelay/connect" && request.method === "POST") {
        const body = await request.json();
        return this.handleDashRelayConnect(body);
      }
      if (path3 === "/dashrelay/status" && request.method === "GET") {
        return this.handleDashRelayStatus();
      }
      if (path3 === "/dashrelay/disconnect" && request.method === "POST") {
        return this.handleDashRelayDisconnect();
      }
      return jsonResponse({ ok: false, error: "not_found" }, 404);
    } catch (error) {
      return jsonResponse(
        {
          ok: false,
          error: "debug_session_do_error",
          message: error instanceof Error ? error.message : "Unknown error"
        },
        500
      );
    }
  }
  async alarm() {
    await this.ensureInitialized();
    if (!this.session) {
      await this.state.storage.deleteAll();
      return;
    }
    const updatedAtMs = Date.parse(this.session.updatedAt);
    if (Number.isFinite(updatedAtMs) && Date.now() - updatedAtMs > DEBUG_TTL_MS) {
      await this.state.storage.deleteAll();
      this.session = null;
      return;
    }
    await this.scheduleAlarm();
  }
  initPromise = null;
  ensureInitialized() {
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = (async () => {
      if (this.initialized) {
        return;
      }
      this.session = await this.state.storage.get(DEBUG_STORAGE_KEY) ?? null;
      await this.scheduleAlarm();
      this.initialized = true;
    })();
    return this.initPromise;
  }
  async scheduleAlarm() {
    await this.state.storage.setAlarm(Date.now() + DEBUG_ALARM_INTERVAL_MS);
  }
  async persistSession() {
    if (!this.session) {
      return;
    }
    await this.state.storage.put(DEBUG_STORAGE_KEY, this.session);
  }
  createFreshDoc(guid) {
    const doc = new QDoc({ guid: guid && guid.trim().length > 0 ? guid.trim() : void 0 });
    return doc;
  }
  decodeState(base64Value) {
    try {
      return base64ToBytes(base64Value);
    } catch {
      return null;
    }
  }
  loadDoc() {
    if (!this.session) {
      return this.createFreshDoc();
    }
    const doc = this.createFreshDoc(this.session.guid);
    const update = this.decodeState(this.session.qdocStateBase64);
    if (update) {
      doc.applyUpdate(update, "storage");
    }
    return doc;
  }
  saveDoc(doc) {
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const update = doc.encodeStateAsUpdate();
    const encoded = bytesToBase64(update);
    if (!this.session) {
      this.session = {
        guid: doc.guid,
        qdocStateBase64: encoded,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      return;
    }
    this.session.guid = doc.guid;
    this.session.qdocStateBase64 = encoded;
    this.session.updatedAt = nowIso;
  }
  async handleQDocCreate(body) {
    const doc = this.createFreshDoc(body.guid);
    if (typeof body.initialGg === "string" && body.initialGg.trim().length > 0) {
      const rootMap = doc.getMap("document");
      rootMap.set("source.gg", body.initialGg.trim());
    }
    this.saveDoc(doc);
    await this.persistSession();
    return jsonResponse({
      ok: true,
      guid: doc.guid,
      beta1: doc.beta1,
      nodeCount: doc.nodeCount,
      edgeCount: doc.edgeCount
    });
  }
  handleQDocState() {
    if (!this.session) {
      return jsonResponse({
        ok: true,
        state: null
      });
    }
    const doc = this.loadDoc();
    const encoded = bytesToBase64(doc.encodeStateAsUpdate());
    return jsonResponse({
      ok: true,
      state: {
        guid: doc.guid,
        beta1: doc.beta1,
        clock: doc.clock,
        nodeCount: doc.nodeCount,
        edgeCount: doc.edgeCount,
        gg: doc.toGG(),
        updateBase64: encoded,
        relay: this.session.relay ?? null
      }
    });
  }
  async handleQDocApplyUpdate(body) {
    if (typeof body.updateBase64 !== "string" || body.updateBase64.trim().length === 0) {
      return jsonResponse(
        {
          ok: false,
          error: "invalid_update",
          message: "updateBase64 is required."
        },
        400
      );
    }
    const update = this.decodeState(body.updateBase64.trim());
    if (!update) {
      return jsonResponse(
        {
          ok: false,
          error: "invalid_update",
          message: "Failed to decode updateBase64."
        },
        400
      );
    }
    const doc = this.loadDoc();
    doc.applyUpdate(update, "remote");
    this.saveDoc(doc);
    await this.persistSession();
    return jsonResponse({
      ok: true,
      guid: doc.guid,
      beta1: doc.beta1,
      nodeCount: doc.nodeCount,
      edgeCount: doc.edgeCount
    });
  }
  applyOperation(doc, operation) {
    switch (operation.type) {
      case "map_set": {
        doc.getMap(operation.map).set(operation.key, operation.value);
        return;
      }
      case "map_delete": {
        doc.getMap(operation.map).delete(operation.key);
        return;
      }
      case "array_push": {
        doc.getArray(operation.array).push(operation.values);
        return;
      }
      case "array_delete": {
        doc.getArray(operation.array).delete(operation.index, operation.length ?? 1);
        return;
      }
      case "text_insert": {
        doc.getText(operation.text).insert(operation.index, operation.value);
        return;
      }
      case "text_delete": {
        doc.getText(operation.text).delete(operation.index, operation.length);
        return;
      }
      case "counter_inc": {
        doc.getCounter(operation.counter).increment(operation.value);
        return;
      }
      case "presence_set": {
        doc.setPresence(operation.value);
        return;
      }
      default: {
        const exhaustiveCheck = operation;
        throw new Error(`Unsupported operation: ${String(exhaustiveCheck)}`);
      }
    }
  }
  async handleQDocTransact(body) {
    if (!Array.isArray(body.operations) || body.operations.length === 0) {
      return jsonResponse(
        {
          ok: false,
          error: "invalid_operations",
          message: "operations must be a non-empty array."
        },
        400
      );
    }
    const doc = this.loadDoc();
    doc.transact(() => {
      for (const operation of body.operations ?? []) {
        this.applyOperation(doc, operation);
      }
    }, "local");
    this.saveDoc(doc);
    await this.persistSession();
    return jsonResponse({
      ok: true,
      guid: doc.guid,
      beta1: doc.beta1,
      clock: doc.clock,
      nodeCount: doc.nodeCount,
      edgeCount: doc.edgeCount
    });
  }
  handleQDocGetDelta() {
    const doc = this.loadDoc();
    const encoded = bytesToBase64(doc.encodeStateAsUpdate());
    return jsonResponse({
      ok: true,
      guid: doc.guid,
      updateBase64: encoded
    });
  }
  async handleDashRelayConnect(body) {
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const idSuffix = this.state.id.toString().slice(-8);
    const isEphemeral = body.ephemeral !== false;
    const roomNameRaw = typeof body.roomName === "string" ? body.roomName.trim() : "";
    const roomName = roomNameRaw.length > 0 ? roomNameRaw : isEphemeral ? `gnosis-${idSuffix}-${crypto.randomUUID().slice(0, 6)}` : `gnosis-${idSuffix}`;
    const relay = {
      url: typeof body.url === "string" && body.url.trim().length > 0 ? body.url.trim() : "wss://relay.dashrelay.com/relay/sync",
      roomName,
      apiKey: typeof body.apiKey === "string" && body.apiKey.trim().length > 0 ? body.apiKey.trim() : isEphemeral ? `ephemeral_${crypto.randomUUID().slice(0, 12)}` : void 0,
      clientId: typeof body.clientId === "string" && body.clientId.trim().length > 0 ? body.clientId.trim() : `qdoc-${crypto.randomUUID().slice(0, 10)}`,
      webtransportUrl: typeof body.webtransportUrl === "string" && body.webtransportUrl.trim().length > 0 ? body.webtransportUrl.trim() : "https://relay.dashrelay.com/relay",
      discoveryUrl: typeof body.discoveryUrl === "string" && body.discoveryUrl.trim().length > 0 ? body.discoveryUrl.trim() : "https://relay.dashrelay.com/discovery",
      connected: true,
      updatedAt: nowIso
    };
    if (!this.session) {
      const doc = this.createFreshDoc();
      this.saveDoc(doc);
    }
    if (this.session) {
      this.session.relay = relay;
      this.session.updatedAt = nowIso;
      await this.persistSession();
    }
    return jsonResponse({
      ok: true,
      relay,
      notes: {
        mode: isEphemeral ? "ephemeral-fallback" : "byo-room",
        handshake: "Worker stores session relay intent; client establishes websocket."
      }
    });
  }
  handleDashRelayStatus() {
    return jsonResponse({
      ok: true,
      relay: this.session?.relay ?? null
    });
  }
  async handleDashRelayDisconnect() {
    if (this.session?.relay) {
      this.session.relay = {
        ...this.session.relay,
        connected: false,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await this.persistSession();
    }
    return jsonResponse({
      ok: true,
      relay: this.session?.relay ?? null
    });
  }
};
function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store"
    }
  });
}
__name(jsonResponse, "jsonResponse");
function bytesToBase64(value) {
  let binary = "";
  for (let i = 0; i < value.length; i += 1) {
    binary += String.fromCharCode(value[i]);
  }
  return btoa(binary);
}
__name(bytesToBase64, "bytesToBase64");
function base64ToBytes(value) {
  const binary = atob(value);
  const output = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    output[i] = binary.charCodeAt(i);
  }
  return output;
}
__name(base64ToBytes, "base64ToBytes");

// src/durables/GnosisMcpSessionDO.ts
init_performance2();
var SESSION_STORAGE_KEY = "gnosis-mcp-session";
var SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
var SESSION_ALARM_INTERVAL_MS = 60 * 60 * 1e3;
var MAX_EVENTS = 400;
var GnosisMcpSessionDurableObject = class {
  static {
    __name(this, "GnosisMcpSessionDurableObject");
  }
  state;
  initialized = false;
  session = null;
  constructor(state, _env) {
    this.state = state;
  }
  async fetch(request) {
    await this.ensureInitialized();
    const url = new URL(request.url);
    const path3 = url.pathname;
    try {
      if (path3 === "/initialize" && request.method === "POST") {
        const body = await request.json();
        return this.handleInitialize(body);
      }
      if (path3 === "/record" && request.method === "POST") {
        const body = await request.json();
        return this.handleRecord(body);
      }
      if (path3 === "/summary" && request.method === "GET") {
        return this.handleSummary();
      }
      if (path3 === "/consume-public-quota" && request.method === "POST") {
        const body = await request.json();
        return this.handleConsumePublicQuota(body);
      }
      return jsonResponse2({ ok: false, error: "not_found" }, 404);
    } catch (error) {
      return jsonResponse2(
        {
          ok: false,
          error: "session_do_error",
          message: error instanceof Error ? error.message : "Unknown error"
        },
        500
      );
    }
  }
  async alarm() {
    await this.ensureInitialized();
    if (!this.session) {
      await this.state.storage.deleteAll();
      return;
    }
    const updatedAtMs = Date.parse(this.session.updatedAt);
    if (Number.isFinite(updatedAtMs) && Date.now() - updatedAtMs > SESSION_TTL_MS) {
      await this.state.storage.deleteAll();
      this.session = null;
      return;
    }
    await this.scheduleAlarm();
  }
  initPromise = null;
  ensureInitialized() {
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = (async () => {
      if (this.initialized) {
        return;
      }
      this.session = await this.state.storage.get(SESSION_STORAGE_KEY) ?? null;
      await this.scheduleAlarm();
      this.initialized = true;
    })();
    return this.initPromise;
  }
  async scheduleAlarm() {
    await this.state.storage.setAlarm(Date.now() + SESSION_ALARM_INTERVAL_MS);
  }
  async persistSession() {
    if (!this.session) {
      return;
    }
    await this.state.storage.put(SESSION_STORAGE_KEY, this.session);
  }
  async handleInitialize(body) {
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const nowMs = Date.now();
    const sessionIdRaw = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const sessionId = sessionIdRaw.length > 0 ? sessionIdRaw : this.state.id.toString();
    this.session = {
      sessionId,
      createdAt: this.session?.createdAt ?? nowIso,
      updatedAt: nowIso,
      requestCount: (this.session?.requestCount ?? 0) + 1,
      events: this.session?.events ?? [],
      publicToolWindowStartMs: this.session?.publicToolWindowStartMs ?? nowMs,
      publicToolCallCount: this.session?.publicToolCallCount ?? 0
    };
    this.pushEvent({
      type: "initialize",
      at: nowIso,
      detail: { sessionId }
    });
    await this.persistSession();
    return jsonResponse2({
      ok: true,
      sessionId,
      requestCount: this.session.requestCount
    });
  }
  async handleRecord(body) {
    if (!this.session) {
      return jsonResponse2(
        {
          ok: false,
          error: "session_not_initialized",
          message: "Call /initialize first."
        },
        409
      );
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    this.session.updatedAt = nowIso;
    this.session.requestCount += 1;
    this.pushEvent({
      type: typeof body.type === "string" && body.type.length > 0 ? body.type : "event",
      at: nowIso,
      detail: body.detail
    });
    await this.persistSession();
    return jsonResponse2({
      ok: true,
      requestCount: this.session.requestCount
    });
  }
  handleSummary() {
    return jsonResponse2({
      ok: true,
      session: this.session ? {
        sessionId: this.session.sessionId,
        createdAt: this.session.createdAt,
        updatedAt: this.session.updatedAt,
        requestCount: this.session.requestCount,
        eventCount: this.session.events.length,
        publicToolWindowStartMs: this.session.publicToolWindowStartMs,
        publicToolCallCount: this.session.publicToolCallCount
      } : null
    });
  }
  async handleConsumePublicQuota(body) {
    if (!this.session) {
      return jsonResponse2(
        {
          ok: false,
          error: "session_not_initialized"
        },
        409
      );
    }
    const nowMs = Date.now();
    const limitPerHour = typeof body.limitPerHour === "number" && Number.isFinite(body.limitPerHour) ? Math.max(1, Math.trunc(body.limitPerHour)) : 180;
    if (nowMs - this.session.publicToolWindowStartMs >= 60 * 60 * 1e3) {
      this.session.publicToolWindowStartMs = nowMs;
      this.session.publicToolCallCount = 0;
    }
    const nextCount = this.session.publicToolCallCount + 1;
    const remaining = Math.max(0, limitPerHour - nextCount);
    const allowed = nextCount <= limitPerHour;
    if (allowed) {
      this.session.publicToolCallCount = nextCount;
      this.session.updatedAt = new Date(nowMs).toISOString();
      this.pushEvent({
        type: "quota.consume.public",
        at: this.session.updatedAt,
        detail: {
          toolName: body.toolName ?? null,
          count: nextCount,
          limitPerHour,
          remaining
        }
      });
      await this.persistSession();
    }
    return jsonResponse2({
      ok: true,
      allowed,
      limitPerHour,
      count: nextCount,
      remaining,
      resetAtMs: this.session.publicToolWindowStartMs + 60 * 60 * 1e3
    });
  }
  pushEvent(event) {
    if (!this.session) {
      return;
    }
    this.session.events.push(event);
    if (this.session.events.length > MAX_EVENTS) {
      this.session.events = this.session.events.slice(this.session.events.length - MAX_EVENTS);
    }
  }
};
function jsonResponse2(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store"
    }
  });
}
__name(jsonResponse2, "jsonResponse");

// src/mcp/tools.ts
init_performance2();

// ../../open-source/gnosis/src/betty/compiler.ts
init_performance2();

// ../../open-source/gnosis/src/betty/quantum/bridge.ts
init_performance2();
function tryRequire(specifier) {
  if (typeof __require !== "function") return void 0;
  try {
    return __require(specifier);
  } catch {
    return void 0;
  }
}
__name(tryRequire, "tryRequire");
var GnosisRuntime = tryRequire("gnosis_runtime") ?? tryRequire("../../../node_modules/gnosis_runtime");
var QuantumWasmBridge = class {
  static {
    __name(this, "QuantumWasmBridge");
  }
  runtime = null;
  initialized = false;
  constructor() {
    try {
      const runtimeModule = GnosisRuntime;
      if (runtimeModule?.QuantumRuntime) {
        this.runtime = new runtimeModule.QuantumRuntime();
        this.initialized = typeof this.runtime.process_frame === "function" || typeof this.runtime.processFrame === "function";
      }
    } catch {
    }
  }
  processAstEdge(edgeType, sourceCount, targetCount) {
    if (!this.initialized) return `[WASM] Not initialized or process_frame missing.`;
    let flags = 0;
    switch (edgeType) {
      case "FORK":
        flags = 1;
        break;
      case "RACE":
        flags = 2;
        break;
      case "FOLD":
      case "COLLAPSE":
        flags = 4;
        break;
      case "VENT":
      case "TUNNEL":
        flags = 8;
        break;
      case "INTERFERE":
        flags = 32;
        break;
      case "OBSERVE":
        flags = 64;
        break;
      default:
        return `[WASM] Ignored edge type: ${edgeType}`;
    }
    const payload = new TextEncoder().encode(JSON.stringify({ s: sourceCount, t: targetCount }));
    const len = payload.length;
    const buffer = new Uint8Array(10 + len);
    const view = new DataView(buffer.buffer);
    view.setUint16(0, 1, false);
    view.setUint32(2, 1, false);
    view.setUint8(6, flags);
    buffer[7] = len >> 16 & 255;
    buffer[8] = len >> 8 & 255;
    buffer[9] = len & 255;
    buffer.set(payload, 10);
    try {
      if (this.runtime && typeof this.runtime.process_frame === "function") {
        this.runtime.process_frame(buffer);
      } else {
        this.runtime?.processFrame?.(buffer);
      }
      return `[WASM] Processed ${edgeType}. Metrics: ${this.runtime?.metrics() ?? "unavailable"}`;
    } catch (error) {
      return `[WASM Error] ${this.errorMessage(error)}`;
    }
  }
  getMetrics() {
    return this.initialized && this.runtime ? this.runtime.metrics() : "Not initialized";
  }
  errorMessage(error) {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
};

// ../../open-source/gnosis/src/auth/auto-zk.ts
init_performance2();
var AUTO_INJECTED_EDGE_FLAG = "zkAutoInjected";
var AUTO_INJECTED_NODE_FLAG = "zkAutoInjected";
var AUTO_INJECTED_BY = "zkAutoInjectedBy";
var AUTO_INJECTED_REASON = "zkAutoReason";
function parseBoolean(value) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}
__name(parseBoolean, "parseBoolean");
function hasCrossBoundarySync(properties) {
  if (parseBoolean(properties.crossDevice) || parseBoolean(properties.crossTenant)) {
    return true;
  }
  const tenantScope = properties.tenantScope?.trim().toLowerCase();
  return tenantScope === "cross-device" || tenantScope === "cross-tenant";
}
__name(hasCrossBoundarySync, "hasCrossBoundarySync");
function hasSensitiveMaterialization(properties) {
  const privateSignals = parseBoolean(properties.private) || parseBoolean(properties.userPrivate) || properties.visibility?.trim().toLowerCase() === "private";
  if (!privateSignals) {
    return false;
  }
  const operation = properties.op?.trim().toLowerCase();
  const persistence = properties.persistence?.trim().toLowerCase();
  const storage = properties.storage?.trim().toLowerCase();
  return operation === "write_file" || operation === "read_file" || persistence === "fs.local" || persistence === "fs.durable" || storage === "fs.local" || storage === "fs.durable" || storage === "durable";
}
__name(hasSensitiveMaterialization, "hasSensitiveMaterialization");
function combineProperties(edge, targetNode) {
  return {
    ...targetNode?.properties ?? {},
    ...edge.properties
  };
}
__name(combineProperties, "combineProperties");
function cloneNode(node) {
  return {
    id: node.id,
    labels: [...node.labels],
    properties: { ...node.properties }
  };
}
__name(cloneNode, "cloneNode");
function cloneEdge(edge) {
  return {
    sourceIds: [...edge.sourceIds],
    targetIds: [...edge.targetIds],
    type: edge.type,
    properties: { ...edge.properties }
  };
}
__name(cloneEdge, "cloneEdge");
function createUniqueWrapperNodeId(nodes, domain, sourceId, targetId, indexSeed) {
  const sourceSlug = sourceId.replace(/[^a-zA-Z0-9_]/g, "_");
  const targetSlug = targetId.replace(/[^a-zA-Z0-9_]/g, "_");
  let serial = indexSeed;
  while (true) {
    const candidate = `__zk_${domain}_${sourceSlug}_${targetSlug}_${serial}`;
    if (!nodes.has(candidate)) {
      return candidate;
    }
    serial += 1;
  }
}
__name(createUniqueWrapperNodeId, "createUniqueWrapperNodeId");
function createWrapperNode(nodeId, domain, combinedProperties) {
  const label = domain === "sync" ? "ZKSyncEnvelope" : "ZKMaterializeEnvelope";
  const properties = {
    zkMode: "required",
    [AUTO_INJECTED_NODE_FLAG]: "true",
    [AUTO_INJECTED_BY]: "gnosis-auto-zk-injection",
    [AUTO_INJECTED_REASON]: `sensitive-${domain}`
  };
  if (domain === "sync") {
    if (combinedProperties.crossDevice) {
      properties.crossDevice = combinedProperties.crossDevice;
    }
    if (combinedProperties.crossTenant) {
      properties.crossTenant = combinedProperties.crossTenant;
    }
    if (combinedProperties.tenantScope) {
      properties.tenantScope = combinedProperties.tenantScope;
    }
  } else {
    if (combinedProperties.private) {
      properties.private = combinedProperties.private;
    } else {
      properties.private = "true";
    }
    if (combinedProperties.visibility) {
      properties.visibility = combinedProperties.visibility;
    }
    if (combinedProperties.persistence) {
      properties.persistence = combinedProperties.persistence;
    }
    if (combinedProperties.storage) {
      properties.storage = combinedProperties.storage;
    }
    if (combinedProperties.op) {
      properties.op = combinedProperties.op;
    }
  }
  if (combinedProperties.recipientPublicKey) {
    properties.recipientPublicKey = combinedProperties.recipientPublicKey;
  }
  if (combinedProperties.zkRecipientPublicKey) {
    properties.zkRecipientPublicKey = combinedProperties.zkRecipientPublicKey;
  }
  if (combinedProperties.publicKey) {
    properties.publicKey = combinedProperties.publicKey;
  }
  return {
    id: nodeId,
    labels: [label],
    properties
  };
}
__name(createWrapperNode, "createWrapperNode");
function createInjectedEdge(sourceId, targetId, edge) {
  return {
    sourceIds: [sourceId],
    targetIds: [targetId],
    type: edge.type,
    properties: {
      ...edge.properties,
      [AUTO_INJECTED_EDGE_FLAG]: "true"
    }
  };
}
__name(createInjectedEdge, "createInjectedEdge");
function shouldSkipEdgeForInjection(edge) {
  if (edge.type !== "PROCESS") {
    return true;
  }
  if (edge.sourceIds.length !== 1 || edge.targetIds.length !== 1) {
    return true;
  }
  if (parseBoolean(edge.properties[AUTO_INJECTED_EDGE_FLAG])) {
    return true;
  }
  return false;
}
__name(shouldSkipEdgeForInjection, "shouldSkipEdgeForInjection");
function injectSensitiveZkEnvelopes(ast) {
  const nodes = /* @__PURE__ */ new Map();
  for (const [id, node] of ast.nodes.entries()) {
    nodes.set(id, cloneNode(node));
  }
  const rewrittenEdges = [];
  const injected = [];
  let wrapperSeed = 0;
  for (const edge of ast.edges) {
    if (shouldSkipEdgeForInjection(edge)) {
      rewrittenEdges.push(cloneEdge(edge));
      continue;
    }
    const sourceId = edge.sourceIds[0].trim();
    const targetId = edge.targetIds[0].trim();
    const targetNode = nodes.get(targetId);
    const combined = combineProperties(edge, targetNode);
    const targetLabels = new Set(
      (targetNode?.labels ?? []).map((label) => label.trim().toLowerCase())
    );
    const needsSync = hasCrossBoundarySync(combined) && !targetLabels.has("zksyncenvelope");
    const needsMaterialization = hasSensitiveMaterialization(combined) && !targetLabels.has("zkmaterializeenvelope");
    if (!needsSync && !needsMaterialization) {
      rewrittenEdges.push(cloneEdge(edge));
      continue;
    }
    let currentSourceId = sourceId;
    if (needsSync) {
      const wrapperNodeId = createUniqueWrapperNodeId(
        nodes,
        "sync",
        sourceId,
        targetId,
        wrapperSeed
      );
      wrapperSeed += 1;
      const wrapperNode = createWrapperNode(wrapperNodeId, "sync", combined);
      nodes.set(wrapperNodeId, wrapperNode);
      rewrittenEdges.push(createInjectedEdge(currentSourceId, wrapperNodeId, edge));
      injected.push({
        domain: "sync",
        sourceId,
        targetId,
        wrapperNodeId,
        reason: "cross-boundary sync properties detected"
      });
      currentSourceId = wrapperNodeId;
    }
    if (needsMaterialization) {
      const wrapperNodeId = createUniqueWrapperNodeId(
        nodes,
        "materialization",
        sourceId,
        targetId,
        wrapperSeed
      );
      wrapperSeed += 1;
      const wrapperNode = createWrapperNode(
        wrapperNodeId,
        "materialization",
        combined
      );
      nodes.set(wrapperNodeId, wrapperNode);
      rewrittenEdges.push(createInjectedEdge(currentSourceId, wrapperNodeId, edge));
      injected.push({
        domain: "materialization",
        sourceId,
        targetId,
        wrapperNodeId,
        reason: "private materialization properties detected"
      });
      currentSourceId = wrapperNodeId;
    }
    rewrittenEdges.push(createInjectedEdge(currentSourceId, targetId, edge));
  }
  return {
    ast: {
      nodes,
      edges: rewrittenEdges
    },
    injected
  };
}
__name(injectSensitiveZkEnvelopes, "injectSensitiveZkEnvelopes");

// ../../open-source/gnosis/src/betty/compiler.ts
var BettyCompiler = class {
  static {
    __name(this, "BettyCompiler");
  }
  b1 = 0;
  ast = { nodes: /* @__PURE__ */ new Map(), edges: [] };
  logs = [];
  diagnostics = [];
  wasmBridge;
  constructor() {
    this.wasmBridge = new QuantumWasmBridge();
  }
  getBettiNumber() {
    return this.b1;
  }
  getAST() {
    return this.ast;
  }
  getLogs() {
    return this.logs;
  }
  getDiagnostics() {
    return this.diagnostics;
  }
  /**
   * Buley Measurement: Topological Complexity Score
   * Calculates the entropy of the covering space.
   */
  getBuleyMeasurement() {
    const pathComplexity = this.ast.edges.reduce((acc, edge) => {
      return acc + edge.sourceIds.length * edge.targetIds.length;
    }, 0);
    return this.b1 * 1.5 + pathComplexity * 0.5;
  }
  getCompletions(line, column) {
    const keywords = ["FORK", "RACE", "FOLD", "VENT", "PROCESS", "COLLAPSE", "TUNNEL", "INTERFERE", "MEASURE", "HALT", "EVOLVE", "ENTANGLE", "SUPERPOSE", "OBSERVE"];
    const nodeIds = Array.from(this.ast.nodes.keys());
    const prefix = line.slice(0, column).split(/[^A-Za-z0-9_]+/).pop()?.toUpperCase() || "";
    return [...keywords, ...nodeIds].filter((w) => w.startsWith(prefix));
  }
  parse(input) {
    if (!input.trim()) return { ast: null, output: "", b1: 0, diagnostics: [], buleyMeasure: 0 };
    this.logs = [];
    this.diagnostics = [];
    this.b1 = 0;
    this.ast = { nodes: /* @__PURE__ */ new Map(), edges: [] };
    this.wasmBridge = new QuantumWasmBridge();
    const lines = input.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("//")) continue;
      const imperativeMatch = line.match(/\b(function|return|if|while|for|var|let|const)\b/);
      if (imperativeMatch) {
        this.diagnostics.push({
          line: i + 1,
          column: line.indexOf(imperativeMatch[0]) + 1,
          message: `Imperative keyword '${imperativeMatch[0]}' rejected. Gnosis requires pure topological declarations.`,
          severity: "error"
        });
        continue;
      }
      const nodeRegex = /(?<!->)\(([^:)\s|]+)(?:\s*:\s*([^){\s]+))?(?:\s*{([^}]+)})?\)(?!-\[:)/g;
      let nodeMatch;
      while ((nodeMatch = nodeRegex.exec(line)) !== null) {
        const id = nodeMatch[1].trim();
        if (!id) continue;
        const label = nodeMatch[2] ? nodeMatch[2].trim() : "";
        const propertiesRaw = nodeMatch[3] ? nodeMatch[3].trim() : "";
        const properties = {};
        if (propertiesRaw) {
          const pairs = propertiesRaw.split(/,(?![^{]*})/);
          pairs.forEach((p) => {
            const colonIndex = p.indexOf(":");
            if (colonIndex > 0) {
              const k = p.substring(0, colonIndex).trim();
              const v = p.substring(colonIndex + 1).trim();
              if (k && v !== void 0) {
                properties[k] = v.replace(/^['"]|['"]$/g, "");
              }
            }
          });
        }
        if (!this.ast.nodes.has(id)) {
          this.ast.nodes.set(id, { id, labels: label ? [label] : [], properties });
        }
      }
      const edgeRegex = /\(([^)]+)\)\s*-\[:([A-Z]+)(?:\s*{([^}]+)})?\]->\s*\(([^)]+)\)/g;
      let edgeMatch;
      let lineMatched = false;
      while ((edgeMatch = edgeRegex.exec(line)) !== null) {
        lineMatched = true;
        const sourceRaw = edgeMatch[1].trim();
        const edgeType = edgeMatch[2].trim();
        const propertiesRaw = edgeMatch[3] ? edgeMatch[3].trim() : "";
        const targetRaw = edgeMatch[4].trim();
        const sources = sourceRaw.split("|").map((s) => s.split(":")[0].trim());
        const targets = targetRaw.split("|").map((s) => s.split(":")[0].trim());
        sourceRaw.split("|").forEach((s) => {
          const nodeRegexInEdge = /([^:)\s|{]+)(?:\s*:\s*([^){\s]+))?(?:\s*{([^}]+)})?/g;
          const nm = nodeRegexInEdge.exec(s.trim());
          if (nm) {
            const id = nm[1].trim();
            const label = nm[2] ? nm[2].trim().replace(/[)\s{}]+$/, "") : "";
            const propertiesRaw2 = nm[3] ? nm[3].trim() : "";
            const properties = {};
            if (propertiesRaw2) {
              const pairs = propertiesRaw2.split(/,(?![^{]*})/);
              pairs.forEach((p) => {
                const colonIndex = p.indexOf(":");
                if (colonIndex > 0) {
                  const k = p.substring(0, colonIndex).trim();
                  const v = p.substring(colonIndex + 1).trim();
                  if (k && v !== void 0) {
                    properties[k] = v.replace(/^['"]|['"]$/g, "");
                  }
                }
              });
            }
            if (!this.ast.nodes.has(id)) {
              this.ast.nodes.set(id, { id, labels: label ? [label] : [], properties });
            } else if (Object.keys(properties).length > 0) {
              const existing = this.ast.nodes.get(id);
              existing.properties = { ...existing.properties, ...properties };
            }
          }
        });
        targetRaw.split("|").forEach((s) => {
          const nodeRegexInEdge = /([^:)\s|{]+)(?:\s*:\s*([^){\s]+))?(?:\s*{([^}]+)})?/g;
          const nm = nodeRegexInEdge.exec(s.trim());
          if (nm) {
            const id = nm[1].trim();
            const label = nm[2] ? nm[2].trim().replace(/[)\s{}]+$/, "") : "";
            const propertiesRaw2 = nm[3] ? nm[3].trim() : "";
            const properties = {};
            if (propertiesRaw2) {
              const pairs = propertiesRaw2.split(/,(?![^{]*})/);
              pairs.forEach((p) => {
                const colonIndex = p.indexOf(":");
                if (colonIndex > 0) {
                  const k = p.substring(0, colonIndex).trim();
                  const v = p.substring(colonIndex + 1).trim();
                  if (k && v !== void 0) {
                    properties[k] = v.replace(/^['"]|['"]$/g, "");
                  }
                }
              });
            }
            if (!this.ast.nodes.has(id)) {
              this.ast.nodes.set(id, { id, labels: label ? [label] : [], properties });
            } else if (Object.keys(properties).length > 0) {
              const existing = this.ast.nodes.get(id);
              existing.properties = { ...existing.properties, ...properties };
            }
          }
        });
        if (edgeType === "FORK") {
          this.b1 += targets.length - 1;
        } else if (edgeType === "FOLD" || edgeType === "COLLAPSE" || edgeType === "OBSERVE") {
          this.b1 = Math.max(0, this.b1 - (sources.length - 1));
        } else if (edgeType === "VENT") {
          this.b1 = Math.max(0, this.b1 - 1);
        }
        this.wasmBridge.processAstEdge(edgeType, sources.length, targets.length);
        const edgeProperties = {};
        if (propertiesRaw) {
          const pairs = propertiesRaw.split(/,(?![^{]*})/);
          pairs.forEach((p) => {
            const colonIndex = p.indexOf(":");
            if (colonIndex > 0) {
              const k = p.substring(0, colonIndex).trim();
              const v = p.substring(colonIndex + 1).trim();
              if (k && v !== void 0) {
                edgeProperties[k] = v.replace(/^['"]|['"]$/g, "");
              }
            }
          });
        }
        this.ast.edges.push({
          sourceIds: sources,
          targetIds: targets,
          type: edgeType,
          properties: edgeProperties
        });
        sources.forEach((id) => {
          if (!this.ast.nodes.has(id)) this.ast.nodes.set(id, { id, labels: [], properties: {} });
        });
        targets.forEach((id) => {
          if (!this.ast.nodes.has(id)) this.ast.nodes.set(id, { id, labels: [], properties: {} });
        });
      }
      if (!lineMatched && !line.startsWith("(")) {
        this.diagnostics.push({
          line: i + 1,
          column: 1,
          message: `Invalid Gnosis syntax. Expected node or edge declaration.`,
          severity: "info"
        });
      }
    }
    const referencedNodes = /* @__PURE__ */ new Set();
    this.ast.edges.forEach((e) => {
      e.sourceIds.forEach((id) => referencedNodes.add(id));
      e.targetIds.forEach((id) => referencedNodes.add(id));
    });
    this.ast.nodes.forEach((node) => {
      if (!referencedNodes.has(node.id)) {
        this.diagnostics.push({
          line: 1,
          column: 1,
          message: `Disconnected node '${node.id}' detected. It will not participate in the covering space.`,
          severity: "warning"
        });
      }
    });
    const injectionResult = injectSensitiveZkEnvelopes(this.ast);
    this.ast = injectionResult.ast;
    if (injectionResult.injected.length > 0) {
      this.diagnostics.push({
        line: 1,
        column: 1,
        message: `Auto-injected ${injectionResult.injected.length} ZK envelope node(s) for sensitive sync/materialization flows.`,
        severity: "info"
      });
    }
    const buleyMeasure = this.getBuleyMeasurement();
    const summary = `[Betty Professional Compiler]
Nodes: ${this.ast.nodes.size}, Edges: ${this.ast.edges.length}
Betti: ${this.b1}, Buley Measure: ${buleyMeasure.toFixed(2)}`;
    return {
      ast: this.ast,
      output: summary,
      b1: this.b1,
      diagnostics: this.diagnostics,
      buleyMeasure
    };
  }
};

// ../../open-source/gnosis/src/analysis.ts
init_performance2();

// ../../open-source/aeon-logic/dist/index.js
init_performance2();

// ../../open-source/aeon-logic/dist/checker.js
init_performance2();

// ../../open-source/aeon-logic/dist/superposition.js
init_performance2();
var DEFAULT_EPSILON = 1e-12;
function toStableKey(value) {
  if (value === null) {
    return "null";
  }
  if (value === void 0) {
    return "undefined";
  }
  if (typeof value === "string") {
    return `string:${value}`;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? `number:${value}` : `number:${JSON.stringify(value)}`;
  }
  if (typeof value === "boolean") {
    return value ? "boolean:true" : "boolean:false";
  }
  try {
    return `json:${JSON.stringify(value)}`;
  } catch {
    return `string:${String(value)}`;
  }
}
__name(toStableKey, "toStableKey");
function assertFiniteNonNegative(name, value) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite non-negative number`);
  }
}
__name(assertFiniteNonNegative, "assertFiniteNonNegative");
function assertFinitePositive(name, value) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a finite positive number`);
  }
}
__name(assertFinitePositive, "assertFinitePositive");
function multiplyPhase(left, right) {
  return left === right ? 1 : -1;
}
__name(multiplyPhase, "multiplyPhase");
var LogicChainSuperposition = class _LogicChainSuperposition {
  static {
    __name(this, "LogicChainSuperposition");
  }
  chainsInternal;
  keyOfState;
  epsilon;
  constructor(chains, options) {
    this.chainsInternal = chains;
    this.keyOfState = options.keyOfState;
    this.epsilon = options.epsilon;
  }
  static seed(initialState, options = {}) {
    return _LogicChainSuperposition.fromChains([
      {
        id: "root",
        state: initialState,
        steps: [],
        amplitude: 1,
        phase: 1,
        parentId: null,
        depth: 0
      }
    ], options);
  }
  static fromChains(chains, options = {}) {
    const epsilon = options.epsilon ?? DEFAULT_EPSILON;
    assertFinitePositive("epsilon", epsilon);
    const keyOfState = options.keyOfState ?? ((state) => toStableKey(state));
    const normalizedChains = [];
    for (const chain of chains) {
      if (chain.id.length === 0) {
        throw new Error("Logic chain id must not be empty");
      }
      assertFiniteNonNegative(`chain "${chain.id}" amplitude`, chain.amplitude);
      if (chain.phase !== 1 && chain.phase !== -1) {
        throw new Error(`chain "${chain.id}" phase must be 1 or -1`);
      }
      if (!Number.isInteger(chain.depth) || chain.depth < 0) {
        throw new Error(`chain "${chain.id}" depth must be a non-negative integer`);
      }
      if (chain.amplitude > epsilon) {
        normalizedChains.push(chain);
      }
    }
    normalizedChains.sort((left, right) => left.id.localeCompare(right.id));
    return new _LogicChainSuperposition(normalizedChains, {
      keyOfState,
      epsilon
    });
  }
  get chains() {
    return this.chainsInternal;
  }
  fork(expand) {
    const nextChains = [];
    for (const chain of this.chainsInternal) {
      const candidates = expand(chain);
      if (candidates.length === 0) {
        nextChains.push(chain);
        continue;
      }
      const weights = candidates.map((candidate, index) => {
        const weight = candidate.relativeAmplitude ?? 1;
        assertFinitePositive(`candidate relativeAmplitude at chain "${chain.id}" index ${index}`, weight);
        return weight;
      });
      let squaredNorm = 0;
      for (const weight of weights) {
        squaredNorm += weight * weight;
      }
      const norm = Math.sqrt(squaredNorm);
      if (!Number.isFinite(norm) || norm <= this.epsilon) {
        continue;
      }
      for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index];
        const weight = weights[index];
        if (!candidate || weight === void 0) {
          continue;
        }
        const amplitude = chain.amplitude * weight / norm;
        if (amplitude <= this.epsilon) {
          continue;
        }
        const phase = multiplyPhase(chain.phase, candidate.phase ?? 1);
        const id = candidate.id ?? `${chain.id}.${index + 1}`;
        const steps = candidate.step === void 0 ? chain.steps : [...chain.steps, candidate.step];
        nextChains.push({
          id,
          state: candidate.state,
          steps,
          amplitude,
          phase,
          parentId: chain.id,
          depth: chain.depth + 1
        });
      }
    }
    return _LogicChainSuperposition.fromChains(nextChains, {
      keyOfState: this.keyOfState,
      epsilon: this.epsilon
    });
  }
  interfere(keyOfState = this.keyOfState) {
    const groups = /* @__PURE__ */ new Map();
    for (const chain of this.chainsInternal) {
      const key = keyOfState(chain.state);
      const existing = groups.get(key);
      if (existing) {
        existing.push(chain);
      } else {
        groups.set(key, [chain]);
      }
    }
    const collapsedChains = [];
    for (const group of groups.values()) {
      const representative = group[0];
      if (!representative) {
        continue;
      }
      let signedSum = 0;
      let strongestChain = representative;
      let strongestProbability = representative.amplitude * representative.amplitude;
      for (const chain of group) {
        signedSum += chain.amplitude * chain.phase;
        const probability = chain.amplitude * chain.amplitude;
        if (probability > strongestProbability) {
          strongestProbability = probability;
          strongestChain = chain;
        } else if (probability === strongestProbability && chain.id < strongestChain.id) {
          strongestChain = chain;
        }
      }
      const amplitude = Math.abs(signedSum);
      if (amplitude <= this.epsilon) {
        continue;
      }
      const phase = signedSum >= 0 ? 1 : -1;
      collapsedChains.push({
        ...strongestChain,
        amplitude,
        phase
      });
    }
    return _LogicChainSuperposition.fromChains(collapsedChains, {
      keyOfState: this.keyOfState,
      epsilon: this.epsilon
    });
  }
  totalProbability() {
    let total = 0;
    for (const chain of this.chainsInternal) {
      total += chain.amplitude * chain.amplitude;
    }
    return total;
  }
  normalize() {
    const totalProbability = this.totalProbability();
    if (totalProbability <= this.epsilon) {
      return _LogicChainSuperposition.fromChains([], {
        keyOfState: this.keyOfState,
        epsilon: this.epsilon
      });
    }
    const scale = 1 / Math.sqrt(totalProbability);
    const normalizedChains = this.chainsInternal.map((chain) => ({
      ...chain,
      amplitude: chain.amplitude * scale
    }));
    return _LogicChainSuperposition.fromChains(normalizedChains, {
      keyOfState: this.keyOfState,
      epsilon: this.epsilon
    });
  }
  distribution() {
    const totalProbability = this.totalProbability();
    if (totalProbability <= this.epsilon) {
      return [];
    }
    const entries = this.chainsInternal.map((chain) => ({
      chain,
      probability: chain.amplitude * chain.amplitude / totalProbability
    }));
    entries.sort((left, right) => right.probability - left.probability || left.chain.id.localeCompare(right.chain.id));
    return entries;
  }
  measureArgmax() {
    const distribution = this.distribution();
    const best = distribution[0];
    return best ? best.chain : null;
  }
  measureQuorum(keyOfState, threshold) {
    assertFinitePositive("quorum threshold", threshold);
    if (threshold > 1) {
      throw new Error("quorum threshold must be <= 1");
    }
    const grouped = /* @__PURE__ */ new Map();
    for (const entry of this.distribution()) {
      const key = keyOfState(entry.chain.state);
      const existing = grouped.get(key);
      if (existing) {
        existing.probability += entry.probability;
        existing.chains.push(entry.chain);
      } else {
        grouped.set(key, {
          probability: entry.probability,
          chains: [entry.chain]
        });
      }
    }
    let winnerKey = null;
    let winnerProbability = 0;
    let winnerChains = [];
    for (const [key, value] of grouped) {
      if (value.probability > winnerProbability || value.probability === winnerProbability && (winnerKey === null || key < winnerKey)) {
        winnerKey = key;
        winnerProbability = value.probability;
        winnerChains = value.chains;
      }
    }
    if (winnerKey !== null && winnerProbability >= threshold) {
      return {
        satisfied: true,
        probability: winnerProbability,
        chains: winnerChains,
        winningKey: winnerKey
      };
    }
    return {
      satisfied: false,
      probability: winnerProbability,
      chains: winnerChains
    };
  }
  measureMerge(merge) {
    return merge(this.distribution());
  }
};

// ../../open-source/aeon-logic/dist/checker.js
var DEFAULT_MAX_DEPTH = 64;
var DEFAULT_MAX_STATES = 2e5;
var DEFAULT_CONCURRENCY = 8;
function multiplyPhase2(left, right) {
  return left === right ? 1 : -1;
}
__name(multiplyPhase2, "multiplyPhase");
function defaultStateKey(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
__name(defaultStateKey, "defaultStateKey");
var ForkRaceFoldModelChecker = class {
  static {
    __name(this, "ForkRaceFoldModelChecker");
  }
  async check(model, options = {}) {
    const invariants = options.invariants ?? [];
    const eventual = options.eventual ?? [];
    const eventualQuorum = options.eventualQuorum ?? [];
    const weakFairness = options.weakFairness ?? [];
    const maxDepth = Math.max(0, options.maxDepth ?? DEFAULT_MAX_DEPTH);
    const maxStates = Math.max(1, options.maxStates ?? DEFAULT_MAX_STATES);
    const concurrency = Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY);
    const superposition = this.resolveSuperposition(options.superposition);
    const superpositionEnabled = Boolean(superposition);
    const nodes = /* @__PURE__ */ new Map();
    let transitionsExplored = 0;
    let foldedTransitions = 0;
    let maxFrontier = 0;
    let complete = true;
    let forkCount = 0;
    let ventCount = 0;
    let depthLayers = 0;
    const initialLayer = [];
    const dedupedInitialStates = [];
    const seenInitialIds = /* @__PURE__ */ new Set();
    for (const initialState of model.initialStates) {
      const stateId = model.fingerprint(initialState);
      if (seenInitialIds.has(stateId)) {
        continue;
      }
      seenInitialIds.add(stateId);
      dedupedInitialStates.push(initialState);
    }
    const initialAmplitude = superpositionEnabled ? 1 / Math.sqrt(Math.max(1, dedupedInitialStates.length)) : 1;
    for (const initialState of dedupedInitialStates) {
      const stateId = model.fingerprint(initialState);
      if (nodes.has(stateId)) {
        continue;
      }
      if (nodes.size >= maxStates) {
        complete = false;
        break;
      }
      const node = {
        id: stateId,
        state: initialState,
        depth: 0,
        parentId: null,
        viaAction: null,
        enabledActions: /* @__PURE__ */ new Set(),
        outgoing: [],
        quorumSatisfied: /* @__PURE__ */ new Set(),
        amplitude: initialAmplitude,
        phase: 1,
        probability: initialAmplitude * initialAmplitude
      };
      nodes.set(stateId, node);
      initialLayer.push(stateId);
      const invariantViolation = this.firstInvariantViolation(node, invariants, nodes);
      if (invariantViolation) {
        return this.failureResult(complete, [invariantViolation], nodes.size, transitionsExplored, foldedTransitions, maxFrontier, forkCount, ventCount, depthLayers);
      }
    }
    let currentLayerIds = initialLayer;
    while (currentLayerIds.length > 0) {
      maxFrontier = Math.max(maxFrontier, currentLayerIds.length);
      const nextLayerIds = [];
      for (let chunkStart = 0; chunkStart < currentLayerIds.length; chunkStart += concurrency) {
        const chunkIds = currentLayerIds.slice(chunkStart, chunkStart + concurrency);
        const expansions = await Promise.all(chunkIds.map(async (nodeId) => {
          const node = nodes.get(nodeId);
          if (!node) {
            throw new Error(`Missing frontier node "${nodeId}"`);
          }
          return this.expandNode(node, model.actions, superposition, eventualQuorum);
        }));
        for (const expansion of expansions) {
          const sourceNode = nodes.get(expansion.nodeId);
          if (!sourceNode) {
            throw new Error(`Missing expansion source "${expansion.nodeId}"`);
          }
          if (expansion.successors.length > 1) {
            forkCount += 1;
          }
          for (const actionName of expansion.enabledActions) {
            sourceNode.enabledActions.add(actionName);
          }
          for (const quorumPropertyName of expansion.quorumSatisfied) {
            sourceNode.quorumSatisfied.add(quorumPropertyName);
          }
          for (const successor of expansion.successors) {
            transitionsExplored += 1;
            const nextDepth = sourceNode.depth + 1;
            const successorId = model.fingerprint(successor.state);
            const existingNode = nodes.get(successorId);
            const incomingAmplitude = sourceNode.amplitude * successor.amplitude;
            const incomingPhase = multiplyPhase2(sourceNode.phase, successor.phase);
            const incomingProbability = incomingAmplitude * incomingAmplitude;
            if (existingNode) {
              sourceNode.outgoing.push({
                actionName: successor.actionName,
                toId: successorId,
                probability: incomingProbability,
                amplitude: incomingAmplitude,
                phase: incomingPhase
              });
              foldedTransitions += 1;
              if (superpositionEnabled) {
                const existingSigned = existingNode.amplitude * existingNode.phase;
                const incomingSigned = incomingAmplitude * incomingPhase;
                const combinedSigned = existingSigned + incomingSigned;
                existingNode.amplitude = Math.abs(combinedSigned);
                existingNode.phase = combinedSigned >= 0 ? 1 : -1;
                existingNode.probability = existingNode.amplitude * existingNode.amplitude;
              }
              continue;
            }
            if (nextDepth > maxDepth) {
              complete = false;
              continue;
            }
            if (nodes.size >= maxStates) {
              complete = false;
              continue;
            }
            const createdNode = {
              id: successorId,
              state: successor.state,
              depth: nextDepth,
              parentId: sourceNode.id,
              viaAction: successor.actionName,
              enabledActions: /* @__PURE__ */ new Set(),
              outgoing: [],
              quorumSatisfied: /* @__PURE__ */ new Set(),
              amplitude: incomingAmplitude,
              phase: incomingPhase,
              probability: incomingProbability
            };
            nodes.set(successorId, createdNode);
            nextLayerIds.push(successorId);
            sourceNode.outgoing.push({
              actionName: successor.actionName,
              toId: successorId,
              probability: incomingProbability,
              amplitude: incomingAmplitude,
              phase: incomingPhase
            });
            const invariantViolation = this.firstInvariantViolation(createdNode, invariants, nodes);
            if (invariantViolation) {
              return this.failureResult(complete, [invariantViolation], nodes.size, transitionsExplored, foldedTransitions, maxFrontier, forkCount, ventCount, depthLayers);
            }
          }
        }
      }
      depthLayers += 1;
      currentLayerIds = nextLayerIds;
      if (!complete && currentLayerIds.length === 0) {
        break;
      }
    }
    const eventualProperties = this.buildNodeEventuallyProperties(eventual, eventualQuorum);
    const eventualResult = complete ? this.firstEventuallyViolation(nodes, eventualProperties, weakFairness) : null;
    if (eventualResult) {
      ventCount += eventualResult.ventCount;
    }
    const violations = eventualResult?.violation ? [eventualResult.violation] : [];
    return {
      ok: violations.length === 0,
      complete,
      violations,
      stateCount: nodes.size,
      stats: this.buildStats(nodes.size, transitionsExplored, foldedTransitions, maxFrontier),
      topology: this.buildTopology(forkCount, foldedTransitions, ventCount, depthLayers, nodes.size, transitionsExplored)
    };
  }
  resolveSuperposition(options) {
    if (!options) {
      return null;
    }
    if (options.enabled === false) {
      return null;
    }
    return options;
  }
  buildNodeEventuallyProperties(eventual, eventualQuorum) {
    const statePredicates = eventual.map((property) => ({
      name: property.name,
      test: /* @__PURE__ */ __name((node) => property.test(node.state), "test")
    }));
    const quorumPredicates = eventualQuorum.map((property) => ({
      name: property.name,
      test: /* @__PURE__ */ __name((node) => node.quorumSatisfied.has(property.name), "test")
    }));
    return [...statePredicates, ...quorumPredicates];
  }
  buildStats(statesExplored, transitionsExplored, foldedTransitions, maxFrontier) {
    return {
      statesExplored,
      transitionsExplored,
      foldedTransitions,
      maxFrontier
    };
  }
  buildTopology(forkCount, foldedTransitions, ventCount, depthLayers, statesExplored, transitionsExplored) {
    const beta1 = Math.max(0, transitionsExplored - statesExplored + 1);
    return {
      forkCount,
      foldCount: foldedTransitions,
      ventCount,
      beta1,
      depthLayers
    };
  }
  failureResult(complete, violations, statesExplored, transitionsExplored, foldedTransitions, maxFrontier, forkCount, ventCount, depthLayers) {
    return {
      ok: false,
      complete,
      violations,
      stateCount: statesExplored,
      stats: this.buildStats(statesExplored, transitionsExplored, foldedTransitions, maxFrontier),
      topology: this.buildTopology(forkCount, foldedTransitions, ventCount, depthLayers, statesExplored, transitionsExplored)
    };
  }
  firstInvariantViolation(node, invariants, nodes) {
    for (const invariant of invariants) {
      if (invariant.test(node.state)) {
        continue;
      }
      return {
        kind: "invariant",
        name: invariant.name,
        message: `Invariant "${invariant.name}" violated at state ${node.id}.`,
        trace: this.buildTrace(nodes, node.id)
      };
    }
    return null;
  }
  firstEventuallyViolation(nodes, eventual, weakFairness) {
    let ventCount = 0;
    for (const property of eventual) {
      const badStateIds = /* @__PURE__ */ new Set();
      for (const node of nodes.values()) {
        if (!property.test(node)) {
          badStateIds.add(node.id);
        }
      }
      if (badStateIds.size === 0) {
        continue;
      }
      for (const badStateId of badStateIds) {
        const node = nodes.get(badStateId);
        if (!node) {
          continue;
        }
        if (node.outgoing.length === 0) {
          return {
            violation: {
              kind: "eventual",
              name: property.name,
              message: `Eventually property "${property.name}" fails at terminal state ${badStateId}.`,
              trace: this.buildTrace(nodes, badStateId)
            },
            ventCount
          };
        }
      }
      const badAdjacency = /* @__PURE__ */ new Map();
      for (const badStateId of badStateIds) {
        badAdjacency.set(badStateId, []);
      }
      for (const badStateId of badStateIds) {
        const node = nodes.get(badStateId);
        if (!node) {
          continue;
        }
        const badNeighbors = node.outgoing.map((edge) => edge.toId).filter((toId) => badStateIds.has(toId));
        badAdjacency.set(badStateId, badNeighbors);
      }
      const components = this.stronglyConnectedComponents([...badStateIds], badAdjacency);
      for (const component of components) {
        if (!this.hasCycle(component, badAdjacency)) {
          continue;
        }
        if (!this.isFairCycle(component, nodes, weakFairness)) {
          ventCount += 1;
          continue;
        }
        const cycleEntryState = component[0];
        if (!cycleEntryState) {
          continue;
        }
        return {
          violation: {
            kind: "eventual",
            name: property.name,
            message: `Eventually property "${property.name}" fails: reachable fair cycle avoids it.`,
            trace: this.buildTrace(nodes, cycleEntryState),
            cycleStateIds: component
          },
          ventCount
        };
      }
    }
    return { violation: null, ventCount };
  }
  isFairCycle(cycleStateIds, nodes, weakFairness) {
    if (weakFairness.length === 0) {
      return true;
    }
    const cycleSet = new Set(cycleStateIds);
    const cycleActions = /* @__PURE__ */ new Set();
    for (const stateId of cycleStateIds) {
      const node = nodes.get(stateId);
      if (!node) {
        continue;
      }
      for (const edge of node.outgoing) {
        if (cycleSet.has(edge.toId)) {
          cycleActions.add(edge.actionName);
        }
      }
    }
    for (const fairnessRule of weakFairness) {
      if (cycleActions.has(fairnessRule.actionName)) {
        continue;
      }
      const enabledEverywhere = cycleStateIds.every((stateId) => {
        const node = nodes.get(stateId);
        return Boolean(node && node.enabledActions.has(fairnessRule.actionName));
      });
      if (enabledEverywhere) {
        return false;
      }
    }
    return true;
  }
  hasCycle(componentStateIds, adjacency) {
    if (componentStateIds.length > 1) {
      return true;
    }
    const onlyStateId = componentStateIds[0];
    if (!onlyStateId) {
      return false;
    }
    const neighbors = adjacency.get(onlyStateId) ?? [];
    return neighbors.includes(onlyStateId);
  }
  stronglyConnectedComponents(nodeIds, adjacency) {
    const indexByNode = /* @__PURE__ */ new Map();
    const lowlinkByNode = /* @__PURE__ */ new Map();
    const nodeStack = [];
    const inStack = /* @__PURE__ */ new Set();
    const components = [];
    let currentIndex = 0;
    const strongConnect = /* @__PURE__ */ __name((nodeId) => {
      indexByNode.set(nodeId, currentIndex);
      lowlinkByNode.set(nodeId, currentIndex);
      currentIndex += 1;
      nodeStack.push(nodeId);
      inStack.add(nodeId);
      const neighbors = adjacency.get(nodeId) ?? [];
      for (const neighborId of neighbors) {
        if (!indexByNode.has(neighborId)) {
          strongConnect(neighborId);
          const nodeLowlink3 = lowlinkByNode.get(nodeId);
          const neighborLowlink = lowlinkByNode.get(neighborId);
          if (nodeLowlink3 === void 0 || neighborLowlink === void 0) {
            throw new Error("Tarjan lowlink bookkeeping failed");
          }
          lowlinkByNode.set(nodeId, Math.min(nodeLowlink3, neighborLowlink));
          continue;
        }
        if (!inStack.has(neighborId)) {
          continue;
        }
        const nodeLowlink2 = lowlinkByNode.get(nodeId);
        const neighborIndex = indexByNode.get(neighborId);
        if (nodeLowlink2 === void 0 || neighborIndex === void 0) {
          throw new Error("Tarjan stack bookkeeping failed");
        }
        lowlinkByNode.set(nodeId, Math.min(nodeLowlink2, neighborIndex));
      }
      const nodeIndex = indexByNode.get(nodeId);
      const nodeLowlink = lowlinkByNode.get(nodeId);
      if (nodeIndex === void 0 || nodeLowlink === void 0) {
        throw new Error("Tarjan node state missing");
      }
      if (nodeLowlink !== nodeIndex) {
        return;
      }
      const component = [];
      while (nodeStack.length > 0) {
        const poppedNode = nodeStack.pop();
        if (poppedNode === void 0) {
          break;
        }
        inStack.delete(poppedNode);
        component.push(poppedNode);
        if (poppedNode === nodeId) {
          break;
        }
      }
      components.push(component);
    }, "strongConnect");
    for (const nodeId of nodeIds) {
      if (!indexByNode.has(nodeId)) {
        strongConnect(nodeId);
      }
    }
    return components;
  }
  buildTrace(nodes, endStateId) {
    const reverseTrace = [];
    let cursor = endStateId;
    while (cursor !== null) {
      const node = nodes.get(cursor);
      if (!node) {
        break;
      }
      reverseTrace.push({
        stateId: node.id,
        state: node.state,
        viaAction: node.viaAction,
        quantum: {
          amplitude: node.amplitude,
          phase: node.phase,
          probability: node.probability
        }
      });
      cursor = node.parentId;
    }
    return reverseTrace.reverse();
  }
  expandNode(node, actions, superposition, eventualQuorum) {
    const enabledActions = [];
    const rawSuccessors = [];
    let successorIndex = 0;
    for (const action of actions) {
      const enabled = action.enabled ? action.enabled(node.state) : true;
      if (!enabled) {
        continue;
      }
      const nextStates = action.successors(node.state);
      if (nextStates.length === 0) {
        continue;
      }
      enabledActions.push(action.name);
      for (const nextState of nextStates) {
        rawSuccessors.push({
          actionName: action.name,
          state: nextState,
          successorIndex,
          pathId: `${action.name}:${successorIndex}`
        });
        successorIndex += 1;
      }
    }
    if (!superposition) {
      return {
        nodeId: node.id,
        enabledActions,
        successors: rawSuccessors.map((successor) => ({
          actionName: successor.actionName,
          state: successor.state,
          pathId: successor.pathId,
          amplitude: 1,
          phase: 1,
          probability: 1
        })),
        quorumSatisfied: []
      };
    }
    const keyOfState = superposition.keyOfState ?? defaultStateKey;
    const branchById = /* @__PURE__ */ new Map();
    const forked = LogicChainSuperposition.seed(node.state, { keyOfState }).fork(() => rawSuccessors.map((successor) => {
      branchById.set(successor.pathId, successor);
      const context = {
        sourceState: node.state,
        actionName: successor.actionName,
        successorState: successor.state,
        successorIndex: successor.successorIndex
      };
      return {
        id: successor.pathId,
        state: successor.state,
        step: successor.actionName,
        relativeAmplitude: superposition.branchAmplitude ? superposition.branchAmplitude(context) : 1,
        phase: superposition.branchPhase ? superposition.branchPhase(context) : 1
      };
    }));
    const interfered = superposition.interfere === false ? forked : forked.interfere(keyOfState);
    const distribution = interfered.distribution();
    const resolvedSuccessors = distribution.map((entry) => {
      const raw2 = branchById.get(entry.chain.id);
      if (!raw2) {
        return null;
      }
      return {
        actionName: raw2.actionName,
        state: raw2.state,
        pathId: raw2.pathId,
        amplitude: Math.sqrt(entry.probability),
        phase: entry.chain.phase,
        probability: entry.probability
      };
    }).filter((entry) => entry !== null).sort((left, right) => right.probability - left.probability || left.pathId.localeCompare(right.pathId));
    this.emitTopologyEvents(node, rawSuccessors, resolvedSuccessors, superposition);
    const quorumSatisfied = this.evaluateQuorumProperties(interfered, eventualQuorum);
    return {
      nodeId: node.id,
      enabledActions,
      successors: resolvedSuccessors,
      quorumSatisfied
    };
  }
  emitTopologyEvents(node, rawSuccessors, resolvedSuccessors, superposition) {
    const sink = superposition.onTopologyEvent;
    if (!sink || rawSuccessors.length < 2) {
      return;
    }
    const requestId = `${node.id}@${node.depth + 1}`;
    const paths = rawSuccessors.map((successor) => successor.pathId);
    sink({ type: "fork", id: requestId, paths });
    const winner = resolvedSuccessors[0];
    if (winner) {
      sink({
        type: "race",
        id: requestId,
        winnerPath: winner.pathId
      });
    }
    const survivingPaths = new Set(resolvedSuccessors.map((successor) => successor.pathId));
    for (const path3 of paths) {
      if (!survivingPaths.has(path3)) {
        sink({
          type: "vent",
          id: requestId,
          path: path3
        });
      }
    }
    sink({ type: "fold", id: requestId });
  }
  evaluateQuorumProperties(superposition, eventualQuorum) {
    if (eventualQuorum.length === 0) {
      return [];
    }
    const satisfied = [];
    for (const property of eventualQuorum) {
      const result = superposition.measureQuorum(property.keyOfState, property.threshold);
      if (!result.satisfied) {
        continue;
      }
      let goalSatisfied = true;
      let goalChains = result.chains;
      if (property.isGoalKey) {
        const goalKeyResult = superposition.measureQuorum((state) => property.isGoalKey?.(property.keyOfState(state)) ? "__goal__" : "__other__", property.threshold);
        goalSatisfied = goalSatisfied && goalKeyResult.satisfied && goalKeyResult.winningKey === "__goal__";
        if (goalSatisfied) {
          goalChains = goalKeyResult.chains;
        }
      }
      if (property.isGoalState) {
        goalSatisfied = goalSatisfied && goalChains.some((chain) => property.isGoalState?.(chain.state) === true);
      }
      if (goalSatisfied) {
        satisfied.push(property.name);
      }
    }
    return satisfied;
  }
};

// ../../open-source/aeon-logic/dist/tlc-cfg.js
init_performance2();

// ../../open-source/aeon-logic/dist/tla-module.js
init_performance2();

// ../../open-source/aeon-logic/dist/tla-sandbox.js
init_performance2();

// ../../open-source/aeon-logic/dist/tlc-trace.js
init_performance2();

// ../../open-source/aeon-logic/dist/tlc-artifacts.js
init_performance2();

// ../../open-source/aeon-logic/dist/complex-superposition.js
init_performance2();

// ../../open-source/aeon-logic/dist/superposition-artifacts.js
init_performance2();

// ../../open-source/aeon-logic/dist/self-verification-artifacts.js
init_performance2();

// ../../open-source/aeon-logic/dist/temporal-formula.js
init_performance2();

// ../../open-source/aeon-logic/dist/flow-bridge.js
init_performance2();

// ../../open-source/aeon-logic/dist/topology-bridge.js
init_performance2();

// ../../open-source/aeon-logic/dist/gg.js
init_performance2();
var DEFAULT_GG_ACTION = "gg-step";
var DEFAULT_MAX_BETA1_EXCLUSIVE = 10;
var DEFAULT_MAX_DEPTH2 = 32;
function stripCommentsAndEmptyLines(sourceText) {
  return sourceText.split("\n").map((line) => line.trim()).filter((line) => line.length > 0 && !line.startsWith("//")).join("\n");
}
__name(stripCommentsAndEmptyLines, "stripCommentsAndEmptyLines");
function splitPipe(raw2) {
  return raw2.split("|").map((segment) => segment.trim()).filter((segment) => segment.length > 0);
}
__name(splitPipe, "splitPipe");
function parseProperties(propertiesRaw) {
  if (!propertiesRaw) {
    return {};
  }
  const properties = {};
  const pairs = propertiesRaw.match(/(\w+)\s*:\s*('[^']*'|"[^"]*"|\[[^\]]*\]|[^,]+)/g);
  if (!pairs) {
    return properties;
  }
  for (const pair of pairs) {
    const separator = pair.indexOf(":");
    if (separator < 0) {
      continue;
    }
    const key = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key.length > 0 && value.length > 0) {
      properties[key] = value;
    }
  }
  return properties;
}
__name(parseProperties, "parseProperties");
function upsertNode(nodes, nodeId, label, properties) {
  const existing = nodes.get(nodeId);
  if (!existing) {
    nodes.set(nodeId, {
      id: nodeId,
      labels: label ? [label] : [],
      properties
    });
    return;
  }
  const labels = new Set(existing.labels);
  if (label && label.length > 0) {
    labels.add(label);
  }
  nodes.set(nodeId, {
    id: nodeId,
    labels: [...labels],
    properties: {
      ...existing.properties,
      ...properties
    }
  });
}
__name(upsertNode, "upsertNode");
function parseGgProgram(sourceText) {
  const cleanedInput = stripCommentsAndEmptyLines(sourceText);
  const nodes = /* @__PURE__ */ new Map();
  const edges = [];
  const nodeRegex = /\(([^:)\s]+)(?:\s*:\s*([^{\s)]+))?(?:\s*{([^}]+)})?\)/g;
  let nodeMatch;
  while ((nodeMatch = nodeRegex.exec(cleanedInput)) !== null) {
    const nodeId = (nodeMatch[1] ?? "").trim();
    if (nodeId.length === 0 || nodeId.includes("|")) {
      continue;
    }
    const label = nodeMatch[2]?.trim();
    const properties = parseProperties(nodeMatch[3]?.trim());
    upsertNode(nodes, nodeId, label, properties);
  }
  const edgeRegex = /\(([^)]+)\)\s*-\[:([A-Z]+)(?:\s*{([^}]+)})?\]->\s*\(([^)]+)\)/g;
  let edgeMatch;
  while ((edgeMatch = edgeRegex.exec(cleanedInput)) !== null) {
    const sourceRaw = (edgeMatch[1] ?? "").trim();
    const type = (edgeMatch[2] ?? "").trim();
    const targetRaw = (edgeMatch[4] ?? "").trim();
    const properties = parseProperties(edgeMatch[3]?.trim());
    const sourceIds = splitPipe(sourceRaw);
    const targetIds = splitPipe(targetRaw);
    edges.push({
      sourceIds,
      targetIds,
      type,
      properties
    });
    const matched = edgeMatch[0];
    const targetSegment = `(${edgeMatch[4]})`;
    const targetOffset = matched.lastIndexOf(targetSegment);
    edgeRegex.lastIndex = edgeMatch.index + targetOffset;
    for (const sourceId of sourceIds) {
      if (!nodes.has(sourceId)) {
        upsertNode(nodes, sourceId, void 0, {});
      }
    }
    for (const targetId of targetIds) {
      if (!nodes.has(targetId)) {
        upsertNode(nodes, targetId, void 0, {});
      }
    }
  }
  if (edges.length === 0) {
    throw new Error("No .gg topology edges were parsed.");
  }
  return {
    nodes: [...nodes.values()],
    edges
  };
}
__name(parseGgProgram, "parseGgProgram");
function getGgRootNodeIds(program) {
  const allTargets = new Set(program.edges.flatMap((edge) => edge.targetIds));
  const allSources = new Set(program.edges.flatMap((edge) => edge.sourceIds));
  return [...allSources].filter((sourceId) => !allTargets.has(sourceId));
}
__name(getGgRootNodeIds, "getGgRootNodeIds");
function getGgTerminalNodeIds(program) {
  const allTargets = new Set(program.edges.flatMap((edge) => edge.targetIds));
  const allSources = new Set(program.edges.flatMap((edge) => edge.sourceIds));
  return [...allTargets].filter((targetId) => !allSources.has(targetId));
}
__name(getGgTerminalNodeIds, "getGgTerminalNodeIds");
function buildGgTemporalModel(program, options = {}) {
  const roots = getGgRootNodeIds(program);
  const fallbackInitialNode = program.edges[0]?.sourceIds[0];
  const initialNodeId = options.initialNodeId ?? roots[0] ?? fallbackInitialNode ?? "root";
  const initialBeta1 = options.initialBeta1 ?? 0;
  const actionName = options.actionName ?? DEFAULT_GG_ACTION;
  return {
    initialStates: [{ nodeId: initialNodeId, beta1: initialBeta1 }],
    fingerprint: /* @__PURE__ */ __name((state) => `${state.nodeId}:${state.beta1}`, "fingerprint"),
    actions: [
      {
        name: actionName,
        successors: /* @__PURE__ */ __name((state) => {
          const outgoing = program.edges.filter((edge) => edge.sourceIds.includes(state.nodeId));
          return outgoing.flatMap((edge) => {
            const nextBeta1 = edge.type === "FORK" ? state.beta1 + (edge.targetIds.length - 1) : edge.type === "FOLD" || edge.type === "COLLAPSE" ? 0 : edge.type === "RACE" ? Math.max(0, state.beta1 - (edge.sourceIds.length - 1)) : edge.type === "VENT" || edge.type === "TUNNEL" ? Math.max(0, state.beta1 - 1) : state.beta1;
            return edge.targetIds.map((targetId) => ({
              nodeId: targetId,
              beta1: nextBeta1
            }));
          });
        }, "successors")
      }
    ]
  };
}
__name(buildGgTemporalModel, "buildGgTemporalModel");
function buildDefaultGgCheckerOptions(program, defaults = {}) {
  const terminalNodes = new Set(getGgTerminalNodeIds(program));
  const maxBeta1Exclusive = defaults.maxBeta1Exclusive ?? DEFAULT_MAX_BETA1_EXCLUSIVE;
  return {
    maxDepth: defaults.maxDepth ?? DEFAULT_MAX_DEPTH2,
    invariants: [
      { name: "beta1_non_negative", test: /* @__PURE__ */ __name((state) => state.beta1 >= 0, "test") },
      { name: "beta1_lt_bound", test: /* @__PURE__ */ __name((state) => state.beta1 < maxBeta1Exclusive, "test") }
    ],
    eventual: [
      {
        name: "eventually_terminal",
        test: /* @__PURE__ */ __name((state) => terminalNodes.has(state.nodeId), "test")
      },
      {
        name: "eventually_beta1_zero",
        test: /* @__PURE__ */ __name((state) => state.beta1 === 0, "test")
      }
    ]
  };
}
__name(buildDefaultGgCheckerOptions, "buildDefaultGgCheckerOptions");
async function checkGgProgram(sourceText, options = {}) {
  const program = parseGgProgram(sourceText);
  const model = buildGgTemporalModel(program, options.model);
  const checkerOptions = options.checker ?? buildDefaultGgCheckerOptions(program, options.defaults);
  const checker = new ForkRaceFoldModelChecker();
  return checker.check(model, checkerOptions);
}
__name(checkGgProgram, "checkGgProgram");

// ../../open-source/gnosis/src/capabilities/index.ts
init_performance2();

// ../../open-source/gnosis/src/capabilities/profiles.ts
init_performance2();
var NODE_CAPABILITIES = [
  "net.tcp.client",
  "net.tcp.server",
  "net.udp",
  "fs.local",
  "fs.durable",
  "auth.ucan",
  "auth.zk",
  "auth.custodial"
];
var WORKERS_CAPABILITIES = [
  "net.tcp.client",
  "fs.local",
  "auth.ucan",
  "auth.zk",
  "auth.custodial"
];
var CAPABILITY_PROFILES = {
  node: {
    target: "node",
    supported: new Set(NODE_CAPABILITIES),
    description: "Node.js host with TCP server/client, UDP, and durable local file access."
  },
  bun: {
    target: "bun",
    supported: new Set(NODE_CAPABILITIES),
    description: "Bun host with Node-compatible networking and local file access."
  },
  workers: {
    target: "workers",
    supported: new Set(WORKERS_CAPABILITIES),
    description: "Cloudflare Workers host with outbound TCP client support only (no TCP server, no UDP, no durable local disk)."
  }
};

// ../../open-source/gnosis/src/capabilities/inference.ts
init_performance2();
var DECLARED_CAPABILITY_FIELDS = [
  "capability",
  "capabilities",
  "effect",
  "effects",
  "require",
  "requires"
];
var CAPABILITY_ALIASES = {
  tcp: "net.tcp.client",
  "tcp-client": "net.tcp.client",
  "tcp.client": "net.tcp.client",
  "net.tcp.client": "net.tcp.client",
  "tcp-server": "net.tcp.server",
  "tcp.server": "net.tcp.server",
  "net.tcp.server": "net.tcp.server",
  udp: "net.udp",
  dgram: "net.udp",
  "udp-socket": "net.udp",
  "net.udp": "net.udp",
  fs: "fs.local",
  "fs-local": "fs.local",
  "fs.local": "fs.local",
  "fs-durable": "fs.durable",
  "fs.durable": "fs.durable",
  disk: "fs.durable",
  durable: "fs.durable",
  ucan: "auth.ucan",
  "auth.ucan": "auth.ucan",
  zk: "auth.zk",
  "auth.zk": "auth.zk",
  custodial: "auth.custodial",
  "auth.custodial": "auth.custodial"
};
var UCAN_LABELS = /* @__PURE__ */ new Set([
  "ucanidentity",
  "ucanissue",
  "ucanverify",
  "ucandelegate",
  "ucanrequire"
]);
var ZK_LABELS = /* @__PURE__ */ new Set([
  "zkencrypt",
  "zkdecrypt",
  "zksyncenvelope",
  "zkmaterializeenvelope"
]);
var CUSTODIAL_LABELS = /* @__PURE__ */ new Set(["custodialsigner"]);
function normalizeToken(value) {
  return value.trim().toLowerCase().replace(/^['"]|['"]$/g, "");
}
__name(normalizeToken, "normalizeToken");
function parseCapabilityTokens(value) {
  return value.split(/[\s,|]+/).map((entry) => normalizeToken(entry)).filter((entry) => entry.length > 0);
}
__name(parseCapabilityTokens, "parseCapabilityTokens");
function readStringProperty(properties, key) {
  const value = properties[key];
  if (typeof value !== "string") {
    return null;
  }
  return value;
}
__name(readStringProperty, "readStringProperty");
function addRequirement(requirements, capability, nodeId, reason, source, label) {
  requirements.push({ capability, nodeId, reason, source, label });
}
__name(addRequirement, "addRequirement");
function inferDeclaredCapabilities(requirements, nodeId, label, properties) {
  for (const field of DECLARED_CAPABILITY_FIELDS) {
    const raw2 = readStringProperty(properties, field);
    if (!raw2) continue;
    for (const token of parseCapabilityTokens(raw2)) {
      const capability = CAPABILITY_ALIASES[token];
      if (!capability) continue;
      addRequirement(
        requirements,
        capability,
        nodeId,
        `Declared via ${field}`,
        "declaration",
        label
      );
    }
  }
}
__name(inferDeclaredCapabilities, "inferDeclaredCapabilities");
function inferTransportCapabilities(requirements, nodeId, label, properties) {
  const transport = normalizeToken(properties.transport ?? properties.protocol ?? "");
  const mode = normalizeToken(properties.mode ?? properties.role ?? properties.op ?? "");
  if (transport === "udp") {
    addRequirement(
      requirements,
      "net.udp",
      nodeId,
      "Transport/protocol indicates UDP networking",
      "inference",
      label
    );
    return;
  }
  if (transport === "tcp") {
    const capability = mode.includes("server") || mode.includes("listen") || mode.includes("bind") ? "net.tcp.server" : "net.tcp.client";
    addRequirement(
      requirements,
      capability,
      nodeId,
      "Transport/protocol indicates TCP networking",
      "inference",
      label
    );
  }
}
__name(inferTransportCapabilities, "inferTransportCapabilities");
function inferStorageCapabilities(requirements, nodeId, label, properties) {
  const storage = normalizeToken(properties.storage ?? properties.persistence ?? "");
  const durableFlag = normalizeToken(properties.durable ?? "");
  const op = normalizeToken(properties.op ?? "");
  if (storage === "durable" || durableFlag === "true") {
    addRequirement(
      requirements,
      "fs.durable",
      nodeId,
      "Node declares durable local persistence",
      "inference",
      label
    );
    return;
  }
  if (op === "read_file" || op === "write_file") {
    addRequirement(
      requirements,
      "fs.local",
      nodeId,
      `Node operation ${op} requires local filesystem access`,
      "inference",
      label
    );
  }
}
__name(inferStorageCapabilities, "inferStorageCapabilities");
function inferLabelCapabilities(requirements, nodeId, labels) {
  for (const rawLabel of labels) {
    const label = normalizeToken(rawLabel);
    if (UCAN_LABELS.has(label)) {
      addRequirement(
        requirements,
        "auth.ucan",
        nodeId,
        `Label ${rawLabel} uses UCAN capability semantics`,
        "inference",
        rawLabel
      );
    }
    if (ZK_LABELS.has(label)) {
      addRequirement(
        requirements,
        "auth.zk",
        nodeId,
        `Label ${rawLabel} uses zero-knowledge encryption primitives`,
        "inference",
        rawLabel
      );
    }
    if (CUSTODIAL_LABELS.has(label)) {
      addRequirement(
        requirements,
        "auth.custodial",
        nodeId,
        `Label ${rawLabel} uses custodial signing contracts`,
        "inference",
        rawLabel
      );
    }
    if (label.includes("tcpserver") || label.includes("tcplistener")) {
      addRequirement(
        requirements,
        "net.tcp.server",
        nodeId,
        `Label ${rawLabel} implies TCP server usage`,
        "inference",
        rawLabel
      );
    } else if (label.includes("tcp")) {
      addRequirement(
        requirements,
        "net.tcp.client",
        nodeId,
        `Label ${rawLabel} implies TCP client usage`,
        "inference",
        rawLabel
      );
    }
    if (label.includes("udp") || label.includes("dgram")) {
      addRequirement(
        requirements,
        "net.udp",
        nodeId,
        `Label ${rawLabel} implies UDP socket usage`,
        "inference",
        rawLabel
      );
    }
  }
}
__name(inferLabelCapabilities, "inferLabelCapabilities");
function dedupeRequirements(requirements) {
  const seen = /* @__PURE__ */ new Set();
  const unique = [];
  for (const requirement of requirements) {
    const key = `${requirement.capability}::${requirement.nodeId}::${requirement.reason}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(requirement);
  }
  return unique;
}
__name(dedupeRequirements, "dedupeRequirements");
function inferCapabilitiesFromGgSource(source) {
  const requirements = [];
  const program = parseGgProgram(source);
  for (const node of program.nodes) {
    const nodeId = node.id;
    const labels = node.labels ?? [];
    const properties = node.properties ?? {};
    const primaryLabel = labels[0];
    inferDeclaredCapabilities(requirements, nodeId, primaryLabel, properties);
    inferTransportCapabilities(requirements, nodeId, primaryLabel, properties);
    inferStorageCapabilities(requirements, nodeId, primaryLabel, properties);
    inferLabelCapabilities(requirements, nodeId, labels);
  }
  return dedupeRequirements(requirements);
}
__name(inferCapabilitiesFromGgSource, "inferCapabilitiesFromGgSource");

// ../../open-source/gnosis/src/capabilities/validate.ts
init_performance2();
function uniqueCapabilities(requirements) {
  return [...new Set(requirements.map((requirement) => requirement.capability))].sort();
}
__name(uniqueCapabilities, "uniqueCapabilities");
function validateCapabilitiesForTarget(requirements, target) {
  const requiredUnique = uniqueCapabilities(requirements);
  if (target === "agnostic") {
    return {
      target,
      required: [...requirements],
      requiredUnique,
      issues: [],
      ok: true
    };
  }
  const profile = CAPABILITY_PROFILES[target];
  const issues = [];
  for (const capability of requiredUnique) {
    if (!profile.supported.has(capability)) {
      issues.push({
        capability,
        severity: "error",
        target,
        message: `${capability} is not supported on ${target}.`
      });
      continue;
    }
    if (target === "workers" && capability === "fs.local") {
      issues.push({
        capability,
        severity: "warning",
        target,
        message: "fs.local on workers is isolate-local/ephemeral and not durable across restarts."
      });
    }
  }
  return {
    target,
    required: [...requirements],
    requiredUnique,
    issues,
    ok: !issues.some((issue) => issue.severity === "error")
  };
}
__name(validateCapabilitiesForTarget, "validateCapabilitiesForTarget");

// ../../open-source/gnosis/src/analysis.ts
function round2(value) {
  return Math.round(value * 100) / 100;
}
__name(round2, "round2");
function buildLineMetrics(source) {
  const lines = source.split("\n");
  const totalLines = lines.length;
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0).length;
  const commentLines = lines.filter((line) => line.trim().startsWith("//")).length;
  const topologyLines = lines.filter((line) => line.includes("-[:")).length;
  return {
    totalLines,
    nonEmptyLines,
    commentLines,
    topologyLines
  };
}
__name(buildLineMetrics, "buildLineMetrics");
function buildTopologyMetrics(source) {
  const program = parseGgProgram(source);
  const edgeTypes = program.edges.map((edge) => edge.type.toUpperCase());
  const forkEdgeCount = edgeTypes.filter((type) => type === "FORK").length;
  const raceEdgeCount = edgeTypes.filter((type) => type === "RACE").length;
  const foldEdgeCount = edgeTypes.filter((type) => type === "FOLD" || type === "COLLAPSE").length;
  const ventEdgeCount = edgeTypes.filter((type) => type === "VENT" || type === "TUNNEL").length;
  const interfereEdgeCount = edgeTypes.filter((type) => type === "INTERFERE").length;
  const processEdgeCount = edgeTypes.filter((type) => type === "PROCESS").length;
  const observeEdgeCount = edgeTypes.filter((type) => type === "OBSERVE").length;
  const forkWidths = program.edges.filter((edge) => edge.type.toUpperCase() === "FORK").map((edge) => edge.targetIds.length);
  const maxBranchFactor = Math.max(
    1,
    ...forkWidths
  );
  const avgBranchFactor = forkWidths.length === 0 ? 1 : round2(forkWidths.reduce((sum, width) => sum + width, 0) / forkWidths.length);
  return {
    nodeCount: program.nodes.length,
    functionNodeCount: program.nodes.filter((node) => node.labels.length > 0).length,
    edgeCount: program.edges.length,
    forkEdgeCount,
    raceEdgeCount,
    foldEdgeCount,
    ventEdgeCount,
    interfereEdgeCount,
    processEdgeCount,
    observeEdgeCount,
    maxBranchFactor,
    avgBranchFactor,
    // McCabe-style approximation for directed graph workflows.
    cyclomaticApprox: Math.max(1, program.edges.length - program.nodes.length + 2)
  };
}
__name(buildTopologyMetrics, "buildTopologyMetrics");
function buildQuantumMetrics(topology, correctness) {
  const superpositionEdgeCount = topology.forkEdgeCount + topology.interfereEdgeCount;
  const collapseEdgeCount = topology.raceEdgeCount + topology.foldEdgeCount + topology.ventEdgeCount + topology.observeEdgeCount;
  const collapseCoverage = topology.forkEdgeCount === 0 ? 1 : round2(collapseEdgeCount / topology.forkEdgeCount);
  const collapseDeficit = Math.max(0, topology.forkEdgeCount - collapseEdgeCount);
  const interferenceDensity = topology.edgeCount === 0 ? 0 : round2(topology.interfereEdgeCount / topology.edgeCount);
  const betaPressure = round2(
    topology.maxBranchFactor * Math.max(1, topology.forkEdgeCount) + topology.interfereEdgeCount * 1.5 + correctness.topology.beta1
  );
  const betaHeadroom = round2(Math.max(0, 10 - correctness.topology.beta1));
  const quantumIndex = round2(
    betaPressure + collapseDeficit * 2 + Math.max(0, 1 - collapseCoverage) * 4 + interferenceDensity * 5
  );
  return {
    superpositionEdgeCount,
    collapseEdgeCount,
    collapseCoverage,
    collapseDeficit,
    interferenceDensity,
    betaPressure,
    betaHeadroom,
    quantumIndex
  };
}
__name(buildQuantumMetrics, "buildQuantumMetrics");
function computeBuleyNumber(line, topology) {
  const sizeComponent = Math.log2(line.nonEmptyLines + 1);
  const branchComponent = topology.forkEdgeCount * 2.3 + topology.raceEdgeCount * 1.6 + topology.interfereEdgeCount * 1.4 + topology.maxBranchFactor * 1.1;
  const collapsePenalty = Math.max(0, topology.forkEdgeCount - (topology.foldEdgeCount + topology.raceEdgeCount + topology.ventEdgeCount)) * 1.75;
  const shapeComponent = topology.cyclomaticApprox * 1.35;
  const functionDensity = topology.nodeCount > 0 ? topology.functionNodeCount / topology.nodeCount : 0;
  return round2(
    sizeComponent + branchComponent + collapsePenalty + shapeComponent + functionDensity * 2
  );
}
__name(computeBuleyNumber, "computeBuleyNumber");
function formatGnosisViolations(result) {
  if (result.ok) {
    return [];
  }
  return result.violations.map((violation) => {
    const trace = violation.trace.map((step) => step.stateId).join(" -> ");
    if (trace.length === 0) {
      return `${violation.kind}:${violation.name} ${violation.message}`;
    }
    return `${violation.kind}:${violation.name} ${violation.message} trace=${trace}`;
  });
}
__name(formatGnosisViolations, "formatGnosisViolations");
async function analyzeGnosisSource(source, options = {}) {
  const line = buildLineMetrics(source);
  const topology = buildTopologyMetrics(source);
  const target = options.target ?? "agnostic";
  const correctness = await checkGgProgram(source, {
    defaults: {
      maxDepth: 64,
      maxBeta1Exclusive: 10
    }
  });
  const quantum = buildQuantumMetrics(topology, correctness);
  const capabilityRequirements = inferCapabilitiesFromGgSource(source);
  const capabilityValidation = validateCapabilitiesForTarget(
    capabilityRequirements,
    target
  );
  return {
    fileCount: 1,
    line,
    topology,
    quantum,
    buleyNumber: computeBuleyNumber(line, topology),
    correctness,
    capabilities: {
      target: capabilityValidation.target,
      required: capabilityValidation.required,
      requiredUnique: capabilityValidation.requiredUnique,
      issues: capabilityValidation.issues,
      ok: capabilityValidation.ok
    }
  };
}
__name(analyzeGnosisSource, "analyzeGnosisSource");

// ../../open-source/gnosis/src/tla-bridge.ts
init_performance2();
import path from "path";
var MODULE_PREFIX = "Gnosis";
var HEADER_DASHES = "-".repeat(30);
function sanitizeModuleName(rawName) {
  const normalized = rawName.replace(/[^A-Za-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+/, "").replace(/_+$/, "");
  if (normalized.length === 0) {
    return `${MODULE_PREFIX}Spec`;
  }
  if (/^[A-Za-z_]/.test(normalized)) {
    return normalized;
  }
  return `${MODULE_PREFIX}_${normalized}`;
}
__name(sanitizeModuleName, "sanitizeModuleName");
function deriveModuleName(program, options) {
  if (options.moduleName && options.moduleName.trim().length > 0) {
    return sanitizeModuleName(options.moduleName.trim());
  }
  if (options.sourceFilePath && options.sourceFilePath.trim().length > 0) {
    const parsed = path.parse(options.sourceFilePath);
    return sanitizeModuleName(parsed.name);
  }
  const rootNode = getResolvedRoots(program)[0];
  if (rootNode && rootNode.length > 0) {
    return sanitizeModuleName(`${MODULE_PREFIX}_${rootNode}`);
  }
  return `${MODULE_PREFIX}Spec`;
}
__name(deriveModuleName, "deriveModuleName");
function escapeTlaString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
__name(escapeTlaString, "escapeTlaString");
function toTlaSet(nodeIds) {
  const uniqueNodeIds = [...new Set(nodeIds)];
  const serialized = uniqueNodeIds.map((nodeId) => `"${escapeTlaString(nodeId)}"`).join(", ");
  return `{${serialized}}`;
}
__name(toTlaSet, "toTlaSet");
function getResolvedRoots(program) {
  const roots = getGgRootNodeIds(program);
  if (roots.length > 0) {
    return roots;
  }
  const fallbackRoot = program.edges[0]?.sourceIds[0];
  return fallbackRoot ? [fallbackRoot] : [];
}
__name(getResolvedRoots, "getResolvedRoots");
function getFoldTargets(program) {
  return [
    ...new Set(
      program.edges.filter((edge) => {
        const type = edge.type.toUpperCase();
        return type === "FOLD" || type === "COLLAPSE" || type === "OBSERVE";
      }).flatMap((edge) => edge.targetIds)
    )
  ];
}
__name(getFoldTargets, "getFoldTargets");
function edgeActionName(edge, index) {
  const typeName = edge.type.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  const ordinal = String(index + 1).padStart(2, "0");
  return `Edge_${ordinal}_${typeName}`;
}
__name(edgeActionName, "edgeActionName");
function edgeBetaExpression(edge, sourceSet, targetSet) {
  const edgeType = edge.type.toUpperCase();
  if (edgeType === "FORK") {
    return `beta1 + (Cardinality(${targetSet}) - 1)`;
  }
  if (edgeType === "RACE") {
    return `Max2(0, beta1 - (Cardinality(${sourceSet}) - 1))`;
  }
  if (edgeType === "FOLD" || edgeType === "COLLAPSE" || edgeType === "OBSERVE") {
    return "0";
  }
  if (edgeType === "VENT" || edgeType === "TUNNEL") {
    return "Max2(0, beta1 - 1)";
  }
  return "beta1";
}
__name(edgeBetaExpression, "edgeBetaExpression");
function renderEdgeAction(edge, index) {
  const sourceSet = toTlaSet(edge.sourceIds);
  const targetSet = toTlaSet(edge.targetIds);
  const actionName = edgeActionName(edge, index);
  const betaExpression = edgeBetaExpression(edge, sourceSet, targetSet);
  const edgeType = edge.type.toUpperCase();
  if (edgeType === "RACE") {
    return [
      `${actionName} ==`,
      `  /\\ CanFire(${sourceSet})`,
      `  /\\ \\E winner \\in ${targetSet}:`,
      `      /\\ active' = UpdateActive(${sourceSet}, {winner})`,
      `      /\\ beta1' = ${betaExpression}`,
      `      /\\ payloadPresent' = payloadPresent`,
      `      /\\ consensusReached' = consensusReached \\/ (winner \\in FOLD_TARGETS)`
    ].join("\n");
  }
  return [
    `${actionName} ==`,
    `  /\\ CanFire(${sourceSet})`,
    `  /\\ active' = UpdateActive(${sourceSet}, ${targetSet})`,
    `  /\\ beta1' = ${betaExpression}`,
    `  /\\ payloadPresent' = payloadPresent`,
    `  /\\ consensusReached' = consensusReached \\/ (${targetSet} \\cap FOLD_TARGETS # {})`
  ].join("\n");
}
__name(renderEdgeAction, "renderEdgeAction");
function renderNext(actionNames) {
  if (actionNames.length === 0) {
    return "Next == FALSE";
  }
  const lines = ["Next =="];
  for (const actionName of actionNames) {
    lines.push(`  \\/ ${actionName}`);
  }
  return lines.join("\n");
}
__name(renderNext, "renderNext");
function renderTla(moduleName, program, roots, terminals, foldTargets) {
  const renderedActions = program.edges.map((edge, index) => renderEdgeAction(edge, index));
  const actionNames = program.edges.map((edge, index) => edgeActionName(edge, index));
  const lines = [];
  lines.push(`${HEADER_DASHES} MODULE ${moduleName} ${HEADER_DASHES}`);
  lines.push("EXTENDS Naturals, FiniteSets, Sequences");
  lines.push("");
  lines.push(`NODES == ${toTlaSet(program.nodes.map((node) => node.id))}`);
  lines.push(`ROOTS == ${toTlaSet(roots)}`);
  lines.push(`TERMINALS == ${toTlaSet(terminals)}`);
  lines.push(`FOLD_TARGETS == ${toTlaSet(foldTargets)}`);
  lines.push("");
  lines.push("VARIABLES active, beta1, payloadPresent, consensusReached");
  lines.push("vars == <<active, beta1, payloadPresent, consensusReached>>");
  lines.push("");
  lines.push("Max2(a, b) == IF a > b THEN a ELSE b");
  lines.push("CanFire(sourceSet) == sourceSet \\subseteq active");
  lines.push("UpdateActive(sourceSet, targetSet) == (active \\ sourceSet) \\cup targetSet");
  lines.push("");
  lines.push("Init ==");
  lines.push("  /\\ active = ROOTS");
  lines.push("  /\\ beta1 = 0");
  lines.push("  /\\ payloadPresent = TRUE");
  lines.push("  /\\ consensusReached = FALSE");
  lines.push("");
  lines.push(...renderedActions);
  lines.push("");
  lines.push(renderNext(actionNames));
  lines.push("");
  lines.push("TypeInvariant ==");
  lines.push("  /\\ active \\subseteq NODES");
  lines.push("  /\\ beta1 \\in Nat");
  lines.push("  /\\ payloadPresent \\in BOOLEAN");
  lines.push("  /\\ consensusReached \\in BOOLEAN");
  lines.push("");
  lines.push("NoLostPayloadInvariant == payloadPresent = TRUE");
  lines.push("HasFoldTargets == FOLD_TARGETS # {}");
  lines.push("EventuallyTerminal == <> (active \\cap TERMINALS # {})");
  lines.push(
    "EventuallyConsensus == IF HasFoldTargets THEN <> consensusReached ELSE TRUE"
  );
  lines.push("DeadlockFree == []<>(ENABLED Next)");
  lines.push("");
  lines.push("Spec ==");
  lines.push("  /\\ Init");
  lines.push("  /\\ [][Next]_vars");
  lines.push("  /\\ WF_vars(Next)");
  lines.push("");
  lines.push("THEOREM Spec => []NoLostPayloadInvariant");
  lines.push("");
  lines.push("=============================================================================");
  return `${lines.join("\n")}
`;
}
__name(renderTla, "renderTla");
function renderCfg() {
  return [
    "SPECIFICATION Spec",
    "INVARIANT TypeInvariant",
    "INVARIANT NoLostPayloadInvariant",
    "PROPERTY DeadlockFree",
    "PROPERTY EventuallyTerminal",
    "PROPERTY EventuallyConsensus",
    ""
  ].join("\n");
}
__name(renderCfg, "renderCfg");
function generateTlaFromGnosisSource(sourceText, options = {}) {
  const program = parseGgProgram(sourceText);
  const moduleName = deriveModuleName(program, options);
  const roots = getResolvedRoots(program);
  const terminals = getGgTerminalNodeIds(program);
  const foldTargets = getFoldTargets(program);
  const forkEdgeCount = program.edges.filter(
    (edge) => edge.type.toUpperCase() === "FORK"
  ).length;
  const raceEdgeCount = program.edges.filter(
    (edge) => edge.type.toUpperCase() === "RACE"
  ).length;
  return {
    moduleName,
    tla: renderTla(moduleName, program, roots, terminals, foldTargets),
    cfg: renderCfg(),
    stats: {
      nodeCount: program.nodes.length,
      edgeCount: program.edges.length,
      rootCount: roots.length,
      terminalCount: terminals.length,
      foldTargetCount: foldTargets.length,
      forkEdgeCount,
      raceEdgeCount
    }
  };
}
__name(generateTlaFromGnosisSource, "generateTlaFromGnosisSource");

// ../../open-source/gnosis/src/sarif.ts
init_performance2();
import path2 from "node:path";
function toUri(filePath) {
  return path2.isAbsolute(filePath) ? filePath : path2.resolve(process.cwd(), filePath);
}
__name(toUri, "toUri");
function buildSarifLog(name, rules, results) {
  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name,
            informationUri: "https://github.com/affectively-ai/gnosis",
            rules
          }
        },
        results
      }
    ]
  };
}
__name(buildSarifLog, "buildSarifLog");
function uniqueRules(results) {
  const map = /* @__PURE__ */ new Map();
  for (const result of results) {
    if (map.has(result.ruleId)) {
      continue;
    }
    map.set(result.ruleId, {
      id: result.ruleId,
      shortDescription: { text: result.ruleId }
    });
  }
  return [...map.values()];
}
__name(uniqueRules, "uniqueRules");
function ggReportToSarif(filePath, report, formattedViolations, maxBuley) {
  const results = [];
  for (let index = 0; index < formattedViolations.length; index += 1) {
    const text2 = formattedViolations[index];
    const ruleId = `gnosis.gg.formal.${index + 1}`;
    results.push({
      ruleId,
      level: "error",
      message: { text: text2 },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: toUri(filePath) }
          }
        }
      ]
    });
  }
  if (maxBuley !== null && report.buleyNumber > maxBuley) {
    results.push({
      ruleId: "gnosis.gg.buley-threshold",
      level: "error",
      message: {
        text: `Buley number ${report.buleyNumber} exceeds threshold ${maxBuley}.`
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: toUri(filePath) }
          }
        }
      ]
    });
  }
  for (const issue of report.capabilities.issues) {
    results.push({
      ruleId: `gnosis.gg.capability.${issue.capability}`,
      level: issue.severity === "error" ? "error" : "warning",
      message: {
        text: `${issue.message} (target=${issue.target})`
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: toUri(filePath) }
          }
        }
      ]
    });
  }
  if (results.length === 0) {
    results.push({
      ruleId: "gnosis.gg.pass",
      level: "note",
      message: {
        text: `Formal check passed. Buley=${report.buleyNumber}, QuantumIndex=${report.quantum.quantumIndex}`
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: toUri(filePath) }
          }
        }
      ]
    });
  }
  return buildSarifLog("gnosis-gg-lint", uniqueRules(results), results);
}
__name(ggReportToSarif, "ggReportToSarif");

// ../../open-source/gnosis/src/formatter.ts
init_performance2();
var GnosisFormatter = class {
  static {
    __name(this, "GnosisFormatter");
  }
  compiler;
  constructor() {
    this.compiler = new BettyCompiler();
  }
  /**
   * Formats GGL source code into a canonical, pretty-printed style.
   * 1. Preserves comments (on their own lines)
   * 2. Normalizes spacing in nodes and edges
   * 3. Sorts properties alphabetically
   * 4. Ensures consistent indentation
   */
  format(source) {
    const lines = source.split("\n");
    const formatted = [];
    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//")) {
        formatted.push(trimmed);
        continue;
      }
      const { ast } = this.compiler.parse(line);
      if (!ast) {
        formatted.push(trimmed);
        continue;
      }
      if (ast.edges.length > 0) {
        for (const edge of ast.edges) {
          formatted.push(this.formatEdge(edge));
        }
      } else if (ast.nodes.size > 0) {
        for (const [id, node] of ast.nodes) {
          formatted.push(this.formatNode(node));
        }
      } else {
        formatted.push(trimmed);
      }
    }
    return formatted.join("\n");
  }
  formatNode(node) {
    const labelStr = node.labels.length > 0 ? ` : ${node.labels.join(":")}` : "";
    const propsStr = this.formatProperties(node.properties);
    return `(${node.id}${labelStr}${propsStr})`;
  }
  formatEdge(edge) {
    const sources = edge.sourceIds.join(" | ");
    const targets = edge.targetIds.join(" | ");
    const propsStr = this.formatProperties(edge.properties);
    const typeStr = edge.type ? `[:${edge.type}${propsStr}]` : "--";
    return `(${sources}) -${typeStr}-> (${targets})`;
  }
  formatProperties(props) {
    const keys = Object.keys(props).sort();
    if (keys.length === 0) return "";
    const inner = keys.map((k) => `${k}: '${props[k]}'`).join(", ");
    return ` { ${inner} }`;
  }
};

// ../../open-source/gnosis/src/neo4j-bridge.ts
init_performance2();
var GnosisNeo4jBridge = class {
  static {
    __name(this, "GnosisNeo4jBridge");
  }
  compiler;
  constructor() {
    this.compiler = new BettyCompiler();
  }
  /**
   * Parses GGL code and returns Cypher statements to represent it in Neo4j.
   */
  gglToCypher(ggl, options = {}) {
    const { ast, diagnostics } = this.compiler.parse(ggl);
    if (!ast) return "// No AST generated";
    const nodeLabel = options.nodeLabel || "GnosisNode";
    const idPrefix = options.idPrefix || "";
    const lines = ["// Gnosis GGL to Neo4j Export"];
    if (diagnostics.some((d) => d.severity === "error")) {
      lines.push(`// WARNING: Compilation had errors`);
    }
    for (const [id, node] of ast.nodes) {
      const fullId = `${idPrefix}${id}`;
      const labels = [nodeLabel, ...node.labels].join(":");
      const props = {
        id: fullId,
        originalId: id,
        ...node.properties
      };
      const propsStr = this.propsToCypher(props);
      lines.push(`MERGE (n:${labels} {id: '${fullId}'}) ON CREATE SET n = ${propsStr} ON MATCH SET n = ${propsStr};`);
    }
    ast.edges.forEach((edge, index) => {
      const edgeType = edge.type;
      const propsStr = this.propsToCypher({
        edgeIndex: index,
        ...edge.properties
      });
      edge.sourceIds.forEach((sourceId) => {
        const fullSourceId = `${idPrefix}${sourceId}`;
        edge.targetIds.forEach((targetId) => {
          const fullTargetId = `${idPrefix}${targetId}`;
          lines.push(`MATCH (s:${nodeLabel} {id: '${fullSourceId}'}), (t:${nodeLabel} {id: '${fullTargetId}'}) MERGE (s)-[r:${edgeType} ${propsStr}]->(t);`);
        });
      });
    });
    return lines.join("\n");
  }
  propsToCypher(obj) {
    const parts = Object.entries(obj).map(([k, v]) => {
      const val = typeof v === "string" ? `'${v.replace(/'/g, "\\'")}'` : v;
      return `${k}: ${val}`;
    });
    return `{ ${parts.join(", ")} }`;
  }
};

// ../../open-source/gnosis/src/runtime/engine.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/index.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/pipeline.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/fork.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/stream.ts
init_performance2();
var nextStreamId = 1;
var _batchTs = 0;
function beginBatch() {
  _batchTs = Date.now();
}
__name(beginBatch, "beginBatch");
function endBatch() {
  _batchTs = 0;
}
__name(endBatch, "endBatch");
function now() {
  return _batchTs || Date.now();
}
__name(now, "now");
function resetStreamIdCounter() {
  nextStreamId = 1;
}
__name(resetStreamIdCounter, "resetStreamIdCounter");
var STATE_ID = {
  pending: 0,
  superposed: 1,
  active: 2,
  completed: 3,
  vented: 4,
  tunneled: 5,
  entangled: 6
};
var TRANSITION_MASK = new Uint8Array([
  1 << 1 | 1 << 2 | 1 << 4,
  // 0: pending
  1 << 2 | 1 << 4 | 1 << 5 | 1 << 6,
  // 1: superposed
  1 << 3 | 1 << 4 | 1 << 5,
  // 2: active
  0,
  // 3: completed
  0,
  // 4: vented
  0,
  // 5: tunneled
  1 << 2 | 1 << 3 | 1 << 4 | 1 << 5
  // 6: entangled
]);
function createStream(work, parentId = null) {
  const id = nextStreamId++;
  return {
    id,
    parentId,
    childIds: [],
    state: "pending",
    work,
    controller: null,
    // Lazy — created when needed
    createdAt: now()
  };
}
__name(createStream, "createStream");
function ensureController(stream) {
  if (!stream.controller) {
    stream.controller = new AbortController();
  }
  return stream.controller;
}
__name(ensureController, "ensureController");
function transitionState(stream, to) {
  const toId = STATE_ID[to];
  if (!(TRANSITION_MASK[STATE_ID[stream.state]] & 1 << toId)) {
    throw new Error(
      `Invalid state transition: ${stream.state} \u2192 ${to} (stream ${stream.id})`
    );
  }
  stream.state = to;
  if (toId === 2) {
    stream.startedAt = now();
  } else if (toId >= 3 && toId <= 5) {
    stream.completedAt = now();
  }
}
__name(transitionState, "transitionState");
function executeStream(stream) {
  transitionState(stream, "active");
  const controller = ensureController(stream);
  return new Promise((resolve, reject) => {
    controller.signal.addEventListener("abort", () => {
      reject(new Error(`Stream ${stream.id} aborted`));
    });
    stream.work().then(
      (result) => {
        if (stream.state === "vented") {
          reject(new Error(`Stream ${stream.id} was vented`));
          return;
        }
        stream.result = result;
        transitionState(stream, "completed");
        resolve(result);
      },
      (error) => {
        if (stream.state !== "vented") {
          stream.error = error instanceof Error ? error : new Error(String(error));
          try {
            transitionState(stream, "vented");
          } catch {
          }
        }
        reject(error);
      }
    );
  });
}
__name(executeStream, "executeStream");

// ../../open-source/aeon-pipelines/src/fork.ts
function fork(workFns, parentId = null) {
  if (workFns.length === 0) {
    throw new Error("fork() requires at least one work function");
  }
  const len = workFns.length;
  const streams = new Array(len);
  beginBatch();
  for (let i = 0; i < len; i++) {
    const stream = createStream(workFns[i], parentId);
    transitionState(stream, "superposed");
    streams[i] = stream;
  }
  endBatch();
  return streams;
}
__name(fork, "fork");

// ../../open-source/aeon-pipelines/src/superposition.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/race.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/vent.ts
init_performance2();
function isTerminal(state) {
  const c = state.charCodeAt(0);
  return c === 118 || c === 99 || c === 116;
}
__name(isTerminal, "isTerminal");
function ventStream(stream, allStreams) {
  const ts = Date.now();
  const stack = [stream];
  while (stack.length > 0) {
    const current = stack.pop();
    if (isTerminal(current.state)) continue;
    current.state = "vented";
    current.completedAt = ts;
    if (current.controller) current.controller.abort();
    if (allStreams) {
      const children = current.childIds;
      for (let i = children.length - 1; i >= 0; i--) {
        const child = allStreams.get(children[i]);
        if (child) stack.push(child);
      }
    }
  }
}
__name(ventStream, "ventStream");
function shouldVent(result, stream, predicate) {
  return predicate(result, stream);
}
__name(shouldVent, "shouldVent");

// ../../open-source/aeon-pipelines/src/race.ts
async function race(streams, allStreams) {
  if (streams.length === 0) {
    throw new Error("race() requires at least one stream");
  }
  if (streams.length === 1) {
    const result = await executeStream(streams[0]);
    return { winner: streams[0].id, result };
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    let errorCount = 0;
    for (const stream of streams) {
      executeStream(stream).then(
        (result) => {
          if (settled) return;
          settled = true;
          for (const loser of streams) {
            if (loser.id !== stream.id && loser.state === "active") {
              ventStream(loser, allStreams);
            }
          }
          resolve({ winner: stream.id, result });
        },
        () => {
          errorCount++;
          if (errorCount === streams.length && !settled) {
            settled = true;
            reject(new Error("All streams in race failed"));
          }
        }
      );
    }
  });
}
__name(race, "race");

// ../../open-source/aeon-pipelines/src/fold.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/strategies/index.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/strategies/winner-take-all.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/strategies/quorum.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/strategies/merge-all.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/strategies/consensus.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/strategies/weighted.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/strategies/index.ts
function applyStrategy(results, vented, strategy) {
  switch (strategy.type) {
    case "winner-take-all": {
      if (strategy.selector) {
        return strategy.selector(results);
      }
      const first = results.values().next();
      if (first.done) throw new Error("No results for winner-take-all");
      return first.value;
    }
    case "quorum": {
      const values = Array.from(results.values());
      const len = values.length;
      const thresh = strategy.threshold;
      let bestValue = values[0];
      let bestCount = 0;
      for (let i = 0; i < len; i++) {
        let count = 0;
        for (let j = 0; j < len; j++) {
          if (strategy.agree(values[i], values[j])) count++;
        }
        if (count > bestCount) {
          bestCount = count;
          bestValue = values[i];
          if (bestCount === len) break;
        }
      }
      if (bestCount < thresh) {
        throw new Error(
          `Quorum not met: ${bestCount}/${thresh} agreements`
        );
      }
      return bestValue;
    }
    case "merge-all":
      return strategy.merge(results);
    case "consensus": {
      const values = Array.from(results.values());
      const len = values.length;
      const halfLen = len / 2;
      if (strategy.mode === "constructive") {
        for (let i = 0; i < len; i++) {
          let agreeCount = 0;
          for (let j = 0; j < len; j++) {
            if (strategy.compare(values[i], values[j])) agreeCount++;
          }
          if (agreeCount > halfLen) {
            return values[i];
          }
        }
        throw new Error("No constructive consensus reached");
      } else {
        for (let i = 0; i < len; i++) {
          let agreeCount = 0;
          for (let j = 0; j < len; j++) {
            if (strategy.compare(values[i], values[j])) agreeCount++;
          }
          if (agreeCount <= halfLen) {
            return values[i];
          }
        }
        throw new Error("No outliers found \u2014 destructive interference found full consensus");
      }
    }
    case "weighted": {
      const pairs = [];
      for (const [streamId, value] of results) {
        const weight = strategy.weights.get(streamId) ?? 1;
        pairs.push([value, weight]);
      }
      return strategy.merge(pairs);
    }
    case "custom":
      return strategy.fold(results, vented);
    default:
      throw new Error(`Unknown fold strategy: ${strategy.type}`);
  }
}
__name(applyStrategy, "applyStrategy");

// ../../open-source/aeon-pipelines/src/fold.ts
async function fold(streams, strategy) {
  if (streams.length === 0) {
    throw new Error("fold() requires at least one stream");
  }
  const len = streams.length;
  const promises = new Array(len);
  for (let i = 0; i < len; i++) {
    const s = streams[i];
    promises[i] = s.state === "completed" ? Promise.resolve(s.result) : s.state === "vented" ? Promise.reject(new Error(`Stream ${s.id} vented`)) : executeStream(s);
  }
  const settled = await Promise.allSettled(promises);
  const results = /* @__PURE__ */ new Map();
  const vented = /* @__PURE__ */ new Set();
  for (let i = 0; i < streams.length; i++) {
    const outcome = settled[i];
    if (outcome.status === "fulfilled") {
      results.set(streams[i].id, outcome.value);
    } else {
      vented.add(streams[i].id);
    }
  }
  if (results.size === 0) {
    throw new Error("All streams were vented \u2014 nothing to fold");
  }
  return applyStrategy(results, vented, strategy);
}
__name(fold, "fold");

// ../../open-source/aeon-pipelines/src/measurement.ts
init_performance2();
function measure(streams) {
  const snapshots = /* @__PURE__ */ new Map();
  for (const stream of streams) {
    snapshots.set(stream.id, {
      state: stream.state,
      result: stream.result,
      startedAt: stream.startedAt,
      completedAt: stream.completedAt,
      childCount: stream.childIds.length,
      entangledWith: stream.entangledWith ?? []
    });
  }
  return snapshots;
}
__name(measure, "measure");

// ../../open-source/aeon-pipelines/src/entanglement.ts
init_performance2();
function entangle(streams, sharedState) {
  const ids = streams.map((s) => s.id);
  for (const stream of streams) {
    if (stream.state === "pending") {
      stream.state = "superposed";
    }
    stream.entangledWith = ids.filter((id) => id !== stream.id);
  }
  return { streamIds: ids, sharedState };
}
__name(entangle, "entangle");

// ../../open-source/aeon-pipelines/src/search.ts
init_performance2();
async function search(initialCandidates, config) {
  const {
    width,
    oracle,
    mutate,
    convergenceThreshold = 1e-3,
    maxIterations = 100,
    strategy = "amplify-mutate"
  } = config;
  let candidates = initialCandidates.slice(0, width);
  let iterations = 0;
  let evaluations = 0;
  let bestCandidate = candidates[0];
  let bestScore = -Infinity;
  const scored = new Array(width);
  for (let i = 0; i < width; i++) scored[i] = { candidate: candidates[0], score: 0 };
  while (iterations < maxIterations) {
    const len = candidates.length;
    for (let i = 0; i < len; i++) {
      evaluations++;
      scored[i].candidate = candidates[i];
      scored[i].score = oracle(candidates[i]);
    }
    for (let i = 1; i < len; i++) {
      const key = scored[i];
      const keyScore = key.score;
      let j = i - 1;
      while (j >= 0 && scored[j].score < keyScore) {
        scored[j + 1] = scored[j];
        j--;
      }
      scored[j + 1] = key;
    }
    if (scored[0].score > bestScore) {
      bestScore = scored[0].score;
      bestCandidate = scored[0].candidate;
    }
    let minScore = scored[0].score;
    let maxScore = scored[0].score;
    for (let i = 1; i < len; i++) {
      const s = scored[i].score;
      if (s < minScore) minScore = s;
      if (s > maxScore) maxScore = s;
    }
    const spread = maxScore - minScore;
    if (spread <= convergenceThreshold) {
      break;
    }
    iterations++;
    if (strategy === "amplify-mutate") {
      const halfWidth = Math.ceil(width / 2);
      const next = [];
      for (let i = 0; i < halfWidth && next.length < width; i++) {
        next.push(scored[i].candidate);
        if (next.length < width) {
          next.push(mutate(scored[i].candidate, iterations));
        }
      }
      candidates = next.length > width ? next.slice(0, width) : next;
    } else if (strategy === "oracle-guided") {
      candidates = new Array(len);
      for (let i = 0; i < len; i++) {
        candidates[i] = mutate(scored[i].candidate, iterations);
      }
    } else {
      const median = scored[Math.floor(len / 2)].score;
      candidates = [];
      for (let i = 0; i < len && candidates.length < width; i++) {
        if (scored[i].score >= median) {
          candidates.push(mutate(scored[i].candidate, iterations));
        }
      }
      while (candidates.length < width) {
        candidates.push(mutate(bestCandidate, iterations));
      }
    }
  }
  return { best: bestCandidate, iterations, evaluations };
}
__name(search, "search");

// ../../open-source/aeon-pipelines/src/superposition.ts
var Superposition = class _Superposition {
  static {
    __name(this, "Superposition");
  }
  streams;
  allStreams;
  ventPredicates = [];
  tunnelPredicates = [];
  interferenceConfig;
  entangledState;
  reynolds;
  constructor(streams, allStreams, reynolds) {
    this.streams = streams;
    this.allStreams = allStreams;
    this.reynolds = reynolds;
    for (const s of streams) {
      this.allStreams.set(s.id, s);
      this.reynolds?.updateStream(s.id, s.state);
    }
  }
  // ─── Core 4 ─────────────────────────────────────────────────────────────
  /**
   * Race: first to complete wins, losers vented.
   */
  async race() {
    const streams = this.prepareStreams();
    const result = await race(streams, this.allStreams);
    this.updateMetrics();
    return result;
  }
  /**
   * Fold: wait for all, merge via strategy.
   */
  async fold(strategy) {
    const streams = this.prepareStreams();
    const result = await fold(streams, strategy);
    this.updateMetrics();
    return result;
  }
  /**
   * Vent: register a predicate that auto-vents streams on result.
   * Chainable — predicates accumulate.
   */
  vent(predicate) {
    this.ventPredicates.push(predicate);
    return this;
  }
  // ─── Quantum modalities ─────────────────────────────────────────────────
  /**
   * Tunnel: early exit when confidence threshold met.
   */
  tunnel(predicate) {
    this.tunnelPredicates.push(predicate);
    return this;
  }
  /**
   * Interfere: constructive (consensus) or destructive (conflict detection).
   */
  interfere(mode, compare) {
    this.interferenceConfig = { mode, compare };
    return this;
  }
  /**
   * Measure: observe state without folding.
   */
  async measure() {
    return measure(this.streams);
  }
  /**
   * Entangle: shared state across parallel streams.
   */
  entangle(sharedState) {
    this.entangledState = sharedState;
    entangle(this.streams, sharedState);
    return this;
  }
  /**
   * Search: Grover-style amplification loop.
   */
  async search(config) {
    const streams = this.prepareStreams();
    const settled = await Promise.allSettled(
      streams.map(
        (s) => s.state === "completed" ? Promise.resolve(s.result) : executeStream(s)
      )
    );
    const candidates = [];
    for (const s of settled) {
      if (s.status === "fulfilled") {
        candidates.push(s.value);
      }
    }
    if (candidates.length === 0) {
      throw new Error("No candidates for search \u2014 all streams failed");
    }
    return search(candidates, config);
  }
  // ─── Composition ────────────────────────────────────────────────────────
  /**
   * Chain: map results into new fork.
   */
  then(fn) {
    const deferredStreams = [];
    const allStreams = this.allStreams;
    const reynolds = this.reynolds;
    const parentStreams = this.streams;
    const placeholder = fork(
      [() => Promise.resolve(void 0)],
      null
    );
    const chained = new _Superposition(placeholder, allStreams, reynolds);
    const originalRace = chained.race.bind(chained);
    const originalFold = chained.fold.bind(chained);
    chained.race = async () => {
      const { result } = await this.race();
      const newWorkFns = fn(result);
      const newStreams = fork(newWorkFns);
      chained.streams = newStreams;
      for (const s of newStreams) allStreams.set(s.id, s);
      return race(newStreams, allStreams);
    };
    chained.fold = async (strategy) => {
      const { result } = await this.race();
      const newWorkFns = fn(result);
      const newStreams = fork(newWorkFns);
      chained.streams = newStreams;
      for (const s of newStreams) allStreams.set(s.id, s);
      return fold(newStreams, strategy);
    };
    return chained;
  }
  // ─── Internal ───────────────────────────────────────────────────────────
  /**
   * Prepare streams by wrapping work functions with vent/tunnel predicates.
   */
  prepareStreams() {
    for (const stream of this.streams) {
      if (this.ventPredicates.length > 0 || this.tunnelPredicates.length > 0) {
        const originalWork = stream.work;
        const ventPreds = this.ventPredicates;
        const tunnelPreds = this.tunnelPredicates;
        const allStreams = this.allStreams;
        stream.work = async () => {
          const result = await originalWork();
          for (const pred of ventPreds) {
            if (shouldVent(result, stream, pred)) {
              ventStream(stream, allStreams);
              throw new Error(`Stream ${stream.id} vented by predicate`);
            }
          }
          return result;
        };
      }
    }
    return this.streams;
  }
  updateMetrics() {
    if (!this.reynolds) return;
    for (const stream of this.streams) {
      this.reynolds.updateStream(stream.id, stream.state);
    }
  }
};

// ../../open-source/aeon-pipelines/src/reynolds.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/topology-metrics.ts
init_performance2();
function pluralizeBule(count) {
  return `${count} Bule${count === 1 ? "" : "s"}`;
}
__name(pluralizeBule, "pluralizeBule");
function computeBuleMeasure(actualBeta1, intrinsicBeta1) {
  const normalizedActual = Math.max(0, Math.floor(actualBeta1));
  const normalizedIntrinsic = Math.max(0, Math.floor(intrinsicBeta1));
  const deficit = normalizedIntrinsic - normalizedActual;
  const waste = Math.max(0, deficit);
  const opportunity = waste;
  const overforked = Math.max(0, -deficit);
  const utilization = normalizedIntrinsic === 0 ? 1 : Math.min(1, normalizedActual / normalizedIntrinsic);
  let assessment;
  if (deficit === 0) {
    assessment = "Optimal topology: 0 Bules of waste or opportunity";
  } else if (deficit < 0) {
    assessment = `Over-forked by ${pluralizeBule(overforked)} beyond intrinsic beta1=${normalizedIntrinsic}`;
  } else if (normalizedActual === 0) {
    assessment = `Sequential bottleneck: ${pluralizeBule(waste)} of waste/opportunity`;
  } else if (utilization >= 0.8) {
    assessment = `Near-optimal: ${pluralizeBule(waste)} of waste/opportunity`;
  } else if (utilization >= 0.5) {
    assessment = `Underutilized: ${pluralizeBule(waste)} of waste/opportunity`;
  } else {
    assessment = `Severely underutilized: ${pluralizeBule(waste)} of waste/opportunity`;
  }
  return {
    intrinsicBeta1: normalizedIntrinsic,
    actualBeta1: normalizedActual,
    deficit,
    waste,
    opportunity,
    overforked,
    utilization,
    assessment
  };
}
__name(computeBuleMeasure, "computeBuleMeasure");

// ../../open-source/aeon-pipelines/src/reynolds.ts
var STATE_COUNTER = {
  active: 0,
  superposed: 0,
  completed: 1,
  vented: 2,
  tunneled: 3,
  entangled: 4,
  pending: -1
};
var ReynoldsTracker = class {
  static {
    __name(this, "ReynoldsTracker");
  }
  capacity;
  intrinsicBeta1;
  // Array-based storage: index = StreamId, value = counter index (or -2 for not tracked)
  // This is faster than Map for sequential integer keys
  states;
  _size = 0;
  // Incremental counters — updated on every state change
  _active = 0;
  _completed = 0;
  _vented = 0;
  _tunneled = 0;
  _entangled = 0;
  // Counter array for branchless adjustment — index by counter ID
  _counters = new Int32Array(5);
  // [active, completed, vented, tunneled, entangled]
  constructor(capacity, intrinsicBeta1) {
    this.capacity = Math.max(1, capacity);
    this.intrinsicBeta1 = intrinsicBeta1 === void 0 ? void 0 : Math.max(0, Math.floor(intrinsicBeta1));
    this.states = new Int8Array(capacity + 16).fill(-2);
  }
  updateStream(id, state) {
    if (id >= this.states.length) {
      const newStates = new Int8Array(id * 2 + 16).fill(-2);
      newStates.set(this.states);
      this.states = newStates;
    }
    const counterIdx = STATE_COUNTER[state];
    const prev = this.states[id];
    if (prev >= 0) {
      this._counters[prev]--;
    } else if (prev === -2) {
      this._size++;
    }
    this.states[id] = counterIdx >= 0 ? counterIdx : -1;
    if (counterIdx >= 0) {
      this._counters[counterIdx]++;
    }
    this._active = this._counters[0];
    this._completed = this._counters[1];
    this._vented = this._counters[2];
    this._tunneled = this._counters[3];
    this._entangled = this._counters[4];
  }
  removeStream(id) {
    if (id >= this.states.length) return;
    const prev = this.states[id];
    if (prev >= 0) {
      this._counters[prev]--;
      this._active = this._counters[0];
      this._completed = this._counters[1];
      this._vented = this._counters[2];
      this._tunneled = this._counters[3];
      this._entangled = this._counters[4];
    }
    if (prev !== -2) this._size--;
    this.states[id] = -2;
  }
  get reynoldsNumber() {
    return this._active / this.capacity;
  }
  get regime() {
    const re = this._active / this.capacity;
    if (re < 0.3) return "laminar";
    if (re > 0.7) return "turbulent";
    return "transitional";
  }
  get activeCount() {
    return this._active;
  }
  get idleSlots() {
    return Math.max(0, this.capacity - this._active);
  }
  get bettiNumber() {
    return Math.max(0, this._active - 1);
  }
  get buleMeasure() {
    if (this.intrinsicBeta1 === void 0) return void 0;
    return computeBuleMeasure(this.bettiNumber, this.intrinsicBeta1);
  }
  get laminarFraction() {
    if (this._size === 0) return 1;
    return this._completed / this._size;
  }
  metrics() {
    const metrics = {
      reynoldsNumber: this._active / this.capacity,
      bettiNumber: Math.max(0, this._active - 1),
      laminarFraction: this._size === 0 ? 1 : this._completed / this._size,
      activeStreams: this._active,
      capacity: this.capacity,
      completed: this._completed,
      vented: this._vented,
      tunneled: this._tunneled,
      entangled: this._entangled
    };
    const bule = this.buleMeasure;
    if (bule) {
      metrics.intrinsicBeta1 = bule.intrinsicBeta1;
      metrics.topologicalDeficit = bule.deficit;
      metrics.wasteBules = bule.waste;
      metrics.opportunityBules = bule.opportunity;
      metrics.overforkedBules = bule.overforked;
      metrics.topologyUtilization = bule.utilization;
      metrics.topologyAssessment = bule.assessment;
    }
    return metrics;
  }
};

// ../../open-source/aeon-pipelines/src/backpressure.ts
init_performance2();
var BackpressureController = class {
  static {
    __name(this, "BackpressureController");
  }
  highWaterMark;
  levels = /* @__PURE__ */ new Map();
  pausedCallbacks = /* @__PURE__ */ new Map();
  constructor(highWaterMark = 64) {
    this.highWaterMark = highWaterMark;
  }
  /**
   * Increment the buffer level for a stream.
   * Returns true if the stream is now at or above the high-water mark.
   */
  increment(streamId) {
    const current = (this.levels.get(streamId) ?? 0) + 1;
    this.levels.set(streamId, current);
    return current >= this.highWaterMark;
  }
  /**
   * Decrement the buffer level (item consumed).
   * Resumes paused producers if level drops below high-water mark.
   */
  decrement(streamId) {
    const current = Math.max(0, (this.levels.get(streamId) ?? 0) - 1);
    this.levels.set(streamId, current);
    if (current < this.highWaterMark) {
      const callbacks = this.pausedCallbacks.get(streamId) ?? [];
      for (const cb of callbacks) cb();
      this.pausedCallbacks.delete(streamId);
    }
  }
  /**
   * Register a callback to be invoked when the stream resumes.
   */
  onResume(streamId, callback) {
    const existing = this.pausedCallbacks.get(streamId) ?? [];
    existing.push(callback);
    this.pausedCallbacks.set(streamId, existing);
  }
  /**
   * Check if a stream is at or above the high-water mark.
   */
  isPaused(streamId) {
    return (this.levels.get(streamId) ?? 0) >= this.highWaterMark;
  }
  level(streamId) {
    return this.levels.get(streamId) ?? 0;
  }
  clear(streamId) {
    this.levels.delete(streamId);
    this.pausedCallbacks.delete(streamId);
  }
};

// ../../open-source/aeon-pipelines/src/multiplexer.ts
init_performance2();
var TurbulentMultiplexer = class {
  static {
    __name(this, "TurbulentMultiplexer");
  }
  reynolds;
  onIdleSlot;
  backgroundStreams = /* @__PURE__ */ new Set();
  checkInterval = null;
  constructor(reynolds, onIdleSlot) {
    this.reynolds = reynolds;
    this.onIdleSlot = onIdleSlot;
  }
  /**
   * Start monitoring for idle slots.
   */
  start(intervalMs = 100) {
    if (!this.onIdleSlot || this.checkInterval) return;
    this.checkInterval = setInterval(() => {
      this.fillIdleSlots();
    }, intervalMs);
  }
  /**
   * Stop monitoring.
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
  /**
   * Check for idle slots and fill them with background work.
   */
  fillIdleSlots() {
    if (!this.onIdleSlot) return [];
    const idle = this.reynolds.idleSlots;
    if (idle <= 0) return [];
    const newStreams = this.onIdleSlot(idle);
    if (!newStreams || newStreams.length === 0) return [];
    for (const stream of newStreams) {
      this.backgroundStreams.add(stream.id);
      this.reynolds.updateStream(stream.id, "active");
    }
    return newStreams;
  }
  /**
   * Preempt background streams to make room for primary work.
   * Returns the number of slots freed.
   */
  preempt(count) {
    let freed = 0;
    for (const id of this.backgroundStreams) {
      if (freed >= count) break;
      this.backgroundStreams.delete(id);
      this.reynolds.removeStream(id);
      freed++;
    }
    return freed;
  }
  get backgroundCount() {
    return this.backgroundStreams.size;
  }
  isBackground(streamId) {
    return this.backgroundStreams.has(streamId);
  }
};

// ../../open-source/aeon-pipelines/src/pipeline.ts
var Pipeline = class _Pipeline {
  static {
    __name(this, "Pipeline");
  }
  config;
  allStreams = /* @__PURE__ */ new Map();
  reynolds;
  backpressure;
  multiplexer;
  constructor(config) {
    this.config = {
      capacity: config?.capacity ?? 256,
      highWaterMark: config?.highWaterMark ?? 64,
      turbulentMultiplexing: config?.turbulentMultiplexing ?? false,
      onIdleSlot: config?.onIdleSlot ?? (() => void 0),
      intrinsicBeta1: config?.intrinsicBeta1
    };
    this.reynolds = new ReynoldsTracker(
      this.config.capacity,
      this.config.intrinsicBeta1
    );
    this.backpressure = new BackpressureController(this.config.highWaterMark);
    this.multiplexer = new TurbulentMultiplexer(
      this.reynolds,
      this.config.turbulentMultiplexing ? this.config.onIdleSlot : void 0
    );
    resetStreamIdCounter();
  }
  /**
   * Static factory: create a Superposition from work functions.
   * This is the primary entry point for the fluent API.
   *
   * Usage:
   *   Pipeline.from([
   *     () => fetchFromVenueA(order),
   *     () => fetchFromVenueB(order),
   *     () => fetchFromVenueC(order),
   *   ]).race()
   */
  static from(workFns) {
    const pipeline = new _Pipeline();
    return pipeline.fork(workFns);
  }
  /**
   * Fork: create N parallel streams from work functions.
   * β₁ increases by (N - 1).
   */
  fork(workFns) {
    const streams = fork(workFns);
    for (const stream of streams) {
      this.allStreams.set(stream.id, stream);
      this.reynolds.updateStream(stream.id, stream.state);
    }
    return new Superposition(streams, this.allStreams, this.reynolds);
  }
  /**
   * Get current pipeline metrics — fluidic state snapshot.
   */
  metrics() {
    return this.reynolds.metrics();
  }
  /**
   * Signed Bule waste/opportunity measure for current runtime topology.
   * Available when intrinsicBeta1 is configured.
   */
  bule() {
    return this.reynolds.buleMeasure;
  }
  /**
   * Measure: observe all stream states without folding.
   */
  measure() {
    const result = /* @__PURE__ */ new Map();
    for (const [id, stream] of this.allStreams) {
      result.set(id, stream.state);
    }
    return result;
  }
  /**
   * Get the backpressure controller for advanced usage.
   */
  getBackpressure() {
    return this.backpressure;
  }
  /**
   * Get the multiplexer for turbulent flow management.
   */
  getMultiplexer() {
    return this.multiplexer;
  }
};

// ../../open-source/aeon-pipelines/src/tunneling.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/interference.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/formal-claims.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/topology-analyzer.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/topology-sampler.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/cypher-exporter.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/frame.ts
init_performance2();
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var EMPTY_BYTES = new Uint8Array(0);

// ../../open-source/aeon-pipelines/src/reassembler.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/wasm-frame-assembly.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/flow-bridge.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/types.ts
init_performance2();

// ../../open-source/aeon-pipelines/src/flow-bridge.ts
var encoder2 = new TextEncoder();
var decoder2 = new TextDecoder();

// ../../open-source/aeon-pipelines/src/wasm-frame-assembly.ts
var EMPTY_BYTES2 = new Uint8Array(0);
var DEFAULT_MAX_CARRYOVER_BYTES = 4 * 1024 * 1024;

// ../../open-source/gnosis/src/runtime/registry.ts
init_performance2();
var GnosisRegistry = class {
  static {
    __name(this, "GnosisRegistry");
  }
  handlers = /* @__PURE__ */ new Map();
  register(label, handler, options = {}) {
    if (!options.override && this.handlers.has(label)) {
      return;
    }
    this.handlers.set(label, handler);
  }
  hasHandler(label) {
    return this.handlers.has(label);
  }
  getHandler(label) {
    return this.handlers.get(label);
  }
};

// ../../open-source/gnosis/src/auth/core.ts
init_performance2();
var CUSTODIAL_SIGNER_ACTIONS = [
  "halos.recordExhaust",
  "halos.signDisclosure",
  "halos.consent.agree",
  "halos.consent.ack",
  "halos.consent.snooze",
  "edgework.relayer.registerGatewayViaSignature",
  "edgework.oracle.updateProviderCosts",
  "edgework.oracle.setProviderWeights",
  "edgework.oracle.batchUpdateModelCosts",
  "mcp.memento.publishMemento",
  "mcp.memento.eraseMemento",
  "mcp.memento.createMemento",
  "mcp.memento.batchCreateMementos",
  "mcp.memento.tombstoneMemento",
  "mcp.badge.mintBadgeBatch",
  "mcp.badge.burnBadge"
];
var CUSTODIAL_ACTIONS = new Set(CUSTODIAL_SIGNER_ACTIONS);
var authRuntimePromise = null;
async function loadAuthRuntime() {
  if (!authRuntimePromise) {
    const moduleSpecifier = "@affectively/auth";
    const dynamicImport = new Function(
      "moduleSpecifier",
      "return import(moduleSpecifier);"
    );
    authRuntimePromise = dynamicImport(moduleSpecifier).then(
      (module) => module
    );
  }
  return authRuntimePromise;
}
__name(loadAuthRuntime, "loadAuthRuntime");
async function requireAuthFunction(name) {
  const runtime = await loadAuthRuntime();
  const candidate = runtime[name];
  if (typeof candidate !== "function") {
    throw new Error(
      `@affectively/auth missing required export "${String(name)}".`
    );
  }
  return candidate;
}
__name(requireAuthFunction, "requireAuthFunction");
function normalizeEdgeType(edgeType) {
  return edgeType.trim().toUpperCase();
}
__name(normalizeEdgeType, "normalizeEdgeType");
function capabilityActionMatches(granted, required) {
  if (granted === "*" || granted === required) {
    return true;
  }
  if (granted.endsWith("/*")) {
    const prefix = granted.slice(0, -1);
    return required.startsWith(prefix);
  }
  return false;
}
__name(capabilityActionMatches, "capabilityActionMatches");
function capabilityResourceMatches(granted, required) {
  if (granted === "*" || granted === required) {
    return true;
  }
  if (granted.endsWith("*")) {
    const prefix = granted.slice(0, -1);
    return required.startsWith(prefix);
  }
  return false;
}
__name(capabilityResourceMatches, "capabilityResourceMatches");
function checkGrantedCapability(granted, required) {
  for (const candidate of granted) {
    if (capabilityActionMatches(candidate.can, required.can) && capabilityResourceMatches(candidate.with, required.with)) {
      return true;
    }
  }
  return false;
}
__name(checkGrantedCapability, "checkGrantedCapability");
function topologyActionForEdge(edgeType) {
  const normalized = normalizeEdgeType(edgeType);
  if (normalized === "FORK") return "fork";
  if (normalized === "RACE") return "race";
  if (normalized === "FOLD" || normalized === "COLLAPSE") return "fold";
  if (normalized === "VENT" || normalized === "TUNNEL") return "vent";
  if (normalized === "OBSERVE") return "observe";
  if (normalized === "INTERFERE") return "interfere";
  if (normalized === "ENTANGLE") return "entangle";
  if (normalized === "SUPERPOSE") return "superpose";
  if (normalized === "EVOLVE") return "evolve";
  return "process";
}
__name(topologyActionForEdge, "topologyActionForEdge");
function buildEdgeResource(edgeType, sourceId, targetId) {
  const action = topologyActionForEdge(edgeType);
  return `aeon://edge/${action}/${sourceId}->${targetId}`;
}
__name(buildEdgeResource, "buildEdgeResource");
function authorizeTopologyEdge(input) {
  const shouldEnforce = input.auth.enforce === true;
  if (!shouldEnforce) {
    return { allowed: true };
  }
  if (input.auth.capabilities.length === 0) {
    return {
      allowed: false,
      reason: "No UCAN capabilities available for enforced topology authorization."
    };
  }
  const action = topologyActionForEdge(input.edgeType);
  for (const rawTargetId of input.targetIds) {
    const targetId = rawTargetId.trim();
    const required = {
      can: `aeon/${action}`,
      with: buildEdgeResource(input.edgeType, input.sourceId, targetId)
    };
    if (!checkGrantedCapability(input.auth.capabilities, required)) {
      return {
        allowed: false,
        reason: `Missing capability aeon/${action} on ${required.with}`,
        required
      };
    }
  }
  return { allowed: true };
}
__name(authorizeTopologyEdge, "authorizeTopologyEdge");
async function generateUcanIdentity(options = {}) {
  const generateIdentity = await requireAuthFunction("generateIdentity");
  return generateIdentity(options);
}
__name(generateUcanIdentity, "generateUcanIdentity");
async function issueGranularUcan(options) {
  const createUCAN = await requireAuthFunction("createUCAN");
  return createUCAN(
    options.issuer,
    options.audience,
    options.capabilities,
    options.createOptions
  );
}
__name(issueGranularUcan, "issueGranularUcan");
async function verifyGranularUcan(options) {
  const verifyUCAN = await requireAuthFunction("verifyUCAN");
  return verifyUCAN(options.token, options.issuerPublicKey, options.verifyOptions);
}
__name(verifyGranularUcan, "verifyGranularUcan");
async function delegateGranularUcan(options) {
  const delegateCapabilities = await requireAuthFunction("delegateCapabilities");
  return delegateCapabilities(
    options.parentToken,
    options.issuer,
    options.audience,
    options.capabilities,
    options.delegationOptions
  );
}
__name(delegateGranularUcan, "delegateGranularUcan");
async function zkEncryptUtf8(options) {
  const eciesEncryptString = await requireAuthFunction("eciesEncryptString");
  return eciesEncryptString(
    options.plaintext,
    options.recipientPublicKey,
    options.encryptionOptions
  );
}
__name(zkEncryptUtf8, "zkEncryptUtf8");
async function zkDecryptUtf8(options) {
  const eciesDecryptString = await requireAuthFunction("eciesDecryptString");
  return eciesDecryptString(options.encrypted, options.recipientPrivateKey);
}
__name(zkDecryptUtf8, "zkDecryptUtf8");
function isAllowedCustodialAction(action) {
  return CUSTODIAL_ACTIONS.has(action);
}
__name(isAllowedCustodialAction, "isAllowedCustodialAction");

// ../../open-source/gnosis/src/auth/handlers.ts
init_performance2();

// ../../open-source/gnosis/src/auth/tee-attestation.ts
init_performance2();
import { Buffer as Buffer2 } from "node:buffer";
var HALT_ATTESTATION_ALGORITHM = "ES256";
var ECDSA_SIGNING_ALGORITHM = {
  name: "ECDSA",
  namedCurve: "P-256"
};
var ECDSA_SIGNATURE_ALGORITHM = {
  name: "ECDSA",
  hash: "SHA-256"
};
var InMemoryNonceReplayStore = class {
  static {
    __name(this, "InMemoryNonceReplayStore");
  }
  expirations = /* @__PURE__ */ new Map();
  has(nonce, nowMs) {
    this.prune(nowMs);
    const expiration = this.expirations.get(nonce);
    return typeof expiration === "number" && expiration > nowMs;
  }
  mark(nonce, expiresAt) {
    this.expirations.set(nonce, expiresAt);
  }
  prune(nowMs) {
    for (const [nonce, expiration] of this.expirations.entries()) {
      if (expiration <= nowMs) {
        this.expirations.delete(nonce);
      }
    }
  }
};
function isObjectRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
__name(isObjectRecord, "isObjectRecord");
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
__name(isNonEmptyString, "isNonEmptyString");
function normalizeList(values) {
  if (!values || values.length === 0) {
    return /* @__PURE__ */ new Set();
  }
  const normalized = values.map((value) => value.trim()).filter((value) => value.length > 0);
  return new Set(normalized);
}
__name(normalizeList, "normalizeList");
function normalizeVersion(version) {
  return version.split(".").map((piece) => {
    const parsed = Number.parseInt(piece, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }).slice(0, 4);
}
__name(normalizeVersion, "normalizeVersion");
function compareVersion(left, right) {
  const leftParts = normalizeVersion(left);
  const rightParts = normalizeVersion(right);
  const maxLength = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;
    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }
  return 0;
}
__name(compareVersion, "compareVersion");
function stableStringify(value) {
  if (value === null) {
    return "null";
  }
  if (value === void 0) {
    return "null";
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "bigint") {
    return JSON.stringify(value.toString(10));
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value;
    const entries = Object.entries(record).filter(([, entryValue]) => {
      const entryType = typeof entryValue;
      return entryType !== "undefined" && entryType !== "function" && entryType !== "symbol";
    }).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
    return `{${entries.map(
      ([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`
    ).join(",")}}`;
  }
  return "null";
}
__name(stableStringify, "stableStringify");
function fromBase64Url(value) {
  return new Uint8Array(Buffer2.from(value, "base64url"));
}
__name(fromBase64Url, "fromBase64Url");
function toArrayBuffer(bytes) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  );
}
__name(toArrayBuffer, "toArrayBuffer");
async function sha256Hex(input) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0")
  ).join("");
}
__name(sha256Hex, "sha256Hex");
function coerceClaims(value) {
  const record = isObjectRecord(value) ? value : null;
  if (!record) {
    return null;
  }
  const measurement = record.measurement;
  const programHash = record.programHash;
  const vkHash = record.vkHash;
  const publicSignalsHash = record.publicSignalsHash;
  const nonce = record.nonce;
  const issuedAt = record.issuedAt;
  const expiresAt = record.expiresAt;
  const tcbVersion = record.tcbVersion;
  if (!isNonEmptyString(measurement) || !isNonEmptyString(programHash) || !isNonEmptyString(vkHash) || !isNonEmptyString(publicSignalsHash) || !isNonEmptyString(nonce) || typeof issuedAt !== "number" || !Number.isFinite(issuedAt) || typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) {
    return null;
  }
  if (typeof tcbVersion !== "undefined" && !isNonEmptyString(tcbVersion)) {
    return null;
  }
  return {
    measurement: measurement.trim(),
    programHash: programHash.trim(),
    vkHash: vkHash.trim(),
    publicSignalsHash: publicSignalsHash.trim(),
    nonce: nonce.trim(),
    issuedAt,
    expiresAt,
    tcbVersion: isNonEmptyString(tcbVersion) ? tcbVersion.trim() : void 0
  };
}
__name(coerceClaims, "coerceClaims");
function signaturePayload(claims) {
  const serialized = stableStringify(claims);
  return new TextEncoder().encode(serialized);
}
__name(signaturePayload, "signaturePayload");
async function importPublicKey(key) {
  return crypto.subtle.importKey(
    "jwk",
    key,
    ECDSA_SIGNING_ALGORITHM,
    false,
    ["verify"]
  );
}
__name(importPublicKey, "importPublicKey");
function resolveTrustedPublicKeys(attestation, options) {
  const resolved = [];
  if (attestation.keyId && options.trustedKeyById) {
    const key = options.trustedKeyById[attestation.keyId];
    if (key) {
      resolved.push(key);
    }
  }
  if (options.trustedPublicKeys && options.trustedPublicKeys.length > 0) {
    resolved.push(...options.trustedPublicKeys);
  }
  if (options.allowInlinePublicKey === true && attestation.publicKey) {
    resolved.push(attestation.publicKey);
  }
  const deduped = /* @__PURE__ */ new Map();
  for (const key of resolved) {
    deduped.set(stableStringify(key), key);
  }
  return Array.from(deduped.values());
}
__name(resolveTrustedPublicKeys, "resolveTrustedPublicKeys");
async function verifyAttestationSignature(attestation, candidateKeys) {
  if (candidateKeys.length === 0) {
    return false;
  }
  const signature = fromBase64Url(attestation.signature);
  const payload = toArrayBuffer(signaturePayload(attestation.claims));
  const signatureBytes = toArrayBuffer(signature);
  for (const candidateKey of candidateKeys) {
    try {
      const key = await importPublicKey(candidateKey);
      const verified = await crypto.subtle.verify(
        ECDSA_SIGNATURE_ALGORITHM,
        key,
        signatureBytes,
        payload
      );
      if (verified) {
        return true;
      }
    } catch {
    }
  }
  return false;
}
__name(verifyAttestationSignature, "verifyAttestationSignature");
function checkExpectedValue(actual, expected, label) {
  if (!expected) {
    return null;
  }
  if (actual !== expected) {
    return {
      valid: false,
      reason: `${label} mismatch in attestation claims.`
    };
  }
  return null;
}
__name(checkExpectedValue, "checkExpectedValue");
async function hashPublicSignals(publicSignals) {
  return sha256Hex(stableStringify(publicSignals));
}
__name(hashPublicSignals, "hashPublicSignals");
function asHaltAttestationEnvelope(value) {
  const record = isObjectRecord(value) ? value : null;
  if (!record) {
    return null;
  }
  const algorithm = record.algorithm;
  const signature = record.signature;
  const keyId = record.keyId;
  const publicKey = record.publicKey;
  const claims = coerceClaims(record.claims);
  if (algorithm !== HALT_ATTESTATION_ALGORITHM) {
    return null;
  }
  if (!isNonEmptyString(signature) || !claims) {
    return null;
  }
  if (typeof keyId !== "undefined" && !isNonEmptyString(keyId)) {
    return null;
  }
  if (typeof publicKey !== "undefined" && !isObjectRecord(publicKey)) {
    return null;
  }
  return {
    algorithm: HALT_ATTESTATION_ALGORITHM,
    signature,
    claims,
    keyId: isNonEmptyString(keyId) ? keyId : void 0,
    publicKey: isObjectRecord(publicKey) ? publicKey : void 0
  };
}
__name(asHaltAttestationEnvelope, "asHaltAttestationEnvelope");
function asHaltExecutionEnvelope(value) {
  const record = isObjectRecord(value) ? value : null;
  if (!record) {
    return null;
  }
  const proof = record.proof;
  const publicSignalsHash = record.publicSignalsHash;
  const programHash = record.programHash;
  const vkHash = record.vkHash;
  const nonce = record.nonce;
  const expiresAt = record.expiresAt;
  const attestation = asHaltAttestationEnvelope(record.attestation);
  if (!isNonEmptyString(proof) || !isNonEmptyString(publicSignalsHash) || !isNonEmptyString(programHash) || !isNonEmptyString(vkHash) || !isNonEmptyString(nonce) || typeof expiresAt !== "number" || !Number.isFinite(expiresAt) || !attestation) {
    return null;
  }
  return {
    proof,
    publicSignals: record.publicSignals,
    publicSignalsHash,
    programHash,
    vkHash,
    nonce,
    expiresAt,
    attestation
  };
}
__name(asHaltExecutionEnvelope, "asHaltExecutionEnvelope");
async function verifyHaltAttestation(attestation, options = {}) {
  const nowMs = options.nowMs ?? Date.now();
  const trustedMeasurements = normalizeList(options.trustedMeasurements);
  const trustedProgramHashes = normalizeList(options.trustedProgramHashes);
  const trustedVkHashes = normalizeList(options.trustedVkHashes);
  const claims = coerceClaims(attestation.claims);
  if (!claims) {
    return { valid: false, reason: "Invalid attestation claims payload." };
  }
  if (claims.expiresAt <= claims.issuedAt) {
    return { valid: false, reason: "Attestation has invalid issuedAt/expiresAt bounds." };
  }
  if (claims.expiresAt <= nowMs) {
    return { valid: false, reason: "Attestation is expired." };
  }
  if (claims.issuedAt > nowMs) {
    return { valid: false, reason: "Attestation issuedAt is in the future." };
  }
  if (typeof options.maxAttestationAgeMs === "number" && Number.isFinite(options.maxAttestationAgeMs) && nowMs - claims.issuedAt > options.maxAttestationAgeMs) {
    return {
      valid: false,
      reason: "Attestation age exceeds maxAttestationAgeMs policy."
    };
  }
  const expectedProgramMismatch = checkExpectedValue(
    claims.programHash,
    options.expectedProgramHash,
    "programHash"
  );
  if (expectedProgramMismatch) {
    return expectedProgramMismatch;
  }
  const expectedVkMismatch = checkExpectedValue(
    claims.vkHash,
    options.expectedVkHash,
    "vkHash"
  );
  if (expectedVkMismatch) {
    return expectedVkMismatch;
  }
  const expectedSignalsMismatch = checkExpectedValue(
    claims.publicSignalsHash,
    options.expectedPublicSignalsHash,
    "publicSignalsHash"
  );
  if (expectedSignalsMismatch) {
    return expectedSignalsMismatch;
  }
  const expectedNonceMismatch = checkExpectedValue(
    claims.nonce,
    options.expectedNonce,
    "nonce"
  );
  if (expectedNonceMismatch) {
    return expectedNonceMismatch;
  }
  if (typeof options.expectedExpiresAt === "number" && Number.isFinite(options.expectedExpiresAt) && claims.expiresAt !== options.expectedExpiresAt) {
    return {
      valid: false,
      reason: "expiresAt mismatch in attestation claims."
    };
  }
  if (trustedMeasurements.size > 0 && !trustedMeasurements.has(claims.measurement)) {
    return {
      valid: false,
      reason: `Measurement ${claims.measurement} is not allowlisted.`
    };
  }
  if (trustedProgramHashes.size > 0 && !trustedProgramHashes.has(claims.programHash)) {
    return {
      valid: false,
      reason: "Program hash is not allowlisted."
    };
  }
  if (trustedVkHashes.size > 0 && !trustedVkHashes.has(claims.vkHash)) {
    return {
      valid: false,
      reason: "Verifier key hash is not allowlisted."
    };
  }
  if (options.minTcbVersion) {
    if (!claims.tcbVersion) {
      return {
        valid: false,
        reason: "Attestation missing tcbVersion required by policy."
      };
    }
    if (compareVersion(claims.tcbVersion, options.minTcbVersion) < 0) {
      return {
        valid: false,
        reason: `Attestation tcbVersion ${claims.tcbVersion} below required ${options.minTcbVersion}.`
      };
    }
  }
  if (options.nonceStore) {
    if (options.nonceStore.has(claims.nonce, nowMs)) {
      return {
        valid: false,
        reason: "Nonce replay detected for attestation envelope."
      };
    }
  }
  const trustedPublicKeys = resolveTrustedPublicKeys(attestation, options);
  if (trustedPublicKeys.length === 0) {
    return {
      valid: false,
      reason: "No trusted public keys resolved. Provide trustedKeyById/trustedPublicKeys or allow inline key explicitly."
    };
  }
  const signatureValid = await verifyAttestationSignature(attestation, trustedPublicKeys);
  if (!signatureValid) {
    return {
      valid: false,
      reason: "HALT attestation signature verification failed."
    };
  }
  if (options.nonceStore) {
    options.nonceStore.mark(claims.nonce, claims.expiresAt);
  }
  return {
    valid: true,
    claims
  };
}
__name(verifyHaltAttestation, "verifyHaltAttestation");
async function verifyZkExecutionEnvelope(envelope, options = {}) {
  const nowMs = options.nowMs ?? Date.now();
  const computedSignalsHash = await hashPublicSignals(envelope.publicSignals);
  if (computedSignalsHash !== envelope.publicSignalsHash) {
    return {
      valid: false,
      reason: "publicSignalsHash does not match canonicalized publicSignals.",
      proofVerified: false,
      attestation: {
        valid: false,
        reason: "Execution envelope publicSignalsHash mismatch."
      }
    };
  }
  if (envelope.expiresAt <= nowMs) {
    return {
      valid: false,
      reason: "Execution envelope is expired.",
      proofVerified: false,
      attestation: {
        valid: false,
        reason: "Execution envelope expired before verification."
      }
    };
  }
  const attestationResult = await verifyHaltAttestation(envelope.attestation, {
    ...options,
    expectedProgramHash: envelope.programHash,
    expectedVkHash: envelope.vkHash,
    expectedPublicSignalsHash: envelope.publicSignalsHash,
    expectedNonce: envelope.nonce,
    expectedExpiresAt: envelope.expiresAt
  });
  if (!attestationResult.valid) {
    return {
      valid: false,
      reason: attestationResult.reason,
      proofVerified: false,
      attestation: attestationResult
    };
  }
  const requireProofVerification = options.requireProofVerification ?? true;
  let proofVerified = options.proofVerifiedHint === true;
  if (!proofVerified && options.proofVerifier) {
    try {
      proofVerified = await options.proofVerifier({
        proof: envelope.proof,
        publicSignals: envelope.publicSignals,
        publicSignalsHash: envelope.publicSignalsHash,
        programHash: envelope.programHash,
        vkHash: envelope.vkHash
      }) === true;
    } catch (error) {
      return {
        valid: false,
        reason: `Proof verifier threw an error: ${String(error)}`,
        proofVerified: false,
        attestation: attestationResult
      };
    }
  }
  if (!proofVerified && requireProofVerification) {
    return {
      valid: false,
      reason: "ZK proof verification was required but no verifier/hint marked the proof as valid.",
      proofVerified: false,
      attestation: attestationResult
    };
  }
  return {
    valid: true,
    proofVerified,
    attestation: attestationResult
  };
}
__name(verifyZkExecutionEnvelope, "verifyZkExecutionEnvelope");

// ../../open-source/gnosis/src/auth/zk-onchain-verifier.ts
init_performance2();
import { Buffer as Buffer3 } from "node:buffer";
var DEFAULT_BLOCK_TAG = "latest";
var DEFAULT_TIMEOUT_MS = 1e4;
var DEFAULT_VERIFY_METHOD_SELECTOR = "0x4d48f5fe";
function normalizeHex(value) {
  const trimmed = value.trim();
  return trimmed.startsWith("0x") || trimmed.startsWith("0X") ? trimmed.slice(2) : trimmed;
}
__name(normalizeHex, "normalizeHex");
function isHexString(value) {
  return /^[0-9a-fA-F]+$/.test(value);
}
__name(isHexString, "isHexString");
function padHexLeft(hexValue, targetLength) {
  return hexValue.padStart(targetLength, "0");
}
__name(padHexLeft, "padHexLeft");
function padHexRight(hexValue, targetLength) {
  return hexValue.padEnd(targetLength, "0");
}
__name(padHexRight, "padHexRight");
function encodeWord(hexValue) {
  const normalized = normalizeHex(hexValue);
  if (!isHexString(normalized)) {
    throw new Error("Invalid hex value for ABI word encoding.");
  }
  if (normalized.length > 64) {
    throw new Error("ABI word encoding overflow: value exceeds 32 bytes.");
  }
  return padHexLeft(normalized, 64);
}
__name(encodeWord, "encodeWord");
function uintToHex(value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Expected a non-negative integer for ABI uint encoding.");
  }
  return value.toString(16);
}
__name(uintToHex, "uintToHex");
function normalizeMethodSelector(value) {
  const candidate = value ?? DEFAULT_VERIFY_METHOD_SELECTOR;
  const normalized = normalizeHex(candidate).toLowerCase();
  if (!isHexString(normalized) || normalized.length !== 8) {
    throw new Error(
      "Verifier method selector must be exactly 4 bytes (8 hex chars)."
    );
  }
  return `0x${normalized}`;
}
__name(normalizeMethodSelector, "normalizeMethodSelector");
function normalizeAddress(value) {
  const normalized = normalizeHex(value).toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(normalized)) {
    throw new Error("Verifier address must be a valid 20-byte hex address.");
  }
  return `0x${normalized}`;
}
__name(normalizeAddress, "normalizeAddress");
function toBytes(data, encoding) {
  if (encoding === "utf8") {
    return new TextEncoder().encode(data);
  }
  if (encoding === "base64") {
    return new Uint8Array(Buffer3.from(data, "base64"));
  }
  if (encoding === "hex") {
    const normalized = normalizeHex(data);
    if (normalized.length === 0 || normalized.length % 2 !== 0) {
      throw new Error("Hex proof payload must have an even number of characters.");
    }
    if (!isHexString(normalized)) {
      throw new Error("Hex proof payload contains non-hex characters.");
    }
    return new Uint8Array(Buffer3.from(normalized, "hex"));
  }
  const maybeHex = normalizeHex(data);
  if (maybeHex.length > 0 && maybeHex.length % 2 === 0 && isHexString(maybeHex) && data.trim().startsWith("0x")) {
    return new Uint8Array(Buffer3.from(maybeHex, "hex"));
  }
  return new TextEncoder().encode(data);
}
__name(toBytes, "toBytes");
function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(bytesToHex, "bytesToHex");
async function toBytes32Word(value) {
  const normalized = normalizeHex(value);
  if (isHexString(normalized) && normalized.length > 0 && normalized.length <= 64) {
    return encodeWord(normalized);
  }
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return bytesToHex(new Uint8Array(digest));
}
__name(toBytes32Word, "toBytes32Word");
function parseBooleanResult(returnData) {
  const normalized = normalizeHex(returnData);
  if (normalized.length === 0) {
    return false;
  }
  if (!isHexString(normalized)) {
    throw new Error("eth_call returned non-hex result payload.");
  }
  const word = normalized.slice(-64);
  return BigInt(`0x${word}`) !== 0n;
}
__name(parseBooleanResult, "parseBooleanResult");
async function buildVerifyExecutionCalldata(input, config) {
  const methodSelector = normalizeMethodSelector(config.methodSelector);
  const proofEncoding = config.proofEncoding ?? "auto";
  const proofBytes = toBytes(input.proof, proofEncoding);
  const proofHex = bytesToHex(proofBytes);
  const proofLengthHex = uintToHex(proofBytes.length);
  const proofPaddedHex = padHexRight(
    proofHex,
    Math.ceil(proofHex.length / 64) * 64
  );
  const publicSignalsHashWord = await toBytes32Word(input.publicSignalsHash);
  const programHashWord = await toBytes32Word(input.programHash);
  const vkHashWord = await toBytes32Word(input.vkHash);
  const dynamicOffsetWord = encodeWord(uintToHex(4 * 32));
  const proofLengthWord = encodeWord(proofLengthHex);
  return `0x${normalizeHex(methodSelector)}${dynamicOffsetWord}${publicSignalsHashWord}${programHashWord}${vkHashWord}${proofLengthWord}${proofPaddedHex}`;
}
__name(buildVerifyExecutionCalldata, "buildVerifyExecutionCalldata");
function isJsonRpcSuccess(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value;
  return typeof record.result === "string";
}
__name(isJsonRpcSuccess, "isJsonRpcSuccess");
function isJsonRpcError(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value;
  if (typeof record.error !== "object" || record.error === null) {
    return false;
  }
  const errorRecord = record.error;
  return typeof errorRecord.code === "number" && typeof errorRecord.message === "string";
}
__name(isJsonRpcError, "isJsonRpcError");
async function verifyProofViaEvmRpc(input, config) {
  const rpcUrl = config.rpcUrl.trim();
  if (rpcUrl.length === 0) {
    throw new Error("rpcUrl is required for EVM proof verification.");
  }
  const to = normalizeAddress(config.verifierAddress);
  const data = await buildVerifyExecutionCalldata(input, config);
  const blockTag = config.blockTag ?? DEFAULT_BLOCK_TAG;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const requestBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_call",
    params: [
      {
        to,
        data
      },
      blockTag
    ]
  };
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutHandle);
  }
  if (!response.ok) {
    throw new Error(`eth_call request failed with HTTP ${response.status}.`);
  }
  const parsed = await response.json();
  if (isJsonRpcError(parsed)) {
    throw new Error(
      `eth_call JSON-RPC error ${parsed.error.code}: ${parsed.error.message}`
    );
  }
  if (!isJsonRpcSuccess(parsed)) {
    throw new Error("eth_call returned malformed JSON-RPC payload.");
  }
  return parseBooleanResult(parsed.result);
}
__name(verifyProofViaEvmRpc, "verifyProofViaEvmRpc");
function createEvmProofVerifier(config) {
  return async (input) => verifyProofViaEvmRpc(input, config);
}
__name(createEvmProofVerifier, "createEvmProofVerifier");

// ../../open-source/gnosis/src/auth/handlers.ts
var haltNonceReplayStore = new InMemoryNonceReplayStore();
function asRecord(value) {
  return typeof value === "object" && value !== null ? value : {};
}
__name(asRecord, "asRecord");
function parseBoolean2(value, fallback) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
}
__name(parseBoolean2, "parseBoolean");
function readBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}
__name(readBoolean, "readBoolean");
function parseFiniteNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return void 0;
}
__name(parseFiniteNumber, "parseFiniteNumber");
function parseStringList(value) {
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === "string").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  }
  if (typeof value === "string") {
    const raw2 = value.trim();
    if (raw2.length === 0) {
      return [];
    }
    if (raw2.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw2);
        return parseStringList(parsed);
      } catch {
      }
    }
    return raw2.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  }
  return [];
}
__name(parseStringList, "parseStringList");
function dedupeStrings(values) {
  return Array.from(new Set(values.map((value) => value.trim()))).filter(
    (value) => value.length > 0
  );
}
__name(dedupeStrings, "dedupeStrings");
function parseRecordFromUnknown(value) {
  if (typeof value === "string" && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value;
  }
  return null;
}
__name(parseRecordFromUnknown, "parseRecordFromUnknown");
function parseZkMode(value, fallback) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "required") return "required";
  if (normalized === "preferred") return "preferred";
  if (normalized === "off" || normalized === "disabled") return "off";
  return fallback;
}
__name(parseZkMode, "parseZkMode");
function resolveZkMode(input, props, fallback) {
  const fromInput = typeof input.zkMode === "string" ? input.zkMode : void 0;
  return parseZkMode(fromInput ?? props.zkMode, fallback);
}
__name(resolveZkMode, "resolveZkMode");
function parseCapabilities(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  const capabilities = [];
  for (const entry of value) {
    const record = asRecord(entry);
    const can = record.can;
    const withValue = record.with;
    if (typeof can !== "string" || typeof withValue !== "string") {
      continue;
    }
    const capability = {
      can,
      with: withValue
    };
    if (typeof record.constraints === "object" && record.constraints !== null && !Array.isArray(record.constraints)) {
      capability.constraints = record.constraints;
    }
    capabilities.push(capability);
  }
  return capabilities;
}
__name(parseCapabilities, "parseCapabilities");
function parseCapabilitiesFromProps(props) {
  const raw2 = props.capabilities;
  if (!raw2) {
    if (props.can && props.with) {
      return [{ can: props.can, with: props.with }];
    }
    return [];
  }
  try {
    const parsed = JSON.parse(raw2);
    return parseCapabilities(parsed);
  } catch {
    if (props.can && props.with) {
      return [{ can: props.can, with: props.with }];
    }
    return [];
  }
}
__name(parseCapabilitiesFromProps, "parseCapabilitiesFromProps");
function parseRequiredCapability(payload, props) {
  if (props.can && props.with) {
    return { can: props.can, with: props.with };
  }
  const candidate = asRecord(payload.requiredCapability);
  if (typeof candidate.can === "string" && typeof candidate.with === "string") {
    return {
      can: candidate.can,
      with: candidate.with,
      constraints: typeof candidate.constraints === "object" && candidate.constraints !== null && !Array.isArray(candidate.constraints) ? candidate.constraints : void 0
    };
  }
  return null;
}
__name(parseRequiredCapability, "parseRequiredCapability");
function parseEncryptedPayload(value) {
  const record = asRecord(value);
  if (typeof record.alg !== "string" || typeof record.ct !== "string" || typeof record.iv !== "string" || typeof record.tag !== "string" || typeof record.encryptedAt !== "number") {
    return null;
  }
  return record;
}
__name(parseEncryptedPayload, "parseEncryptedPayload");
function parseJsonWebKey(value) {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return void 0;
    }
  }
  return void 0;
}
__name(parseJsonWebKey, "parseJsonWebKey");
function parseJsonWebKeyList(value) {
  if (Array.isArray(value)) {
    const keys = [];
    for (const candidate of value) {
      const key2 = parseJsonWebKey(candidate);
      if (key2) {
        keys.push(key2);
      }
    }
    return keys;
  }
  const key = parseJsonWebKey(value);
  return key ? [key] : [];
}
__name(parseJsonWebKeyList, "parseJsonWebKeyList");
function parseTrustedKeyById(value) {
  const record = parseRecordFromUnknown(value);
  if (!record) {
    return {};
  }
  const trustedKeys = {};
  for (const [keyId, candidate] of Object.entries(record)) {
    const parsed = parseJsonWebKey(candidate);
    if (parsed) {
      trustedKeys[keyId] = parsed;
    }
  }
  return trustedKeys;
}
__name(parseTrustedKeyById, "parseTrustedKeyById");
function parseHaltVerificationOptions(input, props) {
  const trustedMeasurements = dedupeStrings([
    ...parseStringList(input.trustedMeasurements),
    ...parseStringList(input.allowedMeasurements),
    ...parseStringList(props.trustedMeasurements),
    ...parseStringList(props.allowedMeasurements)
  ]);
  const trustedProgramHashes = dedupeStrings([
    ...parseStringList(input.trustedProgramHashes),
    ...parseStringList(input.allowedProgramHashes),
    ...parseStringList(props.trustedProgramHashes),
    ...parseStringList(props.allowedProgramHashes)
  ]);
  const trustedVkHashes = dedupeStrings([
    ...parseStringList(input.trustedVkHashes),
    ...parseStringList(input.allowedVkHashes),
    ...parseStringList(props.trustedVkHashes),
    ...parseStringList(props.allowedVkHashes)
  ]);
  const trustedPublicKeys = [
    ...parseJsonWebKeyList(input.trustedPublicKeys),
    ...parseJsonWebKeyList(input.trustedPublicKey),
    ...parseJsonWebKeyList(props.trustedPublicKeys),
    ...parseJsonWebKeyList(props.trustedPublicKey)
  ];
  const trustedKeyById = {
    ...parseTrustedKeyById(props.trustedKeyById),
    ...parseTrustedKeyById(input.trustedKeyById)
  };
  const maxAttestationAgeMs = parseFiniteNumber(input.maxAttestationAgeMs) ?? parseFiniteNumber(props.maxAttestationAgeMs);
  const minTcbVersion = typeof input.minTcbVersion === "string" ? input.minTcbVersion : props.minTcbVersion;
  const allowInlinePublicKey = readBoolean(
    input.allowInlinePublicKey,
    parseBoolean2(props.allowInlinePublicKey, false)
  );
  const disableReplayProtection = readBoolean(
    input.disableReplayProtection,
    parseBoolean2(props.disableReplayProtection, false)
  );
  return {
    trustedMeasurements: trustedMeasurements.length > 0 ? trustedMeasurements : void 0,
    trustedProgramHashes: trustedProgramHashes.length > 0 ? trustedProgramHashes : void 0,
    trustedVkHashes: trustedVkHashes.length > 0 ? trustedVkHashes : void 0,
    trustedPublicKeys: trustedPublicKeys.length > 0 ? trustedPublicKeys : void 0,
    trustedKeyById: Object.keys(trustedKeyById).length > 0 ? trustedKeyById : void 0,
    maxAttestationAgeMs,
    minTcbVersion,
    allowInlinePublicKey,
    nonceStore: disableReplayProtection ? void 0 : haltNonceReplayStore
  };
}
__name(parseHaltVerificationOptions, "parseHaltVerificationOptions");
function parseProofVerifier(value) {
  if (typeof value !== "function") {
    return void 0;
  }
  const verifier = value;
  return async (input) => {
    const result = await verifier(input);
    return result === true;
  };
}
__name(parseProofVerifier, "parseProofVerifier");
function parseProofEncoding(value) {
  if (typeof value !== "string") {
    return void 0;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "auto") return "auto";
  if (normalized === "hex") return "hex";
  if (normalized === "base64") return "base64";
  if (normalized === "utf8") return "utf8";
  return void 0;
}
__name(parseProofEncoding, "parseProofEncoding");
function parseEvmProofVerifierConfig(input, props) {
  const rpcUrl = typeof input.verifierRpcUrl === "string" ? input.verifierRpcUrl : typeof input.rpcUrl === "string" ? input.rpcUrl : props.verifierRpcUrl ?? props.rpcUrl;
  const verifierAddress = typeof input.verifierAddress === "string" ? input.verifierAddress : props.verifierAddress;
  if (!rpcUrl || !verifierAddress) {
    return null;
  }
  const methodSelector = typeof input.verifierMethodSelector === "string" ? input.verifierMethodSelector : props.verifierMethodSelector;
  const blockTag = typeof input.verifierBlockTag === "string" ? input.verifierBlockTag : props.verifierBlockTag;
  const timeoutMs = parseFiniteNumber(input.verifierTimeoutMs) ?? parseFiniteNumber(props.verifierTimeoutMs);
  const proofEncoding = parseProofEncoding(input.verifierProofEncoding) ?? parseProofEncoding(props.verifierProofEncoding);
  return {
    rpcUrl,
    verifierAddress,
    methodSelector,
    blockTag: typeof blockTag === "string" && blockTag.length > 0 ? blockTag : void 0,
    timeoutMs,
    proofEncoding
  };
}
__name(parseEvmProofVerifierConfig, "parseEvmProofVerifierConfig");
function resolveProofVerifier(input, props) {
  const explicitVerifier = parseProofVerifier(input.proofVerifier);
  if (explicitVerifier) {
    return explicitVerifier;
  }
  const evmConfig = parseEvmProofVerifierConfig(input, props);
  if (evmConfig) {
    return createEvmProofVerifier(evmConfig);
  }
  return void 0;
}
__name(resolveProofVerifier, "resolveProofVerifier");
function parseRecipientPublicKey(input, props) {
  const directCandidates = [
    input.recipientPublicKey,
    input.zkRecipientPublicKey,
    input.publicKey
  ];
  for (const candidate of directCandidates) {
    const parsed = parseJsonWebKey(candidate);
    if (parsed) return parsed;
  }
  const propCandidates = [
    props.recipientPublicKey,
    props.zkRecipientPublicKey,
    props.publicKey
  ];
  for (const candidate of propCandidates) {
    const parsed = parseJsonWebKey(candidate);
    if (parsed) return parsed;
  }
  return void 0;
}
__name(parseRecipientPublicKey, "parseRecipientPublicKey");
function toPlaintext(value) {
  if (typeof value === "string") {
    return value.length > 0 ? value : null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "bigint") {
    return value.toString(10);
  }
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }
  return null;
}
__name(toPlaintext, "toPlaintext");
function findPayloadCandidate(input, fields) {
  for (const field of fields) {
    if (!(field in input)) {
      continue;
    }
    const plaintext = toPlaintext(input[field]);
    if (plaintext !== null) {
      return { field, plaintext };
    }
  }
  return null;
}
__name(findPayloadCandidate, "findPayloadCandidate");
function parseExistingEncryptedPayload(input) {
  const candidates = [
    input.encrypted,
    input.encryptedPayload,
    input.zkEncrypted,
    input.zkEncryptedPayload
  ];
  for (const candidate of candidates) {
    const parsed = parseEncryptedPayload(candidate);
    if (parsed) return parsed;
  }
  return null;
}
__name(parseExistingEncryptedPayload, "parseExistingEncryptedPayload");
function hasDelegationConfidentialContext(input, props) {
  if (readBoolean(input.confidential, false) || readBoolean(input.private, false) || parseBoolean2(props.confidential, false) || parseBoolean2(props.private, false)) {
    return true;
  }
  const contextFields = ["delegationContext", "context", "attenuationContext"];
  return contextFields.some(
    (field) => field in input && input[field] !== null && input[field] !== void 0 && input[field] !== ""
  );
}
__name(hasDelegationConfidentialContext, "hasDelegationConfidentialContext");
function isCrossBoundarySync(input, props) {
  if (readBoolean(input.crossDevice, false) || readBoolean(input.crossTenant, false) || parseBoolean2(props.crossDevice, false) || parseBoolean2(props.crossTenant, false)) {
    return true;
  }
  const tenantScope = typeof input.tenantScope === "string" ? input.tenantScope : props.tenantScope;
  return tenantScope === "cross-tenant" || tenantScope === "cross-device";
}
__name(isCrossBoundarySync, "isCrossBoundarySync");
function isPrivateMaterialization(input, props) {
  if (readBoolean(input.private, false) || readBoolean(input.userPrivate, false) || parseBoolean2(props.private, false) || parseBoolean2(props.userPrivate, false)) {
    return true;
  }
  const visibility = typeof input.visibility === "string" ? input.visibility : props.visibility;
  if (visibility === "private") {
    return true;
  }
  const persistence = typeof input.persistence === "string" ? input.persistence : props.persistence;
  return persistence === "fs.local" || persistence === "fs.durable";
}
__name(isPrivateMaterialization, "isPrivateMaterialization");
async function protectPayloadWithZk(options) {
  const required = options.mode === "required";
  const baseReport = {
    domain: options.domain,
    mode: options.mode,
    sensitive: options.sensitive,
    required
  };
  if (options.mode === "off") {
    return {
      encrypted: null,
      report: {
        ...baseReport,
        applied: false,
        status: "disabled",
        reason: "ZK mode is disabled for this node."
      }
    };
  }
  const existingEncrypted = parseExistingEncryptedPayload(options.input);
  if (existingEncrypted) {
    return {
      encrypted: existingEncrypted,
      report: {
        ...baseReport,
        applied: true,
        status: "already-encrypted",
        reason: "Encrypted payload already present."
      }
    };
  }
  const candidate = findPayloadCandidate(options.input, options.candidateFields);
  if (!candidate) {
    return {
      encrypted: null,
      report: {
        ...baseReport,
        applied: false,
        status: "skipped",
        reason: "No payload field available for ZK protection."
      }
    };
  }
  const recipientPublicKey = parseRecipientPublicKey(options.input, options.props);
  if (!recipientPublicKey) {
    if (required && options.sensitive) {
      throw new Error(
        `${options.domain} flow requires recipient public key when zkMode=required.`
      );
    }
    return {
      encrypted: null,
      report: {
        ...baseReport,
        applied: false,
        status: "skipped",
        reason: "Recipient public key not provided; encryption skipped.",
        sourceField: candidate.field
      }
    };
  }
  const encrypted = await zkEncryptUtf8({
    plaintext: candidate.plaintext,
    recipientPublicKey,
    encryptionOptions: {
      category: options.domain
    }
  });
  return {
    encrypted,
    report: {
      ...baseReport,
      applied: true,
      status: "applied",
      reason: "Sensitive payload encrypted with ZK policy.",
      sourceField: candidate.field
    }
  };
}
__name(protectPayloadWithZk, "protectPayloadWithZk");
var GNOSIS_CORE_AUTH_LABELS = {
  UCAN_IDENTITY: "UCANIdentity",
  UCAN_ISSUE: "UCANIssue",
  UCAN_VERIFY: "UCANVerify",
  UCAN_DELEGATE: "UCANDelegate",
  UCAN_REQUIRE: "UCANRequire",
  ZK_ENCRYPT: "ZKEncrypt",
  ZK_DECRYPT: "ZKDecrypt",
  CUSTODIAL_SIGNER: "CustodialSigner",
  ZK_SYNC_ENVELOPE: "ZKSyncEnvelope",
  ZK_MATERIALIZE_ENVELOPE: "ZKMaterializeEnvelope",
  HALT_ATTESTATION_VERIFY: "HALTAttestationVerify",
  ZK_EXECUTION_GATE: "ZKExecutionGate"
};
function registerCoreAuthHandlers(registry) {
  registry.register(
    GNOSIS_CORE_AUTH_LABELS.UCAN_IDENTITY,
    async (payload, props) => {
      const input = asRecord(payload);
      const displayName = typeof input.displayName === "string" ? input.displayName : props.displayName;
      const identity = await generateUcanIdentity(
        displayName ? { displayName } : void 0
      );
      return {
        ...input,
        identity
      };
    },
    { override: false }
  );
  registry.register(
    GNOSIS_CORE_AUTH_LABELS.UCAN_ISSUE,
    async (payload, props) => {
      const input = asRecord(payload);
      const issuer = input.identity;
      const audience = typeof input.audience === "string" ? input.audience : props.audience;
      if (!issuer) {
        throw new Error("UCANIssue requires payload.identity (Identity).");
      }
      if (!audience) {
        throw new Error("UCANIssue requires an audience DID in payload.audience or props.audience.");
      }
      const capabilities = parseCapabilities(input.capabilities) || parseCapabilitiesFromProps(props);
      const effectiveCapabilities = capabilities.length > 0 ? capabilities : parseCapabilitiesFromProps(props);
      if (effectiveCapabilities.length === 0) {
        throw new Error("UCANIssue requires at least one capability (payload.capabilities or props.capabilities/can+with).");
      }
      const expirationSeconds = Number.parseInt(
        props.expirationSeconds ?? `${input.expirationSeconds ?? ""}`,
        10
      );
      const token = await issueGranularUcan({
        issuer,
        audience,
        capabilities: effectiveCapabilities,
        createOptions: Number.isFinite(expirationSeconds) ? { expirationSeconds } : void 0
      });
      return {
        ...input,
        ucan: {
          token,
          capabilities: effectiveCapabilities,
          audience
        }
      };
    },
    { override: false }
  );
  registry.register(
    GNOSIS_CORE_AUTH_LABELS.UCAN_VERIFY,
    async (payload, props) => {
      const input = asRecord(payload);
      const token = typeof input.token === "string" ? input.token : typeof asRecord(input.ucan).token === "string" ? asRecord(input.ucan).token : null;
      const issuerPublicKey = input.issuerPublicKey;
      if (!token) {
        throw new Error("UCANVerify requires payload.token or payload.ucan.token.");
      }
      if (!issuerPublicKey) {
        throw new Error("UCANVerify requires payload.issuerPublicKey (JsonWebKey).");
      }
      const requiredCapabilities = parseCapabilitiesFromProps(props);
      const audience = typeof input.audience === "string" ? input.audience : props.audience;
      const verification = await verifyGranularUcan({
        token,
        issuerPublicKey,
        verifyOptions: {
          audience,
          requiredCapabilities: requiredCapabilities.length > 0 ? requiredCapabilities : void 0
        }
      });
      const failClosed = parseBoolean2(props.failClosed, true);
      if (!verification.valid && failClosed) {
        throw new Error(
          `UCAN verification failed: ${verification.error ?? "unknown error"}`
        );
      }
      const enforce = parseBoolean2(props.enforce, true);
      const executionAuth = verification.valid ? {
        enforce,
        principal: verification.payload?.aud,
        token,
        capabilities: verification.payload?.att ?? []
      } : void 0;
      return {
        ...input,
        ucanVerification: verification,
        executionAuth
      };
    },
    { override: false }
  );
  registry.register(
    GNOSIS_CORE_AUTH_LABELS.UCAN_DELEGATE,
    async (payload, props) => {
      const input = asRecord(payload);
      const parentToken = typeof input.parentToken === "string" ? input.parentToken : typeof input.token === "string" ? input.token : null;
      const issuer = input.identity;
      const audience = typeof input.audience === "string" ? input.audience : props.audience;
      const capabilities = parseCapabilities(input.capabilities) || parseCapabilitiesFromProps(props);
      const effectiveCapabilities = capabilities.length > 0 ? capabilities : parseCapabilitiesFromProps(props);
      if (!parentToken) {
        throw new Error("UCANDelegate requires payload.parentToken (or payload.token).");
      }
      if (!issuer) {
        throw new Error("UCANDelegate requires payload.identity (Identity).");
      }
      if (!audience) {
        throw new Error("UCANDelegate requires payload.audience or props.audience.");
      }
      if (effectiveCapabilities.length === 0) {
        throw new Error("UCANDelegate requires delegated capabilities.");
      }
      const sensitiveDelegation = hasDelegationConfidentialContext(input, props);
      const delegateZkMode = resolveZkMode(
        input,
        props,
        sensitiveDelegation ? "required" : "preferred"
      );
      const delegationProtection = await protectPayloadWithZk({
        domain: "delegation",
        mode: delegateZkMode,
        sensitive: sensitiveDelegation,
        input,
        props,
        candidateFields: ["delegationContext", "context", "attenuationContext"]
      });
      const delegatedToken = await delegateGranularUcan({
        parentToken,
        issuer,
        audience,
        capabilities: effectiveCapabilities,
        delegationOptions: {
          attenuate: parseBoolean2(props.attenuate, true)
        }
      });
      return {
        ...input,
        delegatedUcan: {
          token: delegatedToken,
          capabilities: effectiveCapabilities,
          audience
        },
        delegationContextEncrypted: delegationProtection.encrypted ?? void 0,
        zkPolicy: delegationProtection.report
      };
    },
    { override: false }
  );
  registry.register(
    GNOSIS_CORE_AUTH_LABELS.UCAN_REQUIRE,
    async (payload, props) => {
      const input = asRecord(payload);
      const executionAuth = asRecord(input.executionAuth);
      const required = parseRequiredCapability(input, props);
      if (!required) {
        throw new Error("UCANRequire requires can+with (props or payload.requiredCapability).");
      }
      const capabilities = parseCapabilities(executionAuth.capabilities);
      const granted = checkGrantedCapability(capabilities, required);
      if (!granted) {
        throw new Error(
          `UCANRequire denied: missing ${required.can} on ${required.with}`
        );
      }
      return {
        ...input,
        requiredCapability: required,
        requiredCapabilityGranted: true
      };
    },
    { override: false }
  );
  registry.register(
    GNOSIS_CORE_AUTH_LABELS.ZK_ENCRYPT,
    async (payload, _props) => {
      const input = asRecord(payload);
      const plaintext = typeof input.plaintext === "string" ? input.plaintext : typeof input.value === "string" ? input.value : null;
      const recipientPublicKey = input.recipientPublicKey;
      if (!plaintext) {
        throw new Error("ZKEncrypt requires payload.plaintext (string).");
      }
      if (!recipientPublicKey) {
        throw new Error("ZKEncrypt requires payload.recipientPublicKey (JsonWebKey).");
      }
      const encrypted = await zkEncryptUtf8({ plaintext, recipientPublicKey });
      return {
        ...input,
        encrypted
      };
    },
    { override: false }
  );
  registry.register(
    GNOSIS_CORE_AUTH_LABELS.ZK_DECRYPT,
    async (payload, _props) => {
      const input = asRecord(payload);
      const encrypted = parseEncryptedPayload(input.encrypted);
      const recipientPrivateKey = input.recipientPrivateKey;
      if (!encrypted) {
        throw new Error("ZKDecrypt requires payload.encrypted (EncryptedPayload).");
      }
      if (!recipientPrivateKey) {
        throw new Error("ZKDecrypt requires payload.recipientPrivateKey (JsonWebKey).");
      }
      const plaintext = await zkDecryptUtf8({
        encrypted,
        recipientPrivateKey
      });
      return {
        ...input,
        plaintext
      };
    },
    { override: false }
  );
  registry.register(
    GNOSIS_CORE_AUTH_LABELS.CUSTODIAL_SIGNER,
    async (payload, props) => {
      const input = asRecord(payload);
      const action = typeof input.action === "string" ? input.action : props.action;
      if (!action) {
        throw new Error("CustodialSigner requires an action (payload.action or props.action).");
      }
      const allowed = isAllowedCustodialAction(action);
      if (!allowed && parseBoolean2(props.failClosed, true)) {
        throw new Error(`CustodialSigner denied unknown action: ${action}`);
      }
      const hasCustodialPayload = findPayloadCandidate(input, ["payload", "signerPayload", "signature"]) !== null;
      const custodialZkMode = resolveZkMode(
        input,
        props,
        hasCustodialPayload ? "required" : "preferred"
      );
      const custodialProtection = await protectPayloadWithZk({
        domain: "custodial",
        mode: custodialZkMode,
        sensitive: hasCustodialPayload,
        input,
        props,
        candidateFields: ["payload", "signerPayload", "signature", "request"]
      });
      return {
        ...input,
        encrypted: custodialProtection.encrypted ?? void 0,
        zkPolicy: custodialProtection.report,
        custodial: {
          action,
          allowed,
          payloadEncrypted: custodialProtection.report.applied
        }
      };
    },
    { override: false }
  );
  registry.register(
    GNOSIS_CORE_AUTH_LABELS.ZK_SYNC_ENVELOPE,
    async (payload, props) => {
      const input = asRecord(payload);
      const syncSensitive = isCrossBoundarySync(input, props);
      const syncMode = resolveZkMode(
        input,
        props,
        syncSensitive ? "required" : "preferred"
      );
      const syncProtection = await protectPayloadWithZk({
        domain: "sync",
        mode: syncMode,
        sensitive: syncSensitive,
        input,
        props,
        candidateFields: ["delta", "update", "payload", "state", "snapshot", "data"]
      });
      return {
        ...input,
        encrypted: syncProtection.encrypted ?? void 0,
        zkPolicy: syncProtection.report,
        syncEnvelope: {
          sensitive: syncSensitive,
          encrypted: syncProtection.report.applied
        }
      };
    },
    { override: false }
  );
  registry.register(
    GNOSIS_CORE_AUTH_LABELS.ZK_MATERIALIZE_ENVELOPE,
    async (payload, props) => {
      const input = asRecord(payload);
      const privateMaterialization = isPrivateMaterialization(input, props);
      const materializeMode = resolveZkMode(
        input,
        props,
        privateMaterialization ? "required" : "preferred"
      );
      const materializeProtection = await protectPayloadWithZk({
        domain: "materialization",
        mode: materializeMode,
        sensitive: privateMaterialization,
        input,
        props,
        candidateFields: ["payload", "plaintext", "value", "state", "snapshot", "content"]
      });
      return {
        ...input,
        encrypted: materializeProtection.encrypted ?? void 0,
        zkPolicy: materializeProtection.report,
        materializationEnvelope: {
          private: privateMaterialization,
          encrypted: materializeProtection.report.applied
        }
      };
    },
    { override: false }
  );
  registry.register(
    GNOSIS_CORE_AUTH_LABELS.HALT_ATTESTATION_VERIFY,
    async (payload, props) => {
      const input = asRecord(payload);
      const attestation = asHaltAttestationEnvelope(input.attestation);
      if (!attestation) {
        throw new Error(
          "HALTAttestationVerify requires payload.attestation (HaltAttestationEnvelope)."
        );
      }
      const verification = await verifyHaltAttestation(
        attestation,
        parseHaltVerificationOptions(input, props)
      );
      const failClosed = readBoolean(
        input.failClosed,
        parseBoolean2(props.failClosed, true)
      );
      if (!verification.valid && failClosed) {
        throw new Error(
          `HALTAttestationVerify failed: ${verification.reason ?? "unknown failure"}`
        );
      }
      return {
        ...input,
        haltAttestation: verification
      };
    },
    { override: false }
  );
  registry.register(
    GNOSIS_CORE_AUTH_LABELS.ZK_EXECUTION_GATE,
    async (payload, props) => {
      const input = asRecord(payload);
      const envelopeSource = Object.prototype.hasOwnProperty.call(
        input,
        "executionEnvelope"
      ) ? input.executionEnvelope : input;
      const executionEnvelope = asHaltExecutionEnvelope(envelopeSource);
      if (!executionEnvelope) {
        throw new Error(
          "ZKExecutionGate requires payload.executionEnvelope with attestation/proof fields."
        );
      }
      const proofVerifier = resolveProofVerifier(input, props);
      const proofVerifiedHint = readBoolean(input.proofVerified, false);
      const requireProofVerification = readBoolean(
        input.requireProofVerification,
        parseBoolean2(props.requireProofVerification, true)
      );
      const gateResult = await verifyZkExecutionEnvelope(executionEnvelope, {
        ...parseHaltVerificationOptions(input, props),
        proofVerifier,
        proofVerifiedHint,
        requireProofVerification
      });
      const failClosed = readBoolean(
        input.failClosed,
        parseBoolean2(props.failClosed, true)
      );
      if (!gateResult.valid && failClosed) {
        throw new Error(
          `ZKExecutionGate denied: ${gateResult.reason ?? "unknown reason"}`
        );
      }
      return {
        ...input,
        executionEnvelope,
        executionGate: {
          allowed: gateResult.valid,
          reason: gateResult.reason,
          proofVerified: gateResult.proofVerified,
          attestation: gateResult.attestation
        }
      };
    },
    { override: false }
  );
}
__name(registerCoreAuthHandlers, "registerCoreAuthHandlers");

// ../../open-source/gnosis/src/runtime/engine.ts
var GnosisEngine = class {
  static {
    __name(this, "GnosisEngine");
  }
  registry;
  bridge;
  tracker;
  onEdgeEvaluated;
  constructor(registry, options = {}) {
    this.registry = registry || new GnosisRegistry();
    registerCoreAuthHandlers(this.registry);
    this.bridge = new QuantumWasmBridge();
    this.tracker = new ReynoldsTracker(128);
    this.onEdgeEvaluated = options.onEdgeEvaluated ?? null;
  }
  async execute(ast, initialPayload = null) {
    if (ast.edges.length === 0) return "[Engine] No graph to execute.";
    const autoInjected = injectSensitiveZkEnvelopes(ast);
    const activeAst = autoInjected.ast;
    this.tracker = new ReynoldsTracker(activeAst.nodes.size || 128);
    const execLogs = ["\n[Gnosis Engine Execution]"];
    if (autoInjected.injected.length > 0) {
      execLogs.push(`Auto-injected ${autoInjected.injected.length} ZK envelope node(s) for sensitive flows.`);
    }
    let currentPayload = initialPayload;
    const allTargetIds = /* @__PURE__ */ new Set();
    activeAst.edges.forEach((e) => e.targetIds.forEach((id) => allTargetIds.add(id.trim())));
    const roots = Array.from(activeAst.nodes.keys()).filter((id) => !allTargetIds.has(id.trim()));
    if (roots.length === 0 && activeAst.nodes.size > 0) {
      const firstEdge = activeAst.edges[0];
      if (firstEdge) {
        roots.push(firstEdge.sourceIds[0].trim());
      } else {
        roots.push(Array.from(activeAst.nodes.keys())[0]);
      }
    }
    let currentNodeId = roots[0];
    const visited = /* @__PURE__ */ new Set();
    let streamCounter = 0;
    execLogs.push(`Tracing from root: ${currentNodeId}`);
    while (currentNodeId) {
      currentNodeId = currentNodeId.trim();
      const sid = streamCounter++;
      this.tracker.updateStream(sid, "active");
      if (visited.has(currentNodeId)) {
        execLogs.push(`Cycle detected at ${currentNodeId}. Breaking.`);
        this.tracker.updateStream(sid, "vented");
        break;
      }
      visited.add(currentNodeId);
      const node = activeAst.nodes.get(currentNodeId);
      if (node) {
        const handler = this.findHandler(node);
        if (handler) {
          execLogs.push(`  -> Executing [${currentNodeId}] (${node.labels.join(",")})`);
          currentPayload = await handler(currentPayload, node.properties);
          this.tracker.updateStream(sid, "completed");
        } else {
          execLogs.push(`  -> Skipping [${currentNodeId}] (No handler)`);
          this.tracker.updateStream(sid, "vented");
        }
      } else {
        execLogs.push(`  -> Error: Node [${currentNodeId}] not found in AST.`);
        this.tracker.updateStream(sid, "vented");
      }
      const edges = activeAst.edges.filter((e) => e.sourceIds.map((s) => s.trim()).includes(currentNodeId));
      if (edges.length === 0) {
        execLogs.push(`No outgoing edge from ${currentNodeId}. Final node.`);
        break;
      }
      const specialEdge = edges.find((e) => e.type === "HALT" || e.type === "MEASURE");
      if (specialEdge) {
        if (specialEdge.type === "MEASURE") {
          const metrics = this.tracker.metrics();
          execLogs.push(`  [MEASURE] Re: ${metrics.reynoldsNumber.toFixed(2)}, B1: ${metrics.bettiNumber}, Laminar: ${(metrics.laminarFraction * 100).toFixed(1)}%`);
        } else if (specialEdge.type === "HALT") {
          execLogs.push(`  [HALT] Breakpoint reached at ${currentNodeId}. (Press any key to continue simulation)`);
          execLogs.push(`    Snapshot: Payload=${JSON.stringify(currentPayload).substring(0, 30)}...`);
        }
      }
      const edge = edges.find((e) => ["FORK", "RACE", "FOLD", "EVOLVE", "SUPERPOSE", "ENTANGLE", "OBSERVE"].includes(e.type || "")) || edges[0];
      const edgeAuthorization = this.authorizeEdge(edge, currentNodeId, currentPayload);
      if (!edgeAuthorization.allowed) {
        execLogs.push(`  [AUTH] Denied ${edge.type}: ${edgeAuthorization.reason}`);
        this.tracker.updateStream(sid, "vented");
        break;
      }
      await this.notifyEdgeEvaluated(edge);
      if (edge.type === "OBSERVE") {
        const strategy = edge.properties.strategy || "lww";
        execLogs.push(`  [OBSERVE] Collapsing superposition with strategy: ${strategy}`);
        const entangleEdges = activeAst.edges.filter(
          (e) => e.type === "ENTANGLE" && e.sourceIds.some((sid2) => edge.targetIds.map((t) => t.trim()).includes(sid2.trim()))
        );
        if (entangleEdges.length > 0) {
          execLogs.push(`    [ENTANGLE] Cascading observation to ${entangleEdges.length} entangled subgraphs`);
        }
        currentNodeId = edge.targetIds[0].trim();
        continue;
      }
      if (edge.type === "FORK" || edge.type === "EVOLVE" || edge.type === "SUPERPOSE" || edge.type === "ENTANGLE") {
        execLogs.push(`  !! Hit ${edge.type} edge: [${edge.sourceIds.join(",")}] -> [${edge.targetIds.join(",")}]`);
        let activeTargets = [...edge.targetIds];
        if (edge.type === "EVOLVE") {
          const re = this.tracker.metrics().reynoldsNumber;
          const maxRe = parseFloat(edge.properties.max_re || "0.7");
          if (re > maxRe) {
            const targetCount = Math.max(1, Math.floor(activeTargets.length * (maxRe / re)));
            execLogs.push(`    [EVOLVE] High Pressure (Re=${re.toFixed(2)}). Constricting flow from ${activeTargets.length} to ${targetCount} paths.`);
            activeTargets = activeTargets.slice(0, targetCount);
          } else {
            execLogs.push(`    [EVOLVE] Laminar Flow (Re=${re.toFixed(2)}). Maintaining full superposition.`);
          }
        }
        if (edge.type === "SUPERPOSE") {
          const threshold = parseFloat(edge.properties.p || "1.0");
          activeTargets = activeTargets.filter(() => Math.random() <= threshold);
          if (activeTargets.length === 0) activeTargets = [edge.targetIds[0]];
          execLogs.push(`    [SUPERPOSE] Amplitude p=${threshold}. Active wave-function: [${activeTargets.join(", ")}]`);
        }
        const payloads = Array.isArray(currentPayload) && currentPayload.length === activeTargets.length ? currentPayload : activeTargets.map(() => currentPayload);
        let sharedState = null;
        if (edge.type === "ENTANGLE" || edge.properties.entangled === "true") {
          sharedState = { value: currentPayload, timestamp: Date.now(), metadata: {} };
          execLogs.push(`    [ENTANGLE] Creating shared confluence state for parallel branches.`);
        }
        const workFns = activeTargets.map((id, index) => {
          const tid = id.trim();
          const branchPayload = payloads[index];
          const branchSid = streamCounter++;
          this.tracker.updateStream(branchSid, "active");
          return async () => {
            const node2 = activeAst.nodes.get(tid);
            if (node2) {
              const handler = this.findHandler(node2);
              if (handler) {
                const start = Date.now();
                const result = await handler(branchPayload, node2.properties, sharedState);
                const time = Date.now() - start;
                this.tracker.updateStream(branchSid, "completed");
                return { path: tid, value: result, time };
              }
            }
            this.tracker.updateStream(branchSid, "vented");
            return { path: tid, value: `Simulated Result from ${tid}`, time: 0 };
          };
        });
        const superposition = Pipeline.from(workFns);
        const tunnelEdge = activeAst.edges.find((e) => e.type === "TUNNEL" && e.sourceIds.some((sid2) => activeTargets.map((t) => t.trim()).includes(sid2.trim())));
        if (tunnelEdge) {
          execLogs.push(`  -> Found TUNNEL path: ${tunnelEdge.sourceIds.join("|")} -> ${tunnelEdge.targetIds[0]}`);
        }
        const collapseEdge = activeAst.edges.find(
          (e) => (e.type === "RACE" || e.type === "FOLD" || e.type === "COLLAPSE") && e.sourceIds.some((sid2) => activeTargets.map((t) => t.trim()).includes(sid2.trim()))
        );
        if (!collapseEdge) {
          execLogs.push(`Pipeline suspended in superposition. No collapse found.`);
          break;
        }
        const collapseAuthorization = this.authorizeEdge(collapseEdge, currentNodeId, currentPayload);
        if (!collapseAuthorization.allowed) {
          execLogs.push(`  [AUTH] Denied ${collapseEdge.type}: ${collapseAuthorization.reason}`);
          this.tracker.updateStream(sid, "vented");
          break;
        }
        await this.notifyEdgeEvaluated(collapseEdge);
        if (collapseEdge.type === "RACE") {
          execLogs.push(`   Racing paths: [${collapseEdge.sourceIds.join(", ")}]`);
          const { result } = await superposition.race();
          execLogs.push(`   Race concluded! Winner: ${result.path}`);
          currentPayload = result.value;
        } else {
          execLogs.push(`   Folding paths: [${collapseEdge.sourceIds.join(", ")}]`);
          currentPayload = await superposition.fold({
            type: "merge-all",
            merge: /* @__PURE__ */ __name((results) => {
              const values = Array.from(results.values()).map((r) => r.value);
              if (Array.isArray(values[0]) && typeof values[0][0] === "number") {
                return values[0].map(
                  (_, i) => values.reduce((acc, v) => acc + (v[i] || 0), 0)
                );
              }
              const merged = {};
              Array.from(results.values()).forEach((r) => {
                merged[r.path] = r.value;
              });
              return merged;
            }, "merge")
          });
          execLogs.push(`   Folded result: ${JSON.stringify(currentPayload).substring(0, 50)}...`);
        }
        currentNodeId = collapseEdge.targetIds[0].trim();
        continue;
      }
      if (edge.type === "VENT") {
        execLogs.push(`  -> VENTING path: ${edge.sourceIds[0]}`);
      }
      currentNodeId = edge.targetIds[0].trim();
    }
    execLogs.push(`Final System Result: ${JSON.stringify(currentPayload)}`);
    return execLogs.join("\n");
  }
  findHandler(node) {
    for (const label of node.labels) {
      const handler = this.registry.getHandler(label);
      if (handler) return handler;
    }
    return null;
  }
  extractExecutionAuth(payload) {
    if (typeof payload !== "object" || payload === null) {
      return null;
    }
    const record = payload;
    if (typeof record.executionAuth !== "object" || record.executionAuth === null) {
      return null;
    }
    const executionAuth = record.executionAuth;
    const capabilities = Array.isArray(executionAuth.capabilities) ? executionAuth.capabilities : [];
    return {
      enforce: executionAuth.enforce === true,
      principal: typeof executionAuth.principal === "string" ? executionAuth.principal : void 0,
      token: typeof executionAuth.token === "string" ? executionAuth.token : void 0,
      capabilities
    };
  }
  authorizeEdge(edge, currentNodeId, payload) {
    const executionAuth = this.extractExecutionAuth(payload);
    if (!executionAuth || executionAuth.enforce !== true) {
      return { allowed: true };
    }
    const sourceId = edge.sourceIds[0]?.trim() || currentNodeId;
    const targetIds = edge.targetIds.map((targetId) => targetId.trim());
    return authorizeTopologyEdge({
      edgeType: edge.type,
      sourceId,
      targetIds,
      auth: executionAuth
    });
  }
  async notifyEdgeEvaluated(edge) {
    if (!this.onEdgeEvaluated) {
      return;
    }
    await this.onEdgeEvaluated(edge);
  }
};

// ../../open-source/gnosis/src/runtime/native-runtime.ts
init_performance2();
var FLOW_FLAG_FORK = 1;
var FLOW_FLAG_RACE = 2;
var FLOW_FLAG_FOLD = 4;
var FLOW_FLAG_VENT = 8;
var FLOW_FLAG_INTERFERE = 32;
var FLOW_HEADER_SIZE = 10;
var FLOW_STREAM_ID = 1;
var GnosisNativeRuntime = class {
  static {
    __name(this, "GnosisNativeRuntime");
  }
  wasmRuntime = null;
  initAttempted = false;
  initPromise = null;
  sequence = 1;
  edgesProcessed = 0;
  fallbackPaths = 1;
  fallbackBeta1 = 0;
  fallbackTrace = [];
  async onEdge(edge) {
    const flags = this.edgeTypeToFlags(edge.type);
    if (flags === null) {
      return;
    }
    await this.ensureInitialized();
    const payload = new TextEncoder().encode(
      JSON.stringify({
        edge: edge.type,
        sourceCount: edge.sourceIds.length,
        targetCount: edge.targetIds.length
      })
    );
    const sequence = this.sequence;
    const frame = this.encodeFlowFrame(sequence, flags, payload);
    this.sequence += 1;
    if (this.wasmRuntime) {
      try {
        this.wasmRuntime.process_frame(frame);
      } catch (error) {
        this.fallbackTrace.push(
          `[native] process_frame failed: ${this.errorMessage(error)}`
        );
        this.wasmRuntime = null;
        this.applyFallback(sequence, flags, edge.type);
      }
    } else {
      this.applyFallback(sequence, flags, edge.type);
    }
    this.edgesProcessed += 1;
  }
  async processEdges(edges) {
    for (const edge of edges) {
      await this.onEdge(edge);
    }
    return this.snapshot();
  }
  snapshot() {
    const wasmEnabled = this.wasmRuntime !== null;
    const metrics = wasmEnabled ? this.safeWasmMetrics() : `Paths: ${this.fallbackPaths}, Beta1: ${this.fallbackBeta1}`;
    const trace = wasmEnabled ? this.safeWasmTrace() : this.fallbackTrace.join("\n");
    return {
      wasmEnabled,
      edgesProcessed: this.edgesProcessed,
      metrics,
      trace
    };
  }
  async ensureInitialized() {
    if (this.wasmRuntime || this.initAttempted) {
      return;
    }
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    this.initPromise = this.initializeWasmRuntime();
    await this.initPromise;
    this.initPromise = null;
  }
  async initializeWasmRuntime() {
    this.initAttempted = true;
    try {
      const module = await Promise.resolve().then(() => (init_gnosis_runtime(), gnosis_runtime_exports));
      if (typeof module.default === "function") {
        await module.default();
      }
      if (typeof module.QuantumRuntime === "function") {
        const runtime = new module.QuantumRuntime();
        if (typeof runtime.process_frame === "function") {
          this.wasmRuntime = runtime;
          return;
        }
      }
      this.fallbackTrace.push(
        "[native] gnosis_runtime loaded but QuantumRuntime is unavailable"
      );
    } catch (error) {
      this.fallbackTrace.push(
        `[native] gnosis_runtime unavailable: ${this.errorMessage(error)}`
      );
    }
  }
  edgeTypeToFlags(edgeTypeRaw) {
    const edgeType = edgeTypeRaw.trim().toUpperCase();
    switch (edgeType) {
      case "FORK":
      case "EVOLVE":
      case "SUPERPOSE":
      case "ENTANGLE":
        return FLOW_FLAG_FORK;
      case "RACE":
        return FLOW_FLAG_RACE;
      case "FOLD":
      case "COLLAPSE":
      case "OBSERVE":
        return FLOW_FLAG_FOLD;
      case "VENT":
      case "TUNNEL":
        return FLOW_FLAG_VENT;
      case "INTERFERE":
        return FLOW_FLAG_INTERFERE;
      default:
        return null;
    }
  }
  encodeFlowFrame(sequence, flags, payload) {
    const buffer = new Uint8Array(FLOW_HEADER_SIZE + payload.length);
    const view = new DataView(buffer.buffer);
    view.setUint16(0, FLOW_STREAM_ID, false);
    view.setUint32(2, sequence >>> 0, false);
    view.setUint8(6, flags);
    buffer[7] = payload.length >> 16 & 255;
    buffer[8] = payload.length >> 8 & 255;
    buffer[9] = payload.length & 255;
    buffer.set(payload, FLOW_HEADER_SIZE);
    return buffer;
  }
  applyFallback(sequence, flags, edgeType) {
    this.fallbackTrace.push(
      `Seq:${sequence} Edge:${edgeType} Flags:0x${flags.toString(16).padStart(2, "0")}`
    );
    if ((flags & FLOW_FLAG_FORK) !== 0) {
      this.fallbackBeta1 += 1;
      this.fallbackPaths += 1;
    }
    if ((flags & FLOW_FLAG_RACE) !== 0) {
      this.fallbackPaths = 1;
    }
    if ((flags & FLOW_FLAG_FOLD) !== 0) {
      this.fallbackBeta1 = Math.max(0, this.fallbackBeta1 - 1);
      this.fallbackPaths = 1;
    }
    if ((flags & FLOW_FLAG_VENT) !== 0) {
      this.fallbackBeta1 = Math.max(0, this.fallbackBeta1 - 1);
      this.fallbackPaths = Math.max(0, this.fallbackPaths - 1);
    }
  }
  safeWasmMetrics() {
    if (!this.wasmRuntime) {
      return `Paths: ${this.fallbackPaths}, Beta1: ${this.fallbackBeta1}`;
    }
    try {
      return this.wasmRuntime.metrics();
    } catch (error) {
      this.fallbackTrace.push(
        `[native] metrics() failed: ${this.errorMessage(error)}`
      );
      return `Paths: ${this.fallbackPaths}, Beta1: ${this.fallbackBeta1}`;
    }
  }
  safeWasmTrace() {
    if (!this.wasmRuntime || typeof this.wasmRuntime.get_trace !== "function") {
      return this.fallbackTrace.join("\n");
    }
    try {
      return this.wasmRuntime.get_trace();
    } catch (error) {
      this.fallbackTrace.push(
        `[native] get_trace() failed: ${this.errorMessage(error)}`
      );
      return this.fallbackTrace.join("\n");
    }
  }
  errorMessage(error) {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
};

// ../../shared-ui/src/services/aeon-container/streamed-lint-core.ts
init_performance2();
var MAX_DEFAULT_DIAGNOSTICS = 240;
function lintDocumentCore(input) {
  const diagnostics = [];
  const language = input.language;
  const lines = input.content.split("\n");
  const maxDiagnostics = input.maxDiagnostics > 0 ? input.maxDiagnostics : MAX_DEFAULT_DIAGNOSTICS;
  let engine = "rules";
  let supportsWasm = false;
  if (language === "javascript" || language === "typescript") {
    if (input.parseWithSwc) {
      supportsWasm = true;
      engine = "swc-wasm";
      lintTypeScriptSyntaxWithSwc(diagnostics, input);
    }
    lintTypeScriptRules(diagnostics, lines);
  } else if (language === "go") {
    lintGoRules(diagnostics, lines);
  } else if (language === "python") {
    lintPythonRules(diagnostics, lines);
  } else if (language === "gnosis") {
    lintGnosisRules(diagnostics, lines);
  } else {
    lintGenericRules(diagnostics, lines);
  }
  lintCommonRules(diagnostics, lines);
  lintBracketBalance(diagnostics, input.content);
  const deduped = dedupeDiagnostics(diagnostics).slice(0, maxDiagnostics);
  return {
    diagnostics: deduped.map((diagnostic, index) => ({
      ...diagnostic,
      id: `${diagnostic.code}:${diagnostic.line}:${diagnostic.column}:${index}`
    })),
    engine,
    supportsWasm
  };
}
__name(lintDocumentCore, "lintDocumentCore");
function lintTypeScriptSyntaxWithSwc(diagnostics, input) {
  if (!input.parseWithSwc) return;
  const isTsx = /\.tsx$/i.test(input.path);
  const isJsx = /\.jsx$/i.test(input.path);
  const parserOptions = input.language === "typescript" ? {
    syntax: "typescript",
    tsx: isTsx,
    decorators: true
  } : {
    syntax: "ecmascript",
    jsx: isJsx,
    dynamicImport: true
  };
  try {
    input.parseWithSwc(input.content, parserOptions);
  } catch (error) {
    const message = extractSwcMessage(error);
    const { line, column } = extractSwcPosition(message);
    diagnostics.push({
      line,
      column,
      endLine: line,
      endColumn: column + 1,
      severity: "error",
      source: "swc-wasm",
      code: "SWC_SYNTAX",
      message: extractSwcHeadline(message)
    });
  }
}
__name(lintTypeScriptSyntaxWithSwc, "lintTypeScriptSyntaxWithSwc");
function lintTypeScriptRules(diagnostics, lines) {
  lines.forEach((lineContent, lineIndex) => {
    const lineNumber = lineIndex + 1;
    const consoleIndex = lineContent.indexOf("console.log(");
    if (consoleIndex >= 0) {
      diagnostics.push({
        line: lineNumber,
        column: consoleIndex + 1,
        endLine: lineNumber,
        endColumn: consoleIndex + "console.log".length + 1,
        severity: "warning",
        source: "ts-rules",
        code: "TS_NO_CONSOLE_LOG",
        message: "Avoid console.log in committed code."
      });
    }
    const debuggerIndex = lineContent.indexOf("debugger");
    if (debuggerIndex >= 0) {
      diagnostics.push({
        line: lineNumber,
        column: debuggerIndex + 1,
        endLine: lineNumber,
        endColumn: debuggerIndex + "debugger".length + 1,
        severity: "warning",
        source: "ts-rules",
        code: "TS_NO_DEBUGGER",
        message: "Remove debugger statements before shipping."
      });
    }
    const anyMatch = lineContent.match(/:\s*any\b/);
    if (anyMatch && anyMatch.index !== void 0) {
      diagnostics.push({
        line: lineNumber,
        column: anyMatch.index + 1,
        endLine: lineNumber,
        endColumn: anyMatch.index + anyMatch[0].length + 1,
        severity: "warning",
        source: "ts-rules",
        code: "TS_NO_EXPLICIT_ANY",
        message: "Avoid explicit any; prefer unknown or concrete types."
      });
    }
    const ignoreIndex = lineContent.indexOf("@ts-ignore");
    if (ignoreIndex >= 0) {
      diagnostics.push({
        line: lineNumber,
        column: ignoreIndex + 1,
        endLine: lineNumber,
        endColumn: ignoreIndex + "@ts-ignore".length + 1,
        severity: "warning",
        source: "ts-rules",
        code: "TS_AVOID_IGNORE",
        message: "Prefer a typed fix over @ts-ignore."
      });
    }
  });
}
__name(lintTypeScriptRules, "lintTypeScriptRules");
function lintGoRules(diagnostics, lines) {
  const packageLine = lines.findIndex((line) => /^\s*package\s+\w+/.test(line));
  if (packageLine === -1) {
    diagnostics.push({
      line: 1,
      column: 1,
      endLine: 1,
      endColumn: 8,
      severity: "error",
      source: "go-rules",
      code: "GO_PACKAGE_REQUIRED",
      message: "Go files should declare a package."
    });
  }
  const hasMain = lines.some((line) => /^\s*func\s+main\s*\(/.test(line));
  if (!hasMain && packageLine === 0 && /\bpackage\s+main\b/.test(lines[0] || "")) {
    diagnostics.push({
      line: 1,
      column: 1,
      endLine: 1,
      endColumn: 1,
      severity: "info",
      source: "go-rules",
      code: "GO_MAIN_RECOMMENDED",
      message: "package main usually defines func main()."
    });
  }
  const hasFmtPrint = lines.some(
    (line) => /\bfmt\.(Print|Printf|Println)\s*\(/.test(line)
  );
  const hasFmtImport = lines.some(
    (line) => /(^\s*import\s+"fmt")|(^\s*"fmt"\s*$)/.test(line)
  );
  if (hasFmtPrint && !hasFmtImport) {
    diagnostics.push({
      line: 1,
      column: 1,
      endLine: 1,
      endColumn: 1,
      severity: "warning",
      source: "go-rules",
      code: "GO_FMT_IMPORT",
      message: "fmt print calls detected but fmt import was not found."
    });
  }
  lines.forEach((lineContent, lineIndex) => {
    const tabMatchIndex = lineContent.indexOf("	");
    if (tabMatchIndex >= 0) {
      diagnostics.push({
        line: lineIndex + 1,
        column: tabMatchIndex + 1,
        endLine: lineIndex + 1,
        endColumn: tabMatchIndex + 2,
        severity: "info",
        source: "go-rules",
        code: "GO_GOFMT_TABS",
        message: "Tabs detected; gofmt will normalize indentation."
      });
    }
  });
}
__name(lintGoRules, "lintGoRules");
function lintPythonRules(diagnostics, lines) {
  const blockStarter = /^\s*(def|class|if|elif|else|for|while|try|except|finally|with)\b/;
  lines.forEach((lineContent, lineIndex) => {
    const lineNumber = lineIndex + 1;
    const tabIndex = lineContent.indexOf("	");
    if (tabIndex >= 0) {
      diagnostics.push({
        line: lineNumber,
        column: tabIndex + 1,
        endLine: lineNumber,
        endColumn: tabIndex + 2,
        severity: "error",
        source: "python-rules",
        code: "PY_TABS",
        message: "Tabs in indentation can break Python block parsing."
      });
    }
    const indentMatch = lineContent.match(/^ +/);
    if (indentMatch) {
      const width = indentMatch[0].length;
      if (width % 4 !== 0) {
        diagnostics.push({
          line: lineNumber,
          column: 1,
          endLine: lineNumber,
          endColumn: width + 1,
          severity: "warning",
          source: "python-rules",
          code: "PY_INDENT_MULTIPLE_OF_4",
          message: "Indentation is not a multiple of 4 spaces."
        });
      }
    }
    if (blockStarter.test(lineContent) && !lineContent.trimEnd().endsWith(":") && !lineContent.trimStart().startsWith("#")) {
      diagnostics.push({
        line: lineNumber,
        column: Math.max(1, lineContent.length),
        endLine: lineNumber,
        endColumn: lineContent.length + 1,
        severity: "error",
        source: "python-rules",
        code: "PY_MISSING_COLON",
        message: "Python block statements should end with a colon."
      });
    }
    const printIndex = lineContent.indexOf("print(");
    if (printIndex >= 0) {
      diagnostics.push({
        line: lineNumber,
        column: printIndex + 1,
        endLine: lineNumber,
        endColumn: printIndex + "print".length + 1,
        severity: "info",
        source: "python-rules",
        code: "PY_PRINT_DEBUG",
        message: "print() call detected; confirm this is intentional."
      });
    }
  });
}
__name(lintPythonRules, "lintPythonRules");
function lintGnosisRules(diagnostics, lines) {
  lines.forEach((lineContent, lineIndex) => {
    const lineNumber = lineIndex + 1;
    const imperativeKeywords = [
      "function",
      "return",
      "if",
      "while",
      "var",
      "let",
      "const"
    ];
    imperativeKeywords.forEach((keyword) => {
      const index = lineContent.indexOf(keyword);
      if (index >= 0) {
        diagnostics.push({
          line: lineNumber,
          column: index + 1,
          endLine: lineNumber,
          endColumn: index + keyword.length + 1,
          severity: "error",
          source: "gnosis-rules",
          code: "GNOSIS_IMPERATIVE_REJECTED",
          message: `Imperative keyword '${keyword}' rejected. Use topological graph syntax.`
        });
      }
    });
    if (lineContent.includes(")-[:") && !lineContent.includes("]->(")) {
      diagnostics.push({
        line: lineNumber,
        column: 1,
        endLine: lineNumber,
        endColumn: lineContent.length + 1,
        severity: "warning",
        source: "gnosis-rules",
        code: "GNOSIS_INCOMPLETE_EDGE",
        message: "Incomplete edge declaration detected."
      });
    }
  });
}
__name(lintGnosisRules, "lintGnosisRules");
function lintGenericRules(diagnostics, lines) {
  lines.forEach((lineContent, lineIndex) => {
    const todoIndex = lineContent.indexOf("TODO");
    if (todoIndex >= 0) {
      diagnostics.push({
        line: lineIndex + 1,
        column: todoIndex + 1,
        endLine: lineIndex + 1,
        endColumn: todoIndex + "TODO".length + 1,
        severity: "info",
        source: "generic-rules",
        code: "GENERIC_TODO",
        message: "TODO marker found."
      });
    }
  });
}
__name(lintGenericRules, "lintGenericRules");
function lintCommonRules(diagnostics, lines) {
  lines.forEach((lineContent, lineIndex) => {
    const lineNumber = lineIndex + 1;
    if (/\s+$/.test(lineContent)) {
      diagnostics.push({
        line: lineNumber,
        column: Math.max(1, lineContent.trimEnd().length + 1),
        endLine: lineNumber,
        endColumn: lineContent.length + 1,
        severity: "warning",
        source: "common-rules",
        code: "COMMON_TRAILING_WHITESPACE",
        message: "Trailing whitespace."
      });
    }
    if (lineContent.length > 120) {
      diagnostics.push({
        line: lineNumber,
        column: 121,
        endLine: lineNumber,
        endColumn: lineContent.length + 1,
        severity: "warning",
        source: "common-rules",
        code: "COMMON_LONG_LINE",
        message: "Line exceeds 120 characters."
      });
    }
  });
}
__name(lintCommonRules, "lintCommonRules");
function lintBracketBalance(diagnostics, content) {
  const opening = /* @__PURE__ */ new Set(["(", "[", "{"]);
  const matching = {
    ")": "(",
    "]": "[",
    "}": "{"
  };
  const stack = [];
  let line = 1;
  let column = 0;
  let quote = null;
  let escaped = false;
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === "\n") {
      line += 1;
      column = 0;
      escaped = false;
      continue;
    }
    column += 1;
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === "\\") {
        escaped = true;
        continue;
      }
      if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (opening.has(character)) {
      stack.push({ character, line, column });
      continue;
    }
    if (character in matching) {
      const expectedOpening = matching[character];
      const previous = stack.pop();
      if (!previous || previous.character !== expectedOpening) {
        diagnostics.push({
          line,
          column,
          endLine: line,
          endColumn: column + 1,
          severity: "error",
          source: "common-rules",
          code: "COMMON_BRACKET_MISMATCH",
          message: `Unexpected '${character}'.`
        });
      }
    }
  }
  stack.forEach((entry) => {
    diagnostics.push({
      line: entry.line,
      column: entry.column,
      endLine: entry.line,
      endColumn: entry.column + 1,
      severity: "error",
      source: "common-rules",
      code: "COMMON_BRACKET_UNCLOSED",
      message: `Unclosed '${entry.character}'.`
    });
  });
}
__name(lintBracketBalance, "lintBracketBalance");
function dedupeDiagnostics(diagnostics) {
  const seen = /* @__PURE__ */ new Set();
  const deduped = [];
  const severityRank = {
    error: 0,
    warning: 1,
    info: 2
  };
  diagnostics.slice().sort((a, b) => {
    const severityDelta = severityRank[a.severity] - severityRank[b.severity];
    if (severityDelta !== 0) return severityDelta;
    if (a.line !== b.line) return a.line - b.line;
    if (a.column !== b.column) return a.column - b.column;
    return a.code.localeCompare(b.code);
  }).forEach((diagnostic) => {
    const key = [
      diagnostic.severity,
      diagnostic.line,
      diagnostic.column,
      diagnostic.code,
      diagnostic.message
    ].join("|");
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(diagnostic);
  });
  return deduped;
}
__name(dedupeDiagnostics, "dedupeDiagnostics");
function extractSwcMessage(error) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || String(error);
  return String(error);
}
__name(extractSwcMessage, "extractSwcMessage");
function extractSwcHeadline(message) {
  const line = message.split("\n").map((segment) => segment.trim()).find((segment) => segment.startsWith("x "));
  if (!line) return "Syntax error.";
  return line.replace(/^x\s+/, "");
}
__name(extractSwcHeadline, "extractSwcHeadline");
function extractSwcPosition(message) {
  const lineMatch = message.match(/^\s*(\d+)\s*\|/m);
  const line = lineMatch ? Number.parseInt(lineMatch[1] || "1", 10) : 1;
  const pointerLineMatch = message.match(/^\s*:\s*([ \t]*)\^/m);
  const column = pointerLineMatch ? (pointerLineMatch[1] || "").replace(/\t/g, "    ").length + 1 : 1;
  return { line, column };
}
__name(extractSwcPosition, "extractSwcPosition");

// src/mcp/tools.ts
var PUBLIC_TOOL_DEFINITIONS = [
  {
    name: "gnosis_compile",
    description: "Compile Gnosis source into topology AST and diagnostics.",
    access: "public",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string", description: "Gnosis source code (.gg)." }
      },
      required: ["source"]
    }
  },
  {
    name: "gnosis_lint",
    description: "Run compiler diagnostics plus formal analysis violations for Gnosis source.",
    access: "public",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string" },
        target: {
          type: "string",
          description: "Runtime target: agnostic, workers, node, or bun."
        }
      },
      required: ["source"]
    }
  },
  {
    name: "gnosis_analyze",
    description: "Analyze topology complexity, correctness, and capability requirements for Gnosis.",
    access: "public",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string" },
        target: {
          type: "string",
          description: "Runtime target: agnostic, workers, node, or bun."
        }
      },
      required: ["source"]
    }
  },
  {
    name: "gnosis_verify",
    description: "Verify Gnosis source with formal constraints and optional TLA generation.",
    access: "public",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string" },
        target: { type: "string" },
        maxBuley: { type: "number" },
        emitTla: { type: "boolean" },
        tlaModuleName: { type: "string" },
        sourcePath: { type: "string" }
      },
      required: ["source"]
    }
  },
  {
    name: "gnosis_generate_tla",
    description: "Generate TLA+/CFG from Gnosis source.",
    access: "public",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string" },
        moduleName: { type: "string" },
        sourcePath: { type: "string" }
      },
      required: ["source"]
    }
  },
  {
    name: "gnosis_emit_sarif",
    description: "Generate SARIF output for Gnosis formal checks and capability violations.",
    access: "public",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string" },
        sourcePath: { type: "string" },
        target: { type: "string" },
        maxBuley: { type: "number" }
      },
      required: ["source"]
    }
  },
  {
    name: "gnosis_format",
    description: "Format Gnosis source into canonical style.",
    access: "public",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string" }
      },
      required: ["source"]
    }
  },
  {
    name: "gnosis_to_neo4j_cypher",
    description: "Convert Gnosis source to Neo4j Cypher statements.",
    access: "public",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string" },
        nodeLabel: { type: "string" },
        idPrefix: { type: "string" }
      },
      required: ["source"]
    }
  },
  {
    name: "code_lint_document",
    description: "Run deterministic lint checks against a single source document.",
    access: "public",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        language: { type: "string" },
        source: { type: "string" },
        maxDiagnostics: { type: "number" }
      },
      required: ["source"]
    }
  },
  {
    name: "code_lint_batch",
    description: "Run deterministic lint checks over a batch of documents.",
    access: "public",
    inputSchema: {
      type: "object",
      properties: {
        documents: {
          type: "array",
          description: "Array of { path, language, source } items."
        },
        maxDiagnostics: { type: "number" }
      },
      required: ["documents"]
    }
  }
];
var AUTH_TOOL_DEFINITIONS = [
  {
    name: "gnosis_run",
    description: "Execute compiled Gnosis topology on the interpreted runtime.",
    access: "auth",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string" },
        payload: {}
      },
      required: ["source"]
    }
  },
  {
    name: "gnosis_native_run",
    description: "Execute compiled topology edges through GnosisNativeRuntime flow frames.",
    access: "auth",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string" }
      },
      required: ["source"]
    }
  },
  {
    name: "gnosis_test_file",
    description: "Run a single file verification scenario and return pass/fail with details.",
    access: "auth",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string" },
        target: { type: "string" },
        maxBuley: { type: "number" }
      },
      required: ["source"]
    }
  },
  {
    name: "gnosis_test_suite",
    description: "Run a suite of Gnosis verification cases in one request.",
    access: "auth",
    inputSchema: {
      type: "object",
      properties: {
        tests: {
          type: "array",
          description: "Array of { name, source, maxBuley?, target? }."
        }
      },
      required: ["tests"]
    }
  },
  {
    name: "qdoc_create",
    description: "Create a QDoc collaborative session state.",
    access: "auth",
    inputSchema: {
      type: "object",
      properties: {
        guid: { type: "string" },
        initialGg: { type: "string" }
      }
    }
  },
  {
    name: "qdoc_get_state",
    description: "Read current QDoc state for the active MCP session.",
    access: "auth",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "qdoc_apply_update",
    description: "Apply a base64-encoded QDoc update payload.",
    access: "auth",
    inputSchema: {
      type: "object",
      properties: {
        updateBase64: { type: "string" }
      },
      required: ["updateBase64"]
    }
  },
  {
    name: "qdoc_transact",
    description: "Apply one or more QDoc transactional operations.",
    access: "auth",
    inputSchema: {
      type: "object",
      properties: {
        operations: {
          type: "array",
          description: "QDoc operation list."
        }
      },
      required: ["operations"]
    }
  },
  {
    name: "qdoc_get_delta",
    description: "Get base64 state delta payload for the active QDoc session.",
    access: "auth",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "dashrelay_connect_qdoc",
    description: "Attach QDoc session metadata to DashRelay endpoint/room configuration.",
    access: "auth",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        roomName: { type: "string" },
        apiKey: { type: "string" },
        clientId: { type: "string" },
        webtransportUrl: { type: "string" },
        discoveryUrl: { type: "string" },
        ephemeral: { type: "boolean" }
      }
    }
  },
  {
    name: "dashrelay_status",
    description: "Inspect DashRelay linkage state for the active QDoc session.",
    access: "auth",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "dashrelay_disconnect",
    description: "Mark DashRelay linkage disconnected for the active session.",
    access: "auth",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "gnosis_forge_deploy",
    description: "Trigger an Aeon Forge deploy hook for the current Gnosis workspace.",
    access: "auth",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: { type: "string" },
        branch: { type: "string" },
        tag: { type: "string" },
        notes: { type: "string" },
        dryRun: { type: "boolean" },
        metadata: { type: "object" }
      }
    }
  }
];
var GNOSIS_MCP_TOOLS = [
  ...PUBLIC_TOOL_DEFINITIONS,
  ...AUTH_TOOL_DEFINITIONS
];
var TOOL_BY_NAME = new Map(
  GNOSIS_MCP_TOOLS.map((tool) => [tool.name, tool])
);
var PUBLIC_TOOL_NAMES = new Set(
  PUBLIC_TOOL_DEFINITIONS.map((tool) => tool.name)
);
var AUTH_TOOL_NAMES = new Set(
  AUTH_TOOL_DEFINITIONS.map((tool) => tool.name)
);
function getToolByName(name) {
  return TOOL_BY_NAME.get(name) ?? null;
}
__name(getToolByName, "getToolByName");
function requiredString(args, key) {
  const value = args[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required and must be a non-empty string.`);
  }
  return value;
}
__name(requiredString, "requiredString");
function optionalString(args, key) {
  const value = args[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
__name(optionalString, "optionalString");
function optionalNumber(args, key) {
  const value = args[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
}
__name(optionalNumber, "optionalNumber");
function optionalBoolean(args, key) {
  const value = args[key];
  return typeof value === "boolean" ? value : null;
}
__name(optionalBoolean, "optionalBoolean");
function parseRuntimeTarget(value) {
  if (typeof value !== "string") {
    return "agnostic";
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "agnostic" || normalized === "workers" || normalized === "node" || normalized === "bun") {
    return normalized;
  }
  return "agnostic";
}
__name(parseRuntimeTarget, "parseRuntimeTarget");
function serializeAst(ast) {
  if (!ast) {
    return null;
  }
  return {
    nodes: Array.from(ast.nodes.values()),
    edges: ast.edges
  };
}
__name(serializeAst, "serializeAst");
function buildToolPayload(value, isError = false) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2)
      }
    ],
    ...isError ? { isError: true } : {}
  };
}
__name(buildToolPayload, "buildToolPayload");
function parseLintLanguage(language, path3) {
  if (language) {
    const normalized = language.trim().toLowerCase();
    if (normalized === "javascript" || normalized === "typescript" || normalized === "go" || normalized === "python" || normalized === "gnosis") {
      return normalized;
    }
  }
  if (path3.endsWith(".ts") || path3.endsWith(".tsx")) {
    return "typescript";
  }
  if (path3.endsWith(".js") || path3.endsWith(".jsx")) {
    return "javascript";
  }
  if (path3.endsWith(".go")) {
    return "go";
  }
  if (path3.endsWith(".py")) {
    return "python";
  }
  if (path3.endsWith(".gg")) {
    return "gnosis";
  }
  return "gnosis";
}
__name(parseLintLanguage, "parseLintLanguage");
function resolvePublicRateLimit(env) {
  const raw2 = env.PUBLIC_TOOL_RATE_LIMIT?.trim();
  const parsed = raw2 ? Number.parseInt(raw2, 10) : Number.NaN;
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 180;
}
__name(resolvePublicRateLimit, "resolvePublicRateLimit");
async function callDebugSessionDo(env, sessionId, path3, method, body) {
  const debugId = env.DEBUG_SESSION_DO.idFromName(sessionId);
  const stub = env.DEBUG_SESSION_DO.get(debugId);
  const request = new Request(`https://gnosis-debug.internal${path3}`, {
    method,
    headers: body ? { "content-type": "application/json" } : void 0,
    body: body ? JSON.stringify(body) : void 0
  });
  const response = await stub.fetch(request);
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    const message = typeof payload.message === "string" ? payload.message : typeof payload.error === "string" ? payload.error : `Debug session request failed: ${path3}`;
    throw new Error(message);
  }
  return payload;
}
__name(callDebugSessionDo, "callDebugSessionDo");
async function buildVerifyReport(source, target) {
  const compiler = new BettyCompiler();
  compiler.parse(source);
  const compileDiagnostics = compiler.getDiagnostics();
  const report = await analyzeGnosisSource(source, { target });
  const violations = formatGnosisViolations(report.correctness);
  return {
    report,
    violations,
    compileDiagnostics
  };
}
__name(buildVerifyReport, "buildVerifyReport");
async function invokePublicTool(name, args, context) {
  switch (name) {
    case "gnosis_compile": {
      const source = requiredString(args, "source");
      const compiler = new BettyCompiler();
      const parse = compiler.parse(source);
      const diagnostics = compiler.getDiagnostics();
      return buildToolPayload({
        ok: diagnostics.every((diagnostic) => diagnostic.severity !== "error"),
        b1: parse.b1,
        buleyMeasure: parse.buleyMeasure,
        output: parse.output,
        diagnostics,
        ast: serializeAst(parse.ast),
        logs: compiler.getLogs()
      });
    }
    case "gnosis_lint": {
      const source = requiredString(args, "source");
      const target = parseRuntimeTarget(args.target);
      const lintReport = await buildVerifyReport(source, target);
      return buildToolPayload({
        ok: lintReport.violations.length === 0 && lintReport.compileDiagnostics.every(
          (diagnostic) => diagnostic.severity !== "error"
        ) && lintReport.report.capabilities.issues.every(
          (issue) => issue.severity !== "error"
        ),
        target,
        compileDiagnostics: lintReport.compileDiagnostics,
        violations: lintReport.violations,
        capabilityIssues: lintReport.report.capabilities.issues,
        metrics: lintReport.report
      });
    }
    case "gnosis_analyze": {
      const source = requiredString(args, "source");
      const target = parseRuntimeTarget(args.target);
      const report = await analyzeGnosisSource(source, { target });
      return buildToolPayload({
        ok: report.correctness.ok && report.capabilities.ok,
        report
      });
    }
    case "gnosis_verify": {
      const source = requiredString(args, "source");
      const target = parseRuntimeTarget(args.target);
      const maxBuley = optionalNumber(args, "maxBuley");
      const emitTla = optionalBoolean(args, "emitTla") === true;
      const moduleName = optionalString(args, "tlaModuleName");
      const sourcePath = optionalString(args, "sourcePath");
      const { report, violations, compileDiagnostics } = await buildVerifyReport(
        source,
        target
      );
      const capabilityErrors = report.capabilities.issues.filter(
        (issue) => issue.severity === "error"
      );
      const buleyExceeded = typeof maxBuley === "number" ? report.buleyNumber > maxBuley : false;
      const tlaResult = emitTla ? generateTlaFromGnosisSource(source, {
        moduleName: moduleName ?? void 0,
        sourceFilePath: sourcePath ?? void 0
      }) : null;
      const ok = violations.length === 0 && capabilityErrors.length === 0 && !buleyExceeded && compileDiagnostics.every((diagnostic) => diagnostic.severity !== "error");
      return buildToolPayload({
        ok,
        target,
        report,
        compileDiagnostics,
        violations,
        capabilityErrors,
        maxBuley: typeof maxBuley === "number" ? maxBuley : null,
        buleyExceeded,
        tla: tlaResult
      });
    }
    case "gnosis_generate_tla": {
      const source = requiredString(args, "source");
      const moduleName = optionalString(args, "moduleName");
      const sourcePath = optionalString(args, "sourcePath");
      const result = generateTlaFromGnosisSource(source, {
        moduleName: moduleName ?? void 0,
        sourceFilePath: sourcePath ?? void 0
      });
      return buildToolPayload({
        ok: true,
        result
      });
    }
    case "gnosis_emit_sarif": {
      const source = requiredString(args, "source");
      const sourcePath = optionalString(args, "sourcePath") ?? "/virtual/main.gg";
      const target = parseRuntimeTarget(args.target);
      const maxBuley = optionalNumber(args, "maxBuley");
      const { report, violations } = await buildVerifyReport(source, target);
      let sarif;
      try {
        sarif = ggReportToSarif(sourcePath, report, violations, maxBuley);
      } catch {
        sarif = {
          version: "2.1.0",
          runs: [
            {
              tool: {
                driver: {
                  name: "gnosis-gg-lint",
                  informationUri: "https://github.com/affectively-ai/gnosis",
                  rules: []
                }
              },
              results: violations.map((violation, index) => ({
                ruleId: `gnosis.fallback.${index + 1}`,
                level: "error",
                message: { text: violation }
              }))
            }
          ]
        };
      }
      return buildToolPayload({
        ok: true,
        sarif
      });
    }
    case "gnosis_format": {
      const source = requiredString(args, "source");
      const formatter = new GnosisFormatter();
      const formatted = formatter.format(source);
      return buildToolPayload({
        ok: true,
        formatted
      });
    }
    case "gnosis_to_neo4j_cypher": {
      const source = requiredString(args, "source");
      const nodeLabel = optionalString(args, "nodeLabel");
      const idPrefix = optionalString(args, "idPrefix");
      const bridge = new GnosisNeo4jBridge();
      const cypher = bridge.gglToCypher(source, {
        nodeLabel: nodeLabel ?? void 0,
        idPrefix: idPrefix ?? void 0
      });
      return buildToolPayload({
        ok: true,
        cypher
      });
    }
    case "code_lint_document": {
      const source = requiredString(args, "source");
      const path3 = optionalString(args, "path") ?? "/virtual/document.gg";
      const language = parseLintLanguage(optionalString(args, "language"), path3);
      const maxDiagnostics = optionalNumber(args, "maxDiagnostics");
      const lint = lintDocumentCore({
        path: path3,
        language,
        content: source,
        maxDiagnostics: typeof maxDiagnostics === "number" ? Math.max(1, maxDiagnostics) : 260
      });
      const errors = lint.diagnostics.filter((item) => item.severity === "error").length;
      const warnings = lint.diagnostics.filter((item) => item.severity === "warning").length;
      return buildToolPayload({
        ok: errors === 0,
        path: path3,
        language,
        engine: lint.engine,
        supportsWasm: lint.supportsWasm,
        summary: {
          total: lint.diagnostics.length,
          errors,
          warnings
        },
        diagnostics: lint.diagnostics
      });
    }
    case "code_lint_batch": {
      const documentsRaw = args.documents;
      if (!Array.isArray(documentsRaw) || documentsRaw.length === 0) {
        throw new Error("documents must be a non-empty array.");
      }
      const maxDiagnostics = optionalNumber(args, "maxDiagnostics");
      const diagnosticsLimit = typeof maxDiagnostics === "number" ? Math.max(1, maxDiagnostics) : 260;
      const documents = documentsRaw.filter(
        (value) => typeof value === "object" && value !== null && !Array.isArray(value)
      );
      const results = documents.map((document, index) => {
        const source = typeof document.source === "string" ? document.source : "";
        const path3 = typeof document.path === "string" && document.path.trim().length > 0 ? document.path.trim() : `/virtual/document-${index + 1}.gg`;
        const language = parseLintLanguage(
          typeof document.language === "string" ? document.language : null,
          path3
        );
        const lint = lintDocumentCore({
          path: path3,
          language,
          content: source,
          maxDiagnostics: diagnosticsLimit
        });
        const errors = lint.diagnostics.filter(
          (diagnostic) => diagnostic.severity === "error"
        ).length;
        return {
          path: path3,
          language,
          ok: errors === 0,
          engine: lint.engine,
          diagnostics: lint.diagnostics,
          summary: {
            total: lint.diagnostics.length,
            errors,
            warnings: lint.diagnostics.filter(
              (diagnostic) => diagnostic.severity === "warning"
            ).length
          }
        };
      });
      return buildToolPayload({
        ok: results.every((result) => result.ok),
        count: results.length,
        results
      });
    }
    default:
      throw new Error(`Unknown public tool: ${name}`);
  }
}
__name(invokePublicTool, "invokePublicTool");
async function invokeAuthTool(name, args, context) {
  switch (name) {
    case "gnosis_run": {
      const source = requiredString(args, "source");
      const payload = args.payload;
      const compiler = new BettyCompiler();
      const parse = compiler.parse(source);
      if (!parse.ast) {
        return buildToolPayload(
          {
            ok: false,
            error: "compile_failed",
            diagnostics: compiler.getDiagnostics()
          },
          true
        );
      }
      const registry = new GnosisRegistry();
      const engine = new GnosisEngine(registry);
      const output = await engine.execute(parse.ast, payload ?? "MCP_RUN");
      return buildToolPayload({
        ok: true,
        output,
        ast: serializeAst(parse.ast),
        b1: parse.b1,
        buleyMeasure: parse.buleyMeasure,
        diagnostics: compiler.getDiagnostics(),
        logs: compiler.getLogs()
      });
    }
    case "gnosis_native_run": {
      const source = requiredString(args, "source");
      const compiler = new BettyCompiler();
      const parse = compiler.parse(source);
      if (!parse.ast) {
        return buildToolPayload(
          {
            ok: false,
            error: "compile_failed",
            diagnostics: compiler.getDiagnostics()
          },
          true
        );
      }
      const runtime = new GnosisNativeRuntime();
      const snapshot = await runtime.processEdges(parse.ast.edges);
      return buildToolPayload({
        ok: true,
        snapshot,
        diagnostics: compiler.getDiagnostics()
      });
    }
    case "gnosis_test_file": {
      const source = requiredString(args, "source");
      const target = parseRuntimeTarget(args.target);
      const maxBuley = optionalNumber(args, "maxBuley") ?? 10;
      const verify = await buildVerifyReport(source, target);
      const hasCompileErrors = verify.compileDiagnostics.some(
        (diagnostic) => diagnostic.severity === "error"
      );
      const capabilityErrors = verify.report.capabilities.issues.filter(
        (issue) => issue.severity === "error"
      );
      const pass = !hasCompileErrors && verify.violations.length === 0 && capabilityErrors.length === 0 && verify.report.buleyNumber <= maxBuley;
      return buildToolPayload({
        ok: pass,
        pass,
        target,
        maxBuley,
        buleyNumber: verify.report.buleyNumber,
        compileDiagnostics: verify.compileDiagnostics,
        violations: verify.violations,
        capabilityErrors
      });
    }
    case "gnosis_test_suite": {
      const testsRaw = args.tests;
      if (!Array.isArray(testsRaw) || testsRaw.length === 0) {
        throw new Error("tests must be a non-empty array.");
      }
      const results = [];
      let passed = 0;
      for (const testCase of testsRaw) {
        if (typeof testCase !== "object" || testCase === null || Array.isArray(testCase)) {
          continue;
        }
        const test = testCase;
        const name2 = typeof test.name === "string" && test.name.trim().length > 0 ? test.name.trim() : `test-${results.length + 1}`;
        const source = typeof test.source === "string" && test.source.trim().length > 0 ? test.source : "";
        const target = parseRuntimeTarget(test.target);
        const maxBuley = typeof test.maxBuley === "number" && Number.isFinite(test.maxBuley) ? test.maxBuley : 10;
        if (source.length === 0) {
          results.push({
            name: name2,
            ok: false,
            error: "missing_source"
          });
          continue;
        }
        const verify = await buildVerifyReport(source, target);
        const hasCompileErrors = verify.compileDiagnostics.some(
          (diagnostic) => diagnostic.severity === "error"
        );
        const capabilityErrors = verify.report.capabilities.issues.filter(
          (issue) => issue.severity === "error"
        );
        const ok = !hasCompileErrors && verify.violations.length === 0 && capabilityErrors.length === 0 && verify.report.buleyNumber <= maxBuley;
        if (ok) {
          passed += 1;
        }
        results.push({
          name: name2,
          ok,
          target,
          maxBuley,
          buleyNumber: verify.report.buleyNumber,
          violations: verify.violations,
          capabilityErrors,
          compileDiagnostics: verify.compileDiagnostics
        });
      }
      return buildToolPayload({
        ok: passed === results.length,
        totals: {
          count: results.length,
          passed,
          failed: results.length - passed
        },
        results
      });
    }
    case "qdoc_create": {
      const result = await callDebugSessionDo(
        context.env,
        context.sessionId,
        "/qdoc/create",
        "POST",
        {
          guid: optionalString(args, "guid") ?? void 0,
          initialGg: optionalString(args, "initialGg") ?? void 0
        }
      );
      return buildToolPayload(result);
    }
    case "qdoc_get_state": {
      const result = await callDebugSessionDo(
        context.env,
        context.sessionId,
        "/qdoc/state",
        "GET"
      );
      return buildToolPayload(result);
    }
    case "qdoc_apply_update": {
      const updateBase64 = requiredString(args, "updateBase64");
      const result = await callDebugSessionDo(
        context.env,
        context.sessionId,
        "/qdoc/apply-update",
        "POST",
        { updateBase64 }
      );
      return buildToolPayload(result);
    }
    case "qdoc_transact": {
      const operations = args.operations;
      if (!Array.isArray(operations) || operations.length === 0) {
        throw new Error("operations must be a non-empty array.");
      }
      const result = await callDebugSessionDo(
        context.env,
        context.sessionId,
        "/qdoc/transact",
        "POST",
        { operations }
      );
      return buildToolPayload(result);
    }
    case "qdoc_get_delta": {
      const result = await callDebugSessionDo(
        context.env,
        context.sessionId,
        "/qdoc/get-delta",
        "GET"
      );
      return buildToolPayload(result);
    }
    case "dashrelay_connect_qdoc": {
      const result = await callDebugSessionDo(
        context.env,
        context.sessionId,
        "/dashrelay/connect",
        "POST",
        {
          url: optionalString(args, "url") ?? context.env.DASH_RELAY_WS_URL,
          roomName: optionalString(args, "roomName") ?? void 0,
          apiKey: optionalString(args, "apiKey") ?? void 0,
          clientId: optionalString(args, "clientId") ?? void 0,
          webtransportUrl: optionalString(args, "webtransportUrl") ?? context.env.DASH_RELAY_WT_URL,
          discoveryUrl: optionalString(args, "discoveryUrl") ?? context.env.DASH_RELAY_DISCOVERY_URL,
          ephemeral: optionalBoolean(args, "ephemeral") ?? true
        }
      );
      return buildToolPayload(result);
    }
    case "dashrelay_status": {
      const result = await callDebugSessionDo(
        context.env,
        context.sessionId,
        "/dashrelay/status",
        "GET"
      );
      return buildToolPayload(result);
    }
    case "dashrelay_disconnect": {
      const result = await callDebugSessionDo(
        context.env,
        context.sessionId,
        "/dashrelay/disconnect",
        "POST"
      );
      return buildToolPayload(result);
    }
    case "gnosis_forge_deploy": {
      const forgeUrlRaw = context.env.AEON_FORGE_DEPLOY_URL?.trim() ?? "";
      const dryRun = optionalBoolean(args, "dryRun") === true;
      const payload = {
        projectPath: optionalString(args, "projectPath") ?? ".",
        branch: optionalString(args, "branch") ?? "main",
        tag: optionalString(args, "tag") ?? null,
        notes: optionalString(args, "notes") ?? null,
        metadata: typeof args.metadata === "object" && args.metadata !== null && !Array.isArray(args.metadata) ? args.metadata : {},
        requestedAt: (/* @__PURE__ */ new Date()).toISOString(),
        sessionId: context.sessionId
      };
      if (dryRun) {
        return buildToolPayload({
          ok: true,
          dryRun: true,
          forgeUrl: forgeUrlRaw.length > 0 ? forgeUrlRaw : null,
          payload
        });
      }
      if (forgeUrlRaw.length === 0) {
        return buildToolPayload(
          {
            ok: false,
            error: "forge_url_not_configured",
            message: "AEON_FORGE_DEPLOY_URL is not configured for this environment.",
            payload
          },
          true
        );
      }
      const headers = new Headers({
        "content-type": "application/json"
      });
      if (context.authToken) {
        headers.set("authorization", `Bearer ${context.authToken}`);
      }
      const response = await fetch(forgeUrlRaw, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const raw2 = await response.text();
      const parsedBody = parseJsonMaybe(raw2);
      return buildToolPayload({
        ok: response.ok,
        status: response.status,
        body: parsedBody
      }, !response.ok);
    }
    default:
      throw new Error(`Unknown auth tool: ${name}`);
  }
}
__name(invokeAuthTool, "invokeAuthTool");
function parseJsonMaybe(value) {
  if (value.trim().length === 0) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
__name(parseJsonMaybe, "parseJsonMaybe");
async function invokeGnosisTool(name, args, context) {
  if (PUBLIC_TOOL_NAMES.has(name)) {
    return invokePublicTool(name, args, context);
  }
  if (AUTH_TOOL_NAMES.has(name)) {
    return invokeAuthTool(name, args, context);
  }
  return buildToolPayload(
    {
      ok: false,
      error: `Unknown tool: ${name}`
    },
    true
  );
}
__name(invokeGnosisTool, "invokeGnosisTool");
async function consumePublicToolQuota(env, sessionId, toolName) {
  const sessionIdObject = env.MCP_SESSION_DO.idFromName(sessionId);
  const sessionStub = env.MCP_SESSION_DO.get(sessionIdObject);
  const response = await sessionStub.fetch(
    new Request("https://gnosis-mcp.internal/consume-public-quota", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        toolName,
        limitPerHour: resolvePublicRateLimit(env)
      })
    })
  );
  const payload = await response.json();
  return {
    allowed: payload.allowed === true,
    remaining: typeof payload.remaining === "number" && Number.isFinite(payload.remaining) ? payload.remaining : 0,
    limitPerHour: typeof payload.limitPerHour === "number" && Number.isFinite(payload.limitPerHour) ? payload.limitPerHour : resolvePublicRateLimit(env)
  };
}
__name(consumePublicToolQuota, "consumePublicToolQuota");

// src/mcp/resources.ts
init_performance2();
var GNOSIS_MCP_RESOURCES = [
  {
    uri: "gnosis://meta",
    name: "ForkJoin MCP Metadata",
    description: "Server metadata, environment, and deployment defaults.",
    mimeType: "application/json"
  },
  {
    uri: "gnosis://docs-hub",
    name: "Gnosis Documentation Hub",
    description: "Primary links for Gnosis, Aeon, Aeon Flux, Aeon Container, and Aeon Forge docs.",
    mimeType: "application/json"
  },
  {
    uri: "gnosis://legal",
    name: "Legal and Policy Surface",
    description: "Privacy, cookies, cookie settings, terms, and colophon routes.",
    mimeType: "application/json"
  },
  {
    uri: "gnosis://dashrelay",
    name: "DashRelay Defaults",
    description: "DashRelay websocket, discovery, and webtransport defaults.",
    mimeType: "application/json"
  },
  {
    uri: "gnosis://tools/public",
    name: "Public Tool Catalog",
    description: "Public compile/lint/analyze/verify and linting tools.",
    mimeType: "application/json"
  },
  {
    uri: "gnosis://tools/auth",
    name: "Auth-Gated Tool Catalog",
    description: "Execution, CRDT, relay, test, and deploy tools requiring auth.",
    mimeType: "application/json"
  },
  {
    uri: "gnosis://routes",
    name: "HTTP Route Catalog",
    description: "Web routes, MCP routes, and discovery endpoints.",
    mimeType: "application/json"
  }
];
function readGnosisResource(uri, env, publicBaseUrl) {
  const normalizedBaseUrl = publicBaseUrl.replace(/\/+$/, "");
  if (uri === "gnosis://meta") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              service: "forkjoin-app",
              protocol: "mcp-json-rpc",
              environment: env.ENVIRONMENT,
              endpoint: `${normalizedBaseUrl}/mcp`,
              sessionHeader: "mcp-session-id",
              hasAuthSecret: typeof env.MCP_AUTH_TOKEN === "string" && env.MCP_AUTH_TOKEN.trim().length > 0,
              publicToolRateLimitPerHour: env.PUBLIC_TOOL_RATE_LIMIT ?? "180"
            },
            null,
            2
          )
        }
      ]
    };
  }
  if (uri === "gnosis://docs-hub") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              web: {
                home: `${normalizedBaseUrl}/`,
                ide: `${normalizedBaseUrl}/ide`,
                repl: `${normalizedBaseUrl}/repl`,
                playground: `${normalizedBaseUrl}/playground`,
                docs: `${normalizedBaseUrl}/docs`
              },
              source: {
                gnosis: "https://github.com/affectively-ai/gnosis",
                aeon: "https://github.com/affectively-ai/aeon",
                aeonFlux: "https://github.com/affectively-ai/aeon-flux",
                aeonContainer: "https://github.com/affectively-ai/aeon-container",
                aeonForge: "https://github.com/affectively-ai/aeon-forge"
              }
            },
            null,
            2
          )
        }
      ]
    };
  }
  if (uri === "gnosis://legal") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              privacy: `${normalizedBaseUrl}/privacy`,
              cookies: `${normalizedBaseUrl}/cookies`,
              cookieSettings: `${normalizedBaseUrl}/cookie-settings`,
              terms: `${normalizedBaseUrl}/terms`,
              colophon: `${normalizedBaseUrl}/colophon`,
              copyright: "All rights reserved."
            },
            null,
            2
          )
        }
      ]
    };
  }
  if (uri === "gnosis://dashrelay") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              relayUrl: env.DASH_RELAY_URL ?? "https://relay.dashrelay.com",
              websocketUrl: env.DASH_RELAY_WS_URL ?? "wss://relay.dashrelay.com/relay/sync",
              webtransportUrl: env.DASH_RELAY_WT_URL ?? "https://relay.dashrelay.com/relay",
              discoveryUrl: env.DASH_RELAY_DISCOVERY_URL ?? "https://relay.dashrelay.com/discovery",
              modes: ["hybrid", "bring-your-own-room", "ephemeral-fallback"]
            },
            null,
            2
          )
        }
      ]
    };
  }
  if (uri === "gnosis://tools/public") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify({ tools: Array.from(PUBLIC_TOOL_NAMES).sort() }, null, 2)
        }
      ]
    };
  }
  if (uri === "gnosis://tools/auth") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              tools: Array.from(AUTH_TOOL_NAMES).sort(),
              authRequired: true
            },
            null,
            2
          )
        }
      ]
    };
  }
  if (uri === "gnosis://routes") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              webRoutes: [
                "/",
                "/ide",
                "/repl",
                "/playground",
                "/docs",
                "/privacy",
                "/cookies",
                "/cookie-settings",
                "/colophon",
                "/terms"
              ],
              apiRoutes: ["/mcp", "/health"],
              discoveryRoutes: [
                "/llms.txt",
                "/llms-full.txt",
                "/skills",
                "/skills.json",
                "/skills/index.json",
                "/skills/:name.md",
                "/.well-known/ai-plugin.json",
                "/.well-known/mcp.json",
                "/.well-known/mcp-manifest.json",
                "/.well-known/agent-card.json",
                "/.well-known/openapi.json",
                "/.well-known/security.txt",
                "/agents.json"
              ]
            },
            null,
            2
          )
        }
      ]
    };
  }
  throw new Error(`Unknown resource: ${uri}`);
}
__name(readGnosisResource, "readGnosisResource");

// src/mcp/manifests.ts
init_performance2();
var MCP_PROTOCOL_VERSION = "2024-11-05";
var SERVER_NAME = "forkjoin-app";
var SERVER_VERSION = "0.1.0";
var GNOSIS_FEATURES = [
  {
    id: "gnosis-analysis",
    name: "Compile and Verify",
    description: "Compile, lint, analyze, verify, generate TLA, and emit SARIF for Gnosis source.",
    tools: [
      "gnosis_compile",
      "gnosis_lint",
      "gnosis_analyze",
      "gnosis_verify",
      "gnosis_generate_tla",
      "gnosis_emit_sarif"
    ],
    resources: ["gnosis://tools/public"]
  },
  {
    id: "gnosis-collaboration",
    name: "QDoc + DashRelay Collaboration",
    description: "Collaborative CRDT sessions via QDoc operations and DashRelay session metadata.",
    tools: [
      "qdoc_create",
      "qdoc_get_state",
      "qdoc_apply_update",
      "qdoc_transact",
      "qdoc_get_delta",
      "dashrelay_connect_qdoc",
      "dashrelay_status",
      "dashrelay_disconnect"
    ],
    resources: ["gnosis://dashrelay"]
  },
  {
    id: "gnosis-runtime-and-deploy",
    name: "Runtime and Deploy Hooks",
    description: "Run interpreted/native Gnosis and optionally trigger Aeon Forge deploy hooks.",
    tools: [
      "gnosis_run",
      "gnosis_native_run",
      "gnosis_test_file",
      "gnosis_test_suite",
      "gnosis_forge_deploy"
    ],
    resources: ["gnosis://meta"]
  }
];
var GNOSIS_EXAMPLES = [
  {
    id: "compile-to-sarif",
    prompt: "Compile Gnosis source, verify it against workers target, and return SARIF plus TLA output.",
    outcome: "Static analysis + formal verification artifacts in one pass."
  },
  {
    id: "collaborative-qdoc-flow",
    prompt: "Create a QDoc session, apply map/text operations, inspect state, and publish relay room metadata.",
    outcome: "CRDT collaboration state with relay session continuity."
  },
  {
    id: "forge-deploy-gate",
    prompt: "Run gnosis_test_suite then trigger gnosis_forge_deploy only when all checks pass.",
    outcome: "Deployment hooks gated by verification status."
  }
];
var GNOSIS_SKILLS = [
  {
    id: "gnosis-verification-workbench",
    name: "Gnosis Verification Workbench",
    uri: "skill://forkjoin-app/verification-workbench",
    description: "Compile, lint, verify, generate TLA, and emit SARIF in a single verification workflow.",
    tools: [
      "gnosis_compile",
      "gnosis_lint",
      "gnosis_verify",
      "gnosis_generate_tla",
      "gnosis_emit_sarif"
    ],
    tags: ["gnosis", "verification", "tla", "sarif"],
    source: "local"
  },
  {
    id: "gnosis-crdt-collab",
    name: "Gnosis CRDT Collaboration",
    uri: "skill://forkjoin-app/crdt-collab",
    description: "Create and update QDoc collaborative state, then bridge metadata to DashRelay sessions.",
    tools: [
      "qdoc_create",
      "qdoc_transact",
      "qdoc_get_state",
      "qdoc_get_delta",
      "dashrelay_connect_qdoc",
      "dashrelay_status"
    ],
    tags: ["gnosis", "crdt", "qdoc", "dashrelay"],
    source: "local"
  },
  {
    id: "gnosis-runtime-to-forge",
    name: "Runtime to Forge Deploy",
    uri: "skill://forkjoin-app/runtime-to-forge",
    description: "Execute/test gnosis programs and trigger Aeon Forge deploy hooks when authorized.",
    tools: [
      "gnosis_run",
      "gnosis_native_run",
      "gnosis_test_file",
      "gnosis_test_suite",
      "gnosis_forge_deploy"
    ],
    tags: ["gnosis", "runtime", "deploy", "forge"],
    source: "local"
  }
];
function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}
__name(normalizeBaseUrl, "normalizeBaseUrl");
function resolvePublicBaseUrl(request, configured) {
  if (typeof configured === "string" && configured.trim().length > 0) {
    return normalizeBaseUrl(configured.trim());
  }
  const url = new URL(request.url);
  return url.origin;
}
__name(resolvePublicBaseUrl, "resolvePublicBaseUrl");
function buildDiscoveryEndpoints(request, configuredBaseUrl) {
  const origin = resolvePublicBaseUrl(request, configuredBaseUrl);
  return {
    origin,
    mcp: `${origin}/mcp`,
    llms: `${origin}/llms.txt`,
    llmsFull: `${origin}/llms-full.txt`,
    skills: `${origin}/skills`,
    skillsIndex: `${origin}/skills/index.json`,
    agents: `${origin}/agents.json`,
    aiPlugin: `${origin}/.well-known/ai-plugin.json`,
    mcpWellKnown: `${origin}/.well-known/mcp.json`,
    mcpManifest: `${origin}/.well-known/mcp-manifest.json`,
    agentCard: `${origin}/.well-known/agent-card.json`,
    openApi: `${origin}/.well-known/openapi.json`,
    security: `${origin}/.well-known/security.txt`
  };
}
__name(buildDiscoveryEndpoints, "buildDiscoveryEndpoints");
function buildLlmsTxt(endpoints) {
  const publicTools = GNOSIS_MCP_TOOLS.filter((tool) => tool.access === "public");
  const authTools = GNOSIS_MCP_TOOLS.filter((tool) => tool.access === "auth");
  return [
    "# ForkJoin Unified Programming + MCP Platform",
    "",
    "Model Context Protocol endpoint for compile/lint/verify tooling, CRDT collaboration, and deploy hooks.",
    "",
    `MCP endpoint: ${endpoints.mcp}`,
    `Skills index: ${endpoints.skillsIndex}`,
    `Agent manifest: ${endpoints.agents}`,
    "",
    `Public tools (${publicTools.length}):`,
    ...publicTools.map((tool) => `- ${tool.name}`),
    "",
    `Auth tools (${authTools.length}):`,
    ...authTools.map((tool) => `- ${tool.name}`),
    "",
    "Web routes:",
    "- /",
    "- /ide",
    "- /repl",
    "- /playground",
    "- /docs"
  ].join("\n");
}
__name(buildLlmsTxt, "buildLlmsTxt");
function buildLlmsFullTxt(endpoints) {
  return [
    "# ForkJoin MCP Full Metadata",
    "",
    `Name: ${SERVER_NAME}`,
    `Version: ${SERVER_VERSION}`,
    `Protocol: ${MCP_PROTOCOL_VERSION}`,
    "",
    `MCP: ${endpoints.mcp}`,
    `LLMS: ${endpoints.llms}`,
    `LLMS Full: ${endpoints.llmsFull}`,
    `Skills: ${endpoints.skills}`,
    `Skills Index: ${endpoints.skillsIndex}`,
    `Agents: ${endpoints.agents}`,
    `AI Plugin: ${endpoints.aiPlugin}`,
    `MCP Manifest: ${endpoints.mcpWellKnown}`,
    `MCP Marketing: ${endpoints.mcpManifest}`,
    `Agent Card: ${endpoints.agentCard}`,
    `OpenAPI: ${endpoints.openApi}`,
    `Security: ${endpoints.security}`,
    "",
    "Features:",
    ...GNOSIS_FEATURES.map((feature) => `- ${feature.name}: ${feature.description}`),
    "",
    "Examples:",
    ...GNOSIS_EXAMPLES.map((example) => `- ${example.prompt}`)
  ].join("\n");
}
__name(buildLlmsFullTxt, "buildLlmsFullTxt");
function buildMcpWellKnownManifest(endpoints) {
  return {
    id: SERVER_NAME,
    name: "ForkJoin MCP",
    version: SERVER_VERSION,
    protocolVersion: MCP_PROTOCOL_VERSION,
    endpoint: endpoints.mcp,
    llms: endpoints.llms,
    skills: endpoints.skillsIndex,
    agents: endpoints.agents,
    toolCount: GNOSIS_MCP_TOOLS.length,
    capabilities: {
      tools: true,
      resources: true
    },
    features: GNOSIS_FEATURES
  };
}
__name(buildMcpWellKnownManifest, "buildMcpWellKnownManifest");
function buildMcpMarketingManifest(endpoints) {
  return {
    schema_version: "1.0",
    server: {
      name: SERVER_NAME,
      version: SERVER_VERSION
    },
    endpoint: endpoints.mcp,
    protocol_version: MCP_PROTOCOL_VERSION,
    transport: "http",
    discovery: {
      llms: endpoints.llms,
      llmsFull: endpoints.llmsFull,
      skills: endpoints.skillsIndex,
      agents: endpoints.agents,
      manifest: endpoints.mcpWellKnown,
      agentCard: endpoints.agentCard,
      openApi: endpoints.openApi,
      aiPlugin: endpoints.aiPlugin,
      security: endpoints.security
    },
    features: GNOSIS_FEATURES,
    examples: GNOSIS_EXAMPLES
  };
}
__name(buildMcpMarketingManifest, "buildMcpMarketingManifest");
function buildAgentCardManifest(endpoints) {
  return {
    id: "forkjoin-app-agent-card",
    name: "ForkJoin",
    description: "Unified programming site + MCP surface for Gnosis language, CRDT collaboration, and deploy hooks.",
    url: endpoints.origin,
    protocol: "mcp",
    endpoint: endpoints.mcp,
    capabilities: {
      tools: GNOSIS_MCP_TOOLS.map((tool) => tool.name),
      protocols: ["mcp"],
      integrations: ["aeon-container-ide", "aeon-forge", "dashrelay"]
    },
    authentication: {
      schemes: ["bearer"],
      optionalForPublicTools: true
    },
    featured_skills: GNOSIS_SKILLS.slice(0, 2).map((skill) => skill.id)
  };
}
__name(buildAgentCardManifest, "buildAgentCardManifest");
function buildAgentsManifest(endpoints) {
  return {
    schema_version: "1.0.0",
    name: SERVER_NAME,
    description: "ForkJoin MCP server for compile/lint/verify/TLA/SARIF, CRDT collaboration, DashRelay sessioning, and deploy hooks.",
    endpoints: {
      mcp: endpoints.mcp,
      llms: endpoints.llms,
      llmsFull: endpoints.llmsFull,
      skills: endpoints.skillsIndex,
      manifest: endpoints.mcpWellKnown,
      agentCard: endpoints.agentCard,
      openApi: endpoints.openApi,
      security: endpoints.security
    },
    capabilities: GNOSIS_FEATURES,
    examples: GNOSIS_EXAMPLES,
    onboarding: {
      initialize: {
        method: "POST",
        endpoint: endpoints.mcp
      },
      listToolsMethod: "tools/list",
      callToolMethod: "tools/call",
      listResourcesMethod: "resources/list",
      readResourceMethod: "resources/read"
    }
  };
}
__name(buildAgentsManifest, "buildAgentsManifest");
function buildAiPluginManifest(endpoints) {
  return {
    schema_version: "v1",
    name_for_human: "ForkJoin MCP",
    name_for_model: SERVER_NAME,
    description_for_human: "Gnosis compile/verify + CRDT collaboration + deploy hooks over MCP.",
    description_for_model: "Model Context Protocol server with public analysis tools and auth-gated execution/collaboration/deploy tools.",
    auth: {
      type: "service_http",
      authorization_type: "bearer"
    },
    api: {
      type: "openapi",
      url: endpoints.openApi,
      is_user_authenticated: false
    },
    logo_url: `${endpoints.origin}/favicon.ico`,
    contact_email: "support@forkjoin.ai",
    legal_info_url: `${endpoints.origin}/terms`
  };
}
__name(buildAiPluginManifest, "buildAiPluginManifest");
function buildOpenApiManifest(endpoints) {
  return {
    openapi: "3.1.0",
    info: {
      title: "ForkJoin MCP API",
      version: SERVER_VERSION,
      description: "Discovery + MCP JSON-RPC endpoint for the unified forkjoin-app worker."
    },
    servers: [
      {
        url: endpoints.origin
      }
    ],
    paths: {
      "/health": {
        get: {
          operationId: "getHealth",
          summary: "Get worker health details.",
          responses: {
            "200": {
              description: "Service health payload."
            }
          }
        }
      },
      "/mcp": {
        get: {
          operationId: "getMcpInfo",
          summary: "Get MCP endpoint summary.",
          responses: {
            "200": {
              description: "MCP endpoint metadata."
            }
          }
        },
        post: {
          operationId: "postMcpJsonRpc",
          summary: "Send MCP JSON-RPC request.",
          responses: {
            "200": {
              description: "MCP JSON-RPC response."
            }
          }
        }
      },
      "/llms.txt": {
        get: {
          operationId: "getLlmsTxt",
          summary: "Return llms onboarding text.",
          responses: {
            "200": {
              description: "Plain text response."
            }
          }
        }
      },
      "/llms-full.txt": {
        get: {
          operationId: "getLlmsFullTxt",
          summary: "Return full llms metadata text.",
          responses: {
            "200": {
              description: "Plain text response."
            }
          }
        }
      },
      "/agents.json": {
        get: {
          operationId: "getAgentsManifest",
          summary: "Return agent manifest.",
          responses: {
            "200": {
              description: "Agent manifest JSON."
            }
          }
        }
      },
      "/skills": {
        get: {
          operationId: "getSkills",
          summary: "Return MCP skill list payload.",
          responses: {
            "200": {
              description: "Skills list JSON."
            }
          }
        }
      },
      "/skills/index.json": {
        get: {
          operationId: "getSkillsIndex",
          summary: "Return public skills index manifest.",
          responses: {
            "200": {
              description: "Skills index JSON."
            }
          }
        }
      },
      "/.well-known/mcp.json": {
        get: {
          operationId: "getMcpWellKnown",
          summary: "Return machine-readable MCP manifest.",
          responses: {
            "200": {
              description: "MCP manifest JSON."
            }
          }
        }
      },
      "/.well-known/mcp-manifest.json": {
        get: {
          operationId: "getMcpMarketingManifest",
          summary: "Return marketing manifest for MCP listing.",
          responses: {
            "200": {
              description: "Marketing manifest JSON."
            }
          }
        }
      },
      "/.well-known/agent-card.json": {
        get: {
          operationId: "getAgentCard",
          summary: "Return agent card metadata.",
          responses: {
            "200": {
              description: "Agent card JSON."
            }
          }
        }
      },
      "/.well-known/openapi.json": {
        get: {
          operationId: "getOpenApi",
          summary: "Return OpenAPI manifest.",
          responses: {
            "200": {
              description: "OpenAPI JSON."
            }
          }
        }
      },
      "/.well-known/security.txt": {
        get: {
          operationId: "getSecurityTxt",
          summary: "Return security disclosure metadata.",
          responses: {
            "200": {
              description: "Security text payload."
            }
          }
        }
      }
    }
  };
}
__name(buildOpenApiManifest, "buildOpenApiManifest");
function buildSecurityTxt(endpoints) {
  const expiresAt = new Date(Date.now() + 1e3 * 60 * 60 * 24 * 365).toISOString();
  return [
    "Contact: mailto:security@forkjoin.ai",
    `Canonical: ${endpoints.security}`,
    `Policy: ${endpoints.origin}/terms`,
    "Preferred-Languages: en",
    `Expires: ${expiresAt}`
  ].join("\n");
}
__name(buildSecurityTxt, "buildSecurityTxt");

// src/worker.ts
var MCP_PROTOCOL_VERSION2 = "2024-11-05";
var MCP_SERVER_NAME = "forkjoin-app";
var MCP_SERVER_VERSION = "0.1.0";
var MCP_SESSION_HEADER = "mcp-session-id";
var DISCOVERY_CACHE_CONTROL = "public, max-age=3600, s-maxage=86400";
var WEB_ROUTES = /* @__PURE__ */ new Set([
  "/",
  "/ide",
  "/repl",
  "/playground",
  "/docs",
  "/privacy",
  "/cookies",
  "/cookie-settings",
  "/colophon",
  "/terms"
]);
var app = new Hono2();
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", MCP_SESSION_HEADER],
    exposeHeaders: [MCP_SESSION_HEADER],
    maxAge: 86400
  })
);
app.get("/health", async (c) => {
  const sessionId = parseSessionId(c.req.raw);
  let sessionSummary = null;
  if (sessionId) {
    sessionSummary = await getSessionSummarySafe(c.env, sessionId);
  }
  return json(
    {
      status: "healthy",
      service: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
      environment: c.env.ENVIRONMENT,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      mcp: {
        endpoint: "/mcp",
        sessionHeader: MCP_SESSION_HEADER,
        toolCount: GNOSIS_MCP_TOOLS.length,
        publicTools: Array.from(PUBLIC_TOOL_NAMES).sort(),
        authTools: Array.from(AUTH_TOOL_NAMES).sort()
      },
      relay: {
        baseUrl: c.env.DASH_RELAY_URL ?? "https://relay.dashrelay.com",
        ws: c.env.DASH_RELAY_WS_URL ?? "wss://relay.dashrelay.com/relay/sync",
        webtransport: c.env.DASH_RELAY_WT_URL ?? "https://relay.dashrelay.com/relay",
        discovery: c.env.DASH_RELAY_DISCOVERY_URL ?? "https://relay.dashrelay.com/discovery"
      },
      session: sessionSummary
    },
    {
      cacheControl: "public, max-age=30, s-maxage=60"
    }
  );
});
app.get("/session", async (c) => {
  const sessionId = parseSessionId(c.req.raw);
  if (!sessionId) {
    return json(
      {
        ok: false,
        error: "missing_session_id",
        message: `Set ${MCP_SESSION_HEADER} header to inspect session state.`
      },
      {
        status: 400
      }
    );
  }
  const sessionIdObject = c.env.MCP_SESSION_DO.idFromName(sessionId);
  const stub = c.env.MCP_SESSION_DO.get(sessionIdObject);
  const response = await stub.fetch(
    new Request("https://gnosis-mcp.internal/summary")
  );
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
      [MCP_SESSION_HEADER]: sessionId
    }
  });
});
app.get("/mcp", async (c) => {
  const endpoints = buildDiscoveryEndpoints(c.req.raw, c.env.MCP_PUBLIC_BASE_URL);
  return json(
    {
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
      protocolVersion: MCP_PROTOCOL_VERSION2,
      endpoint: endpoints.mcp,
      initializeMethod: "initialize",
      toolsListMethod: "tools/list",
      toolsCallMethod: "tools/call",
      resourcesListMethod: "resources/list",
      resourcesReadMethod: "resources/read",
      sessionHeader: MCP_SESSION_HEADER,
      discovery: {
        llms: endpoints.llms,
        llmsFull: endpoints.llmsFull,
        skills: endpoints.skills,
        skillsIndex: endpoints.skillsIndex,
        agents: endpoints.agents,
        mcp: endpoints.mcpWellKnown,
        mcpManifest: endpoints.mcpManifest,
        agentCard: endpoints.agentCard,
        openApi: endpoints.openApi,
        security: endpoints.security
      }
    },
    {
      cacheControl: DISCOVERY_CACHE_CONTROL
    }
  );
});
app.post("/mcp", async (c) => {
  const body = await parseBody2(c.req.raw);
  if (!body.ok) {
    return json(mcpError(null, -32700, body.error), {
      status: 400
    });
  }
  const parsedRequest = parseMcpRequest(body.value);
  if (!parsedRequest.ok) {
    return json(parsedRequest.error, {
      status: 400
    });
  }
  const sessionId = parseSessionId(c.req.raw);
  const authToken = parseAuthToken(c.req.raw);
  try {
    const result = await handleMcpRequest(
      parsedRequest.request,
      c.env,
      c.req.raw,
      sessionId,
      authToken
    );
    return json(result.payload, {
      sessionId: result.sessionId
    });
  } catch (error) {
    return json(
      mcpError(parsedRequest.request.id, -32603, "Internal error", {
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        sessionId
      }
    );
  }
});
app.get("/llms.txt", (c) => {
  const endpoints = buildDiscoveryEndpoints(c.req.raw, c.env.MCP_PUBLIC_BASE_URL);
  return text(buildLlmsTxt(endpoints), {
    cacheControl: DISCOVERY_CACHE_CONTROL
  });
});
app.get("/llms-full.txt", (c) => {
  const endpoints = buildDiscoveryEndpoints(c.req.raw, c.env.MCP_PUBLIC_BASE_URL);
  return text(buildLlmsFullTxt(endpoints), {
    cacheControl: DISCOVERY_CACHE_CONTROL
  });
});
app.get("/skills", (c) => {
  const endpoints = buildDiscoveryEndpoints(c.req.raw, c.env.MCP_PUBLIC_BASE_URL);
  return json(
    buildSkillsListPayload({
      server: {
        id: MCP_SERVER_NAME,
        name: "ForkJoin MCP",
        version: MCP_SERVER_VERSION
      },
      skills: GNOSIS_SKILLS,
      discovery: {
        endpoint: endpoints.mcp,
        llms: endpoints.llms,
        manifest: endpoints.mcpWellKnown,
        agentCard: endpoints.agentCard
      }
    }),
    {
      cacheControl: DISCOVERY_CACHE_CONTROL
    }
  );
});
app.get("/skills.json", (c) => {
  const endpoints = buildDiscoveryEndpoints(c.req.raw, c.env.MCP_PUBLIC_BASE_URL);
  return json(
    buildSkillsListPayload({
      server: {
        id: MCP_SERVER_NAME,
        name: "ForkJoin MCP",
        version: MCP_SERVER_VERSION
      },
      skills: GNOSIS_SKILLS,
      discovery: {
        endpoint: endpoints.mcp,
        llms: endpoints.llms,
        manifest: endpoints.mcpWellKnown,
        agentCard: endpoints.agentCard
      }
    }),
    {
      cacheControl: DISCOVERY_CACHE_CONTROL
    }
  );
});
app.get("/skills/index.json", (c) => {
  const endpoints = buildDiscoveryEndpoints(c.req.raw, c.env.MCP_PUBLIC_BASE_URL);
  return json(
    buildPublicSkillsIndex({
      server: {
        id: MCP_SERVER_NAME,
        name: "ForkJoin MCP",
        version: MCP_SERVER_VERSION
      },
      discovery: {
        endpoint: endpoints.mcp,
        llms: endpoints.llms,
        manifest: endpoints.mcpWellKnown,
        agentCard: endpoints.agentCard
      },
      skills: GNOSIS_SKILLS,
      featuredSkills: GNOSIS_SKILLS.slice(0, 2).map((skill) => skill.id)
    }),
    {
      cacheControl: DISCOVERY_CACHE_CONTROL
    }
  );
});
app.get("/skills/:name.md", (c) => {
  const skillParam = c.req.param("name");
  if (!skillParam) {
    return json(
      {
        ok: false,
        error: "bad_request",
        message: "Missing skill name parameter."
      },
      {
        status: 400
      }
    );
  }
  const skillName = decodeURIComponent(skillParam);
  const skill = getSkillByName(GNOSIS_SKILLS, skillName);
  if (!skill) {
    return json(
      {
        ok: false,
        error: "not_found",
        message: `Unknown skill: ${skillName}`
      },
      {
        status: 404
      }
    );
  }
  return text(renderSkillMarkdown(skill), {
    cacheControl: DISCOVERY_CACHE_CONTROL,
    contentType: "text/markdown; charset=utf-8"
  });
});
app.get("/agents.json", (c) => {
  const endpoints = buildDiscoveryEndpoints(c.req.raw, c.env.MCP_PUBLIC_BASE_URL);
  return json(buildAgentsManifest(endpoints), {
    cacheControl: DISCOVERY_CACHE_CONTROL
  });
});
app.get("/.well-known/agents.json", (c) => {
  const endpoints = buildDiscoveryEndpoints(c.req.raw, c.env.MCP_PUBLIC_BASE_URL);
  return json(buildAgentsManifest(endpoints), {
    cacheControl: DISCOVERY_CACHE_CONTROL
  });
});
app.get("/.well-known/ai-plugin.json", (c) => {
  const endpoints = buildDiscoveryEndpoints(c.req.raw, c.env.MCP_PUBLIC_BASE_URL);
  return json(buildAiPluginManifest(endpoints), {
    cacheControl: DISCOVERY_CACHE_CONTROL
  });
});
app.get("/.well-known/mcp.json", (c) => {
  const endpoints = buildDiscoveryEndpoints(c.req.raw, c.env.MCP_PUBLIC_BASE_URL);
  return json(buildMcpWellKnownManifest(endpoints), {
    cacheControl: DISCOVERY_CACHE_CONTROL
  });
});
app.get("/.well-known/mcp-manifest.json", (c) => {
  const endpoints = buildDiscoveryEndpoints(c.req.raw, c.env.MCP_PUBLIC_BASE_URL);
  return json(buildMcpMarketingManifest(endpoints), {
    cacheControl: DISCOVERY_CACHE_CONTROL
  });
});
app.get("/.well-known/agent-card.json", (c) => {
  const endpoints = buildDiscoveryEndpoints(c.req.raw, c.env.MCP_PUBLIC_BASE_URL);
  return json(buildAgentCardManifest(endpoints), {
    cacheControl: DISCOVERY_CACHE_CONTROL
  });
});
app.get("/.well-known/openapi.json", (c) => {
  const endpoints = buildDiscoveryEndpoints(c.req.raw, c.env.MCP_PUBLIC_BASE_URL);
  return json(buildOpenApiManifest(endpoints), {
    cacheControl: DISCOVERY_CACHE_CONTROL
  });
});
app.get("/.well-known/security.txt", (c) => {
  const endpoints = buildDiscoveryEndpoints(c.req.raw, c.env.MCP_PUBLIC_BASE_URL);
  return text(buildSecurityTxt(endpoints), {
    cacheControl: "public, max-age=86400, s-maxage=86400"
  });
});
app.get("/*", async (c) => {
  const path3 = new URL(c.req.url).pathname;
  const assetResponse = await fetchAssetRoute(c.req.raw, c.env);
  if (assetResponse) {
    return assetResponse;
  }
  if (WEB_ROUTES.has(path3)) {
    return new Response(buildDevelopmentFallbackHtml(path3), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }
  return json(
    {
      ok: false,
      error: "not_found",
      message: `Unknown route: ${path3}`,
      knownWebRoutes: Array.from(WEB_ROUTES)
    },
    {
      status: 404
    }
  );
});
function parseSessionId(request) {
  const raw2 = request.headers.get(MCP_SESSION_HEADER);
  if (!raw2) {
    return null;
  }
  const normalized = raw2.trim();
  return normalized.length > 0 ? normalized : null;
}
__name(parseSessionId, "parseSessionId");
function parseAuthToken(request) {
  const raw2 = request.headers.get("authorization");
  if (!raw2) {
    return null;
  }
  const [scheme, token] = raw2.trim().split(/\s+/, 2);
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }
  const normalized = token.trim();
  return normalized.length > 0 ? normalized : null;
}
__name(parseAuthToken, "parseAuthToken");
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
__name(isRecord, "isRecord");
async function parseBody2(request) {
  try {
    const value = await request.json();
    return { ok: true, value };
  } catch {
    return { ok: false, error: "Parse error: request body must be valid JSON" };
  }
}
__name(parseBody2, "parseBody");
function parseMcpRequest(body) {
  if (!isRecord(body)) {
    return {
      ok: false,
      error: mcpError(null, -32600, "Invalid Request: expected JSON object")
    };
  }
  const jsonrpc = body.jsonrpc;
  const id = body.id;
  const method = body.method;
  if (jsonrpc !== "2.0" || typeof method !== "string" || method.trim().length === 0) {
    return {
      ok: false,
      error: mcpError(
        typeof id === "string" || typeof id === "number" || id === null ? id : null,
        -32600,
        'Invalid Request: jsonrpc must be "2.0" and method must be a non-empty string'
      )
    };
  }
  return {
    ok: true,
    request: {
      jsonrpc: "2.0",
      id: typeof id === "string" || typeof id === "number" || id === null ? id : null,
      method: method.trim(),
      params: isRecord(body.params) ? body.params : void 0
    }
  };
}
__name(parseMcpRequest, "parseMcpRequest");
function mcpError(id, code, message, data) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...data === void 0 ? {} : { data }
    }
  };
}
__name(mcpError, "mcpError");
function stringifyToolResult(result) {
  return {
    content: result.content,
    ...result.isError ? { isError: true } : {}
  };
}
__name(stringifyToolResult, "stringifyToolResult");
function resolveAuthTokenSet(env) {
  const configured = /* @__PURE__ */ new Set();
  if (typeof env.MCP_AUTH_TOKEN === "string") {
    const token = env.MCP_AUTH_TOKEN.trim();
    if (token.length > 0) {
      configured.add(token);
    }
  }
  if (typeof env.MCP_AUTH_TOKENS === "string") {
    env.MCP_AUTH_TOKENS.split(",").map((token) => token.trim()).filter((token) => token.length > 0).forEach((token) => configured.add(token));
  }
  return configured;
}
__name(resolveAuthTokenSet, "resolveAuthTokenSet");
function isAuthTokenValid(token, env) {
  const configured = resolveAuthTokenSet(env);
  if (configured.size === 0) {
    return false;
  }
  if (!token) {
    return false;
  }
  return configured.has(token);
}
__name(isAuthTokenValid, "isAuthTokenValid");
function resolveToolAuthorization(toolName, token, env) {
  if (PUBLIC_TOOL_NAMES.has(toolName)) {
    return {
      allowed: true,
      reason: null,
      requiresAuth: false
    };
  }
  if (!AUTH_TOOL_NAMES.has(toolName)) {
    return {
      allowed: false,
      reason: `Unknown tool: ${toolName}`,
      requiresAuth: false
    };
  }
  if (isAuthTokenValid(token, env)) {
    return {
      allowed: true,
      reason: null,
      requiresAuth: true
    };
  }
  return {
    allowed: false,
    reason: "This tool requires bearer auth. Set MCP_AUTH_TOKEN in request headers.",
    requiresAuth: true
  };
}
__name(resolveToolAuthorization, "resolveToolAuthorization");
async function initializeSession(env, sessionId) {
  const sessionIdObject = env.MCP_SESSION_DO.idFromName(sessionId);
  const stub = env.MCP_SESSION_DO.get(sessionIdObject);
  await stub.fetch(
    new Request("https://gnosis-mcp.internal/initialize", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ sessionId })
    })
  );
}
__name(initializeSession, "initializeSession");
async function recordSessionEvent(env, sessionId, eventType, detail) {
  if (!sessionId) {
    return;
  }
  const sessionIdObject = env.MCP_SESSION_DO.idFromName(sessionId);
  const stub = env.MCP_SESSION_DO.get(sessionIdObject);
  await stub.fetch(
    new Request("https://gnosis-mcp.internal/record", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        type: eventType,
        detail: detail ?? {}
      })
    })
  );
}
__name(recordSessionEvent, "recordSessionEvent");
async function getSessionSummarySafe(env, sessionId) {
  try {
    const sessionIdObject = env.MCP_SESSION_DO.idFromName(sessionId);
    const stub = env.MCP_SESSION_DO.get(sessionIdObject);
    const response = await stub.fetch(
      new Request("https://gnosis-mcp.internal/summary")
    );
    return await response.json();
  } catch {
    return {
      ok: false,
      error: "session_unavailable"
    };
  }
}
__name(getSessionSummarySafe, "getSessionSummarySafe");
async function handleMcpRequest(request, env, rawRequest, existingSessionId, authToken) {
  const { id, method } = request;
  const params = isRecord(request.params) ? request.params : {};
  switch (method) {
    case "initialize": {
      const sessionId = existingSessionId ?? crypto.randomUUID();
      await initializeSession(env, sessionId);
      await recordSessionEvent(env, sessionId, "initialize", {
        protocolVersion: MCP_PROTOCOL_VERSION2
      });
      return {
        sessionId,
        payload: {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: MCP_PROTOCOL_VERSION2,
            serverInfo: {
              name: MCP_SERVER_NAME,
              version: MCP_SERVER_VERSION
            },
            capabilities: {
              tools: {
                listChanged: true
              },
              resources: {
                listChanged: true
              }
            }
          }
        }
      };
    }
    case "tools/list": {
      await recordSessionEvent(env, existingSessionId, "tools/list");
      return {
        sessionId: existingSessionId,
        payload: {
          jsonrpc: "2.0",
          id,
          result: {
            tools: GNOSIS_MCP_TOOLS
          }
        }
      };
    }
    case "tools/call": {
      const toolNameRaw = params.name;
      if (typeof toolNameRaw !== "string" || toolNameRaw.trim().length === 0) {
        return {
          sessionId: existingSessionId,
          payload: mcpError(id, -32602, "Tool name is required.")
        };
      }
      const toolName = toolNameRaw.trim();
      if (!getToolByName(toolName)) {
        return {
          sessionId: existingSessionId,
          payload: mcpError(id, -32602, `Unknown tool: ${toolName}`)
        };
      }
      const authDecision = resolveToolAuthorization(toolName, authToken, env);
      if (!authDecision.allowed) {
        return {
          sessionId: existingSessionId,
          payload: mcpError(id, -32001, authDecision.reason ?? "Not authorized", {
            toolName,
            requiresAuth: authDecision.requiresAuth
          })
        };
      }
      const toolArgs = isRecord(params.arguments) ? { ...params.arguments } : {};
      let quota = null;
      const sessionId = existingSessionId ?? crypto.randomUUID();
      await initializeSession(env, sessionId);
      if (PUBLIC_TOOL_NAMES.has(toolName)) {
        quota = await consumePublicToolQuota(env, sessionId, toolName);
        if (!quota.allowed) {
          return {
            sessionId,
            payload: mcpError(
              id,
              -32011,
              "Public tool quota exceeded for current session window.",
              {
                toolName,
                limitPerHour: quota.limitPerHour,
                remaining: quota.remaining
              }
            )
          };
        }
      }
      const toolResult = await invokeGnosisTool(toolName, toolArgs, {
        env,
        sessionId,
        authToken
      });
      await recordSessionEvent(env, sessionId, "tools/call", {
        toolName,
        access: PUBLIC_TOOL_NAMES.has(toolName) ? "public" : "auth",
        ok: !toolResult.isError
      });
      return {
        sessionId,
        payload: {
          jsonrpc: "2.0",
          id,
          result: {
            ...stringifyToolResult(toolResult),
            ...quota ? {
              quota: {
                limitPerHour: quota.limitPerHour,
                remaining: quota.remaining
              }
            } : {}
          }
        }
      };
    }
    case "resources/list": {
      await recordSessionEvent(env, existingSessionId, "resources/list");
      return {
        sessionId: existingSessionId,
        payload: {
          jsonrpc: "2.0",
          id,
          result: {
            resources: [
              ...GNOSIS_MCP_RESOURCES,
              ...buildSkillResources(GNOSIS_SKILLS)
            ]
          }
        }
      };
    }
    case "resources/read": {
      const uriRaw = params.uri;
      if (typeof uriRaw !== "string" || uriRaw.trim().length === 0) {
        return {
          sessionId: existingSessionId,
          payload: mcpError(id, -32602, "Resource URI is required.")
        };
      }
      const uri = uriRaw.trim();
      const skillResource = readSkillResource(GNOSIS_SKILLS, uri);
      if (skillResource) {
        await recordSessionEvent(env, existingSessionId, "resources/read", { uri });
        return {
          sessionId: existingSessionId,
          payload: {
            jsonrpc: "2.0",
            id,
            result: {
              contents: [
                {
                  uri: skillResource.uri,
                  mimeType: skillResource.mimeType,
                  text: skillResource.text
                }
              ]
            }
          }
        };
      }
      try {
        const publicBaseUrl = resolvePublicBaseUrl(
          rawRequest,
          env.MCP_PUBLIC_BASE_URL
        );
        const resource = readGnosisResource(uri, env, publicBaseUrl);
        await recordSessionEvent(env, existingSessionId, "resources/read", { uri });
        return {
          sessionId: existingSessionId,
          payload: {
            jsonrpc: "2.0",
            id,
            result: resource
          }
        };
      } catch (error) {
        return {
          sessionId: existingSessionId,
          payload: mcpError(
            id,
            -32602,
            error instanceof Error ? error.message : "Unknown resource error"
          )
        };
      }
    }
    case "ping": {
      await recordSessionEvent(env, existingSessionId, "ping");
      return {
        sessionId: existingSessionId,
        payload: {
          jsonrpc: "2.0",
          id,
          result: {
            ok: true,
            now: (/* @__PURE__ */ new Date()).toISOString()
          }
        }
      };
    }
    default: {
      return {
        sessionId: existingSessionId,
        payload: mcpError(id, -32601, `Method not found: ${method}`)
      };
    }
  }
}
__name(handleMcpRequest, "handleMcpRequest");
async function fetchAssetRoute(request, env) {
  if (!env.ASSETS) {
    return null;
  }
  try {
    const direct = await env.ASSETS.fetch(request);
    if (direct.status !== 404) {
      return direct;
    }
    const indexRequest = new Request(new URL("/index.html", request.url).toString(), {
      method: "GET",
      headers: request.headers
    });
    const indexResponse = await env.ASSETS.fetch(indexRequest);
    if (indexResponse.status === 404) {
      return null;
    }
    return indexResponse;
  } catch {
    return null;
  }
}
__name(fetchAssetRoute, "fetchAssetRoute");
function buildDevelopmentFallbackHtml(path3) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ForkJoin (Development)</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        background: radial-gradient(circle at top, #163047 0%, #050910 58%, #020306 100%);
        color: #dce7f5;
      }
      .card {
        max-width: 720px;
        border: 1px solid rgba(173, 208, 255, 0.22);
        background: rgba(8, 16, 28, 0.78);
        padding: 24px;
        border-radius: 16px;
      }
      code { color: #9bd4ff; }
      a { color: #8de7ff; }
    </style>
  </head>
  <body>
    <article class="card">
      <h1>ForkJoin Worker Running</h1>
      <p>Route <code>${escapeHtml(path3)}</code> is available, but static assets are not bound in this environment.</p>
      <p>Run <code>bun run build:client</code> and bind <code>ASSETS</code>, or use Vite dev server at <code>http://127.0.0.1:5196</code>.</p>
      <p>MCP endpoint is live at <a href="/mcp">/mcp</a>.</p>
    </article>
  </body>
</html>`;
}
__name(buildDevelopmentFallbackHtml, "buildDevelopmentFallbackHtml");
function escapeHtml(input) {
  return input.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
__name(escapeHtml, "escapeHtml");
function json(payload, options = {}) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": options.cacheControl ?? "no-store"
  });
  if (options.sessionId) {
    headers.set(MCP_SESSION_HEADER, options.sessionId);
  }
  return new Response(JSON.stringify(payload), {
    status: options.status ?? 200,
    headers
  });
}
__name(json, "json");
function text(payload, options = {}) {
  return new Response(payload, {
    status: options.status ?? 200,
    headers: {
      "content-type": options.contentType ?? "text/plain; charset=utf-8",
      "cache-control": options.cacheControl ?? "no-store"
    }
  });
}
__name(text, "text");
var worker_default = app;
export {
  GnosisDebugSessionDurableObject,
  GnosisMcpSessionDurableObject,
  worker_default as default,
  parseAuthToken,
  parseMcpRequest,
  parseSessionId,
  resolveAuthTokenSet,
  resolveToolAuthorization
};
//# sourceMappingURL=worker.js.map
