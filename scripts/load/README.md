# Load testing (k6)

## `k6-mainflows.js`

Hits marketing pages, `/api/ready`, `/api/health`, and asserts HTML does not contain literal `${PLATFORM_DEFAULTS` leaks.

```bash
# Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
pnpm dev   # in another terminal
k6 run scripts/load/k6-mainflows.js

BASE_URL=https://www.elevateforhumanity.org k6 run --vus 20 --duration 1m scripts/load/k6-mainflows.js
```

For **10k VUs**, use distributed k6 (Grafana Cloud or k6 operator) with ops approval — do not run from a single laptop against production.
