import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { MessageSquare, Plus, HelpCircle, ChevronLeft, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Support Tickets | LMS',
  description: 'View and manage your support tickets.',
};

export const dynamic = 'force-dynamic';

export default async function SupportMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login?next=/lms/messages/support');

  // Fetch support tickets from database
  const { data: tickets, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tickets:', error.message);
  }

  const ticketList = tickets || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/lms/messages" className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Support Tickets</h1>
                <p className="text-sm text-gray-500">Get help with technical issues</p>
              </div>
            </div>
            <Link
              href="/lms/messages/support/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {ticketList.length > 0 ? (
          <div className="bg-white rounded-xl border divide-y">
            {ticketList.map((ticket: any) => (
              <Link 
                key={ticket.id} 
                href={`/lms/messages/support/${ticket.id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{ticket.subject || 'Support Request'}</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{ticket.description}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                    {ticket.status === 'in_progress' ? 'In Progress' : ticket.status || 'Open'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No support tickets</h2>
            <p className="text-gray-600 mb-6">Need help? Create a support ticket and we'll assist you.</p>
            <Link 
              href="/lms/messages/support/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Create Ticket
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
