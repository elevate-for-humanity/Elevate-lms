export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import RequestMeeting from '@/components/RequestMeeting';

import { createClient } from '@/lib/supabase/server';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Sanitation & Infection Control Training | Elevate',
  description: 'Sanitation and infection control certification in Indianapolis. OSHA compliant. For healthcare, cosmetology, food service, and licensed professionals.',
  alternates: { canonical: `${SITE_URL}/programs/sanitation-infection-control` },
  openGraph: {
    title: 'Sanitation & Infection Control Training',
    description: 'OSHA-compliant sanitation and infection control certification for healthcare, cosmetology, and food service.',
    url: `${SITE_URL}/programs/sanitation-infection-control`,
    images: [{ url: `${SITE_URL}/images/healthcare/emergency-safety.jpg`, width: 1200, height: 630 }],
  },
};

export default async function SanitationInfectionControlPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('programs').select('*').limit(50);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Healthcare', href: '/programs/healthcare' }, { label: 'Sanitation & Infection Control' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/healthcare/emergency-safety.jpg" alt="Sanitation & Infection Control Training" fill sizes="100vw" className="object-cover" priority />
      </section>

      {/* Stats */}
      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '1–2 Weeks', label: 'Program Length' },
            { val: 'OSHA', label: 'Compliant' },
            { val: 'Required', label: 'For Licensure' },
            { val: 'Multi-Industry', label: 'Application' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-lg sm:text-xl font-bold text-white">{s.val}</div>
              <div className="text-slate-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">About This Program</h2>
          <p className="text-slate-700 text-base leading-relaxed mb-4">
            This is a 1–2 week certification course that teaches you how to prevent the spread of infection in professional settings. You learn OSHA-compliant protocols for hand hygiene, surface disinfection, sterilization, PPE use, sharps handling, and biohazard waste disposal.
          </p>
          <p className="text-slate-700 text-base leading-relaxed mb-4">
            Indiana requires sanitation and infection control training for many licensed professions — including barbers, cosmetologists, nail technicians, estheticians, tattoo artists, dental assistants, and healthcare workers. If you work in any field where you touch clients or handle potentially contaminated materials, you likely need this certification.
          </p>
          <p className="text-slate-700 text-base leading-relaxed">
            The course includes both classroom instruction and hands-on practice. You receive your certification upon completion, which satisfies state licensing requirements.
          </p>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">What You&apos;ll Learn</h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {[
              'Bloodborne pathogen safety (BBP)',
              'Proper hand hygiene techniques',
              'Personal protective equipment (PPE) usage',
              'Surface disinfection and sterilization methods',
              'Sharps handling and disposal',
              'Biohazard waste management',
              'OSHA standards and regulatory compliance',
              'Infection prevention in healthcare settings',
              'Infection prevention in cosmetology settings',
              'Documentation and incident reporting',
              'Cross-contamination prevention',
              'Emergency exposure response protocols',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-brand-blue-600 rounded-full flex-shrink-0" />
                <span className="text-slate-700 text-base">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Needs This */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-4">Who Needs This Training?</h2>
          <p className="text-slate-600 text-base text-center mb-6 max-w-2xl mx-auto">
            Indiana requires sanitation and infection control training for many licensed professions. If you work in any of these fields, you likely need this certification.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Healthcare Workers', 'Barbers & Cosmetologists', 'Nail Technicians', 'Estheticians', 'Food Service Staff', 'Tattoo Artists', 'Dental Assistants', 'Childcare Providers'].map((e) => (
              <div key={e} className="bg-slate-50 rounded-lg px-4 py-3 text-slate-700 font-medium text-base text-center border border-slate-200">{e}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Why Sanitation & Infection Control Matters</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'State Licensing Requirement', desc: 'Indiana requires this certification for barbers, cosmetologists, nail techs, and other licensed professionals. You cannot get your license without it.' },
              { title: 'OSHA Compliance', desc: 'Employers in healthcare, food service, and personal care are required to have OSHA-compliant infection control protocols. This training meets that requirement.' },
              { title: 'Client and Patient Safety', desc: 'Proper sanitation prevents the spread of infections, bloodborne pathogens, and communicable diseases in your workplace.' },
              { title: 'Career Advancement', desc: 'This certification makes you more employable and demonstrates professionalism to employers and clients.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-5 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-base mb-1">{item.title}</h3>
                <p className="text-slate-600 text-base">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Requirements</h2>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <div className="space-y-3">
              {[
                { req: 'Age', detail: 'At least 16 years old' },
                { req: 'Education', detail: 'No degree required' },
                { req: 'Experience', detail: 'No prior experience needed — the course teaches everything from scratch' },
                { req: 'Language', detail: 'Classes taught in English. Basic English comprehension required.' },
                { req: 'Attendance', detail: 'Must attend all sessions to receive certification' },
              ].map((r) => (
                <div key={r.req} className="flex items-start gap-3">
                  <span className="font-bold text-slate-900 text-base w-28 flex-shrink-0">{r.req}</span>
                  <span className="text-slate-700 text-base">{r.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How to Enroll */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How to Enroll</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Register Online', desc: 'Submit your registration. No application fee. Select your preferred start date.' },
              { step: '2', title: 'Check Funding (Optional)', desc: 'Some workforce programs may cover this training. Contact us or check with your employer.' },
              { step: '3', title: 'Attend Training', desc: '1–2 weeks of in-person instruction with hands-on practice. All materials provided.' },
              { step: '4', title: 'Get Certified', desc: 'Complete the course and receive your sanitation and infection control certificate.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-white rounded-lg p-4">
                <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{s.title}</h3>
                  <p className="text-slate-600 text-base">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How long is the program?', a: '1–2 weeks depending on the schedule. Classes meet in person at our Indianapolis training center.' },
              { q: 'Is this the same as bloodborne pathogens training?', a: 'Bloodborne pathogens (BBP) is one component of this course. This program covers BBP plus surface disinfection, sterilization, PPE, sharps handling, and more.' },
              { q: 'Do I need this for my barber or cosmetology license?', a: 'Yes. Indiana requires sanitation and infection control training for barber, cosmetology, nail technician, and esthetician licenses.' },
              { q: 'How much does it cost?', a: 'Contact us for current pricing. Some workforce programs and employers may cover the cost.' },
              { q: 'Do I need any experience?', a: 'No. The course is designed for beginners and teaches everything from scratch.' },
              { q: 'Is this certification accepted statewide?', a: 'Yes. This certification meets Indiana state requirements for licensed professions that require sanitation and infection control training.' },
              { q: 'Can my employer send a group?', a: 'Yes. We offer group training and can accommodate teams. Contact us for group scheduling and pricing.' },
            ].map((faq) => (
              <div key={faq.q} className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 text-base mb-2">{faq.q}</h3>
                <p className="text-slate-600 text-base">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meeting */}
      <section className="py-8 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <RequestMeeting context="Have questions about whether you need this certification for your license? Schedule a free meeting with our team." />
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-14 bg-brand-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Get Certified in Sanitation &amp; Infection Control</h2>
          <p className="text-white/90 mb-6 text-base">Required for many licensed professions in Indiana. Register today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=sanitation-infection-control" className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors text-center">
              Register Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <Link href="/funding" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              Explore Funding Options
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
