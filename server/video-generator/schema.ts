import { z } from 'zod';

export const VoiceNameSchema = z.enum([
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'onyx',
  'sage',
  'shimmer',
]);
export const VideoStyleSchema = z.enum([
  'trade_demonstration',
  'clinical_demonstration',
  'technical_diagram',
  'workplace_scenario',
  'mixed',
]);
export const SceneLayoutSchema = z.enum([
  'full_frame',
  'lower_third',
  'split_left_text',
  'split_right_text',
  'top_label',
]);
export const SceneTransitionSchema = z.enum(['cut', 'fade', 'crossfade']);
export const InstructionalSceneTypeSchema = z.enum([
  'problem_hook',
  'mental_model',
  'system_diagram',
  'equipment_closeup',
  'worked_example',
  'field_scenario',
  'common_mistake',
  'safety_warning',
  'memory_recap',
  'knowledge_check',
  'service_setup',
  'sanitation_check',
  'procedure_step',
  'critical_closeup',
  'quality_check',
  'cleanup_aftercare',
  'evidence_capture',
]);
export const SceneAssetRequirementSchema = z.enum([
  'stock_context',
  'generated_diagram',
  'original_capture',
  'licensed_demonstration',
]);

export const LessonSceneDraftSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  sceneType: InstructionalSceneTypeSchema,
  instructionalObjective: z.string().min(5).max(200),
  dolCompetencyId: z.string().min(1).max(120),
  stateRequirement: z.string().min(1).max(500),
  examDomain: z.string().min(1).max(200),
  demonstrationStep: z.string().min(3).max(500),
  evidenceExpectation: z.string().min(3).max(500),
  narration: z.string().min(20).max(800),
  caption: z.string().min(3).max(80),
  subcaption: z.string().max(120).optional(),
  videoQuery: z.string().min(3).max(120),
  visualFocus: z.string().min(5).max(200).optional(),
  assetRequirement: SceneAssetRequirementSchema,
  procedureStepNumber: z.number().int().positive().optional(),
  layout: SceneLayoutSchema,
  minClipSeconds: z.number().min(3).max(20).optional(),
  maxClipSeconds: z.number().min(3).max(30).optional(),
  transitionIn: SceneTransitionSchema.optional(),
  transitionOut: SceneTransitionSchema.optional(),
});

export const LessonRenderPlanDraftSchema = z
  .object({
    lessonId: z.string().min(1),
    title: z.string().min(3).max(180),
    voice: VoiceNameSchema,
    videoStyle: VideoStyleSchema,
    targetResolution: z.enum(['1920x1080', '1280x720']),
    teachingModel: z.object({
      name: z.string().min(3).max(100),
      memoryAnchor: z.string().min(8).max(240),
      plainLanguageMap: z.string().min(12).max(400),
      misconception: z.string().min(8).max(300),
      transferQuestion: z.string().min(8).max(300),
    }),
    scenes: z.array(LessonSceneDraftSchema).min(4).max(12),
  })
  .superRefine((data, ctx) => {
    const ids = new Set<string>();
    const orders = new Set<number>();
    for (const scene of data.scenes) {
      if (ids.has(scene.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scenes'],
          message: `Duplicate scene id: ${scene.id}`,
        });
      }
      ids.add(scene.id);
      if (orders.has(scene.order)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scenes'],
          message: `Duplicate scene order: ${scene.order}`,
        });
      }
      orders.add(scene.order);
      if (
        scene.minClipSeconds !== undefined &&
        scene.maxClipSeconds !== undefined &&
        scene.minClipSeconds > scene.maxClipSeconds
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scenes'],
          message: `Scene ${scene.id}: minClipSeconds > maxClipSeconds`,
        });
      }
      const exactTechnique = ['procedure_step', 'critical_closeup'].includes(scene.sceneType);
      if (
        exactTechnique &&
        !['original_capture', 'licensed_demonstration'].includes(scene.assetRequirement)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scenes'],
          message: `Scene ${scene.id}: exact procedure technique requires original or licensed demonstration media`,
        });
      }
      if (scene.sceneType === 'procedure_step' && scene.procedureStepNumber === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scenes'],
          message: `Scene ${scene.id}: procedure_step requires procedureStepNumber`,
        });
      }
    }
  });
