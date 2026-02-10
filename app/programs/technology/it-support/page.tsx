export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  CheckCircle, Clock, DollarSign, Award, ArrowRight,
  Monitor, Wifi, Shield, Wrench, Phone, HardDrive,
} from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'IT Support Training | CompTIA A+ Certification | Elevate for Humanity',
  description: 'Get CompTIA A+ certified and start your IT career in 8-12 weeks. Free training through WIOA funding in Indianapolis. Help desk and technical support training.',
  alternates: { canonical: `${SITE_URL}/programs/technology/it-support` },
  keywords: [
    'IT support training Indianapolis',
    'CompTIA A+ certification',
    'free IT training Indiana',
    'help desk training',
    'technical support certification',
    'WIOA IT program',
  ],
  openGraph: {
    title: 'IT Support Training | CompTIA A+ Certification | Elevate',
    description: 'Get CompTIA A+ certified in 8-12 weeks. Free training through WIOA funding.',
    url: `${SITE_URL}/programs/technology/it-support`,
    siteName: 'Elevate for Humanity',
    images: [{ url: `${SITE_URL}/images/technology/hero-program-it-support.jpg`, width: 1200, height: 630, alt: 'IT Support Training' }],
    type: 'website',
  },
};

const curriculum = [
  { icon: HardDrive, title: 'Hardware & Troubleshooting', desc: 'Computer hardware installation, repair, and diagnostics' },
  { icon: Monitor, title: 'Operating Systems', desc: 'Windows, macOS, and Linux administration and support' },
  { icon: Wifi, title: 'Networking Fundamentals', desc: 'TCP/IP, DNS, DHCP, and network connectivity' },
  { icon: Shield, title: 'Security Basics', desc: 'Malware prevention, encryption, and security best practices' },
  { icon: Phone, title: 'Help Desk Skills', desc: 'Customer service, ticketing systems, and remote support' },
  { icon: Wrench, title: 'Mobile Device Support', desc: 'Smartphone and tablet troubleshooting and configuration' },
];

const careers = [
  { title: 'Help Desk Technician', salary: '$38K-$50K', growth: 'High demand' },
  { title: 'IT Support Specialist', salary: '$42K-$58K', growth: 'Very high demand' },
  { title: 'Desktop Support Tech', salary: '$45K-$60K', growth: 'Steady growth' },
  { title: 'Technical Support Rep', salary: '$40K-$55K', growth: 'Remote options' },
];

export default function ITSupportPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] max-h-[500px]">
        <Image src="/images/technology/hero-program-it-support.jpg" alt="IT Support Training" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-blue-900/60" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <span className="text-blue-200 font-medium text-sm uppercase tracking-wider">Technology Programs</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 mt-2">IT Support Training</h1>
            <p className="text-xl text-white/90">CompTIA A+ Certification Program</p>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Technology', href: '/programs/technology' },
            { label: 'IT Support' },
          ]} />
        </div>
      </div>

      {/* CTA Buttons */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Start Your IT Career</h2>
          <p className="text-lg text-gray-600 mb-8">Get certified and job-ready in as little as 8 weeks</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply?program=it-support" className="bg-blue-600 text-white px-10 py-5 rounded-lg font-semibold text-xl hover:bg-blue-700 transition-colors">
              Apply Now
            </Link>
            <Link href="/wioa-eligibility" className="bg-white border-2 border-blue-600 text-blue-600 px-10 py-5 rounded-lg font-semibold text-xl hover:bg-blue-50 transition-colors">
              Check Eligibility
            </Link>
          </div>
        </div>
      </section>

      {/* Program Overview */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-black">What Is IT Support Training?</h2>
            <p className="text-lg text-gray-700 mb-4">
              Our IT Support program prepares you for the CompTIA A+ certification, the industry standard for
              launching a career in information technology. You will learn hardware and software troubleshooting,
              networking basics, security fundamentals, and customer service skills.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Training is delivered in a hybrid format combining online coursework with hands-on lab sessions.
              Upon completion, you will be prepared to sit for the CompTIA A+ certification exam.
            </p>
            <p className="text-lg text-gray-700">
              This program may be available at no cost if you qualify through WIOA, WRG, or JRI funding.
            </p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-black mb-6">Program at a Glance</h3>
            <div className="space-y-4">
              {[
                ['Duration', '8-12 Weeks'],
                ['Format', 'Hybrid (Online + Labs)'],
                ['Certification', 'CompTIA A+'],
                ['Cost', 'Free with WIOA funding'],
                ['Schedule', 'Flexible / Part-time available'],
                ['Credential', 'CompTIA A+ Certificate'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-blue-100 pb-3">
                  <span className="text-gray-700">{label}</span>
                  <span className="font-bold text-black">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-black mb-4">What You Will Learn</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Hands-on training covering all domains of the CompTIA A+ certification.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curriculum.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-black mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Outcomes */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-black mb-4">Career Opportunities</h2>
            <p className="text-lg text-gray-600">Graduates are prepared for in-demand IT roles.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {careers.map((c, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border shadow-sm text-center">
                <h3 className="font-bold text-black mb-2">{c.title}</h3>
                <p className="text-2xl font-bold text-blue-600 mb-1">{c.salary}</p>
                <span className="text-sm text-green-600 font-medium">{c.growth}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">Who Should Apply</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-green-700 mb-4">Requirements</h3>
              <ul className="space-y-3">
                {[
                  'High school diploma or GED',
                  'Basic computer literacy',
                  'Interest in technology and problem-solving',
                  'Reliable internet access for online coursework',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-blue-700 mb-4">Ideal For</h3>
              <ul className="space-y-3">
                {[
                  'Career changers looking to enter tech',
                  'Recent graduates seeking certifications',
                  'Anyone interested in help desk or support roles',
                  'People who enjoy troubleshooting and fixing things',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Launch Your IT Career?</h2>
          <p className="text-blue-100 text-lg mb-8">Apply now or check if you qualify for free training through workforce funding.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply?program=it-support" className="bg-white text-blue-700 px-10 py-5 rounded-lg font-semibold text-xl hover:bg-blue-50 transition inline-flex items-center justify-center gap-2">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/wioa-eligibility" className="border-2 border-white text-white px-10 py-5 rounded-lg font-semibold text-xl hover:bg-white/10 transition">
              Check Eligibility
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
