import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Laptop, Shield, Code, Database, Network, Palette, 
  TrendingUp, CheckCircle, Clock, DollarSign, ArrowRight 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Technology Programs',
  description: 'Launch your tech career with Elevate for Humanity. Programs in IT Help Desk, Cybersecurity, Web Development, and more.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/technology',
  },
};

const TECH_PROGRAMS = [
  {
    slug: 'it-help-desk',
    title: 'IT Help Desk Specialist',
    duration: '12 weeks',
    credential: 'CompTIA A+ Certificate',
    pay: '$18-22/hour entry',
    description: 'Learn troubleshooting, customer service, and technical support skills for IT departments.',
    icon: Laptop,
  },
  {
    slug: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    duration: '16 weeks',
    credential: 'CompTIA Security+',
    pay: '$25-35/hour entry',
    description: 'Master network security, threat analysis, and incident response.',
    icon: Shield,
  },
  {
    slug: 'web-development',
    title: 'Web Development',
    duration: '16 weeks',
    credential: 'Full Stack Certificate',
    pay: '$20-30/hour entry',
    description: 'Build modern websites with HTML, CSS, JavaScript, React, and Node.js.',
    icon: Code,
  },
  {
    slug: 'data-analytics',
    title: 'Data Analytics',
    duration: '12 weeks',
    credential: 'Google Data Analytics Certificate',
    pay: '$22-28/hour entry',
    description: 'Learn Excel, SQL, Tableau, and Python for business intelligence.',
    icon: Database,
  },
];

const INDUSTRIES = [
  'Healthcare Systems',
  'Financial Services',
  'Government Agencies',
  'Retail Corporations',
  'Manufacturing',
];

export default function TechnologyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-brand-blue-900 text-white py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 bg-brand-blue-600/20 border border-brand-blue-500/30 rounded-full text-brand-blue-300 text-sm font-medium mb-6">
              Coming Soon
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Technology Programs
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8">
              Launch your tech career with industry-recognized certifications. 
              Programs launching Fall 2026.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/schedule/meeting" className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-brand-blue-700 transition-colors">
                Get Notified <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/programs" className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-bold py-4 px-8 rounded-xl hover:bg-white/10 transition-colors">
                View All Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Programs */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Upcoming Programs</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our technology programs are designed with employer input to match industry demands.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {TECH_PROGRAMS.map((program) => {
              const IconComponent = program.icon;
              return (
                <article key={program.slug} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                  <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-6">
                    <IconComponent className="w-7 h-7 text-brand-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{program.title}</h3>
                  <p className="text-slate-600 mb-6">{program.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Duration</span>
                      <p className="font-semibold text-slate-900 flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {program.duration}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Entry Pay</span>
                      <p className="font-semibold text-slate-900 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        {program.pay}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <span className="text-sm text-slate-500">Credential</span>
                    <p className="font-semibold text-brand-blue-600">{program.credential}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Employer Demand */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Industry Demand</h2>
              <p className="text-slate-300 text-lg mb-8">
                Technology professionals are in high demand across Indiana. Our programs are designed 
                with input from local employers to ensure you're job-ready upon graduation.
              </p>
              <div className="space-y-4">
                {['Resume & interview coaching', 'Employer networking events', 'Job placement assistance', 'Industry certification prep'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-8">
              <h3 className="font-bold text-lg mb-6">Hiring Partners Include:</h3>
              <div className="grid grid-cols-2 gap-4">
                {INDUSTRIES.map((industry) => (
                  <div key={industry} className="flex items-center gap-2 text-slate-300">
                    <BuildingIcon className="w-5 h-5 text-brand-blue-400" />
                    <span>{industry}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funding */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <DollarSign className="w-12 h-12 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Funding Available</h2>
          <p className="text-lg text-slate-600 mb-8">
            Many technology students qualify for WIOA funding or the Workforce Ready Grant 
            that can cover up to 100% of tuition costs.
          </p>
          <Link href="/funding" className="inline-flex items-center gap-2 bg-green-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-green-700 transition-colors">
            Check Your Eligibility
          </Link>
        </div>
      </section>

      {/* Notify CTA */}
      <section className="py-16 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Be First to Know</h2>
          <p className="text-blue-100 mb-8">
            Sign up to receive notifications when technology programs open for enrollment.
          </p>
          <Link href="/schedule/meeting" className="inline-flex items-center gap-2 bg-white text-brand-blue-700 font-bold py-4 px-8 rounded-xl hover:bg-blue-50 transition-colors">
            Schedule a Consultation
          </Link>
        </div>
      </section>
    </div>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
