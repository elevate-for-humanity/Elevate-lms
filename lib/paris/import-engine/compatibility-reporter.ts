/**
 * PARIS Import Engine - Compatibility Reporter
 * Generates detailed compatibility reports for imported codebases
 */

import type {
  RepositoryAnalysis,
  CompatibilityReport,
  ImportableFeature,
  ModifiedFeature,
  ConflictFeature,
  SecurityRisk,
  LicensingConcern,
  Framework,
} from './types';

/**
 * Framework compatibility scores
 */
const FRAMEWORK_COMPATIBILITY: Record<Framework, { score: number; effort: 'low' | 'medium' | 'high' | 'very_high'; notes: string[] }> = {
  nextjs: {
    score: 95,
    effort: 'low',
    notes: [
      'Same framework as Elevate platform',
      'Components can be imported directly',
      'API routes need conversion to Supabase Edge Functions',
    ],
  },
  react: {
    score: 85,
    effort: 'low',
    notes: [
      'React components compatible',
      'Will need Next.js wrapper',
      'Hooks can be used as-is',
    ],
  },
  vue: {
    score: 50,
    effort: 'high',
    notes: [
      'Different framework - requires rewrite',
      'Vue components need React conversion',
      'Vuex/Pinia state management needs replacement',
    ],
  },
  nuxt: {
    score: 45,
    effort: 'high',
    notes: [
      'Nuxt.js requires significant rework',
      'Server routes need Supabase Edge Functions',
      'Composition API can be partially reused',
    ],
  },
  svelte: {
    score: 40,
    effort: 'very_high',
    notes: [
      'Svelte requires complete rewrite',
      'Components cannot be directly imported',
      'Consider building equivalent in React',
    ],
  },
  gatsby: {
    score: 60,
    effort: 'medium',
    notes: [
      'Static site generator - different architecture',
      'Content can be migrated to CMS',
      'Build process differs significantly',
    ],
  },
  remix: {
    score: 75,
    effort: 'medium',
    notes: [
      'Similar concepts to Next.js',
      'Loaders/actions need refactoring',
      'Error boundaries compatible',
    ],
  },
  express: {
    score: 70,
    effort: 'medium',
    notes: [
      'Express routes can become Supabase Edge Functions',
      'Middleware needs replacement',
      'Authentication needs Supabase integration',
    ],
  },
  fastify: {
    score: 65,
    effort: 'medium',
    notes: [
      'Fastify routes can become Supabase Edge Functions',
      'Plugins need replacement',
      'Schema validation compatible',
    ],
  },
  nestjs: {
    score: 55,
    effort: 'high',
    notes: [
      'NestJS modules need decomposition',
      'Controllers become Edge Functions',
      'Providers/services need redesign',
    ],
  },
  django: {
    score: 40,
    effort: 'very_high',
    notes: [
      'Python backend - complete rewrite required',
      'ORM models need Supabase schema',
      'Views need React frontend',
    ],
  },
  flask: {
    score: 35,
    effort: 'very_high',
    notes: [
      'Python backend - complete rewrite required',
      'Routes become Supabase Edge Functions',
      'Jinja templates become React components',
    ],
  },
  rails: {
    score: 30,
    effort: 'very_high',
    notes: [
      'Ruby on Rails - complete rewrite required',
      'ActiveRecord needs Supabase',
      'ERB templates become React',
    ],
  },
  laravel: {
    score: 35,
    effort: 'very_high',
    notes: [
      'PHP framework - complete rewrite required',
      'Eloquent ORM needs Supabase',
      'Blade templates become React',
    ],
  },
  spring: {
    score: 30,
    effort: 'very_high',
    notes: [
      'Java Spring - complete rewrite required',
      'JPA entities need Supabase schema',
      'Thymeleaf becomes React',
    ],
  },
  dotnet: {
    score: 25,
    effort: 'very_high',
    notes: [
      '.NET backend - complete rewrite required',
      'EF Core needs Supabase',
      'Razor pages become React',
    ],
  },
  wordpress: {
    score: 20,
    effort: 'very_high',
    notes: [
      'WordPress requires migration strategy',
      'Consider WordPress REST API integration',
      'Custom PHP plugins need complete rewrite',
    ],
  },
  shopify: {
    score: 25,
    effort: 'very_high',
    notes: [
      'Shopify apps need different architecture',
      'Consider Shopify API integration',
      'Liquid themes cannot be directly imported',
    ],
  },
  unknown: {
    score: 0,
    effort: 'high',
    notes: [
      'Unable to determine framework',
      'Manual analysis required',
      'Cannot estimate compatibility',
    ],
  },
};

