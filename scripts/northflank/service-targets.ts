/**
 * Resolve which Northflank service(s) a script should touch.
 * Deploy workflows must pass a single service id so LMS and Admin CI/CD stay independent.
 */

import { resolveAdminServiceId, resolveLmsServiceId } from './lib';

export type NorthflankServiceRole = 'lms' | 'admin';

export type NorthflankServiceTarget = {
  role: NorthflankServiceRole;
  id: string;
};

export const NORTHFLANK_SERVICE_TARGETS: NorthflankServiceTarget[] = [
  {
    role: 'lms',
    id: process.env.NORTHFLANK_LMS_SERVICE_ID || resolveLmsServiceId() || 'elevate-lms',
  },
  {
    role: 'admin',
    id: process.env.NORTHFLANK_ADMIN_SERVICE_ID || resolveAdminServiceId() || 'elevate-admin',
  },
];

export function allServiceIds(): string[] {
  return NORTHFLANK_SERVICE_TARGETS.map((t) => t.id);
}

export function serviceIdForRole(role: NorthflankServiceRole): string {
  const row = NORTHFLANK_SERVICE_TARGETS.find((t) => t.role === role);
  if (!row) throw new Error(`Unknown role: ${role}`);
  return row.id;
}

function parseArgvFlags(argv: string[]): { all: boolean; roles: Set<NorthflankServiceRole> } {
  const roles = new Set<NorthflankServiceRole>();
  let all = false;
  for (const arg of argv) {
    if (arg === '--all') all = true;
    else if (arg === 'lms') roles.add('lms');
    else if (arg === 'admin') roles.add('admin');
    else {
      const match = NORTHFLANK_SERVICE_TARGETS.find((t) => t.id === arg);
      if (match) roles.add(match.role);
    }
  }
  return { all, roles };
}

/**
 * Resolve target service ids from CLI args, env, or both.
 *
 * Priority:
 *   1. CLI: `elevate-lms`, `elevate-admin`, `lms`, `admin`, or `--all`
 *   2. Env: `NORTHFLANK_TARGET_SERVICE` = lms | admin | elevate-lms | elevate-admin
 *   3. Default: all services (manual full-platform scripts only)
 */
const SCRIPT_FLAGS = new Set(['--execute', '--dry-run', '--all']);

export function resolveTargetServiceIds(argv: string[] = process.argv.slice(2)): string[] {
  const filtered = argv.filter((a) => !SCRIPT_FLAGS.has(a) || a === '--all');
  const { all, roles } = parseArgvFlags(filtered);

  const envTarget = process.env.NORTHFLANK_TARGET_SERVICE?.trim().toLowerCase();
  if (envTarget) {
    if (envTarget === 'lms' || envTarget === 'elevate-lms' || envTarget === serviceIdForRole('lms')) {
      roles.add('lms');
    } else if (
      envTarget === 'admin' ||
      envTarget === 'elevate-admin' ||
      envTarget === serviceIdForRole('admin')
    ) {
      roles.add('admin');
    } else if (envTarget === 'all') {
      return allServiceIds();
    }
  }

  if (all) {
    return allServiceIds();
  }

  if (roles.size === 0) {
    return allServiceIds();
  }

  return NORTHFLANK_SERVICE_TARGETS.filter((t) => roles.has(t.role)).map((t) => t.id);
}

export function requireSingleTarget(argv: string[] = process.argv.slice(2)): string {
  const ids = resolveTargetServiceIds(argv);
  if (ids.length !== 1) {
    console.error(
      'Pass exactly one service: elevate-lms | elevate-admin (or set NORTHFLANK_TARGET_SERVICE=lms|admin).',
    );
    console.error(`Resolved: ${ids.join(', ') || '(none)'}`);
    process.exit(1);
  }
  return ids[0]!;
}
