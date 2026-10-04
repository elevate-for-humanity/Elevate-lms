import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { launchConnection } from './cdp-transport.mjs';
import { locator, getByTestId, getByText, getByRole } from './cdp-dom.mjs';
import { captureStorage, restoreStorage } from './cdp-storage.mjs';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const execFileAsync = promisify(execFile);
const timeoutError = (label) =>
  Object.assign(new Error(`Timed out: ${label}`), { name: 'TimeoutError' });
const serial = (value) => (value === undefined ? 'undefined' : JSON.stringify(value));

export async function launchBrowser(options = {}) {
  const launched = await launchConnection(options);
  const browser = new CdpBrowser(launched);
  try {
    await browser.initialize();
    return browser;
  } catch (error) {
    await launched.close();
    throw error;
  }
}

class CdpBrowser extends EventEmitter {
  constructor(launched) {
    super();
    this.launched = launched;
    this.connection = launched.connection;
    this.contexts = new Map();
    this.targets = new Map();
    this.downloads = new Map();
    this.frameSessions = new Map();
    this.connection.on('event', (event) => {
      void this.dispatch(event).catch((error) => this.emit('runtimeerror', error));
    });
    this.connection.on('disconnected', () => {
      for (const ctx of this.contexts.values()) for (const page of ctx.pages()) page.didClose();
      for (const download of this.downloads.values()) {
        clearTimeout(download.timer);
        download.reject(new Error('Browser disconnected'));
      }
      this.downloads.clear();
      for (const context of [...this.contexts.values()])
        void context.close().catch(() => undefined);
      this.emit('disconnected');
    });
  }
  send(method, params = {}) {
    return this.connection.send(method, params);
  }
  async initialize() {
    await this.send('Target.setDiscoverTargets', { discover: true });
    await this.send('Target.setAutoAttach', {
      autoAttach: true,
      waitForDebuggerOnStart: true,
      flatten: true,
    });
  }
  isConnected() {
    return this.connection.connected;
  }
  async newContext(options = {}) {
    const { browserContextId } = await this.send('Target.createBrowserContext', {
      disposeOnDetach: true,
    });
    const ctx = new CdpContext(this, browserContextId, options);
    this.contexts.set(browserContextId, ctx);
    try {
      await ctx.initialize();
      return ctx;
    } catch (error) {
      await ctx.close();
      throw error;
    }
  }
  async dispatch(event) {
    const { method, params: p = {}, sessionId } = event;
    if (method === 'Target.attachedToTarget') {
      const ctx = this.contexts.get(p.targetInfo.browserContextId);
      if (ctx && p.targetInfo.type === 'page') {
        const page = new CdpPage(ctx, p.targetInfo, p.sessionId);
        this.targets.set(page.id, page);
        ctx.pageMap.set(page.id, page);
        page.ready = page
          .initialize()
          .then(() => {
            ctx.emit('page', page);
            const opener = this.targets.get(p.targetInfo.openerId);
            opener?.emit('popup', page);
            return page;
          })
          .catch(async (error) => {
            page.initError = error;
            await page.close().catch(() => page.didClose());
            throw error;
          });
        page.ready.catch(() => undefined);
      } else if (p.targetInfo.type === 'iframe') {
        const page =
          [...this.targets.values()].find(
            (page) => page.sessionId === sessionId || page.frameMap.has(p.targetInfo.targetId),
          ) || this.frameSessions.get(sessionId)?.page;
        try {
          if (page) {
            const frame =
              page.frameMap.get(p.targetInfo.targetId) ||
              new CdpFrame(page, p.targetInfo.targetId, p.targetInfo.url);
            frame.sessionId = p.sessionId;
            page.frameMap.set(frame.id, frame);
            this.frameSessions.set(p.sessionId, { page, frame });
            for (const method of ['Page.enable', 'Runtime.enable', 'Network.enable'])
              await this.connection.send(method, {}, p.sessionId);
            await this.connection.send(
              'Page.setInterceptFileChooserDialog',
              { enabled: true },
              p.sessionId,
            );
            await this.connection.send(
              'Target.setAutoAttach',
              { autoAttach: true, waitForDebuggerOnStart: true, flatten: true },
              p.sessionId,
            );
          }
        } finally {
          // A failed domain initialization must not freeze an attached iframe.
          await this.connection
            .send('Runtime.runIfWaitingForDebugger', {}, p.sessionId)
            .catch(() => undefined);
        }
      } else {
        // Unowned startup tabs and worker targets must never remain paused.
        await this.connection
          .send('Runtime.runIfWaitingForDebugger', {}, p.sessionId)
          .catch(() => undefined);
      }
      return;
    }
    if (method === 'Target.targetDestroyed' || method === 'Target.targetCrashed') {
      this.targets.get(p.targetId)?.didClose();
      return;
    }
    if (method === 'Target.detachedFromTarget') {
      this.frameSessions.delete(p.sessionId);
      [...this.targets.values()].find((page) => page.sessionId === p.sessionId)?.didClose();
      return;
    }
    if (method === 'Target.targetInfoChanged') {
      const page = this.targets.get(p.targetInfo.targetId);
      if (page) page.currentUrl = p.targetInfo.url;
      return;
    }
    if (method === 'Browser.downloadWillBegin') {
      const page = [...this.targets.values()].find((page) => page.frameMap.has(p.frameId));
      if (!page) return;
      let resolve, reject;
      const done = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
      });
      done.catch(() => undefined);
      const item = {
        resolve,
        reject,
        context: page.context,
        timer: setTimeout(() => {
          reject(timeoutError('download'));
          this.downloads.delete(p.guid);
        }, 30 * 60_000),
      };
      item.timer.unref();
      this.downloads.set(p.guid, item);
      page.emit('download', {
        suggestedFilename: () => p.suggestedFilename,
        saveAs: async (destination) => {
          await done;
          await fs.copyFile(path.join(page.context.downloadDir, p.guid), destination);
          await fs.rm(path.join(page.context.downloadDir, p.guid), { force: true });
        },
      });
      return;
    }
    if (method === 'Browser.downloadProgress') {
      const item = this.downloads.get(p.guid);
      if (item && ['completed', 'canceled'].includes(p.state)) {
        clearTimeout(item.timer);
        this.downloads.delete(p.guid);
        if (p.state === 'completed') item.resolve();
        else item.reject(new Error('Download canceled'));
      }
      return;
    }
    const page =
      [...this.targets.values()].find((page) => page.sessionId === sessionId) ||
      this.frameSessions.get(sessionId)?.page;
    if (page) await page.dispatch(method, p, sessionId);
  }
  async close() {
    for (const context of [...this.contexts.values()]) await context.close().catch(() => undefined);
    await this.launched.close();
  }
}

