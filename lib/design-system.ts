// Unified Design System for Elevate For Humanity
// Use these constants throughout the application for consistency

export const colors = {
  // Primary - Blue (main brand color)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Secondary - Purple
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },

  // Accent - Green (success, positive actions)
  accent: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Error/Danger - Red (only for errors and warnings)
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Neutral - Slate (text, backgrounds)
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
};

export const borderRadius = {
  sm: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
};

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Component-specific styles
export const components = {
  button: {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700
      active:bg-blue-800
      disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed
      px-6 py-3 rounded-lg font-semibold
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    `,
    secondary: `
      bg-white text-blue-700 border-2 border-blue-600
      hover:bg-blue-50
      active:bg-blue-100
      disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-300 disabled:cursor-not-allowed
      px-6 py-3 rounded-lg font-semibold
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700
      active:bg-red-800
      disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed
      px-6 py-3 rounded-lg font-semibold
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
    `,
  },
  card: {
    default: `
      bg-white rounded-xl shadow-sm border border-slate-200
      hover:shadow-md transition-shadow duration-200
    `,
    interactive: `
      bg-white rounded-xl shadow-sm border border-slate-200
      hover:border-blue-300 hover:shadow-md
      cursor-pointer transition-all duration-200
    `,
  },
  input: {
    default: `
      w-full px-4 py-2
      border border-slate-300 rounded-lg
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed
      transition-colors duration-200
    `,
  },
};

// Usage guidelines
export const guidelines = {
  // Use blue as primary color for all main actions
  primaryColor: 'blue-600',

  // Use red ONLY for errors, warnings, and destructive actions
  errorColor: 'red-600',

  // Use purple for secondary actions and accents
  secondaryColor: 'purple-600',

  // Use green for success states and positive feedback
  successColor: 'green-600',

  // Spacing scale: use consistent spacing throughout
  spacingScale: [4, 8, 12, 16, 24, 32, 48, 64],

  // Border radius: use consistent rounding
  borderRadiusScale: [6, 8, 12, 16, 24],
};

export default {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  components,
  guidelines,
};
