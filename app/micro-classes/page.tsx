import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Award, Zap, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/micro-classes' },
  title: 'Micro-Classes | Elevate For Humanity',
  description: 'Short, focused training modules you can complete in hours, not weeks. Build skills quickly with micro-credentials.',
};

const CLASSES = [
  { title: 'CPR & First Aid (HSI)', duration: '4–6 hours', desc: 'American Heart Association aligned certification for healthcare and workplace safety. Free with WIOA.', href: '/programs/cpr-first-aid' },
  { title: 'Food Handler Certification', duration: '2–4 hours', desc: 'Required certification for food service workers in Indiana. Free with WIOA.', href: '/programs/food-handler' },
  { title: 'OSHA 10-Hour Safety', duration: '10 hours', desc: 'Workplace safety certification for construction and general industry. OSHA 10 card issued.', href: '/programs/osha-safety' },
  { title: 'OSHA 30-Hour Safety', duration: '30 hours', desc: 'Advanced workplace safety for supervisors and managers. OSHA 30 card issued.', href: '/programs/osha-30' },
  { title: 'Forklift Operator', duration: '4–8 hours', desc: 'OSHA-compliant forklift operator training and certification.', href: '/programs/forklift' },
  { title: 'Bloodborne Pathogens', duration: '2 hours', desc: 'Required training for healthcare workers on infection control. BBP certificate issued.', href: '/programs/bloodborne-pathogens' },
  { title: 'Microsoft Office Basics', duration: '6 hours', desc: 'Word, Excel, and Outlook fundamentals for the workplace.', href: '/programs' },
  { title: 'Customer Service Essentials', duration: '3 hours', desc: 'Communication, conflict resolution, and service skills.', href: '/programs' },
];

export default function MicroClassesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Micro-Classes' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image src="/images/pages/micro-classes-hero.jpg" alt="Micro-classes" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Micro-Classes</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Short, focused training you can complete in hours — not weeks.</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 border-b">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div>
              <Clock className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
              <h3 className="font-bold text-gray-900">2–10 Hours</h3>
              <p className="text-gray-600 text-sm">Complete in a single day or over a weekend.</p>
            </div>
            <div>
              <Award className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
              <h3 className="font-bold text-gray-900">Earn a Credential</h3>
              <p className="text-gray-600 text-sm">Each class leads to a recognized certification or badge.</p>
            </div>
            <div>
              <BookOpen className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
              <h3 className="font-bold text-gray-900">Stackable</h3>
              <p className="text-gray-600 text-sm">Combine micro-classes to build toward a full program credential.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Classes */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Available Micro-Classes</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CLASSES.map((c) => (
              <Link key={c.title} href={c.href} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-brand-blue-300 transition-all group">
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-brand-blue-600 transition-colors">{c.title}</h3>
                <span className="text-brand-blue-600 text-sm font-medium">{c.duration}</span>
                <p className="text-gray-600 text-sm mt-2">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Interested in a Micro-Class?</h2>
          <p className="text-brand-blue-100 mb-8 text-lg">Contact us to check availability and see if funding covers your micro-class.</p>
          <Link href="/contact" className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}
