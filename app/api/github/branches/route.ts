export const runtime = 'edge';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { gh, parseRepo, getUserOctokit } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;
const repo = req.nextUrl.searchParams.get('repo');
  const userToken = req.headers.get('x-gh-token');

  if (!repo) {
    return NextResponse.json(
      { error: 'Missing repo parameter' },
      { status: 400 }
    );
  }

  try {
    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    const { data } = await client.repos.listBranches({
      owner,
      repo: name,
      per_page: 100,
    });

    // Get detailed branch info including protection status
    const branches = data.map((branch) => ({
      name: branch.name,
      commit: {
        sha: branch.commit.sha,
        url: branch.commit.url,
      },
      protected: branch.protected,
    }));

    return NextResponse.json(branches);
  } catch (error) { 
    logger.error(
      'GitHub branches error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch branches',
        message: toErrorMessage(error),
        status: error.status,
      },
      { status: error.status || 500 }
    );
  }
}

async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;


  const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, name: branchName, from } = await req.json();

    if (!repo || !branchName) {
      return NextResponse.json(
        { error: 'Missing required fields (repo, name)' },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Get the SHA of the source branch (default to main)
    const sourceBranch = from || 'main';
    const { data: refData } = await client.git.getRef({
      owner,
      repo: name,
      ref: `heads/${sourceBranch}`,
    });

    // Create the new branch
    const { data } = await client.git.createRef({
      owner,
      repo: name,
      ref: `refs/heads/${branchName}`,
      sha: refData.object.sha,
    });

    return NextResponse.json({
      ok: true,
      name: branchName,
      sha: data.object.sha,
      url: data.url,
    });
  } catch (error) {
    logger.error(
      'GitHub create branch error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Failed to create branch',
        message: toErrorMessage(error),
        status: error.status,
      },
      { status: error.status || 500 }
    );
  }
}
export const GET = withApiAudit('/api/github/branches', _GET);
export const POST = withApiAudit('/api/github/branches', _POST);
