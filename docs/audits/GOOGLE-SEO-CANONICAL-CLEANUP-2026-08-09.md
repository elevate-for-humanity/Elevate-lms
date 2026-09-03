# Google SEO canonical cleanup — 2026-08-09

Production target: `https://www.elevateforhumanity.org`

Implemented in this branch:

- Google-facing favicon now prefers the canonical 192x192 and 512x512 Elevate logo assets, with the ICO retained only as a fallback.
- Marketing PWA manifest no longer references `admin-*` icon assets; it uses the canonical local Elevate icon set.
- Homepage publishes canonical Organization and WebSite JSON-LD using the same `www` host and 512x512 logo.
- Removed the placeholder SearchAction from WebSite structured data because the current `/search` route is not a real search implementation.
- Organization social profile URLs are aligned with the public footer.
- Marketing sitemap contains canonical public Marketing pages only; redirect-only `/host-shop` URLs were removed.
- Removed synthetic `lastModified: new Date()` values from the sitemap so every URL is not falsely reported as changed on every sitemap request.
- `elevateforhumanity.org/*` permanently redirects in one hop to `www.elevateforhumanity.org/*`.
- Historical Marketing paths that belong to Admin/LMS use permanent one-hop cross-service redirects.
- Duplicate `/legal/privacy` content was consolidated into canonical `/privacy` with a permanent redirect.
- `/terms` is an explicitly non-indexed permanent redirect to canonical `/legal`.
- Footer and legal-hub links now point directly to canonical destinations instead of creating internal redirect hops.

Crawler policy remains in `apps/marketing/app/robots.ts`: public pages are crawlable, private/auth/API surfaces are disallowed, and the canonical sitemap is declared at `https://www.elevateforhumanity.org/sitemap.xml`.
