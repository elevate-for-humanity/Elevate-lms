export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, Upload, Download, CheckCircle, Clock, AlertCircle, Book, Award, Users, Calendar } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Student Binder ${id} | Admin | Elevate For Humanity`,
  };
}

export default async function StudentBinderPage({ params }: PageProps) {
  const { id } = await params;
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await createClient();

  // Fetch student info
  const { data: student } = await db
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!student) {
    notFound();
  }

  // Fetch all documents for this student
  const { data: documents, error: documentsError } = await db
    .from('documents')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  // Fetch enrollment info
  const { data: enrollment, error: enrollmentError } = await db
    .from('program_enrollments')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  // Fetch certificates
  const { data: certificates, error: certificatesError } = await db
    .from('certificates')
    .select('*')
    .eq('student_id', id)
    .order('issued_at', { ascending: false });

  // Fetch attendance
  const { data: attendance, error: attendanceError } = await db
    .from('attendance')
    .select('*')
    .eq('student_id', id)
    .order('check_in_time', { ascending: false })
    .limit(30);

  if (documentsError || enrollmentError || certificatesError || attendanceError) throw new Error('Student binder data could not load.');

  // Group documents by category
  const documentsByCategory = documents?.reduce((acc: any, doc: any) => {
    const category = doc.document_type?.replaceAll('_', ' ') || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {}) || {};

  // Applications can precede enrollment. Build the same requirements view
  // from the saved intake record instead of creating a disconnected binder
  // table, and never treat an unverified upload as a completed requirement.
  const { data: intakeApplication } = !enrollment?.program_slug
    ? await db.from('applications')
        .select('program_slug,program_interest')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };
  const binderProgram = enrollment?.program_slug ||
    intakeApplication?.program_slug || intakeApplication?.program_interest || null;
  const requirementQuery = binderProgram
    ? await db.from('apprentice_document_types').select('document_type,name,is_required')
        .eq('program_slug', binderProgram).eq('is_required', true)
    : { data: null, error: null };
  if (requirementQuery.error) throw new Error('Document requirements could not load.');
  const requirements = requirementQuery.data ?? [];
  const requirementsAvailable = requirements.length > 0;
  const missingDocs = requirements.filter(requirement => !(documents ?? []).some(doc =>
    doc.document_type === requirement.document_type && ['approved','verified','accepted'].includes(doc.verification_status || doc.status)
  )).map(requirement => requirement.name || requirement.document_type);

  return (
    <div className="min-w-0 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/students" className="hover:text-blue-600">Students</Link>
            <span>/</span>
            <span>{student.full_name || student.email}</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Digital Binder</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Student Digital Binder
          </h1>
          <p className="text-gray-600 mt-1">
            {student.email} • {student.phone || 'No phone'} • Enrolled: {enrollment?.created_at ? new Date(enrollment.created_at).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/documents/upload?user_id=${id}`} className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-white">Upload Document</Link>
          <Link href={`/students/${id}`} className="min-h-11 rounded-lg border px-4 py-2">Student record</Link>
        </div>
      </div>

      {/* Compliance Status */}
      {missingDocs.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Missing Required Documents</p>
            <p className="text-sm text-yellow-700 mt-1">
              {missingDocs.join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{documents?.length || 0}</p>
              <p className="text-sm text-gray-600">Documents</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{certificates?.length || 0}</p>
              <p className="text-sm text-gray-600">Certificates</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{attendance?.length || 0}</p>
              <p className="text-sm text-gray-600">Attendance Records</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{requirementsAvailable ? missingDocs.length : 'Unavailable'}</p>
              <p className="text-sm text-gray-600">Missing Docs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Documents by Category */}
        <div className="col-span-2 space-y-6">
          {Object.entries(documentsByCategory).map(([category, docs]: [string, any]) => (
            <div key={category} className="bg-white rounded-lg border">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">{category}</h2>
                <span className="text-sm text-gray-500">{docs.length} files</span>
              </div>
              <div className="divide-y">
                {docs.map((doc: any) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : ''}
                          {' • '}
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {['verified','approved','accepted'].includes(doc.status) && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Verified
                        </span>
                      )}
                      <Link href={`/documents/review/${doc.id}`} className="text-blue-600 hover:underline text-sm">Review file</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(documentsByCategory).length === 0 && (
            <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No documents uploaded</p>
              <p className="text-sm">Upload enrollment documents to start the binder</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Student Info */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Student Information</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-500">Program</p>
                <p className="font-medium">{enrollment?.program_name || 'Not enrolled'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  student.status === 'active' ? 'bg-green-100 text-green-700' :
                  student.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {student.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">
                  {enrollment?.start_date ? new Date(enrollment.start_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expected Completion</p>
                <p className="font-medium">
                  {enrollment?.expected_end_date ? new Date(enrollment.expected_end_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Certificates */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Award className="w-5 h-5" />
                Certificates
              </h2>
            </div>
            <div className="divide-y">
              {certificates?.length ? (
                certificates.map((cert: any) => (
                  <div key={cert.id} className="p-4">
                    <p className="font-medium">{cert.name}</p>
                    <p className="text-sm text-gray-500">
                      Issued: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}
                    </p>
                    <button className="mt-2 text-blue-600 hover:underline text-sm flex items-center gap-1">
                      <Download className="w-3 h-3" /> Download
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No certificates issued
                </div>
              )}
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Attendance
              </h2>
            </div>
            <div className="divide-y">
              {attendance?.length ? (
                attendance.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="p-3 flex items-center justify-between">
                    <span className="text-sm">{new Date(a.check_in_time).toLocaleDateString()}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      a.status === 'present' ? 'bg-green-100 text-green-700' :
                      a.status === 'absent' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {a.status?.toUpperCase()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No attendance records
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
