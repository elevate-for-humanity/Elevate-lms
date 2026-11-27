import { parseHostShopAddress, normalizeHostShopAddress, formatHostShopAddress } from '@/lib/partners/host-shop-address';
/**
 * Canonical approved Host Shop loader.
 * Operational approval remains authoritative; public partner profiles only enrich
 * approved records with promotional media, website, and source-verified public contact data.
 */

import { getFeaturedHostPartnerBySlug } from '@/lib/apprenticeship-programs/host-partners';
import { requireAdminClient } from '@/lib/supabase/admin';

export type HostShopMedia = { url: string; alt?: string; source?: string };

export type HostShop = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  supervisor: string;
  programs: string[];
  primaryProgram?: string;
  badge: string;
  publicSlug?: string;
  publicSlugAliases?: string[];
  canonicalPartner?: boolean;
  description?: string;
  website?: string;
  googleMapsUrl?: string;
  logoUrl?: string;
  flyerUrl?: string;
  videoUrl?: string;
  mediaGallery?: HostShopMedia[];
};

import { PROGRAM_SLUGS, PROGRAM_LABELS, matchesHostShopProgram, normalizeHostShopProgram, type ProgramKey } from '@/lib/programs/host-shop-programs';
export { PROGRAM_SLUGS, PROGRAM_LABELS, normalizeHostShopProgram, type ProgramKey } from '@/lib/programs/host-shop-programs';


function digits(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '');
}

