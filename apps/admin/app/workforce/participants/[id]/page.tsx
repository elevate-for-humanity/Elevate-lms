import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function WorkforceParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const { id } = await params;
  const db = await requireAdminClient();
  const { data: participant } = await db.from('workforce_participants').select('id,user_id,name,email,program_id,status,enrollment_date,case_worker_id,created_at,updated_at').eq('id', id).maybeSingle();
  if (!participant) notFound();
  const [{ data: program }, { data: caseWorker }] = await Promise.all([
    participant.program_id ? db.from('programs').select('id,title').eq('id', participant.program_id).maybeSingle() : Promise.resolve({ data: null }),
    participant.case_worker_id ? db.from('profiles').select('id,full_name,email').eq('id', participant.case_worker_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const rows = [
    ['Name', participant.name], ['Email', participant.email], ['Program', program?.title || participant.program_id],
    ['Status', participant.status], ['Enrollment date', participant.enrollment_date],
    ['Case manager', caseWorker?.full_name || caseWorker?.email || 'Unassigned'], ['Linked user', participant.user_id || 'Not linked'],
  ];
  return <main className="mx-auto max-w-3xl p-4 sm:p-6"><Link href="/workforce/participants" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="h-4 w-4" />Participants</Link><h1 className="mt-5 text-3xl font-black text-slate-950">Participant record</h1><dl className="mt-6 divide-y rounded-xl border bg-white">{rows.map(([label,value]) => <div key={label} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]"><dt className="font-bold text-slate-600">{label}</dt><dd className="break-words font-semibold text-slate-950">{value || 'Not recorded'}</dd></div>)}</dl></main>;
}
