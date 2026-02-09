import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { generateMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = generateMetadata({
  title: 'Platform Architecture',
  description: 'Platform Architecture - Elevate for Humanity workforce training and career development programs in Indianapolis.',
  path: '/platform/architecture',
});

import { ComplianceBar } from '@/components/ComplianceBar';

export const dynamic = 'force-dynamic';

export default async function ArchitecturePage() {
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
  
  // Fetch architecture docs
  const { data: docs } = await supabase
    .from('documentation')
    .select('*')
    .eq('category', 'architecture');
  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Platform', href: '/platform' },
          { label: 'Architecture' },
        ]}
      />
      <ComplianceBar />

      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-6 text-black">
          Platform Architecture
        </h1>

        <p className="text-xl text-black mb-12 leading-relaxed">
          Built from the ground up as government-aligned workforce
          infrastructure, not adapted from generic LMS software.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4 text-black">
              Core Infrastructure
            </h2>
            <ul className="space-y-3 text-black">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Multi-tenant architecture</strong> - Complete data
                  isolation per organization
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Row-level security (RLS)</strong> - Database-enforced
                  access control
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>License enforcement</strong> - Automatic seat and
                  feature limits
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Stripe subscription billing</strong> - Automated
                  payment processing
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4 text-black">
              Compliance & Reporting
            </h2>
            <ul className="space-y-3 text-black">
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold">•</span>
                <span>
                  <strong>RAPIDS integration</strong> - DOL apprenticeship
                  tracking
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold">•</span>
                <span>
                  <strong>ETPL reporting</strong> - Automated state compliance
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold">•</span>
                <span>
                  <strong>Workforce dashboards</strong> - Real-time outcome
                  tracking
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold">•</span>
                <span>
                  <strong>Audit logs</strong> - Complete activity history
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4 text-black">
              Mobile & AI
            </h2>
            <ul className="space-y-3 text-black">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Native mobile app</strong> - iOS and Android (React
                  Native + Expo)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Push notifications</strong> - Expo push notification
                  service
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Offline mode</strong> - Download courses, sync when
                  online
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>AI tutoring</strong> - 5 AI systems for learner
                  support
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Biometric auth</strong> - Face ID, Touch ID,
                  Fingerprint
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4 text-black">
              Engagement & Gamification
            </h2>
            <ul className="space-y-3 text-black">
              <li className="flex items-start gap-3">
                <span className="text-indigo-600 font-bold">•</span>
                <span>
                  <strong>Badge system</strong> - Earned achievements with
                  progress tracking
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-600 font-bold">•</span>
                <span>
                  <strong>Leaderboards</strong> - Weekly, monthly, all-time
                  rankings
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-600 font-bold">•</span>
                <span>
                  <strong>Points system</strong> - Rewards for activity and
                  completion
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-600 font-bold">•</span>
                <span>
                  <strong>Streaks</strong> - Daily engagement tracking
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-black">
            Partner Integrations
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-black">
            <div>
              <h3 className="font-bold text-black mb-2">LMS Partners (6)</h3>
              <ul className="text-sm space-y-1">
                <li>• Coursera</li>
                <li>• Udemy Business</li>
                <li>• LinkedIn Learning</li>
                <li>• Milady</li>
                <li>• Pivot Point</li>
                <li>• Custom LMS</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-black mb-2">
                Payment Processing
              </h3>
              <ul className="text-sm space-y-1">
                <li>• Stripe subscriptions</li>
                <li>• Webhook automation</li>
                <li>• License enforcement</li>
                <li>• Invoice generation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-black mb-2">
                Government Systems
              </h3>
              <ul className="text-sm space-y-1">
                <li>• RAPIDS (DOL)</li>
                <li>• ETPL (State)</li>
                <li>• WIOA tracking</li>
                <li>• WRG reporting</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-black">
            Technical Stack
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-black">
            <div>
              <h3 className="font-bold text-black mb-3">Frontend</h3>
              <ul className="space-y-2 text-sm">
                <li>• Next.js 16 (Turbopack)</li>
                <li>• React 19</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Shadcn/ui components</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-black mb-3">Backend</h3>
              <ul className="space-y-2 text-sm">
                <li>• Supabase (PostgreSQL)</li>
                <li>• Row-level security (RLS)</li>
                <li>• Edge Functions</li>
                <li>• Real-time subscriptions</li>
                <li>• Vercel hosting</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-black mb-3">Mobile</h3>
              <ul className="space-y-2 text-sm">
                <li>• React Native</li>
                <li>• Expo SDK 50</li>
                <li>• TypeScript</li>
                <li>• Expo Router</li>
                <li>• Expo Push Notifications</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-black mb-3">Infrastructure</h3>
              <ul className="space-y-2 text-sm">
                <li>• Multi-tenant database</li>
                <li>• Automated backups</li>
                <li>• SSL/TLS encryption</li>
                <li>• CDN delivery</li>
                <li>• 99.9% uptime SLA</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
