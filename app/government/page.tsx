import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Building2, Users, FileText, Shield, Award, Briefcase, Phone, Mail, TrendingUp, Target, Handshake, BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/government',
  },
  title: 'Government & Agency Partners | Elevate For Humanity',
  description:
    'Partner with Elevate for Humanity to deliver workforce development programs. WIOA-compliant, ETPL-approved training provider serving government agencies and workforce boards.',
};

export default async function GovernmentPage() {
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
  
  // Fetch government partners
  const { data: partners } = await supabase
    .from('partners')
    .select('*')
    .eq('type', 'government');
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Government Programs' }]} />
        </div>
      </div>

      {/* Hero Section with Video Background */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <video autoPlay muted loop playsInline preload="none" className="absolute inset-0 w-full h-full object-cover pointer-events-none">
            <source src="https://cms-artifacts.artlist.io/content/generated-video-v1/video__2/generated-video-acfed647-8bb1-44ed-8505-876b1d573896.mp4?Expires=2083808563&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=BO~IkvikD0UAyMYmWQoBNskXM7I8fMAXUJW3T-zgJh1jg78q3LhNDpFOLhVcCpTBW1Rscp0c0YXEi-CQ29NDjSUKoclWTKq4q-bPLNxXgOpKLYxr5B5X3LzzDQQYnq5ilkgAvEZ~VzT3P8HEixv9WPRLFnAd5V3f~829SadfMPddUPxQZDZc29hrBn-Kxv-EKfugudcZ3depV1X-T1F5UxzvRMqFCXxjfT658RlSt0IupI0LxtywFYkChqJQmH6A~2JBncMUPerBqqt0Gdyp4ettIltCFvBX70ai6784jneJJrWcBJ0l7GyJPx1WBPAqjAdnCeJwyPC2Spp3~u93pQ__" type="video/mp4" />
          </video>
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Workforce Solutions for Government Agencies</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-6">
              Partner with an ETPL-approved, WIOA-compliant training provider to deliver high-quality workforce development programs that meet federal requirements and produce measurable outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-blue-600 rounded-lg font-bold hover:bg-gray-100 transition-colors">Schedule a Meeting</Link>
              <Link href="/workone-partner-packet" className="inline-flex items-center justify-center px-8 py-4 bg-brand-blue-700 text-white rounded-lg font-bold hover:bg-brand-blue-600 transition-colors border-2 border-white/30">View Partner Packet</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Our Credentials</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3"><span className="text-slate-400">•</span><span className="text-slate-700">ETPL Approved Provider</span></div>
              <div className="flex items-center gap-3"><span className="text-slate-400">•</span><span className="text-slate-700">WIOA Title I Compliant</span></div>
              <div className="flex items-center gap-3"><span className="text-slate-400">•</span><span className="text-slate-700">Registered Apprenticeship Sponsor</span></div>
              <div className="flex items-center gap-3"><span className="text-slate-400">•</span><span className="text-slate-700">WRG Eligible Programs</span></div>
              <div className="flex items-center gap-3"><span className="text-slate-400">•</span><span className="text-slate-700">DOL Oversight Compliant</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Serve with Images */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Government Agencies We Serve
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We partner with federal, state, and local agencies to deliver workforce 
              development programs that meet compliance requirements and achieve outcomes. 
              Our team understands the unique needs of government partners and provides 
              dedicated support for enrollment, reporting, and performance tracking.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-48">
                <Image
                  src="/images/heroes/workforce-partner-1.jpg"
                  alt="Workforce Development Boards"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-6 -mt-14 relative z-10 border-4 border-white">
                  <Building2 className="w-7 h-7 text-brand-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Workforce Development Boards</h3>
                <p className="text-gray-600 mb-4">
                  Local and regional workforce boards seeking ETPL-approved training providers 
                  for WIOA-funded participants. We handle enrollment, training delivery, and 
                  outcome reporting with full transparency and compliance.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    WIOA Title I Adult & Dislocated Worker
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Youth Programs (OSY & ISY)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Rapid Response Services
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-48">
                <Image
                  src="/images/heroes/workforce-partner-2.jpg"
                  alt="State Agencies"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 -mt-14 relative z-10 border-4 border-white">
                  <Users className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">State Agencies</h3>
                <p className="text-gray-600 mb-4">
                  State departments of labor, workforce development, and education seeking 
                  scalable training solutions that meet state and federal compliance requirements 
                  while delivering measurable employment outcomes.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Department of Workforce Development
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Department of Education
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Vocational Rehabilitation
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-48">
                <Image
                  src="/images/heroes/workforce-partner-3.jpg"
                  alt="Federal Programs"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-6 -mt-14 relative z-10 border-4 border-white">
                  <Shield className="w-7 h-7 text-brand-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Federal Programs</h3>
                <p className="text-gray-600 mb-4">
                  Federal agencies and grant recipients seeking compliant training providers 
                  for workforce development initiatives and special population programs 
                  including veterans, reentry, and underserved communities.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    DOL Apprenticeship Programs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Reentry Programs (JRI)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    Veterans Programs (GI Bill, VR&E)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer with Image */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Comprehensive Workforce Development Services
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                We provide end-to-end workforce development services that meet federal 
                compliance requirements while delivering measurable outcomes for participants 
                and funding agencies.
              </p>
              <p className="text-gray-600 mb-8">
                Our approach combines industry-recognized training with wraparound support 
                services to ensure participant success. We work closely with government 
                partners to customize programs that address specific workforce needs and 
                priority populations in your region.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src="/images/heroes/training-provider-1.jpg"
                      alt="ETPL Training"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">ETPL-Approved Training Programs</h3>
                    <p className="text-gray-600">
                      Industry-recognized certifications in healthcare, IT, skilled trades, 
                      and business. All programs meet WIOA performance requirements and lead 
                      to credentials valued by employers in high-demand occupations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src="/images/heroes/training-provider-2.jpg"
                      alt="Apprenticeships"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Registered Apprenticeships</h3>
                    <p className="text-gray-600">
                      DOL-registered apprenticeship programs with employer partners. 
                      Earn-and-learn model with structured OJT and related instruction 
                      that leads to journey-level credentials and sustainable careers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src="/images/efh/sections/staffing.jpg"
                      alt="Career Services"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Career Services & Job Placement</h3>
                    <p className="text-gray-600">
                      Comprehensive career services including resume building, interview prep, 
                      and direct job placement with employer partners. We maintain relationships 
                      with 100+ employers actively hiring our graduates.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src="/images/heroes/training-provider-4.jpg"
                      alt="Compliance"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Compliance & Reporting</h3>
                    <p className="text-gray-600">
                      Full compliance with WIOA, FERPA, ADA, and EEO requirements. 
                      Automated outcome tracking and reporting for funding agencies with 
                      real-time dashboards and quarterly performance reviews.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative h-64 rounded-2xl overflow-hidden">
                <Image
                  src="/images/funding/funding-dol-program.jpg"
                  alt="DOL Program"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="bg-gray-50 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Program Outcomes</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-700">Program Completion Rate</span>
                      <span className="font-bold text-brand-blue-600">87%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-brand-blue-600 h-3 rounded-full" style={{ width: '87%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-700">Credential Attainment</span>
                      <span className="font-bold text-green-600">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-green-600 h-3 rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-700">Employment Rate (Q2)</span>
                      <span className="font-bold text-brand-blue-600">78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-brand-blue-600 h-3 rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-700">Median Wage Increase</span>
                      <span className="font-bold text-orange-600">34%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-orange-600 h-3 rounded-full" style={{ width: '34%' }} />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-6">
                  *Based on program year 2024 data for WIOA-funded participants
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner With Us */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Partner With Elevate for Humanity
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We understand the unique challenges government agencies face in workforce 
              development. Our team brings deep expertise in federal compliance, outcome 
              tracking, and serving priority populations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-40">
                <Image
                  src="/images/programs-new/program-6.jpg"
                  alt="Proven Results"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto -mt-12 mb-3 border-4 border-white relative z-10">
                  <TrendingUp className="w-7 h-7 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Proven Results</h3>
                <p className="text-sm text-gray-600">
                  Consistent track record of exceeding WIOA performance measures across 
                  all primary indicators of performance.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-40">
                <Image
                  src="/images/programs-new/program-8.jpg"
                  alt="Priority Populations"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto -mt-12 mb-3 border-4 border-white relative z-10">
                  <Target className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Priority Populations</h3>
                <p className="text-sm text-gray-600">
                  Specialized experience serving veterans, justice-involved individuals, 
                  and other priority populations with wraparound support.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-40">
                <Image
                  src="/images/programs-new/program-10.jpg"
                  alt="Employer Partnerships"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto -mt-12 mb-3 border-4 border-white relative z-10">
                  <Handshake className="w-7 h-7 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Employer Network</h3>
                <p className="text-sm text-gray-600">
                  Strong relationships with 100+ employers actively hiring our graduates 
                  in healthcare, IT, and skilled trades.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-40">
                <Image
                  src="/images/programs-new/program-12.jpg"
                  alt="Transparent Reporting"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto -mt-12 mb-3 border-4 border-white relative z-10">
                  <BarChart3 className="w-7 h-7 text-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Transparent Reporting</h3>
                <p className="text-sm text-gray-600">
                  Real-time dashboards and automated reporting that meets all federal 
                  and state compliance requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funding Streams */}
      <section className="py-16 bg-brand-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Eligible Funding Streams
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our programs are approved for multiple federal and state funding sources, 
              giving your agency flexibility in how you fund participant training.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'WIOA Title I', desc: 'Adult, Dislocated Worker, Youth', icon: FileText },
              { name: 'WRG', desc: 'Workforce Ready Grant (Indiana)', icon: Award },
              { name: 'SNAP E&T', desc: 'Employment & Training', icon: Users },
              { name: 'TANF', desc: 'Temporary Assistance', icon: Shield },
              { name: 'TAA', desc: 'Trade Adjustment Assistance', icon: Briefcase },
              { name: 'Veterans', desc: 'GI Bill & VR&E', icon: Award },
              { name: 'Reentry', desc: 'Second Chance Programs', icon: Users },
              { name: 'Apprenticeship', desc: 'DOL Registered Programs', icon: Building2 },
            ].map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Partner?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Contact us to discuss how we can support your workforce development goals. 
            Our team is ready to customize solutions that meet your agency&apos;s specific 
            needs and compliance requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/support"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-blue-600 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              <Phone className="w-5 h-5 mr-2" />
              Get Help Online
            </a>
            <a
              href="mailto:info@elevateforhumanity.org"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-blue-700 text-white rounded-lg font-bold hover:bg-brand-blue-800 transition-colors border-2 border-white/30"
            >
              <Mail className="w-5 h-5 mr-2" />
              info@elevateforhumanity.org
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
