/**
 * PIRL Exporter — Schema-driven quarterly WIOA reporting
 *
 * Produces ETA-9170 (Joint PIRL) and ETA-9172 (DOL-only PIRL) fixed-width
 * data files with validation reports. Schema-driven so field definitions
 * live in JSON, not hardcoded.
 *
 * References:
 *   ETA-9170 record layout: https://www.dol.gov/sites/dolgov/files/ETA/Performance/pdfs/ETA_9170%20CLEAN%202.6.2025%20%28Accessible%20PDF%29.pdf
 *   ETA-9172 DOL-only PIRL: https://www.dol.gov/sites/dolgov/files/ETA/Performance/pdfs/ICR/ETA%209172%20DOL%20only%20PIRL_CLEAN%202.6.2025%20%28Accessible%20PDF%29.pdf
 *   PIRL integrity specs:   https://www.dol.gov/agencies/eta/performance/reporting
 *
 * Usage:
 *   npx ts-node tools/wioa/pirl_exporter.ts init-schema [outPath]
 *   npx ts-node tools/wioa/pirl_exporter.ts export <schemaPath> <quarter> <outDir> <filePrefix>
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// ── Types ──────────────────────────────────────────────────────────────────

type PirlDataType = 'AN' | 'IN' | 'NU' | 'DT';

export type Quarter = `${number}Q${1 | 2 | 3 | 4}`;

export interface PirlFieldSpec {
  /** PIRL data element number (e.g. "100", "901", "1600") */
  element: string;
  /** Human-readable name */
  name: string;
  /** Data type per layout: AN=alphanumeric, IN=integer, NU=numeric, DT=date */
  type: PirlDataType;
  /** Fixed-width field length */
  length: number;
  /** Whether required for submission */
  required?: boolean;
  /** Allowed coded values */
  enum?: Array<string | number>;
  /** Blank allowed even when not required */
  allowBlank?: boolean;
  /** Padding rule (defaults: AN→rightSpace, IN/NU→leftZero, DT→rightSpace) */
  pad?: 'leftZero' | 'rightSpace';
}

export interface PirlSchema {
  id: string;
  fields: PirlFieldSpec[];
}

export interface ParticipantPirlRow {
  /** Stable unique ID (maps to PIRL element 100) */
  uniqueIndividualIdentifier: string;
  /** PIRL element number → raw value */
  elements: Record<string, unknown>;
}

export interface ExportOptions {
  schemaPath: string;
  quarter: Quarter;
  outputDir: string;
  filePrefix: string;
  maxErrors?: number;
}

export interface ValidationIssue {
  participantId: string;
  element: string;
  fieldName: string;
  severity: 'error' | 'warning';
  message: string;
  value: unknown;
}

export interface ExportResult {
  dataFilePath: string;
  reportFilePath: string;
  recordCount: number;
  errorCount: number;
  warningCount: number;
  checksumSha256: string;
}

/**
 * Adapter interface — implement against your DB.
 * Returns participants in scope for the given quarter with their PIRL elements.
 */
export interface PirlDataAdapter {
  fetchParticipantsForQuarter(quarter: Quarter): Promise<ParticipantPirlRow[]>;
}

// ── Utilities ──────────────────────────────────────────────────────────────

function mustReadJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

function sha256File(p: string): string {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(p));
  return h.digest('hex');
}

function isBlank(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
}

function formatDateYYYYMMDD(v: unknown): string | null {
  if (isBlank(v)) return null;
  if (typeof v === 'string') {
    const s = v.trim();
    if (/^\d{8}$/.test(s)) return s;
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return [
        d.getUTCFullYear().toString().padStart(4, '0'),
        (d.getUTCMonth() + 1).toString().padStart(2, '0'),
        d.getUTCDate().toString().padStart(2, '0'),
      ].join('');
    }
    return null;
  }
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return [
      v.getUTCFullYear().toString().padStart(4, '0'),
      (v.getUTCMonth() + 1).toString().padStart(2, '0'),
      v.getUTCDate().toString().padStart(2, '0'),
    ].join('');
  }
  return null;
}

function coerceToString(v: unknown): string | null {
  if (isBlank(v)) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return null;
}

function padFixedWidth(spec: PirlFieldSpec, value: string): string {
  const len = spec.length;
  const s = value.length > len ? value.slice(0, len) : value;
  const rule = spec.pad ?? (spec.type === 'AN' || spec.type === 'DT' ? 'rightSpace' : 'leftZero');
  if (s.length === len) return s;
  return rule === 'rightSpace' ? s.padEnd(len, ' ') : s.padStart(len, '0');
}

