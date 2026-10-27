#!/usr/bin/env tsx
/** Create/update the isolated open-source Studio browser service. */
import crypto from 'node:crypto';
import {
  combinedServiceCreatePath,
  combinedServicePatchPath,
  nfFetch,
  projectApiPath,
  resolveProjectId,
} from './lib.ts';

const serviceId = process.env.NORTHFLANK_STUDIO_BROWSER_SERVICE_ID || 'elevate-studio-browser';
const authVolumeId =
  process.env.NORTHFLANK_STUDIO_BROWSER_AUTH_VOLUME_ID || 'elevate-studio-browser-auth';
// Northflank's default NVMe class rejects volumes smaller than 6 GiB.
const authVolumeMb = Number(process.env.NORTHFLANK_STUDIO_BROWSER_AUTH_VOLUME_MB || '6144');
const authStateDir = '/var/lib/studio-browser-auth';
const branch = process.env.NORTHFLANK_GIT_BRANCH || 'main';
const execute = process.argv.includes('--execute');
const projectId = resolveProjectId();
if (!projectId) throw new Error('Set NORTHFLANK_PROJECT_ID');

let existingRuntimeEnvironment: Record<string, string> = {};
async function exists() {
  try {
    const current = await nfFetch<{ runtimeEnvironment?: Record<string, string> }>(
      projectApiPath(projectId!, `/services/${serviceId}`),
    );
    existingRuntimeEnvironment = current.runtimeEnvironment ?? {};
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Northflank API 404 GET ")) return false;
    throw error;
  }
}

const secret = process.env.STUDIO_BROWSER_SECRET || crypto.randomBytes(32).toString('base64url');
type NorthflankRecord = Record<string, any>;

function arrayFrom(value: unknown, key?: string): NorthflankRecord[] {
  if (Array.isArray(value)) return value as NorthflankRecord[];
  const object = value as NorthflankRecord | null;
  if (key && Array.isArray(object?.[key])) return object[key] as NorthflankRecord[];
  if (key && Array.isArray(object?.data?.[key])) return object.data[key] as NorthflankRecord[];
  if (Array.isArray(object?.data)) return object.data as NorthflankRecord[];
  return [];
}

async function ensureAuthVolume(): Promise<string> {
  const volumes = arrayFrom(
    await nfFetch<NorthflankRecord>(projectApiPath(projectId!, '/volumes')),
    'volumes',
  );
  let volume = volumes.find(
    (item) => item.id === authVolumeId || item.name === authVolumeId,
  );
  if (!volume) {
    volume = await nfFetch<NorthflankRecord>(projectApiPath(projectId!, '/volumes'), {
      method: 'POST',
      body: JSON.stringify({
        name: authVolumeId,
        mounts: [{ volumeMountPath: '', containerMountPath: authStateDir }],
        spec: { accessMode: 'ReadWriteOnce', storageSize: authVolumeMb },
      }),
    });
  }
  return String(volume.id || authVolumeId);
}

function servicePayload(volumeId: string) {
  return {
  name: serviceId,
  description: 'Isolated direct CDP Chromium runtime for canonical Admin Dev Studio',
  billing: { deploymentPlan: 'nf-compute-200' },
  // Chromium runs with --disable-dev-shm-usage, so no /dev/shm reservation is
  // needed. Omitting it also keeps this service within the project allowance.
  deployment: {
    instances: 1,
    docker: { configType: 'default' },
    // The project allowance for this compute plan is 2 GB. Downloads are
    // uploaded to private Supabase storage and removed immediately, so the
    // browser runtime must stay within that bounded scratch allocation.
    storage: { ephemeralStorage: { storageSize: 2048 } },
  },
  createOptions: { volumesToAttach: [volumeId] },
  ports: [{ name: 'browser', internalPort: 3100, public: true, protocol: 'HTTP' }],
  buildSource: 'git',
  vcsData: {
    projectUrl: 'https://github.com/elevate-for-humanity/Elevate-lms',
    projectType: 'github',
    projectBranch: branch,
  },
  buildSettings: {
    dockerfile: {
      buildEngine: 'buildkit',
      dockerFilePath: '/Dockerfile.studio-browser',
      dockerWorkDir: '/',
      buildkit: { useCache: true, cacheStorageSize: 4096 },
    },
  },
  runtimeEnvironment: {
    NODE_ENV: 'production',
    PORT: '3100',
    STUDIO_BROWSER_SECRET: secret,
    STUDIO_BROWSER_ADMIN_ORIGIN: 'https://admin.elevateforhumanity.org',
    STUDIO_BROWSER_ALLOWED_DOMAINS: 'elevateforhumanity.org,envato.com,github.com,supabase.com,northflank.com',
    STUDIO_BROWSER_SESSION_TTL_MS: '7200000',
    STUDIO_BROWSER_MAX_SESSIONS: '4',
    STUDIO_BROWSER_AUTH_STATE_DIR: authStateDir,
  },
  healthChecks: [
    {
      protocol: 'HTTP',
      type: 'readinessProbe',
      path: '/health',
      port: 3100,
      initialDelaySeconds: 15,
      periodSeconds: 10,
      timeoutSeconds: 5,
      failureThreshold: 3,
      successThreshold: 1,
    },
  ],
  };
}

console.log(
  `${execute ? 'EXECUTE' : 'DRY RUN'}: ${serviceId} from ${branch}, Dockerfile.studio-browser, port 3100`,
);
if (!execute) process.exit(0);
const volumeId = await ensureAuthVolume();
const payload = servicePayload(volumeId);
if (await exists()) {
  // Preserve the separate learner-test credential and other configured extensions.
  // Replacing the entire environment would rotate the credential on every deploy.
  payload.runtimeEnvironment = { ...existingRuntimeEnvironment, ...payload.runtimeEnvironment };
  await nfFetch(combinedServicePatchPath(projectId, serviceId), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  try {
    await nfFetch(projectApiPath(projectId, `/volumes/${volumeId}/attach`), {
      method: 'POST',
      body: JSON.stringify({ nfObject: { id: serviceId, type: 'service' } }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already|attached|conflict/i.test(message)) throw error;
  }
} else
  await nfFetch(combinedServiceCreatePath(projectId), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
console.log(
  `Studio browser service saved with encrypted provider auth state on ${volumeId}. Configure Admin with STUDIO_BROWSER_URL, STUDIO_BROWSER_PUBLIC_URL, NEXT_PUBLIC_STUDIO_BROWSER_URL and the same STUDIO_BROWSER_SECRET.`,
);
