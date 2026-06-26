const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const pino = require('pino');
const pinoHttp = require('pino-http');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
app.use(pinoHttp({ logger }));
app.use(helmet());
// compression with Node 22 compatible filter
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return true;
  },
}));
app.use(express.json({ limit: '1mb' }));

// Basic health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT, timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).send('<h1>EFH Platform - Minimal Server</h1>');
});

// Start server
if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info({ port: PORT }, 'Minimal EFH server started');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('Shutting down minimal server...');
    server.close(() => {
      logger.info('Minimal server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('Shutting down minimal server...');
    server.close(() => {
      logger.info('Minimal server closed');
      process.exit(0);
    });
  });
}

module.exports = app;
