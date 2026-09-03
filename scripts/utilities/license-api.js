const express = require('express');
const { generateLicense, validateLicense } = require('./license-generator');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// License validation endpoint
app.post('/api/validate-license', (req, res) => {
  const { licenseKey } = req.body;

  if (!licenseKey) {
    return res.status(400).json({ valid: false, reason: 'License key required' });
  }

  const result = validateLicense(licenseKey);
  res.json(result);
});

// License generation endpoint (for webhook integration)
app.post('/api/generate-license', (req, res) => {
  const { email, productId, expiresInDays = 365 } = req.body;

  if (!email || !productId) {
    return res.status(400).json({ error: 'Email and productId required' });
  }

  const license = generateLicense(email, productId, expiresInDays);
  res.json(license);
});

// License renewal endpoint
app.post('/api/renew-license', (req, res) => {
  const { licenseKey, additionalDays = 365 } = req.body;

  const validation = validateLicense(licenseKey);
  if (!validation.valid) {
    return res.status(400).json({ error: 'Invalid license for renewal' });
  }

  // Generate new license with extended expiration
  const newLicense = generateLicense(validation.email, validation.productId, additionalDays);
  res.json({
    message: 'License renewed successfully',
    oldExpiry: validation.expiresAt,
    newLicense: newLicense.licenseKey,
    newExpiry: newLicense.expiresAt,
  });
});

// License info endpoint (decode without validation)
app.post('/api/license-info', (req, res) => {
  const { licenseKey } = req.body;

  try {
    const [encodedPayload] = licenseKey.split('.');
    const payload = Buffer.from(encodedPayload, 'base64').toString('utf-8');
    const [email, productId, issuedAt, expiresAt] = payload.split('|');

    res.json({
      email,
      productId,
      issuedAt,
      expiresAt,
      daysRemaining: Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)),
    });
  } catch (err) {
    res.status(400).json({ error: 'Malformed license key' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {});

module.exports = app;
