// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/lib/billing/handlers/generate-billing-invoices';

const root = process.cwd();
const handlerPath = 'lib/billing/handlers/generate-billing-invoices.ts';
const handlerSource = readFileSync(resolve(root, handlerPath), 'utf8');

/**
 * Verbatim port of the payload-key extraction performed by
 * scripts/audit-supabase-mutations.ts (`skipQuoted`, `skipPropertyValue`,
 * `topLevelObjectKeys`). The CI gate "Supabase write payloads — live
 * production contract" rejects any key this extraction produces that is not a
 * real column, so the port must stay faithful to the gate — including the
 * spread handling, which skips to the next `,` or `}` without tracking nesting.
 */
function skipQuoted(source: string, index: number): number {
  const quote = source[index];
  index += 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === quote) return index + 1;
    index += 1;
  }
  return index;
}

function skipPropertyValue(source: string, index: number): number {
  let braces = 0;
  let brackets = 0;
  let parentheses = 0;

  while (index < source.length) {
    const ch = source[index];
    if (ch === '"' || ch === "'" || ch === '`') {
      index = skipQuoted(source, index);
      continue;
    }
    if (ch === '/' && source[index + 1] === '/') {
      const end = source.indexOf('\n', index + 2);
      index = end < 0 ? source.length : end + 1;
      continue;
    }
    if (ch === '/' && source[index + 1] === '*') {
      const end = source.indexOf('*/', index + 2);
      index = end < 0 ? source.length : end + 2;
      continue;
    }

    if (ch === '{') braces += 1;
    else if (ch === '}') {
      if (braces === 0 && brackets === 0 && parentheses === 0) return index;
      braces -= 1;
    } else if (ch === '[') brackets += 1;
    else if (ch === ']') brackets -= 1;
    else if (ch === '(') parentheses += 1;
    else if (ch === ')') parentheses -= 1;
    else if (ch === ',' && braces === 0 && brackets === 0 && parentheses === 0) {
      return index + 1;
    }
    index += 1;
  }
  return index;
}

function extractTopLevelKeys(source: string, openBrace: number): string[] {
  const keys: string[] = [];
  let depth = 0;
  let i = openBrace;

  while (i < source.length) {
    const ch = source[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipQuoted(source, i);
      continue;
    }
    if (ch === '/' && source[i + 1] === '/') {
      i = source.indexOf('\n', i + 2);
      if (i < 0) break;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end < 0 ? source.length : end + 2;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      i += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) break;
      i += 1;
      continue;
    }

    if (depth === 1) {
      if (/\s|,/.test(ch)) {
        i += 1;
        continue;
      }
      if (source.startsWith('...', i)) {
        while (i < source.length && source[i] !== ',' && source[i] !== '}') i += 1;
        continue;
      }

      let key = '';
      if (/[A-Za-z_$]/.test(ch)) {
        const start = i;
        i += 1;
        while (i < source.length && /[A-Za-z0-9_$]/.test(source[i])) i += 1;
        key = source.slice(start, i);
      } else if (ch === '"' || ch === "'") {
        const start = i + 1;
        const end = skipQuoted(source, i) - 1;
        key = source.slice(start, end);
        i = end + 1;
      } else {
        i += 1;
        continue;
      }

      while (i < source.length && /\s/.test(source[i])) i += 1;
      if (source[i] === ':') {
        keys.push(key.toLowerCase());
        i = skipPropertyValue(source, i + 1);
        continue;
      }
      continue;
    }
    i += 1;
  }
  return [...new Set(keys)];
}

/** Columns of `billing_schedules` as declared by the generated database types. */
function billingScheduleColumns(): Set<string> {
  const generated = readFileSync(resolve(root, 'types/database.generated.ts'), 'utf8');
  const tableStart = generated.indexOf('\n      billing_schedules: {');
  const rowStart = generated.indexOf('        Row: {', tableStart);
  const rowEnd = generated.indexOf('        }', rowStart);
  const columns = new Set<string>();
  for (const line of generated.slice(rowStart, rowEnd).split('\n')) {
    const column = /^ {10}"?([A-Za-z_][A-Za-z0-9_]*)"?\??:/.exec(line);
    if (column) columns.add(column[1]);
  }
  return columns;
}

