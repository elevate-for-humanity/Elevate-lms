import { NextRequest } from 'next/server';
import crypto from 'crypto';

export function generateFingerprint(req: NextRequest): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const components = [
    req.headers.get('user-agent') || '',
    req.headers.get('accept-language') || '',
    req.headers.get('accept-encoding') || '',
    req.headers.get('accept') || '',
    req.headers.get('sec-ch-ua') || '',
    req.headers.get('sec-ch-ua-mobile') || '',
    req.headers.get('sec-ch-ua-platform') || '',
    ip,
  ];

  const fingerprint = crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex')
    .substring(0, 16);

  return fingerprint;
}

export interface FingerprintData {
  fingerprint: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  requestCount: number;
}

// In-memory store (use Redis in production)
const fingerprintStore = new Map<string, FingerprintData>();

export async function trackFingerprint(
  req: NextRequest,
  action: string,
): Promise<{ suspicious: boolean; data: FingerprintData }> {
  const fingerprint = generateFingerprint(req);
  const key = `${fingerprint}:${action}`;
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const existing = fingerprintStore.get(key);
  const now = new Date();

  if (existing) {
    // Check if too many requests from same fingerprint
    const timeDiff = now.getTime() - existing.timestamp.getTime();
    const requestsPerMinute = (existing.requestCount / timeDiff) * 60000;

    existing.requestCount++;
    existing.timestamp = now;

    // Suspicious if more than 60 requests per minute
    const suspicious = requestsPerMinute > 60;

    return { suspicious, data: existing };
  }

  const data: FingerprintData = {
    fingerprint,
    ip,
    userAgent: req.headers.get('user-agent') || '',
    timestamp: now,
    requestCount: 1,
  };

  fingerprintStore.set(key, data);

  return { suspicious: false, data };
}

// Cleanup old fingerprints every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [key, data] of fingerprintStore.entries()) {
    if (data.timestamp.getTime() < oneHourAgo) {
      fingerprintStore.delete(key);
    }
  }
}, 3600000);
