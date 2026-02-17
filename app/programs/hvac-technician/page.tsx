// Force static generation for performance

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  Clock, DollarSign, Award, ArrowRight, 
  Thermometer, Users, BookOpen, Wrench, Phone, Zap, Wind, Shield
} from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'HVAC Technician Training | Free Trade School Indianapolis | Elevate',
  description: 'Become an HVAC Technician in 12-16 weeks. Free training through WIOA funding in Indianapolis. EPA 608 certification included. Earn $45K-$75K/year.',
  alternates: { canonical: `${SITE_URL}/programs/hvac-technician` },
  keywords: [
    'HVAC training Indianapolis',
    'free HVAC school Indiana',
    'HVAC technician certification',
    'EPA 608 certification training',
    'heating and cooling training',
    'air conditioning technician school',
    'WIOA HVAC program',
    'free trade school Indianapolis',
    'HVAC apprenticeship Indiana',
    'refrigeration technician training',
    'HVAC jobs Indianapolis',
    'skilled trades training free',
    'WorkOne HVAC program',
    'heating ventilation air conditioning',
  ],
  openGraph: {
    title: 'HVAC Technician Training | Free Trade School Indianapolis',
    description: 'Become an HVAC Technician in 12-16 weeks. Free training through WIOA funding. EPA 608 certification included.',
    url: `${SITE_URL}/programs/hvac-technician`,
    siteName: 'Elevate for Humanity',
    images: [{ url: `${SITE_URL}/images/trades/program-hvac-overview.jpg`, width: 1200, height: 630, alt: 'HVAC Technician Training Program' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HVAC Technician Training | Free Trade School',
    description: 'Become an HVAC Technician in 12-16 weeks. Free training through WIOA funding.',
    images: [`${SITE_URL}/images/trades/hero-program-hvac.jpg`],
  },
};

const programDetails = {
  duration: '12-16 weeks',
  hours: '400+ training hours',
  certification: 'EPA 608 Universal',
  salary: '$45,000 - $75,000/year',
  jobGrowth: '6% (faster than average)',
};

const curriculum = [
  { icon: Thermometer, title: 'HVAC Fundamentals', desc: 'Heating, cooling, and ventilation system theory' },
  { icon: Zap, title: 'Electrical Systems', desc: 'Wiring, controls, and electrical components' },
  { icon: Wind, title: 'Air Distribution', desc: 'Ductwork design, installation, and balancing' },
  { icon: Wrench, title: 'Refrigeration', desc: 'Refrigerant handling and EPA 608 certification' },
  { icon: Shield, title: 'Safety & Codes', desc: 'OSHA protocols and building code compliance' },
  { icon: BookOpen, title: 'Troubleshooting', desc: 'Diagnostics and repair techniques' },
];

const careers = [
  { title: 'HVAC Installer', salary: '$40K-$55K', growth: 'High demand' },
  { title: 'Service Technician', salary: '$45K-$65K', growth: 'Very high demand' },
  { title: 'Refrigeration Tech', salary: '$50K-$70K', growth: 'Specialized' },
  { title: 'Commercial HVAC', salary: '$55K-$80K', growth: 'Premium pay' },
];

const employers = [
  'Carrier',
  'Trane',
  'Lennox',
  'Local contractors',
  'Property management',
  'Hospitals',
  'Schools',
  'Manufacturing',
];

export default function HVACTechnicianPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Avatar Guide */}
      <ProgramHeroBanner videoSrc="/videos/avatars/trades-guide.mp4" />
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' }, 
            { label: 'Skilled Trades', href: '/programs/skilled-trades' }, 
            { label: 'HVAC Technician' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[55vh] min-h-[450px]">
        <Image 
          src="/images/trades/hero-program-hvac.jpg" 
          alt="HVAC Technician Training Program" 
          fill sizes="100vw"
          className="object-cover" 
          priority 
        />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Thermometer className="w-4 h-4" /> WIOA Funding Available
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
              HVAC Technician
            </h1>
            <p className="text-xl text-white/90 max-w-xl mb-6">
              Master heating, ventilation, and air conditioning. High-demand career with excellent pay and year-round work.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/apply?program=hvac-technician" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105">
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
              <Clock className="w-8 h-8 text-brand-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{programDetails.duration}</div>
              <div className="text-slate-400 text-sm">Program Length</div>
            </div>
            <div>
              <DollarSign className="w-8 h-8 text-brand-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">Funded</div>
              <div className="text-slate-400 text-sm">For Qualifying Students</div>
            </div>
            <div>
              <Award className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">EPA 608</div>
              <div className="text-slate-400 text-sm">Certification</div>
            </div>
            <div>
              <Users className="w-8 h-8 text-brand-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">$45K+</div>
              <div className="text-slate-400 text-sm">Starting Salary</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why HVAC */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Why Choose HVAC?</h2>
              <div className="space-y-4 text-slate-700 leading-relaxed">
                <p>
                  <strong>Year-Round Demand:</strong> Heating systems run all winter and cooling systems run all summer. HVAC technicians work year-round with consistent demand regardless of the economy.
                </p>
                <p>
                  <strong>Excellent Pay:</strong> Entry-level HVAC technicians in Indiana start around $35,000-$45,000. Experienced technicians with EPA certification and specializations earn $60,000-$80,000 or more, especially with overtime during peak seasons.
                </p>
                <p>
                  <strong>Job Security:</strong> Every residential, commercial, and industrial building needs HVAC. This work cannot be outsourced or automated. The Bureau of Labor Statistics projects 6% job growth through 2032.
                </p>
                <p>
                  <strong>Business Ownership:</strong> Many HVAC technicians start their own service companies within 5 years. With an EPA certification and a contractor license, you can run your own business with relatively low startup costs.
                </p>
              </div>
            </div>
            <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
              <Image 
                src="/images/programs-hq/hvac-technician.jpg" 
                alt="HVAC training classroom with equipment" 
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
            Comprehensive hands-on training covering residential and commercial HVAC systems.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curriculum.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Opportunities */}
      <section className="py-16 bg-brand-red-600">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-black mb-6">Career Opportunities</h2>
              <p className="text-brand-red-100 mb-8">
                HVAC technicians are in high demand across Indiana. Multiple career paths available.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {careers.map((career, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-4">
                    <h3 className="font-bold text-white">{career.title}</h3>
                    <p className="text-brand-red-200 text-sm">{career.salary}/year</p>
                    <p className="text-brand-red-300 text-xs mt-1">{career.growth}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Hiring Employers</h3>
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
          <p className="text-slate-600 mb-8">Most adults qualify for free training through WIOA funding</p>
          
          <div className="max-w-2xl mx-auto mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-slate-700 leading-relaxed">
              You must be at least 18 years old with a high school diploma or GED. A valid driver&apos;s license is required since HVAC work involves traveling to job sites. 
              You should be able to lift 50 pounds or more and pass a background check. Basic math skills (fractions, measurements, and simple calculations) are needed for the coursework.
            </p>
          </div>
          
          <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-brand-green-600 hover:bg-brand-green-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105">
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
              { num: 2, title: 'Register at Indiana Career Connect', desc: 'Verify WIOA funding eligibility' },
              { num: 3, title: 'Orientation', desc: 'Attend program orientation' },
              { num: 4, title: 'Start Training', desc: 'Begin your HVAC career' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
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
            Start Your HVAC Career
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Classes starting soon. Limited seats available.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply?program=hvac-technician" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="/support" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-full font-bold text-lg transition-all border border-white/30">
              <Phone className="w-5 h-5" /> Get Help Online
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
