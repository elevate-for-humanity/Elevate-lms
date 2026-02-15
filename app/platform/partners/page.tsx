import Link from "next/link";
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Metadata } from 'next';
import Image from "next/image";
import { Building, Briefcase, Award } from 'lucide-react';
import PageAvatar from '@/components/PageAvatar';

export const metadata: Metadata = {
  title: 'Partners | Elevate Workforce OS',
  description: 'Training providers, employers, workforce boards, and community organizations operating on the Elevate Workforce OS.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/platform/partners' },
};

const governmentPartners = [
  {
    name: 'EmployIndy',
    description: 'Marion County workforce development board providing WIOA funding and career services.',
    type: 'Workforce Board',
  },
  {
    name: 'WorkOne Centers',
    description: 'Indiana\'s one-stop career centers providing employment services and training referrals.',
    type: 'Career Services',
  },
  {
    name: 'Indiana Department of Workforce Development (DWD)',
    description: 'State agency overseeing workforce programs, INTraining, and Workforce Ready Grant.',
    type: 'State Agency',
  },
  {
    name: 'Indiana Department of Education (DOE)',
    description: 'State education agency providing program recognition and oversight.',
    type: 'State Agency',
  },
  {
    name: 'Marion County Community Corrections',
    description: 'Partner for justice-involved individuals seeking career training and employment.',
    type: 'Corrections',
  },
  {
    name: 'Justice Reinvestment Initiative (JRI)',
    description: 'Funding partner for reentry and second-chance employment programs.',
    type: 'Funding Partner',
  },
];

const credentialPartners = [
  {
    name: 'Certiport',
    description: 'Authorized Testing Center for Microsoft Office Specialist, IC3 Digital Literacy, and Adobe certifications.',
    type: 'Certification Provider',
  },
  {
    name: 'Milady',
    description: 'Industry-standard curriculum and certification for cosmetology and beauty professionals.',
    type: 'Curriculum Partner',
  },
  {
    name: 'National Retail Federation (NRF)',
    description: 'Customer service and retail industry certifications.',
    type: 'Certification Provider',
  },
  {
    name: 'CareerSafe',
    description: 'OSHA safety training and certification programs.',
    type: 'Safety Training',
  },
  {
    name: 'Health & Safety Institute (HSI)',
    description: 'CPR, First Aid, and healthcare safety certifications.',
    type: 'Healthcare Training',
  },
];

const industryPartners = [
  {
    name: 'Healthcare Employers',
    description: 'Clinical training sites and hiring partners for CNA, Medical Assistant, and healthcare programs.',
    type: 'Employer Network',
  },
  {
    name: 'Skilled Trades Employers',
    description: 'Apprenticeship sponsors and hiring partners for HVAC, electrical, and construction trades.',
    type: 'Employer Network',
  },
  {
    name: 'Beauty & Cosmetology Salons',
    description: 'Apprenticeship sites and employment partners for barber and cosmetology graduates.',
    type: 'Employer Network',
  },
];

