import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const BEAUTY_PROGRAM_TERMS = [
  'barber',
  'cosmetology',
  'hairstylist',
  'esthetician',
  'nail',
  'manicurist',
];

function isBeautyHostShop(programType: string | null, programs: unknown): boolean {
  const haystack = `${programType ?? ''} ${JSON.stringify(programs ?? [])}`.toLowerCase();
  return BEAUTY_PROGRAM_TERMS.some((term) => haystack.includes(term));
}

function programLabels(programType: string | null, programs: unknown): string[] {
  const haystack = `${programType ?? ''} ${JSON.stringify(programs ?? [])}`.toLowerCase();
  const labels: string[] = [];

  if (haystack.includes('barber')) labels.push('Barber');
  if (haystack.includes('cosmetology') || haystack.includes('hairstylist')) labels.push('Hairstylist');
  if (haystack.includes('esthetician')) labels.push('Esthetician');
  if (haystack.includes('nail') || haystack.includes('manicurist')) labels.push('Manicurist');

  return Array.from(new Set(labels));
}

export async function GET(request: NextRequest) {
  const supabase = await requireAdminClient();
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city')?.trim();
  const search = searchParams.get('search')?.trim().toLowerCase();
  const program = searchParams.get('program')?.trim().toLowerCase();

  const { data, error } = await supabase
    .from('partners')
    .select(
      'id,name,shop_name,owner_name,phone,address_line1,address_line2,city,state,zip,website,website_url,license_number,program_type,programs,approval_status,status,is_active,featured,contact_email',
    )
    .eq('approval_status', 'approved')
    .eq('status', 'active')
    .eq('is_active', true)
    .order('featured', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const shops = (data ?? [])
    .filter((row) => isBeautyHostShop(row.program_type, row.programs))
    .map((row) => {
      const plans = programLabels(row.program_type, row.programs);
      const fullAddress = [row.address_line1, row.address_line2, row.city, row.state, row.zip]
        .filter(Boolean)
        .join(', ');
      const publicEmail =
        row.contact_email && !row.contact_email.startsWith('pending-contact+')
          ? row.contact_email
          : null;

      return {
        id: row.id,
        name: row.shop_name || row.name || 'Host Shop',
        owner_name: row.owner_name,
        address: row.address_line1 || '',
        address_line2: row.address_line2 || '',
        city: row.city || '',
        state: row.state || '',
        zip_code: row.zip || '',
        full_address: fullAddress,
        phone: row.phone || null,
        email: publicEmail,
        website: row.website_url || row.website || null,
        license_number: row.license_number || null,
        apprenticeship_plans: plans,
        approval_status: row.approval_status,
        featured: Boolean(row.featured),
        google_maps_url: fullAddress
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
          : null,
        google_maps_embed_url: fullAddress
          ? `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`
          : null,
      };
    })
    .filter((shop) => {
      if (city && shop.city.toLowerCase() !== city.toLowerCase()) return false;
      if (program && !shop.apprenticeship_plans.some((p) => p.toLowerCase() === program)) return false;
      if (
        search &&
        !`${shop.name} ${shop.owner_name ?? ''} ${shop.full_address} ${shop.apprenticeship_plans.join(' ')}`
          .toLowerCase()
          .includes(search)
      ) {
        return false;
      }
      return true;
    });

  return NextResponse.json({ shops, total: shops.length });
}
