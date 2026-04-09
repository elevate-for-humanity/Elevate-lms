
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

/**
 * Payment ↔ Enrollment ↔ Certificate reconciliation report.
 * Surfaces mismatches: refunded payments with valid certificates,
 * active enrollments with no payment, certificates with no enrollment, etc.
 *
 * Query params:
 *   ?program_id=uuid  — filter to one program
 *   ?status=mismatch  — only return rows with detected issues
 *   ?limit=100        — pagination (default 100, max 500)
 *   ?offset=0         — pagination offset
 */

async function requireAdmin() {
  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'sponsor'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user, db };
}

interface ReconciliationRow {
  user_id: string;
  user_email: string | null;
  program_id: string | null;
  program_name: string | null;
  enrollment_id: string | null;
  enrollment_status: string | null;
  payment_intent_id: string | null;
  payment_status: string | null;
  amount_paid: number | null;
  certificate_id: string | null;
  certificate_number: string | null;
  funding_status: string | null;
  issues: string[];
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { db } = auth;

  const url = new URL(req.url);
  const programId = url.searchParams.get('program_id');
  const statusFilter = url.searchParams.get('status'); // 'mismatch' or 'all'
  const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500);
  const offset = Number(url.searchParams.get('offset')) || 0;

  try {
    // 1) Fetch enrollments with payment info
    let enrollQuery = db
      .from('program_enrollments')
      .select(`
        id,
        user_id,
        program_id,
        status,
        payment_id,
        amount_paid,
        refunded_at,
        programs:program_id ( title ),
        profiles:user_id ( email )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (programId) {
      enrollQuery = enrollQuery.eq('program_id', programId);
    }

    const { data: enrollments, error: enrollErr } = await enrollQuery;

    if (enrollErr) {
      logger.error('[reconciliation] Enrollment query error:', enrollErr);
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }

    // 2) Collect user_ids to batch-fetch certificates
    const userIds = [...new Set((enrollments || []).map((e: any) => e.user_id).filter(Boolean))];

    const certMap = new Map<string, any[]>();
    if (userIds.length > 0) {
      let certQuery = db
        .from('certificates')
        .select('id, student_id, user_id, program_id, certificate_number, funding_status, issued_at')
        .in('student_id', userIds);

      if (programId) {
        certQuery = certQuery.eq('program_id', programId);
      }

      const { data: certs } = await certQuery;

      // Also check user_id column (some certs use this instead of student_id)
      let certQuery2 = db
        .from('certificates')
        .select('id, student_id, user_id, program_id, certificate_number, funding_status, issued_at')
        .in('user_id', userIds);

      if (programId) {
        certQuery2 = certQuery2.eq('program_id', programId);
      }

      const { data: certs2 } = await certQuery2;

      // Merge and deduplicate
      const allCerts = [...(certs || []), ...(certs2 || [])];
      const seen = new Set<string>();
      for (const c of allCerts) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        const uid = c.student_id || c.user_id;
        if (!uid) continue;
        const key = `${uid}:${c.program_id || 'none'}`;
        if (!certMap.has(key)) certMap.set(key, []);
        certMap.get(key)!.push(c);
      }
    }

    // 3) Check webhook_events_processed for refund events
    const paymentIds = (enrollments || [])
      .map((e: any) => e.payment_id)
      .filter(Boolean);

    const refundedPayments = new Set<string>();
    if (paymentIds.length > 0) {
      const { data: refundEvents } = await db
        .from('webhook_events_processed')
        .select('payment_reference')
        .eq('event_type', 'charge.refunded')
        .in('payment_reference', paymentIds);

      for (const r of refundEvents || []) {
        if (r.payment_reference) refundedPayments.add(r.payment_reference);
      }
    }

    // 4) Build reconciliation rows with issue detection
    const rows: ReconciliationRow[] = [];

    for (const enrollment of enrollments || []) {
      const e = enrollment as any;
      const certKey = `${e.user_id}:${e.program_id || 'none'}`;
      const certs = certMap.get(certKey) || [];
      const issues: string[] = [];

      const enrollmentStatus = e.status;
      const hasPayment = !!e.payment_id;
      const paymentRefunded = e.payment_id ? refundedPayments.has(e.payment_id) : false;

      // Issue: active enrollment with no payment
      if (enrollmentStatus === 'active' && !hasPayment) {
        issues.push('active_enrollment_no_payment');
      }

      // Issue: refunded payment but enrollment still active
      if (paymentRefunded && enrollmentStatus === 'active') {
        issues.push('refunded_payment_active_enrollment');
      }

      // Issue: enrollment refunded but payment not in refund log
      if (enrollmentStatus === 'refunded' && hasPayment && !paymentRefunded) {
        issues.push('enrollment_refunded_no_webhook_record');
      }

      // Check each certificate
      if (certs.length === 0 && enrollmentStatus === 'active') {
        // Not necessarily an issue — student may not have completed yet
      }

      for (const cert of certs) {
        const certIssues: string[] = [...issues];

        // Issue: refunded payment but certificate still valid
        if (paymentRefunded && cert.funding_status === 'valid') {
          certIssues.push('refunded_payment_valid_certificate');
        }

        // Issue: enrollment refunded but certificate still valid
        if (enrollmentStatus === 'refunded' && cert.funding_status === 'valid') {
          certIssues.push('refunded_enrollment_valid_certificate');
        }

        // Issue: certificate flagged but enrollment still active
        if (cert.funding_status === 'refunded' && enrollmentStatus === 'active') {
          certIssues.push('flagged_certificate_active_enrollment');
        }

        rows.push({
          user_id: e.user_id,
          user_email: e.profiles?.email || null,
          program_id: e.program_id,
          program_name: e.programs?.title || null,
          enrollment_id: e.id,
          enrollment_status: enrollmentStatus,
          payment_intent_id: e.payment_id || null,
          payment_status: paymentRefunded ? 'refunded' : hasPayment ? 'paid' : 'none',
          amount_paid: e.amount_paid || null,
          certificate_id: cert.id,
          certificate_number: cert.certificate_number,
          funding_status: cert.funding_status,
          issues: certIssues,
        });
      }

      // If no certs, still emit a row for the enrollment
      if (certs.length === 0) {
        rows.push({
          user_id: e.user_id,
          user_email: e.profiles?.email || null,
          program_id: e.program_id,
          program_name: e.programs?.title || null,
          enrollment_id: e.id,
          enrollment_status: enrollmentStatus,
          payment_intent_id: e.payment_id || null,
          payment_status: paymentRefunded ? 'refunded' : hasPayment ? 'paid' : 'none',
          amount_paid: e.amount_paid || null,
          certificate_id: null,
          certificate_number: null,
          funding_status: null,
          issues,
        });
      }
    }

    // 5) Filter to mismatches only if requested
    const filtered = statusFilter === 'mismatch'
      ? rows.filter((r) => r.issues.length > 0)
      : rows;

    // 6) Summary stats
    const summary = {
      total_rows: filtered.length,
      total_issues: filtered.filter((r) => r.issues.length > 0).length,
      issue_breakdown: {} as Record<string, number>,
    };

    for (const row of filtered) {
      for (const issue of row.issues) {
        summary.issue_breakdown[issue] = (summary.issue_breakdown[issue] || 0) + 1;
      }
    }

    return NextResponse.json({
      ok: true,
      summary,
      rows: filtered,
    });
  } catch (err) {
    logger.error('[reconciliation] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
