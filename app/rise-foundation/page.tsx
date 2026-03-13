import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  Users,
  Sparkles,
  ArrowRight,
  Shield,
  Leaf,
  HeartHandshake,
  Brain,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Rise Forward Foundation | Selfish Inc. | Mental Wellness & Holistic Healing | Indianapolis',
  description:
    'Rise Forward Foundation (operated by Selfish Inc.) provides mental wellness counseling, trauma recovery, addiction rehabilitation, divorce support, and holistic healing programs in Indianapolis, Indiana.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/rise-foundation',
  },
  openGraph: {
    title: 'Rise Forward Foundation | Mental Wellness & Holistic Healing',
    description:
      'Mental wellness counseling, trauma recovery, addiction rehabilitation, divorce support, and holistic healing in Indianapolis.',
    url: 'https://www.elevateforhumanity.org/rise-foundation',
    siteName: 'Rise Forward Foundation',
    type: 'website',
  },
};

export const revalidate = 600;

const PROGRAMS = [
  {
    icon: Brain,
    title: 'Trauma Recovery',
    desc: 'Therapeutic workshops, support groups, and mindfulness training for individuals healing from traumatic experiences.',
    href: '/rise-foundation/trauma-recovery',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    iconColor: 'text-purple-600',
  },
  {
    icon: Shield,
    title: 'Addiction Rehabilitation',
    desc: 'Personalized treatment plans, group therapy sessions, and relapse prevention workshops for lasting recovery.',
    href: '/rise-foundation/addiction-rehabilitation',
    bg: 'bg-brand-blue-50',
    border: 'border-brand-blue-200',
    iconColor: 'text-brand-blue-600',
  },
  {
    icon: HeartHandshake,
    title: 'Divorce Support',
    desc: 'Emotional adjustment workshops, co-parenting support, and individual counseling to navigate life after divorce.',
    href: '/rise-foundation/divorce-support',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    iconColor: 'text-rose-600',
  },
  {
    icon: Users,
    title: 'Young Adult Wellness',
    desc: 'Mental health support, life skills, and peer connection programs for teens and young adults ages 13-24.',
    href: '/rise-foundation/young-adult-wellness',
    bg: 'bg-brand-green-50',
    border: 'border-brand-green-200',
    iconColor: 'text-brand-green-600',
  },
  {
    icon: Sparkles,
    title: 'CurvatureBody Sculpting',
    desc: 'Non-invasive body sculpting and wellness services designed to support confidence and physical well-being.',
    href: '/rise-foundation/curvature',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
  },
  {
    icon: Leaf,
    title: 'Mindfulness & Workshops',
    desc: 'Community workshops on mindful living, emotional resilience, and holistic mental health — open to all.',
    href: '/rise-foundation/get-involved',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    iconColor: 'text-teal-600',
  },
];