class CdpContext extends EventEmitter {
  constructor(browser, id, options) {
    super();
    this.browser = browser;
    this.id = id;
    this.options = options;
    this.pageMap = new Map();
    this.storageOrigins = new Set();
    this.routes = [];
    this.request = Object.fromEntries(
      ['get', 'post', 'put', 'delete'].map((method) => [
        method,
        (url, options) => this.fetch(url, method.toUpperCase(), options),
      ]),
    );
    this.tracing = {
      start: async () => {
        this.trace = [];
        this.traceStarted = Date.now();
      },
      stop: async ({ path: destination }) => {
        // Explicit CDP evidence archive, not a Playwright trace masquerading as one.
        const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'studio-cdp-trace-'));
        try {
          await fs.writeFile(
            path.join(directory, 'cdp-evidence.json'),
            JSON.stringify({
              format: 'studio-cdp-evidence-v1',
              startedAt: this.traceStarted,
              events: this.trace || [],
            }),
          );
          await execFileAsync('zip', ['-q', destination, 'cdp-evidence.json'], { cwd: directory });
        } finally {
          this.trace = null;
          await fs.rm(directory, { recursive: true, force: true });
        }
      },
    };
  }
  send(method, params = {}) {
    return this.browser.send(method, params);
  }
  pages() {
    return [...this.pageMap.values()].filter((p) => !p.closed);
  }
  async initialize() {
    this.downloadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'studio-cdp-downloads-'));
    await this.send('Browser.setDownloadBehavior', {
      behavior: 'allowAndName',
      browserContextId: this.id,
      downloadPath: this.downloadDir,
      eventsEnabled: true,
    });
    if (this.options.storageState) await restoreStorage(this, this.options.storageState);
  }
  async newPage() {
    const { targetId } = await this.send('Target.createTarget', {
      url: 'about:blank',
      browserContextId: this.id,
    });
    const end = Date.now() + 15000;
    while (!this.pageMap.has(targetId)) {
      if (!this.browser.isConnected()) throw new Error('Browser disconnected');
      if (Date.now() > end) throw timeoutError('CDP page attachment');
      await delay(10);
    }
    return this.pageMap.get(targetId).ready;
  }
  async route(pattern, handler) {
    this.routes.push({ pattern, handler });
    for (const page of this.pages()) await page.enableRoutes();
  }
  async withStorageOrigin(origin, callback) {
    const page = await this.newPage();
    page.storageRestore = true;
    try {
      await page.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
      await page.goto(origin + '/');
      return await callback(page);
    } finally {
      await page.close();
    }
  }
  async addCookies(cookies) {
    if (!cookies?.length) return;
    const allowed = [
      'name',
      'value',
      'url',
      'domain',
      'path',
      'secure',
      'httpOnly',
      'sameSite',
      'expires',
      'priority',
      'sameParty',
      'sourceScheme',
      'partitionKey',
    ];
    await this.send('Storage.setCookies', {
      browserContextId: this.id,
      cookies: cookies.map((cookie) => {
        const value = Object.fromEntries(
          Object.entries(cookie).filter(
            ([k, v]) => allowed.includes(k) && v !== undefined && !(k === 'expires' && v <= 0),
          ),
        );
        if (typeof value.partitionKey === 'string')
          value.partitionKey = {
            topLevelSite: value.partitionKey,
            hasCrossSiteAncestor: cookie._crHasCrossSiteAncestor ?? true,
          };
        return value;
      }),
    });
  }
  async cookies() {
    return (await this.send('Storage.getCookies', { browserContextId: this.id })).cookies;
  }
  storageState(options) {
    return captureStorage(this, options);
  }
  async fetch(input, method, options = {}) {
    let url = new URL(input),
      headers = { ...options.headers };
    let data = options.data;
    if (data !== undefined && !Buffer.isBuffer(data) && typeof data !== 'string') {
      data = JSON.stringify(data);
      headers['content-type'] ||= 'application/json';
    }
    for (let i = 0; i < 10; i++) {
      const cookies = (await this.cookies()).filter((c) => {
        const domain = c.domain.replace(/^\./, '');
        return (
          (url.hostname === domain ||
            (c.domain.startsWith('.') && url.hostname.endsWith('.' + domain))) &&
          (url.pathname === c.path ||
            url.pathname.startsWith(c.path.endsWith('/') ? c.path : c.path + '/')) &&
          (!c.secure || url.protocol === 'https:')
        );
      });
      const response = await fetch(url, {
        method,
        headers: {
          ...headers,
          ...(cookies.length
            ? { cookie: cookies.map((c) => `${c.name}=${c.value}`).join('; ') }
            : {}),
        },
        body: data,
        redirect: 'manual',
        signal: AbortSignal.timeout(30000),
      });
      for (const line of response.headers.getSetCookie()) {
        const [pair, ...attributes] = line.split(';');
        const split = pair.indexOf('=');
        if (split < 1) continue;
        const cookie = {
          name: pair.slice(0, split).trim(),
          value: pair.slice(split + 1),
          url: url.origin,
          path: '/',
        };
        for (const attr of attributes) {
          const [key, ...rest] = attr.trim().split('=');
          const value = rest.join('=');
          if (key.toLowerCase() === 'path') cookie.path = value;
          if (key.toLowerCase() === 'secure') cookie.secure = true;
          if (key.toLowerCase() === 'httponly') cookie.httpOnly = true;
          if (key.toLowerCase() === 'samesite')
            cookie.sameSite = value[0]?.toUpperCase() + value.slice(1).toLowerCase();
          if (key.toLowerCase() === 'max-age') cookie.expires = Date.now() / 1000 + Number(value);
          if (key.toLowerCase() === 'expires' && cookie.expires === undefined)
            cookie.expires = Date.parse(value) / 1000;
          if (key.toLowerCase() === 'domain') {
            const domain = value.replace(/^\./, '').toLowerCase();
            if (url.hostname === domain || url.hostname.endsWith('.' + domain)) {
              cookie.domain = value;
              delete cookie.url;
            }
          }
        }
        if (cookie.expires !== undefined && cookie.expires <= Date.now() / 1000) {
          const page = this.pages()[0] || (await this.newPage());
          await page.send('Network.deleteCookies', {
            name: cookie.name,
            url: url.toString(),
            ...(cookie.domain ? { domain: cookie.domain } : {}),
            path: cookie.path,
          });
        } else await this.addCookies([cookie]);
      }
      if ([301, 302, 303, 307, 308].includes(response.status) && response.headers.get('location')) {
        const next = new URL(response.headers.get('location'), url);
        if (next.origin !== url.origin)
          headers = Object.fromEntries(
            Object.entries(headers).filter(
              ([k]) => !['authorization', 'cookie'].includes(k.toLowerCase()),
            ),
          );
        if (
          response.status === 303 ||
          ([301, 302].includes(response.status) && method === 'POST')
        ) {
          method = 'GET';
          data = undefined;
        }
        url = next;
        continue;
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      return {
        ok: () => response.ok,
        status: () => response.status,
        text: async () => bytes.toString(),
        json: async () => JSON.parse(bytes.toString()),
      };
    }
    throw new Error('Too many request redirects');
  }
  async close() {
    if (this.closed) return;
    this.closed = true;
    await this.send('Target.disposeBrowserContext', { browserContextId: this.id }).catch(
      () => undefined,
    );
    for (const page of this.pages()) page.didClose();
    this.browser.contexts.delete(this.id);
    for (const [id, item] of this.browser.downloads)
      if (item.context === this) {
        clearTimeout(item.timer);
        item.reject(new Error('Browser context closed'));
        this.browser.downloads.delete(id);
      }
    if (this.downloadDir) await fs.rm(this.downloadDir, { recursive: true, force: true });
  }
}