function normalizeEnumVal(v: unknown): string | number | null {
  if (isBlank(v)) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) return Number(v.trim());
  if (typeof v === 'string') return v.trim();
  return null;
}

// ── Validation + line building ─────────────────────────────────────────────

function validateAndFormatField(
  participantId: string,
  spec: PirlFieldSpec,
  raw: unknown
): { formatted: string; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const blank = () => ' '.repeat(spec.length);
  const issue = (severity: 'error' | 'warning', message: string) =>
    issues.push({ participantId, element: spec.element, fieldName: spec.name, severity, message, value: raw });

  // Required check
  if (spec.required && isBlank(raw)) {
    issue('error', 'Required field is blank');
    return { formatted: blank(), issues };
  }
  if (isBlank(raw)) {
    return { formatted: blank(), issues };
  }

  let str: string | null = null;

  // Date handling
  if (spec.type === 'DT') {
    const dt = formatDateYYYYMMDD(raw);
    if (!dt) {
      issue('error', 'Invalid date format; expected YYYYMMDD or ISO date');
      return { formatted: blank(), issues };
    }
    str = dt;
  } else {
    str = coerceToString(raw);
    if (str === null) {
      issue('error', 'Uncoercible value');
      return { formatted: blank(), issues };
    }
  }

  // Enum validation
  if (spec.enum && spec.enum.length > 0) {
    const ev = normalizeEnumVal(str);
    const ok = ev !== null && spec.enum.some((x) => x === ev || String(x) === String(ev));
    if (!ok) {
      issue('error', `Value not in allowed code set: [${spec.enum.join(', ')}]`);
    }
  }

  // Numeric type validation
  if (spec.type === 'IN' || spec.type === 'NU') {
    const s = str.trim();
    if (!/^-?\d+(\.\d+)?$/.test(s)) {
      issue('error', `Expected numeric for type ${spec.type}`);
      return { formatted: blank(), issues };
    }
    if (spec.type === 'IN' && s.includes('.')) {
      issue('warning', 'Integer-coded field contains decimal; truncating');
      str = s.split('.')[0];
    } else {
      str = s;
    }
  }

  // Length check
  if (str.length > spec.length) {
    issue('warning', `Value longer than field length ${spec.length}; truncating`);
  }

  return { formatted: padFixedWidth(spec, str), issues };
}

function buildFixedWidthLine(
  participantId: string,
  schema: PirlSchema,
  elements: Record<string, unknown>,
  maxErrors: number
): { line: string; issues: ValidationIssue[] } {
  const parts: string[] = [];
  const issues: ValidationIssue[] = [];

  for (const spec of schema.fields) {
    const r = validateAndFormatField(participantId, spec, elements[spec.element]);
    parts.push(r.formatted);
    issues.push(...r.issues);
    if (issues.filter((x) => x.severity === 'error').length >= maxErrors) break;
  }

  return { line: parts.join(''), issues };
}

// ── Export pipeline ────────────────────────────────────────────────────────

function summarizeIssues(issues: ValidationIssue[]): Record<string, { errors: number; warnings: number }> {
  const acc: Record<string, { errors: number; warnings: number }> = {};
  for (const i of issues) {
    const k = `${i.element} ${i.fieldName}`;
    if (!acc[k]) acc[k] = { errors: 0, warnings: 0 };
    if (i.severity === 'error') acc[k].errors += 1;
    else acc[k].warnings += 1;
  }
  return acc;
}

