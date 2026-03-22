'use client';

/**
 * CprPageBlocks — structured block content for the CPR & First Aid page.
 *
 * Rendered below the hero in the CPR page.
 * Uses the shared block system. All content sourced from CPR_FIRST_AID data.
 *
 * HSI: partnerProvider = 'hsi', partnerName = 'Health & Safety Institute'
 * Images: cpr-mannequin.jpg (real), cpr-training-real.jpg (real)
 * Video: /videos/cpr-training.mp4 — placeholder path, falls back to image
 */

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

// ── Facts strip ───────────────────────────────────────────────────────────────

function FactsStrip() {
  const facts = [
    { value: 'From Home', label: 'Train' },
    { value: 'Live', label: 'Instructor' },
    { value: 'Shipped', label: 'Mannequin' },
    { value: 'Same Day', label: 'Certification Card' },
  ];
  return (
    <div className="bg-slate-900 border-y border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-700">
          {facts.map((f, i) => (
            <div key={i} className="px-4 py-5 sm:px-6 sm:py-6 text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-white leading-tight">{f.value}</div>
              <div className="text-xs font-semibold uppercase tracking-widest mt-1 text-slate-400">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Full-bleed image break ────────────────────────────────────────────────────

function FullBleedImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full h-[420px] sm:h-[520px] overflow-hidden border-y border-slate-200">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover object-center"
        sizes="100vw"
        priority
      />
      {/* Hard overlay strip at bottom — no gradient, just a solid band */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900 py-3 px-6">
        <p className="text-white text-xs font-bold uppercase tracking-widest text-center">
          Hands-on CPR practice — from your own home
        </p>
      </div>
    </div>
  );
}

// ── Split block ───────────────────────────────────────────────────────────────

function SplitBlock() {
  return (
    <div className="border-y border-slate-200">
      <div className="grid lg:grid-cols-2">
        {/* Image side */}
        <div className="relative h-64 sm:h-80 lg:h-auto min-h-[340px] overflow-hidden bg-slate-100">
          <Image
            src="/images/pages/cpr-training-real.jpg"
            alt="CPR training in progress"
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        {/* Copy side */}
        <div className="bg-white flex items-center">
          <div className="px-8 py-10 lg:px-12 lg:py-14 max-w-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3">What you receive</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-4">
              Everything You Need, Delivered to Your Door
            </h2>
            <p className="text-slate-600 text-base leading-relaxed mb-6">
              A training mannequin ships directly to your address. You join a live instructor-led session online and complete your hands-on skills practice at home — compression technique, AED operation, and first aid response — with real-time guidance from a certified instructor.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Training mannequin shipped to your home',
                'Live instructor guides every skill in real time',
                'AED trainer device included in your kit',
                'Same-day digital certification card on completion',
                'Prepaid return label for the mannequin',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-red-600 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/apply?program=cpr-first-aid"
              className="inline-block bg-slate-900 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Enroll — $130
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stats band ────────────────────────────────────────────────────────────────

function StatsBand() {
  const stats = [
    { value: '1 Day', label: 'Complete the course', note: 'Morning + afternoon session' },
    { value: '2 Years', label: 'Certification valid', note: 'AHA standard' },
    { value: '$130', label: 'Stand-alone cost', note: 'Free with any Elevate program' },
    { value: '100%', label: 'Remote — no classroom', note: 'Train from anywhere in the U.S.' },
  ];
  return (
    <div className="bg-white border-y-4 border-slate-900 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center mb-8">Program at a glance</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-none">{s.value}</div>
              <div className="text-sm font-bold text-slate-700 mt-2">{s.label}</div>
              <div className="text-xs text-slate-400 mt-1">{s.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Card row ──────────────────────────────────────────────────────────────────

function WhatComesWithIt() {
  const cards = [
    {
      title: 'Live Remote Instruction',
      body: 'A certified instructor leads your session in real time. You practice each skill with direct feedback — not a pre-recorded video.',
      accent: 'border-t-4 border-t-slate-900',
    },
    {
      title: 'Mannequin Shipped to You',
      body: 'A full CPR training mannequin arrives at your door before class. Prepaid return label included. No equipment to source yourself.',
      accent: 'border-t-4 border-t-brand-red-600',
    },
    {
      title: 'Guided Skills Practice',
      body: 'Adult, child, and infant CPR. AED operation. Choking relief. First aid for bleeding, burns, and fractures. All practiced hands-on.',
      accent: 'border-t-4 border-t-slate-900',
    },
    {
      title: 'Same-Day Certification Card',
      body: 'Pass the written and practical evaluation and receive your AHA digital certification card the same day. Valid for 2 years.',
      accent: 'border-t-4 border-t-brand-red-600',
    },
  ];

  return (
    <div className="bg-slate-50 border-y border-slate-200 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">What comes with it</h2>
          <p className="text-slate-500 text-base max-w-2xl">
            Everything included in the $130 enrollment. No hidden fees. No equipment to source.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c, i) => (
            <div key={i} className={`bg-white border border-slate-200 rounded-xl p-6 ${c.accent}`}>
              <h3 className="font-extrabold text-slate-900 text-base mb-2">{c.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── HSI partner band ──────────────────────────────────────────────────────────

function HSIBand() {
  return (
    <div className="bg-white border-y border-slate-200 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
        <div className="flex-shrink-0 bg-slate-100 border border-slate-200 rounded-lg px-6 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Training Partner</p>
          <p className="text-base font-extrabold text-slate-900 mt-0.5">Health &amp; Safety Institute</p>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed text-center sm:text-left">
          This program is delivered in partnership with <strong>Health &amp; Safety Institute (HSI)</strong>, a nationally recognized provider of CPR, AED, and first aid training. Certifications are issued through the American Heart Association and accepted by healthcare, construction, childcare, and fitness employers nationwide.
        </p>
      </div>
    </div>
  );
}

// ── Accordion ─────────────────────────────────────────────────────────────────

function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  const items = [
    {
      q: 'How does the at-home CPR training work?',
      a: 'After you enroll, a training mannequin is shipped directly to your door. You join a live instructor-led session online and complete your hands-on skills practice at home using the mannequin. The instructor guides you through each skill in real time.',
    },
    {
      q: 'What is included with the program?',
      a: 'Training mannequin, AED trainer device, AHA course materials, live instructor session, written and practical evaluation, and your AHA certification card (digital, same day). A prepaid return label for the mannequin is also included.',
    },
    {
      q: 'Who is this for?',
      a: 'Anyone who needs CPR/First Aid certification — healthcare workers, childcare providers, construction workers, fitness professionals, teachers, or anyone who wants to be prepared. No prior medical training required. Must be 16 or older.',
    },
    {
      q: 'What happens during live instruction?',
      a: 'Your instructor walks you through each skill step by step: adult, child, and infant CPR, AED operation, choking relief, and first aid techniques. You practice on your mannequin while the instructor watches and corrects your form in real time.',
    },
    {
      q: 'What certification do I receive?',
      a: 'You receive an AHA BLS for Healthcare Providers card and AHA Heartsaver First Aid card — both valid for 2 years. These are the certifications required by hospitals, clinics, nursing facilities, and most healthcare and safety employers.',
    },
    {
      q: 'Do I have to return the mannequin?',
      a: 'Yes. A prepaid return label is included in your shipment. Return the mannequin within 7 days of completing your course.',
    },
  ];

  return (
    <div className="bg-white border-y border-slate-100 py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">How it works</h2>
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
          {items.map((item, i) => (
            <div key={i} className="bg-white">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors"
                aria-expanded={open === i}
              >
                <span className="font-bold text-slate-900 text-sm sm:text-base pr-4">{item.q}</span>
                <span className="flex-shrink-0 w-5 h-5 border-2 border-slate-300 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">
                  {open === i ? '−' : '+'}
                </span>
              </button>
              <div className={`overflow-hidden transition-all duration-200 ${open === i ? 'max-h-96' : 'max-h-0'}`}>
                <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Rotating banner ───────────────────────────────────────────────────────────

function RotatingBanner() {
  const [current, setCurrent] = useState(0);
  const lines = [
    'Train from home with real-time instruction',
    'A mannequin is shipped to you for hands-on practice',
    'Complete CPR training without going into a classroom',
    'Same-day AHA certification card on completion',
    'Delivered in partnership with Health & Safety Institute',
  ];

  return (
    <div className="bg-slate-900 py-5 px-4">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-6">
        <div className="flex gap-1.5">
          {lines.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Statement ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/30'}`}
            />
          ))}
        </div>
        <p className="text-white font-bold text-sm sm:text-base text-center flex-1">
          {lines[current]}
        </p>
      </div>
    </div>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <div className="bg-slate-900 border-t border-slate-800 py-16 sm:py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-tight">
          Start Your CPR Training from Home
        </h2>
        <p className="text-slate-300 text-base mb-8 max-w-xl mx-auto">
          Get the materials, join live instruction, and complete hands-on CPR training with a clear path to your AHA certification card.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/apply?program=cpr-first-aid"
            className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-8 py-3.5 rounded-lg transition-colors text-sm sm:text-base"
          >
            Enroll Now — $130
          </Link>
          <Link
            href="/programs/cpr-first-aid/request-info"
            className="border-2 border-white/30 text-white hover:bg-white/10 font-bold px-8 py-3.5 rounded-lg transition-colors text-sm sm:text-base"
          >
            Request Information
          </Link>
        </div>
        <p className="text-slate-500 text-xs mt-6">Included free with any Elevate training program enrollment.</p>
      </div>
    </div>
  );
}

// ── Composed export ───────────────────────────────────────────────────────────

export default function CprPageBlocks() {
  return (
    <>
      <FactsStrip />
      <FullBleedImage
        src="/images/pages/cpr-first-aid.jpg"
        alt="CPR and first aid training"
      />
      <SplitBlock />
      <StatsBand />
      <WhatComesWithIt />
      <HSIBand />
      <FAQAccordion />
      <RotatingBanner />
      <FinalCTA />
    </>
  );
}
