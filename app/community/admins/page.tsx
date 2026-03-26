import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Settings, Users, FileText, Shield, BarChart, Download } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/community/admins',
  },
  title: 'Administrator Resources | Elevate For Humanity',
  description: 'Resources and tools for platform administrators.',
};

export const dynamic = 'force-dynamic';

export default async function AdminsPage() {
  const supabase = await createClient();


  // Get admin resources
  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .eq('category', 'admins')
    .eq('is_active', true)
    .order('order', { ascending: true });

  // Get admin guides
  const { data: guides } = await supabase
    .from('documentation')
    .select('*')
    .eq('category', 'admin-guides')
    .eq('is_active', true)
    .limit(6);

  // Get admin discussions
  const { data: discussions } = await supabase
    .from('discussions')
    .select('id, title, created_at, reply_count')
    .eq('category', 'admins')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(5);

  const defaultResources = [
    { title: 'Admin Handbook', description: 'Complete guide to platform administration', type: 'pdf' },
    { title: 'User Management Guide', description: 'Managing users, roles, and permissions', type: 'pdf' },
    { title: 'Reporting Guide', description: 'Understanding and generating reports', type: 'pdf' },
    { title: 'Security Best Practices', description: 'Keeping your platform secure', type: 'pdf' },
  ];

  const displayResources = resources && resources.length > 0 ? resources : defaultResources;

  const adminTools = [
    { name: 'User Management', href: '/admin/users', icon: Users, description: 'Manage users and permissions' },
    { name: 'Reports', href: '/admin/reports', icon: BarChart, description: 'View analytics and reports' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, description: 'Configure platform settings' },
    { name: 'Security', href: '/admin/security', icon: Shield, description: 'Security and compliance' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community', href: '/community' }, { label: 'Admins' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-brand-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Settings className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Administrator Resources</h1>
          <p className="text-xl text-brand-blue-100 max-w-2xl mx-auto">
            Tools, guides, and support for platform administrators
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <Link href="/community/communityhub" className="text-brand-blue-600 hover:underline mb-8 inline-block">
          ← Back to Community Hub
        </Link>

        {/* Quick Access Tools */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quick Access</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {adminTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={index}
                  href={tool.href}
                  className="bg-white rounded-xl p-6 border hover:shadow-md transition text-center"
                >
                  <Icon className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
                  <h3 className="font-bold mb-1">{tool.name}</h3>
                  <p className="text-gray-600 text-sm">{tool.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Resources */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-brand-blue-600" />
                Admin Resources
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {displayResources.map((resource: any, index: number) => (
                  <div key={index} className="bg-white rounded-xl p-6 border hover:shadow-md transition">
                    <h3 className="font-bold mb-2">{resource.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{resource.description}</p>
                    <a
                      href={resource.url || '#'}
                      className="inline-flex items-center gap-2 text-brand-blue-600 font-medium hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </section>

            {/* Guides */}
            {guides && guides.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Admin Guides</h2>
                <div className="bg-white rounded-xl border divide-y">
                  {guides.map((guide: any) => (
                    <Link
                      key={guide.id}
                      href={`/docs/${guide.slug}`}
                      className="block p-4 hover:bg-white transition"
                    >
                      <h3 className="font-medium">{guide.title}</h3>
                      <p className="text-sm text-gray-600">{guide.description}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <section className="rounded-xl border p-6">
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/admin/dashboard" className="text-brand-blue-600 hover:underline">
                    Admin Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/admin/users" className="text-brand-blue-600 hover:underline">
                    User Management
                  </Link>
                </li>
                <li>
                  <Link href="/admin/reports" className="text-brand-blue-600 hover:underline">
                    Reports & Analytics
                  </Link>
                </li>
                <li>
                  <Link href="/support/help" className="text-brand-blue-600 hover:underline">
                    Help Center
                  </Link>
                </li>
              </ul>
            </section>

            {/* Discussions */}
            <section className="rounded-xl border p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-blue-600" />
                Admin Discussions
              </h3>
              {discussions && discussions.length > 0 ? (
                <div className="space-y-3">
                  {discussions.map((discussion: any) => (
                    <Link
                      key={discussion.id}
                      href={`/community/discussions/${discussion.id}`}
                      className="block hover:bg-white p-2 -mx-2 rounded transition"
                    >
                      <div className="font-medium text-sm">{discussion.title}</div>
                      <div className="text-xs text-gray-500">{discussion.reply_count || 0} replies</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No discussions yet</p>
              )}
            </section>

            {/* Support */}
            <section className="bg-brand-blue-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4">Need Help?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Our support team is available to help with admin questions.
              </p>
              <Link
                href="/contact?type=admin"
                className="inline-block bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-blue-700 transition"
              >
                Contact Support
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
