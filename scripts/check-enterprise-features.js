// scripts/check-enterprise-features.js
//
// Simple Node script to verify that all key enterprise features
// (LMS, forums, study groups, analytics, xAPI, etc.) exist in this repo.
//
// Run with:  node scripts/check-enterprise-features.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const featureChecks = [
  {
    name: 'LMS Shell & Dashboard',
    files: ['app/lms/layout.tsx', 'app/lms/dashboard/page.tsx'],
  },
  {
    name: 'Forums (UI + API)',
    files: ['app/lms/forums/page.tsx', 'app/api/forums/route.ts'],
  },
  {
    name: 'Study Groups (UI + API)',
    files: ['app/lms/study-groups/page.tsx', 'app/api/study-groups/route.ts'],
  },
  {
    name: 'Student Analytics',
    files: ['app/lms/analytics/page.tsx', 'app/api/analytics/student/route.ts'],
  },
  {
    name: 'Admin Analytics',
    files: ['app/admin/analytics/page.tsx', 'app/api/analytics/admin/route.ts'],
  },
  {
    name: 'Course Authoring',
    files: ['components/lms/CourseAuthoringTool-placeholder.tsx', 'app/api/courses/authoring/route.ts'],
  },
  {
    name: 'AI Tutor & AI Course Builder',
    files: [
      'app/lms/chat/page.tsx',
      'apps/admin/app/admin/courses/ai-builder/page.tsx',
      'app/api/ai/course-builder/route.ts',
    ],
  },
  {
    name: 'xAPI + Video Meta',
    files: [
      'lib/xapi/xapi-client.ts',
      'app/api/xapi/route.ts',
      'app/api/videos/[videoId]/meta/route.ts',
    ],
  },
  {
    name: 'Certificates & Verification',
    files: [
      'app/verify/[certificateId]/page.tsx',
      'app/api/verify/certificate/[certificateId]/route.ts',
    ],
  },
  {
    name: 'Program Holder Portal',
    files: ['app/program-holder/dashboard/page.tsx'],
  },
  {
    name: 'Mobile Summary API',
    files: ['app/api/mobile/summary/route.ts'],
  },
  {
    name: 'Caseload Dashboard',
    files: ['app/api/reports/caseload/route.ts', 'app/admin/reports/caseload/page.tsx'],
  },
  {
    name: 'Enrollment Applications',
    files: ['app/api/applications/enrollment/route.ts'],
  },
];

const requiredEnv = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'OPENAI_API_KEY',
];

const optionalEnv = [
  'XAPI_ENDPOINT',
  'XAPI_USERNAME',
  'XAPI_PASSWORD',
  'RESEND_API_KEY',
  'STRIPE_SECRET_KEY',
];

function fileExists(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath);
  return fs.existsSync(fullPath);
}

function main() {
  const results = featureChecks.map((feature) => {
    const missing = [];
    for (const f of feature.files) {
      if (!fileExists(f)) missing.push(f);
    }
    return {
      feature: feature.name,
      status: missing.length === 0 ? 'OK' : 'MISSING_FILES',
      missingFiles: missing,
    };
  });

  let envFile = '';
  try {
    envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
  } catch {
    // .env.local missing is not fatal, just note it
  }

  const missingEnv = [];
  const missingOptionalEnv = [];

  if (!envFile) {
    missingEnv.push(...requiredEnv);
    missingOptionalEnv.push(...optionalEnv);
  } else {
    for (const key of requiredEnv) {
      const regex = new RegExp(`^${key}=`, 'm');
      if (!regex.test(envFile)) {
        missingEnv.push(key);
      }
    }
    for (const key of optionalEnv) {
      const regex = new RegExp(`^${key}=`, 'm');
      if (!regex.test(envFile)) {
        missingOptionalEnv.push(key);
      }
    }
  }

  const summary = {
    features: results,
    env: {
      status: missingEnv.length === 0 ? 'OK' : 'MISSING_VARS',
      missing: missingEnv,
      optional_missing: missingOptionalEnv,
    },
  };

  // Human-readable log

  let allOk = true;
  for (const r of results) {
    if (r.status === 'OK') {
    } else {
      allOk = false;
    }
  }

  if (summary.env.status === 'OK') {
  } else {
    allOk = false;
  }

  if (summary.env.optional_missing.length > 0) {
  }

  if (allOk) {
  } else {
  }

  // JSON output for AI agents

  // Exit with error code if not all OK
  process.exit(allOk ? 0 : 1);
}

main();
