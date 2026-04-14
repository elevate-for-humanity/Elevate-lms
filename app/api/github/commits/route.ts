// GET /api/github/commits?repo=owner/repo&branch=main
// Returns recent commit history for the dev studio commit log panel.

import { NextRequest, NextResponse } from 'next/server';
import { getUserOctokit } from '@/lib/github';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function _GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo');
  const branch = searchParams.get('branch') || 'main';

  if (!repo) {
    return NextResponse.json({ error: 'Missing required param: repo' }, { status: 400 });
  }

  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    return NextResponse.json({ error: 'repo must be in owner/repo format' }, { status: 400 });
  }

  const userToken = req.headers.get('x-gh-token');

  try {
    const octokit = userToken ? getUserOctokit(userToken) : null;
    if (!octokit) {
      return NextResponse.json({ error: 'GitHub token required' }, { status: 401 });
    }

    const { data } = await octokit.repos.listCommits({
      owner,
      repo: repoName,
      sha: branch,
      per_page: 30,
    });

    const commits = data.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.commit.author?.name ?? 'Unknown',
      date: c.commit.author?.date ?? '',
      url: c.html_url,
    }));

    return NextResponse.json(commits);
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json(
      { error: err?.message ?? 'Failed to fetch commits' },
      { status }
    );
  }
}

export const GET = withApiAudit('/api/github/commits', _GET);
