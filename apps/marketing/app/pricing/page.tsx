export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight, DollarSign, Building2, Users, GraduationCap, Zap, Shield, BookOpen, Calendar, Play } from 'lucide-react';
import { createPublicClient } from '@/lib/supabase/public';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Workforce development pricing for individuals, businesses, and government agencies. Training tuition, platform licenses, and agency contracts.',
  keywords: ['workforce training pricing', 'LMS pricing', 'apprenticeship platform cost', 'WIOA training'],
};

async function getPricingData() {
  try {
    const supabase = createPublicClient();
    
    const [programsRes, licenseTiersRes, storeProductsRes] = await Promise.all([
      supabase
        .from('programs')
        .select('id, name, slug, price, duration_weeks, program_type, status')
        .eq('status', 'active')
        .not('price', 'is', null)
        .gt('price', 0)
        .order('name'),
      supabase
        .from('curriculum_licenses')
        .select('*')
        .eq('status', 'active')
        .order('annual_maintenance'),
      supabase
        .from('store_products')
        .select('id, name, course_id, grants_course_access')
        .eq('status', 'active')
        .eq('grants_course_access', true)
        .limit(50)
    ]);
    
    return {
      programs: programsRes.data || [],
      licenseTiers: licenseTiersRes.data || [],
      storeProducts: storeProductsRes.data || []
    };
  } catch (error) {
    console.error('Error fetching pricing data:', error);
    return { programs: [], licenseTiers: [], storeProducts: [] };
  }
}

function formatDuration(weeks?: number | null): string {
  if (!weeks) return 'Flexible schedule';
  if (weeks <= 4) return `${weeks} weeks`;
  const months = Math.round(weeks / 4);
  return months === 1 ? '1 month' : `${months} months`;
}