export async function exportQuarterlyPirl(
  adapter: PirlDataAdapter,
  opts: ExportOptions
): Promise<ExportResult> {
  const maxErrors = opts.maxErrors ?? 2000;
  const schema = mustReadJson<PirlSchema>(opts.schemaPath);

  fs.mkdirSync(opts.outputDir, { recursive: true });

  const participants = await adapter.fetchParticipantsForQuarter(opts.quarter);

  const dataFilePath = path.join(opts.outputDir, `${opts.filePrefix}_${opts.quarter}_${schema.id}.txt`);
  const reportFilePath = path.join(opts.outputDir, `${opts.filePrefix}_${opts.quarter}_${schema.id}.validation.json`);

  const out = fs.createWriteStream(dataFilePath, { encoding: 'utf8' });
  const allIssues: ValidationIssue[] = [];
  let recordCount = 0;

  for (const p of participants) {
    const elements = { ...p.elements };
    if (!elements['100']) elements['100'] = p.uniqueIndividualIdentifier;

    const { line, issues } = buildFixedWidthLine(p.uniqueIndividualIdentifier, schema, elements, maxErrors);
    out.write(line + '\n');
    recordCount += 1;
    allIssues.push(...issues);

    if (allIssues.filter((x) => x.severity === 'error').length >= maxErrors) break;
  }

  await new Promise<void>((resolve) => out.end(() => resolve()));

  const errorCount = allIssues.filter((x) => x.severity === 'error').length;
  const warningCount = allIssues.filter((x) => x.severity === 'warning').length;

  const report = {
    generatedAt: new Date().toISOString(),
    quarter: opts.quarter,
    schemaId: schema.id,
    recordCount,
    errorCount,
    warningCount,
    topErrors: allIssues.filter((x) => x.severity === 'error').slice(0, 200),
    topWarnings: allIssues.filter((x) => x.severity === 'warning').slice(0, 200),
    issuesByElement: summarizeIssues(allIssues),
  };

  fs.writeFileSync(reportFilePath, JSON.stringify(report, null, 2), 'utf8');

  return {
    dataFilePath,
    reportFilePath,
    recordCount,
    errorCount,
    warningCount,
    checksumSha256: sha256File(dataFilePath),
  };
}

// ── Starter schema generator ───────────────────────────────────────────────

export function writeStarterSchema9170(outPath: string) {
  const schema: PirlSchema = {
    id: 'ETA-9170-PY25-STARTER',
    fields: [
      // Section A: Individual Information
      { element: '100', name: 'Unique Individual Identifier', type: 'AN', length: 12, required: true },
      { element: '101', name: 'Social Security Number', type: 'AN', length: 9, required: false },
      { element: '102', name: 'Date of Birth', type: 'DT', length: 8, required: false },
      { element: '103', name: 'Zip Code of Residence', type: 'IN', length: 5, required: false, pad: 'leftZero' },
      { element: '200', name: 'Individual with a Disability', type: 'IN', length: 1, enum: [0, 1], required: false },
      { element: '201', name: 'Ethnicity Hispanic/Latino', type: 'IN', length: 1, enum: [0, 1], required: false },
      { element: '202', name: 'American Indian or Alaska Native', type: 'IN', length: 1, enum: [0, 1], required: false },
      { element: '203', name: 'Asian', type: 'IN', length: 1, enum: [0, 1], required: false },
      { element: '204', name: 'Black or African American', type: 'IN', length: 1, enum: [0, 1], required: false },
      { element: '205', name: 'Native Hawaiian or Other Pacific Islander', type: 'IN', length: 1, enum: [0, 1], required: false },
      { element: '206', name: 'White', type: 'IN', length: 1, enum: [0, 1], required: false },
      { element: '300', name: 'Gender', type: 'IN', length: 1, enum: [1, 2], required: false },
      { element: '301', name: 'Veteran Status', type: 'IN', length: 1, enum: [0, 1], required: false },

      // Section B: Education and Employment at Entry
      { element: '400', name: 'Employment Status at Participation', type: 'IN', length: 1, enum: [1, 2, 3], required: false },
      { element: '401', name: 'Highest School Grade Completed', type: 'IN', length: 2, enum: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], required: false },

      // Section C: Participation
      { element: '900', name: 'Date of Program Participation', type: 'DT', length: 8, required: true },
      { element: '901', name: 'Date of Program Exit', type: 'DT', length: 8, required: false },
      { element: '903', name: 'Other Reasons for Exit', type: 'IN', length: 2, required: false },
      { element: '923', name: 'WIOA Title I Adult', type: 'IN', length: 1, enum: [0, 1], required: false },
      { element: '924', name: 'WIOA Title I Dislocated Worker', type: 'IN', length: 1, enum: [0, 1], required: false },
      { element: '925', name: 'WIOA Title I Youth', type: 'IN', length: 1, enum: [0, 1], required: false },
      { element: '930', name: 'WIOA Title III Wagner-Peyser', type: 'IN', length: 1, enum: [0, 1], required: false },

      // Section D: Services
      { element: '1000', name: 'Received Training', type: 'IN', length: 1, enum: [0, 1], required: false },
      { element: '1002', name: 'Type of Training Service #1', type: 'IN', length: 2, required: false },
      { element: '1010', name: 'Occupational Skills Training Code (O*NET)', type: 'AN', length: 8, required: false },

      // Section E: Outcomes
      { element: '1600', name: 'Employed in 1st Quarter After Exit', type: 'IN', length: 1, enum: [0, 1, 2, 3, 9], required: false },
      { element: '1602', name: 'Employed in 2nd Quarter After Exit', type: 'IN', length: 1, enum: [0, 1, 2, 3, 9], required: false },
      { element: '1604', name: 'Employed in 4th Quarter After Exit', type: 'IN', length: 1, enum: [0, 1, 2, 3, 9], required: false },
      { element: '1700', name: 'Median Earnings 2nd Quarter After Exit', type: 'NU', length: 7, required: false },
      { element: '1800', name: 'Type of Recognized Credential', type: 'IN', length: 1, enum: [0, 1, 2, 3, 4, 5, 6], required: false },
      { element: '1801', name: 'Date Attained Recognized Credential', type: 'DT', length: 8, required: false },
      { element: '1811', name: 'Measurable Skill Gains - Educational Functioning Level', type: 'IN', length: 1, enum: [0, 1], required: false },
      { element: '1812', name: 'Measurable Skill Gains - Secondary Diploma', type: 'IN', length: 1, enum: [0, 1], required: false },
      { element: '1813', name: 'Measurable Skill Gains - Transcript/Report Card', type: 'IN', length: 1, enum: [0, 1], required: false },
      { element: '1814', name: 'Measurable Skill Gains - Training Milestone', type: 'IN', length: 1, enum: [0, 1], required: false },
      { element: '1815', name: 'Measurable Skill Gains - Skills Progression', type: 'IN', length: 1, enum: [0, 1], required: false },

      // Section F: Youth-specific
      { element: '1901', name: 'Youth 2nd Quarter Placement', type: 'IN', length: 1, enum: [0, 1, 2, 3], required: false },
      { element: '1902', name: 'Youth 4th Quarter Placement', type: 'IN', length: 1, enum: [0, 1, 2, 3], required: false },
    ],
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(schema, null, 2), 'utf8');
}

