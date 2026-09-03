'use client';

/**
 * SeoAuthorityHubPage — Shared template for all 7 SEO authority hubs.
 *
 * Sections (in order):
 *   1. Hero (tag, heading, subtitle, CTA buttons)
 *   2. Trust / Authority strip (compliance badges)
 *   3. Who This Is For
 *   4. Funding & Eligibility (conditional)
 *   5. Program Pathways
 *   6. Employer / Placement Pathway (conditional)
 *   7. FAQ
 *   8. Compliance Disclaimer
 *   9. CTA
 *  10. Structured data JSON-LD is emitted by the page-level server component
 *      via the shared helpers in components/seo/StructuredData.tsx
 */

import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HubHero {
  /** Short colour tag above the h1, e.g. "Indianapolis · Indiana" */
  tag: string;
  tagColor?: string;
  heading: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** Background CSS class(es), e.g. "bg-slate-900" */
  bgClass?: string;
}

export interface TrustBadge {
  label: string;
  detail: string;
}

export interface WhoItem {
  heading: string;
  description: string;
}

export interface FundingSection {
  heading: string;
  paragraphs: string[];
  bullets: string[];
  /** Shown when agencyEligibilityDisclaimer is true */
  eligibilityNote: string;
}

export interface ProgramPathway {
  name: string;
  description: string;
  href: string;
}

