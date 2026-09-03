# \_archived/ directory

The `_archived/` directory at the repo root contains historical code removed from the
live application. It is excluded from git tracking (`.gitignore`), TypeScript
compilation (`tsconfig.json`), and ESLint (`eslint.config.mjs`).

**Do not import from `_archived/` in live code.**
**Do not add new files there — use git history for archival instead.**

Sub-projects archived there include: pwa, legacy tax-product routes, store, franchise,
policies, legal, community, creator, and others removed during consolidation.