function businessKey(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/\b(llc|inc|dba|studio|salon|barbershop|barber shop)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Older application rows may lack a partner foreign key. Require a complete,
// matching physical location as well as the business identity before linking them.
function sameWorksite(left: Pick<HostShop, 'address' | 'city' | 'state' | 'zip'>, right: Pick<HostShop, 'address' | 'city' | 'state' | 'zip'>) {
  const a = normalizeHostShopAddress(left);
  const b = normalizeHostShopAddress(right);
  const key = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  return Boolean(a.address && b.address && a.city && b.city && a.state && b.state && a.zip && b.zip &&
    key(a.address) === key(b.address) && key(a.city) === key(b.city) &&
    key(a.state) === key(b.state) && a.zip.slice(0, 5) === b.zip.slice(0, 5));
}

function publicSlug(name: string, id: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'host-shop';
  return `${base}-${id.replace(/-/g, '').slice(0, 8)}`;
}

function parseMedia(value: unknown): HostShopMedia[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .map((item): HostShopMedia | null => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      if (typeof row.url !== 'string' || !row.url) return null;
      const url = row.url.trim();
      if (!url || seen.has(url)) return null;
      seen.add(url);
      return {
        url,
        alt: typeof row.alt === 'string' ? row.alt : undefined,
        source: typeof row.source === 'string' ? row.source : undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

/** Fail closed for synthetic records and retired partner identities on every public surface. */
function isPubliclyListedHostShop(shop: HostShop): boolean {
  const identity = [shop.name, shop.email, shop.publicSlug, shop.address].filter(Boolean).join(' ').toLowerCase();
  if (!shop.name.trim()) return false;
  if (/\[qa(?:\s+e2e)?\]|qa[ -]?e2e|qa test|test only|100 qa test way|@qa\.invalid|@example\.(?:com|org|net)|@test\.|\.invalid\b/.test(identity)) return false;
  if (/razor[’'\s-]*s?\s+image|razorsimage|marvel(?:ous|ouz)?[\s-]*(?:cuts|cutz)/.test(identity)) return false;
  // Public delisting is independent of operational approval. This canonical
  // public loader feeds directory cards, direct profiles, sitemap, and API.
  if (/prestige[\s-]+elevation[\s-]+barber[\s-]+and[\s-]+beauty[\s-]+institute/.test(identity)) return false;
  return true;
}

function approvedAddress(shop: HostShop) {
  return formatHostShopAddress(shop);
}

function approvedMapsUrl(shop: HostShop) {
  const value = approvedAddress(shop);
  return value
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${value}`)}`
    : undefined;
}

function approvedDescription(shop: HostShop) {
  const programNames = shop.programs.map((slug) => PROGRAM_LABELS[slug] ?? slug);
  const location = [shop.city, shop.state].filter(Boolean).join(', ');
  const pathways = programNames.length === 1 ? programNames[0] : programNames.join(' and ');
  return `${shop.name}${location ? ` — ${location}` : ''}. Approved Elevate Host Site record for ${pathways}.`;
}

export async function getApprovedShops(program?: ProgramKey): Promise<HostShop[]> {
  const db = await requireAdminClient();

  const [barberResult, hostResult, publicResult, activeShopResult, archivedPartnerResult, approvedPartnerResult, optedInResult] = await Promise.all([
    db
      .from('barbershop_partner_applications')
      .select(
        'id, partner_id, shop_legal_name, shop_dba_name, shop_address_line1, shop_address_line2, shop_city, shop_state, shop_zip, contact_phone, contact_email, supervisor_name',
      )
      .eq('status', 'approved')
      .order('shop_legal_name'),
    db
      .from('host_shop_applications')
      .select('id, shop_name, address, phone, email, intake, approved_by')
      .eq('status', 'approved')
      .or('approved_by.is.null,approved_by.neq.system_verification')
      .order('shop_name'),
    db
      .from('public_host_shops')
      .select(
        'id, public_slug, public_profile_published_at, display_name, description, logo_url, flyer_url, website_url, website, phone, address_line1, address_line2, city, state, zip, programs, media_gallery, video_url, source_url',
      ),
    db.from('host_shops')
      .select('id,name,address,city,state,zip_code,phone,website,image_url,description,services,specializations')
      .eq('is_approved', true).eq('shop_status', 'active').order('name'),
    db.from('partners').select('name,shop_name,dba').or('status.in.(archived,inactive),account_status.eq.archived'),
    db.from('partners').select('id,public_slug,programs,address')
      .eq('status', 'active').eq('account_status', 'active').eq('approval_status', 'approved')
      .not('public_profile_published_at', 'is', null),
    db.from('host_shop_partnerships').select('partner_id,application_id,shop_id')
      .eq('status', 'active').eq('directory_listing', true),
  ]);

  for (const result of [barberResult, hostResult, publicResult, activeShopResult, archivedPartnerResult, approvedPartnerResult, optedInResult]) {
    if (result.error) throw new Error(`HOST_SHOP_DIRECTORY_QUERY_FAILED:${result.error.message}`);
  }
  const barberRows = barberResult.data;
  const hostRows = hostResult.data;
  const publicRows = publicResult.data;
  const optedInLinks = optedInResult.data ?? [];
  const optedInPartnerIds = new Set(optedInLinks.map(row => row.partner_id));
  const canonicalPartners = new Map((approvedPartnerResult.data ?? [])
    .filter(row => optedInPartnerIds.has(row.id)).map(row => [row.id, row]));
  type SiteIdentity = Pick<HostShop, 'id' | 'name' | 'address' | 'city' | 'state' | 'zip'>;
  type PublicProfile = NonNullable<typeof publicRows>[number];
  function profileSite(profile: PublicProfile): SiteIdentity {
    const street = [profile.address_line1, profile.address_line2].filter(Boolean).join(', ');
    const legacy = normalizeHostShopAddress({
      address: canonicalPartners.get(profile.id)?.address ?? '',
      city: profile.city ?? undefined,
      state: profile.state ?? undefined,
      zip: profile.zip ?? undefined,
    });
    return {
      id: profile.id,
      name: profile.display_name ?? '',
      address: street || legacy.address,
      city: profile.city || legacy.city,
      state: profile.state || legacy.state || 'IN',
      zip: profile.zip || legacy.zip,
    };
  }
  function matchesPartnerWorksite(site: SiteIdentity, profile: PublicProfile) {
    // Two distinct canonical partner records must never be collapsed by address.
    if (canonicalPartners.has(site.id) && site.id !== profile.id) return false;
    const barberPartnerId = (barberRows ?? []).find(row => row.id === site.id)?.partner_id;
    const linkedPartnerIds = new Set(optedInLinks.filter(row => row.application_id === site.id || row.shop_id === site.id).map(row => row.partner_id));
    if (barberPartnerId) linkedPartnerIds.add(barberPartnerId);
    if ([...linkedPartnerIds].some(id => id !== profile.id)) return false;
    if (site.id === profile.id || linkedPartnerIds.has(profile.id)) return true;
    return businessKey(site.name) === businessKey(profile.display_name) && sameWorksite(site, profileSite(profile));
  }
  function canonicalProfilesForSite(site: SiteIdentity) {
    return (publicRows ?? []).filter(row =>
      canonicalPartners.has(row.id) &&
      canonicalPartners.get(row.id)?.public_slug === row.public_slug &&
      row.public_profile_published_at &&
      matchesPartnerWorksite(site, row),
    );
  }
  function findPublicProfile(site: SiteIdentity & { phone?: string }) {
    const canonical = canonicalProfilesForSite(site);
    if (canonical.length === 1) return canonical[0];
    if (canonical.length > 1) return undefined;
    // Preserve existing legacy media enrichment, but never let it borrow a
    // canonical partner's profile or occupation evidence by name alone.
    return (publicRows ?? []).find(row => !canonicalPartners.has(row.id) &&
      Boolean((digits(site.phone) && digits(site.phone) === digits(row.phone)) ||
        (businessKey(site.name) && businessKey(site.name) === businessKey(row.display_name))));
  }
  function profilePrograms(profile: PublicProfile | undefined) {
    if (!profile) return [];
    const programs = canonicalPartners.get(profile.id)?.programs ?? profile.programs;
    return Array.isArray(programs) ? programs : [];
  }

  const barberShops: HostShop[] = (barberRows ?? []).map((shop) => ({
    id: shop.id,
    name: shop.shop_dba_name || shop.shop_legal_name,
    address: [shop.shop_address_line1, shop.shop_address_line2].filter(Boolean).join(', '),
    city: shop.shop_city ?? '',
    state: shop.shop_state ?? 'IN',
    zip: shop.shop_zip ?? '',
    phone: shop.contact_phone ?? '',
    email: shop.contact_email ?? '',
    supervisor: shop.supervisor_name ?? '',
    programs: [PROGRAM_SLUGS.barber],
    badge: 'partner',
  }));

  const hostShops: HostShop[] = (hostRows ?? []).map((shop) => {
    const parsed = parseHostShopAddress(shop.address ?? '');
    const rawPrograms: unknown[] = Array.isArray(shop.intake?.programs) ? shop.intake.programs : [];
    const profile = findPublicProfile({ id: shop.id, name: shop.shop_name, ...parsed });
    const programs = [...rawPrograms, ...profilePrograms(profile)]
      .map(normalizeHostShopProgram)
      .filter((value): value is string => typeof value === 'string');
    return {
      id: shop.id,
      name: shop.shop_name,
      ...parsed,
      phone: shop.phone ?? '',
      email: shop.email ?? '',
      supervisor: '',
      programs: [...new Set(programs)],
      badge: 'partner',
    };
  });

  // A shared trading name is not proof that two approved applications refer
  // to the same worksite. Keep ambiguous or distinct sites independently listed.
  const matchedHostApplications = new Set<string>();
  for (const hostShop of hostShops) {
    const key = businessKey(hostShop.name);
    const candidates = barberShops.filter(barberShop =>
      Boolean(key && businessKey(barberShop.name) === key && sameWorksite(barberShop, hostShop)),
    );
    if (candidates.length !== 1) continue;
    const barberShop = candidates[0];
    const partnerId = (barberRows ?? []).find(row => row.id === barberShop.id)?.partner_id;
    const barberLinks = new Set(optedInLinks.filter(row => row.application_id === barberShop.id).map(row => row.partner_id));
    if (partnerId) barberLinks.add(partnerId);
    const hostLinks = new Set(optedInLinks.filter(row => row.application_id === hostShop.id).map(row => row.partner_id));
    if (barberLinks.size && hostLinks.size && [...barberLinks].some(id => !hostLinks.has(id))) continue;
    barberShop.programs = [...new Set([...barberShop.programs, ...hostShop.programs])];
    barberShop.publicSlugAliases = [...new Set([...(barberShop.publicSlugAliases ?? []), publicSlug(hostShop.name, hostShop.id)])];
    matchedHostApplications.add(hostShop.id);
  }

  const applicationBacked = [
    ...barberShops,
    ...hostShops.filter((shop) => !matchedHostApplications.has(shop.id)),
  ]
    .filter(isPubliclyListedHostShop)
    .map((shop) => {
      const profile = findPublicProfile(shop);

      const sourceVerifiedPublicPhone =
        profile?.phone && (profile.source_url || profile.website_url || profile.website)
          ? profile.phone
          : '';
      const applicationSlug = publicSlug(shop.name, shop.id);
      const profileSlug = profile?.public_slug;
      const enriched: HostShop = {
        ...shop,
        programs: [...new Set([...shop.programs, ...profilePrograms(profile)
          .map(normalizeHostShopProgram).filter((value): value is string => Boolean(value))])],
        primaryProgram: profilePrograms(profile)
          .map(normalizeHostShopProgram).find((value): value is string => Boolean(value)) ?? shop.programs[0],
        // Intake numbers are operational even when the shop itself is approved.
        phone: sourceVerifiedPublicPhone,
        // Every approved operational Host Site needs a stable public destination,
        // even before optional promotional media is added to public_host_shops.
        publicSlug: profileSlug || applicationSlug,
        publicSlugAliases: [...new Set([...(shop.publicSlugAliases ?? []), ...(profileSlug && profileSlug !== applicationSlug ? [applicationSlug] : [])])],
        description: profile?.description || approvedDescription(shop),
        website: profile?.website_url || profile?.website || undefined,
        googleMapsUrl: approvedMapsUrl(shop),
        logoUrl: profile?.logo_url ?? undefined,
        flyerUrl: profile?.flyer_url ?? undefined,
        videoUrl: profile?.video_url ?? undefined,
        mediaGallery: parseMedia(profile?.media_gallery),
      };
      return enriched;
    });

  // Public profiles are media records, not evidence of formal approval.
  // Only approved applications or explicitly approved active operational shops
  // can enter the network. Keep historical public profiles private from discovery.
  const existing = applicationBacked;
  const activeShopBacked: HostShop[] = (activeShopResult.data ?? [])
    .filter((row) => !existing.some((shop) =>
      Boolean(businessKey(row.name) && businessKey(shop.name) === businessKey(row.name) &&
        sameWorksite(shop, { address: row.address ?? '', city: row.city ?? '', state: row.state ?? 'IN', zip: row.zip_code ?? '' })),
    ))
    .map((row) => {
      const slug = publicSlug(row.name, row.id);
      const featured = getFeaturedHostPartnerBySlug(slug);
      const programs = [...new Set([...(Array.isArray(row.specializations) ? row.specializations : []), ...(Array.isArray(row.services) ? row.services : []), ...(featured?.programs ?? [])]
        .map(normalizeHostShopProgram).filter((value): value is string => Boolean(value)))];
      return { id: row.id, name: row.name, address: row.address ?? '', city: row.city ?? '', state: row.state === 'Indiana' ? 'IN' : row.state || 'IN', zip: row.zip_code ?? '', phone: row.phone ?? '', email: '', supervisor: '', programs, primaryProgram: programs[0], badge: 'partner', publicSlug: featured?.slug ?? slug, website: row.website || featured?.websiteUrl, description: row.description || featured?.marketingBlurb || `${row.name} participates in Elevate’s approved Host Shop network. Occupation and placement availability are confirmed by Elevate.`, mediaGallery: row.image_url ? [{url: row.image_url, alt: `${row.name} shop photo`}] : undefined };
    });
  const archivedNames = new Set((archivedPartnerResult.data ?? []).flatMap((row) => [row.name, row.shop_name, row.dba]).filter(Boolean).map(businessKey));
  // Older and migrated Host Sites can have their canonical approval on the
  // partner record rather than in either application table. This is an
  // additional approval source, not permission to publish profile-only rows.
  // The same approved site can have both an application and an operational row
  // whose display names differ. An active, opted-in relationship that explicitly
  // names both IDs is stronger than spelling; still require a unique full worksite.
  const linkedActiveAliases = new Set<string>();
  const isEligiblePublicShop = (shop: HostShop) =>
    isPubliclyListedHostShop(shop) && !archivedNames.has(businessKey(shop.name));
  const approvedActiveShops = activeShopBacked.filter(isEligiblePublicShop);
  for (const shop of existing.filter(isEligiblePublicShop)) {
    const linked = approvedActiveShops.filter(activeShop => sameWorksite(shop, activeShop) &&
      optedInLinks.some(link => link.application_id === shop.id && link.shop_id === activeShop.id));
    if (linked.length !== 1) continue;
    const duplicate = linked[0];
    const owners = existing.filter(candidate => optedInLinks.some(link =>
      link.application_id === candidate.id && link.shop_id === duplicate.id));
    if (owners.length !== 1) continue;
    shop.programs = [...new Set([...shop.programs, ...duplicate.programs])];
    shop.primaryProgram ??= shop.programs[0];
    // This website was already public on the eligible active listing. Never
    // transfer operational phone or email to the surviving application.
    shop.website ||= duplicate.website;
    shop.publicSlugAliases = [...new Set([
      ...(shop.publicSlugAliases ?? []), ...(duplicate.publicSlugAliases ?? []),
      ...(duplicate.publicSlug ? [duplicate.publicSlug] : []),
    ])].filter(slug => slug !== shop.publicSlug);
    linkedActiveAliases.add(duplicate.id);
  }
  const alreadyListed = [...existing, ...activeShopBacked.filter(shop => !linkedActiveAliases.has(shop.id))];
  const partnerBacked: HostShop[] = [];
  for (const partner of approvedPartnerResult.data ?? []) {
    if (!partner.public_slug || !optedInPartnerIds.has(partner.id)) continue;
    const profile = (publicRows ?? []).find(row =>
      row.id === partner.id && row.public_slug === partner.public_slug && row.public_profile_published_at,
    );
    if (!profile?.display_name || !businessKey(profile.display_name)) continue;
    const programs = [...new Set((Array.isArray(partner.programs) ? partner.programs : [])
      .map(normalizeHostShopProgram).filter((value): value is string => value !== null))];
    if (!programs.length) continue;
    const shop: HostShop = {
      ...profileSite(profile),
      canonicalPartner: true,
      phone: (profile.source_url || profile.website_url || profile.website) ? (profile.phone ?? '') : '',
      email: '',
      supervisor: '',
      programs,
      primaryProgram: programs[0],
      badge: 'partner',
      publicSlug: profile.public_slug,
      website: profile.website_url || profile.website || undefined,
      logoUrl: profile.logo_url ?? undefined,
      flyerUrl: profile.flyer_url ?? undefined,
      videoUrl: profile.video_url ?? undefined,
      mediaGallery: parseMedia(profile.media_gallery),
    };
    if (!isPubliclyListedHostShop(shop) || archivedNames.has(businessKey(shop.name))) continue;
    // A name or a previously enriched slug is not proof of worksite identity.
    // Prefer explicit relationships; for legacy rows require matching address.
    const matches = [...alreadyListed, ...partnerBacked].filter(existing => {
      if (!matchesPartnerWorksite(existing, profile)) return false;
      if (existing.canonicalPartner) return true;
      // A legacy application or active-shop row can match multiple canonical
      // profiles at the same worksite. Only its sole eligible owner may claim it.
      const eligibleOwners = canonicalProfilesForSite(existing);
      return eligibleOwners.length === 1 && eligibleOwners[0].id === profile.id;
    });
    if (matches.length > 1 && !matches.every(existing => sameWorksite(existing, shop))) continue;
    const duplicate = matches[0];
    if (duplicate) {
      // Union the independently authorized occupations. Preserve the operational
      // ID, primary trade and contact data, and keep the previous URL resolving.
      duplicate.programs = [...new Set([...matches.flatMap(existing => existing.programs), ...shop.programs])];
      duplicate.primaryProgram ??= duplicate.programs[0];
      duplicate.publicSlugAliases = [...new Set(matches.flatMap(existing => [
        ...(existing.publicSlugAliases ?? []),
        ...(existing.publicSlug ? [existing.publicSlug] : []),
      ]))].filter(slug => slug !== shop.publicSlug);
      duplicate.publicSlug = shop.publicSlug;
      duplicate.canonicalPartner = true;
      duplicate.address ||= shop.address;
      duplicate.city ||= shop.city;
      duplicate.state ||= shop.state;
      duplicate.zip ||= shop.zip;
      duplicate.googleMapsUrl = approvedMapsUrl(duplicate);
      for (const redundant of matches.slice(1)) {
        const index = alreadyListed.indexOf(redundant);
        if (index >= 0) alreadyListed.splice(index, 1);
        const partnerIndex = partnerBacked.indexOf(redundant);
        if (partnerIndex >= 0) partnerBacked.splice(partnerIndex, 1);
      }
      continue;
    }
    partnerBacked.push({
      ...shop,
      description: profile.description || approvedDescription(shop),
      googleMapsUrl: approvedMapsUrl(shop),
    });
  }

  const all = [...alreadyListed, ...partnerBacked]
    .map(shop => ({ ...shop, ...normalizeHostShopAddress(shop) }))
    .filter(isEligiblePublicShop)
    // Application email is used above only to reject synthetic records. These
    // operational rows contain no independently verified publication consent.
    .map(shop => ({ ...shop, email: '' }));


  if (program) {
    const slug = PROGRAM_SLUGS[program];
    return all.filter((shop) => matchesHostShopProgram(shop, slug));
  }
  return all;
}

/** Resolve an individual public profile back to the operationally approved Host Site. */
export async function getApprovedShopByPublicSlug(publicSlug: string): Promise<HostShop | null> {
  const shops = await getApprovedShops();
  const exact = shops.find((shop) => shop.publicSlug === publicSlug || shop.publicSlugAliases?.includes(publicSlug));
  if (exact) return exact;
  const featured = getFeaturedHostPartnerBySlug(publicSlug);
  if (!featured) return null;
  return shops.find((shop) =>
    getFeaturedHostPartnerBySlug(shop.publicSlug ?? '')?.slug === featured.slug ||
    (!shop.canonicalPartner && (businessKey(shop.name) === businessKey(featured.name) ||
      (featured.dba && businessKey(shop.name) === businessKey(featured.dba)))),
  ) ?? null;
}
