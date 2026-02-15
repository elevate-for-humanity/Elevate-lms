import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { PLATFORM_APPS } from '@/app/data/store-products';
import { Check, Zap } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform/apps',
  },
  title: 'Platform Apps & Modules | Elevate For Humanity',
  description:
    'Explore the modular apps included with Elevate platform licenses. LMS, enrollment, payments, case management, and more.',
};

export default async function PlatformAppsPage() {
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
  
  // Fetch platform apps
  const { data: dbApps } = await supabase
    .from('platform_apps')
    .select('*')
    .order('name');
  const coreApps = PLATFORM_APPS.filter((app) => app.enabledByDefault);
  const premiumApps = PLATFORM_APPS.filter((app) => !app.enabledByDefault);

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={[
          { label: 'Platform', href: '/platform' },
          { label: 'Apps' },
        ]}
      />
      {/* Hero Section */}
      <section className="relative h-[300px] md:h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/learners/reentry-coaching.jpg"
          alt="Platform Apps"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Modular Apps & Features
          </h1>
          <p className="text-base md:text-lg md:text-xl text-gray-100">
            Every license includes apps. Enable only what you need.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl md:text-2xl md:text-3xl font-bold mb-4 text-black">
              How Platform Apps Work
            </h2>
            <p className="text-base md:text-lg text-black max-w-3xl mx-auto">
              Apps are not separate products. They're modules built into the
              platform that you enable based on your license.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-5xl mb-4">🧩</div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                Modular by Design
              </h3>
              <p className="text-black">
                Each app is a self-contained module with its own UI, database
                tables, and permissions.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                License-Controlled
              </h3>
              <p className="text-black">
                Your license determines which apps you can enable. Upgrade
                anytime to unlock more.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="text-5xl mb-4">
                <Zap className="w-5 h-5 inline-block" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-black">
                Enable Instantly
              </h3>
              <p className="text-black">
                Toggle apps on/off from your dashboard. No reinstallation or
                migration required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Apps */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl md:text-2xl md:text-3xl font-bold mb-4 text-black">
              Core Apps
            </h2>
            <p className="text-base md:text-lg text-black">
              Included with all licenses. These are the foundation of your
              workforce platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreApps.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start mb-4">
                  <span className="text-4xl mr-4">{app.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black mb-2">
                      {app.name}
                    </h3>
                    <div className="inline-flex items-center px-2 py-2 bg-brand-green-100 text-green-800 text-xs font-semibold rounded">
                      <Check className="w-3 h-3 mr-1" />
                      Core App
                    </div>
                  </div>
                </div>
                <p className="text-black">{app.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Apps */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl md:text-2xl md:text-3xl font-bold mb-4 text-black">
              Premium Apps
            </h2>
            <p className="text-base md:text-lg text-black">
              Included with School and Enterprise licenses. Advanced features
              for larger organizations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {premiumApps.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-lg transition-shadow border-2 border-brand-blue-200"
              >
                <div className="flex items-start mb-4">
                  <span className="text-4xl mr-4">{app.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black mb-2">
                      {app.name}
                    </h3>
                    <div className="inline-flex items-center px-2 py-2 bg-brand-blue-100 text-brand-blue-800 text-xs font-semibold rounded">
                      Premium
                    </div>
                  </div>
                </div>
                <p className="text-black">{app.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Comparison Table */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl md:text-2xl md:text-3xl font-bold mb-8 text-center text-black">
            What's Included in Each License
          </h2>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                      App
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-black">
                      Core
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-black">
                      School
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-black">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {PLATFORM_APPS.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{app.icon}</span>
                          <div>
                            <div className="font-semibold text-black">
                              {app.name}
                            </div>
                            <div className="text-sm text-black">
                              {app.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {app.enabledByDefault ? (
                          <Check className="w-5 h-5 text-brand-green-600 mx-auto" />
                        ) : (
                          <span className="text-black">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Check className="w-5 h-5 text-brand-green-600 mx-auto" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Check className="w-5 h-5 text-brand-green-600 mx-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl md:text-2xl md:text-3xl font-bold mb-6">
            Ready to Choose Your License?
          </h2>
          <p className="text-base md:text-lg mb-8 text-brand-blue-100">
            Every license includes apps, updates, and support. Start with what
            you need, upgrade as you grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/platform#licenses"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              View Licenses
            </Link>
            <Link
              href="/contact"
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors border-2 border-white"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
