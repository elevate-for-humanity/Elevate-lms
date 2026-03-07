import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Users,
  BookOpen,
  ArrowRight,
  Heart,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  Phone,
  MapPin,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Justice Reinvestment Initiative (JRI) | Funded Career Training | Elevate for Humanity',
  description: 'Indiana JRI program provides funded career training for justice-involved individuals. Get certified in healthcare, skilled trades, and more.',
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
      description: 'Tuition, books, supplies, uniforms, and certification exams covered for eligible participants.',
      icon: DollarSign 
    },
    { 
      title: 'Career Counseling', 
      description: 'Work one-on-one with a dedicated career coach who understands your situation.',
      icon: Heart 
    },
    { 
      title: 'Job Placement', 
      description: 'We connect you with employers committed to second-chance hiring.',
      icon: Briefcase 
    },
    { 
      title: 'Support Services', 
      description: 'Transportation, childcare support, work clothing, and more.',
      icon: Shield 
    },
    { 
      title: 'Flexible Scheduling', 
      description: 'Day and evening classes to work around your commitments.',
      icon: Clock 
    },
    { 
      title: 'Ongoing Mentorship', 
      description: 'Stay connected with mentors even after graduation.',
      icon: Users 
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
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'JRI Program' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-48 md:h-64 flex items-center bg-slate-900 overflow-hidden">
        <Image
          src="/images/pages/jri-page-1.jpg"
          alt="JRI Program participants"
          fill
          className="object-cover opacity-30"
          priority
        />
        
      </section>

      {/* Stats Section */}
      <section className="py-10 bg-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <IconComponent className="w-8 h-8 text-brand-green-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What is JRI */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What is the Justice Reinvestment Initiative?
            </h2>
            <p className="text-lg text-gray-600">
              JRI is an Indiana state-funded program designed to reduce recidivism by investing in 
              workforce training and support services. Instead of cycling people back through the 
              criminal justice system, JRI helps build sustainable careers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programBenefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-brand-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Do You Qualify for JRI?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                JRI funding is available to Indiana residents who meet the following criteria.
              </p>
              
              <ul className="space-y-4">
                {eligibilityRequirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span className="text-gray-700">{req}</span>
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
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Check Your Eligibility</h3>
              <p className="text-gray-600 mb-6">
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
                  className="block w-full border-2 border-gray-300 text-gray-700 text-center px-6 py-4 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Contact Us: Get Help Online
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Programs */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              JRI-Approved Training Programs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from high-demand career paths. All programs are fully funded through JRI.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePrograms.map((program, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-brand-green-600" />
                  <span className="text-xs text-brand-green-600 font-semibold uppercase">JRI Approved</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{program.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{program.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
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

      {/* FAQ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">JRI Program FAQ</h2>
          <div className="space-y-4">
            {[
              { q: 'What is JRI funding?', a: 'Justice Reinvestment Initiative (JRI) is Indiana state funding that provides free career training to justice-involved individuals. It covers tuition, materials, certifications, and supportive services.' },
              { q: 'Do I qualify if I have a felony?', a: 'Yes. JRI is specifically designed for people with criminal records, including felonies. Your conviction type does not automatically disqualify you.' },
              { q: 'How recent does my involvement need to be?', a: 'Generally, you should have been released from incarceration or supervision within the past 3 years. Contact us to discuss your specific situation.' },
              { q: 'What programs can I use JRI for?', a: 'JRI covers approved training programs including healthcare (CNA), skilled trades (HVAC, welding), technology, CDL, and more. See the list above for current options.' },
              { q: 'Is JRI really free?', a: 'Yes. JRI covers 100% of training costs for eligible participants. There are no hidden fees or repayment requirements.' },
              { q: 'How long does the application take?', a: 'The initial application takes about 10 minutes. Eligibility verification typically takes 1-2 weeks. You can start training as soon as you\'re approved.' },
              { q: 'What if I don\'t qualify for JRI?', a: 'You may still qualify for other funding programs like WIOA or SNAP E&T. Our team will help identify all available options for you.' },
              { q: 'Will employers hire me with a record?', a: 'Yes. Many employers actively hire our graduates. We work with employers who believe in second chances and understand the value of trained, motivated workers.' },
            ].map((faq, i) => (
              <details key={i} className="bg-white rounded-xl overflow-hidden shadow-sm group">
                <summary className="p-5 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                  {faq.q}
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-slate-600">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your New Chapter?
          </h2>
          <p className="text-xl text-brand-green-100 mb-8">
            Your past does not define your future. Take the first step today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply?funding=jri"
              className="inline-flex items-center justify-center bg-white text-brand-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-green-700 transition"
            >
              <Phone className="mr-2 w-5 h-5" />
              Get Help Online
            </a>
          </div>
          <p className="text-brand-green-200 text-sm mt-6">
            <MapPin className="w-4 h-4 inline mr-1" />
            Serving Indianapolis and surrounding Indiana counties
          </p>
        </div>
      </section>
    </div>
  );
}
