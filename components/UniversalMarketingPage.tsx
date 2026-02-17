import Image from "next/image";
import { sanitizeHtml } from '@/lib/sanitize';
import Link from "next/link";
import { ArrowRight } from 'lucide-react';

interface UniversalMarketingPageProps {
  title: string;
  subtitle?: string;
  heroImage: string;
  sections?: Array<{
    title: string;
    content: string;
    image?: string;
    imagePosition?: "left" | "right";
  }>;
  cta?: {
    title: string;
    description: string;
    primaryButton: { text: string; href: string };
    secondaryButton?: { text: string; href: string };
  };
}

export default function UniversalMarketingPage({
  title,
  subtitle,
  heroImage,
  sections = [],
  cta,
}: UniversalMarketingPageProps) {
  return (
    <main className="bg-white">
      {/* TOP BANNER */}
      <section className="   py-3 sticky top-0 z-50 shadow-lg">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-2 text-xs font-bold text-white animate-pulse">
                🔥 NOW ENROLLING
              </span>
              <p className="text-white font-semibold text-sm sm:text-base">
                Free Career Training - 100% Government Funded • Start in 2 Weeks
              </p>
            </div>
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2 text-sm font-bold text-brand-orange-600 hover:bg-brand-orange-50 transition-all shadow-lg hover:scale-105 whitespace-nowrap"
            >
              Apply Now →
            </Link>
          </div>
        </div>
      </section>

      {/* HERO */}
      <section className="relative h-[700px] overflow-hidden">
        <Image
          src={heroImage}
          alt={title}
          fill
          className="object-cover"
          priority
          quality={100}
        />
        

        <div className="relative h-full flex items-center">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-light text-white mb-6 leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xl md:text-2xl text-slate-200 font-light mb-8 leading-relaxed">
                  {subtitle}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange-500 text-white font-semibold rounded hover:bg-brand-orange-600 transition-colors shadow-lg"
                >
                  Apply Now
                  <ArrowRight size={20} className="ml-2" />
                </Link>
                <Link
                  href="/programs"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-semibold rounded border-2 border-white hover:bg-slate-50 transition-colors shadow-lg"
                >
                  Explore Programs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GOVERNMENT PARTNERS BAR */}
      <section className="bg-slate-50 border-y border-slate-200 py-6">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Approved Workforce Development Partner
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <div className="text-center">
              <p className="font-semibold text-black">EmployIndy</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-black">WorkOne</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-black">Indiana DWD</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-black">US Dept of Labor</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT SECTIONS */}
      {sections.map((section, index) => (
        <section
          key={index}
          className={`py-20 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {section.imagePosition === "right" ? (
                <>
                  <div>
                    <h2 className="text-4xl font-light text-black mb-6 leading-tight text-2xl md:text-3xl lg:text-4xl">
                      {section.title}
                    </h2>
                    <div
                      className="text-lg text-black leading-relaxed prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }}
                    />
                  </div>
                  {section.image && (
                    <div className="relative h-[500px] rounded-xl overflow-hidden shadow-2xl">
                      <Image
                        src={section.image}
                        alt={section.title}
                        fill
                        className="object-cover"
                        quality={100}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {section.image && (
                    <div className="relative h-[500px] rounded-xl overflow-hidden shadow-2xl">
                      <Image
                        src={section.image}
                        alt={section.title}
                        fill
                        className="object-cover"
                        quality={100}
                      />
                    </div>
                  )}
                  <div>
                    <h2 className="text-4xl font-light text-black mb-6 leading-tight text-2xl md:text-3xl lg:text-4xl">
                      {section.title}
                    </h2>
                    <div
                      className="text-lg text-black leading-relaxed prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      ))}

      {/* CTA WITH IMAGE */}
      {cta && (
        <section className="py-16   ">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative h-[400px] rounded-xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/artlist/hero-training-3.jpg"
                  alt="Take action today"
                  fill
                  className="object-cover"
                  quality={100}
                />
              </div>
              <div className="text-white">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  {cta.title}
                </h2>
                <p className="text-xl mb-8 text-brand-orange-50">
                  {cta.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href={cta.primaryButton.href}
                    className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-orange-600 font-bold rounded-lg hover:bg-brand-orange-50 transition-colors shadow-lg"
                  >
                    {cta.primaryButton.text}
                    <ArrowRight size={20} className="ml-2" />
                  </Link>
                  {cta.secondaryButton && (
                    <Link
                      href={cta.secondaryButton.href}
                      className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange-700 text-white font-semibold rounded-lg hover:bg-brand-orange-800 transition-colors shadow-lg"
                    >
                      {cta.secondaryButton.text}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
