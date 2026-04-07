import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getAdminDocumentUrl } from '@/lib/admin/document-access';
import Link from 'next/link';
import {
  FileText,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Clock,
  User,
  AlertTriangle,
  Download,
  Building2,
  MapPin,
CheckCircle, } from 'lucide-react';
import { ReviewActions } from './ReviewActions';

export const metadata: Metadata = {
  title: 'Review Item | Admin',
  description: 'Review and resolve queue item',
};

export const dynamic = 'force-dynamic';

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');


  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Fetch review queue item
  const { data: item, error } = await supabase
    .from('review_queue')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !item) {
    notFound();
  }

  // Fetch related data based on subject_type
  let subject: any = null;
  let extraction: any = null;
  let decisions: any[] = [];
  let document: any = null;
  let transferHours: any = null;
  let routingScores: any[] = [];

  if (item.subject_type === 'document') {
    const { data: doc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', item.subject_id)
      .single();

    // Generate signed URL via centralized admin document access
    if (doc?.file_path) {
      const url = await getAdminDocumentUrl({
        adminId: user.id,
        documentId: doc.id,
        context: 'review_queue',
      });
      if (url) doc.file_url = url;
    }

    document = doc;
    subject = doc;

    // Get extraction
    const { data: ext } = await supabase
      .from('documents_extractions')
      .select('*')
      .eq('document_id', item.subject_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    extraction = ext;
  } else if (item.subject_type === 'transfer_hours') {
    const { data: th } = await supabase
      .from('transfer_hours')
      .select('*, documents(*)')
      .eq('id', item.subject_id)
      .single();
    transferHours = th;
    subject = th;
    document = th?.documents;

    if (th?.extraction_id) {
      const { data: ext } = await supabase
        .from('documents_extractions')
        .select('*')
        .eq('id', th.extraction_id)
        .single();
      extraction = ext;
    }
  } else if (item.subject_type === 'application') {
    const { data: app } = await supabase
      .from('applications')
      .select('*, profiles!applications_user_id_fkey(full_name, email)')
      .eq('id', item.subject_id)
      .single();
    subject = app;

    // Get routing scores
    const { data: scores } = await supabase
      .from('shop_routing_scores')
      .select('*, shops(name, address, city)')
      .eq('application_id', item.subject_id)
      .order('rank', { ascending: true });
    routingScores = scores || [];
  } else if (item.subject_type === 'partner') {
    const { data: partner } = await supabase
      .from('partners')
      .select('*')
      .eq('id', item.subject_id)
      .single();
    subject = partner;
  }

  // Get decision history
  const { data: decisionHistory } = await supabase
    .from('automated_decisions')
    .select('*')
    .eq('subject_type', item.subject_type)
    .eq('subject_id', item.subject_id)
    .order('created_at', { ascending: false })
    .limit(10);
  decisions = decisionHistory || [];

  const queueTypeLabels: Record<string, string> = {
    document_review: 'Document Review',
    transcript_review: 'Transcript Review',
    partner_docs_review: 'Partner Documents',
    routing_review: 'Shop Routing',
    processing_error: 'Processing Error',
  };

  const statusColors: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-brand-blue-100 text-brand-blue-800',
    resolved: 'bg-brand-green-100 text-brand-green-800',
    escalated: 'bg-brand-red-100 text-brand-red-800',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Hero Image */}
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/review-queue"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Queue
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {queueTypeLabels[item.queue_type] || item.queue_type}
            </h1>
            <p className="text-gray-600">
              {item.subject_type}: {item.subject_id.slice(0, 8)}...
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[item.status]}`}>
            {item.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reasons */}
          {item.reasons && item.reasons.length > 0 && (
            <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-brand-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Review Reasons
              </h3>
              <ul className="space-y-1">
                {item.reasons.map((reason: string, i: number) => (
                  <li key={i} className="text-brand-red-700 text-sm">• {reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Document Preview */}
          {document && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Document
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Type:</strong> {document.document_type}</p>
                <p><strong>Status:</strong> {document.status}</p>
                <p><strong>Uploaded:</strong> {new Date(document.created_at).toLocaleString()}</p>
                {document.file_url && (
                  <a
                    href={document.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-brand-blue-600 hover:underline"
                  >
                    <Download className="w-4 h-4" />
                    Download Document
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Extraction Results */}
          {extraction && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Extraction Results</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">Confidence:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${extraction.confidence >= 0.8 ? 'bg-brand-green-500' : extraction.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-brand-red-500'}`}
                        style={{ width: `${(extraction.confidence || 0) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium">{((extraction.confidence || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    extraction.status === 'passed' ? 'bg-brand-green-100 text-brand-green-700' :
                    extraction.status === 'failed' ? 'bg-brand-red-100 text-brand-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {extraction.status}
                  </span>
                </div>
                {extraction.validation_errors?.length > 0 && (
                  <div>
                    <span className="text-gray-600 text-sm">Validation Errors:</span>
                    <ul className="mt-1 space-y-1">
                      {extraction.validation_errors.map((err: string, i: number) => (
                        <li key={i} className="text-brand-red-600 text-xs">• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <span className="text-gray-600 text-sm">Extracted Fields:</span>
                  <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-48">
                    {JSON.stringify(extraction.extracted, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Hours */}
          {transferHours && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Transfer Hours</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Institution:</span>
                  <p className="font-medium">{transferHours.source_institution}</p>
                </div>
                <div>
                  <span className="text-gray-600">State:</span>
                  <p className="font-medium">{transferHours.source_state}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Hours:</span>
                  <p className="font-medium">{transferHours.total_hours}</p>
                </div>
                <div>
                  <span className="text-gray-600">Approved Hours:</span>
                  <p className="font-medium">{transferHours.approved_hours || 'Pending'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Routing Recommendations */}
          {routingScores.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Routing Recommendations
              </h3>
              <div className="space-y-3">
                {routingScores.map((score: any, i: number) => (
                  <div key={score.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{score.shops?.name || 'Unknown Shop'}</p>
                      <p className="text-sm text-gray-600">{score.shops?.address}, {score.shops?.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{(score.total_score * 100).toFixed(0)}%</p>
                      <p className="text-xs text-gray-500">
                        {score.distance_miles ? `${score.distance_miles} mi` : 'No distance'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision History */}
          {decisions.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Decision History</h3>
              <div className="space-y-3">
                {decisions.map((decision: any) => (
                  <div key={decision.id} className="border-l-2 border-gray-200 pl-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        decision.decision === 'approved' ? 'bg-brand-green-100 text-brand-green-700' :
                        decision.decision === 'rejected' ? 'bg-brand-red-100 text-brand-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {decision.decision}
                      </span>
                      <span className="text-xs text-gray-500">
                        by {decision.actor} • {new Date(decision.created_at).toLocaleString()}
                      </span>
                    </div>
                    {decision.reason_codes?.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Reasons: {decision.reason_codes.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          <ReviewActions
            item={item}
            extraction={extraction}
            transferHours={transferHours}
            routingScores={routingScores}
            userId={user.id}
          />

          {/* Meta Info */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Queue Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Priority:</span>
                <span className="font-medium">{item.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              {item.assigned_to && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Assigned:</span>
                  <span className="font-medium">{item.assigned_to.slice(0, 8)}...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
