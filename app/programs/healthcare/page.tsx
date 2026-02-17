import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import PageAvatar from '@/components/PageAvatar';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Healthcare Training Programs | CNA, Medical Assistant, Phlebotomy | Elevate',
  description: 'Healthcare career training in Indianapolis. CNA, Medical Assistant, Phlebotomy, and more. Funding available for qualifying students. Get certified in weeks.',
  alternates: { canonical: `${SITE_URL}/programs/healthcare` },
  openGraph: {
    title: 'Healthcare Training Programs | Indianapolis',
    description: 'CNA, Medical Assistant, Phlebotomy — get certified and start your healthcare career.',
    url: `${SITE_URL}/programs/healthcare`,
    images: [{ url: `${SITE_URL}/images/hero/hero-healthcare.jpg`, width: 1200, height: 630 }],
  },
};

export default function HealthcareProgramsPage() {
  return (
    <div className="min-h-screen bg-white">
      <ProgramHeroBanner videoSrc="/videos/healthcare-cna.mp4" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Healthcare' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/hero/hero-healthcare.jpg" alt="Healthcare Training Programs" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Funding Available</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Healthcare Programs</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              CNA, Medical Assistant, Phlebotomy, and more. Get certified and working in healthcare in weeks.
            </p>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}
      <section className="py-8 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <PageAvatar videoSrc="/videos/avatars/healthcare-guide.mp4" title="Healthcare Programs Guide" />
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '4-12 Weeks', label: 'Program Length' },
            { val: 'State Certs', label: 'Included' },
            { val: '$30K-$55K', label: 'Salary Range' },
            { val: '6+', label: 'Career Paths' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-lg sm:text-xl font-bold text-white">{s.val}</div>
              <div className="text-slate-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Choose Your Path</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { name: 'CNA Certification', href: '/programs/cna-certification', img: '/images/healthcare/program-cna-training.jpg', duration: '4-6 weeks' },
              { name: 'Medical Assistant', href: '/programs/medical-assistant', img: '/images/healthcare/program-medical-assistant.jpg', duration: '8-12 weeks' },
              { name: 'Phlebotomy', href: '/programs/phlebotomy-technician', img: '/images/healthcare/hero-program-phlebotomy.jpg', duration: '4-8 weeks' },
              { name: 'Pharmacy Technician', href: '/programs/pharmacy-technician', img: '/images/healthcare/hero-program-medical-assistant.jpg', duration: '8-12 weeks' },
              { name: 'Dental Assistant', href: '/programs/dental-assistant', img: '/images/healthcare/hero-program-patient-care.jpg', duration: '10-12 weeks' },
              { name: 'CPR & First Aid', href: '/programs/cpr-first-aid-hsi', img: '/images/healthcare/program-cpr-certification.jpg', duration: '1 day' },
            ].map((p) => (
              <Link key={p.name} href={p.href} className="group">
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-2">
                  <Image src={p.img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 33vw" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                <p className="text-slate-500 text-xs">{p.duration}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative w-full h-[200px] sm:w-72 sm:h-[280px] rounded-xl overflow-hidden flex-shrink-0">
              <Image src="/images/healthcare/hero-programs-healthcare.jpg" alt="Healthcare training" fill sizes="100vw" className="object-cover" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">What You&apos;ll Learn</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">Hands-on clinical training and classroom instruction to prepare for certification exams.</p>
              <div className="space-y-2">
                {['Patient care fundamentals and safety protocols', 'Vital signs monitoring and documentation', 'Infection control and hygiene procedures', 'Medical terminology and healthcare systems', 'Clinical rotations at healthcare facilities', 'State certification exam preparation'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-blue-600 rounded-full flex-shrink-0" />
                    <span className="text-slate-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Career Outcomes */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Career Outcomes</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { title: 'CNA', salary: '$30K-$42K' },
              { title: 'Medical Assistant', salary: '$32K-$45K' },
              { title: 'Phlebotomist', salary: '$30K-$40K' },
              { title: 'Pharmacy Tech', salary: '$32K-$42K' },
              { title: 'Dental Assistant', salary: '$35K-$48K' },
              { title: 'Patient Care Tech', salary: '$30K-$40K' },
            ].map((c) => (
              <div key={c.title} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                <div className="text-brand-blue-600 font-bold text-sm">{c.salary}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Enroll */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How to Enroll</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Apply Online', desc: 'Submit your student application.' },
              { step: '2', title: 'Check Funding', desc: 'Register at indianacareerconnect.com for WIOA/JRI eligibility.' },
              { step: '3', title: 'Complete Training', desc: 'Classroom instruction and clinical hours.' },
              { step: '4', title: 'Get Certified', desc: 'Pass your state certification exam and start working.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-white rounded-lg p-4">
                <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                  <p className="text-slate-600 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-14 bg-brand-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your Healthcare Career</h2>
          <p className="text-white mb-6 text-sm">Classes starting soon. Funding available for qualifying students.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=healthcare" className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors text-center">
              Apply Now <ArrowRight className="w-4 h-4 inline ml-1" />
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
