import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Users, Briefcase, Heart, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: `Careers | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Join the Elevate for Humanity team. Career opportunities in workforce development, education, and workforce technology.',
};

const openings = [
  {
    title: 'Workforce Instructor',
    location: 'Indianapolis, IN',
    type: 'Full-time',
    category: 'Education',
    description: 'Teach hands-on workforce training programs in healthcare, trades, or technology.',
  },
  {
    title: 'Career Services Coordinator',
    location: 'Indianapolis, IN',
    type: 'Full-time',
    category: 'Student Services',
    description: 'Help students with job placement, resume building, and interview preparation.',
  },
  {
    title: 'Admissions Advisor',
    location: 'Indianapolis, IN',
    type: 'Full-time',
    category: 'Admissions',
    description: 'Guide prospective students through enrollment and funding processes.',
  },
  {
    title: 'Software Engineer',
    location: 'Remote',
    type: 'Full-time',
    category: 'Technology',
    description: 'Build the next generation of workforce development technology.',
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Join Our Team</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Help us transform lives through workforce development
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {[
              { icon: Users, label: 'Team Members', value: '50+' },
              { icon: Heart, label: 'Mission-Driven', value: '100%' },
              { icon: GraduationCap, label: 'Growth Opportunities', value: 'Many' },
              { icon: Briefcase, label: 'Benefits', value: 'Full' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 bg-slate-50 rounded-xl">
                <stat.icon className="w-8 h-8 text-brand-red-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-8">Open Positions</h2>
          <div className="space-y-4">
            {openings.map((job) => (
              <div key={job.title} className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-brand-red-300 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{job.title}</h3>
                    <p className="text-slate-600 text-sm mb-2">{job.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-slate-200 px-2 py-1 rounded">{job.location}</span>
                      <span className="text-xs bg-slate-200 px-2 py-1 rounded">{job.type}</span>
                      <span className="text-xs bg-brand-red-100 text-brand-red-700 px-2 py-1 rounded">{job.category}</span>
                    </div>
                  </div>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center px-6 py-3 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-xl transition-colors whitespace-nowrap"
                  >
                    Apply
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Don't See Your Role?</h2>
          <p className="text-slate-600 mb-6">
            We're always looking for talented people to join our mission. Send us your resume.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-xl transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </div>
  );
}
