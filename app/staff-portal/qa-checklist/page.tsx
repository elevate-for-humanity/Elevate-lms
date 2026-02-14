import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { CheckSquare, Square, Calendar, User } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/staff-portal/qa-checklist',
  },
  title: 'QA Checklist | Elevate For Humanity',
  description: 'Daily and weekly quality assurance checklists for staff.',
};

export default async function QAChecklistPage() {
  const { user, profile } = await requireRole([
    'staff',
    'admin',
    'super_admin',
    'advisor',
  ]);
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: checklists, error } = await supabase
    .from('qa_checklists')
    .select('*')
    .eq('is_active', true)
    .or(`assignee_role.eq.${profile.role},assignee_role.is.null`)
    .order('frequency');

  const today = new Date().toISOString().split('T')[0];
  const { data: completions } = await supabase
    .from('qa_checklist_completions')
    .select('*')
    .eq('user_id', user.id)
    .gte('completed_at', `${today}T00:00:00`)
    .lte('completed_at', `${today}T23:59:59`);

  const checklistsWithStatus = checklists?.map((checklist) => ({
    ...checklist,
    completed: completions?.some((c) => c.checklist_id === checklist.id),
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Staff Portal', href: '/staff-portal' }, { label: 'QA Checklist' }]} />
        </div>
      </div>

      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">
                QA Checklist
              </h1>
              <p className="text-black mt-2">
                Daily and weekly quality assurance tasks
              </p>
            </div>
            <Link
              href="/staff-portal/dashboard"
              className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
            >
              ← Back
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <Calendar className="h-11 w-11 text-brand-blue-600 mb-2" />
            <p className="text-3xl font-bold text-black">
              {checklistsWithStatus?.length || 0}
            </p>
            <p className="text-black text-sm">Total Checklists</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <CheckSquare className="h-11 w-11 text-green-600 mb-2" />
            <p className="text-3xl font-bold text-black">
              {completions?.length || 0}
            </p>
            <p className="text-black text-sm">Completed Today</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <User className="h-11 w-11 text-brand-blue-600 mb-2" />
            <p className="text-3xl font-bold text-black">{profile.role}</p>
            <p className="text-black text-sm">Your Role</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error: {error.message}</p>
          </div>
        )}

        <div className="space-y-6">
          {['daily', 'weekly', 'monthly'].map((freq) => {
            const items = checklistsWithStatus?.filter(
              (c) => c.frequency === freq
            );
            if (!items || items.length === 0) return null;

            return (
              <div key={freq}>
                <h2 className="text-xl font-bold text-black mb-4 capitalize">
                  {freq} Checklists
                </h2>
                <div className="space-y-4">
                  {items.map((checklist) => (
                    <div
                      key={checklist.id}
                      className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-black">
                            {checklist.title}
                          </h3>
                          {checklist.assignee_role && (
                            <p className="text-sm text-black mt-1">
                              For: {checklist.assignee_role}
                            </p>
                          )}
                        </div>
                        {checklist.completed ? (
                          <span className="px-3 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center gap-1">
                            <CheckSquare className="h-4 w-4" />
                            Completed
                          </span>
                        ) : (
                          <span className="px-3 py-2 bg-slate-100 text-black text-sm font-medium rounded-full flex items-center gap-1">
                            <Square className="h-4 w-4" />
                            Pending
                          </span>
                        )}
                      </div>

                      {checklist.tasks && Array.isArray(checklist.tasks) && (
                        <div className="space-y-2 mb-4">
                          {checklist.tasks.map((task: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-sm text-black"
                            >
                              <Square className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{task.task || task}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {!checklist.completed && (
                        <button
                          className="w-full px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
                          onClick={() =>
                            alert(
                              'Mark complete functionality - will integrate with API'
                            )
                          }
                        >
                          Mark as Complete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
