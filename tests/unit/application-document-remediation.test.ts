import { describe, expect, it } from 'vitest';

import {
  deterministicMissingDocumentMessage,
  documentOnly,
} from '../../lib/automation/application-document-remediation';

describe('application missing-document remediation', () => {
  it('only selects document requirements for the automatic reminder loop', () => {
    expect(documentOnly([
      'Photo ID document',
      'Required signature',
      'Proof of residency document',
      'Funding or payment pathway',
    ])).toEqual(['Photo ID document', 'Proof of residency document']);
  });

  it('names each missing item instead of sending a generic incomplete notice', () => {
    const message = deterministicMissingDocumentMessage([
      'Photo ID document',
      'Proof of residency document',
    ]);

    expect(message).toContain('Photo ID document');
    expect(message).toContain('Proof of residency document');
    expect(message).toContain('applicant portal');
    expect(message.toLowerCase()).not.toContain('denied');
  });
});