function billingScheduleUpdatePayload(): { source: string; openBrace: number } {
  const fromIndex = handlerSource.indexOf(".from('billing_schedules')");
  expect(fromIndex).toBeGreaterThan(-1);
  const updateIndex = handlerSource.indexOf('.update({', fromIndex);
  expect(updateIndex).toBeGreaterThan(-1);
  const openBrace = handlerSource.indexOf('{', updateIndex);
  let depth = 0;
  for (let i = openBrace; i < handlerSource.length; i += 1) {
    if (handlerSource[i] === '{') depth += 1;
    if (handlerSource[i] === '}') {
      depth -= 1;
      if (depth === 0) return { source: handlerSource.slice(openBrace, i + 1), openBrace };
    }
  }
  throw new Error('Unterminated billing_schedules update payload');
}

it('sends only real billing_schedules columns in the scheduled-invoice update', () => {
  const columns = billingScheduleColumns();
  expect(columns.size).toBeGreaterThan(0);

  const { source, openBrace } = billingScheduleUpdatePayload();
  expect(source).toContain('remaining_tuition_cents');
  const keys = extractTopLevelKeys(handlerSource, openBrace);

  // A top-level conditional spread hides the payload assignment from the CI
  // auditor, which then reports the nested JSON key `remaining_tuition_cents`
  // as an unknown column and fails the release.
  const unknown = keys.filter((key) => !columns.has(key));
  expect(unknown).toEqual([]);
  expect(keys).toContain('fulfillment_payload');
});

const state = vi.hoisted(() => ({ row: {} as Record<string, any>, invoice: vi.fn(), updated: false }));

vi.mock('@/lib/billing/providers/quickbooks', () => ({
  createQuickBooksBillingProvider: () => ({ createManualInvoice: state.invoice }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: () => {
      const q: any = {
        error: null,
        select: () => q,
        eq: () => q,
        lte: () => q,
        limit: async () => ({
          data: state.row.status === 'active' ? [state.row] : [],
          error: null,
        }),
        maybeSingle: async () => ({ data: state.updated ? { id: state.row.id } : null, error: null }),
        update: (values: Record<string, unknown>) => {
          // postgrest-js sends `JSON.stringify(body)`, so undefined properties
          // never reach PostgREST and the stored column keeps its value.
          state.updated = true;
          state.row = { ...state.row, ...(JSON.parse(JSON.stringify(values)) as Record<string, unknown>) };
          return q;
        },
      };
      return q;
    },
  }),
}));


function activeSchedule(overrides: Record<string, unknown> = {}) {
  return {
    id: 'schedule',
    status: 'active',
    customer_external_key: 'user:student',
    customer_name: 'Student',
    customer_email: 'student@example.test',
    canonical_product_key: 'barber',
    product_name: 'Barber tuition',
    amount_cents: 15104,
    cadence: 'weekly',
    next_invoice_date: '2026-11-13',
    remaining_invoices: 29,
    fulfillment_type: 'tuition_payment',
    fulfillment_payload: { remaining_tuition_cents: 438000 },
    ...overrides,
  };
}

async function runOnce() {
  return POST(
    new NextRequest('https://example.test/cron', {
      method: 'POST',
      headers: { authorization: 'Bearer test-cron' },
    }),
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  state.updated = false;
});

it('reduces the remaining tuition balance after a capped invoice', async () => {
  vi.stubEnv('CRON_SECRET', 'test-cron');
  state.row = activeSchedule();

  expect((await runOnce()).status).toBe(200);

  expect(state.invoice).toHaveBeenCalledTimes(1);
  expect(state.row.fulfillment_payload.remaining_tuition_cents).toBe(438000 - 15104);
  expect(state.row.remaining_invoices).toBe(28);
  expect(state.row.status).toBe('active');
});

it('leaves the stored payload untouched when no tuition balance is tracked', async () => {
  vi.stubEnv('CRON_SECRET', 'test-cron');
  state.row = activeSchedule({
    fulfillment_payload: { enrollment_id: 'enrollment' },
  });

  expect((await runOnce()).status).toBe(200);

  expect(state.invoice).toHaveBeenCalledTimes(1);
  // An undefined payload is dropped during serialization, so PostgREST keeps
  // the stored value instead of overwriting it with an empty object.
  expect(state.row.fulfillment_payload).toEqual({ enrollment_id: 'enrollment' });
  expect(state.row.remaining_invoices).toBe(28);
});

it('marks a schedule completed when the final invoice exhausts tuition', async () => {
  vi.stubEnv('CRON_SECRET', 'test-cron');
  state.updated = false;
  state.row = activeSchedule({ remaining_invoices: 1, fulfillment_payload: { remaining_tuition_cents: 10000 } });
  expect((await runOnce()).status).toBe(200);
  expect(state.row.status).toBe('completed');
  expect(state.row.remaining_invoices).toBe(0);
  expect(state.row.fulfillment_payload.remaining_tuition_cents).toBe(0);
});
