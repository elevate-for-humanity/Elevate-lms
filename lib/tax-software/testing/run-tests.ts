import { logger } from '@/lib/logger';
/**
 * Run IRS Certification Tests
 * Execute with: npx tsx lib/tax-software/testing/run-tests.ts
 */

import { runCertificationTests, formatCertificationReport } from './irs-certification';

const report = runCertificationTests();
logger.info(formatCertificationReport(report));

// Exit with error code if tests failed
process.exit(report.readyForSubmission ? 0 : 1);
