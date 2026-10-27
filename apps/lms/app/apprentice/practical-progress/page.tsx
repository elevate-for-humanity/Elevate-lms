import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
export const dynamic='force-dynamic';
export const metadata={title:'My Practical Training Progress'};
export default async function PracticalProgressPage(){
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();
 if(!user)redirect('/login');
 const db=await requireAdminClient();
 const {data:enrollments}=await db.from('program_enrollments').select('id,program_slug').or(`student_id.eq.${user.id},user_id.eq.${user.id}`).in('status',['active','enrolled','in_progress','confirmed']);
 const ids=(enrollments||[]).map((r:any)=>r.id);
 const {data:entries}=ids.length?await db.from('host_shop_practical_service_entries').select('id,enrollment_id,service_name,competency_id,performed_on,subject_type,verified_at').in('enrollment_id',ids).is('voided_at',null).order('performed_on',{ascending:false}).limit(500):{data:[]};
 const counts=new Map<string,number>();for(const e of entries||[])counts.set(e.service_name,(counts.get(e.service_name)||0)+1);
 return <main className="mx-auto max-w-4xl px-4 py-8"><h1 className="text-3xl font-black">My Practical Training Progress</h1><p className="mt-3 text-slate-700">Services recorded by your authorized host shop mentor. These practice counts do not automatically award Appendix A competencies, workplace hours or RTI credit.</p><section className="mt-6 rounded-xl border bg-white p-5"><h2 className="text-xl font-bold">Verified practice entries</h2>{counts.size?<ul className="mt-4 space-y-2">{Array.from(counts).map(([name,count])=><li key={name} className="flex justify-between border-b py-2"><span>{name}</span><strong>{count}</strong></li>)}</ul>:<p className="mt-4 text-slate-600">No mentor-recorded practical services yet.</p>}</section><section className="mt-5 rounded-xl border bg-white p-5"><h2 className="text-xl font-bold">Recent service history</h2><ul className="mt-3 space-y-2">{(entries||[]).slice(0,30).map((e:any)=><li key={e.id} className="border-b py-2">{e.performed_on} — {e.service_name} ({e.subject_type})</li>)}</ul></section></main>;
}
