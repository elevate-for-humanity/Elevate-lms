import crypto from 'node:crypto';
import http from 'node:http';
import dns from 'node:dns/promises';
import net from 'node:net';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const port = Number(process.env.PORT || 3100);
const sharedSecret = process.env.STUDIO_BROWSER_SECRET || '';
const adminOrigin =
  process.env.STUDIO_BROWSER_ADMIN_ORIGIN || 'https://admin.elevateforhumanity.org';
const sessionTtlMs = Number(process.env.STUDIO_BROWSER_SESSION_TTL_MS || 15 * 60_000);
const maxSessions = Number(process.env.STUDIO_BROWSER_MAX_SESSIONS || 4);
const frameIntervalMs = Math.min(
  1000,
  Math.max(100, Number(process.env.STUDIO_BROWSER_FRAME_INTERVAL_MS || 160)),
);
const frameQuality = Math.min(
  80,
  Math.max(35, Number(process.env.STUDIO_BROWSER_FRAME_QUALITY || 60)),
);
const allowedDomains = (process.env.STUDIO_BROWSER_ALLOWED_DOMAINS || 'elevateforhumanity.org')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const sessions = new Map();
let browserPromise;

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json', ...corsHeaders() });
  res.end(JSON.stringify(body));
}

function corsHeaders() {
  return {
    'access-control-allow-origin': adminOrigin,
    'access-control-allow-headers': 'authorization,content-type,x-studio-browser-secret',
    'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  };
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64_000) throw new Error('Request body is too large');
    chunks.push(chunk);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

export function isPrivateAddress(address) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  return (
    address === '::1' ||
    address.startsWith('fc') ||
    address.startsWith('fd') ||
    address.startsWith('fe80:')
  );
}

