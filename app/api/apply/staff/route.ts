import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';

/**
 * STAFF / INSTRUCTOR APPLICATION API
 *
 * Handles staff and instructor application submissions.
 * Creates application record requiring admin approval.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const supabase = await createClient();

    // Extract form data
    const data = {
      role: formData.get('role') as string,
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      qualifications: formData.get('qualifications') as string,
    };

    // Validate required fields
    if (
      !data.role ||
      !data.email ||
      !data.first_name ||
      !data.last_name ||
      !data.qualifications
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['staff', 'instructor'].includes(data.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Get default tenant (for now - will be replaced with tenant resolution)
    const { data: defaultTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'efh-core')
      .single();

    if (!defaultTenant) {
      return NextResponse.json(
        { error: 'System configuration error' },
        { status: 500 }
      );
    }

    // Create staff application in canonical applications table
    const { data: application, error: appError } = await supabase
      .from('applications')
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        program_id: data.role,
        status: 'pending',
        notes: JSON.stringify({
          type: 'staff',
          tenant_id: defaultTenant.id,
          role: data.role,
          qualifications: data.qualifications,
        }),
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (appError) {
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/apply/staff/success', request.url));
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
