import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { isValidSSN, prepareSSNForStorage } from '@/lib/security/ssn';
import { storeSSNData } from '@/lib/security/secure-identity';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

function cleanText(value: FormDataEntryValue | null, max = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function extensionFor(file: File): string {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

function validImageFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && value.size <= MAX_FILE_BYTES && ALLOWED_MIME.has(value.type);
}

async function cleanupFiles(db: Awaited<ReturnType<typeof requireAdminClient>>, paths: string[]) {
  if (!paths.length) return;
  await db.storage.from('documents').remove(paths).catch((error) => {
    logger.warn('[verification/submit] cleanup failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const session = await createClient();
  const {
    data: { user },
    error: authError,
  } = await session.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  try {
    await hydrateProcessEnv();
    const form = await request.formData();

    const firstName = cleanText(form.get('firstName'), 100);
    const middleName = cleanText(form.get('middleName'), 100);
    const lastName = cleanText(form.get('lastName'), 100);
    const dateOfBirth = cleanText(form.get('dateOfBirth'), 20);
    const streetAddress = cleanText(form.get('streetAddress'), 250);
    const addressLine2 = cleanText(form.get('addressLine2'), 150);
    const city = cleanText(form.get('city'), 100);
    const state = cleanText(form.get('state'), 30);
    const zipCode = cleanText(form.get('zipCode'), 10);
    const idType = cleanText(form.get('idType'), 50);
    const idState = cleanText(form.get('idState'), 30);
    const idExpiration = cleanText(form.get('idExpiration'), 20);
    const ssn = cleanText(form.get('ssn'), 20);

    const idFront = form.get('idFront');
    const idBack = form.get('idBack');
    const selfie = form.get('selfie');
    const passport = idType === 'passport';

    if (!firstName || !lastName || !dateOfBirth || !streetAddress || !city || !state || !zipCode || !idType) {
      return NextResponse.json({ error: 'Complete all required identity fields.' }, { status: 400 });
    }
    if (!isValidSSN(ssn)) {
      return NextResponse.json({ error: 'Enter a valid 9-digit Social Security number.' }, { status: 400 });
    }
    if (!validImageFile(idFront) || !validImageFile(selfie) || (!passport && !validImageFile(idBack))) {
      return NextResponse.json(
        { error: 'Upload a valid ID front, required ID back, and selfie. Images must be JPG, PNG, or WEBP and no larger than 10 MB each.' },
        { status: 400 },
      );
    }

    const { ssn_hash, ssn_last4 } = prepareSSNForStorage(ssn);
    const identityStored = await storeSSNData(user.id, ssn_last4, ssn_hash);
    if (!identityStored) {
      return NextResponse.json({ error: 'Unable to securely store identity information. Please try again.' }, { status: 500 });
    }

    const db = await requireAdminClient();
    const nonce = Date.now();
    const uploads: Array<{ kind: 'front' | 'back' | 'selfie'; file: File; path: string }> = [
      {
        kind: 'front',
        file: idFront,
        path: `${user.id}/identity/id-front-${nonce}.${extensionFor(idFront)}`,
      },
      {
        kind: 'selfie',
        file: selfie,
        path: `${user.id}/identity/selfie-${nonce}.${extensionFor(selfie)}`,
      },
    ];
    if (validImageFile(idBack)) {
      uploads.push({
        kind: 'back',
        file: idBack,
        path: `${user.id}/identity/id-back-${nonce}.${extensionFor(idBack)}`,
      });
    }

    const uploadedPaths: string[] = [];
    for (const upload of uploads) {
      const { error } = await db.storage.from('documents').upload(upload.path, upload.file, {
        contentType: upload.file.type,
        upsert: false,
      });
      if (error) {
        await cleanupFiles(db, uploadedPaths);
        logger.error('[verification/submit] private document upload failed', error);
        return NextResponse.json({ error: 'Unable to upload identity documents. Please try again.' }, { status: 500 });
      }
      uploadedPaths.push(upload.path);
    }

    const documentRows = uploads.map((upload) => ({
      user_id: user.id,
      uploaded_by: user.id,
      owner_type: 'user',
      owner_id: user.id,
      document_type: 'photo_id',
      file_name:
        upload.kind === 'front'
          ? `government-id-front.${extensionFor(upload.file)}`
          : upload.kind === 'back'
            ? `government-id-back.${extensionFor(upload.file)}`
            : `identity-selfie.${extensionFor(upload.file)}`,
      file_size: upload.file.size,
      file_size_bytes: upload.file.size,
      file_url: null,
      file_path: upload.path,
      mime_type: upload.file.type,
      status: 'pending_review',
      verification_status: 'pending_review',
      verified: false,
      metadata: {
        identity_part: upload.kind,
        id_type: idType,
        issuing_state: idState || null,
        expiration_date: idExpiration || null,
        submitted_name: [firstName, middleName, lastName].filter(Boolean).join(' '),
        submitted_dob: dateOfBirth,
        submitted_address: {
          street: streetAddress,
          line2: addressLine2 || null,
          city,
          state,
          zip: zipCode,
        },
      },
    }));

    const { data: documents, error: documentError } = await db
      .from('documents')
      .insert(documentRows)
      .select('id, document_type, status, verification_status, created_at');

    if (documentError) {
      await cleanupFiles(db, uploadedPaths);
      logger.error('[verification/submit] document records failed', documentError);
      return NextResponse.json({ error: 'Unable to save identity documents. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      verification: {
        status: 'pending_review',
        ssnOnFile: true,
        documents: documents ?? [],
      },
    });
  } catch (error) {
    logger.error(
      '[verification/submit] unexpected failure',
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json({ error: 'Unable to submit identity verification. Please try again.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const db = await requireAdminClient();
  const [{ data: docs }, { data: secureIdentity }] = await Promise.all([
    db
      .from('documents')
      .select('id, document_type, status, verification_status, created_at')
      .eq('user_id', user.id)
      .eq('document_type', 'photo_id')
      .order('created_at', { ascending: false }),
    db.from('secure_identity').select('ssn_last4').eq('user_id', user.id).maybeSingle(),
  ]);

  const rows = docs ?? [];
  const approved = rows.some((row) =>
    ['approved', 'verified'].includes(String(row.verification_status || row.status || '').toLowerCase()),
  );

  return NextResponse.json({
    success: true,
    verification: {
      status: approved ? 'verified' : rows.length ? 'submitted' : 'not_started',
      ssnOnFile: Boolean(secureIdentity?.ssn_last4),
      documents: rows,
    },
  });
}
