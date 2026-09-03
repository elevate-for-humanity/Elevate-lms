import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Users, Award, ClipboardCheck, Upload } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Program Dashboard | Elevate Admin' };

export default async function ProgramDashboardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await requireAdmin();
  const db = await requireAdminClient();

  const { data: program } = await db
    .from('programs')
    .select('id,title,code,slug,category,estimated_weeks,estimated_hours,status')
    .or(`code.eq.${code},slug.eq.${code}`)
    .maybeSingle();
  if (!program) {
    return <div className="p-8"><h1 className="text-2xl font-bold">Program not found</h1><p className="mt-2 text-slate-600">No program with code or slug &quot;{code}&quot;.</p></div>;
  }

  const { data: courses, error: coursesError } = await db
    .from('courses')
    .select('id')
    .eq('program_id', program.id);
  if (coursesError) throw coursesError;
  const courseIds = (courses ?? []).map((course) => course.id);

  const [{ count: enrollmentCount }, { count: certCount }, lessonResult] = await Promise.all([
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('program_id', program.id),
    db.from('certificates').select('id', { count: 'exact', head: true }).eq('program_id', program.id),
    courseIds.length
      ? db.from('course_lessons').select('id', { count: 'exact', head: true }).in('course_id', courseIds)
      : Promise.resolve({ count: 0, error: null }),
  ]);
  if (lessonResult.error) throw lessonResult.error;

  const courseCount = courseIds.length;
  const lessonCount = lessonResult.count ?? 0;
  const sections = [
    { name: 'Courses', href: `/programs/${code}/courses`, icon: BookOpen, count: courseCount, desc: 'Build and manage canonical courses' },
    { name: 'Enrollments', href: `/programs/${code}/enrollments`, icon: Users, count: enrollmentCount ?? 0, desc: 'View and manage learner enrollments' },
    { name: 'Certificates', href: `/programs/${code}/certificates`, icon: Award, count: certCount ?? 0, desc: 'Review issued completion credentials' },
    { name: 'Completion Rules', href: `/programs/${code}/completion`, icon: ClipboardCheck, count: null, desc: 'Review program completion criteria' },
    { name: 'Media', href: `/programs/${code}/media`, icon: Upload, count: null, desc: 'Review canonical lesson media and missing assets' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-sm text-slate-600"><Link href="/" className="hover:underline">Admin</Link><span className="px-2">/</span><Link href="/programs" className="hover:underline">Programs</Link><span className="px-2">/</span><span>{program.title}</span></nav>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-slate-950">{program.title}</h1><p className="mt-1 text-slate-600">{program.category || 'Program'} · {program.estimated_weeks || '—'} weeks · {program.estimated_hours || '—'} hours</p></div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${program.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{program.status || 'draft'}</span>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[['Courses', courseCount], ['Enrollments', enrollmentCount ?? 0], ['Certificates', certCount ?? 0], ['Lessons', lessonCount]].map(([label, value]) => <div key={String(label)} className="rounded-lg border bg-white p-4"><p className="text-sm text-slate-600">{label}</p><p className="text-2xl font-bold">{value}</p></div>)}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => <Link key={section.name} href={section.href} className="group rounded-lg border bg-white p-6 hover:border-brand-blue-300 hover:shadow-sm"><div className="mb-2 flex items-center gap-3"><section.icon className="h-5 w-5 text-brand-blue-600" /><h2 className="font-semibold text-slate-900 group-hover:text-brand-blue-700">{section.name}</h2>{section.count !== null ? <span className="ml-auto text-sm text-slate-600">{section.count}</span> : null}</div><p className="text-sm text-slate-600">{section.desc}</p></Link>)}
      </div>
    </div>
  );
}
