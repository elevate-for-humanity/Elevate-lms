'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Zap, 
  Mail, 
  Bell, 
  UserPlus, 
  BookOpen, 
  Clock, 
  AlertTriangle,
  RefreshCw,
CheckCircle, } from 'lucide-react';

interface AutomationEvent {
  id: string;
  type: 'enrollment' | 'notification' | 'email' | 'sms' | 'progress' | 'nudge' | 'verification';
  title: string;
  description: string;
  status: 'success' | 'pending' | 'failed';
  created_at: string;
  metadata?: Record<string, any>;
}

const eventIcons: Record<string, any> = {
  enrollment: UserPlus,
  notification: Bell,
  email: Mail,
  sms: Mail,
  progress: BookOpen,
  nudge: Clock,
  verification: CheckCircle,
};

const statusColors: Record<string, string> = {
  success: 'bg-brand-green-100 text-brand-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-brand-red-100 text-brand-red-700',
};

export default function AutomationFeed({ limit = 20 }: { limit?: number }) {
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchEvents = async () => {
    setLoading(true);
    const supabase = createClient();
    const allEvents: AutomationEvent[] = [];

    // Fetch notifications (system events)
    const { data: notifications } = await supabase
      .from('notifications')
      .select('id, title, message, type, read, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (notifications) {
      for (const n of notifications) {
        allEvents.push({
          id: `notif-${n.id}`,
          type: 'notification',
          title: n.title || 'System Notification',
          description: n.message || '',
          status: 'success',
          created_at: n.created_at,
          metadata: n.metadata,
        });
      }
    }

    // Fetch delivery logs (emails/SMS sent)
    const { data: deliveryLogs } = await supabase
      .from('delivery_logs')
      .select('id, channel, status, recipient, template_name, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (deliveryLogs) {
      for (const log of deliveryLogs) {
        allEvents.push({
          id: `delivery-${log.id}`,
          type: log.channel === 'sms' ? 'sms' : 'email',
          title: `${log.channel?.toUpperCase() || 'Email'} sent`,
          description: log.template_name || `To: ${log.recipient}`,
          status: log.status === 'sent' ? 'success' : log.status === 'failed' ? 'failed' : 'pending',
          created_at: log.created_at,
          metadata: log.metadata,
        });
      }
    }

    // Fetch recent enrollments
    const { data: enrollments } = await supabase
      .from('program_enrollments')
      .select(`
        id, 
        created_at,
        profiles!enrollments_user_id_fkey(full_name),
        programs(name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (enrollments) {
      for (const e of enrollments) {
        const profile = e.profiles as any;
        const program = e.programs as any;
        allEvents.push({
          id: `enroll-${e.id}`,
          type: 'enrollment',
          title: 'Auto-enrollment completed',
          description: `${profile?.full_name || 'Student'} enrolled in ${program?.name || 'program'}`,
          status: 'success',
          created_at: e.created_at,
        });
      }
    }

    // Sort by date and limit
    allEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setEvents(allEvents.slice(0, limit));
    setLoading(false);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    fetchEvents();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, [limit]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading automation events...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-slate-900">Automation Activity</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Updated {formatTime(lastRefresh.toISOString())}</span>
          <button 
            onClick={fetchEvents}
            className="p-1 hover:bg-slate-100 rounded"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {events.length > 0 ? (
        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {events.map((event) => {
            const Icon = eventIcons[event.type] || Bell;
            return (
              <div key={event.id} className="p-4 hover:bg-slate-50 transition">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${statusColors[event.status]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm">{event.title}</p>
                    <p className="text-slate-600 text-sm truncate">{event.description}</p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {formatTime(event.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center">
          <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No automation events yet</p>
          <p className="text-slate-400 text-sm">Events will appear as the system processes enrollments and notifications</p>
        </div>
      )}
    </div>
  );
}
