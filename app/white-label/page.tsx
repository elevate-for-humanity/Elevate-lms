import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Check, Code, Users, Shield, Zap, Globe } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'White-Label Platform | Clone & License Our Workforce Training System',
  description:
    'License our complete workforce training platform. Multi-tenant SaaS with your branding, WIOA compliance, apprenticeship tracking, and mobile apps included.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/white-label',
  },
};

export default async function WhiteLabelPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Service Unavailable</h1>
          <p className="text-slate-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Fetch white label info
  const { data: whiteLabel } = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('type', 'white_label');
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-10 py-20 bg-zinc-900  via-white ">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-900 rounded-full text-sm font-bold mb-6">
            <Code className="w-4 h-4" />
            White-Label Platform Available
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-zinc-900 tracking-tight">
            Clone Our Platform.
            <br />
            <span className="text-brand-green-600">Run Your Own Training Business.</span>
          </h1>

          <p className="mt-6 text-xl text-zinc-700 leading-relaxed max-w-3xl mx-auto">
            Get the complete {PLATFORM_DEFAULTS.orgName} platform with your branding. Multi-tenant SaaS,
            WIOA compliance, apprenticeship tracking, mobile apps, and AI tutoring—all ready to
            deploy.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?topic=white-label"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-brand-green-600 rounded-lg hover:bg-brand-green-700 transition-colors shadow-lg"
            >
              Request Pricing
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-zinc-900 bg-white border-2 border-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              See What's Included
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-black text-brand-green-600">100%</div>
              <div className="text-sm text-zinc-600 mt-1">Complete Platform</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-brand-green-600">Multi-Tenant</div>
              <div className="text-sm text-zinc-600 mt-1">SaaS Ready</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-brand-green-600">3 Apps</div>
              <div className="text-sm text-zinc-600 mt-1">Web + Mobile</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-brand-green-600">Your Brand</div>
              <div className="text-sm text-zinc-600 mt-1">Full White-Label</div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section id="features" className="px-4 sm:px-6 lg:px-10 py-20 bg-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-black text-zinc-900 text-center">What's Included</h2>
          <p className="mt-4 text-lg text-zinc-700 text-center max-w-3xl mx-auto">
            Everything we built for {PLATFORM_DEFAULTS.orgName}, ready for your organization.
          </p>

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Complete Platform */}
            <div className="p-8 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Complete Platform</h3>
              <ul className="space-y-2 text-zinc-700">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Full LMS with course management</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Student enrollment & tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Instructor dashboards</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Admin management tools</span>
                </li>
              </ul>
            </div>

            {/* Multi-Tenant SaaS */}
            <div className="p-8 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-brand-green-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Multi-Tenant SaaS</h3>
              <ul className="space-y-2 text-zinc-700">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Serve multiple organizations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Data isolation per tenant</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Custom branding per tenant</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>License management system</span>
                </li>
              </ul>
            </div>

            {/* Compliance Built-In */}
            <div className="p-8 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Compliance Built-In</h3>
              <ul className="space-y-2 text-zinc-700">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>WIOA reporting ready</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>ETPL compliance tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>RAPIDS apprenticeship sync</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Automated reporting</span>
                </li>
              </ul>
            </div>

            {/* Mobile Apps */}
            <div className="p-8 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Mobile Apps Included</h3>
              <ul className="space-y-2 text-zinc-700">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>React Native mobile app</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>iOS & Android ready</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Offline learning support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Push notifications</span>
                </li>
              </ul>
            </div>

            {/* AI Features */}
            <div className="p-8 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">AI-Powered Features</h3>
              <ul className="space-y-2 text-zinc-700">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>AI tutor for students</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Automated grading</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Content generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Smart recommendations</span>
                </li>
              </ul>
            </div>

            {/* Partner Integrations */}
            <div className="p-8 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Partner Integrations</h3>
              <ul className="space-y-2 text-zinc-700">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>6 LMS partner integrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Stripe payment processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Email automation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Analytics & reporting</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Stack */}
      <section className="px-4 sm:px-6 lg:px-10 py-20 bg-slate-50">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-black text-zinc-900 text-center">Modern Tech Stack</h2>
          <p className="mt-4 text-lg text-zinc-700 text-center max-w-3xl mx-auto">
            Built with production-ready technologies for scale and reliability.
          </p>

          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-white rounded-xl border border-slate-200">
              <h3 className="text-xl font-bold text-zinc-900 mb-4">Frontend</h3>
              <ul className="space-y-2 text-zinc-700">
                <li>• Next.js 16 (React 19)</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• React Native (Mobile)</li>
                <li>• Expo (Mobile deployment)</li>
              </ul>
            </div>

            <div className="p-8 bg-white rounded-xl border border-slate-200">
              <h3 className="text-xl font-bold text-zinc-900 mb-4">Backend</h3>
              <ul className="space-y-2 text-zinc-700">
                <li>• Supabase (PostgreSQL)</li>
                <li>• Row-level security (RLS)</li>
                <li>• Real-time subscriptions</li>
                <li>• Edge functions</li>
                <li>• File storage</li>
              </ul>
            </div>

            <div className="p-8 bg-white rounded-xl border border-slate-200">
              <h3 className="text-xl font-bold text-zinc-900 mb-4">Infrastructure</h3>
              <ul className="space-y-2 text-zinc-700">
                <li>• Northflank managed hosting</li>
                <li>• CDN & edge caching</li>
                <li>• Automated CI/CD</li>
                <li>• Environment management</li>
                <li>• Monitoring & analytics</li>
              </ul>
            </div>

            <div className="p-8 bg-white rounded-xl border border-slate-200">
              <h3 className="text-xl font-bold text-zinc-900 mb-4">Integrations</h3>
              <ul className="space-y-2 text-zinc-700">
                <li>• OpenAI (AI features)</li>
                <li>• Stripe (payments)</li>
                <li>• Resend (email)</li>
                <li>• Sentry (error tracking)</li>
                <li>• PostHog (analytics)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-4 sm:px-6 lg:px-10 py-20 bg-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-black text-zinc-900 text-center">Perfect For</h2>

          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-blue-50 rounded-xl">
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Training Providers</h3>
              <p className="text-zinc-700">
                Launch your own workforce training platform with WIOA compliance and apprenticeship
                tracking built-in.
              </p>
            </div>

            <div className="p-8 bg-brand-green-50 rounded-xl">
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Workforce Boards</h3>
              <p className="text-zinc-700">
                Manage multiple training providers and track outcomes across your entire region.
              </p>
            </div>

            <div className="p-8 bg-purple-50 rounded-xl">
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Educational Institutions</h3>
              <p className="text-zinc-700">
                Add workforce training programs to your existing offerings with a complete LMS
                solution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="px-4 sm:px-6 lg:px-10 py-20 bg-zinc-900   text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl sm:text-5xl font-black">Ready to Launch Your Platform?</h2>
          <p className="mt-6 text-xl opacity-90">
            Get pricing and schedule a demo to see the platform in action.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?topic=white-label"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-brand-green-600 bg-white rounded-lg hover:bg-slate-50 transition-colors shadow-lg"
            >
              Request Pricing & Demo
            </Link>
            <Link
              href="/platform"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-slate-900 bg-transparent border-2 border-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Learn More About Platform
            </Link>
          </div>

          <div className="mt-12 pt-12 border-t border-white/20">
            <p className="text-sm opacity-75">
              Questions? Email us at{' '}
              <a href="mailto:elevate4humanityedu@gmail.com" className="underline font-bold">
                elevate4humanityedu@gmail.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
