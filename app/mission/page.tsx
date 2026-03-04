import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import MissionHeroVideo from './MissionHeroVideo';

export const metadata: Metadata = {
  title: 'Our Mission | Elevate for Humanity',
  description: 'Our mission is to create pathways out of poverty and into prosperity through career training at no cost to eligible participants — justice-involved individuals, low-income families, veterans, and anyone facing barriers to employment.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/mission',
  },
};

const coreValues = [
  {
    title: 'Access Without Barriers',
    description: 'No one is turned away based on background, income, or history. Training is free for those who need it most.',
    image: '/images/heroes-hq/jri-hero.jpg',
  },
  {
    title: 'Measurable Outcomes',
    description: 'Every program is measured by completion rates, employment placement, and wage gains — not enrollment numbers.',
    image: '/images/heroes-hq/how-it-works-hero.jpg',
  },
  {
    title: 'Dignity in Work',
    description: 'We believe stable employment is the foundation of personal transformation and community strength.',
    image: '/images/heroes-hq/career-services-hero.jpg',
  },
  {
    title: 'Community Partnership',
    description: 'We work with workforce boards, employers, and funding agencies to build pathways that serve the whole community.',
    image: '/images/programs-hq/training-classroom.jpg',
  },
];

const populations = [
  { text: 'Justice-involved individuals re-entering the workforce', image: '/images/heroes-hq/jri-hero.jpg' },
  { text: 'Low-income families seeking career advancement', image: '/images/heroes-hq/funding-hero.jpg' },
  { text: 'Veterans transitioning to civilian employment', image: '/images/heroes-hq/success-hero.jpg' },
  { text: 'Youth aging out of foster care', image: '/images/programs-hq/students-learning.jpg' },
  { text: 'Individuals recovering from substance use disorders', image: '/images/heroes-hq/contact-hero.jpg' },
  { text: 'Anyone facing systemic barriers to employment', image: '/images/heroes-hq/about-hero.jpg' },
];

const steps = [
  {
    num: '1',
    title: 'Enroll in a Training Program',
    desc: 'Choose from healthcare, skilled trades, technology, or business programs. Most are fully funded through WIOA, WRG, or employer sponsorship.',
    image: '/images/programs-hq/business-office.jpg',
  },
  {
    num: '2',
    title: 'Complete Training and Earn Credentials',
    desc: 'Finish your program, pass certification exams, and earn industry-recognized credentials that employers value.',
    image: '/images/programs-hq/cna-training.jpg',
  },
  {
    num: '3',
    title: 'Get Placed in Employment',
    desc: 'Our employer partners hire directly from our programs. Career services support you through placement and beyond.',
    image: '/images/heroes-hq/employer-hero.jpg',
  },
];

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'About', href: '/about' },
            { label: 'Our Mission' },
          ]} />
        </div>
      </div>

      {/* Video Hero */}
      <MissionHeroVideo />

      {/* Title Bar */}
      <div className="bg-slate-900 py-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Our Mission
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
            To create pathways out of poverty and into prosperity by providing free,
            high-quality career training to those who need it most.
          </p>
        </div>
      </div>

      {/* The Problem */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-bold text-black mb-6">The Problem We Solve</h2>
              <p className="text-lg text-black leading-relaxed mb-4">
                Millions of Americans face barriers to employment — criminal records, lack of
                credentials, unstable housing, or simply not knowing where to start.
              </p>
              <p className="text-lg text-black leading-relaxed">
                Elevate for Humanity exists to close that gap. We connect public funding, employer
                demand, and credential-backed training into a single system that works for people
                who have been left behind.
              </p>
            </div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              <Image
                src="/images/programs-hq/students-learning.jpg"
                alt="Students in workforce training"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-black text-center mb-10">Who We Serve</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {populations.map((pop, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image src={pop.image} alt={pop.text} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                </div>
                <div className="p-4">
                  <p className="text-black font-medium">{pop.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-black text-center mb-10">Core Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {coreValues.map((value) => (
              <div key={value.title} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="relative aspect-[16/7] overflow-hidden">
                  <Image src={value.image} alt={value.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-black mb-2">{value.title}</h3>
                  <p className="text-black">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-black text-center mb-10">How It Works</h2>
          <div className="space-y-8">
            {steps.map((step) => (
              <div key={step.num} className="flex flex-col md:flex-row bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="relative w-full md:w-1/3 aspect-[16/10] flex-shrink-0 overflow-hidden">
                  <Image src={step.image} alt={step.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                </div>
                <div className="p-6 flex-1">
                  <div className="w-10 h-10 bg-brand-red-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 mb-3">{step.num}</div>
                  <h3 className="text-lg font-bold text-black mb-2">{step.title}</h3>
                  <p className="text-black">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Start?</h2>
          <p className="text-slate-300 mb-8 text-lg">
            View available programs or learn more about our organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/programs"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-red-600 text-white rounded-lg font-bold hover:bg-brand-red-700 transition-colors text-lg"
            >
              View Programs
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white rounded-lg font-bold hover:bg-white/10 transition-colors text-lg"
            >
              About Elevate
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
