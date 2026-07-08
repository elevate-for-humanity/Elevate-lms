/**
 * Elevate for Humanity — Locked Page Design Tokens
 *
 * Single source of truth for Tailwind class patterns used across all
 * student-facing marketing and program pages.
 *
 * Rules:
 * - Import from here, never invent one-off class strings for these patterns.
 * - Do not add page-specific overrides here — extend the schema instead.
 * - All new student-facing pages must use these tokens.
 * - See docs/page-design-standard.md for the full system specification.
 */

// ─── Typography ──────────────────────────────────────────────────────────────

export const type = {
  /** Page-level H1 — program name, page title */
  h1: 'text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight',
  /** Section H2 */
  h2: 'text-2xl sm:text-3xl font-extrabold text-slate-900',
  /** Card / sub-section H3 */
  h3: 'text-lg font-bold text-slate-900',
  /** Small section label above a heading — e.g. "Healthcare · Indianapolis" */
  eyebrow: 'text-brand-red-600 font-bold text-xs uppercase tracking-widest',
  /** Body copy — comfortable reading size */
  body: 'text-slate-700 text-base leading-relaxed',
  /** Secondary body — supporting detail */
  bodySmall: 'text-slate-600 text-sm leading-relaxed',
  /** Metadata chips — duration, format, credential */
  meta: 'text-slate-600 text-sm font-semibold',
  /** Fine print / footnotes */
  fine: 'text-slate-500 text-xs',
} as const;

// ─── Spacing / Layout ────────────────────────────────────────────────────────

export const layout = {
  /** Standard page content container */
  container: 'max-w-6xl mx-auto px-4 sm:px-6',
  /** Narrow container for prose / forms */
  containerNarrow: 'max-w-3xl mx-auto px-4 sm:px-6',
  /** Medium container for 2-col layouts */
  containerMedium: 'max-w-5xl mx-auto px-4 sm:px-6',
  /** Standard section vertical padding */
  section: 'py-12 sm:py-16',
  /** Tighter section padding for dense content */
  sectionTight: 'py-8 sm:py-12',
  /** Generous section padding for hero-adjacent sections */
  sectionWide: 'py-16 sm:py-20',
} as const;

// ─── Hero ────────────────────────────────────────────────────────────────────

export const hero = {
  /**
   * Standard program/marketing hero image container.
   * No gradient overlay. No text on top of image.
   * Content goes in a white panel BELOW the image.
   */
  imageWrap: 'relative h-[45vh] min-h-[280px] max-h-[560px] w-full overflow-hidden',
  /** Content panel that sits below the hero image — white background */
  contentPanel: 'bg-white border-b border-slate-100',
} as const;

// ─── Cards ───────────────────────────────────────────────────────────────────

export const card = {
  /** Standard program card */
  base: 'bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all',
  /** Card image container — 16:9 */
  image16x9: 'relative aspect-[16/9] overflow-hidden',
  /** Card image container — 4:3 */
  image4x3: 'relative aspect-[4/3] overflow-hidden',
  /** Card body padding */
  body: 'p-4 sm:p-5',
  /** Credential / info card */
  info: 'bg-white rounded-xl border border-slate-200 p-5',
  /** Dark stat card */
  stat: 'bg-slate-800 rounded-xl p-5 text-center',
} as const;

// ─── Buttons / CTAs ──────────────────────────────────────────────────────────

export const btn = {
  /** Primary action — Enroll Now / Apply Now */
  primary:
    'bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm sm:text-base',
  /** Secondary action — Request Information / Talk to Advisor */
  secondary:
    'border-2 border-slate-300 hover:border-brand-blue-400 text-slate-700 hover:text-brand-blue-700 font-bold px-8 py-3.5 rounded-xl transition-colors text-sm sm:text-base',
  /** Indiana Career Connect — external link, visually distinct */
  icc: 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm sm:text-base',
  /** Ghost — white background, used on dark sections */
  ghost:
    'bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm sm:text-base backdrop-blur-sm',
  /** CTA row wrapper — stacks on mobile, row on sm+ */
  row: 'flex flex-col sm:flex-row items-stretch sm:items-center gap-3',
} as const;

// ─── Section backgrounds ─────────────────────────────────────────────────────

export const bg = {
  white: 'bg-white',
  subtle: 'bg-slate-50',
  dark: 'bg-slate-900',
  /** Divider between sections */
  divider: 'border-t border-slate-100',
} as const;

// ─── Metadata chips ──────────────────────────────────────────────────────────

export const chip = {
  /** Neutral fact chip — duration, format, credential */
  neutral:
    'inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200',
  /** Funding available — green */
  funded:
    'inline-flex items-center gap-1.5 bg-brand-green-50 text-brand-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-green-200',
  /** WIOA / state program badge */
  wioa: 'inline-flex items-center gap-1.5 bg-brand-blue-50 text-brand-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-blue-200',
} as const;

// ─── Indiana Career Connect ───────────────────────────────────────────────────

/** Canonical ICC URL — never hardcode elsewhere */
export const ICC_URL = 'https://www.indianacareerconnect.com';

/**
 * Standard ICC instruction text.
 * Used in funding sections on any WIOA/apprenticeship-eligible program.
 */
export const ICC_INSTRUCTION =
  'For WIOA-eligible and apprenticeship pathway applicants, the next step may require Indiana Career Connect.';

// ─── Responsive grid presets ─────────────────────────────────────────────────

export const grid = {
  /** 1 → 2 → 4 program cards */
  programs: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5',
  /** 1 → 2 → 3 content cards */
  cards3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5',
  /** 1 → 2 content cards */
  cards2: 'grid grid-cols-1 sm:grid-cols-2 gap-6',
  /** 2 → 4 stat strip */
  stats: 'grid grid-cols-2 sm:grid-cols-4 gap-6',
} as const;
