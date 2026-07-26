import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Update application status to approved
    const { data, error } = await supabase
      .from('partner_applications')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Optionally create a partner record
    if (data) {
      const { email, organization_name, contact_name } = data;
      
      // Check if partner already exists
      const { data: existing } = await supabase
        .from('partners')
        .select('id')
        .eq('email', email)
        .single();

      if (!existing) {
        // Create partner from approved application
        await supabase.from('partners').insert({
          email,
          name: organization_name,
          contact_name,
          status: 'active',
          partner_application_id: id,
        });
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
