/**
 * Supabase PIRL Data Adapter
 *
 * Maps existing DB tables to PIRL element numbers for quarterly export.
 *
 * Tables used:
 *   wioa_participants        — demographics, enrollment/exit dates
 *   wioa_participant_records — reporting-period-specific outcome data
 *   employment_outcomes      — post-exit employment tracking
 *   profiles                 — user profile data (zip, address)
 *   training_enrollments     — program enrollment details
 *   training_courses         — program/course metadata (O*NET codes)
 *   certificates             — credential attainment records
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { PirlDataAdapter, ParticipantPirlRow, Quarter } from './pirl_exporter';

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function parseQuarter(q: Quarter): { yearStart: string; yearEnd: string } {
  // e.g. "2025Q4" → Oct 1 2025 – Dec 31 2025
  const match = q.match(/^(\d{4})Q([1-4])$/);
  if (!match) throw new Error(`Invalid quarter: ${q}`);
  const year = Number(match[1]);
  const qn = Number(match[2]);
  const monthStart = (qn - 1) * 3 + 1;
  const monthEnd = qn * 3;
  const lastDay = new Date(year, monthEnd, 0).getDate();
  return {
    yearStart: `${year}-${String(monthStart).padStart(2, '0')}-01`,
    yearEnd: `${year}-${String(monthEnd).padStart(2, '0')}-${lastDay}`,
  };
}

/**
 * Map gender text to PIRL code:
 *   1 = Male, 2 = Female
 */
function mapGender(g: string | null): number | null {
  if (!g) return null;
  const lower = g.toLowerCase();
  if (lower === 'male' || lower === 'm') return 1;
  if (lower === 'female' || lower === 'f') return 2;
  return null;
}

/**
 * Map race/ethnicity text to individual PIRL race elements.
 * Returns { '201': 0|1, '202': 0|1, ..., '206': 0|1 }
 */
function mapRaceEthnicity(re: string | null): Record<string, number> {
  const result: Record<string, number> = {
    '201': 0, // Hispanic/Latino
    '202': 0, // American Indian/Alaska Native
    '203': 0, // Asian
    '204': 0, // Black/African American
    '205': 0, // Native Hawaiian/Pacific Islander
    '206': 0, // White
  };
  if (!re) return result;
  const lower = re.toLowerCase();
  if (lower.includes('hispanic') || lower.includes('latino')) result['201'] = 1;
  if (lower.includes('american indian') || lower.includes('alaska native')) result['202'] = 1;
  if (lower.includes('asian')) result['203'] = 1;
  if (lower.includes('black') || lower.includes('african american')) result['204'] = 1;
  if (lower.includes('native hawaiian') || lower.includes('pacific islander')) result['205'] = 1;
  if (lower.includes('white') || lower.includes('caucasian')) result['206'] = 1;
  return result;
}

/**
 * Map employment status text to PIRL code:
 *   1 = Employed, 2 = Employed but received notice of termination,
 *   3 = Not employed
 */
function mapEmploymentStatus(s: string | null): number | null {
  if (!s) return null;
  const lower = s.toLowerCase();
  if (lower.includes('employed') && !lower.includes('not') && !lower.includes('un')) return 1;
  if (lower.includes('unemployed') || lower.includes('not employed')) return 3;
  return null;
}

/**
 * Map boolean employment outcome to PIRL code:
 *   1 = Employed, 0 = Not employed, 9 = Information not yet available
 */
function mapEmployedBoolean(v: boolean | null | undefined): number {
  if (v === true) return 1;
  if (v === false) return 0;
  return 9; // not yet available
}

