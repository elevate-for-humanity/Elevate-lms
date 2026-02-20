import { NextResponse } from 'next/server';
import { ApplicationUpdateSchema } from '@/lib/validators/course';
import { getApplication, updateApplication, deleteApplication, createEnrollment } from '@/lib/db/courses';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database unavailable', status: 500 };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user, profile, supabase };
}

// Common aliases for program_interest values that don't match course titles directly
const PROGRAM_ALIASES: Record<string, string> = {
  'cna certification': 'cna training',
  'cna': 'cna training',
  'cosmetology apprenticeship': 'hair stylist esthetician apprenticeship',
  'cosmetology': 'hair stylist esthetician apprenticeship',
  'accounting': 'bookkeeping',
  'home health aide': 'direct support professional',
  'entrepreneurship': 'entrepreneurship small business',
  'phlebotomy': 'phlebotomy technician',
  'barber apprenticeship': 'barber',
};

/**
 * Resolve program_interest text (slug or display name) to a course UUID.
 */
async function resolveCourseId(supabase: any, programInterest: string): Promise<string | null> {
  if (!programInterest) return null;

  const normalized = programInterest.toLowerCase().replace(/-/g, ' ').trim();

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title');

  if (!courses?.length) return null;

  const exact = courses.find((c: any) => c.title.toLowerCase() === normalized);
  if (exact) return exact.id;

  const alias = PROGRAM_ALIASES[normalized];
  if (alias) {
    const aliasMatch = courses.find((c: any) => c.title.toLowerCase().includes(alias));
    if (aliasMatch) return aliasMatch.id;
  }

  const partial = courses.find((c: any) => {
    const t = c.title.toLowerCase();
    return t.includes(normalized) || normalized.includes(t.replace(/\(.*\)/, '').trim());
  });
  if (partial) return partial.id;

  return null;
}

/**
 * Find or create a Supabase auth user + profile for an applicant.
 */
async function findOrCreateUser(
  email: string,
  firstName: string,
  lastName: string
): Promise<string | null> {
  const adminClient = createAdminClient();
  if (!adminClient) return null;

  const normalizedEmail = email.toLowerCase().trim();

  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .single();

  if (existingProfile?.id) return existingProfile.id;

  const tempPassword = `Elevate-${Date.now().toString(36)}!`;
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: normalizedEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
    },
  });

  if (newUser?.user) {
    await adminClient.from('profiles').upsert({
      id: newUser.user.id,
      email: normalizedEmail,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      role: 'student',
    }, { onConflict: 'id' });

    logger.info('Created new user for approved application', {
      userId: newUser.user.id,
      email: normalizedEmail,
    });

    return newUser.user.id;
  }

  if (createError) {
    logger.info('Auth user may already exist, searching', { email: normalizedEmail, error: createError.message });

    let page = 1;
    while (page <= 6) {
      const { data: batch } = await adminClient.auth.admin.listUsers({ page, perPage: 100 });
      if (!batch?.users?.length) break;
      const found = batch.users.find((u: any) => u.email?.toLowerCase() === normalizedEmail);
      if (found) {
        await adminClient.from('profiles').upsert({
          id: found.id,
          email: normalizedEmail,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          role: 'student',
        }, { onConflict: 'id' });
        return found.id;
      }
      page++;
    }
  }

  logger.error('Could not find or create user', { email: normalizedEmail });
  return null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const data = await getApplication(id);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const before = await getApplication(id);
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json().catch(() => null);
    const parsed = ApplicationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updateData = { ...parsed.data };
    if (updateData.status === 'approved' || updateData.status === 'rejected') {
      updateData.reviewer_id = auth.user.id;
    }

    const data = await updateApplication(id, updateData);

    // AUTO-ENROLLMENT: When approving, create user + enrollment
    let enrollmentResult: any = null;
    if (updateData.status === 'approved' && before.status !== 'approved') {
      try {
        // Step 1: Resolve course ID from program_interest
        const courseId = before.program_id
          || await resolveCourseId(auth.supabase, before.program_interest);

        if (!courseId) {
          logger.error('Could not resolve course for program_interest', {
            programInterest: before.program_interest,
            applicationId: id,
          });
        }

        // Step 2: Find or create auth user
        const userId = before.user_id
          || await findOrCreateUser(
            before.email,
            before.first_name,
            before.last_name
          );

        if (!userId) {
          logger.error('Could not find/create user for application', {
            email: before.email,
            applicationId: id,
          });
        }

        // Step 3: Create enrollment if we have both
        if (userId && courseId) {
          // Check for existing enrollment
          const { data: existingEnrollment } = await auth.supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .single();

          if (existingEnrollment) {
            enrollmentResult = { id: existingEnrollment.id, alreadyExists: true };
          } else {
            const enrollment = await createEnrollment({
              user_id: userId,
              course_id: courseId,
              status: 'active',
              progress: 0,
              at_risk: false,
            });
            enrollmentResult = enrollment;
          }

          // Update application with resolved IDs and enrolled status
          // Use direct Supabase update since program_id/user_id aren't in the Zod schema
          await auth.supabase
            .from('applications')
            .update({
              status: 'enrolled',
              program_id: courseId,
              user_id: userId,
            })
            .eq('id', id);

          // Audit log
          await auth.supabase.from('audit_logs').insert({
            actor_id: auth.user.id,
            actor_role: auth.profile.role,
            action: 'create',
            resource_type: 'enrollment',
            resource_id: enrollmentResult?.id || 'unknown',
            after_state: enrollmentResult,
            notes: `Auto-enrolled from application ${id}: ${before.first_name} ${before.last_name} → ${before.program_interest}`,
          }).catch(() => {});

          logger.info('Auto-enrollment completed', {
            applicationId: id,
            userId,
            courseId,
            enrollmentId: enrollmentResult?.id,
          });
        }
      } catch (enrollError) {
        logger.error('Auto-enrollment failed', enrollError as Error);
        // Don't fail the approval — the application is still approved
      }
    }

    // Audit log for the status change
    const action = updateData.status === 'approved' ? 'approve' :
                   updateData.status === 'rejected' ? 'reject' :
                   'status_change';

    await auth.supabase.from('audit_logs').insert({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action,
      resource_type: 'application',
      resource_id: id,
      before_state: before,
      after_state: data,
    }).catch(() => {});

    return NextResponse.json({
      data,
      enrollment: enrollmentResult,
    }, { status: 200 });
  } catch (error: any) {
    logger.error('Application PATCH error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const before = await getApplication(id);
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data = await deleteApplication(id);

    await auth.supabase.from('audit_logs').insert({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: 'delete',
      resource_type: 'application',
      resource_id: id,
      before_state: before,
    }).catch(() => {});

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
