const { generateLicense, validateLicense } = require('./license-generator');


// Test 1: Generate a license
const { licenseKey, expiresAt } = generateLicense(
  'customer@example.com',
  'price_1SiteClone',
  365
);

// Test 2: Validate the license
const validation = validateLicense(licenseKey);

// Test 3: Test expired license
const expiredLicense = generateLicense(
  'expired@example.com',
  'price_1Enterprise',
  -1
); // Expired yesterday
const expiredValidation = validateLicense(expiredLicense.licenseKey);

// Test 4: Test tampered license
const tamperedLicense = licenseKey.slice(0, -5) + 'XXXXX'; // Tamper with signature
const tamperedValidation = validateLicense(tamperedLicense);

// Test 5: Decode license info
try {
  const [encodedPayload] = licenseKey.split('.');
  const payload = Buffer.from(encodedPayload, 'base64').toString('utf-8');
  const [email, productId, issuedAt, expiresAt] = payload.split('|');

    '⏳ Days Remaining:',
    Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
  );
} catch (err) {
}

