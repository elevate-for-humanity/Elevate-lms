import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const BUCKET = 'program-holder-syllabi';

// Upload flow:
//   1. Client uploads the file directly to Supabase Storage using the JS SDK.
//      Path must be exactly: {uid}/{program_holder_courses_id}/{filename}
//      (3 segments, no traversal, no subdirectories)
//   2. Client POSTs { filePath, filename, usesCustomStructure, deliveryStructureNotes }
//      to this route.
//   3. Server validates ownership, confirms the object exists in BUCKET,
//      then writes bucket + path (not a URL) to program_holder_courses.
//   4. Signed URLs are generated on read — never stored in the DB.

// Validates that filePath is exactly {uid}/{courseAssignmentId}/{filename}
// with no extra segments, no traversal, and no bucket prefix.
function validateStoragePath(
  filePath: string,
  uid: string,
  courseAssignmentId: string,
  filename: string
): string | null {
  const parts = filePath.split('/');
  if (parts.length !== 3) return 'File path must have exactly 3 segments';
  if (parts[0] !== uid) return 'File path uid segment does not match authenticated user';
  if (parts[1] !== courseAssignmentId) return 'File path course segment does not match route id';
  if (parts[2] !== filename) return 'File path filename segment does not match filename field';
  if (parts.some((p) => p === '..' || p === '.' || p === '')) return 'Invalid path segment';
  return null;
}

async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const { id: courseAssignmentId } = await params;
  if (!courseAssignmentId) return safeError('Missing course assignment id', 400);

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return safeError('Unauthorized', 401);

  // Parse JSON body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  const { filePath, filename, usesCustomStructure, deliveryStructureNotes } =
    body as {
      filePath?: string;
      filename?: string;
      usesCustomStructure?: boolean;
      deliveryStructureNotes?: string;
    };

  if (!filePath || !filename) {
    return safeError('Missing required fields: filePath, filename', 400);
  }

  // Enforce path convention: exactly {uid}/{courseAssignmentId}/{filename}
  const pathError = validateStoragePath(filePath, user.id, courseAssignmentId, filename as string);
  if (pathError) return safeError(pathError, 400);

  // Resolve the holder row for this user
  const { data: holder, error: holderErr } = await supabase
    .from('program_holders')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (holderErr || !holder) return safeError('Program holder not found', 403);

  // Load the course assignment and confirm it belongs to this holder.
  // credential_id is used below to verify exam domains exist.
  const { data: row, error: rowErr } = await supabase
    .from('program_holder_courses')
    .select('id, program_holder_id, credential_id')
    .eq('id', courseAssignmentId)
    .single();

  if (rowErr || !row) return safeError('Course assignment not found', 404);

  if (row.program_holder_id !== holder.id) {
    return safeError('Forbidden', 403);
  }

  // Reject uploads for credentials that have no exam domains defined.
  // Without domains, alignment review has nothing to compare against and
  // the curriculum generator cannot produce traceable lessons.
  if (row.credential_id) {
    const { count, error: domainErr } = await supabase
      .from('credential_exam_domains')
      .select('id', { count: 'exact', head: true })
      .eq('credential_id', row.credential_id);

    if (domainErr) return safeInternalError(domainErr, 'Domain check failed');

    if (!count || count === 0) {
      return safeError(
        'This credential has no exam blueprint domains defined. ' +
          'Contact an administrator before uploading a syllabus.',
        422
      );
    }
  }

  // Confirm the object exists in BUCKET before recording it.
  // list() scoped to the exact folder; match by filename only (no prefix tricks).
  // This also implicitly validates the bucket — we never list from any other bucket.
  const folder = `${user.id}/${courseAssignmentId}`;
  const { data: objectList, error: listErr } = await supabase.storage
    .from(BUCKET)
    .list(folder, { search: filename as string });

  if (listErr) return safeInternalError(listErr, 'Storage list failed');

  const objectExists = objectList?.some((o) => o.name === filename);
  if (!objectExists) {
    return safeError('File not found in storage — upload it before calling this route', 422);
  }

  // Write bucket + path to the DB. Signed URLs are generated on read.
  const { error: updateErr } = await supabase
    .from('program_holder_courses')
    .update({
      custom_syllabus_bucket: BUCKET,
      custom_syllabus_path: filePath,
      custom_syllabus_filename: filename,
      custom_syllabus_uploaded_at: new Date().toISOString(),
      uses_custom_structure: usesCustomStructure ?? true,
      delivery_structure_notes: deliveryStructureNotes ?? null,
      // Reset both review workflows so admin re-reviews the new upload
      status: 'pending',
      credential_alignment_status: 'pending',
      credential_alignment_reviewed_at: null,
      credential_alignment_notes: null,
    })
    .eq('id', courseAssignmentId);

  if (updateErr) return safeDbError(updateErr, 'Failed to record syllabus upload');

  return NextResponse.json({ ok: true, path: filePath });
}

export const POST = withApiAudit(
  '/api/program-holders/courses/[id]/syllabus',
  _POST
);
