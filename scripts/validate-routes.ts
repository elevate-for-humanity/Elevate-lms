#!/usr/bin/env tsx
/**
 * Route Validation
 * Checks that critical routes exist and are accessible
 */

import fs from 'fs';
import path from 'path';

const CRITICAL_ROUTES = [
  // Public marketing pages
  { path: 'app/page.tsx', route: '/', description: 'Homepage' },
  { path: 'app/programs/page.tsx', route: '/programs', description: 'Programs catalog' },
  { path: 'app/apply/page.tsx', route: '/apply', description: 'Application form' },
  { path: 'app/courses/page.tsx', route: '/courses', description: 'Courses catalog' },

  // Dynamic routes (check file existence)
  {
    path: 'app/programs/[slug]/page.tsx',
    route: '/programs/[slug]',
    description: 'Program details',
  },
  {
    path: 'app/apply/student/page.tsx',
    route: '/apply/student',
    description: 'Student application',
  },
  {
    path: 'app/courses/[courseId]/page.tsx',
    route: '/courses/[courseId]',
    description: 'Course details',
  },
  {
    path: 'app/courses/[courseId]/learn/page.tsx',
    route: '/courses/[courseId]/learn',
    description: 'Course player',
  },

  // Protected routes
  {
    path: 'app/(dashboard)/client-portal/page.tsx',
    route: '/client-portal',
    description: 'Student dashboard',
  },
  { path: 'app/admin/page.tsx', route: '/admin', description: 'Admin dashboard' },

  // API routes
  { path: 'app/api/health/route.ts', route: '/api/health', description: 'Health check API' },
  {
    path: 'app/api/enrollments/route.ts',
    route: '/api/enrollments',
    description: 'Enrollments API',
  },
  { path: 'app/api/courses/route.ts', route: '/api/courses', description: 'Courses API' },
];

console.log('🔍 Validating critical routes...\n');

let hasErrors = false;
const missing: string[] = [];
const present: string[] = [];

for (const route of CRITICAL_ROUTES) {
  const fullPath = path.join(process.cwd(), route.path);

  if (fs.existsSync(fullPath)) {
    present.push(`✅ ${route.route} - ${route.description}`);
  } else {
    missing.push(`❌ ${route.route} - ${route.description} (file: ${route.path})`);
    hasErrors = true;
  }
}

// Report results
console.log('Route validation results:\n');

if (present.length > 0) {
  console.log('Present routes:');
  present.forEach((msg) => console.log(`   ${msg}`));
  console.log();
}

if (missing.length > 0) {
  console.log('Missing routes:');
  missing.forEach((msg) => console.log(`   ${msg}`));
  console.log();
}

if (hasErrors) {
  console.log('❌ Route validation FAILED');
  console.log(`   ${missing.length} critical routes missing\n`);
  process.exit(1);
} else {
  console.log('✅ Route validation PASSED');
  console.log(`   All ${CRITICAL_ROUTES.length} critical routes present\n`);
  process.exit(0);
}
