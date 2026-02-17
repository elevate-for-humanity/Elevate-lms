export const runtime = 'edge';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { gh, parseRepo, getUserOctokit } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

// Commit resolved conflict files and complete merge
export async function POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

  const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, base, head, resolutions, message } = await req.json();

    if (!repo || !base || !head || !resolutions || !Array.isArray(resolutions)) {
      return NextResponse.json(
        { error: 'Missing required fields (repo, base, head, resolutions)' },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Get the current head commit
    const { data: headRef } = await client.git.getRef({
      owner,
      repo: name,
      ref: `heads/${head}`,
    });
    const headSha = headRef.object.sha;

    // Get the base commit
    const { data: baseRef } = await client.git.getRef({
      owner,
      repo: name,
      ref: `heads/${base}`,
    });
    const baseSha = baseRef.object.sha;

    // Get the current tree
    const { data: headCommit } = await client.git.getCommit({
      owner,
      repo: name,
      commit_sha: headSha,
    });

    // Create blobs for each resolved file
    const treeItems: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];

    for (const resolution of resolutions) {
      const { data: blob } = await client.git.createBlob({
        owner,
        repo: name,
        content: Buffer.from(resolution.content).toString('base64'),
        encoding: 'base64',
      });

      treeItems.push({
        path: resolution.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      });
    }

    // Create a new tree with the resolved files
    const { data: newTree } = await client.git.createTree({
      owner,
      repo: name,
      base_tree: headCommit.tree.sha,
      tree: treeItems,
    });

    // Create a merge commit with two parents
    const { data: mergeCommit } = await client.git.createCommit({
      owner,
      repo: name,
      message: message || `Merge branch '${base}' into ${head}`,
      tree: newTree.sha,
      parents: [headSha, baseSha],
    });

    // Update the head branch to point to the merge commit
    await client.git.updateRef({
      owner,
      repo: name,
      ref: `heads/${head}`,
      sha: mergeCommit.sha,
    });

    return NextResponse.json({
      ok: true,
      sha: mergeCommit.sha,
      message: `Successfully merged ${base} into ${head}`,
    });
  } catch (error) {
    logger.error('GitHub merge error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to complete merge', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Check merge status between branches
export async function GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

const userToken = req.headers.get('x-gh-token');
  const repo = req.nextUrl.searchParams.get('repo');
  const base = req.nextUrl.searchParams.get('base');
  const head = req.nextUrl.searchParams.get('head');

  if (!repo || !base || !head) {
    return NextResponse.json({ error: 'Missing repo, base, or head' }, { status: 400 });
  }

  try {
    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Compare branches
    const { data: comparison } = await client.repos.compareCommits({
      owner,
      repo: name,
      base,
      head,
    });

    // Check if merge is possible
    let canMerge = true;
    let conflictFiles: string[] = [];

    if (comparison.behind_by > 0) {
      // Head is behind base - check for conflicts
      const { data: reverseComparison } = await client.repos.compareCommits({
        owner,
        repo: name,
        base: head,
        head: base,
      });

      // Files changed in both directions are potential conflicts
      const headFiles = new Set(comparison.files?.map(f => f.filename) || []);
      const baseFiles = new Set(reverseComparison.files?.map(f => f.filename) || []);
      
      conflictFiles = [...headFiles].filter(f => baseFiles.has(f));
      canMerge = conflictFiles.length === 0;
    }

    return NextResponse.json({
      canMerge,
      conflictFiles,
      aheadBy: comparison.ahead_by,
      behindBy: comparison.behind_by,
      status: canMerge ? 'clean' : 'conflicts',
    });
  } catch (error) {
    logger.error('GitHub merge check error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to check merge status', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
