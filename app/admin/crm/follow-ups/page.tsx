import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Clock, Phone, Mail, Calendar, User, CheckCircle, AlertTriangle, Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Follow-ups | CRM Admin',
  description: 'Manage CRM follow-up tasks and reminders.',
  robots: { index: false, follow: false },
};

const followUps = [
  { id: 1, contact: 'Marcus Johnson', type: 'call', reason: 'Program enrollment follow-up', dueDate: 'Today, 2:00 PM', priority: 'high', status: 'pending' },
  { id: 2, contact: 'ABC Healthcare', type: 'email', reason: 'WOTC application status', dueDate: 'Today, 4:00 PM', priority: 'medium', status: 'pending' },
  { id: 3, contact: 'Sarah Williams', type: 'call', reason: 'Training completion check-in', dueDate: 'Tomorrow, 10:00 AM', priority: 'low', status: 'pending' },
  { id: 4, contact: 'Tech Solutions Inc', type: 'meeting', reason: 'Partnership renewal discussion', dueDate: 'Jan 22, 2025', priority: 'high', status: 'scheduled' },
  { id: 5, contact: 'James Chen', type: 'email', reason: 'Certificate delivery confirmation', dueDate: 'Jan 20, 2025', priority: 'low', status: 'completed' },
];

const stats = [
  { label: 'Due Today', value: 8, color: 'red' },
  { label: 'This Week', value: 23, color: 'yellow' },
  { label: 'Completed', value: 156, color: 'green' },
  { label: 'Overdue', value: 3, color: 'red' },
];

export default function CRMFollowUpsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Follow Ups" }]} />
      </div>
<div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
            <p className="text-gray-600">Manage your follow-up tasks and reminders</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Follow-up
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className={`w-3 h-3 rounded-full bg-${stat.color}-500 mb-3`} />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b flex items-center gap-4">
            <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>All Types</option>
              <option>Calls</option>
              <option>Emails</option>
              <option>Meetings</option>
            </select>
            <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>All Priority</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>All Status</option>
              <option>Pending</option>
              <option>Scheduled</option>
              <option>Completed</option>
            </select>
          </div>

          <div className="divide-y">
            {followUps.map((item) => (
              <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.type === 'call' ? 'bg-blue-100' :
                  item.type === 'email' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {item.type === 'call' && <Phone className="w-5 h-5 text-blue-600" />}
                  {item.type === 'email' && <Mail className="w-5 h-5 text-green-600" />}
                  {item.type === 'meeting' && <Calendar className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{item.contact}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      item.priority === 'high' ? 'bg-red-100 text-red-700' :
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{item.reason}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {item.dueDate}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.status === 'completed' ? 'bg-green-100 text-green-700' :
                  item.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {item.status}
                </span>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition text-sm">
                  {item.status === 'completed' ? 'View' : 'Complete'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
