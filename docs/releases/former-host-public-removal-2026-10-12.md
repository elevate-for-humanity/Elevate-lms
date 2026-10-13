# the former host shop public removal — release verification

This release note tracks previously committed changes on `main` that retire the former host shop from Elevate public promotion. It does not itself remove the remaining cloud-hosted assets.

## Required production verification

- Deploy the latest `main` commit to `elevate-marketing-migration` in `elegant-racer-299721`, `us-central1`.
- Confirm public host-shop profile and related metadata no longer publish the former host shop.
- Confirm sitemap.xml excludes all former-shop shop URLs.
- Confirm the former public image and video URLs return 404 or 410, including CDN and previous revision routes.
- Confirm no Elevate homepage, partner directory, or barber showcase promotes the former shop.
- Check public database-backed listings, generated JSON-LD, Open Graph metadata, and AI-readable content.
- Verify Google Cloud Run serves the deployed commit and perform health checks.
- Submit Google Search Console and Bing Webmaster removals for affected Elevate-controlled URLs after verifying source removal.
- Preserve private apprenticeship records and do not modify the shop's independent Google Business Profile.

## Known outstanding items

Cloud deployment, third-party removals, cloud-storage deletion, and search-console submissions require separate verified execution. Do not mark these complete based on a GitHub merge alone.