export interface EmployerSection {
  heading: string;
  paragraphs: string[];
  bullets: string[];
  cta: { label: string; href: string };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface InternalLink {
  label: string;
  href: string;
}

export interface SeoAuthorityHubPageProps {
  // ── Hero ──
  hero: HubHero;
  // ── Trust strip ──
  trustBadges: TrustBadge[];
  // ── Who this is for ──
  whoHeading?: string;
  whoItems: WhoItem[];
  // ── Funding / eligibility ──
  funding?: FundingSection;
  // ── Program pathways ──
  pathwaysHeading?: string;
  pathways: ProgramPathway[];
  // ── Employer / placement pathway ──
  employer?: EmployerSection;
  // ── FAQ ──
  faqHeading?: string;
  faqs: FaqItem[];
  // ── Related links (hub cross-links) ──
  relatedLinks: InternalLink[];
  // ── Compliance disclaimer(s) ──
  complianceNotes: string[];
  // ── Bottom CTA ──
  ctaHeading: string;
  ctaSubtitle: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FaqAccordionItem({ question, answer }: FaqItem) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left bg-white hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="font-semibold text-slate-900 pr-4">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 bg-white">
          <p className="text-slate-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SeoAuthorityHubPage({
  hero,
  trustBadges,
  whoHeading = 'Who This Is For',
  whoItems,
  funding,
  pathwaysHeading = 'Training Pathways',
  pathways,
  employer,
  faqHeading = 'Frequently Asked Questions',
  faqs,
  relatedLinks,
  complianceNotes,
  ctaHeading,
  ctaSubtitle,
  ctaPrimary,
  ctaSecondary,
}: SeoAuthorityHubPageProps) {
  const heroBg = hero.bgClass ?? 'bg-slate-900';
  const tagColor = hero.tagColor ?? 'text-brand-red-400';

  return (
    <div className="min-h-screen bg-white">

      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <section className={`${heroBg} text-white py-20 px-4`}>
        <div className="max-w-5xl mx-auto">
          <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${tagColor}`}>
            {hero.tag}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-5 max-w-3xl">
            {hero.heading}
          </h1>
          <p className="text-slate-300 text-lg sm:text-xl max-w-2xl leading-relaxed mb-8">
            {hero.subtitle}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={hero.primaryCta.href}
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-full transition-colors shadow-lg"
            >
              {hero.primaryCta.label} <ArrowRight className="w-5 h-5" />
            </Link>
            {hero.secondaryCta && (
              <Link
                href={hero.secondaryCta.href}
                className="inline-flex items-center gap-2 border-2 border-white/40 hover:border-white/70 text-white font-bold px-8 py-4 rounded-full transition-colors"
              >
                {hero.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. Trust / Authority strip ──────────────────────────────────── */}
      <section className="bg-slate-800 text-white py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-x-8 gap-y-3 justify-center sm:justify-start">
            {trustBadges.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-brand-red-400 inline-block flex-shrink-0" aria-hidden="true" />
                <span className="text-sm font-semibold">{b.label}</span>
                {b.detail && (
                  <span className="text-xs text-slate-400 hidden sm:inline">— {b.detail}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Who This Is For ──────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10">{whoHeading}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whoItems.map((item, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 text-lg mb-2">{item.heading}</h3>
                <p className="text-slate-700 leading-relaxed text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Funding / Eligibility (conditional) ─────────────────────── */}
      {funding && (
        <section className="py-16 px-4 bg-slate-50 border-t border-slate-200">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10 items-start">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                  {funding.heading}
                </h2>
                {funding.paragraphs.map((p, i) => (
                  <p key={i} className="text-slate-700 leading-relaxed mb-4">{p}</p>
                ))}
              </div>
              <div>
                <ul className="space-y-3 mb-6">
                  {funding.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-red-500 mt-2 flex-shrink-0" />
                      <span className="text-slate-700">{b}</span>
                    </li>
                  ))}
                </ul>
                {funding.eligibilityNote && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-amber-800 text-sm leading-relaxed italic">
                      {funding.eligibilityNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 5. Program Pathways ─────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10">{pathwaysHeading}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {pathways.map((pw, i) => (
              <Link
                key={i}
                href={pw.href}
                className="group block bg-slate-50 border border-slate-200 hover:border-brand-red-300 hover:bg-red-50/30 rounded-xl p-6 transition-colors"
              >
                <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-brand-red-700 transition-colors">
                  {pw.name}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{pw.description}</p>
                <span className="inline-flex items-center gap-1 text-brand-red-600 text-sm font-semibold mt-3">
                  Learn more <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Employer / Placement Pathway (conditional) ──────────────── */}
      {employer && (
        <section className="py-16 px-4 bg-slate-900 text-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">{employer.heading}</h2>
            {employer.paragraphs.map((p, i) => (
              <p key={i} className="text-slate-300 leading-relaxed mb-4 max-w-2xl">{p}</p>
            ))}
            <ul className="grid sm:grid-cols-2 gap-3 my-6 max-w-2xl">
              {employer.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-4 h-4 rounded-full bg-brand-red-400 inline-block flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-slate-300 text-sm">{b}</span>
                </li>
              ))}
            </ul>
            <Link
              href={employer.cta.href}
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-full transition-colors mt-2"
            >
              {employer.cta.label} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}

      {/* ── 7. FAQ ──────────────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section className="py-16 px-4 bg-slate-50 border-t border-slate-200">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10">{faqHeading}</h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <FaqAccordionItem key={i} {...faq} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 8. Compliance Disclaimer ────────────────────────────────────── */}
      {complianceNotes.length > 0 && (
        <section className="py-10 px-4 bg-white border-t border-slate-200">
          <div className="max-w-5xl mx-auto">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
              {complianceNotes.map((note, i) => (
                <p key={i} className="text-xs text-slate-500 leading-relaxed italic">
                  {note}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 9. Bottom CTA ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-brand-red-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{ctaHeading}</h2>
          <p className="text-xl text-white/90 mb-10">{ctaSubtitle}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={ctaPrimary.href}
              className="bg-white text-brand-red-700 hover:bg-slate-50 font-bold px-10 py-5 rounded-full text-xl transition-colors shadow-lg"
            >
              {ctaPrimary.label}
            </Link>
            {ctaSecondary && (
              <Link
                href={ctaSecondary.href}
                className="border-2 border-white/60 text-slate-900 hover:bg-white/10 font-bold px-10 py-5 rounded-full text-xl transition-colors"
              >
                {ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Related / Cross-link Hub strip ──────────────────────────────── */}
      {relatedLinks.length > 0 && (
        <section className="py-10 px-4 border-t border-slate-200 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Explore More
            </p>
            <div className="flex flex-wrap gap-3">
              {relatedLinks.map((l, i) => (
                <Link
                  key={i}
                  href={l.href}
                  className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-brand-red-300 text-slate-700 hover:text-brand-red-700 text-sm font-medium px-4 py-2 rounded-full transition-colors"
                >
                  {l.label} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
