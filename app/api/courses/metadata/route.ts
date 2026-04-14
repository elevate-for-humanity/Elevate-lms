// PUBLIC ROUTE: public course metadata for SEO


// AUTH: Intentionally public — no authentication required

import { NextRequest, NextResponse } from 'next/server';
import { gh, parseRepo } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

async function _GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(req.url);
    const course = searchParams.get('course');
    const repo = searchParams.get('repo') || 'elevateforhumanity/fix2';
    const branch = searchParams.get('branch') || 'main';

    if (!course) {
      return NextResponse.json(
        { error: 'Missing course parameter' },
        { status: 400 }
      );
    }

    const client = gh();
    const { owner, name } = parseRepo(repo);
    const path = `courses/${course}/metadata.json`;

    const response = await client.repos.getContent({
      owner,
      repo: name,
      path,
      ref: branch,
    });

    // Handle array response (directory)
    if (Array.isArray(response.data)) {
      return NextResponse.json(
        { error: 'Path is a directory, not a file' },
        { status: 400 }
      );
    }

    const raw = Buffer.from(response.data.content || '', 'base64').toString(
      'utf8'
    );
    const metadata = JSON.parse(raw);

    return NextResponse.json(metadata);
  } catch (error) { 
    logger.error(
      'Get metadata error:',
      error instanceof Error ? error : new Error(String(error))
    );

    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Metadata file not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch metadata', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/courses/metadata', _GET);
