import 'server-only';

import { z } from 'zod';
import { aiChat } from '@/lib/ai/ai-service';

export const commercialAspectRatioSchema = z.enum(['16:9', '9:16', '1:1']);
export const commercialSourceModeSchema = z.enum(['stock', 'generative', 'hybrid']);
export const commercialToneSchema = z.enum([
  'professional',
  'warm',
  'energetic',
  'cinematic',
  'educational',
]);

export const commercialBriefSchema = z.object({
  projectName: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(180),
  prompt: z.string().trim().min(20).max(6_000),
  audience: z.string().trim().min(2).max(300).default('prospective customers'),
  objective: z.string().trim().min(2).max(300).default('explain the offer and drive action'),
  cta: z.string().trim().min(1).max(160).default('Learn more'),
  durationSeconds: z.number().int().min(15).max(90).default(45),
  aspectRatio: commercialAspectRatioSchema.default('16:9'),
  sourceMode: commercialSourceModeSchema.default('hybrid'),
  tone: commercialToneSchema.default('professional'),
  voice: z
    .enum(['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer'])
    .default('coral'),
  includeCaptions: z.boolean().default(true),
  musicAssetUrl: z.string().url().optional(),
});

export type CommercialBrief = z.infer<typeof commercialBriefSchema>;

export const commercialSceneSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(140),
  narration: z.string().min(1).max(700),
  onScreenText: z.string().min(1).max(120),
  visualQuery: z.string().min(2).max(180),
  visualPrompt: z.string().min(10).max(900),
  durationSeconds: z.number().min(2).max(15),
});

export const commercialPlanSchema = z.object({
  title: z.string().min(1).max(180),
  hook: z.string().min(1).max(180),
  scenes: z.array(commercialSceneSchema).min(3).max(10),
  finalCta: z.string().min(1).max(160),
});

export type CommercialScene = z.infer<typeof commercialSceneSchema>;
export type CommercialPlan = z.infer<typeof commercialPlanSchema>;

function stripFences(value: string) {
  return value.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
}

function normalizePlan(plan: CommercialPlan, brief: CommercialBrief): CommercialPlan {
  const target = brief.durationSeconds;
  const rawTotal = plan.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0) || 1;
  const scale = target / rawTotal;
  const normalizedScenes = plan.scenes.map((scene, index) => ({
    ...scene,
    id: scene.id || `scene-${index + 1}`,
    durationSeconds: Math.max(2, Math.min(15, Math.round(scene.durationSeconds * scale * 10) / 10)),
  }));

  const adjustedTotal = normalizedScenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
  const delta = target - adjustedTotal;
  if (normalizedScenes.length && Math.abs(delta) >= 0.1) {
    const last = normalizedScenes[normalizedScenes.length - 1];
    last.durationSeconds = Math.max(2, Math.min(15, Math.round((last.durationSeconds + delta) * 10) / 10));
  }

  return { ...plan, scenes: normalizedScenes, finalCta: brief.cta };
}

function fallbackPlan(brief: CommercialBrief): CommercialPlan {
  const sceneCount = Math.max(3, Math.min(8, Math.round(brief.durationSeconds / 7)));
  const duration = Math.round((brief.durationSeconds / sceneCount) * 10) / 10;
  const prompts = [
    'Open with the customer problem and an immediate visual hook.',
    'Show the product or service solving the main problem.',
    'Show the strongest practical benefit in use.',
    'Show proof, confidence, or a credible real-world outcome.',
    'Make the next step feel simple and achievable.',
    `End with a clean call to action: ${brief.cta}.`,
  ];

  const scenes = Array.from({ length: sceneCount }, (_, index) => {
    const instruction = prompts[Math.min(index, prompts.length - 1)];
    return {
      id: `scene-${index + 1}`,
      title: index === 0 ? 'Hook' : index === sceneCount - 1 ? 'Call to action' : `Benefit ${index}`,
      narration:
        index === 0
          ? `${brief.title}. ${brief.prompt.slice(0, 240)}`
          : index === sceneCount - 1
            ? `${brief.cta}.`
            : `${brief.objective}. ${instruction}`,
      onScreenText: index === sceneCount - 1 ? brief.cta : brief.title,
      visualQuery: `${brief.title} ${brief.audience} professional`,
      visualPrompt: `${instruction} ${brief.prompt.slice(0, 300)} Bright professional commercial photography, authentic people, clear subject, ${brief.aspectRatio} composition.`,
      durationSeconds: duration,
    };
  });

  return normalizePlan(
    {
      title: brief.title,
      hook: brief.title,
      scenes,
      finalCta: brief.cta,
    },
    brief,
  );
}

