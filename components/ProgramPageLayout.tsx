import Image from 'next/image';
import Link from 'next/link';

interface ProgramHighlight {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}

interface ProgramPageProps {
  // Hero Section
  heroImage: string;
  heroImageAlt: string;
  title: string;
  subtitle: string;
  ctaPrimary: { text: string; href: string };
  ctaSecondary: { text: string; href: string };

  // Quick Facts
  duration: string;
  cost: string;
  placement: string;
  salary: string;

  // Overview
  overviewTitle: string;
  overviewDescription: string[];
  certifications: string[];

  // Visual Highlights
  highlights: ProgramHighlight[];

  // Career Outcomes
  careerTitle: string;
  careerDescription: string;
  careerImage: string;
  careerImageAlt: string;
  jobTitles: string[];

  // Application CTA
  finalCtaTitle: string;
  finalCtaDescription: string;
}

export default function ProgramPageLayout({
  heroImage,
  heroImageAlt,
  title,
  subtitle,
  ctaPrimary,
  ctaSecondary,
  duration,
  cost,
  placement,
  salary,
  overviewTitle,
  overviewDescription,
  certifications,
  highlights,
  careerTitle,
  careerDescription,
  careerImage,
  careerImageAlt,
  jobTitles,
  finalCtaTitle,
  finalCtaDescription,
}: ProgramPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner — image only */}
      <section className="relative h-[350px] sm:h-[400px]">
        <Image
          src={heroImage}
          alt={heroImageAlt}
          fill
          className="object-cover"
          priority
          quality={90}
          sizes="100vw"
        />
      </section>

      {/* Title + CTA below hero */}
      <section className="py-10 sm:py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-900 leading-tight">
              {title}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-slate-600 leading-relaxed">
              {subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={ctaPrimary.href}
                className="bg-brand-orange-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-orange-700 text-lg transition-all"
              >
                {ctaPrimary.text}
              </Link>
              <Link
                href={ctaSecondary.href}
                className="bg-slate-100 text-slate-900 px-8 py-4 rounded-lg font-bold hover:bg-slate-200 text-lg transition-all"
              >
                {ctaSecondary.text}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Facts - Visual Cards */}
      <section className="py-16   ">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-brand-orange-100 p-8 text-center transform hover:scale-105 transition-all">
              <div className="text-5xl font-black text-brand-orange-600 mb-3 text-3xl md:text-4xl lg:text-5xl">{duration}</div>
              <div className="text-black font-semibold text-lg">Program Duration</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-brand-green-100 p-8 text-center transform hover:scale-105 transition-all">
              <div className="text-5xl font-black text-brand-green-600 mb-3 text-3xl md:text-4xl lg:text-5xl">{cost}</div>
              <div className="text-black font-semibold text-lg">100% Funded</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-brand-blue-100 p-8 text-center transform hover:scale-105 transition-all">
              <div className="text-5xl font-black text-brand-blue-600 mb-3 text-3xl md:text-4xl lg:text-5xl">{placement}</div>
              <div className="text-black font-semibold text-lg">Job Placement</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-brand-orange-100 p-8 text-center transform hover:scale-105 transition-all">
              <div className="text-5xl font-black text-brand-orange-600 mb-3 text-3xl md:text-4xl lg:text-5xl">{salary}</div>
              <div className="text-black font-semibold text-lg">Starting Salary</div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Overview with Image */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl font-black mb-12 text-center text-3xl md:text-4xl lg:text-5xl">{overviewTitle}</h2>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div className="space-y-6">
                {overviewDescription.map((paragraph, index) => (
                  <p key={index} className="text-xl text-black leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="   rounded-3xl p-10 shadow-xl">
                <h3 className="text-3xl font-bold mb-6 text-black">Certifications You'll Earn</h3>
                <div className="space-y-4">
                  {certifications.map((cert, index) => (
                    <div key={index} className="flex items-start bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center mr-4">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                      </div>
                      <span className="text-lg font-medium text-black">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Highlights - Replace Bullets */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl font-black mb-16 text-center text-3xl md:text-4xl lg:text-5xl">What You'll Learn</h2>

            <div className="space-y-16">
              {highlights.map((highlight, index) => (
                <div
                  key={index}
                  className={`grid md:grid-cols-2 gap-12 items-center ${
                    index % 2 === 1 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                    <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl">
                      <Image
                        src={highlight.imageSrc}
                        alt={highlight.imageAlt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </div>

                  <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                    <h3 className="text-4xl font-bold mb-6 text-black text-2xl md:text-3xl lg:text-4xl">{highlight.title}</h3>
                    <p className="text-xl text-black leading-relaxed">{highlight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Career Outcomes with Visual */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl font-black mb-12 text-center text-3xl md:text-4xl lg:text-5xl">{careerTitle}</h2>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src={careerImage}
                  alt={careerImageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              <div>
                <p className="text-xl text-black leading-relaxed mb-8">
                  {careerDescription}
                </p>

                <h3 className="text-3xl font-bold mb-6 text-black">Career Opportunities</h3>
                <div className="grid grid-cols-1 gap-4">
                  {jobTitles.map((job, index) => (
                    <div key={index} className="   rounded-xl p-5 shadow-sm border-l-4 border-brand-blue-500">
                      <span className="text-lg font-semibold text-black">{job}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20    text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-black mb-6 text-3xl md:text-4xl lg:text-5xl">{finalCtaTitle}</h2>
            <p className="text-2xl mb-10 opacity-95">{finalCtaDescription}</p>
            <div className="flex flex-wrap gap-6 justify-center">
              <Link
                href="/apply"
                className="bg-white text-brand-orange-600 px-12 py-6 rounded-full font-bold hover:bg-gray-100 text-xl shadow-2xl transition-all hover:scale-105"
              >
                Start Your Application
              </Link>
              <Link
                href="/contact"
                className="bg-transparent border-4 border-white text-white px-12 py-6 rounded-full font-bold hover:bg-white hover:text-brand-orange-600 text-xl shadow-2xl transition-all hover:scale-105"
              >
                Talk to an Advisor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
