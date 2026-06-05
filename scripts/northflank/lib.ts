/**
 * Shared Northflank API helpers for Elevate LMS migration scripts.
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
      'Missing NORTHFLANK_API_TOKEN. Add it in Cursor → https://cursor.com/dashboard/cloud-agents (Secrets), then restart the agent.',
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

export function resolveLmsServiceId(): string | undefined {
  return process.env.NORTHFLANK_LMS_SERVICE_ID;
}

export function resolveAdminServiceId(): string | undefined {
  return process.env.NORTHFLANK_ADMIN_SERVICE_ID;
}

/** Prefix path with team when NORTHFLANK_TEAM_ID is set. */
export function projectApiPath(projectId: string, suffix: string): string {
  const teamId = resolveTeamId();
  if (teamId) {
    return teamPath(teamId, `/${projectId}${suffix}`);
  }
  return `/projects/${projectId}${suffix}`;
}

/**
 * Northflank "combined" = build+deploy in one service resource (not one service for LMS+admin).
 * Elevate uses two combined services: elevate-lms and elevate-admin.
 */
export function combinedServiceCreatePath(projectId: string): string {
  return projectApiPath(projectId, '/services/combined');
}

/** GET service status (build trigger, wait, inspect). */
export function serviceGetPath(projectId: string, serviceId: string): string {
  return projectApiPath(projectId, `/services/${serviceId}`);
}

/** PATCH combined CI/CD service — must use /services/combined/{id} (plain /services/{id} returns 405). */
export function combinedServicePatchPath(projectId: string, serviceId: string): string {
  return projectApiPath(projectId, `/services/combined/${serviceId}`);
}

/** @deprecated Use combinedServicePatchPath for PATCH. */
export function combinedServicePath(projectId: string, serviceId: string): string {
  return combinedServicePatchPath(projectId, serviceId);
}
