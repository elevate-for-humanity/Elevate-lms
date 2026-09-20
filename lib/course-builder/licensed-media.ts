import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

export type LicensedPurchase = {
  itemId: string;
  title: string;
  url: string;
  thumbnail: string;
  site: string;
  purchaseCode: string;
  purchasedAt: string;
  supportedUntil: string;
};

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'how',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'the',
  'to',
  'using',
  'with',
  'your',
  'lesson',
  'course',
  'video',
  'stock',
  'footage',
  'template',
]);

export function mediaMatchTerms(value: string): string[] {
  return [
    ...new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length > 2 && !STOP_WORDS.has(term)),
    ),
  ];
}

export function scoreLicensedMediaMatch(lessonText: string, assetTitle: string) {
  const lessonTerms = mediaMatchTerms(lessonText);
  const assetTerms = mediaMatchTerms(assetTitle);
  const lessonSet = new Set(lessonTerms);
  const overlap = assetTerms.filter((term) => lessonSet.has(term));
  const union = new Set([...lessonTerms, ...assetTerms]).size || 1;
  const score = Math.min(1, overlap.length / union + (overlap.length >= 2 ? 0.2 : 0));
  return {
    score: Number(score.toFixed(4)),
    reasons: overlap.map((term) => `Shared topic: ${term}`),
    query: lessonTerms.slice(0, 8).join(' '),
  };
}

export async function syncLicensedPurchases(input: {
  db: SupabaseClient;
  purchases: LicensedPurchase[];
  actorId: string;
  orgId?: string | null;
}) {
  const rows = input.purchases
    .filter((purchase) => purchase.itemId && purchase.title)
    .map((purchase) => ({
      org_id: input.orgId ?? null,
      provider: 'envato',
      provider_item_id: purchase.itemId,
      purchase_code: purchase.purchaseCode || null,
      title: purchase.title,
      item_url: purchase.url || null,
      thumbnail_url: purchase.thumbnail || null,
      category: purchase.site || null,
      purchased_at: purchase.purchasedAt || null,
      metadata: { supportedUntil: purchase.supportedUntil || null },
      created_by: input.actorId,
    }));
  if (!rows.length) return [];
  const { data, error } = await input.db
    .from('licensed_media_entitlements')
    .upsert(rows, { onConflict: 'provider,provider_item_id' })
    .select('*');
  if (error) throw error;
  return data ?? [];
}

