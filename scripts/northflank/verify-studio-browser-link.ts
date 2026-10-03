#!/usr/bin/env tsx
/** Verify Browser/Admin linkage without exposing the shared credential. */
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

const projectId = resolveProjectId();
const browserServiceId =
  process.env.NORTHFLANK_STUDIO_BROWSER_SERVICE_ID || 'elevate-studio-browser';
const adminServiceId = process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin';
if (!projectId) throw new Error('Set NORTHFLANK_PROJECT_ID');

type Service = {
  runtimeEnvironment?: Record<string, string>;
};
type NorthflankRecord = Record<string, any>;
function arrayFrom(value: unknown, key?: string): NorthflankRecord[] {
  if (Array.isArray(value)) return value as NorthflankRecord[];
  const object = value as NorthflankRecord | null;
  if (key && Array.isArray(object?.[key])) return object[key] as NorthflankRecord[];
  if (key && Array.isArray(object?.data?.[key])) return object.data[key] as NorthflankRecord[];
  if (Array.isArray(object?.data)) return object.data as NorthflankRecord[];
  return [];
}

const [browser, admin, volumeResponse] = await Promise.all([
  nfFetch<Service>(projectApiPath(projectId, `/services/${browserServiceId}`)),
  nfFetch<Service>(projectApiPath(projectId, `/services/${adminServiceId}`)),
  nfFetch<NorthflankRecord>(projectApiPath(projectId, '/volumes')),
]);
const browserEnv = browser.runtimeEnvironment ?? {};
const adminEnv = admin.runtimeEnvironment ?? {};
const expectedUrl = adminEnv.STUDIO_BROWSER_URL;
const authStateDir = browserEnv.STUDIO_BROWSER_AUTH_STATE_DIR;
const authVolume = arrayFrom(volumeResponse, 'volumes').find(
  (volume) =>
    volume.id === 'elevate-studio-browser-auth' ||
    volume.name === 'elevate-studio-browser-auth',
);
const authVolumeDetail = authVolume?.id
  ? await nfFetch<NorthflankRecord>(
      projectApiPath(projectId, `/volumes/${String(authVolume.id)}`),
    )
  : null;
const authVolumeSizeMb = Number(
  authVolumeDetail?.spec?.storageSize ??
    authVolumeDetail?.data?.spec?.storageSize ??
    authVolume?.spec?.storageSize ??
    0,
);
const attachedObjects = arrayFrom(authVolumeDetail?.attachedObjects).concat(
  arrayFrom(authVolumeDetail?.data?.attachedObjects),
);
const mounts = arrayFrom(authVolumeDetail?.mounts)
  .concat(arrayFrom(authVolumeDetail?.spec?.mounts))
  .concat(arrayFrom(authVolumeDetail?.data?.mounts))
  .concat(arrayFrom(authVolumeDetail?.data?.spec?.mounts));

const failures = [
  !expectedUrl && 'Admin STUDIO_BROWSER_URL is missing',
  adminEnv.STUDIO_BROWSER_PUBLIC_URL !== expectedUrl && 'Admin public Browser URL is inconsistent',
  adminEnv.NEXT_PUBLIC_STUDIO_BROWSER_URL !== expectedUrl &&
    'Admin client Browser URL is inconsistent',
  !adminEnv.STUDIO_BROWSER_SECRET && 'Admin Browser credential is missing',
  adminEnv.STUDIO_BROWSER_SECRET !== browserEnv.STUDIO_BROWSER_SECRET &&
    'Browser/Admin credentials do not match',
  authStateDir !== '/var/lib/studio-browser-auth' &&
    'Browser durable provider-session directory is missing',
  !authVolume && 'Browser durable provider-session volume is missing',
  authVolume && authVolumeSizeMb < 6144 &&
    'Browser durable provider-session volume is below the Northflank 6 GiB minimum',
  authVolume &&
    !attachedObjects.some(
      (attached) => attached.id === browserServiceId && attached.type === 'service',
    ) &&
    'Browser durable provider-session volume is not attached',
  authVolume &&
    !mounts.some((mount) => mount.containerMountPath === '/var/lib/studio-browser-auth') &&
    'Browser durable provider-session volume has the wrong mount path',
].filter(Boolean);

if (failures.length) throw new Error(failures.join('; '));
console.log(`Studio Browser linkage verified for ${adminServiceId} and ${browserServiceId}.`);
