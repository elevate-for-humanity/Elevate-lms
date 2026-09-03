const express = require('express');
const helmet = require('helmet');
const {
  generateTieredLicense,
  validateTieredLicense,
  checkFeatureAccess,
  usageTracker,
  LICENSE_TIERS,
} = require('./tiered-license-system');
const generateLicensePDF = require('./generate-certificate');

const app = express();
app.use(helmet());
app.use(express.json());
app.use(express.static('.'));

// License Generation Endpoint
app.post('/api/generate-tiered-license', async (req, res) => {
  try {
    const { email, packageId, licenseType, expiresInDays = 365 } = req.body;

    if (!email || !packageId || !licenseType) {
      return res.status(400).json({
        error: 'Email, packageId, and licenseType are required',
      });
    }

    if (!LICENSE_TIERS[licenseType]) {
      return res.status(400).json({
        error: 'Invalid license type',
        availableTypes: Object.keys(LICENSE_TIERS),
      });
    }

    const license = generateTieredLicense(email, packageId, licenseType, expiresInDays);

    // Generate PDF certificate
    const certificatePath = await generateLicensePDF(
      email,
      `${license.tierName} - ${packageId}`,
      license.licenseKey,
      license.expiresAt,
    );

    res.json({
      success: true,
      license: {
        key: license.licenseKey,
        tier: license.tierName,
        features: license.features,
        restrictions: license.restrictions,
        expiresAt: license.expiresAt,
        maxDeployments: license.maxDeployments,
        downloadLimits: license.downloadLimits,
      },
      certificatePath,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate license' });
  }
});

// License Validation Endpoint
app.post('/api/validate-tiered-license', (req, res) => {
  try {
    const { licenseKey, requestedFeature } = req.body;

    if (!licenseKey) {
      return res.status(400).json({ error: 'License key is required' });
    }

    const validation = validateTieredLicense(licenseKey, requestedFeature);
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate license' });
  }
});

// Feature Access Check Endpoint
app.post('/api/check-feature-access', (req, res) => {
  try {
    const { licenseKey, feature } = req.body;

    if (!licenseKey || !feature) {
      return res.status(400).json({
        error: 'License key and feature are required',
      });
    }

    const access = checkFeatureAccess(licenseKey, feature);
    res.json(access);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check feature access' });
  }
});

// Download Tracking Endpoint
app.post('/api/track-download', (req, res) => {
  try {
    const { licenseKey, fileType, userIP } = req.body;

    if (!licenseKey || !fileType) {
      return res.status(400).json({
        error: 'License key and file type are required',
      });
    }

    const result = usageTracker.trackDownload(licenseKey, fileType, userIP || req.ip);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to track download' });
  }
});

// Deployment Registration Endpoint
app.post('/api/register-deployment', (req, res) => {
  try {
    const { licenseKey, domain } = req.body;

    if (!licenseKey || !domain) {
      return res.status(400).json({
        error: 'License key and domain are required',
      });
    }

    const result = usageTracker.trackDeployment(licenseKey, domain);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register deployment' });
  }
});

// Usage Statistics Endpoint
app.post('/api/license-usage-stats', (req, res) => {
  try {
    const { licenseKey } = req.body;

    if (!licenseKey) {
      return res.status(400).json({ error: 'License key is required' });
    }

    const stats = usageTracker.getUsageStats(licenseKey);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
});

// License Upgrade Endpoint
app.post('/api/upgrade-license', async (req, res) => {
  try {
    const { currentLicenseKey, newTier } = req.body;

    if (!currentLicenseKey || !newTier) {
      return res.status(400).json({
        error: 'Current license key and new tier are required',
      });
    }

    // Validate current license
    const currentValidation = validateTieredLicense(currentLicenseKey);
    if (!currentValidation.valid) {
      return res.status(400).json({
        error: 'Invalid current license',
        reason: currentValidation.reason,
      });
    }

    if (!LICENSE_TIERS[newTier]) {
      return res.status(400).json({
        error: 'Invalid new tier',
        availableTiers: Object.keys(LICENSE_TIERS),
      });
    }

    // Generate new license with upgraded tier
    const upgradedLicense = generateTieredLicense(
      currentValidation.email,
      `upgraded_${currentValidation.productId}`,
      newTier,
      Math.ceil((new Date(currentValidation.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)),
    );

    // Generate new certificate
    const certificatePath = await generateLicensePDF(
      currentValidation.email,
      `${upgradedLicense.tierName} - Upgraded`,
      upgradedLicense.licenseKey,
      upgradedLicense.expiresAt,
    );

    res.json({
      success: true,
      message: 'License upgraded successfully',
      oldTier: currentValidation.tierName,
      newLicense: {
        key: upgradedLicense.licenseKey,
        tier: upgradedLicense.tierName,
        features: upgradedLicense.features,
        restrictions: upgradedLicense.restrictions,
        expiresAt: upgradedLicense.expiresAt,
      },
      certificatePath,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upgrade license' });
  }
});

// Available Tiers Information Endpoint
app.get('/api/license-tiers', (req, res) => {
  const tierInfo = Object.entries(LICENSE_TIERS).map(([key, tier]) => ({
    id: key,
    name: tier.name,
    maxDeployments: tier.maxDeployments,
    features: tier.features,
    restrictions: tier.restrictions,
    downloadLimits: tier.downloadLimits,
  }));

  res.json({
    tiers: tierInfo,
    upgradeMatrix: {
      starter: ['business', 'enterprise'],
      business: ['enterprise'],
      enterprise: [],
    },
  });
});

// Bulk License Generation (for enterprise customers)
app.post('/api/generate-bulk-licenses', async (req, res) => {
  try {
    const { emails, packageId, licenseType, expiresInDays = 365 } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        error: 'Emails array is required and must not be empty',
      });
    }

    if (emails.length > 100) {
      return res.status(400).json({
        error: 'Maximum 100 licenses can be generated at once',
      });
    }

    const licenses = [];
    const errors = [];

    for (const email of emails) {
      try {
        const license = generateTieredLicense(email, packageId, licenseType, expiresInDays);
        licenses.push({
          email,
          licenseKey: license.licenseKey,
          tier: license.tierName,
          expiresAt: license.expiresAt,
        });
      } catch (error) {
        errors.push({ email, error: error.message });
      }
    }

    res.json({
      success: true,
      generated: licenses.length,
      errorCount: errors.length,
      licenses,
      errors,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate bulk licenses' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {});

module.exports = app;
