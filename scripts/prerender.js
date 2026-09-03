#!/usr/bin/env node
/**
 * Static prerender script: fetches the built Vite app for selected routes and stores HTML snapshots.
 * These can then be served directly (or uploaded to a CDN) for faster TTFB and better SEO.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROUTES_FILE = path.join(__dirname, '..', 'prerender-routes.json');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const OUT_DIR = path.join(DIST_DIR, 'prerender');

if (!fs.existsSync(DIST_DIR)) {
  process.exit(1);
}

const routes = JSON.parse(fs.readFileSync(ROUTES_FILE, 'utf-8'));
fs.mkdirSync(OUT_DIR, { recursive: true });

// Simple static server to let us request the built files as a browser would.
const serve = () =>
  new Promise((resolve) => {
    const server = http
      .createServer((req, res) => {
        const urlPath = req.url.split('?')[0];
        let filePath = path.join(
          DIST_DIR,
          urlPath === '/' ? 'index.html' : urlPath
        );
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }
        if (!fs.existsSync(filePath)) {
          // Fallback to SPA index
          filePath = path.join(DIST_DIR, 'index.html');
        }
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.statusCode = 500;
            res.end('Error');
          } else {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(data);
          }
        });
      })
      .listen(4173, () => resolve(server)); // Vite preview default port
  });

const fetchHtml = (route) =>
  new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: 'localhost', port: 4173, path: route, method: 'GET' },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve(body));
      }
    );
    req.on('error', reject);
    req.end();
  });

(async () => {
  const server = await serve();
  try {
    for (const route of routes) {
      const html = await fetchHtml(route);
      const safe = route === '/' ? 'index' : route.replace(/\//g, '_');
      const outFile = path.join(OUT_DIR, `${safe}.html`);
      fs.writeFileSync(outFile, html, 'utf-8');
        'Prerendered',
        route,
        '->',
        path.relative(process.cwd(), outFile)
      );
    }
  } catch (e) {
    process.exitCode = 1;
  } finally {
    server.close();
  }
})();
