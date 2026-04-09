import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EmployerProgramDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .single();

  if (!program) notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <nav className="text-sm text-gray-500">
          <ol className="flex items-center gap-2">
            <li><Link href="/employer/dashboard" className="hover:text-gray-900">Employer</Link></li>
            <li>/</li>
            <li><Link href="/employer/dashboard" className="hover:text-gray-900">Programs</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">{program.title}</li>
          </ol>
        </nav>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{program.title}</h1>
            {program.status && (
              <span className="inline-block mt-2 text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {program.status}
              </span>
            )}
          </div>
        </div>

        {program.image_url && (
          <img
            src={program.image_url}
            alt={program.title}
            className="w-full rounded-xl border object-cover max-h-64"
          />
        )}

        <div className="rounded-xl border p-6">
          <p className="text-gray-700 whitespace-pre-wrap">
            {program.description || 'No description available.'}
          </p>
        </div>

        {Array.isArray(program.eligibility) && program.eligibility.length > 0 && (
          <div className="rounded-xl border p-6">
            <h2 className="text-xl font-semibold mb-4">Eligibility Requirements</h2>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              {program.eligibility.map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {program.savings && (
          <div className="rounded-xl border p-6 bg-green-50 border-green-200">
            <h2 className="text-lg font-semibold text-green-900 mb-1">Employer Savings</h2>
            <p className="text-green-800">{program.savings}</p>
          </div>
        )}

        <div className="flex gap-4">
          <Link
            href="/employer/dashboard"
            className="px-5 py-2.5 rounded-lg border text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Back to Programs
          </Link>
        </div>
      </div>
    </div>
  );
}
