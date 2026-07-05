import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { GraduationCap, User, Building, Briefcase } from 'lucide-react';

export const metadata: Metadata = {
  title: `Portals | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Access your student, employer, or partner portal.',
};

const portals = [
  { icon: GraduationCap, title: 'Student Portal', desc: 'Access your courses, progress, and credentials.', href: '/lms' },
  { icon: User, title: 'Apprentice Portal', desc: 'Track hours, competencies, and evaluations.', href: '/apprentice' },
  { icon: Building, title: 'Employer Portal', desc: 'Manage apprentices and post jobs.', href: '/employer' },
  { icon: Briefcase, title: 'Partner Portal', desc: 'Refer students and track progress.', href: '/partner' },
];

export default function PortalsPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Portal Access</h1>
          <p className="text-xl text-slate-300">Sign in to your personalized portal</p>
        </div>
      </section>
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {portals.map((portal) => (
              <Link key={portal.href} href={portal.href} className="group p-8 bg-slate-50 rounded-2xl border border-slate-200 hover:border-brand-red-300 hover:shadow-lg transition-all">
                <portal.icon className="w-12 h-12 text-brand-red-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">{portal.title}</h3>
                <p className="text-slate-600">{portal.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
