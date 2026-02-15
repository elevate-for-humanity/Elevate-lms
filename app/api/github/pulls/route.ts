export const runtime = 'edge';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { gh, parseRepo, getUserOctokit } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// List pull requests
export async function GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userToken = req.headers.get('x-gh-token');
  const repo = req.nextUrl.searchParams.get('repo');
  const state = req.nextUrl.searchParams.get('state') || 'open';
  const prNumber = req.nextUrl.searchParams.get('number');

  if (!repo) {
    return NextResponse.json({ error: 'Missing repo parameter' }, { status: 400 });
  }

  try {
    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Get single PR if number provided
    if (prNumber) {
      const { data: pr } = await client.pulls.get({
        owner,
        repo: name,
        pull_number: parseInt(prNumber),
      });

      // Get PR reviews
      const { data: reviews } = await client.pulls.listReviews({
        owner,
        repo: name,
        pull_number: parseInt(prNumber),
      });

      // Get PR comments
      const { data: comments } = await client.issues.listComments({
        owner,
        repo: name,
        issue_number: parseInt(prNumber),
      });

      // Get review comments (inline)
      const { data: reviewComments } = await client.pulls.listReviewComments({
        owner,
        repo: name,
        pull_number: parseInt(prNumber),
      });

      return NextResponse.json({
        ...pr,
        reviews,
        comments,
        reviewComments,
      });
    }

    // List PRs
    const { data: pulls } = await client.pulls.list({
      owner,
      repo: name,
      state: state as 'open' | 'closed' | 'all',
      per_page: 30,
      sort: 'updated',
      direction: 'desc',
    });

    return NextResponse.json(pulls.map(pr => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      draft: pr.draft,
      user: {
        login: pr.user?.login,
        avatar_url: pr.user?.avatar_url,
      },
      head: {
        ref: pr.head.ref,
        sha: pr.head.sha,
      },
      base: {
        ref: pr.base.ref,
      },
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      merged_at: pr.merged_at,
      mergeable: pr.mergeable,
      mergeable_state: pr.mergeable_state,
      comments: pr.comments,
      review_comments: pr.review_comments,
      commits: pr.commits,
      additions: pr.additions,
      deletions: pr.deletions,
      changed_files: pr.changed_files,
    })));
  } catch (error) {
    logger.error('GitHub pulls error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch pull requests', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Create pull request
export async function POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, title, body, head, base, draft } = await req.json();

    if (!repo || !title || !head || !base) {
      return NextResponse.json(
        { error: 'Missing required fields (repo, title, head, base)' },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    const { data: pr } = await client.pulls.create({
      owner,
      repo: name,
      title,
      body: body || '',
      head,
      base,
      draft: draft || false,
    });

    return NextResponse.json({
      number: pr.number,
      title: pr.title,
      html_url: pr.html_url,
      state: pr.state,
      head: pr.head.ref,
      base: pr.base.ref,
    });
  } catch (error) {
    logger.error('GitHub create PR error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to create pull request', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Update pull request (merge, close, update)
export async function PUT(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, number, action, title, body, state, merge_method } = await req.json();

    if (!repo || !number) {
      return NextResponse.json(
        { error: 'Missing required fields (repo, number)' },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Merge PR
    if (action === 'merge') {
      const { data } = await client.pulls.merge({
        owner,
        repo: name,
        pull_number: number,
        merge_method: merge_method || 'squash',
      });

      return NextResponse.json({
        merged: data.merged,
        sha: data.sha,
        message: data.message,
      });
    }

    // Update PR
    const updates: any = {};
    if (title) updates.title = title;
    if (body !== undefined) updates.body = body;
    if (state) updates.state = state;

    const { data: pr } = await client.pulls.update({
      owner,
      repo: name,
      pull_number: number,
      ...updates,
    });

    return NextResponse.json({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      html_url: pr.html_url,
    });
  } catch (error) {
    logger.error('GitHub update PR error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to update pull request', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
