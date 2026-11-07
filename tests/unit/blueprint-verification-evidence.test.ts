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
it('does not report console output as a delivered notification', async () => {
  await expect(notifyAdmins({credentialSlug: 'fixture', changes: [], affectedModules: [], recommendedAction: 'review', priority: 'this-week'})).rejects.toThrow('BLUEPRINT_NOTIFICATION_UNAVAILABLE');
});
