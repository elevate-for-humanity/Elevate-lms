'use client';

// Browser polyfills - buffer npm package IS installed and bundled
// This runs BEFORE any other client code to ensure Buffer is available globally

import { Buffer } from 'buffer';

// Ensure Buffer is available globally BEFORE any other code runs
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

// Also expose lowercase 'buffer' global for packages that use it
if (typeof globalThis.buffer === 'undefined') {
  globalThis.buffer = { Buffer };
}

// Ensure process is available globally for packages that expect it
if (typeof globalThis.process === 'undefined') {
  // Client bundles only require the environment bag. Keeping this local avoids
  // a dependency on the deprecated `process/browser` shim.
  Reflect.set(globalThis, 'process', { env: {} });
}

// Sync Supabase localStorage session to cookies for SSR
function syncSupabaseSessionToCookies() {
  try {
    const k = 'sb-cuxzzpsyufcewtmicszk-auth-token';
    const s = localStorage.getItem(k);
    if (!s) return;
    const sess = JSON.parse(s);
    if (!sess?.access_token) return;
    document.cookie =
      k +
      '=' +
      encodeURIComponent(JSON.stringify(sess)) +
      '; max-age=' +
      14 * 24 * 60 * 60 +
      '; path=/; SameSite=Lax';
  } catch {
    // ignore - localStorage may be unavailable in some environments
  }
}
syncSupabaseSessionToCookies();
