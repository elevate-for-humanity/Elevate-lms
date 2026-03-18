'use client';

/**
 * HvacDiagramPanel
 *
 * Renders the interactive SVG diagram that corresponds to the current lesson's
 * module. Lazily imported so the ~800 KB diagram bundle only loads when needed.
 *
 * diagramModuleId comes from HVAC_VIDEO_MAP[defId].diagramModuleId and maps
 * module slugs (hvac-02, hvac-03 …) to the appropriate diagram component.
 */

import dynamic from 'next/dynamic';
import { BookOpen } from 'lucide-react';

// Each diagram is a heavy interactive SVG — load only the one needed.
const DIAGRAM_MAP: Record<string, React.ComponentType> = {
  'hvac-02': dynamic(() => import('@/components/hvac-diagrams/RefrigerationCycleDiagram'), { ssr: false }),
  'hvac-03': dynamic(() => import('@/components/hvac-diagrams/ElectricalCircuitDiagram'),  { ssr: false }),
  'hvac-04': dynamic(() => import('@/components/hvac-diagrams/FurnaceBreakdownDiagram'),   { ssr: false }),
  'hvac-05': dynamic(() => import('@/components/hvac-diagrams/HVACSystemOverview'),        { ssr: false }),
  'hvac-08': dynamic(() => import('@/components/hvac-diagrams/RefrigerationCycleDiagram'), { ssr: false }),
  'hvac-10': dynamic(() => import('@/components/hvac-diagrams/RefrigerationCycleDiagram'), { ssr: false }),
  'hvac-11': dynamic(() => import('@/components/hvac-diagrams/CondenserBreakdownDiagram'), { ssr: false }),
  'hvac-13': dynamic(() => import('@/components/hvac-diagrams/TroubleshootingFlowchart'),  { ssr: false }),
  'hvac-16': dynamic(() => import('@/components/hvac-diagrams/HVACSystemOverview'),        { ssr: false }),
};

const DIAGRAM_TITLES: Record<string, string> = {
  'hvac-02': 'Refrigeration Cycle — Interactive Diagram',
  'hvac-03': 'Electrical Circuit — Interactive Diagram',
  'hvac-04': 'Furnace Components — Interactive Diagram',
  'hvac-05': 'HVAC System Overview — Interactive Diagram',
  'hvac-08': 'Refrigeration Cycle — Interactive Diagram',
  'hvac-10': 'Refrigeration Cycle — Interactive Diagram',
  'hvac-11': 'Condenser Breakdown — Interactive Diagram',
  'hvac-13': 'Troubleshooting Flowchart — Interactive Diagram',
  'hvac-16': 'HVAC System Overview — Interactive Diagram',
};

interface Props {
  diagramModuleId: string;
}

export default function HvacDiagramPanel({ diagramModuleId }: Props) {
  const DiagramComponent = DIAGRAM_MAP[diagramModuleId];
  if (!DiagramComponent) return null;

  const title = DIAGRAM_TITLES[diagramModuleId] ?? 'Interactive Diagram';

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200">
        <BookOpen className="w-4 h-4 text-brand-blue-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        <span className="ml-auto text-xs text-slate-400">Click components to explore</span>
      </div>
      <div className="p-4 bg-white">
        <DiagramComponent />
      </div>
    </div>
  );
}