class CdpFrame {
  constructor(page, id, url = '') {
    this.page = page;
    this.id = id;
    this.currentUrl = url;
  }
  url() {
    return this.currentUrl;
  }
  locator(selector) {
    return locator(this, selector);
  }
  getByTestId(id) {
    return getByTestId(this, id);
  }
  getByText(text, options) {
    return getByText(this, text, options);
  }
  getByRole(role, options) {
    return getByRole(this, role, options);
  }
  async evaluate(fn, arg) {
    const expression = typeof fn === 'function' ? `(${fn.toString()})(${serial(arg)})` : String(fn);
    const page = this.page;
    const end = Date.now() + 10000;
    while (!this.executionContextId) {
      if (page.closed) throw new Error('Target closed');
      if (Date.now() > end) throw timeoutError('frame execution context');
      await delay(10);
    }
    const result = await page.browser.connection.send(
      'Runtime.evaluate',
      {
        expression,
        contextId: this.executionContextId,
        returnByValue: true,
        awaitPromise: true,
        userGesture: true,
      },
      this.sessionId || page.sessionId,
      60000,
    );
    if (result.exceptionDetails)
      throw new Error(
        result.exceptionDetails.exception?.description ||
          result.exceptionDetails.text ||
          'Page evaluation failed',
      );
    return result.result.value;
  }
  async offset() {
    if (this === this.page || !this.parentId) return { x: 0, y: 0 };
    const { backendNodeId } = await this.page.send('DOM.getFrameOwner', { frameId: this.id });
    const { model } = await this.page.send('DOM.getBoxModel', { backendNodeId });
    return { x: model.content[0], y: model.content[1] };
  }
}

