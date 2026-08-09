// pre-auth-registry: exempt - transfer-hours evidence is intentionally staged before account creation and reconciled to the matching application by normalized email/program metadata.
import { NextResponse } from 'next/server';
import { createHash, randomUUID } from 'node:crypto';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function safeFileName(name: string) {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 120);
  return cleaned || 'transfer-hours-document';
}

function normalizeProgram(value: FormDataEntryValue | null) {
  return String(value || '').trim().toLowerCase();
}

async function findExistingApplication(
  db: Awaited<ReturnType<typeof getAdminClient>>,
  normalizedEmail: string,
  program: string,
) {
  if (!db) return null;

  const normalized = await db
    .from('applications')
    .select('id')
    .eq('program_interest', program)
    .eq('normalized_email', normalizedEmail)
    .not('status', 'in', '("rejected","withdrawn","duplicate")')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!normalized.error && normalized.data?.id) return normalized.data;

  const fallback = await db
    .from('applications')
    .select('id')
    .eq('program_interest', program)
    .ilike('email', normalizedEmail)
    .not('status', 'in', '("rejected","withdrawn","duplicate")')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return fallback.error ? null : fallback.data;
}

async function ensureReviewQueueItem(
  db: NonNullable<Awaited<ReturnType<typeof getAdminClient>>>,
  documentId: string,
  applicationId: string,
  hoursClaimed: number,
) {
  const { data: existing } = await db
    .from('review_queue')
    .select('id')
    .eq('subject_type', 'document')
    .eq('subject_id', documentId)
    .in('status', ['open', 'in_progress', 'escalated'])
    .limit(1)
    .maybeSingle();

  if (existing?.id) return;

  const { error } = await db.from('review_queue').insert({
    queue_type: 'transcript_review',
    subject_type: 'document',
    subject_id: documentId,
    priority: 8,
    reasons: [
      `Applicant claims ${hoursClaimed.toLocaleString('en-US')} transfer hours. Verify uploaded evidence before awarding credit.`,
    ],
    status: 'open',
    metadata: {
      application_id: applicationId,
      document_type: 'transcript',
      evidence_type: 'transfer_hours',
      hours_claimed: hoursClaimed,
    },
  });

  if (error) {
    logger.warn('[transfer-hours-document] review queue insert failed', {
      documentId,
      applicationId,
      error: error.message,
    });
  }
}

export async function POST(req: Request) {
  const limited = await applyRateLimit(req, 'contact');
  if (limited) return limited;

  try {
    const form = await req.formData();
    const file = form.get('file');
    const normalizedEmail = String(form.get('email') || '').trim().toLowerCase();
    const program = normalizeProgram(form.get('program'));
    const hoursClaimed = Math.floor(Number(form.get('hoursClaimed') || 0));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Transfer-hours documentation is required.' }, { status: 400 });
    }
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return NextResponse.json({ error: 'A valid applicant email is required.' }, { status: 400 });
    }
    if (!program || !program.includes('apprenticeship')) {
      return NextResponse.json({ error: 'Transfer-hours evidence is only accepted for apprenticeship applications.' }, { status: 400 });
    }
    if (!Number.isFinite(hoursClaimed) || hoursClaimed <= 0) {
      return NextResponse.json({ error: 'Enter the number of transfer hours being claimed.' }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'Transfer-hours documentation must be 10 MB or smaller.' }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Upload a PDF, JPG, PNG, or WEBP document.' }, { status: 400 });
    }

    const db = await getAdminClient();
    if (!db) {
      return NextResponse.json({ error: 'Document upload service is temporarily unavailable.' }, { status: 503 });
    }

    const existingApplication = await findExistingApplication(db, normalizedEmail, program);
    const applicationId = existingApplication?.id ?? null;
    const emailKey = createHash('sha256').update(`${normalizedEmail}|${program}`).digest('hex').slice(0, 24);
    const folder = applicationId ? `applications/${applicationId}` : `pending-applications/${emailKey}`;
    const path = `${folder}/transfer-hours/${Date.now()}-${randomUUID()}-${safeFileName(file.name)}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: storageError } = await db.storage.from('documents').upload(path, bytes, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

    if (storageError) {
      logger.error('[transfer-hours-document] storage upload failed', {
        program,
        error: storageError.message,
      });
      return NextResponse.json({ error: 'Transfer-hours documentation could not be uploaded.' }, { status: 500 });
    }

    const { data: document, error: documentError } = await db
      .from('documents')
      .insert({
        user_id: null,
        application_id: applicationId,
        document_type: 'transcript',
        file_name: file.name,
        file_size: file.size,
        file_size_bytes: file.size,
        file_url: null,
        file_path: path,
        mime_type: file.type,
        status: 'pending_review',
        verification_status: 'pending',
        verified: false,
        owner_type: null,
        owner_id: null,
        metadata: {
          normalized_email: normalizedEmail,
          program_slug: program,
          hours_claimed: hoursClaimed,
          evidence_type: 'transfer_hours',
          staged: !applicationId,
        },
      })
      .select('id')
      .single();

    if (documentError || !document?.id) {
      await db.storage.from('documents').remove([path]);
      logger.error('[transfer-hours-document] document row insert failed', {
        program,
        error: documentError?.message,
      });
      return NextResponse.json({ error: 'Transfer-hours documentation could not be recorded.' }, { status: 500 });
    }

    if (applicationId) {
      await ensureReviewQueueItem(db, document.id, applicationId, hoursClaimed);
    }

    return NextResponse.json({
      ok: true,
      documentId: document.id,
      linkedApplicationId: applicationId,
    });
  } catch (error) {
    logger.error('[transfer-hours-document] unexpected failure', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Transfer-hours documentation could not be uploaded.' }, { status: 500 });
  }
}
