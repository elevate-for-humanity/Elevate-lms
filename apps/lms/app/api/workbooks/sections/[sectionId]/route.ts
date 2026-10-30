import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validWorkbookSave } from '@/lib/lms/workbook-validation';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> },
) {
  const origin = request.headers.get('origin');
  // Google can forward the request on an internal service URL while the
  // browser retains the public LMS origin. Keep that deployed hostname valid
  // even when NEXT_PUBLIC_APP_URL still points to the legacy app alias.
  const lmsOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org')
    .origin;
  if (
    origin &&
    origin !== request.nextUrl.origin &&
    origin !== lmsOrigin &&
    origin !== 'https://lms.elevateforhumanity.org'
  )
    return reply({ error: 'Invalid request origin.' }, 403);
  const { sectionId } = await params;
  if (!UUID.test(sectionId)) return reply({ error: 'Invalid section.' }, 400);
  if (Number(request.headers.get('content-length')) > 65000)
    return reply({ error: 'Response is too large.' }, 413);
  try {
    const db = await createClient();
    const {
      data: { user },
      error: authError,
    } = await db.auth.getUser();
    if (authError || !user) return reply({ error: 'Please sign in to save your answers.' }, 401);
    if (request.headers.get('x-workbook-owner') !== user.id)
      return reply(
        {
          error:
            'Your sign-in changed. Copy any unsaved answers, then reopen the workbook in the correct account.',
        },
        409,
      );
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > 65000)
      return reply({ error: 'Response is too large.' }, 413);
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return reply({ error: 'Invalid answer format.' }, 400);
    }
    if (!validWorkbookSave(body))
      return reply(
        { error: 'Check your answers and try again (6,000 characters per field).' },
        400,
      );
    const { data, error } = await db.rpc('save_digital_workbook_section', {
      p_section_id: sectionId,
      p_answers: body.answers,
      p_reviewed: body.reviewed,
      p_expected_version: body.expectedVersion,
    });
    if (error?.code === '40001')
      return reply(
        {
          error:
            'Newer answers were saved in another tab or device. Copy your changes before reloading.',
        },
        409,
      );
    if (error?.code === '42501')
      return reply({ error: 'This workbook section is not available for your account.' }, 403);
    if (error) {
      logger.error('Workbook save failed', error, { code: error.code });
      return reply({ error: 'Answers could not be saved. Please retry.' }, 503);
    }
    const saved = Array.isArray(data) ? data[0] : null;
    if (!saved) return reply({ error: 'Save was not confirmed. Please retry.' }, 503);
    return reply({
      section_id: saved.section_id,
      version: saved.version,
      updated_at: saved.updated_at,
    });
  } catch {
    return reply({ error: 'Answers could not be saved. Please retry.' }, 503);
  }
}
