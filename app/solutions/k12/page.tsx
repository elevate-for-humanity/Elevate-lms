import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { GraduationCap, Wrench, Stethoscope, Monitor, Award, Users } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/solutions/k12' },
  title: 'K-12 Career Pathways | Elevate For Humanity',
  description: 'Career and technical education (CTE) solutions for high schools. Dual-credit programs, career exploration, and industry certification pathways.',
};

const PATHWAYS = [
  { title: 'Healthcare Careers', desc: 'CNA, Medical Assistant, and Phlebotomy pathways for students interested in healthcare.', icon: Stethoscope },
  { title: 'Skilled Trades', desc: 'Pre-apprenticeship programs in welding, HVAC, electrical, and construction.', icon: Wrench },
  { title: 'Information Technology', desc: 'Certiport IT Specialist, cybersecurity basics, and coding foundations.', icon: Monitor },
  { title: 'Industry Certifications', desc: 'Students can earn recognized credentials before graduation, giving them a head start.', icon: Award },
  { title: 'Career Exploration', desc: 'Job shadowing, industry tours, and career assessments to help students find their path.', icon: GraduationCap },
  { title: 'Dual Credit', desc: 'Partner with us to offer dual-credit CTE courses that count toward both high school and postsecondary credentials.', icon: Users },
];

export default function K12Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Solutions', href: '/solutions' }, { label: 'K-12' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image src="/images/pages/programs-hero-vibrant.jpg" alt="K-12 career pathways" fill className="object-cover" priority sizes="100vw" />
        </div>
      </section>

      {/* Pathways */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">CTE Pathways</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {PATHWAYS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="bg-white border border-gray-200 rounded-xl p-6">
                  <Icon className="w-8 h-8 text-brand-blue-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
                  <p className="text-gray-600 text-sm">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Partner With Your School District</h2>
          <p className="text-brand-blue-100 mb-8 text-lg">Contact us to discuss CTE partnerships, dual-credit agreements, and career pathway development.</p>
          <Link href="https://calendly.com/elevate4humanityedu" target="_blank" rel="noopener noreferrer" className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-white text-lg">Schedule a Meeting</Link>
        </div>
      </section>
    </div>
  );
}
