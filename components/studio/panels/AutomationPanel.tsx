'use client';

/**
 * AutomationPanel — displays only automation explicitly scoped to this course.
 * Reads automationRules + workflows from CourseProvider (loaded at session start).
 * Full automation management is available at /studio/workflows.
 */

import { useCourse } from '../CourseProvider';
import { Zap, ExternalLink } from 'lucide-react';
import { PanelHeader } from './BlueprintPanel';

export function AutomationPanel() {
  const { state } = useCourse();
  const { automationRules, workflows } = state;

  return (
    <div className="p-6 max-w-2xl">
      <PanelHeader
        icon={<Zap className="w-5 h-5" />}
        title="Course Automation"
        subtitle={`${automationRules.length} rule${automationRules.length !== 1 ? 's' : ''} · ${workflows.length} workflow${workflows.length !== 1 ? 's' : ''}`}
        actions={
          <a
            href="/studio/workflows"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-brand-blue-600 hover:text-brand-blue-800 transition"
          >
            Manage all <ExternalLink className="w-3.5 h-3.5" />
          </a>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-2xl font-bold text-slate-900">{automationRules.length}</p>
          <p className="text-sm text-slate-500 mt-1">Automation Rules</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-2xl font-bold text-slate-900">{workflows.length}</p>
          <p className="text-sm text-slate-500 mt-1">Workflows</p>
        </div>
      </div>

      {automationRules.length > 0 ? (
        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Active Rules</h3>
          {automationRules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 bg-white">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{rule.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {rule.trigger_type} → {rule.action_type}
                  {rule.run_count > 0 && <span className="ml-2 text-slate-400">· {rule.run_count} run{rule.run_count !== 1 ? 's' : ''}</span>}
                </p>
              </div>
              <span className={`ml-3 shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${rule.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {rule.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center mb-6">
          <Zap className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No course-scoped automation rules</p>
          <p className="text-xs text-slate-400 mt-1">Platform-wide rules are managed in the unified Workflow Designer and are not counted as course rules.</p>
          <a href="/studio/workflows" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-800">
            Create automation rule <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {workflows.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Workflows</h3>
          {workflows.map(wf => (
            <div key={wf.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 bg-white">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{wf.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {wf.category ?? wf.workflow_key}
                  {wf.run_count > 0 && <span className="ml-2 text-slate-400">· {wf.run_count} run{wf.run_count !== 1 ? 's' : ''}</span>}
                </p>
              </div>
              <span className={`ml-3 shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${wf.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {wf.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
