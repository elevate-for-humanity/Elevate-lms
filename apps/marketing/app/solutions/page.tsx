import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Users, GraduationCap, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workforce Solutions',
  description: 'Workforce development solutions for employers, agencies, training providers, and educational institutions.',
};

const solutions = [
  {
    icon: Building2,
    title: 'For Employers',
    desc: 'Access trained graduates, apprenticeship programs, and WOTC tax credits.',
    href: '/for-employers',
    color: 'bg-brand-blue-100 text-brand-blue-600'
  },
  {
    icon: Users,
    title: 'For Agencies',
    desc: 'WIOA-approved training provider with compliance reporting.',
    href: '/for-agencies',
    color: 'bg-green-100 text-green-600'
  },
  {
    icon: GraduationCap,
    title: 'For Schools',
    desc: 'Partner with us for CTE programs and workforce pathways.',
    href: '/solutions/k12',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    icon: Award,
    title: 'For Colleges',
    desc: 'Credit articulation and degree completion pathways.',
    href: '/solutions/higher-ed',
    color: 'bg-amber-100 text-amber-600'
  },
];

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Workforce Solutions</h1>
          <p className="text-xl text-blue-100">
            Partner with Elevate for customized workforce development solutions.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Who We Serve</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((s) => (
              <Link key={s.title} href={s.href} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
                <div className={`w-14 h-14 ${s.color} rounded-xl flex items-center justify-center mb-4`}>
                  <s.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Enterprise Solutions</h2>
          <p className="text-gray-600 text-center mb-8">
            Looking for enterprise-level workforce development? Our platform licensing and white-label solutions help organizations build their own workforce ecosystems.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/white-label" className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 text-center">
              White Label Platform
            </Link>
            <Link href="/contact" className="px-6 py-3 border-2 border-brand-blue-600 text-brand-blue-600 font-semibold rounded-lg hover:bg-brand-blue-50 text-center">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
