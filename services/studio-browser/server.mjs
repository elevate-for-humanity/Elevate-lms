import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import dns from 'node:dns/promises';
import net from 'node:net';
import { execFile, spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { chromium } from 'playwright-core';

const execFileAsync = promisify(execFile);

const port = Number(process.env.PORT || 3100);
const sharedSecret = process.env.STUDIO_BROWSER_SECRET || '';
const adminOrigin =
  process.env.STUDIO_BROWSER_ADMIN_ORIGIN || 'https://admin.elevateforhumanity.org';
const sessionTtlMs = Number(process.env.STUDIO_BROWSER_SESSION_TTL_MS || 15 * 60_000);
const maxSessions = Number(process.env.STUDIO_BROWSER_MAX_SESSIONS || 4);
const heartbeatIntervalMs = Math.max(
  5_000,
  Number(process.env.STUDIO_BROWSER_HEARTBEAT_INTERVAL_MS || 30_000),
);
const heartbeatTimeoutMs = Math.max(
  1_000,
  Number(process.env.STUDIO_BROWSER_HEARTBEAT_TIMEOUT_MS || 5_000),
);
const frameIntervalMs = Math.min(
  1000,
  Math.max(100, Number(process.env.STUDIO_BROWSER_FRAME_INTERVAL_MS || 160)),
);
const frameQuality = Math.min(
  80,
  Math.max(35, Number(process.env.STUDIO_BROWSER_FRAME_QUALITY || 60)),
);
const allowedDomains = (
  process.env.STUDIO_BROWSER_ALLOWED_DOMAINS || 'elevateforhumanity.org,envato.com'
)
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const sessions = new Map();
const workspaceRoot = process.env.STUDIO_WORKSPACE_ROOT || '/workspace/project';
const allowedExecCommands = new Set(['git', 'node', 'npm', 'npx', 'pnpm', 'python3', 'bash', 'ls', 'cat', 'grep', 'find', 'pwd']);
let shuttingDown = false;

function authorizedService(req) {
  const supplied = String(req.headers['x-studio-browser-secret'] || '');
  if (!sharedSecret || !supplied) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(sharedSecret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function safeWorkspacePath(relative = '') {
  const clean = String(relative || '').replace(/^\/+/, '');
  const resolved = path.resolve(workspaceRoot, clean);
  if (resolved !== workspaceRoot && !resolved.startsWith(workspaceRoot + path.sep))
    throw new BrowserServiceError('invalid_workspace_path', 400);
  return resolved;
}

async function listWorkspace(relative = '') {
  const dir = safeWorkspacePath(relative);
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  return Promise.all(entries.filter((entry) => entry.name !== 'node_modules' && entry.name !== '.git').slice(0, 500).map(async (entry) => {
    const full = path.join(dir, entry.name);
    const stat = await fs.promises.stat(full);
    return { name: entry.name, type: entry.isDirectory() ? 'directory' : 'file', size: stat.size, modifiedAt: stat.mtime.toISOString() };
  }));
}

async function executeWorkspaceCommand(body) {
  const command = String(body.command || '').trim();
  if (!command) throw new BrowserServiceError('command_required', 400);
  const [binary, ...args] = Array.isArray(body.args) ? [command, ...body.args.map(String)] : command.split(/\s+/);
  if (!allowedExecCommands.has(binary)) throw new BrowserServiceError('command_not_allowed', 400);
  const cwd = safeWorkspacePath(String(body.cwd || ''));
  const result = await execFileAsync(binary, args, {
    cwd,
    timeout: Math.min(120_000, Math.max(1_000, Number(body.timeoutMs || 30_000))),
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, HOME: '/home/studio' },
  });
  return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
}

export class BrowserServiceError extends Error {
  constructor(code, status, options = {}) {
    super(code, options);
    this.name = 'BrowserServiceError';
    this.code = code;
    this.status = status;
  }
}

function sanitizeReason(error) {
  const text = error instanceof Error ? error.message : String(error || 'unknown failure');
  return text
    .replace(/https?:\/\/[^\s]+/gi, '[url]')
    .replace(/(token|secret|cookie|authorization)\s*[=:]\s*[^\s,;]+/gi, '$1=[redacted]')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 240);
}

function isInfrastructureFailure(error) {
  const text = error instanceof Error ? error.message : String(error);
  return /browser.*(closed|disconnect|unavailable)|target.*closed|has been closed/i.test(text);
}

async function withTimeout(promise, timeoutMs, code = 'browser_unavailable') {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new BrowserServiceError(code, 503)), timeoutMs);
        timer.unref?.();
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function createBrowserLifecycleManager({
  launch = (options) => chromium.launch(options),
  onUnavailable = async () => {},
} = {}) {
  const lifecycle = {
    state: 'cold',
    generation: 0,
    launchTimestamp: null,
    lastSuccessfulHeartbeat: null,
    lastFailureTimestamp: null,
    lastFailureReason: null,
    consecutiveFailures: 0,
    restartCount: 0,
  };
  let browser;
  let launchInFlight;
  let recycleInFlight;
  let heartbeatInFlight;
  let intentionalClose = false;

  const connected = () => Boolean(browser?.isConnected?.());
  const fail = (error) => {
    lifecycle.state = 'failed';
    lifecycle.lastFailureTimestamp = new Date().toISOString();
    lifecycle.lastFailureReason = sanitizeReason(error);
    lifecycle.consecutiveFailures += 1;
  };
  const verify = async (candidate) => {
    const context = await candidate.newContext();
    try {
      const page = await context.newPage();
      await page.close();
    } finally {
      await context.close().catch(() => undefined);
    }
  };
  const launchBrowser = async () => {
    if (shuttingDown || lifecycle.state === 'shutting_down')
      throw new BrowserServiceError('browser_unavailable', 503);
    if (connected()) return browser;
    if (launchInFlight) return launchInFlight;
    lifecycle.state = 'starting';
    launchInFlight = (async () => {
      try {
        const candidate = await launch({
          headless: true,
          ...(process.env.STUDIO_BROWSER_EXECUTABLE_PATH
            ? { executablePath: process.env.STUDIO_BROWSER_EXECUTABLE_PATH }
            : {}),
          args: [
            '--disable-background-networking',
            '--disable-component-update',
            '--disable-dev-shm-usage',
            '--disable-renderer-backgrounding',
            '--no-first-run',
            '--no-sandbox',
          ],
        });
        await withTimeout(verify(candidate), heartbeatTimeoutMs);
        browser = candidate;
        lifecycle.generation += 1;
        lifecycle.launchTimestamp = new Date().toISOString();
        lifecycle.lastSuccessfulHeartbeat = lifecycle.launchTimestamp;
        lifecycle.consecutiveFailures = 0;
        lifecycle.lastFailureReason = null;
        lifecycle.state = 'ready';
        candidate.on('disconnected', () => {
          if (candidate !== browser || intentionalClose || shuttingDown) return;
          browser = undefined;
          fail(new Error('Chromium disconnected'));
          void onUnavailable('browser_disconnected');
          void recycleBrowser('browser_disconnected');
        });
        return candidate;
      } catch (error) {
        fail(error);
        throw new BrowserServiceError('browser_unavailable', 503, { cause: error });
      } finally {
        launchInFlight = undefined;
      }
    })();
    return launchInFlight;
  };
  const recycleBrowser = async (reason = 'administrative_recycle') => {
    if (shuttingDown) throw new BrowserServiceError('browser_unavailable', 503);
    if (recycleInFlight) return recycleInFlight;
    lifecycle.state = 'recycling';
    recycleInFlight = (async () => {
      const old = browser;
      browser = undefined;
      await onUnavailable(reason);
      intentionalClose = true;
      await old?.close?.().catch(() => undefined);
      intentionalClose = false;
      lifecycle.restartCount += 1;
      return launchBrowser();
    })().finally(() => {
      recycleInFlight = undefined;
    });
    return recycleInFlight;
  };
  const heartbeat = async () => {
    if (heartbeatInFlight || recycleInFlight || lifecycle.state !== 'ready') return false;
    heartbeatInFlight = (async () => {
      try {
        if (!connected()) throw new Error('Chromium disconnected');
        await withTimeout(verify(browser), heartbeatTimeoutMs);
        lifecycle.lastSuccessfulHeartbeat = new Date().toISOString();
        lifecycle.consecutiveFailures = 0;
        return true;
      } catch (error) {
        fail(error);
        await recycleBrowser('heartbeat_failed').catch(() => undefined);
        return false;
      } finally {
        heartbeatInFlight = undefined;
      }
    })();
    return heartbeatInFlight;
  };
  const health = () => ({
    browserState: lifecycle.state,
    browserConnected: connected(),
    browserGeneration: lifecycle.generation,
    browserLaunchTimestamp: lifecycle.launchTimestamp,
    lastSuccessfulHeartbeat: lifecycle.lastSuccessfulHeartbeat,
    restartCount: lifecycle.restartCount,
    consecutiveFailures: lifecycle.consecutiveFailures,
    lastFailureTimestamp: lifecycle.lastFailureTimestamp,
    lastFailureReason: lifecycle.lastFailureReason,
    recycling: Boolean(recycleInFlight),
  });
  const shutdown = async () => {
    lifecycle.state = 'shutting_down';
    intentionalClose = true;
    const old = browser;
    browser = undefined;
    await old?.close?.().catch(() => undefined);
  };
  return { getBrowser: launchBrowser, recycleBrowser, heartbeat, health, shutdown };
}

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json', ...corsHeaders() });
  res.end(JSON.stringify(body));
}

