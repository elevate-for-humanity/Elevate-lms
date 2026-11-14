/**
 * Give recursive Next.js build cleanup the same retry tolerance as rm -rf.
 *
 * Large App Router builds can leave an empty child directory visible for a
 * few milliseconds on overlay/container filesystems. Node's fs.rm defaults to
 * zero retries, so Next can fail after successfully generating every page.
 * This preserves real errors while retrying only recursive removals.
 */
const fs = require('node:fs');

const originalRm = fs.promises.rm.bind(fs.promises);

fs.promises.rm = (target, options = {}) => {
  if (!options?.recursive) return originalRm(target, options);

  return originalRm(target, {
    maxRetries: 5,
    retryDelay: 100,
    ...options,
  });
};