export async function createCommercialPlan(input: unknown): Promise<{ brief: CommercialBrief; plan: CommercialPlan }> {
  const brief = commercialBriefSchema.parse(input);
  const desiredScenes = Math.max(3, Math.min(8, Math.round(brief.durationSeconds / 7)));
  const words = Math.round(brief.durationSeconds * 2.1);

  const response = await aiChat({
    temperature: 0.45,
    maxTokens: 3_500,
    messages: [
      {
        role: 'system',
        content: `You are a senior commercial video director. Return only valid JSON. Build concise, visually specific commercials that can be rendered with stock or generative video. Do not invent regulated approvals, testimonials, statistics, guarantees, prices, or legal claims. Keep narration natural and spoken, not a list. On-screen text must be short. Visual queries must be practical stock-video searches. Visual prompts must describe a shot, subject, action, lighting, camera framing and setting without text baked into the image.`,
      },
      {
        role: 'user',
        content: `Create a ${brief.durationSeconds}-second ${brief.tone} commercial plan with about ${desiredScenes} scenes and about ${words} spoken words total.\n\nTitle: ${brief.title}\nAudience: ${brief.audience}\nObjective: ${brief.objective}\nCTA: ${brief.cta}\nAspect ratio: ${brief.aspectRatio}\nMedia mode: ${brief.sourceMode}\nBrief: ${brief.prompt}\n\nJSON shape:\n{"title":"...","hook":"...","finalCta":"...","scenes":[{"id":"scene-1","title":"...","narration":"...","onScreenText":"...","visualQuery":"...","visualPrompt":"...","durationSeconds":7}]}`,
      },
    ],
  });

  try {
    const parsed = commercialPlanSchema.parse(JSON.parse(stripFences(response.content)));
    return { brief, plan: normalizePlan(parsed, brief) };
  } catch {
    return { brief, plan: fallbackPlan(brief) };
  }
}

export async function reviseCommercialPlan(input: {
  brief: CommercialBrief;
  plan: CommercialPlan;
  instruction: string;
}): Promise<CommercialPlan> {
  const brief = commercialBriefSchema.parse(input.brief);
  const currentPlan = commercialPlanSchema.parse(input.plan);
  const instruction = z.string().trim().min(3).max(1_500).parse(input.instruction);

  const response = await aiChat({
    temperature: 0.35,
    maxTokens: 3_500,
    messages: [
      {
        role: 'system',
        content: `You edit an existing commercial storyboard from a plain-language direction. Return only the complete revised JSON storyboard. Preserve accurate product claims. Never add unsupported approvals, guarantees, statistics, testimonials, prices, legal claims, or features that were not in the supplied brief. Keep practical stock-search queries and visually specific generative prompts.`,
      },
      {
        role: 'user',
        content: `Commercial brief:\n${JSON.stringify(brief)}\n\nCurrent storyboard:\n${JSON.stringify(currentPlan)}\n\nEdit instruction:\n${instruction}\n\nReturn the entire storyboard in the same JSON shape.`,
      },
    ],
  });

  try {
    const revised = commercialPlanSchema.parse(JSON.parse(stripFences(response.content)));
    return normalizePlan(revised, brief);
  } catch {
    return currentPlan;
  }
}
