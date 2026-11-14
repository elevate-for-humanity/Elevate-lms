const express = require('express');
const path = require('path');
const EcosystemStatusChecker = require('./ecosystem-status-checker');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Ecosystem Status API - "Where are we at now"
app.get('/api/ecosystem/status', async (req, res) => {
  try {
    const statusChecker = new EcosystemStatusChecker();
    const status = await statusChecker.runAllChecks();

    res.json({
      success: true,
      ...status,
      message: 'Real-time ecosystem health assessment',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to perform ecosystem status check',
      message: error.message,
    });
  }
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback route to serve the status page
app.get('/ecosystem-status', (req, res) => {
  res.sendFile(path.join(__dirname, 'ecosystem-status.html'));
});

// Start server
app.listen(PORT, () => {});

module.exports = app;
