import type { Metadata } from 'next';
import { Download, MonitorSmartphone, ShieldCheck } from 'lucide-react';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';

export const metadata: Metadata = {
  title: 'Install Elevate Admin',
  description: 'Install the Elevate Admin progressive web app for faster access to administrative dashboards.',
  robots: { index: false, follow: false },
};

export default function AdminInstallPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
            <MonitorSmartphone className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Install Elevate Admin</h1>
          <p className="mt-4 text-base font-medium leading-7 text-slate-700">
            Install the Admin dashboard as an app on a supported desktop, Android phone, or tablet. It opens directly into the Elevate administrative workspace while keeping the same authenticated account and permissions.
          </p>

          <PwaInstallButton
            label="Install Admin App"
            installedLabel="Admin App Installed"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 font-extrabold text-white hover:bg-orange-700"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <Download className="h-5 w-5 text-slate-800" aria-hidden />
              <h2 className="mt-3 text-lg font-extrabold">Chrome / Edge / Android</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                Use the Install Admin App button when available. The browser will open its native installation prompt.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <ShieldCheck className="h-5 w-5 text-slate-800" aria-hidden />
              <h2 className="mt-3 text-lg font-extrabold">iPhone / iPad</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                In Safari, use Share, then Add to Home Screen. iOS does not expose the same install-prompt API as Chrome or Edge.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
