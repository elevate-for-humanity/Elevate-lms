// Exam authorization pipeline orchestrator.
//
// Single entry point for all certification workflows regardless of provider.
// Handles both:
//   A) External exam only  (ICAADA, CompTIA, Indiana BMV, NCCT)
//   B) External course+exam (CareerSafe CPR, OSHA 10)
//
// State machine:
//   pending_completion → awaiting_payment → exam_authorized
//   → exam_forwarded → awaiting_upload → upload_pending
//   → certificate_issued
//
// All state transitions are written to certification_audit_log (append-only).

import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { setAuditContext } from '@/lib/audit-context';
import { getStripe } from '@/lib/stripe/client';
import { logger } from '@/lib/logger';
import { checkCertificationReadiness } from './readiness';
import { sendStaffAuthNotification, sendCertificateIssuedEmail } from './emails';
import type { InitiateResult, CertRequestStatus, CredentialDelivery } from './types';

export { checkCertificationReadiness } from './readiness';
export type { ReadinessResult, CertificationRequest, InitiateResult } from './types';

const STAFF_EMAIL = 'elevate4humanityedu@gmail.com';
// Authorization codes expire after 90 days
const AUTH_EXPIRY_DAYS = 90;

// ── audit log helper ──────────────────────────────────────────────────────────

async function auditLog(
  db: ReturnType<typeof createAdminClient>,
  params: {
    certRequestId: string;
    userId: string;
    actorId: string | null;
    eventType: string;
    fromStatus?: CertRequestStatus;
    toStatus?: CertRequestStatus;
    metadata?: Record<string, unknown>;
  }
) {
  if (!db) return;
  await db.from('certification_audit_log').insert({
    certification_request_id: params.certRequestId,
    user_id: params.userId,
    actor_id: params.actorId,
    event_type: params.eventType,
    from_status: params.fromStatus ?? null,
    to_status: params.toStatus ?? null,
    metadata: params.metadata ?? null,
  });
}

// ── initiateCertification ─────────────────────────────────────────────────────
// Called when a student's enrollment is marked complete.
// 1. Runs readiness check
// 2. Creates/updates certification_request record
// 3. Creates Stripe PaymentIntent for exam fee (Elevate's saved payment method)
// 4. Returns request ID + payment intent for webhook to confirm

