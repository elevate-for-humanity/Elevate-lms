import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/training-providers',
  },
  title: 'Training Providers | Partner With Elevate For Humanity',
  description:
    'Partner with Elevate for Humanity to deliver workforce training. Access WIOA funding, expand your reach, and help students launch careers.',
};

const benefits = [
  {
    title: 'Student Referrals',
    description: 'Receive pre-screened, WIOA-eligible students ready to enroll in your programs.',
    image: '/images/healthcare/healthcare-programs-grid.jpg',
  },
  {
    title: 'ETPL Listing Support',
    description: 'We help you get listed on the Eligible Training Provider List for WIOA funding.',
    image: '/images/artlist/hero-training-8.jpg',
  },
  {
    title: 'Marketing Support',
    description: 'Your programs featured on our website and promoted to workforce partners.',
    image: '/images/artlist/hero-training-7.jpg',
  },
  {
    title: 'Compliance Assistance',
    description: 'Support with WIOA reporting requirements and documentation.',
    image: '/images/business/tax-prep-certification.jpg',
  },
  {
    title: 'Employer Connections',
    description: 'Connect your graduates with our network of hiring employers.',
    image: '/images/artlist/hero-training-7.jpg',
  },
  {
    title: 'Streamlined Enrollment',
    description: 'Our team handles eligibility verification and funding paperwork.',
    image: '/images/artlist/hero-training-4.jpg',
  },
];

const requirements = [
  'State-licensed or accredited training program',
  'Industry-recognized credential or certification upon completion',
  'Documented job placement outcomes',
  'Ability to accept WIOA or other workforce funding',
  'Commitment to student success and support services',
];

const programTypes = [
  {
    name: 'Healthcare',
    examples: 'CNA, Medical Assistant, Phlebotomy, EMT',
    image: '/images/healthcare/hero-programs-healthcare.jpg',
  },
  {
    name: 'Skilled Trades',
    examples: 'HVAC, Electrical, Plumbing, Welding',
    image: '/images/artlist/hero-training-4.jpg',
  },
  {
    name: 'Technology',
    examples: 'IT Support, Cybersecurity, Web Development',
    image: '/images/technology/hero-programs-technology.jpg',
  },
  {
    name: 'Transportation',
    examples: 'CDL, Forklift, Logistics',
    image: '/images/efh/sections/coaching.jpg',
  },
  {
    name: 'Business',
    examples: 'Accounting, Office Admin, Project Management',
    image: '/images/efh/sections/staffing.jpg',
  },
  {
    name: 'Beauty & Wellness',
    examples: 'Barber, Cosmetology, Esthetician',
    image: '/images/programs/barber.jpg',
  },
];

export default function TrainingProvidersPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Training Providers" }]} />
      </div>
{/* Hero Section */}
      <section className="relative min-h-[500px] flex items-center">
        <div className="absolute inset-0">
          <Image
            src="/images/learners/coaching-session.jpg"
            alt="Training Providers Partnership"
            fill
            className="object-cover"
            priority
            quality={85}
          />
          
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-white text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Now Accepting Partners
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Partner With Us to Deliver Workforce Training
            </h1>
            
            <p className="text-xl text-brand-blue-100 mb-8">
              Join our network of approved training providers. We connect you with WIOA-funded students, handle enrollment paperwork, and help you grow your program.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/partners/training-provider"
                className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-900 px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-50 transition"
              >
                Become a Partner
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="/support"
                className="inline-flex items-center justify-center gap-2 bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-700 transition border border-brand-blue-600"
              >
                <Phone className="w-5 h-5" />
                Call Get Help Online
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Partner With Elevate?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We handle the heavy lifting so you can focus on what you do best—training students for successful careers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="relative h-36">
                  <Image src={benefit.image} alt={benefit.title} fill sizes="100vw" className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Types */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Programs We Support
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We partner with training providers across high-demand industries.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programTypes.map((program) => (
              <div key={program.name} className="group relative h-64 rounded-xl overflow-hidden">
                <Image
                  src={program.image}
                  alt={program.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-bold text-white mb-1">{program.name}</h3>
                  <p className="text-gray-200 text-sm">{program.examples}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Partner Requirements
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                We partner with quality training providers committed to student success.
              </p>
              
              <ul className="space-y-4">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                    </div>
                    <span className="text-gray-700 text-lg">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/images/learners/barrier-support.jpg"
                alt="Training classroom"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Partnership Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple process to start receiving WIOA-funded students.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Apply', desc: 'Submit your training provider application with program details.' },
              { step: 2, title: 'Review', desc: 'Our team reviews your credentials and program outcomes.' },
              { step: 3, title: 'Onboard', desc: 'Sign partnership agreement and complete onboarding.' },
              { step: 4, title: 'Receive Students', desc: 'Start receiving pre-screened, funded students.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-brand-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
              <div className="text-brand-blue-200">Students Placed</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">50+</div>
              <div className="text-brand-blue-200">Partner Providers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">85%</div>
              <div className="text-brand-blue-200">Job Placement Rate</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">$0</div>
              <div className="text-brand-blue-200">Cost to Partners</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Grow Your Training Program?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join our network and start receiving WIOA-funded students. No cost to partner.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/partners/training-provider"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-700 transition text-lg"
            >
              Apply to Partner
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition border-2 border-gray-200 text-lg"
            >
              <Phone className="w-5 h-5" />
              Call Get Help Online
            </a>
          </div>
          <p className="mt-8 text-gray-500">
            Questions? Email us at{' '}
            <a href="mailto:elevate4humanityedu@gmail.com" className="text-brand-blue-600 hover:underline">
              elevate4humanityedu@gmail.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
