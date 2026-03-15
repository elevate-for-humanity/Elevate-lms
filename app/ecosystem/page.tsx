import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Building, GraduationCap, Briefcase, Heart, ArrowRight,
  Phone, Globe, Handshake, Target, Layers,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Ecosystem | Elevate For Humanity',
  description: 'Explore the Elevate ecosystem connecting learners, employers, training providers, and workforce boards.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/ecosystem',
  },
  openGraph: {
    title: 'Our Ecosystem | Elevate For Humanity',
    description: 'A connected network of learners, employers, and partners working together to transform careers.',
    url: 'https://www.elevateforhumanity.org/ecosystem',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/hero-images/pathways-hero.jpg', width: 1200, height: 630, alt: 'Elevate Ecosystem' }],
    type: 'website',
  },
};

const partners = [
  { icon: GraduationCap, title: 'Training Providers', count: '50+', description: 'Accredited programs and certifications across healthcare, trades, technology, and business.' },
  { icon: Building, title: 'Employer Partners', count: '200+', description: 'Companies actively hiring our graduates with competitive wages and benefits.' },
  { icon: Users, title: 'Workforce Boards', count: '15+', description: 'Regional workforce development boards providing funding and oversight.' },
  { icon: Heart, title: 'Community Partners', count: '30+', description: 'Nonprofits and support organizations providing wraparound services.' },
];

const howItConnects = [
  { icon: Target, title: 'Learners', description: 'Access free training, earn certifications, and get placed in careers.' },
  { icon: Building, title: 'Employers', description: 'Hire skilled, certified workers and access tax credits.' },
  { icon: GraduationCap, title: 'Training Providers', description: 'Deliver programs, receive funded students, and track outcomes.' },
  { icon: Globe, title: 'Workforce Boards', description: 'Monitor compliance, track performance, and manage providers.' },
];

export default function EcosystemPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Our Ecosystem' }]} />
        </div>
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image src="/hero-images/pathways-hero.jpg" alt="Elevate Ecosystem" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">The Elevate Ecosystem</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">A connected network of learners, employers, training providers, and workforce boards working together to transform careers and communities.</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {partners.map((p, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border text-center">
                <p.icon className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-1">{p.count}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-gray-600 text-sm">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Connects */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How the Ecosystem Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every participant in the ecosystem benefits. The platform connects all stakeholders through a single system.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItConnects.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 text-center border">
                <div className="w-14 h-14 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Join Our Network</h2>
          <p className="text-gray-600 mb-8">Whether you are a training provider, employer, or community organization, there is a place for you in our ecosystem.</p>
          <Link href="/partners/join" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-700">
            Become a Partner <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
      {/* CTA Section */}
      <section className="bg-white text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Check your eligibility for funded career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-white transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
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
