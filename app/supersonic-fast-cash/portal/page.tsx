import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Supersonic Fast Cash Portal | Elevate For Humanity',
  description: 'Elevate For Humanity - Supersonic Fast Cash Portal page',
};

import { logger } from '@/lib/logger';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, Calendar, DollarSign, Download } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ClientPortalPage() {
  const supabase = await createClient();


  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/supersonic-fast-cash/portal');
  }

  // Fetch user's documents
  const { data: documents, error: documentsError } = await supabase
    .from('tax_documents')
    .select('*')
    .eq('email', user.email)
    .order('created_at', { ascending: false });

  if (documentsError) {
    logger.error('Error fetching documents:', documentsError);
  }

  // Fetch user's appointments
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*')
    .eq('email', user.email)
    .order('appointment_date', { ascending: false });

  if (appointmentsError) {
    logger.error('Error fetching appointments:', appointmentsError);
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-black mb-2">
            Client Portal
          </h1>
          <p className="text-xl text-black">Welcome back, {user.email}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-black">
                  {documents?.length || 0}
                </div>
                <div className="text-sm text-black">Documents Uploaded</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-brand-green-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-black">
                  {appointments?.length || 0}
                </div>
                <div className="text-sm text-black">Appointments</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-black">$0</div>
                <div className="text-sm text-black">Estimated Refund</div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">
              Your Appointments
            </h2>
            <Link
              href="/supersonic-fast-cash/book-appointment"
              className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              Book New Appointment
            </Link>
          </div>

          {appointments && appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-brand-blue-600" />
                        <h3 className="font-semibold text-black">
                          {appointment.service_type}
                        </h3>
                        <span
                          className={`px-3 py-2 rounded-full text-sm font-medium ${
                            appointment.status === 'confirmed'
                              ? 'bg-brand-green-100 text-brand-green-700'
                              : appointment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : appointment.status === 'completed'
                                  ? 'bg-brand-blue-100 text-brand-blue-700'
                                  : 'bg-white text-black'
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-black">
                        <div>
                          <strong>Date:</strong>{' '}
                          {new Date(
                            appointment.appointment_date
                          ).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Time:</strong> {appointment.appointment_time}
                        </div>
                        <div>
                          <strong>Type:</strong> {appointment.appointment_type}
                        </div>
                        {appointment.location && (
                          <div>
                            <strong>Location:</strong> {appointment.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-black mb-4">No appointments scheduled</p>
              <Link
                href="/supersonic-fast-cash/book-appointment"
                className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
              >
                Book Your First Appointment
              </Link>
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">Your Documents</h2>
            <Link
              href="/supersonic-fast-cash/upload-documents"
              className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              Upload Documents
            </Link>
          </div>

          {documents && documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-lg p-6 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-brand-blue-600" />
                    <div>
                      <h3 className="font-semibold text-black">
                        {doc.file_name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-black mt-1">
                        <span>
                          {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span
                          className={`px-2 py-2 rounded text-xs font-medium ${
                            doc.status === 'reviewed'
                              ? 'bg-brand-green-100 text-brand-green-700'
                              : doc.status === 'pending_review'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-white text-black'
                          }`}
                        >
                          {doc.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white rounded-lg transition-colors" aria-label="Action button">
                    <Download className="w-5 h-5 text-black" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-black mb-4">No documents uploaded yet</p>
              <Link
                href="/supersonic-fast-cash/upload-documents"
                className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
              >
                Upload Your First Document
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