export async function initiateCertification(
  userId: string,
  programId: string,
  pathwayId?: string   // optional — if omitted, uses the primary pathway
): Promise<{ ok: boolean; error?: string; result?: InitiateResult }> {
  const db = createAdminClient();
  if (!db) return { ok: false, error: 'Database unavailable' };
  await setAuditContext(db, { systemActor: 'exam-authorization' });

  // Readiness check
  const readiness = await checkCertificationReadiness(userId, programId);
  if (!readiness.eligible) {
    return { ok: false, error: `Not eligible: ${readiness.missing.join('; ')}` };
  }

  // Resolve pathway — use provided pathwayId or fall back to primary
  const pathwayQuery = db
    .from('program_certification_pathways')
    .select(`
      id, credential_name, credential_abbreviation,
      exam_fee_cents, fee_payer,
      eligibility_review_required, application_url,
      credential_registry_id,
      certification_bodies ( id, name, website, application_url )
    `)
    .eq('program_id', programId)
    .eq('is_active', true);

  const { data: pathway } = pathwayId
    ? await pathwayQuery.eq('id', pathwayId).single()
    : await pathwayQuery.eq('is_primary', true).single();

  if (!pathway) return { ok: false, error: 'No certification pathway found for this program' };

  const body = pathway.certification_bodies as any;
  const credentialId = pathway.credential_registry_id;

  // Grant-funded or student-pay pathways skip Stripe — no PaymentIntent needed
  const needsStripe = pathway.fee_payer === 'elevate' && pathway.exam_fee_cents > 0;

  // Check for existing request on this pathway
  const { data: existing } = await db
    .from('certification_requests')
    .select('id, status')
    .eq('user_id', userId)
    .eq('program_id', programId)
    .eq('pathway_id', pathway.id)
    .maybeSingle();

  if (existing && !['pending_completion', 'payment_failed'].includes(existing.status)) {
    return { ok: false, error: `Certification already in progress (status: ${existing.status})` };
  }

  let requestId = existing?.id;

  const initialStatus = needsStripe ? 'awaiting_payment' : 'exam_authorized';

  if (!requestId) {
    const { data: created, error: createErr } = await db
      .from('certification_requests')
      .insert({
        user_id: userId,
        program_id: programId,
        credential_id: credentialId ?? null,
        pathway_id: pathway.id,
        status: initialStatus,
        provider_name: body?.name ?? null,
        // For non-Stripe pathways, generate auth code immediately
        ...(initialStatus === 'exam_authorized' ? {
          authorization_code: crypto.randomBytes(12).toString('hex').toUpperCase(),
          authorized_at: new Date().toISOString(),
          authorization_expires_at: new Date(Date.now() + AUTH_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        } : {}),
      })
      .select('id, authorization_code')
      .single();

    if (createErr || !created) {
      logger.error('[ExamAuth] Failed to create certification_request', createErr);
      return { ok: false, error: 'Failed to create certification request' };
    }
    requestId = created.id;
  } else {
    await db
      .from('certification_requests')
      .update({ status: initialStatus, pathway_id: pathway.id, updated_at: new Date().toISOString() })
      .eq('id', requestId);
  }

  await auditLog(db, {
    certRequestId: requestId,
    userId,
    actorId: null,
    eventType: 'initiation',
    fromStatus: 'pending_completion',
    toStatus: initialStatus,
    metadata: {
      pathwayId: pathway.id,
      credentialName: pathway.credential_name,
      amountCents: pathway.exam_fee_cents,
      feePayer: pathway.fee_payer,
    },
  });

  // Stripe PaymentIntent — only when Elevate pays
  let paymentIntentId: string | undefined;

  if (needsStripe) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const intent = await stripe.paymentIntents.create({
          amount: pathway.exam_fee_cents,
          currency: 'usd',
          confirm: false,
          metadata: {
            certification_request_id: requestId,
            user_id: userId,
            program_id: programId,
            credential_id: credentialId ?? '',
            pathway_id: pathway.id,
            payer: 'elevate',
          },
          description: `Exam fee: ${pathway.credential_name} — ${userId}`,
        });

        paymentIntentId = intent.id;

        await db.from('exam_fee_payments').upsert({
          user_id: userId,
          program_id: programId,
          credential_id: credentialId ?? null,
          stripe_payment_intent: intent.id,
          amount_cents: pathway.exam_fee_cents,
          status: 'processing',
        }, { onConflict: 'user_id,program_id,credential_id' });

        await auditLog(db, {
          certRequestId: requestId,
          userId,
          actorId: null,
          eventType: 'payment_initiated',
          metadata: { stripePaymentIntentId: intent.id, amountCents: pathway.exam_fee_cents },
        });
      } catch (err) {
        logger.error('[ExamAuth] Stripe PaymentIntent creation failed', err);
        await db
          .from('certification_requests')
          .update({ status: 'payment_failed' })
          .eq('id', requestId);
        return { ok: false, error: 'Payment initiation failed — contact support' };
      }
    }
  }

  return {
    ok: true,
    result: { requestId, status: initialStatus, paymentIntentId },
  };
}

// ── confirmPaymentAndAuthorize ────────────────────────────────────────────────
// Called by Stripe webhook (payment_intent.succeeded).
// Generates auth code, sends staff notification email.

