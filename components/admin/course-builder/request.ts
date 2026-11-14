'use client';

export function courseBuilderIdempotencyKey(operation: string): string {
  return `ui:${operation}:${crypto.randomUUID()}`;
}

export function courseBuilderJsonHeaders(operation: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Idempotency-Key': courseBuilderIdempotencyKey(operation),
  };
}
