const express = require('express');
const { generateLicense, validateLicense } = require('./license-generator');
const router = express.Router();

router.post('/api/renew-license', (req, res) => {
  const { licenseKey } = req.body;

  const validation = validateLicense(licenseKey);
  if (!validation.valid && validation.reason !== 'Expired') {
    return res.status(400).json({ success: false, reason: validation.reason });
  }

  const { email, productId } = validation;
  const renewed = generateLicense(email, productId, 365);
  res.json({
    success: true,
    newLicense: renewed.licenseKey,
    expiresAt: renewed.expiresAt,
  });
});

module.exports = router;
