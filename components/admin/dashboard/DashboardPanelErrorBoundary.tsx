'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  name: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Isolates below-the-fold / lazy dashboard panels so a chunk load or client
 * render failure does not take down the entire admin dashboard route.
 */
export class DashboardPanelErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[dashboard panel:${this.props.name}]`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
            <p>
              <span className="font-semibold">{this.props.name}</span> could not load. Try a hard
              refresh (Ctrl+Shift+R). The rest of the dashboard remains available.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
