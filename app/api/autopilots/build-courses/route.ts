export const runtime = 'edge';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { gh, parseRepo } from '@/lib/github';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const { output, repo = 'elevateforhumanity/fix2', branch = 'main' } = body;

    if (!output) {
      return NextResponse.json(
        { error: 'Missing course output data' },
        { status: 400 }
      );
    }

    const client = gh();
    const { owner, name } = parseRepo(repo);

    // Parse AI JSON
    let parsed;
    try {
      parsed = typeof output === 'string' ? JSON.parse(output) : output;
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in output' },
        { status: 400 }
      );
    }

    const courseId = (parsed.title || 'untitled-course')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    const basePath = `courses/${courseId}`;

    async function saveFile(path: string, content: string) {
      try {
        await client.repos.createOrUpdateFileContents({
          owner,
          repo: name,
          branch,
          path,
          message: `Autopilot: Create ${path}`,
          content: Buffer.from(content).toString('base64'),
        });
      } catch (error) { 
        logger.error(
          `Failed to save ${path}:`,
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    }

    // Create metadata.json
    await saveFile(
      `${basePath}/metadata.json`,
      JSON.stringify(parsed, null, 2)
    );

    // Create README
    const readme = `# ${parsed.title || 'Course'}

${parsed.description || ''}

## Objectives
${parsed.objectives?.map((obj: string) => `- ${obj}`).join('\n') || ''}

## Modules
${parsed.modules?.map((mod: any, i: number) => `${i + 1}. ${mod.title || mod}`).join('\n') || ''}
`;

    await saveFile(`${basePath}/README.md`, readme);

    // Create folders + lessons if modules exist
    if (parsed.modules && Array.isArray(parsed.modules)) {
      for (const module of parsed.modules) {
        const moduleSlug = (module.title || 'module')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-');

        if (module.lessons && Array.isArray(module.lessons)) {
          for (const lesson of module.lessons) {
            const lessonSlug = (lesson.title || lesson)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-');

            const lessonContent =
              lesson.content ||
              lesson.html ||
              `# ${lesson.title || lesson}\n\nLesson content here.`;

            await saveFile(
              `${basePath}/modules/${moduleSlug}/${lessonSlug}.html`,
              lessonContent
            );
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Course structure successfully created.',
      courseId,
      path: basePath,
      filesCreated: parsed.modules?.length || 0,
    });
  } catch (error) { 
    logger.error(
      'Build course error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Failed to build course',
        message: toErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
