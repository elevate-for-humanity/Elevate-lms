import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;
import { gh, parseRepo } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(req.url);
    const repo = searchParams.get('repo') || 'elevateforhumanity/fix2';
    const branch = searchParams.get('branch') || 'main';

    const client = gh();
    const { owner, name } = parseRepo(repo);

    // Get the tree recursively
    const { data: tree } = await client.git.getTree({
      owner,
      repo: name,
      tree_sha: branch,
      recursive: 'true',
    });

    // Find all metadata.json files in courses folder
    const metadataFiles =
      tree.tree?.filter(
        (item) =>
          item.path?.startsWith('courses/') &&
          item.path.endsWith('metadata.json') &&
          item.type === 'blob'
      ) || [];

    // Extract course slugs (folder names)
    const courses = metadataFiles.map((file) => {
      const parts = file.path!.split('/');
      return parts[1]; // courses/[slug]/metadata.json
    });

    // Remove duplicates
    const uniqueCourses = [...new Set(courses)];

    return NextResponse.json({
      courses: uniqueCourses,
      count: uniqueCourses.length,
      files: metadataFiles.map((f) => f.path),
    });
  } catch (error) { 
    logger.error(
      'Scan courses error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: 'Failed to scan courses', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
