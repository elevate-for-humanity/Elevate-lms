# BUFFER POLYFILL - SIDE-BY-SIDE AUDIT

**Date:** 2026-08-01
**Issue:** `buffer is not defined` browser error in marketing app (layout-4d1c44065dc94db2.js:1:7135)
**Root Cause:** Missing webpack buffer polyfill for @react-pdf/renderer in marketing and lms apps

---

## SIDE-BY-SIDE COMPARISON

### ADMIN APP (Already Fixed)

```javascript
// apps/admin/next.config.mjs - Lines 74-87
if (!isServer) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    buffer: require.resolve('buffer/'),
  };
  config.plugins = config.plugins || [];
  config.plugins.push(
    new (require('webpack').ProvidePlugin)({
      Buffer: ['buffer', 'Buffer'],
      buffer: 'buffer',
    })
  );
}
```

### MARKETING APP - BEFORE FIX (Broken)

```javascript
// apps/marketing/next.config.mjs - Line 1-47 (BEFORE)
webpack: (config) => {
  // NO webpack configuration - missing buffer polyfill!
}
```

### MARKETING APP - AFTER FIX (Fixed)

```javascript
// apps/marketing/next.config.mjs - Lines 24-43 (AFTER)
webpack(config, { isServer }) {
  config.resolve.alias['@'] = ROOT;
  config.parallelism = 1;
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer/'),
    };
    config.plugins = config.plugins || [];
    config.plugins.push(
      new (require('webpack').ProvidePlugin)({
        Buffer: ['buffer', 'Buffer'],
        buffer: 'buffer',
      }),
    );
  }
  return config;
}
```

### LMS APP - BEFORE FIX (Broken)

```javascript
// apps/lms/next.config.mjs - Lines 55-62 (BEFORE)
webpack: (config) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': resolve(__dirname, '../..'),
  };
  return config;
}
```

### LMS APP - AFTER FIX (Fixed)

```javascript
// apps/lms/next.config.mjs - Lines 55-76 (AFTER)
webpack: (config, { isServer }) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': resolve(__dirname, '../..'),
  };
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer/'),
    };
    config.plugins = config.plugins || [];
    config.plugins.push(
      new (require('webpack').ProvidePlugin)({
        Buffer: ['buffer', 'Buffer'],
        buffer: 'buffer',
      }),
    );
  }
  return config;
}
```

---

## ROOT CAUSE ANALYSIS

### Problematic Libraries

1. **@react-pdf/renderer** (v4.3.1)
   - Used in: `lib/curriculum/export/pdf-exporter.tsx`
   - Dependencies: `@react-pdf/textkit` which uses Node.js `Buffer`

2. **@webcontainer/api**
   - Used in: `components/studio/WebContainerSandbox.tsx`
   - Requires buffer for browser sandbox environment

### Why This Breaks

The `buffer` npm package provides a browser-compatible implementation of Node.js `Buffer` class. When webpack bundles for browser without the polyfill:

```javascript
// Browser tries to use Buffer from buffer package
// But buffer isn't resolved, causing:
ReferenceError: buffer is not defined
```

---

## FILES MODIFIED

### 1. `package.json`
Added `buffer` as direct dependency:
```bash
npm install buffer --legacy-peer-deps
```

### 2. `next.config.mjs` (Root)
Updated webpack configuration to include buffer polyfill:
```javascript
if (!isServer) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    net: false,
    tls: false,
    child_process: false,
    buffer: require.resolve('buffer/'),  // ADDED
  };
  config.plugins = config.plugins || [];
  config.plugins.push(
    new (require('webpack').ProvidePlugin)({
      Buffer: ['buffer', 'Buffer'],     // ADDED
      buffer: 'buffer',                  // ADDED
    }),
  );
}
```

### 3. `apps/marketing/next.config.mjs`
Added complete webpack configuration with buffer polyfill

### 4. `apps/lms/next.config.mjs`
Extended existing webpack configuration with buffer polyfill

---

## DEPLOYMENT STEPS

1. Rebuild all apps:
   ```bash
   pnpm build:marketing
   pnpm build:admin
   pnpm build:lms
   ```

2. Deploy to production (via GitHub Actions or manual)

3. Clear browser cache:
   - Chrome DevTools → Application → Service Workers → Unregister
   - Application → Storage → Clear site data
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

4. Verify fix:
   - Open browser console on affected pages
   - `buffer is not defined` error should be gone
