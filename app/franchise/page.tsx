
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Users,
  Award,
  Circle,
  Home,
  Briefcase,
} from 'lucide-react';

export const metadata: Metadata = {
  title:
    'Franchise Opportunities | Start Your Own Training Center | Elevate for Humanity',
  description:
    'Own your own workforce development training center. Full turnkey franchise with DOL approval, curriculum, marketing, and support. Low startup cost. High profit potential. Serving communities nationwide.',
  keywords: [
    'franchise opportunities',
    'training center franchise',
    'education franchise',
    'workforce development franchise',
    'business opportunity',
    'start training business',
    'vocational school franchise',
    'career training franchise',
    'low cost franchise',
    'home based franchise',
    'online franchise opportunity',
  ],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/franchise',
  },
};

export default function FranchisePage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Page.tsx" }]} />
      </div>
      {/* Hero */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl">
            <div className="inline-block bg-yellow-400 text-brand-orange-900 px-6 py-3 rounded-full font-bold text-sm mb-6">
              FRANCHISE OPPORTUNITY
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Own Your Own Training Center
            </h1>
            <p className="text-2xl text-brand-orange-100 mb-8">
              Turn-key workforce development franchise. DOL-approved programs,
              proven curriculum, full support. Start earning $100k-$500k+ per
              year.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#packages"
                className="inline-block px-8 py-4 bg-yellow-400 text-brand-orange-900 font-bold rounded-lg hover:bg-yellow-300 transition text-lg text-center"
              >
                View Franchise Packages
              </Link>
              <a
                href="/support"
                className="inline-block px-8 py-4 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition text-lg border-2 border-white text-center"
              >
                Call support center
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Franchise With Us */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Why Franchise With Elevate for Humanity?
            </h2>
            <p className="text-xl text-black">
              Proven business model with government funding and high demand
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-brand-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">DOL-Approved Programs</h3>
              <p className="text-black">
                Use our DOL Registered Apprenticeship Sponsor status (RAPIDS ID:
                2025-IN-132301) and DWD approvals
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Government Funding</h3>
              <p className="text-black">
                Students pay $0 through WIOA, WRG, JRI funding. You get paid
                directly by government programs
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">High Profit Margins</h3>
              <p className="text-black">
                Earn $2,000-$8,000 per student. Low overhead. High demand.
                Recession-proof industry
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-brand-orange-100 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-brand-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Complete Curriculum</h3>
              <p className="text-black">
                15+ ready-to-launch programs: CDL, CNA, Barber, HVAC, Tax Prep,
                Business, and more
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-brand-red-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-brand-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Marketing Support</h3>
              <p className="text-black">
                Website, social media, SEO, advertising templates, and lead
                generation system included
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mb-4">
                <Home className="w-8 h-8 text-brand-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Home-Based Option</h3>
              <p className="text-black">
                Start from home with online/hybrid programs. No expensive
                facility required initially
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Franchise Packages */}
      <section id="packages" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Franchise Packages</h2>
            <p className="text-xl text-black">
              Choose the package that fits your goals and budget
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Package */}
            <div className="bg-white border-2 border-gray-300 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Starter Package</h3>
              <div className="mb-6">
                <div className="text-4xl font-bold text-brand-green-600 mb-2">
                  $15,000
                </div>
                <p className="text-sm text-black">One-time franchise fee</p>
                <p className="text-sm text-black">+ 5% ongoing royalty</p>
              </div>

              <div className="mb-6">
                <p className="font-bold mb-3">What's Included:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      3 training programs of your choice
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Complete curriculum & materials
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Use of DOL/DWD approvals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Basic website template</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">2-week training</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Email support</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/franchise/apply?package=starter"
                className="block w-full text-center px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition"
              >
                Get Started
              </Link>

              <div className="mt-4 text-center">
                <p className="text-sm font-bold text-brand-green-600">
                  Payment Plans Available
                </p>
                <p className="text-xs text-black">
                  $2,500 down + $500/month for 25 months
                </p>
              </div>
            </div>

            {/* Professional Package */}
            <div className="bg-slate-900 text-white rounded-xl p-8 relative border-4 border-yellow-400">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-brand-blue-900 px-6 py-2 rounded-full text-sm font-bold">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-4">Professional Package</h3>
              <div className="mb-6">
                <div className="text-4xl font-bold mb-2">$35,000</div>
                <p className="text-sm text-brand-blue-100">One-time franchise fee</p>
                <p className="text-sm text-brand-blue-100">+ 4% ongoing royalty</p>
              </div>

              <div className="mb-6">
                <p className="font-bold mb-3">What's Included:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">8 training programs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Complete curriculum & materials
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Use of DOL/DWD approvals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Custom branded website</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">LMS platform access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Marketing materials & templates
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      4-week training + certification
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Phone & email support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Quarterly business reviews</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/franchise/apply?package=professional"
                className="block w-full text-center px-6 py-3 bg-yellow-400 text-brand-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition"
              >
                Get Started
              </Link>

              <div className="mt-4 text-center">
                <p className="text-sm font-bold text-yellow-400">
                  Payment Plans Available
                </p>
                <p className="text-xs text-brand-blue-100">
                  $7,000 down + $1,000/month for 28 months
                </p>
              </div>
            </div>

            {/* Enterprise Package */}
            <div className="bg-white border-2 border-gray-300 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Enterprise Package</h3>
              <div className="mb-6">
                <div className="text-4xl font-bold text-brand-blue-600 mb-2">
                  $75,000
                </div>
                <p className="text-sm text-black">One-time franchise fee</p>
                <p className="text-sm text-black">+ 3% ongoing royalty</p>
              </div>

              <div className="mb-6">
                <p className="font-bold mb-3">What's Included:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">ALL 15+ training programs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Complete curriculum & materials
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Use of DOL/DWD approvals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Fully custom website & branding
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Full LMS platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Complete marketing system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">6-week intensive training</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">On-site launch support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Protected territory</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/franchise/apply?package=enterprise"
                className="block w-full text-center px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition"
              >
                Get Started
              </Link>

              <div className="mt-4 text-center">
                <p className="text-sm font-bold text-brand-blue-600">
                  Payment Plans Available
                </p>
                <p className="text-xs text-black">
                  $15,000 down + $2,000/month for 30 months
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">
              Flexible Financing Options
            </h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div>
                <p className="font-bold mb-2">💳 Stripe Payment Plans</p>
                <p className="text-sm text-black">
                  Break up payments over 12-36 months with low interest rates
                </p>
              </div>
              <div>
                <p className="font-bold mb-2">
                  Klarna/Afterpay/Zip
                  Financing
                </p>
                <p className="text-sm text-black">
                  Get approved instantly. Pay over time with fixed monthly
                  payments
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Potential */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Revenue Potential</h2>
            <p className="text-xl text-brand-green-100">
              Real numbers from successful franchisees
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Year 1</h3>
              <div className="text-4xl font-bold mb-4">$100k-$200k</div>
              <ul className="space-y-2 text-sm">
                <li>• 50-100 students</li>
                <li>• $2,000-$4,000 per student</li>
                <li>• Part-time operation</li>
                <li>• Home-based or small office</li>
              </ul>
            </div>

            <div className="bg-yellow-400 text-black rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Year 2-3</h3>
              <div className="text-4xl font-bold mb-4">$250k-$400k</div>
              <ul className="space-y-2 text-sm">
                <li>• 100-200 students</li>
                <li>• Multiple programs running</li>
                <li>• Full-time operation</li>
                <li>• 1-2 staff members</li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Year 4+</h3>
              <div className="text-4xl font-bold mb-4">$500k+</div>
              <ul className="space-y-2 text-sm">
                <li>• 200+ students annually</li>
                <li>• Multiple locations possible</li>
                <li>• Full staff team</li>
                <li>• Passive income potential</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your Own Training Center?
          </h2>
          <p className="text-xl text-black mb-8">
            Schedule a free consultation to learn more about franchise
            opportunities
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/franchise/apply"
              className="inline-block px-10 py-5 bg-brand-orange-600 text-white font-bold rounded-lg hover:bg-brand-orange-700 transition text-lg"
            >
              Request Franchise Information
            </Link>
            <a
              href="/support"
              className="inline-block px-10 py-5 bg-white border-2 border-brand-orange-600 text-brand-orange-600 font-bold rounded-lg hover:bg-brand-orange-50 transition text-lg"
            >
              Call support center
            </a>
          </div>
          <p className="mt-6 text-black">
            Email:{' '}
            <a
              href="/contact"
              className="text-brand-orange-600 font-bold underline"
            >
              our contact form
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
