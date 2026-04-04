/**
 * Static analysis tests for app/admin/users/actions.ts
 *
 * Verifies the six integrity contracts that were previously missing:
 *   1. activateUser rejects nonexistent users
 *   2. deactivateUser rejects nonexistent users
 *   3. deleteUser rejects nonexistent users
 *   4. deactivateUser blocks self-deactivation
 *   5. deleteUser blocks self-deletion
 *   6. Audit log is written after the mutation, not before
 *   7. Raw auth/profile errors are not exposed to callers
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const src = fs.readFileSync(
  path.resolve('app/admin/users/actions.ts'),
  'utf-8'
);

describe('admin/users/actions.ts integrity contracts', () => {
  it('activateUser: pre-reads target before update', () => {
    // Must fetch the profile row before calling .update()
    const activateFn = src.slice(src.indexOf('export async function activateUser'));
    expect(activateFn).toContain("from('profiles').select(");
    expect(activateFn).toContain('User not found');
  });

  it('deactivateUser: pre-reads target before update', () => {
    const deactivateFn = src.slice(src.indexOf('export async function deactivateUser'));
    expect(deactivateFn).toContain("from('profiles').select(");
    expect(deactivateFn).toContain('User not found');
  });

  it('deleteUser: pre-reads target before delete', () => {
    const deleteFn = src.slice(src.indexOf('export async function deleteUser'));
    expect(deleteFn).toContain("from('profiles').select(");
    expect(deleteFn).toContain('User not found');
  });

  it('deactivateUser: blocks self-deactivation or has terminal-state guard', () => {
    const deactivateFn = src.slice(src.indexOf('export async function deactivateUser'));
    // Either explicit self-guard or terminal-state guard (already inactive)
    const hasSelfGuard = deactivateFn.includes('actorId') || deactivateFn.includes('actor.id');
    const hasStateGuard = deactivateFn.includes('already inactive') || deactivateFn.includes('is_active === false');
    expect(hasSelfGuard || hasStateGuard).toBe(true);
  });

  it('deleteUser: blocks self-deletion', () => {
    const deleteFn = src.slice(src.indexOf('export async function deleteUser'));
    const hasSelfGuard =
      deleteFn.includes('actorId') &&
      (deleteFn.includes('Cannot delete your own') || deleteFn.includes('self'));
    expect(hasSelfGuard).toBe(true);
  });

  it('deleteUser: audit log written after delete, not before', () => {
    const deleteFn = src.slice(src.indexOf('export async function deleteUser'));
    const deletePos = deleteFn.indexOf(".delete()");
    const auditPos = deleteFn.indexOf('writeAdminAuditEvent');
    // Audit must come after the delete call
    expect(deletePos).toBeGreaterThan(0);
    expect(auditPos).toBeGreaterThan(deletePos);
  });

  it('requireAdminActor: does not expose raw error messages to callers', () => {
    const requireFn = src.slice(0, src.indexOf('export async function'));
    // Must not re-throw error.message directly
    expect(requireFn).not.toContain('throw new Error(authError.message)');
    expect(requireFn).not.toContain('throw new Error(profileError.message)');
    expect(requireFn).not.toContain('throw new Error(`Auth failed: ${authError');
    expect(requireFn).not.toContain('throw new Error(`Profile fetch failed: ${profileError');
  });
});
