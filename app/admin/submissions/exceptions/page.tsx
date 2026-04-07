import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Exception Queue | Submissions OS | Admin' };
export const dynamic = 'force-dynamic';

export default async function ExceptionQueuePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const db = createAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin','staff'].includes(profile.role)) redirect('/admin');

  const { data: tasks, error } = await db
    .from('sos_review_tasks')
    .select('*')
    .eq('status', 'open')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Submissions OS
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Exception Queue</h1>
            <p className="text-slate-500 text-sm">Unresolved blockers — missing data, required reviews, signature requests</p>
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            Review tasks table not yet applied. Run migrations 20260527000010 in Supabase Dashboard.
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-green-200 p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-slate-900 mb-1">No open exceptions</p>
            <p className="text-sm text-slate-500">All submission requirements are resolved.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(tasks as any[]).map(task => (
              <div key={task.id} className={`bg-white rounded-xl border p-5 ${
                task.priority === 'high' ? 'border-red-200' :
                task.priority === 'medium' ? 'border-amber-200' : 'border-slate-200'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{task.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                    <p className="text-xs text-slate-400 mt-1">Type: {task.task_type} · Priority: {task.priority}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>{task.priority}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
