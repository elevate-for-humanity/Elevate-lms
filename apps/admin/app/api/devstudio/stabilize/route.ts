import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type StepStatus = 'passed' | 'failed' | 'skipped';

type StepResult = {
  id: string;
  label: string;
  command: string;
  status: StepStatus;
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
};

type StabilizeRequest = {
  quick?: boolean;            // default true
  includeTests?: boolean;     // default true
  includeSmoke?: boolean;     // default false (env-heavy)
  maxOutputKb?: number;       // default 256 KB per step
};

type CmdDef = {
  id: string;
  label: string;
  command: string;
  when?: (opts: Required<StabilizeRequest>) => boolean;
};

const DEFAULTS: Required<StabilizeRequest> = {
  quick: true,
  includeTests: true,
  includeSmoke: false,
  maxOutputKb: 256,
};

function truncate(text: string, maxBytes: number): string {
  const buf = Buffer.from(text, 'utf8');
  if (buf.byteLength <= maxBytes) return text;
  return `${buf.subarray(0, maxBytes).toString('utf8')}\n\n[truncated ${buf.byteLength - maxBytes} bytes]`;
}

function runCommand(command: string, cwd: string, maxBytes: number): Promise<StepResult> {
  const started = Date.now();

  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let out = '';
    let err = '';

    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));

    child.on('close', (code) => {
      const durationMs = Date.now() - started;
      resolve({
        id: '',
        label: '',
        command,
        status: code === 0 ? 'passed' : 'failed',
        exitCode: code,
        durationMs,
        stdout: truncate(out, maxBytes),
        stderr: truncate(err, maxBytes),
      });
    });

    child.on('error', (e) => {
      const durationMs = Date.now() - started;
      resolve({
        id: '',
        label: '',
        command,
        status: 'failed',
        exitCode: null,
        durationMs,
        stdout: '',
        stderr: String(e),
      });
    });
  });
}

function buildPlan(opts: Required<StabilizeRequest>): CmdDef[] {
  return [
    { id: 'audit-admin', label: 'Admin audit', command: 'pnpm -s audit:admin' },
    { id: 'audit-dashboard', label: 'Dashboard audit', command: 'pnpm -s audit:dashboard' },
    { id: 'audit-schema-refs', label: 'Schema refs audit', command: 'bash scripts/audit-schema-refs.sh' },
    { id: 'audit-auth-gaps', label: 'Auth gaps audit', command: 'bash scripts/audit-auth-gaps.sh' },
    { id: 'audit-env-vars', label: 'Env var audit', command: 'bash scripts/audit-env-vars.sh' },
    {
      id: 'unit-tests',
      label: 'Unit tests',
      command: opts.quick
        ? 'pnpm -s vitest run tests/unit/auth-redirects.test.ts tests/unit/enrollment-auth.test.ts'
        : 'pnpm -s vitest run',
      when: (o) => o.includeTests,
    },
    {
      id: 'smoke',
      label: 'Smoke tests',
      command: 'pnpm -s test:smoke',
      when: (o) => o.includeSmoke,
    },
  ];
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const body = (await request.json().catch(() => ({}))) as StabilizeRequest;
    const opts: Required<StabilizeRequest> = { ...DEFAULTS, ...body };

    if (opts.maxOutputKb < 32 || opts.maxOutputKb > 2048) {
      return safeError('maxOutputKb must be between 32 and 2048', 400);
    }

    const repoRoot = path.resolve(process.cwd());
    const maxBytes = opts.maxOutputKb * 1024;

    const plan = buildPlan(opts);
    const results: StepResult[] = [];

    for (const step of plan) {
      if (step.when && !step.when(opts)) {
        results.push({
          id: step.id,
          label: step.label,
          command: step.command,
          status: 'skipped',
          exitCode: null,
          durationMs: 0,
          stdout: '',
          stderr: '',
        });
        continue;
      }

      const r = await runCommand(step.command, repoRoot, maxBytes);
      results.push({ ...r, id: step.id, label: step.label, command: step.command });
    }

    const failed = results.filter((r) => r.status === 'failed');
    const passed = results.filter((r) => r.status === 'passed');
    const skipped = results.filter((r) => r.status === 'skipped');

    // Map known failure IDs to autofix playbooks
    const AUTOFIX_MAP: Record<string, string> = {
      'audit-auth-gaps':  'auth-gap',
      'audit-env-vars':   'env-gap',
    };
    const suggestedFixes = failed
      .filter((r) => AUTOFIX_MAP[r.id])
      .map((r) => ({ step: r.id, playbook: AUTOFIX_MAP[r.id], endpoint: '/api/devstudio/autofix' }));

    return NextResponse.json({
      ok: failed.length === 0,
      summary: {
        total: results.length,
        passed: passed.length,
        failed: failed.length,
        skipped: skipped.length,
      },
      options: opts,
      results,
      suggestedFixes,
      nextActions:
        failed.length === 0
          ? ['All stabilization checks passed', 'Safe to proceed with commit/PR']
          : [
              'Review failed steps below',
              ...suggestedFixes.map((f) => `POST ${f.endpoint} { "playbook": "${f.playbook}" } to auto-fix ${f.step}`),
              'Re-run /api/devstudio/stabilize after fixes',
            ],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to run stabilize orchestrator');
  }
}

export async function GET(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  return NextResponse.json({
    endpoint: '/api/devstudio/stabilize',
    method: 'POST',
    body: {
      quick: 'boolean (default true)',
      includeTests: 'boolean (default true)',
      includeSmoke: 'boolean (default false)',
      maxOutputKb: 'number 32..2048 (default 256)',
    },
  });
}
