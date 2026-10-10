import 'server-only';
import policy from '@/config/google-runtime-policy.json';

export type RuntimeComponent = keyof typeof policy.components;
export type RuntimeEntry = { key: string; value: string };
type EnvironmentVariable = { name: string; value?: string; valueSource?: { secretKeyRef?: { secret: string; version: string } } };
type Container = { image: string; env?: EnvironmentVariable[]; [key: string]: unknown };
type Service = {
  name: string; etag: string; generation: string; observedGeneration: string;
  reconciling?: boolean; terminalCondition?: { state: string };
  latestReadyRevision: string; latestCreatedRevision: string; uri: string;
  trafficStatuses?: Array<{ revision: string; percent?: number; tag?: string }>;
  template: { serviceAccount: string; containers: Container[] };
};
type SecretVersion = { name: string; state: string; clientSpecifiedPayloadChecksum?: boolean; createTime?: string };
type Dependencies = { request?: typeof fetch; now?: () => number; wait?: (ms: number) => Promise<void> };

export class GoogleConfigurationError extends Error {
  constructor(public readonly code: string, public readonly phase: string) {
    super(`Google configuration ${phase}: ${code}`);
  }
}
const fail = (code: string, phase: string): never => { throw new GoogleConfigurationError(code, phase); };
export function runtimeComponent(value: unknown): RuntimeComponent {
  if (typeof value !== 'string' || !Object.hasOwn(policy.components, value)) fail('unsupported_service', 'validation');
  return value as RuntimeComponent;
}
export function runtimeSecretName(component: RuntimeComponent, key: string) {
  if (!policy.components[component].keys.includes(key)) fail('key_not_allowed_for_service', 'validation');
  return `elevate-${component}-${key.toLowerCase().replaceAll('_', '-')}`;
}
export function validateRuntimeEntries(component: RuntimeComponent, entries: RuntimeEntry[]) {
  if (!entries.length || entries.length > 50) fail('invalid_entry_count', 'validation');
  const seen = new Set<string>();
  for (const entry of entries) {
    runtimeSecretName(component, entry.key);
    if (seen.has(entry.key) || !entry.value.trim() || /^[•*]{4,}$/.test(entry.value.trim()) || Buffer.byteLength(entry.value, 'utf8') > 16384)
      fail('invalid_or_masked_value', 'validation');
    seen.add(entry.key);
  }
}

// Castagnoli CRC32C, sent to Google so corrupt writes fail before binding.
export function payloadChecksum(bytes: Uint8Array): string {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0x82f63b78 : 0);
  }
  return String((crc ^ 0xffffffff) >>> 0);
}

