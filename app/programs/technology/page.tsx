
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Technology Training | IT Support, Cybersecurity | Elevate',
  description: 'Technology career training in Indianapolis. IT Support, Cybersecurity, and more. Industry certifications with funding available for qualifying students.',
  alternates: { canonical: `${SITE_URL}/programs/technology` },
  openGraph: {
    title: 'Technology Training | IT Support, Cybersecurity',
    description: 'IT Support, Cybersecurity — high-demand tech careers with industry certifications.',
    url: `${SITE_URL}/programs/technology`,
    images: [{ url: `${SITE_URL}/images/hero/hero-tech-careers.jpg`, width: 1200, height: 630 }],
  },
};

export default function TechnologyPage() {

  return (
    <div className="min-h-screen bg-white">
      <ProgramHeroBanner videoSrc="/videos/it-technology.mp4" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Technology' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/hero/hero-tech-careers.jpg" alt="Technology Training Programs" fill sizes="100vw" className="object-cover" priority />
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '8-16 Weeks', label: 'Program Length' },
            { val: 'CompTIA+', label: 'Certifications' },
            { val: '$40K-$85K', label: 'Salary Range' },
            { val: 'Remote OK', label: 'Work Options' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-lg sm:text-xl font-bold text-white">{s.val}</div>
              <div className="text-slate-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Choose Your Path</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'IT Support', href: '/programs/technology/it-support', img: '/images/programs-hq/it-support.jpg', duration: '8-12 weeks', desc: 'Help desk, troubleshooting, CompTIA A+' },
              { name: 'Cybersecurity', href: '/programs/technology/cybersecurity', img: '/images/technology/cybersecurity-hero.jpg', duration: '12-16 weeks', desc: 'Network security, CompTIA Security+' },
            ].map((p) => (
              <Link key={p.name} href={p.href} className="group">
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-2">
                  <Image src={p.img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 50vw" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                <p className="text-slate-500 text-xs">{p.duration} — {p.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative w-full h-[200px] sm:w-72 sm:h-[280px] rounded-xl overflow-hidden flex-shrink-0">
              <Image src="/images/technology/hero-program-cybersecurity.jpg" alt="Tech training" fill sizes="100vw" className="object-cover" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">What You&apos;ll Learn</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">Hands-on labs and coursework aligned with industry certification exams.</p>
              <div className="space-y-2">
                {['Hardware and software troubleshooting', 'Network configuration and administration', 'Operating systems (Windows, Linux, macOS)', 'Cybersecurity fundamentals and threat analysis', 'Cloud computing basics (AWS, Azure)', 'CompTIA A+, Network+, and Security+ exam prep'].map((item) => (
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

      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Career Outcomes</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { title: 'Help Desk Tech', salary: '$35K-$50K' },
              { title: 'IT Support Specialist', salary: '$40K-$60K' },
              { title: 'Network Admin', salary: '$50K-$75K' },
              { title: 'Security Analyst', salary: '$55K-$85K' },
              { title: 'Systems Admin', salary: '$50K-$80K' },
              { title: 'Cloud Technician', salary: '$50K-$75K' },
            ].map((c) => (
              <div key={c.title} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                <div className="text-brand-blue-600 font-bold text-sm">{c.salary}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How to Enroll</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Apply Online', desc: 'Submit your student application.' },
              { step: '2', title: 'Check Funding', desc: 'Register at indianacareerconnect.com for WIOA/JRI eligibility.' },
              { step: '3', title: 'Complete Training', desc: 'Hands-on labs and coursework.' },
              { step: '4', title: 'Get Certified & Hired', desc: 'Pass your CompTIA exam and connect with employers.' },
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

      <section className="py-8 sm:py-14 bg-brand-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your Tech Career</h2>
          <p className="text-white mb-6 text-sm">High demand, remote-friendly. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=technology" className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors text-center">
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
