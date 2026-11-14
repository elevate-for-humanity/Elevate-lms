import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

export function jsonOk<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function jsonErr(message: string, status: number = 500, code?: string) {
  const requestId = randomUUID();

  return NextResponse.json(
    {
      error: {
        message,
        code,
      },
      request_id: requestId,
    },
    { status },
  );
}
