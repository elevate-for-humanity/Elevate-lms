/**
 * /api/devstudio/autofix
 *
 * Phase 3 auto-fix playbooks. Invoked by the stabilize orchestrator when it
 * detects known failure patterns, or called directly from DevStudio UI.
 *
 * Supported playbooks:
 *   auth-gap          — adds apiAuthGuard to unprotected API routes
 *   env-gap           — legacy AWS check for missing SSM params
 *   devcontainer-readonly — rotates/sets GITHUB_TOKEN + switches mode to github-only
 *   stale-image       — legacy AWS force-redeploy check
 *   ssm-placeholder   — lists SSM params still set to PLACEHOLDER
 *
 * POST body: { playbook: string; dryRun?: boolean; options?: Record<string, unknown> }
 * Response:  { ok, playbook, dryRun, actions: ActionResult[], summary, timestamp }
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

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
 * env-gap: find SSM params still set to PLACEHOLDER and report them.
 * In non-dry-run mode, lists them with their SSM paths so ops can act.
 */
async function playbookEnvGap(dryRun: boolean): Promise<ActionResult[]> {
  const actions: ActionResult[] = [];

  const { code, out, err } = await sh(
    `aws ssm get-parameters-by-path --path /elevate/ --with-decryption --recursive --output json 2>/dev/null`
  );

  if (code !== 0) {
    actions.push(error('ssm-scan', `AWS CLI error: ${err}`));
    return actions;
  }

  let params: Array<{ Name: string; Value: string }> = [];
  try {
    params = JSON.parse(out).Parameters ?? [];
  } catch {
    actions.push(error('ssm-scan', 'Failed to parse SSM response'));
    return actions;
  }

  const placeholders = params.filter((p) =>
    p.Value === 'PLACEHOLDER' || p.Value === '' || p.Value === 'placeholder'
  );

  if (placeholders.length === 0) {
    actions.push(ok('ssm-scan', `All ${params.length} SSM params are set`));
    return actions;
  }

  const names = placeholders.map((p) => p.Name).join('\n');
  actions.push(error('ssm-scan', `${placeholders.length} placeholder param(s):\n${names}`));

  if (!dryRun) {
    actions.push(skipped('ssm-fill', 'Cannot auto-fill secrets — provide real values via AWS Console or CLI'));
  } else {
    actions.push(skipped('ssm-fill', `dry-run: ${placeholders.length} param(s) need real values`));
  }

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
    actions.push(error('check-github-token', 'GITHUB_TOKEN is not set — configure GITHUB_TOKEN in Northflank runtime env'));
    return actions;
  }
  actions.push(ok('check-github-token', 'GITHUB_TOKEN is present'));

  const currentMode = process.env.DEVSTUDIO_DEVCONTAINER_MODE ?? 'auto';
  if (currentMode === 'github-only') {
    actions.push(skipped('set-mode', 'Already in github-only mode'));
    return actions;
  }

  if (!dryRun) {
    const { code, err } = await sh(
      `aws ssm put-parameter --name /elevate/DEVSTUDIO_DEVCONTAINER_MODE --value github-only --type String --overwrite 2>&1`
    );
    actions.push(code === 0
      ? ok('set-mode', 'DEVSTUDIO_DEVCONTAINER_MODE set to github-only — redeploy to apply')
      : error('set-mode', `SSM update failed: ${err}`)
    );
  } else {
    actions.push(skipped('set-mode', `dry-run: would set DEVSTUDIO_DEVCONTAINER_MODE=github-only (currently: ${currentMode})`));
  }

  return actions;
}

/**
 * stale-image: force-redeploy ECS services to pull latest ECR image.
 */
async function playbookStaleImage(dryRun: boolean, options: Record<string, unknown>): Promise<ActionResult[]> {
  const actions: ActionResult[] = [];
  const services = (options.services as string[]) ?? ['elevate-lms-service', 'elevate-admin-service'];
  const cluster = (options.cluster as string) ?? 'elevate-cluster';

  for (const svc of services) {
    if (!dryRun) {
      const { code, err } = await sh(
        `aws ecs update-service --cluster ${cluster} --service ${svc} --force-new-deployment --output json 2>&1`
      );
      actions.push(code === 0
        ? ok('force-redeploy', `${svc} redeployment triggered`)
        : error('force-redeploy', `${svc} failed: ${err.slice(0, 200)}`)
      );
    } else {
      actions.push(skipped('force-redeploy', `dry-run: would force-redeploy ${svc}`));
    }
  }

  return actions;
}

/**
 * ssm-placeholder: list all SSM params still set to PLACEHOLDER (read-only audit).
 */
async function playbookSsmPlaceholder(): Promise<ActionResult[]> {
  return playbookEnvGap(true); // reuse env-gap in dry-run mode
}

// ── Registry ──────────────────────────────────────────────────────────────────

const PLAYBOOKS: Record<string, (dryRun: boolean, options: Record<string, unknown>) => Promise<ActionResult[]>> = {
  'auth-gap':               (d) => playbookAuthGap(d),
  'env-gap':                (d) => playbookEnvGap(d),
  'devcontainer-readonly':  (d) => playbookDevcontainerReadonly(d),
  'stale-image':            (d, o) => playbookStaleImage(d, o),
  'ssm-placeholder':        () => playbookSsmPlaceholder(),
};

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
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
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  return NextResponse.json({
    endpoint: '/api/devstudio/autofix',
    method: 'POST',
    playbooks: {
      'auth-gap':              'Scan for unprotected API routes; mark with TODO in non-dry-run',
      'env-gap':               'Find SSM params still set to PLACEHOLDER',
      'devcontainer-readonly': 'Switch DEVSTUDIO_DEVCONTAINER_MODE to github-only',
      'stale-image':           'Legacy AWS redeploy check',
      'ssm-placeholder':       'List all SSM placeholder params (read-only)',
    },
    body: {
      playbook: 'string (required)',
      dryRun: 'boolean (default false) — report only, no writes',
      options: 'object — playbook-specific options (e.g. { services, cluster } for stale-image)',
    },
  });
}
