# Official blueprint source monitoring

Replace the private no-op provider checks and in-memory pretend versions with one persisted source observation adapter, used by both blueprint entry points.

The adapter requires an approved/active/published `credential_blueprints` record whose `blueprint_code` matches the credential's configured blueprint slug or credential slug. It reads an HTTPS official-provider URL from `source_reference`, rejects arbitrary hosts, credentials and redirects, limits fetched bytes and time, hashes the actual response, and requires a saved observation ID in `blueprint_monitors`.

States describe only what was observed: `baseline_recorded`, `source_unchanged`, or `source_changed`. They do not assert exam currency, course alignment, regulatory approval or completed curriculum review. Source changes require review; they never automatically publish curriculum. Missing source records, failed fetches and failed persistence remain errors with diagnostic codes. The initial baseline recommends review.

Production inspection found only one internal draft blueprint seed, with a descriptive internal source reference, not an approved official URL. The adapter is therefore implemented but cannot perform real provider checks until approved source records are supplied. No source URL, approval or successful provider check was fabricated.

Verification: four source-monitor behavior tests passed; the combined adapter/audit set passed 60 focused tests. Scoped PARIS/route TypeScript and source lint passed. No schema changes, source approvals or live agency submissions were made.
