
'use client';

import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  User,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const REQUEST_TYPES = [
  { value: 'student_access', label: 'Student Access Request', description: 'Student requesting their own records' },
  { value: 'parent_access', label: 'Parent/Guardian Access', description: 'Parent or guardian requesting student records' },
  { value: 'third_party', label: 'Third Party Disclosure', description: 'External party requesting student records' },
  { value: 'transcript', label: 'Transcript Request', description: 'Official transcript request' },
  { value: 'verification', label: 'Enrollment Verification', description: 'Verify enrollment status' },
  { value: 'subpoena', label: 'Legal/Subpoena', description: 'Court order or legal request' },
  { value: 'directory_opt_out', label: 'Directory Opt-Out', description: 'Opt out of directory information' },
];

const RECORD_TYPES = [
  'Academic Transcripts',
  'Enrollment Records',
  'Attendance Records',
  'Grade Reports',
  'Financial Aid Records',
  'Disciplinary Records',
  'Health Records',
  'Special Education Records',
  'Directory Information',
];

const RELATIONSHIPS = [
  { value: 'self', label: 'Self (Student)' },
  { value: 'parent', label: 'Parent/Guardian' },
  { value: 'employer', label: 'Employer' },
  { value: 'school', label: 'Educational Institution' },
  { value: 'government', label: 'Government Agency' },
  { value: 'other', label: 'Other' },
];

export default function NewFerpaRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    request_type: '',
    requester_name: '',
    requester_email: '',
    requester_phone: '',
    requester_relationship: '',
    student_name: '',
    student_email: '',
    records_requested: [] as string[],
    purpose: '',
    priority: 'normal',
  });

  const handleRecordToggle = (record: string) => {
    setFormData(prev => ({
      ...prev,
      records_requested: prev.records_requested.includes(record)
        ? prev.records_requested.filter(r => r !== record)
        : [...prev.records_requested, record]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?next=/ferpa/requests/new');
        return;
      }

      const { error: insertError } = await supabase
        .from('ferpa_access_requests')
        .insert({
          ...formData,
          requester_id: user.id,
        });

      if (insertError) {
        throw insertError;
      }

      router.push('/ferpa/requests?success=created');
    } catch (err) {
      console.error('Error creating request:', err);
      setError('Failed to create request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/ferpa-page-10.jpg" alt="FERPA compliance" fill sizes="100vw" className="object-cover" priority />
      </section>
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Ferpa", href: "/ferpa" }, { label: "New" }]} />
      </div>
{/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/ferpa" className="hover:text-gray-700">FERPA Portal</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/ferpa/requests" className="hover:text-gray-700">Requests</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">New Request</span>
          </nav>

          <h1 className="text-2xl font-bold text-gray-900">New Access Request</h1>
          <p className="text-gray-600 mt-1">
            Submit a new FERPA records access request
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-brand-red-50 border border-brand-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-brand-red-800">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Request Type */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Type</h2>
            <div className="grid gap-3">
              {REQUEST_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.request_type === type.value
                      ? 'border-brand-blue-500 bg-brand-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="request_type"
                    value={type.value}
                    checked={formData.request_type === type.value}
                    onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                    className="mt-1"
                    required
                  />
                  <div>
                    <p className="font-medium text-gray-900">{type.label}</p>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Requester Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Requester Information
            </h2>
            <div className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="requester_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-brand-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="requester_name"
                    value={formData.requester_name}
                    onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="requester_relationship" className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship to Student <span className="text-brand-red-500">*</span>
                  </label>
                  <select
                    id="requester_relationship"
                    value={formData.requester_relationship}
                    onChange={(e) => setFormData({ ...formData, requester_relationship: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    required
                  >
                    <option value="">Select relationship</option>
                    {RELATIONSHIPS.map((rel) => (
                      <option key={rel.value} value={rel.value}>{rel.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="requester_email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-brand-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="requester_email"
                    value={formData.requester_email}
                    onChange={(e) => setFormData({ ...formData, requester_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="requester_phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="requester_phone"
                    value={formData.requester_phone}
                    onChange={(e) => setFormData({ ...formData, requester_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Student Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="student_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Student Name <span className="text-brand-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="student_name"
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="student_email" className="block text-sm font-medium text-gray-700 mb-1">
                  Student Email
                </label>
                <input
                  type="email"
                  id="student_email"
                  value={formData.student_email}
                  onChange={(e) => setFormData({ ...formData, student_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Records Requested */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Records Requested
            </h2>
            <p className="text-sm text-gray-600 mb-4">Select all record types being requested:</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {RECORD_TYPES.map((record) => (
                <label
                  key={record}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.records_requested.includes(record)
                      ? 'border-brand-blue-500 bg-brand-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.records_requested.includes(record)}
                    onChange={() => handleRecordToggle(record)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-900">{record}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Purpose */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Purpose of Request</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
                  Explain the purpose for this records request <span className="text-brand-red-500">*</span>
                </label>
                <textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="Describe why these records are being requested..."
                  required
                />
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority Level
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* FERPA Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">FERPA Compliance Notice</h3>
                <p className="text-sm text-amber-700 mt-1">
                  By submitting this request, you certify that you have a legitimate educational 
                  interest or legal right to access the requested records. Fraudulent requests 
                  may result in legal action. Requests will be processed within 45 days per FERPA requirements.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/ferpa/requests"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
