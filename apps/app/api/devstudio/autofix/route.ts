/**
 * /api/devstudio/autofix
 *
 * Phase 3 auto-fix playbooks. Invoked by the stabilize orchestrator when it
 * detects known failure patterns, or called directly from DevStudio UI.
 *
 * Supported playbooks:
 *   auth-gap          — adds apiAuthGuard to unprotected API routes
 *   env-gap           — checks whether Northflank environment sync is configured
 *   devcontainer-readonly — rotates/sets GITHUB_TOKEN + switches mode to github-only
 *   stale-image       — triggers Northflank builds for the LMS/Admin services
 *   northflank-env    — reports Northflank env sync status
 *
 * POST body: { playbook: string; dryRun?: boolean; options?: Record<string, unknown> }
 * Response:  { ok, playbook, dryRun, actions: ActionResult[], summary, timestamp }
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import {
  getNorthflankProjectId,
  getNorthflankServices,
  isNorthflankReady,
  triggerNorthflankBuild,
} from '@/lib/northflank/runtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ── Types ─────────────────────────────────────────────────────────────────────

type ActionResult = {
  action: string;
  status: 'ok' | 'skipped' | 'error';
  detail: string;
};

type PlaybookResult = {
  ok: boolean;
  playbook: string;
  dryRun: boolean;
  actions: ActionResult[];
  summary: string;
  timestamp: string;
};

type AutofixRequest = {
  playbook: string;
  dryRun?: boolean;
  options?: Record<string, unknown>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function sh(cmd: string): Promise<{ code: number; out: string; err: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, { shell: true, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = ''; let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('close', (code) => resolve({ code: code ?? 1, out: out.trim(), err: err.trim() }));
    child.on('error', (e) => resolve({ code: 1, out: '', err: String(e) }));
  });
}

function ok(action: string, detail: string): ActionResult {
  return { action, status: 'ok', detail };
}
function skipped(action: string, detail: string): ActionResult {
  return { action, status: 'skipped', detail };
}
function error(action: string, detail: string): ActionResult {
  return { action, status: 'error', detail };
}

// ── Playbooks ─────────────────────────────────────────────────────────────────

/**
 * auth-gap: scan API routes missing auth guards and report them.
 * In non-dry-run mode, adds a TODO comment so they're easy to find.
 */
async function playbookAuthGap(dryRun: boolean): Promise<ActionResult[]> {
  const actions: ActionResult[] = [];

  // Find route files that export POST/PUT/DELETE but don't import any auth guard
  const { out } = await sh(
    `grep -rl "export async function \\(POST\\|PUT\\|DELETE\\|PATCH\\)" app/ apps/ --include="*.ts" 2>/dev/null | ` +
    `xargs grep -L "apiAuthGuard\\|apiRequireAdmin\\|apiRequireInstructor\\|withAuth\\|getCurrentUser\\|getUser" 2>/dev/null | head -20`
  );

  const unprotected = out.split('\n').filter(Boolean);

  if (unprotected.length === 0) {
    actions.push(ok('scan-auth-gaps', 'No unprotected mutation routes found'));
    return actions;
  }

  actions.push(error('scan-auth-gaps', `${unprotected.length} unprotected route(s) found:\n${unprotected.join('\n')}`));

  if (!dryRun) {
    for (const file of unprotected.slice(0, 10)) {
      // Add a prominent TODO at the top of the file
      const { code } = await sh(
        `sed -i '1s/^/\\/\\/ TODO(autofix): add apiAuthGuard or apiRequireAdmin — route has no auth guard\\n/' "${file}"`
      );
      actions.push(code === 0
        ? ok('mark-auth-gap', `Marked ${file}`)
        : error('mark-auth-gap', `Failed to mark ${file}`)
      );
    }
  } else {
    actions.push(skipped('mark-auth-gap', `dry-run: would mark ${unprotected.length} file(s)`));
  }

  return actions;
}

/**
 * env-gap: verify Northflank API configuration is present.
 */
async function playbookEnvGap(_dryRun: boolean): Promise<ActionResult[]> {
  const actions: ActionResult[] = [];
  const projectId = getNorthflankProjectId();

  if (!projectId) {
    actions.push(error('northflank-project', 'NORTHFLANK_PROJECT_ID is not configured'));
    return actions;
  }

  if (!isNorthflankReady()) {
    actions.push(error('northflank-token', 'NORTHFLANK_API_TOKEN is not configured'));
    return actions;
  }

  actions.push(ok('northflank-env', `Northflank env sync can run for project ${projectId}`));
  actions.push(skipped('secret-values', 'Secret values are not printed or audited from this endpoint'));

  return actions;
}

