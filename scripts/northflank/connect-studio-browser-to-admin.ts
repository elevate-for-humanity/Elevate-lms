#!/usr/bin/env tsx
/** Connect the isolated Studio browser runtime to the canonical Admin service. */
import { combinedServicePatchPath, nfFetch, projectApiPath, resolveProjectId } from './lib';

const projectId = resolveProjectId();
const browserServiceId =
  process.env.NORTHFLANK_STUDIO_BROWSER_SERVICE_ID || 'elevate-studio-browser';
const adminServiceId = process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin';
const secret = process.env.STUDIO_BROWSER_SECRET?.trim();

if (!projectId) throw new Error('Set NORTHFLANK_PROJECT_ID');
if (!secret) throw new Error('Set STUDIO_BROWSER_SECRET');

type Service = {
  runtimeEnvironment?: Record<string, string>;
  ports?: Array<{ dns?: string; domains?: Array<{ name?: string } | string> }>;
};

const browser = await nfFetch<Service>(projectApiPath(projectId, `/services/${browserServiceId}`));
const port = browser.ports?.find((candidate) => candidate.dns || candidate.domains?.length);
const domain =
  port?.dns ||
  port?.domains?.map((item) => (typeof item === 'string' ? item : item.name)).find(Boolean);

if (!domain) throw new Error(`No public browser domain is available for ${browserServiceId}`);
const publicUrl = domain.startsWith('http') ? domain : `https://${domain}`;

const admin = await nfFetch<Service>(projectApiPath(projectId, `/services/${adminServiceId}`));
const current = admin.runtimeEnvironment ?? {};
if (
  current.STUDIO_BROWSER_URL === publicUrl &&
  current.STUDIO_BROWSER_PUBLIC_URL === publicUrl &&
  current.NEXT_PUBLIC_STUDIO_BROWSER_URL === publicUrl &&
  current.STUDIO_BROWSER_SECRET === secret
) {
  console.log(
    `Studio Browser is already connected to ${adminServiceId}; no service patch required.`,
  );
  process.exit(0);
}
await nfFetch(combinedServicePatchPath(projectId, adminServiceId), {
  method: 'PATCH',
  body: JSON.stringify({
    runtimeEnvironment: {
      ...current,
      STUDIO_BROWSER_URL: publicUrl,
      STUDIO_BROWSER_PUBLIC_URL: publicUrl,
      NEXT_PUBLIC_STUDIO_BROWSER_URL: publicUrl,
      STUDIO_BROWSER_SECRET: secret,
    },
  }),
});

console.log(`Connected ${browserServiceId} to ${adminServiceId} at ${publicUrl}`);
