#!/usr/bin/env tsx
/** Reuse the deployed Studio Browser credential; create one only on first provision. */
import crypto from 'node:crypto';
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

const projectId = resolveProjectId();
const serviceId = process.env.NORTHFLANK_STUDIO_BROWSER_SERVICE_ID || 'elevate-studio-browser';
if (!projectId) throw new Error('Set NORTHFLANK_PROJECT_ID');

let existing = '';
try {
  const service = await nfFetch<{ runtimeEnvironment?: Record<string, string> }>(
    projectApiPath(projectId, `/services/${serviceId}`),
  );
  existing = service.runtimeEnvironment?.STUDIO_BROWSER_SECRET?.trim() || '';
} catch {
  // The first provision does not have a service to inspect yet.
}

process.stdout.write(existing || crypto.randomBytes(48).toString('base64url'));
