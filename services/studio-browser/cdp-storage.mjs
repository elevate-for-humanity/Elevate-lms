// Compatibility with persisted Playwright 1.57 evaluation-value envelopes.
// This implementation has no dependency on its browser/automation runtime.
export function storageCodec() {
  const arrays = {
    i8: Int8Array,
    ui8: Uint8Array,
    ui8c: Uint8ClampedArray,
    i16: Int16Array,
    ui16: Uint16Array,
    i32: Int32Array,
    ui32: Uint32Array,
    f32: Float32Array,
    f64: Float64Array,
    bi64: BigInt64Array,
    bui64: BigUint64Array,
  };
  function decode(value, refs = new Map()) {
    if (value === null || typeof value !== 'object') return value;
    if ('ref' in value) {
      if (!refs.has(value.ref)) throw new Error('INVALID_INDEXEDDB_REFERENCE');
      return refs.get(value.ref);
    }
    if ('v' in value) {
      const special = {
        undefined: undefined,
        null: null,
        NaN: NaN,
        Infinity: Infinity,
        '-Infinity': -Infinity,
        '-0': -0,
      };
      if (!Object.hasOwn(special, value.v)) throw new Error('INVALID_INDEXEDDB_ENCODED_VALUE');
      return special[value.v];
    }
    if ('d' in value) return new Date(value.d);
    if ('u' in value) return new URL(value.u);
    if ('bi' in value) return BigInt(value.bi);
    if ('r' in value) return new RegExp(value.r.p, value.r.f);
    if ('e' in value) {
      const error = new Error(value.e.m);
      error.name = value.e.n;
      error.stack = value.e.s;
      return error;
    }
    if ('ta' in value) {
      const Constructor = arrays[value.ta.k];
      if (!Constructor) throw new Error('UNSUPPORTED_INDEXEDDB_TYPED_ARRAY');
      const binary = atob(value.ta.b),
        bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return new Constructor(bytes.buffer);
    }
    if ('a' in value || 'o' in value) {
      const output = 'a' in value ? [] : {};
      refs.set(value.id, output);
      if ('a' in value) for (const item of value.a) output.push(decode(item, refs));
      else
        for (const { k, v } of value.o)
          Object.defineProperty(output, k, {
            value: decode(v, refs),
            enumerable: true,
            writable: true,
            configurable: true,
          });
      return output;
    }
    throw new Error('UNSUPPORTED_INDEXEDDB_ENCODED_VALUE');
  }
  function encode(value, refs = new Map()) {
    if (value === undefined) return { v: 'undefined' };
    if (value === null) return { v: 'null' };
    if (typeof value === 'number')
      return Number.isFinite(value) && !Object.is(value, -0)
        ? value
        : { v: Object.is(value, -0) ? '-0' : String(value) };
    if (typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'bigint') return { bi: String(value) };
    if (value instanceof Date) return { d: value.toISOString() };
    if (value instanceof RegExp) return { r: { p: value.source, f: value.flags } };
    if (value instanceof Error) return { e: { n: value.name, m: value.message, s: value.stack } };
    if (value instanceof URL) return { u: value.href };
    for (const [kind, Constructor] of Object.entries(arrays))
      if (value instanceof Constructor) {
        let binary = '';
        for (const byte of new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
          binary += String.fromCharCode(byte);
        return { ta: { k: kind, b: btoa(binary) } };
      }
    if (
      !value ||
      typeof value !== 'object' ||
      ![Object.prototype, Array.prototype, null].includes(Object.getPrototypeOf(value))
    )
      throw new Error('UNSUPPORTED_INDEXEDDB_VALUE');
    if (refs.has(value)) return { ref: refs.get(value) };
    const id = refs.size + 1;
    refs.set(value, id);
    if (Array.isArray(value)) return { a: Array.from(value, (item) => encode(item, refs)), id };
    return { o: Object.keys(value).map((k) => ({ k, v: encode(value[k], refs) })), id };
  }
  return { encode, decode };
}
function withCodec(fn) {
  return new Function('arg', `return (${fn.toString()})(arg, (${storageCodec.toString()})());`);
}

// Storage state intentionally retains the existing provider-session-store format.
// Persisted evaluation-value envelopes remain readable without Playwright.
function validateState(state) {
  const validKeyPath = (value) =>
    value == null ||
    typeof value === 'string' ||
    (Array.isArray(value) && value.every((k) => typeof k === 'string'));
  if (!state || !Array.isArray(state.cookies) || !Array.isArray(state.origins))
    throw new Error('INVALID_STORAGE_STATE');
  for (const entry of state.origins) {
    const url = new URL(entry.origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== entry.origin)
      throw new Error('INVALID_STORAGE_ORIGIN');
    if (!Array.isArray(entry.localStorage)) throw new Error('INVALID_LOCAL_STORAGE');
    for (const item of entry.localStorage)
      if (typeof item.name !== 'string' || typeof item.value !== 'string')
        throw new Error('INVALID_LOCAL_STORAGE');
    if (entry.indexedDB !== undefined && !Array.isArray(entry.indexedDB))
      throw new Error('INVALID_INDEXEDDB_STATE');
    for (const db of entry.indexedDB || []) {
      if (
        typeof db.name !== 'string' ||
        !Number.isSafeInteger(db.version) ||
        db.version < 1 ||
        !Array.isArray(db.stores)
      )
        throw new Error('INVALID_INDEXEDDB_SCHEMA');
      for (const store of db.stores) {
        if (
          typeof store.name !== 'string' ||
          !Array.isArray(store.records) ||
          !Array.isArray(store.indexes) ||
          typeof store.autoIncrement !== 'boolean' ||
          !validKeyPath(store.keyPath) ||
          !validKeyPath(store.keyPathArray)
        )
          throw new Error('INVALID_INDEXEDDB_SCHEMA');
        for (const index of store.indexes)
          if (
            typeof index.name !== 'string' ||
            typeof index.unique !== 'boolean' ||
            typeof index.multiEntry !== 'boolean' ||
            !validKeyPath(index.keyPath) ||
            !validKeyPath(index.keyPathArray) ||
            (index.keyPath == null && index.keyPathArray == null)
          )
            throw new Error('INVALID_INDEXEDDB_INDEX');
        for (const record of store.records) {
          for (const field of ['keyEncoded', 'valueEncoded'])
            if (Object.hasOwn(record, field)) storageCodec().decode(record[field]);
          if (
            (!Object.hasOwn(record, 'value') && !Object.hasOwn(record, 'valueEncoded')) ||
            (store.keyPath == null &&
              store.keyPathArray == null &&
              !Object.hasOwn(record, 'key') &&
              !Object.hasOwn(record, 'keyEncoded'))
          )
            throw new Error('INVALID_INDEXEDDB_RECORD');
        }
      }
    }
  }
}

// Executed in the origin's browser realm; self-contained for Runtime.evaluate.
async function readOrigin(includeIndexedDB, codec) {
  const jsonValue = (value, seen = new Set()) => {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value) && !Object.is(value, -0)) return value;
    if (
      typeof value !== 'object' ||
      seen.has(value) ||
      ![Object.prototype, Array.prototype, null].includes(Object.getPrototypeOf(value))
    )
      throw new Error('UNSUPPORTED_INDEXEDDB_VALUE');
    seen.add(value);
    const result = Array.isArray(value) ? [] : {};
    if (Object.getOwnPropertySymbols(value).length) throw new Error('UNSUPPORTED_INDEXEDDB_VALUE');
    if (Array.isArray(value) && Object.keys(value).length !== value.length)
      throw new Error('UNSUPPORTED_INDEXEDDB_VALUE');
    for (const key of Object.keys(value))
      Object.defineProperty(result, key, {
        value: jsonValue(value[key], seen),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    seen.delete(value);
    return result;
  };
  const output = {
    origin: location.origin,
    localStorage: Object.keys(localStorage).map((name) => ({
      name,
      value: localStorage.getItem(name),
    })),
  };
  if (!includeIndexedDB) return output;
  output.indexedDB = [];
  if (typeof indexedDB.databases !== 'function')
    throw new Error('INDEXEDDB_ENUMERATION_UNAVAILABLE');
  for (const info of await indexedDB.databases()) {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(info.name, info.version);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('INDEXEDDB_OPEN_BLOCKED'));
    });
    try {
      const stores = [];
      for (const name of db.objectStoreNames) {
        stores.push(
          await new Promise((resolve, reject) => {
            const transaction = db.transaction(name, 'readonly');
            const store = transaction.objectStore(name);
            const result = {
              name,
              ...(typeof store.keyPath === 'string'
                ? { keyPath: store.keyPath }
                : Array.isArray(store.keyPath)
                  ? { keyPathArray: store.keyPath }
                  : {}),
              autoIncrement: store.autoIncrement,
              indexes: [...store.indexNames].map((name) => {
                const index = store.index(name);
                return {
                  name,
                  ...(typeof index.keyPath === 'string'
                    ? { keyPath: index.keyPath }
                    : { keyPathArray: index.keyPath }),
                  unique: index.unique,
                  multiEntry: index.multiEntry,
                };
              }),
              records: [],
            };
            const cursor = store.openCursor();
            let failure;
            cursor.onsuccess = () => {
              if (!cursor.result) return;
              try {
                const record = {};
                for (const field of store.keyPath === null ? ['key', 'value'] : ['value']) {
                  try {
                    record[field] = jsonValue(cursor.result[field]);
                  } catch {
                    record[field + 'Encoded'] = codec.encode(cursor.result[field]);
                  }
                }
                result.records.push(record);
                cursor.result.continue();
              } catch (error) {
                failure = error;
                transaction.abort();
              }
            };
            transaction.oncomplete = () => resolve(result);
            transaction.onabort = transaction.onerror = () =>
              reject(failure || transaction.error || new Error('INDEXEDDB_READ_FAILED'));
          }),
        );
      }
      output.indexedDB.push({ name: db.name, version: db.version, stores });
    } finally {
      db.close();
    }
  }
  return output;
}

