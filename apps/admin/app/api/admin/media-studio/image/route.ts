import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { apiRequireAdmin } from '@/lib/admin/guards';
import { resolveAdminOrganization } from '@/lib/admin/resolve-admin-organization';
import { aiGenerateImage } from '@/lib/ai/ai-service';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { persistStudioAsset } from '@/lib/media/studio-assets';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const schema = z.object({
  projectName: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(180),
  prompt: z.string().trim().min(10).max(4_000),
  size: z.enum(['1024x1024', '1024x1792', '1792x1024']).default('1792x1024'),
  style: z.enum(['natural', 'vivid']).default('natural'),
  usage: z.enum(['general', 'hero', 'poster', 'store-demo', 'course']).default('general'),
});

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid image request.', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let actor: Awaited<ReturnType<typeof resolveAdminOrganization>>;
  try {
    actor = await resolveAdminOrganization(auth);
  } catch (error) {
    return safeError(error instanceof Error ? error.message : 'Unable to resolve organization.', 403);
  }

  try {
    await hydrateProcessEnv();
    const images = await aiGenerateImage({
      prompt: parsed.data.prompt,
      count: 1,
      size: parsed.data.size,
      style: parsed.data.style,
      format: 'b64_json',
    });
    const generated = images[0];
    if (!generated) throw new Error('Image provider returned no image.');

    let buffer: Buffer;
    if (generated.b64Json) {
      buffer = Buffer.from(generated.b64Json, 'base64');
    } else if (generated.url) {
      const response = await fetch(generated.url, { redirect: 'follow' });
      if (!response.ok) throw new Error(`Generated image download failed (${response.status}).`);
      buffer = Buffer.from(await response.arrayBuffer());
    } else {
      throw new Error('Image provider returned an unsupported response.');
    }

    const [width, height] = parsed.data.size.split('x').map(Number);
    const saved = await persistStudioAsset({
      organizationId: actor.organizationId,
      userId: actor.userId,
      projectName: parsed.data.projectName,
      fileName: `${parsed.data.title}.png`,
      buffer,
      contentType: 'image/png',
      type: 'image',
      title: parsed.data.title,
      metadata: {
        kind: 'ai-image',
        prompt: parsed.data.prompt,
        style: parsed.data.style,
        usage: parsed.data.usage,
        width,
        height,
        aspect_ratio: `${width}:${height}`,
      },
    });

    return NextResponse.json({ ok: true, ...saved }, { status: 201 });
  } catch (error) {
    return safeInternalError(error, 'AI image generation failed');
  }
}
