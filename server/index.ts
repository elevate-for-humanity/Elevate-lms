/**
 * Video Generation Server
 * Express server for video generation API
 */

import express from 'express';
import compression from 'compression';
import videoApiRouter from './video-api';

const app = express();
const PORT = process.env.VIDEO_API_PORT || 3001;

// Middleware - exclude streaming/SSE responses from compression
app.use(compression({
  filter: (req, res) => {
    try {
      // Don't compress streaming responses or SSE
      if (res.getHeader('Content-Type')?.toString().includes('text/event-stream')) {
        return false;
      }
      // Check if res has the expected methods for compression
      if (typeof res.map !== 'function' || typeof res.filter !== 'function') {
        return false;
      }
      return compression.filter(req, res);
    } catch {
      // If anything goes wrong, don't compress
      return false;
    }
  }
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS — restrict to known origins
const ALLOWED_ORIGINS = (process.env.VIDEO_API_ALLOWED_ORIGINS || 'https://www.elevateforhumanity.org')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Bearer token auth — protect all /api/video routes except health
const VIDEO_API_SECRET = process.env.VIDEO_API_SECRET;
app.use('/api/video', (req, res, next) => {
  // Allow health check without auth
  if (req.path === '/health') return next();

  if (!VIDEO_API_SECRET) {
    return res.status(503).json({ error: 'VIDEO_API_SECRET not configured' });
  }
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${VIDEO_API_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Routes
app.use('/api/video', videoApiRouter);

// Root endpoint — minimal info (do not enumerate routes in production)
app.get('/', (req, res) => {
  res.json({
    service: 'Video Generation API',
    status: 'running',
  });
});

// Error handling — avoid leaking internal details to clients
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[video-api] Unhandled error:', err);
  }
  res.status(500).json({
    error: 'Internal server error',
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {});

export default app;
