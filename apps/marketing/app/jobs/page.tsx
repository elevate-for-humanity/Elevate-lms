import { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, GraduationCap, DollarSign, Clock, ArrowRight, CheckCircle2, Users, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Career Programs & Training',
  description: 'Explore workforce training programs and apprenticeship opportunities. Earn while you learn with WIOA funding and employer partnerships in healthcare, skilled trades, and technology.',
};

const programs = [
  {
    category: 'Healthcare',
    slug: 'healthcare',
    title: 'Healthcare Programs',
    jobs: ['Certified Nursing Assistant (CNA)', 'Medical Assistant', 'Pharmacy Technician', 'Phlebotomy Technician'],
    salary: '$28,000 - $45,000',
    timeframe: '4-12 weeks',
    funding: 'WIOA & Next Level Jobs eligible',
  },
  {
    category: 'Skilled Trades',
    slug: 'skilled-trades',
    title: 'Skilled Trades',
    jobs: ['HVAC Technician', 'Electrical', 'Plumbing', 'Welding', 'Diesel Mechanic', 'CDL Truck Driver'],
    salary: '$35,000 - $65,000',
    timeframe: '8-52 weeks',
    funding: 'High employer demand',
  },
  {
    category: 'Technology',
    slug: 'technology',
    title: 'Technology Programs',
    jobs: ['IT Help Desk', 'Network Administration', 'Cybersecurity', 'Software Development', 'Web Development'],
    salary: '$40,000 - $80,000',
    timeframe: '12-24 weeks',
    funding: 'Growing field',
  },
  {
    category: 'Personal Services',
    slug: 'personal-services',
    title: 'Personal Services (Apprenticeships)',
    jobs: ['Barber', 'Cosmetologist', 'Esthetician', 'Nail Technician'],
    salary: '$30,000 - $55,000+',
    timeframe: '1-2 years (earn while you learn)',
    funding: 'DOL Registered Apprenticeship',
  },
  {
    category: 'Business & Admin',
    slug: 'business',
    title: 'Business & Administrative',
    jobs: ['Office Administration', 'Bookkeeping', 'Project Management', 'Business Administration'],
    salary: '$32,000 - $50,000',
    timeframe: '8-16 weeks',
    funding: 'WIOA eligible',
  },
];

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 via-brand-blue-800 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-blue-200 font-semibold mb-3 tracking-wide uppercase text-sm">Career Training</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Launch Your Career With Funded Training
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              From healthcare to skilled trades to technology — we help you get trained, certified, and hired. 
              Many programs are free or low-cost with WIOA funding, apprenticeships, and employer sponsorships.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-orange-600">40+</div>
              <div className="text-slate-600 text-sm">Training Programs</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-orange-600">DOL</div>
              <div className="text-slate-600 text-sm">Registered Apprenticeships</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-orange-600">WIOA</div>
              <div className="text-slate-600 text-sm">Approved Provider</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-orange-600">Free</div>
              <div className="text-slate-600 text-sm">Eligibility Screening</div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 text-center">
            Explore Career Paths
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <div key={program.category} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 text-white p-4">
                  <h3 className="text-lg font-bold">{program.title}</h3>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Career Paths:</p>
                    <div className="flex flex-wrap gap-2">
                      {program.jobs.slice(0, 3).map((job) => (
                        <span key={job} className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">
                          {job}
                        </span>
                      ))}
                      {program.jobs.length > 3 && (
                        <span className="inline-block bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded">
                          +{program.jobs.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span>Avg. Start: {program.salary}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4 text-brand-blue-600" />
                      <span>{program.timeframe}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <GraduationCap className="w-4 h-4 text-brand-orange-600" />
                      <span>{program.funding}</span>
                    </div>
                  </div>
                  <Link
                    href={`/programs/${program.slug}`}
                    className="block w-full text-center bg-brand-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-blue-700 transition-colors"
                  >
                    View Programs →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 text-center">
            How Funded Training Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-brand-orange-600">1</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Check Eligibility</h3>
              <p className="text-slate-600 text-sm">
                Take our 2-minute quiz or meet with an advisor to see what funding you qualify for — WIOA, grants, or employer sponsorship.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-brand-orange-600">2</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Choose Your Path</h3>
              <p className="text-slate-600 text-sm">
                Select from 40+ programs in healthcare, trades, technology, and more. We&apos;ll help you find the right fit for your goals.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-brand-orange-600">3</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Get Trained & Hired</h3>
              <p className="text-slate-600 text-sm">
                Complete your training, earn industry credentials, and connect with employers who are hiring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Employers */}
      <section className="py-16 bg-gradient-to-br from-purple-900 to-purple-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-purple-300" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Are You an Employer?</h2>
          <p className="text-purple-200 text-lg mb-8 max-w-2xl mx-auto">
            Build your talent pipeline with pre-screened candidates, apprenticeship programs, and tax credits for hiring.
          </p>
          <Link
            href="/for-employers"
            className="inline-flex items-center gap-2 bg-white text-purple-900 font-bold py-3 px-8 rounded-lg hover:bg-purple-100 transition-colors"
          >
            Partner With Us <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your New Career?</h2>
          <p className="text-xl text-orange-100 mb-8">
            Get free guidance on funding options and the right program for your goals.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/check-eligibility" className="bg-white text-brand-orange-600 font-bold py-4 px-8 rounded-lg hover:bg-orange-50">
              Check My Eligibility
            </Link>
            <Link href="/contact" className="bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-lg hover:bg-white/10">
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