export default function PartnersPage() {
  return (
    <main className="w-full">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Platform', href: '/platform' }, { label: 'Partners' }]} />
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-2">
        <p className="text-sm text-slate-600 font-medium">Part of the <a href="/platform" className="text-brand-red-600 hover:underline">Elevate Workforce Operating System</a></p>
      </div>
<header className="relative min-h-[400px] flex items-center">
        <Image
          src="/images/team-vibrant.jpg"
          alt="Partner with Elevate for Humanity"
          fill
          className="object-cover"
          priority
        />
        
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 text-white">
          <h1 className="text-4xl md:text-5xl font-bold">Partner With Elevate for Humanity</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/90">
            Plug into workforce infrastructure that reduces hiring risk, improves training completion, and supports
            funding and reimbursement pathways.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-md bg-white px-6 py-3 text-black font-semibold hover:bg-gray-200">
              Partner Intake
            </Link>
            <Link href="/pathways" className="rounded-md border border-white px-6 py-3 font-semibold hover:bg-white hover:text-black">
              View Workforce Pathways
            </Link>
          </div>
        </div>
      </header>

      {/* Avatar Guide */}
      <PageAvatar 
        videoSrc="/videos/avatars/orientation-guide.mp4" 
        title="Partner With Us" 
      />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 grid gap-10 md:grid-cols-2">
          <div className="relative h-[340px] w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
            <Image
              src="/images/heroes/partner-hero.jpg"
              alt="Employer and workforce partners"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="text-gray-800">
            <h2 className="text-2xl md:text-3xl font-bold">Two partner tracks. One system.</h2>
            <p className="mt-4 text-gray-700">
              We support both employer partners and workforce/government partners with a single operating model:
              aligned pathways, auditable processes, and measurable outcomes.
            </p>

            <div className="mt-8 grid gap-4">
              <div className="rounded-md border border-gray-200 p-5">
                <div className="text-xl font-semibold">Employer Partners</div>
                <ul className="mt-3 list-disc pl-5 text-gray-700">
                  <li>Pre-aligned training pathways matched to your roles</li>
                  <li>Reduced time-to-hire with job-ready candidates</li>
                  <li>Support for reimbursement pathways (where applicable)</li>
                  <li>Structured onboarding and retention support</li>
                </ul>
                <div className="mt-5">
                  <Link href="/contact?type=employer" className="rounded-md bg-brand-blue-600 px-5 py-2.5 text-white font-semibold hover:bg-brand-blue-700">
                    Employer Intake
                  </Link>
                </div>
              </div>

              <div className="rounded-md border border-gray-200 p-5">
                <div className="text-xl font-semibold">Workforce & Government Partners</div>
                <ul className="mt-3 list-disc pl-5 text-gray-700">
                  <li>Compliant, auditable pathway operations</li>
                  <li>Scalable delivery model across regions and cohorts</li>
                  <li>Outcome tracking (enrollment → completion → placement)</li>
                  <li>Alignment with employer demand and credential standards</li>
                </ul>
                <div className="mt-5">
                  <Link href="/contact?type=agency" className="rounded-md border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-50">
                    Agency Intake
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl md:text-3xl font-bold text-center">What partners get</h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Benefit title="Structured Intake" text="Clear partner onboarding, expectations, and workflow alignment." />
            <Benefit title="Program Alignment" text="Pathways designed around real hiring demand and credential outcomes." />
            <Benefit title="Operational Visibility" text="Partners can see progress through the pipeline and reduce surprises." />
          </div>

          <div className="mt-12 text-center">
            <Link href="/contact" className="rounded-md bg-brand-blue-600 px-7 py-3 text-white font-semibold hover:bg-brand-blue-700">
              Start Partner Intake
            </Link>
          </div>
        </div>
      </section>

      {/* Government & Workforce Partners */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-brand-blue-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Government & Workforce Partners</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {governmentPartners.map((partner) => (
              <div key={partner.name} className="rounded-lg border-2 border-gray-200 bg-white p-6 hover:border-brand-blue-500 transition-colors">
                <span className="inline-block px-3 py-1 bg-brand-blue-100 text-brand-blue-700 text-xs font-semibold rounded-full mb-3">
                  {partner.type}
                </span>
                <h3 className="text-lg font-bold text-black mb-2">{partner.name}</h3>
                <p className="text-sm text-black">{partner.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credential & Certification Partners */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Credential & Certification Partners</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {credentialPartners.map((partner) => (
              <div key={partner.name} className="rounded-lg border-2 border-gray-200 bg-white p-6 hover:border-green-500 transition-colors">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full mb-3">
                  {partner.type}
                </span>
                <h3 className="text-lg font-bold text-black mb-2">{partner.name}</h3>
                <p className="text-sm text-black">{partner.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry & Employer Partners */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Industry & Employer Partners</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {industryPartners.map((partner) => (
              <div key={partner.name} className="rounded-lg border-2 border-gray-200 bg-white p-6 hover:border-orange-500 transition-colors">
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full mb-3">
                  {partner.type}
                </span>
                <h3 className="text-lg font-bold text-black mb-2">{partner.name}</h3>
                <p className="text-sm text-black">{partner.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Partnership Works */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How Partnership Works</h2>
          <p className="text-lg text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            A simple process to get started, whether you&apos;re an employer or workforce agency.
          </p>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-black text-white">1</span>
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Submit Inquiry</h3>
              <p className="text-slate-400 text-sm">
                Complete our partner intake form with your organization details and goals.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-black text-white">2</span>
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Discovery Call</h3>
              <p className="text-slate-400 text-sm">
                Meet with our team to discuss alignment, needs, and partnership structure.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-black text-white">3</span>
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Agreement</h3>
              <p className="text-slate-400 text-sm">
                Sign partnership agreement outlining roles, expectations, and outcomes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-black text-white">4</span>
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Launch</h3>
              <p className="text-slate-400 text-sm">
                Begin receiving candidates, referrals, or program support based on partnership type.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Outcomes */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Partner Outcomes</h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            What our partners achieve through collaboration.
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-black text-brand-blue-600 mb-2">50+</div>
              <p className="text-gray-600">Active employer partners</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-brand-blue-600 mb-2">85%</div>
              <p className="text-gray-600">Candidate retention at 90 days</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-brand-blue-600 mb-2">$0</div>
              <p className="text-gray-600">Recruiting fees for employers</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-brand-blue-600 mb-2">2 weeks</div>
              <p className="text-gray-600">Average time to first candidate</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Partner FAQ</h2>
          <p className="text-lg text-gray-600 text-center mb-12">
            Common questions about partnering with Elevate for Humanity.
          </p>
          
          <div className="space-y-4">
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <summary className="p-6 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                Is there a cost to become a partner?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-gray-600">
                No. Employer partnerships are free. We are funded by workforce development grants, not employer fees. 
                You receive pre-screened, trained candidates at no cost.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <summary className="p-6 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                What types of organizations can partner?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-gray-600">
                We partner with employers (any size), workforce development boards, government agencies, 
                community organizations, training providers, and educational institutions.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <summary className="p-6 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                What is expected of employer partners?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-gray-600">
                Employer partners commit to: interviewing referred candidates in good faith, providing feedback 
                on hires, and supporting new employee retention. No minimum hiring commitments required.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <summary className="p-6 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                How quickly can we start receiving candidates?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-gray-600">
                Most employer partners receive their first candidate referrals within 2 weeks of completing 
                the partnership agreement. Timing depends on current program cohorts and your hiring needs.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <summary className="p-6 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                What industries do you serve?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-gray-600">
                Healthcare, skilled trades (HVAC, electrical, welding), technology, transportation/CDL, 
                beauty/barbering, retail, and business services. We can discuss custom training pathways for other industries.
              </div>
            </details>
            
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <summary className="p-6 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                Do you work with justice-involved individuals?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 pb-6 text-gray-600">
                Yes. Many of our participants are justice-involved individuals seeking second-chance employment. 
                We provide additional support and can discuss your organization&apos;s hiring policies during onboarding.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Become a Partner CTA */}
      <section className="bg-brand-blue-700 text-white">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Partner?</h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            Join our network of employers, training providers, and workforce organizations 
            committed to creating pathways to sustainable careers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact?type=employer" 
              className="rounded-md bg-white px-8 py-4 text-brand-blue-700 font-bold hover:bg-gray-100"
            >
              Employer Partnership
            </Link>
            <Link 
              href="/contact?type=agency" 
              className="rounded-md border-2 border-white px-8 py-4 font-bold hover:bg-white hover:text-brand-blue-700"
            >
              Agency Partnership
            </Link>
          </div>
          <p className="mt-8 text-sm text-brand-blue-200">
            Questions? <Link href="/contact?topic=partnership" className="underline hover:text-white">Contact us</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function Benefit({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="text-xl font-semibold">{title}</div>
      <p className="mt-3 text-gray-700">{text}</p>
    </div>
  );
}
