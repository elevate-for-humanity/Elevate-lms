

import { NextRequest, NextResponse } from 'next/server';
import { gh, parseRepo, getUserOctokit } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

// Get diff between two refs or for a specific file
async function _GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;
const userToken = req.headers.get('x-gh-token');
  const repo = req.nextUrl.searchParams.get('repo');
  const base = req.nextUrl.searchParams.get('base') || 'HEAD~1';
  const head = req.nextUrl.searchParams.get('head') || 'HEAD';
  const path = req.nextUrl.searchParams.get('path');

  if (!repo) {
    return NextResponse.json({ error: 'Missing repo parameter' }, { status: 400 });
  }

  try {
    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    const { data } = await client.repos.compareCommits({
      owner,
      repo: name,
      base,
      head,
    });

    let files = data.files || [];
    
    // Filter to specific path if provided
    if (path) {
      files = files.filter(f => f.filename === path);
    }

    return NextResponse.json({
      base_commit: data.base_commit.sha,
      head_commit: data.commits[data.commits.length - 1]?.sha || head,
      ahead_by: data.ahead_by,
      behind_by: data.behind_by,
      total_commits: data.total_commits,
      files: files.map(f => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        changes: f.changes,
        patch: f.patch,
        previous_filename: f.previous_filename,
      })),
    });
  } catch (error) {
    logger.error('GitHub diff error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to get diff', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/github/diff', _GET);
