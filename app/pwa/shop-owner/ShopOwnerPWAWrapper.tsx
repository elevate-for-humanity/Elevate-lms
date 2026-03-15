'use client';

import { InstallPrompt } from '@/components/pwa/InstallPrompt';

export function ShopOwnerPWAWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {children}
      <InstallPrompt 
        appName="Partner Shop"
        appDescription="Install for quick access to manage apprentices"
        themeColor="#1e40af"
      />
    </div>
  );
}
