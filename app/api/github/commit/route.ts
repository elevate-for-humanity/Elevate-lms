export const runtime = 'edge';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { gh, parseRepo, getUserOctokit } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, path, branch, content, sha, message } = await req.json();

    if (!repo || !path || !content) {
      return NextResponse.json(
        {
          error: 'Missing required fields (repo, path, content)',
        },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    const commitMessage = message || `update: ${path}`;

    // Commit new version of file
    const res = await client.repos.createOrUpdateFileContents({
      owner,
      repo: name,
      path,
      message: commitMessage,
      content: Buffer.from(content).toString('base64'),
      sha,
      branch: branch || 'main',
    });

    return NextResponse.json({
      ok: true,
      commit: res.data.commit.sha,
      content: {
        sha: res.data.content?.sha,
        path: res.data.content?.path,
      },
      message: commitMessage,
    });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'GitHub commit error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Failed to commit file',
        message: toErrorMessage(error),
        status: error.status,
      },
      { status: error.status || 500 }
    );
  }
}
