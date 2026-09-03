import 'server-only';

const API_BASE = 'https://api.northflank.com/v1';

export type NorthflankServiceKey = 'marketing' | 'lms' | 'admin';

export type NorthflankServiceSummary = {
  id: string;
  key: NorthflankServiceKey;
  label: string;
  url: string;
  healthPath: string;
  color: string;
};

export function getNorthflankProjectId(): string | null {
  return process.env.NORTHFLANK_PROJECT_ID || null;
}

export function getNorthflankSecretGroupId(): string {
  return process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';
}

/** Canonical production service map. Keep this aligned with service-targets.ts. */
export function getNorthflankServices(): NorthflankServiceSummary[] {
  return [
    {
      key: 'marketing',
      id: process.env.NORTHFLANK_MARKETING_SERVICE_ID || 'elevate-marketing',
      label: 'Marketing / Public Site',
      url: process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
      healthPath: '/api/ping',
      color: 'green',
    },
    {
      key: 'lms',
      id: process.env.NORTHFLANK_LMS_SERVICE_ID || 'elevate-lms',
      label: 'LMS / Student App',
      url: process.env.NEXT_PUBLIC_LMS_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org',
      healthPath: '/api/ping',
      color: 'blue',
    },
    {
      key: 'admin',
      id: process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin',
      label: 'Admin Dashboard',
      url: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org',
      healthPath: '/api/ping',
      color: 'purple',
    },
  ];
}

function getNorthflankToken(): string {
  const token =
    process.env.NORTHFLANK_API_TOKEN ||
    process.env.NORTHFLANK_API_KEY ||
    process.env.NF_API_TOKEN;
  if (!token) throw new Error('Northflank API token is not configured');
  return token;
}

function getNorthflankTeamId(): string {
  return process.env.NORTHFLANK_TEAM_ID || 'elevates-team';
}

function projectPath(projectId: string, suffix: string): string {
  return `/teams/${getNorthflankTeamId()}/projects/${projectId}${suffix}`;
}

export async function northflankFetch<T = unknown>(
  projectId: string,
  suffix: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${projectPath(projectId, suffix)}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getNorthflankToken()}`,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  const text = await res.text();
  let json: { data?: T; error?: string; message?: string };
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Northflank API returned non-JSON (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(json.error || json.message || `Northflank API ${res.status}`);
  }

  return (json.data ?? json) as T;
}

export async function getNorthflankService(projectId: string, serviceId: string) {
  return northflankFetch<Record<string, unknown>>(projectId, `/services/${serviceId}`);
}

export async function triggerNorthflankBuild(projectId: string, serviceId: string) {
  return northflankFetch<Record<string, unknown>>(projectId, `/services/${serviceId}/build`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

function extractVariables(secretGroup: Record<string, unknown>): Record<string, string> {
  const secrets = secretGroup.secrets as { variables?: Record<string, string> } | undefined;
  const variables =
    secrets?.variables ??
    (secretGroup.variables as Record<string, string> | undefined) ??
    {};
  return { ...variables };
}

/**
 * Update a shared production secret without changing which services receive it.
 * All three production services remain attached every time this function writes.
 */
export async function upsertNorthflankSecretVariable(
  projectId: string,
  key: string,
  value: string,
): Promise<{ groupId: string; variableCount: number }> {
  const groupId = getNorthflankSecretGroupId();
  const serviceIds = getNorthflankServices().map((service) => service.id);
  let variables: Record<string, string> = {};

  try {
    const group = await northflankFetch<Record<string, unknown>>(projectId, `/secrets/${groupId}`);
    variables = extractVariables(group);
  } catch {
    await northflankFetch(projectId, '/secrets', {
      method: 'POST',
      body: JSON.stringify({
        name: groupId,
        description: 'Elevate shared production secrets/config',
        priority: 10,
        type: 'secret',
        secretType: 'environment',
        restrictions: {
          restricted: true,
          nfObjects: serviceIds.map((id) => ({ id, type: 'service' })),
          tagMatchCondition: 'or',
        },
        secrets: { variables: {} },
      }),
    });
  }

  variables[key] = value;

  // Never allow the shared secret editor to mutate infrastructure-owned keys.
  for (const infraKey of ['PORT', 'HOSTNAME', 'NODE_ENV', 'SERVICE_ROLE', 'SERVICE_NAME']) {
    delete variables[infraKey];
  }

  await northflankFetch(projectId, `/secrets/${groupId}`, {
    method: 'POST',
    body: JSON.stringify({
      name: groupId,
      description: 'Elevate shared production secrets/config',
      priority: 10,
      type: 'secret',
      secretType: 'environment',
      restrictions: {
        restricted: true,
        nfObjects: serviceIds.map((id) => ({ id, type: 'service' })),
        tagMatchCondition: 'or',
      },
      secrets: { variables },
    }),
  });

  return { groupId, variableCount: Object.keys(variables).length };
}

/**
 * Update a secret group attached to exactly one production service. Integration
 * credentials must not be inherited by unrelated public-facing containers.
 */
export async function upsertNorthflankServiceSecretVariable(
  projectId: string,
  serviceKey: NorthflankServiceKey,
  key: string,
  value: string,
): Promise<{ groupId: string; variableCount: number; serviceId: string }> {
  const service = getNorthflankServices().find((candidate) => candidate.key === serviceKey);
  if (!service) throw new Error(`Unknown Northflank service: ${serviceKey}`);

  const groupId = `elevate-${serviceKey}-runtime-secrets`;
  let variables: Record<string, string> = {};
  try {
    const group = await northflankFetch<Record<string, unknown>>(projectId, `/secrets/${groupId}`);
    variables = extractVariables(group);
  } catch {
    await northflankFetch(projectId, '/secrets', {
      method: 'POST',
      body: JSON.stringify({
        name: groupId,
        description: `Elevate ${service.label} service-scoped runtime secrets`,
        priority: 20,
        type: 'secret',
        secretType: 'environment',
        restrictions: {
          restricted: true,
          nfObjects: [{ id: service.id, type: 'service' }],
          tagMatchCondition: 'or',
        },
        secrets: { variables: {} },
      }),
    });
  }

  variables[key] = value;
  for (const infraKey of ['PORT', 'HOSTNAME', 'NODE_ENV', 'SERVICE_ROLE', 'SERVICE_NAME']) {
    delete variables[infraKey];
  }

  await northflankFetch(projectId, `/secrets/${groupId}`, {
    method: 'POST',
    body: JSON.stringify({
      name: groupId,
      description: `Elevate ${service.label} service-scoped runtime secrets`,
      priority: 20,
      type: 'secret',
      secretType: 'environment',
      restrictions: {
        restricted: true,
        nfObjects: [{ id: service.id, type: 'service' }],
        tagMatchCondition: 'or',
      },
      secrets: { variables },
    }),
  });

  return { groupId, variableCount: Object.keys(variables).length, serviceId: service.id };
}

export function isNorthflankReady(): boolean {
  return Boolean(
    getNorthflankProjectId() &&
      (process.env.NORTHFLANK_API_TOKEN ||
        process.env.NORTHFLANK_API_KEY ||
        process.env.NF_API_TOKEN),
  );
}
