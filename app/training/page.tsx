import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Stethoscope, Wrench, Monitor, Scissors, Truck, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/training' },
  title: 'Training Programs | Elevate For Humanity',
  description: 'Explore career training programs in healthcare, skilled trades, technology, CDL, barbering, and more. Many programs available at no cost through funding.',
};

const PROGRAM_AREAS = [
  { title: 'Healthcare', desc: 'CNA, Medical Assistant, Phlebotomy, Home Health Aide', icon: Stethoscope, href: '/programs/healthcare', image: '/images/pages/comp-cta-training.jpg' },
  { title: 'Skilled Trades', desc: 'Welding, HVAC, Electrical, Plumbing, Construction', icon: Wrench, href: '/programs/skilled-trades', image: '/images/pages/comp-cta-training.jpg' },
  { title: 'Technology', desc: 'IT Support, Cybersecurity, Certiport Certifications', icon: Monitor, href: '/programs/technology', image: '/images/pages/comp-cta-training.jpg' },
  { title: 'CDL & Transportation', desc: 'Class A CDL, Commercial Driving, Logistics', icon: Truck, href: '/programs/cdl', image: '/images/pages/comp-cta-training.jpg' },
  { title: 'Barbering & Cosmetology', desc: 'Barber Apprenticeship, Cosmetology, Nail Technician', icon: Scissors, href: '/programs/barber-apprenticeship', image: '/images/pages/comp-cta-training.jpg' },
  { title: 'Business & Professional', desc: 'Tax Preparation, Office Administration, Entrepreneurship', icon: BookOpen, href: '/programs/business', image: '/images/pages/comp-cta-training.jpg' },
];

export default function TrainingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Training' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image src="/images/pages/training-page-3.jpg" alt="Career training programs" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Training Programs</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Hands-on career training in high-demand fields. Many programs may be available at no cost through WIOA and state funding.</p>
          </div>
        </div>
      </section>

      {/* Program Areas */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">Choose Your Career Path</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Each program includes industry certification preparation, hands-on training, and career placement support.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROGRAM_AREAS.map((p) => {
              const Icon = p.icon;
              return (
                <Link key={p.title} href={p.href} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                  <div className="relative h-40">
                    <Image src={p.image} alt={p.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 33vw" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-brand-blue-600" />
                      <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm">{p.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">What Every Program Includes</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { title: 'Industry Certification', desc: 'Prepare for and earn recognized credentials in your field.' },
              { title: 'Hands-On Training', desc: 'Learn by doing with real equipment and real-world scenarios.' },
              { title: 'Career Services', desc: 'Resume help, interview prep, and direct employer connections.' },
              { title: 'Funding Assistance', desc: 'Help identifying and applying for available funding sources.' },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Training?</h2>
          <p className="text-brand-blue-100 mb-8 text-lg">
            Attend an orientation to learn about programs and check your eligibility for funded training.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/orientation/schedule" className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg">Orientation Schedule</Link>
            <Link href="/programs" className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg">All Programs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
