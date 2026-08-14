import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    timestamp: new Date().toISOString(),
    typescript: { passed: false, errors: [] as string[], warnings: [] as string[] },
    eslint: { passed: false, errors: [] as string[], warnings: [] as string[] },
    build: { passed: false, errors: [] as string[] },
    links: { passed: false, broken: [] as string[] },
    summary: ''
  };

  // Run TypeScript check
  try {
    const { stdout, stderr } = await execAsync('cd /workspace/project/Elevate-lms && pnpm typecheck 2>&1 || true', { timeout: 120000 });
    results.typescript.passed = !stderr.includes('error TS');
    if (stderr) {
      results.typescript.errors = stderr.split('\n').filter(l => l.includes('error TS')).slice(0, 20);
    }
  } catch (e: any) {
    results.typescript.passed = false;
    results.typescript.errors = [e.message];
  }

  // Run ESLint check
  try {
    const { stdout, stderr } = await execAsync('cd /workspace/project/Elevate-lms && pnpm lint 2>&1 || true', { timeout: 120000 });
    results.eslint.passed = !stderr.includes('error');
    if (stderr) {
      results.eslint.warnings = stderr.split('\n').filter(l => l.includes('warning')).slice(0, 20);
    }
  } catch (e: any) {
    results.eslint.passed = false;
    results.eslint.errors = [e.message];
  }

  const totalErrors = results.typescript.errors.length + results.eslint.errors.length;
  results.summary = `TypeScript: ${results.typescript.passed ? 'PASS' : 'FAIL'} | ESLint: ${results.eslint.passed ? 'PASS' : 'FAIL'} | Total Errors: ${totalErrors}`;

  return NextResponse.json({
    status: 'completed',
    scan: results
  });
}
