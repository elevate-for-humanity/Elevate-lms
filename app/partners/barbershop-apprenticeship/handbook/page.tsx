import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  BookOpen, Shield, Clock, Users, AlertTriangle, Phone,
  CheckCircle2, FileText, Scale, Heart, ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partner Handbook | Barbershop Apprenticeship',
  description: 'Responsibilities, policies, and guidelines for barbershop apprenticeship worksite partners.',
};

const sectionPhotos: Record<string, { src: string; alt: string }> = {
  role: { src: '/images/pages/barber-gallery-1.jpg', alt: 'Barber mentoring apprentice' },
  compensation: { src: '/images/pages/barber-gallery-1.jpg', alt: 'Barber tools and station' },
  hours: { src: '/images/pages/barber-gallery-1.jpg', alt: 'Barber cutting hair' },
  competencies: { src: '/images/pages/barber-gallery-1.jpg', alt: 'Barber performing fade cut' },
  safety: { src: '/images/pages/barber-gallery-1.jpg', alt: 'Clean barbershop interior' },
  communication: { src: '/images/pages/barber-gallery-1.jpg', alt: 'Barbershop team' },
  prohibited: { src: '/images/pages/barber-gallery-1.jpg', alt: 'Professional barbershop' },
  termination: { src: '/images/pages/barber-gallery-1.jpg', alt: 'Barbershop workspace' },
};

const sections = [
  {
    id: 'role',
    icon: Users,
    title: 'Your Role as a Worksite Partner',
    content: [
      'As a worksite partner, you provide the hands-on training environment where apprentices develop real-world barbering skills under direct supervision.',
      'You are not just an employer — you are a mentor and trainer. The quality of the apprentice\'s experience depends on the structure and support you provide.',
    ],
    items: [
      'Provide direct supervision by a licensed barber at all times',
      'Ensure the supervising barber has at least 2 years of licensed experience',
      'Allow apprentices to practice all required competencies progressively',
      'Maintain a professional, safe, and inclusive work environment',
      'Support apprentice attendance at Related Technical Instruction (RTI)',
    ],
  },
  {
    id: 'compensation',
    icon: Scale,
    title: 'Compensation Requirements',
    content: [
      'Apprentices are paid employees. This is not unpaid labor. All compensation must comply with federal and Indiana wage laws. Indiana minimum wage is $7.25/hour (federal rate applies).',
    ],
    items: [
      'Hourly Wage — $10.00–$15.00/hour base rate (recommended starting range)',
      'Commission — 30%–50% of services performed by the apprentice (must average at least $7.25/hour per pay period)',
      'Hybrid — $8.00–$10.00/hour base + 15%–25% commission on services',
      'Tip Policy — Apprentices keep 100% of tips earned from their clients',
      'Pay Frequency — Biweekly or semi-monthly, with itemized pay stubs',
      'Workers\' compensation insurance coverage is required for all apprentices',
    ],
  },
  {
    id: 'hours',
    icon: Clock,
    title: 'Hour Tracking & Verification',
    content: [
      'The apprenticeship requires 2,000 hours of on-the-job training. Accurate tracking is essential for program compliance and apprentice certification.',
    ],
    items: [
      'Track all hours worked daily using the Elevate LMS platform or provided timesheets',
      'Verify and sign off on hours weekly',
      'Submit hour verification reports as requested by the Sponsor',
      'Report any discrepancies or missed time promptly',
      'Do not allow apprentices to work unsupervised hours',
    ],
  },
  {
    id: 'competencies',
    icon: CheckCircle2,
    title: 'Competency Development',
    content: [
      'Apprentices must demonstrate proficiency in specific barbering competencies. You are responsible for providing opportunities to practice and for verifying skill development.',
    ],
    items: [
      'Clipper cuts and fades (various guard lengths)',
      'Scissor cuts and texturizing',
      'Beard trimming and shaping',
      'Hot towel shaves and facial grooming',
      'Sanitation and disinfection procedures',
      'Client consultation and communication',
      'Product knowledge and recommendations',
      'Shop management and business operations',
    ],
  },
  {
    id: 'safety',
    icon: Shield,
    title: 'Workplace Safety & Compliance',
    content: [
      'You must maintain a safe workplace that complies with all applicable health, safety, and licensing regulations.',
    ],
    items: [
      'Maintain a valid Indiana barbershop license in good standing',
      'Follow all Indiana State Board of Barber Examiners regulations',
      'Ensure proper sanitation and disinfection of all tools and stations',
      'Maintain adequate liability and workers\' compensation insurance',
      'Provide a harassment-free and discrimination-free workplace',
      'Report any workplace injuries or incidents immediately',
    ],
  },
  {
    id: 'communication',
    icon: Phone,
    title: 'Communication & Reporting',
    content: [
      'Open communication with the Sponsor (Elevate for Humanity) is essential for program success.',
    ],
    items: [
      'Respond to Sponsor inquiries within 2 business days',
      'Notify the Sponsor immediately of any issues with the apprentice',
      'Allow scheduled site visits for quality assurance',
      'Participate in quarterly check-in calls or meetings',
      'Report any changes to shop ownership, licensing, or insurance',
    ],
  },
  {
    id: 'prohibited',
    icon: AlertTriangle,
    title: 'Prohibited Practices',
    content: [
      'The following practices are strictly prohibited and may result in immediate termination of the partnership:',
    ],
    items: [
      'Requiring apprentices to work without pay or below minimum wage',
      'Allowing unsupervised work by apprentices',
      'Falsifying hour records or competency sign-offs',
      'Discrimination or harassment of any kind',
      'Requiring apprentices to perform non-barbering duties (cleaning, reception) as primary work',
      'Withholding tips earned by the apprentice',
      'Retaliating against apprentices who report concerns to the Sponsor',
    ],
  },
  {
    id: 'termination',
    icon: FileText,
    title: 'Termination & Reassignment',
    content: [
      'Either party may terminate the MOU with 14 days written notice. The Sponsor may terminate immediately for serious violations.',
    ],
    items: [
      'If you need to end the partnership, notify the Sponsor in writing',
      'The Sponsor will work to reassign the apprentice to another approved shop',
      'All outstanding hours and compensation must be settled upon termination',
      'Return any Sponsor-provided materials or equipment',
      'Termination does not affect the apprentice\'s standing in the program',
    ],
  },
];

