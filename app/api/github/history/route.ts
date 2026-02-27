export const runtime = 'edge';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { gh, parseRepo, getUserOctokit } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// Get commit history
async function _GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userToken = req.headers.get('x-gh-token');
  const repo = req.nextUrl.searchParams.get('repo');
  const branch = req.nextUrl.searchParams.get('branch') || 'main';
  const path = req.nextUrl.searchParams.get('path');
  const perPage = parseInt(req.nextUrl.searchParams.get('per_page') || '30');
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');

  if (!repo) {
    return NextResponse.json({ error: 'Missing repo parameter' }, { status: 400 });
  }

  try {
    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    const params: {
      owner: string;
      repo: string;
      sha: string;
      per_page: number;
      page: number;
      path?: string;
    } = {
      owner,
      repo: name,
      sha: branch,
      per_page: perPage,
      page,
    };

    if (path) {
      params.path = path;
    }

    const { data } = await client.repos.listCommits(params);

    return NextResponse.json({
      commits: data.map(c => ({
        sha: c.sha,
        message: c.commit.message,
        author: {
          name: c.commit.author?.name,
          email: c.commit.author?.email,
          date: c.commit.author?.date,
          login: c.author?.login,
          avatar_url: c.author?.avatar_url,
        },
        committer: {
          name: c.commit.committer?.name,
          date: c.commit.committer?.date,
        },
        url: c.html_url,
        stats: c.stats,
      })),
      page,
      per_page: perPage,
    });
  } catch (error) {
    logger.error('GitHub history error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to get history', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/github/history', _GET);
