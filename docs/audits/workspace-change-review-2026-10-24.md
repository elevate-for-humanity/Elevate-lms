# Line-by-line repair review — 2026-10-24

Baseline: 8212d2b9. Every source/test/migration difference below is EXPECTED for the repairs in PR #2117 and PR #2120. Side-by-side diff -y was also inspected. No unrelated edits included.

## apps/admin/app/advanced-tools/page.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 29 |       { label: 'Import', href: '/import', desc: 'General import utility' }, | — |  | EXPECTED |
| 70 |       { label: 'Calendar Events', href: '/automation', desc: 'Manage calendar_events — orientations, sessions, deadlines' }, | 69 |       { label: 'Meetings &amp; Calendar', href: '/phone/meetings', desc: 'Manage scheduled meetings and linked Google Calendar sessions' }, | EXPECTED |
| 110 |       { label: 'Automation', href: '/automation', desc: 'Workflow automation rules' }, | — |  | EXPECTED |
| 114 |       { label: 'Sentry Test', href: '/api/sentry-test', desc: 'Dev only — trigger a test error to verify Sentry capture' }, | 112 |       { label: 'Monitoring', href: '/monitoring', desc: 'Review platform alerts, error tracking, and schema health' }, | EXPECTED |
| 174 |                   key={href} | 172 |                   key={&#96;${label}:${href}&#96;} | EXPECTED |

## apps/admin/app/api/admin/dev-studio/tasks/[id]/rollback/route.ts

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 1 | import { NextRequest } from 'next/server'; | 1 | import { NextRequest, NextResponse } from 'next/server'; | EXPECTED |
| 4 | import { requireAdminClient } from '@/lib/supabase/admin'; | — |  | EXPECTED |
| 5 | import { safeInternalError } from '@/lib/api/safe-error'; | — |  | EXPECTED |
| 6 | import { rollbackTask } from '@/lib/devstudio/os/task-runner'; | — |  | EXPECTED |
| 7 | import { jsonOk, tableNotReadyResponse } from '@/lib/devstudio/os/api-helpers'; | — |  | EXPECTED |
| 14 | export async function POST(request: NextRequest, context: RouteContext) { | 10 | export async function POST(request: NextRequest, _context: RouteContext) { | EXPECTED |
| 21 |   const { id } = await context.params; | 17 |   // The former implementation only relabeled the task; it never restored files. | EXPECTED |
| 22 |  | 18 |   // Do not acknowledge a rollback until a verified restore capability exists. | EXPECTED |
| 23 |   try { | 19 |   return NextResponse.json({ | EXPECTED |
| 24 |     const db = await requireAdminClient(); | 20 |     error: 'Automatic task rollback is unavailable. Restore a reviewed Git revision and redeploy. Task state has not been changed.', | EXPECTED |
| 25 |     await rollbackTask(db, id, auth.id); | 21 |     code: 'TASK_ROLLBACK_UNAVAILABLE', | EXPECTED |
| 26 |     const { data: task } = await db.from('ai_tasks').select('*').eq('id', id).single(); | 22 |   }, { status: 501 }); | EXPECTED |
| 27 |     return jsonOk({ task, rolledBack: true }); | — |  | EXPECTED |
| 28 |   } catch (err) { | — |  | EXPECTED |
| 29 |     const message = err instanceof Error ? err.message : ''; | — |  | EXPECTED |
| 30 |     if (message.includes('not found')) return tableNotReadyResponse(); | — |  | EXPECTED |
| 31 |     return safeInternalError(err, 'Failed to rollback task'); | — |  | EXPECTED |
| 32 |   } | — |  | EXPECTED |

## apps/admin/app/compliance/page.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 4 | import { loadWioaDashboard } from '@/lib/compliance/wioa-dashboard'; | EXPECTED |
| 37 |     { count: totalItems }, | 38 |     totalResult, | EXPECTED |
| 38 |     { count: compliantItems }, | 39 |     compliantResult, | EXPECTED |
| 39 |     { count: nonCompliantItems }, | 40 |     nonCompliantResult, | EXPECTED |
| 46 |   // WIOA data — tables may not exist yet; all queries are safe-fallback | 47 |   const totalItems = totalResult.error ? null : totalResult.count; | EXPECTED |
| 47 |   const [wioaParticipants, wioaReports, wioaAlerts] = await Promise.all([ | 48 |   const compliantItems = compliantResult.error ? null : compliantResult.count; | EXPECTED |
| 48 |     supabase | 49 |   const nonCompliantItems = nonCompliantResult.error ? null : nonCompliantResult.count; | EXPECTED |
| 49 |       .from('wioa_participants') | 50 |  | EXPECTED |
| 50 |       .select( | 51 |   // Preserve the session's row-level access and surface failures as unavailable. | EXPECTED |
| 51 |         'is_veteran, is_dislocated_worker, is_low_income, age_group, job_placements(id), enrollments(status)', | 52 |   let wioaData: WIOADashboardProps &#124; null = null; | EXPECTED |
| 52 |       ) | 53 |   try { | EXPECTED |
| 53 |       .limit(500) | 54 |     wioaData = await loadWioaDashboard(supabase); | EXPECTED |
| 54 |       .then((r) =&gt; r.data ?? []), | 55 |   } catch { | EXPECTED |
| 55 |     supabase | 56 |     // The WIOA section renders an explicit unavailable state below. | EXPECTED |
| 56 |       .from('wioa_compliance_reports') | 57 |   } | EXPECTED |
| 57 |       .select('report_type, due_date, status, auto_generated, submission_method') | — |  | EXPECTED |
| 58 |       .order('due_date', { ascending: true }) | — |  | EXPECTED |
| 59 |       .limit(20) | — |  | EXPECTED |
| 60 |       .then((r) =&gt; r.data ?? []), | — |  | EXPECTED |
| 61 |     supabase | — |  | EXPECTED |
| 62 |       .from('compliance_alerts') | — |  | EXPECTED |
| 63 |       .select('id, alert_type, severity, message, action_required, deadline') | — |  | EXPECTED |
| 64 |       .eq('resolved', false) | — |  | EXPECTED |
| 65 |       .order('severity', { ascending: false }) | — |  | EXPECTED |
| 66 |       .limit(20) | — |  | EXPECTED |
| 67 |       .then((r) =&gt; r.data ?? []), | — |  | EXPECTED |
| 68 |   ]); | — |  | EXPECTED |
| 69 |  | — |  | EXPECTED |
| 70 |   const wioaData: WIOADashboardProps = { | — |  | EXPECTED |
| 71 |     participants: { | — |  | EXPECTED |
| 72 |       total: wioaParticipants.length, | — |  | EXPECTED |
| 73 |       veterans: wioaParticipants.filter((p: any) =&gt; p.is_veteran).length, | — |  | EXPECTED |
| 74 |       dislocatedWorkers: wioaParticipants.filter((p: any) =&gt; p.is_dislocated_worker).length, | — |  | EXPECTED |
| 75 |       lowIncome: wioaParticipants.filter((p: any) =&gt; p.is_low_income).length, | — |  | EXPECTED |
| 76 |       youth: wioaParticipants.filter((p: any) =&gt; p.age_group === 'youth').length, | — |  | EXPECTED |
| 77 |       placements: wioaParticipants.filter((p: any) =&gt; (p.job_placements as any[])?.length &gt; 0) | — |  | EXPECTED |
| 78 |         .length, | — |  | EXPECTED |
| 79 |       completions: wioaParticipants.filter( | — |  | EXPECTED |
| 80 |         (p: any) =&gt; (p.enrollments as any)?.status === 'completed', | — |  | EXPECTED |
| 81 |       ).length, | — |  | EXPECTED |
| 82 |     }, | — |  | EXPECTED |
| 83 |     reports: (wioaReports as any[]).map((r) =&gt; ({ | — |  | EXPECTED |
| 84 |       reportType: r.report_type, | — |  | EXPECTED |
| 85 |       dueDate: r.due_date, | — |  | EXPECTED |
| 86 |       status: r.status, | — |  | EXPECTED |
| 87 |       autoGenerated: r.auto_generated ?? false, | — |  | EXPECTED |
| 88 |       submissionMethod: r.submission_method ?? 'electronic', | — |  | EXPECTED |
| 89 |     })), | — |  | EXPECTED |
| 90 |     alerts: (wioaAlerts as any[]).map((a) =&gt; ({ | — |  | EXPECTED |
| 91 |       id: a.id, | — |  | EXPECTED |
| 92 |       type: a.alert_type, | — |  | EXPECTED |
| 93 |       severity: a.severity, | — |  | EXPECTED |
| 94 |       message: a.message, | — |  | EXPECTED |
| 95 |       actionRequired: a.action_required, | — |  | EXPECTED |
| 96 |       deadline: a.deadline, | — |  | EXPECTED |
| 97 |     })), | — |  | EXPECTED |
| 98 |   }; | — |  | EXPECTED |
| 131 |                 &lt;p className="text-3xl font-bold text-brand-blue-600"&gt;{totalItems &#124;&#124; 0}&lt;/p&gt; | 90 |                 &lt;p className="text-3xl font-bold text-brand-blue-600"&gt;{totalItems ?? 'Unavailable'}&lt;/p&gt; | EXPECTED |
| 135 |                 &lt;p className="text-3xl font-bold text-brand-green-600"&gt;{compliantItems &#124;&#124; 0}&lt;/p&gt; | 94 |                 &lt;p className="text-3xl font-bold text-brand-green-600"&gt;{compliantItems ?? 'Unavailable'}&lt;/p&gt; | EXPECTED |
| 139 |                 &lt;p className="text-3xl font-bold text-brand-red-600"&gt;{nonCompliantItems &#124;&#124; 0}&lt;/p&gt; | 98 |                 &lt;p className="text-3xl font-bold text-brand-red-600"&gt;{nonCompliantItems ?? 'Unavailable'}&lt;/p&gt; | EXPECTED |
| 175 |                 href="/compliance" | 134 |                 href="/compliance-audit" | EXPECTED |
| 178 |                 Run Audit | 137 |                 View Audits | EXPECTED |
| 277 |           &lt;WIOAComplianceDashboard {...wioaData} /&gt; | 236 |           {wioaData ? &lt;WIOAComplianceDashboard {...wioaData} /&gt; : ( | EXPECTED |
| — |  | 237 |             &lt;p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900"&gt; | EXPECTED |
| — |  | 238 |               WIOA data could not be loaded. Refresh this page to try again; participant counts and reports are unavailable. | EXPECTED |
| — |  | 239 |             &lt;/p&gt; | EXPECTED |
| — |  | 240 |           )} | EXPECTED |

## apps/admin/app/docs/page.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 2 | import { Metadata } from 'next'; | 2 | import type { Metadata } from 'next'; | EXPECTED |
| 5 | import { createClient } from '@/lib/supabase/server'; | — |  | EXPECTED |
| — |  | 9 | export const metadata: Metadata = { | EXPECTED |
| — |  | 10 |   alternates: { canonical: 'https://admin.elevateforhumanity.org/docs' }, | EXPECTED |
| — |  | 11 |   title: 'Document Tools &#124; Elevate For Humanity', | EXPECTED |
| — |  | 12 |   description: 'Review participant documents and open program and compliance document tools.', | EXPECTED |
| — |  | 13 | }; | EXPECTED |
| 11 | export const metadata: Metadata = { | 15 | const destinations = [ | EXPECTED |
| 12 |   alternates: { | 16 |   { href: '/documents/review', title: 'Document Review', description: 'Review uploaded participant documents and their approval status.' }, | EXPECTED |
| 13 |     canonical: 'https://admin.elevateforhumanity.org/docs', | 17 |   { href: '/wioa/documents', title: 'WIOA Documents', description: 'Review eligibility documents for workforce funding.' }, | EXPECTED |
| 14 |   }, | 18 |   { href: '/program-holder-documents', title: 'Program Holder Documents', description: 'Review documents submitted by program holders.' }, | EXPECTED |
| 15 |   title: 'Documentation Management &#124; Elevate For Humanity', | 19 |   { href: '/compliance', title: 'Compliance', description: 'Open compliance requirements and reporting tools.' }, | EXPECTED |
| 16 |   description: 'Manage internal documentation, policies, and administrative documents.', | 20 | ]; | EXPECTED |
| 17 | }; | — |  | EXPECTED |
| 21 |   const supabase = await createClient(); | — |  | EXPECTED |
| 22 |  | — |  | EXPECTED |
| 23 |   // Fetch documentation data | — |  | EXPECTED |
| 24 |   const { data: items, count: totalItems } = await supabase | — |  | EXPECTED |
| 25 |     .from('profiles') | — |  | EXPECTED |
| 26 |     .select('*', { count: 'exact' }) | — |  | EXPECTED |
| 27 |     .order('created_at', { ascending: false }) | — |  | EXPECTED |
| 28 |     .limit(20); | — |  | EXPECTED |
| 29 |  | — |  | EXPECTED |
| 30 |   const { count: activeItems } = await supabase | — |  | EXPECTED |
| 31 |     .from('profiles') | — |  | EXPECTED |
| 32 |     .select('*', { count: 'exact', head: true }) | — |  | EXPECTED |
| 33 |     .eq('status', 'active'); | — |  | EXPECTED |
| 34 |  | — |  | EXPECTED |
| 37 |       {/* Hero Image */} | 26 |       &lt;div className="mx-auto max-w-7xl px-4 py-4"&gt; | EXPECTED |
| 38 |       &lt;div className="max-w-7xl mx-auto px-4 py-4"&gt; | 27 |         &lt;Breadcrumbs items={[{ label: 'Admin', href: '/dashboard' }, { label: 'Document Tools' }]} /&gt; | EXPECTED |
| 39 |         &lt;Breadcrumbs items={[{ label: 'Admin', href: '/' }, { label: 'Docs' }]} /&gt; | — |  | EXPECTED |
| 41 |       {/* Hero Section */} | 29 |       &lt;section className="relative h-48 overflow-hidden md:h-64"&gt; | EXPECTED |
| 42 |       &lt;section className="relative h-48 md:h-64 overflow-hidden"&gt; | 30 |         &lt;Image placeholder="blur" blurDataURL={IMAGE_LOADING_BLUR} src="/images/hero/hero-business.webp" alt="" fill className="object-cover" priority sizes="100vw" /&gt; | EXPECTED |
| 43 |         &lt;Image placeholder="blur" blurDataURL={IMAGE_LOADING_BLUR} | — |  | EXPECTED |
| 44 |           src="/images/hero/hero-business.webp" | — |  | EXPECTED |
| 45 |           alt="Documentation Management" | — |  | EXPECTED |
| 46 |           fill | — |  | EXPECTED |
| 47 |           className="object-cover" | — |  | EXPECTED |
| 48 |           quality={90} | — |  | EXPECTED |
| 49 |           priority | — |  | EXPECTED |
| 50 |           sizes="100vw" | — |  | EXPECTED |
| 51 |         /&gt; | — |  | EXPECTED |
| 53 |  | 32 |       &lt;main className="mx-auto max-w-7xl space-y-6 px-4 py-10"&gt; | EXPECTED |
| 54 |       {/* Content Section */} | 33 |         &lt;header&gt; | EXPECTED |
| 55 |       &lt;section className="py-16"&gt; | 34 |           &lt;h1 className="text-3xl font-bold text-slate-900"&gt;Document Tools&lt;/h1&gt; | EXPECTED |
| 56 |         &lt;div className="container mx-auto px-4"&gt; | 35 |           &lt;p className="mt-2 text-slate-600"&gt;Open the appropriate review workspace for each document type.&lt;/p&gt; | EXPECTED |
| 57 |           &lt;div className="max-w-7xl mx-auto"&gt; | 36 |         &lt;/header&gt; | EXPECTED |
| 58 |             {/* Stats */} | 37 |         &lt;div className="grid gap-4 sm:grid-cols-2"&gt; | EXPECTED |
| 59 |             &lt;div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"&gt; | 38 |           {destinations.map((item) =&gt; ( | EXPECTED |
| 60 |               &lt;div className="bg-white rounded-lg shadow-sm border p-6"&gt; | 39 |             &lt;Link key={item.href} href={item.href} className="rounded-xl border p-6 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2"&gt; | EXPECTED |
| 61 |                 &lt;h3 className="text-sm font-medium text-black mb-2"&gt;Total Documents&lt;/h3&gt; | 40 |               &lt;h2 className="text-xl font-semibold text-slate-900"&gt;{item.title}&lt;/h2&gt; | EXPECTED |
| 62 |                 &lt;p className="text-3xl font-bold text-brand-blue-600"&gt;{totalItems &#124;&#124; 0}&lt;/p&gt; | 41 |               &lt;p className="mt-2 text-slate-600"&gt;{item.description}&lt;/p&gt; | EXPECTED |
| 63 |               &lt;/div&gt; | 42 |             &lt;/Link&gt; | EXPECTED |
| 64 |               &lt;div className="bg-white rounded-lg shadow-sm border p-6"&gt; | 43 |           ))} | EXPECTED |
| 65 |                 &lt;h3 className="text-sm font-medium text-black mb-2"&gt;Active&lt;/h3&gt; | — |  | EXPECTED |
| 66 |                 &lt;p className="text-3xl font-bold text-brand-green-600"&gt;{activeItems &#124;&#124; 0}&lt;/p&gt; | — |  | EXPECTED |
| 67 |               &lt;/div&gt; | — |  | EXPECTED |
| 68 |               &lt;div className="bg-white rounded-lg shadow-sm border p-6"&gt; | — |  | EXPECTED |
| 69 |                 &lt;h3 className="text-sm font-medium text-black mb-2"&gt;Recent&lt;/h3&gt; | — |  | EXPECTED |
| 70 |                 &lt;p className="text-3xl font-bold text-brand-blue-600"&gt; | — |  | EXPECTED |
| 71 |                   {items?.filter((i) =&gt; { | — |  | EXPECTED |
| 72 |                     const created = new Date(i.created_at); | — |  | EXPECTED |
| 73 |                     const weekAgo = new Date(); | — |  | EXPECTED |
| 74 |                     weekAgo.setDate(weekAgo.getDate() - 7); | — |  | EXPECTED |
| 75 |                     return created &gt; weekAgo; | — |  | EXPECTED |
| 76 |                   }).length &#124;&#124; 0} | — |  | EXPECTED |
| 77 |                 &lt;/p&gt; | — |  | EXPECTED |
| 78 |               &lt;/div&gt; | — |  | EXPECTED |
| 79 |             &lt;/div&gt; | — |  | EXPECTED |
| 80 |  | — |  | EXPECTED |
| 81 |             {/* Data Display */} | — |  | EXPECTED |
| 82 |             &lt;div className="bg-white rounded-lg shadow-sm border p-6"&gt; | — |  | EXPECTED |
| 83 |               &lt;h2 className="text-2xl font-bold mb-4"&gt;Documents&lt;/h2&gt; | — |  | EXPECTED |
| 84 |               {items &amp;&amp; items.length &gt; 0 ? ( | — |  | EXPECTED |
| 85 |                 &lt;div className="space-y-4"&gt; | — |  | EXPECTED |
| 86 |                   {items.map((item: any) =&gt; ( | — |  | EXPECTED |
| 87 |                     &lt;div key={item.id} className="p-4 border rounded-lg hover:bg-slate-50"&gt; | — |  | EXPECTED |
| 88 |                       &lt;p className="font-semibold"&gt;{item.title &#124;&#124; item.name &#124;&#124; item.id}&lt;/p&gt; | — |  | EXPECTED |
| 89 |                       &lt;p className="text-sm text-black"&gt; | — |  | EXPECTED |
| 90 |                         {new Date(item.created_at).toLocaleDateString()} | — |  | EXPECTED |
| 91 |                       &lt;/p&gt; | — |  | EXPECTED |
| 92 |                     &lt;/div&gt; | — |  | EXPECTED |
| 93 |                   ))} | — |  | EXPECTED |
| 94 |                 &lt;/div&gt; | — |  | EXPECTED |
| 95 |               ) : ( | — |  | EXPECTED |
| 96 |                 &lt;p className="text-black text-center py-8"&gt;No documents found&lt;/p&gt; | — |  | EXPECTED |
| 97 |               )} | — |  | EXPECTED |
| 98 |             &lt;/div&gt; | — |  | EXPECTED |
| 99 |           &lt;/div&gt; | — |  | EXPECTED |
| 101 |       &lt;/section&gt; | 45 |         &lt;Link href="/dashboard" className="inline-block py-3 text-sm underline"&gt;Back to Admin dashboard&lt;/Link&gt; | EXPECTED |
| 102 |  | 46 |       &lt;/main&gt; | EXPECTED |
| 103 |       {/* CTA Section */} | — |  | EXPECTED |
| 104 |       &lt;section className="py-16 bg-brand-blue-700"&gt; | — |  | EXPECTED |
| 105 |         &lt;div className="container mx-auto px-4"&gt; | — |  | EXPECTED |
| 106 |           &lt;div className="max-w-4xl mx-auto text-center"&gt; | — |  | EXPECTED |
| 107 |             &lt;h2 className="text-2xl md:text-3xl font-bold mb-4"&gt;Documentation Hub&lt;/h2&gt; | — |  | EXPECTED |
| 108 |             &lt;p className="text-base md:text-lg text-brand-blue-100 mb-8"&gt; | — |  | EXPECTED |
| 109 |               Access platform guides, API docs, and training materials. | — |  | EXPECTED |
| 110 |             &lt;/p&gt; | — |  | EXPECTED |
| 111 |             &lt;div className="flex flex-wrap gap-4 justify-center"&gt; | — |  | EXPECTED |
| 112 |               &lt;Link | — |  | EXPECTED |
| 113 |                 href="/docs" | — |  | EXPECTED |
| 114 |                 className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-slate-50 text-lg" | — |  | EXPECTED |
| 115 |               &gt; | — |  | EXPECTED |
| 116 |                 View Docs | — |  | EXPECTED |
| 117 |               &lt;/Link&gt; | — |  | EXPECTED |
| 118 |               &lt;Link | — |  | EXPECTED |
| 119 |                 href="/internal-docs" | — |  | EXPECTED |
| 120 |                 className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg" | — |  | EXPECTED |
| 121 |               &gt; | — |  | EXPECTED |
| 122 |                 Internal Docs | — |  | EXPECTED |
| 123 |               &lt;/Link&gt; | — |  | EXPECTED |
| 124 |             &lt;/div&gt; | — |  | EXPECTED |
| 125 |           &lt;/div&gt; | — |  | EXPECTED |
| 126 |         &lt;/div&gt; | — |  | EXPECTED |
| 127 |       &lt;/section&gt; | — |  | EXPECTED |

## apps/admin/app/hours-export/page.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 1 | import { redirect } from 'next/navigation'; | 1 | import type { Metadata } from 'next'; | EXPECTED |
| 2 | import { Metadata } from 'next'; | 2 | import Link from 'next/link'; | EXPECTED |
| — |  | 3 | import { requireRole } from '@/lib/auth/require-role'; | EXPECTED |
| — |  | 5 | export const dynamic = 'force-dynamic'; | EXPECTED |
| 9 | export default function AdminHoursExportPage() { | 11 | export default async function AdminHoursExportPage() { | EXPECTED |
| 10 |   redirect('/'); | 12 |   await requireRole(['admin', 'super_admin', 'staff']); | EXPECTED |
| — |  | 13 |   const today = new Date().toISOString().slice(0, 10); | EXPECTED |
| — |  | 14 |   return ( | EXPECTED |
| — |  | 15 |     &lt;div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8"&gt; | EXPECTED |
| — |  | 16 |       &lt;nav aria-label="Hours export navigation" className="flex flex-wrap gap-4 text-sm underline"&gt; | EXPECTED |
| — |  | 17 |         &lt;Link href="/student-hours"&gt;Back to Student Hours&lt;/Link&gt; | EXPECTED |
| — |  | 18 |         &lt;Link href="/dashboard"&gt;Admin dashboard&lt;/Link&gt; | EXPECTED |
| — |  | 19 |       &lt;/nav&gt; | EXPECTED |
| — |  | 20 |       &lt;header&gt; | EXPECTED |
| — |  | 21 |         &lt;h1 className="text-3xl font-bold text-slate-900"&gt;Hours Export&lt;/h1&gt; | EXPECTED |
| — |  | 22 |         &lt;p className="mt-2 text-slate-600"&gt; | EXPECTED |
| — |  | 23 |           Download the on-the-job training entries shown in Student Hours, including their | EXPECTED |
| — |  | 24 |           current review status. Only verified entries count as approved OJT hours. | EXPECTED |
| — |  | 25 |         &lt;/p&gt; | EXPECTED |
| — |  | 26 |       &lt;/header&gt; | EXPECTED |
| — |  | 27 |       &lt;form action="/api/admin/apprenticeships/hours/export" method="get" className="space-y-5 rounded-xl border bg-white p-6"&gt; | EXPECTED |
| — |  | 28 |         &lt;div className="grid gap-5 sm:grid-cols-2"&gt; | EXPECTED |
| — |  | 29 |           &lt;label className="flex flex-col gap-2 font-medium"&gt; | EXPECTED |
| — |  | 30 |             Start date | EXPECTED |
| — |  | 31 |             &lt;input type="date" name="start_date" required defaultValue={&#96;${today.slice(0, 7)}-01&#96;} className="min-h-11 rounded-lg border p-3" /&gt; | EXPECTED |
| — |  | 32 |           &lt;/label&gt; | EXPECTED |
| — |  | 33 |           &lt;label className="flex flex-col gap-2 font-medium"&gt; | EXPECTED |
| — |  | 34 |             End date | EXPECTED |
| — |  | 35 |             &lt;input type="date" name="end_date" required defaultValue={today} className="min-h-11 rounded-lg border p-3" /&gt; | EXPECTED |
| — |  | 36 |           &lt;/label&gt; | EXPECTED |
| — |  | 37 |         &lt;/div&gt; | EXPECTED |
| — |  | 38 |         &lt;label className="flex flex-col gap-2 font-medium"&gt; | EXPECTED |
| — |  | 39 |           Review status | EXPECTED |
| — |  | 40 |           &lt;select name="status" defaultValue="all" className="min-h-11 rounded-lg border p-3"&gt; | EXPECTED |
| — |  | 41 |             &lt;option value="all"&gt;All entries&lt;/option&gt; | EXPECTED |
| — |  | 42 |             &lt;option value="verified"&gt;Verified entries only&lt;/option&gt; | EXPECTED |
| — |  | 43 |             &lt;option value="submitted"&gt;Submitted for review&lt;/option&gt; | EXPECTED |
| — |  | 44 |           &lt;/select&gt; | EXPECTED |
| — |  | 45 |         &lt;/label&gt; | EXPECTED |
| — |  | 46 |         &lt;p className="text-sm text-slate-600"&gt; | EXPECTED |
| — |  | 47 |           Dates include both the start and end day. The CSV contains student names and email | EXPECTED |
| — |  | 48 |           addresses; share it only with authorized recipients. | EXPECTED |
| — |  | 49 |         &lt;/p&gt; | EXPECTED |
| — |  | 50 |         &lt;button type="submit" className="min-h-11 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white"&gt; | EXPECTED |
| — |  | 51 |           Download OJT hours CSV | EXPECTED |
| — |  | 52 |         &lt;/button&gt; | EXPECTED |
| — |  | 53 |       &lt;/form&gt; | EXPECTED |
| — |  | 54 |     &lt;/div&gt; | EXPECTED |
| — |  | 55 |   ); | EXPECTED |

## apps/admin/app/operations/page.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 48 |     db.from('workflows').select('id', { count: 'exact', head: true }).eq('is_active', true), | 48 |     db.from('workflows').select('id', { count: 'exact', head: true }).eq('status', 'active'), | EXPECTED |
| 52 |     db.from('workflow_dead_letters').select('id,workflow_id,action_type,last_error,attempts,created_at').order('created_at', { ascending: false }).limit(10), | 52 |     db.from('workflow_dead_letters').select('id,workflow_id,action_type,error,attempts,created_at').order('created_at', { ascending: false }).limit(10), | EXPECTED |
| 109 |           &lt;section className="rounded-xl border border-slate-200 bg-white shadow-sm"&gt;&lt;div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"&gt;&lt;Inbox className="h-4 w-4" /&gt;&lt;h2 className="font-black text-slate-950"&gt;Dead letters&lt;/h2&gt;&lt;/div&gt;{deadRows.length ? &lt;ul className="divide-y divide-slate-100"&gt;{deadRows.map((row) =&gt; &lt;li key={row.id} className="p-4 text-sm"&gt;&lt;p className="font-bold text-slate-900"&gt;{row.action_type &#124;&#124; 'Workflow action'}&lt;/p&gt;&lt;p className="mt-1 text-xs text-rose-600"&gt;{row.last_error &#124;&#124; 'No error detail'}&lt;/p&gt;&lt;p className="mt-1 text-xs text-slate-500"&gt;{row.attempts &#124;&#124; 0} attempts&lt;/p&gt;&lt;/li&gt;)}&lt;/ul&gt; : &lt;p className="p-6 text-sm text-slate-600"&gt;No dead letters.&lt;/p&gt;}&lt;/section&gt; | 109 |           &lt;section className="rounded-xl border border-slate-200 bg-white shadow-sm"&gt;&lt;div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"&gt;&lt;Inbox className="h-4 w-4" /&gt;&lt;h2 className="font-black text-slate-950"&gt;Dead letters&lt;/h2&gt;&lt;/div&gt;{deadRows.length ? &lt;ul className="divide-y divide-slate-100"&gt;{deadRows.map((row) =&gt; &lt;li key={row.id} className="p-4 text-sm"&gt;&lt;p className="font-bold text-slate-900"&gt;{row.action_type &#124;&#124; 'Workflow action'}&lt;/p&gt;&lt;p className="mt-1 text-xs text-rose-600"&gt;{row.error &#124;&#124; 'No error detail'}&lt;/p&gt;&lt;p className="mt-1 text-xs text-slate-500"&gt;{row.attempts &#124;&#124; 0} attempts&lt;/p&gt;&lt;/li&gt;)}&lt;/ul&gt; : &lt;p className="p-6 text-sm text-slate-600"&gt;No dead letters.&lt;/p&gt;}&lt;/section&gt; | EXPECTED |

## components/admin/WIOAComplianceDashboard.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 12 |   placements: number; | 12 |   placements: number &#124; null; | EXPECTED |
| 13 |   completions: number; | 13 |   completions: number &#124; null; | EXPECTED |
| 18 |   dueDate: string; | 18 |   dueDate: string &#124; null; | EXPECTED |
| 19 |   status: 'completed' &#124; 'in_progress' &#124; 'overdue' &#124; 'upcoming'; | 19 |   status: string; | EXPECTED |
| 20 |   autoGenerated: boolean; | 20 |   autoGenerated?: boolean; | EXPECTED |
| 21 |   submissionMethod: string; | 21 |   submissionMethod?: string; | EXPECTED |
| 29 |   actionRequired: string; | 29 |   actionRequired?: string; | EXPECTED |
| 30 |   deadline: string; | 30 |   deadline?: string; | EXPECTED |
| 71 |   const placementRate = pct(participants.placements, participants.total); | 71 |   const placementRate = participants.placements === null ? null : pct(participants.placements, participants.total); | EXPECTED |
| 72 |   const credentialRate = pct(participants.completions, participants.total); | 72 |   const credentialRate = participants.completions === null ? null : pct(participants.completions, participants.total); | EXPECTED |
| 119 |             value: &#96;${placementRate}%&#96;, | 119 |             value: placementRate === null ? 'Unavailable' : &#96;${placementRate}%&#96;, | EXPECTED |
| 120 |             target: '70%', | 120 |             target: placementRate === null ? undefined : '70%', | EXPECTED |
| 121 |             ok: placementRate &gt;= 70, | 121 |             ok: placementRate === null ? undefined : placementRate &gt;= 70, | EXPECTED |
| 125 |             value: &#96;${credentialRate}%&#96;, | 125 |             value: credentialRate === null ? 'Unavailable' : &#96;${credentialRate}%&#96;, | EXPECTED |
| 126 |             target: '60%', | 126 |             target: credentialRate === null ? undefined : '60%', | EXPECTED |
| 127 |             ok: credentialRate &gt;= 60, | 127 |             ok: credentialRate === null ? undefined : credentialRate &gt;= 60, | EXPECTED |
| — |  | 144 |  | EXPECTED |
| — |  | 145 |       {(placementRate === null &#124;&#124; credentialRate === null) &amp;&amp; ( | EXPECTED |
| — |  | 146 |         &lt;p className="text-sm text-slate-600"&gt;Placement and credential rates are unavailable until outcome records are reconciled.&lt;/p&gt; | EXPECTED |
| — |  | 147 |       )} | EXPECTED |
| 191 |                     Due {fmtDate(r.dueDate)} · {r.submissionMethod} | 195 |                     {r.dueDate ? &#96;Due ${fmtDate(r.dueDate)}&#96; : 'Due date not recorded'}{r.submissionMethod ? &#96; · ${r.submissionMethod}&#96; : ''} | EXPECTED |
| 218 |             href="/compliance" | 222 |             href="/compliance-audit" | EXPECTED |
| 221 |             Run compliance audit → | 225 |             View compliance audits → | EXPECTED |

## components/admin/course-builder/ProductionPanelLayout.module.css

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 2 | .mobileTabs { display: none; } | 2 | .mobileTabs { display: flex; flex-wrap: wrap; gap: .5rem; padding: .5rem; } | EXPECTED |
| 3 | .desktop { display: contents; } | 3 | .mobileTabs[hidden] { display: none; } | EXPECTED |
| 4 | .mobile { display: none; } | 4 | /* Follow the actual pane width, including when nested in the desktop Studio. */ | EXPECTED |
| 5 | @media (max-width: 767px) { | 5 | .root[data-compact=true] .operations, | EXPECTED |
| 6 |   .mobileTabs { display: flex; flex-wrap: wrap; gap: .5rem; padding: .5rem; } | 6 | .root[data-compact=true] .outline { height: auto !important; min-height: 0 !important; } | EXPECTED |
| 7 |   .desktop { display: none; } | — |  | EXPECTED |
| 8 |   .mobile { display: block; min-width: 0; } | — |  | EXPECTED |
| 9 | } | — |  | EXPECTED |
| 10 | @media (max-width: 767px) { | — |  | EXPECTED |
| 11 |   .operations, .outline { height: auto !important; min-height: 0 !important; } | — |  | EXPECTED |
| 12 |   .operations &gt; div:first-child, .outline &gt; div:first-child { display: none; } | — |  | EXPECTED |
| 13 |   .operations &gt; div:nth-child(2), .outline &gt; div:nth-child(2) { display: block; overflow: visible; } | — |  | EXPECTED |
| 14 |   .operations &gt; div:nth-child(2) &gt; [role=separator], .outline &gt; div:nth-child(2) &gt; [role=separator] { display: none; } | — |  | EXPECTED |
| 15 |   .root[data-mobile-pane=preview] .operations &gt; div:nth-child(2) &gt; section, | — |  | EXPECTED |
| 16 |   .root[data-mobile-pane=preview] .outline &gt; div:nth-child(2) &gt; section, | — |  | EXPECTED |
| 17 |   .root[data-mobile-pane=outline] .operations &gt; div:nth-child(2) &gt; section, | — |  | EXPECTED |
| 18 |   .root[data-mobile-pane=outline] .outline &gt; div:nth-child(2) &gt; div:first-child, | — |  | EXPECTED |
| 19 |   .root[data-mobile-pane=operations] .operations &gt; div:nth-child(2) &gt; div:first-child { display: none; } | — |  | EXPECTED |
| 20 |   .root[data-mobile-pane=outline] .outline &gt; div:nth-child(2) &gt; section, | — |  | EXPECTED |
| 21 |   .root[data-mobile-pane=operations] .operations &gt; div:nth-child(2) &gt; section { display: block; } | — |  | EXPECTED |
| 22 | } | — |  | EXPECTED |

## components/admin/course-builder/ProductionPanelLayout.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 17 |   const root = useRef&lt;HTMLDivElement&gt;(null); | EXPECTED |
| — |  | 18 |   const [compact, setCompact] = useState(false); | EXPECTED |
| — |  | 25 |   useEffect(() =&gt; { | EXPECTED |
| — |  | 26 |     const element = root.current; | EXPECTED |
| — |  | 27 |     if (!element) return; | EXPECTED |
| — |  | 28 |     const measure = () =&gt; setCompact(element.getBoundingClientRect().width &lt;= 760); | EXPECTED |
| — |  | 29 |     measure(); | EXPECTED |
| — |  | 30 |     if (typeof ResizeObserver === "undefined") { | EXPECTED |
| — |  | 31 |       window.addEventListener("resize", measure); | EXPECTED |
| — |  | 32 |       return () =&gt; window.removeEventListener("resize", measure); | EXPECTED |
| — |  | 33 |     } | EXPECTED |
| — |  | 34 |     const observer = new ResizeObserver(measure); | EXPECTED |
| — |  | 35 |     observer.observe(element); | EXPECTED |
| — |  | 36 |     return () =&gt; observer.disconnect(); | EXPECTED |
| — |  | 37 |   }, []); | EXPECTED |
| 37 |     &lt;div className={styles.root} data-mobile-pane={mobilePane}&gt; | 52 |     &lt;div ref={root} className={styles.root} data-compact={compact}&gt; | EXPECTED |
| — |  | 56 |         hidden={!compact} | EXPECTED |
| 42 |         {(["outline", "preview", "operations"] as const).map((pane) =&gt; ( | 58 |         {(["outline", "preview", "operations"] as const).filter((pane) =&gt; pane !== "operations" &#124;&#124; operations != null).map((pane) =&gt; ( | EXPECTED |
| 47 |             onClick={() =&gt; { | 63 |             onClick={() =&gt; setMobilePane(pane)} | EXPECTED |
| 48 |               setMobilePane(pane); | — |  | EXPECTED |
| 49 |               setOutlineOpen(pane === "outline"); | — |  | EXPECTED |
| 50 |               setOperationsOpen(pane === "operations"); | — |  | EXPECTED |
| 51 |             }} | — |  | EXPECTED |
| — |  | 81 |         activePane={compact ? mobilePane === "operations" ? "panel" : "primary" : undefined} | EXPECTED |
| — |  | 91 |           activePane={compact ? mobilePane === "outline" ? "panel" : "primary" : undefined} | EXPECTED |

## components/admin/dashboard/JobBoardPanel.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 8 |   total: number; | 8 |   count: number; | EXPECTED |
| 9 |   lastImport: string &#124; null; | 9 |   sources: Record&lt;string, { records: number; latestImport: string &#124; null }&gt;; | EXPECTED |
| 12 |     careeronestop: boolean; | 12 |     careerOneStop: boolean; | EXPECTED |
| 21 |   const [importResult, setImportResult] = useState&lt;{ imported: number; skipped: number } &#124; null&gt;(null); | 21 |   const [importResult, setImportResult] = useState&lt;number &#124; null&gt;(null); | EXPECTED |
| — |  | 22 |   const [importError, setImportError] = useState(''); | EXPECTED |
| — |  | 23 |   const [sourceErrors, setSourceErrors] = useState&lt;string[]&gt;([]); | EXPECTED |
| — |  | 24 |  | EXPECTED |
| — |  | 25 |   async function loadStats() { | EXPECTED |
| — |  | 26 |     const response = await fetch('/api/jobs/government-feed', { cache: 'no-store' }); | EXPECTED |
| — |  | 27 |     const json = await response.json().catch(() =&gt; ({})); | EXPECTED |
| — |  | 28 |     if (!response.ok) throw new Error(json.error ?? &#96;Job feed status failed (HTTP ${response.status})&#96;); | EXPECTED |
| — |  | 29 |     if (!Number.isInteger(json.count) &#124;&#124; !json.configured &#124;&#124; !json.sources) { | EXPECTED |
| — |  | 30 |       throw new Error('Job feed returned an invalid status response.'); | EXPECTED |
| — |  | 31 |     } | EXPECTED |
| — |  | 32 |     setStats(json); | EXPECTED |
| — |  | 33 |     setError(''); | EXPECTED |
| — |  | 34 |   } | EXPECTED |
| 24 |     fetch('/api/jobs/government-feed') | 37 |     void loadStats() | EXPECTED |
| 25 |       .then(async (r) =&gt; { | — |  | EXPECTED |
| 26 |         const json = await r.json().catch(() =&gt; ({})); | — |  | EXPECTED |
| 27 |         if (!r.ok) throw new Error(json.error ?? &#96;HTTP ${r.status}&#96;); | — |  | EXPECTED |
| 28 |         return json; | — |  | EXPECTED |
| 29 |       }) | — |  | EXPECTED |
| 30 |       .then((json) =&gt; { setStats(json); setError(''); }) | — |  | EXPECTED |
| — |  | 43 |     if (importing) return; | EXPECTED |
| — |  | 46 |     setImportError(''); | EXPECTED |
| — |  | 47 |     setSourceErrors([]); | EXPECTED |
| 40 |       const data = await res.json(); | 50 |       const data = await res.json().catch(() =&gt; ({})); | EXPECTED |
| 41 |       setImportResult({ imported: data.imported ?? 0, skipped: data.skipped ?? 0 }); | 51 |       if (!res.ok) throw new Error(data.error ?? &#96;Job import failed (HTTP ${res.status})&#96;); | EXPECTED |
| 42 |       // Refresh stats | 52 |       if (data.ok !== true &#124;&#124; !Number.isInteger(data.imported?.total) &#124;&#124; data.imported.total &lt; 0) { | EXPECTED |
| 43 |       const updated = await fetch('/api/jobs/government-feed').then((r) =&gt; r.json()); | 53 |         throw new Error('The server did not confirm the import result. Check job feed status before retrying.'); | EXPECTED |
| 44 |       setStats(updated); | 54 |       } | EXPECTED |
| 45 |     } catch { | 55 |       setImportResult(data.imported.total); | EXPECTED |
| 46 |       setImportResult({ imported: 0, skipped: -1 }); | 56 |       setSourceErrors([ | EXPECTED |
| — |  | 57 |         ['usaJobs', 'USAJobs'], ['careerOneStop', 'CareerOneStop'], ['onet', 'O*NET'], | EXPECTED |
| — |  | 58 |       ].flatMap(([key, label]) =&gt; typeof data.errors?.[key] === 'string' &amp;&amp; data.errors[key] ? [&#96;${label}: ${data.errors[key]}&#96;] : [])); | EXPECTED |
| — |  | 59 |       try { | EXPECTED |
| — |  | 60 |         await loadStats(); | EXPECTED |
| — |  | 61 |       } catch (reason) { | EXPECTED |
| — |  | 62 |         setError(&#96;Import completed, but status could not refresh: ${reason instanceof Error ? reason.message : 'Unknown status error'}&#96;); | EXPECTED |
| — |  | 63 |       } | EXPECTED |
| — |  | 64 |     } catch (reason) { | EXPECTED |
| — |  | 65 |       setImportError(reason instanceof Error ? reason.message : 'Job import could not complete.'); | EXPECTED |
| 54 |     { key: 'careeronestop' as const, label: 'CareerOneStop', href: 'https://www.careeronestop.org/Developers/WebAPI/', note: 'DOL-funded job listings' }, | 73 |     { key: 'careerOneStop' as const, label: 'CareerOneStop', href: 'https://www.careeronestop.org/Developers/WebAPI/', note: 'DOL-funded job listings' }, | EXPECTED |
| — |  | 75 |   const lastImport = Object.values(stats?.sources ?? {}) | EXPECTED |
| — |  | 76 |     .map(source =&gt; source.latestImport) | EXPECTED |
| — |  | 77 |     .filter((date): date is string =&gt; typeof date === 'string' &amp;&amp; Number.isFinite(Date.parse(date))) | EXPECTED |
| — |  | 78 |     .sort((a, b) =&gt; Date.parse(b) - Date.parse(a))[0]; | EXPECTED |
| 79 |             {loading ? '—' : (stats?.total ?? 0)} | 102 |             {stats?.count ?? '—'} | EXPECTED |
| 82 |             &lt;Zap className="w-3 h-3 text-amber-500" /&gt; Gov feed jobs | 105 |             &lt;Zap className="w-3 h-3 text-amber-500" /&gt; Recent feed jobs | EXPECTED |
| 88 |             {loading | 111 |             {loading &#124;&#124; !stats | EXPECTED |
| 90 |               : stats?.lastImport | 113 |               : lastImport | EXPECTED |
| 91 |               ? new Date(stats.lastImport).toLocaleDateString('en-US', { | 114 |               ? new Date(lastImport).toLocaleDateString('en-US', { | EXPECTED |
| 103 |         &lt;div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"&gt; | 126 |         &lt;div role="alert" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"&gt; | EXPECTED |
| 139 |       {importResult &amp;&amp; ( | 162 |       {importResult !== null &amp;&amp; ( | EXPECTED |
| 140 |         &lt;div className={&#96;text-xs rounded-lg px-3 py-2 mb-3 ${importResult.skipped === -1 ? 'bg-red-50 text-red-700' : 'bg-brand-green-50 text-brand-green-700'}&#96;}&gt; | 163 |         &lt;div role="status" className="text-xs rounded-lg px-3 py-2 mb-3 bg-brand-green-50 text-brand-green-700"&gt; | EXPECTED |
| 141 |           {importResult.skipped === -1 | 164 |           Imported {importResult} jobs. | EXPECTED |
| 142 |             ? 'Import failed — check server logs.' | 165 |         &lt;/div&gt; | EXPECTED |
| 143 |             : &#96;Imported ${importResult.imported} jobs, ${importResult.skipped} skipped.&#96;} | 166 |       )} | EXPECTED |
| — |  | 167 |       {(importError &#124;&#124; sourceErrors.length &gt; 0) &amp;&amp; ( | EXPECTED |
| — |  | 168 |         &lt;div role="alert" className="text-xs rounded-lg px-3 py-2 mb-3 bg-red-50 text-red-700"&gt; | EXPECTED |
| — |  | 169 |           {importError &#124;&#124; &#96;Some sources could not complete: ${sourceErrors.join('; ')}&#96;} | EXPECTED |
| — |  | 176 |           type="button" | EXPECTED |

## components/admin/dashboard/LizzyErrorsPanel.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 77 |                 &lt;Link href="/api/sentry-test" target="_blank" className="text-[#4fc1ff] hover:underline"&gt; | 77 |                 &lt;Link href="/monitoring" className="text-[#4fc1ff] hover:underline"&gt; | EXPECTED |
| 78 |                   Trigger test event (dev) | 78 |                   Open monitoring | EXPECTED |

## components/studio/ResizableWorkspace.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 27 |   /** A parent-owned compact view; keeps both panes mounted without a second toolbar. */ | EXPECTED |
| — |  | 28 |   activePane?: "primary" &#124; "panel"; | EXPECTED |
| — |  | 46 |   activePane, | EXPECTED |
| 91 |   const mobileFull = open &amp;&amp; stacked &amp;&amp; mobileExclusive; | 94 |   const controlledPane = activePane !== undefined; | EXPECTED |
| 92 |   const full = open &amp;&amp; (expanded &#124;&#124; mobileFull); | 95 |   const mobileFull = !controlledPane &amp;&amp; open &amp;&amp; stacked &amp;&amp; mobileExclusive; | EXPECTED |
| 93 |   const tabbed = open &amp;&amp; stacked &amp;&amp; stackedTabs &amp;&amp; !full; | 96 |   const full = !controlledPane &amp;&amp; open &amp;&amp; (expanded &#124;&#124; mobileFull); | EXPECTED |
| — |  | 97 |   const tabbed = !controlledPane &amp;&amp; open &amp;&amp; stacked &amp;&amp; stackedTabs &amp;&amp; !full; | EXPECTED |
| 96 |     if (!open &#124;&#124; !expanded &#124;&#124; mobileFull &#124;&#124; !element &#124;&#124; typeof element.showPopover !== "function") return; | 100 |     if (controlledPane &#124;&#124; !open &#124;&#124; !expanded &#124;&#124; mobileFull &#124;&#124; !element &#124;&#124; typeof element.showPopover !== "function") return; | EXPECTED |
| 110 |   }, [open, expanded, mobileFull]); | 114 |   }, [open, expanded, mobileFull, controlledPane]); | EXPECTED |
| 116 |       popover={open &amp;&amp; expanded &amp;&amp; !mobileFull ? "manual" : undefined} | 120 |       popover={!controlledPane &amp;&amp; open &amp;&amp; expanded &amp;&amp; !mobileFull ? "manual" : undefined} | EXPECTED |
| 117 |       className={&#96;${styles.root} ${mobileFull ? styles.mobileExclusive : ""} ${open &amp;&amp; expanded ? styles.fullScreen : ""} ${className}&#96;} | 121 |       className={&#96;${styles.root} ${mobileFull ? styles.mobileExclusive : ""} ${!controlledPane &amp;&amp; open &amp;&amp; expanded ? styles.fullScreen : ""} ${className}&#96;} | EXPECTED |
| 119 |       &lt;div className={styles.toolbar} hidden={!open &amp;&amp; hideClosedToolbar}&gt; | 123 |       &lt;div className={styles.toolbar} hidden={controlledPane &#124;&#124; (!open &amp;&amp; hideClosedToolbar)}&gt; | EXPECTED |
| 173 |         className={&#96;${styles.body} ${panelPosition === "start" ? styles.panelStart : ""} ${open ? styles.open : ""} ${full ? styles.expanded : ""} ${tabbed ? styles.tabbed : ""}&#96;} | 177 |         className={&#96;${styles.body} ${panelPosition === "start" ? styles.panelStart : ""} ${open ? styles.open : ""} ${full ? styles.expanded : ""} ${tabbed &#124;&#124; controlledPane ? styles.tabbed : ""}&#96;} | EXPECTED |
| 181 |         &lt;div id={&#96;${panelId}-primary&#96;} className={styles.primary} hidden={full &#124;&#124; (tabbed &amp;&amp; stackedPane === "panel")}&gt; | 185 |         &lt;div id={&#96;${panelId}-primary&#96;} className={styles.primary} hidden={controlledPane ? activePane === "panel" : full &#124;&#124; (tabbed &amp;&amp; stackedPane === "panel")}&gt; | EXPECTED |
| 184 |         {open &amp;&amp; !full &amp;&amp; !tabbed &amp;&amp; ( | 188 |         {open &amp;&amp; !full &amp;&amp; !tabbed &amp;&amp; !controlledPane &amp;&amp; ( | EXPECTED |
| 263 |           hidden={!open &#124;&#124; (tabbed &amp;&amp; stackedPane === "primary")} | 267 |           hidden={controlledPane ? activePane === "primary" : !open &#124;&#124; (tabbed &amp;&amp; stackedPane === "primary")} | EXPECTED |

## lib/course-builder/edit-service.ts

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 133 |     ? db.from('course_modules').update(payload).eq('id', body.id) | 133 |     ? db.from('course_modules').update(payload).eq('id', body.id).eq('course_id', body.courseId) | EXPECTED |
| — |  | 143 |   const { data: module, error: moduleError } = await db | EXPECTED |
| — |  | 144 |     .from('course_modules') | EXPECTED |
| — |  | 145 |     .select('course_id') | EXPECTED |
| — |  | 146 |     .eq('id', body.moduleId) | EXPECTED |
| — |  | 147 |     .maybeSingle(); | EXPECTED |
| — |  | 148 |   if (moduleError) throw moduleError; | EXPECTED |
| — |  | 149 |   if (!module &#124;&#124; module.course_id !== body.courseId) { | EXPECTED |
| — |  | 150 |     throw new Error('The selected module does not belong to this course.'); | EXPECTED |
| — |  | 151 |   } | EXPECTED |
| 163 |     metadata: { | 172 |     required_artifacts: body.requiredArtifacts ?? [], | EXPECTED |
| 164 |       requiredArtifacts: body.requiredArtifacts ?? [], | 173 |     domain_key: body.domainKey ?? null, | EXPECTED |
| 165 |       domainKey: body.domainKey ?? null, | 174 |     hour_category: body.hourCategory ?? null, | EXPECTED |
| 166 |       hourCategory: body.hourCategory ?? null, | 175 |     evidence_type: body.evidenceType ?? null, | EXPECTED |
| 167 |       evidenceType: body.evidenceType ?? null, | 176 |     delivery_method: body.deliveryMethod ?? null, | EXPECTED |
| 168 |       deliveryMethod: body.deliveryMethod ?? null, | 177 |     requires_instructor_signoff: body.requiresInstructorSignoff ?? false, | EXPECTED |
| 169 |       requiresInstructorSignoff: body.requiresInstructorSignoff ?? false, | 178 |     instructor_requirement: body.instructorRequirement ?? null, | EXPECTED |
| 170 |       instructorRequirement: body.instructorRequirement ?? null, | 179 |     minimum_seat_time_minutes: body.minimumSeatTimeMinutes ?? null, | EXPECTED |
| 171 |       minimumSeatTimeMinutes: body.minimumSeatTimeMinutes ?? null, | 180 |     fieldwork_eligible: body.fieldworkEligible ?? false, | EXPECTED |
| 172 |       fieldworkEligible: body.fieldworkEligible ?? false, | — |  | EXPECTED |
| 173 |     }, | — |  | EXPECTED |
| 176 |     ? db.from('course_lessons').update(payload).eq('id', body.id) | 183 |     ? db.from('course_lessons').update(payload).eq('id', body.id).eq('course_id', body.courseId) | EXPECTED |

## lib/devstudio/os/task-runner.ts

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 838 |  | — |  | EXPECTED |
| 839 | export async function rollbackTask( | — |  | EXPECTED |
| 840 |   db: SupabaseClient, | — |  | EXPECTED |
| 841 |   taskId: string, | — |  | EXPECTED |
| 842 |   actorId: string, | — |  | EXPECTED |
| 843 | ): Promise&lt;void&gt; { | — |  | EXPECTED |
| 844 |   const { data: task } = await db.from('ai_tasks').select('*').eq('id', taskId).single(); | — |  | EXPECTED |
| 845 |   if (!task) throw new Error('Task not found'); | — |  | EXPECTED |
| 846 |  | — |  | EXPECTED |
| 847 |   const { data: snapshots } = await db | — |  | EXPECTED |
| 848 |     .from('ai_file_snapshots') | — |  | EXPECTED |
| 849 |     .select('id, repo_path, snapshot_type') | — |  | EXPECTED |
| 850 |     .eq('task_id', taskId) | — |  | EXPECTED |
| 851 |     .eq('snapshot_type', 'before'); | — |  | EXPECTED |
| 852 |  | — |  | EXPECTED |
| 853 |   await db | — |  | EXPECTED |
| 854 |     .from('ai_tasks') | — |  | EXPECTED |
| 855 |     .update({ | — |  | EXPECTED |
| 856 |       status: 'rolled_back', | — |  | EXPECTED |
| 857 |       completed_at: new Date().toISOString(), | — |  | EXPECTED |
| 858 |       result_json: { rolled_back: true, snapshots: snapshots?.length ?? 0 }, | — |  | EXPECTED |
| 859 |       updated_at: new Date().toISOString(), | — |  | EXPECTED |
| 860 |     }) | — |  | EXPECTED |
| 861 |     .eq('id', taskId); | — |  | EXPECTED |
| 862 |  | — |  | EXPECTED |
| 863 |   await setAgentStatus(db, task.agent_id, 'idle'); | — |  | EXPECTED |
| 864 |   await appendTaskLog( | — |  | EXPECTED |
| 865 |     db, | — |  | EXPECTED |
| 866 |     taskId, | — |  | EXPECTED |
| 867 |     &#96;Task marked rolled back (${snapshots?.length ?? 0} snapshots referenced)&#96;, | — |  | EXPECTED |
| 868 |     'warn', | — |  | EXPECTED |
| 869 |     undefined, | — |  | EXPECTED |
| 870 |     task.tenant_id, | — |  | EXPECTED |
| 871 |     actorId, | — |  | EXPECTED |
| 872 |   ); | — |  | EXPECTED |
| 873 |  | — |  | EXPECTED |
| 874 |   await writeDevAuditLog(db, { | — |  | EXPECTED |
| 875 |     actorId, | — |  | EXPECTED |
| 876 |     action: 'task.rollback', | — |  | EXPECTED |
| 877 |     resourceType: 'ai_tasks', | — |  | EXPECTED |
| 878 |     resourceId: taskId, | — |  | EXPECTED |
| 879 |     traceId: task.trace_id, | — |  | EXPECTED |
| 880 |   }); | — |  | EXPECTED |
| 881 | } | — |  | EXPECTED |

## tests/unit/ultimate-build-panel-status.test.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 50 | async function openOperations() { | EXPECTED |
| — |  | 51 |   // JSDOM has zero layout width: use the compact workspace navigation. | EXPECTED |
| — |  | 52 |   fireEvent.click(await screen.findByRole('button', { name: 'Operations', exact: true })); | EXPECTED |
| — |  | 53 | } | EXPECTED |
| — |  | 54 |  | EXPECTED |
| — |  | 58 |   await openOperations(); | EXPECTED |
| 54 |   expect(screen.getByRole('alert')).toHaveTextContent('SCENE_COVERAGE_REQUIRED'); | 60 |   expect(screen.getAllByRole('alert').some((alert) =&gt; alert.textContent?.includes('SCENE_COVERAGE_REQUIRED'))).toBe(true); | EXPECTED |
| — |  | 67 |   await openOperations(); | EXPECTED |
| — |  | 74 |   await openOperations(); | EXPECTED |
| — |  | 86 |   await openOperations(); | EXPECTED |
| — |  | 95 |  await openOperations(); | EXPECTED |
| 87 |  expect(screen.getByRole('alert')).toHaveTextContent('heartbeat is missing or stale'); | 97 |  expect(screen.getByText(/Worker heartbeat is missing or stale/)).toHaveAttribute('role', 'alert'); | EXPECTED |

## tests/unit/production-panel-container.test.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 1 | import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'; | EXPECTED |
| — |  | 2 | import { afterEach, beforeEach, expect, it, vi } from 'vitest'; | EXPECTED |
| — |  | 3 | import ProductionPanelLayout from '@/components/admin/course-builder/ProductionPanelLayout'; | EXPECTED |
| — |  | 4 |  | EXPECTED |
| — |  | 5 | let width = 640; | EXPECTED |
| — |  | 6 | let observers: Array&lt;() =&gt; void&gt; = []; | EXPECTED |
| — |  | 7 | beforeEach(() =&gt; { | EXPECTED |
| — |  | 8 |   width = 640; | EXPECTED |
| — |  | 9 |   observers = []; | EXPECTED |
| — |  | 10 |   vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() =&gt; ({ | EXPECTED |
| — |  | 11 |     x: 0, y: 0, top: 0, left: 0, right: width, bottom: 800, width, height: 800, toJSON() { return {}; }, | EXPECTED |
| — |  | 12 |   })); | EXPECTED |
| — |  | 13 |   vi.stubGlobal('ResizeObserver', class { | EXPECTED |
| — |  | 14 |     constructor(callback: ResizeObserverCallback) { observers.push(() =&gt; callback([], this as unknown as ResizeObserver)); } | EXPECTED |
| — |  | 15 |     observe() {} disconnect() {} unobserve() {} | EXPECTED |
| — |  | 16 |   }); | EXPECTED |
| — |  | 17 | }); | EXPECTED |
| — |  | 18 | afterEach(() =&gt; { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); }); | EXPECTED |
| — |  | 19 |  | EXPECTED |
| — |  | 20 | function Fixture() { | EXPECTED |
| — |  | 21 |   return &lt;ProductionPanelLayout outline={&lt;button&gt;Choose lesson&lt;/button&gt;} operations={&lt;button&gt;Resume course&lt;/button&gt;}&gt; | EXPECTED |
| — |  | 22 |     &lt;video aria-label="Saved lesson film" /&gt;&lt;input aria-label="Lesson draft" defaultValue="Unsaved draft" /&gt; | EXPECTED |
| — |  | 23 |   &lt;/ProductionPanelLayout&gt;; | EXPECTED |
| — |  | 24 | } | EXPECTED |
| — |  | 25 |  | EXPECTED |
| — |  | 26 | it('uses the available pane width and exposes one complete work view inside a desktop split', () =&gt; { | EXPECTED |
| — |  | 27 |   render(&lt;Fixture /&gt;); | EXPECTED |
| — |  | 28 |   expect(screen.getByRole('textbox', { name: 'Lesson draft' })).toBeVisible(); | EXPECTED |
| — |  | 29 |   expect(screen.queryByRole('button', { name: 'Resume course' })).toBeNull(); | EXPECTED |
| — |  | 30 |   expect(screen.queryByRole('button', { name: 'Choose lesson' })).toBeNull(); | EXPECTED |
| — |  | 31 |   expect(screen.queryAllByRole('separator')).toHaveLength(0); | EXPECTED |
| — |  | 32 |   fireEvent.click(screen.getByRole('button', { name: 'Outline', exact: true })); | EXPECTED |
| — |  | 33 |   expect(screen.getByRole('button', { name: 'Choose lesson' })).toBeVisible(); | EXPECTED |
| — |  | 34 |   expect(screen.queryByRole('textbox', { name: 'Lesson draft' })).toBeNull(); | EXPECTED |
| — |  | 35 |   fireEvent.click(screen.getByRole('button', { name: 'Operations', exact: true })); | EXPECTED |
| — |  | 36 |   expect(screen.getByRole('button', { name: 'Resume course' })).toBeVisible(); | EXPECTED |
| — |  | 37 |   expect(screen.queryByRole('button', { name: 'Choose lesson' })).toBeNull(); | EXPECTED |
| — |  | 38 | }); | EXPECTED |
| — |  | 39 |  | EXPECTED |
| — |  | 40 | it('preserves the editor, player and desktop panel choices across compact navigation and resize', () =&gt; { | EXPECTED |
| — |  | 41 |   width = 1200; | EXPECTED |
| — |  | 42 |   render(&lt;Fixture /&gt;); | EXPECTED |
| — |  | 43 |   const draft = screen.getByRole('textbox', { name: 'Lesson draft' }); | EXPECTED |
| — |  | 44 |   const video = screen.getByLabelText('Saved lesson film'); | EXPECTED |
| — |  | 45 |   fireEvent.click(screen.getByRole('button', { name: 'Close Production operations' })); | EXPECTED |
| — |  | 46 |   act(() =&gt; { width = 640; observers.forEach(update =&gt; update()); }); | EXPECTED |
| — |  | 47 |   fireEvent.click(screen.getByRole('button', { name: 'Operations', exact: true })); | EXPECTED |
| — |  | 48 |   expect(screen.getByRole('button', { name: 'Resume course' })).toBeVisible(); | EXPECTED |
| — |  | 49 |   fireEvent.click(screen.getByRole('button', { name: 'Preview', exact: true })); | EXPECTED |
| — |  | 50 |   expect(screen.getByRole('textbox', { name: 'Lesson draft' })).toBe(draft); | EXPECTED |
| — |  | 51 |   expect(draft).toHaveValue('Unsaved draft'); | EXPECTED |
| — |  | 52 |   expect(screen.getByLabelText('Saved lesson film')).toBe(video); | EXPECTED |
| — |  | 53 |   act(() =&gt; { width = 1200; observers.forEach(update =&gt; update()); }); | EXPECTED |
| — |  | 54 |   expect(screen.queryByRole('button', { name: 'Resume course' })).toBeNull(); | EXPECTED |
| — |  | 55 |   expect(screen.getByRole('button', { name: 'Choose lesson' })).toBeVisible(); | EXPECTED |
| — |  | 56 |   expect(screen.getByRole('button', { name: 'Open Production operations' })).toBeVisible(); | EXPECTED |
| — |  | 57 | }); | EXPECTED |

## tests/unit/dashboard-job-board-actions.test.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 1 | import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'; | EXPECTED |
| — |  | 2 | import { afterEach, expect, it, vi } from 'vitest'; | EXPECTED |
| — |  | 3 | import JobBoardPanel from '@/components/admin/dashboard/JobBoardPanel'; | EXPECTED |
| — |  | 4 |  | EXPECTED |
| — |  | 5 | afterEach(() =&gt; { cleanup(); vi.unstubAllGlobals(); }); | EXPECTED |
| — |  | 6 | const stats = { count: 12, configured: { usajobs: true, careerOneStop: true }, sources: { USAJobs: { records: 12, latestImport: '2026-10-24T12:00:00Z' } } }; | EXPECTED |
| — |  | 7 | function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }); } | EXPECTED |
| — |  | 8 | function responses(importResponse: Response, refreshResponse = json(stats)) { | EXPECTED |
| — |  | 9 |   const fetcher = vi.fn().mockResolvedValueOnce(json(stats)).mockResolvedValueOnce(importResponse).mockResolvedValueOnce(refreshResponse); | EXPECTED |
| — |  | 10 |   vi.stubGlobal('fetch', fetcher); | EXPECTED |
| — |  | 11 |   return fetcher; | EXPECTED |
| — |  | 12 | } | EXPECTED |
| — |  | 13 | async function importJobs() { | EXPECTED |
| — |  | 14 |   render(&lt;JobBoardPanel /&gt;); | EXPECTED |
| — |  | 15 |   await waitFor(() =&gt; expect(screen.queryByText('—')).toBeNull()); | EXPECTED |
| — |  | 16 |   fireEvent.click(screen.getByRole('button', { name: 'Run Import' })); | EXPECTED |
| — |  | 17 | } | EXPECTED |
| — |  | 18 | it('uses the real feed status contract for counts and provider connection', async () =&gt; { | EXPECTED |
| — |  | 19 |   responses(json({})); | EXPECTED |
| — |  | 20 |   render(&lt;JobBoardPanel /&gt;); | EXPECTED |
| — |  | 21 |   expect(await screen.findByText('12')).toBeVisible(); | EXPECTED |
| — |  | 22 |   expect(screen.getAllByText('Connected')).toHaveLength(2); | EXPECTED |
| — |  | 23 |   expect(screen.queryByText('Never')).toBeNull(); | EXPECTED |
| — |  | 24 | }); | EXPECTED |
| — |  | 25 | it('reports an HTTP failure and leaves the import available for retry without claiming success', async () =&gt; { | EXPECTED |
| — |  | 26 |   const fetcher = responses(json({ error: 'Import unavailable' }, 503)); | EXPECTED |
| — |  | 27 |   await importJobs(); | EXPECTED |
| — |  | 28 |   expect(await screen.findByRole('alert')).toHaveTextContent('Import unavailable'); | EXPECTED |
| — |  | 29 |   expect(screen.queryByText(/Imported .* jobs/)).toBeNull(); | EXPECTED |
| — |  | 30 |   expect(screen.getByRole('button', { name: 'Run Import' })).toBeEnabled(); | EXPECTED |
| — |  | 31 |   expect(fetcher).toHaveBeenCalledTimes(2); | EXPECTED |
| — |  | 32 | }); | EXPECTED |
| — |  | 33 | it('renders the acknowledged import total and displays partial provider failures', async () =&gt; { | EXPECTED |
| — |  | 34 |   responses(json({ ok: true, imported: { total: 3, usaJobs: 3, careerOneStop: 0 }, errors: { careerOneStop: 'Provider unavailable' } })); | EXPECTED |
| — |  | 35 |   await importJobs(); | EXPECTED |
| — |  | 36 |   expect(await screen.findByRole('status')).toHaveTextContent('Imported 3 jobs.'); | EXPECTED |
| — |  | 37 |   expect(screen.getByRole('alert')).toHaveTextContent('CareerOneStop: Provider unavailable'); | EXPECTED |
| — |  | 38 | }); | EXPECTED |
| — |  | 39 | it('keeps an acknowledged import successful when the separate status refresh fails', async () =&gt; { | EXPECTED |
| — |  | 40 |   responses(json({ ok: true, imported: { total: 3 }, errors: {} }), json({ error: 'Status unavailable' }, 503)); | EXPECTED |
| — |  | 41 |   await importJobs(); | EXPECTED |
| — |  | 42 |   expect(await screen.findByRole('status')).toHaveTextContent('Imported 3 jobs.'); | EXPECTED |
| — |  | 43 |   expect(await screen.findByRole('alert')).toHaveTextContent('Import completed, but status could not refresh'); | EXPECTED |
| — |  | 44 |   expect(screen.getByText('12')).toBeVisible(); | EXPECTED |
| — |  | 45 | }); | EXPECTED |

## tests/unit/course-editor-lesson-storage.test.ts

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 1 | import { beforeEach, describe, expect, it, vi } from 'vitest'; | EXPECTED |
| — |  | 2 |  | EXPECTED |
| — |  | 3 | const state = vi.hoisted(() =&gt; ({ | EXPECTED |
| — |  | 4 |   writes: [] as Array&lt;{ table: string; payload: Record&lt;string, unknown&gt; }&gt;, | EXPECTED |
| — |  | 5 |   filters: [] as Array&lt;{ table: string; column: string; value: unknown }&gt;, | EXPECTED |
| — |  | 6 |   error: null as null &#124; { message: string }, | EXPECTED |
| — |  | 7 |   moduleCourseId: '11111111-1111-4111-8111-111111111111' as string &#124; null, | EXPECTED |
| — |  | 8 | })); | EXPECTED |
| — |  | 9 | const db = vi.hoisted(() =&gt; ({ | EXPECTED |
| — |  | 10 |   from: (table: string) =&gt; { | EXPECTED |
| — |  | 11 |     const query: any = { | EXPECTED |
| — |  | 12 |       insert: (payload: Record&lt;string, unknown&gt;) =&gt; { state.writes.push({ table, payload }); return query; }, | EXPECTED |
| — |  | 13 |       update: (payload: Record&lt;string, unknown&gt;) =&gt; { state.writes.push({ table, payload }); return query; }, | EXPECTED |
| — |  | 14 |       eq: (column: string, value: unknown) =&gt; { state.filters.push({ table, column, value }); return query; }, | EXPECTED |
| — |  | 15 |       select: () =&gt; query, | EXPECTED |
| — |  | 16 |       maybeSingle: async () =&gt; ({ data: state.moduleCourseId ? { course_id: state.moduleCourseId } : null, error: state.error }), | EXPECTED |
| — |  | 17 |       single: async () =&gt; ({ data: { id: 'saved-lesson' }, error: state.error }), | EXPECTED |
| — |  | 18 |     }; | EXPECTED |
| — |  | 19 |     return query; | EXPECTED |
| — |  | 20 |   }, | EXPECTED |
| — |  | 21 | })); | EXPECTED |
| — |  | 22 | vi.mock('@/lib/course-builder/db', () =&gt; ({ getServiceDb: async () =&gt; db })); | EXPECTED |
| — |  | 23 | vi.mock('@/lib/supabase/admin', () =&gt; ({ requireAdminClient: async () =&gt; db })); | EXPECTED |
| — |  | 24 |  | EXPECTED |
| — |  | 25 | import { saveCourseLesson, saveCourseModule } from '@/lib/course-builder/edit-service'; | EXPECTED |
| — |  | 26 |  | EXPECTED |
| — |  | 27 | const input = { | EXPECTED |
| — |  | 28 |   courseId: '11111111-1111-4111-8111-111111111111', | EXPECTED |
| — |  | 29 |   moduleId: '22222222-2222-4222-8222-222222222222', | EXPECTED |
| — |  | 30 |   slug: 'safety', title: 'Safety', orderIndex: 0, lessonType: 'practical', durationMinutes: 30, | EXPECTED |
| — |  | 31 |   learningObjectives: ['Demonstrate safe operation'], content: { text: 'Safety procedure' }, | EXPECTED |
| — |  | 32 |   requiredArtifacts: ['video'], domainKey: 'safety', hourCategory: 'practical', evidenceType: 'video', | EXPECTED |
| — |  | 33 |   deliveryMethod: 'in_person', requiresInstructorSignoff: true, | EXPECTED |
| — |  | 34 |   instructorRequirement: { required: true, supervisionMethod: 'observation' }, | EXPECTED |
| — |  | 35 |   minimumSeatTimeMinutes: 25, fieldworkEligible: true, | EXPECTED |
| — |  | 36 | }; | EXPECTED |
| — |  | 37 |  | EXPECTED |
| — |  | 38 | beforeEach(() =&gt; { state.writes = []; state.filters = []; state.error = null; state.moduleCourseId = input.courseId; }); | EXPECTED |
| — |  | 39 |  | EXPECTED |
| — |  | 40 | describe('manual lesson persistence uses the LMS schema', () =&gt; { | EXPECTED |
| — |  | 41 |   it.each([undefined, '33333333-3333-4333-8333-333333333333'])('persists compliance fields on create/update (%s)', async (id) =&gt; { | EXPECTED |
| — |  | 42 |     await saveCourseLesson({ ...input, id }); | EXPECTED |
| — |  | 43 |     expect(state.writes).toHaveLength(1); | EXPECTED |
| — |  | 44 |     expect(state.writes[0].table).toBe('course_lessons'); | EXPECTED |
| — |  | 45 |     expect(state.writes[0].payload).toMatchObject({ | EXPECTED |
| — |  | 46 |       course_id: input.courseId, module_id: input.moduleId, | EXPECTED |
| — |  | 47 |       required_artifacts: ['video'], domain_key: 'safety', hour_category: 'practical', evidence_type: 'video', | EXPECTED |
| — |  | 48 |       delivery_method: 'in_person', requires_instructor_signoff: true, | EXPECTED |
| — |  | 49 |       instructor_requirement: input.instructorRequirement, minimum_seat_time_minutes: 25, fieldwork_eligible: true, | EXPECTED |
| — |  | 50 |     }); | EXPECTED |
| — |  | 51 |     expect(state.writes[0].payload).not.toHaveProperty('metadata'); | EXPECTED |
| — |  | 52 |     if (id) expect(state.filters).toContainEqual({ table: 'course_lessons', column: 'course_id', value: input.courseId }); | EXPECTED |
| — |  | 53 |   }); | EXPECTED |
| — |  | 54 |  | EXPECTED |
| — |  | 55 |   it.each([null, '44444444-4444-4444-8444-444444444444'])('rejects a missing or mismatched parent module (%s)', async (moduleCourseId) =&gt; { | EXPECTED |
| — |  | 56 |     state.moduleCourseId = moduleCourseId; | EXPECTED |
| — |  | 57 |     await expect(saveCourseLesson(input)).rejects.toThrow('does not belong to this course'); | EXPECTED |
| — |  | 58 |     expect(state.writes).toHaveLength(0); | EXPECTED |
| — |  | 59 |   }); | EXPECTED |
| — |  | 60 |  | EXPECTED |
| — |  | 61 |   it('does not report a successful save after a database failure', async () =&gt; { | EXPECTED |
| — |  | 62 |     state.error = { message: 'database unavailable' }; | EXPECTED |
| — |  | 63 |     await expect(saveCourseLesson(input)).rejects.toEqual(state.error); | EXPECTED |
| — |  | 64 |   }); | EXPECTED |
| — |  | 65 |  | EXPECTED |
| — |  | 66 |   it('scopes module edits to the selected course', async () =&gt; { | EXPECTED |
| — |  | 67 |     await saveCourseModule({ | EXPECTED |
| — |  | 68 |       id: input.moduleId, courseId: input.courseId, title: 'Safety', slug: 'safety', | EXPECTED |
| — |  | 69 |       orderIndex: 0, domainKey: 'safety', targetHours: 1, quizRequired: true, practicalRequired: true, | EXPECTED |
| — |  | 70 |     }); | EXPECTED |
| — |  | 71 |     expect(state.filters).toContainEqual({ table: 'course_modules', column: 'course_id', value: input.courseId }); | EXPECTED |
| — |  | 72 |   }); | EXPECTED |
| — |  | 73 | }); | EXPECTED |

## tests/unit/studio-task-rollback-boundary.test.ts

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 1 | import { beforeEach, describe, expect, it, vi } from 'vitest'; | EXPECTED |
| — |  | 2 | import { NextRequest, NextResponse } from 'next/server'; | EXPECTED |
| — |  | 3 |  | EXPECTED |
| — |  | 4 | const state = vi.hoisted(() =&gt; ({ authError: null as Response &#124; null, db: vi.fn() })); | EXPECTED |
| — |  | 5 | vi.mock('@/lib/api/withRateLimit', () =&gt; ({ applyRateLimit: async () =&gt; null })); | EXPECTED |
| — |  | 6 | vi.mock('@/lib/devstudio/api-auth', () =&gt; ({ apiRequireDevStudio: async () =&gt; ({ id: 'admin', error: state.authError }) })); | EXPECTED |
| — |  | 7 | vi.mock('@/lib/supabase/admin', () =&gt; ({ requireAdminClient: state.db })); | EXPECTED |
| — |  | 8 | import { POST } from '@/apps/admin/app/api/admin/dev-studio/tasks/[id]/rollback/route'; | EXPECTED |
| — |  | 9 |  | EXPECTED |
| — |  | 10 | beforeEach(() =&gt; { state.authError = null; vi.clearAllMocks(); }); | EXPECTED |
| — |  | 11 | const request = () =&gt; new NextRequest('https://admin.elevateforhumanity.org/api/admin/dev-studio/tasks/task/rollback', { method: 'POST' }); | EXPECTED |
| — |  | 12 | const context = { params: Promise.resolve({ id: 'task' }) }; | EXPECTED |
| — |  | 13 |  | EXPECTED |
| — |  | 14 | describe('Studio task rollback boundary', () =&gt; { | EXPECTED |
| — |  | 15 |   it('never reports restoration or changes task records without a restore implementation', async () =&gt; { | EXPECTED |
| — |  | 16 |     const response = await POST(request(), context); | EXPECTED |
| — |  | 17 |     expect(response.status).toBe(501); | EXPECTED |
| — |  | 18 |     expect(await response.json()).toMatchObject({ code: 'TASK_ROLLBACK_UNAVAILABLE' }); | EXPECTED |
| — |  | 19 |     expect(state.db).not.toHaveBeenCalled(); | EXPECTED |
| — |  | 20 |   }); | EXPECTED |
| — |  | 21 |   it('preserves the authenticated access boundary', async () =&gt; { | EXPECTED |
| — |  | 22 |     state.authError = NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); | EXPECTED |
| — |  | 23 |     expect((await POST(request(), context)).status).toBe(401); | EXPECTED |
| — |  | 24 |     expect(state.db).not.toHaveBeenCalled(); | EXPECTED |
| — |  | 25 |   }); | EXPECTED |
| — |  | 26 | }); | EXPECTED |

## supabase/migrations/20261024183332_course_module_authoring_settings.sql

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 1 | -- Retain manual module authoring settings used by saveCourseModule. | EXPECTED |
| — |  | 2 | -- Learner progression remains in module_completion_rules; lesson compliance | EXPECTED |
| — |  | 3 | -- settings remain in the dedicated course_lessons columns. | EXPECTED |
| — |  | 4 | ALTER TABLE public.course_modules | EXPECTED |
| — |  | 5 |   ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb; | EXPECTED |
| — |  | 6 |  | EXPECTED |
| — |  | 7 | COMMENT ON COLUMN public.course_modules.metadata IS | EXPECTED |
| — |  | 8 |   'Module authoring settings. Does not replace module_completion_rules or lesson compliance fields.'; | EXPECTED |

## apps/admin/app/api/admin/apprenticeships/hours/export/route.ts

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 1 | import { NextRequest, NextResponse } from 'next/server'; | EXPECTED |
| — |  | 2 | import { apiRequireRoles } from '@/lib/admin/guards'; | EXPECTED |
| — |  | 3 | import { requireAdminClient } from '@/lib/supabase/admin'; | EXPECTED |
| — |  | 4 | import { loadAdminHours } from '@/lib/apprenticeship/admin-hours'; | EXPECTED |
| — |  | 5 | import { applyRateLimit } from '@/lib/api/withRateLimit'; | EXPECTED |
| — |  | 6 | import { safeInternalError } from '@/lib/api/safe-error'; | EXPECTED |
| — |  | 7 | import { logAuditEvent, AuditActions } from '@/lib/audit'; | EXPECTED |
| — |  | 8 |  | EXPECTED |
| — |  | 9 | export const runtime = 'nodejs'; | EXPECTED |
| — |  | 10 | export const dynamic = 'force-dynamic'; | EXPECTED |
| — |  | 11 |  | EXPECTED |
| — |  | 12 | function validDate(value: string &#124; null): value is string { | EXPECTED |
| — |  | 13 |   if (!value &#124;&#124; !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; | EXPECTED |
| — |  | 14 |   const date = new Date(&#96;${value}T00:00:00Z&#96;); | EXPECTED |
| — |  | 15 |   return Number.isFinite(date.getTime()) &amp;&amp; date.toISOString().slice(0, 10) === value; | EXPECTED |
| — |  | 16 | } | EXPECTED |
| — |  | 17 |  | EXPECTED |
| — |  | 18 | function csvField(value: unknown) { | EXPECTED |
| — |  | 19 |   let text = String(value ?? ''); | EXPECTED |
| — |  | 20 |   // Exported names/notes must remain text when opened in a spreadsheet. | EXPECTED |
| — |  | 21 |   if (/^[\s]*[=+@-]/.test(text) &#124;&#124; /^[\t\r\n]/.test(text)) text = &#96;'${text}&#96;; | EXPECTED |
| — |  | 22 |   return &#96;"${text.replace(/"/g, '""')}"&#96;; | EXPECTED |
| — |  | 23 | } | EXPECTED |
| — |  | 24 |  | EXPECTED |
| — |  | 25 | export async function GET(req: NextRequest) { | EXPECTED |
| — |  | 26 |   const rateLimited = await applyRateLimit(req, 'api'); | EXPECTED |
| — |  | 27 |   if (rateLimited) return rateLimited; | EXPECTED |
| — |  | 28 |   const auth = await apiRequireRoles(req, ['admin', 'super_admin', 'staff']); | EXPECTED |
| — |  | 29 |   if (auth.error) return auth.error; | EXPECTED |
| — |  | 30 |   const params = req.nextUrl.searchParams; | EXPECTED |
| — |  | 31 |   const start = params.get('start_date'); | EXPECTED |
| — |  | 32 |   const end = params.get('end_date'); | EXPECTED |
| — |  | 33 |   const status = params.get('status') &#124;&#124; 'all'; | EXPECTED |
| — |  | 34 |   if (!validDate(start) &#124;&#124; !validDate(end) &#124;&#124; start &gt; end &#124;&#124; !['all', 'verified', 'submitted'].includes(status)) { | EXPECTED |
| — |  | 35 |     return NextResponse.json({ error: 'Choose a valid date range and review status.' }, { status: 400 }); | EXPECTED |
| — |  | 36 |   } | EXPECTED |
| — |  | 37 |   try { | EXPECTED |
| — |  | 38 |     // Share the Student Hours loader: progress_entries plus identity/program | EXPECTED |
| — |  | 39 |     // resolution and hour_entries review reconciliation. Do not substitute | EXPECTED |
| — |  | 40 |     // attendance_hours or export ledger credit as worked OJT hours. | EXPECTED |
| — |  | 41 |     const { entries } = await loadAdminHours(await requireAdminClient()); | EXPECTED |
| — |  | 42 |     const rows = entries.filter((entry) =&gt; entry.work_date &gt;= start &amp;&amp; entry.work_date &lt;= end &amp;&amp; (status === 'all' &#124;&#124; entry.status === status)); | EXPECTED |
| — |  | 43 |     const csv = [ | EXPECTED |
| — |  | 44 |       ['Entry ID', 'Student Name', 'Student Email', 'Program', 'Work Date', 'Hours Worked', 'Review Status', 'Verified By', 'Verified At', 'Notes'], | EXPECTED |
| — |  | 45 |       ...rows.map((entry) =&gt; [entry.id, entry.name, entry.email, entry.program_title, entry.work_date, entry.hours_worked, entry.status, entry.verified_by, entry.verified_at, entry.notes &#124;&#124; entry.tasks_completed]), | EXPECTED |
| — |  | 46 |     ].map((row) =&gt; row.map(csvField).join(',')).join('\r\n'); | EXPECTED |
| — |  | 47 |     await logAuditEvent({ | EXPECTED |
| — |  | 48 |       userId: auth.id, | EXPECTED |
| — |  | 49 |       action: AuditActions.DATA_EXPORTED, | EXPECTED |
| — |  | 50 |       resourceType: 'apprenticeship_ojt_hours', | EXPECTED |
| — |  | 51 |       metadata: { start_date: start, end_date: end, status, count: rows.length }, | EXPECTED |
| — |  | 52 |     }); | EXPECTED |
| — |  | 53 |     return new NextResponse(csv, { | EXPECTED |
| — |  | 54 |       headers: { | EXPECTED |
| — |  | 55 |         'Content-Type': 'text/csv; charset=utf-8', | EXPECTED |
| — |  | 56 |         'Content-Disposition': &#96;attachment; filename="ojt_hours_${start}_to_${end}.csv"&#96;, | EXPECTED |
| — |  | 57 |         'Cache-Control': 'private, no-store', | EXPECTED |
| — |  | 58 |       }, | EXPECTED |
| — |  | 59 |     }); | EXPECTED |
| — |  | 60 |   } catch (error) { | EXPECTED |
| — |  | 61 |     return safeInternalError(error, 'Export apprenticeship OJT hours', 'Could not export hours. Please try again.'); | EXPECTED |
| — |  | 62 |   } | EXPECTED |
| — |  | 63 | } | EXPECTED |

## tests/unit/admin-hours-export.test.ts

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 1 | import { beforeEach, describe, expect, it, vi } from 'vitest'; | EXPECTED |
| — |  | 2 | import { NextRequest, NextResponse } from 'next/server'; | EXPECTED |
| — |  | 3 |  | EXPECTED |
| — |  | 4 | const state = vi.hoisted(() =&gt; ({ | EXPECTED |
| — |  | 5 |   authError: null as Response &#124; null, | EXPECTED |
| — |  | 6 |   load: vi.fn(), | EXPECTED |
| — |  | 7 |   audit: vi.fn(), | EXPECTED |
| — |  | 8 |   db: {}, | EXPECTED |
| — |  | 9 | })); | EXPECTED |
| — |  | 10 | vi.mock('@/lib/admin/guards', () =&gt; ({ apiRequireRoles: async () =&gt; ({ id: 'admin', error: state.authError }) })); | EXPECTED |
| — |  | 11 | vi.mock('@/lib/api/withRateLimit', () =&gt; ({ applyRateLimit: async () =&gt; null })); | EXPECTED |
| — |  | 12 | vi.mock('@/lib/supabase/admin', () =&gt; ({ requireAdminClient: async () =&gt; state.db })); | EXPECTED |
| — |  | 13 | vi.mock('@/lib/apprenticeship/admin-hours', () =&gt; ({ loadAdminHours: state.load })); | EXPECTED |
| — |  | 14 | vi.mock('@/lib/audit', () =&gt; ({ logAuditEvent: state.audit, AuditActions: { DATA_EXPORTED: 'data_exported' } })); | EXPECTED |
| — |  | 15 | vi.mock('@/lib/api/safe-error', () =&gt; ({ safeInternalError: () =&gt; NextResponse.json({ error: 'Could not export hours.' }, { status: 500 }) })); | EXPECTED |
| — |  | 16 | import { GET } from '@/apps/admin/app/api/admin/apprenticeships/hours/export/route'; | EXPECTED |
| — |  | 17 |  | EXPECTED |
| — |  | 18 | const request = (query = 'start_date=2026-10-01&amp;end_date=2026-10-24') =&gt; new NextRequest(&#96;https://admin.elevateforhumanity.org/api/admin/apprenticeships/hours/export?${query}&#96;); | EXPECTED |
| — |  | 19 | const entry = (id: string, work_date: string, status = 'verified', hours_worked = 2) =&gt; ({ id, work_date, status, hours_worked, name: 'Test Student', email: 'fixture@example.test', program_title: 'Test program', notes: null }); | EXPECTED |
| — |  | 20 | beforeEach(() =&gt; { | EXPECTED |
| — |  | 21 |   vi.clearAllMocks(); | EXPECTED |
| — |  | 22 |   state.authError = null; | EXPECTED |
| — |  | 23 |   state.load.mockResolvedValue({ entries: [entry('start', '2026-10-01'), entry('end', '2026-10-24'), entry('outside', '2026-09-30'), entry('pending', '2026-10-12', 'submitted'), entry('zero', '2026-10-12', 'verified', 0)] }); | EXPECTED |
| — |  | 24 | }); | EXPECTED |
| — |  | 25 |  | EXPECTED |
| — |  | 26 | describe('OJT export contract', () =&gt; { | EXPECTED |
| — |  | 27 |   it('uses the Student Hours data and includes date boundaries without converting zero hours', async () =&gt; { | EXPECTED |
| — |  | 28 |     const response = await GET(request()); | EXPECTED |
| — |  | 29 |     const csv = await response.text(); | EXPECTED |
| — |  | 30 |     expect(state.load).toHaveBeenCalledWith(state.db); | EXPECTED |
| — |  | 31 |     expect(csv).toContain('"start"'); | EXPECTED |
| — |  | 32 |     expect(csv).toContain('"end"'); | EXPECTED |
| — |  | 33 |     expect(csv).not.toContain('"outside"'); | EXPECTED |
| — |  | 34 |     expect(csv).toContain('"0","verified"'); | EXPECTED |
| — |  | 35 |     expect(response.headers.get('cache-control')).toBe('private, no-store'); | EXPECTED |
| — |  | 36 |     expect(state.audit).toHaveBeenCalledWith(expect.objectContaining({ resourceType: 'apprenticeship_ojt_hours', metadata: expect.objectContaining({ count: 4 }) })); | EXPECTED |
| — |  | 37 |   }); | EXPECTED |
| — |  | 38 |   it('exports only verified records when that filter is selected', async () =&gt; { | EXPECTED |
| — |  | 39 |     const csv = await (await GET(request('start_date=2026-10-01&amp;end_date=2026-10-24&amp;status=verified'))).text(); | EXPECTED |
| — |  | 40 |     expect(csv).not.toContain('"pending"'); | EXPECTED |
| — |  | 41 |     expect(csv).toContain('"zero"'); | EXPECTED |
| — |  | 42 |   }); | EXPECTED |
| — |  | 43 |   it.each(['start_date=2026-02-30&amp;end_date=2026-10-24', 'start_date=2026-10-24&amp;end_date=2026-10-01', 'start_date=2026-10-01&amp;end_date=2026-10-24&amp;status=anything'])('rejects invalid filters before accessing records: %s', async (query) =&gt; { | EXPECTED |
| — |  | 44 |     expect((await GET(request(query))).status).toBe(400); | EXPECTED |
| — |  | 45 |     expect(state.load).not.toHaveBeenCalled(); | EXPECTED |
| — |  | 46 |   }); | EXPECTED |
| — |  | 47 |   it('escapes CSV quotes, line breaks, and spreadsheet formulas', async () =&gt; { | EXPECTED |
| — |  | 48 |     state.load.mockResolvedValue({ entries: [{ ...entry('row', '2026-10-01'), name: '=1+1', notes: 'a,"quote"\nnext' }] }); | EXPECTED |
| — |  | 49 |     const csv = await (await GET(request())).text(); | EXPECTED |
| — |  | 50 |     expect(csv).toContain('"\'=1+1"'); | EXPECTED |
| — |  | 51 |     expect(csv).toContain('"a,""quote""\nnext"'); | EXPECTED |
| — |  | 52 |   }); | EXPECTED |
| — |  | 53 |   it('keeps unauthorized callers outside the data loader', async () =&gt; { | EXPECTED |
| — |  | 54 |     state.authError = NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); | EXPECTED |
| — |  | 55 |     expect((await GET(request())).status).toBe(401); | EXPECTED |
| — |  | 56 |     expect(state.load).not.toHaveBeenCalled(); | EXPECTED |
| — |  | 57 |   }); | EXPECTED |
| — |  | 58 |   it('returns an error instead of a successful empty export when loading fails', async () =&gt; { | EXPECTED |
| — |  | 59 |     state.load.mockRejectedValueOnce(new Error('unavailable')); | EXPECTED |
| — |  | 60 |     expect((await GET(request())).status).toBe(500); | EXPECTED |
| — |  | 61 |     expect(state.audit).not.toHaveBeenCalled(); | EXPECTED |
| — |  | 62 |   }); | EXPECTED |
| — |  | 63 | }); | EXPECTED |

## lib/compliance/wioa-dashboard.ts

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 1 | import 'server-only'; | EXPECTED |
| — |  | 2 | import type { createClient } from '@/lib/supabase/server'; | EXPECTED |
| — |  | 3 | import type { WIOADashboardProps } from '@/components/admin/WIOAComplianceDashboard'; | EXPECTED |
| — |  | 4 |  | EXPECTED |
| — |  | 5 | export async function loadWioaDashboard(db: Awaited&lt;ReturnType&lt;typeof createClient&gt;&gt;): Promise&lt;WIOADashboardProps&gt; { | EXPECTED |
| — |  | 6 |   const participantCount = (column?: string) =&gt; { | EXPECTED |
| — |  | 7 |     const query = db.from('wioa_participants').select('id', { count: 'exact', head: true }); | EXPECTED |
| — |  | 8 |     return column ? query.eq(column, true) : query; | EXPECTED |
| — |  | 9 |   }; | EXPECTED |
| — |  | 10 |   const [total, veterans, dislocated, lowIncome, youth, reports, alerts] = await Promise.all([ | EXPECTED |
| — |  | 11 |     participantCount(), participantCount('is_veteran'), participantCount('is_dislocated_worker'), | EXPECTED |
| — |  | 12 |     participantCount('is_low_income'), participantCount('is_youth'), | EXPECTED |
| — |  | 13 |     db.from('wioa_compliance_reports').select('report_type,due_date,status').order('due_date', { ascending: true }).limit(20), | EXPECTED |
| — |  | 14 |     db.from('compliance_alerts').select('id,alert_type,severity,message,description').eq('resolved', false).order('created_at', { ascending: false }).limit(20), | EXPECTED |
| — |  | 15 |   ]); | EXPECTED |
| — |  | 16 |   if ([total, veterans, dislocated, lowIncome, youth, reports, alerts].some((result) =&gt; result.error)) { | EXPECTED |
| — |  | 17 |     throw new Error('WIOA_DASHBOARD_UNAVAILABLE'); | EXPECTED |
| — |  | 18 |   } | EXPECTED |
| — |  | 19 |   if ([total, veterans, dislocated, lowIncome, youth].some((result) =&gt; result.count == null)) { | EXPECTED |
| — |  | 20 |     throw new Error('WIOA_PARTICIPANT_COUNTS_UNAVAILABLE'); | EXPECTED |
| — |  | 21 |   } | EXPECTED |
| — |  | 22 |   return { | EXPECTED |
| — |  | 23 |     participants: { | EXPECTED |
| — |  | 24 |       total: total.count!, veterans: veterans.count!, dislocatedWorkers: dislocated.count!, | EXPECTED |
| — |  | 25 |       lowIncome: lowIncome.count!, youth: youth.count!, | EXPECTED |
| — |  | 26 |       // There is no participant -&gt; placement/enrollment FK. Do not invent an | EXPECTED |
| — |  | 27 |       // outcome relation or treat enrollment completion as an earned credential. | EXPECTED |
| — |  | 28 |       placements: null, completions: null, | EXPECTED |
| — |  | 29 |     }, | EXPECTED |
| — |  | 30 |     reports: (reports.data ?? []).map((report) =&gt; ({ | EXPECTED |
| — |  | 31 |       reportType: report.report_type, dueDate: report.due_date, status: report.status ?? 'unknown', | EXPECTED |
| — |  | 32 |     })), | EXPECTED |
| — |  | 33 |     alerts: (alerts.data ?? []).map((alert) =&gt; ({ | EXPECTED |
| — |  | 34 |       id: alert.id, type: alert.alert_type, severity: alert.severity, | EXPECTED |
| — |  | 35 |       message: alert.message &#124;&#124; alert.description &#124;&#124; 'Compliance alert', | EXPECTED |
| — |  | 36 |     })), | EXPECTED |
| — |  | 37 |   }; | EXPECTED |
| — |  | 38 | } | EXPECTED |

## tests/unit/wioa-dashboard-storage.test.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 1 | import { afterEach, expect, it } from 'vitest'; | EXPECTED |
| — |  | 2 | import { cleanup, render, screen } from '@testing-library/react'; | EXPECTED |
| — |  | 3 | import { loadWioaDashboard } from '@/lib/compliance/wioa-dashboard'; | EXPECTED |
| — |  | 4 | import WIOAComplianceDashboard from '@/components/admin/WIOAComplianceDashboard'; | EXPECTED |
| — |  | 5 |  | EXPECTED |
| — |  | 6 | afterEach(cleanup); | EXPECTED |
| — |  | 7 | function database(fail = false) { | EXPECTED |
| — |  | 8 |   const calls: Array&lt;{ table: string; columns?: string; filter?: string }&gt; = []; | EXPECTED |
| — |  | 9 |   const columns: Record&lt;string, string[]&gt; = { | EXPECTED |
| — |  | 10 |     wioa_participants: ['id', 'is_veteran', 'is_dislocated_worker', 'is_low_income', 'is_youth'], | EXPECTED |
| — |  | 11 |     wioa_compliance_reports: ['report_type', 'due_date', 'status'], | EXPECTED |
| — |  | 12 |     compliance_alerts: ['id', 'alert_type', 'severity', 'message', 'description', 'resolved', 'created_at'], | EXPECTED |
| — |  | 13 |   }; | EXPECTED |
| — |  | 14 |   const db = { from(table: string) { | EXPECTED |
| — |  | 15 |     const call = { table } as (typeof calls)[number]; calls.push(call); | EXPECTED |
| — |  | 16 |     const builder = { | EXPECTED |
| — |  | 17 |       select(value: string) { call.columns = value; for (const column of value.split(',')) expect(columns[table]).toContain(column.trim()); return builder; }, | EXPECTED |
| — |  | 18 |       eq(column: string) { expect(columns[table]).toContain(column); call.filter = column; return builder; }, | EXPECTED |
| — |  | 19 |       order(column: string) { expect(columns[table]).toContain(column); return builder; }, | EXPECTED |
| — |  | 20 |       limit() { return builder; }, | EXPECTED |
| — |  | 21 |       then(resolve: (value: unknown) =&gt; unknown) { | EXPECTED |
| — |  | 22 |         return Promise.resolve(resolve({ | EXPECTED |
| — |  | 23 |           error: fail ? { message: 'unavailable' } : null, | EXPECTED |
| — |  | 24 |           count: call.filter ? 25 : 1200, | EXPECTED |
| — |  | 25 |           data: table === 'wioa_compliance_reports' ? [{ report_type: 'quarterly', due_date: null, status: 'draft' }] : [], | EXPECTED |
| — |  | 26 |         })); | EXPECTED |
| — |  | 27 |       }, | EXPECTED |
| — |  | 28 |     }; return builder; | EXPECTED |
| — |  | 29 |   } }; | EXPECTED |
| — |  | 30 |   return { db: db as unknown as Parameters&lt;typeof loadWioaDashboard&gt;[0], calls }; | EXPECTED |
| — |  | 31 | } | EXPECTED |
| — |  | 32 |  | EXPECTED |
| — |  | 33 | it('queries actual WIOA columns and returns exact counts beyond the former 500-row limit', async () =&gt; { | EXPECTED |
| — |  | 34 |   const { db, calls } = database(); | EXPECTED |
| — |  | 35 |   const result = await loadWioaDashboard(db); | EXPECTED |
| — |  | 36 |   expect(result.participants).toMatchObject({ total: 1200, youth: 25, placements: null, completions: null }); | EXPECTED |
| — |  | 37 |   expect(calls).toContainEqual(expect.objectContaining({ table: 'wioa_participants', filter: 'is_youth' })); | EXPECTED |
| — |  | 38 |   expect(result.reports[0]).not.toHaveProperty('submissionMethod'); | EXPECTED |
| — |  | 39 | }); | EXPECTED |
| — |  | 40 |  | EXPECTED |
| — |  | 41 | it('rejects a failed query rather than presenting zero participants or empty reports as success', async () =&gt; { | EXPECTED |
| — |  | 42 |   await expect(loadWioaDashboard(database(true).db)).rejects.toThrow('WIOA_DASHBOARD_UNAVAILABLE'); | EXPECTED |
| — |  | 43 | }); | EXPECTED |
| — |  | 44 |  | EXPECTED |
| — |  | 45 | it('shows unavailable outcome rates and missing due dates honestly', async () =&gt; { | EXPECTED |
| — |  | 46 |   render(&lt;WIOAComplianceDashboard {...await loadWioaDashboard(database().db)} /&gt;); | EXPECTED |
| — |  | 47 |   expect(screen.getAllByText('Unavailable')).toHaveLength(2); | EXPECTED |
| — |  | 48 |   expect(screen.getByText('1,200')).toBeInTheDocument(); | EXPECTED |
| — |  | 49 |   expect(screen.getByText('Due date not recorded')).toBeInTheDocument(); | EXPECTED |
| — |  | 50 |   expect(screen.queryByText('0%')).not.toBeInTheDocument(); | EXPECTED |
| — |  | 51 | }); | EXPECTED |

