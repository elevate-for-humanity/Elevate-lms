import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  Clock, DollarSign, Award, ArrowRight, 
  Users, BookOpen, GraduationCap, Phone
} from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'CNA Certification Training | Free Healthcare Training Indianapolis | Elevate',
  description: 'Become a Certified Nursing Assistant in 4-6 weeks. Free CNA training through WIOA funding in Indianapolis. State certification exam included. 89% job placement rate.',
  alternates: { canonical: `${SITE_URL}/programs/cna-certification` },
  keywords: [
    'CNA certification Indianapolis',
    'free CNA training Indiana',
    'certified nursing assistant program',
    'WIOA CNA training',
    'healthcare training Indianapolis',
    'nursing assistant school Indiana',
    'CNA classes near me',
    'free healthcare certification',
    'CNA state exam prep',
    'nursing home jobs Indianapolis',
    'hospital CNA jobs Indiana',
    'home health aide training',
    'medical career training free',
    'WorkOne CNA program',
  ],
  openGraph: {
    title: 'CNA Certification Training | Free Healthcare Training Indianapolis',
    description: 'Become a Certified Nursing Assistant in 4-6 weeks. Free training through WIOA funding. State certification exam included.',
    url: `${SITE_URL}/programs/cna-certification`,
    siteName: 'Elevate for Humanity',
    images: [{ url: `${SITE_URL}/images/healthcare/hero-programs-healthcare.jpg`, width: 1200, height: 630, alt: 'CNA Training Program' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CNA Certification Training | Free Healthcare Training',
    description: 'Become a Certified Nursing Assistant in 4-6 weeks. Free training through WIOA funding.',
    images: [`${SITE_URL}/images/healthcare/hero-programs-healthcare.jpg`],
  },
};

const programDetails = {
  duration: '4-6 weeks',
  hours: '75+ classroom hours',
  clinicals: '16+ clinical hours',
  certification: 'Indiana State CNA Certification',
  salary: '$32,000 - $45,000/year',
  jobGrowth: '8% (faster than average)',
};

const curriculum = [
  { title: 'Patient Care Fundamentals', desc: 'Vital signs, hygiene, mobility assistance' },
  { title: 'Medical Terminology', desc: 'Healthcare language and documentation' },
  { title: 'Infection Control', desc: 'Safety protocols and prevention' },
  { title: 'Communication Skills', desc: 'Patient and family interaction' },
  { title: 'Clinical Rotations', desc: 'Hands-on experience in healthcare facilities' },
  { title: 'State Exam Prep', desc: 'Written and skills test preparation' },
];

const careers = [
  { title: 'Nursing Homes', salary: '$30K-$38K' },
  { title: 'Hospitals', salary: '$35K-$45K' },
  { title: 'Home Health', salary: '$32K-$42K' },
  { title: 'Assisted Living', salary: '$30K-$40K' },
];

export default function CNACertificationPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' }, 
            { label: 'Healthcare', href: '/programs/healthcare' }, 
            { label: 'CNA Certification' }
          ]} />
        </div>
      </div>

      {/* Hero - Clean image only, no text */}
      <section className="relative h-[50vh] min-h-[400px]">
        <Image 
          src="/images/healthcare/hero-programs-healthcare.jpg" 
          alt="CNA Training Program" 
          fill 
          className="object-cover" 
          priority 
        />
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
              <div className="text-2xl font-bold text-white">State Cert</div>
              <div className="text-slate-400 text-sm">Included</div>
            </div>
            <div>
              <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">High</div>
              <div className="text-slate-400 text-sm">Job Demand</div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">What You&apos;ll Learn</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Comprehensive training covering everything you need to pass the state exam and succeed as a CNA.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curriculum.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Opportunities */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-black mb-6">Career Opportunities</h2>
              <p className="text-blue-100 mb-8">
                CNAs are in high demand across Indiana. After certification, you can work in various healthcare settings.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {careers.map((career, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-4">
                    <h3 className="font-bold text-white">{career.title}</h3>
                    <p className="text-blue-200 text-sm">{career.salary}/year</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl">
              <Image 
                src="/images/healthcare/program-cna-overview.jpg" 
                alt="CNA at work" 
                fill 
                className="object-cover" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Eligibility Requirements</h2>
          <p className="text-slate-600 mb-8">Most adults qualify for free training through WIOA funding</p>
          
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
            {[
              '18+ years old',
              'High school diploma or GED',
              'Pass background check',
              'Physical ability to lift 50 lbs',
              'TB test (we can help)',
              'Reliable transportation',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="w-6 h-6 bg-green-500 rounded-full flex-shrink-0" />
                <span className="font-medium text-slate-700">{item}</span>
              </div>
            ))}
          </div>
          
          <Link href="/wioa-eligibility" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105">
            Check Your Eligibility <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">How to Enroll</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: 1, title: 'Apply Online', desc: 'Complete our simple application' },
              { num: 2, title: 'Check Eligibility', desc: 'Verify WIOA funding eligibility' },
              { num: 3, title: 'Orientation', desc: 'Attend program orientation' },
              { num: 4, title: 'Start Training', desc: 'Begin your CNA journey' },
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
            Start Your Healthcare Career
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Classes starting soon. Limited seats available.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105">
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
