import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Building2, Clock3, Download, GraduationCap, MonitorSmartphone, Store } from 'lucide-react';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';

export const metadata: Metadata = {
  title: 'Install Elevate Dashboard',
  description: 'Install the Elevate LMS dashboard for student, apprentice, and employer access.',
  robots: { index: false, follow: false },
};

export default function LmsInstallPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
            <MonitorSmartphone className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Install Your Elevate Dashboard</h1>
          <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-700">
            Install the Elevate LMS as an app for direct access to your role-based dashboard, training, apprenticeship hours, documents, and progress. The installed app uses the same secure login and permissions as the website.
          </p>

          <PwaInstallButton
            label="Install Elevate Dashboard"
            installedLabel="Elevate Dashboard Installed"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-extrabold text-white hover:bg-blue-800"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Link href="/lms/dashboard" className="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:border-blue-300 hover:bg-blue-50">
              <GraduationCap className="h-5 w-5 text-blue-800" aria-hidden />
              <h2 className="mt-3 text-lg font-extrabold">Student Dashboard</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">Courses, credentials, assignments, payments, and student progress.</p>
            </Link>
            <Link href="/apprentice" className="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:border-blue-300 hover:bg-blue-50">
              <Clock3 className="h-5 w-5 text-blue-800" aria-hidden />
              <h2 className="mt-3 text-lg font-extrabold">Apprentice Dashboard</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">OJL hours, competencies, required documents, RTI, and host-shop information.</p>
            </Link>
            <Link href="/employer/dashboard" className="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:border-blue-300 hover:bg-blue-50">
              <BookOpen className="h-5 w-5 text-blue-800" aria-hidden />
              <h2 className="mt-3 text-lg font-extrabold">Employer Dashboard</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">Candidates, apprenticeship operations, verification, and employer workflows.</p>
            </Link>
            <Link href="/program-holder/dashboard" className="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:border-blue-300 hover:bg-blue-50">
              <Building2 className="h-5 w-5 text-blue-800" aria-hidden />
              <h2 className="mt-3 text-lg font-extrabold">Program Holder</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">Programs, students, agreements, compliance, documents, and reporting.</p>
            </Link>
            <Link href="/host-shop/dashboard" className="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:border-blue-300 hover:bg-blue-50">
              <Store className="h-5 w-5 text-blue-800" aria-hidden />
              <h2 className="mt-3 text-lg font-extrabold">Host Shop</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">Apprentices, attendance, OJL, competencies, documents, and shop reports.</p>
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <Download className="h-5 w-5 text-slate-800" aria-hidden />
            <h2 className="mt-3 text-lg font-extrabold">iPhone and iPad</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
              In Safari, tap Share and then Add to Home Screen. Chrome and Edge on supported devices will show the native install prompt through the button above.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
