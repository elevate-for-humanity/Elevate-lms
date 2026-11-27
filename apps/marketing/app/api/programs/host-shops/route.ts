// PUBLIC ROUTE: returns approved host shops for program selection dropdowns and the host-shops page.
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
import { getApprovedShops, type ProgramKey } from '@/lib/programs/host-shops';
import { safeInternalError } from '@/lib/api/safe-error';

export const revalidate = 300;

export type { HostShop } from '@/lib/programs/host-shops';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  try {
    const program = new URL(request.url).searchParams.get('program') as ProgramKey | null;
    // Explicit public projection: new operational fields must not become public by default.
    const shops = (await getApprovedShops(program ?? undefined)).map((shop) => ({
      id: shop.id,
      name: shop.name,
      address: shop.address,
      city: shop.city,
      state: shop.state,
      zip: shop.zip,
      phone: shop.phone,
      programs: shop.programs,
      primaryProgram: shop.primaryProgram,
      badge: shop.badge,
      publicSlug: shop.publicSlug,
      publicSlugAliases: shop.publicSlugAliases,
      canonicalPartner: shop.canonicalPartner,
      description: shop.description,
      website: shop.website,
      googleMapsUrl: shop.googleMapsUrl,
      logoUrl: shop.logoUrl,
      flyerUrl: shop.flyerUrl,
      videoUrl: shop.videoUrl,
      mediaGallery: shop.mediaGallery,
    }));
    return NextResponse.json({ shops });
  } catch (err) {
    return safeInternalError(err, 'Failed to load host shops');
  }
}
