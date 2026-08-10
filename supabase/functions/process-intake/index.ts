/**
 * process-intake Edge Function
 *
 * Reads received rows from application_intake and routes them into the
 * canonical workflow tables. Student/general applications MUST use
 * public.applications; student_applications is retired.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BATCH_SIZE = 25;

type Payload = Record<string, unknown>;
type RowMapper = (payload: Payload, tenantId: string | null) => {
  table: string;
  record: Record<string, unknown>;
};

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function uuidOrNull(value: unknown): string | null {
  const candidate = stringValue(value);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)
    ? candidate
    : null;
}

function canonicalApplicationRecord(p: Payload): Record<string, unknown> {
  const fullName = stringValue(p.full_name || p.name);
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = stringValue(p.first_name) || parts[0] || '';
  const lastName = stringValue(p.last_name) || parts.slice(1).join(' ');
  const rawProgram = stringValue(p.program_slug || p.program_interest || p.program || p.program_id);
  const programId = uuidOrNull(p.program_id);
  const programSlug = stringValue(p.program_slug) || (!programId ? stringValue(p.program_id || p.program) : '');
  const funding = stringValue(p.funding_type || p.funding_source || p.funding);

  return {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName || [firstName, lastName].filter(Boolean).join(' '),
    email: stringValue(p.email),
    phone: stringValue(p.phone) || null,
    program_id: programId,
    program_slug: programSlug || null,
    program_interest: rawProgram || 'General Inquiry',
    funding_type: stringValue(p.funding_type) || funding || null,
    funding_source: stringValue(p.funding_source) || funding || null,
    notes: stringValue(p.notes) || null,
    metadata: {
      ...(typeof p.data === 'object' && p.data !== null ? (p.data as Record<string, unknown>) : {}),
      intake_payload: p,
    },
    status: 'submitted',
    state: 'submitted',
    source: 'application_intake',
    submitted_at: new Date().toISOString(),
  };
}

const ROUTE_MAP: Record<string, RowMapper> = {
  student: (p) => ({
    table: 'applications',
    record: canonicalApplicationRecord(p),
  }),

  application: (p) => ({
    table: 'applications',
    record: canonicalApplicationRecord(p),
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

  partner: (p) => ({
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

  barbershop_partner: (p) => ({
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

  shop: (p) => ({
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

  affiliate: (p) => ({
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

  funding: (p) => ({
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

  job: (p) => ({
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

  tax: (p) => ({
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

  submission: (p) => ({
    table: 'application_submissions',
    record: {
      program_id: p.program_id,
      data: p.data ?? {},
      notes: p.notes ?? null,
      status: 'submitted',
    },
  }),
};

interface IntakeRow {
  id: string;
  application_type: string;
  program_id: string | null;
  payload: Payload;
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
    return new Response(JSON.stringify({ error: 'Fetch failed', detail: fetchErr.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!rows || rows.length === 0) {
    return new Response(JSON.stringify({ message: 'No pending intake rows', processed: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results: ProcessResult[] = [];
  for (const row of rows as IntakeRow[]) {
    results.push(await processRow(db, row));
  }

  const succeeded = results.filter((result) => result.ok).length;
  const failed = results.length - succeeded;

  return new Response(JSON.stringify({ processed: results.length, succeeded, failed, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

async function processRow(db: SupabaseClient, row: IntakeRow): Promise<ProcessResult> {
  if (row.application_type === 'career') return processCareer(db, row);

  const mapper = ROUTE_MAP[row.application_type];
  if (!mapper) {
    await markRejected(db, row.id, `Unknown application_type: ${row.application_type}`);
    return { intake_id: row.id, ok: false, error: `Unknown type: ${row.application_type}` };
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

    await db
      .from('application_intake')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        destination_table: table,
        destination_id: inserted.id,
      })
      .eq('id', row.id);

    await db.from('application_state_events').insert({
      application_type: row.application_type,
      application_id: inserted.id,
      to_state: 'submitted',
    }).then(({ error }) => {
      if (error) console.error('State event error:', error.message);
    });

    return {
      intake_id: row.id,
      ok: true,
      destination_table: table,
      destination_id: inserted.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markRejected(db, row.id, message);
    return { intake_id: row.id, ok: false, error: message };
  }
}

async function processCareer(db: SupabaseClient, row: IntakeRow): Promise<ProcessResult> {
  const p = row.payload;

  try {
    const { data: startResult, error: startErr } = await db.rpc('start_application', {
      p_first_name: p.first_name || '',
      p_last_name: p.last_name || '',
      p_email: p.email || '',
      p_phone: p.phone || '',
    });

    if (startErr || !startResult?.success) {
      const message = startErr?.message || startResult?.error || 'start_application failed';
      await markRejected(db, row.id, message);
      return { intake_id: row.id, ok: false, error: message };
    }

    const applicationId = startResult.application_id;
    const personalFields = [
      'date_of_birth',
      'address',
      'city',
      'state',
      'zip_code',
      'high_school',
      'graduation_year',
      'gpa',
      'college',
      'major',
    ];
    const personalData: Record<string, unknown> = {};
    for (const field of personalFields) {
      if (p[field]) personalData[field] = p[field];
    }

    if (Object.keys(personalData).length > 0) {
      await db.rpc('advance_application_state', {
        p_application_id: applicationId,
        p_next_state: 'eligibility_complete',
        p_data: personalData,
      });
    }

    await db
      .from('application_intake')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        destination_table: 'career_applications',
        destination_id: applicationId,
      })
      .eq('id', row.id);

    return {
      intake_id: row.id,
      ok: true,
      destination_table: 'career_applications',
      destination_id: applicationId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markRejected(db, row.id, message);
    return { intake_id: row.id, ok: false, error: message };
  }
}

async function markRejected(db: SupabaseClient, id: string, error: string): Promise<void> {
  await db
    .from('application_intake')
    .update({ status: 'rejected', error: error.slice(0, 1000) })
    .eq('id', id);
}
