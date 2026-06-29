// Next.js requires the middleware entry point to be named middleware.ts.
// All logic lives in proxy.ts — this file re-exports the handler.
//
// config is defined here (not re-exported from proxy.ts) because Next.js
// requires static analysis of the config export and cannot follow re-exports.
//
// nodejs runtime removed: reverting to standard edge for stability
export const runtime = 'edge';

export { middleware as default } from './proxy';

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
