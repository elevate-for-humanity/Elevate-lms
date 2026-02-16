import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileText, XCircle, AlertTriangle, Download, Upload } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verify Eligibility | Admin',
  description: 'Verify WIOA participant eligibility.',
  robots: { index: false, follow: false },
};

const applicant = {
  name: 'Marcus Johnson',
  email: 'marcus@email.com',
  phone: '(555) 123-4567',
  dob: 'March 15, 1995',
  ssn: '***-**-1234',
  address: '3737 N Meridian St, Suite 200, Indianapolis, IN 46208',
  category: 'Adult',
  submitted: 'January 18, 2025',
};

const eligibilityCriteria = [
  { id: 1, name: 'Age Requirement (18+)', status: 'verified', notes: 'DOB verified via ID' },
  { id: 2, name: 'US Citizen/Work Authorization', status: 'verified', notes: 'US Citizen' },
  { id: 3, name: 'Selective Service Registration', status: 'verified', notes: 'Registered' },
  { id: 4, name: 'Income Eligibility', status: 'pending', notes: 'Awaiting pay stubs' },
  { id: 5, name: 'Residency Requirement', status: 'verified', notes: 'Indiana resident' },
];

const documents = [
  { name: 'Government ID', status: 'uploaded', date: 'Jan 18, 2025' },
  { name: 'Social Security Card', status: 'uploaded', date: 'Jan 18, 2025' },
  { name: 'Proof of Address', status: 'uploaded', date: 'Jan 18, 2025' },
  { name: 'Income Verification', status: 'missing', date: null },
];

export default function WIOAVerifyPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/admin/wioa/eligibility" className="flex items-center gap-2 text-gray-600 hover:text-brand-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Eligibility List
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Eligibility Verification</h1>
            <p className="text-gray-600">Review and verify WIOA eligibility for {applicant.name}</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Deny
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2">
              <span className="text-slate-400 flex-shrink-0">•</span>
              Approve
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Applicant Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{applicant.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{applicant.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{applicant.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium text-gray-900">{applicant.dob}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">SSN</p>
                  <p className="font-medium text-gray-900">{applicant.ssn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium text-gray-900">{applicant.category}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">{applicant.address}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Eligibility Checklist</h2>
              <div className="space-y-4">
                {eligibilityCriteria.map((criteria) => (
                  <div key={criteria.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      criteria.status === 'verified' ? 'bg-green-100' :
                      criteria.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      {criteria.status === 'verified' && <span className="text-slate-400 flex-shrink-0">•</span>}
                      {criteria.status === 'pending' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                      {criteria.status === 'failed' && <XCircle className="w-5 h-5 text-red-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{criteria.name}</p>
                      <p className="text-sm text-gray-500">{criteria.notes}</p>
                    </div>
                    <select className={`px-3 py-1 rounded-lg text-sm ${
                      criteria.status === 'verified' ? 'bg-green-100 text-green-700' :
                      criteria.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Notes</h2>
              <textarea
                rows={4}
                placeholder="Add verification notes..."
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Documents</h3>
              <div className="space-y-3">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className={`w-5 h-5 ${doc.status === 'uploaded' ? 'text-green-600' : 'text-red-500'}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        {doc.date && <p className="text-xs text-gray-500">{doc.date}</p>}
                      </div>
                    </div>
                    {doc.status === 'uploaded' ? (
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Download className="w-4 h-4 text-gray-500" />
                      </button>
                    ) : (
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Upload className="w-4 h-4 text-brand-blue-600" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Action Required</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Income verification document is missing. Request from applicant before approval.
                  </p>
                  <button className="mt-3 px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition">
                    Request Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
