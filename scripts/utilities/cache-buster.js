/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

// Cache Buster for EFH Development

// Force reload assets if cache version changes
function checkCacheVersion() {
  const currentVersion = document.querySelector('meta[name="cache-version"]')?.content;
  const storedVersion = localStorage.getItem('efh-cache-version');

  if (storedVersion && storedVersion !== currentVersion) {
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    localStorage.clear();
    location.reload(true);
  }

  if (currentVersion) {
    localStorage.setItem('efh-cache-version', currentVersion);
  }
}

// Run cache check
checkCacheVersion();

// Development auto-refresh (only if query param present)
if (window.location.search.includes('dev=1')) {
  setInterval(() => {
    fetch('/health')
      .then((r) => r.json())
      .then((data) => {
        const newVersion = data.cacheVersion;
        const currentVersion = document.querySelector('meta[name="cache-version"]')?.content;
        if (newVersion && currentVersion && newVersion !== currentVersion) {
          location.reload();
        }
      })
      .catch(() => {});
  }, 5000);
}
