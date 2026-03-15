'use client';

import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { StateConfig, getOtherStates } from '@/config/states';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import PageVideoHero from '@/components/ui/PageVideoHero';

interface StateCareerTrainingPageProps {
  state: StateConfig;
}

export default function StateCareerTrainingPage({ state }: StateCareerTrainingPageProps) {
  const otherStates = getOtherStates(state.slug);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: `Career Training ${state.name}` }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative w-full">
        <PageVideoHero
          videoSrc="/videos/training-providers-hero.mp4"
          posterSrc="/images/pages/comp-state-career-hero.jpg"
          posterAlt={`Career Training in ${state.name}`}
          size="marketing"
        />
        <div className="bg-white py-10 border-t">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <div className="flex items-center gap-2 text-brand-green-300 mb-4 justify-center">
              <MapPin className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Serving All of {state.name}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{state.careerTraining.headline}</h1>
            <p className="text-lg text-slate-300 mb-6 max-w-3xl mx-auto">{state.careerTraining.description}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/programs" className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange-500 hover:bg-brand-orange-600 text-white rounded-lg text-lg font-bold transition-colors">
                Explore Programs <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/how-it-works" className="inline-flex items-center justify-center px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white border border-slate-500 rounded-lg text-lg font-bold transition-colors">
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Workforce Training in {state.name}
          </h2>
          <p className="text-gray-600 mb-8">
            Workforce and career training programs in {state.name} emphasize:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {state.careerTraining.features.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Serving {state.name} Communities
          </h2>
          <div className="flex flex-wrap gap-3">
            {state.majorCities.map((city) => (
              <span 
                key={city} 
                className="px-4 py-2 bg-white rounded-full text-gray-700 shadow-sm"
              >
                {city}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Other States */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Programs in Other States
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {otherStates.map((s) => (
              <Link
                key={s.slug}
                href={`/career-training-${s.slug}`}
                className="p-4 bg-gray-50 rounded-lg hover:bg-brand-green-50 transition-colors text-center"
              >
                <span className="font-medium text-gray-900">{s.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-green-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Career Journey?
          </h2>
          <p className="text-brand-green-100 mb-8">
            Many programs are free for qualifying {state.demonym}. Check your eligibility today.
          </p>
          <Link
            href="/wioa-eligibility"
            className="inline-flex items-center px-8 py-4 bg-white text-brand-green-600 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
          >
            Check Eligibility <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
