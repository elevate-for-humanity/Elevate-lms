import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Reports',
  description: 'Reports page content.',
};

export default async function ReportsPage() {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/reports');

  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-blue-200">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}

