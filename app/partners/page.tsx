import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Building2, Users, Briefcase, Shield, Handshake,
  ArrowRight, Phone, FileText, GraduationCap, Scale,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partners | Elevate for Humanity',
  description: 'Partner with Elevate for Humanity. Workforce agencies, employers, training providers, barbershops, reentry organizations, and community partners.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners' },
};

const PARTNER_TYPES = [
  {
    title: 'Workforce Agencies',
    desc: 'WorkOne centers, workforce boards, and case managers. Refer WIOA, WRG, and JRI participants directly.',
    href: '/partners/workforce',
    icon: Users,
  },
  {
    title: 'Employers & OJT Hosts',
    desc: 'Hire certified graduates and host on-the-job training at your site.',
    href: '/partnerships',
    icon: Briefcase,
  },
  {
    title: 'Barbershop Partners',
    desc: 'Host barber apprentices for the Indiana Registered Apprenticeship program.',
    href: '/partners/barbershop-apprenticeship',
    icon: Building2,
  },
  {
    title: 'Training Providers',
    desc: 'Co-deliver programs, share facilities, or license our LMS platform.',
    href: '/partners/training-provider',
    icon: GraduationCap,
  },
  {
    title: 'Reentry Organizations',
    desc: 'Connect justice-involved individuals to JRI-funded career training.',
    href: '/partners/reentry',
    icon: Shield,
  },
  {
    title: 'Technology Partners',
    desc: 'LMS integrations, API access, and workforce data interoperability.',
    href: '/partners/technology',
    icon: Handshake,
  },
];

const QUICK_LINKS = [
  { label: 'Become a Partner', href: '/partners/join', icon: ArrowRight },
  { label: 'MOU Framework', href: '/partners/mou', icon: FileText },
  { label: 'Compliance Tools', href: '/partners/compliance', icon: Scale },
  { label: 'Partner Resources', href: '/partners/resources', icon: GraduationCap },
  { label: 'LMS Licensing', href: '/partners/sales', icon: Building2 },
  { label: 'Partner Login', href: '/partner/login', icon: Users },
];

export default function PartnersIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partners' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px]">
        <Image src="/images/heroes-hq/employer-hero.jpg" alt="Workforce partnership meeting" fill sizes="100vw" className="object-cover" priority />
      </section>

      <section className="bg-slate-900 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            Partner With Us
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            ETPL-listed training provider serving Marion County and Central Indiana.
            We work with workforce agencies, employers, barbershops, training providers, and community organizations.
          </p>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Partnership Types</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PARTNER_TYPES.map((type) => (
              <Link
                key={type.title}
                href={type.href}
                className="group bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-brand-blue-300 hover:shadow-md transition"
              >
                <type.icon className="w-8 h-8 text-brand-blue-600 mb-3" />
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-brand-blue-600 transition">{type.title}</h3>
                <p className="text-sm text-slate-600">{type.desc}</p>
                <span className="inline-flex items-center gap-1 text-sm text-brand-blue-600 font-medium mt-3">
                  Learn more <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Quick Links</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 p-4 hover:border-brand-blue-300 hover:shadow-sm transition"
              >
                <link.icon className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />
                <span className="font-medium text-slate-900 text-sm">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to Partner?</h2>
          <p className="text-brand-blue-100 mb-6 max-w-xl mx-auto">
            Contact us to discuss partnership options, request our provider packet, or send your first participant referral.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/partners/join"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply to Partner <ArrowRight className="w-4 h-4" />
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
