import { NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeDbError, safeOk } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { applicationProgramFilter } from '@/lib/admin/application-filters';
import {
  applicantDisplayName,
  buildHolderStudentRow,
  isAssignableHolderStatus,
  selectReferralBatch,
  type ApplicantRow,
} from '@/lib/program-holder/applicant-assignment';

export const dynamic = 'force-dynamic';

const READABLE_ASSIGNMENT_STATUSES = ['applied', 'applicant', 'pending'] as const;

interface AssignBody {
  /** Explicit application ids to assign. When omitted, the batch rule selects them. */
  application_ids?: string[];
  /** Program slug for batch mode (e.g. "cna"). Defaults to the holder's primary program. */
  program_slug?: string;
  /** Batch size for batch mode. Default 50. */
  limit?: number;
  /** True = preview only, write nothing. */
  dry_run?: boolean;
}

function isUuid(value: string): boolean {
  return /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { id: holderId } = await params;
  if (!isUuid(holderId)) return safeError('Invalid program holder id', 400);

  const body = (await request.json().catch(() => null)) as AssignBody | null;
  if (!body) return safeError('Invalid request body', 400);

  const db = await requireAdminClient();

  // --- Holder: must exist and be in a state that may receive referrals. ---
  const { data: holder, error: holderErr } = await db
    .from('program_holders')
    .select('id, organization_name, name, status, features')
    .eq('id', holderId)
    .maybeSingle();
  if (holderErr) return safeDbError(holderErr, 'Program holder lookup failed');
  if (!holder) return safeError('Program holder not found', 404);
  if (!isAssignableHolderStatus(holder.status)) {
    return safeError(
      `Program holder status "${holder.status}" cannot receive applicant assignments. ` +
        'Only active, approved, or approved-pending-MOU holders can be assigned applicants.',
      400,
    );
  }

  // --- Program: must be one of the holder's assigned programs. ---
  const { data: links, error: linksErr } = await db
    .from('program_holder_programs')
    .select('program_id, program_slug, role_in_program, is_primary, status')
    .eq('program_holder_id', holderId);
  if (linksErr) return safeDbError(linksErr, 'Program holder programs lookup failed');
  const activeLinks = (links ?? []).filter((row: any) => (row.status ?? 'active') === 'active');
  if (!activeLinks.length) {
    return safeError('This program holder has no active assigned programs.', 400);
  }

  let program: any = null;
  if (body.program_slug) {
    const { data: programRow, error: programErr } = await db
      .from('programs')
      .select('id, slug, title')
      .eq('slug', body.program_slug)
      .maybeSingle();
    if (programErr) return safeDbError(programErr, 'Program lookup failed');
    if (!programRow) return safeError(`Program "${body.program_slug}" not found`, 404);
    const linked = activeLinks.some(
      (row: any) => row.program_id === programRow.id || row.program_slug === programRow.slug,
    );
    if (!linked) {
      return safeError(
        `Program "${body.program_slug}" is not assigned to this program holder.`,
        400,
      );
    }
    program = programRow;
  } else {
    const primary = activeLinks.find((row: any) => row.is_primary) ?? activeLinks[0];
    const { data: programRow, error: programErr } = await db
      .from('programs')
      .select('id, slug, title')
      .eq('id', primary.program_id)
      .maybeSingle();
    if (programErr) return safeDbError(programErr, 'Program lookup failed');
    if (!programRow) return safeError('Assigned program not found', 404);
    program = programRow;
  }

  const limit = body.limit === undefined ? 50 : Math.floor(body.limit);
  if (!Number.isFinite(limit) || limit < 1 || limit > 500) {
    return safeError('limit must be between 1 and 500', 400);
  }
  const dryRun = body.dry_run === true;

  // --- Candidates: applications for this program (all statuses; the pure
  // selector classifies each one so the preview can show why rows skipped). ---
  const programFilter = `program_id.eq.${program.id},${applicationProgramFilter(program)}`;
  let candidates: ApplicantRow[] = [];
  if (body.application_ids?.length) {
    const ids = [...new Set(body.application_ids.filter((value) => isUuid(value)))];
    if (!ids.length) return safeError('No valid application ids supplied', 400);
    const { data, error } = await db
      .from('applications')
      .select(
        'id,user_id,full_name,first_name,last_name,name,email,phone,program_id,program_slug,program_interest,status,revoked_at,created_at',
      )
      .in('id', ids);
    if (error) return safeDbError(error, 'Application lookup failed');
    const found = new Map((data ?? []).map((row: any) => [row.id, row]));
    const missing = ids.filter((id) => !found.has(id));
    if (missing.length) {
      return safeError(`Applications not found: ${missing.join(', ')}`, 404);
    }
    const wrongProgram = [...found.values()].filter(
      (row: any) =>
        row.program_id !== program.id &&
        row.program_slug !== program.slug &&
        row.program_interest !== program.slug &&
        row.program_interest !== program.title,
    );
    if (wrongProgram.length) {
      return safeError(
        `These applications are not for ${program.title}: ${wrongProgram.map((row: any) => row.id).join(', ')}`,
        400,
      );
    }
    candidates = [...found.values()];
  } else {
    // Paginated load (Supabase caps a single select at 1000 rows).
    let from = 0;
    const pageSize = 1000;
    for (;;) {
      const { data, error } = await db
        .from('applications')
        .select(
          'id,user_id,full_name,first_name,last_name,name,email,phone,program_id,program_slug,program_interest,status,revoked_at,created_at',
        )
        .or(programFilter)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) return safeDbError(error, 'Application lookup failed');
      candidates.push(...(data ?? []));
      if (!data || data.length < pageSize || candidates.length >= 5000) break;
      from += pageSize;
    }
  }

  // --- Already assigned (any holder, still live) + already enrolled. ---
  const candidateIds = candidates.map((row) => row.id);
  const assignedIds = new Set<string>();
  const assignedKeys = new Set<string>();
  if (candidateIds.length) {
    const { data: existing, error: existingErr } = await db
      .from('program_holder_students')
      .select('application_id, applicant_email, user_id, status')
      .eq('program_id', program.id)
      .in('application_id', candidateIds);
    if (existingErr) return safeDbError(existingErr, 'Existing assignment lookup failed');
    for (const row of existing ?? []) {
      if (String(row.status ?? '').toLowerCase() === 'routing_replaced') continue;
      if (row.application_id) assignedIds.add(row.application_id);
      if (row.applicant_email) assignedKeys.add(`email:${String(row.applicant_email).trim().toLowerCase()}`);
      if (row.user_id) assignedKeys.add(`user:${row.user_id}`);
    }
  }
  const candidateUserIds = [...new Set(candidates.map((row) => row.user_id).filter(Boolean))];
  const enrolledUserIds = new Set<string>();
  if (candidateUserIds.length) {
    const { data: enrollments, error: enrollErr } = await db
      .from('program_enrollments')
      .select('user_id')
      .eq('program_id', program.id)
      .in('user_id', candidateUserIds as string[])
      .in('status', ['active', 'enrolled', 'in_progress', 'completed', 'funded']);
    if (enrollErr) return safeDbError(enrollErr, 'Enrollment lookup failed');
    for (const row of enrollments ?? []) enrolledUserIds.add(String(row.user_id));
  }

  const { selected, skipped } = selectReferralBatch(candidates, {
    limit,
    alreadyAssignedApplicationIds: assignedIds,
    alreadyAssignedKeys: assignedKeys,
    enrolledUserIds,
  });

  const skippedCounts = {
    wrong_status: skipped.wrongStatus.length,
    revoked: skipped.revoked.length,
    already_assigned: skipped.alreadyAssigned.length,
    already_enrolled: skipped.alreadyEnrolled.length,
    duplicate: skipped.duplicate.length,
    beyond_limit: skipped.beyondLimit.length,
  };

  const { count: assignedTotal } = await db
    .from('program_holder_students')
    .select('id', { count: 'exact', head: true })
    .eq('program_holder_id', holderId)
    .in('status', [...READABLE_ASSIGNMENT_STATUSES]);

  const preview = {
    holder_id: holderId,
    holder_name: holder.organization_name || holder.name || 'Program Holder',
    program: { id: program.id, slug: program.slug, title: program.title },
    dry_run: dryRun,
    rule: 'Earliest-submitted applications for this program, deduplicated by applicant, excluding already-assigned and already-enrolled applicants. Nothing is picked at random.',
    selected: selected.map((row) => ({
      application_id: row.id,
      name: applicantDisplayName(row),
      email: row.email ?? null,
      phone: row.phone ?? null,
      applied_at: row.created_at ?? null,
      application_status: row.status ?? null,
    })),
    skipped_counts: skippedCounts,
    assigned_total_for_holder: assignedTotal ?? 0,
    recruiting_enabled: holder.features?.recruiting_enabled === true,
  };

  if (dryRun || !selected.length) {
    return safeOk({ ...preview, assigned: [], message: dryRun ? 'Dry run — nothing was assigned.' : 'Nothing to assign.' });
  }

  // --- Apply: write the holder projections the portal reads. ---
  const rows = selected.map((row) => buildHolderStudentRow(holderId, program.id, row));
  const { error: insertErr } = await db
    .from('program_holder_students')
    .upsert(rows, { onConflict: 'program_holder_id,application_id' });
  if (insertErr) return safeDbError(insertErr, 'Failed to assign applicants');

  // The holder portal only lists assigned applicants when the holder has a
  // recruiting assignment. First assignment turns that on for this holder.
  let recruitingEnabled = holder.features?.recruiting_enabled === true;
  if (!recruitingEnabled) {
    const { error: featureErr } = await db
      .from('program_holders')
      .update({
        features: { ...(holder.features ?? {}), recruiting_enabled: true },
        updated_at: new Date().toISOString(),
      })
      .eq('id', holderId);
    if (featureErr) return safeDbError(featureErr, 'Assignment saved but recruiting access could not be enabled');
    recruitingEnabled = true;
  }

  await db.from('admin_audit_events').insert({
    action: 'program_holder.assign_applicants',
    actor_user_id: auth.id,
    target_type: 'program_holder',
    target_id: holderId,
    metadata: {
      program_slug: program.slug,
      program_id: program.id,
      limit,
      dry_run: false,
      assigned_count: selected.length,
      assigned_application_ids: selected.map((row) => row.id),
      skipped_counts: skippedCounts,
    },
  });

  return safeOk({
    ...preview,
    dry_run: false,
    assigned: preview.selected,
    // Total after this batch, not before it.
    assigned_total_for_holder: (assignedTotal ?? 0) + selected.length,
    recruiting_enabled: recruitingEnabled,
    message: `${selected.length} applicant${selected.length === 1 ? '' : 's'} assigned to ${preview.holder_name}.`,
  });
}
