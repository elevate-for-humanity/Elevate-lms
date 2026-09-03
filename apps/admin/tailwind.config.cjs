// CJS version of the admin Tailwind config.
// postcss.config.cjs requires CJS — this file is loaded by PostCSS at build time.
//
// Content globs use absolute paths (via __dirname) so they resolve correctly
// regardless of the CWD Next.js uses when invoking PostCSS (repo root vs apps/admin).
// Relative globs like '../../lib/**' resolve from CWD, not the config file, and
// can hit protected system paths (e.g. /lib/ssl/private) on some environments.

const path = require('path');
const ROOT = path.resolve(__dirname, '../..');

module.exports = {
  darkMode: ['class'],
  content: [
    path.join(__dirname, 'app/**/*.{js,ts,jsx,tsx,mdx}'),
    path.join(ROOT, 'components/**/*.{js,ts,jsx,tsx,mdx}'),
    path.join(ROOT, 'lib/**/*.{js,ts,jsx,tsx,mdx}'),
    path.join(ROOT, 'app/**/*.{js,ts,jsx,tsx,mdx}'),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        'brand-blue':  { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a' },
        'brand-green': { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d' },
        'brand-red':   { 50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3',300:'#fda4af',400:'#fb7185',500:'#f43f5e',600:'#e11d48',700:'#be123c',800:'#9f1239',900:'#881337' },
        'brand-orange':{ 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12' },
        'brand-navy':  { 50:'#eff6ff',100:'#dbeafe',600:'#1e3a8a',700:'#1e3a8a',800:'#1e3a8a',900:'#1e3a8a' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
};
