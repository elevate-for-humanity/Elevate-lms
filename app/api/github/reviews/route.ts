

import { NextRequest, NextResponse } from 'next/server';
import { gh, parseRepo, getUserOctokit } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

// Get reviews for a PR
async function _GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

const userToken = req.headers.get('x-gh-token');
  const repo = req.nextUrl.searchParams.get('repo');
  const prNumber = req.nextUrl.searchParams.get('pr');

  if (!repo || !prNumber) {
    return NextResponse.json({ error: 'Missing repo or pr parameter' }, { status: 400 });
  }

  try {
    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    const { data: reviews } = await client.pulls.listReviews({
      owner,
      repo: name,
      pull_number: parseInt(prNumber),
    });

    const { data: comments } = await client.pulls.listReviewComments({
      owner,
      repo: name,
      pull_number: parseInt(prNumber),
    });

    return NextResponse.json({
      reviews: reviews.map(r => ({
        id: r.id,
        state: r.state,
        body: r.body,
        user: { login: r.user?.login, avatar_url: r.user?.avatar_url },
        submitted_at: r.submitted_at,
        commit_id: r.commit_id,
      })),
      comments: comments.map(c => ({
        id: c.id,
        body: c.body,
        path: c.path,
        line: c.line,
        side: c.side,
        user: { login: c.user?.login, avatar_url: c.user?.avatar_url },
        created_at: c.created_at,
        in_reply_to_id: c.in_reply_to_id,
        diff_hunk: c.diff_hunk,
      })),
    });
  } catch (error) {
    logger.error('GitHub reviews GET error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch reviews', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Submit a review
async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;



  const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, pr, event, body, comments } = await req.json();

    if (!repo || !pr || !event) {
      return NextResponse.json(
        { error: 'Missing required fields (repo, pr, event)' },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // event: APPROVE, REQUEST_CHANGES, COMMENT
    const { data: review } = await client.pulls.createReview({
      owner,
      repo: name,
      pull_number: parseInt(pr),
      event,
      body: body || '',
      comments: comments?.map((c: any) => ({
        path: c.path,
        line: c.line,
        side: c.side || 'RIGHT',
        body: c.body,
      })),
    });

    return NextResponse.json({
      id: review.id,
      state: review.state,
      body: review.body,
      submitted_at: review.submitted_at,
    });
  } catch (error) {
    logger.error('GitHub submit review error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to submit review', message: toErrorMessage(error) },
      {
 status: 500 }
    );
  }
}

// Add inline comment to a PR
async function _PUT(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, pr, body, path, line, side, commit_id, in_reply_to } = await req.json();

    if (!repo || !pr || !body) {
      return NextResponse.json(
        { error: 'Missing required fields (repo, pr, body)' },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Reply to existing comment
    if (in_reply_to) {
      const { data: comment } = await client.pulls.createReplyForReviewComment({
        owner,
        repo: name,
        pull_number: parseInt(pr),
        comment_id: in_reply_to,
        body,
      });

      return NextResponse.json({
        id: comment.id,
        body: comment.body,
        created_at: comment.created_at,
      });
    }

    // Create new inline comment
    if (!path || !commit_id) {
      return NextResponse.json(
        { error: 'Missing path or commit_id for new comment' },
        { status: 400 }
      );
    }

    const { data: comment } = await client.pulls.createReviewComment({
      owner,
      repo: name,
      pull_number: parseInt(pr),
      body,
      path,
      line: line || 1,
      side: side || 'RIGHT',
      commit_id,
    });

    return NextResponse.json({
      id: comment.id,
      body: comment.body,
      path: comment.path,
      line: comment.line,
      created_at: comment.created_at,
    });
  } catch (error) {
    logger.error('GitHub inline comment error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to add comment', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/github/reviews', _GET);
export const POST = withApiAudit('/api/github/reviews', _POST);
export const PUT = withApiAudit('/api/github/reviews', _PUT);
