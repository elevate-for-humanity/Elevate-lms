import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Jozanna George | Our Team | Elevate for Humanity',
  description: 'Jozanna George — Director of Enrollment & Beauty Industry Programs at Elevate for Humanity Career & Technical Institute.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Team', href: '/about/team' }, { label: 'Jozanna George' }]} />
      </div>

      <section className="py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/about/team" className="inline-flex items-center text-sm text-black hover:text-brand-red-600 mb-8">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Team
          </Link>

          <div className="grid lg:grid-cols-5 gap-10 items-start">
            <div className="lg:col-span-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/jozanna-george.jpg"
                  alt="Jozanna George"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Jozanna George</h1>
              <p className="text-brand-red-600 font-bold text-lg mb-6">Director of Enrollment & Beauty Industry Programs</p>
              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>Jozanna is a multi-licensed beauty professional holding Nail Technician, Nail Instructor, and Esthetician licenses. She oversees the nail program at Textures Institute of Cosmetology and manages enrollment operations for Elevate for Humanity.</p>
                <p>Her expertise spans beauty industry education, student enrollment processes, and program coordination. Jozanna ensures that prospective students receive guidance through the application and funding eligibility process, connecting them with the right training programs and support services.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
