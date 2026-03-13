import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  Briefcase,
  GraduationCap,
  Heart,
  DollarSign,
  Phone,
  Shield,
  CheckCircle,
} from 'lucide-react';
import ProgressSteps from '@/components/start/ProgressSteps';
import StartForm from '@/components/start/StartForm';

export const metadata: Metadata = {
  title: 'Start Here | Elevate for Humanity',
  description:
    'Start your career training application. We help you navigate workforce funding, WIOA eligibility, and enrollment in Indiana.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/start',
  },
};

const PATHWAYS = [
  {
    title: 'I Want to Train for a New Career',
    description: 'Healthcare, skilled trades, technology, and more.',
    icon: GraduationCap,
    href: '/programs',
  },
  {
    title: 'I Need Help with Funding',
    description: 'Check WIOA, WRG, and other workforce funding options.',
    icon: Briefcase,
    href: '/funding',
  },
  {
    title: 'I Want to Earn While I Learn',
    description: 'Apprenticeships and employer-based training.',
    icon: DollarSign,
    href: '/programs/apprenticeships',
  },
  {
    title: 'I Have a Background (Second Chance)',
    description: 'Programs that welcome justice-involved individuals.',
    icon: Heart,
    href: '/jri',
  },
];

export default function StartPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-800 text-white">
        <Image
          src="/images/pages/how-it-works-hero.jpg"
          alt="Career training students"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
              <Shield className="h-4 w-4" /> ETPL-listed &middot; WIOA-approved &middot; Indiana
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Start here. We&apos;ll guide you through funding and enrollment.
            </h1>
            <p className="mt-5 text-lg text-gray-300">
              One intake form. We figure out your eligibility, connect you with
              the right program, and move you toward enrollment — no runaround.
            </p>
          </div>
        </div>
      </section>

      {/* Main: Form + Steps */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left: context */}
          <div>
            <ProgressSteps current={1} />

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="text-lg font-semibold text-gray-900">1. Apply once</div>
                <p className="mt-2 text-sm text-gray-600">
                  One clean intake. No bouncing between pages.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="text-lg font-semibold text-gray-900">2. Get guided</div>
                <p className="mt-2 text-sm text-gray-600">
                  We identify what you need for funding and enrollment.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="text-lg font-semibold text-gray-900">3. Start training</div>
                <p className="mt-2 text-sm text-gray-600">
                  Move from interest to approval without confusion.
                </p>
              </div>
            </div>

            {/* Trust signals */}
            <div className="mt-10 space-y-3">
              {[
                'ETPL-listed training provider in Indiana',
                'WIOA and workforce funding guidance included',
                'Industry-recognized credentials (EPA 608, OSHA, NCRC, and more)',
                'Career services and employer connections after completion',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-green-600" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>

            {/* Contact fallback */}
            <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-5">
              <p className="font-medium text-gray-900">Prefer to talk to someone?</p>
              <p className="mt-1 text-sm text-gray-600">
                Call <a href="tel:+13173143757" className="font-medium text-brand-blue-600 hover:underline">(317) 314-3757</a> or
                email <a href="mailto:elevate4humanityedu@gmail.com" className="font-medium text-brand-blue-600 hover:underline">elevate4humanityedu@gmail.com</a>
              </p>
            </div>
          </div>

          {/* Right: form */}
          <div>
            <Suspense fallback={<div className="h-[600px] animate-pulse rounded-3xl border border-gray-200 bg-white p-8 shadow-sm" />}>
              <StartForm />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Pathway cards — secondary navigation */}
      <section className="border-t bg-white py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Not ready to apply? Explore your options.
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PATHWAYS.map((pathway) => (
              <Link
                key={pathway.title}
                href={pathway.href}
                className="flex items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 transition hover:border-brand-blue-300 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-blue-50 text-brand-blue-600">
                  <pathway.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{pathway.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{pathway.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-brand-red-600 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Ready to change your career?
          </h2>
          <p className="mt-3 text-brand-red-100">
            Fill out the form above or call us directly.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="#top"
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 font-bold text-brand-red-600 transition hover:bg-gray-100"
            >
              Apply Now
            </a>
            <a
              href="tel:+13173143757"
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white px-8 py-4 font-bold text-white transition hover:bg-brand-red-700"
            >
              <Phone className="h-5 w-5" />
              (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