function corsHeaders() {
  return {
    'access-control-allow-origin': adminOrigin,
    'access-control-allow-headers': 'authorization,content-type,x-studio-browser-secret',
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
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
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new BrowserServiceError('invalid_target', 400);
  }
  if (!['http:', 'https:'].includes(url.protocol))
    throw new BrowserServiceError('invalid_target', 400);
  if (url.username || url.password) throw new BrowserServiceError('invalid_target', 400);
  if (url.port && !['80', '443'].includes(url.port))
    throw new BrowserServiceError('invalid_target', 400);
  const host = url.hostname.toLowerCase();
  if (
    allowedDomains.length &&
    !allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`))
  ) {
    throw new BrowserServiceError('invalid_target', 400);
  }
  const records = await dns.lookup(host, { all: true });
  if (!records.length || records.some((record) => isPrivateAddress(record.address)))
    throw new BrowserServiceError('invalid_target', 400);
  return url.toString();
}

function authorized(req, session, requestUrl) {
  const token =
    req.headers.authorization?.replace(/^Bearer\s+/i, '') || requestUrl.searchParams.get('token');
  if (!token) return false;
  const supplied = Buffer.from(token);
  const expected = Buffer.from(session.token);
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

async function destroySession(id) {
  const session = sessions.get(id);
  if (!session) return;
  sessions.delete(id);
  if (session.frameTimer) clearTimeout(session.frameTimer);
  for (const stream of session.streams) stream.end();
  await session.context.close().catch(() => undefined);
  await fs.promises
    .rm(session.downloadDir, { recursive: true, force: true })
    .catch(() => undefined);
}

function safeFileName(value) {
  return (
    String(value || 'download.bin')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 180) || 'download.bin'
  );
}

function videoContentType(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === '.mov' || extension === '.qt') return 'video/quicktime';
  if (extension === '.webm') return 'video/webm';
  if (extension === '.mp4' || extension === '.m4v') return 'video/mp4';
  return 'application/octet-stream';
}

async function normalizeDownloadedVideo(item) {
  if (path.extname(item.fileName).toLowerCase() !== '.zip') return item;
  const { stdout } = await execFileAsync('unzip', ['-l', item.filePath], {
    maxBuffer: 4 * 1024 * 1024,
  });
  const selected = stdout
    .split('\n')
    .map((line) => line.match(/^\s*(\d+)\s+\S+\s+\S+\s+(.+\.(?:mp4|mov|m4v|webm))\s*$/i))
    .filter(Boolean)
    .map((match) => ({ size: Number(match[1]), name: match[2] }))
    .sort((left, right) => right.size - left.size)[0];
  if (!selected) throw new Error('Envato archive did not contain a supported video file');
  const fileName = safeFileName(path.basename(selected.name));
  const extractedPath = path.join(path.dirname(item.filePath), `${item.id}-${fileName}`);
  const unzip = spawn('unzip', ['-p', item.filePath, selected.name], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let unzipError = '';
  unzip.stderr.on('data', (chunk) => {
    unzipError += chunk.toString();
  });
  await pipeline(unzip.stdout, fs.createWriteStream(extractedPath, { flags: 'wx' }));
  const unzipExit = await new Promise((resolve) => unzip.once('close', resolve));
  if (unzipExit !== 0) throw new Error(unzipError || 'Could not extract Envato video archive');
  await fs.promises.rm(item.filePath, { force: true });
  item.fileName = fileName;
  item.filePath = extractedPath;
  item.contentType = videoContentType(fileName);
  return item;
}

function tusMetadata(values) {
  return Object.entries(values)
    .map(([key, value]) => `${key} ${Buffer.from(String(value)).toString('base64')}`)
    .join(',');
}

async function resumableSignedUpload({
  endpoint,
  filePath,
  size,
  token,
  bucketName,
  objectName,
  contentType,
  onProgress,
}) {
  const created = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(size),
      'Upload-Metadata': tusMetadata({
        bucketName,
        objectName,
        contentType,
        cacheControl: '31536000',
      }),
      'x-signature': token,
    },
  });
  if (!created.ok) throw new Error(`Supabase upload initialization failed (${created.status})`);
  const location = created.headers.get('location');
  if (!location) throw new Error('Supabase upload location was not returned');
  const uploadUrl = new URL(location, endpoint);
  const handle = await fs.promises.open(filePath, 'r');
  let offset = 0;
  const chunkSize = 6 * 1024 * 1024;
  try {
    while (offset < size) {
      const length = Math.min(chunkSize, size - offset);
      const chunk = Buffer.allocUnsafe(length);
      const { bytesRead } = await handle.read(chunk, 0, length, offset);
      if (!bytesRead) throw new Error('Downloaded media ended before upload completed');
      const response = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          'Tus-Resumable': '1.0.0',
          'Upload-Offset': String(offset),
          'Content-Type': 'application/offset+octet-stream',
          'Content-Length': String(bytesRead),
          'x-signature': token,
        },
        body: chunk.subarray(0, bytesRead),
      });
      if (!response.ok) throw new Error(`Supabase upload chunk failed (${response.status})`);
      offset = Number(response.headers.get('upload-offset') || offset + bytesRead);
      onProgress(offset, size);
    }
  } finally {
    await handle.close();
  }
}

async function uploadDownloadToSignedStorage(session, body) {
  const download = session.downloads.get(String(body.downloadId || ''));
  if (!download || download.status !== 'ready')
    throw new BrowserServiceError('download_not_ready', 409);
  const endpoint = new URL(String(body.endpoint || ''));
  if (
    endpoint.protocol !== 'https:' ||
    !endpoint.hostname.endsWith('.storage.supabase.co') ||
    endpoint.pathname !== '/storage/v1/upload/resumable'
  )
    throw new BrowserServiceError('invalid_upload_target', 400);
  const bucketName = String(body.bucket || '');
  const objectName = String(body.storagePath || '');
  const token = String(body.token || '');
  if (
    bucketName !== 'course_videos' ||
    !objectName.startsWith('licensed-library/envato/') ||
    !token ||
    token.length > 4096
  )
    throw new BrowserServiceError('invalid_upload_target', 400);
  download.status = 'uploading';
  try {
    await resumableSignedUpload({
      endpoint: endpoint.toString(),
      filePath: download.filePath,
      size: download.size,
      token,
      bucketName,
      objectName,
      contentType: download.contentType,
      onProgress(bytesUploaded, bytesTotal) {
        download.bytesUploaded = bytesUploaded;
        download.uploadProgress = bytesTotal ? Math.round((bytesUploaded / bytesTotal) * 100) : 0;
      },
    });
    download.status = 'stored';
    download.uploadProgress = 100;
    await fs.promises.rm(download.filePath, { force: true }).catch(() => undefined);
    return { ok: true, downloadId: download.id, size: download.size };
  } catch (error) {
    download.status = 'ready';
    download.error = sanitizeReason(error);
    throw new BrowserServiceError('storage_upload_failed', 502, { cause: error });
  }
}

const browserManager = createBrowserLifecycleManager({
  onUnavailable: async () => {
    await Promise.all([...sessions.keys()].map(destroySession));
  },
});

async function createSession(target, viewport, authCookies = []) {
  if (shuttingDown) throw new BrowserServiceError('browser_unavailable', 503);
  const state = browserManager.health().browserState;
  if (state === 'recycling') throw new BrowserServiceError('browser_recycling', 503);
  if (sessions.size >= maxSessions) throw new BrowserServiceError('session_capacity_reached', 429);
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
  let attempt = 0;
  while (attempt < 2) {
    let context;
    let page;
    try {
      const browser = await browserManager.getBrowser();
      context = await browser.newContext({
        viewport,
        ignoreHTTPSErrors: false,
        acceptDownloads: true,
      });
      if (
        safeAuthCookies.length &&
        (targetUrl.hostname === 'elevateforhumanity.org' ||
          targetUrl.hostname.endsWith('.elevateforhumanity.org'))
      )
        await context.addCookies(safeAuthCookies);
      page = await context.newPage();
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      const id = crypto.randomUUID();
      const token = crypto.randomBytes(32).toString('base64url');
      const downloadDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'studio-browser-'));
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
        downloads: new Map(),
        downloadDir,
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
      page.on('download', (download) => {
        const id = crypto.randomUUID();
        const fileName = safeFileName(download.suggestedFilename());
        const filePath = path.join(downloadDir, `${id}-${fileName}`);
        const item = {
          id,
          fileName,
          filePath,
          contentType: videoContentType(fileName),
          size: 0,
          status: 'downloading',
          uploadProgress: 0,
          createdAt: new Date().toISOString(),
          sourceUrl: page.url(),
        };
        session.downloads.set(id, item);
        record('download', { downloadId: id, fileName, status: 'downloading' });
        void download
          .saveAs(filePath)
          .then(async () => {
            await normalizeDownloadedVideo(item);
            const stat = await fs.promises.stat(item.filePath);
            item.size = stat.size;
            item.status = 'ready';
            record('download', { downloadId: id, fileName, size: stat.size, status: 'ready' });
          })
          .catch((error) => {
            item.status = 'failed';
            item.error = sanitizeReason(error);
            record('download', { downloadId: id, fileName, status: 'failed', error: item.error });
          });
      });
      sessions.set(id, session);
      return session;
    } catch (error) {
      await page?.close?.().catch(() => undefined);
      await context?.close?.().catch(() => undefined);
      if (attempt === 0 && isInfrastructureFailure(error)) {
        attempt += 1;
        await browserManager.recycleBrowser('session_creation_failed');
        continue;
      }
      if (error?.name === 'TimeoutError')
        throw new BrowserServiceError('navigation_timeout', 504, { cause: error });
      if (error instanceof BrowserServiceError) throw error;
      throw new BrowserServiceError('browser_unavailable', 503, { cause: error });
    }
  }
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
    if (req.method === 'GET' && url.pathname === '/health') {
      const lifecycle = browserManager.health();
      const ready =
        lifecycle.browserState === 'ready' &&
        lifecycle.browserConnected &&
        sessions.size < maxSessions;
      return json(res, ready ? 200 : 503, {
        ok: ready,
        service: 'studio-browser',
        engine: 'playwright-chromium',
        commit: process.env.GIT_SHA || 'MISSING',
        ...lifecycle,
        activeSessions: sessions.size,
        maxSessions,
        ready,
      });
    }
    if (url.pathname === '/workspace/files' && req.method === 'GET') {
      if (!authorizedService(req)) return json(res, 401, { error: 'unauthorized' });
      return json(res, 200, { root: workspaceRoot, entries: await listWorkspace(url.searchParams.get('path') || '') });
    }
    if (url.pathname === '/workspace/file' && req.method === 'GET') {
      if (!authorizedService(req)) return json(res, 401, { error: 'unauthorized' });
      const filePath = safeWorkspacePath(url.searchParams.get('path') || '');
      const stat = await fs.promises.stat(filePath);
      if (!stat.isFile() || stat.size > 10 * 1024 * 1024) throw new BrowserServiceError('invalid_workspace_file', 400);
      return json(res, 200, { content: await fs.promises.readFile(filePath, 'utf8'), size: stat.size });
    }
    if (url.pathname === '/workspace/file' && req.method === 'PUT') {
      if (!authorizedService(req)) return json(res, 401, { error: 'unauthorized' });
      const body = await readBody(req);
      const filePath = safeWorkspacePath(body.path || '');
      const content = String(body.content ?? '');
      if (Buffer.byteLength(content) > 10 * 1024 * 1024) throw new BrowserServiceError('workspace_file_too_large', 413);
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, content, 'utf8');
      return json(res, 200, { ok: true });
    }
    if (url.pathname === '/workspace/exec' && req.method === 'POST') {
      if (!authorizedService(req)) return json(res, 401, { error: 'unauthorized' });
      try {
        return json(res, 200, await executeWorkspaceCommand(await readBody(req)));
      } catch (error) {
        if (error instanceof BrowserServiceError) throw error;
        return json(res, 200, { stdout: error?.stdout || '', stderr: error?.stderr || sanitizeReason(error), exitCode: Number(error?.code) || 1 });
      }
    }
    if (req.method === 'POST' && url.pathname === '/admin/recycle') {
      if (!sharedSecret || req.headers['x-studio-browser-secret'] !== sharedSecret)
        return json(res, 401, { error: 'unauthorized' });
      const before = browserManager.health();
      if (before.recycling)
        return json(res, 202, { status: 'running', browserGeneration: before.browserGeneration });
      const body = await readBody(req);
      const correlationId = String(body.correlationId || crypto.randomUUID()).slice(0, 100);
      void browserManager.recycleBrowser(
        String(body.reason || 'administrative_recycle').slice(0, 120),
      );
      return json(res, 202, {
        status: 'queued',
        correlationId,
        browserGeneration: before.browserGeneration,
      });
    }
    if (req.method === 'POST' && url.pathname === '/sessions') {
      if (!sharedSecret || req.headers['x-studio-browser-secret'] !== sharedSecret)
        return json(res, 401, { error: 'unauthorized' });
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
      /^\/sessions\/([^/]+)(?:\/(stream|screenshot|snapshot|actions|events|audit|downloads|imports))?$/,
    );
    if (!match) return json(res, 404, { error: 'Not found' });
    const session = sessions.get(match[1]);
    if (!session) return json(res, 410, { error: 'session_expired' });
    if (!authorized(req, session, url)) return json(res, 401, { error: 'unauthorized' });
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
    if (req.method === 'GET' && match[2] === 'downloads')
      return json(res, 200, {
        downloads: [...session.downloads.values()].map(({ filePath, ...download }) => download),
      });
    if (req.method === 'GET' && match[2] === 'snapshot')
      return json(res, 200, await snapshotPage(session));
    if (req.method === 'GET' && match[2] === 'audit')
      return json(res, 200, await auditPage(session));
    if (req.method === 'POST' && match[2] === 'actions') {
      const metrics = await runActions(session, await readBody(req));
      return json(res, 200, { ok: true, url: session.page.url(), ...metrics });
    }
    if (req.method === 'POST' && match[2] === 'imports')
      return json(res, 200, await uploadDownloadToSignedStorage(session, await readBody(req)));
    if (req.method === 'DELETE' && !match[2]) {
      await destroySession(session.id);
      return json(res, 200, { ok: true });
    }
    return json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    const status = error instanceof BrowserServiceError ? error.status : 500;
    const code = error instanceof BrowserServiceError ? error.code : 'worker_failure';
    json(res, status, { error: code, retryable: status === 429 || status === 503 });
  }
});

const cleanupTimer = setInterval(() => {
  const cutoff = Date.now() - sessionTtlMs;
  for (const [id, session] of sessions) if (session.lastSeen < cutoff) void destroySession(id);
}, 30_000).unref();

const heartbeatTimer = setInterval(() => {
  void browserManager.heartbeat();
}, heartbeatIntervalMs);
heartbeatTimer.unref();

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(cleanupTimer);
  clearInterval(heartbeatTimer);
  await withTimeout(
    Promise.all([...sessions.keys()].map(destroySession)).then(() => browserManager.shutdown()),
    10_000,
  ).catch(() => undefined);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  server.listen(port, '0.0.0.0', () => {
    console.info(`Studio browser listening on ${port}`);
    void browserManager
      .getBrowser()
      .catch((error) =>
        console.error(
          'Studio browser pre-warm failed',
          error instanceof Error ? error.message : error,
        ),
      );
  });
}
