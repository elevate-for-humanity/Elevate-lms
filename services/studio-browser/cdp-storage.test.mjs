import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { captureStorage, restoreStorage, storageCodec } from './cdp-storage.mjs';

function realm(origin, seed = {}) {
  const storage = { ...seed };
  Object.defineProperties(storage, {
    getItem: { value: (key) => storage[key] ?? null },
    setItem: {
      value: (key, value) => {
        storage[key] = value;
      },
    },
  });
  const sandbox = vm.createContext({ location: { origin }, localStorage: storage });
  return {
    storage,
    frame: {
      url: () => origin + '/',
      evaluate: (fn, arg) => vm.runInContext(`(${fn.toString()})(${JSON.stringify(arg)})`, sandbox),
    },
  };
}

test('captures cookies and storage from both active frames and closed origins', async () => {
  const active = realm('https://app.envato.com', { token: 'saved' });
  const closed = realm('https://elements.envato.com', { setting: 'persisted' });
  const state = await captureStorage({
    id: 'isolated-context',
    storageOrigins: new Set(['https://elements.envato.com']),
    send: async (method, params) => {
      assert.equal(method, 'Storage.getCookies');
      assert.equal(params.browserContextId, 'isolated-context');
      return {
        cookies: [
          {
            name: 'session',
            value: 'private',
            domain: '.envato.com',
            path: '/',
            expires: -1,
            httpOnly: true,
            secure: true,
          },
        ],
      };
    },
    pages: () => [{ frames: () => [active.frame] }],
    withStorageOrigin: async (origin, callback) => {
      assert.equal(origin, 'https://elements.envato.com');
      return callback(closed.frame);
    },
  });
  const plain = JSON.parse(JSON.stringify(state));
  assert.equal(plain.cookies[0].sameSite, 'Lax');
  assert.deepEqual(
    plain.origins.map((o) => o.localStorage),
    [[{ name: 'setting', value: 'persisted' }], [{ name: 'token', value: 'saved' }]],
  );
});

test('restores local storage only through isolated origin documents before returning', async () => {
  const target = realm('https://app.envato.com');
  let cookieRestored = false;
  const origins = new Set();
  await restoreStorage(
    {
      storageOrigins: origins,
      addCookies: async (cookies) => {
        assert.deepEqual(cookies, []);
        cookieRestored = true;
      },
      withStorageOrigin: async (origin, callback) => {
        assert.equal(cookieRestored, true);
        assert.equal(origin, 'https://app.envato.com');
        await callback(target.frame);
      },
    },
    {
      cookies: [],
      origins: [
        { origin: 'https://app.envato.com', localStorage: [{ name: 'auth', value: 'session' }] },
      ],
    },
  );
  assert.equal(target.storage.auth, 'session');
  assert.equal(origins.has('https://app.envato.com'), true);
});

test('rejects unsupported encoded IndexedDB state before mutating context', async () => {
  let mutated = false;
  const context = {
    addCookies: async () => {
      mutated = true;
    },
  };
  const state = {
    cookies: [],
    origins: [
      {
        origin: 'https://app.envato.com',
        localStorage: [],
        indexedDB: [
          {
            name: 'auth',
            version: 1,
            stores: [
              {
                name: 'tokens',
                keyPath: null,
                autoIncrement: false,
                indexes: [],
                records: [{ key: 'session', valueEncoded: { unsupported: 'value' } }],
              },
            ],
          },
        ],
      },
    ],
  };
  await assert.rejects(restoreStorage(context, state), /UNSUPPORTED_INDEXEDDB_ENCODED_VALUE/);
  assert.equal(mutated, false);
});

test('rejects invalid storage origins and propagates restoration failures', async () => {
  await assert.rejects(
    restoreStorage({}, { cookies: [], origins: [{ origin: 'file:///private', localStorage: [] }] }),
    /INVALID_STORAGE_ORIGIN/,
  );
  await assert.rejects(
    restoreStorage(
      {
        addCookies: async () => {},
        withStorageOrigin: async () => {
          throw new Error('interception failed');
        },
      },
      { cookies: [], origins: [{ origin: 'https://app.envato.com', localStorage: [] }] },
    ),
    /interception failed/,
  );
});

test('reads persisted Playwright encoded records with dates, binary values and cycles', () => {
  const codec = storageCodec();
  const fixture = {
    id: 1,
    o: [
      { k: 'created', v: { d: '2026-10-04T00:00:00.000Z' } },
      { k: 'token', v: { ta: { k: 'ui8', b: 'AQID' } } },
      { k: 'sequence', v: { bi: '9007199254740993' } },
      { k: 'self', v: { ref: 1 } },
      { k: 'missing', v: { v: 'undefined' } },
    ],
  };
  const value = codec.decode(fixture);
  assert.equal(value.created.toISOString(), '2026-10-04T00:00:00.000Z');
  assert.deepEqual([...value.token], [1, 2, 3]);
  assert.equal(value.sequence, 9007199254740993n);
  assert.equal(value.self, value);
  assert.equal(Object.hasOwn(value, 'missing'), true);
  assert.deepEqual(codec.decode(codec.encode(value)), value);
});

test('codec preserves special numbers and rejects unsupported structured values', () => {
  const codec = storageCodec();
  for (const value of [NaN, Infinity, -Infinity, -0, undefined, null])
    assert.equal(Object.is(codec.decode(codec.encode(value)), value), true);
  assert.throws(() => codec.encode(new Map([['token', 'private']])), /UNSUPPORTED_INDEXEDDB_VALUE/);
  assert.throws(() => codec.decode({ h: 0 }), /UNSUPPORTED_INDEXEDDB_ENCODED_VALUE/);
  assert.throws(() => codec.decode({ ref: 99 }), /INVALID_INDEXEDDB_REFERENCE/);
});
