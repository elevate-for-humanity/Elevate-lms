export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, DollarSign, Award, CheckCircle, Users, Shield, TrendingUp, Lock, ArrowRight, Phone } from 'lucide-react';
import { CredentialsOutcomes } from '@/components/programs/CredentialsOutcomes';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Cybersecurity Analyst | Certiport IT Specialist | Indianapolis',
  description:
    'Earn the Certiport IT Specialist — Cybersecurity certification. 12-week program. WorkOne-eligible 4-star Top Job. Average salary $91,749 in Indiana.',
  keywords:
    'cybersecurity training Indianapolis, IT Specialist cybersecurity certification, Certiport cybersecurity, information security analyst training, WorkOne funded cybersecurity',
  alternates: { canonical: `${SITE_URL}/programs/cybersecurity-analyst` },
};

export default function Page() {
  return (
    <>
    <ProgramStructuredData program={{
      id: 'cybersecurity-analyst',
      name: 'Cybersecurity Analyst — IT Specialist Certification',
      slug: 'cybersecurity-analyst',
      description: 'Earn the Certiport IT Specialist — Cybersecurity certification. 12-week program covering threat detection, security operations, and incident response.',
      duration_weeks: 12,
      price: 4950,
      image_url: `${SITE_URL}/images/programs-hq/cybersecurity.jpg`,
      category: 'Technology',
      outcomes: ['IT Specialist — Cybersecurity (Certiport)', 'Certificate of Completion'],
    }} />
    <div className="min-h-screen bg-white">
      <ProgramHeroBanner videoSrc="/videos/it-technology.mp4" />
      <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Technology', href: '/programs/technology' }, { label: 'Cybersecurity Analyst' }]} />

      <section className="relative w-full -mt-[72px]">
        <div className="relative min-h-[70vh] w-full overflow-hidden">
          <Image src="/images/programs-hq/cybersecurity.jpg" alt="Cybersecurity Analyst Training" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
          <div className="relative z-10 flex items-center justify-center min-h-[70vh]">
            <div className="max-w-5xl mx-auto px-6 text-center text-white">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30">
                <Shield className="w-6 h-6 text-brand-blue-300 flex-shrink-0" />
                <span className="text-sm font-semibold">Certiport IT Specialist Certified</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black mb-6">Cybersecurity Analyst</h1>
              <p className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto">
                Protect networks and data. Information security analysts earn an average of $91,749/year in Indiana.
              </p>
              <p className="text-lg mb-8 text-brand-blue-200 font-semibold">DWD Top Jobs: 4-Star Occupation | WorkOne Eligible | SOC 15-1212</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/apply?program=cybersecurity-analyst" className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-blue-600 font-bold rounded-xl hover:bg-gray-100 transition text-lg shadow-lg">Apply Now</Link>
                <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white font-bold rounded-xl hover:bg-white/10 transition text-lg border-2 border-white">Schedule at WorkOne</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PageAvatar videoSrc="/videos/avatars/cyber-guide.mp4" title="Cybersecurity Program Guide" />
      <PathwayDisclosure programName="Cybersecurity Analyst" programSlug="cybersecurity-analyst" />

      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Cybersecurity?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: TrendingUp, title: '4-Star Top Job', desc: 'One of Indiana\'s highest-demand occupations' },
              { icon: DollarSign, title: '$91,749 Avg Salary', desc: 'Indiana average for info security analysts' },
              { icon: Lock, title: '3.5M Unfilled Jobs', desc: 'Global cybersecurity workforce shortage' },
              { icon: Award, title: 'Industry Certification', desc: 'Certiport IT Specialist — Cybersecurity' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Your Training Path</h2>
          <div className="bg-white rounded-xl p-8">
            <div className="space-y-6">
              {[
                { week: 'Weeks 1-3', title: 'Security Foundations', desc: 'Network fundamentals, operating systems, CIA triad, threat landscape, and security terminology.' },
                { week: 'Weeks 4-6', title: 'Threat Detection & Prevention', desc: 'Malware analysis, firewalls, IDS/IPS, vulnerability scanning, and penetration testing basics.' },
                { week: 'Weeks 7-9', title: 'Security Operations', desc: 'Incident response, log analysis, SIEM tools, encryption, access control, and compliance frameworks.' },
                { week: 'Weeks 10-12', title: 'Exam Prep & Certification', desc: 'Practice exams, hands-on labs, and Certiport IT Specialist — Cybersecurity certification exam.' },
              ].map((step, i) => (
                <div key={step.week} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{step.title} ({step.week})</h3>
                    <p className="text-slate-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Program Details</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 text-center"><Clock className="w-8 h-8 text-brand-blue-600 mx-auto mb-3" /><h3 className="font-bold text-lg mb-1">Duration</h3><p className="text-slate-600">12 weeks</p></div>
            <div className="bg-gray-50 rounded-xl p-6 text-center"><DollarSign className="w-8 h-8 text-brand-green-600 mx-auto mb-3" /><h3 className="font-bold text-lg mb-1">Tuition</h3><p className="text-slate-600">$4,950 (WorkOne funding available)</p></div>
            <div className="bg-gray-50 rounded-xl p-6 text-center"><Users className="w-8 h-8 text-purple-600 mx-auto mb-3" /><h3 className="font-bold text-lg mb-1">Format</h3><p className="text-slate-600">In-person at Indianapolis Training Center</p></div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Career Outcomes</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Jobs You Qualify For</h3>
              <ul className="space-y-3">
                {[
                  { title: 'Information Security Analyst', salary: '$70K-$115K' },
                  { title: 'SOC Analyst', salary: '$55K-$85K' },
                  { title: 'Cybersecurity Specialist', salary: '$65K-$100K' },
                  { title: 'Network Security Administrator', salary: '$60K-$95K' },
                  { title: 'Vulnerability Analyst', salary: '$65K-$100K' },
                ].map((job) => (
                  <li key={job.title} className="flex items-center justify-between bg-white rounded-lg p-3">
                    <span className="font-medium">{job.title}</span>
                    <span className="text-brand-green-600 font-bold text-sm">{job.salary}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Industries Hiring</h3>
              <ul className="space-y-3">
                {['Healthcare systems', 'Financial institutions', 'Government agencies', 'Defense contractors', 'Technology companies', 'Insurance companies', 'Manufacturing', 'Every business with a network'].map((i) => (
                  <li key={i} className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" /><span>{i}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">How to Enroll</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: 1, title: 'Apply Online', desc: 'Complete our simple application' },
              { num: 2, title: 'Register at Indiana Career Connect', desc: 'Verify WIOA funding eligibility' },
              { num: 3, title: 'Orientation', desc: 'Attend program orientation' },
              { num: 4, title: 'Start Training', desc: 'Begin your cybersecurity career' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to Defend the Digital World?</h2>
          <p className="text-xl text-slate-300 mb-8">12 weeks. Certiport certified. WorkOne funding available.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply?program=cybersecurity-analyst" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="/support" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-full font-bold text-lg transition-all border border-white/30">
              <Phone className="w-5 h-5" /> Get Help Online
            </a>
          </div>
          <p className="mt-6 text-slate-400">Call <a href="tel:3173143757" className="font-bold underline text-white">317-314-3757</a></p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <CredentialsOutcomes
            programName="Cybersecurity Analyst"
            partnerCertifications={['IT Specialist — Cybersecurity (issued by Certiport)', 'Certificate of Completion (issued by Elevate for Humanity)']}
            employmentOutcomes={['Information Security Analyst (SOC 15-1212)', 'SOC Analyst', 'Cybersecurity Specialist', 'Network Security Administrator']}
          />
        </div>
      </section>
    </div>
    </>
  );
}
