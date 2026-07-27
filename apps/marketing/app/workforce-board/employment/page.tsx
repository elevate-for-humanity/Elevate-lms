import { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, MapPin, DollarSign, Building2, Clock, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Employment Opportunities | Workforce Board',
  keywords: ["jobs", "employment", "careers", "workforce", "hiring"],
  description: 'Find employment opportunities with our workforce board partners. Browse job listings and connect with local employers.',
};

export default function WorkforceEmploymentPage() {
  const jobs = [
    { title: 'Medical Assistant', company: 'Healthcare Plus', location: 'Indianapolis, IN', salary: '$35,000 - $42,000/year', type: 'Full-time', posted: '2 days ago' },
    { title: 'HVAC Technician', company: 'Cool Air Solutions', location: 'Carmel, IN', salary: '$45,000 - $55,000/year', type: 'Full-time', posted: '5 days ago' },
    { title: 'Barber / Cosmetologist', company: 'Elevate Salon', location: 'Indianapolis, IN', salary: '$30,000 - $50,000/year', type: 'Full-time / Commission', posted: '1 week ago' },
    { title: 'CDL Driver', company: 'Midwest Logistics', location: 'Greenfield, IN', salary: '$55,000 - $65,000/year', type: 'Full-time', posted: '3 days ago' },
    { title: 'Pharmacy Technician', company: 'Community Pharmacy', location: 'Noblesville, IN', salary: '$32,000 - $38,000/year', type: 'Full-time', posted: '1 week ago' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-red-500 to-brand-orange-500" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-red-500/20 text-brand-red-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Briefcase className="w-4 h-4" />
              Workforce Board
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Employment Opportunities
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Browse job opportunities from our employer partners. These employers are actively hiring graduates from our training programs.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/workforce-board/dashboard" className="inline-flex items-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Post a Job
              </Link>
              <Link href="/programs" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Browse Training Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Available Positions</h2>
            <span className="text-sm text-slate-500">{jobs.length} jobs posted</span>
          </div>
          <div className="space-y-4">
            {jobs.map((job, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:border-brand-blue-200 transition-all">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-brand-blue-100 text-brand-blue-700 px-2 py-1 rounded">{job.type}</span>
                      <span className="text-xs text-slate-400">{job.posted}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {job.company}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {job.salary}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors">
                      Apply Now
                    </button>
                    <button className="border border-slate-200 hover:border-slate-300 text-slate-600 font-semibold py-2.5 px-4 rounded-lg transition-colors">
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employer CTA */}
      <section className="py-16 bg-brand-blue-50 border-y border-brand-blue-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Are You an Employer?</h2>
          <p className="text-slate-600 mb-8">Post your job openings to reach our trained graduates. It's free for workforce partners.</p>
          <Link href="/workforce-board/dashboard" className="inline-flex items-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
            Post a Job <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
}