export async function recommendLicensedMediaForCourse(input: {
  db: SupabaseClient;
  courseId: string;
}) {
  const [{ data: lessons, error: lessonError }, { data: entitlements, error: entitlementError }] =
    await Promise.all([
      input.db
        .from('course_lessons')
        .select('id,title,content,learning_objectives')
        .eq('course_id', input.courseId)
        .order('order_index', { ascending: true }),
      input.db
        .from('licensed_media_entitlements')
        .select(
          'id,title,provider,provider_item_id,item_url,thumbnail_url,purchase_code,purchased_at,license_type,metadata',
        )
        .order('purchased_at', { ascending: false }),
    ]);
  if (lessonError) throw lessonError;
  if (entitlementError) throw entitlementError;

  const suggestions: Array<Record<string, unknown>> = [];
  for (const lesson of lessons ?? []) {
    const lessonText = [
      lesson.title,
      lesson.content,
      JSON.stringify(lesson.learning_objectives ?? []),
    ]
      .filter(Boolean)
      .join(' ');
    const ranked = (entitlements ?? [])
      .map((entitlement) => ({
        entitlement,
        ...scoreLicensedMediaMatch(lessonText, entitlement.title),
      }))
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    for (const match of ranked) {
      suggestions.push({
        course_id: input.courseId,
        lesson_id: lesson.id,
        entitlement_id: match.entitlement.id,
        search_query: match.query || lesson.title,
        match_score: match.score,
        match_reasons: match.reasons,
        status: 'suggested',
      });
    }
  }
  if (suggestions.length) {
    const { error } = await input.db
      .from('course_lesson_media_matches')
      .upsert(suggestions, { onConflict: 'lesson_id,entitlement_id', ignoreDuplicates: true });
    if (error) throw error;
  }
  const { data, error } = await input.db
    .from('course_lesson_media_matches')
    .select(
      'id,lesson_id,entitlement_id,search_query,match_score,match_reasons,status,approved_at,attached_at,course_lessons!inner(title),licensed_media_entitlements!inner(id,title,provider_item_id,item_url,thumbnail_url,purchase_code,license_type,metadata)',
    )
    .eq('course_id', input.courseId)
    .order('match_score', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type StoredLicensedMediaMetadata = {
  storage_bucket: string;
  storage_path: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  resolution?: string;
  duration_seconds?: number;
  program_tags?: string[];
  lesson_tags?: string[];
  source_url?: string;
};

export function storedLicensedMediaMetadata(value: unknown): StoredLicensedMediaMetadata | null {
  if (!value || typeof value !== 'object') return null;
  const metadata = value as Record<string, unknown>;
  const storageBucket = String(metadata.storage_bucket ?? '');
  const storagePath = String(metadata.storage_path ?? '');
  if (storageBucket !== 'course_videos' || !storagePath.startsWith('licensed-library/'))
    return null;
  return {
    storage_bucket: storageBucket,
    storage_path: storagePath,
    file_name: typeof metadata.file_name === 'string' ? metadata.file_name : undefined,
    mime_type: typeof metadata.mime_type === 'string' ? metadata.mime_type : undefined,
    file_size: typeof metadata.file_size === 'number' ? metadata.file_size : undefined,
    resolution: typeof metadata.resolution === 'string' ? metadata.resolution : undefined,
    duration_seconds:
      typeof metadata.duration_seconds === 'number' ? metadata.duration_seconds : undefined,
    program_tags: Array.isArray(metadata.program_tags)
      ? metadata.program_tags.filter((tag): tag is string => typeof tag === 'string')
      : undefined,
    lesson_tags: Array.isArray(metadata.lesson_tags)
      ? metadata.lesson_tags.filter((tag): tag is string => typeof tag === 'string')
      : undefined,
    source_url: typeof metadata.source_url === 'string' ? metadata.source_url : undefined,
  };
}

export async function attachStoredLicensedMedia(input: {
  db: SupabaseClient;
  matchId: string;
  courseId: string;
  lessonId: string;
  actorId: string;
}) {
  const { data: match, error: matchError } = await input.db
    .from('course_lesson_media_matches')
    .select(
      'id,status,course_id,lesson_id,entitlement_id,licensed_media_entitlements!inner(id,title,metadata)',
    )
    .eq('id', input.matchId)
    .maybeSingle();
  if (matchError) throw matchError;
  if (!match || match.course_id !== input.courseId || match.lesson_id !== input.lessonId) {
    throw new Error('The licensed asset does not belong to this course lesson');
  }
  if (match.status !== 'approved')
    throw new Error('Approve the licensed asset before attaching it');
  const entitlement = Array.isArray(match.licensed_media_entitlements)
    ? match.licensed_media_entitlements[0]
    : match.licensed_media_entitlements;
  const stored = storedLicensedMediaMetadata(entitlement?.metadata);
  if (!stored)
    throw new Error('The licensed asset has not been stored in the secure media library');

  const { data: existing, error: existingError } = await input.db
    .from('course_videos')
    .select('id,title,storage_path,status')
    .eq('course_id', input.courseId)
    .eq('lesson_id', input.lessonId)
    .eq('entitlement_id', match.entitlement_id)
    .eq('asset_role', 'source_broll')
    .maybeSingle();
  if (existingError) throw existingError;
  let courseVideo = existing;
  if (!courseVideo) {
    const { data, error } = await input.db
      .from('course_videos')
      .insert({
        title: entitlement?.title ?? 'Licensed course media',
        course_id: input.courseId,
        lesson_id: input.lessonId,
        storage_path: stored.storage_path,
        duration_seconds: stored.duration_seconds ?? null,
        generated_by: 'manual',
        asset_role: 'source_broll',
        entitlement_id: match.entitlement_id,
        status: 'ready',
        created_by: input.actorId,
      })
      .select('id,title,storage_path,status')
      .single();
    if (error) throw error;
    courseVideo = data;
  }
  const { error: updateError } = await input.db
    .from('course_lesson_media_matches')
    .update({
      status: 'attached',
      course_video_id: courseVideo.id,
      attached_at: new Date().toISOString(),
      failure_reason: null,
    })
    .eq('id', input.matchId)
    .eq('status', 'approved');
  if (updateError) throw updateError;
  return courseVideo;
}

export async function attachLicensedMediaUpload(input: {
  db: SupabaseClient;
  matchId: string;
  courseId: string;
  lessonId: string;
  courseVideoId: string;
  actorId: string;
}) {
  const { data: match, error: lookupError } = await input.db
    .from('course_lesson_media_matches')
    .select('id,status,course_id,lesson_id,entitlement_id')
    .eq('id', input.matchId)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!match || match.course_id !== input.courseId || match.lesson_id !== input.lessonId) {
    throw new Error('The approved media selection does not belong to this course lesson');
  }
  if (match.status !== 'approved') {
    throw new Error('Approve the licensed scene before uploading and attaching it');
  }
  const { error: placementError } = await input.db
    .from('course_videos')
    .update({
      asset_role: 'source_broll',
      entitlement_id: match.entitlement_id,
    })
    .eq('id', input.courseVideoId)
    .eq('course_id', input.courseId)
    .eq('lesson_id', input.lessonId);
  if (placementError) throw placementError;
  const { data, error } = await input.db
    .from('course_lesson_media_matches')
    .update({
      status: 'attached',
      course_video_id: input.courseVideoId,
      attached_at: new Date().toISOString(),
      failure_reason: null,
    })
    .eq('id', input.matchId)
    .eq('status', 'approved')
    .select('id,status,course_video_id,attached_at')
    .single();
  if (error) throw error;
  return data;
}
