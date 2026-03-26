

import { NextRequest, NextResponse } from 'next/server';
import { gh, parseRepo, getUserOctokit } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

// Pull latest changes (fetch remote and get diff)
async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, branch } = await req.json();

    if (!repo || !branch) {
      return NextResponse.json(
        { error: 'Missing repo or branch' },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Get the latest commit on the remote branch
    const { data: remoteBranch } = await client.repos.getBranch({
      owner,
      repo: name,
      branch,
    });

    const latestSha = remoteBranch.commit.sha;

    // Get the commit details
    const { data: commit } = await client.repos.getCommit({
      owner,
      repo: name,
      ref: latestSha,
    });

    // Get list of files changed in recent commits
    const { data: commits } = await client.repos.listCommits({
      owner,
      repo: name,
      sha: branch,
      per_page: 10,
    });

    return NextResponse.json({
      ok: true,
      branch,
      latestSha,
      latestCommit: {
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.name,
        date: commit.commit.author?.date,
      },
      recentCommits: commits.map(c => ({
        sha: c.sha,
        message: c.commit.message,
        author: c.commit.author?.name,
        date: c.commit.author?.date,
      })),
      filesChanged: commit.files?.map(f => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
      })) || [],
    });
  } catch (error) {
    logger.error('GitHub pull error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to pull changes', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Sync local state with remote (refresh files)
async function _PUT(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, branch, currentSha } = await req.json();

    if (!repo || !branch) {
      return NextResponse.json(
        { error: 'Missing repo or branch' },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Get the latest commit
    const { data: remoteBranch } = await client.repos.getBranch({
      owner,
      repo: name,
      branch,
    });

    const latestSha = remoteBranch.commit.sha;

    // Check if there are new changes
    if (currentSha && currentSha === latestSha) {
      return NextResponse.json({
        ok: true,
        upToDate: true,
        message: 'Already up to date',
      });
    }

    // Get comparison if we have a current SHA
    let changedFiles: string[] = [];
    if (currentSha) {
      try {
        const { data: comparison } = await client.repos.compareCommits({
          owner,
          repo: name,
          base: currentSha,
          head: latestSha,
        });
        changedFiles = comparison.files?.map(f => f.filename) || [];
      } catch (err) {
          logger.error("Unhandled error", err instanceof Error ? err : undefined);
        }
    }

    return NextResponse.json({
      ok: true,
      upToDate: false,
      latestSha,
      changedFiles,
      message: `${changedFiles.length} files changed`,
    });
  } catch (error) {
    logger.error('GitHub sync error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to sync', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/github/pull', _POST);
export const PUT = withApiAudit('/api/github/pull', _PUT);