/**
 * devcontainer-readonly: switch DEVSTUDIO_DEVCONTAINER_MODE to github-only
 * and verify GITHUB_TOKEN is present.
 */
async function playbookDevcontainerReadonly(dryRun: boolean): Promise<ActionResult[]> {
  const actions: ActionResult[] = [];

  const hasToken = Boolean(process.env.GITHUB_TOKEN);
  if (!hasToken) {
    actions.push(error('check-github-token', 'GITHUB_TOKEN is not set in the admin runtime'));
    return actions;
  }
  actions.push(ok('check-github-token', 'GITHUB_TOKEN is present'));

  const currentMode = process.env.DEVSTUDIO_DEVCONTAINER_MODE ?? 'auto';
  if (currentMode === 'github-only') {
    actions.push(skipped('set-mode', 'Already in github-only mode'));
    return actions;
  }

  if (!dryRun) {
    actions.push(skipped('set-mode', 'Set DEVSTUDIO_DEVCONTAINER_MODE=github-only in the Northflank secret group, then redeploy'));
  } else {
    actions.push(skipped('set-mode', `dry-run: would set DEVSTUDIO_DEVCONTAINER_MODE=github-only (currently: ${currentMode})`));
  }

  return actions;
}

/**
 * stale-image: trigger Northflank builds for LMS/Admin.
 */
async function playbookStaleImage(dryRun: boolean, options: Record<string, unknown>): Promise<ActionResult[]> {
  const actions: ActionResult[] = [];
  const projectId = getNorthflankProjectId();
  if (!projectId || !isNorthflankReady()) {
    actions.push(error('northflank-config', 'Northflank API credentials are not configured'));
    return actions;
  }

  const requested = (options.services as string[] | undefined)?.length
    ? (options.services as string[])
    : getNorthflankServices().map((service) => service.id);

  for (const svc of requested) {
    if (!dryRun) {
      try {
        await triggerNorthflankBuild(projectId, svc);
        actions.push(ok('northflank-build', `${svc} build triggered`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        actions.push(error('northflank-build', `${svc} failed: ${msg.slice(0, 200)}`));
      }
    } else {
      actions.push(skipped('northflank-build', `dry-run: would trigger build for ${svc}`));
    }
  }

  return actions;
}

/**
 * northflank-env: read-only Northflank environment readiness check.
 */
async function playbookNorthflankEnv(): Promise<ActionResult[]> {
  return playbookEnvGap(true);
}

// ── Registry ──────────────────────────────────────────────────────────────────

const PLAYBOOKS: Record<string, (dryRun: boolean, options: Record<string, unknown>) => Promise<ActionResult[]>> = {
  'auth-gap':               (d) => playbookAuthGap(d),
  'env-gap':                (d) => playbookEnvGap(d),
  'devcontainer-readonly':  (d) => playbookDevcontainerReadonly(d),
  'stale-image':            (d, o) => playbookStaleImage(d, o),
  'northflank-env':         () => playbookNorthflankEnv(),
};

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const body = (await request.json().catch(() => ({}))) as AutofixRequest;
    const { playbook, dryRun = false, options = {} } = body;

    if (!playbook) return safeError('playbook is required', 400);
    if (!PLAYBOOKS[playbook]) {
      return safeError(
        `Unknown playbook "${playbook}". Available: ${Object.keys(PLAYBOOKS).join(', ')}`,
        400,
      );
    }

    const actions = await PLAYBOOKS[playbook](dryRun, options);
    const hasErrors = actions.some((a) => a.status === 'error');

    const result: PlaybookResult = {
      ok: !hasErrors,
      playbook,
      dryRun,
      actions,
      summary: hasErrors
        ? `${actions.filter((a) => a.status === 'error').length} issue(s) found — review actions`
        : `${actions.filter((a) => a.status === 'ok').length} action(s) completed successfully`,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err) {
    return safeInternalError(err, 'Autofix playbook failed');
  }
}

export async function GET(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  return NextResponse.json({
    endpoint: '/api/devstudio/autofix',
    method: 'POST',
    playbooks: {
      'auth-gap':              'Scan for unprotected API routes; mark with TODO in non-dry-run',
      'env-gap':               'Check Northflank env sync configuration',
      'devcontainer-readonly': 'Verify GITHUB_TOKEN and remind operator to set github-only mode in Northflank',
      'stale-image':           'Trigger Northflank builds for services',
      'northflank-env':        'Read-only Northflank env readiness check',
    },
    body: {
      playbook: 'string (required)',
      dryRun: 'boolean (default false) — report only, no writes',
      options: 'object — playbook-specific options (e.g. { services, cluster } for stale-image)',
    },
  });
}
