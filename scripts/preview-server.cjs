#!/usr/bin/env node

/**
 * Simple static file server with SPA routing support
 * Serves the dist/ directory with proper fallback to index.html
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const DIST_DIR = path.join(__dirname, '..', 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

function getCacheControl(filePath) {
  const ext = path.extname(filePath);

  // HTML files - no cache
  if (ext === '.html') {
    return 'public, max-age=0, must-revalidate';
  }

  // Images and static assets - long cache
  if (
    ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.woff', '.woff2', '.ttf'].includes(
      ext,
    )
  ) {
    return 'public, max-age=31536000, immutable';
  }

  // JS and CSS - long cache (they have hashes in filenames)
  if (['.js', '.css'].includes(ext)) {
    return 'public, max-age=31536000, immutable';
  }

  // Default
  return 'public, max-age=3600';
}

const server = http.createServer((req, res) => {
  // Parse URL and remove query string
  let filePath = req.url.split('?')[0];

  // Remove trailing slash
  if (filePath.endsWith('/') && filePath !== '/') {
    filePath = filePath.slice(0, -1);
  }

  // Default to index.html for root
  if (filePath === '/' || filePath === '') {
    filePath = '/index.html';
  }

  // Build full path
  const fullPath = path.join(DIST_DIR, filePath);

  // Check if file exists
  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // File doesn't exist - check if it's a directory with index.html
      const indexPath = path.join(fullPath, 'index.html');
      fs.stat(indexPath, (err2, stats2) => {
        if (!err2 && stats2.isFile()) {
          // Serve directory index
          serveFile(indexPath, res);
        } else {
          // SPA fallback - serve root index.html for all other routes
          serveFile(path.join(DIST_DIR, 'index.html'), res);
        }
      });
    } else {
      // File exists - serve it
      serveFile(fullPath, res);
    }
  });
});

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      console.error('Error reading file:', filePath, err);
      return;
    }

    const ext = path.extname(filePath);
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    const cacheControl = getCacheControl(filePath);

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': cacheControl,
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);

    // Log request
    const relativePath = path.relative(DIST_DIR, filePath);
    console.log(`[${new Date().toISOString()}] 200 ${relativePath}`);
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Preview server running!`);
  console.log(`\n   Local:   http://localhost:${PORT}/`);
  console.log(`   Network: http://0.0.0.0:${PORT}/\n`);
  console.log(`Serving: ${DIST_DIR}\n`);
});

// Handle errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Try a different port: PORT=8081 node scripts/preview-server.js\n`);
  } else {
    console.error('\n❌ Server error:', err.message, '\n');
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down preview server...\n');
  server.close(() => {
    process.exit(0);
  });
});
