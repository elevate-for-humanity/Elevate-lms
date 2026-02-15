import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;
import { gh, parseRepo } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json().catch(() => ({}));
    const { repo = 'elevateforhumanity/fix2', branch = 'main' } = body;

    const client = gh();
    const { owner, name } = parseRepo(repo);

    const results = {
      missingMetadata: [] as string[],
      missingLessons: [] as string[],
      brokenLinks: [] as string[],
      passed: 0,
      failed: 0,
    };

    // Get all course files
    const { data: tree } = await client.git.getTree({
      owner,
      repo: name,
      tree_sha: branch,
      recursive: 'true',
    });

    const courseFiles =
      tree.tree?.filter(
        (file) => file.path?.includes('/courses/') && file.type === 'blob'
      ) || [];

    // Check for metadata.json in each course folder
    const courseFolders = new Set<string>();
    courseFiles.forEach((file) => {
      const match = file.path?.match(/courses\/([^/]+)\//);
      if (match) courseFolders.add(match[1]);
    });

    for (const folder of courseFolders) {
      const hasMetadata = courseFiles.some(
        (f) => f.path === `courses/${folder}/metadata.json`
      );

      if (!hasMetadata) {
        results.missingMetadata.push(folder);
        results.failed++;
      } else {
        results.passed++;
      }
    }

    // Check for empty lesson files
    for (const file of courseFiles) {
      if (file.path?.endsWith('.html') || file.path?.endsWith('.md')) {
        if ((file.size || 0) < 100) {
          results.missingLessons.push(file.path);
          results.failed++;
        }
      }
    }

    const totalTests = results.passed + results.failed;

    return NextResponse.json({
      ok: true,
      message: `Test suite executed. ${results.passed}/${totalTests} passed.`,
      results,
      summary: {
        total: totalTests,
        passed: results.passed,
        failed: results.failed,
        passRate:
          totalTests > 0 ? ((results.passed / totalTests) * 100).toFixed(1) : 0,
      },
    });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Run tests error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Failed to run tests',
        message: toErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
