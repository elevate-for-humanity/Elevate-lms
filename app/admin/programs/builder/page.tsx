import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/programs/builder' },
  title: 'Program Builder | Elevate For Humanity',
  description: 'Build and configure training programs.',
};

export default async function ProgramBuilderPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: courses } = await db.from('training_courses').select('id, title').eq('status', 'published').order('title');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li><Link href="/admin/programs" className="hover:text-primary">Programs</Link></li><li>/</li><li className="text-gray-900 font-medium">Builder</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Program Builder</h1>
          <p className="text-gray-600 mt-2">Create a new training program</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form className="space-y-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Program Name *</label><input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="Enter program name" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Program Code *</label><input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="e.g., WIOA-2024" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Description</label><textarea className="w-full border rounded-lg px-3 py-2" rows={4} placeholder="Program description" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Included Courses</label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                {courses?.map((course: any) => (<label key={course.id} className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 rounded" /><span className="text-sm">{course.title}</span></label>))}
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t">
              <button type="submit" className="flex-1 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Create Program</button>
              <Link href="/admin/programs" className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
