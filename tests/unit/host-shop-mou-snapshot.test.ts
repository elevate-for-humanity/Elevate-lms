import { expect, it } from 'vitest';
import { hostShopMouSnapshot } from '@/lib/partners/host-shop-mou-snapshot';
import { serializeSignedDocument } from '@/lib/signatures/electronic-signature-service';
it.each(['barber', 'cosmetology', 'esthetician', 'nail'] as const)('preserves complete %s terms and makes content changes detectable', program => {
  const snapshot = hostShopMouSnapshot({ partnerId: 'shop', organizationName: 'Shop', program, documentVersion: 'version', signerName: 'Signer', signerTitle: 'Owner', signedAt: '2026-11-06T00:00:00Z' });
  expect(snapshot.sections.length).toBeGreaterThan(3);
  expect(snapshot.sections.every(section => section.content.trim().length > 20)).toBe(true);
  const stored = serializeSignedDocument(snapshot);
  expect(JSON.parse(stored.signatureData)).toEqual(snapshot);
  expect(serializeSignedDocument({ ...snapshot, sections: snapshot.sections.slice(1) }).documentHash).not.toBe(stored.documentHash);
});
