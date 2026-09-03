import { describe, expect, it } from 'vitest';
import { deriveInstructionalVisualIntent } from '@/server/video-generator/visual-intelligence';
import { instructionalLayoutForScene } from '@/remotion-src/instructional-layout';

describe('HVAC visual intelligence', () => {
  it('turns generic narration into specific filmable evidence', () => {
    const intent = deriveInstructionalVisualIntent({
      domainKey: 'hvac_epa608', title: 'Recovery Setup',
      action: 'Connect the recovery cylinder and verify the setup',
      sceneType: 'equipment_closeup',
    });
    expect(intent.query).toContain('refrigerant recovery machine cylinder scale hose connection');
    expect(intent.query).toContain('correct PPE');
  });

  it('uses an exact component-function diagram for the refrigeration cycle', () => {
    const layout = instructionalLayoutForScene({
      title: 'The Refrigeration Cycle', action: 'Trace flow from compressor to condenser and evaporator', sceneType: 'system_diagram',
    });
    expect(layout?.kind).toBe('refrigeration-cycle');
    if (layout?.kind === 'refrigeration-cycle') expect(layout.columns).toHaveLength(4);
  });
});
