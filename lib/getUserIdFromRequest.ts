// lib/getUserIdFromRequest.ts
import type { NextRequest } from 'next/server';

/**
 * Expects headers: Authorization: Bearer <supabase_access_token>
 * Decodes the JWT payload and returns the "sub" (user id).
 */
export function getUserIdFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;

  const token = auth.slice('Bearer '.length).trim();
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8')) as {
      sub?: string;
    };
    return payload.sub ?? null;
  } catch (error) {
    return null;
  }
}
