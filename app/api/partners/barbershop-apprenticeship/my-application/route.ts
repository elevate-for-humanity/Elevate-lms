import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';

/**
 * Returns the logged-in user's partner application so the MOU sign page
 * can pre-populate shop name, owner name, and contact details.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return safeError('Unauthorized', 401);
  }

  // Check partner_applications first (newer flow)
  const { data: pa } = await supabase
    .from('partner_applications')
    .select('id, shop_name, owner_name, contact_email, email, phone, address_line1, city, state, zip, status, approval_status')
    .eq('contact_email', user.email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pa) {
    return NextResponse.json({
      shop_name: pa.shop_name,
      owner_name: pa.owner_name,
      email: pa.contact_email || pa.email,
      phone: pa.phone,
      address: pa.address_line1,
      city: pa.city,
      state: pa.state,
      zip: pa.zip,
      status: pa.status,
      source: 'partner_applications',
    });
  }

  // Fall back to barbershop_partner_applications
  const { data: bpa } = await supabase
    .from('barbershop_partner_applications')
    .select('id, shop_legal_name, owner_name, contact_email, phone, address, city, state, zip, status')
    .eq('contact_email', user.email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (bpa) {
    return NextResponse.json({
      shop_name: bpa.shop_legal_name,
      owner_name: bpa.owner_name,
      email: bpa.contact_email,
      phone: bpa.phone,
      address: bpa.address,
      city: bpa.city,
      state: bpa.state,
      zip: bpa.zip,
      status: bpa.status,
      source: 'barbershop_partner_applications',
    });
  }

  // No application found — return empty so form still works manually
  return NextResponse.json({});
}
