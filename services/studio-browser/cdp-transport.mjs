import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Direct CDP pipe connection. Commands are never retried or replayed. */
export class PipeConnection extends EventEmitter {
  constructor({
    readable,
    writable,
    maxPending = 512,
    maxMessageBytes = 32 * 1024 * 1024,
    defaultTimeoutMs = 30000,
  }) {
    super();
    this.readable = readable;
    this.writable = writable;
    this.maxPending = maxPending;
    this.maxMessageBytes = maxMessageBytes;
    this.defaultTimeoutMs = defaultTimeoutMs;
    this.connected = true;
    this.pending = new Map();
    this.nextId = 1;
    this.fragments = [];
    this.fragmentBytes = 0;
    readable.on('data', (chunk) => this.receive(Buffer.from(chunk)));
    readable.on('end', () => this.disconnect());
    readable.on('close', () => this.disconnect());
    readable.on('error', () => this.disconnect(new Error('CDP read pipe failed')));
    writable.on('error', () => this.disconnect(new Error('CDP write pipe failed')));
    writable.on('close', () => this.disconnect());
  }

  receive(chunk) {
    if (!this.connected) return;
    let start = 0;
    while (start < chunk.length) {
      const delimiter = chunk.indexOf(0, start);
      const end = delimiter === -1 ? chunk.length : delimiter;
      const part = chunk.subarray(start, end);
      this.fragmentBytes += part.length;
      if (this.fragmentBytes > this.maxMessageBytes) {
        this.close(new Error('CDP message exceeds size limit'));
        return;
      }
      this.fragments.push(part);
      if (delimiter === -1) return;
      const bytes = Buffer.concat(this.fragments, this.fragmentBytes);
      this.fragments = [];
      this.fragmentBytes = 0;
      start = delimiter + 1;
      if (!bytes.length) continue;
      let message;
      try {
        message = JSON.parse(bytes.toString('utf8'));
      } catch {
        this.close(new Error('Invalid CDP message'));
        return;
      }
      if (!message || typeof message !== 'object') {
        this.close(new Error('Invalid CDP message'));
        return;
      }
      if (message.id !== undefined) {
        const item = this.pending.get(message.id);
        if (!item) continue; // Late replies never resurrect timed-out requests.
        if ((message.sessionId || undefined) !== item.sessionId) {
          this.close(new Error('CDP response session mismatch'));
          return;
        }
        clearTimeout(item.timer);
        this.pending.delete(message.id);
        if (message.error) {
          // Browser error strings can include page content, URLs, or credentials.
          const error = new Error(`CDP command failed (${message.error.code ?? 'unknown'})`);
          error.code = message.error.code;
          item.reject(error);
        } else item.resolve(message.result || {});
      } else if (typeof message.method === 'string') this.emit('event', message);
    }
  }

  send(method, params = {}, sessionId, timeoutMs = this.defaultTimeoutMs) {
    if (!this.connected) return Promise.reject(new Error('CDP connection is closed'));
    if (this.pending.size >= this.maxPending)
      return Promise.reject(new Error('CDP pending command limit reached'));
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
      return Promise.reject(new Error('Invalid CDP command timeout'));
    if (typeof method !== 'string' || !method.length)
      return Promise.reject(new Error('Invalid CDP method'));
    const id = this.nextId++;
    let frame;
    try {
      frame = Buffer.from(
        JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0',
      );
    } catch {
      return Promise.reject(new Error('CDP command is not serializable'));
    }
    if (frame.length > this.maxMessageBytes)
      return Promise.reject(new Error('CDP command exceeds size limit'));
    if (this.writable.writableLength + frame.length > this.maxMessageBytes)
      return Promise.reject(new Error('CDP write buffer limit reached'));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer, sessionId: sessionId || undefined });
      try {
        this.writable.write(frame, (error) => {
          if (error) this.disconnect(new Error('CDP write pipe failed'));
        });
      } catch {
        this.disconnect(new Error('CDP write pipe failed'));
      }
    });
  }

  disconnect(error = new Error('CDP connection disconnected')) {
    if (!this.connected) return;
    this.connected = false;
    for (const item of this.pending.values()) {
      clearTimeout(item.timer);
      item.reject(error);
    }
    this.pending.clear();
    this.fragments = [];
    this.fragmentBytes = 0;
    this.emit('disconnected');
  }

  close(error) {
    this.disconnect(error);
    this.readable.destroy();
    this.writable.destroy();
  }
}

export async function launchConnection({
  executablePath,
  headless = true,
  args = [],
  launchTimeoutMs = 30000,
  ...transportOptions
} = {}) {
  if (!executablePath) throw new Error('Chromium executablePath is required');
  if (!Number.isFinite(launchTimeoutMs) || launchTimeoutMs <= 0)
    throw new Error('Invalid browser launch timeout');
  if (
    !Array.isArray(args) ||
    args.some(
      (arg) =>
        typeof arg !== 'string' ||
        /^--(?:remote-debugging(?:-[^=]*)?|user-data-dir|profile-directory)(?:=|$)/i.test(arg),
    )
  ) {
    throw new Error('Browser arguments may not override debugging or profile configuration');
  }
  const profile = await mkdtemp(join(tmpdir(), 'studio-cdp-'));
  let child;
  let connection;
  let closing;
  let exited = false;
  const cleanup = () => rm(profile, { recursive: true, force: true });
  const close = () => {
    if (closing) return closing;
    closing = Promise.resolve().then(async () => {
      connection?.close();
      if (child && !exited) {
        await new Promise((resolve) => {
          const finish = () => {
            clearTimeout(killTimer);
            clearTimeout(deadline);
            resolve();
          };
          const killTimer = setTimeout(() => child.kill('SIGKILL'), 1500);
          const deadline = setTimeout(finish, 5000);
          child.once('exit', finish);
          child.kill('SIGTERM');
        });
      }
      await cleanup();
    });
    return closing;
  };
  try {
    child = spawn(
      executablePath,
      [
        ...args,
        ...(headless ? ['--headless=new'] : []),
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${profile}`,
        '--remote-debugging-pipe',
        'about:blank',
      ],
      { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] },
    );
    connection = new PipeConnection({
      ...transportOptions,
      readable: child.stdio[4],
      writable: child.stdio[3],
    });
    child.once('error', () => {
      exited = true;
      connection.close(new Error('Chromium failed to launch'));
      void close().catch(() => {});
    });
    child.once('exit', () => {
      exited = true;
      connection.close(new Error('Chromium exited'));
      void close().catch(() => {});
    });
    connection.once('disconnected', () => {
      void close().catch(() => {});
    });
    await connection.send('Browser.getVersion', {}, undefined, launchTimeoutMs);
    return { connection, close, process: child };
  } catch (error) {
    await close();
    throw error;
  }
}
