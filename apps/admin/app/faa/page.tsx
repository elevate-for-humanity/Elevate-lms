import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { FAA_PROGRAMS } from '@/lib/workone/faa-programs.mjs';
import FaaGeneratorForm from './FaaGeneratorForm';
import Link from 'next/link';

export const dynamic='force-dynamic';
export const metadata={title:'WorkOne FAA Generator | Admin',robots:{index:false,follow:false}};

export default async function FaaPage() {
  const {user,profile}=await requireRole(['admin','super_admin']);
  const db=await requireAdminClient();
  const {data:students,error}=await db.from('profiles')
    .select('id,full_name,first_name,last_name,email,phone')
    .in('role',['student','learner','apprentice','barber_apprentice','cosmetology_apprentice'])
    .order('created_at',{ascending:false}).limit(250);
  const rows=(students||[]).map(s=>({id:s.id,name:s.full_name||[s.first_name,s.last_name].filter(Boolean).join(' ')||'Unnamed student',email:s.email||''}));
  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
    <Link href="/students" className="text-sm font-semibold text-blue-700 underline">← Students</Link>
    <header>
      <h1 className="text-3xl font-bold text-slate-900">WorkOne Financial Award Analysis</h1>
      <p className="mt-2 text-slate-700">Select a student, choose HVAC or Bookkeeping, and confirm training dates. The original program cost snapshot fills in automatically. All funding remains pending WorkOne approval.</p>
    </header>
    {error?<div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4">Student directory is unavailable. No FAA can be generated.</div>:
      <FaaGeneratorForm students={rows} signerName={profile?.full_name||''}
        programs={Object.entries(FAA_PROGRAMS).map(([key,v])=>({key,label:v.label,weeks:v.weeks,source:v.source,total:Object.values(v.costs).reduce((a,b)=>a+b,0)}))} />}
    <p className="text-xs text-slate-600">PDFs are stored in private student document storage as immutable versions. Generating an FAA does not authorize enrollment, funding, invoicing, or WorkOne submission. Signatures require an authenticated per-document confirmation.</p>
  </main>;
}
