

import { NextRequest, NextResponse } from 'next/server';
import { gh, parseRepo, getUserOctokit } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

// Git stash operations via GitHub API
// Note: GitHub API doesn't have native stash support, so we simulate it
// by creating temporary branches or storing in database

async function _GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

const userToken = req.headers.get('x-gh-token');
  const userId = req.headers.get('x-user-id');
  const repo = req.nextUrl.searchParams.get('repo');

  if (!repo) {
    return NextResponse.json({ error: 'Missing repo parameter' }, { status: 400 });
  }

  try {
    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // List branches that look like stashes (stash/*)
    const { data: branches } = await client.repos.listBranches({
      owner,
      repo: name,
      per_page: 100,
    });

    const stashes = branches
      .filter(b => b.name.startsWith('stash/'))
      .map(b => ({
        name: b.name,
        message: b.name.replace('stash/', '').replace(/-/g, ' '),
        sha: b.commit.sha,
        created: b.name.split('_')[1] || 'unknown',
      }));

    return NextResponse.json({ stashes });
  } catch (error) {
    logger.error('Git stash list error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to list stashes', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Create a stash (save current changes to a temporary branch)
async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;



  const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, branch, message, files } = await req.json();

    if (!repo || !branch || !files || files.length === 0) {
      return NextResponse.json(
        { error: 'repo, branch, and files required' },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Get current branch SHA
    const { data: ref } = await client.git.getRef({
      owner,
      repo: name,
      ref: `heads/${branch}`,
    });

    // Create stash branch name
    const timestamp = Date.now();
    const stashName = `stash/${message?.replace(/\s+/g, '-') || 'wip'}_${timestamp}`;

    // Create the stash branch
    await client.git.createRef({
      owner,
      repo: name,
      ref: `refs/heads/${stashName}`,
      sha: ref.object.sha,
    });

    // Commit the stashed files to the stash branch
    for (const file of files) {
      await client.repos.createOrUpdateFileContents({
        owner,
        repo: name,
        path: file.path,
        message: `stash: ${message || 'WIP'}`,
        content: Buffer.from(file.content).toString('base64'),
        branch: stashName,
        sha: file.sha,
      });
    }

    return NextResponse.json({
      ok: true,
      stashName,
      message: message || 'WIP',
      filesStashed: files.length,
    });
  } catch (error) {
    logger.error('Git stash create error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to create stash', message: toErrorMessage(error) },
      {
 status: 500 }
    );
  }
}

// Apply/pop a stash
async function _PUT(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, stashName, targetBranch, pop } = await req.json();

    if (!repo || !stashName) {
      return NextResponse.json(
        { error: 'repo and stashName required' },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Get files from stash branch
    const { data: tree } = await client.git.getTree({
      owner,
      repo: name,
      tree_sha: stashName,
      recursive: 'true',
    });

    const files = [];
    for (const item of tree.tree || []) {
      if (item.type === 'blob' && item.path) {
        const { data: file } = await client.repos.getContent({
          owner,
          repo: name,
          path: item.path,
          ref: stashName,
        });

        if (!Array.isArray(file) && file.content) {
          files.push({
            path: item.path,
            content: Buffer.from(file.content, 'base64').toString('utf8'),
            sha: file.sha,
          });
        }
      }
    }

    // If pop is true, delete the stash branch
    if (pop) {
      await client.git.deleteRef({
        owner,
        repo: name,
        ref: `heads/${stashName}`,
      });
    }

    return NextResponse.json({
      ok: true,
      files,
      deleted: pop,
    });
  } catch (error) {
    logger.error('Git stash apply error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
 error: 'Failed to apply stash', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Delete a stash
async function _DELETE(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, stashName } = await req.json();

    if (!repo || !stashName) {
      return NextResponse.json(
        { error: 'repo and stashName required' },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    await client.git.deleteRef({
      owner,
      repo: name,
      ref: `heads/${stashName}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('Git stash delete error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to delete stash', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/github/stash', _GET);
export const POST = withApiAudit('/api/github/stash', _POST);
export const PUT = withApiAudit('/api/github/stash', _PUT);
export const DELETE = withApiAudit('/api/github/stash', _DELETE);
