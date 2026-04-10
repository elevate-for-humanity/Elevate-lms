/**
 * Credential alignment audit.
 *
 * Scans the live database and reports exactly what curriculum is missing
 * before any generation runs. Output drives the curriculum generator —
 * only gaps are generated, existing content is never touched.
 *
 * Audit checks per program:
 *   1. program_credentials row exists (credential mapped)
 *   2. credential_exam_domains rows exist (exam blueprint seeded)
 *   3. curriculum_lessons exist and are linked to each domain
 *   4. Each lesson has at least one quiz
 *   5. completion_rules exist for the program
 *
 * Usage:
 *   const audit = await runAlignmentAudit();
 *   logger.info(formatAuditReport(audit));
 *
 *   // Generate only missing content:
 *   const gaps = audit.programs.filter(p => !p.isAligned);
 */

import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DomainGap {
  domainKey:          string;
  domainName:         string;
  weightPercent:      number;
  lessonsInCurriculum: number;
  lessonsWithQuizzes:  number;
  /** True if at least one lesson exists and it has at least one quiz */
  isCovered:          boolean;
  missingLessons:     boolean;
  missingQuizzes:     boolean;
}

export interface ProgramAudit {
  programId:            string;
  programSlug:          string;
  programName:          string;
  /** Null if no program_credentials row exists */
  primaryCredentialId:  string | null;
  primaryCredentialName: string | null;
  primaryCredentialAbbr: string | null;
  hasProgramCredential: boolean;
  hasExamDomains:       boolean;
  hasCompletionRules:   boolean;
  /** Total published lessons in curriculum_lessons for this program */
  totalLessons:         number;
  /** Lessons with at least one quiz */
  lessonsWithQuizzes:   number;
  /** Per-domain breakdown — empty if no exam domains seeded */
  domains:              DomainGap[];
  /** True when all domains covered, all lessons have quizzes, completion rules exist */
  isAligned:            boolean;
  /** Summary of what is missing */
  gaps:                 string[];
}

export interface AlignmentAudit {
  auditedAt:       string;
  totalPrograms:   number;
  alignedPrograms: number;
  gapPrograms:     number;
  programs:        ProgramAudit[];
  /** Programs with no credential mapping at all */
  unmappedPrograms: string[];
  /** Credentials in credential_registry with no program_credentials row */
  unmappedCredentials: { id: string; name: string; abbreviation: string }[];
}

// ─── Main audit function ──────────────────────────────────────────────────────

/**
 * Runs the full alignment audit against the live database.
 * Read-only — makes no writes.
 */