async function validateTarget(input) {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('Only HTTP and HTTPS targets are allowed');
  if (url.username || url.password) throw new Error('Target credentials are not allowed');
  if (url.port && !['80', '443'].includes(url.port))
    throw new Error('Only standard HTTP and HTTPS ports are allowed');
  const host = url.hostname.toLowerCase();
  if (
    allowedDomains.length &&
    !allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`))
  ) {
    throw new Error('Target domain is not in the Studio browser allowlist');
  }
  const records = await dns.lookup(host, { all: true });
  if (!records.length || records.some((record) => isPrivateAddress(record.address)))
    throw new Error('Private network targets are blocked');
  return url.toString();
}

function authorized(req, session, requestUrl) {
  const token =
    req.headers.authorization?.replace(/^Bearer\s+/i, '') || requestUrl.searchParams.get('token');
  return !!token && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(session.token));
}

async function getBrowser() {
  browserPromise ||= chromium
    .launch({
      headless: true,
      args: [
        '--disable-background-networking',
        '--disable-component-update',
        '--disable-dev-shm-usage',
        '--disable-renderer-backgrounding',
        '--no-first-run',
        '--no-sandbox',
      ],
    })
    .catch((error) => {
      browserPromise = undefined;
      throw error;
    });
  return browserPromise;
}

async function destroySession(id) {
  const session = sessions.get(id);
  if (!session) return;
  sessions.delete(id);
  if (session.frameTimer) clearTimeout(session.frameTimer);
  for (const stream of session.streams) stream.end();
  await session.context.close().catch(() => undefined);
}

async function createSession(target, viewport, authCookies = []) {
  if (sessions.size >= maxSessions) throw new Error('Studio browser session capacity reached');
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport,
    ignoreHTTPSErrors: false,
    acceptDownloads: false,
  });
  const targetUrl = new URL(target);
  const safeAuthCookies = Array.isArray(authCookies)
    ? authCookies
        .filter(
          (cookie) =>
            cookie &&
            typeof cookie.name === 'string' &&
            typeof cookie.value === 'string' &&
            cookie.name.startsWith('sb-') &&
            (cookie.name.endsWith('-auth-token') || /-auth-token\.\d+$/.test(cookie.name)) &&
            cookie.name.length <= 200 &&
            cookie.value.length <= 12_000,
        )
        .slice(0, 12)
        .map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
          domain: '.elevateforhumanity.org',
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'Lax',
        }))
    : [];
  if (
    safeAuthCookies.length &&
    (targetUrl.hostname === 'elevateforhumanity.org' ||
      targetUrl.hostname.endsWith('.elevateforhumanity.org'))
  ) {
    await context.addCookies(safeAuthCookies);
  }
  const page = await context.newPage();
  const id = crypto.randomUUID();
  const token = crypto.randomBytes(32).toString('base64url');
  const session = {
    id,
    token,
    context,
    page,
    target,
    createdAt: Date.now(),
    lastSeen: Date.now(),
    streams: new Set(),
    frameTimer: undefined,
    frameInFlight: false,
    framesSent: 0,
    framesDropped: 0,
    events: [],
  };
  const record = (type, data) => {
    session.events.push({ type, at: new Date().toISOString(), ...data });
    if (session.events.length > 500) session.events.shift();
  };
  page.on('console', (message) =>
    record('console', { level: message.type(), text: message.text().slice(0, 2000) }),
  );
  page.on('pageerror', (error) => record('pageerror', { text: error.message.slice(0, 2000) }));
  page.on('requestfailed', (request) =>
    record('requestfailed', {
      url: request.url(),
      error: request.failure()?.errorText || 'failed',
    }),
  );
  page.on('response', (response) => {
    if (response.status() >= 400)
      record('response', { url: response.url(), status: response.status() });
  });
  sessions.set(id, session);
  await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  return session;
}

async function runAction(session, action) {
  session.lastSeen = Date.now();
  const page = session.page;
  if (action.type === 'click_ref') {
    const ref = String(action.ref || '').slice(0, 80);
    if (!/^e\d+$/.test(ref)) throw new Error('Invalid browser control reference');
    await page.locator(`[data-studio-ref="${ref}"]`).first().click({ timeout: 10_000 });
  } else if (action.type === 'fill_ref') {
    const ref = String(action.ref || '').slice(0, 80);
    if (!/^e\d+$/.test(ref)) throw new Error('Invalid browser control reference');
    await page
      .locator(`[data-studio-ref="${ref}"]`)
      .first()
      .fill(String(action.text || '').slice(0, 4000), { timeout: 10_000 });
  } else if (action.type === 'select_ref') {
    const ref = String(action.ref || '').slice(0, 80);
    if (!/^e\d+$/.test(ref)) throw new Error('Invalid browser control reference');
    await page
      .locator(`[data-studio-ref="${ref}"]`)
      .first()
      .selectOption(String(action.value || '').slice(0, 1000), { timeout: 10_000 });
  } else if (action.type === 'press_ref') {
    const ref = String(action.ref || '').slice(0, 80);
    const key = String(action.key || '').slice(0, 80);
    if (!key) throw new Error('Browser key is required');
    if (ref) {
      if (!/^e\d+$/.test(ref)) throw new Error('Invalid browser control reference');
      await page.locator(`[data-studio-ref="${ref}"]`).first().press(key, { timeout: 10_000 });
    } else await page.keyboard.press(key);
  } else if (action.type === 'click' || action.type === 'double_click')
    await page.mouse.click(Number(action.x), Number(action.y), {
      button: action.button || 'left',
      clickCount: action.type === 'double_click' || action.clickCount === 2 ? 2 : 1,
    });
  else if (action.type === 'type')
    await page.keyboard.insertText(String(action.text || '').slice(0, 4000));
  else if (action.type === 'keypress')
    await page.keyboard.press(
      (Array.isArray(action.keys) ? action.keys : [action.key])
        .filter(Boolean)
        .join('+')
        .slice(0, 120),
    );
  else if (action.type === 'scroll') {
    if (action.x != null && action.y != null)
      await page.mouse.move(Number(action.x), Number(action.y));
    await page.mouse.wheel(
      Number(action.deltaX || action.scroll_x || 0),
      Number(action.deltaY || action.scroll_y || 0),
    );
  } else if (action.type === 'move') await page.mouse.move(Number(action.x), Number(action.y));
  else if (action.type === 'drag') {
    const path = Array.isArray(action.path) ? action.path : [];
    if (path.length) {
      await page.mouse.move(Number(path[0].x), Number(path[0].y));
      await page.mouse.down();
      for (const point of path.slice(1)) await page.mouse.move(Number(point.x), Number(point.y));
      await page.mouse.up();
    }
  } else if (action.type === 'wait')
    await page.waitForTimeout(Math.min(10_000, Math.max(250, Number(action.ms || 1000))));
  else if (action.type === 'screenshot') return;
  else if (action.type === 'navigate')
    ((session.target = await validateTarget(String(action.url || ''))),
      await page.goto(session.target, { waitUntil: 'domcontentloaded', timeout: 30_000 }));
  else if (action.type === 'reload')
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
  else throw new Error('Unsupported browser action');
}

export async function runActions(session, payload) {
  const actions = Array.isArray(payload?.actions) ? payload.actions.slice(0, 50) : [payload];
  const startedAt = Date.now();
  for (const action of actions) await runAction(session, action);
  return { count: actions.length, durationMs: Date.now() - startedAt };
}

export async function auditPage(session) {
  session.lastSeen = Date.now();
  await session.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
  const documentAudit = await session.page.evaluate(() => {
    const visible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const accessibleName = (element) =>
      element.getAttribute('aria-label')?.trim() ||
      element.getAttribute('title')?.trim() ||
      element.textContent?.trim() ||
      '';
    const images = [...document.images];
    const controls = [
      ...document.querySelectorAll('button, a[href], input, select, textarea'),
    ].filter(visible);
    const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      .filter(visible)
      .map((element) => ({
        level: Number(element.tagName.slice(1)),
        text: element.textContent?.trim().slice(0, 160) || '',
      }));
    const unlabeledControls = controls
      .filter((element) => !accessibleName(element))
      .slice(0, 30)
      .map((element) => element.outerHTML.slice(0, 240));
    const missingAlt = images
      .filter((image) => visible(image) && !image.hasAttribute('alt'))
      .slice(0, 30)
      .map((image) => image.currentSrc || image.src);
    const emptyLinks = [...document.querySelectorAll('a[href]')]
      .filter((link) => visible(link) && !accessibleName(link))
      .slice(0, 30)
      .map((link) => link.getAttribute('href'));
    const headingSkips = headings
      .map((heading, index) => ({
        previous: headings[index - 1]?.level,
        current: heading.level,
        text: heading.text,
      }))
      .filter((item) => item.previous && item.current > item.previous + 1);
    return {
      title: document.title,
      url: window.location.href,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      },
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      counts: {
        headings: headings.length,
        links: document.links.length,
        controls: controls.length,
        images: images.length,
        forms: document.forms.length,
      },
      accessibilityHeuristics: { missingAlt, unlabeledControls, emptyLinks, headingSkips },
    };
  });
  return {
    ...documentAudit,
    browserEvents: session.events.filter(
      (event) =>
        event.type === 'pageerror' ||
        event.type === 'requestfailed' ||
        event.type === 'response' ||
        (event.type === 'console' && ['error', 'warning'].includes(event.level)),
    ),
    evidenceCapturedAt: new Date().toISOString(),
  };
}

export async function snapshotPage(session) {
  session.lastSeen = Date.now();
  await session.page
    .waitForLoadState('domcontentloaded', { timeout: 10_000 })
    .catch(() => undefined);
  return session.page.evaluate(() => {
    const visible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const clean = (value, max = 300) =>
      String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max);
    const accessibleName = (element) =>
      clean(
        element.getAttribute('aria-label') ||
          element.getAttribute('title') ||
          element.textContent ||
          element.getAttribute('placeholder'),
      );
    const elements = [
      ...document.querySelectorAll(
        'button, a[href], input, select, textarea, [role="button"], [contenteditable="true"]',
      ),
    ]
      .filter(visible)
      .slice(0, 80);
    const controls = elements.map((element, index) => {
      const ref = `e${index + 1}`;
      element.setAttribute('data-studio-ref', ref);
      const tag = element.tagName.toLowerCase();
      const explicitRole = element.getAttribute('role');
      const role = explicitRole || (tag === 'a' ? 'link' : tag === 'button' ? 'button' : tag);
      return {
        ref,
        role,
        name: accessibleName(element),
        type: clean(element.getAttribute('type'), 40) || undefined,
        value: tag === 'select' ? clean(element.value, 500) : undefined,
        placeholder: clean(element.getAttribute('placeholder'), 160) || undefined,
        href: tag === 'a' ? clean(element.href, 1000) : undefined,
        disabled: Boolean(element.disabled || element.getAttribute('aria-disabled') === 'true'),
      };
    });
    const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      .filter(visible)
      .slice(0, 40)
      .map((element) => ({
        level: Number(element.tagName.slice(1)),
        text: clean(element.textContent, 240),
      }));
    return {
      title: clean(document.title, 300),
      url: window.location.href,
      visibleText: clean(document.body?.innerText, 6_000),
      headings,
      controls,
    };
  });
}

function scheduleFrame(session, delay = frameIntervalMs) {
  if (session.frameTimer || !session.streams.size || !sessions.has(session.id)) return;
  session.frameTimer = setTimeout(() => {
    session.frameTimer = undefined;
    void broadcastFrame(session);
  }, delay);
  session.frameTimer.unref();
}

async function broadcastFrame(session) {
  if (session.frameInFlight || !session.streams.size || !sessions.has(session.id)) return;
  session.frameInFlight = true;
  const startedAt = Date.now();
  try {
    const image = await session.page.screenshot({
      type: 'jpeg',
      quality: frameQuality,
      animations: 'disabled',
    });
    const header = `--studioframe\r\nContent-Type: image/jpeg\r\nContent-Length: ${image.length}\r\n\r\n`;
    for (const stream of [...session.streams]) {
      if (stream.destroyed) {
        session.streams.delete(stream);
        continue;
      }
      const headerWritable = stream.write(header);
      const imageWritable = stream.write(image);
      const boundaryWritable = stream.write('\r\n');
      if (!(headerWritable && imageWritable && boundaryWritable)) session.framesDropped += 1;
    }
    session.framesSent += 1;
  } catch {
    /* session may be navigating or closing */
  } finally {
    session.frameInFlight = false;
    scheduleFrame(session, Math.max(0, frameIntervalMs - (Date.now() - startedAt)));
  }
}

function streamFrames(req, res, session) {
  session.lastSeen = Date.now();
  res.writeHead(200, {
    ...corsHeaders(),
    'content-type': 'multipart/x-mixed-replace; boundary=studioframe',
    connection: 'keep-alive',
  });
  session.streams.add(res);
  req.on('close', () => {
    session.streams.delete(res);
    if (!session.streams.size && session.frameTimer) {
      clearTimeout(session.frameTimer);
      session.frameTimer = undefined;
    }
  });
  void broadcastFrame(session);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return json(res, 204, {});
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'GET' && url.pathname === '/health')
      return json(res, 200, {
        ok: true,
        service: 'studio-browser',
        engine: 'playwright-chromium',
        commit: process.env.GIT_SHA || 'MISSING',
        sessions: sessions.size,
        browserWarm: Boolean(browserPromise),
        frameIntervalMs,
      });
    if (req.method === 'POST' && url.pathname === '/sessions') {
      if (!sharedSecret || req.headers['x-studio-browser-secret'] !== sharedSecret)
        return json(res, 401, { error: 'Unauthorized' });
      const body = await readBody(req);
      const target = await validateTarget(String(body.url || 'https://www.elevateforhumanity.org'));
      const width = Math.min(1920, Math.max(320, Number(body.width || 1440)));
      const height = Math.min(1080, Math.max(480, Number(body.height || 900)));
      const session = await createSession(target, { width, height }, body.authCookies);
      return json(res, 201, {
        id: session.id,
        token: session.token,
        url: session.page.url(),
        viewport: { width, height },
        expiresAt: new Date(Date.now() + sessionTtlMs).toISOString(),
      });
    }
    const match = url.pathname.match(
      /^\/sessions\/([^/]+)(?:\/(stream|screenshot|snapshot|actions|events|audit))?$/,
    );
    if (!match) return json(res, 404, { error: 'Not found' });
    const session = sessions.get(match[1]);
    if (!session || !authorized(req, session, url))
      return json(res, 401, { error: 'Invalid or expired browser session' });
    if (req.method === 'GET' && match[2] === 'stream') return streamFrames(req, res, session);
    if (req.method === 'GET' && match[2] === 'screenshot') {
      const quality = Math.min(80, Math.max(35, Number(url.searchParams.get('quality') || 65)));
      const image = await session.page.screenshot({
        type: 'jpeg',
        quality,
        animations: 'disabled',
      });
      res.writeHead(200, {
        ...corsHeaders(),
        'content-type': 'image/jpeg',
        'content-length': image.length,
      });
      return res.end(image);
    }
    if (req.method === 'GET' && match[2] === 'events')
      return json(res, 200, { events: session.events, url: session.page.url() });
    if (req.method === 'GET' && match[2] === 'snapshot')
      return json(res, 200, await snapshotPage(session));
    if (req.method === 'GET' && match[2] === 'audit')
      return json(res, 200, await auditPage(session));
    if (req.method === 'POST' && match[2] === 'actions') {
      const metrics = await runActions(session, await readBody(req));
      return json(res, 200, { ok: true, url: session.page.url(), ...metrics });
    }
    if (req.method === 'DELETE' && !match[2]) {
      await destroySession(session.id);
      return json(res, 200, { ok: true });
    }
    return json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    json(res, 400, { error: error instanceof Error ? error.message : 'Browser request failed' });
  }
});

setInterval(() => {
  const cutoff = Date.now() - sessionTtlMs;
  for (const [id, session] of sessions) if (session.lastSeen < cutoff) void destroySession(id);
}, 30_000).unref();

async function shutdown() {
  await Promise.all([...sessions.keys()].map(destroySession));
  if (browserPromise) await (await browserPromise).close().catch(() => undefined);
  server.close(() => process.exit(0));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  server.listen(port, '0.0.0.0', () => {
    console.info(`Studio browser listening on ${port}`);
    void getBrowser().catch((error) =>
      console.error(
        'Studio browser pre-warm failed',
        error instanceof Error ? error.message : error,
      ),
    );
  });
}
