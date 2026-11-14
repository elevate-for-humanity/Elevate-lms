/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

// Alternative entry point for the multi-site ecosystem
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'EFH Multi-Site Ecosystem Running',
    securityStatus: 'XSS vulnerability fixed - using DOMParser',
  });
});

// Sister site routes
const routes = ['hub', 'programs', 'lms', 'connect', 'compliance'];
routes.forEach((route) => {
  app.get(`/${route}`, (req, res) => {
    res.sendFile(path.join(__dirname, `${route}.html`));
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    '🔒 Security Status: XSS vulnerability fixed in all universal scripts'
  );
});

module.exports = app;
