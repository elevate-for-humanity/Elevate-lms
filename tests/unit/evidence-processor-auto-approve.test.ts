import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({ updates: [] as any[], inserts: [] as any[] }));
const ocr = vi.hoisted(() => ({ confidence: 92, text: 'JANE DOE ID 123456789 EXP 2030' }));

vi.mock('@/lib/supabase/admin', () => {
  function chain(table: string) {
    const c: any = {
      update: (vals: any) => { state.updates.push({ table, vals }); return c; },
      insert: (vals: any) => { state.inserts.push({ table, vals }); return c; },
      eq: () => c,
      select: () => c,
      maybeSingle: async () => ({ data: { id: 'stub-id' }, error: null }),
      single: async () => ({ data: { id: 'stub-id' }, error: null }),
      then: (res: any, rej: any) => Promise.resolve({ data: null, error: null }).then(res, rej),
    };
    return c;
  }
  const client = { from: (t: string) => chain(t) };
  return { createAdminClient: () => client, requireAdminClient: async () => client };
});
vi.mock('@/lib/ocr/tesseract-ocr', () => ({
  autoExtract: async () => ({ confidence: ocr.confidence, text: ocr.text, source: 'stub' }),
}));
vi.mock('@/lib/audit-context', () => ({ setAuditContext: async () => undefined }));
vi.mock('@/lib/logger', () => ({ logger: { info: () => {}, error: () => {}, warn: () => {} } }));

import { processDocument } from '@/lib/automation/evidence-processor';

beforeEach(() => {
  state.updates.length = 0;
  state.inserts.length = 0;
  vi.stubGlobal('fetch', async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
});

describe('evidence processor standing auto-approve behavior (Elizabeth, 2026-11-26)', () => {
  it('approves a legible document on arrival and logs the decision', async () => {
    ocr.confidence = 92;
    const r = await processDocument('doc-1', 'https://x/f.jpg', 'id');
    expect(r.outcome).toBe('auto_approved');
    const upd = state.updates.find((u) => u.table === 'documents');
    expect(upd.vals.status).toBe('approved');
    expect(state.inserts.some((i) => i.table === 'automated_decisions' && i.vals.outcome === 'approved')).toBe(true);
  });

  it('routes an illegible document to the staff review queue as an exception', async () => {
    ocr.confidence = 12;
    const r = await processDocument('doc-2', 'https://x/f.jpg', 'id');
    expect(r.outcome).toBe('routed_to_review');
    const upd = state.updates.find((u) => u.table === 'documents');
    expect(upd.vals.status).toBe('pending_review');
    expect(state.inserts.some((i) => i.table === 'review_queue')).toBe(true);
  });

  it('does not fail validation rules whose inputs were not extracted', async () => {
    ocr.confidence = 95;
    const r = await processDocument('doc-3', 'https://x/f.pdf', 'transcript');
    expect(r.outcome).toBe('auto_approved');
  });

  it('keeps the guardrail: unknown document types route to review', async () => {
    ocr.confidence = 95;
    const r = await processDocument('doc-4', 'https://x/f.pdf', 'unknown');
    expect(r.outcome).toBe('routed_to_review');
  });
});