async function writeOrigin(entry, codec) {
  for (const item of entry.localStorage) localStorage.setItem(item.name, item.value);
  for (const source of entry.indexedDB || []) {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(source.name, source.version);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('INDEXEDDB_RESTORE_BLOCKED'));
      request.onupgradeneeded = () => {
        try {
          for (const sourceStore of source.stores) {
            const store = request.result.createObjectStore(sourceStore.name, {
              keyPath: sourceStore.keyPathArray ?? sourceStore.keyPath ?? null,
              autoIncrement: sourceStore.autoIncrement,
            });
            for (const index of sourceStore.indexes)
              store.createIndex(index.name, index.keyPathArray ?? index.keyPath, {
                unique: index.unique,
                multiEntry: index.multiEntry,
              });
          }
        } catch (error) {
          request.transaction.abort();
          reject(error);
        }
      };
      request.onsuccess = () => resolve(request.result);
    });
    try {
      if (source.stores.length)
        await new Promise((resolve, reject) => {
          const transaction = db.transaction(
            source.stores.map((store) => store.name),
            'readwrite',
          );
          transaction.oncomplete = resolve;
          transaction.onabort = transaction.onerror = () =>
            reject(transaction.error || new Error('INDEXEDDB_RESTORE_FAILED'));
          for (const sourceStore of source.stores) {
            const store = transaction.objectStore(sourceStore.name);
            for (const record of sourceStore.records) {
              const value = Object.hasOwn(record, 'value')
                ? record.value
                : codec.decode(record.valueEncoded);
              if (store.keyPath === null)
                store.put(
                  value,
                  Object.hasOwn(record, 'key') ? record.key : codec.decode(record.keyEncoded),
                );
              else store.put(value);
            }
          }
        });
    } finally {
      db.close();
    }
  }
}

