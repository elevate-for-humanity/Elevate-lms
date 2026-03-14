import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Users, Award, FileText, Layers, ClipboardCheck, Upload } from 'lucide-react';
import { mapProgramRow, type RawProgramRow } from '@/lib/domain';

export const metadata: Metadata = {
  title: 'Program Dashboard | Elevate Admin',
};

export default async function ProgramDashboardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) redirect('/unauthorized');

  // Load program — try by code first, then slug
  const { data: rawProgram } = await db.from('programs').select('*').eq('code', code).single();
  if (!rawProgram) {
    const { data: bySlug } = await db.from('programs').select('*').eq('slug', code).single();
    if (!bySlug) return <div className="p-8"><h1 className="text-2xl font-bold">Program not found</h1><p className="text-gray-600 mt-2">No program with code &quot;{code}&quot;</p></div>;
    redirect(`/admin/programs/${bySlug.code || bySlug.slug}/dashboard`);
  }
  const program = mapProgramRow(rawProgram as RawProgramRow);

  // Counts
  const { count: courseCount } = await db.from('training_courses').select('id', { count: 'exact', head: true }).eq('program_id', program.id);
  const { count: enrollmentCount } = await db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('program_id', program.id);
  const { count: lessonCount } = await db.from('training_lessons').select('id', { count: 'exact', head: true });
  const { count: certCount } = await db.from('certificates').select('id', { count: 'exact', head: true }).eq('program_id', program.id);

  const sections = [
    { name: 'Manage Training', href: `/admin/programs/${code}/manage`, icon: Layers, count: null, desc: 'Attach internal courses and external partner training', highlight: true },
    { name: 'Courses', href: `/admin/programs/${code}/courses`, icon: BookOpen, count: courseCount || 0, desc: 'View courses attached to this program' },
    { name: 'Enrollments', href: `/admin/programs/${code}/enrollments`, icon: Users, count: enrollmentCount || 0, desc: 'View and manage student enrollments' },
    { name: 'Certificates', href: `/admin/programs/${code}/certificates`, icon: Award, count: certCount || 0, desc: 'Issue and manage certificates' },
    { name: 'Completion Rules', href: `/admin/programs/${code}/completion`, icon: ClipboardCheck, count: null, desc: 'Configure completion criteria' },
    { name: 'Media', href: `/admin/programs/${code}/media`, icon: Upload, count: null, desc: 'Manage videos, audio, and diagrams' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm mb-4">
        <ol className="flex items-center space-x-2 text-gray-500">
          <li><Link href="/admin" className="hover:text-brand-blue-600">Admin</Link></li>
          <li>/</li>
          <li><Link href="/admin/programs" className="hover:text-brand-blue-600">Programs</Link></li>
          <li>/</li>
          <li className="text-gray-900 font-medium">{program.title}</li>
        </ol>
      </nav>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{program.title}</h1>
          <p className="text-gray-600 mt-1">{program.category} &middot; {program.durationWeeks ?? '—'} weeks &middot; {program.estimatedHours ?? '—'} hours</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${program.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {program.status}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Courses</p>
          <p className="text-2xl font-bold">{courseCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Enrollments</p>
          <p className="text-2xl font-bold">{enrollmentCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Certificates</p>
          <p className="text-2xl font-bold">{certCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Lessons</p>
          <p className="text-2xl font-bold">{lessonCount || 0}</p>
        </div>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <Link
            key={section.name}
            href={section.href}
            className={`rounded-lg border p-6 hover:shadow-sm transition-all group ${
              (section as any).highlight
                ? 'bg-brand-blue-600 border-brand-blue-600 hover:bg-brand-blue-700 hover:border-brand-blue-700'
                : 'bg-white hover:border-brand-blue-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <section.icon className={`w-5 h-5 ${(section as any).highlight ? 'text-white' : 'text-brand-blue-600'}`} />
              <h3 className={`font-semibold ${(section as any).highlight ? 'text-white' : 'text-gray-900 group-hover:text-brand-blue-600'}`}>{section.name}</h3>
              {section.count !== null && (
                <span className={`ml-auto text-sm ${(section as any).highlight ? 'text-brand-blue-200' : 'text-gray-400'}`}>{section.count}</span>
              )}
            </div>
            <p className={`text-sm ${(section as any).highlight ? 'text-brand-blue-100' : 'text-gray-500'}`}>{section.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
