'use client';

/**
 * StudioWorkspace — renders the active panel based on CourseProvider state.
 * The AI panel renders as a persistent right sidebar, not in the workspace.
 */

import { useCourse } from './CourseProvider';
import { BlueprintPanel } from './panels/BlueprintPanel';
import { CurriculumPanel } from './panels/CurriculumPanel';
import { QuizPanel } from './panels/QuizPanel';
import { MediaPanel } from './panels/MediaPanel';
import { PublishPanel } from './panels/PublishPanel';
import { AutomationPanel } from './panels/AutomationPanel';
import { AIPanel } from './panels/AIPanel';
import { InteractionsPanel } from './panels/InteractionsPanel';
import { AssessmentsPanel } from './panels/AssessmentsPanel';
import { CompliancePanel } from './panels/CompliancePanel';

export function StudioWorkspace() {
  const { state } = useCourse();

  const panel = (() => {
    switch (state.activePanel) {
      case 'blueprint':   return <BlueprintPanel />;
      case 'curriculum':  return <CurriculumPanel />;
      case 'quiz':        return <QuizPanel />;
      case 'media':       return <MediaPanel />;
      case 'publish':     return <PublishPanel />;
      case 'automation':  return <AutomationPanel />;
      case 'interactions': return <InteractionsPanel />;
      case 'assessments': return <AssessmentsPanel />;
      case 'compliance': return <CompliancePanel />;
      case 'ai':          return null; // AI renders in sidebar
      default:            return <BlueprintPanel />;
    }
  })();

  return (
    <div className="flex h-full">
      {/* Main workspace */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {panel}
      </div>

      {/* Persistent AI sidebar — always visible, narrows on non-AI panels */}
      <div className={`
        shrink-0 border-l border-slate-200 transition-all duration-200 overflow-hidden
        ${state.activePanel === 'ai' ? 'w-full sm:w-96' : 'hidden xl:flex xl:w-80'}
      `}>
        <div className="w-full h-full">
          <AIPanel />
        </div>
      </div>
    </div>
  );
}
