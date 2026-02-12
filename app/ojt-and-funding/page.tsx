import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DollarSign, CheckCircle, Briefcase, Building2, ArrowRight, Users, Clock, Award, TrendingUp, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'On-the-Job Training (OJT) | Get Paid While You Learn | Elevate For Humanity',
  description: 'Earn a paycheck while getting trained. OJT programs let employers hire and train you with government funding covering up to 75% of your wages.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/ojt-and-funding' },
};

const steps = [
  { num: 1, title: 'Apply', desc: 'Tell us your career goals', image: '/images/business/collaboration-1.jpg' },
  { num: 2, title: 'Get Hired', desc: 'Interview with employers', image: '/images/business/handshake-1.jpg' },
  { num: 3, title: 'Train & Earn', desc: 'Learn while getting paid', image: '/images/business/team-1.jpg' },
  { num: 4, title: 'Keep the Job', desc: 'Stay on permanently', image: '/images/business/success-1.jpg' },
];

const benefits = [
  { icon: DollarSign, title: 'Day 1 Paycheck', color: 'green' },
  { icon: Briefcase, title: 'Real Job Skills', color: 'blue' },
  { icon: Building2, title: 'Actual Employer', color: 'blue' },
  { icon: Award, title: 'Permanent Position', color: 'orange' },
];

const industries = [
  { name: 'Healthcare', roles: 'CNA, Medical Assistant', image: '/images/healthcare/hero-programs-healthcare.jpg' },
  { name: 'Skilled Trades', roles: 'HVAC, Electrical', image: '/images/trades/hero-program-hvac.jpg' },
  { name: 'Manufacturing', roles: 'Machine Operator', image: '/images/trades/welding-hero.jpg' },
  { name: 'Technology', roles: 'IT Support, Help Desk', image: '/images/technology/hero-programs-technology.jpg' },
  { name: 'Transportation', roles: 'CDL Driver', image: '/images/trades/hero-program-cdl.jpg' },
  { name: 'Business', roles: 'Admin, Customer Service', image: '/images/business/professional-1.jpg' },
];

export default function OJTAndFundingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'OJT & Funding' }]} />
        </div>
      </div>

      {/* Hero - Visual First */}
      <section className="relative h-[55vh] min-h-[400px]">
        <Image src="/images/business/handshake-1.jpg" alt="Get hired and trained" fill className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Zap className="w-4 h-4" /> Earn While You Learn
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
              On-the-Job Training
            </h1>
            <p className="text-xl text-white/90 max-w-xl mb-6">
              Get hired. Get trained. Get paid. All at once.
            </p>
            <Link href="/apply" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105">
              Find OJT Jobs <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Strip - Icons Only */}
      <section className="py-8 bg-slate-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 justify-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  b.color === 'green' ? 'bg-green-500' : 
                  b.color === 'blue' ? 'bg-blue-500' : 
                  b.color === 'blue' ? 'bg-blue-500' : 'bg-orange-500'
                }`}>
                  <b.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-semibold">{b.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Visual Steps */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">How It Works</h2>
          <p className="text-center text-slate-600 mb-12">4 simple steps to your new career</p>
          
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="group">
                <div className="relative h-48 rounded-2xl overflow-hidden mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <Image src={step.image} alt={step.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-4 left-4 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {step.num}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                    <p className="text-white/80 text-sm">{step.desc}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is OJT - Visual Explainer */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-black mb-6">What is OJT?</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Hire First, Train Second</h3>
                    <p className="text-blue-100">You get hired by a real employer who trains you on the job.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Government Pays Employer</h3>
                    <p className="text-blue-100">Up to 75% of your wages are reimbursed during training.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">You Win</h3>
                    <p className="text-blue-100">Real paycheck + real skills + real job = real career.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl">
              <Image src="/images/business/team-2.jpg" alt="Team training" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Industries - Image Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">OJT Industries</h2>
          <p className="text-center text-slate-600 mb-12">Find opportunities in these fields</p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((ind, i) => (
              <div key={i} className="group relative h-56 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer">
                <Image src={ind.image} alt={ind.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white">{ind.name}</h3>
                  <p className="text-white/80 text-sm">{ind.roles}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility - Quick Check */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Do You Qualify?</h2>
          <p className="text-slate-600 mb-8">Most adults qualify. Check any that apply:</p>
          
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
            {[
              '18+ years old',
              'US work authorized',
              'Receive SNAP/TANF/SSI',
              'Veteran or spouse',
              'Recently laid off',
              'Looking for better job',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="font-medium text-slate-700">{item}</span>
              </div>
            ))}
          </div>
          
          <Link href="/wioa-eligibility" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105">
            Check Full Eligibility <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready to Earn While You Learn?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Stop waiting. Start earning.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="tel:+13173143757" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-full font-bold text-lg transition-all border border-white/30">
              Call (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
