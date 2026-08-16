'use client';

/**
 * Admin dashboard panels.
 *
 * These panels previously used next/dynamic for below-the-fold loading. In the
 * current Next.js 15.5.x workspace that pulled an internal vendored loadable
 * context that is not available in the Admin bundle. Static client imports keep
 * the same panel contracts and error isolation without depending on Next.js
 * private internals.
 */

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { PublishWebsitePanel } from './PublishWebsitePanel';
import { ProgramIntegrityPanel } from './ProgramIntegrityPanel';
import { JobBoardPanel } from './JobBoardPanel';
import { SitePreviewPanelWrapper } from './SitePreviewPanelWrapper';
import { LizzyContainerWrapper } from './LizzyContainerWrapper';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class PanelErrorBoundary extends Component<
  { children: ReactNode; name: string },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; name: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="mb-2 flex items-center gap-2 font-semibold text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Failed to load {this.props.name}
          </div>
          <p className="mb-4 text-sm text-red-600">
            {this.state.error?.message || 'An error occurred while loading this panel.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Preserve the public names consumed by DashboardShell while removing the
// next/dynamic dependency that broke the Admin production bundle.
export const PublishWebsitePanelLazy = PublishWebsitePanel;
export const ProgramIntegrityPanelLazy = ProgramIntegrityPanel;
export const JobBoardPanelLazy = JobBoardPanel;
export const SitePreviewPanelWrapperLazy = SitePreviewPanelWrapper;
export const LizzyContainerWrapperLazy = LizzyContainerWrapper;
