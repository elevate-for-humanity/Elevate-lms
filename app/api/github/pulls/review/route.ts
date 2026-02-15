export const runtime = 'edge';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { gh, parseRepo, getUserOctokit } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// Submit a review
export async function POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, number, event, body, comments } = await req.json();

    if (!repo || !number || !event) {
      return NextResponse.json(
        { error: 'Missing required fields (repo, number, event)' },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    const { data: review } = await client.pulls.createReview({
      owner,
      repo: name,
      pull_number: number,
      event: event as 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
      body: body || '',
      comments: comments || [],
    });

    return NextResponse.json({
      id: review.id,
      state: review.state,
      body: review.body,
      user: review.user?.login,
      submitted_at: review.submitted_at,
    });
  } catch (error) {
    logger.error('GitHub review error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to submit review', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Add a comment to PR
export async function PUT(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userToken = req.headers.get('x-gh-token');

  try {
    const { repo, number, body, path, line, side, commit_id } = await req.json();

    if (!repo || !number || !body) {
      return NextResponse.json(
        { error: 'Missing required fields (repo, number, body)' },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Inline review comment
    if (path && line) {
      const { data: comment } = await client.pulls.createReviewComment({
        owner,
        repo: name,
        pull_number: number,
        body,
        path,
        line,
        side: side || 'RIGHT',
        commit_id: commit_id,
      });

      return NextResponse.json({
        id: comment.id,
        body: comment.body,
        path: comment.path,
        line: comment.line,
        user: comment.user?.login,
        created_at: comment.created_at,
      });
    }

    // Regular issue comment
    const { data: comment } = await client.issues.createComment({
      owner,
      repo: name,
      issue_number: number,
      body,
    });

    return NextResponse.json({
      id: comment.id,
      body: comment.body,
      user: comment.user?.login,
      created_at: comment.created_at,
    });
  } catch (error) {
    logger.error('GitHub comment error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to add comment', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
