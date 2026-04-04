import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
import { InView } from '@/components/ui/InView';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import SponsorDisclosure from '@/components/compliance/SponsorDisclosure';

export const dynamic = 'force-static';
export const revalidate = 86400;
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Apprenticeship Programs | Earn While You Learn | Indianapolis',
  description: 'DOL-registered apprenticeships in Barber, Cosmetology, Nail Technician, and Culinary. Earn while you learn with on-the-job training.',
  alternates: { canonical: `${SITE_URL}/programs/apprenticeships` },
  openGraph: {
    title: 'Apprenticeship Programs | Earn While You Learn | Indianapolis',
    description: 'DOL-registered apprenticeships in Barber, Cosmetology, Nail Technician, and Culinary. Earn while you learn with on-the-job training.',
    url: `${SITE_URL}/programs/apprenticeships`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Apprenticeship Programs | Earn While You Learn | Indianapolis' }],
    type: 'website',
  },
};

const programs = [
  { title: 'Barber Apprenticeship', duration: '12–18 months', desc: '2,000 hours of OJT in licensed barbershops. Indiana Barber License pathway.', href: '/programs/barber-apprenticeship', image: '/images/pages/barber-gallery-1.jpg' },
  { title: 'Cosmetology Apprenticeship', duration: '18 months', desc: 'Hands-on salon training. Indiana Cosmetology License pathway.', href: '/programs/cosmetology-apprenticeship', image: '/images/pages/barber-gallery-2.jpg' },
  { title: 'Nail Technician', duration: '6–9 months', desc: 'Manicure, pedicure, gel, acrylic. Indiana Manicurist License pathway.', href: '/programs/nail-technician-apprenticeship', image: '/images/pages/barber-gallery-3.jpg' },
  { title: 'Culinary Apprenticeship', duration: '12 months', desc: 'Professional kitchen training. ServSafe certification.', href: '/programs/culinary-apprenticeship', image: '/images/pages/admin-cafeteria-hero.jpg' },
];

const config: ProgramPageConfig = {
  pageKey: 'apprenticeships',
  title: 'Apprenticeship Programs', subtitle: 'Earn while you learn. On-the-job training in licensed shops and professional kitchens.',
  badge: 'Earn While You Learn', badgeColor: 'red',
  duration: '6–18 months', cost: 'Varies by program', format: 'OJT + classroom, Indianapolis', credential: 'State Licensure Pathway',
  overview: 'Our apprenticeship programs combine on-the-job training with structured classroom instruction. You work with real clients and customers from day one under the supervision of licensed professionals. Apprenticeships are the fastest path to licensure in barber, cosmetology, and culinary careers.',
  highlights: ['Paid on-the-job training from day one', 'Work with real clients under supervision', 'DOL-registered apprenticeship structure', 'State licensure exam preparation', 'Payment plans available for self-pay programs', 'Job Ready Indy funding available for eligible participants'],
  overviewImage: '/images/pages/comp-program-template.jpg', overviewImageAlt: 'Apprentice working with a client',
  salaryNumber: 40000, salaryLabel: 'Average starting salary across apprenticeship programs', salaryPrefix: '$',
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Interview', desc: 'Meet with program staff and tour partner locations.' },
    { title: 'Enroll', desc: 'Payment plans available for self-pay programs.' },
    { title: 'Start Training', desc: 'Begin your apprenticeship at a partner location.' },
  ],
  faqs: [
    { question: 'Do I get paid during the apprenticeship?', answer: 'Compensation varies by program and partner location. Barber and cosmetology apprentices may earn tips and commission. Culinary apprentices are typically paid hourly. Details are discussed during your interview.' },
    { question: 'What if I have a criminal record?', answer: 'We specialize in serving justice-involved individuals. Many apprenticeship participants are funded through Job Ready Indy. Having a record does not automatically disqualify you.' },
    { question: 'How is an apprenticeship different from school?', answer: 'Traditional schools are mostly classroom-based. Apprenticeships put you in a real work environment from day one. You learn by doing, not just watching.' },
  ],
  applyHref: '/apply?program=apprenticeship',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Apprenticeships' }],
};

export default function Page() {
  return (
    <ProgramPageLayout config={config}>
      <div className="max-w-5xl mx-auto px-6">
        <SponsorDisclosure />
      </div>
      <InView animation="fade-up">
        <section className="py-14 lg:py-20 border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Choose Your Path</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Apprenticeship Programs</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {programs.map((p, i) => (
                <ScrollReveal key={p.title} delay={i * 80} direction="up">
                  <div className="flex flex-col bg-white rounded-xl border-2 border-slate-200 hover:shadow-md transition-all overflow-hidden">
                    <Image src={p.image} alt={p.title} width={600} height={400} className="w-full h-44 object-cover"  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg text-slate-900">{p.title}</span>
                        <span className="text-xs font-semibold text-brand-red-600 bg-brand-red-50 px-2 py-1 rounded-full">{p.duration}</span>
                      </div>
                      <span className="text-sm text-black mb-4 flex-1">{p.desc}</span>
                      <Link href={p.href} className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand-blue-700 transition-colors self-start">
                        Learn More
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </InView>
    </ProgramPageLayout>
  );
}
