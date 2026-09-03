/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/**
 * scripts/utilities/production-server.js
 * Production static file server with basic API routes.
 *
 * SECURITY AUDIT FIXES:
 * - Added CORS restrictions
 * - Added unhandledRejection handler
 * - Added structured logging
 * - Added input validation
 * - Fixed error handling
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import compression from 'compression';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['https://elevateforhumanity.org', 'https://www.elevateforhumanity.org'];

// Middleware - compression with Node 22 compatible filter
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return true;
  },
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = ALLOWED_ORIGINS.some(allowed => 
      origin === allowed || origin.endsWith(allowed.replace(/^https?:\/\//, ''))
    );
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[production] CORS: blocked origin: ${origin}`);
      callback(new Error('Not allowed'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.', { maxAge: '1d' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
    environment: process.env.NODE_ENV || 'development',
  });
});

// Validate product ID against allowlist
const ALLOWED_PRODUCTS = new Set(['complete-platform', 'source-code']);

function isValidProductId(id) {
  return typeof id === 'string' && ALLOWED_PRODUCTS.has(id);
}

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>'"&]/g, '');
}

// API Routes
app.get('/api/emergency-sale', (req, res) => {
  res.json({
    active: true,
    deadline: '72 hours remaining',
    products: [
      {
        id: 'complete-platform',
        name: 'Complete Workforce Platform',
        originalPrice: 9999,
        salePrice: 2999,
        savings: 7000,
        features: ['33+ Programs', 'Federal Partnerships', 'Revenue Sharing', 'Full Source Code'],
      },
      {
        id: 'source-code',
        name: 'Source Code Only',
        originalPrice: 4999,
        salePrice: 999,
        savings: 4000,
        features: ['Complete Codebase', 'All Programs', 'Documentation'],
      },
    ],
  });
});

// Stripe integration
app.post('/api/checkout', async (req, res) => {
  try {
    const { productId, amount } = req.body;

    // Validate input
    if (!isValidProductId(productId)) {
      return res.status(400).json({ error: 'Invalid product' });
    }

    if (typeof amount !== 'number' || amount <= 0 || amount > 100000) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Return success URL for demo
    const safeProductId = sanitizeString(productId);
    res.json({
      url: `/payment-success.html?product=${safeProductId}&amount=${amount}`,
      success: true,
    });
  } catch (error) {
    console.error(`[production] api/checkout: error: ${error.message}`);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// Emergency sale tracking
app.post('/api/track-view', async (req, res) => {
  try {
    const { page, source } = req.body;
    // Sanitize inputs
    const safePage = sanitizeString(page || '');
    const safeSource = sanitizeString(source || '');
    
    // Log for analytics (placeholder)
    console.info(`[production] track: page=${safePage}, source=${safeSource}`);
    
    res.json({ success: true });
  } catch (error) {
    console.error(`[production] api/track-view: error: ${error.message}`);
    res.json({ success: false });
  }
});

// Sister site routes
const sisterSites = [
  'hub',
  'programs',
  'lms',
  'connect',
  'compliance',
  'pay',
  'partners',
  'account',
];
sisterSites.forEach((site) => {
  const safeSite = sanitizeString(site);
  app.get(`/${safeSite}`, (req, res) => {
    const filePath = path.join(__dirname, `${safeSite}.html`);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.redirect('/');
    }
  });
});

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all for HTML files
app.get('/*.html', (req, res) => {
  // Sanitize path to prevent directory traversal
  const requestedPath = req.path;
  if (requestedPath.includes('..') || requestedPath.includes('/..')) {
    return res.status(400).send('Invalid path');
  }
  
  const filePath = path.join(__dirname, requestedPath);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Page not found');
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error(`[production] error: ${error.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason) => {
  if (!reason) {
    console.error('[production] rejection: unhandled (reason=null/undefined)');
    return;
  }

  const error = reason instanceof Error ? reason : new Error(String(reason));
  const errorCode = error.code;
  
  const KNOWN_SAFE_CODES = new Set(['ECONNRESET', 'EPIPE', 'ENOTCONN', 'ECONNREFUSED']);
  if (KNOWN_SAFE_CODES.has(errorCode)) {
    console.debug(`[production] rejection: suppressed safe (code=${errorCode})`);
    return;
  }

  console.error(`[production] rejection: unhandled (code=${errorCode ?? 'none'}, message=${error.message})`);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.info(`[production] server: started on port ${PORT} (pid=${process.pid})`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.info('[production] shutdown: received SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.info('[production] shutdown: received SIGINT');
  process.exit(0);
});
