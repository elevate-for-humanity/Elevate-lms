"use client";

/**
 * Module Progress List Component
 *
 * Displays all modules for an enrollment with status and actions
 */

import Link from 'next/link';

interface ModuleProgress {
  id: string;
  status: 'not_started' | 'in_progress' | 'awaiting_proof' | 'completed';
  score?: number;
  partner_completion_proof_url?: string;
  last_accessed_at?: string;
  completed_at?: string;
  module: {
    id: string;
    title: string;
    order_index: number;
    content_type: string;
    partner_name?: string;
    external_url?: string;
    required_hours?: number;
    requires_proof: boolean;
    scorm_packages?: Array<{
      id: string;
      title: string;
      provider: string;
    }>;
  };
}

interface ModuleProgressListProps {
  moduleProgress: ModuleProgress[];
  enrollmentId: string;
}

export default function ModuleProgressList({
  moduleProgress,
  enrollmentId
}: ModuleProgressListProps) {
  if (!moduleProgress || moduleProgress.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>No modules found for this program</p>
      </div>
    );
  }

  // Sort by order_index
  const sortedProgress = [...moduleProgress].sort(
    (a, b) => a.module.order_index - b.module.order_index
  );

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return 'text-brand-green-400 bg-brand-green-500/10 border-brand-green-500/30';
      case 'in_progress':
        return 'text-brand-blue-400 bg-brand-blue-500/10 border-brand-blue-500/30';
      case 'awaiting_proof':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in_progress':
        return '▶';
      case 'awaiting_proof':
        return '⏳';
      default:
        return '○';
    }
  }

  function getContentTypeLabel(contentType: string) {
    switch (contentType) {
      case 'scorm':
        return 'SCORM';
      case 'external_link':
        return 'External';
      case 'jri_badge_set':
        return 'JRI';
      case 'other':
        return 'In-Person';
      default:
        return contentType;
    }
  }

  return (
    <div className="space-y-3">
      {sortedProgress.map((progress) => (
        <div
          key={progress.id}
          className={`border rounded-lg p-4 transition-all ${getStatusColor(progress.status)}`}
        >
          {/* Module Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">
                  {getStatusIcon(progress.status)}
                </span>
                <div>
                  <h4 className="text-white font-medium">
                    {progress.module.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-2 bg-slate-700 rounded text-slate-300">
                      {getContentTypeLabel(progress.module.content_type)}
                    </span>
                    {progress.module.partner_name && (
                      <span className="text-xs text-slate-400">
                        via {progress.module.partner_name}
                      </span>
                    )}
                    {progress.module.required_hours && (
                      <span className="text-xs text-slate-400">
                        {progress.module.required_hours} hrs
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <span className={`badge ${
              progress.status === 'completed' ? 'badge-success' :
              progress.status === 'in_progress' ? 'badge-primary' :
              progress.status === 'awaiting_proof' ? 'badge-warning' :
              'text-slate-400'
            }`}>
              {progress.status.replace('_', ' ')}
            </span>
          </div>

          {/* Module Details */}
          <div className="space-y-2 text-sm">

            {/* Score */}
            {progress.score !== null && progress.score !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">Score:</span>
                <span className="text-white font-medium">
                  {progress.score}%
                </span>
              </div>
            )}

            {/* Last Accessed */}
            {progress.last_accessed_at && (
              <div className="flex justify-between">
                <span className="text-slate-400">Last Accessed:</span>
                <span className="text-white">
                  {new Date(progress.last_accessed_at).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Completed Date */}
            {progress.completed_at && (
              <div className="flex justify-between">
                <span className="text-slate-400">Completed:</span>
                <span className="text-white">
                  {new Date(progress.completed_at).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Proof Document */}
            {progress.partner_completion_proof_url && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Certificate:</span>
                <a
                  href={progress.partner_completion_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue-400 hover:text-brand-blue-300 underline"
                >
                  View →
                </a>
              </div>
            )}

            {/* SCORM Package Info */}
            {progress.module.scorm_packages && progress.module.scorm_packages.length > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">SCORM Package:</span>
                <span className="text-white text-xs">
                  {progress.module.scorm_packages[0].provider} - {progress.module.scorm_packages[0].title}
                </span>
              </div>
            )}

            {/* External URL */}
            {progress.module.external_url && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Partner Link:</span>
                <a
                  href={progress.module.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue-400 hover:text-brand-blue-300 underline text-xs"
                >
                  Open →
                </a>
              </div>
            )}

          </div>

          {/* Actions */}
          {progress.status === 'awaiting_proof' && (
            <div className="mt-4 pt-4 border-t border-slate-600">
              <div className="flex gap-3">
                <button className="glow-btn-secondary flex-1 text-sm py-2">
                  Approve Completion
                </button>
                <button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm">
                  Request Resubmit
                </button>
              </div>
            </div>
          )}

        </div>
      ))}

      {/* Summary */}
      <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-600">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">
              {sortedProgress.length}
            </div>
            <div className="text-xs text-slate-400">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-brand-green-400">
              {sortedProgress.filter(p => p.status === 'completed').length}
            </div>
            <div className="text-xs text-slate-400">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-brand-blue-400">
              {sortedProgress.filter(p => p.status === 'in_progress').length}
            </div>
            <div className="text-xs text-slate-400">In Progress</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-400">
              {sortedProgress.filter(p => p.status === 'not_started').length}
            </div>
            <div className="text-xs text-slate-400">Not Started</div>
          </div>
        </div>
      </div>

    </div>
  );
}