export async function confirmPaymentAndAuthorize(
  stripePaymentIntentId: string
): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();
  if (!db) return { ok: false, error: 'Database unavailable' };
  await setAuditContext(db, { systemActor: 'exam-authorization' });

  // Resolve payment record
  const { data: payment } = await db
    .from('exam_fee_payments')
    .select('id, user_id, program_id, credential_id, amount_cents')
    .eq('stripe_payment_intent', stripePaymentIntentId)
    .maybeSingle();

  if (!payment) {
    logger.warn('[ExamAuth] No exam_fee_payment found for intent', stripePaymentIntentId);
    return { ok: false, error: 'Payment record not found' };
  }

  // Mark payment paid
  await db
    .from('exam_fee_payments')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('stripe_payment_intent', stripePaymentIntentId);

  // Resolve certification_request
  const { data: certReq } = await db
    .from('certification_requests')
    .select('id, status, user_id, program_id, credential_id, provider_name')
    .eq('user_id', payment.user_id)
    .eq('program_id', payment.program_id)
    .eq('credential_id', payment.credential_id)
    .maybeSingle();

  if (!certReq) return { ok: false, error: 'Certification request not found' };
  if (certReq.status !== 'awaiting_payment') {
    logger.warn('[ExamAuth] Unexpected status on payment confirm', certReq.status);
    return { ok: true }; // idempotent — already processed
  }

  // Generate authorization code
  const authCode = crypto.randomBytes(12).toString('hex').toUpperCase();
  const expiresAt = new Date(Date.now() + AUTH_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await db
    .from('certification_requests')
    .update({
      status: 'exam_authorized',
      authorization_code: authCode,
      authorized_at: new Date().toISOString(),
      authorization_expires_at: expiresAt,
    })
    .eq('id', certReq.id);

  await auditLog(db, {
    certRequestId: certReq.id,
    userId: certReq.user_id,
    actorId: null,
    eventType: 'payment_confirmed',
    fromStatus: 'awaiting_payment',
    toStatus: 'exam_authorized',
    metadata: { stripePaymentIntentId, authCode, expiresAt },
  });

  // Resolve student profile + program + credential details for email
  const [profileRes, programRes, credRes] = await Promise.all([
    db.from('profiles').select('full_name, email').eq('id', certReq.user_id).single(),
    db.from('programs').select('title').eq('id', certReq.program_id).single(),
    db.from('credential_registry')
      .select('name, delivery, credential_providers(name, exam_scheduling_url)')
      .eq('id', certReq.credential_id)
      .single(),
  ]);

  const student = profileRes.data;
  const program = programRes.data;
  const cred = credRes.data as any;
  const provider = cred?.credential_providers;

  if (student && program && cred) {
    await sendStaffAuthNotification({
      studentName: student.full_name ?? 'Student',
      studentEmail: student.email ?? '',
      programName: program.title,
      credentialName: cred.name,
      authorizationCode: authCode,
      expiresAt,
      delivery: cred.delivery as CredentialDelivery,
      providerName: provider?.name ?? certReq.provider_name ?? 'Certifying Body',
      providerUrl: provider?.exam_scheduling_url ?? null,
      examFeePaid: payment.amount_cents,
    });

    await auditLog(db, {
      certRequestId: certReq.id,
      userId: certReq.user_id,
      actorId: null,
      eventType: 'staff_auth_email_sent',
      metadata: { to: STAFF_EMAIL },
    });
  }

  return { ok: true };
}

// ── markForwarded ─────────────────────────────────────────────────────────────
// Staff calls this after forwarding the auth email to the student.

