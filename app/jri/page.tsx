export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  Users,
  BookOpen,
  ArrowRight,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Clock,
  DollarSign,
  Phone,
  MapPin,
  PlayCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Job Ready Indy | Funded Career Training',
  description:
    'Indiana Job Ready Indy program provides funded career training for justice-involved individuals. Get certified in healthcare, skilled trades, and more.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/jri',
  },
};

export default function JRIPage() {
  const eligibilityRequirements = [
    'Currently on probation or parole in Indiana',
    'Within 2 years of release from incarceration',
    'Referred by a probation/parole officer or community corrections',
    'Committed to completing the full training program',
    'Willing to participate in wraparound support services',
    'Legally authorized to work in the United States',
  ];

  const programBenefits = [
    {
      title: 'Fully Funded Training',
      description:
        'Tuition, books, supplies, uniforms, and certification exams covered for eligible participants.',
      image: '/images/pages/funding-page-1.jpg',
      alt: 'Funded workforce training program',
    },
    {
      title: 'Career Counseling',
      description: 'Work one-on-one with a dedicated career coach who understands your situation.',
      image: '/images/pages/comp-pathway-classroom.webp',
      alt: 'One-on-one career counseling session',
    },
    {
      title: 'Job Placement',
      description: 'We connect you with employers committed to second-chance hiring.',
      image: '/images/pages/about-employer-partners.webp',
      alt: 'Job placement and employer connections',
    },
    {
      title: 'Support Services',
      description: 'Transportation, childcare support, work clothing, and more.',
      image: '/images/pages/comp-home-pathways-support.webp',
      alt: 'Supportive services for workforce participants',
    },
    {
      title: 'Flexible Scheduling',
      description: 'Day and evening classes to work around your commitments.',
      image: '/images/pages/comp-pathway-healthcare.webp',
      alt: 'Flexible day and evening class scheduling',
    },
    {
      title: 'Ongoing Mentorship',
      description: 'Stay connected with mentors even after graduation.',
      image: '/images/pages/mentorship-page-1.webp',
      alt: 'Ongoing mentorship after graduation',
    },
  ];

  const availablePrograms = [
    {
      name: 'Certified Nursing Assistant (CNA)',
      duration: '4-6 weeks',
      salary: '$32,000 - $42,000/year',
      description: 'Enter the healthcare field with state certification.',
    },
    {
      name: 'HVAC Technician',
      duration: '12-16 weeks',
      salary: '$40,000 - $65,000/year',
      description: 'Learn heating, ventilation, and air conditioning.',
    },
    {
      name: 'Commercial Driver License (CDL)',
      duration: '4-8 weeks',
      salary: '$45,000 - $75,000/year',
      description: 'Get your Class A CDL and start a trucking career.',
    },
    {
      name: 'Barber Apprenticeship',
      duration: '12-18 months',
      salary: '$30,000 - $60,000/year',
      description: 'Earn while you learn toward your Indiana barber license.',
    },
    {
      name: 'Welding Certification',
      duration: '10-14 weeks',
      salary: '$38,000 - $55,000/year',
      description: 'Learn MIG, TIG, and stick welding techniques.',
    },
    {
      name: 'Forklift & Warehouse',
      duration: '2-4 weeks',
      salary: '$32,000 - $45,000/year',
      description: 'Quick certification with immediate job opportunities.',
    },
  ];

  const stats = [
    { value: 'Funded', label: 'Training Available', icon: GraduationCap },
    { value: '85%', label: 'Placement Goal', icon: Briefcase },
    { value: '6+', label: 'Career Programs', icon: TrendingUp },
    { value: '24/7', label: 'Support', icon: Users },
  ];

  return (
    <div className="bg-white">
      {' '}
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[{ label: 'Funding', href: '/funding' }, { label: 'Job Ready Indy' }]}
          />
        </div>
      </div>
      {/* Hero Section */}
      <section className="relative min-h-48 md:h-64 flex items-center overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src="/images/pages/jri-hero.webp"
          alt="Job Ready Indy Program participants"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" placeholder="empty"
        />
      </section>
      {/* Stats Section */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <IconComponent className="w-8 h-8 text-brand-green-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-slate-500 text-sm">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* What is Job Ready Indy */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">What is the Job Ready Indy?</h2>
            <p className="text-lg text-slate-600">
              Job Ready Indy is an Indiana state-funded program designed to reduce recidivism by
              investing in workforce training and support services. Instead of cycling people back
              through the criminal justice system, Job Ready Indy helps build sustainable careers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programBenefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <div className="relative w-full aspect-[4/3]" style={{ aspectRatio: '16/10' }}>
                  <Image
                    src={benefit.image}
                    alt={benefit.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" placeholder="empty"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{benefit.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Eligibility */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Do You Qualify for Job Ready Indy?
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Job Ready Indy funding is available to Indiana residents who meet the following
                criteria.
              </p>

              <ul className="space-y-4">
                {eligibilityRequirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-slate-700">{req}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> Even if you don&apos;t meet all criteria, you may qualify
                  for other funding programs like WIOA or SNAP E&T.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Check Your Eligibility</h3>
              <p className="text-slate-600 mb-6">
                Not sure if you qualify? Our team can help determine your eligibility.
              </p>
              <div className="space-y-4">
                <Link
                  href="/apply?funding=jri"
                  className="block w-full bg-brand-green-600 text-white text-center px-6 py-4 rounded-lg font-semibold hover:bg-brand-green-700 transition"
                >
                  Start Your Application
                </Link>
                <a
                  href="/support"
                  className="block w-full border-2 border-slate-300 text-slate-700 text-center px-6 py-4 rounded-lg font-semibold hover:bg-white transition"
                >
                  Contact Us: {PLATFORM_DEFAULTS.supportPhone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Available Programs */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Job Ready Indy-Approved Training Programs
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Choose from high-demand career paths. All programs are fully funded through Job Ready
              Indy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePrograms.map((program, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-brand-green-600" />
                  <span className="text-xs text-brand-green-600 font-semibold uppercase">
                    Job Ready Indy Approved
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{program.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{program.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs bg-white text-slate-700 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" />
                    {program.duration}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs bg-brand-green-100 text-brand-green-700 px-2 py-1 rounded">
                    <DollarSign className="w-3 h-3" />
                    {program.salary}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 text-brand-green-600 font-semibold hover:underline"
            >
              View All Programs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
      {/* Online Training Modules */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Online Training Modules
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Supplement your hands-on training with self-paced online modules. Available to all
              enrolled Job Ready Indy participants through the Elevate learning portal.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {[
              {
                title: 'Workplace Safety Fundamentals',
                description: 'OSHA 10 concepts, hazard recognition, and personal protective equipment for skilled trades environments.',
                duration: '2 hours',
                badge: 'Safety',
                badgeColor: 'bg-orange-100 text-orange-700',
              },
              {
                title: 'Professional Readiness',
                description: 'Resume writing, interview skills, workplace communication, and professional conduct for new employees.',
                duration: '3 hours',
                badge: 'Career Skills',
                badgeColor: 'bg-brand-blue-100 text-brand-blue-700',
              },
              {
                title: 'Financial Literacy for Workers',
                description: 'Budgeting, banking basics, understanding your paycheck, and building credit after incarceration.',
                duration: '2.5 hours',
                badge: 'Financial',
                badgeColor: 'bg-brand-green-100 text-brand-green-700',
              },
              {
                title: 'Healthcare Infection Control',
                description: 'Hand hygiene, PPE use, and standard precautions for CNA and healthcare support roles.',
                duration: '1.5 hours',
                badge: 'Healthcare',
                badgeColor: 'bg-red-100 text-red-700',
              },
              {
                title: 'HVAC Safety & EPA Basics',
                description: 'Refrigerant handling, electrical safety, and EPA 608 exam preparation overview.',
                duration: '2 hours',
                badge: 'Skilled Trades',
                badgeColor: 'bg-yellow-100 text-yellow-700',
              },
              {
                title: 'Digital Skills for the Workplace',
                description: 'Email, scheduling apps, time-tracking software, and basic computer skills for modern workplaces.',
                duration: '2 hours',
                badge: 'Technology',
                badgeColor: 'bg-purple-100 text-purple-700',
              },
            ].map((module, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-center gap-2 mb-3">
                  <PlayCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${module.badgeColor}`}>
                    {module.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{module.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{module.description}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {module.duration}
                  </span>
                  <span className="text-xs text-slate-400 italic">Login required</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-slate-600 mb-4 text-sm">
              Enrolled participants access all modules through the Elevate learning portal.
            </p>
            <Link
              href="/lms/scorm"
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              <PlayCircle className="w-5 h-5" />
              Access Online Modules
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Job Ready Indy Program FAQ
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'What is Job Ready Indy funding?',
                a: 'Job Ready Indy is Indiana state funding that provides free career training to justice-involved individuals. It covers tuition, materials, certifications, and supportive services.',
              },
              {
                q: 'Do I qualify if I have a felony?',
                a: 'Yes. Job Ready Indy is specifically designed for people with criminal records, including felonies. Your conviction type does not automatically disqualify you.',
              },
              {
                q: 'How recent does my involvement need to be?',
                a: 'Generally, you should have been released from incarceration or supervision within the past 3 years. Contact us to discuss your specific situation.',
              },
              {
                q: 'What programs can I use Job Ready Indy for?',
                a: 'Job Ready Indy covers approved training programs including healthcare (CNA), skilled trades (HVAC, welding), technology, CDL, and more. See the list above for current options.',
              },
              {
                q: 'Is Job Ready Indy really free?',
                a: 'Yes. Job Ready Indy covers 100% of training costs for eligible participants. There are no hidden fees or repayment requirements.',
              },
              {
                q: 'How long does the application take?',
                a: "The initial application takes about 10 minutes. Eligibility verification typically takes 1-2 weeks. You can start training as soon as you're approved.",
              },
              {
                q: "What if I don't qualify for Job Ready Indy?",
                a: 'You may still qualify for other funding programs like WIOA or SNAP E&T. Our team will help identify all available options for you.',
              },
              {
                q: 'Will employers hire me with a record?',
                a: 'Yes. Many employers actively hire our graduates. We work with employers who believe in second chances and understand the value of trained, motivated workers.',
              },
            ].map((faq, i) => (
              <details key={i} className="bg-white rounded-xl overflow-hidden shadow-sm group">
                <summary className="p-5 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                  {faq.q}
                  <svg
                    className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-slate-600">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to Start Your New Chapter?
          </h2>
          <p className="text-xl text-white mb-8">
            Your past does not define your future. Take the first step today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply?funding=jri"
              className="inline-flex items-center justify-center bg-white text-brand-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-white transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-green-700 transition"
            >
              <Phone className="mr-2 w-5 h-5" />
              {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </div>
          <p className="text-white text-sm mt-6">
            <MapPin className="w-4 h-4 inline mr-1" />
            Serving Indianapolis and surrounding Indiana counties
          </p>
        </div>
      </section>
    </div>
  );
}
