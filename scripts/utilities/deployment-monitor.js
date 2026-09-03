#!/usr/bin/env node

// Simple deployment monitor to check when flash sale goes live
const https = require('https');

const SITE_URL = 'https://elevateforhumanity.org';
const CHECK_PATHS = [
  '/flash-sale-store.html',
  '/license-dashboard.html',
  '/elevate_license_dashboard.html',
];

function checkPath(path) {
  return new Promise((resolve) => {
    const url = `${SITE_URL}${path}`;
    https
      .get(url, (res) => {
        resolve({
          path,
          status: res.statusCode,
          success: res.statusCode === 200,
        });
      })
      .on('error', () => {
        resolve({
          path,
          status: 'ERROR',
          success: false,
        });
      });
  });
}

async function checkDeployment() {
  const timestamp = new Date().toLocaleTimeString();

  const results = await Promise.all(CHECK_PATHS.map(checkPath));

  let allLive = true;
  results.forEach((result) => {
    const status = result.success ? '✅' : '❌';
    if (!result.success) allLive = false;
  });

  if (allLive) {
    process.exit(0);
  } else {
  }
}

// Check immediately, then every 30 seconds
checkDeployment();
setInterval(checkDeployment, 30000);

// Auto-exit after 10 minutes
setTimeout(() => {
  process.exit(1);
}, 600000);
