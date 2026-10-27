import type { TransmissionAdapter, TransmissionEnvelope, TransmissionResult } from '../hub';

/** Creates a real downloadable local artifact; never reports an IRS send. */
export class CertificationExportAdapter implements TransmissionAdapter {
  destination = 'certification_export' as const;
  protocol = 'file_export' as const;
  async validate(envelope: TransmissionEnvelope) {
    const errors: string[] = [];
    if (!envelope.id?.trim()) errors.push('transport ID required');
    if (!envelope.returnId?.trim()) errors.push('returnId required');
    if (!envelope.payload || envelope.payload.length === 0) errors.push('payload required');
    if (!envelope.idempotencyKey?.trim()) errors.push('idempotencyKey required');
    if (envelope.destination !== this.destination || envelope.protocol !== this.protocol) errors.push('Export destination and protocol must match');
    return errors;
  }
  async send(envelope: TransmissionEnvelope): Promise<TransmissionResult> {
    const errors = await this.validate(envelope);
    if (errors.length) throw new Error(errors.join('; '));
    const extension = envelope.payloadType.includes('xml') ? 'xml' : envelope.payloadType.includes('json') ? 'json' : 'bin';
    return {
      transportId: envelope.id,
      status: 'exported',
      providerReference: envelope.idempotencyKey,
      message: 'Local artifact generated. Nothing transmitted to the IRS.',
      artifact: {
        filename: `${envelope.id.replace(/[^A-Za-z0-9_.-]/g, '_')}.${extension}`,
        content: typeof envelope.payload === 'string' ? new TextEncoder().encode(envelope.payload) : envelope.payload,
        mimeType: envelope.payloadType,
      },
    };
  }
}