class CdpPage extends EventEmitter {
  constructor(context, target, sessionId) {
    super();
    this.context = context;
    this.browser = context.browser;
    this.id = target.targetId;
    this.sessionId = sessionId;
    this.currentUrl = target.url;
    this.page = this;
    this.closed = false;
    this.frameMap = new Map();
    this.requests = new Map();
    this.lifecycle = new Map();
    this.viewport = context.options.viewport || { width: 1280, height: 720 };
    this.request = context.request;
    this.pointer = { x: 0, y: 0, buttons: 0 };
    this.keyboard = {
      insertText: (text) => this.send('Input.insertText', { text }),
      press: (key) => this.pressKey(key),
    };
    this.mouse = {
      move: async (x, y) => {
        this.pointer.x = x;
        this.pointer.y = y;
        await this.pointerEvent('mouseMoved');
      },
      down: (options) => this.pointerEvent('mousePressed', options),
      up: (options) => this.pointerEvent('mouseReleased', options),
      click: async (x, y, options = {}) => {
        await this.mouse.move(x, y);
        for (let n = 1; n <= (options.clickCount || 1); n++) {
          await this.mouse.down({ ...options, clickCount: n });
          await this.mouse.up({ ...options, clickCount: n });
        }
      },
      wheel: (deltaX, deltaY) => this.pointerEvent('mouseWheel', { deltaX, deltaY }),
    };
  }
  send(method, params = {}, timeout) {
    return this.browser.connection.send(method, params, this.sessionId, timeout);
  }
  async initialize() {
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('Network.enable');
    await this.send('Page.setLifecycleEventsEnabled', { enabled: true });
    await this.send('Page.setInterceptFileChooserDialog', { enabled: true });
    await this.send('Target.setAutoAttach', {
      autoAttach: true,
      waitForDebuggerOnStart: true,
      flatten: true,
    });
    const { frameTree } = await this.send('Page.getFrameTree');
    this.mainFrameId = frameTree.frame.id;
    const visit = (tree) => {
      this.updateFrame(tree.frame);
      for (const child of tree.childFrames || []) visit(child);
    };
    visit(frameTree);
    await this.setViewportSize(this.viewport);
    if (this.context.options.reducedMotion)
      await this.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: this.context.options.reducedMotion }],
      });
    await this.enableRoutes();
    await this.send('Runtime.runIfWaitingForDebugger');
    return this;
  }
  updateFrame(frame) {
    let existing = this.frameMap.get(frame.id);
    if (!existing) {
      existing = new CdpFrame(this, frame.id, frame.url);
      this.frameMap.set(frame.id, existing);
    }
    existing.currentUrl = frame.url;
    existing.parentId = frame.parentId;
    existing.loaderId = frame.loaderId;
    if (!frame.parentId) {
      this.mainFrameId = frame.id;
      this.currentUrl = frame.url;
    }
    try {
      const origin = new URL(frame.url).origin;
      if (origin !== 'null') this.context.storageOrigins.add(origin);
    } catch {
      // Blank and internal frame URLs do not contribute a restorable origin.
    }
    return existing;
  }
  async dispatch(method, p, sourceSessionId = this.sessionId) {
    const targetSend = (method, params) =>
      this.browser.connection.send(method, params, sourceSessionId);
    if (
      this.context.trace &&
      this.context.trace.length < 10000 &&
      /^(Page\.(frameNavigated|loadEventFired)|Network\.(loadingFailed|responseReceived))$/.test(
        method,
      )
    ) {
      this.context.trace.push({
        at: Date.now(),
        method,
        targetId: this.id,
        ...(p.response ? { status: p.response.status } : {}),
      });
    }
    if (method === 'Runtime.executionContextCreated' && p.context.auxData?.isDefault) {
      const id = p.context.auxData.frameId;
      let frame = this.frameMap.get(id);
      if (!frame) {
        frame = new CdpFrame(this, id);
        this.frameMap.set(id, frame);
      }
      frame.executionContextId = p.context.id;
      frame.sessionId = sourceSessionId;
    }
    if (method === 'Runtime.executionContextDestroyed')
      for (const frame of this.frameMap.values())
        if (
          frame.sessionId === sourceSessionId &&
          frame.executionContextId === p.executionContextId
        )
          frame.executionContextId = undefined;
    if (method === 'Runtime.executionContextsCleared')
      for (const frame of this.frameMap.values())
        if (frame.sessionId === sourceSessionId) frame.executionContextId = undefined;
    if (method === 'Page.frameNavigated') {
      const existing = this.frameMap.get(p.frame.id);
      this.updateFrame({
        ...p.frame,
        ...(sourceSessionId !== this.sessionId
          ? { parentId: existing?.parentId || this.mainFrameId }
          : {}),
      });
      this.emit('framenavigated', this.frameMap.get(p.frame.id));
    }
    if (method === 'Page.navigatedWithinDocument') {
      const frame = this.frameMap.get(p.frameId);
      if (frame) frame.currentUrl = p.url;
      if (p.frameId === this.mainFrameId) this.currentUrl = p.url;
      this.emit('framenavigated', frame);
    }
    if (method === 'Page.frameDetached' && p.reason !== 'swap') this.frameMap.delete(p.frameId);
    if (method === 'Page.lifecycleEvent') {
      this.lifecycle.set(`${p.loaderId}:${p.name}`, true);
      if (this.lifecycle.size > 200) this.lifecycle.delete(this.lifecycle.keys().next().value);
      this.emit('lifecycle', p);
    }
    if (method === 'Inspector.targetCrashed') this.didClose();
    if (method === 'Runtime.consoleAPICalled')
      this.emit('console', {
        type: () => p.type,
        text: () => p.args.map((a) => a.value ?? a.description ?? '').join(' '),
      });
    if (method === 'Runtime.exceptionThrown')
      this.emit(
        'pageerror',
        new Error(p.exceptionDetails.exception?.description || p.exceptionDetails.text),
      );
    if (method === 'Network.requestWillBeSent') this.requests.set(p.requestId, p.request.url);
    if (method === 'Network.responseReceived')
      this.emit('response', { status: () => p.response.status, url: () => p.response.url });
    if (method === 'Network.loadingFinished') this.requests.delete(p.requestId);
    if (method === 'Network.loadingFailed') {
      const url = this.requests.get(p.requestId) || '';
      this.requests.delete(p.requestId);
      this.emit('requestfailed', { url: () => url, failure: () => ({ errorText: p.errorText }) });
    }
    if (method === 'Page.javascriptDialogOpening')
      this.emit('dialog', {
        type: () => p.type,
        message: () => p.message,
        accept: (text) =>
          targetSend('Page.handleJavaScriptDialog', { accept: true, promptText: text || '' }),
        dismiss: () => targetSend('Page.handleJavaScriptDialog', { accept: false }),
      });
    if (method === 'Page.fileChooserOpened')
      this.emit('filechooser', {
        isMultiple: () => p.mode === 'selectMultiple',
        setFiles: (files) =>
          targetSend('DOM.setFileInputFiles', { files, backendNodeId: p.backendNodeId }),
      });
    if (method === 'Fetch.requestPaused') {
      if (this.storageRestore) {
        await this.send('Fetch.fulfillRequest', {
          requestId: p.requestId,
          responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
          body: Buffer.from('<!doctype html><title>Storage restore</title>').toString('base64'),
        });
        return;
      }
      const route = this.context.routes.find((r) =>
        new RegExp(
          '^' +
            r.pattern
              .split('**')
              .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
              .join('.*') +
            '$',
        ).test(p.request.url),
      );
      if (route)
        await route.handler({
          fulfill: ({ status = 200, contentType = 'text/html', body = '' }) =>
            this.send('Fetch.fulfillRequest', {
              requestId: p.requestId,
              responseCode: status,
              responseHeaders: [{ name: 'Content-Type', value: contentType }],
              body: Buffer.from(body).toString('base64'),
            }),
        });
      else await this.send('Fetch.continueRequest', { requestId: p.requestId });
    }
  }
  async enableRoutes() {
    if (this.context.routes.length)
      await this.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  }
  frames() {
    const main = this.frameMap.get(this.mainFrameId);
    return [main, ...[...this.frameMap.values()].filter((f) => f !== main)].filter(Boolean);
  }
  url() {
    return this.currentUrl;
  }
  isClosed() {
    return this.closed;
  }
  viewportSize() {
    return this.viewport;
  }
  async setViewportSize(viewport) {
    this.viewport = viewport;
    await this.send('Emulation.setDeviceMetricsOverride', {
      ...viewport,
      deviceScaleFactor: 1,
      mobile: Boolean(this.context.options.isMobile),
    });
    if (this.context.options.hasTouch)
      await this.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  }
  async offset() {
    return { x: 0, y: 0 };
  }
  evaluate(fn, arg) {
    const frame = this.frameMap.get(this.mainFrameId);
    if (!frame) throw new Error('Main frame unavailable');
    return frame.evaluate(fn, arg);
  }
  locator(selector) {
    return locator(this, selector);
  }
  getByTestId(id) {
    return getByTestId(this, id);
  }
  getByText(text, options) {
    return getByText(this, text, options);
  }
  getByRole(role, options) {
    return getByRole(this, role, options);
  }
  frameLocator(selector) {
    return {
      locator: (childSelector) => {
        // Resolve iframe ownership on each operation, so navigation cannot retain stale frame IDs.
        const frame = {
          page: this,
          offset: async () => (await this.resolveFrame(selector)).offset(),
          evaluate: async (fn, arg) => (await this.resolveFrame(selector)).evaluate(fn, arg),
        };
        return locator(frame, childSelector);
      },
    };
  }
  async resolveFrame(selector) {
    const { root } = await this.send('DOM.getDocument', { depth: 1 });
    const { nodeId } = await this.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    if (!nodeId) throw new Error('Frame element not found');
    const { node } = await this.send('DOM.describeNode', { nodeId });
    const id = node.frameId || node.contentDocument?.frameId;
    const frame = this.frameMap.get(id);
    if (!frame) throw new Error('Frame unavailable');
    return frame;
  }
  waitForEvent(name, { timeout = 30000 } = {}) {
    return new Promise((resolve, reject) => {
      const handler = (value) => {
        clearTimeout(timer);
        resolve(value);
      };
      const timer = setTimeout(() => {
        this.off(name, handler);
        reject(timeoutError(name));
      }, timeout);
      this.once(name, handler);
    });
  }
  async goto(url, { timeout = 30000 } = {}) {
    const navigation = await this.send('Page.navigate', { url }, timeout);
    if (navigation.errorText) throw new Error(navigation.errorText);
    if (navigation.loaderId) await this.waitForLoader(navigation.loaderId, timeout);
    else await this.waitForLoadState('domcontentloaded', { timeout });
  }
  async reload({ timeout = 30000 } = {}) {
    const previous = this.frameMap.get(this.mainFrameId)?.loaderId;
    await this.send('Page.reload');
    await this.waitForNewLoader(previous, timeout);
  }
  async goBack(options) {
    return this.history(-1, options);
  }
  async goForward(options) {
    return this.history(1, options);
  }
  async history(delta, { timeout = 30000 } = {}) {
    const h = await this.send('Page.getNavigationHistory');
    const entry = h.entries[h.currentIndex + delta];
    if (entry) {
      const previous = this.frameMap.get(this.mainFrameId)?.loaderId;
      await this.send('Page.navigateToHistoryEntry', { entryId: entry.id });
      await this.waitForNewLoader(previous, timeout, entry.url);
    }
  }
  async waitForLoader(loaderId, timeout) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      if (this.closed) throw new Error('Target closed');
      if (
        this.lifecycle.has(`${loaderId}:DOMContentLoaded`) ||
        this.lifecycle.has(`${loaderId}:load`)
      )
        return;
      await delay(10);
    }
    throw timeoutError('navigation');
  }
  async waitForNewLoader(previous, timeout, url) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const frame = this.frameMap.get(this.mainFrameId);
      if (frame?.loaderId && frame.loaderId !== previous)
        return this.waitForLoader(frame.loaderId, Math.max(1, end - Date.now()));
      if (url && this.currentUrl === url)
        return this.waitForLoadState('domcontentloaded', {
          timeout: Math.max(1, end - Date.now()),
        });
      if (this.closed) throw new Error('Target closed');
      await delay(10);
    }
    throw timeoutError('navigation commit');
  }
  async waitForLoadState(state, { timeout = 30000 } = {}) {
    const end = Date.now() + timeout;
    let quietSince = Date.now();
    while (Date.now() < end) {
      if (this.closed) throw new Error('Target closed');
      const ready = await this.evaluate(() => document.readyState).catch(() => null);
      if (state === 'networkidle') {
        if (this.requests.size) quietSince = Date.now();
        if (ready === 'complete' && Date.now() - quietSince >= 500) return;
      } else if (ready === 'interactive' || ready === 'complete') return;
      await delay(25);
    }
    throw timeoutError('load state');
  }
  async waitForFunction(fn, arg, { timeout = 30000 } = {}) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      if (await this.evaluate(fn, arg)) return;
      await delay(50);
    }
    throw timeoutError('page condition');
  }
  waitForTimeout(ms) {
    return delay(ms);
  }
  async addScriptTag({ path: filename }) {
    return this.evaluate(await fs.readFile(filename, 'utf8'));
  }
  async screenshot({ type = 'png', quality, path: filename, fullPage = false } = {}) {
    const options = {
      format: type === 'jpeg' ? 'jpeg' : 'png',
      fromSurface: true,
      captureBeyondViewport: fullPage,
    };
    if (options.format === 'jpeg') options.quality = quality ?? 70;
    if (fullPage) {
      const { cssContentSize } = await this.send('Page.getLayoutMetrics');
      options.clip = {
        x: 0,
        y: 0,
        width: cssContentSize.width,
        height: cssContentSize.height,
        scale: 1,
      };
    }
    const { data } = await this.send('Page.captureScreenshot', options);
    const bytes = Buffer.from(data, 'base64');
    if (filename) await fs.writeFile(filename, bytes);
    return bytes;
  }
  async pointerEvent(type, options = {}) {
    const { x, y } = this.pointer;
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Invalid pointer coordinates');
    const button = options.button || 'left',
      bit = { left: 1, right: 2, middle: 4 }[button];
    if (!bit) throw new Error('Invalid pointer button');
    if (type === 'mousePressed') this.pointer.buttons |= bit;
    if (type === 'mouseReleased') this.pointer.buttons &= ~bit;
    return this.send('Input.dispatchMouseEvent', {
      type,
      x,
      y,
      buttons: this.pointer.buttons,
      ...(type === 'mouseMoved'
        ? {}
        : type === 'mouseWheel'
          ? { deltaX: options.deltaX, deltaY: options.deltaY }
          : { button, clickCount: options.clickCount || 1 }),
    });
  }
  async pressKey(chord) {
    const parts = String(chord).split('+');
    const key = parts.pop();
    const modifiers = parts.reduce(
      (m, p) => m | ({ Alt: 1, Control: 2, ControlOrMeta: 2, Meta: 4, Shift: 8 }[p] || 0),
      0,
    );
    const special = {
      Enter: ['Enter', 13, '\r'],
      Tab: ['Tab', 9],
      Backspace: ['Backspace', 8],
      Delete: ['Delete', 46],
      Escape: ['Escape', 27],
      ArrowLeft: ['ArrowLeft', 37],
      ArrowUp: ['ArrowUp', 38],
      ArrowRight: ['ArrowRight', 39],
      ArrowDown: ['ArrowDown', 40],
      Home: ['Home', 36],
      End: ['End', 35],
      PageUp: ['PageUp', 33],
      PageDown: ['PageDown', 34],
      Space: ['Space', 32, ' '],
    };
    const entry =
      special[key] ||
      (key.length === 1 ? [`Key${key.toUpperCase()}`, key.toUpperCase().charCodeAt(0), key] : null);
    if (!entry) throw new Error('Unsupported key');
    const payload = {
      key: key === 'Space' ? ' ' : key,
      code: entry[0],
      windowsVirtualKeyCode: entry[1],
      modifiers,
    };
    if (modifiers === 2 && key.toLowerCase() === 'a') payload.commands = ['selectAll'];
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      ...payload,
      ...(!(modifiers & 6) && entry[2] ? { text: entry[2], unmodifiedText: entry[2] } : {}),
    });
    await this.send('Input.dispatchKeyEvent', { type: 'keyUp', ...payload });
  }
  async bringToFront() {
    await this.send('Page.bringToFront');
  }
  async close() {
    if (!this.closed) await this.browser.send('Target.closeTarget', { targetId: this.id });
    this.didClose();
  }
  didClose() {
    if (this.closed) return;
    this.closed = true;
    this.context.pageMap.delete(this.id);
    this.browser.targets.delete(this.id);
    for (const [id, entry] of this.browser.frameSessions)
      if (entry.page === this) this.browser.frameSessions.delete(id);
    this.emit('close');
  }
}
