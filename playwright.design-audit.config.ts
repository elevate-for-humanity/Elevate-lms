import { defineConfig } from '@playwright/test';
import base from './playwright.design-repair.config';

const evidenceDirectory = process.env.DESIGN_AUDIT_EVIDENCE_DIR || 'artifacts/design-repair/original-public';

export default defineConfig({
  ...base,
  testMatch: 'design-audit-public-pages.spec.ts',
  timeout: 120000,
  projects: base.projects?.filter(project => ['320px', '1440px'].includes(project.name ?? '')),
  outputDir: `${evidenceDirectory}/renders`,
  reporter: [['list'], ['json', { outputFile: `${evidenceDirectory}/results.json` }]],
});
