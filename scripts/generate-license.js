#!/usr/bin/env node

/**
 * License Generator CLI for Rise Foundation Ecosystem
 * Generates JWT-based license tokens for clients
 *
 * Usage: node generate-license.js --licensee "Client Name" --domain "client.com" --tier "enterprise"
 */

const {
  generateClientLicense,
  validateLicenseToken,
} = require('../middleware/license');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = value;
  }

  return options;
}

// Generate license certificate document
function generateLicenseCertificate(licenseData, token) {
  const certificate = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                          RISE FOUNDATION ECOSYSTEM                          ║
║                            SOFTWARE LICENSE                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

LICENSE CERTIFICATE
═══════════════════

Licensee:        ${licenseData.licensee}
Domain:          ${licenseData.domain}
License Tier:    ${licenseData.tier.toUpperCase()}
Features:        ${licenseData.features.join(', ')}
Issue Date:      ${new Date().toLocaleDateString()}
Expires:         ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}

LICENSE TOKEN:
${token}

AUTHORIZED FEATURES:
${licenseData.features.map((f) => `  ✓ ${f.toUpperCase()}`).join('\n')}

TERMS AND CONDITIONS:
• This license is valid only for the specified domain
• Unauthorized use, copying, or redistribution is prohibited
• License is non-transferable without written consent
• Violation may result in immediate termination and legal action

SUPPORT CONTACT:
Email: licensing@elevateforhumanity.com
Phone: [Contact Number]
Website: https://elevateforhumanity.com

═══════════════════════════════════════════════════════════════════════════════
© 2025 Selfish Inc. DBA Rise Foundation. All Rights Reserved.
Licensed Use Only - Unauthorized use prohibited
═══════════════════════════════════════════════════════════════════════════════
`;

  return certificate;
}

// Main function
function main() {
  const options = parseArgs();

  // Validate required options
  if (!options.licensee || !options.domain) {
Usage: node generate-license.js [options]

Required:
  --licensee "Client Name"     Name of the licensee
  --domain "client.com"        Authorized domain

Optional:
  --tier "basic|sister|enterprise"  License tier (default: basic)
  --features "lms,analytics"         Comma-separated features
  --duration "365"                   License duration in days (default: 365)
  --output "path/to/file"            Output file path

Examples:
  node generate-license.js --licensee "Acme Corp" --domain "acme.com" --tier "enterprise"
  node generate-license.js --licensee "Local School" --domain "school.edu" --features "lms,basic"
    `);
    process.exit(1);
  }

  // Set defaults
  const licenseData = {
    licensee: options.licensee,
    domain: options.domain,
    tier: options.tier || 'basic',
    features: options.features ? options.features.split(',') : ['lms', 'basic'],
    duration: parseInt(options.duration) || 365,
  };

  // Feature sets by tier
  const tierFeatures = {
    basic: ['lms', 'basic'],
    sister: ['lms', 'basic', 'sister-sites'],
    enterprise: [
      'lms',
      'basic',
      'sister-sites',
      'analytics',
      'ai-tutor',
      'compliance',
      'admin',
    ],
    development: ['all'],
  };

  // Override features based on tier if not explicitly set
  if (!options.features && tierFeatures[licenseData.tier]) {
    licenseData.features = tierFeatures[licenseData.tier];
  }


  try {
    // Generate license token
    const token = generateClientLicense(licenseData);

    // Validate the generated token
    const validation = validateLicenseToken(token);
    if (!validation.valid) {
      throw new Error(`Generated token validation failed: ${validation.error}`);
    }


    // Generate certificate
    const certificate = generateLicenseCertificate(licenseData, token);

    // Save to file if output specified
    if (options.output) {
      const outputPath = path.resolve(options.output);
      fs.writeFileSync(outputPath, certificate);
    } else {
      // Save to default location
      const filename = `license-${licenseData.domain.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.txt`;
      const outputPath = path.join(__dirname, '..', 'licenses', filename);

      // Create licenses directory if it doesn't exist
      const licensesDir = path.dirname(outputPath);
      if (!fs.existsSync(licensesDir)) {
        fs.mkdirSync(licensesDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, certificate);
    }

    // Generate .env template
    const envTemplate = `
# License Configuration for ${licenseData.licensee}
LICENSE_TOKEN=${token}
LICENSE_DOMAIN=${licenseData.domain}
LICENSE_TIER=${licenseData.tier}
LICENSE_FEATURES=${licenseData.features.join(',')}

# Add this to your application's .env file
# Make sure to keep this secure and never commit to public repositories
`;

    const envPath = path.join(
      __dirname,
      '..',
      'licenses',
      `env-${licenseData.domain.replace(/[^a-zA-Z0-9]/g, '-')}.txt`
    );
    fs.writeFileSync(envPath, envTemplate);

  } catch (error) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateLicenseCertificate, parseArgs };
