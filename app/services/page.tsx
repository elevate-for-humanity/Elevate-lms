import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Users, Building, GraduationCap, Truck } from 'lucide-react';

export const metadata: Metadata = {
  title: `Our Services | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Workforce development services for students, employers, and community partners.',
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Services</h1>
          <p className="text-xl text-slate-300">Comprehensive workforce development solutions</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: GraduationCap, title: 'Student Training', desc: 'Industry-recognized credentials in healthcare, trades, technology, and more.', href: '/programs', cta: 'View Programs' },
              { icon: Building, title: 'Employer Solutions', desc: 'Workforce development, apprenticeship programs, and hiring support.', href: '/hire-graduates', cta: 'Hire Graduates' },
              { icon: Users, title: 'Partner Programs', desc: 'Collaboration with WorkOne, VR, and workforce agencies.', href: '/partners', cta: 'Learn More' },
              { icon: Truck, title: 'Testing Services', desc: 'Certiport, EPA 608, NHA, and other certification exams.', href: '/testing', cta: 'Testing Center' },
            ].map((service) => (
              <div key={service.title} className="p-8 bg-slate-50 rounded-2xl border border-slate-200">
                <service.icon className="w-12 h-12 text-brand-red-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-slate-600 mb-6">{service.desc}</p>
                <Link href={service.href} className="inline-flex items-center px-6 py-3 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-xl transition-colors">
                  {service.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
