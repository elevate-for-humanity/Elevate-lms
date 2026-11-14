// Extend root Tailwind config so custom tokens (shadow-card, brand colors, etc.)
// are available in the admin app without duplication.
// CJS syntax required — postcss.config.cjs loads this via require(), not ESM import.
const rootConfig = require('../../tailwind.config.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...rootConfig,
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../lib/**/*.{js,ts,jsx,tsx,mdx}',
    '../../app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
};
