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

// Backend API Server - Separate from Frontend
const express = require('express');
const cors = require('cors');
const { ENV, SERVICES } = require('./shared/config');
const db = require('./shared/database');
const { auth, requireAuth } = require('./shared/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Security and CORS
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://elevateforhumanity.org',
      'https://elevateforhumanity.pages.dev',
      'https://www.elevateforhumanity.org',
    ],
    credentials: true,
  }),
);

app.use(express.json());

// Connect to database
db.connect().catch((err) => {
  process.exit(1);
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbHealth = await db.healthCheck();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'backend-api',
    port: PORT,
    database: dbHealth,
    services: {
      authentication: 'active',
      database: dbHealth.status,
      api: 'ready',
    },
  });
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, auth_id } = req.body;

    if (!email || !auth_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and auth_id are required',
      });
    }

    const session = await auth.createSession({ email, auth_id });
    res.json(session);
  } catch (error) {
    res.status(500).json({
      error: 'Login failed',
      message: error.message,
    });
  }
});

app.post('/api/auth/validate', async (req, res) => {
  try {
    const { token } = req.body;
    const validation = await auth.validateSession(token);
    res.json(validation);
  } catch (error) {
    res.status(500).json({
      error: 'Validation failed',
      message: error.message,
    });
  }
});

// User endpoints
app.get('/api/users/profile', requireAuth, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message,
    });
  }
});

// Enrollment endpoints
app.get('/api/enrollments', requireAuth, async (req, res) => {
  try {
    const enrollments = await db.getUserEnrollments(req.user.id);
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch enrollments',
      message: error.message,
    });
  }
});

app.post('/api/enrollments', requireAuth, async (req, res) => {
  try {
    const enrollmentData = {
      user_id: req.user.id,
      program_slug: req.body.program_slug,
      status: 'pending',
    };

    const enrollment = await db.createEnrollment(enrollmentData);
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create enrollment',
      message: error.message,
    });
  }
});

// Program endpoints
app.get('/api/programs', (req, res) => {
  const programs = [
    {
      slug: 'ai-fundamentals',
      name: 'AI Fundamentals',
      description: 'Master artificial intelligence and machine learning foundations',
      price: 199700,
      currency: 'usd',
      duration: '12 weeks',
      level: 'beginner',
    },
    {
      slug: 'data-science-bootcamp',
      name: 'Data Science Bootcamp',
      description: 'Comprehensive data science training with real-world projects',
      price: 495000,
      currency: 'usd',
      duration: '16 weeks',
      level: 'intermediate',
    },
    {
      slug: 'advanced-ai-specialization',
      name: 'Advanced AI Specialization',
      description: 'Expert-level AI training with deep learning and neural networks',
      price: 749500,
      currency: 'usd',
      duration: '20 weeks',
      level: 'advanced',
    },
  ];

  res.json(programs);
});

// Error handling middleware
app.use((error, req, res, next) => {
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {});

module.exports = app;
