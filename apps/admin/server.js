/**
 * apps/admin/server.js — Next.js standalone entry (admin ECS task).
 * Studio Shell WebSocket proxy removed — Lizzy uses GitHub API + /api/devstudio/shell (workflows) only.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname);
const port = parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOSTNAME ?? '0.0.0.0';

function loadStandaloneConfig() {
  const existing = process.env.__NEXT_PRIVATE_STANDALONE_CONFIG;
  if (existing && existing !== '{}') {
    return existing;
  }

  const requiredServerFilesPath = path.join(
    dir,
    '.next',
    'required-server-files.json',
  );

  let nextConfig = {};
  try {
    const requiredServerFiles = JSON.parse(
      fs.readFileSync(requiredServerFilesPath, 'utf8'),
    );
    nextConfig = requiredServerFiles.config || {};
  } catch (err) {
    console.warn(
      '[admin] failed to load required-server-files.json; using minimal standalone config:',
      err && err.message ? err.message : err,
    );
  }

  const distDir =
    typeof nextConfig.distDir === 'string' && nextConfig.distDir.length > 0
      ? nextConfig.distDir
      : '.next';

  return JSON.stringify({
    ...nextConfig,
    distDir,
  });
}

process.env.NODE_ENV = 'production';
process.chdir(dir);

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = loadStandaloneConfig();
require('next');

const { startServer } = require('next/dist/server/lib/start-server');

startServer({
  dir,
  isDev: false,
  hostname: host,
  port,
  allowRetry: false,
}).catch((err) => {
  console.error('[admin] startup error:', err);
  process.exit(1);
});
