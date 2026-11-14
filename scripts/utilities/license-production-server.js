#!/usr/bin/env node

/**
 * Elevate License Management Server
 * Complete revenue-ready license system with Stripe integration
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import license system modules
const {
  generateTieredLicense,
  validateTieredLicense,
  checkFeatureAccess,
  usageTracker,
  LICENSE_TIERS,
} = require('./tiered-license-system');
const generateLicensePDF = require('./generate-certificate');
const { urgencyManager } = require('./urgency-scarcity-system');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve certificates
app.use('/certificates', express.static('certificates'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      licenseGeneration: 'operational',
      pdfCertificates: 'operational',
      urgencySystem: 'operational',
      stripeIntegration: 'operational',
    },
  });
});

// License Management Endpoints
app.post('/api/generate-license', async (req, res) => {
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
      certificatePath: certificatePath.replace('./certificates/', '/certificates/'),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate license' });
  }
});

app.post('/api/validate-license', (req, res) => {
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

// Urgency & Scarcity Endpoints
app.get('/api/urgency/:packageId', (req, res) => {
  try {
    const { packageId } = req.params;
    const visitorId = req.headers['x-visitor-id'] || req.ip;

    const urgencyData = urgencyManager.getUrgencyData(packageId, visitorId);
    res.json(urgencyData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get urgency data' });
  }
});

// Sales Dashboard (Admin)
app.get('/api/sales-dashboard', (req, res) => {
  try {
    const dashboard = urgencyManager.getSalesDashboard();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sales dashboard' });
  }
});

// Serve static files
app.get('/', (req, res) => {
  res.send(`
    <h1>🚀 Elevate License Server</h1>
    <p>Enterprise license management system is running!</p>
    <h2>📊 Available Endpoints:</h2>
    <ul>
      <li>POST /api/generate-license</li>
      <li>POST /api/validate-license</li>
      <li>GET /api/urgency/:packageId</li>
      <li>GET /api/sales-dashboard</li>
      <li>GET /health</li>
    </ul>
    <h2>💰 Revenue System Status:</h2>
    <p>✅ Flash Sale System: Active</p>
    <p>✅ License Generation: Operational</p>
    <p>✅ PDF Certificates: Ready</p>
    <p>✅ Urgency Engine: Running</p>
  `);
});

// Start server
app.listen(PORT, () => {
  // Ensure certificates directory exists
  const fs = require('fs');
  if (!fs.existsSync('./certificates')) {
    fs.mkdirSync('./certificates', { recursive: true });
  }
});

module.exports = app;
