import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateCertificateNumber } from '@/lib/partner-workflows/certificates';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  const supabase = await createClient();
  const db = createAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { enrollmentIds, templateId, issueDate, signedBy } = await req.json();

  if (!enrollmentIds?.length || !templateId) {
    return NextResponse.json({ error: 'Missing enrollmentIds or templateId' }, { status: 400 });
  }

  let issued = 0;
  let failed = 0;

  for (const enrollmentId of enrollmentIds) {
    try {
      // Get enrollment with student and course info
      const { data: enrollment } = await db
        .from('enrollments')
        .select('id, user_id, course_id, completed_at, profiles(full_name, email), courses(title)')
        .eq('id', enrollmentId)
        .single();

      if (!enrollment) { failed++; continue; }

      const certNumber = generateCertificateNumber('EFH');

      // Insert certificate
      const { error: insertErr } = await db
        .from('issued_certificates')
        .insert({
          certificate_number: certNumber,
          recipient_name: (enrollment as any).profiles?.full_name || 'Unknown',
          recipient_email: (enrollment as any).profiles?.email || '',
          student_id: enrollment.user_id,
          template_id: templateId,
          course_id: enrollment.course_id,
          enrollment_id: enrollmentId,
          issue_date: issueDate || new Date().toISOString().split('T')[0],
          signed_by: signedBy || 'Elevate for Humanity Career & Technical Institute',
          status: 'issued',
          issued_by: user.id,
        });

      if (insertErr) {
        // Fallback to certificates table
        await db.from('certificates').insert({
          certificate_number: certNumber,
          student_name: (enrollment as any).profiles?.full_name || 'Unknown',
          student_email: (enrollment as any).profiles?.email || '',
          student_id: enrollment.user_id,
          template_id: templateId,
          course_id: enrollment.course_id,
          issued_date: issueDate || new Date().toISOString().split('T')[0],
          signed_by: signedBy || 'Elevate for Humanity Career & Technical Institute',
          status: 'active',
          issued_by: user.id,
        });
      }

      issued++;
    } catch {
      failed++;
    }
  }

  // Audit log
  await db.from('audit_logs').insert({
    user_id: user.id,
    action: 'bulk_certificates_issued',
    resource_type: 'certificate',
    details: { count: issued, failed, templateId },
  });

  return NextResponse.json({ issued, failed });
}
export const POST = withApiAudit('/api/admin/certificates/bulk', _POST);
