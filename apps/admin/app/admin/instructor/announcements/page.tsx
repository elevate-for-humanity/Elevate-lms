import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { MessageSquare, Plus } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Announcements | Instructor Portal',
  robots: { index: false, follow: false },
};

export default async function InstructorAnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['instructor', 'admin', 'super_admin', 'staff'].includes(profile.role)) redirect('/unauthorized');

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, created_at, published')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Instructor', href: '/admin/instructor' }, { label: 'Announcements' }]} />
        <div className="flex items-center justify-between mb-6 mt-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-brand-blue-600" />
            <h1 className="text-2xl font-extrabold text-slate-900">Announcements</h1>
          </div>
          <Link href="/admin/announcements/new" className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition">
            <Plus className="w-4 h-4" /> New Announcement
          </Link>
        </div>
        <div className="space-y-3">
          {!announcements?.length ? (
            <div className="bg-white rounded-xl border border-slate-200 px-6 py-12 text-center text-slate-400 text-sm">
              No announcements yet. Create one to notify your students.
            </div>
          ) : announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-slate-900 text-sm">{a.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${a.published ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                      {a.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm line-clamp-2">{a.body}</p>
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0">{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
