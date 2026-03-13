import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Clock,
  AlertCircle,
  User,
  Building2,
  MapPin,
  Filter,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Review Queue | Admin',
  description: 'Review pending documents, transfer hours, and routing decisions',
};

export const dynamic = 'force-dynamic';

const QUEUE_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  document_review: { label: 'Document Review', icon: FileText, color: 'blue' },
  transcript_review: { label: 'Transcript Review', icon: FileText, color: 'blue' },
  partner_docs_review: { label: 'Partner Documents', icon: Building2, color: 'green' },
  routing_review: { label: 'Shop Routing', icon: MapPin, color: 'orange' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'yellow' },
  in_progress: { label: 'In Progress', color: 'blue' },
  resolved: { label: 'Resolved', color: 'green' },
  escalated: { label: 'Escalated', color: 'red' },
};

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ queue_type?: string; status?: string }>;
}) {
  const { queue_type, status: statusParam } = await searchParams;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check admin role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Build query
  let query = db
    .from('review_queue')
    .select('*')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });

  if (queue_type) {
    query = query.eq('queue_type', queue_type);
  }

  if (statusParam) {
    query = query.eq('status', statusParam);
  } else {
    query = query.in('status', ['open', 'in_progress']);
  }

  const { data: items, error } = await query.limit(100);

  // Get counts by queue type
  const { data: counts } = await db
    .from('review_queue')
    .select('queue_type')
    .in('status', ['open', 'in_progress']);

  const countsByType: Record<string, number> = {};
  (counts || []).forEach((item: any) => {
    countsByType[item.queue_type] = (countsByType[item.queue_type] || 0) + 1;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Hero Image */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
        <p className="text-gray-600">
          Items requiring manual review from automated processing
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/admin/review-queue"
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            !queue_type
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({Object.values(countsByType).reduce((a, b) => a + b, 0)})
        </Link>
        {Object.entries(QUEUE_TYPE_CONFIG).map(([type, config]) => (
          <Link
            key={type}
            href={`/admin/review-queue?queue_type=${type}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              queue_type === type
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {config.label} ({countsByType[type] || 0})
          </Link>
        ))}
      </div>

      {/* Queue Items */}
      {error ? (
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 text-brand-red-700">
          Error loading queue
        </div>
      ) : !items || items.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Queue Empty</h3>
          <p className="text-gray-600">No items require review at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item: any) => {
            const config = QUEUE_TYPE_CONFIG[item.queue_type] || {
              label: item.queue_type,
              icon: FileText,
              color: 'gray',
            };
            const statusConfig = STATUS_CONFIG[item.status] || {
              label: item.status,
              color: 'gray',
            };
            const Icon = config.icon;

            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${config.color}-100`}
                    >
                      <Icon className={`w-5 h-5 text-${config.color}-600`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {config.label}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium bg-${statusConfig.color}-100 text-${statusConfig.color}-700`}
                        >
                          {statusConfig.label}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          Priority {item.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {item.subject_type}: {item.subject_id.slice(0, 8)}...
                      </p>
                      {item.reasons && item.reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.reasons.map((reason: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-xs bg-brand-red-50 text-brand-red-700"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/admin/review-queue/${item.id}`}
                      className="px-3 py-1.5 bg-brand-blue-600 text-white text-sm font-medium rounded-lg hover:bg-brand-blue-700"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
