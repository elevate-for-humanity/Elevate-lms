import { aiChat } from './ai-service';

export type VisualCompositionMode = 'create' | 'refine' | 'beautify' | 'infographic';

export interface VisualThemeContext {
  brandName?: string;
  tone?: string;
  fonts?: string[];
  colors?: string[];
  styleNotes?: string[];
}

export interface VisualCompositionRequest {
  mode: VisualCompositionMode;
  instruction: string;
  current?: Record<string, unknown>;
  sourceContext?: Record<string, unknown>;
  theme?: VisualThemeContext;
  target?: 'slide' | 'section' | 'hero' | 'program-card' | 'infographic' | 'course-visual';
}

export interface VisualCompositionSpec {
  title?: string;
  subtitle?: string;
  narrative?: string;
  layout: string;
  hierarchy: string[];
  copy: Array<{ role: string; text: string }>;
  visualPrompt?: string;
  dataPoints?: Array<{ label: string; value: string; sourceField?: string }>;
  refinements?: string[];
  accessibility?: { altText?: string; readingOrder?: string[] };
  provider?: string;
  model?: string;
}

const MODE_INSTRUCTIONS: Record<VisualCompositionMode, string> = {
  create: 'Create a new visual composition from the supplied instruction and context.',
  refine: 'Preserve the current composition intent while applying only the requested changes.',
  beautify: 'Improve hierarchy, visual storytelling, spacing, copy density, and image direction while preserving factual content and brand identity.',
  infographic: 'Turn supplied facts into a data-rich visual narrative without inventing statistics or unsupported claims.',
};

export async function composeVisual(
  request: VisualCompositionRequest,
): Promise<VisualCompositionSpec> {
  const result = await aiChat({
    messages: [
      {
        role: 'system',
        content: [
          'You are Elevate Visual Composition Intelligence for the platform’s existing Dev Studio, Website Builder, Course Builder, and Media Studio.',
          MODE_INSTRUCTIONS[request.mode],
          'Use the existing theme when provided. Do not replace established brand identity with a generic template.',
          'Treat supplied sourceContext and current composition as authoritative. Do not invent credentials, prices, outcomes, statistics, approvals, employers, funding, or testimonials.',
          'Return JSON only with keys: title, subtitle, narrative, layout, hierarchy, copy, visualPrompt, dataPoints, refinements, accessibility.',
          'copy must be an array of {role,text}. hierarchy and refinements must be string arrays. dataPoints must only contain facts present in sourceContext/current.',
          'visualPrompt should describe the visual asset needed, not name a specific image provider.',
          'accessibility should include useful altText and readingOrder when applicable.',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify({
          mode: request.mode,
          target: request.target || 'section',
          instruction: request.instruction,
          theme: request.theme || {},
          current: request.current || {},
          sourceContext: request.sourceContext || {},
        }),
      },
    ],
    temperature: request.mode === 'refine' ? 0.25 : 0.5,
    maxTokens: 2200,
  });

  const cleaned = result.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned) as Omit<VisualCompositionSpec, 'provider' | 'model'>;

  return {
    ...parsed,
    provider: result.provider,
    model: result.model,
  };
}