// ── CLI ────────────────────────────────────────────────────────────────────

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  if (cmd === 'init-schema') {
    const outPath = args[0] ?? 'tools/wioa/schemas/eta9170_starter.json';
    writeStarterSchema9170(outPath);
    console.log(`Wrote starter schema → ${outPath}`);
    return;
  }

  if (cmd !== 'export') {
    console.error([
      'Usage:',
      '  npx tsx tools/wioa/pirl_exporter.ts init-schema [outPath]',
      '  npx tsx tools/wioa/pirl_exporter.ts export <schemaPath> <quarter> <outDir> <filePrefix> [--live]',
      '',
      'Flags:',
      '  --live   Use real Supabase data via wioa_participants_for_quarter RPC',
      '           Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars',
    ].join('\n'));
    process.exit(2);
  }

  const useLive = args.includes('--live');
  const positionalArgs = args.filter(a => !a.startsWith('--'));
  const [schemaPath, quarter, outDir, filePrefix] = positionalArgs;
  if (!schemaPath || !quarter || !outDir || !filePrefix) {
    console.error('Missing required args: schemaPath quarter outDir filePrefix');
    process.exit(2);
  }

  let adapter: PirlDataAdapter;

  if (useLive) {
    // Real adapter — queries Supabase via RPC
    const { createSupabaseAdapter } = await import('./supabase_adapter');
    adapter = createSupabaseAdapter();
    console.log('Using LIVE Supabase adapter');
  } else {
    // Test adapter with sample data
    console.log('Using TEST adapter (dummy data). Pass --live for real data.');
    adapter = {
      async fetchParticipantsForQuarter() {
        return [
          {
            uniqueIndividualIdentifier: 'EFH000000001',
            elements: {
              '100': 'EFH000000001',
              '102': '1990-01-15',
              '103': '46202',
              '200': 0,
              '300': 1,
              '301': 0,
              '400': 3,
              '401': 12,
              '900': '2025-07-01',
              '901': '2025-09-30',
              '923': 1,
              '1000': 1,
              '1002': '01',
              '1010': '31-9011',
              '1600': 9,
              '1700': 0,
            },
          },
        ];
      },
    };
  }

  const res = await exportQuarterlyPirl(adapter, {
    schemaPath,
    quarter: quarter as Quarter,
    outputDir: outDir,
    filePrefix,
    maxErrors: 5000,
  });

  console.log(JSON.stringify(res, null, 2));
}

// ESM-compatible entry point
const isMainModule = typeof import.meta?.url === 'string' && 
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('pirl_exporter.ts');

if (isMainModule) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
