export const runtime = 'edge';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { gh, parseRepo, getUserOctokit } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// Check for merge conflicts between branches
async function _GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;
const userToken = req.headers.get('x-gh-token');
  const repo = req.nextUrl.searchParams.get('repo');
  const base = req.nextUrl.searchParams.get('base') || 'main';
  const head = req.nextUrl.searchParams.get('head');

  if (!repo || !head) {
    return NextResponse.json({ error: 'Missing repo or head parameter' }, { status: 400 });
  }

  try {
    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Compare branches to check for conflicts
    const { data: comparison } = await client.repos.compareCommits({
      owner,
      repo: name,
      base,
      head,
    });

    // Get the merge status by attempting a test merge
    let hasConflicts = false;
    let conflictFiles: string[] = [];

    try {
      // Try to get merge commit - if it fails, there are conflicts
      const { data: mergeBase } = await client.repos.compareCommits({
        owner,
        repo: name,
        base: head,
        head: base,
      });

      // Check if branches have diverged
      if (comparison.behind_by > 0 && comparison.ahead_by > 0) {
        // Branches have diverged - potential conflicts
        // Get files changed in both branches
        const baseFiles = new Set(comparison.files?.map(f => f.filename) || []);
        const headFiles = new Set(mergeBase.files?.map(f => f.filename) || []);
        
        // Files changed in both branches are potential conflicts
        conflictFiles = [...baseFiles].filter(f => headFiles.has(f));
        hasConflicts = conflictFiles.length > 0;
      }
    } catch {
      // If comparison fails, assume conflicts
      hasConflicts = true;
    }

    return NextResponse.json({
      hasConflicts,
      conflictFiles,
      aheadBy: comparison.ahead_by,
      behindBy: comparison.behind_by,
      totalCommits: comparison.total_commits,
      files: comparison.files?.map(f => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        changes: f.changes,
      })) || [],
    });
  } catch (error) {
    logger.error('GitHub conflicts check error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to check conflicts', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Get file content for conflict resolution
async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;


  const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, path, base, head } = await req.json();

    if (!repo || !path) {
      return NextResponse.json({ error: 'Missing repo or path' }, { status: 400 });
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Get file content from both branches
    const [baseContent, headContent] = await Promise.all([
      client.repos.getContent({
        owner,
        repo: name,
        path,
        ref: base || 'main',
      }).then(res => {
        const data = res.data as { content?: string; encoding?: string };
        if (data.content && data.encoding === 'base64') {
          return Buffer.from(data.content, 'base64').toString('utf-8');
        }
        return '';
      }).catch(() => ''),
      client.repos.getContent({
        owner,
        repo: name,
        path,
        ref: head,
      }).then(res => {
        const data = res.data as { content?: string; encoding?: string };
        if (data.content && data.encoding === 'base64') {
          return Buffer.from(data.content, 'base64').toString('utf-8');
        }
        return '';
      }).catch(() => ''),
    ]);

    return NextResponse.json({
      path,
      base: {
        ref: base || 'main',
        content: baseContent,
      },
      head: {
        ref: head,
        content: headContent,
      },
    });
  } catch (error) {
    logger.error('GitHub get conflict content error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to get file content', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/github/conflicts', _GET);
export const POST = withApiAudit('/api/github/conflicts', _POST);
