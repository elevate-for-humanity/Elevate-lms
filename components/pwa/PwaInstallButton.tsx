'use client';

/**
 * Canonical PWA install button.
 *
 * Shows:
 * - an enabled install action when the browser exposes beforeinstallprompt
 * - an installed state when already running as an installed app
 * - no native-prompt button on iOS, where Add to Home Screen is browser-driven
 *
 * Each app can style it differently via className — the logic is shared.
 */
import { useState } from 'react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

interface PwaInstallButtonProps {
  /** Override the default label */
  label?: string;
  /** Override the default installed label */
  installedLabel?: string;
  /** CSS class for the button */
  className?: string;
  /** Show only when canInstall=true. Default: always show */
  showOnlyInstallable?: boolean;
  /** Render as a different element (reserved for compatibility) */
  as?: 'button' | 'a' | 'div';
}

export function PwaInstallButton({
  label = 'Install App',
  installedLabel = 'Installed',
  className = '',
  showOnlyInstallable = false,
}: PwaInstallButtonProps) {
  const { canInstall, isInstalled, promptInstall, platform } = usePwaInstall();
  const [showHelp, setShowHelp] = useState(false);

  if (platform === 'ios') {
    return <p className="text-sm font-semibold text-slate-700">On iPhone or iPad, open this page in Safari, tap Share, then tap Add to Home Screen.</p>;
  }
  if (showOnlyInstallable && !canInstall && !isInstalled) return null;

  if (isInstalled) {
    return (
      <button
        type="button"
        disabled
        className={`${className} opacity-60 cursor-not-allowed`.trim()}
        title="App is installed"
        aria-label={installedLabel}
      >
        <span aria-hidden="true">✓</span>
        {installedLabel}
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => canInstall ? void promptInstall() : setShowHelp((value) => !value)}
        className={className}
        aria-label={label}
        aria-expanded={!canInstall ? showHelp : undefined}
        title={canInstall ? label : 'Show app installation steps'}
      >
        {canInstall ? label : 'How to Install Elevate'}
      </button>
      {!canInstall && showHelp ? (
        <div role="status" className="mt-3 max-w-xl rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-950">
          On Android, open the browser menu (three dots) and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. If Elevate is already installed, open it from your home screen. If neither option appears, refresh this page in Chrome.
        </div>
      ) : null}
    </div>
  );
}
