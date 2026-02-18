import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { programs } from '@/app/data/programs';

export const metadata: Metadata = {
  title: 'Healthcare Programs | Elevate for Humanity',
  description:
    'Healthcare training programs - CNA ($1,200), Medical Assistant, Home Health Aide, and more. Payment plans available.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/industries/healthcare',
  },
};

export default function HealthcarePage() {
  // Filter healthcare programs
  const healthcarePrograms = programs.filter((p) =>
    [
      'cna-certification',
      'medical-assistant',
      'home-health-aide',
      'phlebotomy-technician',
      'cpr-first-aid-hsi',
      'emergency-health-safety-tech',
      'certified-peer-recovery-coach',
    ].includes(p.slug)
  );

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Industries", href: "/industries" }, { label: "Healthcare" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-[450px] md:h-[500px] w-full overflow-hidden">
        <Image src="/images/healthcare/cpr-group-training-session.jpg" alt="Healthcare Programs" fill className="object-cover" quality={85} loading="lazy" />
      </section>

      {/* Programs Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4 uppercase">
              Healthcare Training Programs
            </h2>
            <p className="text-lg text-black">
              Choose from {healthcarePrograms.length} healthcare programs
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {healthcarePrograms.map((program: any) => {
              return (
                <Link
                  key={program.slug}
                  href={`/programs/${program.slug}`}
                  className="group block bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="aspect-video relative overflow-hidden bg-gray-900">
                    {program.heroImage && (
                      <Image
                        src={program.heroImage}
                        alt={program.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-all duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                    
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {program.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-white/90">
                        <span>{program.duration}</span>
                        {program.format && (
                          <>
                            <span>•</span>
                            <span>{program.format}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-white">
                    <p className="text-brand-orange-500 font-bold text-lg group-hover:text-brand-orange-600 transition-colors flex items-center gap-2">
                      Learn More
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Healthcare Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                Why Choose Healthcare?
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-black mb-1">
                      High Demand
                    </h3>
                    <p className="text-black">
                      Healthcare jobs are always in demand with excellent job
                      security
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-black mb-1">Good Pay</h3>
                    <p className="text-black">
                      Competitive wages with opportunities for advancement
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-black mb-1">
                      Make a Difference
                    </h3>
                    <p className="text-black">
                      Help people every day and make a real impact in your
                      community
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-brand-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-black mb-1">
                      Fast Training
                    </h3>
                    <p className="text-black">
                      Get certified and start working in weeks, not years
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative h-96 rounded-xl overflow-hidden shadow-xl">
              <Image
                src="/images/healthcare/hero-healthcare-professionals.jpg"
                alt="Healthcare Career"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