export default function RiseFoundationPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* HERO */}
      <section className="relative h-[60vh] min-h-[380px] max-h-[640px] w-full overflow-hidden">
        <Image
          src="/images/pages/rise-foundation-page-2.jpg"
          alt="Rise Forward Foundation — mental wellness and holistic healing in Indianapolis"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-3">
            501(c)(3) Nonprofit · Indianapolis, Indiana
          </p>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-4 max-w-3xl">
            Welcome to Selfish Inc.
          </h1>
          <p className="text-lg sm:text-xl text-white/85 max-w-2xl mb-8 leading-relaxed">
            Your Partner in Mental Wellness and Holistic Healing
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="https://donate.stripe.com/5kA5kn7EsfrD08w4gg"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-7 py-3 rounded-full transition-colors shadow-lg text-sm"
            >
              Donate Now
            </Link>
            <Link
              href="/rise-foundation/get-involved"
              className="bg-white/15 border border-white/40 text-white font-bold px-7 py-3 rounded-full hover:bg-white/25 transition-colors text-sm backdrop-blur-sm"
            >
              Sign Up for Workshops
            </Link>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="bg-slate-900 py-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Our Mission</p>
          <p className="text-white text-lg sm:text-xl leading-relaxed">
            At Selfish Inc. Wellness, we take a holistic approach to mental health — providing vital support for individuals facing challenges related to trauma, divorce, and addiction. We believe healing is a right, not a privilege.
          </p>
        </div>
      </section>

      {/* PROGRAMS GRID */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-rose-600 font-bold text-xs uppercase tracking-widest mb-2">What We Offer</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Programs &amp; Services</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              Every program is designed to meet you where you are and support your journey toward healing, resilience, and wholeness.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROGRAMS.map((prog) => {
              const Icon = prog.icon;
              return (
                <Link
                  key={prog.title}
                  href={prog.href}
                  className={`group rounded-2xl border ${prog.border} ${prog.bg} p-6 hover:shadow-lg transition-all flex flex-col`}
                >
                  <Icon className={`w-8 h-8 mb-4 ${prog.iconColor}`} />
                  <h3 className="font-bold text-slate-900 text-base mb-2">{prog.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed flex-1">{prog.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-slate-700 group-hover:gap-2 transition-all">
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ABOUT SPLIT */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-xl" style={{ aspectRatio: '4/3' }}>
              <Image
                src="/images/pages/rise-foundation-page-1.jpg"
                alt="Rise Forward Foundation community healing programs"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <p className="text-rose-600 font-bold text-xs uppercase tracking-widest mb-3">About Us</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-5">Healing the Whole Person</h2>
              <div className="space-y-4 text-slate-600 text-base leading-relaxed">
                <p>
                  Selfish Inc. is a 501(c)(3) nonprofit organization operating as the Rise Forward Foundation. We provide mental wellness counseling, trauma recovery, addiction rehabilitation, and community outreach services in Indianapolis, Indiana.
                </p>
                <p>
                  Our name reflects our core belief: taking care of yourself is not selfish — it is necessary. When you heal, your family heals. When your family heals, your community heals.
                </p>
                <p>
                  We also operate CurvatureBody Sculpting, offering non-invasive body wellness services, and Meri-Go-Round, a line of holistic healing products designed to support your journey.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/rise-foundation/programs"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  View All Programs
                </Link>
                <Link
                  href="https://donate.stripe.com/5kA5kn7EsfrD08w4gg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-rose-600 text-rose-600 hover:bg-rose-50 font-bold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Support Our Work
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW YOUR DONATION HELPS */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-rose-600 font-bold text-xs uppercase tracking-widest mb-2">Make an Impact</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">How Your Donation Helps</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base">
              Your contributions directly fund programs that change lives.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: 'Trauma Recovery', desc: 'Funds therapeutic workshops, support groups, and mindfulness training — giving individuals the tools to rebuild their lives after traumatic experiences.', accent: 'border-l-4 border-purple-500' },
              { title: 'Divorce Support', desc: 'Enables emotional adjustment workshops, co-parenting support, and individual counseling — helping people navigate divorce with resilience.', accent: 'border-l-4 border-rose-500' },
              { title: 'Addiction Recovery', desc: 'Creates personalized treatment plans, group therapy sessions, and relapse prevention workshops for those overcoming substance use disorders.', accent: 'border-l-4 border-brand-blue-500' },
              { title: 'Community Outreach', desc: 'Hosts workshops, distributes resources, and collaborates with local agencies to raise awareness and break the stigma around mental health.', accent: 'border-l-4 border-brand-green-500' },
            ].map((item) => (
              <div key={item.title} className={`bg-slate-50 rounded-xl p-6 ${item.accent}`}>
                <h3 className="font-bold text-slate-900 text-base mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="https://donate.stripe.com/5kA5kn7EsfrD08w4gg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-rose-600 hover:bg-rose-700 text-white font-bold px-10 py-4 rounded-full transition-colors shadow-lg text-base"
            >
              <Heart className="inline w-4 h-4 mr-2 -mt-0.5" />
              Donate to Rise Forward Foundation
            </Link>
            <p className="text-slate-400 text-xs mt-3">Selfish Inc. is a registered 501(c)(3). Donations are tax-deductible.</p>
          </div>
        </div>
      </section>

      {/* WORKSHOPS CTA */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Upcoming Events</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Join a Wellness Workshop</h2>
          <p className="text-white/70 text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            We host regular workshops on mindful living, emotional resilience, and community support. All are welcome — no experience required.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/rise-foundation/get-involved"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3.5 rounded-full transition-colors text-sm"
            >
              Sign Up for Workshops
            </Link>
            <Link
              href="/rise-foundation/programs"
              className="bg-white/10 border border-white/25 text-white font-bold px-8 py-3.5 rounded-full hover:bg-white/20 transition-colors text-sm"
            >
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* HEALING PRODUCTS */}
      <section className="py-14 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-3">Meri-Go-Round Products</p>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-4">Shop Our Healing Products</h2>
              <p className="text-slate-600 text-base leading-relaxed mb-6">
                Browse items designed to uplift your mood and support your body. Our Meri-Go-Round product line includes holistic wellness items curated to complement your healing journey.
              </p>
              <Link
                href="https://curvaturebodysculpting.store/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold px-7 py-3 rounded-xl transition-colors text-sm"
              >
                Shop Now →
              </Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ aspectRatio: '4/3' }}>
              <Image
                src="/images/pages/rise-foundation.jpg"
                alt="Meri-Go-Round holistic healing products"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT STRIP */}
      <section className="py-10 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm mb-2">Questions? Ready to get started?</p>
          <p className="text-slate-900 font-bold text-base mb-4">
            Reach us at{' '}
            <a href="mailto:elevate4humanityedu@gmail.com" className="text-rose-600 hover:underline">
              elevate4humanityedu@gmail.com
            </a>
          </p>
          <div className="flex flex-wrap gap-3 justify-center text-sm">
            <Link href="/rise-foundation/programs" className="font-semibold text-slate-700 hover:text-rose-600 transition-colors">Our Programs →</Link>
            <span className="text-slate-300">|</span>
            <Link href="/rise-foundation/get-involved" className="font-semibold text-slate-700 hover:text-rose-600 transition-colors">Workshops →</Link>
            <span className="text-slate-300">|</span>
            <Link href="/rise-foundation/curvature" className="font-semibold text-slate-700 hover:text-rose-600 transition-colors">CurvatureBody Sculpting →</Link>
            <span className="text-slate-300">|</span>
            <Link href="/rise-foundation/donate" className="font-semibold text-slate-700 hover:text-rose-600 transition-colors">Donate →</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
