import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/program-holder/how-to-use' },
  title: 'How to Use | Elevate For Humanity',
  description: 'Guide for using the program holder dashboard.',
};

export default async function HowToUsePage() {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const guides = [
    { title: 'Getting Started', description: 'Learn the basics of the program holder dashboard', icon: '🚀' },
    { title: 'Managing Courses', description: 'Create, edit, and publish courses', icon: '📚' },
    { title: 'Tracking Participants', description: 'Monitor participant progress and outcomes', icon: '📊' },
    { title: 'Reporting', description: 'Generate and export reports', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/program-holder" className="hover:text-primary">Program Holder</Link></li><li>/</li><li className="text-gray-900 font-medium">How to Use</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">How to Use</h1>
          <p className="text-gray-600 mt-2">Guides and tutorials for program holders</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.map((guide, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md cursor-pointer">
              <span className="text-3xl mb-4 block">{guide.icon}</span>
              <h3 className="font-semibold mb-2">{guide.title}</h3>
              <p className="text-sm text-gray-500">{guide.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-brand-blue-50 rounded-lg p-6">
          <h2 className="font-semibold mb-2">Need Help?</h2>
          <p className="text-sm text-gray-600 mb-4">Contact our support team for assistance with your program.</p>
          <Link href="/support" className="text-brand-blue-600 hover:text-brand-blue-800 text-sm font-medium">Contact Support →</Link>
        </div>
      </div>
    </div>
  );
}
