#!/usr/bin/env node

// Simple production readiness check
import fs from 'fs';

// Test all the actual security features
const serverContent = fs.readFileSync('./simple-server.cjs', 'utf8');
const packageContent = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const checks = [
  {
    name: 'JWT Secret configured',
    passed: process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16,
    critical: true,
  },
  {
    name: 'Production environment',
    passed: process.env.NODE_ENV === 'production',
    critical: false,
  },
  {
    name: 'Helmet security headers',
    passed: serverContent.includes('app.use(helmet())'),
    critical: true,
  },
  {
    name: 'Rate limiting',
    passed: serverContent.includes('rateLimit'),
    critical: false,
  },
  {
    name: 'Compression enabled',
    passed: serverContent.includes('compression()'),
    critical: false,
  },
  {
    name: 'Error handling middleware',
    passed: serverContent.includes('(err, req, res, _next)'),
    critical: false,
  },
  {
    name: 'Structured logging (Pino)',
    passed: serverContent.includes('pino') && serverContent.includes('pinoHttp'),
    critical: false,
  },
  {
    name: 'Request ID tracking',
    passed: serverContent.includes('req.id') && serverContent.includes('X-Request-ID'),
    critical: false,
  },
  {
    name: 'Security dependencies',
    passed:
      packageContent.dependencies?.helmet && packageContent.dependencies?.['express-rate-limit'],
    critical: false,
  },
];

let passed = 0;
let critical = 0;

checks.forEach((check) => {
  const icon = check.passed ? '✅' : check.critical ? '🚨' : '⚠️';
  if (check.passed) passed++;
  if (!check.passed && check.critical) critical++;
});

const score = Math.round((passed / checks.length) * 100);
const ready = critical === 0;

if (critical > 0) {
}

process.exit(ready ? 0 : 1);
