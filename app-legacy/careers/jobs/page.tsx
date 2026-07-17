import { requireRole } from '@/lib/auth/require-role';
import { Metadata } from 'next';
import { Briefcase, Building, MapPin, Clock, ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Careers & Job Openings | ${PLATFORM_DEFAULTS.orgName}`,
  keywords: ["career training", "workforce development", "job training", "WIOA"], description: 'View current career opportunities and job openings at Elevate for Humanity.',
};

const JOB_OPENINGS = [
  {
    title: 'Workforce Development Coach',
    type: 'Full-time',
    location: 'Indianapolis, IN',
    keywords: ["career training", "workforce development", "job training", "WIOA"], description: 'Help participants navigate workforce training programs and career pathways.',
  },
  {
    title: 'Program Coordinator',
    type: 'Full-time',
    location: 'Indianapolis, IN',
    keywords: ["career training", "workforce development", "job training", "WIOA"], description: 'Coordinate program scheduling, enrollment, and participant support.',
  },
  {
    title: 'Employer Relations Specialist',
    type: 'Full-time',
    location: 'Remote',
    keywords: ["career training", "workforce development", "job training", "WIOA"], description: 'Build partnerships with employers for job placement and apprenticeships.',
  },
];

export default function CareersJobsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Careers</h1>
          <p className="text-xl text-blue-100">
            Join our team and help transform workforce development.
          </p>
        </div>
      </section>
      
      {/* Job Listings */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Current Openings</h2>
          
          {JOB_OPENINGS.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Openings Right Now</h3>
              <p className="text-slate-500">Check back soon for career opportunities.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {JOB_OPENINGS.map((job) => (
                <div key={job.title} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                      <div className="flex gap-4 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                      Apply <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-600">{job.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
