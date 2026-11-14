/**
 * Typed confirmation guard for production-mutating actions.
 * Human confirmation is validated as unknown input and never trusted until it
 * matches the exact required phrase.
 */

export type ConfirmationAction = 'CONFIRM DEPLOY' | 'CONFIRM MIGRATION' | 'CONFIRM ROLLBACK' | 'CONFIRM BULK EMAIL' | 'CONFIRM PUSH' | 'CONFIRM DELETE SECRET';

const ACTION_PHRASES: Record<string, ConfirmationAction> = {
  deploy_autopilot: 'CONFIRM DEPLOY',
  run_migration: 'CONFIRM MIGRATION',
  apply_all_pending_migrations: 'CONFIRM MIGRATION',
  rollback: 'CONFIRM ROLLBACK',
  send_bulk_email: 'CONFIRM BULK EMAIL',
  git_push: 'CONFIRM PUSH',
  delete_secret: 'CONFIRM DELETE SECRET',
};

export function getConfirmationPhrase(action: string): ConfirmationAction | null {
  return ACTION_PHRASES[action] ?? null;
}

export function requireTypedConfirmation(
  userInput: unknown,
  action: string,
): { ok: true; required?: never } | { ok: false; required: string } {
  const required = getConfirmationPhrase(action);
  if (!required) return { ok: true };
  if (typeof userInput !== 'string' || userInput !== required) {
    return { ok: false, required };
  }
  return { ok: true };
}
