import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import {
  Building2,
  Check,
  CheckCircle,
  Lightbulb,
  Shield,
  Zap,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title:
    'Independent Platform License | White-Label Workforce Training Platform',
  description:
    'License our platform independently. Get your own credentials. Full white-label LMS, mobile app, student management. Starting at $2,000/mo. Instant access.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/pricing/independent',
  },
};

export default async function IndependentLicensePage() {
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
  
  // Fetch independent licensing info
  const { data: licensing } = await supabase
    .from('pricing_plans')
    .select('*')
    .eq('type', 'independent');

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Pricing", href: "/pricing" }, { label: "Independent" }]} />
      </div>
{/* Hero */}
      <section className="bg-zinc-900    text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-6">
            <Zap className="w-5 h-5 inline-block" /> Instant Access
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Independent Platform License
          </h1>
          <p className="text-xl text-white/90 mb-8">
            License the platform. Get your own credentials. Operate
            independently.
          </p>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold mb-1">Instant</div>
                <div className="text-sm text-white/80">Access</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">No Approval</div>
                <div className="text-sm text-white/80">Required</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">Your Rules</div>
                <div className="text-sm text-white/80">Your Compliance</div>
              </div>
            </div>
          </div>
          <Link
            href="/contact?license=independent"
            className="inline-block bg-white text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
          >
            Get Started →
          </Link>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">
              What's Included
            </h2>
            <p className="text-xl text-black">
              Complete platform. No credentials. You handle compliance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-black mb-3">
                White-Label Platform
              </h3>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Your branding, colors, logo</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Custom domain</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Branded emails & certificates</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-black mb-3">
                Complete LMS
              </h3>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Course creation & management</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Student enrollment & tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Progress tracking & certificates</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-xl p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-black mb-3">
                Mobile App
              </h3>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>iOS & Android apps</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Student portal access</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Push notifications</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-black">
              Based on student volume. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-sm font-bold text-black mb-2">SMALL</div>
              <div className="text-3xl font-bold text-black mb-1">
                $2,000
              </div>
              <div className="text-sm text-black mb-4">/month</div>
              <div className="text-sm text-black mb-4">
                Up to 500 students
              </div>
              <div className="text-xs text-slate-500">Setup: $5,000</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-500">
              <div className="text-sm font-bold text-blue-600 mb-2">MEDIUM</div>
              <div className="text-3xl font-bold text-black mb-1">
                $4,000
              </div>
              <div className="text-sm text-black mb-4">/month</div>
              <div className="text-sm text-black mb-4">
                Up to 2,500 students
              </div>
              <div className="text-xs text-slate-500">Setup: $10,000</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-sm font-bold text-black mb-2">LARGE</div>
              <div className="text-3xl font-bold text-black mb-1">
                $8,000
              </div>
              <div className="text-sm text-black mb-4">/month</div>
              <div className="text-sm text-black mb-4">
                Up to 10,000 students
              </div>
              <div className="text-xs text-slate-500">Setup: $20,000</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-sm font-bold text-black mb-2">
                ENTERPRISE
              </div>
              <div className="text-3xl font-bold text-black mb-1">
                $15,000
              </div>
              <div className="text-sm text-black mb-4">/month</div>
              <div className="text-sm text-black mb-4">
                Unlimited students
              </div>
              <div className="text-xs text-slate-500">Setup: $25,000</div>
            </div>
          </div>
        </div>
      </section>

      {/* Best For */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">Best For</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
              <h3 className="text-lg font-bold text-green-900 mb-4">
                <CheckCircle className="w-5 h-5 inline-block" /> Choose This If:
              </h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li>• You already have ETPL/WIOA/RAPIDS credentials</li>
                <li>• You're willing to get your own approvals</li>
                <li>• You want full independence</li>
                <li>• You have compliance expertise</li>
                <li>• You want instant access (no approval wait)</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-4">
                <Lightbulb className="w-5 h-5 inline-block" /> Consider Program
                Holder Network If:
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• You DON'T have credentials yet</li>
                <li>• You want to skip 4-8 years of approvals</li>
                <li>• You want to use OUR credentials</li>
                <li>• You're in Indiana</li>
                <li>• You're okay with MOU requirements</li>
              </ul>
              <Link
                href="/pricing/program-holder"
                className="text-blue-600 hover:underline text-sm font-bold mt-4 inline-block"
              >
                Learn about Program Holder Network →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-zinc-900   text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-8">
            Instant access. No approval needed. Launch today.
          </p>
          <Link
            href="/contact?license=independent"
            className="inline-block bg-white text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
          >
            Contact Sales →
          </Link>
          <p className="mt-6 text-white/80 text-sm">
            Questions? Email Elevate4humanityedu@gmail.com or call (317)
            314-3757
          </p>
        </div>
      </section>
    </div>
  );
}
