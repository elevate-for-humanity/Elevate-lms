// pre-auth-registry: exempt - applicant document uploads are authorized by the opaque PARIS application resume session before insert; user_id may remain null until account reconciliation.
import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { loadAgenticProject, loadLatestAgenticProjectForUser } from '@/lib/agentic/project-service';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { parseApplicationSessionCookie } from '@/lib/paris/admissions/application-session-cookie';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'paris_application_resume';
const BUCKET = 'documents';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function sessionFromCookie(request: NextRequest) {
  return parseApplicationSessionCookie(request.cookies.get(COOKIE_NAME)?.value);
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'document';
}

async function authorizedProject(request: NextRequest) {
  const session = sessionFromCookie(request);
  if (session) {
    const project = await loadAgenticProject(session);
    if (project?.target_type === 'application') return project;
  }

  // The interview can resume an attached application after sign-in on a new
  // browser. Resolve that same owned project only after verifying the user;
  // a caller-supplied project id is never sufficient to access its documents.
  const auth = await createClient();
  const { data, error } = await auth.auth.getUser();
  if (error || !data.user) return null;
  const project = await loadLatestAgenticProjectForUser({ userId: data.user.id, targetType: 'application' });
  return project?.target_type === 'application' ? project : null;
}

function logDocumentError(event: string, error: unknown) {
  const detail = error && typeof error === 'object' ? error as { message?: unknown; code?: unknown } : null;
  // Supabase returns plain objects, not Error instances. Preserve the useful
  // diagnostic fields internally without logging request data or opaque tokens.
  console.error(event, JSON.stringify({
    message: typeof detail?.message === 'string' ? detail.message : error instanceof Error ? error.message : 'Unknown document error',
    ...(typeof detail?.code === 'string' ? { code: detail.code } : {}),
  }));
}

async function resolveProgramId(programSlug: string | undefined) {
  if (!programSlug) return null;
  const db = await requireAdminClient();
  const { data, error } = await db.from('programs').select('id').eq('slug', programSlug).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

function isMissingDocumentColumnError(error: { code?: string | null; message?: string | null }) {
  const code = error?.code ?? '';
  const message = error?.message ?? '';
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    message.includes('verified') ||
    message.includes('rejection_reason')
  );
}

export async function GET(request: NextRequest) {
  try {
    const project = await authorizedProject(request);
    if (!project) return NextResponse.json({ ok: false, error: 'Application interview session not found' }, { status: 404 });

    const db = await requireAdminClient();
    const state = (project.metadata?.applicationInterviewState ?? {}) as {
      answers?: { program?: string };
    };
    const programId = await resolveProgramId(state.answers?.program);

    let requirementQuery = db
      .from('document_requirements')
      .select('id, document_type, name, description, instructions, is_required, required, accepted_formats, max_file_size, due_stage, program_id')
      .eq('role', 'student')
      .order('document_type');
    requirementQuery = programId
      ? requirementQuery.or(`program_id.is.null,program_id.eq.${programId}`)
      : requirementQuery.is('program_id', null);

    const [{ data: requirements, error: requirementError }, { data: documents, error: documentError }] = await Promise.all([
      requirementQuery,
      db
        .from('documents')
        .select('id, document_type, file_name, status, verification_status, verified, rejection_reason, created_at, updated_at')
        .eq('owner_type', 'agentic_application')
        .eq('owner_id', project.id)
        .order('created_at', { ascending: false }),
    ]);
    if (requirementError) throw requirementError;
    let resolvedDocuments = documents;
    if (documentError && isMissingDocumentColumnError(documentError)) {
      // Older schemas (the isolated QA project) predate the `verified` and
      // `rejection_reason` columns on documents. Retry without them and present
      // them as unknown instead of failing the whole list with a 500.
      const legacy = await db
        .from('documents')
        .select('id, document_type, file_name, status, verification_status, created_at, updated_at')
        .eq('owner_type', 'agentic_application')
        .eq('owner_id', project.id)
        .order('created_at', { ascending: false });
      if (legacy.error) throw legacy.error;
      resolvedDocuments = (legacy.data ?? []).map((row) => ({
        ...row,
        verified: null,
        rejection_reason: null,
      }));
    } else if (documentError) {
      throw documentError;
    }

    return NextResponse.json({
      ok: true,
      requirements: requirements ?? [],
      documents: resolvedDocuments ?? [],
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    logDocumentError('paris.application.documents.list.failed', error);
    return NextResponse.json({ ok: false, error: 'Unable to load application documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const project = await authorizedProject(request);
    if (!project) return NextResponse.json({ ok: false, error: 'Application interview session not found' }, { status: 404 });

    const form = await request.formData();
    const file = form.get('file');
    const documentType = String(form.get('documentType') || '').trim().slice(0, 120);
    const requirementIdRaw = String(form.get('requirementId') || '').trim();
    const requirementId = /^[0-9a-f-]{36}$/i.test(requirementIdRaw) ? requirementIdRaw : null;

    if (!(file instanceof File) || !documentType) {
      return NextResponse.json({ ok: false, error: 'file and documentType are required' }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ ok: false, error: 'Only PDF, JPEG, PNG, or WebP files are accepted' }, { status: 415 });
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: 'Document must be 10 MB or smaller' }, { status: 413 });
    }

    const db = await requireAdminClient();
    const objectPath = `application-interviews/${project.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await db.storage.from(BUCKET).upload(objectPath, bytes, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: document, error: insertError } = await db
      .from('documents')
      .insert({
        user_id: project.user_id ?? null,
        document_type: documentType,
        title: documentType.replace(/_/g, ' '),
        file_name: file.name,
        file_size: file.size,
        file_size_bytes: file.size,
        file_url: '',
        file_path: objectPath,
        mime_type: file.type,
        status: 'pending',
        verification_status: 'pending',
        verified: false,
        owner_type: 'agentic_application',
        owner_id: project.id,
        requirement_id: requirementId,
        metadata: {
          source: 'paris_application_interview',
          agentic_project_id: project.id,
          requires_authorized_review: true,
        },
      })
      .select('id, document_type, file_name, status, verification_status, verified, created_at')
      .single();

    if (insertError || !document) {
      await db.storage.from(BUCKET).remove([objectPath]);
      throw insertError ?? new Error('Document metadata was not saved');
    }

    await db.from('agentic_build_events').insert({
      project_id: project.id,
      event_type: 'application.document.uploaded',
      summary: 'Applicant document uploaded and queued for review',
      payload: { document_id: document.id, document_type: documentType, status: 'pending' },
    });

    return NextResponse.json({ ok: true, document }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    logDocumentError('paris.application.documents.upload.failed', error);
    return NextResponse.json({ ok: false, error: 'Unable to upload application document' }, { status: 500 });
  }
}
