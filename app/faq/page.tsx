import { Metadata } from 'next';
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

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
}

export default function FAQPage() {
  const faqs: FAQ[] = [
    // Enrollment
    { id: '1', question: 'Is the training really free?', answer: 'Yes, for eligible participants. Federal and state workforce programs (WIOA, WRG, JRI) cover tuition, books, and supplies. Some programs like Barber Apprenticeship are self-pay with payment plans available.', category: 'Enrollment', display_order: 1 },
    { id: '2', question: 'How do I know if I qualify for free training?', answer: 'You likely qualify if you are unemployed, underemployed, receiving public assistance (SNAP, TANF, Medicaid), a veteran, or have household income below 200% of poverty level. Take our 2-minute eligibility check.', category: 'Enrollment', display_order: 2 },
    { id: '5', question: 'Do I need prior experience?', answer: 'Most programs require only a high school diploma or GED. No prior experience needed. We start from the basics.', category: 'Enrollment', display_order: 3 },
    { id: '9', question: 'How do I get started?', answer: 'Step 1: Check your eligibility (2 minutes). Step 2: Choose a program. Step 3: Complete the application. Step 4: Meet with an advisor. Most people start training within 2-4 weeks.', category: 'Enrollment', display_order: 4 },
    { id: '13', question: 'What documents do I need to enroll?', answer: 'Bring a valid government-issued photo ID, Social Security card, proof of address (utility bill or lease), and your high school diploma or GED. For WIOA funding, you may also need proof of income or public assistance documentation.', category: 'Enrollment', display_order: 5 },
    { id: '14', question: 'Is there an age requirement?', answer: 'Most programs require participants to be at least 18 years old. Some youth programs are available for ages 16-24 through WIOA Youth funding. Contact us for details.', category: 'Enrollment', display_order: 6 },
    // Programs
    { id: '3', question: 'What programs do you offer?', answer: 'Healthcare (CNA, Medical Assistant, Phlebotomy), Skilled Trades (HVAC, Electrical, Welding), Technology (IT Support, Cybersecurity), CDL/Transportation, Beauty & Barbering, and Business programs.', category: 'Programs', display_order: 7 },
    { id: '4', question: 'How long are the programs?', answer: 'Most certification programs are 4-16 weeks. CDL training is 3-6 weeks. Apprenticeships like Barber are 12-18 months.', category: 'Programs', display_order: 8 },
    { id: '10', question: 'What certifications will I earn?', answer: 'Depends on your program. Examples: CNA, OSHA 10/30, CompTIA A+, CDL Class A, Phlebotomy, Medical Assistant, HVAC EPA 608, AWS Welding.', category: 'Programs', display_order: 9 },
    { id: '11', question: 'Can I work while in training?', answer: 'Yes, many students work part-time while in training. We offer flexible scheduling when possible to accommodate working adults.', category: 'Programs', display_order: 10 },
    { id: '15', question: 'What are the class hours?', answer: 'Class schedules vary by program. Most daytime programs run Monday-Friday, 8:00 AM to 3:00 PM. Some programs offer evening or weekend options. Check your specific program page for exact hours.', category: 'Programs', display_order: 11 },
    { id: '16', question: 'Is there a dress code?', answer: 'Yes. Professional attire or program-specific uniforms are required. Healthcare students need scrubs and closed-toe shoes. Skilled trades students need steel-toe boots and safety glasses. Barber/cosmetology students need all-black attire. Specific requirements are provided at orientation.', category: 'Programs', display_order: 12 },
    // Eligibility
    { id: '6', question: 'What if I have a criminal record?', answer: 'We specialize in serving justice-involved individuals. Many programs are specifically designed for people with records. JRI funding covers training for eligible participants.', category: 'Eligibility', display_order: 13 },
    { id: '17', question: 'Is there a drug test required?', answer: 'Some employer partners and clinical sites require drug screening as a condition of placement. Healthcare programs (CNA, Medical Assistant, Phlebotomy) typically require a drug test before clinical rotations. CDL programs require DOT drug testing. We will inform you of any requirements during enrollment.', category: 'Eligibility', display_order: 14 },
    { id: '18', question: 'Do I need a background check?', answer: 'Some programs require background checks, particularly healthcare and CDL. Having a record does not automatically disqualify you — many of our programs are designed for justice-involved individuals. We review each situation individually and help you understand which programs are the best fit.', category: 'Eligibility', display_order: 15 },
    { id: '19', question: 'Can non-U.S. citizens enroll?', answer: 'WIOA-funded programs require U.S. citizenship or eligible immigration status with work authorization. Self-pay programs may have different requirements. Contact us to discuss your specific situation.', category: 'Eligibility', display_order: 16 },
    // Career Services
    { id: '7', question: 'Do you help with job placement?', answer: 'Yes! Every program includes career services: resume writing, interview preparation, and direct connections to 50+ employer partners actively hiring our graduates.', category: 'Career Services', display_order: 17 },
    { id: '20', question: 'What is the job placement rate?', answer: 'Our placement goal is 85% within 90 days of program completion. Actual rates vary by program, cohort size, and market conditions. We provide career services including resume support, interview prep, and employer introductions to every graduate.', category: 'Career Services', display_order: 18 },
    { id: '21', question: 'What salary can I expect after training?', answer: 'Starting salaries vary by field. CNA: $15-$20/hr. Medical Assistant: $16-$22/hr. CDL Driver: $50,000-$75,000/yr. HVAC Technician: $18-$28/hr. Barber: $30,000-$60,000/yr depending on clientele. See individual program pages for detailed salary ranges.', category: 'Career Services', display_order: 19 },
    // General / Logistics
    { id: '8', question: 'Where are you located?', answer: 'We are based in Indianapolis, Indiana (Marion County). Training locations vary by program. Some programs offer hybrid or online options.', category: 'General', display_order: 20 },
    { id: '22', question: 'Is parking available?', answer: 'Yes, free parking is available at all training locations. Specific parking instructions are provided during orientation. If you rely on public transportation, IndyGo bus routes serve most of our locations.', category: 'General', display_order: 21 },
    { id: '23', question: 'Is there help with transportation?', answer: 'Yes. WIOA-eligible participants may qualify for transportation assistance including bus passes or gas cards. Ask your case manager at WorkOne about available supportive services.', category: 'General', display_order: 22 },
    { id: '24', question: 'Is childcare assistance available?', answer: 'WIOA funding may cover childcare costs for eligible participants during training hours. Contact WorkOne to determine your eligibility for childcare supportive services.', category: 'General', display_order: 23 },
    { id: '25', question: 'What is the attendance policy?', answer: 'Regular attendance is required. Most programs allow no more than 2-3 absences. Excessive absences may result in dismissal from the program. If you have an emergency, contact your instructor immediately. Full details are in the Student Handbook.', category: 'General', display_order: 24 },
    // Support
    { id: '12', question: 'What support services are available?', answer: 'Eligible participants may receive help with transportation, childcare, work supplies, and other supportive services through WIOA funding.', category: 'Support', display_order: 25 },
    { id: '26', question: 'What if I need to withdraw from a program?', answer: 'Contact your program coordinator as soon as possible. For self-pay programs, our refund policy is outlined in the enrollment agreement. For funded programs, your case manager will help you explore options including program transfers or re-enrollment.', category: 'Support', display_order: 26 },
    { id: '27', question: 'Do you offer tutoring or extra help?', answer: 'Yes. Instructors are available for additional help during office hours. Some programs offer peer tutoring and study groups. If you are struggling, talk to your instructor early — we want you to succeed.', category: 'Support', display_order: 27 },
    { id: '28', question: 'How do I file a complaint or grievance?', answer: 'We take all concerns seriously. You can file a grievance through our formal process outlined in the Student Handbook, speak with your program coordinator, or contact us at our main office. See our Grievance Policy page for full details.', category: 'Support', display_order: 28 },
  ];

  // Group FAQs by category
  const categories = [...new Set(faqs.map((faq: FAQ) => faq.category))];

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
            <Link href="/wioa-eligibility" className="px-4 py-2 bg-brand-green-100 text-brand-green-800 rounded-full text-sm font-medium hover:bg-brand-green-200 transition-colors">
              WIOA Eligibility
            </Link>
            <Link href="/funding" className="px-4 py-2 bg-brand-blue-100 text-brand-blue-800 rounded-full text-sm font-medium hover:bg-brand-blue-200 transition-colors">
              Funding Options
            </Link>
            <Link href="/programs" className="px-4 py-2 bg-brand-blue-100 text-brand-blue-800 rounded-full text-sm font-medium hover:bg-brand-blue-200 transition-colors">
              Training Programs
            </Link>
            <Link href="/how-it-works" className="px-4 py-2 bg-brand-orange-100 text-brand-orange-800 rounded-full text-sm font-medium hover:bg-brand-orange-200 transition-colors">
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
        <FAQSearch faqs={faqs} />

        {/* Contact CTA */}
        <div className="mt-12 bg-brand-orange-50 rounded-xl p-8 text-center">
          <MessageSquare className="w-12 h-12 text-brand-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Still have questions?</h2>
          <p className="text-gray-600 mb-4">Our team is here to help you find the answers you need.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-orange-600">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