export async function runAlignmentAudit(
  programSlugs?: string[]   // if provided, audit only these programs
): Promise<AlignmentAudit> {
  const db = await getAdminClient();
  const auditedAt = new Date().toISOString();

  if (!db) {
    logger.error('credential-alignment-audit: database unavailable');
    return {
      auditedAt, totalPrograms: 0, alignedPrograms: 0, gapPrograms: 0,
      programs: [], unmappedPrograms: [], unmappedCredentials: [],
    };
  }

  // ── Load all programs ──────────────────────────────────────────────────────
  let programQuery = db
    .from('programs')
    .select('id, slug, name, status')
    .eq('status', 'active')
    .order('slug');

  if (programSlugs?.length) {
    programQuery = programQuery.in('slug', programSlugs);
  }

  const { data: programs, error: progErr } = await programQuery;
  if (progErr || !programs) {
    logger.error('credential-alignment-audit: failed to load programs', { progErr });
    return {
      auditedAt, totalPrograms: 0, alignedPrograms: 0, gapPrograms: 0,
      programs: [], unmappedPrograms: [], unmappedCredentials: [],
    };
  }

  // ── Load all program_credentials (primary only) ────────────────────────────
  const { data: pcRows } = await db
    .from('program_credentials')
    .select('program_id, credential_id, is_primary, exam_fee_payer')
    .eq('is_primary', true);

  const pcByProgram = new Map<string, { credentialId: string }>();
  for (const pc of pcRows ?? []) {
    pcByProgram.set(pc.program_id, { credentialId: pc.credential_id });
  }

  // ── Load credential_registry for name resolution ───────────────────────────
  const credentialIds = [...new Set((pcRows ?? []).map(r => r.credential_id))];
  const { data: credRows } = await db
    .from('credential_registry')
    .select('id, name, abbreviation')
    .in('id', credentialIds.length ? credentialIds : ['00000000-0000-0000-0000-000000000000']);

  const credById = new Map<string, { name: string; abbreviation: string }>();
  for (const c of credRows ?? []) {
    credById.set(c.id, { name: c.name, abbreviation: c.abbreviation });
  }

  // ── Load credential_exam_domains ───────────────────────────────────────────
  const { data: domainRows } = await db
    .from('credential_exam_domains')
    .select('id, credential_id, domain_key, domain_name, weight_percent')
    .order('sort_order');

  const domainsByCredential = new Map<string, typeof domainRows>();
  for (const d of domainRows ?? []) {
    if (!domainsByCredential.has(d.credential_id)) {
      domainsByCredential.set(d.credential_id, []);
    }
    domainsByCredential.get(d.credential_id)!.push(d);
  }

  // ── Load curriculum_lessons with quiz counts ───────────────────────────────
  const programIds = programs.map(p => p.id);

  const { data: lessonRows } = await db
    .from('curriculum_lessons')
    .select('id, program_id, credential_domain_id, status')
    .in('program_id', programIds.length ? programIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('status', 'published');

  // Group lessons by program and by domain
  const lessonsByProgram = new Map<string, typeof lessonRows>();
  const lessonsByDomain  = new Map<string, string[]>(); // domain_id → lesson_ids

  for (const l of lessonRows ?? []) {
    if (!lessonsByProgram.has(l.program_id)) {
      lessonsByProgram.set(l.program_id, []);
    }
    lessonsByProgram.get(l.program_id)!.push(l);

    if (l.credential_domain_id) {
      if (!lessonsByDomain.has(l.credential_domain_id)) {
        lessonsByDomain.set(l.credential_domain_id, []);
      }
      lessonsByDomain.get(l.credential_domain_id)!.push(l.id);
    }
  }

  // ── Load quiz counts per lesson ────────────────────────────────────────────
  const lessonIds = (lessonRows ?? []).map(l => l.id);
  const { data: quizRows } = await db
    .from('curriculum_quizzes')
    .select('lesson_id')
    .in('lesson_id', lessonIds.length ? lessonIds : ['00000000-0000-0000-0000-000000000000']);

  const lessonsWithQuizSet = new Set((quizRows ?? []).map(q => q.lesson_id));

  // ── Load completion_rules ──────────────────────────────────────────────────
  const { data: ruleRows } = await db
    .from('completion_rules')
    .select('entity_id')
    .eq('entity_type', 'program')
    .eq('is_active', true)
    .in('entity_id', programIds.length ? programIds : ['00000000-0000-0000-0000-000000000000']);

  const programsWithRules = new Set((ruleRows ?? []).map(r => r.entity_id));

  // ── Audit each program ─────────────────────────────────────────────────────
  const audits: ProgramAudit[] = [];

  for (const prog of programs) {
    const pc = pcByProgram.get(prog.id);
    const cred = pc ? credById.get(pc.credentialId) : null;
    const domains = pc ? (domainsByCredential.get(pc.credentialId) ?? []) : [];
    const lessons = lessonsByProgram.get(prog.id) ?? [];
    const hasRules = programsWithRules.has(prog.id);

    const totalLessons = lessons.length;
    const lessonsWithQuizzes = lessons.filter(l => lessonsWithQuizSet.has(l.id)).length;

    // Per-domain gap analysis
    const domainGaps: DomainGap[] = domains
      .filter(d => d.weight_percent > 0)
      .map(d => {
        const domainLessonIds = lessonsByDomain.get(d.id) ?? [];
        const domainLessons = domainLessonIds.length;
        const domainLessonsWithQuizzes = domainLessonIds.filter(id =>
          lessonsWithQuizSet.has(id)
        ).length;

        return {
          domainKey:           d.domain_key,
          domainName:          d.domain_name,
          weightPercent:       d.weight_percent,
          lessonsInCurriculum: domainLessons,
          lessonsWithQuizzes:  domainLessonsWithQuizzes,
          isCovered:           domainLessons > 0 && domainLessonsWithQuizzes > 0,
          missingLessons:      domainLessons === 0,
          missingQuizzes:      domainLessons > 0 && domainLessonsWithQuizzes === 0,
        };
      });

    // Collect gaps
    const gaps: string[] = [];
    if (!pc)       gaps.push('No primary credential mapped in program_credentials');
    if (pc && domains.length === 0) gaps.push('No exam domains seeded in credential_exam_domains');
    if (!hasRules) gaps.push('No completion_rules defined');
    if (totalLessons === 0 && pc) gaps.push('No curriculum lessons generated');

    for (const dg of domainGaps) {
      if (dg.missingLessons) {
        gaps.push(`Domain "${dg.domainName}" (${dg.weightPercent}%): no lessons`);
      } else if (dg.missingQuizzes) {
        gaps.push(`Domain "${dg.domainName}" (${dg.weightPercent}%): ${dg.lessonsInCurriculum} lessons but no quizzes`);
      }
    }

    const isAligned =
      !!pc &&
      domains.length > 0 &&
      hasRules &&
      totalLessons > 0 &&
      domainGaps.every(d => d.isCovered);

    audits.push({
      programId:             prog.id,
      programSlug:           prog.slug,
      programName:           prog.name,
      primaryCredentialId:   pc?.credentialId ?? null,
      primaryCredentialName: cred?.name ?? null,
      primaryCredentialAbbr: cred?.abbreviation ?? null,
      hasProgramCredential:  !!pc,
      hasExamDomains:        domains.length > 0,
      hasCompletionRules:    hasRules,
      totalLessons,
      lessonsWithQuizzes,
      domains:               domainGaps,
      isAligned,
      gaps,
    });
  }

  // ── Unmapped credentials ───────────────────────────────────────────────────
  const mappedCredentialIds = new Set([...pcByProgram.values()].map(v => v.credentialId));
  const { data: allCreds } = await db
    .from('credential_registry')
    .select('id, name, abbreviation')
    .eq('is_active', true);

  const unmappedCredentials = (allCreds ?? []).filter(c => !mappedCredentialIds.has(c.id));

  const unmappedPrograms = audits
    .filter(a => !a.hasProgramCredential)
    .map(a => a.programSlug);

  const alignedPrograms = audits.filter(a => a.isAligned).length;

  return {
    auditedAt,
    totalPrograms:   audits.length,
    alignedPrograms,
    gapPrograms:     audits.length - alignedPrograms,
    programs:        audits,
    unmappedPrograms,
    unmappedCredentials,
  };
}

// ─── Report formatter ─────────────────────────────────────────────────────────

/**
 * Formats an AlignmentAudit as a plain-text report for logging or admin display.
 */
export function formatAuditReport(audit: AlignmentAudit): string {
  const lines: string[] = [
    `Credential Alignment Audit — ${audit.auditedAt}`,
    `${'─'.repeat(60)}`,
    `Programs audited:  ${audit.totalPrograms}`,
    `Aligned:           ${audit.alignedPrograms}`,
    `Gaps found:        ${audit.gapPrograms}`,
    '',
  ];

  if (audit.unmappedPrograms.length) {
    lines.push(`Programs with no credential mapping (${audit.unmappedPrograms.length}):`);
    for (const slug of audit.unmappedPrograms) {
      lines.push(`  ✗ ${slug}`);
    }
    lines.push('');
  }

  if (audit.unmappedCredentials.length) {
    lines.push(`Credentials with no program mapping (${audit.unmappedCredentials.length}):`);
    for (const c of audit.unmappedCredentials) {
      lines.push(`  ✗ ${c.abbreviation} — ${c.name}`);
    }
    lines.push('');
  }

  lines.push('Per-program detail:');
  lines.push('─'.repeat(60));

  for (const p of audit.programs) {
    const status = p.isAligned ? '✅' : '❌';
    lines.push(`${status} ${p.programSlug}`);
    if (p.primaryCredentialAbbr) {
      lines.push(`   Credential: ${p.primaryCredentialAbbr} — ${p.primaryCredentialName}`);
    }
    lines.push(`   Lessons: ${p.totalLessons} total, ${p.lessonsWithQuizzes} with quizzes`);
    lines.push(`   Domains: ${p.domains.length} | Rules: ${p.hasCompletionRules ? 'yes' : 'no'}`);

    if (p.gaps.length) {
      for (const gap of p.gaps) {
        lines.push(`   ⚠ ${gap}`);
      }
    }

    if (p.domains.length) {
      for (const d of p.domains) {
        const dStatus = d.isCovered ? '✓' : '✗';
        lines.push(
          `   ${dStatus} ${d.domainKey} (${d.weightPercent}%): ` +
          `${d.lessonsInCurriculum} lessons, ${d.lessonsWithQuizzes} with quizzes`
        );
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ─── API route helper ─────────────────────────────────────────────────────────

/**
 * Returns only the gap summary — suitable for an admin dashboard widget
 * without the full per-domain breakdown.
 */
export function summarizeGaps(audit: AlignmentAudit): {
  totalGaps:          number;
  missingCredentials: string[];
  missingDomains:     { program: string; domain: string; weight: number }[];
  missingQuizzes:     { program: string; domain: string; lessons: number }[];
  missingRules:       string[];
} {
  const missingCredentials: string[] = [];
  const missingDomains: { program: string; domain: string; weight: number }[] = [];
  const missingQuizzes: { program: string; domain: string; lessons: number }[] = [];
  const missingRules: string[] = [];

  for (const p of audit.programs) {
    if (!p.hasProgramCredential) missingCredentials.push(p.programSlug);
    if (!p.hasCompletionRules)   missingRules.push(p.programSlug);

    for (const d of p.domains) {
      if (d.missingLessons) {
        missingDomains.push({ program: p.programSlug, domain: d.domainKey, weight: d.weightPercent });
      } else if (d.missingQuizzes) {
        missingQuizzes.push({ program: p.programSlug, domain: d.domainKey, lessons: d.lessonsInCurriculum });
      }
    }
  }

  return {
    totalGaps: missingCredentials.length + missingDomains.length +
               missingQuizzes.length + missingRules.length,
    missingCredentials,
    missingDomains,
    missingQuizzes,
    missingRules,
  };
}