export async function markForwarded(
  certRequestId: string,
  staffUserId: string
): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();
  if (!db) return { ok: false, error: 'Database unavailable' };
  await setAuditContext(db, { systemActor: 'exam-authorization' });

  const { data: req } = await db
    .from('certification_requests')
    .select('id, status, user_id')
    .eq('id', certRequestId)
    .single();

  if (!req) return { ok: false, error: 'Request not found' };
  if (req.status !== 'exam_authorized') return { ok: false, error: `Cannot mark forwarded from status: ${req.status}` };

  await db
    .from('certification_requests')
    .update({
      status: 'exam_forwarded',
      forwarded_at: new Date().toISOString(),
      forwarded_by: staffUserId,
    })
    .eq('id', certRequestId);

  await auditLog(db, {
    certRequestId,
    userId: req.user_id,
    actorId: staffUserId,
    eventType: 'auth_forwarded_to_student',
    fromStatus: 'exam_authorized',
    toStatus: 'exam_forwarded',
  });

  // Advance to awaiting_upload immediately after forwarding
  await db
    .from('certification_requests')
    .update({ status: 'awaiting_upload' })
    .eq('id', certRequestId);

  await auditLog(db, {
    certRequestId,
    userId: req.user_id,
    actorId: staffUserId,
    eventType: 'awaiting_student_upload',
    fromStatus: 'exam_forwarded',
    toStatus: 'awaiting_upload',
  });

  return { ok: true };
}

// ── recordUpload ──────────────────────────────────────────────────────────────
// Called when student uploads their exam result certificate.

export async function recordUpload(
  certRequestId: string,
  userId: string,
  storagePath: string,
  originalFilename: string
): Promise<{ ok: boolean; error?: string; uploadId?: string }> {
  const db = createAdminClient();
  if (!db) return { ok: false, error: 'Database unavailable' };
  await setAuditContext(db, { systemActor: 'exam-authorization' });

  const { data: req } = await db
    .from('certification_requests')
    .select('id, status, program_id, credential_id, user_id')
    .eq('id', certRequestId)
    .eq('user_id', userId)
    .single();

  if (!req) return { ok: false, error: 'Request not found' };
  if (!['awaiting_upload', 'upload_rejected'].includes(req.status)) {
    return { ok: false, error: `Cannot upload from status: ${req.status}` };
  }

  const { data: upload, error: uploadErr } = await db
    .from('student_credential_uploads')
    .insert({
      user_id: userId,
      program_id: req.program_id,
      credential_id: req.credential_id,
      upload_type: 'exam_result',
      storage_path: storagePath,
      original_filename: originalFilename,
      verification_status: 'pending',
    })
    .select('id')
    .single();

  if (uploadErr || !upload) {
    logger.error('[ExamAuth] Upload record creation failed', uploadErr);
    return { ok: false, error: 'Failed to record upload' };
  }

  await db
    .from('certification_requests')
    .update({
      status: 'upload_pending',
      exam_result_upload_id: upload.id,
    })
    .eq('id', certRequestId);

  await auditLog(db, {
    certRequestId,
    userId,
    actorId: userId,
    eventType: 'exam_result_uploaded',
    fromStatus: req.status as CertRequestStatus,
    toStatus: 'upload_pending',
    metadata: { uploadId: upload.id, filename: originalFilename },
  });

  return { ok: true, uploadId: upload.id };
}

// ── verifyUploadAndIssueCertificate ───────────────────────────────────────────
// Admin approves the uploaded credential and triggers Elevate certificate generation.

