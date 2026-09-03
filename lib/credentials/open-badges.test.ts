import { describe, expect, it } from 'vitest';
import {
  buildOpenBadgeCredential,
  OPEN_BADGES_CONTEXT,
  OPEN_BADGES_CREDENTIAL_SCHEMA,
  VC_CREDENTIAL_SCHEMA_CONTEXT,
  validateOpenBadgeStructure,
} from './open-badges';

function buildFixture() {
  return buildOpenBadgeCredential({
    credentialId: '11111111-1111-4111-8111-111111111111',
    verificationCode: 'EFH-TEST1234',
    recipientIdentifier: 'Learner.Example@example.com',
    recipientSalt: 'fixed-test-salt',
    issuedAt: '2026-08-21T12:00:00.000Z',
    achievement: {
      id: 'https://www.elevateforhumanity.org/achievements/test',
      name: 'Test Achievement',
      description: 'Credential fixture for Open Badges 3.0 regression tests.',
      criteriaNarrative: 'Complete the test requirements.',
    },
  });
}

describe('Open Badges 3.0 credential builder', () => {
  it('builds the required contexts and 1EdTech credential schema', () => {
    const credential = buildFixture();

    expect(credential['@context']).toContain(OPEN_BADGES_CONTEXT);
    expect(credential['@context']).toContainEqual(VC_CREDENTIAL_SCHEMA_CONTEXT);
    expect(credential.credentialSchema).toEqual([
      {
        id: OPEN_BADGES_CREDENTIAL_SCHEMA,
        type: '1EdTechJsonSchemaValidator2019',
      },
    ]);
    expect(validateOpenBadgeStructure(credential)).toEqual([]);
  });

  it('uses a salted hashed identity and does not expose the learner email', () => {
    const credential = buildFixture();
    const serialized = JSON.stringify(credential).toLowerCase();

    expect(credential.credentialSubject).not.toHaveProperty('id');
    expect(credential.credentialSubject.identifier).toMatchObject({
      type: 'IdentityObject',
      hashed: true,
      identityType: 'email',
      salt: 'fixed-test-salt',
    });
    expect(credential.credentialSubject.identifier.identityHash).toMatch(/^sha256\$[a-f0-9]{64}$/);
    expect(serialized).not.toContain('learner.example@example.com');
  });

  it('uses stable OpenBadgeCredential semantics', () => {
    const credential = buildFixture();

    expect(credential.type).toEqual(['VerifiableCredential', 'OpenBadgeCredential']);
    expect(credential.issuer.type).toBe('Profile');
    expect(credential.credentialSubject.type).toBe('AchievementSubject');
    expect(credential.credentialSubject.achievement.type).toBe('Achievement');
  });
});
