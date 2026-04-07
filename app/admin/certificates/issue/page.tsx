import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { issueCertificate } from '../actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/certificates/issue',
  },
  title: 'Issue Certificate | Elevate For Humanity',
  description: 'Issue a certificate to a participant.',
};

export default async function IssueCertificatePage() {
  const supabase = await createClient();



  // Fetch certificate templates
  const { data: templates } = await supabase
    .from('certificate_templates')
    .select('id, name, description')
    .eq('status', 'active')
    .order('name');

  // Fetch courses for selection
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('status', 'published')
    .order('title');

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/admin/certificates" className="hover:text-primary">Certificates</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Issue</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Issue Certificate</h1>
          <p className="text-gray-600 mt-2">Create and issue a certificate to a participant</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form action={issueCertificate} className="space-y-6">
            {/* Recipient Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Recipient Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Name *
                  </label>
                  <input 
                    name="recipientName"
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="Full name as it appears on certificate"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input 
                    name="email"
                    type="email" 
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="recipient@email.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Certificate Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Template *
                  </label>
                  <select 
                    name="templateId"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    required
                  >
                    <option value="">Select a template</option>
                    {templates?.map((template: any) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                    {(!templates || templates.length === 0) && (
                      <option value="default">Default Certificate</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course / Program
                  </label>
                  <select name="courseId" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500">
                    <option value="">Select a course (optional)</option>
                    {courses?.map((course: any) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Issue Date *
                    </label>
                    <input 
                      name="issueDate"
                      type="date" 
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiration Date
                    </label>
                    <input 
                      name="expirationDate"
                      type="date" 
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Signed By
                  </label>
                  <input 
                    name="signedBy"
                    type="text" 
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="Director or authorized signer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea 
                    name="notes"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    rows={3}
                    placeholder="Any additional information to include"
                  />
                </div>
              </div>
            </div>

            {/* Notification Options */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Notification</h2>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input name="sendEmail" type="checkbox" className="w-4 h-4 text-brand-blue-600 rounded" defaultChecked />
                  <span className="text-sm text-gray-700">Send email notification to recipient</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 text-brand-blue-600 rounded" />
                  <span className="text-sm text-gray-700">Include PDF attachment</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t">
              <button 
                type="submit"
                className="flex-1 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700"
              >
                Issue Certificate
              </button>
              <Link 
                href="/admin/certificates"
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
