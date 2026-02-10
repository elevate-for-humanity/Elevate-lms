import { NextResponse } from 'next/server';
import { ApplicationUpdateSchema } from '@/lib/validators/course';
import { getApplication, updateApplication, deleteApplication, createEnrollment } from '@/lib/db/courses';
import { createClient } from '@/lib/supabase/server';

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

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    // Get before state for audit
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
    
    // Add reviewer info if status is changing to approved/rejected
    const updateData = { ...parsed.data };
    if (updateData.status === 'approved' || updateData.status === 'rejected') {
      updateData.reviewer_id = auth.user.id;
    }
    
    const data = await updateApplication(id, updateData);
    
    // If approved, create enrollment automatically
    if (updateData.status === 'approved' && before.status !== 'approved') {
      // Find or create user for this applicant
      let userId = before.user_id;
      
      if (!userId) {
        // Check if user exists with this email
        const { data: existingUser } = await auth.supabase
          .from('profiles')
          .select('id')
          .eq('email', before.email)
          .single();
        
        userId = existingUser?.id;
      }
      
      if (userId && before.program_id) {
        // Create enrollment
        const enrollment = await createEnrollment({
          user_id: userId,
          course_id: before.program_id, // Using program_id as course_id for now
          status: 'active',
          progress: 0,
          at_risk: false,
        });
        
        // Update application to enrolled status
        await updateApplication(id, { status: 'enrolled' });
        
        // Log enrollment creation
        await auth.supabase.from('audit_logs').insert({
          actor_id: auth.user.id,
          actor_role: auth.profile.role,
          action: 'create',
          resource_type: 'enrollment',
          resource_id: enrollment.id,
          after_state: enrollment,
          notes: `Auto-created from approved application ${id}`,
        });
      }
    }
    
    // Log audit
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
    });
    
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const before = await getApplication(id);
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const data = await deleteApplication(id);
    
    // Log audit
    await auth.supabase.from('audit_logs').insert({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: 'delete',
      resource_type: 'application',
      resource_id: id,
      before_state: before,
    });
    
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
