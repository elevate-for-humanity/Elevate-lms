/**
 * lib/devstudio/openhands-opt-in.ts
 *
 * Single opt-in gate for OpenHands. OpenHands is NOT the platform's repair
 * engine: the owned internal engine is the default, and OpenHands is
 * opt-in-only behind PARIS_REPAIR_ENGINE=openhands.
 *
 * Record (2026-11-23): 29 OpenHands tasks, 22 failed, 0 completed; API key
 * untested since 2026-09-15. The adapter code is retained so an explicit
 * opt-in can still use it, but no default or required path may dispatch to
 * OpenHands. Anything that starts new OpenHands work must call
 * requireOpenHandsOptIn() (or check isOpenHandsOptedIn()) first and fail
 * closed with PARIS_OPENHANDS_OPT_IN_REQUIRED when the flag is absent.
 *
 * Observation-only paths (reconciling already-created tasks, validating an
 * already-committed provider branch) do not dispatch and are not gated here;
 * they are documented in docs/own-engine.md.
 */
export function isOpenHandsOptedIn(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (env.PARIS_REPAIR_ENGINE ?? 'internal').trim().toLowerCase() === 'openhands';
}

/** Throw PARIS_OPENHANDS_OPT_IN_REQUIRED unless OpenHands is opted in. */
export function requireOpenHandsOptIn(env: NodeJS.ProcessEnv = process.env): void {
  if (!isOpenHandsOptedIn(env)) {
    throw new Error('PARIS_OPENHANDS_OPT_IN_REQUIRED');
  }
}
