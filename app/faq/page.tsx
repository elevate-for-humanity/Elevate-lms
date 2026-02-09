import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { MessageSquare } from 'lucide-react';
import FAQSearch from './FAQSearch';

export const metadata: Metadata = {
  title: 'FAQ | Elevate For Humanity',
  description: 'Frequently asked questions about our free career training programs, eligibility, funding, and services.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/faq',
  },
};

export const dynamic = 'force-dynamic';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
}

export default async function FAQPage() {
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

  const { data: faqs, error } = await supabase
    .from('faqs')
    .select('id, question, answer, category, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const defaultFaqs: FAQ[] = [
    { id: '1', question: 'Is the training really free?', answer: 'Yes, for eligible participants. Federal and state workforce programs (WIOA, WRG, JRI) cover tuition, books, and supplies. Some programs like Barber Apprenticeship are self-pay with payment plans available.', category: 'Enrollment', display_order: 1 },
    { id: '2', question: 'How do I know if I qualify for free training?', answer: 'You likely qualify if you are unemployed, underemployed, receiving public assistance (SNAP, TANF, Medicaid), a veteran, or have household income below 200% of poverty level. Take our 2-minute eligibility check.', category: 'Enrollment', display_order: 2 },
    { id: '3', question: 'What programs do you offer?', answer: 'Healthcare (CNA, Medical Assistant, Phlebotomy), Skilled Trades (HVAC, Electrical, Welding), Technology (IT Support, Cybersecurity), CDL/Transportation, Beauty & Barbering, and Business programs.', category: 'Programs', display_order: 3 },
    { id: '4', question: 'How long are the programs?', answer: 'Most certification programs are 4-16 weeks. CDL training is 3-6 weeks. Apprenticeships like Barber are 12-18 months.', category: 'Programs', display_order: 4 },
    { id: '5', question: 'Do I need prior experience?', answer: 'Most programs require only a high school diploma or GED. No prior experience needed. We start from the basics.', category: 'Enrollment', display_order: 5 },
    { id: '6', question: 'What if I have a criminal record?', answer: 'We specialize in serving justice-involved individuals. Many programs are specifically designed for people with records. JRI funding covers training for eligible participants.', category: 'Eligibility', display_order: 6 },
    { id: '7', question: 'Do you help with job placement?', answer: 'Yes! Every program includes career services: resume writing, interview preparation, and direct connections to 50+ employer partners actively hiring our graduates.', category: 'Career Services', display_order: 7 },
    { id: '8', question: 'Where are you located?', answer: 'We are based in Indianapolis, Indiana (Marion County). Training locations vary by program. Some programs offer hybrid or online options.', category: 'General', display_order: 8 },
    { id: '9', question: 'How do I get started?', answer: 'Step 1: Check your eligibility (2 minutes). Step 2: Choose a program. Step 3: Complete the application. Step 4: Meet with an advisor. Most people start training within 2-4 weeks.', category: 'Enrollment', display_order: 9 },
    { id: '10', question: 'What certifications will I earn?', answer: 'Depends on your program. Examples: CNA, OSHA 10/30, CompTIA A+, CDL Class A, Phlebotomy, Medical Assistant, HVAC EPA 608, AWS Welding.', category: 'Programs', display_order: 10 },
    { id: '11', question: 'Can I work while in training?', answer: 'Yes, many students work part-time while in training. We offer flexible scheduling when possible to accommodate working adults.', category: 'Programs', display_order: 11 },
    { id: '12', question: 'What support services are available?', answer: 'Eligible participants may receive help with transportation, childcare, work supplies, and other supportive services through WIOA funding.', category: 'Support', display_order: 12 },
  ];

  const faqsToUse = (faqs && faqs.length > 0) ? faqs : defaultFaqs;

  // Group FAQs by category
  const categories = [...new Set(faqsToUse.map((faq: FAQ) => faq.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'FAQ' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-[400px] flex items-center overflow-hidden">
        <Image
          src="/images/heroes/training-provider-3.jpg"
          alt="Get answers to your questions"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 w-full">
          <div className="max-w-2xl bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-700 mb-6">
              Find answers to common questions about our free training programs, 
              eligibility requirements, funding options, and career services.
            </p>

          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/wioa-eligibility" className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium hover:bg-green-200 transition-colors">
              WIOA Eligibility
            </Link>
            <Link href="/funding" className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
              Funding Options
            </Link>
            <Link href="/programs" className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
              Training Programs
            </Link>
            <Link href="/how-it-works" className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors">
              How It Works
            </Link>
            <Link href="/contact" className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Category filters */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <a 
                key={cat} 
                href={`#${cat}`} 
                className="px-4 py-2 bg-white border rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 capitalize"
              >
                {cat}
              </a>
            ))}
          </div>
        )}

        {/* FAQ List with Search */}
        <FAQSearch faqs={faqsToUse} />

        {/* Contact CTA */}
        <div className="mt-12 bg-orange-50 rounded-xl p-8 text-center">
          <MessageSquare className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Still have questions?</h2>
          <p className="text-gray-600 mb-4">Our team is here to help you find the answers you need.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
