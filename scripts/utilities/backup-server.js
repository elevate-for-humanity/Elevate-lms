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

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files
app.use(express.static('.'));

// Simple route handling - no complex routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/hub', (req, res) => {
  res.sendFile(path.join(__dirname, 'hub.html'));
});

app.get('/programs', (req, res) => {
  res.sendFile(path.join(__dirname, 'programs.html'));
});

app.get('/connect', (req, res) => {
  res.sendFile(path.join(__dirname, 'connect.html'));
});

app.get('/lms', (req, res) => {
  res.sendFile(path.join(__dirname, 'lms.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'backup',
    timestamp: new Date().toISOString(),
  });
});

// Catch all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {});
