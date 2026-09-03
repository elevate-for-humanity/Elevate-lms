#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const contractMap = JSON.parse(readFileSync('reports/data-contract-map.json', 'utf-8'));

const findings = [];

// Define expected table access patterns by category
const expectedAccess = {
  student: {
    allowed: [
      'profiles',
      'enrollments',
      'student_progress',
      'courses',
      'lessons',
      'quizzes',
      'quiz_attempts',
      'assignments',
      'submissions',
      'badges',
      'certificates',
      'student_documents',
      'student_notes',
      'attendance',
      'payments',
      'financial_aid',
    ],
    requiresUserScope: true,
    requiresOrgScope: false,
  },
  programHolder: {
    allowed: [
      'profiles',
      'program_holders',
      'program_holder_students',
      'program_holder_documents',
      'shops',
      'shop_staff',
      'apprentice_placements',
      'apprentice_weekly_reports',
      'shop_onboarding',
      'program_holder_acknowledgements',
    ],
    requiresUserScope: false,
    requiresOrgScope: true,
  },
  admin: {
    allowed: '*', // Admin can access all tables
    requiresUserScope: false,
    requiresOrgScope: false, // Admin sees across orgs
  },
  lms: {
    allowed: [
      'profiles',
      'courses',
      'lessons',
      'quizzes',
      'quiz_attempts',
      'enrollments',
      'student_progress',
      'assignments',
      'submissions',
      'course_modules',
    ],
    requiresUserScope: true,
    requiresOrgScope: false,
  },
  instructor: {
    allowed: [
      'profiles',
      'courses',
      'lessons',
      'enrollments',
      'student_progress',
      'assignments',
      'submissions',
      'quizzes',
      'quiz_attempts',
      'grades',
      'attendance',
    ],
    requiresUserScope: false,
    requiresOrgScope: true,
  },
  employer: {
    allowed: [
      'profiles',
      'employer_profiles',
      'job_postings',
      'applications',
      'placements',
      'employer_students',
    ],
    requiresUserScope: false,
    requiresOrgScope: true,
  },
};

// Check each route
Object.entries(contractMap.routes).forEach(([route, data]) => {
  const { category, tables, hasOrgFilter, hasUserFilter, hasProfileFilter, file } = data;

  if (category === 'public' || category === 'auth' || category === 'other') {
    return; // Skip public/auth routes
  }

  const expected = expectedAccess[category];
  if (!expected) return;

  // Check table access violations
  if (expected.allowed !== '*') {
    tables.forEach((table) => {
      if (!expected.allowed.includes(table)) {
        findings.push({
          severity: 'HIGH',
          type: 'unauthorized_table_access',
          route,
          category,
          table,
          file,
          message: `${category} route accessing table '${table}' which is not in allowed list`,
        });
      }
    });
  }

  // Check missing scope filters
  if (expected.requiresOrgScope && !hasOrgFilter && tables.length > 0) {
    // Exception: profiles table might use user_id instead
    const nonProfileTables = tables.filter((t) => t !== 'profiles');
    if (nonProfileTables.length > 0) {
      findings.push({
        severity: 'CRITICAL',
        type: 'missing_org_scope',
        route,
        category,
        tables: nonProfileTables,
        file,
        message: `${category} route missing organization_id filter on tables: ${nonProfileTables.join(', ')}`,
      });
    }
  }

  if (expected.requiresUserScope && !hasUserFilter && !hasProfileFilter && tables.length > 0) {
    findings.push({
      severity: 'CRITICAL',
      type: 'missing_user_scope',
      route,
      category,
      tables,
      file,
      message: `${category} route missing user_id/profile_id filter on tables: ${tables.join(', ')}`,
    });
  }

  // Detect potential cross-wiring patterns
  if (tables.includes('program_holders') && tables.includes('enrollments')) {
    findings.push({
      severity: 'MEDIUM',
      type: 'mixed_entity_access',
      route,
      category,
      file,
      message:
        'Route accesses both program_holders and enrollments - verify correct entity separation',
    });
  }

  if (tables.includes('shops') && !hasOrgFilter && category === 'programHolder') {
    findings.push({
      severity: 'HIGH',
      type: 'shop_without_scope',
      route,
      category,
      file,
      message: 'Shop access without organization_id filter - potential data leakage',
    });
  }
});

// Group findings by severity
const grouped = {
  CRITICAL: findings.filter((f) => f.severity === 'CRITICAL'),
  HIGH: findings.filter((f) => f.severity === 'HIGH'),
  MEDIUM: findings.filter((f) => f.severity === 'MEDIUM'),
};

const report = {
  generated: new Date().toISOString(),
  totalFindings: findings.length,
  bySeverity: {
    CRITICAL: grouped.CRITICAL.length,
    HIGH: grouped.HIGH.length,
    MEDIUM: grouped.MEDIUM.length,
  },
  findings: grouped,
};

writeFileSync('reports/cross-wiring-findings.json', JSON.stringify(report, null, 2));

// Generate markdown report
let md = `# Cross-Wiring Findings\n\n`;
md += `Generated: ${report.generated}\n\n`;
md += `## Summary\n\n`;
md += `- **Total Findings:** ${report.totalFindings}\n`;
md += `- **CRITICAL:** ${report.bySeverity.CRITICAL}\n`;
md += `- **HIGH:** ${report.bySeverity.HIGH}\n`;
md += `- **MEDIUM:** ${report.bySeverity.MEDIUM}\n\n`;

['CRITICAL', 'HIGH', 'MEDIUM'].forEach((severity) => {
  if (grouped[severity].length > 0) {
    md += `## ${severity} Issues (${grouped[severity].length})\n\n`;
    grouped[severity].slice(0, 20).forEach((finding, i) => {
      md += `### ${i + 1}. ${finding.type}\n\n`;
      md += `- **Route:** \`${finding.route}\`\n`;
      md += `- **Category:** ${finding.category}\n`;
      md += `- **File:** \`${finding.file}\`\n`;
      md += `- **Message:** ${finding.message}\n\n`;
    });
    if (grouped[severity].length > 20) {
      md += `\n_... and ${grouped[severity].length - 20} more ${severity} issues_\n\n`;
    }
  }
});

writeFileSync('reports/cross-wiring-findings.md', md);

process.exit(report.bySeverity.CRITICAL > 0 ? 1 : 0);
