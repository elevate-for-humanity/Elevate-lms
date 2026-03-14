import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Phone, ArrowRight, Handshake } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workforce Partners | WorkOne & Community Organizations | Elevate For Humanity',
  description: 'Partner with Elevate for Humanity to connect job seekers with free career training. WorkOne centers, community organizations, and workforce boards - learn how we work together.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/workforce-partners' },
};



export default function WorkforcePartnersPage() {

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Workforce Partners' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <Image src="/images/pages/workforce-partners-page-1.jpg" alt="Workforce development partners" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Handshake className="w-4 h-4" /> Partner Network
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Workforce Partners
            </h1>
            <p className="text-xl text-white/90 max-w-xl mb-6">
              We work with WorkOne centers, workforce boards, and community organizations to connect Hoosiers with free career training.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all hover:scale-105">
                Become a Partner <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/workone-partner-packet" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full font-bold transition-all border border-white/40">
                Partner Resources
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How We Work Together */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center mb-4">How We Work Together</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Elevate for Humanity is an approved training provider on Indiana's Eligible Training Provider List (ETPL). Here's how we partner with workforce organizations.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Participant Referrals', desc: 'WorkOne career advisors refer WIOA-eligible participants directly to our programs using Individual Training Accounts (ITAs).', image: '/images/pages/workforce-board-page-1.jpg' },
              { title: 'OJT Contracts', desc: 'We coordinate On-the-Job Training contracts with WorkOne Indianapolis for employer wage reimbursement during training.', image: '/images/pages/workforce-board-page-3.jpg' },
              { title: 'Progress Reporting', desc: 'We submit attendance, credential attainment, and job placement data back to your office on your schedule.', image: '/images/pages/workforce-board-page-5.jpg' },
              { title: 'Co-Enrollment', desc: 'Students can be co-enrolled in WIOA and other programs simultaneously. We coordinate with case managers to avoid duplication.', image: '/images/pages/workforce-board-page-7.jpg' },
            ].map((service) => (
              <div key={service.title} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
                <div className="relative h-36 overflow-hidden">
                  <Image src={service.image} alt={service.title} fill sizes="25vw" className="object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 mb-2">{service.title}</h3>
                  <p className="text-slate-600 text-sm">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center mb-4">Who We Partner With</h2>
          <p className="text-center text-slate-600 mb-12">Organizations we work with to serve Indiana job seekers</p>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { type: 'Workforce Board', name: 'WorkOne Indianapolis (Region 5)', desc: 'Our primary workforce board partner. We accept WIOA Adult, Dislocated Worker, and Youth referrals. ITA-funded enrollment processed through INTraining (Location ID: 10004621).', image: '/images/pages/workforce-partners-page-1.jpg' },
              { type: 'State Agency', name: 'Indiana DWD / ETPL', desc: 'Listed on the Indiana Eligible Training Provider List. Programs approved for WIOA funding statewide. Annual performance data submitted to DWD.', image: '/images/pages/workforce-board-page-2.jpg' },
              { type: 'Reentry', name: 'JRI & Community Corrections', desc: 'JRI-approved provider. We accept referrals from probation officers, community corrections, and reentry coordinators. Progress reports sent on your schedule.', image: '/images/pages/workforce-board-page-4.jpg' },
              { type: 'Housing', name: 'Housing Authorities & FSS Programs', desc: 'We accept FSS and Section 3 resident referrals from IHA and other Indiana housing authorities for career training and credential programs.', image: '/images/pages/workforce-board-page-6.jpg' },
            ].map((partner) => (
              <div key={partner.name} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex">
                <div className="relative w-36 flex-shrink-0">
                  <Image src={partner.image} alt={partner.name} fill sizes="144px" className="object-cover" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-brand-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold">{partner.type}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 mb-1">{partner.name}</h3>
                  <p className="text-slate-600 text-sm">{partner.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For WorkOne Staff */}
      <section className="py-16 bg-brand-blue-600">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl font-black mb-6">For WorkOne Staff</h2>
              <p className="text-brand-blue-100 mb-6">
                Career advisors and case managers: We coordinate directly with WorkOne Indianapolis (Region 5) for participant referrals, OJT contracts, work experience authorizations, and outcome reporting.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Program fact sheets and eligibility requirements',
                  'ITA request forms and processing guides',
                  'Direct contact for student referrals',
                  'Real-time enrollment and progress updates',
                  'Weekly progress reports for active participants',
                  'Credential attainment reported within 5 business days',
                  'OJT training plans and internship agreements available',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/workone-partner-packet" className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-all">
                Access Partner Packet <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl">
              <Image src="/images/pages/workforce-partners-page-1.jpg" alt="WorkOne career advisor" fill sizes="100vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ETPL Information */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-slate-50 rounded-2xl p-8 md:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-4">ETPL Approved Provider</h2>
                <p className="text-slate-600 mb-4">
                  Elevate for Humanity is listed on Indiana's Eligible Training Provider List (ETPL), which means our programs are approved for WIOA funding.
                </p>
                <p className="text-slate-600 mb-6">
                  Job seekers can use Individual Training Accounts (ITAs) to enroll in our programs at no cost to them.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/programs" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition-colors">
                    View Approved Programs
                  </Link>
                  <a href="https://www.in.gov/dwd/career-training-adult-ed/intraining/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition-colors">
                    View ETPL List
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Programs', value: '15+' },
                  { label: 'Credentials', value: '25+' },
                  { label: 'Completion Rate', value: '89%' },
                  { label: 'Job Placement', value: '85%' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 text-center shadow-sm">
                    <div className="text-3xl font-black text-brand-blue-600 mb-1">{stat.value}</div>
                    <div className="text-slate-600 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-4">Partner With Us</h2>
          <p className="text-xl text-slate-300 mb-8">
            Let's work together to connect more Hoosiers with career training and employment.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-full font-bold transition-all hover:scale-105">
              Contact Us <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="/support" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold transition-all border border-white/30">
              <Phone className="w-5 h-5" /> (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