export function createSupabaseAdapter(): PirlDataAdapter {
  const supabase: SupabaseClient = createClient(
    mustEnv('NEXT_PUBLIC_SUPABASE_URL'),
    mustEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } }
  );

  return {
    async fetchParticipantsForQuarter(quarter: Quarter): Promise<ParticipantPirlRow[]> {
      const { yearStart, yearEnd } = parseQuarter(quarter);

      // Fetch participants with enrollment/exit dates overlapping the quarter
      const { data: participants, error: pErr } = await supabase
        .from('wioa_participants')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          date_of_birth,
          ssn_hash,
          email,
          phone,
          address,
          eligibility_status,
          enrollment_date,
          exit_date,
          program_id,
          funding_source
        `)
        .or(`enrollment_date.lte.${yearEnd},exit_date.is.null,exit_date.gte.${yearStart}`)
        .eq('eligibility_status', 'verified');

      if (pErr) throw new Error(`Failed to fetch participants: ${pErr.message}`);
      if (!participants || participants.length === 0) return [];

      const userIds = participants.map((p) => p.user_id).filter(Boolean);
      const participantIds = participants.map((p) => p.id);

      // Batch fetch related data
      const [recordsResult, outcomesResult, profilesResult, certsResult] = await Promise.all([
        supabase
          .from('wioa_participant_records')
          .select('*')
          .in('participant_id', participantIds),
        supabase
          .from('employment_outcomes')
          .select('*')
          .in('user_id', userIds),
        supabase
          .from('profiles')
          .select('id, full_name, zip_code')
          .in('id', userIds),
        supabase
          .from('certificates')
          .select('id, user_id, credential_name, issued_at, status')
          .in('user_id', userIds)
          .eq('status', 'active'),
      ]);

      const records = recordsResult.data ?? [];
      const outcomes = outcomesResult.data ?? [];
      const profiles = profilesResult.data ?? [];
      const certs = certsResult.data ?? [];

      // Index by user/participant ID for fast lookup
      const recordsByParticipant = new Map<string, typeof records[0]>();
      for (const r of records) {
        if (r.participant_id) recordsByParticipant.set(r.participant_id, r);
      }

      const outcomesByUser = new Map<string, typeof outcomes[0]>();
      for (const o of outcomes) {
        outcomesByUser.set(o.user_id, o);
      }

      const profilesByUser = new Map<string, typeof profiles[0]>();
      for (const p of profiles) {
        profilesByUser.set(p.id, p);
      }

      const certsByUser = new Map<string, typeof certs[0]>();
      for (const c of certs) {
        if (!certsByUser.has(c.user_id)) certsByUser.set(c.user_id, c);
      }

      // Map each participant to PIRL elements
      return participants.map((p) => {
        const record = recordsByParticipant.get(p.id);
        const outcome = p.user_id ? outcomesByUser.get(p.user_id) : undefined;
        const profile = p.user_id ? profilesByUser.get(p.user_id) : undefined;
        const cert = p.user_id ? certsByUser.get(p.user_id) : undefined;
        const raceElements = mapRaceEthnicity(record?.race_ethnicity ?? null);
        const zip = profile?.zip_code ?? (p.address as { zip?: string })?.zip ?? null;

        // Generate a stable 12-char identifier from participant UUID
        const uid = p.id.replace(/-/g, '').slice(0, 12).toUpperCase();

        const elements: Record<string, unknown> = {
          // Section A: Individual Information
          '100': uid,
          '101': record?.ssn_last4 ? `*****${record.ssn_last4}` : null,
          '102': p.date_of_birth,
          '103': zip,
          '200': record?.disability_status ? 1 : 0,
          ...raceElements,
          '300': mapGender(record?.gender ?? null),
          '301': record?.veteran_status ? 1 : 0,

          // Section B: Education/Employment at Entry
          '400': mapEmploymentStatus(record?.employment_status_at_entry ?? null),
          '401': record?.education_level_at_entry ?? null,

          // Section C: Participation
          '900': p.enrollment_date,
          '901': p.exit_date,
          '923': p.funding_source?.toLowerCase().includes('wioa') ? 1 : 0,
          '924': 0,
          '925': 0,
          '930': 0,

          // Section D: Services
          '1000': 1, // All our participants receive training
          '1002': '01', // Occupational skills training (ITA)
          '1010': null, // O*NET code — populate from training_courses if available

          // Section E: Outcomes
          '1600': mapEmployedBoolean(record?.employed_q2_after_exit),
          '1602': mapEmployedBoolean(record?.employed_q2_after_exit),
          '1604': mapEmployedBoolean(record?.employed_q4_after_exit),
          '1700': record?.median_earnings_q2 ?? (outcome?.annual_salary ? Math.round(outcome.annual_salary / 4) : 0),
          '1800': cert ? 1 : 0, // 1 = certificate
          '1801': cert?.issued_at ?? null,
          '1811': record?.measurable_skill_gain ? 1 : 0,
          '1812': 0,
          '1813': record?.measurable_skill_gain ? 1 : 0,
          '1814': 0,
          '1815': 0,

          // Section F: Youth
          '1901': 0,
          '1902': 0,
        };

        return {
          uniqueIndividualIdentifier: uid,
          elements,
        };
      });
    },
  };
}
