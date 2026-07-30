'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';

const REQUIRED_DOCS = [
  { type: 'government_id', label: 'Government-Issued ID', desc: 'Driver\'s license, state ID, or passport', required: true },
  { type: 'high_school_diploma', label: 'High School Diploma or GED', desc: 'Official transcript or diploma copy', required: true },
  { type: 'social_security_card', label: 'Social Security Card', desc: 'For I-9 verification', required: true },
  { type: 'drivers_license', label: 'Driver\'s License', desc: 'For background check and employment eligibility', required: false },
  { type: 'tb_test', label: 'TB Test Results', desc: 'Within the last 6 months', required: false },
  { type: 'background_check', label: 'Background Check Authorization', desc: 'Signed consent form — provided by Elevate', required: false },
];

export default function DocumentsPage() {
  const [email, setEmail] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [app, setApp] = useState<any>(null);
  const [error, setError] = useState('');

  const lookupApp = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/enrollment-v2/apply?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Application not found');
      setApp(data);
      setApplicationId(data.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/enrollment-v2/apply" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-3xl font-bold mb-2">Digital Binder</h1>
          <p className="text-slate-300">Upload your documents to complete enrollment. All uploads are secure and encrypted.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {!app ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold mb-4">Find Your Application</h2>
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lookupApp()}
                placeholder="Enter the email you used on your application"
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={lookupApp}
                disabled={loading || !email}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Find Application'}
              </button>
            </div>
            {error && (
              <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className={`rounded-2xl p-6 ${app.binder_status === 'complete' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center gap-3 mb-2">
                {app.binder_status === 'complete' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <Clock className="w-6 h-6 text-blue-600" />
                )}
                <h2 className="text-xl font-bold">
                  {app.binder_status === 'complete' ? 'Documents Complete!' : 'Document Checklist'}
                </h2>
              </div>
              <p className="text-sm text-slate-600">
                Application: <strong>{app.confirmation_number}</strong> — {app.program_name}
              </p>
            </div>

            {/* Document List */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="font-bold text-lg">Required Documents</h3>
                <p className="text-sm text-slate-500 mt-1">Upload clear photos or scans of each document. PDFs, JPGs, and PNGs accepted.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {REQUIRED_DOCS.map((doc) => {
                  const uploaded = app.binder_documents?.find((d: any) => d.document_type === doc.type);
                  return (
                    <div key={doc.type} className="p-5 flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        uploaded ? 'bg-green-100' : doc.required ? 'bg-orange-100' : 'bg-slate-100'
                      }`}>
                        {uploaded ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <FileText className={`w-5 h-5 ${doc.required ? 'text-orange-500' : 'text-slate-400'}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold">{doc.label}</p>
                          {doc.required && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Required</span>}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{doc.desc}</p>
                        {uploaded && (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            Uploaded: {uploaded.file_name || uploaded.document_type}
                          </p>
                        )}
                      </div>
                      <div>
                        {uploaded ? (
                          <span className="text-xs text-green-600 font-medium">Uploaded</span>
                        ) : (
                          <button className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <Upload className="w-3 h-3" /> Upload
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <Link href="/enrollment-v2/funding" className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors">
                Continue to Funding →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
