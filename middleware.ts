// Next.js requires the middleware entry point to be named middleware.ts.
// All logic lives in proxy.ts — this file re-exports the handler.
//
// config is defined here (not re-exported from proxy.ts) because Next.js
// requires static analysis of the config export and cannot follow re-exports.

import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Simple pass-through - avoid complex transformations that cause issues
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
