/**
 * Elevate for Humanity — Locked Page Design Tokens
 *
 * Single source of truth for Tailwind class patterns used across all
 * student-facing marketing and program pages.
 */

export const type = {
  h1: 'text-4xl sm:text-5xl font-extrabold text-slate-950 leading-[1.08] tracking-tight',
  h2: 'text-3xl sm:text-4xl font-extrabold text-slate-950 leading-tight tracking-tight',
  h3: 'text-xl sm:text-2xl font-bold text-slate-950 leading-tight',
  eyebrow: 'text-brand-red-700 font-extrabold text-sm uppercase tracking-[0.14em]',
  body: 'text-slate-800 text-lg leading-8',
  bodySmall: 'text-slate-700 text-base leading-7',
  meta: 'text-slate-700 text-base font-semibold',
  fine: 'text-slate-600 text-sm leading-6',
} as const;

export const layout = {
  container: 'max-w-6xl mx-auto px-4 sm:px-6',
  containerNarrow: 'max-w-3xl mx-auto px-4 sm:px-6',
  containerMedium: 'max-w-5xl mx-auto px-4 sm:px-6',
  section: 'py-14 sm:py-20',
  sectionTight: 'py-10 sm:py-14',
  sectionWide: 'py-16 sm:py-24',
} as const;

export const hero = {
  imageWrap: 'relative h-[38vh] min-h-[260px] max-h-[520px] w-full overflow-hidden',
  contentPanel: 'bg-white border-b border-slate-100',
} as const;

export const card = {
  base: 'bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all',
  image16x9: 'relative aspect-[16/9] overflow-hidden',
  image16x9Desktop: 'relative aspect-[16/9] overflow-hidden sm:aspect-video',
  image4x3: 'relative aspect-[4/3] overflow-hidden',
  body: 'p-5 sm:p-6',
  info: 'bg-white rounded-2xl border border-slate-200 p-6',
  stat: 'bg-slate-800 rounded-2xl p-6 text-center',
  programImage: 'relative aspect-[4/3] overflow-hidden bg-slate-800',
  programImageFill: 'object-cover object-center w-full h-full',
} as const;

export const btn = {
  primary:
    'bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base sm:text-lg shadow-sm',
  secondary:
    'border-2 border-slate-300 hover:border-brand-blue-400 text-slate-800 hover:text-brand-blue-700 font-bold px-8 py-4 rounded-xl transition-colors text-base sm:text-lg',
  icc: 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base sm:text-lg',
  ghost:
    'bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base sm:text-lg backdrop-blur-sm',
  row: 'flex flex-col sm:flex-row items-stretch sm:items-center gap-3',
} as const;

export const bg = {
  white: 'bg-white',
  subtle: 'bg-slate-50',
  dark: 'bg-slate-900',
  divider: 'border-t border-slate-100',
} as const;

export const chip = {
  neutral:
    'inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-sm font-semibold px-3 py-1.5 rounded-full border border-slate-200',
  funded:
    'inline-flex items-center gap-1.5 bg-brand-green-50 text-brand-green-800 text-sm font-semibold px-3 py-1.5 rounded-full border border-brand-green-200',
  wioa: 'inline-flex items-center gap-1.5 bg-brand-blue-50 text-brand-blue-800 text-sm font-semibold px-3 py-1.5 rounded-full border border-brand-blue-200',
} as const;

export const ICC_URL = 'https://www.indianacareerconnect.com';

export const ICC_INSTRUCTION =
  'For WIOA-eligible and apprenticeship pathway applicants, the next step may require Indiana Career Connect.';

export const grid = {
  programs: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6',
  cards3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
  cards2: 'grid grid-cols-1 sm:grid-cols-2 gap-7',
  stats: 'grid grid-cols-2 sm:grid-cols-4 gap-6',
} as const;
