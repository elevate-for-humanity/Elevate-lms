'use client';

/**
 * Canonical PWA install button.
 *
 * Shows:
 * - "Install App" when installable
 * - "Installed" when already installed
 * - Nothing when the platform doesn't support install (iOS)
 *
 * Each app can style it differently via className \u2014 the logic is shared.
 */
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
  /** Render as a different element (e.g. 'a', 'div') */
  as?: 'button' | 'a' | 'div';
}

export function PwaInstallButton({
  label = 'Install App',
  installedLabel = 'Installed',
  className = '',
  showOnlyInstallable = false,
}: PwaInstallButtonProps) {
  const { canInstall, isInstalled, promptInstall, platform } = usePwaInstall();

  if (platform === 'ios') return null;
  if (showOnlyInstallable && !canInstall && !isInstalled) return null;

  if (isInstalled) {
    return (
      <button
        disabled
        className={`${className} opacity-60 cursor-not-allowed`.trim()}
        title="App is installed"
        aria-label={installedLabel}
      >
        <span aria-hidden="true">\u2713</span>
        {installedLabel}
      </button>
    );
  }

  return (
    <button
      onClick={() => void promptInstall()}
      className={className.trim()}
      aria-label={label}
    >
      {label}
    </button>
  );
}
