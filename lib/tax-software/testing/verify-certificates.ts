import { logger } from '@/lib/logger';
/**
 * Certificate Verification Script
 * Verifies IRS MeF certificate setup for TEST and PRODUCTION environments
 * 
 * Usage: npx tsx lib/tax-software/testing/verify-certificates.ts
 */

import { CertificateHandler, verifyCertificateSetup, CERT_ENV_VARS } from '../mef/certificate-handler';

async function main() {
  logger.info('='.repeat(60));
  logger.info('IRS MeF Certificate Verification');
  logger.info('='.repeat(60));
  logger.info();

  // Check environment variables
  logger.info('Environment Variables:');
  logger.info('-'.repeat(40));
  
  for (const [env, vars] of Object.entries(CERT_ENV_VARS)) {
    logger.info(`\n${env.toUpperCase()}:`);
    for (const [key, varName] of Object.entries(vars)) {
      const value = process.env[varName];
      const status = value ? '✓ Set' : '✗ Not set';
      logger.info(`  ${varName}: ${status}`);
    }
  }

  logger.info();
  logger.info('Certificate Status:');
  logger.info('-'.repeat(40));

  const status = await verifyCertificateSetup();

  // Test environment
  logger.info('\nTEST Environment:');
  if (status.test.loaded) {
    logger.info('  ✓ Certificates loaded successfully');
    if (status.test.info) {
      logger.info(`  Fingerprint: ${status.test.info.fingerprint}`);
    }
  } else {
    logger.info('  ✗ Certificates not loaded');
    logger.info(`  Error: ${status.test.error}`);
  }

  // Production environment
  logger.info('\nPRODUCTION Environment:');
  if (status.production.loaded) {
    logger.info('  ✓ Certificates loaded successfully');
    if (status.production.info) {
      logger.info(`  Fingerprint: ${status.production.info.fingerprint}`);
    }
  } else {
    logger.info('  ✗ Certificates not loaded');
    logger.info(`  Error: ${status.production.error}`);
  }

  logger.info();
  logger.info('='.repeat(60));

  // Print setup instructions if certificates are missing
  if (!status.test.loaded || !status.production.loaded) {
    logger.info('\nSetup Instructions:');
    logger.info(CertificateHandler.getSetupInstructions('test'));
  }

  // Exit with error if no certificates are loaded
  if (!status.test.loaded && !status.production.loaded) {
    process.exit(1);
  }
}

main().catch(console.error);
