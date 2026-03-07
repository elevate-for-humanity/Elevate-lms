import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Award, 
  Briefcase, 
  Heart,
  ArrowRight,
  Building2,
  GraduationCap,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/fundingimpact',
  },
  title: 'Funding Impact | How Federal Funding Transforms Lives | Elevate For Humanity',
  description:
    'See how WIOA, WRG, and other federal workforce funding programs transform lives and communities. Real outcomes, real stories, real impact.',
};

export default function FundingImpactPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Funding Impact' }]} />
        </div>
      </div>

      {/* Hero Section with Video Background */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <video autoPlay muted loop playsInline preload="none" className="absolute inset-0 w-full h-full object-cover pointer-events-none">
            <source src="https://cms-artifacts.artlist.io/content/generated-video-v1/video__2/generated-video-acfed647-8bb1-44ed-8505-876b1d573896.mp4?Expires=2083808563&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=BO~IkvikD0UAyMYmWQoBNskXM7I8fMAXUJW3T-zgJh1jg78q3LhNDpFOLhVcCpTBW1Rscp0c0YXEi-CQ29NDjSUKoclWTKq4q-bPLNxXgOpKLYxr5B5X3LzzDQQYnq5ilkgAvEZ~VzT3P8HEixv9WPRLFnAd5V3f~829SadfMPddUPxQZDZc29hrBn-Kxv-EKfugudcZ3depV1X-T1F5UxzvRMqFCXxjfT658RlSt0IupI0LxtywFYkChqJQmH6A~2JBncMUPerBqqt0Gdyp4ettIltCFvBX70ai6784jneJJrWcBJ0l7GyJPx1WBPAqjAdnCeJwyPC2Spp3~u93pQ__" type="video/mp4" />
          </video>
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">The Impact of Federal Workforce Funding</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-6">
              Every dollar invested in workforce development creates ripple effects across families, employers, and communities. See how WIOA, WRG, and other federal programs are transforming lives in Indiana.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/apply" className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 rounded-lg font-bold hover:bg-gray-100 transition-colors">Apply for Free Training</Link>
              <Link href="/wioa-eligibility" className="inline-flex items-center justify-center px-8 py-4 bg-indigo-700 text-white rounded-lg font-bold hover:bg-indigo-600 transition-colors border-2 border-white/30">Check Your Eligibility</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats with Images */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Impact by the Numbers
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Federal workforce funding has helped thousands of Hoosiers gain skills, 
              find good jobs, and achieve economic stability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-40 overflow-hidden">
                <Image
                  src="/images/pages/fundingimpact-page-1.jpg"
                  alt="Participants in training"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto -mt-12 mb-3 border-4 border-white relative z-10">
                  <Users className="w-7 h-7 text-indigo-600" />
                </div>
                <div className="text-4xl font-bold text-indigo-600 mb-2">2,500+</div>
                <div className="text-gray-700 font-medium">Participants Served</div>
                <div className="text-sm text-gray-500 mt-1">Since 2020</div>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-40 overflow-hidden">
                <Image
                  src="/images/pages/funding-impact-1.jpg"
                  alt="Credential attainment"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto -mt-12 mb-3 border-4 border-white relative z-10">
                  <Award className="w-7 h-7 text-brand-green-600" />
                </div>
                <div className="text-4xl font-bold text-brand-green-600 mb-2">92%</div>
                <div className="text-gray-700 font-medium">Credential Attainment</div>
                <div className="text-sm text-gray-500 mt-1">Industry certifications earned</div>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-40 overflow-hidden">
                <Image
                  src="/images/pages/funding-impact-2.jpg"
                  alt="Employment success"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto -mt-12 mb-3 border-4 border-white relative z-10">
                  <Briefcase className="w-7 h-7 text-brand-blue-600" />
                </div>
                <div className="text-4xl font-bold text-brand-blue-600 mb-2">78%</div>
                <div className="text-gray-700 font-medium">Employment Rate</div>
                <div className="text-sm text-gray-500 mt-1">Within 90 days of completion</div>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-40 overflow-hidden">
                <Image
                  src="/images/pages/fundingimpact-page-1.jpg"
                  alt="Wage increase"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-brand-orange-100 rounded-full flex items-center justify-center mx-auto -mt-12 mb-3 border-4 border-white relative z-10">
                  <DollarSign className="w-7 h-7 text-brand-orange-600" />
                </div>
                <div className="text-4xl font-bold text-brand-orange-600 mb-2">$18.50</div>
                <div className="text-gray-700 font-medium">Average Starting Wage</div>
                <div className="text-sm text-gray-500 mt-1">34% above minimum wage</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Funding Works with Image */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                How Federal Funding Works
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Federal workforce funding flows through state and local workforce boards 
                to approved training providers like Elevate for Humanity. This system 
                ensures accountability, quality, and measurable outcomes.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Federal Investment</h3>
                    <p className="text-gray-600">
                      Congress appropriates billions annually for workforce development through 
                      WIOA, which flows to states based on unemployment rates and population.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Local Delivery</h3>
                    <p className="text-gray-600">
                      Local workforce boards (like WorkOne) determine which training providers 
                      and programs best meet their region&apos;s employer and job seeker needs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-brand-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Quality Training</h3>
                    <p className="text-gray-600">
                      ETPL-approved providers like Elevate deliver training that leads to 
                      industry-recognized credentials and employment in high-demand occupations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-brand-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Measured Outcomes</h3>
                    <p className="text-gray-600">
                      Every program is measured on employment rates, wage gains, and credential 
                      attainment—ensuring taxpayer dollars produce real results.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative h-64 rounded-2xl overflow-hidden">
                <Image
                  src="/images/pages/funding-impact-3.jpg"
                  alt="WIOA funding process"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="bg-indigo-50 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Funding Sources We Accept</h3>
                <div className="space-y-4">
                  {[
                    { name: 'WIOA Title I', desc: 'Adult, Dislocated Worker, Youth programs', amount: 'Up to $10,000' },
                    { name: 'Workforce Ready Grant', desc: 'Indiana state funding for high-demand training', amount: 'Up to $5,500' },
                    { name: 'SNAP E&T', desc: 'Training for SNAP recipients', amount: 'Varies' },
                    { name: 'JRI Funding', desc: 'Justice Reinvestment Initiative', amount: 'Up to $8,000' },
                    { name: 'TAA', desc: 'Trade Adjustment Assistance', amount: 'Up to $10,000' },
                    { name: 'Veterans Benefits', desc: 'GI Bill and VR&E', amount: 'Full tuition' },
                  ].map((source, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-indigo-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-gray-900">{source.name}</div>
                          <div className="text-sm text-gray-600">{source.desc}</div>
                        </div>
                        <div className="text-indigo-600 font-semibold text-sm">{source.amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories with Photos */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real Stories, Real Impact
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Behind every statistic is a person whose life was transformed by workforce funding.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src="/images/pages/funding-impact-4.jpg"
                  alt="Graduate J. success story"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    MJ
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Graduate J.</div>
                    <div className="text-sm text-gray-500">WIOA Adult Program</div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  &quot;After being laid off from manufacturing, I didn&apos;t know what to do. WIOA funding 
                  covered my IT certification training, and now I&apos;m a network technician making 
                  $22/hour with benefits.&quot;
                </p>
                <div className="flex items-center gap-2 text-brand-green-600 font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <span>$14/hr → $22/hr</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src="/images/pages/funding-impact-5.jpg"
                  alt="Sarah T. success story"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    ST
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Sarah T.</div>
                    <div className="text-sm text-gray-500">WRG Program</div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  &quot;As a single mom, I couldn&apos;t afford training. The Workforce Ready Grant paid for 
                  my medical assistant certification. I went from retail to healthcare in 12 weeks.&quot;
                </p>
                <div className="flex items-center gap-2 text-brand-green-600 font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <span>$11/hr → $17/hr</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src="/images/pages/fundingimpact-page-1.jpg"
                  alt="David W. success story"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-brand-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                    DW
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">David W.</div>
                    <div className="text-sm text-gray-500">JRI Funding</div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  &quot;Coming out of incarceration, I thought no one would give me a chance. JRI funding 
                  got me into the barber apprenticeship. Now I have my license and my own chair.&quot;
                </p>
                <div className="flex items-center gap-2 text-brand-green-600 font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <span>$0/hr → $25/hr</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/testimonials"
              className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:underline"
            >
              Read More Success Stories
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Community Impact with Images */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Impact Beyond the Individual
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              When one person gains skills and employment, the benefits extend to families, 
              employers, and entire communities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-indigo-50 rounded-xl overflow-hidden border border-indigo-200">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src="/images/pages/fundingimpact-page-1.jpg"
                  alt="Family stability"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center mb-6 -mt-14 relative z-10 border-4 border-indigo-50">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Family Stability</h3>
                <p className="text-gray-600 mb-4">
                  Higher wages mean families can afford housing, healthcare, and education. 
                  Children of employed parents have better outcomes in school and life.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Reduced reliance on public assistance
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Improved child outcomes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Generational wealth building
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-brand-blue-50 rounded-xl overflow-hidden border border-brand-blue-200">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src="/images/pages/fundingimpact-page-1.jpg"
                  alt="Employer benefits"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <div className="w-14 h-14 bg-brand-blue-600 rounded-xl flex items-center justify-center mb-6 -mt-14 relative z-10 border-4 border-brand-blue-50">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Employer Benefits</h3>
                <p className="text-gray-600 mb-4">
                  Employers gain access to trained, credentialed workers ready to contribute 
                  from day one. Reduced turnover and training costs improve bottom lines.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Pre-screened, trained candidates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Reduced hiring costs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Lower turnover rates
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-brand-green-50 rounded-xl overflow-hidden border border-brand-green-200">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src="/images/pages/fundingimpact-page-1.jpg"
                  alt="Economic growth"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <div className="w-14 h-14 bg-brand-green-600 rounded-xl flex items-center justify-center mb-6 -mt-14 relative z-10 border-4 border-brand-green-50">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Economic Growth</h3>
                <p className="text-gray-600 mb-4">
                  Every dollar invested in workforce development generates $7 in economic 
                  activity through increased spending, tax revenue, and reduced social costs.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Increased tax revenue
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Local spending boost
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Reduced social service costs
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Be Part of the Impact
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Federal funding is available now for eligible Hoosiers. Check your eligibility 
            and start your career transformation today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/wioa-eligibility"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              Check Eligibility
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center justify-center px-8 py-4 bg-indigo-700 text-white rounded-lg font-bold hover:bg-indigo-800 transition-colors border-2 border-white/30"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
