import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CATEGORIES = new Set([
  'business_fact', 'pricing', 'inventory', 'testimonial', 'rating', 'outcome',
  'operational_metric', 'credential', 'license', 'accreditation', 'contact', 'staff',
]);

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function ownedSite(websiteId: string) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user?.id) return { db, user: null, site: null };
  const { data: site } = await db.from('user_websites').select('id,user_id').eq('id', websiteId).maybeSingle();
  return { db, user, site: site?.user_id === user.id ? site : null };
}

async function _GET(_request: NextRequest, { params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = await params;
  const { db, user, site } = await ownedSite(websiteId);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!site) return NextResponse.json({ error: 'Website not found' }, { status: 404 });
  const access = await getWebsiteBuilderAccess(user.id, db);
  if (!access.allowed) return NextResponse.json({ error: 'Website Builder subscription or active trial required' }, { status: 403 });
  const { data, error } = await db
    .from('website_claim_registry')
    .select('id,claim_key,claim_text,claim_value,claim_category,status,evidence_type,evidence_reference,evidence_url,methodology,valid_from,valid_through,verified_at,public_claim_allowed,rejection_reason,updated_at')
    .eq('website_id', websiteId)
    .order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ claims: data ?? [] });
}

async function _POST(request: NextRequest, { params }: { params: Promise<{ websiteId: string }> }) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const { websiteId } = await params;
  const { db, user, site } = await ownedSite(websiteId);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!site) return NextResponse.json({ error: 'Website not found' }, { status: 404 });
  const access = await getWebsiteBuilderAccess(user.id, db);
  if (!access.allowed) return NextResponse.json({ error: 'Website Builder subscription or active trial required' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const claimKey = clean(body.claimKey, 120).toLowerCase().replace(/[^a-z0-9_:-]+/g, '_').replace(/^_+|_+$/g, '');
  const claimText = clean(body.claimText, 2000);
  const category = clean(body.category, 80);
  const evidenceReference = clean(body.evidenceReference, 1000);
  const evidenceUrl = clean(body.evidenceUrl, 1000);
  if (!/^[a-z0-9][a-z0-9_:-]{1,119}$/.test(claimKey) || !claimText || !CATEGORIES.has(category)) {
    return NextResponse.json({ error: 'A valid claim key, claim text, and category are required.' }, { status: 400 });
  }
  if (!evidenceReference && !evidenceUrl) {
    return NextResponse.json({ error: 'Evidence is required before a claim can be submitted for review.' }, { status: 400 });
  }
  if (evidenceUrl) {
    try {
      const parsed = new URL(evidenceUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported protocol');
    } catch {
      return NextResponse.json({ error: 'Evidence URL is invalid.' }, { status: 400 });
    }
  }

  const payload = {
    website_id: websiteId,
    owner_user_id: user.id,
    claim_key: claimKey,
    claim_text: claimText,
    claim_value: body.claimValue ?? claimText,
    claim_category: category,
    status: 'pending_review',
    evidence_type: clean(body.evidenceType, 120) || null,
    evidence_reference: evidenceReference || null,
    evidence_url: evidenceUrl || null,
    methodology: clean(body.methodology, 2000) || null,
    valid_from: clean(body.validFrom, 10) || null,
    valid_through: clean(body.validThrough, 10) || null,
    verified_at: null,
    verified_by: null,
    public_claim_allowed: false,
    rejection_reason: null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await db
    .from('website_claim_registry')
    .upsert(payload, { onConflict: 'website_id,claim_key' })
    .select('id,claim_key,status,updated_at')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ claim: data, message: 'Claim submitted for staff evidence review.' }, { status: 201 });
}

export const GET = withApiAudit('/api/apps/website-builder/sites/[websiteId]/claims', _GET);
export const POST = withApiAudit('/api/apps/website-builder/sites/[websiteId]/claims', _POST);