/**
 * Analyze importable features
 */
function analyzeImportableFeatures(
  analysis: RepositoryAnalysis
): ImportableFeature[] {
  const features: ImportableFeature[] = [];

  // TypeScript code is always ready
  if (analysis.codeQuality.typescript) {
    features.push({
      feature: 'TypeScript',
      category: 'Language',
      status: 'ready',
      notes: 'TypeScript code can be directly imported',
      confidence: 100,
    });
  }

  // Design system
  if (analysis.designSystem?.cssFramework === 'tailwind') {
    features.push({
      feature: 'Tailwind CSS',
      category: 'Styling',
      status: 'ready',
      notes: 'Same CSS framework as Elevate platform',
      confidence: 100,
    });
  }

  // Components
  const componentCount = analysis.components.length;
  if (componentCount > 0) {
    features.push({
      feature: `UI Components (${componentCount})`,
      category: 'Components',
      status: analysis.codeQuality.typescript ? 'ready' : 'requires_config',
      notes: analysis.codeQuality.typescript
        ? 'TypeScript components can be imported'
        : 'May need TypeScript conversion',
      confidence: analysis.codeQuality.typescript ? 90 : 60,
    });
  }

  // Supabase already integrated
  if (analysis.database === 'supabase' || analysis.auth === 'supabase') {
    features.push({
      feature: 'Supabase Integration',
      category: 'Backend',
      status: 'ready',
      notes: 'Same backend as Elevate platform - direct integration',
      confidence: 100,
    });
  }

  // Authentication patterns
  if (analysis.auth !== 'none' && analysis.auth !== 'unknown') {
    features.push({
      feature: `Auth: ${analysis.auth}`,
      category: 'Authentication',
      status: 'requires_config',
      notes: 'Authentication logic needs Supabase Auth integration',
      confidence: 70,
    });
  }

  // API endpoints
  const apiComponents = analysis.components.filter(c => c.type === 'api');
  if (apiComponents.length > 0) {
    features.push({
      feature: `API Endpoints (${apiComponents.length})`,
      category: 'Backend',
      status: 'requires_config',
      notes: 'API routes need conversion to Supabase Edge Functions',
      confidence: 75,
    });
  }

  // Routes
  const routeCount = analysis.routes.length;
  if (routeCount > 0) {
    features.push({
      feature: `Routes (${routeCount})`,
      category: 'Navigation',
      status: 'requires_config',
      notes: 'Routes need mapping to Elevate page structure',
      confidence: 65,
    });
  }

  // Database schema (if Prisma)
  if (analysis.database === 'postgresql' || analysis.database === 'prisma') {
    features.push({
      feature: 'Database Schema',
      category: 'Backend',
      status: 'requires_config',
      notes: 'Schema can be adapted for Supabase PostgreSQL',
      confidence: 80,
    });
  }

  // Testing
  if (analysis.codeQuality.testing) {
    features.push({
      feature: 'Test Suite',
      category: 'Quality',
      status: 'ready',
      notes: 'Tests can be adapted for Elevate testing setup',
      confidence: 85,
    });
  }

  // Integrations
  for (const integration of analysis.integrations) {
    features.push({
      feature: integration.name,
      category: integration.category,
      status: 'requires_config',
      notes: `Integration needs Elevate platform configuration`,
      confidence: 60,
    });
  }

  return features;
}

/**
 * Analyze features needing modification
 */
