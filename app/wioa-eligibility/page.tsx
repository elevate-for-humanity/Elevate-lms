import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DollarSign, Home, Users, Briefcase, ArrowRight, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/wioa-eligibility',
  },
  title: 'WIOA Eligibility Requirements | Elevate For Humanity',
  description:
    'Check if you qualify for funded career training through WIOA. Learn about eligibility requirements and how to apply.',
  openGraph: {
    title: 'WIOA Eligibility - Funded Career Training',
    description: 'Check if you qualify for funded career training through WIOA.',
    url: 'https://www.elevateforhumanity.org/wioa-eligibility',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'WIOA Eligibility' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WIOA Eligibility - Funded Career Training',
    description: 'Check if you qualify for funded career training through WIOA.',
    images: ['/og-default.jpg'],
  },
};

export const dynamic = 'force-dynamic';

export default async function WIOAEligibilityPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get eligibility criteria from database
  const { data: eligibilityCriteria } = await supabase
    .from('eligibility_criteria')
    .select('*')
    .eq('funding_type', 'WIOA')
    .eq('is_active', true)
    .order('order', { ascending: true });

  // Get FAQs about WIOA
  const { data: faqs } = await supabase
    .from('faqs')
    .select('*')
    .eq('category', 'wioa')
    .eq('is_active', true)
    .order('order', { ascending: true });

  // Get programs that accept WIOA funding
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name, slug, description')
    .eq('is_active', true)
    .eq('accepts_wioa', true)
    .limit(6);

  const defaultCriteria = [
    {
      title: 'Adults (18+)',
      description: 'You must be 18 years or older and legally authorized to work in the United States.',
      icon: Users,
      image: '/images/testimonials-hq/person-5.jpg',
    },
    {
      title: 'Indiana Resident',
      description: 'You must be a resident of Indiana to qualify for state WIOA funding.',
      icon: Home,
      image: '/images/heroes-hq/about-hero.jpg',
    },
    {
      title: 'Employment Status',
      description: 'Unemployed, underemployed, or seeking better employment opportunities.',
      icon: Briefcase,
      image: '/images/heroes-hq/career-services-hero.jpg',
    },
    {
      title: 'Income Guidelines',
      description: 'Meet income requirements based on household size (most working families qualify).',
      icon: DollarSign,
      image: '/images/heroes-hq/funding-hero.jpg',
    },
  ];

  const displayCriteria = eligibilityCriteria && eligibilityCriteria.length > 0 
    ? eligibilityCriteria 
    : defaultCriteria;

  const priorityGroups = [
    'Veterans and eligible spouses',
    'Recipients of public assistance (SNAP, TANF, SSI)',
    'Low-income individuals',
    'Basic skills deficient individuals',
    'Individuals with disabilities',
    'Ex-offenders',
    'Homeless individuals',
    'Youth aging out of foster care',
    'English language learners',
    'Long-term unemployed (27+ weeks)',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'WIOA Eligibility' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[350px] flex items-center justify-center">
        <Image
          src="/images/heroes-hq/funding-hero.jpg"
          alt="WIOA Eligibility"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">WIOA Eligibility</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">Free career training funded by the Workforce Innovation and Opportunity Act</p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-6 bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/funding" className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium hover:bg-green-200 transition-colors">
              All Funding Options
            </Link>
            <Link href="/financial-aid" className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
              Financial Aid
            </Link>
            <Link href="/jri" className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
              JRI Programs
            </Link>
            <Link href="/how-it-works" className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors">
              How It Works
            </Link>
            <Link href="/programs" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors">
              View Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section id="eligibility" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-green-50 border-l-4 border-green-600 p-8 mb-12 rounded-r-xl shadow-sm">
            <h2 className="text-2xl font-black text-green-900 mb-2">
              Good News!
            </h2>
            <p className="text-lg text-gray-700">
              Most people qualify for WIOA funding. If you&apos;re looking to start a
              new career or upgrade your skills, you likely qualify.
            </p>
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-black mb-8">
            Who Qualifies for WIOA?
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {displayCriteria.map((criteria: any, index: number) => {
              return (
                <div 
                  key={index} 
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-40">
                    <Image
                      src={criteria.image || '/images/testimonials-hq/person-5.jpg'}
                      alt={criteria.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      {criteria.title}
                    </h3>
                    <p className="text-gray-600">{criteria.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Priority Groups */}
          <div className="bg-blue-50 rounded-xl p-8 mb-12">
            <h3 className="text-2xl font-bold mb-6">Priority Service Groups</h3>
            <p className="text-gray-600 mb-6">
              The following groups receive priority for WIOA services:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {priorityGroups.map((group, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700">{group}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Programs */}
          {programs && programs.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6">WIOA-Approved Programs</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {programs.map((program: any) => (
                  <Link
                    key={program.id}
                    href={`/programs/${program.slug || program.id}`}
                    className="bg-white border rounded-lg p-4 hover:shadow-md transition"
                  >
                    <h4 className="font-semibold">{program.name}</h4>
                    {program.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{program.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {(faqs && faqs.length > 0 ? faqs : [
                { id: 1, question: 'What is WIOA?', answer: 'The Workforce Innovation and Opportunity Act (WIOA) is a federal program that provides funding for job training and employment services. It helps adults, dislocated workers, and youth access career training at no cost.' },
                { id: 2, question: 'How do I know if I qualify?', answer: 'You likely qualify if you are unemployed, underemployed, receiving public assistance (SNAP, TANF, Medicaid), a veteran, or have household income below 200% of poverty level. Take our eligibility check or contact us.' },
                { id: 3, question: 'What does WIOA cover?', answer: 'WIOA can cover tuition, books, supplies, certification exam fees, and even supportive services like transportation and childcare assistance for eligible participants.' },
                { id: 4, question: 'How long does the application process take?', answer: 'The eligibility determination typically takes 1-2 weeks. You will work with a WorkOne case manager who will verify your eligibility and help you enroll in training.' },
                { id: 5, question: 'Can I work while receiving WIOA training?', answer: 'Yes, you can work while in training. WIOA is designed to help you gain skills for better employment, whether you are currently employed or not.' },
                { id: 6, question: 'What if I have a criminal record?', answer: 'A criminal record does not automatically disqualify you from WIOA. Many programs specifically serve justice-involved individuals. JRI funding may also be available.' },
                { id: 7, question: 'Do I have to pay anything back?', answer: 'No. WIOA funding is not a loan. You do not have to pay anything back. It is a grant program designed to help you gain employment skills.' },
                { id: 8, question: 'What programs can I use WIOA for?', answer: 'WIOA can be used for approved training programs including healthcare, skilled trades, technology, CDL, and more. Check with us for current approved programs.' },
              ]).map((faq: any) => (
                <details key={faq.id} className="bg-white rounded-lg border overflow-hidden group">
                  <summary className="p-6 cursor-pointer font-semibold flex justify-between items-center">
                    {faq.question}
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6 text-gray-600">{faq.answer}</div>
                </details>
              ))}
            </div>
          </div>

          {/* CTA Form */}
          <div id="form" className="bg-white rounded-2xl shadow-lg p-8 border-2 border-green-500">
            <h3 className="text-2xl font-bold text-center mb-4">
              Check Your Eligibility
            </h3>
            <p className="text-gray-600 text-center mb-8">
              Not sure if you qualify? Apply and we'll help determine your eligibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/apply"
                className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition text-center"
              >
                Apply for Funded Training
              </Link>
              <a
                href="tel:3173143757"
                className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-50 transition text-center"
              >
                Call (317) 314-3757
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Other Funding Options */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            Other Funding Options
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Don't qualify for WIOA? You may be eligible for other funding programs:
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/wioa-eligibility/veterans" className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition">
              <h3 className="font-bold mb-2">Veterans Benefits</h3>
              <p className="text-sm text-gray-600">GI Bill and veteran-specific training programs</p>
            </Link>
            <Link href="/wioa-eligibility/public-assistance" className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition">
              <h3 className="font-bold mb-2">Public Assistance</h3>
              <p className="text-sm text-gray-600">SNAP, TANF, and other assistance recipients</p>
            </Link>
            <Link href="/wioa-eligibility/low-income" className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition">
              <h3 className="font-bold mb-2">Low Income</h3>
              <p className="text-sm text-gray-600">Income-based eligibility guidelines</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
