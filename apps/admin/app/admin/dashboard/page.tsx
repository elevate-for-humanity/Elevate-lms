import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const workspaces = [
  {
    title: "Website Editor",
    description:
      "Update hero banners, page copy, calls to action, program information, and public website content.",
    href: "/admin/website-editor",
    status: "Content workspace",
  },
  {
    title: "Course Builder",
    description:
      "Create courses, modules, lessons, assignments, exams, and completion requirements.",
    href: "/admin/course-builder",
    status: "Learning workspace",
  },
  {
    title: "Dev Studio",
    description:
      "Review source files, prepare code changes, inspect builds, and manage deployment workflows.",
    href: "/admin/dev-studio",
    status: "Development workspace",
  },
  {
    title: "Programs",
    description:
      "Manage tuition, duration, funding, schedules, credentials, enrollment status, and program pages.",
    href: "/admin/programs",
    status: "Program management",
  },
  {
    title: "Applications",
    description:
      "Review applicants, funding status, admissions steps, documents, and enrollment decisions.",
    href: "/admin/applications",
    status: "Admissions",
  },
  {
    title: "Install Admin",
    description:
      "Install this dashboard on your computer, Android device, iPhone, or iPad.",
    href: "/admin/install",
    status: "PWA",
  },
];

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <section className="bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-300">
            Elevate Operations
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Admin Command Center
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Manage your website, courses,
            applications, programs, students, and
            deployment workflow from one
            dashboard.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/admin/website-editor"
              className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
            >
              Edit Website
            </Link>

            <Link
              href="/admin/course-builder"
              className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950"
            >
              Build a Course
            </Link>

            <Link
              href="/admin/install"
              className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 font-bold text-white"
            >
              Install Admin App
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-10 md:grid-cols-2 xl:grid-cols-3">
        {workspaces.map((workspace) => (
          <Link
            key={workspace.href}
            href={workspace.href}
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
              {workspace.status}
            </p>

            <h2 className="mt-3 text-2xl font-black text-slate-950">
              {workspace.title}
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              {workspace.description}
            </p>

            <span className="mt-6 inline-block font-bold text-blue-700">
              Open workspace →
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
