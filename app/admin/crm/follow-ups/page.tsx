export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Clock, Phone, Mail, Calendar, Plus, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Follow-ups | CRM Admin',
  description: 'Manage CRM follow-up tasks and reminders.',
  robots: { index: false, follow: false },
};

export default async function CRMFollowUpsPage() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return <div className="p-8 text-center text-brand-red-600">Access denied</div>;
  }

  const supabase = await createClient();

  // Fetch follow-ups with contact info
  const { data: followUps } = await supabase
    .from('crm_follow_ups')
    .select(`
      *,
      contact:crm_contacts(id, first_name, last_name, company, email, phone)
    `)
    .order('due_date', { ascending: true })
    .limit(50);

  // Compute stats
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(todayStart.getTime() + 7 * 86400000);

  const items = followUps || [];
  const dueToday = items.filter(f => f.status !== 'completed' && f.due_date && new Date(f.due_date) >= todayStart && new Date(f.due_date) < new Date(todayStart.getTime() + 86400000)).length;
  const thisWeek = items.filter(f => f.status !== 'completed' && f.due_date && new Date(f.due_date) >= todayStart && new Date(f.due_date) < weekEnd).length;
  const completed = items.filter(f => f.status === 'completed').length;
  const overdue = items.filter(f => f.status !== 'completed' && f.due_date && new Date(f.due_date) < todayStart).length;

  const stats = [
    { label: 'Due Today', value: dueToday, color: 'red' },
    { label: 'This Week', value: thisWeek, color: 'yellow' },
    { label: 'Completed', value: completed, color: 'green' },
    { label: 'Overdue', value: overdue, color: 'red' },
  ];

  const typeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-5 h-5 text-brand-blue-600" />;
      case 'email': return <Mail className="w-5 h-5 text-brand-green-600" />;
      case 'meeting': return <Calendar className="w-5 h-5 text-purple-600" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const typeBg = (type: string) => {
    switch (type) {
      case 'call': return 'bg-brand-blue-100';
      case 'email': return 'bg-brand-green-100';
      case 'meeting': return 'bg-purple-100';
      default: return 'bg-gray-100';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No date';
    const d = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((d.getTime() - today.getTime()) / 86400000);
    if (diffDays === 0) return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    if (diffDays === 1) return `Tomorrow, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const contactName = (f: any) => {
    if (f.contact) return `${f.contact.first_name || ''} ${f.contact.last_name || ''}`.trim() || f.contact.company || 'Unknown';
    return f.title || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'CRM', href: '/admin/crm' }, { label: 'Follow-ups' }]} />
      </div>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
            <p className="text-gray-600">Manage your follow-up tasks and reminders</p>
          </div>
          <Link
            href="/admin/crm/follow-ups/new"
            className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Follow-up
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className={`w-3 h-3 rounded-full mb-3 ${
                stat.color === 'red' ? 'bg-brand-red-500' :
                stat.color === 'yellow' ? 'bg-yellow-500' : 'bg-brand-green-500'
              }`} />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          {items.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No follow-ups yet</p>
              <p className="text-sm mt-1">Create your first follow-up to start tracking tasks.</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => {
                const isOverdue = item.status !== 'completed' && item.due_date && new Date(item.due_date) < now;
                return (
                  <div key={item.id} className={`p-4 flex items-center gap-4 hover:bg-gray-50 ${isOverdue ? 'bg-brand-red-50' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeBg(item.follow_up_type)}`}>
                      {typeIcon(item.follow_up_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{contactName(item)}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          item.priority quality={90} === 'high' ? 'bg-brand-red-100 text-brand-red-700' :
                          item.priority quality={90} === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.priority quality={90}}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{item.description || item.title}</p>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-brand-red-600 font-medium' : 'text-gray-500'}`}>
                      <Clock className="w-4 h-4" />
                      {formatDate(item.due_date)}
                      {isOverdue && <span className="text-xs">(overdue)</span>}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === 'completed' ? 'bg-brand-green-100 text-brand-green-700' :
                      item.status === 'scheduled' ? 'bg-brand-blue-100 text-brand-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
