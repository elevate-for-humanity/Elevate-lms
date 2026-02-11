import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';

/**
 * EMPLOYER APPLICATION API
 *
 * Handles employer registration submissions.
 * Creates employer record and sets up pending verification.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const supabase = await createClient();

    // Extract form data
    const data = {
      company_name: formData.get('company_name') as string,
      industry: formData.get('industry') as string,
      company_size: formData.get('company_size') as string,
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      hiring_needs: formData.get('hiring_needs') as string,
    };

    // Validate required fields
    if (
      !data.company_name ||
      !data.email ||
      !data.first_name ||
      !data.last_name
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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

    // Create employer application in canonical applications table
    const { data: application, error: appError } = await supabase
      .from('applications')
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        program_id: 'employer',
        status: 'pending',
        notes: JSON.stringify({
          type: 'employer',
          tenant_id: defaultTenant.id,
          company_name: data.company_name,
          industry: data.industry,
          company_size: data.company_size,
          hiring_needs: data.hiring_needs,
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
    return NextResponse.redirect(
      new URL('/apply/employer/success', request.url)
    );
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
