'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, Users, BookOpen, BarChart3, Download,
} from 'lucide-react';

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const NAV = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Applications', href: '/admin/applications', icon: FileText },
  { label: 'Students', href: '/admin/students', icon: Users },
  { label: 'Programs', href: '/admin/programs', icon: BookOpen },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
];

export default function AdminMobileNav() {
  const pathname = usePathname();
  const [prompt, setPrompt] = useState<DeferredPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    function handler(e: Event) {
      e.preventDefault();
      setPrompt(e as DeferredPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setPrompt(null);
    else setDismissed(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden">
      {/* Install banner — shown above nav when browser prompt is available */}
      {prompt && !dismissed && (
        <div className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-2 text-white">
          <span className="text-xs font-medium">Install Elevate Admin for quick access</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={handleInstall}
              className="flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-400 transition-colors"
            >
              <Download className="h-3 w-3" />
              Install
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="bg-white border-t border-slate-200 safe-area-pb">
        <div className="flex items-stretch h-16">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                  active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-slate-900' : 'text-slate-400'}`} />
                {label}
                {active && <span className="absolute bottom-0 w-8 h-0.5 bg-slate-900 rounded-full" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
