"use client";


// ─────────────────────────────────────────────────────────────
// Sync Supabase session from localStorage → cookies
// so server components can read the session for auth checks.
// Runs before any page component renders.
// ─────────────────────────────────────────────────────────────
function syncSupabaseSessionToCookies() {
  try {
    // Find the Supabase auth token in localStorage.
    // The key format is sb-{project-ref}-auth-token.
    const keys = Object.keys(localStorage).filter(
      (k) => k.startsWith('sb-') && k.endsWith('-auth-token'),
    );
    if (!keys.length) return;

    const SESSION_KEY = keys[0]; // e.g. sb-cuxzzpsyufcewtmicszk-auth-token
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return;

    const session = JSON.parse(stored);
    if (!session?.access_token) return;

    // Write to cookie (14 day expiry, root path, same-site lax)
    const maxAge = 14 * 24 * 60 * 60;
    document.cookie =
      `${SESSION_KEY}=${encodeURIComponent(JSON.stringify(session))}` +
      `; max-age=${maxAge}; path=/; SameSite=Lax`;
  } catch {
    // Ignore errors — non-critical quality-of-life improvement
  }
}

syncSupabaseSessionToCookies();
