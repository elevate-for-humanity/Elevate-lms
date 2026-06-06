import Image from 'next/image';
import Link from 'next/link';
import HeroVideo from '@/components/marketing/HeroVideo';
import { EducationHeader } from '@/components/education/EducationHeader.client';
import { ArrowRight, MapPin, Clock, Phone, Mail, BookOpen, Users, Award, CheckCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { getMarketingProgramSectors } from '@/lib/programs/catalog-sectors';
import { formatPublicProgramsDisplay } from '@/lib/programs/public-programs-page';
import { loadVerifiedPublicStats } from '@/lib/site-stats-server';
import Logo from '@/components/ui/Logo';

export const revalidate = 0;

const LOCATIONS = [
  {
    state: 'Indiana',
    href: '/career-training-indiana',
    cities: ['Indianapolis', 'Fort Wayne', 'Evansville'],
    image: '/images/pages/about-career-training.webp',
    desc: 'Main campus. WIOA-eligible programs, apprenticeships, and job placement.',
  },
  {
    state: 'Illinois',
    href: '/career-training-illinois',
    cities: ['Chicago', 'Aurora', 'Naperville'],
    image: '/images/pages/workforce-training.webp',
    desc: 'Workforce programs across the Chicago metro and statewide.',
  },
  {
    state: 'Ohio',
    href: '/career-training-ohio',
    cities: ['Columbus', 'Cleveland', 'Cincinnati'],
    image: '/images/pages/welding-sparks.webp',
    desc: 'Career training aligned with Ohio industry demand.',
  },
];

export default async function EducationLandingPage() {
  const [{ sectors, totalProgramCount, catalogSource }, verified] = await Promise.all([
    getMarketingProgramSectors(),
    loadVerifiedPublicStats(),
  ]);

  const stats = [
    { Icon: BookOpen, value: verified.programsDisplay, label: 'Training Programs' },
    { Icon: Users, value: verified.studentsDisplay, label: 'Learners Served' },
    { Icon: Award, value: verified.placementDisplay, label: 'Credential attainment' },
    { Icon: CheckCircle, value: '$0', label: 'Eligible Student Cost' },
  ];

  return (
    <div className="min-h-screen bg-white" data-catalog-source={catalogSource}>
      <EducationHeader />

      <section className="pt-[60px]">
        <HeroVideo
          videoSrcDesktop="/videos/lms-learning.mp4"
          posterImage="/images/pages/higher-ed-hero.webp"
          voiceoverSrc="/audio/heroes/programs.mp3"
          microLabel="Career Training"
          analyticsName="education"
          belowHeroHeadline="Career Training That Changes Lives"
          belowHeroSubheadline={`${formatPublicProgramsDisplay(totalProgramCount)} credential-bearing programs. No-cost training for eligible participants through WIOA and state workforce funding.`}
          ctas={[
            { label: 'Browse All Programs', href: '/programs', variant: 'primary' },
            { label: 'Apply', href: '/apply', variant: 'secondary' },
            { label: 'Check Funding', href: '/funding', variant: 'secondary' },
          ]}
          trustIndicators={[
            `${PLATFORM_DEFAULTS.orgName} Education`,
            'WIOA & WRG Eligible',
            'Indianapolis, Indiana',
          ]}
        />
      </section>

      <section className="py-8 border-b">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 justify-center">
              <s.Icon className="w-9 h-9 text-brand-red-600 flex-shrink-0" />
              <div>
                <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                <div className="text-sm text-slate-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Choose Your Career Path</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Same program catalog as{' '}
              <Link href="/programs" className="text-brand-red-600 font-semibold hover:underline">
                /programs
              </Link>
              — industry-recognized credentials and hands-on training.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sectors.map((p) => (
              <div
                key={p.sectionKey}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-slate-100"
              >
                <div className="relative w-full aspect-video">
                  <Image
                    src={p.image}
                    alt={`${p.title} training`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    placeholder="empty"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{p.title}</h3>
                  <p className="text-xs text-slate-500 mb-2">{p.programCount} programs</p>
                  <p className="text-slate-600 text-sm mb-3">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.tags.map((t) => (
                      <span key={t} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={p.href}
                    className="block w-full text-center bg-brand-red-600 hover:bg-brand-red-700 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
                  >
                    View Programs <ArrowRight className="w-4 h-4 inline ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Pick Your Location</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Training across multiple states. Select a location for schedules and enrollment near you.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LOCATIONS.map((loc) => (
              <div
                key={loc.state}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-slate-100"
              >
                <div className="relative w-full aspect-video">
                  <Image
                    src={loc.image}
                    alt={`Training in ${loc.state}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    placeholder="empty"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-brand-red-500" />
                    <h3 className="text-lg font-bold text-slate-900">{loc.state}</h3>
                  </div>
                  <p className="text-slate-600 text-sm mb-3">{loc.desc}</p>
                  <Link
                    href={loc.href}
                    className="block w-full text-center bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
                  >
                    Explore {loc.state} <ArrowRight className="w-4 h-4 inline ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-green-100 text-brand-green-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Clock className="w-4 h-4" /> Now Enrolling
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Training Funding Available</h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Many programs are available at no cost through WIOA, state workforce grants, and DOL Registered
            Apprenticeships.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/funding"
              className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-7 py-3.5 rounded-lg font-bold transition-colors"
            >
              Check Funding Eligibility
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-7 py-3.5 rounded-lg font-bold transition-colors"
            >
              Start Your Application
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <Logo
                alt={PLATFORM_DEFAULTS.orgName}
                width={120}
                height={36}
                className="h-8 w-auto brightness-0 invert mb-3"
              />
              <div className="text-sm">8888 Keystone Crossing, Suite 1300</div>
              <div className="text-sm">Indianapolis, IN 46240</div>
              <div className="flex items-center gap-2 mt-3 text-sm">
                <Phone className="w-4 h-4" />
                <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/\D/g, '')}`} className="hover:text-white">
                  {PLATFORM_DEFAULTS.supportPhone}
                </a>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${PLATFORM_DEFAULTS.supportEmail}`} className="hover:text-white">
                  {PLATFORM_DEFAULTS.supportEmail}
                </a>
              </div>
            </div>
            <div>
              <div className="text-white font-semibold mb-3">Programs</div>
              <div className="space-y-2 text-sm">
                {sectors.map((p) => (
                  <Link key={p.sectionKey} href={p.href} className="block hover:text-white">
                    {p.title}
                  </Link>
                ))}
                <Link href="/programs" className="block hover:text-white font-semibold">
                  All programs →
                </Link>
              </div>
            </div>
            <div>
              <div className="text-white font-semibold mb-3">Quick Links</div>
              <div className="space-y-2 text-sm">
                <Link href="/apply" className="block hover:text-white">
                  Apply
                </Link>
                <Link href="/programs/catalog" className="block hover:text-white">
                  Program catalog
                </Link>
                <Link href="/enrollment" className="block hover:text-white">
                  Enrollment
                </Link>
                <Link href="/funding" className="block hover:text-white">
                  Funding
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm">
            <div>
              &copy; {new Date().getFullYear()} {PLATFORM_DEFAULTS.orgName}. All rights reserved.
            </div>
            <Link href={PLATFORM_DEFAULTS.siteUrl} className="hover:text-white">
              {PLATFORM_DEFAULTS.canonicalDomain}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
