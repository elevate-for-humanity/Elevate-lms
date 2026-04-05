/**
 * Elevate for Humanity — Admin Design Tokens
 *
 * Single source of truth for all admin UI class patterns.
 * Import from here. Do not invent one-off class strings in admin pages.
 *
 * Admin visual language:
 * - White backgrounds, slate borders, no dark hero banners
 * - brand-red-600 for primary actions
 * - brand-blue-600 for informational accents
 * - Colored top-border accent bars on cards (not full colored backgrounds)
 * - Status dots instead of avatars/initials
 * - Dense data tables, not marketing-style cards
 */

// ─── Typography ──────────────────────────────────────────────────────────────
export const adminType = {
  pageTitle:   'text-2xl sm:text-3xl font-black text-slate-900 leading-tight',
  sectionTitle:'text-lg font-bold text-slate-900',
  cardTitle:   'text-sm font-bold text-slate-900',
  label:       'text-[11px] font-bold uppercase tracking-widest text-slate-400',
  body:        'text-sm text-slate-700 leading-relaxed',
  meta:        'text-xs text-slate-500',
  value:       'text-2xl font-black tabular-nums text-slate-900',
  valueLg:     'text-3xl font-black tabular-nums text-slate-900',
} as const;

// ─── Layout ──────────────────────────────────────────────────────────────────
export const adminLayout = {
  page:        'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6',
  section:     'space-y-4',
  grid2:       'grid grid-cols-1 sm:grid-cols-2 gap-4',
  grid3:       'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
  grid4:       'grid grid-cols-2 xl:grid-cols-4 gap-3',
} as const;

// ─── Cards ───────────────────────────────────────────────────────────────────
export const adminCard = {
  base:        'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden',
  hover:       'bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden',
  header:      'flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100',
  body:        'p-6',
  bodyTight:   'p-4',
} as const;

// ─── KPI cards ───────────────────────────────────────────────────────────────
export const adminKpi = {
  // Accent bar colors — one per KPI slot
  bars: [
    'bg-gradient-to-r from-brand-red-500 to-orange-400',
    'bg-gradient-to-r from-brand-blue-500 to-cyan-400',
    'bg-gradient-to-r from-emerald-500 to-teal-400',
    'bg-gradient-to-r from-violet-500 to-purple-400',
  ],
  iconBgs: [
    'bg-rose-50 text-rose-600',
    'bg-blue-50 text-blue-600',
    'bg-emerald-50 text-emerald-600',
    'bg-violet-50 text-violet-600',
  ],
} as const;

// ─── Buttons ─────────────────────────────────────────────────────────────────
export const adminBtn = {
  primary:   'inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm',
  secondary: 'inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
  ghost:     'inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold transition-colors',
  danger:    'inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors',
} as const;

// ─── Tables ──────────────────────────────────────────────────────────────────
export const adminTable = {
  wrapper:   'w-full overflow-x-auto',
  table:     'w-full text-sm',
  thead:     'bg-slate-50 border-b border-slate-200',
  th:        'text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400',
  thRight:   'text-right px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400',
  tbody:     'divide-y divide-slate-100',
  tr:        'hover:bg-slate-50 transition-colors',
  td:        'px-4 py-3 text-slate-700',
  tdMeta:    'px-4 py-3 text-xs text-slate-400',
  tdRight:   'px-4 py-3 text-right',
} as const;

// ─── Status dots ─────────────────────────────────────────────────────────────
export const adminStatus = {
  dot: {
    green:  'w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0',
    amber:  'w-2 h-2 rounded-full bg-amber-400 flex-shrink-0',
    red:    'w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 animate-pulse',
    blue:   'w-2 h-2 rounded-full bg-brand-blue-400 flex-shrink-0',
    slate:  'w-2 h-2 rounded-full bg-slate-300 flex-shrink-0',
  },
  pill: {
    active:    'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700',
    pending:   'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700',
    inactive:  'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500',
    urgent:    'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700',
    draft:     'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400',
  },
} as const;

// ─── Page header ─────────────────────────────────────────────────────────────
export const adminPageHeader = {
  wrapper:  'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200',
  left:     'min-w-0',
  actions:  'flex flex-wrap gap-2 flex-shrink-0',
} as const;

// ─── Empty state ─────────────────────────────────────────────────────────────
export const adminEmpty = {
  wrapper: 'flex flex-col items-center justify-center py-16 px-4 text-center',
  icon:    'text-slate-200 mb-4',
  title:   'font-bold text-slate-600 text-base mb-1',
  desc:    'text-slate-400 text-sm max-w-sm',
} as const;
