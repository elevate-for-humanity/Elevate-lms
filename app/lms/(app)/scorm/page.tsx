import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/scorm' },
  title: 'SCORM Content | Elevate For Humanity',
  description: 'Access SCORM-compliant learning modules.',
};

export default async function ScormPage() {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: modules } = await supabase.from('scorm_modules').select('*').order('title').limit(20);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/lms" className="hover:text-primary">LMS</Link></li><li>/</li><li className="text-gray-900 font-medium">SCORM</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">SCORM Content</h1>
          <p className="text-gray-600 mt-2">Interactive learning modules</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules && modules.length > 0 ? modules.map((module: any) => (
            <div key={module.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4"><svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
              <h3 className="font-semibold mb-2">{module.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{module.description || 'Interactive module'}</p>
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Launch</button>
            </div>
          )) : <div className="col-span-full bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">No SCORM modules available</div>}
        </div>
      </div>
    </div>
  );
}
