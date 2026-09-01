#!/usr/bin/env tsx
/** Verify Browser/Admin linkage without exposing the shared credential. */
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

const projectId = resolveProjectId();
const browserServiceId =
  process.env.NORTHFLANK_STUDIO_BROWSER_SERVICE_ID || 'elevate-studio-browser';
const adminServiceId = process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin';
if (!projectId) throw new Error('Set NORTHFLANK_PROJECT_ID');

type Service = { runtimeEnvironment?: Record<string, string> };
const [browser, admin] = await Promise.all([
  nfFetch<Service>(projectApiPath(projectId, `/services/${browserServiceId}`)),
  nfFetch<Service>(projectApiPath(projectId, `/services/${adminServiceId}`)),
]);
const browserEnv = browser.runtimeEnvironment ?? {};
const adminEnv = admin.runtimeEnvironment ?? {};
const expectedUrl = adminEnv.STUDIO_BROWSER_URL;

const failures = [
  !expectedUrl && 'Admin STUDIO_BROWSER_URL is missing',
  adminEnv.STUDIO_BROWSER_PUBLIC_URL !== expectedUrl && 'Admin public Browser URL is inconsistent',
  adminEnv.NEXT_PUBLIC_STUDIO_BROWSER_URL !== expectedUrl &&
    'Admin client Browser URL is inconsistent',
  !adminEnv.STUDIO_BROWSER_SECRET && 'Admin Browser credential is missing',
  adminEnv.STUDIO_BROWSER_SECRET !== browserEnv.STUDIO_BROWSER_SECRET &&
    'Browser/Admin credentials do not match',
].filter(Boolean);

if (failures.length) throw new Error(failures.join('; '));
console.log(`Studio Browser linkage verified for ${adminServiceId} and ${browserServiceId}.`);