function analyzeModifiedFeatures(
  analysis: RepositoryAnalysis
): ModifiedFeature[] {
  const features: ModifiedFeature[] = [];

  // Non-TypeScript code
  if (!analysis.codeQuality.typescript) {
    features.push({
      feature: 'JavaScript to TypeScript',
      category: 'Conversion',
      requiredChanges: [
        'Add type annotations',
        'Create type definitions',
        'Update imports/exports',
      ],
      effort: analysis.dependencies.total > 50 ? 'significant' : 'moderate',
      risk: 'low',
      notes: 'Code needs TypeScript conversion',
    });
  }

  // Next.js specific imports
  if (analysis.framework === 'nextjs') {
    features.push({
      feature: 'Next.js to App Router',
      category: 'Framework',
      requiredChanges: [
        'Update page structure to app directory',
        'Convert getStaticProps to async components',
        'Update API routes to route handlers',
      ],
      effort: 'moderate',
      risk: 'medium',
      notes: 'Pages router code needs App router adaptation',
    });
  }

  // Environment variables
  if (analysis.environmentVariables.length > 0) {
    features.push({
      feature: 'Environment Configuration',
      category: 'Configuration',
      requiredChanges: analysis.environmentVariables.map(v => 
        `Map ${v.name} to Elevate config`
      ),
      effort: 'minimal',
      risk: 'low',
      notes: 'Environment variables need Elevate platform mapping',
    });
  }

  // ESLint/Prettier config
  if (analysis.codeQuality.eslint || analysis.codeQuality.prettier) {
    features.push({
      feature: 'Code Quality Tools',
      category: 'Quality',
      requiredChanges: [
        'Merge ESLint configurations',
        'Align Prettier settings',
      ],
      effort: 'minimal',
      risk: 'low',
      notes: 'Can merge with Elevate linting setup',
    });
  }

  // Build process
  if (analysis.build.command !== 'unknown') {
    features.push({
      feature: 'Build Configuration',
      category: 'Deployment',
      requiredChanges: [
        'Update build command for Vercel/Northflank',
        'Configure environment variables',
        'Set up deployment pipeline',
      ],
      effort: 'small',
      risk: 'medium',
      notes: 'Build needs Northflank/Vercel adaptation',
    });
  }

  return features;
}

/**
 * Analyze conflicts
 */
function analyzeConflicts(
  analysis: RepositoryAnalysis
): ConflictFeature[] {
  const conflicts: ConflictFeature[] = [];

  // Framework conflicts
  if (analysis.framework === 'wordpress' || analysis.framework === 'shopify') {
    conflicts.push({
      feature: 'CMS Platform',
      conflict: `${analysis.framework} uses different architecture than Next.js`,
      resolution: 'Migrate content to Elevate CMS or use headless CMS approach',
      requiresManualIntervention: true,
    });
  }

  // Database conflicts
  if (analysis.database === 'mongodb') {
    conflicts.push({
      feature: 'MongoDB Database',
      conflict: 'Elevate uses PostgreSQL (Supabase)',
      resolution: 'Migrate data to PostgreSQL schema',
      requiresManualIntervention: true,
    });
  }

  // Authentication conflicts
  if (analysis.auth === 'auth0' || analysis.auth === 'clerk') {
    conflicts.push({
      feature: `${analysis.auth} Authentication`,
      conflict: 'Elevate uses Supabase Auth',
      resolution: 'Replace with Supabase Auth implementation',
      requiresManualIntervention: false,
    });
  }

  // Component naming conflicts
  const componentNames = analysis.components.map(c => c.name);
  const duplicateNames = componentNames.filter((name, i) => componentNames.indexOf(name) !== i);
  if (duplicateNames.length > 0) {
    conflicts.push({
      feature: 'Duplicate Component Names',
      conflict: `Found ${duplicateNames.length} components with duplicate names`,
      resolution: 'Rename components to avoid conflicts with Elevate codebase',
      requiresManualIntervention: true,
    });
  }

  return conflicts;
}

/**
 * Analyze security risks
 */
function analyzeSecurityRisks(
  analysis: RepositoryAnalysis
): SecurityRisk[] {
  const risks: SecurityRisk[] = [];

  // From analysis
  for (const flag of analysis.securityFlags) {
    risks.push({
      severity: flag.severity,
      location: flag.location,
      description: flag.description,
      recommendation: getSecurityRecommendation(flag),
    });
  }

  // Missing security headers
  if (!analysis.codeQuality.eslint) {
    risks.push({
      severity: 'medium',
      location: 'Project-wide',
      description: 'No ESLint configuration found',
      recommendation: 'Add ESLint with security plugins for code quality',
    });
  }

  // Missing HTTPS enforcement
  if (!analysis.routes.some(r => r.path.includes('https') || r.file.includes('ssl'))) {
    risks.push({
      severity: 'low',
      location: 'Configuration',
      description: 'No explicit HTTPS enforcement detected',
      recommendation: 'Ensure all production routes use HTTPS',
    });
  }

  // API key exposure risk
  if (analysis.environmentVariables.some(v => v.isSecret && v.name.includes('KEY'))) {
    risks.push({
      severity: 'high',
      location: 'Environment Variables',
      description: 'API keys defined in configuration',
      recommendation: 'Move to secure environment variable storage',
    });
  }

  return risks;
}

