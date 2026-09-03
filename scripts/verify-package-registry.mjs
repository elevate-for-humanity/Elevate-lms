#!/usr/bin/env node

/**
 * Fail fast when a deployment builder cannot reach the public npm registry.
 *
 * Northflank build failures can otherwise surface later as a generic
 * `pnpm install` failure. This preflight prints the exact registry URL and
 * HTTP status so the operator can distinguish lockfile/package issues from
 * provider/network/registry access issues.
 */

const registry = (process.env.npm_config_registry || 'https://registry.npmjs.org/').replace(
  /\/$/,
  '',
);
const packageName = process.argv[2] || 'next';
const encodedPackageName = packageName.startsWith('@')
  ? `@${encodeURIComponent(packageName.slice(1))}`
  : encodeURIComponent(packageName);
const url = `${registry}/${encodedPackageName}`;

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 15_000);

defineLog('Checking package registry access');
defineLog(`Registry: ${registry}/`);
defineLog(`Package: ${packageName}`);
defineLog(`URL: ${url}`);

try {
  const response = await fetch(url, {
    headers: {
      accept: 'application/vnd.npm.install-v1+json, application/json',
      'user-agent': 'elevate-northflank-registry-preflight/1.0',
    },
    signal: controller.signal,
  });

  if (!response.ok) {
    const body = (await response.text()).slice(0, 500).replace(/\s+/g, ' ').trim();
    console.error(`Registry preflight failed: HTTP ${response.status} ${response.statusText}`);
    if (body) console.error(`Response body: ${body}`);
    console.error(
      'This is a registry/network/auth configuration issue, not a Next.js compile or memory issue.',
    );
    process.exit(1);
  }

  const payload = await response.json();
  const latest = payload?.['dist-tags']?.latest;
  defineLog(`Registry preflight passed${latest ? `; latest ${packageName} is ${latest}` : ''}.`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Registry preflight failed before install: ${message}`);
  console.error(
    'Confirm the builder can reach registry.npmjs.org and does not inject an invalid npm/proxy token.',
  );
  process.exit(1);
} finally {
  clearTimeout(timeout);
}

function defineLog(message) {
  console.log(`[registry-preflight] ${message}`);
}
