import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/signatures/new' },
  title: 'Request Signature | Elevate For Humanity',
  description: 'Create a new signature request.',
};

export default async function NewSignaturePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li><Link href="/admin/signatures" className="hover:text-primary">Signatures</Link></li><li>/</li><li className="text-gray-900 font-medium">New</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Request Signature</h1>
          <p className="text-gray-600 mt-2">Send a document for electronic signature</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form className="space-y-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Document Title *</label><input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="Enter document title" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Upload Document *</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center"><p className="text-gray-500">Drag and drop or click to upload</p><p className="text-sm text-gray-400 mt-1">PDF, DOCX up to 10MB</p></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Signer Email *</label><input type="email" className="w-full border rounded-lg px-3 py-2" placeholder="signer@email.com" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Message (optional)</label><textarea className="w-full border rounded-lg px-3 py-2" rows={3} placeholder="Add a message for the signer" /></div>
            <div className="flex gap-4 pt-4 border-t">
              <button type="submit" className="flex-1 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Send for Signature</button>
              <Link href="/admin/signatures" className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
