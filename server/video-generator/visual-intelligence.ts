import type { InstructionalSceneType } from '@/lib/video/media-director';

export interface InstructionalVisualIntent {
  query: string;
  deterministicDiagram: boolean;
}

/** Turns instructional meaning into a filmable, domain-specific visual request. */
export function deriveInstructionalVisualIntent(input: {
  domainKey?: string | null;
  title: string;
  action: string;
  visualFocus?: string | null;
  sceneType?: InstructionalSceneType | null;
}): InstructionalVisualIntent {
  const text = `${input.title} ${input.action} ${input.visualFocus ?? ''}`.toLowerCase();
  const hvac = input.domainKey === 'hvac_epa608' || /hvac|epa 608|refriger|compressor|evaporator|condenser|recovery cylinder/.test(text);
  const diagram = input.sceneType === 'system_diagram' || /cycle|flow|pressure.temperature|electrical path|decision rule/.test(text);
  if (!hvac) {
    return { query: [input.title, input.visualFocus, input.action].filter(Boolean).join(' ').slice(0, 180), deterministicDiagram: diagram };
  }

  let equipment = 'HVAC technician at refrigeration training bench';
  if (/manifold|gauge|pressure/.test(text)) equipment = 'close-up HVAC manifold gauge pressure reading on refrigeration system';
  else if (/recovery|cylinder/.test(text)) equipment = 'EPA 608 refrigerant recovery machine cylinder scale hose connection close-up';
  else if (/meter|electrical|voltage|continuity/.test(text)) equipment = 'HVAC technician multimeter electrical diagnostic close-up with PPE';
  else if (/evaporator/.test(text)) equipment = 'refrigeration evaporator coil airflow and heat absorption demonstration';
  else if (/condenser/.test(text)) equipment = 'HVAC condenser coil heat rejection demonstration';
  else if (/compressor/.test(text)) equipment = 'refrigeration compressor inlet outlet pressure demonstration';

  return {
    query: `${equipment}; ${input.visualFocus || input.action}; realistic technical training, correct PPE, no logos`.slice(0, 220),
    deterministicDiagram: diagram || input.sceneType === 'mental_model' || input.sceneType === 'knowledge_check',
  };
}
