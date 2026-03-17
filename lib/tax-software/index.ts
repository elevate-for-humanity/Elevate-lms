/**
 * Supersonic Fast Cash E-File System
 * IRS MeF integration for Form 1040 (individual returns)
 * EFIN: set via IRS_EFIN env var
 * Software ID: set via IRS_SOFTWARE_ID env var (assigned after ATS certification)
 */

// Core types
export * from './types';

// Tax calculations
export * from './forms/form-1040';

// Validation
export * from './validation/irs-rules';
export * from './schemas/schema-validator';

// MeF transmission
export * from './mef/xml-generator';
export * from './mef/transmission';
export * from './mef/acknowledgment';
export * from './mef/soap-client';
export * from './mef/certificate-handler';

// Testing
export * from './testing/irs-certification';
export * from './testing/ats-runner';
