/**
 * POST /api/admin/certifications/import
 *
 * Accepts a CSV file (multipart/form-data, field name "file") and upserts
 * user_certifications rows. Matches on user email → user_id via profiles.
 *
 * Expected CSV columns (header row required):
 *   email, certification_name, certification_type, status,
 *   earned_date, expires_at
 *
 * Returns: { imported: number, skipped: number, errors: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUIRED_COLS = ['email', 'certification_name', 'status'];
const VALID_STATUSES = new Set(['pending', 'active', 'expired', 'revoked']);

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const rows = lines.slice(1).map((line) => {
    // Simple CSV parse — handles quoted fields
    const vals: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        vals.push(cur.trim()); cur = '';
      } else {
        cur += ch;
      }
    }
    vals.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });

  return { headers, rows };
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return safeError('Expected multipart/form-data', 400);
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return safeError('No file uploaded. Send a CSV as field "file".', 400);
  }

  const text = await (file as File).text();
  const { headers, rows } = parseCSV(text);

  if (!headers.length) return safeError('CSV is empty or has no header row', 400);

  const missing = REQUIRED_COLS.filter((c) => !headers.includes(c));
  if (missing.length) {
    return safeError(`CSV missing required columns: ${missing.join(', ')}`, 400);
  }

  const db = await requireAdminClient();

  // Build email → user_id map for all emails in the CSV
  const emails = [...new Set(rows.map((r) => r.email).filter(Boolean))];
  const { data: profiles } = await db
    .from('profiles')
    .select('id, email')
    .in('email', emails);

  const emailToId = new Map((profiles ?? []).map((p: any) => [p.email, p.id]));

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // 1-based + header

    if (!row.email) { errors.push(`Line ${lineNum}: missing email`); skipped++; continue; }
    if (!row.certification_name) { errors.push(`Line ${lineNum}: missing certification_name`); skipped++; continue; }

    const status = row.status || 'pending';
    if (!VALID_STATUSES.has(status)) {
      errors.push(`Line ${lineNum}: invalid status "${status}" — must be pending|active|expired|revoked`);
      skipped++;
      continue;
    }

    const userId = emailToId.get(row.email);
    if (!userId) {
      errors.push(`Line ${lineNum}: no user found for email "${row.email}"`);
      skipped++;
      continue;
    }

    const record: Record<string, unknown> = {
      user_id: userId,
      certification_name: row.certification_name,
      certification_type: row.certification_type || null,
      status,
      earned_date: row.earned_date || null,
      expires_at: row.expires_at || null,
    };

    const { error } = await db.from('user_certifications').insert(record);
    if (error) {
      errors.push(`Line ${lineNum}: ${error.message}`);
      skipped++;
    } else {
      imported++;
    }
  }

  return NextResponse.json({ imported, skipped, errors: errors.slice(0, 50) });
}
