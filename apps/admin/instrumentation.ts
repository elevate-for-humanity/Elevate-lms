/**
 * Admin app entry — same cold-start hydration as the LMS (repo root instrumentation.ts).
 * Required because `next build` runs from apps/admin; Next only loads instrumentation.ts
 * from the app project root.
 */
export { register, onRequestError } from '../../instrumentation';
