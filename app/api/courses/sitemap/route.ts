import { NextRequest, NextResponse } from 'next/server';
// AUTH: Intentionally public — no authentication required

export const runtime = 'edge';
export const maxDuration = 60;
import { gh, parseRepo } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

// Mark as dynamic route

async function _GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const repo =
      req.nextUrl.searchParams.get('repo') || 'elevateforhumanity/fix2';
    const branch = req.nextUrl.searchParams.get('branch') || 'main';

    const client = gh();
    const { owner, name } = parseRepo(repo);

    // Get the tree recursively
    const { data: tree } = await client.git.getTree({
      owner,
      repo: name,
      tree_sha: branch,
      recursive: 'true',
    });

    // Get all course-related files
    const courseFiles =
      tree.tree
        ?.filter(
          (item) => item.path?.startsWith('courses/') && item.type === 'blob'
        )
        .map((item: any) => ({
          path: item.path,
          type: item.path?.split('.').pop(),
          size: item.size,
        })) || [];

    // Organize by course
    const sitemap: Record<string, any> = {};

    courseFiles.forEach((file) => {
      const parts = file.path!.split('/');
      const courseSlug = parts[1];

      if (!sitemap[courseSlug]) {
        sitemap[courseSlug] = {
          slug: courseSlug,
          files: [],
          modules: new Set(),
          lessons: [],
        };
      }

      sitemap[courseSlug].files.push(file.path);

      // Track modules
      if (parts.length > 3 && parts[2] === 'modules') {
        sitemap[courseSlug].modules.add(parts[3]);
      }

      // Track lessons
      if (file.path!.endsWith('.html') || file.path!.endsWith('.md')) {
        sitemap[courseSlug].lessons.push(file.path);
      }
    });

    // Convert sets to arrays
    Object.keys(sitemap).forEach((key) => {
      sitemap[key].modules = Array.from(sitemap[key].modules);
    });

    return NextResponse.json({
      sitemap,
      courses: Object.keys(sitemap),
      totalFiles: courseFiles.length,
    });
  } catch (error) { 
    logger.error(
      'Generate sitemap error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: 'Failed to generate sitemap', message: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/courses/sitemap', _GET);
