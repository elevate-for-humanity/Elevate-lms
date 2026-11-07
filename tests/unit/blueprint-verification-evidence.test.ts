const db = vi.hoisted(() => ({lookup: vi.fn(), save: vi.fn()}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({from: (table: string) => table === 'profiles' ? {select: () => ({in: () => ({eq: db.lookup})})} : {insert: () => ({select: db.save})}}) }));
import { expect, it, vi } from 'vitest';
vi.mock('@/lib/course-builder/credential-engine/credential-registry-universal', () => {
  const credential = {slug: 'fixture', name: 'Fixture', provider: 'osha', examSections: [], passingScore: 80};
  return {getCredential: () => credential, UNIVERSAL_CREDENTIAL_REGISTRY: {fixture: credential}};
});
import { monitorCredential, monitorAllBlueprints, notifyAdmins } from '@/lib/course-builder/credential-engine/blueprint-monitor';
it('does not report local registry comparisons as externally current', async () => {
  expect(await monitorCredential('fixture')).toMatchObject({status: 'error'});
  expect(await monitorAllBlueprints()).toMatchObject({checked: 1, updated: 0, errors: 1});
});
const recommendation = {credentialSlug: 'fixture', changes: [], affectedModules: [], recommendedAction: 'review' as const, priority: 'this-week' as const};
it('requires persisted notification receipts for the actual administrator recipients', async () => {
  db.lookup.mockResolvedValue({data:[{id:'admin'}],error:null});
  db.save.mockResolvedValueOnce({data:[{id:'notice'}],error:null});
  await expect(notifyAdmins(recommendation)).resolves.toBeUndefined();
  db.save.mockResolvedValueOnce({data:[],error:null});
  await expect(notifyAdmins(recommendation)).rejects.toThrow('BLUEPRINT_NOTIFICATION_RECEIPT_MISSING');
  db.lookup.mockResolvedValueOnce({data:null,error:new Error('db down')});
  await expect(notifyAdmins(recommendation)).rejects.toThrow('db down');
});
