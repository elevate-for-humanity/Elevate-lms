import Image from 'next/image';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'AI Console | Admin',
};

export default async function AIConsolePage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Ai Console" }]} />
        </div>
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
  if (!user) redirect('/login');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin')
    redirect('/unauthorized');

  // Get AI usage stats
  const { count: totalConversations } = await db
    .from('conversations')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Ai Console" }]} />
        </div>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">AI Console</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-black">
              Total Conversations
            </h3>
            <p className="text-3xl font-bold text-black mt-2">
              {totalConversations || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-black">
              AI Tutor Active
            </h3>
            <p className="text-3xl font-bold text-brand-green-600 mt-2">•</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-black">OpenAI Status</h3>
            <p className="text-3xl font-bold text-brand-green-600 mt-2">Connected</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">AI Features</h2>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-brand-green-600">•</span>
              <span>AI Tutor - Chat, Essay, Study Guide modes</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-brand-green-600">•</span>
              <span>Course Generator - AI-powered course creation</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-brand-green-600">•</span>
              <span>Content Analysis - Automated content review</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
