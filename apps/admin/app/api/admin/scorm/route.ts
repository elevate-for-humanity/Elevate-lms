import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { importScormPackage, getScormRegistration } from '@/lib/scormCloud';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { assertScormZip, hasZipSignature, sanitizeScormTitle, scormStoragePath } from '@/lib/scorm/import-upload';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  await requireAdmin();

  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'A SCORM ZIP package is required' }, { status: 400 });
      }
      assertScormZip(file);
      if (!(await hasZipSignature(file))) {
        return NextResponse.json({ error: 'The file is not a valid ZIP archive' }, { status: 400 });
      }

      const title = sanitizeScormTitle(form.get('title') ?? file.name);
      const courseId = String(form.get('courseId') ?? `elevate-${crypto.randomUUID()}`).trim();
      const storagePath = scormStoragePath(title);
      const db = await requireAdminClient();
      const { error: uploadError } = await db.storage.from('scorm-packages').upload(storagePath, file, {
        contentType: 'application/zip',
        upsert: false,
      });
      if (uploadError) throw new Error(`SCORM storage upload failed: ${uploadError.message}`);

      try {
        const { data: signed, error: signedError } = await db.storage
          .from('scorm-packages')
          .createSignedUrl(storagePath, 60 * 60);
        if (signedError || !signed?.signedUrl) {
          throw new Error(`SCORM signed URL failed: ${signedError?.message ?? 'missing URL'}`);
        }
        const result = await importScormPackage(courseId, signed.signedUrl);
        return NextResponse.json({ data: result, message: `${title} imported successfully.` }, { status: 201 });
      } catch (importError) {
        await db.storage.from('scorm-packages').remove([storagePath]);
        throw importError;
      }
    }

    const { courseId, fileUrl } = await request.json();
    if (!courseId || !fileUrl) {
      return NextResponse.json({ error: 'courseId and fileUrl are required' }, { status: 400 });
    }

    const result = await importScormPackage(courseId, fileUrl);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    logger.error('SCORM import failed', error as Error);
    return NextResponse.json({ error: 'SCORM import failed' }, { status: 500 });
  }
}

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  await requireAdmin();

  try {
    const registrationId = request.nextUrl.searchParams.get('registrationId');
    if (!registrationId) {
      return NextResponse.json({ error: 'registrationId is required' }, { status: 400 });
    }

    const result = await getScormRegistration(registrationId);
    return NextResponse.json({ data: result });
  } catch (error) {
    logger.error('SCORM registration fetch failed', error as Error);
    return NextResponse.json({ error: 'Failed to fetch registration' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/scorm', _GET);
export const POST = withApiAudit('/api/admin/scorm', _POST);
