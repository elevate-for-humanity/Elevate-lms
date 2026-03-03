import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CopilotAssistant from '@/components/admin/CopilotAssistant';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/copilot',
  },
  title: 'AI Copilot Dashboard | Elevate For Humanity',
  description: 'Manage AI-powered features and assistants.',
};

export default async function CopilotPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Query real deployment status from copilot_deployments table
  const { data: deployments } = await db
    .from('copilot_deployments')
    .select('copilot_type, status')
    .order('created_at', { ascending: false });

  const deploymentMap = new Map((deployments || []).map((d: any) => [d.copilot_type, d.status]));

  const copilotFeatures = [
    {
      name: 'AI Tutor',
      description: 'Personalized learning assistance',
      status: deploymentMap.get('ai_tutor') || 'not_deployed',
      usage: deploymentMap.has('ai_tutor') ? 'Deployed' : 'Not deployed',
      href: '/admin/copilot/tutor'
    },
    {
      name: 'Content Generator',
      description: 'Generate course content and quizzes',
      status: deploymentMap.get('admin_assistant') || 'not_deployed',
      usage: deploymentMap.has('admin_assistant') ? 'Deployed' : 'Not deployed',
      href: '/admin/copilot/content'
    },
    {
      name: 'Analytics Assistant',
      description: 'AI-powered insights and reports',
      status: deploymentMap.get('support_bot') || 'not_deployed',
      usage: deploymentMap.has('support_bot') ? 'Deployed' : 'Not deployed',
      href: '/admin/copilot/analytics'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Copilot</li>
            </ol>
          </nav>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Copilot Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage AI-powered features and assistants</p>
            </div>
            <Link 
              href="/admin/copilot/deploy"
              className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700"
            >
              Deploy New Feature
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Total Conversations</h3>
              <span className="text-brand-blue-600 bg-brand-blue-100 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">2,847</p>
            <p className="text-sm text-brand-green-600 mt-1">+12% this week</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
              <span className="text-brand-blue-600 bg-brand-blue-100 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">342</p>
            <p className="text-sm text-gray-500 mt-1">Using AI features</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Satisfaction Rate</h3>
              <span className="text-brand-green-600 bg-brand-green-100 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">94%</p>
            <p className="text-sm text-gray-500 mt-1">Positive feedback</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">API Usage</h3>
              <span className="text-brand-orange-600 bg-brand-orange-100 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">45K</p>
            <p className="text-sm text-gray-500 mt-1">Tokens this month</p>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">AI Features</h2>
            <p className="text-sm text-gray-500">Manage deployed AI capabilities</p>
          </div>
          <div className="divide-y">
            {copilotFeatures.map((feature) => (
              <div key={feature.name} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    feature.status === 'active' ? 'bg-brand-green-100' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-5 h-5 ${feature.status === 'active' ? 'text-brand-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{feature.name}</p>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      feature.status === 'active' 
                        ? 'bg-brand-green-100 text-brand-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {feature.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{feature.usage}</p>
                  </div>
                  <Link 
                    href={feature.href}
                    className="text-brand-blue-600 hover:text-brand-blue-800 text-sm font-medium"
                  >
                    Configure
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Copilot Assistant */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Copilot Assistant</h2>
          <CopilotAssistant />
        </div>
      </div>
    </div>
  );
}
