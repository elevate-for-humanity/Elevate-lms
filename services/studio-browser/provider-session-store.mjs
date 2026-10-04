import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// One shared account connection for Studio and course acquisition. Never store
// unrelated LMS cookies, return provider cookies, or accept client-chosen owners.
export class ProviderSessionStore {
  constructor({ secret, directory } = {}) {
    this.key = secret ? crypto.createHash('sha256').update(secret).digest() : null;
    this.directory = directory;
    this.states = new Map();
  }
  scope(ownerId, target) {
    const host = new URL(target).hostname;
    return typeof ownerId === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(ownerId) &&
      (host === 'envato.com' || host.endsWith('.envato.com'))
      ? `envato:${ownerId}` : null;
  }
  file(scope) {
    return path.join(this.directory, crypto.createHash('sha256').update(scope).digest('hex') + '.json');
  }
  async load(scope) {
    if (!scope) return undefined;
    if (this.states.has(scope)) return this.states.get(scope);
    if (!this.directory || !this.key) return undefined;
    try {
      const payload = JSON.parse(await fs.readFile(this.file(scope), 'utf8'));
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, Buffer.from(payload.iv, 'base64'));
      decipher.setAAD(Buffer.from(scope));
      decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
      const state = JSON.parse(Buffer.concat([decipher.update(Buffer.from(payload.data, 'base64')), decipher.final()]).toString());
      this.states.set(scope, state);
      return state;
    } catch (error) {
      if (error.code === 'ENOENT') return undefined;
      throw new Error('PROVIDER_SESSION_RESTORE_FAILED', { cause: error });
    }
  }
  async save(scope, context) {
    if (!scope) return;
    // Provider authentication can live in IndexedDB as well as cookies and
    // localStorage. Preserve it in the same encrypted, account-scoped state.
    const source = await context.storageState({ indexedDB: true });
    const isEnvato = host => host === 'envato.com' || host.endsWith('.envato.com');
    const state = {
      cookies: source.cookies.filter(cookie => isEnvato(cookie.domain.replace(/^\./, ''))),
      origins: source.origins.filter(origin => isEnvato(new URL(origin.origin).hostname)),
    };
    this.states.set(scope, state);
    if (!this.directory || !this.key) return;
    await fs.mkdir(this.directory, { recursive: true, mode: 0o700 });
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(Buffer.from(scope));
    const data = Buffer.concat([cipher.update(JSON.stringify(state)), cipher.final()]);
    const target = this.file(scope);
    const temporary = target + '.' + crypto.randomUUID();
    await fs.writeFile(temporary, JSON.stringify({ iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64') }), { mode: 0o600 });
    await fs.rename(temporary, target);
  }
}
