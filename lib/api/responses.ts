/**
 * Canonical API response helpers.
 *
 * All API routes must use these instead of raw NextResponse.json() calls.
 * Standardises HTTP status codes and error message keys across 1,132 routes.
 *
 * In development, serverError() includes the detail string.
 * In production, serverError() strips it — never leaks internals.
 */

import { NextResponse } from 'next/server';

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, { status: 201, ...init });
}

export function badRequest(message = 'BAD_REQUEST', details?: unknown) {
  return NextResponse.json(
    { error: message, details: details ?? null },
    { status: 400 },
  );
}

export function unauthorized(message = 'UNAUTHORIZED') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'FORBIDDEN') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = 'NOT_FOUND') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message = 'CONFLICT', details?: unknown) {
  return NextResponse.json(
    { error: message, details: details ?? null },
    { status: 409 },
  );
}

export function tooManyRequests(message = 'RATE_LIMITED') {
  return NextResponse.json({ error: message }, { status: 429 });
}

export function serverError(message = 'INTERNAL_SERVER_ERROR', details?: unknown) {
  return NextResponse.json(
    {
      error: message,
      details:
        process.env.NODE_ENV === 'development' ? (details ?? null) : null,
    },
    { status: 500 },
  );
}

export function gone(message = 'DEPRECATED_ENDPOINT') {
  return NextResponse.json({ error: message }, { status: 410 });
}
