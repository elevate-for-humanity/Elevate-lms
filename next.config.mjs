import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server external packages - exclude heavy dependencies from the server bundle
  // These are loaded at runtime instead of being bundled, reducing Lambda size
  serverExternalPackages: [
    'tesseract.js',
    'tesseract.js-core',
    'sharp',
    'pdf-parse',
    'pdfkit',
    'pdf-lib',
    'jspdf',
    'jspdf-autotable',
    '@react-pdf/renderer',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    'pg',
    'openai',
    'stripe',
    'ioredis',
    'redis',
    '@upstash/redis',
    'socket.io',
    'socket.io-client',
    '@sendgrid/mail',
    'nodemailer',
    '@sentry/nextjs',
    '@sentry/node',
    '@sentry/core',
    '@opentelemetry/api',
    '@opentelemetry/sdk-node',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/resources',
    '@opentelemetry/semantic-conventions',
    'puppeteer',
    'puppeteer-core',
    'playwright',
    'chromium-bidi',
    'jsdom',
    'typescript',
    'core-js',
  ],

  // Disable dev indicators (static route indicator, build indicator)
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  
  // Empty turbopack config to silence the warning about webpack config
  turbopack: {},

  // Force cache bust - build timestamp + deployment marker
  generateBuildId: async () => {
    return `build-${Date.now()}-production`;
  },
  // Netlify uses 'export' or default, not 'standalone'
  // output: 'standalone', // Commented out for Netlify compatibility
  reactStrictMode: true,
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,

  // Image optimization settings
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [85, 90, 95],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: false,
    contentDispositionType: 'inline',
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.elevateforhumanity.org' },
      { protocol: 'https', hostname: 'www.elevateforhumanity.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.cloudflarestream.com' },
      { protocol: 'https', hostname: '*.githubusercontent.com' },
      { protocol: 'https', hostname: 'cdn.elevatelms.com' },
      { protocol: 'https', hostname: 'cms-artifacts.artlist.io' },
      { protocol: 'https', hostname: 'cdn1.affirm.com' },
    ],
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Allow cross-origin requests from preview/deploy URLs
  allowedDevOrigins: [
    'localhost',
    '**.gitpod.dev',
  ],

  // Experimental features for better performance
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '**.gitpod.dev',
        'www.elevateforhumanity.org',
        'elevateforhumanity.org',
      ],
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-accordion',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-popover',
      'recharts',
      'react-hot-toast',
      'date-fns',
      'framer-motion',
      '@stripe/stripe-js',
      'zod',
      'react-hook-form',
      '@hookform/resolvers',
      'swr',
    ],
    webpackBuildWorker: true,
    optimizeCss: true,
    // Parallel routes for faster builds
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
  },
  
  // Suppress middleware deprecation warning (middleware.ts is still correct for our use case)
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
              return `npm.${packageName?.replace('@', '')}`;
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          // Split large UI libraries
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            name: 'ui-libs',
            priority: 35,
            reuseExistingChunk: true,
          },
          // Split Supabase
          supabase: {
            test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
            name: 'supabase',
            priority: 35,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
        },
      },
    };
    return config;
  },

  typescript: {
    // OOMs during type-check on 4,450+ files in CI — keep enabled until project is split or memory increased
    ignoreBuildErrors: true,
  },
  // Removed staticPageGenerationTimeout - use route segment config instead
  // See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
  outputFileTracingExcludes: {
    '/api/accreditation/report': ['**/*'],
    // Exclude heavy/dev files from ALL routes to reduce Netlify handler size
    '*': [
      // Generated media — served by CDN, not the server function
      'public/generated/**',
      'public/generated-images/**',
      // Dev artifacts
      'reports/**',
      'audit-packet/**',
      'playwright-report/**',
      // Browser automation
      '**/node_modules/playwright/**',
      '**/node_modules/puppeteer/**',
      '**/node_modules/@playwright/**',
      '**/node_modules/playwright-core/**',
      '**/node_modules/puppeteer-core/**',
      '**/node_modules/**/chromium/**',
      '**/node_modules/@sparticuz/**',
      '**/node_modules/chrome-aws-lambda/**',
      // Dev-only tools
      '**/node_modules/typescript/**',
      '**/node_modules/jsdom/**',
      '**/node_modules/core-js/**',
      // Sharp native binaries
      '**/node_modules/@img/sharp-libvips-*/**',
      '**/node_modules/@img/sharp-linux-*/**',
      '**/node_modules/@img/sharp-darwin-*/**',
      '**/node_modules/@img/sharp-win32-*/**',
      // Heavy PDF dist bundles
      '**/node_modules/jspdf/dist/**',
      '**/node_modules/pdf-lib/**',
      '**/node_modules/.pnpm/pdf-lib*/**',
      '**/node_modules/@apm-js-collab/**',
      '**/node_modules/.pnpm/@apm-js-collab*/**',
      // Source files not needed at runtime
      'app/**/*.tsx',
      'app/**/*.ts',
      'components/**/*.tsx',
      'components/**/*.ts',
      'lib/**/*.ts',
      'lib/**/*.tsx',
    ],
  },

  // Redirects for consolidated routes
  async redirects() {
    return [
      // ============================================
      // DELETED PAGE REDIRECTS
      // ============================================
      { source: '/programs/technology/it-support', destination: '/programs/it-help-desk', permanent: true },
      { source: '/programs/technology/cybersecurity', destination: '/programs/cybersecurity-analyst', permanent: true },

      // ============================================
      // OLD URL ALIASES → CORRECT EXISTING PAGES
      // ============================================
      { source: '/for-students', destination: '/student-portal', permanent: true },
      { source: '/forgotpassword', destination: '/reset-password', permanent: true },
      { source: '/resetpassword', destination: '/reset-password', permanent: true },
      { source: '/verifyemail', destination: '/verify-email', permanent: true },
      { source: '/lms/messages/new', destination: '/lms/messages', permanent: true },
      { source: '/lms/messages/support/new', destination: '/lms/messages', permanent: true },
      { source: '/programs/building-maintenance-tech', destination: '/programs/hvac-technician', permanent: true },
      { source: '/programs/building-services-technician', destination: '/programs/hvac-technician', permanent: true },
      { source: '/programs/business-financial', destination: '/programs/tax-preparation', permanent: true },
      { source: '/programs/cpr-first-aid-hsi', destination: '/programs/cpr-first-aid', permanent: true },
      { source: '/programs/direct-support-professional', destination: '/programs/peer-recovery-specialist', permanent: true },
      { source: '/programs/drug-collector', destination: '/drug-testing/training', permanent: true },
      { source: '/programs/esthetician-apprenticeship', destination: '/programs/cosmetology-apprenticeship', permanent: true },
      { source: '/programs/professional-esthetician', destination: '/programs/cosmetology-apprenticeship', permanent: true },
      // forklift now has its own detail page — redirect removed
      { source: '/programs/it-support', destination: '/programs/it-help-desk', permanent: true },
      { source: '/programs/jri', destination: '/programs/peer-recovery-specialist', permanent: true },
      { source: '/programs/phlebotomy', destination: '/programs/healthcare', permanent: true },
      { source: '/programs/phlebotomy-technician', destination: '/programs/healthcare', permanent: true },
      { source: '/programs/business-startup-marketing', destination: '/programs/entrepreneurship', permanent: true },
      { source: '/programs/emergency-health-safety-tech', destination: '/programs/healthcare', permanent: true },
      { source: '/programs/home-health-aide', destination: '/programs/cna', permanent: true },
      { source: '/programs/public-safety-reentry-specialist', destination: '/programs/peer-recovery-specialist', permanent: true },
      { source: '/programs/cdl-class-a', destination: '/programs/cdl-training', permanent: true },
      { source: '/programs/certified-nursing-assistant', destination: '/programs/cna', permanent: true },
      { source: '/programs/medical-coding-billing', destination: '/programs/healthcare', permanent: true },
      { source: '/programs/cosmetology', destination: '/programs/cosmetology-apprenticeship', permanent: true },

      // ============================================
      // APP ALIAS REDIRECTS (Rule B: auth/app path renames)
      // Centralized here instead of scattered in-page redirect() calls.
      // proxy.ts handles auth; these are pure path consolidation.
      // ============================================

      // Admin login lives at /admin-login (outside /admin layout auth gate)
      // /admin/login redirects here to avoid the layout auth loop
      { source: '/admin/login', destination: '/admin-login', permanent: true },
      { source: '/admin/audits', destination: '/admin/compliance', permanent: true },
      { source: '/admin/compliance-dashboard', destination: '/admin/compliance', permanent: true },
      { source: '/admin/course-authoring', destination: '/admin/course-builder', permanent: true },
      { source: '/admin/course-builder/new', destination: '/admin/course-builder', permanent: true },
      { source: '/admin/course-studio', destination: '/admin/course-builder', permanent: true },
      { source: '/admin/course-studio-ai', destination: '/admin/course-generator', permanent: true },
      { source: '/admin/course-studio-simple', destination: '/admin/course-builder', permanent: true },
      { source: '/admin/dashboard-enhanced', destination: '/admin/dashboard', permanent: true },
      { source: '/admin/enrollment', destination: '/admin/enrollments', permanent: true },
      { source: '/admin/lms-dashboard', destination: '/admin/dashboard', permanent: true },
      { source: '/admin/marketplace', destination: '/admin/store', permanent: true },
      { source: '/admin/master-dashboard', destination: '/admin/dashboard', permanent: true },
      { source: '/admin/programs/catalog/preview', destination: '/admin/programs', permanent: true },

      // Apprentice
      { source: '/apprentice/dashboard', destination: '/apprentice', permanent: true },
      { source: '/apprentice/progress', destination: '/apprentice/hours', permanent: true },

      // Dashboard
      { source: '/dashboard/sub-offices/new', destination: '/dashboard', permanent: true },

      // Employer
      { source: '/employer/apprenticeship', destination: '/employer', permanent: true },
      { source: '/employer/apprenticeship/new', destination: '/employer', permanent: true },
      { source: '/employer/login', destination: '/login', permanent: true },
      { source: '/employer/postings/new', destination: '/employer', permanent: true },
      { source: '/employer/register', destination: '/apply/employer', permanent: true },

      // LMS
      { source: '/lms/catalog', destination: '/lms/courses', permanent: true },

      // Mentor / Mentorship
      { source: '/mentor', destination: '/mentor/dashboard', permanent: false },
      { source: '/mentor/apply', destination: '/mentorship', permanent: true },
      { source: '/mentorship/apply', destination: '/apply', permanent: true },

      // Partner (app-side) - skip /partner-with-us and /partners intermediaries
      { source: '/partner/refer', destination: '/platform/partners', permanent: true },

      // Portal — exact match before wildcard
      { source: '/portal/staff/dashboard', destination: '/staff-portal/dashboard', permanent: true },

      // Program holder
      { source: '/program-holder/portal', destination: '/program-holder/dashboard', permanent: true },
      { source: '/program-holder/portal/attendance', destination: '/program-holder/dashboard', permanent: true },
      { source: '/program-holder/portal/live-qa', destination: '/program-holder/support', permanent: true },
      { source: '/program-holder/portal/messages', destination: '/program-holder/support', permanent: true },
      { source: '/program-holder/portal/reports', destination: '/program-holder/reports', permanent: true },
      { source: '/program-holder/portal/students', destination: '/program-holder/students', permanent: true },
      { source: '/program-holder/programs/new', destination: '/program-holder/programs', permanent: true },

      // Staff
      { source: '/staff-portal/processes', destination: '/staff-portal/qa-checklist', permanent: true },

      // Student portal
      { source: '/student-portal/messages', destination: '/lms/chat', permanent: true },
      { source: '/student-portal/settings', destination: '/lms/settings', permanent: true },

      // ============================================
      // LEGACY / FRAMEWORK REDIRECTS
      // ============================================

      // Normalize "Institute" style routes into the infrastructure model
      { source: '/institute', destination: '/', permanent: true },
      { source: '/training-institute', destination: '/programs', permanent: true },
      { source: '/student/dashboard', destination: '/student-portal', permanent: true },
      
      // Fix old hero image paths
      {
        source: '/clear-pathways-hero.jpg',
        destination: '/clear-path-main-image.jpg',
        permanent: true,
      },
      {
        source: '/images/efh/hero/hero-main.jpg',
        destination: '/images/efh/hero/hero-main-clean.jpg',
        permanent: true,
      },
      // Redirect sitemap-page to sitemap.xml
      {
        source: '/sitemap-page',
        destination: '/sitemap.xml',
        permanent: true,
      },
      // /home → / handled by Netlify (public SEO route, Rule A)
      
      // Dashboard consolidation - canonical student entry is /student-portal
      { source: '/student', destination: '/student-portal', permanent: true },
      // Exact match first: /portal → portal chooser. Wildcard below catches /portal/anything → /lms/anything.
      { source: '/portal', destination: '/portals', permanent: true },
      { source: '/portal/:path*', destination: '/lms/:path*', permanent: true },
      { source: '/student/:path*', destination: '/lms/:path*', permanent: true },
      { source: '/students/:path*', destination: '/lms/:path*', permanent: true },
      { source: '/learners/:path*', destination: '/lms/:path*', permanent: true },
      { source: '/program-holder-portal/:path*', destination: '/program-holder/:path*', permanent: true },
      // /admin-portal is now a public landing page - no redirect needed
      // /dashboard redirect removed - handled by middleware with auth check

      // Tax consolidation
      { source: '/tax-filing/:path*', destination: '/tax/:path*', permanent: true },
      { source: '/tax-services/:path*', destination: '/tax/:path*', permanent: true },
      { source: '/tax-software/:path*', destination: '/tax/:path*', permanent: true },

      // Program consolidation
      { source: '/programs-catalog/:path*', destination: '/programs/:path*', permanent: true },
      { source: '/program-finder/:path*', destination: '/programs/:path*', permanent: true },
      { source: '/compare-programs/:path*', destination: '/programs/:path*', permanent: true },

      // Program alias → DB canonical slug (one URL per program)
      // Archived year-specific variants
      { source: '/programs/barber-2024', destination: '/programs/barber-apprenticeship', permanent: true },
      { source: '/programs/hvac-2024', destination: '/programs/hvac-technician', permanent: true },
      // CDL
      { source: '/programs/cdl', destination: '/programs/cdl-training', permanent: true },
      { source: '/programs/cdl-transportation', destination: '/programs/cdl-training', permanent: true },
      // CNA — /programs/cna is the canonical page
      { source: '/programs/cna-cert', destination: '/programs/cna', permanent: true },
      // HVAC
      { source: '/programs/hvac', destination: '/programs/hvac-technician', permanent: true },
      // Barber & Beauty
      { source: '/programs/barber', destination: '/programs/barber-apprenticeship', permanent: true },
      { source: '/programs/beauty', destination: '/programs/barber-apprenticeship', permanent: true },
      // Business
      // Tax — real page is /programs/tax-preparation
      { source: '/programs/tax-prep', destination: '/programs/tax-preparation', permanent: true },
      { source: '/programs/tax-entrepreneurship', destination: '/programs/tax-preparation', permanent: true },
      { source: '/programs/tax-prep-financial-services', destination: '/programs/tax-preparation', permanent: true },
      // Healthcare aliases
      // Human Services
      // Skilled Trades aliases
      // Technology aliases
      { source: '/programs/cybersecurity', destination: '/programs/cybersecurity-analyst', permanent: true },

      // Career consolidation — /career-center handled by Netlify (Rule A)
      { source: '/career-fair/:path*', destination: '/career-services/:path*', permanent: true },

      // Partner consolidation — /partner-with-us handled by Netlify (Rule A)
      { source: '/partner-application/:path*', destination: '/partners/:path*', permanent: true },
      { source: '/partner-courses/:path*', destination: '/partners/:path*', permanent: true },
      { source: '/partner-playbook/:path*', destination: '/partners/:path*', permanent: true },

      // Auth consolidation

      // Legal consolidation
      { source: '/privacy', destination: '/privacy-policy', permanent: true },
      { source: '/terms', destination: '/terms-of-service', permanent: true },
      { source: '/legal/privacy', destination: '/privacy-policy', permanent: true },
      { source: '/legal/terms-of-service', destination: '/terms-of-service', permanent: true },
      { source: '/legal/governance/lms', destination: '/legal/governance/platform-overview', permanent: true },
      { source: '/legal/governance/store', destination: '/legal/governance/platform-overview', permanent: true },
      { source: '/policies/privacy', destination: '/privacy-policy', permanent: true },
      { source: '/policies/terms', destination: '/terms-of-service', permanent: true },
      { source: '/policies/grievance', destination: '/grievance', permanent: true },
      { source: '/license-agreement', destination: '/legal/license-agreement', permanent: true },

      // Pricing / billing consolidation
      { source: '/pricing', destination: '/license/pricing', permanent: true },
      { source: '/billing', destination: '/account/billing', permanent: true },

      // Auth aliases
      { source: '/forgot-password', destination: '/reset-password', permanent: true },
      { source: '/partners/login', destination: '/partner/login', permanent: true },

      // Tax aliases
      { source: '/tax-preparation', destination: '/supersonic-fast-cash/services/tax-preparation', permanent: true },
      { source: '/tax-faq', destination: '/supersonic-fast-cash/support', permanent: true },
      { source: '/refund-advance', destination: '/supersonic-fast-cash/services/refund-advance', permanent: true },
      { source: '/tax/upload', destination: '/documents/upload', permanent: true },

      // Store / platform aliases
      { source: '/store/demo', destination: '/store/demos', permanent: true },
      { source: '/store/orders', destination: '/shop/orders', permanent: true },
      { source: '/platform/licensing', destination: '/licensing-partnerships', permanent: true },
      { source: '/chat', destination: '/support/chat', permanent: true },
      { source: '/certificates/verify', destination: '/cert/verify', permanent: true },

      // Verify consolidation
      { source: '/verifycertificate/:path*', destination: '/verify/:path*', permanent: true },

      // Misc redirects
      { source: '/dashboards/:path*', destination: '/lms/:path*', permanent: true },
      // /portals base route has its own page — only redirect sub-paths
      { source: '/portals/:slug/:path*', destination: '/lms/:slug/:path*', permanent: true },
      { source: '/portals/:slug', destination: '/lms/:slug', permanent: true },

      // These brands have their own pages — only redirect sub-paths, not the root
      // /serene-comfort-care/page.tsx exists and redirects to /partners itself
      // /kingdom-konnect/page.tsx exists with full content
      // /urban-build-crew/page.tsx exists with full content
      // /selfish-inc/page.tsx exists with full content

      // Removed routes - financial-aid has its own page now
      { source: '/forums/:path*', destination: '/blog', permanent: true },
      // /alumni/page.tsx exists (182 lines) — do not redirect away from it
      // { source: '/alumni/:path*', destination: '/about', permanent: true },
      { source: '/board/:path*', destination: '/admin/:path*', permanent: true },
      { source: '/receptionist/:path*', destination: '/staff-portal/:path*', permanent: true },
      { source: '/delegate/:path*', destination: '/admin/:path*', permanent: true },
      { source: '/forum/:path*', destination: '/blog', permanent: true },
      // /news/page.tsx exists (137 lines) — do not redirect away from it
      // { source: '/news/:path*', destination: '/blog/:path*', permanent: true },
      
      // Old 404 URLs from Google/Netlify logs - redirect to relevant pages
      { source: '/about/founder', destination: '/about/team', permanent: true },
      { source: '/etpl-programs', destination: '/pathways', permanent: true },
      { source: '/intake', destination: '/apply', permanent: true },
      { source: '/home1', destination: '/', permanent: true },
      { source: '/downloads', destination: '/resources', permanent: true },
      { source: '/docs/students/certificates', destination: '/credentials', permanent: true },
      { source: '/programs/food-handler', destination: '/programs', permanent: true },
      { source: '/program-holder/portal/:path*', destination: '/program-holder/:path*', permanent: true },

      // ============================================
      // ENROLL / APPLY CONSOLIDATION
      // Single redirect authority — all enroll/apply routing lives here.
      // ============================================

      // /enroll → /apply (was in netlify.toml, now canonical here)
      { source: '/enroll', destination: '/apply', permanent: true },

      // Barber enrollment: 1-hop to dedicated apply page (kills 3-hop chain)
      { source: '/enroll/barber-apprenticeship', destination: '/programs/barber-apprenticeship/apply', permanent: true },

      // Duplicate student forms → canonical /apply/student
      { source: '/apply/quick', destination: '/apply/student', permanent: true },
      { source: '/apply/full', destination: '/apply/student', permanent: true },

      // Duplicate status pages → canonical /apply/track

      // Duplicate success pages → canonical /apply/success
      { source: '/apply/confirmation', destination: '/apply/success', permanent: true },

      // Program holder apply alias (was in netlify.toml)
      { source: '/program-holder/apply', destination: '/apply/program-holder', permanent: true },

      // /scholarships → /funding handled by Netlify (public SEO route, Rule A)
      { source: '/health-services', destination: '/programs/healthcare', permanent: true },
      // Donate page has its own content now
      { source: '/resources/:path*', destination: '/blog', permanent: true },
      { source: '/career-uplift-services/:path*', destination: '/career-services', permanent: true },
      // /community/page.tsx exists (371 lines) — do not redirect away from it
      { source: '/video', destination: '/videos', permanent: true },
      
      // LMS redirects
      { source: '/lms/my-courses', destination: '/lms/courses', permanent: true },
      
      // Student portal redirects
      { source: '/student-portal/dashboard', destination: '/student-portal', permanent: true },
      { source: '/student-portal/courses', destination: '/student-portal', permanent: true },
      { source: '/student-portal/certificates', destination: '/student-portal', permanent: true },
      { source: '/student-portal/progress', destination: '/student-portal', permanent: true },
      // /student-portal/settings → /lms/settings handled by middleware (Rule B)
      
      // Partner portal redirects
      // NOTE: /partner/dashboard is the canonical partner dashboard page.
      // /partner/page.tsx redirects TO /partner/dashboard, so do NOT redirect /partner/dashboard back.
      // Removed: { source: '/partner/dashboard', destination: '/partner', permanent: true },
      // Removed: { source: '/partner/courses', destination: '/partner', permanent: true },
      // Removed: { source: '/partner/students', destination: '/partner', permanent: true },
      
      // AI redirects
      { source: '/ai-instructor', destination: '/ai-tutor', permanent: true },
      
      // Marketing redirects
      { source: '/success-stories', destination: '/testimonials', permanent: true },
      { source: '/for-workforce-boards', destination: '/workforce-board', permanent: true },
      { source: '/get-started', destination: '/start', permanent: true },
      
      // Admin route consolidation
      { source: '/admin/autopilots', destination: '/admin/autopilot', permanent: true },
      { source: '/admin/analytics-dashboard', destination: '/admin/analytics', permanent: true },
      
      // /outcomes/indiana is a public page — do not redirect it
      // Other outcomes sub-routes redirect to programs until data exists
      { source: '/metrics', destination: '/programs', permanent: false },

      // ============================================
      // DEAD LINK FIXES — public-facing
    ];
  },
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    // Netlify sets CONTEXT (not NODE_ENV) to 'deploy-preview' or 'branch-deploy'
    const isPreview = process.env.CONTEXT === 'deploy-preview' || process.env.CONTEXT === 'branch-deploy';
    const host = process.env.URL || '';
    
    // No special handling needed - single canonical domain: www.elevateforhumanity.org
    const robotsHeaders = [];
    
    // Base security headers for all environments
    const securityHeaders = [
      ...robotsHeaders,
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          isProduction
            ? "script-src 'self' 'unsafe-inline' https://connect.facebook.net https://js.stripe.com https://www.googletagmanager.com https://widget.sezzle.com"
            : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://connect.facebook.net https://js.stripe.com https://widget.sezzle.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev https://cms-artifacts.artlist.io",
          "font-src 'self' data: https://fonts.gstatic.com",
          "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co https://us06web.zoom.us",
          "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://js.stripe.com https://us06web.zoom.us",
          "media-src 'self' data: blob: https://*.supabase.co https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev https://cms-artifacts.artlist.io",
          "worker-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self' https://js.stripe.com",
          "frame-ancestors 'none'",
          "upgrade-insecure-requests",
          // CSP violation reporting endpoint
          "report-uri /api/csp-report",
          "report-to csp-endpoint",
        ].join('; '),
      },
      {
        key: 'Report-To',
        value: JSON.stringify({
          group: 'csp-endpoint',
          max_age: 86400,
          endpoints: [{ url: '/api/csp-report' }],
        }),
      },
    ];

    // Environment-specific robots tag
    if (isPreview) {
      securityHeaders.push({
        key: 'X-Robots-Tag',
        value: 'noindex, nofollow, noarchive',
      });
    } else {
      securityHeaders.push({
        key: 'X-Robots-Tag',
        value: 'noai, noimageai',
      });
    }

    return [
      // Studio route - Cross-Origin Isolation for WebContainer
      {
        source: '/studio/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Build-ID', value: process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
        ],
      },
      {
        source: '/studio',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Build-ID', value: process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
        ],
      },
      // 1) Never allow HTML / app routes to be cached for a year
      {
        source: '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|studio).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Surrogate-Control', value: 'no-store' },
          { key: 'X-Build-ID', value: process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
          { key: 'X-Deployment-ID', value: process.env.DEPLOY_ID || 'local' },
          ...securityHeaders,
        ],
      },

      // 2) Allow hashed Next static assets to be cached long-term (safe)
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },

      // 3) Next image optimizer - short cache with revalidation
      {
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },

      // 4) Safety: prevent accidental long-caching of direct CSS/JS files at root
      {
        source: '/:path*.css',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/:path*.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },

      // Override X-Robots-Tag for images and videos
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Robots-Tag',
            value: 'all',
          },
        ],
      },
      {
        source: '/videos/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Robots-Tag',
            value: 'all',
          },
        ],
      },
    ];
  },
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
