import Image from 'next/image';
import Link from 'next/link';

interface Highlight {
  title: string;
  description: string;
  icon?: string;
}

interface ProgramPageTemplateProps {
  // Hero Section
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroCTA1Text?: string;
  heroCTA1Link?: string;
  heroCTA2Text?: string;
  heroCTA2Link?: string;

  // Program Details
  duration: string;
  format: string; // e.g., "Hybrid (Online + In-Person)", "Apprenticeship", "Full-Time"
  jobs: string[]; // Array of job titles

  // Highlights Section
  highlights: Highlight[];

  // How to Start Steps
  howToStartSteps: string[];

  // Additional CTAs
  ctaImage?: string;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
}

export default function ProgramPageTemplate({
  heroImage,
  heroTitle,
  heroSubtitle,
  heroDescription,
  heroCTA1Text = "Apply Now",
  heroCTA1Link = "/apply",
  heroCTA2Text = "Learn More",
  heroCTA2Link = "/contact",
  duration,
  format,
  jobs,
  highlights,
  howToStartSteps,
  ctaImage,
  ctaTitle,
  ctaDescription,
  ctaButtonText = "Get Started",
  ctaButtonLink = "/apply",
}: ProgramPageTemplateProps) {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative min-h-[600px] flex items-center">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt={heroTitle}
            fill
          sizes="100vw"
            className="object-cover"
            priority
            quality={90}
          />
        </div>

        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-3xl text-white">
            <p className="text-sm font-bold uppercase tracking-wide text-brand-orange-400 mb-4">
              {heroSubtitle}
            </p>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-2xl">
              {heroTitle}
            </h1>
            <p className="text-xl md:text-2xl mb-8 drop-shadow-lg text-white/95">
              {heroDescription}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={heroCTA1Link}
                className="px-8 py-4 bg-brand-orange-600 text-white font-bold rounded-full hover:bg-brand-orange-700 transition text-lg shadow-2xl"
              >
                {heroCTA1Text}
              </Link>
              <Link
                href={heroCTA2Link}
                className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-slate-100 transition text-lg shadow-2xl border-2 border-white"
              >
                {heroCTA2Text}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Program Quick Facts */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Duration */}
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-blue-600" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Program Duration</h3>
              <p className="text-2xl font-bold text-brand-blue-600">{duration}</p>
            </div>

            {/* Format */}
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-green-600" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Learning Format</h3>
              <p className="text-xl font-semibold text-brand-green-600">{format}</p>
            </div>

            {/* Jobs */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Career Opportunities</h3>
              <p className="text-sm text-black">{jobs.length}+ Job Titles</p>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs You Can Get */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-black mb-4">
              Jobs You Can Get
            </h2>
            <p className="text-center text-black mb-12">
              Graduates are qualified for these in-demand positions
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {jobs.map((job, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm"
                >
                  <svg className="w-6 h-6 text-brand-green-600 flex-shrink-0" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-black">{job}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Program Highlights */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-black mb-16 text-2xl md:text-3xl lg:text-4xl">
            Program Highlights
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {highlights.map((highlight, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition border border-slate-200"
              >
                {highlight.icon && (
                  <div className="w-16 h-16 bg-brand-orange-100 rounded-full flex items-center justify-center mb-6">
                    <span className="text-3xl">{highlight.icon}</span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-black mb-4">
                  {highlight.title}
                </h3>
                <p className="text-black leading-relaxed">
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Start */}
      <section className="py-20   ">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-black mb-4 text-2xl md:text-3xl lg:text-4xl">
              How to Get Started
            </h2>
            <p className="text-center text-xl text-black mb-12">
              Follow these simple steps to begin your training
            </p>

            <div className="space-y-6">
              {howToStartSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-6 bg-white rounded-xl p-6 shadow-md"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg text-black leading-relaxed">{step}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-black mb-4">
                Ready to Take the First Step?
              </h3>
              <p className="text-black mb-6">
                Call us at <a href="/support" className="text-brand-orange-600 font-bold hover:underline">support center</a> or apply online to get started today.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/apply"
                  className="px-8 py-4 bg-brand-orange-600 text-white font-bold rounded-full hover:bg-brand-orange-700 transition text-lg"
                >
                  Apply Now
                </Link>
                <a
                  href="/support"
                  className="px-8 py-4 border-2 border-brand-orange-600 text-brand-orange-600 font-bold rounded-full hover:bg-brand-orange-50 transition text-lg"
                >
                  Call Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Image */}
      {ctaImage && ctaTitle && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src={ctaImage}
                  alt={ctaTitle}
                  fill
          sizes="100vw"
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-black mb-6 text-2xl md:text-3xl lg:text-4xl">
                  {ctaTitle}
                </h2>
                <p className="text-xl text-black mb-8 leading-relaxed">
                  {ctaDescription}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href={ctaButtonLink}
                    className="px-8 py-4 bg-brand-orange-600 text-white font-bold rounded-full hover:bg-brand-orange-700 transition text-lg"
                  >
                    {ctaButtonText}
                  </Link>
                  <a
                    href="/support"
                    className="px-8 py-4 border-2 border-brand-orange-600 text-brand-orange-600 font-bold rounded-full hover:bg-brand-orange-50 transition text-lg"
                  >
                    Call support center
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA Banner */}
      <section className="py-16    text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Career?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Apply today and an advisor will contact you within 1-2 business days to discuss funding options and next steps.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/apply"
              className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-full hover:bg-slate-100 transition text-lg"
            >
              Apply Now
            </Link>
            <a
              href="mailto:info@elevateforhumanity.org"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition text-lg"
            >
              Email an Advisor
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
