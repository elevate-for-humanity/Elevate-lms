export type InstructionalLayout =
  | { kind: 'business-plan'; items: string[] }
  | { kind: 'pitch-deck'; items: string[] }
  | { kind: 'lean-canvas'; items: string[] }
  | { kind: 'comparison'; columns: Array<{ title: string; purpose: string }> }
  | { kind: 'activity'; items: string[] }
  | { kind: 'refrigeration-cycle'; columns: Array<{ title: string; purpose: string }> }
  | { kind: 'epa-decision'; items: string[] }
  | { kind: 'knowledge-check'; items: string[] };

export function instructionalLayoutForScene(input: { title: string; action?: string; sceneType?: string }): InstructionalLayout | null {
  const text = `${input.title} ${input.action ?? ''}`.toLowerCase();
  if (input.sceneType === 'knowledge_check') {
    return { kind: 'knowledge-check', items: ['Read the field condition', 'Choose the governing rule', 'Explain the safe next step'] };
  }
  if (/refrigeration cycle|refrigerant flow|compressor.*condenser|evaporator.*compressor/.test(text)) {
    return { kind: 'refrigeration-cycle', columns: [
      { title: 'Compressor', purpose: 'Raises vapor pressure and temperature' },
      { title: 'Condenser', purpose: 'Rejects heat and forms high-pressure liquid' },
      { title: 'Metering Device', purpose: 'Drops pressure and controls flow' },
      { title: 'Evaporator', purpose: 'Absorbs heat and forms low-pressure vapor' },
    ] };
  }
  if (/epa 608|recovery level|appliance type|type i|type ii|type iii|universal/.test(text) && (input.sceneType === 'system_diagram' || input.sceneType === 'mental_model')) {
    return { kind: 'epa-decision', items: ['Identify equipment and refrigerant', 'Determine appliance category', 'Apply the current recovery rule', 'Recover, document, and verify'] };
  }
  return instructionalLayoutForTitle(input.title);
}

export function instructionalLayoutForTitle(title: string): InstructionalLayout | null {
  const normalized = title.trim().toLowerCase();

  if (normalized.includes('business plan structure')) {
    return {
      kind: 'business-plan',
      items: [
        'Executive Summary',
        'Company Description',
        'Market Analysis',
        'Organization & Management',
        'Products or Services',
        'Marketing & Sales',
        'Operations',
        'Funding Request',
        'Financial Projections',
      ],
    };
  }

  if (normalized.includes('pitch deck sequence')) {
    return {
      kind: 'pitch-deck',
      items: [
        'Problem',
        'Customer',
        'Solution',
        'Market',
        'Business Model',
        'Traction',
        'Competition',
        'Go-to-Market',
        'Team',
        'Financial Outlook',
        'The Ask',
      ],
    };
  }

  if (normalized.includes('lean canvas')) {
    return {
      kind: 'lean-canvas',
      items: [
        'Problem',
        'Customer Segments',
        'Unique Value Proposition',
        'Solution',
        'Channels',
        'Revenue Streams',
        'Cost Structure',
        'Key Metrics',
        'Unfair Advantage',
      ],
    };
  }

  if (normalized.includes('choose the right planning tool')) {
    return {
      kind: 'comparison',
      columns: [
        { title: 'Lean Canvas', purpose: 'Test assumptions quickly' },
        { title: 'Business Plan', purpose: 'Document detailed execution' },
        { title: 'Pitch Deck', purpose: 'Persuade an audience concisely' },
      ],
    };
  }

  if (normalized === 'your turn' || normalized.includes('learner activity')) {
    return {
      kind: 'activity',
      items: [
        'Choose one business idea',
        'Complete all nine Lean Canvas sections',
        'List evidence still needed for the business plan',
        'Outline the pitch-deck story and specific ask',
      ],
    };
  }

  return null;
}
