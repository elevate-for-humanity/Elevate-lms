import { Metadata } from 'next';
import { Briefcase, MapPin, Clock, ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Job Openings | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'View current job openings and career opportunities.',
};

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Job Openings</h1>
          <p className="text-xl text-blue-100">Explore career opportunities with us.</p>
        </div>
      </section>
      
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-600">Check back soon for current openings, or view our partner careers.</p>
          <a href="/careers/jobs" className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
            View Careers <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
