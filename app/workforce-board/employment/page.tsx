
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Briefcase, TrendingUp, Users, MapPin, FileCheck, Handshake } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/workforce-board/employment' },
  title: 'Employment Services | Workforce Board | Elevate For Humanity',
  description: 'Employment services for workforce board participants including job placement, employer connections, and career support.',
};

const SERVICES = [
  { title: 'Job Placement Assistance', desc: 'Our career services team connects program graduates with employer partners actively hiring in their field.', icon: Briefcase },
  { title: 'Resume & Interview Prep', desc: 'One-on-one coaching for resume writing, interview skills, and professional presentation.', icon: FileCheck },
  { title: 'Employer Partnerships', desc: 'Direct hiring pipelines with local and regional employers across healthcare, trades, technology, and business.', icon: Handshake },
  { title: 'Labor Market Data', desc: 'Access current wage data, job demand forecasts, and industry trends for informed career decisions.', icon: TrendingUp },
  { title: 'Job Fairs & Hiring Events', desc: 'Regular employer meet-and-greet events, career fairs, and on-site hiring opportunities.', icon: Users },
  { title: 'Local Job Boards', desc: 'Curated job listings from verified employers in the Indianapolis metro area and across Indiana.', icon: MapPin },
];

export default function EmploymentPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Workforce Board', href: '/workforce-board' }, { label: 'Employment Services' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/pages/workforce-board-page-1.jpg" alt="Employment services" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Employment Services</h1>
            <p className="text-lg text-black max-w-3xl mx-auto">From training completion to career placement — we support you every step of the way.</p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">How We Help You Get Hired</h2>
          <p className="text-black text-center mb-12 max-w-2xl mx-auto">
            Employment support is included with every training program at no additional cost.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="bg-white border border-gray-200 rounded-xl p-6">
                  <Icon className="w-8 h-8 text-brand-blue-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-black text-sm">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">Your Path to Employment</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Complete Training', desc: 'Finish your program and earn your certification.' },
              { step: '2', title: 'Career Coaching', desc: 'Work with an advisor on resume, interview prep, and job search strategy.' },
              { step: '3', title: 'Employer Match', desc: 'Get connected with employers hiring in your field.' },
              { step: '4', title: 'Get Hired', desc: 'Start your new career with ongoing support for the first 90 days.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-black text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Your Career?</h2>
          <p className="text-white mb-8 text-lg">
            Enroll in a training program and get access to employment services at no cost to eligible participants.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/programs"
              className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-white text-lg"
            >
              Browse Programs
            </Link>
            <Link
              href="/employer"
              className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
            >
              Employer Partners
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
