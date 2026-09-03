'use client';

import React from 'react';

import { useState } from 'react';
import { useInstallPrompt } from '@/hooks/useMobile';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const { installPrompt, isInstalled, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || !installPrompt || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (!installed) {
      setDismissed(true);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm">
      <div className="   text-white rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Download size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Install Elevate App</h3>
            <p className="text-sm text-white/90 mb-3">Get quick access and work offline</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-white text-brand-orange-600 font-medium text-sm rounded-lg active:scale-95 transition-transform"
              >
                Install
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-4 py-2 bg-white/20 text-slate-900 font-medium text-sm rounded-lg active:scale-95 transition-transform"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
