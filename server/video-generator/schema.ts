import { z } from 'zod';

export const VoiceNameSchema = z.enum(['alloy', 'ash', 'ballad', 'coral', 'echo', 'onyx', 'sage', 'shimmer']);
export const VideoStyleSchema = z.enum(['barber_broll', 'barbershop_lifestyle', 'tools_closeup', 'mixed']);
export const SceneLayoutSchema = z.enum(['full_frame', 'lower_third', 'split_left_text', 'split_right_text', 'top_label']);
export const SceneTransitionSchema = z.enum(['cut', 'fade', 'crossfade']);

export const LessonSceneDraftSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  instructionalObjective: z.string().min(5).max(200).optional(),
  narration: z.string().min(20).max(800),
  caption: z.string().min(3).max(80),
  subcaption: z.string().max(120).optional(),
  videoQuery: z.string().min(3).max(120),
  visualFocus: z.string().min(5).max(200).optional(),
  layout: SceneLayoutSchema,
  minClipSeconds: z.number().min(3).max(20).optional(),
  maxClipSeconds: z.number().min(3).max(30).optional(),
  transitionIn: SceneTransitionSchema.optional(),
  transitionOut: SceneTransitionSchema.optional(),
});

export const LessonRenderPlanDraftSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().min(3).max(180),
  voice: VoiceNameSchema,
  videoStyle: VideoStyleSchema,
  targetResolution: z.enum(['1920x1080', '1280x720']),
  scenes: z.array(LessonSceneDraftSchema).min(4).max(12),
}).superRefine((data, ctx) => {
  const ids = new Set<string>();
  const orders = new Set<number>();
  for (const scene of data.scenes) {
    if (ids.has(scene.id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scenes'], message: `Duplicate scene id: ${scene.id}` });
    }
    ids.add(scene.id);
    if (orders.has(scene.order)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scenes'], message: `Duplicate scene order: ${scene.order}` });
    }
    orders.add(scene.order);
    if (scene.minClipSeconds !== undefined && scene.maxClipSeconds !== undefined && scene.minClipSeconds > scene.maxClipSeconds) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scenes'], message: `Scene ${scene.id}: minClipSeconds > maxClipSeconds` });
    }
  }
});
