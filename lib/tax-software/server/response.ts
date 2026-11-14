import { NextResponse } from 'next/server';
export function taxJson(body: unknown, options: { status?: number; headers?: HeadersInit } = {}) {
  const headers = new Headers(options.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Vary', 'Cookie');
  headers.set('X-Content-Type-Options', 'nosniff');
  return NextResponse.json(body, { ...options, headers });
}
