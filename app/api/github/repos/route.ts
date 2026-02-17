export const runtime = 'edge';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { getUserOctokit, gh } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

export async function GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;
// Support both user token (x-gh-token header) and server token (env)
  const userToken = req.headers.get('x-gh-token');

  try {
    const client = userToken ? getUserOctokit(userToken) : gh();

    const { data } = await client.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated',
      visibility: 'all',
      affiliation: 'owner,collaborator,organization_member',
    });

    const repos = data.map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      private: r.private,
      default_branch: r.default_branch,
      description: r.description,
      updated_at: r.updated_at,
      language: r.language,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      open_issues_count: r.open_issues_count,
      html_url: r.html_url,
      clone_url: r.clone_url,
      ssh_url: r.ssh_url,
      size: r.size,
      archived: r.archived,
      disabled: r.disabled,
      topics: r.topics,
      visibility: r.visibility,
      permissions: r.permissions,
    }));

    return NextResponse.json(repos);
  } catch (error) { 
    logger.error(
      'GitHub repos error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch repos',
        message: toErrorMessage(error),
        status: error.status,
      },
      { status: error.status || 500 }
    );
  }
}
