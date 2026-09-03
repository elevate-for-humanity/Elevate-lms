/**
 * Shared Northflank API helpers for Elevate production scripts.
 */

import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const API_BASE = 'https://api.northflank.com/v1';

for (const file of ['.env.local', '.env']) {
  const envPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false, quiet: true });
  }
}

export function getToken(): string {
  const token =
    process.env.NORTHFLANK_API_TOKEN ||
    process.env.NORTHFLANK_API_KEY ||
    process.env.NF_API_TOKEN;
  if (!token) {
    throw new Error(
      'Missing NORTHFLANK_API_TOKEN. Configure it in the runtime secret store before running Northflank scripts.',
    );
  }
  return token;
}

export async function nfFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  const text = await res.text();
  let json: { data?: T; error?: string; message?: string };
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Northflank API non-JSON (${res.status}): ${text.slice(0, 500)}`);
  }
  if (!res.ok) {
    const detail =
      typeof json.error === 'object'
        ? JSON.stringify(json.error)
        : json.error || json.message || text;
    throw new Error(`Northflank API ${res.status} ${options.method || 'GET'} ${path}: ${detail}`);
  }
  return (json.data ?? json) as T;
}

export function teamPath(teamId: string, projectPath: string): string {
  return `/teams/${teamId}/projects${projectPath}`;
}

export function resolveTeamId(): string | undefined {
  return process.env.NORTHFLANK_TEAM_ID || 'elevates-team';
}

export function resolveProjectId(): string | undefined {
  return process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
}

export function resolveMarketingServiceId(): string | undefined {
  return process.env.NORTHFLANK_MARKETING_SERVICE_ID;
}

export function resolveLmsServiceId(): string | undefined {
  return process.env.NORTHFLANK_LMS_SERVICE_ID;
}

export function resolveAdminServiceId(): string | undefined {
  return process.env.NORTHFLANK_ADMIN_SERVICE_ID;
}

/** Always use project-scoped path — works with both project tokens and team-scoped UI tokens. */
export function projectApiPath(projectId: string, suffix: string): string {
  return `/projects/${projectId}${suffix}`;
}

/** Northflank "combined" means build+deploy in one service resource. */
export function combinedServiceCreatePath(projectId: string): string {
  return projectApiPath(projectId, '/services/combined');
}

/** GET service status (build trigger, wait, inspect). */
export function serviceGetPath(projectId: string, serviceId: string): string {
  return projectApiPath(projectId, `/services/${serviceId}`);
}

/** PATCH combined CI/CD service — use /services/combined/{id}. */
export function combinedServicePatchPath(projectId: string, serviceId: string): string {
  return projectApiPath(projectId, `/services/combined/${serviceId}`);
}

/**
 * GET combined service status uses /services/{id}; /services/combined/{id} is PATCH-only.
 * @deprecated Use serviceGetPath() for GET operations.
 */
export function combinedServicePath(projectId: string, serviceId: string): string {
  return serviceGetPath(projectId, serviceId);
}


/** Create a deployment-only service from an external or internal image. */
export function deploymentServiceCreatePath(projectId: string): string {
  return projectApiPath(projectId, '/services/deployment');
}

/** PATCH deployment-only service configuration. */
export function deploymentServicePatchPath(projectId: string, serviceId: string): string {
  return projectApiPath(projectId, `/services/deployment/${serviceId}`);
}
