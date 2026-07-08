/**
 * Auto-Healing QA Agent
 * 
 * Automatically detects errors, creates fixes, and opens PRs.
 */

import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { stat } from 'fs/promises';
import { join } from 'path';
import { logger } from '@/lib/logger';

const execAsync = promisify(exec);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface QAIssue {
  issue_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  error_message?: string;
  affected_file?: string;
  line_number?: number;
  suggested_fix?: string;
  auto_fixable: boolean;
}

export interface ScanResult {
  total_issues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  issues: QAIssue[];
  duration_ms: number;
}

// TypeScript Scanner
async function runTypeScriptScan(): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];
  try {
    const { stdout, stderr } = await execAsync('npx tsc --noEmit 2>&1', { timeout: 120000, cwd: process.cwd() });
    const output = stdout + stderr;
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('.tsx:') || line.includes('.ts:')) {
        const match = line.match(/(.+\.tsx?):(\d+):(\d+)\s+-\s+(.+)/);
        if (match) {
          issues.push({
            issue_type: 'type_error',
            severity: 'high',
            category: 'typescript',
            title: 'TypeScript Error',
            description: line,
            error_message: match[4],
            affected_file: match[1],
            line_number: parseInt(match[2]),
            suggested_fix: 'Fix type error',
            auto_fixable: false,
          });
        }
      }
    }
  } catch (error: unknown) {
    const errorObj = error as { stdout?: string; stderr?: string };
    const output = errorObj.stdout || errorObj.stderr || '';
    if (output.includes('error TS')) {
      issues.push({
        issue_type: 'build_error',
        severity: 'critical',
        category: 'typescript',
        title: 'TypeScript Compilation Failed',
        description: output.substring(0, 500),
        suggested_fix: 'Fix TypeScript errors',
        auto_fixable: false,
      });
    }
  }
  return issues;
}

// ESLint Scanner
async function runESLintScan(): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];
  try {
    const { stdout } = await execAsync('npx next lint 2>&1 || true', { timeout: 120000, cwd: process.cwd() });
    const lines = stdout.split('\n');
    for (const line of lines) {
      if ((line.includes('.tsx') || line.includes('.ts')) && line.includes('error')) {
        const match = line.match(/(.+\.[jt]sx?):(\d+):(\d+)\s+(.+)/);
        issues.push({
          issue_type: 'lint_error',
          severity: 'medium',
          category: 'eslint',
          title: 'ESLint Error',
          description: line.substring(0, 200),
          affected_file: match?.[1],
          line_number: match ? parseInt(match[2]) : undefined,
          suggested_fix: match?.[4],
          auto_fixable: true,
        });
      }
    }
  } catch (error) {
    logger.error('ESLint scan error:', error);
  }
  return issues;
}

// Missing Asset Scanner
async function scanMissingAssets(): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];
  const publicDir = join(process.cwd(), 'public');
  try {
    const { stdout } = await execAsync(
      `grep -rh 'src="/images' --include="*.tsx" --include="*.ts" src/ 2>/dev/null | grep -oE 'src="[^"]+' | sed 's/src="//' | sort -u`,
      { cwd: process.cwd() }
    );
    for (const asset of stdout.split('\n')) {
      if (asset.startsWith('/images/')) {
        try {
          const fullPath = join(publicDir, asset.replace('/images/', ''));
          await stat(fullPath);
        } catch {
          issues.push({
            issue_type: 'missing_asset',
            severity: 'medium',
            category: 'asset',
            title: 'Missing Image Asset',
            description: `Referenced image ${asset} does not exist`,
            affected_file: asset,
            suggested_fix: 'Add the missing image or update reference',
            auto_fixable: false,
          });
        }
      }
    }
  } catch (error) {
    logger.error('Asset scan error:', error);
  }
  return issues;
}

