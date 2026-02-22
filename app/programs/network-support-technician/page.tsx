export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, DollarSign, Award, CheckCircle, Users, Wifi, TrendingUp, Network , ArrowRight, Phone } from 'lucide-react';
import { CredentialsOutcomes } from '@/components/programs/CredentialsOutcomes';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Network Support Technician | Certiport & Cisco Certified | Indianapolis',
  description: 'Earn IT Specialist — Networking and Cisco CCST certifications. 12-week program. WorkOne-eligible 4-star Top Job. Average salary $73,445 in Indiana.',
  keywords: 'network support training, Cisco CCST certification, IT Specialist networking, computer network support, WorkOne funded IT training Indianapolis',
  alternates: { canonical: `${SITE_URL}/programs/network-support-technician` },
};

export default function Page() {
  return (
    <>
    <ProgramStructuredData program={{
      id: 'network-support-technician',
      name: 'Network Support Technician — IT Specialist & Cisco CCST',
      slug: 'network-support-technician',
      description: 'Earn IT Specialist — Networking and Cisco CCST certifications. 12-week program covering network infrastructure, troubleshooting, and security.',
      duration_weeks: 12,
      price: 4950,
      image_url: `${SITE_URL}/images/programs-hq/it-support.jpg`,
      category: 'Technology',
      outcomes: ['IT Specialist — Networking (Certiport)', 'Cisco Certified Support Technician', 'Certificate of Completion'],
    }} />
    <div className="min-h-screen bg-white">
      <ProgramHeroBanner videoSrc="/videos/it-technology.mp4" />
      <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Technology', href: '/programs/technology' }, { label: 'Network Support Technician' }]} />

      <section className="relative w-full -mt-[72px]">
        <div className="relative min-h-[70vh] w-full overflow-hidden">
          <Image src="/images/programs-hq/it-support.jpg" alt="Network Support Technician Training" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
          <div className="relative z-10 flex items-center justify-center min-h-[70vh]">
            <div className="max-w-5xl mx-auto px-6 text-center text-white">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30">
                <Network className="w-6 h-6 text-brand-blue-300 flex-shrink-0" />
                <span className="text-sm font-semibold">Certiport + Cisco Certified</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black mb-6">Network Support Technician</h1>
              <p className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto">Build, troubleshoot, and maintain computer networks. Network support specialists earn $73,445/year in Indiana.</p>
              <p className="text-lg mb-8 text-brand-blue-200 font-semibold">DWD Top Jobs: 4-Star Occupation | WorkOne Eligible | SOC 15-1231</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/apply?program=network-support-technician" className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-blue-600 font-bold rounded-xl hover:bg-gray-100 transition text-lg shadow-lg">Apply Now</Link>
                <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white font-bold rounded-xl hover:bg-white/10 transition text-lg border-2 border-white">Schedule at WorkOne</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PageAvatar videoSrc="/videos/avatars/network-guide.mp4" title="Network Support Program Guide" />
      <PathwayDisclosure programName="Network Support Technician" programSlug="network-support-technician" />

      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Network Support?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: TrendingUp, title: '4-Star Top Job', desc: 'High-demand occupation in Indiana' },
              { icon: DollarSign, title: '$73,445 Avg Salary', desc: 'Indiana average for network support' },
              { icon: Wifi, title: 'Every Business Needs Networks', desc: 'Universal demand across all industries' },
              { icon: Award, title: '2 Certifications', desc: 'IT Specialist Networking + Cisco CCST' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><item.icon className="w-6 h-6 text-brand-blue-600" /></div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
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
              { num: 4, title: 'Start Training', desc: 'Begin your networking career' },
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
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to Build Networks?</h2>
          <p className="text-xl text-slate-300 mb-8">12 weeks. Two certifications. WorkOne funding available.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply?program=network-support-technician" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="/support" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-full font-bold text-lg transition-all border border-white/30">
              <Phone className="w-5 h-5" /> Get Help Online
            </a>
          </div>
          <p className="mt-6 text-slate-400">Call <a href="tel:3173143757" className="font-bold underline text-white">317-314-3757</a></p>
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

      

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <CredentialsOutcomes programName="Network Support Technician" partnerCertifications={['IT Specialist — Networking (issued by Certiport)', 'Cisco Certified Support Technician (issued by Certiport/Cisco)', 'Certificate of Completion (issued by Elevate for Humanity)']} employmentOutcomes={['Computer Network Support Specialist (SOC 15-1231)', 'Network Technician', 'LAN/WAN Administrator', 'Help Desk Tier 2']} />
        </div>
      </section>
    </div>
    </>
  );
}