/**
 * Get security recommendation based on flag
 */
function getSecurityRecommendation(flag: RepositoryAnalysis['securityFlags'][0]): string {
  switch (flag.severity) {
    case 'critical':
      return 'Remove or secure this file immediately before importing';
    case 'high':
      return 'Review and sanitize before importing to production';
    case 'medium':
      return 'Add to .gitignore if not already there';
    case 'low':
      return 'Consider removing for cleaner codebase';
    default:
      return 'Review and address as needed';
  }
}

/**
 * Analyze licensing concerns
 */
function analyzeLicensing(
  analysis: RepositoryAnalysis
): LicensingConcern[] {
  const concerns: LicensingConcern[] = [];

  const { licensing } = analysis;

  if (licensing.name === 'GPL' || licensing.name === 'AGPL') {
    concerns.push({
      license: licensing.name,
      implications: 'GPL requires derivative works to be open source under same license',
      action: 'review_required',
    });
  }

  if (licensing.name === 'LGPL') {
    concerns.push({
      license: 'LGPL',
      implications: 'May require dynamic linking for proprietary use',
      action: 'review_required',
    });
  }

  if (licensing.name === 'Unknown' || licensing.name === 'All Rights Reserved') {
    concerns.push({
      license: 'Unknown/Proprietary',
      implications: 'Cannot determine rights for reuse or modification',
      action: 'incompatible',
    });
  }

  // Commercial licenses
  if (licensing.name.includes('Commercial') || licensing.name.includes('Proprietary')) {
    concerns.push({
      license: licensing.name,
      implications: 'May have restrictions on use or modification',
      action: 'review_required',
    });
  }

  return concerns;
}

/**
 * Calculate estimated effort
 */
function calculateEffort(analysis: RepositoryAnalysis): CompatibilityReport['estimatedEffort'] {
  const framework = FRAMEWORK_COMPATIBILITY[analysis.framework];
  const blockers: string[] = [];

  // Base hours from framework
  let hours = {
    low: 4,
    medium: 16,
    high: 40,
    very_high: 80,
  }[framework.effort];

  // Add complexity factors
  if (analysis.dependencies.total > 100) hours += 8;
  if (analysis.components.length > 50) hours += 8;
  if (analysis.routes.length > 20) hours += 4;
  if (!analysis.codeQuality.typescript) hours += 16;
  if (!analysis.codeQuality.testing) hours += 8;
  if (analysis.securityFlags.some(f => f.severity === 'critical')) hours += 8;

  // Check for blockers
  if (analysis.framework === 'wordpress' || analysis.framework === 'shopify') {
    blockers.push('CMS platform requires complete rewrite');
  }
  if (analysis.database === 'mongodb') {
    blockers.push('Database migration required');
  }
  if (analysis.licensing.notes?.includes('incompatible')) {
    blockers.push('Licensing incompatibility');
  }

  const effortLevel = hours < 8 ? 'low' : hours < 24 ? 'medium' : hours < 48 ? 'high' : 'very_high';

  return {
    hours,
    complexity: effortLevel,
    blockers,
  };
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  analysis: RepositoryAnalysis,
  importable: ImportableFeature[],
  modified: ModifiedFeature[],
  conflicts: ConflictFeature[]
): string[] {
  const recommendations: string[] = [];

  // Framework-specific
  if (analysis.framework === 'nextjs') {
    recommendations.push('Framework matches Elevate - prioritize component imports');
  } else if (analysis.framework === 'react') {
    recommendations.push('Wrap React components in Next.js App Router format');
  } else {
    recommendations.push(`Consider rebuilding ${analysis.framework} features using Elevate stack`);
  }

  // TypeScript
  if (!analysis.codeQuality.typescript) {
    recommendations.push('Add TypeScript gradually starting with type definitions');
  }

  // Testing
  if (!analysis.codeQuality.testing) {
    recommendations.push('Add test coverage for imported features');
  }

  // Database
  if (analysis.database === 'postgresql' || analysis.database === 'prisma') {
    recommendations.push('Prisma schema can be converted to Supabase migrations');
  }

  // Components
  if (analysis.components.length > 0) {
    recommendations.push(`Start with UI components - ${analysis.components.filter(c => c.type === 'component').length} available`);
  }

  // Authentication
  if (analysis.auth !== 'none' && analysis.auth !== 'unknown') {
    recommendations.push('Migrate authentication to Supabase Auth with existing user mapping');
  }

  // Security
  if (analysis.securityFlags.length > 0) {
    recommendations.push('Address security flags before production deployment');
  }

  return recommendations;
}

