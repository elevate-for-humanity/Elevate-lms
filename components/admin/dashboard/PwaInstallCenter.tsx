'use client';

import { useEffect, useState } from 'react';
import { Download, ExternalLink, Smartphone } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type InstallableApp = {
  name: string;
  description: string;
  href: string;
  local: boolean;
  manifest?: string;
};

const apps: readonly InstallableApp[] = [
  { name: 'Admin', description: 'Administrative operations and Dev Studio', href: 'https://admin.elevateforhumanity.org/dashboard', manifest: '/manifest-admin.json', local: true },
  { name: 'Student / Learner', description: 'Courses, assignments, progress and credentials', href: 'https://app.elevateforhumanity.org/lms/dashboard', local: false },
  { name: 'Apprentice', description: 'OJL, RTI, skills and apprenticeship progress', href: 'https://app.elevateforhumanity.org/apprentice', local: false },
  { name: 'Employer', description: 'Employer workforce and participant workspace', href: 'https://app.elevateforhumanity.org/employer/dashboard', local: false },
  { name: 'Program Holder', description: 'Program-holder operations and compliance', href: 'https://app.elevateforhumanity.org/program-holder/dashboard', local: false },
  { name: 'Host Shop', description: 'Host-shop apprenticeship workspace and apprentice records', href: 'https://app.elevateforhumanity.org/host-shop/dashboard', local: false },
  { name: 'Elevate', description: 'Public Elevate for Humanity application', href: 'https://www.elevateforhumanity.org/pwa/', local: false },
];

export function PwaInstallCenter() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia('(display-mode: standalone)').matches);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const installAdmin = async () => {
    if (!installPrompt) {
      window.location.assign('/install');
      return;
    }
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-labelledby="pwa-install-center-title">
      <div className="border-b border-slate-100 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-100 p-2.5 text-blue-800"><Smartphone className="h-5 w-5" /></div>
          <div>
            <h2 id="pwa-install-center-title" className="text-xl font-black text-slate-950">PWA downloads &amp; install apps</h2>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-700">
              Install the Admin app on this device or open each role portal to install its PWA. Each card opens the canonical role portal with its own installable manifest; no duplicate applications are created.
            </p>
          </div>
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-8 xl:grid-cols-3">
        {apps.map((app) => (
          <article key={app.name} className="flex min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <h3 className="font-black text-slate-950">{app.name}</h3>
            <p className="mt-2 flex-1 text-sm font-medium leading-5 text-slate-700">{app.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {app.local && !installed ? (
                <button type="button" onClick={installAdmin} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">
                  <Download className="h-4 w-4" /> {installPrompt ? 'Install Admin' : 'How to install'}
                </button>
              ) : null}
              {app.local && installed ? (
                <span className="inline-flex min-h-11 items-center rounded-xl bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-900">Installed</span>
              ) : null}
              <a href={app.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-900 hover:bg-slate-100">
                {app.local ? 'Open app' : 'Open to install'} <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </article>
        ))}
      </div>
      <div className="border-t border-slate-100 px-6 py-4 text-xs font-medium leading-5 text-slate-600 sm:px-8">
        Every portal includes its manifest, icons, and public offline shell. Secure student, partner, and administrative records remain network-only and are not stored on the device. If the browser does not expose an Install button, open the portal and use the browser menu → Install app or Add to Home Screen.
      </div>
    </section>
  );
}
