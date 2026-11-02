'use client';

/**
 * Canonical PWA install button.
 *
 * Shows:
 * - an enabled install action when the browser exposes beforeinstallprompt
 * - an installed state when already running as an installed app
 * - browser-specific instructions when a native prompt is unavailable
 *
 * Each app can style it differently via className — the logic is shared.
 */
import { useId, useState } from 'react';
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
  const { canInstall, isInstalled, promptInstall, platform, desktopBrowser } = usePwaInstall();
  const [showHelp, setShowHelp] = useState(false);
  const [installing, setInstalling] = useState(false);
  const helpId = useId();

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

  const instructions = platform === 'ios'
    ? 'Tap Share, choose Add to Home Screen, then tap Add. If that option is missing, open this page in Safari and try again.'
    : platform === 'android'
      ? 'Open this page in Chrome. Tap the three-dot menu, then choose Install app or Add to Home screen and follow the prompts.'
      : desktopBrowser === 'safari'
        ? 'On a supported Mac, open the File menu in Safari and choose Add to Dock. If that option is missing, open this page in Chrome or Edge to install it.'
        : desktopBrowser === 'edge'
          ? 'Open the three-dot menu in Edge, choose Apps, then Install this site as an app. You can also use the install icon in the address bar.'
          : desktopBrowser === 'chrome'
            ? 'Use the install icon in the Chrome address bar, or open the three-dot menu, choose Cast, save, and share, then Install page as app.'
            : 'Open this page in Chrome or Edge and use the install option in the browser menu. On an iPhone or iPad, tap Share, then Add to Home Screen.';

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (!canInstall) {
            setShowHelp(true);
            return;
          }
          setInstalling(true);
          try {
            const accepted = await promptInstall();
            setShowHelp(!accepted);
          } finally {
            setInstalling(false);
          }
        }}
        disabled={installing}
        className={`min-h-11 ${className}`.trim()}
        aria-label={label}
        aria-expanded={showHelp}
        aria-controls={showHelp ? helpId : undefined}
        aria-busy={installing}
      >
        {installing ? 'Opening install…' : label}
      </button>
      {showHelp && (
        <div id={helpId} role="region" aria-label="App installation instructions" className="mt-3 w-full basis-full rounded-xl border border-slate-200 bg-white p-4 text-left text-sm leading-6 text-slate-800">
          <p className="font-semibold">Install on this device</p>
          <p className="mt-1">{instructions}</p>
          <p className="mt-2">Already installed? Open Elevate from your home screen, Dock, or apps list. You can also keep using your dashboard in this browser.</p>
          <button type="button" onClick={() => setShowHelp(false)} className="mt-2 min-h-11 underline underline-offset-4">Close instructions</button>
        </div>
      )}
    </>
  );
}
