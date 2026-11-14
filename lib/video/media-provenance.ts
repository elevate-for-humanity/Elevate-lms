import 'server-only';

import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MediaOperation, MediaScene, MediaStoryboard } from './media-director';

export interface MediaProvenanceInput {
  tenantId?: string | null;
  courseId?: string | null;
  lessonId?: string | null;
  videoJobId?: string | null;
  storyboard: MediaStoryboard;
  scene: MediaScene;
  provider: string;
  model: string;
  modelVersion?: string | null;
  operation?: MediaOperation;
  referenceUrls?: string[];
  likenessConsentRecordIds?: string[];
  moderationDecision?: 'approved' | 'blocked' | 'review';
  generatedAssetUrl?: string | null;
  generatedBytes?: number | null;
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function recordMediaProvenance(db: SupabaseClient, input: MediaProvenanceInput): Promise<void> {
  const references = (input.referenceUrls ?? []).filter(Boolean);
  const consentIds = (input.likenessConsentRecordIds ?? []).filter(Boolean);
  const payload = {
    tenant_id: input.tenantId ?? null,
    course_id: input.courseId ?? null,
    lesson_id: input.lessonId ?? null,
    video_job_id: input.videoJobId ?? null,
    storyboard_version: input.storyboard.version,
    storyboard_hash: input.storyboard.promptHash,
    scene_id: input.scene.id,
    operation: input.operation ?? input.scene.operation,
    provider: input.provider,
    model: input.model,
    model_version: input.modelVersion ?? null,
    prompt_hash: sha256(JSON.stringify({ storyboard: input.storyboard.promptHash, scene: input.scene })),
    reference_urls: references,
    reference_hash: references.length ? sha256(JSON.stringify(references)) : null,
    likeness_consent_record_ids: consentIds,
    moderation_decision: input.moderationDecision ?? 'approved',
    ai_generated: true,
    watermark_policy: 'elevate-ai-generated-v1',
    generated_asset_url: input.generatedAssetUrl ?? null,
    generated_bytes: input.generatedBytes ?? null,
    metadata: {
      scene_order: input.scene.order,
      camera_move: input.scene.cameraMove,
      shot_size: input.scene.shotSize,
      character_ids: input.scene.characterIds,
      transition: input.scene.transition,
    },
  };

  const { error } = await db.from('media_generation_provenance').insert(payload);
  if (error) throw error;
}