export async function verifyUploadAndIssueCertificate(
  certRequestId: string,
  adminUserId: string,
  approved: boolean,
  rejectionReason?: string
): Promise<{ ok: boolean; error?: string; certificateId?: string }> {
  const db = createAdminClient();
  if (!db) return { ok: false, error: 'Database unavailable' };
  await setAuditContext(db, { systemActor: 'exam-authorization' });

  const { data: req } = await db
    .from('certification_requests')
    .select('id, status, user_id, program_id, credential_id, exam_result_upload_id')
    .eq('id', certRequestId)
    .single();

  if (!req) return { ok: false, error: 'Request not found' };
  if (req.status !== 'upload_pending') return { ok: false, error: `Cannot verify from status: ${req.status}` };

  if (!approved) {
    // Reject — student must re-upload
    await db
      .from('student_credential_uploads')
      .update({
        verification_status: 'rejected',
        verified_by: adminUserId,
        verified_at: new Date().toISOString(),
        rejection_reason: rejectionReason ?? 'Document could not be verified',
      })
      .eq('id', req.exam_result_upload_id);

    await db
      .from('certification_requests')
      .update({ status: 'upload_rejected' })
      .eq('id', certRequestId);

    await auditLog(db, {
      certRequestId,
      userId: req.user_id,
      actorId: adminUserId,
      eventType: 'upload_rejected',
      fromStatus: 'upload_pending',
      toStatus: 'upload_rejected',
      metadata: { reason: rejectionReason },
    });

    return { ok: true };
  }

  // Approve upload
  await db
    .from('student_credential_uploads')
    .update({
      verification_status: 'approved',
      verified_by: adminUserId,
      verified_at: new Date().toISOString(),
    })
    .eq('id', req.exam_result_upload_id);

  await auditLog(db, {
    certRequestId,
    userId: req.user_id,
    actorId: adminUserId,
    eventType: 'upload_approved',
    metadata: { uploadId: req.exam_result_upload_id },
  });

  // Resolve enrollment for certificate issuance
  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id, course_id')
    .eq('user_id', req.user_id)
    .eq('program_id', req.program_id)
    .maybeSingle();

  if (!enrollment) return { ok: false, error: 'Enrollment not found — cannot issue certificate' };

  // Generate certificate number
  const certNumber = `EFH-${Date.now().toString(36).toUpperCase()}`;

  const { data: cert, error: certErr } = await db
    .from('certificates')
    .insert({
      user_id: req.user_id,
      student_id: req.user_id,
      course_id: enrollment.course_id,
      enrollment_id: enrollment.id,
      certificate_number: certNumber,
      issued_at: new Date().toISOString(),
      tenant_id: '6ba71334-58f4-4104-9b2a-5114f2a7614c',
    })
    .select('id, certificate_number')
    .single();

  if (certErr || !cert) {
    logger.error('[ExamAuth] Certificate issuance failed', certErr);
    return { ok: false, error: 'Failed to issue certificate' };
  }

  // Update certification_request to terminal state
  await db
    .from('certification_requests')
    .update({
      status: 'certificate_issued',
      certificate_id: cert.id,
      certificate_issued_at: new Date().toISOString(),
      issued_by: adminUserId,
    })
    .eq('id', certRequestId);

  await auditLog(db, {
    certRequestId,
    userId: req.user_id,
    actorId: adminUserId,
    eventType: 'certificate_issued',
    fromStatus: 'upload_pending',
    toStatus: 'certificate_issued',
    metadata: { certificateId: cert.id, certificateNumber: certNumber },
  });

  // Send certificate email to student
  const [profileRes, programRes, credRes] = await Promise.all([
    db.from('profiles').select('full_name, email').eq('id', req.user_id).single(),
    db.from('programs').select('title').eq('id', req.program_id).single(),
    db.from('credential_registry').select('name').eq('id', req.credential_id).single(),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://elevateforhumanity.org';
  const downloadUrl = `${siteUrl}/learner/certifications/${cert.id}/download`;

  if (profileRes.data && programRes.data && credRes.data) {
    await sendCertificateIssuedEmail({
      studentName: profileRes.data.full_name ?? 'Student',
      studentEmail: profileRes.data.email ?? '',
      programName: programRes.data.title,
      credentialName: credRes.data.name,
      certificateNumber: cert.certificate_number,
      downloadUrl,
      issuedAt: new Date().toISOString(),
    });

    await auditLog(db, {
      certRequestId,
      userId: req.user_id,
      actorId: adminUserId,
      eventType: 'certificate_email_sent',
      metadata: { to: profileRes.data.email, downloadUrl },
    });
  }

  return { ok: true, certificateId: cert.id };
}
