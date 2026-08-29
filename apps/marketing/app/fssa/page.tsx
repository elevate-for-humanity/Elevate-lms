import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Users, Briefcase, GraduationCap, Heart, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FSSA Resources,
  description: 'Access FSSA-funded workforce development programs and resources in Indiana.',
};

const fssaPrograms = [
  { title: 'TANF Employment Services', description: 'Temporary Assistance for Needy Families employment support and job training.', icon: Users, href: '/programs/tanf' },
  { title: 'SNAP Employment & Training', description: 'Food assistance recipients can access free job training through SNAP E&T.', icon: Briefcase, href: '/programs/snap' },
  { title: 'Vocational Rehabilitation', description: 'Services for individuals with disabilities seeking employment.', icon: GraduationCap, href: '/programs/voc-rehab' },
  { title: 'Aging & In-Home Services', description: 'Training for careers in elder care and home health.', icon: Heart, href: '/programs/aging' },
];

export default function FSSAPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Resources', href: '/resources' }, { label: 'FSSA' }]} />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-black mb-4">FSSA Workforce Programs</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Access Indiana Family and Social Services Administration funded training programs to advance your career.
          </p>
          <Link href="/check-eligibility" className="inline-block bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50">
            Check Eligibility
          </Link>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-black mb-8 text-center">FSSA-Funded Training Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {fssaPrograms.map((program) => (
              <Link key={program.title} href={program.href} className="group bg-slate-50 border border-slate-200 rounded-xl p-8 hover:shadow-lg hover:border-brand-blue-300 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-blue-600 transition-colors">
                    <program.icon className="w-7 h-7 text-brand-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-black mb-2 group-hover:text-brand-blue-700 transition-colors">{program.title}</h3>
                    <p className="text-slate-600 mb-4">{program.description}</p>
                    <span className="inline-flex items-center gap-1 text-brand-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                      Learn More <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Partner with Indiana FSSA</h2>
          <p className="text-slate-600 max-w-2xl mx-auto mb-8">
            Elevate partners with Indiana FSSA to provide workforce training services across the state. Contact us to discuss partnership opportunities.
          </p>
          <Link href="/fssa" className="inline-block bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">
            Partnership Information
          </Link>
        </div>
      </section>
    </div>
  );
}
