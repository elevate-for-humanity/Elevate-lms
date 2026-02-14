import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/employer/post-job' },
  title: 'Post a Job | Elevate For Humanity',
  description: 'Post job opportunities for program graduates.',
};

export default async function PostJobPage() {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/employer" className="hover:text-primary">Employer</Link></li><li>/</li><li className="text-gray-900 font-medium">Post Job</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Post a Job</h1>
          <p className="text-gray-600 mt-2">Create a new job posting for qualified candidates</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form className="space-y-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label><input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="e.g., Software Developer" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Description *</label><textarea className="w-full border rounded-lg px-3 py-2" rows={5} placeholder="Job description and responsibilities" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label><select className="w-full border rounded-lg px-3 py-2"><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Location</label><input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="City, State" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label><input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="e.g., $50,000 - $70,000" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label><input type="date" className="w-full border rounded-lg px-3 py-2" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label><textarea className="w-full border rounded-lg px-3 py-2" rows={3} placeholder="Required skills and qualifications" /></div>
            <div className="flex gap-4 pt-4 border-t">
              <button type="submit" className="flex-1 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Post Job</button>
              <Link href="/employer/opportunities" className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
