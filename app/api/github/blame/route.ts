// PUBLIC ROUTE: GitHub blame — dev tool, optional auth


import { NextRequest, NextResponse } from 'next/server';
import { gh, parseRepo, getUserOctokit } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

async function _GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const userToken = req.headers.get('x-gh-token');
  const repo = req.nextUrl.searchParams.get('repo');
  const path = req.nextUrl.searchParams.get('path');
  const ref = req.nextUrl.searchParams.get('ref') || 'main';

  if (!repo || !path) {
    return NextResponse.json(
      { error: 'Missing repo or path parameter' },
      { status: 400 }
    );
  }

  try {
    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // GitHub REST API doesn't have a direct blame endpoint
    // We need to use the GraphQL API for blame data
    const query = `
      query($owner: String!, $repo: String!, $ref: String!, $path: String!) {
        repository(owner: $owner, name: $repo) {
          object(expression: $ref) {
            ... on Commit {
              blame(path: $path) {
                ranges {
                  startingLine
                  endingLine
                  commit {
                    oid
                    message
                    author {
                      name
                      email
                      date
                      user {
                        login
                        avatarUrl
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken || process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { owner, repo: name, ref, path },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const blame = data.data?.repository?.object?.blame;
    if (!blame) {
      return NextResponse.json({ error: 'Could not get blame data' }, { status: 404 });
    }

    // Transform blame data into line-by-line format
    const lineBlame: Record<number, {
      sha: string;
      message: string;
      author: string;
      email: string;
      date: string;
      avatar?: string;
      login?: string;
    }> = {};

    for (const range of blame.ranges) {
      const commit = range.commit;
      for (let line = range.startingLine; line <= range.endingLine; line++) {
        lineBlame[line] = {
          sha: commit.oid,
          message: commit.message.split('\n')[0],
          author: commit.author.name,
          email: commit.author.email,
          date: commit.author.date,
          avatar: commit.author.user?.avatarUrl,
          login: commit.author.user?.login,
        };
      }
    }

    return NextResponse.json({
      path,
      ref,
      blame: lineBlame,
      totalLines: Object.keys(lineBlame).length,
    });
  } catch (error) {
    logger.error('Git blame error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to get blame', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/github/blame', _GET);
