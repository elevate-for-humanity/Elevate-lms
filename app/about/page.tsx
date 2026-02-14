import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import { TEAM_PREVIEW, FOUNDER } from '@/data/team';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'About Us | Elevate for Humanity',
  description:
    'Elevate for Humanity is a U.S. DOL Registered Apprenticeship Sponsor and Indiana DWD Approved Training Provider offering free workforce training in Indianapolis.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'About Us | Elevate for Humanity',
    description:
      'U.S. DOL Registered Apprenticeship Sponsor and Indiana DWD Approved Training Provider. Free workforce training in Indianapolis.',
    url: `${SITE_URL}/about`,
    images: [{ url: '/images/heroes-hq/about-hero.jpg', width: 1200, height: 630, alt: 'About Elevate for Humanity' }],
  },
};

const credentials = [
  { name: 'U.S. Department of Labor', detail: 'Registered Apprenticeship Sponsor', logo: '/images/partners/usdol.webp' },
  { name: 'Indiana DWD', detail: 'WIOA-Approved Training Provider', logo: '/images/partners/dwd.svg' },
  { name: 'WorkOne', detail: 'Eligibility & Enrollment Partner', logo: '/images/partners/workone.svg' },
  { name: 'Next Level Jobs', detail: 'Workforce Ready Grant Provider', logo: '/images/partners/nextleveljobs.webp' },
  { name: 'OSHA', detail: 'Authorized Safety Training', logo: '/images/partners/osha.webp' },
];

const programs = [
  { name: 'Healthcare', href: '/programs/healthcare', image: '/images/programs-hq/healthcare-hero.jpg' },
  { name: 'Skilled Trades', href: '/programs/skilled-trades', image: '/images/programs-hq/skilled-trades-hero.jpg' },
  { name: 'CDL Training', href: '/programs/cdl', image: '/images/programs-hq/cdl-trucking.jpg' },
  { name: 'Technology', href: '/programs/technology', image: '/images/programs-hq/technology-hero.jpg' },
  { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship', image: '/images/programs-hq/barber-hero.jpg' },
  { name: 'CPR & First Aid', href: '/programs/cpr-first-aid-hsi', image: '/images/programs-hq/cna-training.jpg' },
];

const populations = [
  { label: 'Justice-Involved Individuals', desc: 'Second chance training through JRI funding' },
  { label: 'Low-Income Families', desc: 'Free training through WIOA and WRG' },
  { label: 'Veterans', desc: 'Career transition and upskilling support' },
  { label: 'Career Changers', desc: 'New certifications in high-demand fields' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'About Us' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[320px] sm:h-[400px] overflow-hidden">
        <Image
          src="/images/heroes-hq/about-hero.jpg"
          alt="Elevate for Humanity workforce training"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-6xl mx-auto px-4 w-full pb-10 sm:pb-14">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
              About Elevate for Humanity
            </h1>
            <p className="text-lg text-white/90 max-w-2xl">
              Workforce training, apprenticeship programs, and career services in Indianapolis, Indiana.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-14 sm:py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Our Mission</h2>
          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
            To create pathways out of poverty and into prosperity by providing free, high-quality
            career training to justice-involved individuals, low-income families, veterans, and
            anyone facing barriers to employment.
          </p>
        </div>
      </section>

      {/* Founder */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div className="relative aspect-[4/5] max-w-md mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={FOUNDER.headshotSrc || '/images/placeholder-avatar.jpg'}
                alt={FOUNDER.name}
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div>
              <p className="text-brand-blue-600 font-semibold text-sm mb-2 uppercase tracking-wide">Founder</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{FOUNDER.name}</h2>
              <p className="text-slate-500 mb-6">{FOUNDER.title}</p>
              <div className="text-slate-700 space-y-4 leading-relaxed">
                <p>
                  Elizabeth Greene founded Elevate for Humanity in 2019 with a mission to create
                  pathways out of poverty for those who need it most. Her vision was born from
                  witnessing firsthand the barriers that prevent talented individuals from accessing
                  career opportunities.
                </p>
                <p>
                  Under her leadership, Elevate for Humanity has grown into a U.S. Department of Labor
                  Registered Apprenticeship Sponsor and Indiana DWD Approved Training Provider, serving
                  participants across Indianapolis and beyond.
                </p>
                <p>
                  Elizabeth also owns Textures Institute of Cosmetology, Greene Staffing Solutions, and
                  Greene Property Management — creating a holistic ecosystem for training, employment,
                  and housing.
                </p>
              </div>
              <Link
                href="/about/team"
                className="inline-flex items-center gap-2 mt-8 text-brand-blue-600 font-semibold hover:gap-3 transition-all"
              >
                Meet the Full Team <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">Credentials & Partners</h2>
          <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
            Approved and funded through federal and state workforce agencies.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {credentials.map((cred) => (
              <div key={cred.name} className="bg-white rounded-xl p-5 text-center shadow-sm border border-slate-100">
                <div className="flex justify-center mb-3">
                  <Image
                    src={cred.logo}
                    alt={cred.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{cred.name}</h3>
                <p className="text-slate-500 text-xs">{cred.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">Who We Serve</h2>
          <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
            Free and funded training for individuals facing barriers to employment.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {populations.map((pop) => (
              <div key={pop.label} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">{pop.label}</h3>
                <p className="text-slate-600 text-sm">{pop.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">Training Programs</h2>
          <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
            Industry-recognized certifications in high-demand fields.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((prog) => (
              <Link key={prog.name} href={prog.href} className="group">
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white hover:shadow-lg transition-shadow">
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={prog.image}
                      alt={prog.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 group-hover:text-brand-blue-600 transition-colors">{prog.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-full font-bold transition hover:scale-105 shadow-lg"
            >
              View All Programs <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Team Preview */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">Leadership Team</h2>
          <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
            The professionals operating workforce training, apprenticeship programs, and career services.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {TEAM_PREVIEW.map((member) => (
              <div key={member.id} className="text-center">
                <div className="relative w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden bg-slate-200">
                  {member.headshotSrc ? (
                    <Image src={member.headshotSrc} alt={member.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-slate-900">{member.name}</h3>
                <p className="text-sm text-slate-500">{member.title}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/about/team"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-800 transition"
            >
              View Full Team
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-brand-red-600 to-brand-red-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start Your New Career Today
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Training may be free for eligible Indiana residents. Apply in minutes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/apply/student"
              className="bg-white text-brand-red-600 px-10 py-5 rounded-full font-bold text-xl hover:bg-slate-50 transition hover:scale-105 shadow-lg"
            >
              Apply Now
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-white/10 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
