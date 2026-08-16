'use client';

/**
 * Below-the-fold dashboard panels — lazy-loaded to improve initial dashboard paint.
 * Uses React lazy/Suspense instead of next/dynamic so the dashboard does not
 * depend on private Next.js vendored loadable internals during production builds.
 */

import { Component, lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PanelErrorBoundary extends Component<{ children: ReactNode; name: string }, ErrorBoundaryState> {
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 mb-6">
          <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
            <AlertTriangle className="w-5 h-5" />
            Failed to load {this.props.name}
          </div>
          <p className="text-sm text-red-600 mb-4">
            {this.state.error?.message || 'An error occurred while loading this panel.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const panelSkeleton = (
  <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6 animate-pulse">
    <div className="h-4 w-40 bg-slate-200 rounded mb-4" />
    <div className="h-24 w-full bg-slate-100 rounded" />
  </div>
);

type LazyModule = { default?: ComponentType<any> } & Record<string, unknown>;

function createDeferredPanel(
  name: string,
  loader: () => Promise<LazyModule>,
): ComponentType<any> {
  const LazyPanel = lazy(async () => {
    const mod = await loader();
    const component = mod.default ?? Object.values(mod).find((value) => typeof value === 'function');
    if (!component) throw new Error(`${name} does not export a React component`);
    return { default: component as ComponentType<any> };
  });

  function DeferredPanel(props: Record<string, unknown>) {
    return (
      <PanelErrorBoundary name={name}>
        <Suspense fallback={panelSkeleton}>
          <LazyPanel {...props} />
        </Suspense>
      </PanelErrorBoundary>
    );
  }

  DeferredPanel.displayName = `${name}Lazy`;
  return DeferredPanel;
}

export const PublishWebsitePanelLazy = createDeferredPanel(
  'Publish Website',
  () => import('./PublishWebsitePanel'),
);

export const ProgramIntegrityPanelLazy = createDeferredPanel(
  'Program Integrity',
  () => import('./ProgramIntegrityPanel'),
);

export const JobBoardPanelLazy = createDeferredPanel(
  'Job Board',
  () => import('./JobBoardPanel'),
);

export const SitePreviewPanelWrapperLazy = createDeferredPanel(
  'Site Preview',
  () => import('./SitePreviewPanelWrapper'),
);

export const LizzyContainerWrapperLazy = createDeferredPanel(
  'Lizzy',
  () => import('./LizzyContainerWrapper'),
);
