// Force static generation for performance
export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  CheckCircle, Clock, DollarSign, Award, ArrowRight, 
  Truck, Users, BookOpen, MapPin, Phone, Shield, Route, Fuel
} from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'CDL Training | Free Truck Driving School Indianapolis | Elevate',
  description: 'Get your Class A CDL in 4-8 weeks. Free CDL training through WIOA funding in Indianapolis. Job placement assistance. Earn $50K-$80K/year.',
  alternates: { canonical: `${SITE_URL}/programs/cdl-training` },
  keywords: [
    'CDL training Indianapolis',
    'free CDL school Indiana',
    'Class A CDL program',
    'truck driving school free',
    'WIOA CDL training',
    'commercial driver license Indiana',
    'trucking school Indianapolis',
    'OTR driver training',
    'CDL jobs Indianapolis',
    'free truck driver training',
    'WorkOne CDL program',
    'paid CDL training Indiana',
    'trucking career Indianapolis',
    'semi truck driving school',
  ],
  openGraph: {
    title: 'CDL Training | Free Truck Driving School Indianapolis',
    description: 'Get your Class A CDL in 4-8 weeks. Free training through WIOA funding. Job placement assistance.',
    url: `${SITE_URL}/programs/cdl-training`,
    siteName: 'Elevate for Humanity',
    images: [{ url: `${SITE_URL}/images/trades/hero-program-cdl.jpg`, width: 1200, height: 630, alt: 'CDL Training Program' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CDL Training | Free Truck Driving School',
    description: 'Get your Class A CDL in 4-8 weeks. Free training through WIOA funding.',
    images: [`${SITE_URL}/images/trades/hero-program-cdl.jpg`],
  },
};

const programDetails = {
  duration: '4-8 weeks',
  hours: '160+ training hours',
  certification: 'Class A CDL',
  salary: '$50,000 - $80,000/year',
  jobGrowth: '6% (80,000+ openings/year)',
};

const curriculum = [
  { icon: Truck, title: 'Vehicle Control', desc: 'Basic maneuvering, backing, and parking techniques' },
  { icon: Shield, title: 'Pre-Trip Inspection', desc: 'DOT-required safety inspection procedures' },
  { icon: Route, title: 'Road Training', desc: 'Highway driving, lane changes, and traffic navigation' },
  { icon: Fuel, title: 'Air Brakes', desc: 'Air brake systems and emergency procedures' },
  { icon: BookOpen, title: 'DOT Regulations', desc: 'Hours of service, logbooks, and compliance' },
  { icon: MapPin, title: 'Trip Planning', desc: 'Route planning, fuel management, and delivery logistics' },
];

const careers = [
  { title: 'OTR Driver', salary: '$55K-$80K', desc: 'Long-haul cross-country routes' },
  { title: 'Regional Driver', salary: '$50K-$70K', desc: 'Multi-state regional routes' },
  { title: 'Local Driver', salary: '$45K-$60K', desc: 'Home daily, local deliveries' },
  { title: 'Owner-Operator', salary: '$100K+', desc: 'Run your own trucking business' },
];

const employers = [
  'Werner Enterprises',
  'Schneider',
  'J.B. Hunt',
  'Swift Transportation',
  'FedEx Freight',
  'UPS Freight',
  'Amazon',
  'Local carriers',
];

export default function CDLTrainingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Avatar Guide */}
      <PageAvatar 
        videoSrc="/videos/avatars/trades-guide.mp4" 
        title="CDL Program Guide" 
      />
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' }, 
            { label: 'Skilled Trades', href: '/programs/skilled-trades' }, 
            { label: 'CDL Training' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[55vh] min-h-[450px]">
        <Image 
          src="/images/trades/hero-program-cdl.jpg" 
          alt="CDL Training Program" 
          fill sizes="100vw"
          className="object-cover" 
          priority 
        />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Truck className="w-4 h-4" /> WIOA Funding Available
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
              CDL Training
            </h1>
            <p className="text-xl text-white/90 max-w-xl mb-6">
              Get your Class A Commercial Driver License in just 4-8 weeks. High demand, excellent pay, and freedom of the open road.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/apply?program=cdl-training" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105">
                Apply Now <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-full font-bold text-lg transition-all border border-white/40">
                Register at Indiana Career Connect
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 bg-slate-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{programDetails.duration}</div>
              <div className="text-slate-400 text-sm">Program Length</div>
            </div>
            <div>
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">Funded</div>
              <div className="text-slate-400 text-sm">For Qualifying Students</div>
            </div>
            <div>
              <Award className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">Class A</div>
              <div className="text-slate-400 text-sm">CDL License</div>
            </div>
            <div>
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">$50K+</div>
              <div className="text-slate-400 text-sm">Starting Salary</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Trucking */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Why Choose Trucking?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Massive Shortage</h3>
                    <p className="text-slate-600">80,000+ driver shortage nationwide. Jobs guaranteed.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Immediate Employment</h3>
                    <p className="text-slate-600">Companies hiring before you even graduate.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Sign-On Bonuses</h3>
                    <p className="text-slate-600">Many companies offer $5K-$15K sign-on bonuses.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Be Your Own Boss</h3>
                    <p className="text-slate-600">Path to owner-operator earning $100K+.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
              <Image 
                src="/images/trades/program-cdl-commercial-driving.jpg" 
                alt="CDL student with semi truck" 
                fill sizes="100vw"
                className="object-cover" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">What You&apos;ll Learn</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Comprehensive behind-the-wheel training to pass your CDL exam and start driving immediately.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curriculum.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Opportunities */}
      <section className="py-16 bg-red-600">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-black mb-6">Career Opportunities</h2>
              <p className="text-red-100 mb-8">
                Multiple career paths available. Choose the lifestyle that fits you.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {careers.map((career, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-4">
                    <h3 className="font-bold text-white">{career.title}</h3>
                    <p className="text-red-200 text-sm">{career.salary}/year</p>
                    <p className="text-red-300 text-xs mt-1">{career.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Hiring Companies</h3>
              <div className="grid grid-cols-2 gap-3">
                {employers.map((employer, i) => (
                  <div key={i} className="bg-white/20 rounded-lg px-4 py-3 text-white font-medium">
                    {employer}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Eligibility Requirements</h2>
          <p className="text-slate-600 mb-8">CDL requirements are set by the DOT</p>
          
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
            {[
              '21+ years old (interstate)',
              'Valid driver\'s license',
              'Clean driving record',
              'Pass DOT physical',
              'Pass drug screening',
              'No DUI in past 5 years',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="font-medium text-slate-700">{item}</span>
              </div>
            ))}
          </div>
          
          <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105">
            Check Your Eligibility <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">How to Enroll</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: 1, title: 'Apply Online', desc: 'Complete our simple application' },
              { num: 2, title: 'DOT Physical', desc: 'Pass required medical exam' },
              { num: 3, title: 'Permit Test', desc: 'Get your CDL learner permit' },
              { num: 4, title: 'Start Training', desc: 'Begin behind-the-wheel training' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Start Your Trucking Career
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Classes starting soon. Companies hiring immediately.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply?program=cdl-training" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="tel:+13173143757" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-full font-bold text-lg transition-all border border-white/30">
              <Phone className="w-5 h-5" /> (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
