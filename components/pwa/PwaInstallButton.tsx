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

  if (platform === 'ios') return null;
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
    <button
      type="button"
      onClick={() => void promptInstall()}
      disabled={!canInstall}
      className={`${className} ${!canInstall ? 'opacity-60 cursor-not-allowed' : ''}`.trim()}
      aria-label={label}
      aria-disabled={!canInstall}
      title={canInstall ? label : 'Install becomes available when this browser confirms the app is installable.'}
    >
      {label}
    </button>
  );
}
