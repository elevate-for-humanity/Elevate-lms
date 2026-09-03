import 'server-only';
import { logger } from '@/lib/logger';

/**
 * SAM.gov API Integration
 * System for Award Management - Federal government contractor database.
 *
 * Federal APIs are external dependencies. Calls use bounded timeouts and one
 * retry for transient failures so the application does not hang indefinitely
 * or treat a short-lived upstream error as a permanent condition.
 */

interface SAMEntity {
  uei: string;
  legalBusinessName: string;
  dbaName?: string;
  physicalAddress?: unknown;
  entityStatus?: string;
  exclusionStatus?: string;
}

const SAM_API_BASE = 'https://api.sam.gov/entity-information/v3';
const SAM_TIMEOUT_MS = 8000;
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export type SamGovDependencyStatus =
  | { ok: true; status: number }
  | { ok: false; reason: 'not-configured' | 'timeout' | 'upstream-error' | 'network-error'; status?: number };

async function fetchSamGov(path: string): Promise<Response | null> {
  const apiKey = process.env.SAM_GOV_API_KEY;
  if (!apiKey) {
    logger.warn('SAM.gov integration is not configured: SAM_GOV_API_KEY is missing');
    return null;
  }

  const separator = path.includes('?') ? '&' : '?';
  const url = `${SAM_API_BASE}${path}${separator}api_key=${encodeURIComponent(apiKey)}`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SAM_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      });
      if (response.ok) return response;
      if (!RETRYABLE_STATUS.has(response.status) || attempt === 1) {
        logger.error('SAM.gov API error:', response.status);
        return response;
      }
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      logger.error(aborted ? 'SAM.gov API timeout' : 'SAM.gov API network error', error);
      if (attempt === 1) return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}

/** Get entity by UEI (Unique Entity Identifier). */
export async function getEntityByUEI(uei: string): Promise<SAMEntity | null> {
  if (!isValidUEI(uei)) return null;
  const response = await fetchSamGov(`/entities?ueiSAM=${encodeURIComponent(uei)}`);
  if (!response?.ok) return null;

  try {
    const data = await response.json();
    return data.entityData?.[0] || null;
  } catch (error) {
    logger.error('Error parsing SAM.gov entity response:', error);
    return null;
  }
}

/** Check if entity is excluded from federal contracts. */
export async function checkExclusions(uei: string): Promise<boolean> {
  if (!isValidUEI(uei)) return false;
  const response = await fetchSamGov(`/exclusions?ueiSAM=${encodeURIComponent(uei)}`);
  if (!response?.ok) return false;

  try {
    const data = await response.json();
    return Boolean(data.exclusionDetails && data.exclusionDetails.length > 0);
  } catch (error) {
    logger.error('Error parsing SAM.gov exclusions response:', error);
    return false;
  }
}

/** Search entities by legal business name. */
export async function searchEntities(name: string): Promise<SAMEntity[]> {
  const query = name.trim();
  if (!query) return [];
  const response = await fetchSamGov(`/entities?legalBusinessName=${encodeURIComponent(query)}`);
  if (!response?.ok) return [];

  try {
    const data = await response.json();
    return data.entityData || [];
  } catch (error) {
    logger.error('Error parsing SAM.gov search response:', error);
    return [];
  }
}

/**
 * Lightweight dependency probe for health/status surfaces.
 * This never exposes the API key and does not claim SAM.gov is available when
 * the integration is unconfigured or the upstream request fails.
 */
export async function getSamGovDependencyStatus(): Promise<SamGovDependencyStatus> {
  if (!process.env.SAM_GOV_API_KEY) return { ok: false, reason: 'not-configured' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SAM_TIMEOUT_MS);
  try {
    const response = await fetch('https://api.sam.gov/', {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    return response.ok
      ? { ok: true, status: response.status }
      : { ok: false, reason: 'upstream-error', status: response.status };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return { ok: false, reason: 'timeout' };
    return { ok: false, reason: 'network-error' };
  } finally {
    clearTimeout(timer);
  }
}

/** Validate UEI format. */
export function isValidUEI(uei: string): boolean {
  return /^[A-Z0-9]{12}$/.test(uei.trim().toUpperCase());
}
