import Link from 'next/link';
import Image from 'next/image';

interface ProgramHeroProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  duration?: string;
  cost?: string;
  placement?: string;
  salary?: string;
}

export default function ProgramHero({
  title,
  description,
  imageSrc,
  imageAlt,
  duration = '4-12 Weeks',
  cost = '$0',
  placement = '85%+',
  salary = '$35K+',
}: ProgramHeroProps) {
  return (
    <>
      {/* Hero Banner */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src={imageSrc} alt={imageAlt} fill className="object-cover" priority quality={100} sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">{title}</h1>
            <p className="text-lg md:text-xl text-slate-300 mb-6 max-w-3xl mx-auto">{description}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/apply" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-brand-orange-500 rounded-lg hover:bg-brand-orange-600 transition-colors">
                Apply Now
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors border border-slate-500">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Facts */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">

            {/* Quick Facts */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{duration}</div>
                <div className="text-black">Program Duration</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <div className="text-3xl font-bold text-brand-green-600 mb-2">{cost}</div>
                <div className="text-black">100% Funded</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <div className="text-3xl font-bold text-brand-blue-600 mb-2">{placement}</div>
                <div className="text-black">Job Placement</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <div className="text-3xl font-bold text-brand-orange-600 mb-2">{salary}</div>
                <div className="text-black">Starting Salary</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
