#!/usr/bin/env tsx
/** Exercise real Chromium in the existing worker without using provider accounts. */
import crypto from 'node:crypto';
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

const projectId = resolveProjectId();
const serviceId = process.env.NORTHFLANK_STUDIO_BROWSER_SERVICE_ID || 'elevate-studio-browser';
const secret = process.env.STUDIO_BROWSER_SECRET;
if (!projectId || !secret) throw new Error('Browser verification configuration is missing');
const service = await nfFetch<{ ports?: Array<{ dns?: string }> }>(
  projectApiPath(projectId, `/services/${serviceId}`),
);
const domain = service.ports?.find((port) => port.dns)?.dns;
if (!domain) throw new Error('Browser public URL is missing');
const url = domain.startsWith('https://') ? domain : `https://${domain}`;
const response = await fetch(`${url.replace(/\/$/, '')}/foundation-test`, {
  method: 'POST',
  headers: { 'x-studio-browser-secret': secret },
  signal: AbortSignal.timeout(120000),
});
const result = await response.json();
const { signature, ...evidence } = result;
const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(evidence)).digest('hex');
if (
  typeof signature !== 'string' ||
  signature.length !== expected.length ||
  !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
)
  throw new Error('Browser evidence signature is invalid');
const required = [
  'keyboard_and_pointer',
  'mobile_viewport_and_screenshot',
  'popup_and_tab_switch',
  'file_picker_and_upload',
  'browser_dialog_response',
  'download_bytes',
  'scroll',
  'navigation_and_history',
];
const checks: Array<{ name: string; passed: boolean; reason?: string }> = evidence.checks || [];
for (const name of required) {
  const check = checks.find((item) => item.name === name);
  console.log(
    `${name}: ${check?.passed ? 'PASS' : 'FAIL'}${check?.reason ? ` (${check.reason})` : ''}`,
  );
}
if (
  !response.ok ||
  evidence.passed !== true ||
  required.some((name) => !checks.some((check) => check.name === name && check.passed))
)
  throw new Error('Browser foundation acceptance failed');
if (process.env.GITHUB_SHA && evidence.commit !== process.env.GITHUB_SHA)
  throw new Error('Browser acceptance ran against the wrong deployment');
console.log(
  `Signed browser foundation acceptance passed at ${evidence.testedAt}, commit ${evidence.commit}.`,
);