/**
 * Generate full compatibility report
 */
export function generateCompatibilityReport(
  analysis: RepositoryAnalysis
): CompatibilityReport {
  const importable = analyzeImportableFeatures(analysis);
  const modified = analyzeModifiedFeatures(analysis);
  const conflicts = analyzeConflicts(analysis);
  const securityRisks = analyzeSecurityRisks(analysis);
  const licensing = analyzeLicensing(analysis);
  const effort = calculateEffort(analysis);
  const recommendations = generateRecommendations(analysis, importable, modified, conflicts);

  return {
    importable,
    needsModification: modified,
    conflicts,
    securityRisks,
    licensingConcerns: licensing,
    estimatedEffort: effort,
    recommendations,
  };
}

/**
 * Format report as markdown
 */
export function formatReportMarkdown(
  analysis: RepositoryAnalysis,
  report: CompatibilityReport
): string {
  const lines: string[] = [];

  lines.push(`# Import Compatibility Report`);
  lines.push('');
  lines.push(`## Repository: ${analysis.info.full_name}`);
  lines.push(`**Framework:** ${analysis.framework}`);
  lines.push(`**Database:** ${analysis.database}`);
  lines.push(`**Authentication:** ${analysis.auth}`);
  lines.push(`**Dependencies:** ${analysis.dependencies.total} (${analysis.dependencies.production.length} prod)`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Ready to Import | ${report.importable.length} |`);
  lines.push(`| Needs Modification | ${report.needsModification.length} |`);
  lines.push(`| Conflicts | ${report.conflicts.length} |`);
  lines.push(`| Estimated Effort | ${report.estimatedEffort.hours} hours (${report.estimatedEffort.complexity}) |`);
  lines.push('');

  // Importable features
  if (report.importable.length > 0) {
    lines.push('## Ready to Import');
    lines.push('');
    for (const f of report.importable) {
      lines.push(`- **${f.feature}** (${f.category}): ${f.notes || 'Direct import'}`);
    }
    lines.push('');
  }

  // Needs modification
  if (report.needsModification.length > 0) {
    lines.push('## Needs Modification');
    lines.push('');
    for (const f of report.needsModification) {
      lines.push(`### ${f.feature}`);
      lines.push(`- Effort: ${f.effort}`);
      lines.push(`- Risk: ${f.risk}`);
      lines.push(`- Changes: ${f.requiredChanges.join(', ')}`);
      lines.push('');
    }
  }

  // Conflicts
  if (report.conflicts.length > 0) {
    lines.push('## Conflicts');
    lines.push('');
    for (const c of report.conflicts) {
      lines.push(`### ${c.feature}`);
      lines.push(`- Conflict: ${c.conflict}`);
      lines.push(`- Resolution: ${c.resolution}`);
      lines.push('');
    }
  }

  // Security
  if (report.securityRisks.length > 0) {
    lines.push('## Security Risks');
    lines.push('');
    for (const r of report.securityRisks) {
      lines.push(`- **[${r.severity.toUpperCase()}]** ${r.location}: ${r.description}`);
      lines.push(`  - Recommendation: ${r.recommendation}`);
    }
    lines.push('');
  }

  // Recommendations
  lines.push('## Recommendations');
  lines.push('');
  for (const r of report.recommendations) {
    lines.push(`1. ${r}`);
  }
  lines.push('');

  return lines.join('\n');
}
