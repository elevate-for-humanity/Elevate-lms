// This page previously showed hardcoded/fake stats.
// The REAL admin dashboard with live Supabase data is at /dashboard.
// Redirect to the canonical real dashboard.
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminDashboardRedirect() {
  redirect("/dashboard");
}

const workspaces = [
  {
    title: "Website Editor",
    description:
      "Update hero banners, page copy, calls to action, program information, and public website content.",
    href: "/admin/website-editor",
    status: "Content",
    icon: "palette",
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-50",
    stats: "47 pages",
  },
  {
    title: "Course Builder",
    description:
      "Create courses, modules, lessons, assignments, exams, and completion requirements.",
    href: "/admin/course-builder",
    status: "Learning",
    icon: "graduation-cap",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50",
    stats: "12 courses",
  },
  {
    title: "Dev Studio",
    description:
      "Review source files, prepare code changes, inspect builds, and manage deployment workflows.",
    href: "/admin/dev-studio",
    status: "Development",
    icon: "code",
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-50",
    stats: "Live",
  },
  {
    title: "Programs",
    description:
      "Manage tuition, duration, funding, schedules, credentials, enrollment status, and program pages.",
    href: "/admin/programs",
    status: "Programs",
    icon: "briefcase",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50",
    stats: "8 active",
  },
  {
    title: "Applications",
    description:
      "Review applicants, funding status, admissions steps, documents, and enrollment decisions.",
    href: "/admin/applications",
    status: "Admissions",
    icon: "users",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    stats: "24 pending",
  },
  {
    title: "Students",
    description:
      "Manage enrolled students, track progress, view grades, and handle credentials.",
    href: "/admin/students",
    status: "Students",
    icon: "user-check",
    color: "from-indigo-500 to-blue-500",
    bgColor: "bg-indigo-50",
    stats: "156 enrolled",
  },
  {
    title: "Testing Center",
    description:
      "Schedule exams, manage test rooms, process certifications, and track credentials.",
    href: "/admin/testing-center",
    status: "Certifications",
    icon: "award",
    color: "from-red-500 to-pink-500",
    bgColor: "bg-red-50",
    stats: "3 active",
  },
  {
    title: "Billing & Payments",
    description:
      "Track payments, manage invoices, handle refunds, and monitor revenue.",
    href: "/admin/billing",
    status: "Finance",
    icon: "credit-card",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    stats: "$45K/mo",
  },
  {
    title: "Install Admin",
    description:
      "Install this dashboard on your computer, Android device, iPhone, or iPad.",
    href: "/admin/install",
    status: "PWA",
    icon: "download",
    color: "from-slate-600 to-slate-800",
    bgColor: "bg-slate-100",
    stats: "Available",
  },
];

const icons: Record<string, string> = {
  palette: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>`,
  "graduation-cap": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  code: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  briefcase: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  users: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  "user-check": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`,
  award: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  "credit-card": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
  download: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
};

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 px-6 py-16 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">E</span>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-300">
                Elevate Operations
              </p>
              <p className="text-xs text-slate-400">Control Center</p>
            </div>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
            Admin Command Center
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Manage your website, courses, applications, programs, students, and
            deployment workflow from one dashboard.
          </p>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-3xl font-black text-white">156</p>
              <p className="text-xs text-slate-300">Active Students</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-3xl font-black text-white">8</p>
              <p className="text-xs text-slate-300">Programs</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-3xl font-black text-white">24</p>
              <p className="text-xs text-slate-300">Applications</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-3xl font-black text-white">$45K</p>
              <p className="text-xs text-slate-300">Monthly Revenue</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/admin/website-editor"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-105 transition-all"
            >
              Edit Website
            </Link>

            <Link
              href="/admin/course-builder"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-bold text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:scale-105 transition-all"
            >
              Build a Course
            </Link>

            <Link
              href="/admin/dev-studio"
              className="rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm px-6 py-3 font-bold text-white hover:bg-white/20 transition-all"
            >
              Open Dev Studio
            </Link>
          </div>
        </div>
      </section>

      {/* Workspace Cards */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-950">Workspaces</h2>
          <p className="text-slate-600 mt-1">Quick access to all admin tools</p>
        </div>
        
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.href}
              href={workspace.href}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10"
            >
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${workspace.color}`}></div>
              
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${workspace.color} flex items-center justify-center shadow-lg text-white`}
                       dangerouslySetInnerHTML={{ __html: icons[workspace.icon] || icons.code }}
                  />
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${workspace.bgColor} text-slate-700`}>
                    {workspace.status}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-black text-slate-950 group-hover:text-blue-600 transition-colors">
                  {workspace.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {workspace.description}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    {workspace.stats}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 group-hover:gap-2 transition-all">
                    Open
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-blue-900 p-8 text-white">
          <h2 className="text-2xl font-black">Quick Actions</h2>
          <p className="text-slate-300 mt-1">Common tasks at your fingertips</p>
          
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Link href="/admin/applications" className="flex items-center gap-3 rounded-xl bg-white/10 p-4 hover:bg-white/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <span className="font-semibold">Review Applications</span>
            </Link>
            <Link href="/admin/programs" className="flex items-center gap-3 rounded-xl bg-white/10 p-4 hover:bg-white/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </div>
              <span className="font-semibold">Edit Programs</span>
            </Link>
            <Link href="/admin/billing" className="flex items-center gap-3 rounded-xl bg-white/10 p-4 hover:bg-white/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <span className="font-semibold">View Payments</span>
            </Link>
            <Link href="/admin/students" className="flex items-center gap-3 rounded-xl bg-white/10 p-4 hover:bg-white/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <span className="font-semibold">Manage Students</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
