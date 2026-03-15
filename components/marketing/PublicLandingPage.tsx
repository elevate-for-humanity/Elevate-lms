import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

export interface LandingPageConfig {
  breadcrumbs: { label: string; href?: string }[];
  hero: {
    image: string;
    tag?: string;
    tagColor?: string;
    title: string;
    subtitle: string;
  };
  intro: {
    heading: string;
    paragraphs: string[];
    image?: string;
  };
  features?: {
    heading: string;
    items: string[];
  };
  steps?: {
    heading: string;
    items: { title: string; desc: string }[];
  };
  cta: {
    heading: string;
    subtitle: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel?: string;
    secondaryHref?: string;
    bgColor?: string;
  };
}

export default function PublicLandingPage({ config }: { config: LandingPageConfig }) {
  const ctaBg = config.cta.bgColor || 'bg-brand-red-600';

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={config.breadcrumbs} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] overflow-hidden">
          <Image src={config.hero.image} alt={config.hero.title} fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white py-10 border-t">
          <div className="max-w-5xl mx-auto px-4 text-center">
            {config.hero.tag && (
              <p className={`font-semibold text-sm mb-2 uppercase tracking-wide ${config.hero.tagColor || 'text-brand-blue-300'}`}>
                {config.hero.tag}
              </p>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">{config.hero.title}</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">{config.hero.subtitle}</p>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className={`grid ${config.intro.image ? 'md:grid-cols-2 gap-10 items-start' : ''}`}>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">{config.intro.heading}</h2>
              {config.intro.paragraphs.map((p, i) => (
                <p key={i} className="text-slate-700 leading-relaxed mb-4">{p}</p>
              ))}
              <Link href={config.cta.primaryHref} className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-full font-bold transition hover:scale-105 shadow-lg mt-2">
                {config.cta.primaryLabel} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            {config.intro.image && (
              <div className="relative h-[300px] rounded-2xl overflow-hidden shadow-xl">
                <Image src={config.intro.image} alt={config.intro.heading} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      {config.features && (
        <section className="py-14 sm:py-20 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">{config.features.heading}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.features.items.map((item) => (
                <div key={item} className="flex items-start gap-3 bg-white rounded-xl p-5 border border-slate-200">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <p className="text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Steps */}
      {config.steps && (
        <section className="py-14 sm:py-20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">{config.steps.heading}</h2>
            <div className="space-y-6">
              {config.steps.items.map((s, i) => (
                <div key={i} className="flex gap-5 items-start">
                  <div className="w-10 h-10 rounded-full bg-brand-red-600 text-white text-lg font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{s.title}</h3>
                    <p className="text-slate-600">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className={`py-16 sm:py-24 ${ctaBg}`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{config.cta.heading}</h2>
          <p className="text-xl text-white/90 mb-10">{config.cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href={config.cta.primaryHref} className="bg-white text-slate-900 px-10 py-5 rounded-full font-bold text-xl hover:bg-slate-50 transition hover:scale-105 shadow-lg">
              {config.cta.primaryLabel}
            </Link>
            {config.cta.secondaryLabel && config.cta.secondaryHref && (
              <Link href={config.cta.secondaryHref} className="border-2 border-white text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-white/10 transition">
                {config.cta.secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