function googleClient(dependencies: Dependencies) {
  const request = dependencies.request ?? fetch;
  const now = dependencies.now ?? Date.now;
  const deadline = now() + 70000;
  let accessToken: string | undefined;
  async function invoke(url: string, phase: string, init: RequestInit = {}) {
    const remaining = deadline - now();
    if (remaining <= 0) fail('verification_timeout', phase);
    let response: Response;
    try {
      response = await request(url, { ...init, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(Math.min(15000, remaining)) });
    } catch { return fail('request_failed', phase); }
    if (!response.ok) fail(response.status === 403 ? 'permission_denied' : response.status === 404 ? 'resource_missing' : response.status === 409 || response.status === 412 ? 'concurrent_update' : 'request_rejected', phase);
    return response;
  }
  async function metadata(path: string, text = false) {
    const response = await invoke(`http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/${path}`, 'identity', { headers: { 'Metadata-Flavor': 'Google' } });
    if (response.headers.get('Metadata-Flavor') !== 'Google') fail('invalid_metadata_response', 'identity');
    try { return text ? await response.text() : await response.json(); }
    catch { return fail('invalid_response', 'identity'); }
  }
  async function api<T>(path: string, phase: string, method = 'GET', body?: unknown): Promise<T> {
    if (!accessToken) {
      const token = await metadata('token');
      if (!token || typeof token.access_token !== 'string' || !token.access_token) fail('credentials_unavailable', 'identity');
      accessToken = token.access_token;
    }
    const response = await invoke(path, phase, { method, headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    try { return await response.json() as T; }
    catch { return fail('invalid_response', phase); }
  }
  async function health(service: Service) {
    if (!/^https:\/\/[a-z0-9.-]+\.run\.app$/.test(service.uri)) fail('unexpected_service_url', 'health');
    const identity = await metadata(`identity?audience=${encodeURIComponent(service.uri)}&format=full`, true);
    const response = await invoke(`${service.uri}/api/health`, 'health', { headers: { 'X-Serverless-Authorization': `Bearer ${identity}` } });
    let body: { healthy?: boolean; ready?: boolean; revision?: string };
    try { body = await response.json(); } catch { return fail('invalid_response', 'health'); }
    if (body.healthy !== true || body.ready !== true) fail('service_unhealthy', 'health');
    if (body.revision !== service.latestReadyRevision.split('/').at(-1)) fail('health_revision_mismatch', 'health');
  }
  return { api, health, now, deadline, wait: dependencies.wait ?? (ms => new Promise(resolve => setTimeout(resolve, ms))) };
}
function servicePath(component: RuntimeComponent) {
  return `projects/${policy.project}/locations/${policy.region}/services/${policy.components[component].service}`;
}
function secretPath(component: RuntimeComponent, key: string) {
  return `projects/${policy.project}/secrets/${runtimeSecretName(component, key)}`;
}
function verifyService(service: Service, component: RuntimeComponent) {
  if (![servicePath(component), servicePath(component).replace(policy.project, policy.projectNumber)].includes(service.name) || service.template?.serviceAccount !== policy.components[component].identity || service.template.containers?.length !== 1 || !service.etag)
    fail('unexpected_runtime_identity_or_shape', 'runtime_inventory');
  if (!/^.+@sha256:[a-f0-9]{64}$/.test(service.template.containers[0].image)) fail('image_not_digest_pinned', 'runtime_inventory');
}
function serving(service: Service) {
  return service.reconciling !== true && service.terminalCondition?.state === 'CONDITION_SUCCEEDED'
    && service.observedGeneration === service.generation && Boolean(service.latestReadyRevision)
    && service.latestReadyRevision === service.latestCreatedRevision
    && (service.trafficStatuses ?? []).filter(item => !item.tag).reduce((sum, item) => sum + (item.revision === service.latestReadyRevision ? item.percent ?? 0 : 0), 0) === 100;
}
function numericVersion(version: SecretVersion, component: RuntimeComponent, key: string) {
  const name = runtimeSecretName(component, key);
  const match = version.name?.match(new RegExp(`^projects/(${policy.project}|${policy.projectNumber})/secrets/${name}/versions/([1-9][0-9]*)$`));
  if (!match || version.state !== 'ENABLED' || version.clientSpecifiedPayloadChecksum !== true) fail('secret_write_not_verified', 'secret_write');
  return match[2];
}

/** Writes only to Google, then verifies a numeric secret reference on the serving revision. */
export async function saveGoogleRuntimeConfiguration(component: RuntimeComponent, entries: RuntimeEntry[], dependencies: Dependencies = {}) {
  validateRuntimeEntries(component, entries);
  const client = googleClient(dependencies);
  const endpoint = `https://run.googleapis.com/v2/${servicePath(component)}`;
  const before = await client.api<Service>(endpoint, 'runtime_inventory');
  verifyService(before, component);
  if (!serving(before)) fail('runtime_not_stable', 'runtime_inventory');
  // All destinations must exist and have the expected ownership before any write.
  for (const entry of entries) {
    const secret = await client.api<{ labels?: Record<string, string> }>(`https://secretmanager.googleapis.com/v1/${secretPath(component, entry.key)}`, 'secret_inventory');
    if (secret.labels?.elevate_component !== component || secret.labels?.elevate_key !== entry.key.toLowerCase()) fail('secret_scope_mismatch', 'secret_inventory');
    const iam = await client.api<{ bindings?: Array<{ role: string; members?: string[]; condition?: unknown }> }>(`https://secretmanager.googleapis.com/v1/${secretPath(component, entry.key)}:getIamPolicy`, 'secret_iam');
    const writer = `projects/${policy.project}/roles/elevateRuntimeSecretWriterV1`;
    const manager = `serviceAccount:${policy.components.admin.identity}`;
    const consumer = `serviceAccount:${policy.components[component].identity}`;
    if (!iam.bindings?.length || iam.bindings.some(binding => binding.condition || ![writer, 'roles/secretmanager.secretAccessor'].includes(binding.role)
      || !binding.members?.length || binding.members.some(member => member !== (binding.role === writer ? manager : consumer)))
      || !iam.bindings.some(binding => binding.role === writer && binding.members?.includes(manager))
      || !iam.bindings.some(binding => binding.role === 'roles/secretmanager.secretAccessor' && binding.members?.includes(consumer)))
      fail('secret_iam_scope_mismatch', 'secret_iam');
  }
  const versions: Array<{ key: string; secret: string; version: string }> = [];
  for (const entry of entries) {
    const bytes = Buffer.from(entry.value, 'utf8');
    const stored = await client.api<SecretVersion>(`https://secretmanager.googleapis.com/v1/${secretPath(component, entry.key)}:addVersion`, 'secret_write', 'POST', { payload: { data: bytes.toString('base64'), dataCrc32c: payloadChecksum(bytes) } });
    versions.push({ key: entry.key, secret: runtimeSecretName(component, entry.key), version: numericVersion(stored, component, entry.key) });
  }
  const container = before.template.containers[0];
  const env = (container.env ?? []).filter(item => !versions.some(version => version.key === item.name));
  env.push(...versions.map(item => ({ name: item.key, valueSource: { secretKeyRef: { secret: item.secret, version: item.version } } })));
  await client.api(endpoint + '?updateMask=template.containers', 'runtime_binding', 'PATCH', { name: before.name, etag: before.etag, template: { containers: [{ ...container, env }] } });
  let ready: Service;
  while (true) {
    ready = await client.api<Service>(endpoint, 'runtime_verification');
    verifyService(ready, component);
    if (ready.terminalCondition?.state === 'CONDITION_FAILED') fail('revision_failed', 'runtime_verification');
    if (serving(ready) && ready.latestReadyRevision !== before.latestReadyRevision) break;
    if (client.now() + 2000 >= client.deadline) fail('verification_timeout', 'runtime_verification');
    await client.wait(2000);
  }
  if (ready.template.containers[0].image !== container.image) fail('concurrent_image_change', 'runtime_verification');
  for (const item of versions) {
    const reference = ready.template.containers[0].env?.find(variable => variable.name === item.key)?.valueSource?.secretKeyRef;
    if (reference?.secret !== item.secret || reference.version !== item.version) fail('runtime_binding_mismatch', 'runtime_verification');
  }
  await client.health(ready);
  return { component, saved: entries.length, encrypted: entries.length, runtimeSync: 'google-secret-manager', runtimeSynced: true, configurationVerified: true,
    revision: ready.latestReadyRevision, previousRevision: before.latestReadyRevision, versions, verifiedAt: new Date(client.now()).toISOString(),
    message: 'Saved in Google Secret Manager and verified on the serving runtime.' };
}

/** Operational inventory contains metadata only, never plaintext secret payloads. */
export async function getGoogleRuntimeConfiguration(component: RuntimeComponent, dependencies: Dependencies = {}) {
  const client = googleClient(dependencies);
  const service = await client.api<Service>(`https://run.googleapis.com/v2/${servicePath(component)}`, 'runtime_inventory');
  verifyService(service, component);
  const env = service.template.containers[0].env ?? [];
  const healthy = serving(service);
  if (healthy) await client.health(service);
  const settings = [];
  for (const key of policy.components[component].keys) {
    const variable = env.find(item => item.name === key);
    const reference = variable?.valueSource?.secretKeyRef;
    let verified = false;
    let updatedAt: string | undefined;
    if (reference?.secret === runtimeSecretName(component, key) && /^[1-9][0-9]*$/.test(reference.version)) {
      const metadata = await client.api<SecretVersion>(`https://secretmanager.googleapis.com/v1/${secretPath(component, key)}/versions/${reference.version}`, 'secret_inventory');
      verified = healthy && numericVersion(metadata, component, key) === reference.version;
      updatedAt = metadata.createTime;
    }
    settings.push({ key, component, secret_name: runtimeSecretName(component, key), value: variable ? '••••••••' : '', is_secret: true, updated_at: updatedAt,
      migration_status: reference ? 'google-bound' : variable ? 'legacy-inline' : 'not-configured', verification_status: verified ? 'verified' : variable ? 'unverified' : 'not-configured' });
  }
  return { settings, component, secretWritePolicy: 'service-scoped-google-secret-manager', runtimeProvider: 'google-cloud', revision: service.latestReadyRevision };
}
