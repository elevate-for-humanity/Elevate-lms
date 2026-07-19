

import { Metadata } from 'next';
import { Shield, CheckCircle, Award, GraduationCap } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Accreditation & Certifications | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Elevate for Humanity is accredited and our programs meet industry standards.',
};

const ACCREDITATIONS = [
  {
    icon: GraduationCap,
    title: 'Indiana Workforce Board',
    description: 'Approved training provider for Indiana workforce development programs.',
  },
  {
    icon: Shield,
    title: 'NHA Approved',
    description: 'National Healthcareer Association approved testing center.',
  },
  {
    icon: Award,
    title: 'Industry Certifications',
    description: 'Programs prepare students for nationally recognized certifications.',
  },
];

export default function AccreditationPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Accreditation & Certifications</h1>
          <p className="text-xl text-blue-100">
            Our programs meet industry standards and prepare you for recognized credentials.
          </p>
        </div>
      </section>
      
      {/* Accreditations */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {ACCREDITATIONS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                <Icon className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

