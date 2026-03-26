import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
import { InView } from '@/components/ui/InView';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export const dynamic = 'force-static';
export const revalidate = 86400;
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Technology Training Programs | Certified | Indianapolis',
  description: 'IT Help Desk, Cybersecurity, Web Development, Software Development, and more. Industry certifications with job placement.',
  alternates: { canonical: `${SITE_URL}/programs/technology` },
  openGraph: {
    title: 'Technology Training Programs | Certified | Indianapolis',
    description: 'IT Help Desk, Cybersecurity, Web Development, Software Development, and more. Industry certifications with job placement.',
    url: `${SITE_URL}/programs/technology`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Technology Training Programs | Certified | Indianapolis' }],
    type: 'website',
  },
};

const programs = [
  { title: 'IT Help Desk', duration: '8 weeks', salary: '$55,510', href: '/programs/it-help-desk', image: '/images/pages/comp-universal-hero.jpg' },
  { title: 'Cybersecurity Analyst', duration: '12 weeks', salary: '$112,000', href: '/programs/cybersecurity-analyst', image: '/images/pages/admin-network-hero.jpg' },
  { title: 'Web Development', duration: '10 weeks', salary: '$80,267', href: '/programs/technology/web-development', image: '/images/pages/admin-code-hero.jpg' },
  { title: 'Software Development', duration: '12 weeks', salary: '$104,000', href: '/programs/software-development', image: '/images/pages/admin-dev-hero.jpg' },
  { title: 'Network Administration', duration: '10 weeks', salary: '$80,600', href: '/programs/network-administration', image: '/images/pages/comp-layout-hero.jpg' },
  { title: 'CAD/Drafting', duration: '10 weeks', salary: '$63,419', href: '/programs/cad-drafting', image: '/images/pages/admin-design-hero.jpg' },
  { title: 'Graphic Design', duration: '10 weeks', salary: '$58,910', href: '/programs/graphic-design', image: '/images/pages/admin-media-hero.jpg' },
  { title: 'Project Management', duration: '8 weeks', salary: '$95,370', href: '/programs/project-management', image: '/images/pages/admin-projects-hero.jpg' },
  { title: 'Office Administration', duration: '6 weeks', salary: '$42,000', href: '/programs/office-administration', image: '/images/pages/technology-sector.jpg' },
];

const config: ProgramPageConfig = {
  pageKey: 'technology',
  title: 'Technology Programs', subtitle: 'IT Support, Cybersecurity, Web Development, and more. Industry certifications for high-demand tech careers.',
  badge: 'Funding Available', badgeColor: 'blue',
  duration: '6–12 weeks', cost: 'WorkOne funding available', format: 'In-person, Indianapolis', credential: 'CompTIA + Certiport + Meta',
  overview: 'Our technology programs prepare you for careers in IT support, cybersecurity, web development, software engineering, networking, and design. Every program includes industry-recognized certifications through CompTIA, Certiport, Meta, or Adobe. Training is hands-on in our computer labs with real-world projects.',
  highlights: ['Industry certifications from CompTIA, Certiport, Meta, Adobe', 'Hands-on training in equipped computer labs', 'Real-world projects for your portfolio', 'Job placement with tech employer partners', 'WorkOne funding available for eligible participants', 'DWD 4-Star and 5-Star Top Job programs'],
  overviewImage: '/images/pages/technology-sector.jpg', overviewImageAlt: 'Technology students working in a computer lab',
  salaryNumber: 78000, salaryLabel: 'Average salary across technology programs', salaryPrefix: '$',
  credentials: ['CompTIA A+', 'CompTIA Security+', 'CompTIA Network+', 'Meta Digital Marketing', 'Adobe Certified Professional', 'Certiport IT Specialist'],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Choose a Program', desc: 'Pick the tech career path that interests you.' },
    { title: 'Start Training', desc: 'Begin hands-on training and certification prep.' },
  ],
  applyHref: '/apply?program=technology',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Technology Programs' }],
};

export default function Page() {
  return (
    <ProgramPageLayout config={config}>
      <InView animation="fade-up">
        <section className="py-14 lg:py-20 border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Choose Your Path</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Technology Programs</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((p, i) => (
                <ScrollReveal key={p.title} delay={i * 60} direction="up">
                  <Link href={p.href} className="group block bg-white rounded-xl border-2 border-slate-200 hover:border-brand-red-400 hover:shadow-md transition-all overflow-hidden">
                    <Image src={p.image} alt={p.title} width={600} height={400} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{p.title}</span>
                        <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-50 px-2 py-1 rounded-full">{p.duration}</span>
                      </div>
                      <span className="text-sm text-brand-green-600 font-semibold">{p.salary}/yr avg</span>
                      <div className="mt-3 text-brand-red-600 font-semibold text-sm group-hover:underline">Learn More →</div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </InView>
    </ProgramPageLayout>
  );
}
