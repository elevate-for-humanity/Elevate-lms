// @vitest-environment node
import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { buildSubmissionArchive, buildIfaTransmission } from '@/lib/tax-software/ats/submission-package.mjs';
import { createSubmissionId, validateAtsSsn, validatePractitionerSignature } from '@/lib/tax-software/ats/identifiers';
import { CertificationExportAdapter } from '@/lib/tax-software/transmission/adapters/certification-export';
import { TransmissionHub } from '@/lib/tax-software/transmission/hub';

const id = '12345620272860000001';
const manifest = `<SubmissionManifest><SubmissionId>${id}</SubmissionId></SubmissionManifest>`;
const returnXml = '<Return><TaxYear>2026</TaxYear></Return>';
const envelope = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Header/><soap:Body><TransmissionManifest><SubmissionId>${id}</SubmissionId></TransmissionManifest></soap:Body></soap:Envelope>`;
const archive = () => buildSubmissionArchive({ submissionId: id, processingYear: 2027, manifestXml: manifest, returnXml });

describe('local IRS test-package composition', () => {
  it('creates the 20-digit processing-year submission ID', () => {
    expect(createSubmissionId({ efin: '123456', processingYear: 2027, julianDay: 286, sequence: 1 })).toBe(id);
    expect(() => createSubmissionId({ efin: '123456', processingYear: 2027, julianDay: 366, sequence: 1 })).toThrow();
    expect(() => createSubmissionId({ efin: '123456', processingYear: 2027, julianDay: 286, sequence: 10000000 })).toThrow();
  });
  it('enforces test SSNs and nonzero PINs without treating them as authorization', () => {
    expect(validateAtsSsn('400-00-1037')).toBe(true);
    expect(validateAtsSsn('400-12-1037')).toBe(false);
    expect(validateAtsSsn('400-001037')).toBe(false);
    const valid = { efin: '123456', taxpayerPin: '12345', practitionerPin: '12345654321', signedDate: '2026-10-13', authorizationRecorded: true };
    expect(validatePractitionerSignature(valid)).toEqual([]);
    expect(validatePractitionerSignature({ ...valid, taxpayerPin: '00000', authorizationRecorded: false })).toHaveLength(2);
    expect(validatePractitionerSignature({ ...valid, signedDate: '2026-02-30' })).not.toEqual([]);
  });
  it('creates compressed submission files without extraneous directory entries', async () => {
    const result = await archive();
    const zip = await JSZip.loadAsync(result.content);
    expect(Object.keys(zip.files)).toEqual(['manifest/manifest.xml', 'xml/submission.xml']);
    expect(await zip.file('xml/submission.xml')!.async('string')).toBe(returnXml);
    expect(result.atsAccepted).toBe(false);
    expect(result.filename).toBe(id + '.zip');
  });
  it('rejects mismatched IDs and malformed or unsafe XML', async () => {
    await expect(buildSubmissionArchive({ submissionId: id, processingYear: 2026, manifestXml: manifest, returnXml })).rejects.toThrow();
    await expect(buildSubmissionArchive({ submissionId: id, processingYear: 2027, manifestXml: manifest.replace(id, '0'.repeat(20)), returnXml })).rejects.toThrow();
    await expect(buildSubmissionArchive({ submissionId: id, processingYear: 2027, manifestXml: manifest, returnXml: '<Return>' })).rejects.toThrow();
    await expect(buildSubmissionArchive({ submissionId: id, processingYear: 2027, manifestXml: manifest, returnXml: '<!DOCTYPE Return [<!ENTITY e SYSTEM "file:///etc/passwd">]><Return>&e;</Return>' })).rejects.toThrow();
  });
  it('rejects path traversal and duplicate PDF attachment names', async () => {
    const base = { submissionId: id, processingYear: 2027, manifestXml: manifest, returnXml };
    await expect(buildSubmissionArchive({ ...base, attachments: [{ name: '../secret.pdf', content: Buffer.from('%PDF-1.7') }] })).rejects.toThrow();
    await expect(buildSubmissionArchive({ ...base, attachments: [{ name: 'note.pdf', content: Buffer.from('%PDF-1.7') }, { name: 'NOTE.pdf', content: Buffer.from('%PDF-1.7') }] })).rejects.toThrow();
  });
  it('creates binary MIME with CRLF separators and stored outer ZIP entries', async () => {
    const submission = await archive();
    const result = await buildIfaTransmission({ soapEnvelopeXml: envelope, submissions: [submission], boundary: 'TestBoundary' });
    const marker = Buffer.from('Content-Transfer-Encoding: Binary\r\n\r\n');
    const start = result.content.indexOf(marker) + marker.length;
    const end = result.content.lastIndexOf(Buffer.from('\r\n\r\n--TestBoundary--'));
    const zip = await JSZip.loadAsync(result.content.subarray(start, end));
    expect(Object.keys(zip.files)).toEqual([id + '.zip']);
    expect(result.content.toString('utf8', 0, start)).toContain('\r\n\r\n--TestBoundary\r\n');
    expect(result.filename.endsWith('.mime')).toBe(true);
    expect(result.atsAccepted).toBe(false);
  });
  it('does not pack a return omitted from the SOAP transmission manifest', async () => {
    await expect(buildIfaTransmission({ soapEnvelopeXml: envelope.replace(id, '0'.repeat(20)), submissions: [await archive()] })).rejects.toThrow();
  });
  it('creates an actual export artifact and never labels local generation as IRS transmission', async () => {
    const hub = new TransmissionHub().register(new CertificationExportAdapter());
    const input = { id: 'test-1', returnId: 'return-1', destination: 'certification_export' as const, protocol: 'file_export' as const, payloadType: 'application/xml', payload: returnXml, idempotencyKey: 'local-test-1', metadata: {} };
    const result = await hub.transmit(input);
    expect(result.status).toBe('exported');
    expect(new TextDecoder().decode(result.artifact!.content)).toBe(returnXml);
    await expect(hub.transmit({ ...input, protocol: 'https_soap' })).rejects.toThrow();
  });
});
