/**
 * Supabase PIRL Data Adapter — Real Data Version
 *
 * Calls the wioa_participants_for_quarter RPC which joins:
 *   wioa_participants, wioa_participant_records, profiles,
 *   employment_outcomes, certificates
 *
 * Returns participant rows mapped to PIRL element numbers.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { PirlDataAdapter, ParticipantPirlRow, Quarter } from './pirl_exporter';

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function parseQuarter(q: Quarter): { start: string; end: string } {
  const match = q.match(/^(\d{4})Q([1-4])$/);
  if (!match) throw new Error(`Invalid quarter format: ${q}`);
  const year = Number(match[1]);
  const qn = Number(match[2]);
  const monthStart = (qn - 1) * 3 + 1;
  const monthEnd = qn * 3;
  const lastDay = new Date(year, monthEnd, 0).getDate();
  return {
    start: `${year}-${String(monthStart).padStart(2, '0')}-01`,
    end: `${year}-${String(monthEnd).padStart(2, '0')}-${lastDay}`,
  };
}

// ── Value transforms ───────────────────────────────────────────────────────

function genderCode(g: string | null): number | null {
  if (!g) return null;
  const l = g.toLowerCase();
  if (l === 'male' || l === 'm') return 1;
  if (l === 'female' || l === 'f') return 2;
  return null;
}

function raceFlags(re: string | null): Record<string, number> {
  const r: Record<string, number> = {
    '201': 0, '202': 0, '203': 0, '204': 0, '205': 0, '206': 0,
  };
  if (!re) return r;
  const l = re.toLowerCase();
  if (l.includes('hispanic') || l.includes('latino')) r['201'] = 1;
  if (l.includes('american indian') || l.includes('alaska native')) r['202'] = 1;
  if (l.includes('asian')) r['203'] = 1;
  if (l.includes('black') || l.includes('african american')) r['204'] = 1;
  if (l.includes('native hawaiian') || l.includes('pacific islander')) r['205'] = 1;
  if (l.includes('white') || l.includes('caucasian')) r['206'] = 1;
  return r;
}

function employmentCode(s: string | null): number | null {
  if (!s) return null;
  const l = s.toLowerCase();
  if (l.includes('employed') && !l.includes('not') && !l.includes('un')) return 1;
  if (l.includes('unemployed') || l.includes('not employed')) return 3;
  return null;
}

/** Boolean → PIRL employment outcome code: 1=yes, 0=no, 9=unknown */
function boolTo019(v: boolean | null | undefined): number {
  if (v === true) return 1;
  if (v === false) return 0;
  return 9;
}

function boolTo01(v: boolean | null | undefined): number {
  return v === true ? 1 : 0;
}

// ── Adapter ────────────────────────────────────────────────────────────────

export function createSupabaseAdapter(): PirlDataAdapter {
  const supabase: SupabaseClient = createClient(
    mustEnv('NEXT_PUBLIC_SUPABASE_URL'),
    mustEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } }
  );

  return {
    async fetchParticipantsForQuarter(quarter: Quarter): Promise<ParticipantPirlRow[]> {
      const { start, end } = parseQuarter(quarter);

      // Call the RPC that joins all relevant tables
      const { data, error } = await supabase.rpc('wioa_participants_for_quarter', {
        quarter_start: start,
        quarter_end: end,
      });

      if (error) {
        throw new Error(`RPC wioa_participants_for_quarter failed: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.warn(`No participants found for quarter ${quarter} (${start} to ${end})`);
        return [];
      }

      return data.map((row: any) => {
        const uid = (row.participant_id as string).replace(/-/g, '').slice(0, 12).toUpperCase();
        const race = raceFlags(row.race_ethnicity);

        const elements: Record<string, unknown> = {
          // Section A: Individual Information
          '100': uid,
          '101': row.ssn_last4 ? `*****${row.ssn_last4}` : null,
          '102': row.date_of_birth,
          '103': row.zip_code,
          '200': boolTo01(row.disability_status),
          ...race,
          '300': genderCode(row.gender),
          '301': boolTo01(row.veteran_status),

          // Section B: Education/Employment at Entry
          '400': employmentCode(row.employment_status_at_entry),
          '401': row.education_level_at_entry,

          // Section C: Participation
          '900': row.enrollment_date,
          '901': row.exit_date,
          '903': null,
          '923': row.funding_source?.toLowerCase().includes('wioa') ? 1 : 0,
          '924': 0,
          '925': 0,
          '930': 0,

          // Section D: Services
          '1000': 1,
          '1002': '01',
          '1010': null,

          // Section E: Outcomes
          '1600': boolTo019(row.employed_q2_after_exit),
          '1602': boolTo019(row.employed_q2_after_exit),
          '1604': boolTo019(row.employed_q4_after_exit),
          '1700': row.median_earnings_q2 ?? (row.annual_salary ? Math.round(row.annual_salary / 4) : 0),
          '1800': row.credential_attained ? 1 : 0,
          '1801': row.credential_issued_at,
          '1811': boolTo01(row.measurable_skill_gain),
          '1812': 0,
          '1813': boolTo01(row.measurable_skill_gain),
          '1814': 0,
          '1815': 0,

          // Section F: Youth
          '1901': 0,
          '1902': 0,
        };

        return { uniqueIndividualIdentifier: uid, elements };
      });
    },
  };
}
