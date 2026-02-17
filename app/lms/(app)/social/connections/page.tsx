import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  UserPlus, Search, Users, MessageSquare, 
  CheckCircle, X, Filter, ChevronRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Find Connections | Social | LMS | Elevate For Humanity',
  description: 'Connect with fellow learners and expand your professional network.',
};

export default async function ConnectionsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/lms/social/connections');
  }

  // Fetch suggested connections (other users in same programs)
  const { data: suggestedUsers } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, headline, role')
    .neq('id', user.id)
    .limit(12);

  const suggestions = suggestedUsers || [];

  // Fetch user's existing connections
  const { data: myConnections } = await supabase
    .from('user_connections')
    .select('connected_user_id, status, profiles!user_connections_connected_user_id_fkey(full_name, avatar_url, headline)')
    .eq('user_id', user.id)
    .eq('status', 'accepted');

  const connections = myConnections || [];

  // Fetch pending requests
  const { data: pendingRequests } = await supabase
    .from('user_connections')
    .select('id, user_id, profiles!user_connections_user_id_fkey(full_name, avatar_url, headline)')
    .eq('connected_user_id', user.id)
    .eq('status', 'pending');

  const pending = pendingRequests || [];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'Social', href: '/lms/social' },
            { label: 'Connections' }
          ]} />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Find Connections</h1>
              <p className="text-blue-100 mt-1">
                Connect with fellow learners and grow your network
              </p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mt-6 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, program, or skills..."
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Pending Requests */}
        {pending.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border mb-8">
            <div className="p-6 border-b">
              <h2 className="font-semibold text-gray-900">Pending Requests ({pending.length})</h2>
            </div>
            <div className="divide-y">
              {pending.map((request: any) => (
                <div key={request.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {request.profiles?.avatar_url ? (
                        <img src={request.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{request.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{request.profiles?.headline || 'Elevate Learner'}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Connections */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">My Connections ({connections.length})</h2>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
          {connections.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {connections.map((conn: any, i: number) => (
                <div key={i} className="border rounded-xl p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {conn.profiles?.avatar_url ? (
                        <img src={conn.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{conn.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500 truncate">{conn.profiles?.headline || 'Elevate Learner'}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Message
                    </button>
                    <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No connections yet</h3>
              <p className="text-gray-600">Start connecting with fellow learners below!</p>
            </div>
          )}
        </div>

        {/* Suggested Connections */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="font-semibold text-gray-900">People You May Know</h2>
            <p className="text-sm text-gray-600 mt-1">Based on your programs and interests</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {suggestions.length > 0 ? (
              suggestions.map((person: any) => (
                <div key={person.id} className="border rounded-xl p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{person.full_name || 'Elevate Learner'}</div>
                      <div className="text-sm text-gray-500 truncate">{person.headline || person.role || 'Student'}</div>
                    </div>
                  </div>
                  <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Connect
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                <p>No suggestions available at this time.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
