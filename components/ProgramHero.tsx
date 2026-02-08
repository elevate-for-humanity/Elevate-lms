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
      {/* High-Quality Hero Banner */}
      <section className="relative h-[400px] sm:h-[500px] md:h-[600px] w-full overflow-hidden">
        {/* Hero Image - Maximum Quality */}
        <div className="absolute inset-0">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            priority
            quality={100}
            sizes="100vw"
          />
          {/* Subtle overlay for text readability */}
          <div className="absolute inset-0    " />
        </div>

        {/* Text removed from hero banner - clean image only */}
      </section>

      {/* Quick Facts */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">

            {/* Quick Facts */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <div className="text-3xl font-bold text-brand-red-600 mb-2">{duration}</div>
                <div className="text-black">Program Duration</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{cost}</div>
                <div className="text-black">100% Funded</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{placement}</div>
                <div className="text-black">Job Placement</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{salary}</div>
                <div className="text-black">Starting Salary</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
