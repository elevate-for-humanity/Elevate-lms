"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

type ProgramPageLayoutProps = {
  title: string;
  subtitle: string;
  badge?: string;
  duration: string;
  schedule: string;
  location: string;
  fundingTags: string[];
  salaryRange: string;
  jobTitles: string[];
  outcomes: string[];
  idealFor: string[];
  steps: string[];
  faq?: { question: string; answer: string }[];
};

export function ProgramPageLayout(props: ProgramPageLayoutProps) {
  const {
    title,
    subtitle,
    badge,
    duration,
    schedule,
    location,
    fundingTags,
    salaryRange,
    jobTitles,
    outcomes,
    idealFor,
    steps,
    faq,
  } = props;

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
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50 transition-all shadow-lg hover:scale-105 whitespace-nowrap"
            >
              Apply Now →
            </Link>
          </div>
        </div>
      </section>

      {/* HERO */}
      <section className="relative h-[700px] overflow-hidden">
        <Image
          src="/images/artlist/hero-training-4.jpg"
          alt={title}
          fill
          sizes="100vw"
          className="object-cover"
          priority
          quality={100}
        />
        

        <div className="relative h-full flex items-center">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
            <div className="max-w-3xl">
              {badge && (
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white mb-6">
                  {badge}
                </div>
              )}
              <h1 className="text-5xl md:text-6xl font-light text-white mb-6 leading-tight">
                {title}
              </h1>
              <p className="text-xl md:text-2xl text-slate-200 font-light mb-8 leading-relaxed">
                {subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 text-white font-semibold rounded hover:bg-orange-600 transition-colors shadow-lg"
                >
                  Apply Now
                  <ArrowRight size={20} className="ml-2" />
                </Link>
                <Link
                  href="/programs"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-semibold rounded border-2 border-white hover:bg-slate-50 transition-colors shadow-lg"
                >
                  All Programs
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

      {/* CONTENT */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <section className="grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)] items-start mb-10">
        <div className="space-y-4">
          {badge && (
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-2 text-[11px] font-semibold text-orange-700 border border-orange-100 uppercase tracking-wide">
              {badge}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-black">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-black leading-relaxed">
            {subtitle}
          </p>

          <div className="grid gap-3 sm:grid-cols-3 mt-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Program Length
              </div>
              <div className="mt-1 text-sm font-semibold text-black">
                {duration}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Designed for fast, focused training
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Schedule & Location
              </div>
              <div className="mt-1 text-sm font-semibold text-black">
                {schedule}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {location}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Typical Starting Pay
              </div>
              <div className="mt-1 text-sm font-semibold text-black">
                {salaryRange}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Actual wages vary by employer and experience
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {fundingTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-brand-blue-50 px-3 py-2 text-[11px] font-semibold text-brand-blue-700 border border-brand-blue-100"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded-full bg-orange-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-orange-700"
            >
              Apply Now – It&apos;s Free
            </Link>
            <Link
              href="/funding/wioa"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs sm:text-sm font-semibold text-black hover:border-orange-500 hover:text-orange-700"
            >
              Talk to a Career Coach
            </Link>
          </div>
        </div>

        {/* Right side card */}
        <aside className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-semibold text-black">
            What jobs can this lead to?
          </h2>
          <ul className="space-y-1 text-sm text-black">
            {jobTitles.map((job) => (
              <li key={job} className="flex gap-2">
                <span className="mt-[2px] text-orange-500">●</span>
                <span>{job}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Class Location
            </h3>
            <p className="text-sm text-black">
              8888 Keystone Crossing Suite 1300
              <br />
              Indianapolis, IN 46240
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Some coursework and support may be completed online. Ask your
              career coach about virtual options.
            </p>
          </div>
        </aside>
      </section>

      {/* Outcomes + Ideal for */}
      <section className="grid gap-6 md:grid-cols-2 mb-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-black mb-2">
            What you&apos;ll walk away with
          </h2>
          <ul className="space-y-2 text-sm text-black">
            {outcomes.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-[3px] text-green-500">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-black mb-2">
            This program is a strong fit if you…
          </h2>
          <ul className="space-y-2 text-sm text-black">
            {idealFor.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-[3px] text-orange-500">★</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Steps to get started */}
      <section className="mb-10">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-sm font-semibold text-black mb-2">
            How to get started
          </h2>
          <ol className="space-y-2 text-sm text-black">
            {steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[11px] font-semibold text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded-full bg-orange-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-orange-700"
            >
              Start Application
            </Link>
            <Link
              href="/funding"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs sm:text-sm font-semibold text-black hover:border-orange-500 hover:text-orange-700"
            >
              Explore Funding Options
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {faq && faq.length > 0 && (
        <section className="mb-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-black mb-3">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {faq.map((item) => (
                <details
                  key={item.question}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <summary className="cursor-pointer text-sm font-semibold text-black">
                    {item.question}
                  </summary>
                  <p className="mt-2 text-sm text-black">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

        </div>
      </section>

      {/* CTA WITH IMAGE */}
      <section className="py-16   ">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] rounded-xl overflow-hidden shadow-2xl">
              <Image
                src="/images/artlist/hero-training-3.jpg"
                alt="Start your training today"
                fill
          sizes="100vw"
                className="object-cover"
                quality={100}
              />
            </div>
            <div className="text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to take the next step?
              </h2>
              <p className="text-xl mb-8 text-orange-50">
                We'll help you check WIOA/WRG eligibility and walk you through enrollment so you're not doing this alone.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-orange-600 font-bold rounded-lg hover:bg-orange-50 transition-colors shadow-lg"
                >
                  Apply Now
                  <ArrowRight size={20} className="ml-2" />
                </Link>
                <Link
                  href="/programs"
                  className="inline-flex items-center justify-center px-8 py-4 bg-orange-700 text-white font-semibold rounded-lg hover:bg-orange-800 transition-colors shadow-lg"
                >
                  View All Programs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
