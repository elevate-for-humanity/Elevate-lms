import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Heart, Users, Shield, Target, ArrowRight, 
  GraduationCap 
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

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
    icon: Shield,
  },
  {
    title: 'Measurable Outcomes',
    description: 'Every program is measured by completion rates, employment placement, and wage gains — not enrollment numbers.',
    icon: Target,
  },
  {
    title: 'Dignity in Work',
    description: 'We believe stable employment is the foundation of personal transformation and community strength.',
    icon: Heart,
  },
  {
    title: 'Community Partnership',
    description: 'We work with workforce boards, employers, and funding agencies to build pathways that serve the whole community.',
    icon: Users,
  },
];

const populations = [
  'Justice-involved individuals re-entering the workforce',
  'Low-income families seeking career advancement',
  'Veterans transitioning to civilian employment',
  'Youth aging out of foster care',
  'Individuals recovering from substance use disorders',
  'Anyone facing systemic barriers to employment',
];

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-white">      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'About', href: '/about' },
            { label: 'Our Mission' },
          ]} />
        </div>
      </div>

      {/* Hero — image with title overlaid */}
      <section className="relative h-[300px] sm:h-[400px] overflow-hidden bg-white">
        <Image src="/images/pages/mission-page-1.jpg" alt="Our mission to elevate communities" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Our Mission</h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
              To create pathways out of poverty and into prosperity by providing free,
              high-quality career training to those who need it most.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* The Problem */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">The Problem We Solve</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-700 leading-relaxed">
              Millions of Americans face barriers to employment — criminal records, lack of 
              credentials, unstable housing, or simply not knowing where to start. Traditional 
              workforce programs often require upfront costs, rigid schedules, or exclude the 
              populations that need help the most.
            </p>
            <p className="text-lg text-slate-700 leading-relaxed mt-4">
              Elevate for Humanity exists to close that gap. We connect public funding, employer 
              demand, and credential-backed training into a single system that works for people 
              who have been left behind.
            </p>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Who We Serve</h2>
          <div className="bg-brand-blue-50 rounded-xl p-6 border border-brand-blue-100">
            <ul className="space-y-3">
              {populations.map((pop, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-slate-700">{pop}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Core Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Core Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {coreValues.map((value) => (
              <div key={value.title} className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-5 h-5 text-brand-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-slate-600">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">How It Works</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Enroll in a Training Program</h3>
                <p className="text-slate-600">Choose from healthcare, skilled trades, technology, or business programs. Most are fully funded through WIOA, WRG, or employer sponsorship.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Complete Training and Earn Credentials</h3>
                <p className="text-slate-600">Finish your program, pass certification exams, and earn industry-recognized credentials that employers value.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Get Placed in Employment</h3>
                <p className="text-slate-600">Our employer partners hire directly from our programs. Career services support you through placement and beyond.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Ready to Start?</h2>
          <p className="text-slate-600 mb-6">
            View available programs or learn more about our organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 transition-colors"
            >
              <GraduationCap className="w-5 h-5" />
              View Programs
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-white transition-colors"
            >
              About Elevate
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
