import 'server-only';

const API_BASE = 'https://api.northflank.com/v1';

export type NorthflankServiceKey = 'lms' | 'admin';

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

export function getNorthflankServices(): NorthflankServiceSummary[] {
  return [
    {
      key: 'lms',
      id: process.env.NORTHFLANK_LMS_SERVICE_ID || 'elevate-lms',
      label: 'LMS (Main Site)',
      url: process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
      healthPath: '/api/ping',
      color: 'blue',
    },
    {
      key: 'admin',
      id: process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin',
      label: 'Admin Dashboard',
      url: process.env.NEXT_PUBLIC_ADMIN_URL || '',
      healthPath: '/api/ping',
      color: 'purple',
    },
  ];
}

function getNorthflankToken(): string {
  const token = process.env.NORTHFLANK_API_TOKEN || process.env.NORTHFLANK_API_KEY || process.env.NF_API_TOKEN;
  if (!token) {
    throw new Error('Northflank API token is not configured');
  }
  return token;
}

function getNorthflankTeamId(): string | null {
  return process.env.NORTHFLANK_TEAM_ID || 'elevates-team';
}

function projectPath(projectId: string, suffix: string): string {
  const teamId = getNorthflankTeamId();
  if (teamId) return `/teams/${teamId}/projects/${projectId}${suffix}`;
  return `/projects/${projectId}${suffix}`;
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
  const variables = secrets?.variables ?? (secretGroup.variables as Record<string, string> | undefined) ?? {};
  return { ...variables };
}

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
        description: 'Elevate production env',
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

  await northflankFetch(projectId, `/secrets/${groupId}`, {
    method: 'POST',
    body: JSON.stringify({
      name: groupId,
      description: 'Elevate production env',
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

export function isNorthflankReady(): boolean {
  return Boolean(getNorthflankProjectId() && (process.env.NORTHFLANK_API_TOKEN || process.env.NORTHFLANK_API_KEY || process.env.NF_API_TOKEN));
}
