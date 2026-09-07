'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { auditedMutation } from '@/lib/audit/transactional';
import { requireAdminClient } from '@/lib/supabase/admin';

export async function createWorkforceParticipant(formData: FormData) {
  const auth = await requireRole(['admin', 'super_admin', 'staff']);
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const programId = String(formData.get('program_id') || '').trim();
  const enrollmentDate = String(formData.get('enrollment_date') || '').trim();
  const caseWorkerId = String(formData.get('case_worker_id') || '').trim();

  if (!name || !email || !programId || !/^\d{4}-\d{2}-\d{2}$/.test(enrollmentDate)) {
    redirect('/workforce/participants/new?error=missing-fields');
  }

  const db = await requireAdminClient();
  const [{ data: program }, { data: caseWorker }] = await Promise.all([
    db.from('programs').select('id').eq('id', programId).eq('is_active', true).maybeSingle(),
    caseWorkerId
      ? db.from('profiles').select('id,role').eq('id', caseWorkerId).in('role', ['admin', 'staff', 'advisor']).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!program) redirect('/workforce/participants/new?error=invalid-program');
  if (caseWorkerId && !caseWorker) redirect('/workforce/participants/new?error=invalid-case-worker');

  const { error } = await auditedMutation({
    table: 'workforce_participants',
    operation: 'insert',
    rowData: {
      name,
      email,
      program_id: programId,
      status: 'active',
      enrollment_date: enrollmentDate,
      case_worker_id: caseWorkerId || null,
    },
    audit: {
      action: 'admin:workforce-participant:create',
      actorId: auth.user.id,
      targetType: 'workforce_participants',
      metadata: { program_id: programId, case_worker_id: caseWorkerId || null },
    },
  });
  if (error) redirect('/workforce/participants/new?error=create-failed');

  revalidatePath('/workforce/participants');
  redirect('/workforce/participants?created=true');
}
