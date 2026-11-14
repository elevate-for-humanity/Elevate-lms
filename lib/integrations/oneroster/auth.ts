import 'server-only';

import { createHash, timingSafeEqual } from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';

const AUDIENCE = 'elevate-oneroster';
const READ_SCOPE = 'oneroster.read';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function secretKey(): Uint8Array {
  return Buffer.from(required('ONEROSTER_TOKEN_SECRET'), 'utf8');
}

function safeEqual(actual: string, expected: string): boolean {
  const actualHash = createHash('sha256').update(actual).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export function isOneRosterEnabled(): boolean {
  return process.env.ONEROSTER_ENABLED === 'true' &&
    Boolean(process.env.ONEROSTER_CLIENT_ID?.trim()) &&
    Boolean(process.env.ONEROSTER_CLIENT_SECRET?.trim()) &&
    Boolean(process.env.ONEROSTER_TOKEN_SECRET?.trim()) &&
    Boolean(process.env.ONEROSTER_ISSUER?.trim());
}

export function validateOneRosterClient(clientId: string, clientSecret: string): boolean {
  if (!isOneRosterEnabled()) return false;
  return safeEqual(clientId, required('ONEROSTER_CLIENT_ID')) &&
    safeEqual(clientSecret, required('ONEROSTER_CLIENT_SECRET'));
}

export async function issueOneRosterToken(clientId: string): Promise<string> {
  const issuer = required('ONEROSTER_ISSUER');
  return new SignJWT({ scope: READ_SCOPE })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(clientId)
    .setIssuer(issuer)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(secretKey());
}

export async function authorizeOneRoster(request: Request): Promise<boolean> {
  if (!isOneRosterEnabled()) return false;
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return false;

  try {
    const { payload } = await jwtVerify(authorization.slice(7), secretKey(), {
      issuer: required('ONEROSTER_ISSUER'),
      audience: AUDIENCE,
      algorithms: ['HS256'],
    });
    return String(payload.scope ?? '').split(' ').includes(READ_SCOPE);
  } catch {
    return false;
  }
}

export function oneRosterPagination(request: Request): { limit: number; offset: number } {
  const url = new URL(request.url);
  const parsedLimit = Number.parseInt(url.searchParams.get('limit') ?? '100', 10);
  const parsedOffset = Number.parseInt(url.searchParams.get('offset') ?? '0', 10);
  return {
    limit: Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 500) : 100,
    offset: Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0,
  };
}
