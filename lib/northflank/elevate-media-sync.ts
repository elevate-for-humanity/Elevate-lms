import 'server-only';

/** Runtime configuration sync only. This does not create buckets or restart workloads. */
export const ELEVATE_MEDIA_RUNTIME_KEYS = [
  'ELEVATE_MEDIA_PROVIDER',
  'ELEVATE_MEDIA_ENDPOINT',
  'ELEVATE_MEDIA_REGION',
  'ELEVATE_MEDIA_ACCESS_KEY_ID',
  'ELEVATE_MEDIA_SECRET_ACCESS_KEY',
  'ELEVATE_MEDIA_BUCKET',
  'ELEVATE_MEDIA_PUBLIC_URL',
  'NEXT_PUBLIC_ELEVATE_MEDIA_URL',
  'ELEVATE_MEDIA_FORCE_PATH_STYLE',
  'ELEVATE_MEDIA_VIDEO_MIN_BYTES',
  'COURSE_VIDEO_STORAGE_BACKEND',
] as const;

const MEDIA_KEYS = new Set<string>(ELEVATE_MEDIA_RUNTIME_KEYS);
const GROUP_ID = 'elevate-media-runtime-secrets';
const API_BASE = 'https://api.northflank.com/v1';

type RecordValue = Record<string, unknown>;
type SyncOptions = {
  env?: Record<string, string | undefined>;
  request?: typeof fetch;
};

export function isElevateMediaRuntimeKey(key: string): boolean {
  return MEDIA_KEYS.has(key);
}

export function validateElevateMediaUpdates(updates: Record<string, string>): void {
  for (const [key, value] of Object.entries(updates)) {
    if (!MEDIA_KEYS.has(key)) throw new Error('Unsupported Elevate Media setting');
    if (typeof value !== 'string' || value.length > 16_384 || /[\r\n\u0000]/.test(value)) {
      throw new Error('Invalid Elevate Media setting value');
    }
    if (/^\s*[•*]{4,}/.test(value)) {
      throw new Error('Masked credentials cannot replace saved credentials');
    }
  }
  const credentialKeys = ['ELEVATE_MEDIA_ACCESS_KEY_ID', 'ELEVATE_MEDIA_SECRET_ACCESS_KEY'];
  if (credentialKeys.some((key) => Object.hasOwn(updates, key))) {
    if (!credentialKeys.every((key) => Boolean(updates[key]?.trim()))) {
      throw new Error('Save the matching Elevate Media key ID and application key together');
    }
  }
}

