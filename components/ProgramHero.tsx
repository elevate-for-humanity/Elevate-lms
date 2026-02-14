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

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
            <div className="max-w-4xl">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 md:mb-8 tracking-tight drop-shadow-2xl">
                {title}
              </h1>
              <p className="text-xl sm:text-2xl md:text-3xl text-white mb-8 md:mb-10 leading-relaxed drop-shadow-lg max-w-3xl">
                {description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center px-8 py-4 md:px-10 md:py-5 text-lg md:text-xl font-bold text-white bg-orange-500 rounded-full hover:bg-orange-600 transition-all hover:scale-105 shadow-2xl"
                >
                  Apply Now - Free Training
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 md:px-10 md:py-5 text-lg md:text-xl font-bold text-white bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all hover:scale-105 border-2 border-white/50 shadow-2xl"
                >
                  Learn More
                </Link>
              </div>
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
                <div className="text-3xl font-bold text-green-600 mb-2">{cost}</div>
                <div className="text-black">100% Funded</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <div className="text-3xl font-bold text-brand-blue-600 mb-2">{placement}</div>
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
