import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/workflows' },
  title: 'Workflow Automation | Elevate For Humanity',
  description: 'Configure automated workflows and processes.',
};

export default async function WorkflowsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const workflows = [
    { name: 'New Enrollment', status: 'active', triggers: 'On enrollment', actions: 'Send welcome email, assign mentor' },
    { name: 'Course Completion', status: 'active', triggers: 'On completion', actions: 'Issue certificate, notify admin' },
    { name: 'Inactive User', status: 'active', triggers: '7 days inactive', actions: 'Send reminder email' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">Workflows</li></ol></nav>
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900">Workflow Automation</h1><p className="text-gray-600 mt-2">Configure automated processes</p></div>
            <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Create Workflow</button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="divide-y">
            {workflows.map((wf, i) => (
              <div key={i} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{wf.name}</h3>
                  <span className="px-2 py-1 bg-brand-green-100 text-brand-green-800 rounded-full text-xs">{wf.status}</span>
                </div>
                <p className="text-sm text-gray-500"><strong>Trigger:</strong> {wf.triggers}</p>
                <p className="text-sm text-gray-500"><strong>Actions:</strong> {wf.actions}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
