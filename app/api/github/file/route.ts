

export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserOctokit,
  gh,
  parseRepo,
  getLanguageFromPath,
} from '@/lib/github';
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

    const { data } = await client.repos.getContent({
      owner,
      repo: name,
      path,
      ref,
    });

    // Handle directory vs file
    if (Array.isArray(data)) {
      return NextResponse.json(
        {
          error: 'Path is a directory, not a file',
        },
        { status: 400 }
      );
    }

    // Decode base64 content
    const content = Buffer.from(data.content || '', 'base64').toString('utf8');

    // Detect language for syntax highlighting
    const language = getLanguageFromPath(path);

    return NextResponse.json({
      content,
      sha: data.sha,
      size: data.size,
      name: data.name,
      path: data.path,
      language,
      encoding: data.encoding,
      url: data.url,
      git_url: data.git_url,
      html_url: data.html_url,
      download_url: data.download_url,
    });
  } catch (error) { 
    logger.error(
      'GitHub file read error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch file',
        message: toErrorMessage(error),
        status: error.status,
      },
      { status: error.status || 500 }
    );
  }
}

async function _PUT(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;


const userToken = req.headers.get('x-gh-token');

  try {
    const body = await req.json();
    const {
      repo,
      path,
      message,
      content,
      sha,
      branch = 'main',
      committer,
    } = body;

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

    // Build commit message
    const commitMessage = message || `Update ${path} via Dev Studio`;

    // Prepare request
    const requestData: any = {
      owner,
      repo: name,
      path,
      message: commitMessage,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch,
    };

    // Add SHA if updating existing file
    if (sha) {
      requestData.sha = sha;
    }

    // Add committer info if provided
    if (committer) {
      requestData.committer = committer;
    }

    const res = await client.repos.createOrUpdateFileContents(requestData);

    return NextResponse.json({
      ok: true,
      commit: res.data.commit.sha,
      content: {
        sha: res.data.content?.sha,
        path: res.data.content?.path,
        size: res.data.content?.size,
      },
      message: commitMessage,
    });
  } catch (error) { 
    logger.error(
      'GitHub file write error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Failed to save file',
        message: toErrorMessage(error),
        status: error.status,
      },
      {
 status: error.status || 500 }
    );
  }
}

async function _DELETE(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

const userToken = req.headers.get('x-gh-token');

  try {
    const body = await req.json();
    const { repo, path, message, sha, branch = 'main' } = body;

    if (!repo || !path || !sha) {
      return NextResponse.json(
        {
          error: 'Missing required fields (repo, path, sha)',
        },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    const commitMessage = message || `Delete ${path} via Dev Studio`;

    const res = await client.repos.deleteFile({
      owner,
      repo: name,
      path,
      message: commitMessage,
      sha,
      branch,
    });

    return NextResponse.json({
      ok: true,
      commit: res.data.commit.sha,
      message: commitMessage,
    });
  } catch (error) { 
    logger.error(
      'GitHub file delete error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Failed to delete file',
        message: toErrorMessage(error),
        status: error.status,
      },
      {
 status: error.status || 500 }
    );
  }
}

// Rename/move file (creates new file, deletes old)
async function _PATCH(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

const userToken = req.headers.get('x-gh-token');

  try {
    const body = await req.json();
    const { repo, old_path, new_path, branch = 'main', message } = body;

    if (!repo || !old_path || !new_path) {
      return NextResponse.json(
        { error: 'Missing required fields (repo, old_path, new_path)' },
        { status: 400 }
      );
    }

    const { owner, name } = parseRepo(repo);
    const client = userToken ? getUserOctokit(userToken) : gh();

    // Get the old file content
    const { data: oldFile } = await client.repos.getContent({
      owner,
      repo: name,
      path: old_path,
      ref: branch,
    });

    if (Array.isArray(oldFile)) {
      return NextResponse.json(
        { error: 'Cannot rename a directory' },
        { status: 400 }
      );
    }

    const content = Buffer.from(oldFile.content || '', 'base64').toString('utf8');
    const commitMessage = message || `Rename ${old_path} to ${new_path}`;

    // Create new file
    const { data: newFile } = await client.repos.createOrUpdateFileContents({
      owner,
      repo: name,
      path: new_path,
      message: commitMessage,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch,
    });

    // Delete old file
    await client.repos.deleteFile({
      owner,
      repo: name,
      path: old_path,
      message: commitMessage,
      sha: oldFile.sha,
      branch,
    });

    return NextResponse.json({
      ok: true,
      old_path,
      new_path,
      commit: newFile.commit.sha,
      content: {
        sha: newFile.content?.sha,
        path: newFile.content?.path,
      },
    });
  } catch (error) {
    logger.error(
      'GitHub file rename error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Failed to rename file',
        message: toErrorMessage(error),
        status: error.status,
      },
      { status: error.status || 500 }
    );
  }
}
export const GET = withApiAudit('/api/github/file', _GET);
export const PUT = withApiAudit('/api/github/file', _PUT);
export const PATCH = withApiAudit('/api/github/file', _PATCH);
export const DELETE = withApiAudit('/api/github/file', _DELETE);
