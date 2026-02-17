"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    // Error logged
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-xl rounded-xl border border-brand-red-100 bg-brand-red-50 p-4 text-sm text-brand-red-800">
          <h2 className="font-semibold">Something went wrong.</h2>
          <p className="mt-1">
            Please refresh the page. If this keeps happening, contact support or your case manager.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
