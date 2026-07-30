import Link from "next/link";
import { AdminInstallButton } from "@/components/pwa/AdminInstallButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Install Admin App",
  robots: { index: false, follow: false },
};

export default function InstallAdminPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin/dashboard"
          className="text-sm font-bold text-blue-700"
        >
          ← Back to dashboard
        </Link>

        <section className="mt-6 rounded-3xl bg-slate-950 p-7 text-white sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-300">
            Elevate Admin
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Install your Admin dashboard.
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Install Elevate Admin on your
            computer, Android device, iPhone, or
            iPad for faster access to your
            dashboard.
          </p>

          <div className="mt-8">
            <AdminInstallButton />
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-black text-slate-950">
              Chrome or Edge
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Open the Admin dashboard, select
              Install Elevate Admin, and confirm.
            </p>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-black text-slate-950">
              Android
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Open the menu and select Install app
              or Add to Home screen.
            </p>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-black text-slate-950">
              iPhone or iPad
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Open in Safari, select Share, then
              Add to Home Screen.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
