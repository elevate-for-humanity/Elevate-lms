import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, Clock, Video, MapPin, User, Plus,
  ChevronLeft, ChevronRight, MoreVertical
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Interviews | Employer Portal | Elevate For Humanity',
  description: 'Schedule and manage candidate interviews.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function InterviewsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    redirect('/login?redirect=/employer-portal/interviews');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/employer-portal/interviews');
  }

  // Fetch real interviews
  const { data: interviewData } = await db
    .from('interviews')
    .select(`
      id,
      scheduled_at,
      interview_type,
      status,
      outcome,
      candidate_id,
      job_id,
      profiles!interviews_candidate_id_fkey(full_name),
      jobs(title)
    `)
    .order('scheduled_at', { ascending: true })
    .limit(20);

  const now = new Date();
  
  const upcomingInterviews = (interviewData || [])
    .filter((i: any) => new Date(i.scheduled_at) >= now)
    .map((i: any) => {
      const date = new Date(i.scheduled_at);
      const isToday = date.toDateString() === now.toDateString();
      const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();
      return {
        id: i.id,
        candidate: { name: i.profiles?.full_name || 'Candidate', image: null },
        position: i.jobs?.title || 'Position',
        date: isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        type: i.interview_type || 'Video Call',
        status: i.status || 'Pending',
      };
    });

  const pastInterviews = (interviewData || [])
    .filter((i: any) => new Date(i.scheduled_at) < now)
    .map((i: any) => {
      const date = new Date(i.scheduled_at);
      return {
        id: i.id,
        candidate: { name: i.profiles?.full_name || 'Candidate', image: null },
        position: i.jobs?.title || 'Position',
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        outcome: i.outcome || 'Completed',
      };
    });

  return (
    <div className="min-h-screen bg-white">
            <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer-portal" }, { label: "Interviews" }]} />
{/* Header */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-8 h-8 text-brand-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
              </div>
              <p className="text-gray-600">Schedule and manage candidate interviews</p>
            </div>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors">
              <Plus className="w-5 h-5" />
              Schedule Interview
            </button>
          </div>
        </div>
      </section>

      {/* Calendar Navigation */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-white rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold">January 2025</h2>
              <button className="p-2 hover:bg-white rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-brand-blue-100 text-brand-blue-700 font-medium rounded-lg">Day</button>
              <button className="px-4 py-2 hover:bg-white rounded-lg">Week</button>
              <button className="px-4 py-2 hover:bg-white rounded-lg">Month</button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Interviews */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Interviews</h3>
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => (
                <div key={interview.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={interview.candidate.image}
                          alt={interview.candidate.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{interview.candidate.name}</h4>
                        <p className="text-gray-600 text-sm">{interview.position}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {interview.date}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-4 h-4" />
                            {interview.time}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500">
                            {interview.type === 'Video Call' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                            {interview.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        interview.status === 'Confirmed' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {interview.status}
                      </span>
                      <button className="p-2 hover:bg-white rounded-lg">
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    {interview.type === 'Video Call' && (
                      <button className="px-4 py-2 bg-brand-blue-600 text-white font-medium rounded-lg hover:bg-brand-blue-700 transition-colors flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Join Call
                      </button>
                    )}
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white transition-colors">
                      Reschedule
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Interviews */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Past Interviews</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {pastInterviews.map((interview, index) => (
                <div key={interview.id} className={`p-4 ${index !== pastInterviews.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={interview.candidate.image}
                        alt={interview.candidate.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{interview.candidate.name}</p>
                      <p className="text-gray-500 text-sm">{interview.date}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      interview.outcome === 'Offered' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-brand-red-100 text-brand-red-700'
                    }`}>
                      {interview.outcome}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