export default async function PricingPage() {
  const { programs, licenseTiers, storeProducts } = await getPricingData();
  const featuredPrograms = programs.slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Pricing Type Selector */}
      <section className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <span className="font-semibold text-slate-900">Pricing for:</span>
            <Link href="/tuition" className="text-green-600 hover:underline font-medium">
              Training Tuition
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/platform/pricing" className="text-green-600 hover:underline font-medium">
              Platform Software
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/for-agencies" className="text-green-600 hover:underline font-medium">
              Agency Contracts
            </Link>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 to-green-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Career Training Investment</h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto mb-8">
            Affordable programs with funding options for eligible participants. Self-pay and employer sponsorship also available.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/check-eligibility" className="bg-white text-green-700 font-bold py-3 px-6 rounded-lg hover:bg-green-50 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Check Eligibility
            </Link>
            <Link href="/roi" className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-500 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              See ROI Calculator
            </Link>
          </div>
        </div>
      </section>

      {/* Program Tuition */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Program Tuition</h2>
            <p className="text-lg text-slate-600">Prices shown before funding. Most students pay $0 out of pocket.</p>
            {programs.length > 0 ? (
              <p className="text-sm text-green-600 mt-2">{programs.length} programs with published pricing</p>
            ) : (
              <p className="text-sm text-slate-500 mt-2">
                <Link href="/programs" className="text-green-600 hover:underline font-medium">
                  Browse all programs →
                </Link>
                {' '}or{' '}
                <Link href="/contact" className="text-green-600 hover:underline font-medium">
                  contact admissions
                </Link>
                {' '}for current pricing.
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {featuredPrograms.map((program: any) => (
              <div key={program.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:border-green-500 transition-all hover:shadow-md">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900">{program.name}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDuration(program.duration_weeks)}
                    </p>
                  </div>
                  <GraduationCap className="w-6 h-6 text-green-600" />
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-900">${(program.price || 0).toLocaleString()}</span>
                  <span className="text-slate-500 ml-2">full tuition</span>
                </div>
                <div className="text-sm text-slate-600 mb-4 space-y-1">
                  <p className="flex items-center gap-1"><Check className="w-3 h-3 text-green-600" /> Funding options may be available</p>
                  <p className="flex items-center gap-1"><Check className="w-3 h-3 text-green-600" /> Payment plan from $50/week</p>
                  <p className="flex items-center gap-1"><Check className="w-3 h-3 text-green-600" /> Employer sponsorship</p>
                </div>
                <Link href={`/programs/${program.slug}`} className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:underline">
                  View program <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mb-8">
            <Link href="/programs" className="inline-flex items-center gap-2 text-green-600 font-semibold hover:underline">
              View all programs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-green-50 rounded-xl p-6 text-center">
            <p className="text-green-800 font-medium">
              💡 <strong>Workforce Agency Partners:</strong> Contact us for group pricing and workforce development contracts.
            </p>
            <Link href="/for-agencies" className="text-green-700 font-semibold hover:underline ml-2">
              Agency pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* Platform License Plans */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Platform License Plans</h2>
            <p className="text-lg text-slate-600">Build your own training platform with our license tiers</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {licenseTiers.map((tier: any, index: number) => (
              <div key={tier.id} className={`rounded-xl p-6 border-2 ${index === 2 ? 'border-green-600 bg-green-50' : 'border-slate-200 bg-white'}`}>
                {index === 2 && (
                  <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block">MOST POPULAR</span>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-1">{tier.license_type}</h3>
                <p className="text-sm text-slate-500 mb-4">Min {tier.minimum_students || 1} students</p>
                
                <div className="mb-4">
                  {tier.annual_maintenance > 0 ? (
                    <>
                      <span className="text-3xl font-bold text-slate-900">${(tier.annual_maintenance || 0).toLocaleString()}</span>
                      <span className="text-slate-500">/year</span>
                      <p className="text-sm text-slate-500">${tier.price_per_student || 0}/student</p>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-green-600">Custom</span>
                  )}
                </div>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-slate-700">{tier.student_seats || 0} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-green-600" />
                    <span className="text-slate-700">{tier.instructor_accounts || 0} instructors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-slate-700">{tier.admin_accounts || 0} admins</span>
                  </div>
                  {tier.api_access && (
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-600" />
                      <span className="text-slate-700">API Access</span>
                    </div>
                  )}
                  {tier.custom_branding && (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-slate-700">Custom Branding</span>
                    </div>
                  )}
                </div>

                <Link
                  href={tier.annual_maintenance === 0 ? '/contact' : `/store/plans?license=${encodeURIComponent(tier.license_type)}`}
                  className={`block text-center py-3 px-4 rounded-lg font-semibold ${index === 2 ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                >
                  {tier.annual_maintenance === 0 ? 'Contact Sales' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SaaS Products */}
      {storeProducts.length > 0 && (
        <section className="py-16 bg-slate-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Software & Tools</h2>
              <p className="text-lg text-slate-600">Powerful tools to enhance your workforce platform</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {storeProducts.slice(0, 9).map((product: any) => (
                <div key={product.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-500 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Play className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{product.name}</h3>
                  <p className="text-sm text-slate-600 mb-4">Professional tool for workforce management</p>
                  <div className="flex gap-4">
                    <Link href={`/store/product/${product.id}`} className="text-blue-600 font-semibold text-sm flex items-center gap-1 hover:underline">
                      Learn more <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button className="text-slate-600 font-semibold text-sm flex items-center gap-1 hover:text-slate-900">
                      <Play className="w-4 h-4" /> Demo
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/store" className="inline-flex items-center gap-2 text-green-600 font-semibold hover:underline">
                View all products <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Funding Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">For Individuals</h2>
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Workforce Funding</h3>
                  <p className="text-slate-300 text-sm">WIOA, Indiana Workforce Ready Grant, and other programs may help cover tuition for eligible participants in approved programs. Contact admissions or your local WorkOne office to confirm options.</p>
                  <Link href="/check-eligibility" className="text-green-400 font-semibold text-sm hover:underline mt-2 inline-block">Check eligibility</Link>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Payment Plans</h3>
                  <p className="text-slate-300 text-sm">Weekly payments from $50/week. No credit check.</p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">For Organizations</h2>
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Government Contracts</h3>
                  <p className="text-slate-300 text-sm">Workforce boards, Voc Rehab, and government agencies. Volume pricing available.</p>
                  <Link href="/for-agencies" className="text-green-400 font-semibold text-sm hover:underline mt-2 inline-block">Agency pricing</Link>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Employer Partnerships</h3>
                  <p className="text-slate-300 text-sm">Custom apprenticeship programs. Tax credits for hiring apprentices.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-xl text-green-100 mb-8">Check your funding eligibility or schedule a demo.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/check-eligibility" className="bg-white text-green-700 font-bold py-3 px-6 rounded-lg hover:bg-green-50">
              Check My Eligibility
            </Link>
            <Link href="/demos" className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-500">
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