export async function captureStorage(context, { indexedDB = false } = {}) {
  const { cookies } = await context.send('Storage.getCookies', { browserContextId: context.id });
  const origins = new Set(context.storageOrigins || []);
  const frames = new Map();
  for (const page of context.pages())
    for (const frame of page.frames()) {
      const url = new URL(frame.url());
      if (['https:', 'http:'].includes(url.protocol)) {
        origins.add(url.origin);
        frames.set(url.origin, frame);
      }
    }
  const states = [];
  for (const origin of origins) {
    const frame = frames.get(origin);
    states.push(
      frame
        ? await frame.evaluate(withCodec(readOrigin), indexedDB)
        : await context.withStorageOrigin(origin, (frame) =>
            frame.evaluate(withCodec(readOrigin), indexedDB),
          ),
    );
  }
  return {
    cookies: cookies.map((cookie) => {
      const { name, value, domain, path, expires, httpOnly, secure, sameSite, partitionKey } =
        cookie;
      // CDP has more cookie metadata than the persisted browser-state contract.
      return {
        name,
        value,
        domain,
        path,
        expires,
        httpOnly,
        secure,
        sameSite: sameSite || 'Lax',
        ...(partitionKey
          ? {
              partitionKey:
                typeof partitionKey === 'string' ? partitionKey : partitionKey.topLevelSite,
              ...(typeof partitionKey === 'object'
                ? { _crHasCrossSiteAncestor: partitionKey.hasCrossSiteAncestor }
                : {}),
            }
          : {}),
      };
    }),
    origins: states,
  };
}

export async function restoreStorage(context, state) {
  validateState(state);
  await context.addCookies(state.cookies);
  for (const entry of state.origins) {
    await context.withStorageOrigin(entry.origin, (frame) =>
      frame.evaluate(withCodec(writeOrigin), entry),
    );
    context.storageOrigins?.add(entry.origin);
  }
}
