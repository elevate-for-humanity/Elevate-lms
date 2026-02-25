import Image from 'next/image';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Autopilot Management | Admin | Elevate For Humanity',
  description: 'Manage automation and autopilot features for the LMS system.',
};

export default async function AutopilotPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Autopilot" }]} />
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

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Autopilot" }]} />
        </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block"
          >
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-black">
            Autopilot Management
          </h1>
          <p className="mt-2 text-black">
            Manage automation features and autopilot settings for the LMS
            system.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/autopilots"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold text-black mb-2">
              All Autopilots
            </h3>
            <p className="text-black text-sm">
              View and manage all autopilot configurations
            </p>
          </Link>

          <Link
            href="/admin/workflows"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold text-black mb-2">
              Workflows
            </h3>
            <p className="text-black text-sm">Manage automated workflows</p>
          </Link>

          <Link
            href="/admin/copilot"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold text-black mb-2">
              Copilot
            </h3>
            <p className="text-black text-sm">AI copilot management</p>
          </Link>
        </div>

        {/* Info Box */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-brand-blue-900 mb-2">
            Automation Features
          </h3>
          <ul className="space-y-2 text-brand-blue-800">
            <li>• Automated student enrollment</li>
            <li>• Course completion notifications</li>
            <li>• Certificate generation</li>
            <li>• Progress tracking</li>
            <li>• Email campaigns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
