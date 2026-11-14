import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';

export type StudioAssetType = 'video' | 'audio' | 'image' | 'document' | 'other';

function safeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'asset';
}

export function studioAssetPath(input: {
  organizationId: string;
  projectName: string;
  fileName: string;
}) {
  const project = safeSegment(input.projectName);
  const file = safeSegment(input.fileName.replace(/\.[^.]+$/, ''));
  const extension = input.fileName.includes('.') ? input.fileName.split('.').pop() : undefined;
  return `${input.organizationId}/${project}/${Date.now()}-${file}${extension ? `.${extension}` : ''}`;
}

export async function persistStudioAsset(input: {
  organizationId: string;
  userId?: string | null;
  projectName: string;
  fileName: string;
  buffer: Buffer;
  contentType: string;
  type: StudioAssetType;
  title: string;
  durationSeconds?: number;
  transcript?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = await requireAdminClient();
  const storagePath = studioAssetPath(input);

  const { error: uploadError } = await db.storage
    .from('media')
    .upload(storagePath, input.buffer, {
      contentType: input.contentType,
      cacheControl: '31536000',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: publicData } = db.storage.from('media').getPublicUrl(storagePath);
  const publicUrl = publicData.publicUrl;

  const metadata = {
    ...(input.metadata ?? {}),
    project_name: input.projectName,
    bucket: 'media',
    public_url: publicUrl,
    generated_in: 'admin-media-studio',
  };

  const { data: asset, error: assetError } = await db
    .from('media_assets')
    .insert({
      org_id: input.organizationId,
      storage_path: storagePath,
      type: input.type,
      mime_type: input.contentType,
      duration_seconds: input.durationSeconds ? Math.ceil(input.durationSeconds) : null,
      transcript: input.transcript ?? null,
      title: input.title,
      status: 'active',
      created_by: input.userId ?? null,
      metadata,
    })
    .select('id, org_id, storage_path, type, mime_type, duration_seconds, title, status, metadata, created_at')
    .single();

  if (assetError) {
    await db.storage.from('media').remove([storagePath]).catch(() => undefined);
    throw assetError;
  }

  return { asset, publicUrl, storagePath };
}
