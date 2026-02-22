import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Building2, Users, Briefcase, FileCheck, Phone, ArrowRight, ExternalLink, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workforce Partnerships | Elevate for Humanity',
  description: 'Partner with Elevate for Humanity for workforce training, apprenticeships, and career placement. For housing authorities, workforce boards, case managers, and employers.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partnerships',
  },
};

export default function PartnershipsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partnerships' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px]">
        <Image src="/images/heroes-hq/employer-hero.jpg" alt="Workforce partnership meeting" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
              Workforce Partnerships
            </h1>
            <p className="text-lg text-slate-200 max-w-2xl">
              ETPL-listed training provider serving Marion County and Central Indiana.
              Refer WIOA, WRG, and JRI participants directly. We handle enrollment, training, credentialing, and placement reporting.
            </p>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Who We Work With</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Building2, title: 'Housing Authorities', desc: 'FSS and Section 3 resident referrals. We accept IHA and other Indiana housing authority participants for career training and credential programs.' },
              { icon: Users, title: 'WorkOne & Workforce Boards', desc: 'We are listed on INTraining under 2Exclusive LLC-S. Send WIOA Adult, Dislocated Worker, or Youth referrals. We submit attendance and completion data back to your office.' },
              { icon: Shield, title: 'Case Managers & Reentry', desc: 'JRI-approved provider. We accept referrals from probation, community corrections, and reentry coordinators. Progress reports sent on your schedule.' },
              { icon: Briefcase, title: 'Employers & OJT Hosts', desc: 'Host apprentices and OJT participants at your site. We provide trained candidates in HVAC, electrical, plumbing, barbering, healthcare, and CDL.' },
            ].map((item) => (
              <div key={item.title} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <item.icon className="w-8 h-8 text-brand-blue-600 mb-3" />
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works for Partners */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">How Referrals Work</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Send a Referral', desc: 'Email info@elevateforhumanity.org or call (317) 314-3757 with participant name, contact info, funding source (WIOA/WRG/JRI/self-pay), and program interest.' },
              { step: '2', title: 'Intake & Enrollment', desc: 'We contact the participant within 48 hours, verify eligibility, complete enrollment paperwork, and coordinate IEP documentation with your office if needed.' },
              { step: '3', title: 'Training & Tracking', desc: 'Related Technical Instruction delivered online via our LMS. On-the-Job Training at employer partner sites. We log attendance, competency assessments, and OJT hours.' },
              { step: '4', title: 'Completion & Reporting', desc: 'We issue credentials, submit completion data to your agency, and provide job placement support including resume prep and employer matching.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Credentials */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Our Credentials</h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              { label: 'ETPL Provider', value: '2Exclusive LLC-S — listed on Indiana INTraining system' },
              { label: 'DOL Registered Apprenticeship', value: 'Barber and Building Technician programs registered with USDOL/RAPIDS' },
              { label: 'WIOA Eligible', value: 'Programs approved for Adult, Dislocated Worker, and Youth funding' },
              { label: 'JRI Approved', value: 'Approved provider for Justice Reinvestment Initiative participants' },
              { label: 'Workforce Ready Grant', value: 'High-demand certification programs qualify for WRG through Next Level Jobs' },
              { label: 'Certificate Verification', value: 'All completions verifiable at elevateforhumanity.org/cert/verify' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 bg-slate-50 rounded-lg p-4 border border-slate-200">
                <FileCheck className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 text-sm">{item.label}</p>
                  <p className="text-xs text-slate-600">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <a href="https://intraining.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brand-blue-600 hover:underline">
              <ExternalLink className="w-3.5 h-3.5" />
              Verify on INTraining (search &quot;2Exclusive&quot;)
            </a>
          </div>
        </div>
      </section>

      {/* Programs Available */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Programs Available for Referral</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'HVAC Technician', duration: '20 weeks', funding: 'WIOA, WRG' },
              { name: 'Barber Apprenticeship', duration: '15 months', funding: 'WIOA' },
              { name: 'CNA Certification', duration: '6 weeks', funding: 'WIOA, WRG' },
              { name: 'CDL Training (Class A)', duration: '4 weeks', funding: 'WIOA, WRG' },
              { name: 'Electrical Technician', duration: '16–24 weeks', funding: 'WIOA, WRG' },
              { name: 'Plumbing Technician', duration: '16 weeks', funding: 'WIOA, WRG' },
              { name: 'Medical Assistant', duration: '21 days', funding: 'WIOA' },
              { name: 'Phlebotomy Technician', duration: '8 weeks', funding: 'WIOA, WRG' },
              { name: 'Web Development', duration: '16 weeks', funding: 'WIOA, WRG' },
            ].map((p) => (
              <div key={p.name} className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                  <span>{p.duration}</span>
                  <span className="text-slate-300">|</span>
                  <div className="flex gap-1">
                    {p.funding.split(', ').map((f) => (
                      <span key={f} className="bg-brand-green-100 text-brand-green-800 px-1.5 py-0.5 rounded text-[10px] font-bold">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/programs" className="text-sm text-brand-blue-600 hover:underline font-medium">
              View full program catalog →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Set Up a Referral Pathway</h2>
          <p className="text-brand-blue-100 mb-6 max-w-xl mx-auto">
            Request our provider packet, schedule a site visit at our Indianapolis training center, or send your first participant referral.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?subject=Partnership%20Inquiry"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Contact Us <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="tel:317-314-3757"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
