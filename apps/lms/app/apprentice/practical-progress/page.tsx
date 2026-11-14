import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { readHoursPages } from '@/lib/apprenticeship/admin-hours';
import { practicalServiceProgress } from '@/lib/apprenticeship/practical-service-progress.mjs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Practical Training Progress' };
export default async function PracticalProgressPage() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) redirect('/login?redirect=/apprentice/practical-progress');
  const programSlug = await resolveApprenticeProgramSlug(db, subject.userId);
  const { data: enrollments, error } = await db.from('program_enrollments').select('id')
    .or(`student_id.eq.${subject.userId},user_id.eq.${subject.userId}`)
    .eq('program_slug', programSlug || '').in('status', ['active', 'enrolled', 'in_progress', 'confirmed']);
  if (error) throw error;
  const ids = (enrollments || []).map(row => row.id);
  const entries = ids.length ? await readHoursPages<any>((from, to) => db
    .from('host_shop_practical_service_entries')
    .select('id,enrollment_id,service_name,competency_id,performed_on,subject_type,verified_at')
    .in('enrollment_id', ids).is('voided_at', null).not('verified_at', 'is', null)
    .order('performed_on', { ascending: false }).order('id').range(from, to)) : [];
  const [{data:requirements,error:requirementsError},{data:progressRows,error:progressError}]=await Promise.all([
    db.from('apprenticeship_practical_service_requirements').select('id,service_name,exercise_title,instructions,required_count,counts_for_completion,authority').eq('program_slug',programSlug||'').order('exercise_title'),
    ids.length?db.from('host_shop_practical_service_progress').select('service_name,recorded_count,last_verified_at').in('enrollment_id',ids):Promise.resolve({data:[],error:null}),
  ]);
  if(requirementsError||progressError)throw requirementsError||progressError;
  const practice=practicalServiceProgress(requirements||[],progressRows||[]);
  const counts = new Map<string, number>();
  for (const entry of entries) counts.set(entry.service_name, (counts.get(entry.service_name) || 0) + 1);
  return <main className="mx-auto max-w-4xl px-4 py-8"><h1 className="text-3xl font-black">My Practical Training Progress</h1><p className="mt-3 text-slate-700">Services recorded by your Host Shop owner. You can view progress here, but you cannot check off your own services. These practice counts do not automatically award Appendix A competencies, workplace hours or RTI credit.</p>{practice.items.length>0&&<section className="mt-6 rounded-xl border bg-white p-5"><h2 className="text-xl font-bold">Program hands-on targets</h2><p className="mt-2 text-slate-700">{practice.recordedCount} of {practice.requiredCount} required practices · {practice.percent}%</p><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-emerald-600" style={{width:`${practice.percent}%`}}/></div><ul className="mt-4 space-y-4">{practice.items.map(item=><li key={item.id} className="rounded-xl border p-4"><div className="flex justify-between gap-3"><strong>{item.exercise_title}</strong><span className={item.complete?'text-emerald-700':'text-amber-700'}>{item.recordedCount} / {item.requiredCount}</span></div><p className="mt-2 text-sm text-slate-600">{item.instructions}</p></li>)}</ul><p className="mt-4 text-xs text-slate-500">These are Elevate program practice targets, not a statement of state-law service counts.</p></section>}<section className="mt-6 rounded-xl border bg-white p-5"><h2 className="text-xl font-bold">Verified practice entries</h2>{counts.size ? <ul className="mt-4 space-y-2">{Array.from(counts).map(([name, count]) => <li key={name} className="flex justify-between border-b py-2"><span>{name}</span><strong>{count}</strong></li>)}</ul> : <p className="mt-4 text-slate-600">No verified Host Shop owner-recorded practical services yet.</p>}</section><section className="mt-5 rounded-xl border bg-white p-5"><h2 className="text-xl font-bold">Recent service history</h2><ul className="mt-3 space-y-2">{entries.slice(0, 30).map(entry => <li key={entry.id} className="border-b py-2">{entry.performed_on} — {entry.service_name} ({entry.subject_type})</li>)}</ul></section></main>;
}
