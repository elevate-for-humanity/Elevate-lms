/**
 * process-intake Edge Function
 *
 * Reads 'received' rows from application_intake, maps each to its
 * destination workflow table, inserts with resolved_tenant_id, marks
 * the intake row processed, and emits an application_state_event.
 *
 * Run manually or on a cron schedule. Uses service_role — never
 * exposed to the public.
 *
 * Copyright (c) 2025–2026 Elevate for Humanity
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BATCH_SIZE = 25;

// ── Per-type routing ───────────────────────────────────────────
// Each handler extracts fields from payload and returns the record
// to insert into the destination table.

type RowMapper = (
  payload: Record<string, unknown>,
  tenantId: string | null
) => { table: string; record: Record<string, unknown> };

const ROUTE_MAP: Record<string, RowMapper> = {
  student: (p, t) => ({
    table: 'student_applications',
    record: {
      tenant_id: t,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone ?? null,
      program_id: p.program_id ?? null,
      funding_type: p.funding_type ?? null,
      notes: p.notes ?? null,
      data: p.data ?? null,
      status: 'submitted',
      source: 'public_form',
    },
  }),

  employer: (p, t) => ({
    table: 'employer_applications',
    record: {
      tenant_id: t,
      company_name: p.company_name,
      contact_name: p.contact_name,
      email: p.email,
      phone: p.phone ?? null,
      industry: p.industry ?? null,
      employee_count: p.employee_count ?? null,
      hiring_needs: p.hiring_needs ?? null,
      notes: p.notes ?? null,
      status: 'submitted',
      source: 'public_form',
    },
  }),

  staff: (p, t) => ({
    table: 'staff_applications',
    record: {
      tenant_id: t,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone ?? null,
      position: p.position ?? null,
      resume_url: p.resume_url ?? null,
      cover_letter: p.cover_letter ?? null,
      notes: p.notes ?? null,
      status: 'submitted',
      source: 'public_form',
    },
  }),

  program_holder: (p, t) => ({
    table: 'program_holder_applications',
    record: {
      tenant_id: t,
      organization_name: p.organization_name,
      contact_name: p.contact_name,
      email: p.email,
      phone: p.phone ?? null,
      website: p.website ?? null,
      program_types: p.program_types ?? null,
      notes: p.notes ?? null,
      status: 'submitted',
      source: 'public_form',
    },
  }),

  partner: (p, _t) => ({
    table: 'partner_applications',
    record: {
      shop_name: p.shop_name,
      owner_name: p.owner_name,
      contact_email: p.contact_email,
      phone: p.phone,
      address_line1: p.address_line1,
      address_line2: p.address_line2 ?? null,
      city: p.city,
      state: p.state,
      zip: p.zip,
      website: p.website ?? null,
      notes: p.notes ?? null,
      status: 'submitted',
    },
  }),

  barbershop_partner: (p, _t) => ({
    table: 'barbershop_partner_applications',
    record: {
      shop_legal_name: p.shop_legal_name,
      owner_name: p.owner_name,
      contact_name: p.contact_name,
      contact_email: p.contact_email,
      contact_phone: p.contact_phone,
      shop_address_line1: p.shop_address_line1,
      shop_address_line2: p.shop_address_line2 ?? null,
      shop_city: p.shop_city,
      shop_state: p.shop_state ?? null,
      shop_zip: p.shop_zip,
      indiana_shop_license_number: p.indiana_shop_license_number,
      supervisor_name: p.supervisor_name,
      supervisor_license_number: p.supervisor_license_number,
      employment_model: p.employment_model,
      stations_available: p.stations_available ?? null,
      notes: p.notes ?? null,
      status: 'submitted',
    },
  }),

  shop: (p, _t) => ({
    table: 'shop_applications',
    record: {
      shop_name: p.shop_name,
      owner_name: p.owner_name,
      email: p.email,
      phone: p.phone,
      address: p.address,
      city: p.city,
      state: p.state ?? null,
      zip: p.zip,
      website: p.website ?? null,
      notes: p.notes ?? null,
      status: 'submitted',
    },
  }),

  application: (p, _t) => ({
    table: 'applications',
    record: {
      name: p.name ?? null,
      email: p.email,
      phone: p.phone ?? null,
      program: p.program,
      funding: p.funding ?? null,
      eligible: p.eligible ?? null,
      notes: p.notes ?? null,
      status: 'submitted',
    },
  }),

  affiliate: (p, _t) => ({
    table: 'affiliate_applications',
    record: {
      email: p.email ?? null,
      full_name: p.full_name ?? null,
      phone: p.phone ?? null,
      website: p.website ?? null,
      social_media: p.social_media ?? null,
      audience_size: p.audience_size ?? null,
      notes: p.notes ?? null,
      status: 'submitted',
    },
  }),

  funding: (p, _t) => ({
    table: 'funding_applications',
    record: {
      email: p.email ?? null,
      full_name: p.full_name ?? null,
      phone: p.phone ?? null,
      program_type: p.program_type,
      funding_source: p.funding_source ?? null,
      notes: p.notes ?? null,
      status: 'submitted',
    },
  }),

  job: (p, _t) => ({
    table: 'job_applications',
    record: {
      email: p.email ?? null,
      full_name: p.full_name ?? null,
      phone: p.phone ?? null,
      position: p.position ?? null,
      resume_url: p.resume_url ?? null,
      cover_letter: p.cover_letter ?? null,
      notes: p.notes ?? null,
      status: 'submitted',
    },
  }),

  supersonic: (p, _t) => ({
    table: 'supersonic_applications',
    record: {
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      phone: p.phone,
      service_type: p.service_type ?? null,
      tax_year: p.tax_year ?? null,
      notes: p.notes ?? null,
      status: 'submitted',
    },
  }),

  tax: (p, _t) => ({
    table: 'tax_applications',
    record: {
      email: p.email ?? null,
      full_name: p.full_name ?? null,
      phone: p.phone ?? null,
      tax_year: p.tax_year ?? null,
      service_type: p.service_type ?? null,
      filing_status: p.filing_status ?? null,
      notes: p.notes ?? null,
      status: 'submitted',
    },
  }),

  submission: (p, _t) => ({
    table: 'application_submissions',
    record: {
      program_id: p.program_id,
      data: p.data ?? {},
      notes: p.notes ?? null,
      status: 'submitted',
    },
  }),
};

// Career applications use the state-machine RPCs, handled separately.

// ── Interfaces ─────────────────────────────────────────────────

interface IntakeRow {
  id: string;
  application_type: string;
  program_id: string | null;
  payload: Record<string, unknown>;
  resolved_tenant_id: string | null;
  created_at: string;
}

interface ProcessResult {
  intake_id: string;
  ok: boolean;
  destination_table?: string;
  destination_id?: string;
  error?: string;
}

// ── Main ───────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: rows, error: fetchErr } = await db
    .from('application_intake')
    .select('*')
    .eq('status', 'received')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchErr) {
    return new Response(
      JSON.stringify({ error: 'Fetch failed', detail: fetchErr.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!rows || rows.length === 0) {
    return new Response(
      JSON.stringify({ message: 'No pending intake rows', processed: 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const results: ProcessResult[] = [];

  for (const row of rows as IntakeRow[]) {
    const result = await processRow(db, row);
    results.push(result);
  }

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return new Response(
    JSON.stringify({ processed: results.length, succeeded, failed, results }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});

// ── Row processor ──────────────────────────────────────────────

async function processRow(db: SupabaseClient, row: IntakeRow): Promise<ProcessResult> {
  const type = row.application_type;

  // Career applications use the state-machine RPCs
  if (type === 'career') {
    return processCareer(db, row);
  }

  const mapper = ROUTE_MAP[type];
  if (!mapper) {
    await markRejected(db, row.id, `Unknown application_type: ${type}`);
    return { intake_id: row.id, ok: false, error: `Unknown type: ${type}` };
  }

  try {
    const { table, record } = mapper(row.payload, row.resolved_tenant_id);

    const { data: inserted, error: insertErr } = await db
      .from(table)
      .insert(record)
      .select('id')
      .single();

    if (insertErr) {
      await markRejected(db, row.id, insertErr.message);
      return { intake_id: row.id, ok: false, error: insertErr.message };
    }

    // Mark processed
    await db
      .from('application_intake')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        destination_table: table,
        destination_id: inserted.id,
      })
      .eq('id', row.id);

    // Emit state event (best-effort)
    await db
      .from('application_state_events')
      .insert({
        application_type: type,
        application_id: inserted.id,
        to_state: 'submitted',
      })
      .then(({ error }) => {
        if (error) console.error('State event error:', error.message);
      });

    return {
      intake_id: row.id,
      ok: true,
      destination_table: table,
      destination_id: inserted.id,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markRejected(db, row.id, msg);
    return { intake_id: row.id, ok: false, error: msg };
  }
}

// ── Career: state-machine RPCs ─────────────────────────────────

async function processCareer(db: SupabaseClient, row: IntakeRow): Promise<ProcessResult> {
  const p = row.payload;

  try {
    // 1. Start application
    const { data: startResult, error: startErr } = await db.rpc('start_application', {
      p_first_name: p.first_name || '',
      p_last_name: p.last_name || '',
      p_email: p.email || '',
      p_phone: p.phone || '',
    });

    if (startErr || !startResult?.success) {
      const msg = startErr?.message || startResult?.error || 'start_application failed';
      await markRejected(db, row.id, msg);
      return { intake_id: row.id, ok: false, error: msg };
    }

    const appId = startResult.application_id;

    // 2. Advance with personal data if available
    const personalFields = [
      'date_of_birth', 'address', 'city', 'state', 'zip_code',
      'high_school', 'graduation_year', 'gpa', 'college', 'major',
    ];
    const personalData: Record<string, unknown> = {};
    for (const f of personalFields) {
      if (p[f]) personalData[f] = p[f];
    }

    if (Object.keys(personalData).length > 0) {
      await db.rpc('advance_application_state', {
        p_application_id: appId,
        p_next_state: 'eligibility_complete',
        p_data: personalData,
      });
    }

    // Mark processed
    await db
      .from('application_intake')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        destination_table: 'career_applications',
        destination_id: appId,
      })
      .eq('id', row.id);

    return {
      intake_id: row.id,
      ok: true,
      destination_table: 'career_applications',
      destination_id: appId,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markRejected(db, row.id, msg);
    return { intake_id: row.id, ok: false, error: msg };
  }
}

// ── Helpers ────────────────────────────────────────────────────

async function markRejected(db: SupabaseClient, id: string, error: string): Promise<void> {
  await db
    .from('application_intake')
    .update({ status: 'rejected', error: error.slice(0, 1000) })
    .eq('id', id);
}
