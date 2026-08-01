import { withSentryConfig } from '@sentry/nextjs';
import fs from 'node:fs';
import path from 'node:path';
import {
  lmsOnlyStandaloneTraceExcludes,
  sharedStandaloneTraceExcludes,
} from './scripts/next-standalone-trace-excludes.mjs';
import { resolveCommitSha } from './scripts/build-identity.mjs';

const useStandaloneOutput =
  process.env.GITHUB_ACTIONS !== 'true' || process.env.NEXT_STANDALONE_OUTPUT === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Next's built-in lint step during build - ESLint runs separately
  serverExternalPackages: [
    'tesseract.js',
    'tesseract.js-core',
    'sharp',
    'pdf-parse',
    'pdfjs-dist',
    '@napi-rs/canvas',
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
    '@sentry/node-core',
    '@sentry/core',
    '@apm-js-collab/tracing-hooks',
    '@apm-js-collab/code-transformer',
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/compositor-linux-x64-gnu',
    '@rspack/core',
    '@rspack/binding',
    '@rspack/binding-linux-x64-gnu',
    'remotion',
    '@opentelemetry/api',
    '@opentelemetry/sdk-node',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/resources',
    '@opentelemetry/semantic-conventions',
    'puppeteer',
    'puppeteer-core',
    'playwright',
    'chromium-bidi',
    'typescript',
    'core-js',
    '@upstash/ratelimit',
    '@mailchimp/mailchimp_marketing',
    '@octokit/rest',
    '@octokit/auth-oauth-app',
    '@webcontainer/api',
    'cheerio',
    'docx',
    'fast-xml-parser',
    'jszip',
    'qrcode',
    'resend',
    'speakeasy',
    'web-push',
    'yjs',
    'y-websocket',
  ],

  devIndicators: {
    position: 'bottom-right',
  },

  generateBuildId: async () => {
    // Deterministic build ID: always derived from the canonical commit SHA.
    // Uses GIT_SHA > GITHUB_SHA > NEXT_PUBLIC_GIT_SHA > COMMIT_SHA.
    // Falls back to 'local-dev' only in non-production environments.
    // NEVER uses Date.now(), Math.random(), or random UUID.
    const sha = resolveCommitSha(process.env);
    return sha === 'local-development' ? 'local-dev' : sha.slice(0, 7);
  },

  // Expose deterministic build identity to client bundles.
  // These are baked into .next/BUILD_ID at build time (not runtime env).
  env: {
    NEXT_PUBLIC_GIT_SHA: resolveCommitSha(process.env),
    NEXT_PUBLIC_BUILD_ID: `elevate-${resolveCommitSha(process.env)}`,
    NEXT_PUBLIC_BUILD_TIMESTAMP:
      process.env.BUILD_TIMESTAMP ?? 'unknown',
  },

  ...(useStandaloneOutput ? { output: 'standalone' } : {}),
  transpilePackages: ['edge-tts'],

  reactStrictMode: true,
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,

  images: {
    // Enable unoptimized for standalone/docker deployments
    // Next.js image optimization doesn't work in standalone mode without external image optimization API
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [70, 75, 85, 90, 95],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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

  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  allowedDevOrigins: ['localhost'],

  modularizeImports: {
    // Split lucide icons into individual imports for better tree-shaking
    '^lucide-react$': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
      skipDefaultConversion: true,
    },
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-'],
    serverActions: {
      allowedOrigins: [
        'www.elevateforhumanity.org',
        'elevateforhumanity.org',
        'app.elevateforhumanity.org',
        'admin.elevateforhumanity.org',
        '*.elevateforhumanity.org',
        '*.northflank.app',
      ],
    },
    optimizeCss: false,
  },

  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  webpack: (config, { isServer }) => {
    // webpack 5 polyfills node core modules automatically but requires explicit configuration
    // for modules like buffer that need browser polyfills
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };

      // Use ProvidePlugin to make buffer available as a global in the browser
      // This is needed because @react-pdf/renderer and other libraries use Buffer
      const webpack = config.compiler?.webpack;
      if (webpack?.ProvidePlugin) {
        config.plugins = config.plugins || [];
        config.plugins.push(
          new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            buffer: 'buffer',
          })
        );
      }
    }

    // Webpack cache configuration for consistent builds
    // - Enable filesystem cache when NEXT_BUILD_CACHE is set (Northflank persistent /cache/.next)
    // - This ensures consistent Server Action IDs across builds
    // - Only disable if DISABLE_WEBPACK_FILESYSTEM_CACHE='1'
    if (process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE === '1') {
      config.cache = false;
    } else if (process.env.NEXT_BUILD_CACHE) {
      // Next.js auto-detects NEXT_BUILD_CACHE and enables filesystem cache
      // No explicit config needed - ensures stable Server Action IDs
    } else if (process.env.CI === 'true') {
      // CI without persistent cache - disable to avoid stale cache
      config.cache = false;
    }

    // Use Next.js default splitChunks  the custom config above was creating
    // one chunk per npm package (name() function), generating thousands of
    // chunks and holding the entire module graph in memory simultaneously.
    // On a 2,500+ page app this caused OOM on every cold build.
    // Let Next.js manage chunking; it's tuned for this scale.
    return config;
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingExcludes: {
    '/api/devstudio/files': ['**/*'],
    '/api/devstudio/shell': ['**/*'],
    '/api/accreditation/report': ['**/*'],
    '*': [...sharedStandaloneTraceExcludes, ...lmsOnlyStandaloneTraceExcludes],
  },

  // Include lib/supabase in standalone builds to fix runtime errors
  outputFileTracingIncludes: {
    '/**': ['lib/supabase/**', 'lib/logger.ts'],
  },

  async redirects() {
    const canonicalRoutesPath = path.join(process.cwd(), 'lib/routes/canonical-routes.json');
    const canonicalConfig = JSON.parse(fs.readFileSync(canonicalRoutesPath, 'utf8'));
    const canonicalAliasRedirects = (canonicalConfig.legacyAliases || []).map((alias) => ({
      source: alias.source,
      destination: alias.destination,
      permanent: alias.permanent !== false,
    }));

    const imageManifest = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'scripts/.image-conversion-manifest.json'), 'utf8'),
    );
    const imageJpgRedirects = imageManifest.map((row) => ({
      source: row.origRel,
      destination: row.webpRel,
      permanent: true,
    }));
    imageJpgRedirects.push(
      {
        source: '/hero-images/how-it-works-hero.jpg',
        destination: '/hero-images/how-it-works-hero.webp',
        permanent: true,
      },
    );

    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'elevateforhumanity.org' }],
        destination: 'https://www.elevateforhumanity.org/',
        permanent: true,
      },
      {
        source: '/:path+',
        has: [{ type: 'host', value: 'elevateforhumanity.org' }],
        destination: 'https://www.elevateforhumanity.org/:path+',
        permanent: true,
      },
      {
        source: '/videos/barber-hero-final.mp4',
        destination: 'https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/barber-hero.mp4',
        permanent: false,
      },
      { source: '/admin/leads', destination: '/admin/crm/leads', permanent: true },
      { source: '/admin/leads/new', destination: '/admin/crm/leads/new', permanent: true },
      { source: '/admin/syllabus-generator', destination: '/admin/studio', permanent: true },
      { source: '/admin/course-templates', destination: '/admin/studio', permanent: true },
      { source: '/admin/courses/manage', destination: '/admin/courses', permanent: true },
      { source: '/admin/course-import', destination: '/admin/studio', permanent: true },
      { source: '/admin/quiz-builder', destination: '/admin/studio', permanent: true },
      { source: '/admin/external-courses', destination: '/admin/courses', permanent: true },
      { source: '/admin/enrollment', destination: '/admin/students', permanent: true },
      { source: '/admin/users', destination: '/admin/staff', permanent: true },
      { source: '/admin/contacts', destination: '/admin/crm/contacts', permanent: true },
      { source: '/admin/campaigns', destination: '/admin/crm/campaigns', permanent: true },
      { source: '/admin/email-marketing', destination: '/admin/crm/campaigns', permanent: true },
      { source: '/admin/social-media', destination: '/admin/crm/campaigns', permanent: true },
      { source: '/admin/marketing', destination: '/admin/crm', permanent: true },
      { source: '/admin/compliance-audit', destination: '/admin/compliance', permanent: true },
      { source: '/admin/license', destination: '/admin/licenses', permanent: true },
      { source: '/admin/license-requests', destination: '/admin/licenses', permanent: true },
      { source: '/admin/progress', destination: '/admin/analytics/learning', permanent: true },
      { source: '/admin/completions', destination: '/admin/analytics/learning', permanent: true },
      { source: '/admin/outcomes', destination: '/admin/analytics', permanent: true },
      { source: '/admin/copilot', destination: '/admin/studio', permanent: true },
      { source: '/admin/video-manager', destination: '/admin/studio', permanent: true },
      { source: '/admin/course-builder', destination: '/admin/studio', permanent: true },
      { source: '/studio(.*)', destination: '/admin/studio$1', permanent: false },
      { source: '/admin-dashboard', destination: '/admin/dashboard', permanent: true },
      { source: '/host-shops', destination: '/partners/host-shops', permanent: true },
      {
        source: '/store/codebase-clone',
        destination: '/store/licenses#clone',
        permanent: false,
      },
      { source: '/forgotpassword', destination: '/reset-password', permanent: true },
      { source: '/resetpassword', destination: '/reset-password', permanent: true },
      { source: '/verifyemail', destination: '/verify-email', permanent: true },
      { source: '/lms/messages/new', destination: '/lms/messages', permanent: true },
      { source: '/lms/messages/support/new', destination: '/lms/messages', permanent: true },
      { source: '/apprentice/dashboard', destination: '/apprentice', permanent: true },
      { source: '/apprentice/progress', destination: '/apprentice/hours', permanent: true },
      { source: '/dashboard/sub-offices/new', destination: '/dashboard', permanent: true },
      { source: '/employer/apprenticeship', destination: '/employer/dashboard', permanent: true },
      { source: '/employer/apprenticeship/new', destination: '/employer/dashboard', permanent: true },
      { source: '/employer/applications', destination: '/employer/dashboard', permanent: true },
      { source: '/employer/apprentices/new', destination: '/employer/dashboard', permanent: true },
      // /login page doesn't exist in marketing app, redirect to /app/login
      { source: '/login', destination: '/app/login', permanent: true },
      { source: '/employer/login', destination: '/app/login', permanent: true },
      { source: '/employer/postings/new', destination: '/employer/dashboard', permanent: true },
      { source: '/employer/register', destination: '/apply/employer', permanent: true },
      { source: '/employer-portal', destination: '/employer/dashboard', permanent: true },
      { source: '/employer-portal/dashboard', destination: '/employer/dashboard', permanent: true },
      { source: '/employer-portal/jobs', destination: '/employer/jobs', permanent: true },
      { source: '/employer-portal/applications', destination: '/employer/dashboard', permanent: true },
      { source: '/employer-portal/candidates', destination: '/employer/candidates', permanent: true },
      { source: '/employer-portal/analytics', destination: '/employer/analytics', permanent: true },
      { source: '/employer-portal/company', destination: '/employer/company', permanent: true },
      { source: '/employer-portal/settings', destination: '/employer/settings', permanent: true },
      { source: '/employer-portal/messages', destination: '/employer/dashboard', permanent: true },
      { source: '/employer-portal/interviews', destination: '/employer/candidates', permanent: true },
      { source: '/employer-portal/programs', destination: '/employer/opportunities', permanent: true },
      { source: '/employer-portal/wotc', destination: '/employer/wotc', permanent: true },
      { source: '/employer-portal/:path*', destination: '/employer/:path*', permanent: true },
      { source: '/lms/catalog', destination: '/lms/courses', permanent: true },
      { source: '/admin/curriculum',        destination: '/admin/studio', permanent: true },
      { source: '/admin/media-studio',      destination: '/admin/studio', permanent: true },
      { source: '/admin/video-generator',   destination: '/admin/studio', permanent: true },
      { source: '/admin/courses/pipeline',  destination: '/admin/studio', permanent: true },
      { source: '/admin/courses/generate',  destination: '/admin/studio', permanent: true },
      { source: '/learners/:path*', destination: '/lms/:path*', permanent: true },
      {
        source: '/program-holder-portal/:path*',
        destination: '/program-holder/:path*',
        permanent: true,
      },
      { source: '/program-holder/portal/students', destination: '/program-holder/students', permanent: true },
      { source: '/program-holder/portal/reports', destination: '/program-holder/dashboard', permanent: true },
      { source: '/program-holder/portal/page', destination: '/program-holder/dashboard', permanent: false },
      { source: '/program-holders', destination: '/program-holder', permanent: true },
      {
        source: '/program-holders/portal',
        destination: '/program-holder/dashboard',
        permanent: true,
      },
      {
        source: '/program-holders/universal-mou',
        destination: '/legal/program-host-agreement',
        permanent: true,
      },
      {
        source: '/program-holders/sign-mou',
        destination: '/program-holder/sign-mou',
        permanent: true,
      },
      { source: '/program-holders/apply', destination: '/apply/program-holder', permanent: true },
      {
        source: '/program-holders/onboarding',
        destination: '/program-holder/onboarding',
        permanent: true,
      },
      {
        source: '/program-holders/training-providers',
        destination: '/program-holder',
        permanent: true,
      },
      {
        source: '/program-holders/acknowledgement',
        destination: '/program-holder/rights-responsibilities',
        permanent: true,
      },
      { source: '/program-holders/:path*', destination: '/program-holder/:path*', permanent: true },
      { source: '/tax-filing/:path*', destination: '/tax/:path*', permanent: true },
      { source: '/tax-services/:path*', destination: '/tax/:path*', permanent: true },
      { source: '/tax-software/:path*', destination: '/tax/:path*', permanent: true },
      { source: '/programs-catalog/:path*', destination: '/programs/:path*', permanent: true },
      { source: '/program-finder/:path*', destination: '/programs/:path*', permanent: true },
      { source: '/apply/barber', destination: '/partners/barber-host-shop/apply', permanent: true },
      { source: '/partners/barbershop-apprenticeship/:path*', destination: '/partners/barber-host-shop/:path*', permanent: true },
      { source: '/partners/cosmetology-partner-shop/:path*', destination: '/partners/cosmetology-host-shop/:path*', permanent: true },
      { source: '/partners/cosmetology-apprenticeship/:path*', destination: '/partners/cosmetology-host-shop/:path*', permanent: true },
      { source: '/apply/cosmetology', destination: '/partners/cosmetology-host-shop/apply', permanent: true },
      { source: '/partner-courses/:path*', destination: '/partners/:path*', permanent: true },
      { source: '/partner-playbook/:path*', destination: '/partners/:path*', permanent: true },
      { source: '/credentials/checksheets', destination: '/programs', permanent: false },
      { source: '/credentials/:path+', destination: '/programs', permanent: false },
      { source: '/mission', destination: '/about', permanent: false },
      { source: '/financial-support', destination: '/funding', permanent: true },
      { source: '/community/groups', destination: '/community-services', permanent: false },
      { source: '/community/:path*', destination: '/community-services', permanent: true },
      { source: '/outcomes/indiana', destination: '/about', permanent: false },
      { source: '/legal/terms-of-service', destination: '/legal', permanent: true },
      {
        source: '/legal/governance/lms',
        destination: '/legal/governance/lms-standards',
        permanent: true,
      },
      {
        source: '/legal/governance/store',
        destination: '/legal/governance/store-payments',
        permanent: true,
      },
      { source: '/policies/grievance', destination: '/grievance', permanent: true },
      { source: '/policies/:path*', destination: '/legal/disclosures', permanent: true },
      { source: '/partners/login', destination: '/app/login', permanent: true },
      { source: '/store/trial', destination: '/launch', permanent: false },
      { source: '/marketplace', destination: '/store/digital', permanent: true },
      { source: '/store/demo', destination: '/store/demos', permanent: true },
      { source: '/store/orders', destination: '/store', permanent: true },
      { source: '/platform/licensing', destination: '/licensing', permanent: true },
      { source: '/certificates/verify', destination: '/verify', permanent: true },
      { source: '/verifycertificate/:path*', destination: '/verify/:path*', permanent: true },
      { source: '/dashboards/:path*', destination: '/lms/:path*', permanent: true },
      { source: '/portal', destination: '/portals', permanent: true },
      { source: '/receptionist/:path*', destination: '/admin/staff-portal/:path*', permanent: true },
      { source: '/forum/:path*', destination: '/blog', permanent: true },
      { source: '/about/founder', destination: '/about/team', permanent: true },
      { source: '/docs/:path*', destination: '/resources', permanent: false },
      {
        source: '/apply/barber-apprenticeship',
        destination: '/programs/barber-apprenticeship/apply',
        permanent: true,
      },
      {
        source: '/enroll/barber-apprenticeship',
        destination: '/programs/barber-apprenticeship/apply',
        permanent: true,
      },
      {
        source: '/pwa/barber/enroll',
        destination: '/programs/barber-apprenticeship/apply',
        permanent: true,
      },
      { source: '/career-uplift-services/:path*', destination: '/career-services', permanent: true },
      { source: '/lms/my-courses', destination: '/lms/courses', permanent: true },
      { source: '/student-portal', destination: '/learner/dashboard', permanent: true },
      { source: '/admin-portal', destination: '/app/login', permanent: true },
      { source: '/for-workforce-boards', destination: '/workforce-board', permanent: true },
      { source: '/get-started', destination: '/start', permanent: true },
      { source: '/training/cna', destination: '/programs/cna', permanent: true },
      { source: '/programs/it-support', destination: '/programs/it-help-desk', permanent: true },
      { source: '/wioa-training', destination: '/wioa-eligibility', permanent: true },
      { source: '/wioa-training-indiana', destination: '/wioa-eligibility', permanent: true },
      { source: '/wioa-funded-training', destination: '/wioa-eligibility', permanent: true },
      { source: '/healthcare-training', destination: '/healthcare-training-indianapolis', permanent: true },
      { source: '/skilled-trades-training', destination: '/skilled-trades-training-indiana', permanent: true },
      { source: '/logout', destination: '/app/login', permanent: false },
      { source: '/elevate-platform-overview.pdf', destination: '/resources', permanent: false },
      { source: '/usermanagement', destination: '/admin/reports/users', permanent: true },
      { source: '/curriculumupload', destination: '/admin/curriculum/upload', permanent: true },
      { source: '/community', destination: '/community-services', permanent: true },
      { source: '/admin/live-sessions/new', destination: '/admin/dashboard', permanent: false },
      { source: '/admin/live-sessions', destination: '/admin/dashboard', permanent: true },
      { source: '/auth/signin', destination: '/app/login', permanent: true },
      { source: '/sign-in', destination: '/app/login', permanent: true },
      { source: '/signin', destination: '/app/login', permanent: true },
      { source: '/auth/signup', destination: '/signup', permanent: true },
      { source: '/register', destination: '/signup', permanent: true },
      { source: '/auth/forgot-password', destination: '/reset-password', permanent: true },
      { source: '/auth/verify-email', destination: '/verify-email', permanent: true },
      { source: '/update-password', destination: '/auth/reset-password', permanent: true },
      { source: '/cm', destination: '/case-manager/dashboard', permanent: true },
      { source: '/cm/learners/:id', destination: '/case-manager/participants/:id', permanent: true },
      { source: '/cm/:path*', destination: '/case-manager/:path*', permanent: true },
      { source: '/employers/post-job', destination: '/employer/post-job', permanent: true },
      { source: '/employers/apprenticeships', destination: '/employer/apprenticeships', permanent: true },
      { source: '/employers/benefits', destination: '/employer/dashboard', permanent: true },
      { source: '/employers/talent-pipeline', destination: '/employer/dashboard', permanent: true },
      { source: '/partner-portal', destination: '/partner/dashboard', permanent: true },
      { source: '/partner-portal/:path*', destination: '/partner/:path*', permanent: true },
      { source: '/career-training-illinois', destination: '/career-training-indiana', permanent: true },
      { source: '/career-training-ohio', destination: '/career-training-indiana', permanent: true },
      { source: '/career-training-tennessee', destination: '/career-training-indiana', permanent: true },
      { source: '/career-training-texas', destination: '/career-training-indiana', permanent: true },
      { source: '/community-services-illinois', destination: '/community-services-indiana', permanent: true },
      { source: '/community-services-ohio', destination: '/community-services-indiana', permanent: true },
      { source: '/community-services-tennessee', destination: '/community-services-indiana', permanent: true },
      { source: '/community-services-texas', destination: '/community-services-indiana', permanent: true },
      { source: '/cert/verify', destination: '/verify', permanent: true },
      { source: '/cert/verify/:id', destination: '/verify/:id', permanent: true },
      { source: '/certificates/verify/:id', destination: '/verify/:id', permanent: true },
      { source: '/verify-credential', destination: '/verify', permanent: true },
      { source: '/certifications', destination: '/certificates', permanent: true },
      { source: '/certification', destination: '/certificates', permanent: true },
      { source: '/privacy', destination: '/legal/privacy', permanent: true },
      { source: '/privacy-policy', destination: '/legal/privacy', permanent: true },
      { source: '/terms', destination: '/legal', permanent: true },
      { source: '/terms-of-service', destination: '/legal', permanent: true },
      { source: '/eula', destination: '/legal/eula', permanent: true },
      { source: '/license-agreement', destination: '/legal/license-agreement', permanent: true },
      { source: '/disclosures', destination: '/legal/disclosures', permanent: true },
      { source: '/micro-classes', destination: '/microclasses', permanent: true },
      { source: '/donations', destination: '/donate', permanent: true },
      { source: '/funding-impact', destination: '/funding', permanent: true },
      { source: '/fundingimpact', destination: '/funding', permanent: true },
      { source: '/for/students', destination: '/for-students', permanent: true },
      { source: '/connects', destination: '/connect', permanent: true },
      { source: '/store/licensing', destination: '/store/licenses', permanent: true },
      { source: '/store/licensing/enterprise', destination: '/store/licenses/enterprise-license', permanent: true },
      { source: '/store/licensing/managed', destination: '/store/licenses', permanent: true },
      { source: '/store/licenses/managed', destination: '/store/licenses', permanent: true },
      { source: '/store/licensing/:path*', destination: '/store/licenses/:path*', permanent: true },

      // SEO Redirect Stubs - Moved from page.tsx to config for better performance
      { source: '/career-training-indiana', destination: '/career-training', permanent: true },
      { source: '/community-services-indiana', destination: '/community-services', permanent: true },
      { source: '/connect', destination: '/career-services', permanent: true },
      { source: '/healthcare', destination: '/programs/healthcare', permanent: true },
      { source: '/learner', destination: '/lms', permanent: true },
      { source: '/partner', destination: '/host-shop', permanent: true },
      { source: '/skilled-trades-training-indiana', destination: '/programs/skilled-trades', permanent: true },
      { source: '/verify-email', destination: '/verify', permanent: true },
      { source: '/launch', destination: '/store', permanent: true },
      { source: '/microclasses', destination: '/programs', permanent: true },

      // Legacy /demo duplicate - consolidate to /demos
      { source: '/demo', destination: '/demos', permanent: true },

      // Fix redirect chains
      { source: '/healthcare-training-indianapolis', destination: '/programs/healthcare', permanent: true },

      // Include legacy aliases from canonical-routes.json
      ...canonicalAliasRedirects,

      // Include image .jpg -> .webp redirects
      ...imageJpgRedirects,

      // ============================================================
      // PORTAL ROUTE ROUTING
      // Route portal links from www. to the correct subdomain apps.
      // Uses has:host condition so these don't run on other subdomains.
      // ============================================================

      // LMS app routes → app.elevateforhumanity.org
      {
        source: '/lms/:path*',
        has: [{ type: 'host', value: 'www.elevateforhumanity.org' }],
        destination: 'https://app.elevateforhumanity.org/lms/:path*',
        permanent: false,
      },
      {
        source: '/employer/:path*',
        has: [{ type: 'host', value: 'www.elevateforhumanity.org' }],
        destination: 'https://app.elevateforhumanity.org/employer/:path*',
        permanent: false,
      },
      {
        source: '/apprentice/:path*',
        has: [{ type: 'host', value: 'www.elevateforhumanity.org' }],
        destination: 'https://app.elevateforhumanity.org/apprentice/:path*',
        permanent: false,
      },
      {
        source: '/parent-portal/:path*',
        has: [{ type: 'host', value: 'www.elevateforhumanity.org' }],
        destination: 'https://app.elevateforhumanity.org/parent-portal/:path*',
        permanent: false,
      },
      {
        source: '/workforce/:path*',
        has: [{ type: 'host', value: 'www.elevateforhumanity.org' }],
        destination: 'https://app.elevateforhumanity.org/workforce/:path*',
        permanent: false,
      },
      {
        source: '/cosmetology-host-shop/:path*',
        has: [{ type: 'host', value: 'www.elevateforhumanity.org' }],
        destination: 'https://app.elevateforhumanity.org/cosmetology-host-shop/:path*',
        permanent: false,
      },
      {
        source: '/host-shop/dashboard',
        has: [{ type: 'host', value: 'www.elevateforhumanity.org' }],
        destination: 'https://app.elevateforhumanity.org/host-shop/dashboard',
        permanent: false,
      },

      // Admin app routes → admin.elevateforhumanity.org
      {
        source: '/admin/:path*',
        has: [{ type: 'host', value: 'www.elevateforhumanity.org' }],
        destination: 'https://admin.elevateforhumanity.org/admin/:path*',
        permanent: false,
      },
    ];
  },

  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    const isPreview =
      process.env.CONTEXT === 'deploy-preview' || process.env.CONTEXT === 'branch-deploy';

    const robotsHeaders = [];

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
      ...(isProduction
        ? [{ key: 'X-Frame-Options', value: 'DENY' }]
        : []),
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
            ? "script-src 'self' 'unsafe-inline' https://connect.facebook.net https://js.stripe.com https://www.googletagmanager.com https://widget.sezzle.com https://challenges.cloudflare.com"
            : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://connect.facebook.net https://js.stripe.com https://www.googletagmanager.com https://widget.sezzle.com https://challenges.cloudflare.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://images.pexels.com https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev https://cms-artifacts.artlist.io https://*.r2.dev https://cdn.elevatelms.com https://*.githubusercontent.com https://cdn1.affirm.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co https://us06web.zoom.us https://*.sentry.io https://www.google-analytics.com https://region1.google-analytics.com",
          "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://js.stripe.com https://us06web.zoom.us https://challenges.cloudflare.com https://*.cloudflarestream.com https://calendly.com",
          "media-src 'self' data: blob: https://*.supabase.co https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev https://cms-artifacts.artlist.io https://*.r2.dev https://cdn.elevatelms.com https://*.cloudflarestream.com",
          "worker-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self' https://js.stripe.com",
          "frame-ancestors 'self' https://www.elevateforhumanity.org https://elevateforhumanity.org https://admin.elevateforhumanity.org https://app.elevateforhumanity.org",
          'upgrade-insecure-requests',
          'report-uri /api/csp-report',
          'report-to csp-endpoint',
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
      {
        source: '/studio/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Build-ID', value: process.env.BUILD_ID?.slice(0, 7) || process.env.GITHUB_SHA?.slice(0, 7) || process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
        ],
      },
      {
        source: '/studio',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Build-ID', value: process.env.BUILD_ID?.slice(0, 7) || process.env.GITHUB_SHA?.slice(0, 7) || process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
        ],
      },
      {
        source: '/(|about|about/mission|about/team|about/partners|blog|careers|contact|credentials|dmca|donate|eligibility|faq|for-employers|for-students|how-it-works|jri|news|partners|press|resources|scholarships|services|site-map|training|transparency|tuition|verify|workkeys|mobile-app|install-app|career-training-indiana|certification-testing|check-eligibility|call-now|career-assessment|career-counseling|workforce-training-indianapolis|healthcare-training-indianapolis|skilled-trades-training-indiana|it-certification-training-indianapolis|employer-workforce-partnerships-indiana|agency-referral-workforce-training-indiana|wioa-eligibility)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
          { key: 'X-Build-ID', value: process.env.BUILD_ID?.slice(0, 7) || process.env.GITHUB_SHA?.slice(0, 7) || process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
          { key: 'X-Deployment-ID', value: process.env.BUILD_ID || process.env.DEPLOY_ID || 'local' },
          ...securityHeaders,
        ],
      },
      {
        source: '/programs/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
          { key: 'X-Build-ID', value: process.env.BUILD_ID?.slice(0, 7) || process.env.GITHUB_SHA?.slice(0, 7) || process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
          { key: 'X-Deployment-ID', value: process.env.BUILD_ID || process.env.DEPLOY_ID || 'local' },
          ...securityHeaders,
        ],
      },
      {
        source: '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|studio|programs).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'Surrogate-Control', value: 'no-store' },
          { key: 'X-Build-ID', value: process.env.BUILD_ID?.slice(0, 7) || process.env.GITHUB_SHA?.slice(0, 7) || process.env.COMMIT_REF?.slice(0, 7) || 'dev' },
          { key: 'X-Deployment-ID', value: process.env.BUILD_ID || process.env.DEPLOY_ID || 'local' },
          ...securityHeaders,
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Server action chunks - prevent caching to fix "Failed to find Server Action" errors
      {
        source: '/_next/server/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:path*.css',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
      {
        source: '/:path*.js',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
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

const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  autoInstrumentMiddleware: false,
  webpack: {
    autoInstrumentMiddleware: false,
  },
  disableLogger: true,
  widenClientFileUpload: false,
};

const skipSentry = process.env.BUILD_SCOPE === '1';

export default skipSentry
  ? nextConfig
  : withSentryConfig(nextConfig, sentryWebpackPluginOptions);
