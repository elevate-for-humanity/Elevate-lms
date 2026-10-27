/**
 * /admin/applications/queue
 * 
 * Manual Review Queue Dashboard
 * Shows applications that require human review before enrollment
 */
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  ChevronRight,
  Filter,
  Users,
  FileText,
  CreditCard,
  GraduationCap
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Application Review Queue | Admin',
  description: 'Applications requiring manual review before enrollment',
};

export const dynamic = 'force-dynamic';

// Priority labels and colors
const PRIORITY_STYLES: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' },
  2: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
  3: { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  4: { label: 'Low', color: 'text-blue-600', bg: 'bg-blue-100' },
  5: { label: 'Normal', color: 'text-gray-600', bg: 'bg-gray-100' },
};

// Failure reason icons
const REASON_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'fee': CreditCard,
  'payment': CreditCard,
  'document': FileText,
  'paris': GraduationCap,
  'eligibility': Users,
  'funding': CreditCard,
  'account': User,
};

function getReasonIcon(reason: string): React.ComponentType<{ className?: string }> {
  const lower = reason.toLowerCase();
  for (const [key, Icon] of Object.entries(REASON_ICONS)) {
    if (lower.includes(key)) return Icon;
  }
  return AlertTriangle as React.ComponentType<{ className?: string }>;
}

function getDaysInQueue(queueEnteredAt: string | null): number {
  if (!queueEnteredAt) return 0;
  const entered = new Date(queueEnteredAt);
  const now = new Date();
  const diff = now.getTime() - entered.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string }>;
}) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const supabase = await createClient();
  const params = await searchParams;

  const filterStatus = params.status || 'pending';
  const filterPriority = params.priority || 'all';

  // Get queue items with application details
  let query = supabase
    .from('admin_applications_queue')
    .select(`
      *,
      applications (
        id,
        first_name,
        last_name,
        email,
        phone,
        program_interest,
        program_slug,
        status,
        enrollment_stage,
        failure_reasons,
        created_at,
        submitted_at,
        eligibility_status,
        payment_status,
        funding_source,
        queue_entered_at
      )
    `)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });

  if (filterStatus !== 'all') {
    query = query.eq('status', filterStatus);
  }

  const { data: queueItems, error } = await query;

  if (error) {
    console.error('Queue fetch error:', error);
  }

  // Filter by priority if specified
  let filteredItems = queueItems || [];
  if (filterPriority !== 'all') {
    filteredItems = filteredItems.filter(
      (item: any) => item.priority === parseInt(filterPriority)
    );
  }

  // Calculate stats
  const totalItems = (queueItems || []).length;
  const pendingItems = (queueItems || []).filter((i: any) => i.status === 'pending').length;
  const urgentItems = (queueItems || []).filter((i: any) => i.priority <= 2).length;
  const resolvedToday = (queueItems || []).filter((i: any) => {
    if (i.resolved_at) {
      const resolved = new Date(i.resolved_at);
      const today = new Date();
      return resolved.toDateString() === today.toDateString();
    }
    return false;
  }).length;

  // Group by priority
  const byPriority = {
    urgent: filteredItems.filter((i: any) => i.priority === 1),
    high: filteredItems.filter((i: any) => i.priority === 2),
    medium: filteredItems.filter((i: any) => i.priority === 3),
    low: filteredItems.filter((i: any) => i.priority >= 4),
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/applications" className="hover:text-slate-700">Applications</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Review Queue</span>
        </nav>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Application Review Queue</h1>
            <p className="text-sm text-slate-500 mt-1">
              {pendingItems} pending · {urgentItems} urgent · {resolvedToday} resolved today
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/applications?status=manual_review"
              className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <Filter className="w-4 h-4" />
              All Applications
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{pendingItems}</div>
                <div className="text-xs text-slate-500">Pending Review</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{urgentItems}</div>
                <div className="text-xs text-slate-500">Urgent Priority</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{resolvedToday}</div>
                <div className="text-xs text-slate-500">Resolved Today</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{totalItems}</div>
                <div className="text-xs text-slate-500">Total Queue</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="p-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Queue is clear!</h3>
            <p className="text-slate-500">No applications require review at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Priority 1: Urgent */}
            {byPriority.urgent.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Urgent ({byPriority.urgent.length})
                </h2>
                <div className="space-y-3">
                  {byPriority.urgent.map((item: any) => (
                    <QueueCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Priority 2: High */}
            {byPriority.high.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-3">
                  High Priority ({byPriority.high.length})
                </h2>
                <div className="space-y-3">
                  {byPriority.high.map((item: any) => (
                    <QueueCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Priority 3: Medium */}
            {byPriority.medium.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-yellow-600 uppercase tracking-wide mb-3">
                  Medium Priority ({byPriority.medium.length})
                </h2>
                <div className="space-y-3">
                  {byPriority.medium.map((item: any) => (
                    <QueueCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Priority 4+: Normal/Low */}
            {byPriority.low.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Normal ({byPriority.low.length})
                </h2>
                <div className="space-y-3">
                  {byPriority.low.map((item: any) => (
                    <QueueCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Queue Item Card Component
function QueueCard({ item }: { item: any }) {
  const app = item.applications;
  const priorityStyle = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES[5];
  const daysInQueue = getDaysInQueue(item.queue_entered_at || item.created_at);
  const reasons = item.reason?.split('; ') || app?.failure_reasons || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Name and Status */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-slate-900">
              {app?.first_name} {app?.last_name}
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityStyle.bg} ${priorityStyle.color}`}>
              {priorityStyle.label}
            </span>
            {item.status === 'resolved' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                Resolved
              </span>
            )}
          </div>

          {/* Contact Info */}
          <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
            <a href={`mailto:${app?.email}`} className="hover:text-blue-600">
              {app?.email}
            </a>
            <span>{app?.phone}</span>
          </div>

          {/* Program */}
          <div className="flex items-center gap-2 text-sm text-slate-700 mb-3">
            <GraduationCap className="w-4 h-4 text-slate-400" />
            <span>{app?.program_interest || 'General Inquiry'}</span>
          </div>

          {/* Failure Reasons */}
          <div className="flex flex-wrap gap-2">
            {reasons.map((reason: string, idx: number) => {
              const Icon = getReasonIcon(reason);
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-700"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {reason}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Time and Actions */}
        <div className="text-right ml-4">
          <div className="text-sm text-slate-500 mb-1">
            <Clock className="w-4 h-4 inline mr-1" />
            {daysInQueue === 0 ? 'Today' : `${daysInQueue}d ago`}
          </div>
          
          <Link
            href={`/applications/${app?.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Review
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
