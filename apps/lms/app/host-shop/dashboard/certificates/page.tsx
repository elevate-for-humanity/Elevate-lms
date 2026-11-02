import Link from 'next/link';
import { Award, Download } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopStudentCertificates } from '@/lib/certificates/host-shop-students';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Student Certificates | Elevate Host Shop', robots: { index: false, follow: false } };

export default async function HostShopCertificatesPage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const { board, certificates } = await getHostShopStudentCertificates(user.id);
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
    <div><Link href="/host-shop/dashboard" className="text-sm font-bold text-blue-800">Back to dashboard</Link><p className="mt-5 text-sm font-bold text-slate-600">{board.partner.name}</p><h1 className="mt-2 text-3xl font-black text-slate-950">Student certificates</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">Elevate certificates for your assigned students. New applications appear here automatically once they are linked to your shop. Download a copy for your shop records or print it for the student.</p></div>
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-slate-700">Each certificate shows the current record: application received, host-site assignment, or enrollment. Completion credentials are issued separately after program requirements are met.</div>
    {certificates.length ? <section aria-label="Student certificates" className="grid gap-4 md:grid-cols-2">{certificates.map(record => <article key={record.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Award className="h-8 w-8 text-red-700" aria-hidden="true"/><h2 className="mt-4 text-xl font-black text-slate-950">{record.studentName}</h2><p className="mt-1 font-semibold text-slate-800">{record.title}</p><p className="mt-2 text-sm text-slate-600">{record.program}</p><p className="mt-1 text-sm text-slate-600">{record.shopName}</p><a href={`/api/host-shop/student-certificates/${record.id}`} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-blue-800 px-5 py-3 font-bold text-white hover:bg-blue-900"><Download className="h-4 w-4" aria-hidden="true"/>Download certificate<span className="sr-only"> for {record.studentName}</span></a></article>)}</section> : <section className="rounded-2xl border border-slate-200 bg-white p-8"><h2 className="text-xl font-bold">No assigned student records yet</h2><p className="mt-3 text-slate-600">Certificates appear automatically after Elevate links an application or student placement to your shop.</p><Link href="/host-shop/dashboard/apprentices" className="mt-5 inline-flex min-h-11 items-center font-bold text-blue-800">View your students</Link></section>}
  </main>;
}
