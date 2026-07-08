/**
 * lib/admin/security-settings.ts
 *
 * In-process cache for security-related platform_settings keys.
 * TTL: 60 seconds — stale values are acceptable for enforcement settings.
 *
 * Env vars are always the primary source. DB values are the fallback when
 * the env var is absent. This means SSM/ECS secrets override the UI.
 *
 * Keys read:
 *   ip_allowlist          — comma-separated CIDRs/IPs (fallback for ADMIN_IP_ALLOWLIST)
 *   mfa_required          — 'true'/'false' — force MFA for admin/super_admin
 *   session_timeout       — idle timeout in minutes (fallback for hardcoded 30)
 *   max_login_attempts    — lockout threshold (future use)
 *   lockout_duration_minutes — lockout window (future use)
 */

import { logger } from '@/lib/logger';

export interface SecuritySettings {
  ipAllowlist: string[];       // parsed CIDR/IP list, empty = no restriction
  mfaRequired: boolean;        // force MFA for admin roles
  sessionTimeoutMs: number;    // idle timeout in milliseconds
  maxLoginAttempts: number;    // 0 = disabled
  lockoutDurationMs: number;   // lockout window in milliseconds
}

const DEFAULT: SecuritySettings = {
  ipAllowlist: [],
  mfaRequired: false,
  sessionTimeoutMs: 30 * 60 * 1000,
  maxLoginAttempts: 0,
  lockoutDurationMs: 15 * 60 * 1000,
};

const TTL_MS = 60_000;

let _cache: { settings: SecuritySettings; expiresAt: number } | null = null;
let _inflight: Promise<SecuritySettings> | null = null;

async function fetchFromDb(): Promise<SecuritySettings> {
  try {
    // Dynamic import — avoids pulling Supabase into the middleware bundle
    // on cold start before the cache is warm.
    const { createClient } = await import('@/lib/supabase/admin');
    const db = createClient();
    const { data: rows } = await db
      .from('platform_settings')
      .select('key, value')
      .in('key', [
        'ip_allowlist',
        'mfa_required',
        'session_timeout',
        'max_login_attempts',
        'lockout_duration_minutes',
      ]);

    const map: Record<string, string> = Object.fromEntries(
      (rows ?? []).map((r: { key: string; value: string }) => [r.key, r.value ?? '']),
    );

    // ip_allowlist: env var wins, DB is fallback
    const rawIp = process.env.ADMIN_IP_ALLOWLIST || map['ip_allowlist'] || '';
    const ipAllowlist = rawIp
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // mfa_required: env var wins
    const rawMfa = process.env.ADMIN_MFA_REQUIRED || map['mfa_required'] || 'false';
    const mfaRequired = rawMfa === 'true' || rawMfa === '1';

    // session_timeout (minutes): env var wins
    const rawTimeout = process.env.SESSION_TIMEOUT_MINUTES || map['session_timeout'] || '30';
    const timeoutMin = Math.max(1, parseInt(rawTimeout, 10) || 30);
    const sessionTimeoutMs = timeoutMin * 60 * 1000;

    // max_login_attempts
    const rawAttempts = map['max_login_attempts'] || '0';
    const maxLoginAttempts = parseInt(rawAttempts, 10) || 0;

    // lockout_duration_minutes
    const rawLockout = map['lockout_duration_minutes'] || '15';
    const lockoutDurationMs = (parseInt(rawLockout, 10) || 15) * 60 * 1000;

    return { ipAllowlist, mfaRequired, sessionTimeoutMs, maxLoginAttempts, lockoutDurationMs };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    logger.warn('[security-settings] DB fetch failed, using defaults', { detail });
    return {
      ...DEFAULT,
      // Still apply env var even if DB fails
      ipAllowlist: (process.env.ADMIN_IP_ALLOWLIST || '')
        .split(',').map((s) => s.trim()).filter(Boolean),
    };
  }
}

export async function getSecuritySettings(): Promise<SecuritySettings> {
  const now = Date.now();
  if (_cache && now < _cache.expiresAt) return _cache.settings;

  // Deduplicate concurrent fetches
  if (!_inflight) {
    _inflight = fetchFromDb().then((settings) => {
      _cache = { settings, expiresAt: Date.now() + TTL_MS };
      _inflight = null;
      return settings;
    }).catch((err) => {
      _inflight = null;
      throw err;
    });
  }

  return _inflight;
}

/** Force-expire the cache — call after saving platform_settings. */
export function invalidateSecuritySettingsCache(): void {
  _cache = null;
}
