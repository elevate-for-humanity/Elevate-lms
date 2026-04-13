// PUBLIC ROUTE: GitHub tree — dev tool, optional auth


import { NextRequest, NextResponse } from 'next/server';
import { getUserOctokit, gh, parseRepo } from '@/lib/github';
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
  const ref = req.nextUrl.searchParams.get('ref') || 'main';
  const filterCourses = req.nextUrl.searchParams.get('courses') === 'true';

  if (!repo) {
    return NextResponse.json(
      { error: 'Missing repo parameter' },
      { status: 400 }
    );
  }

  try {
    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Get the latest commit for the ref
    const { data: commit } = await client.repos.getCommit({
      owner,
      repo: name,
      ref,
    });

    // Get the file tree recursively
    const { data: tree } = await client.git.getTree({
      owner,
      repo: name,
      tree_sha: commit.sha,
      recursive: 'true',
    });

    // Filter to only files (not directories)
    let files =
      tree.tree
        ?.filter((n) => n.type === 'blob')
        .map((n) => ({
          path: n.path!,
          sha: n.sha!,
          size: n.size!,
          mode: n.mode!,
          type: n.type!,
          url: n.url!,
        })) || [];

    // Filter course files if requested
    if (filterCourses) {
      files = files.filter(
        (f) =>
          f.path.includes('/courses/') ||
          f.path.startsWith('content/courses/') ||
          f.path.startsWith('lms-content/')
      );
    }

    // Sort files alphabetically
    files.sort((a, b) => a.path.localeCompare(b.path));

    return NextResponse.json({
      ref,
      commit: {
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author,
        date: commit.commit.author?.date,
      },
      files,
      total: files.length,
      truncated: tree.truncated,
    });
  } catch (error) { 
    logger.error(
      'GitHub tree error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch file tree',
        message: toErrorMessage(error),
        status: error.status,
      },
      { status: error.status || 500 }
    );
  }
}
export const GET = withApiAudit('/api/github/tree', _GET);
