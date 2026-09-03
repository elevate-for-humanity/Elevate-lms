import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { generateWotcPacket } from '@/lib/wotc/generate-packet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireRole(['admin', 'super_admin', 'staff']);
  const { id } = await params;
  const db = await requireAdminClient();
  const { data: record } = await db.from('wotc_applications').select('*').eq('id', id).maybeSingle();
  if (!record) return NextResponse.json({ error: 'WOTC record not found' }, { status: 404 });

  const [{ data: application }, { data: organization }] = await Promise.all([
    record.application_id ? db.from('applications').select('*').eq('id', record.application_id).maybeSingle() : Promise.resolve({ data: null }),
    record.organization_id ? db.from('organizations').select('*').eq('id', record.organization_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const eligibility = (application?.eligibility_data ?? {}) as Record<string, unknown>;
  const bytes = await generateWotcPacket({
    applicant: {
      firstName: record.employee_first_name || application?.first_name || '', lastName: record.employee_last_name || application?.last_name || '',
      ssnLast4: record.employee_ssn_last4 || undefined, dateOfBirth: record.employee_dob || undefined,
      address: String(eligibility.address ?? ''), city: application?.city || '', state: String(eligibility.state ?? ''), zip: application?.zip || '',
      county: String(eligibility.county ?? ''), phone: application?.phone || '',
    },
    employer: {
      name: organization?.name || record.employer_name, ein: organization?.ein || record.employer_ein || '', address: organization?.address || '',
      city: organization?.city || '', state: organization?.state || '', zip: organization?.zip || '', phone: organization?.phone || record.employer_phone || '', email: organization?.contact_email || '',
    },
    employment: { offerDate: record.job_offer_date, hireDate: record.hire_date, startDate: record.start_date, startingWage: Number(record.starting_wage) || undefined, position: record.position, targetGroups: record.target_groups || [], previouslyEmployed: record.previously_employed },
  });

  const studentId = record.applicant_id || application?.user_id;
  const fileName = `wotc/${studentId || 'unlinked'}/${id}-historical-wotc-packet.pdf`;
  const { error: uploadError } = await db.storage.from('documents').upload(fileName, bytes, { contentType: 'application/pdf', upsert: true });
  if (uploadError) return NextResponse.json({ error: 'Packet generated but Digital Binder storage failed' }, { status: 500 });
  if (studentId) {
    await db.from('student_binder_documents').upsert({ student_id: studentId, document_type: 'funding_documents', title: 'Historical WOTC Packet - Review Required', file_url: fileName, status: 'uploaded', uploaded_by: user.id, notes: 'Draft Form 8850 and ETA 9061. Complete full SSN, verify all fields, and obtain signatures before submission.' }, { onConflict: 'student_id,title' });
  }
  return new NextResponse(Buffer.from(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="historical-wotc-packet-${id}.pdf"`, 'Cache-Control': 'no-store' } });
}