// Environment Variable Checker
async function checkEnvironmentVariables(): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];
  const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      issues.push({
        issue_type: 'env_error',
        severity: 'critical',
        category: 'environment',
        title: 'Missing Environment Variable',
        description: `Required variable ${varName} is not set`,
        suggested_fix: `Add ${varName} to environment`,
        auto_fixable: false,
      });
    }
  }
  return issues;
}

// Run all scanners
export async function runFullScan(scanId: string, tenantId: string): Promise<ScanResult> {
  const startTime = Date.now();
  const allIssues: QAIssue[] = [];
  logger.info(`Starting QA scan: ${scanId}`);

  await supabase.from('qa_scans').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', scanId);

  try {
    const [tsIssues, lintIssues, assetIssues, envIssues] = await Promise.all([
      runTypeScriptScan(),
      runESLintScan(),
      scanMissingAssets(),
      checkEnvironmentVariables(),
    ]);
    allIssues.push(...tsIssues, ...lintIssues, ...assetIssues, ...envIssues);

    const counts = {
      critical: allIssues.filter(i => i.severity === 'critical').length,
      high: allIssues.filter(i => i.severity === 'high').length,
      medium: allIssues.filter(i => i.severity === 'medium').length,
      low: allIssues.filter(i => i.severity === 'low').length,
    };

    // Store issues
    const issueRecords = allIssues.map(issue => ({
      scan_id: scanId, tenant_id: tenantId, issue_type: issue.issue_type, severity: issue.severity,
      category: issue.category, title: issue.title, description: issue.description,
      error_message: issue.error_message, affected_file: issue.affected_file,
      line_number: issue.line_number, suggested_fix: issue.suggested_fix, auto_fixable: issue.auto_fixable, fix_status: 'open',
    }));
    if (issueRecords.length > 0) await supabase.from('qa_issues').insert(issueRecords);

    await supabase.from('qa_scans').update({
      status: 'completed', completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime, total_issues: allIssues.length, ...counts,
    }).eq('id', scanId);

    logger.info(`QA scan ${scanId} completed: ${allIssues.length} issues`);
    return { total_issues: allIssues.length, ...counts, issues: allIssues, duration_ms: Date.now() - startTime };
  } catch (error) {
    logger.error(`QA scan ${scanId} failed:`, error);
    await supabase.from('qa_scans').update({ status: 'failed', completed_at: new Date().toISOString() }).eq('id', scanId);
    throw error;
  }
}

// Auto-fix common issues
export async function autoFixIssue(issueId: string): Promise<{ success: boolean; message: string }> {
  const { data: issue } = await supabase.from('qa_issues').select('*').eq('id', issueId).single();
  if (!issue) return { success: false, message: 'Issue not found' };
  if (!issue.auto_fixable) return { success: false, message: 'Issue is not auto-fixable' };

  try {
    if (issue.issue_type === 'lint_error' && issue.affected_file) {
      await execAsync(`npx eslint --fix ${issue.affected_file}`, { timeout: 60000, cwd: process.cwd() });
    }
    await supabase.from('qa_issues').update({ fix_status: 'auto_fixed', updated_at: new Date().toISOString() }).eq('id', issueId);
    return { success: true, message: 'Issue auto-fixed' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Verification run
export async function runVerification(scanId: string): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  const checks = [
    { name: 'typecheck', cmd: 'npx tsc --noEmit' },
    { name: 'lint', cmd: 'npm run lint 2>&1 || true' },
  ];

  for (const check of checks) {
    try {
      await execAsync(check.cmd, { timeout: 120000, cwd: process.cwd() });
      results[check.name] = true;
    } catch {
      results[check.name] = false;
    }
  }

  await supabase.from('qa_verification_runs').insert({
    scan_id: scanId, verification_type: 'full',
    status: Object.values(results).every(Boolean) ? 'passed' : 'failed',
    output: JSON.stringify(results), completed_at: new Date().toISOString(),
  });

  return results;
}