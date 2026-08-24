export type InstructionalLayout =
  | { kind: 'business-plan'; items: string[] }
  | { kind: 'pitch-deck'; items: string[] }
  | { kind: 'lean-canvas'; items: string[] }
  | { kind: 'comparison'; columns: Array<{ title: string; purpose: string }> }
  | { kind: 'activity'; items: string[] };

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
