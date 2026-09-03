#!/usr/bin/env node

/**
 * License System Validation Script
 * Validates the integrity of the Elevate Platform license system
 *
 * Copyright (c) 2024 Elevate for Humanity
 * Licensed Use Only - Unauthorized use prohibited
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class LicenseSystemValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validationResults = {};
  }

  async validateSystem() {

    // Core validations
    await this.validateLicenseFiles();
    await this.validateWatermarks();
    await this.validateSecurityMeasures();
    await this.validateDatabaseSchema();
    await this.validateAPIEndpoints();

    // Generate report
    this.generateReport();

    // Exit with appropriate code
    process.exit(this.errors.length > 0 ? 1 : 0);
  }

  async validateLicenseFiles() {

    const requiredFiles = [
      'middleware/license.js',
      'src/license/license-protection.js',
      'api/license-server.js',
      'config/license.env',
      'legal/LICENSE_EULA.txt',
      'legal/DMCA_Takedown_Template.txt',
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        this.errors.push(`Missing required file: ${file}`);
      } else {
      }
    }

    this.validationResults.licenseFiles = this.errors.length === 0;
  }

  async validateWatermarks() {

    const sourceFiles = this.getSourceFiles();
    let watermarkCount = 0;

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');

      if (
        content.includes('Elevate for Humanity') ||
        content.includes('Licensed Use Only') ||
        content.includes('Copyright (c) 2024')
      ) {
        watermarkCount++;
      }
    }

    if (watermarkCount < sourceFiles.length * 0.8) {
      this.warnings.push(
        `Only ${watermarkCount}/${sourceFiles.length} files contain watermarks`
      );
    } else {
        `  ✅ ${watermarkCount}/${sourceFiles.length} files watermarked`
      );
    }

    this.validationResults.watermarks = watermarkCount > 0;
  }

  async validateSecurityMeasures() {

    // Check for environment variables
    const envFile = 'config/license.env';
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');

      const requiredEnvVars = [
        'LICENSE_SECRET_KEY',
        'ADMIN_API_KEY',
        'LICENSE_SERVER_URL',
      ];

      for (const envVar of requiredEnvVars) {
        if (!envContent.includes(envVar)) {
          this.errors.push(`Missing environment variable: ${envVar}`);
        } else {
        }
      }
    }

    this.validationResults.security = this.errors.length === 0;
  }

  async validateDatabaseSchema() {

    const schemaFile = 'supabase/schema.sql';
    if (fs.existsSync(schemaFile)) {
      const schema = fs.readFileSync(schemaFile, 'utf8');

      const requiredTables = [
        'licenses',
        'license_usage',
        'license_violations',
        'profiles',
        'courses',
      ];

      for (const table of requiredTables) {
        if (schema.includes(`CREATE TABLE public.${table}`)) {
        } else {
          this.errors.push(`Missing database table: ${table}`);
        }
      }
    } else {
      this.errors.push('Missing database schema file');
    }

    this.validationResults.database = this.errors.length === 0;
  }

  async validateAPIEndpoints() {

    const apiFile = 'api/license-server.js';
    if (fs.existsSync(apiFile)) {
      const apiContent = fs.readFileSync(apiFile, 'utf8');

      const requiredEndpoints = [
        '/api/license-check',
        '/api/usage-ping',
        '/api/violation-alert',
        '/api/admin/licenses',
      ];

      for (const endpoint of requiredEndpoints) {
        if (apiContent.includes(endpoint)) {
        } else {
          this.warnings.push(`Missing API endpoint: ${endpoint}`);
        }
      }
    }

    this.validationResults.apiEndpoints = true;
  }

  getSourceFiles() {
    const files = [];
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.html'];

    function scanDirectory(dir) {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (
          stat.isDirectory() &&
          !item.startsWith('.') &&
          item !== 'node_modules'
        ) {
          scanDirectory(fullPath);
        } else if (
          stat.isFile() &&
          extensions.some((ext) => item.endsWith(ext))
        ) {
          files.push(fullPath);
        }
      }
    }

    scanDirectory('src');
    scanDirectory('api');
    scanDirectory('middleware');

    return files;
  }

  generateReport() {

      `\n✅ Passed: ${Object.values(this.validationResults).filter(Boolean).length}`
    );

    if (this.errors.length > 0) {
    }

    if (this.warnings.length > 0) {
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
    }
  }
}

// Run validation
const validator = new LicenseSystemValidator();
validator.validateSystem().catch(console.error);
