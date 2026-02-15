# Route & Page Completeness Inventory

Date: 2026-02-14

## Summary

| Category | Count |
|---|---|
| Total page.tsx files | 1,480 |
| Total API routes (route.ts) | 924 |
| Admin pages | 277 |
| LMS student pages | 75 |
| Partner portal pages | 9 |
| Public pages | 246 |
| API routes | 916 |

## Classification

| Type | Count | % of Total |
|---|---|---|
| Pages with real DB queries | 700 | 47% |
| Static/content pages (no queries, <50 lines) | 212 | 14% |
| Redirect-only pages (<6 lines) | 76 | 5% |
| Pages with redirect() call (may also have content) | 582 | 39% |
| Stub pages (<10 lines) | 110 | 7% |

## Status

- **REAL**: 700 pages with actual data queries (supabase/fetch/apiGet/apiPost)
- **STATIC CONTENT**: ~212 pages that are informational (no DB needed — marketing, legal, etc.)
- **REDIRECT**: 76 pure redirect pages (canonical URL consolidation)
- **STUB/THIN**: ~110 pages under 10 lines — mix of redirects and minimal content
- **NAV LINKS**: 43 unique hrefs found in navigation components

## Notes

- Many "redirect" pages are intentional URL consolidation (e.g., /terms → /terms-of-service)
- 582 pages contain redirect() but many also have conditional logic (auth checks → redirect if not logged in)
- The 212 static pages include marketing, legal, program descriptions — these are REAL content, not stubs
- Partner portal has 9 pages: dashboard, students, attendance, reports, documents, support, admin/placements, admin/shops, login
