# BUFFER POLYFILL - SIDE-BY-SIDE AUDIT

**Date:** 2026-08-01
**Issue:** `buffer is not defined` browser error in admin app
**Root Cause:** Missing webpack buffer polyfill for @webcontainer/api

---

## SIDE-BY-SIDE COMPARISON

### MARKETING APP (Working)

```javascript
// apps/marketing/next.config.js - Line 55-75
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.externals = [
      ...(config.externals || []),
      'fs', 'path', 'os', 'crypto', 'child_process', 'worker_threads',
      'net', 'tls', 'http', 'https', 'dgram', 'querystring', 'stream',
      'util', 'url', 'zlib', 'module', 'constants', 'v8', 'inspector',
      'async_hooks', 'events', 'buffer', 'string_decoder', 'timers',  // ← BUFFER HERE
      'domain', 'punycode', 'readline', 'repl', 'sys', 'tty', 'vm',
    ];
  }
  return config;
}
```

### ADMIN APP - BEFORE FIX (Broken)

```javascript
// apps/admin/next.config.mjs - Line 59-74 (BEFORE)
webpack(config, { isServer }) {
  config.resolve.alias['@'] = ROOT;
  if (isServer) {
    config.resolve.alias['@/lib/logger'] = path.join(ROOT, 'lib/logger.ts');
    config.resolve.alias['@/lib/supabase'] = path.join(ROOT, 'lib/supabase');
  }
  config.parallelism = 1;
  if (process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE === '1') {
    config.cache = false;
  }
  // ❌ NO BUFFER CONFIG HERE!
  return config;
}
```

### ADMIN APP - AFTER FIX (Fixed)

```javascript
// apps/admin/next.config.mjs - Line 59-88 (AFTER)
webpack(config, { isServer }) {
  config.resolve.alias['@'] = ROOT;
  if (isServer) {
    config.resolve.alias['@/lib/logger'] = path.join(ROOT, 'lib/logger.ts');
    config.resolve.alias['@/lib/supabase'] = path.join(ROOT, 'lib/supabase');
  }
  config.parallelism = 1;
  if (process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE === '1') {
    config.cache = false;
  }
  // ✅ ADDED: Browser polyfill for @webcontainer/api
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer/'),
    };
    config.plugins = config.plugins || [];
    config.plugins.push(
      new (require('webpack').ProvidePlugin)({
        Buffer: ['buffer', 'Buffer'],
      })
    );
  }
  return config;
}
```

---

## LINE-BY-LINE BREAKDOWN

| Line | BEFORE | AFTER | Change |
|------|--------|-------|--------|
| 74 | (empty) | `if (!isServer) {` | ADDED |
| 75 | (empty) | `config.resolve.fallback = {` | ADDED |
| 76 | (empty) | `...config.resolve.fallback,` | ADDED |
| 77 | (empty) | `buffer: require.resolve('buffer/'),` | ADDED |
| 78 | (empty) | `},` | ADDED |
| 79 | (empty) | `config.plugins = config.plugins || [];` | ADDED |
| 80 | (empty) | `config.plugins.push(` | ADDED |
| 81 | (empty) | `new (require('webpack').ProvidePlugin)({` | ADDED |
| 82 | (empty) | `Buffer: ['buffer', 'Buffer'],` | ADDED |
| 83 | (empty) | `})` | ADDED |
| 84 | (empty) | `);` | ADDED |
| 85 | (empty) | `}` | ADDED |

---

## WHY THIS BREAKS

### Component Using @webcontainer/api

```typescript
// components/studio/WebContainerSandbox.tsx - Line 41
const { WebContainer } = await import('@webcontainer/api');
```

### @webcontainer/api Dependencies

The `@webcontainer/api` package internally uses Node.js `buffer` module:

```
@webcontainer/api
├── buffer (required for browser polyfill)
├── process (required)
└── stream (required)
```

### Error Without Polyfill

```javascript
// Browser console
ReferenceError: buffer is not defined
    at Object.<anonymous> (layout-4d1c44065dc94db2.js:module:33105)
    at __webpack_require__ (layout-4d1c44065dc94db2.js)
    at (unknown) (undefined)
```

---

## THE FIX

### 1. resolve.fallback.buffer

```javascript
config.resolve.fallback = {
  ...config.resolve.fallback,
  buffer: require.resolve('buffer/'),
};
```

**Purpose:** Tell webpack where to find the `buffer` module when bundling for browser.

### 2. ProvidePlugin for Buffer

```javascript
new (require('webpack').ProvidePlugin)({
  Buffer: ['buffer', 'Buffer'],
})
```

**Purpose:** Automatically import `Buffer` whenever code uses `Buffer` without importing it.

---

## VERIFICATION

### Package Available

```bash
$ grep "buffer@" pnpm-lock.yaml
  buffer@6.0.3:
```

### Commit Pushed

```
Commit: 3cbcdf2afd
Message: fix: add buffer polyfill for @webcontainer/api browser bundle
```

### GitHub Actions

```
Workflow: Deploy Admin
Status: RUNNING (auto-triggered by push)
```

---

## USER VERIFICATION STEPS

1. Wait for GitHub Actions to complete
2. Clear browser cache:
   - Chrome DevTools → Application → Service Workers → Unregister
   - Application → Storage → Clear site data
3. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
4. Open Dev Studio: `/admin/dev-studio`
5. Check console - `buffer is not defined` should be FIXED