function record(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function stringMap(value: unknown): Record<string, string> {
  // Missing/hidden contents are not an empty group: refuse to overwrite them.
  if (!record(value) || !Object.values(value).every((item) => typeof item === 'string')) {
    throw new Error('Northflank did not return readable configuration values');
  }
  return { ...value } as Record<string, string>;
}

function verifyScope(group: RecordValue, serviceIds: string[]): void {
  const restrictions = group.restrictions;
  if (!record(restrictions) || restrictions.restricted !== true) {
    throw new Error('Elevate Media secret group is not service-restricted');
  }
  const objects = restrictions.nfObjects;
  if (!Array.isArray(objects) || objects.length !== serviceIds.length ||
      !objects.every((item) => record(item) && item.type === 'service' &&
        serviceIds.includes(String(item.id))) ||
      new Set(objects.map((item) => String(item.id))).size !== serviceIds.length) {
    throw new Error('Elevate Media secret group must be limited to Admin and LMS');
  }
  // Additional tag/environment selectors could expose the credentials elsewhere.
  const known = new Set(['restricted', 'nfObjects', 'tagMatchCondition']);
  if (Object.entries(restrictions).some(([key, value]) =>
    !known.has(key) && value != null && !(Array.isArray(value) && value.length === 0))) {
    throw new Error('Elevate Media secret group has additional access selectors');
  }
  if (group.type !== 'secret' || group.secretType !== 'environment') {
    throw new Error('Elevate Media credentials must be runtime-only secrets');
  }
}

/**
 * Store one complete change set in a dedicated runtime-only group, then verify
 * the group and each service's effective configuration. Values never leave the
 * server response as diagnostics. A restart is deliberately not automatic.
 */
export async function syncElevateMediaToNorthflank(
  updates: Record<string, string>,
  options: SyncOptions = {},
) {
  validateElevateMediaUpdates(updates);
  const keys = Object.keys(updates);
  if (keys.length === 0) throw new Error('No Elevate Media settings supplied');
  const env = options.env ?? process.env;
  const request = options.request ?? fetch;
  const projectId = env.NORTHFLANK_PROJECT_ID?.trim();
  const token = (env.NORTHFLANK_API_TOKEN || env.NORTHFLANK_API_KEY || env.NF_API_TOKEN)?.trim();
  if (!projectId || !token) throw new Error('Northflank control-plane credentials are not configured');
  const serviceIds = [
    env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin',
    env.NORTHFLANK_LMS_SERVICE_ID || 'elevate-lms',
  ];
  if (new Set(serviceIds).size !== 2) throw new Error('Admin and LMS service IDs must be distinct');
  const projectUrl = `${API_BASE}/projects/${encodeURIComponent(projectId)}`;

  async function api(suffix: string, init: RequestInit = {}, allowMissing = false) {
    const response = await request(`${projectUrl}${suffix}`, {
      ...init,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    if (allowMissing && response.status === 404) return null;
    // Never include a provider response body in an error: it may echo credentials.
    if (!response.ok) throw new Error(`Northflank configuration request failed (HTTP ${response.status})`);
    const body: unknown = await response.json();
    if (!record(body) || !record(body.data)) throw new Error('Invalid Northflank configuration response');
    return body.data;
  }

  const groupPath = `/secrets/${GROUP_ID}`;
  const existing = await api(`${groupPath}?show=this`, {}, true);
  let savedSecrets: RecordValue = {};
  let savedVariables: Record<string, string> = {};
  if (existing) {
    verifyScope(existing, serviceIds);
    if (!record(existing.secrets)) throw new Error('Northflank secret contents are unavailable');
    savedSecrets = existing.secrets;
    savedVariables = stringMap(savedSecrets.variables);
  }
  const variables = { ...savedVariables, ...updates };
  const configuration = {
    description: 'Elevate Media Storage credentials for Admin rendering and LMS delivery',
    type: 'secret',
    secretType: 'environment',
    priority: existing?.priority ?? 30,
    restrictions: {
      restricted: true,
      nfObjects: serviceIds.map((id) => ({ id, type: 'service' })),
      tagMatchCondition: 'or',
    },
    secrets: { ...savedSecrets, variables },
  };
  await api(existing ? groupPath : '/secrets', {
    method: existing ? 'PATCH' : 'POST',
    body: JSON.stringify(existing ? configuration : { name: GROUP_ID, ...configuration }),
  });

  const readBack = await api(`${groupPath}?show=this`);
  if (!readBack) throw new Error('Northflank secret-group read-back failed');
  verifyScope(readBack, serviceIds);
  if (!record(readBack.secrets)) throw new Error('Northflank secret-group read-back is unavailable');
  const verified = stringMap(readBack.secrets.variables);
  if (!Object.entries(variables).every(([key, value]) => verified[key] === value)) {
    throw new Error('Northflank secret-group values did not match the saved configuration');
  }
  for (const serviceId of serviceIds) {
    const service = await api(`/services/${encodeURIComponent(serviceId)}?show=all`);
    const effective = stringMap(service?.runtimeEnvironment);
    if (!Object.entries(updates).every(([key, value]) => effective[key] === value)) {
      throw new Error('A Northflank service has missing or overriding Elevate Media settings');
    }
  }
  return {
    groupId: GROUP_ID,
    services: ['admin', 'lms'] as const,
    savedKeyCount: keys.length,
    configurationVerified: true,
    restartRequired: true,
    bucketConnectionTested: false,
  };
}