export default function PartnerHandbookPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Partners', href: '/partners/barbershop-apprenticeship' },
          { label: 'Handbook' },
        ]} />
      </div>

      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <Image
          src="/images/pages/partners-pub-page-3.jpg"
          alt="Barber training session"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/40" />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 text-brand-blue-700 mb-3">
            <BookOpen className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Partner Resource</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Partner Handbook</h1>
          <p className="text-xl text-gray-700 max-w-3xl">
            Everything you need to know about your responsibilities, policies, and guidelines
            as a barbershop apprenticeship worksite partner.
          </p>
        </div>
      </section>

      {/* Table of Contents */}
      <nav className="bg-slate-50 border-b py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Contents</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sections.map((s) => {
              const photo = sectionPhotos[s.id];
              return (
                <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-brand-blue-600 py-1 group">
                  {photo ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <Image src={photo.src} alt={photo.alt} fill className="object-cover group-hover:scale-110 transition-transform" sizes="32px" />
                    </div>
                  ) : (
                    <s.icon className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{s.title.replace('Your Role as a Worksite Partner', 'Your Role')}</span>
                </a>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Photo Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
        <div className="relative h-48">
          <Image src="/images/pages/barber-cutting.jpg" alt="Barber cutting hair" fill className="object-cover" sizes="25vw" />
        </div>
        <div className="relative h-48">
          <Image src="/images/pages/barber-fade.jpg" alt="Barber performing fade" fill className="object-cover" sizes="25vw" />
        </div>
        <div className="relative h-48">
          <Image src="/images/pages/barber-shop-interior.jpg" alt="Barbershop interior" fill className="object-cover" sizes="25vw" />
        </div>
        <div className="relative h-48">
          <Image src="/images/pages/barber-tools.jpg" alt="Barber tools and equipment" fill className="object-cover" sizes="25vw" />
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        {sections.map((section, idx) => {
          const photo = sectionPhotos[section.id];
          return (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              {/* Section photo */}
              {photo && (
                <div className="relative w-full h-48 rounded-xl overflow-hidden mb-6 ring-1 ring-gray-200">
                  <Image src={photo.src} alt={photo.alt} fill className="object-cover brightness-[1.05]" sizes="(max-width: 768px) 100vw, 800px" />
                  <div className="absolute bottom-4 left-4">
                    <span className="text-gray-700 text-sm font-semibold bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                      {idx + 1} of {sections.length}
                    </span>
                  </div>
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {idx + 1}. {section.title}
              </h2>
              {section.content.map((p, i) => (
                <p key={i} className="text-gray-600 mb-4 leading-relaxed">{p}</p>
              ))}
              <ul className="mt-4 space-y-2 pl-1">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700 text-[15px] leading-relaxed">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {/* Emergency Contact */}
        <section className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Heart className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-red-900">Emergency & Urgent Issues</h2>
          </div>
          <p className="text-red-800 mb-4">
            For urgent matters involving apprentice safety, workplace incidents, or serious
            policy violations, contact us immediately:
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="tel:+13173143757" className="inline-flex items-center gap-2 text-red-700 font-semibold">
              <Phone className="w-4 h-4" /> (317) 314-3757
            </a>
            <a href="mailto:apprenticeships@elevateforhumanity.org" className="inline-flex items-center gap-2 text-red-700 font-semibold">
              apprenticeships@elevateforhumanity.org
            </a>
          </div>
        </section>

        {/* Next Steps */}
        <section className="bg-brand-blue-50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6">
            Review and sign the MOU, complete the required forms, then submit your application.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/partners/barbershop-apprenticeship/apply"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700"
            >
              Apply Now
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/partners/barbershop-apprenticeship/sign-mou"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
            >
              <FileText className="w-5 h-5" />
              Sign the MOU
            </Link>
            <Link
              href="/partners/barbershop-apprenticeship/forms"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
            >
              Required Forms
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
