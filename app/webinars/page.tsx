import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Users, Play } from 'lucide-react';
import { createPublicClient } from '@/lib/supabase/server';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Webinars | Elevate For Humanity',
  description: 'Join live webinars and watch recordings on career development, industry trends, and skill building.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/webinars' },
};

export default async function WebinarsPage() {
  const supabase = await createPublicClient();

  const { data: upcoming } = await supabase
    .from('webinars')
    .select('id, title, description, host_name, host_title, scheduled_at, duration_minutes, registration_url, attendee_count')
    .eq('status', 'upcoming')
    .eq('is_public', true)
    .order('scheduled_at', { ascending: true })
    .limit(9);

  const { data: past } = await supabase
    .from('webinars')
    .select('id, title, host_name, duration_minutes, recording_url, view_count, scheduled_at')
    .eq('status', 'completed')
    .eq('is_public', true)
    .order('scheduled_at', { ascending: false })
    .limit(6);

  const upcomingList = upcoming ?? [];
  const pastList     = past ?? [];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Webinars' }]} />
        </div>
      </div>

      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image src="/hero-images/how-it-works-hero.jpg" alt="Webinars" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Live Webinars</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Learn from experts, ask questions, and connect with the Elevate community.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-20">

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Upcoming Webinars</h2>

          {upcomingList.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 font-semibold mb-1">No upcoming webinars scheduled</p>
              <p className="text-slate-500 text-sm mb-5">
                Sign up to be notified when new sessions are added.
              </p>
              <Link
                href="/contact?subject=webinar-notifications"
                className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                Notify Me
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingList.map((w: any) => (
                <div key={w.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col">
                  {w.scheduled_at && (
                    <div className="flex items-center gap-2 text-brand-red-600 text-sm font-medium mb-3">
                      <Calendar className="w-4 h-4" />
                      {new Date(w.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                  <h3 className="font-bold text-slate-900 mb-2 leading-snug">{w.title}</h3>
                  {w.description && <p className="text-slate-500 text-sm mb-3 line-clamp-2">{w.description}</p>}
                  <p className="text-slate-600 text-sm mb-4">
                    <span className="font-medium">{w.host_name}</span>
                    {w.host_title && <span className="text-slate-400"> · {w.host_title}</span>}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-5">
                    {w.duration_minutes && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {w.duration_minutes} min</span>}
                    {w.attendee_count > 0 && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {w.attendee_count.toLocaleString()} registered</span>}
                  </div>
                  <div className="mt-auto">
                    {w.registration_url ? (
                      <a href={w.registration_url} target="_blank" rel="noopener noreferrer"
                        className="block w-full text-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                        Register Free
                      </a>
                    ) : (
                      <Link href={`/contact?subject=webinar-${w.id}`}
                        className="block w-full text-center border border-slate-300 hover:border-brand-blue-400 text-slate-700 font-semibold py-2.5 rounded-lg text-sm transition-colors">
                        Request Access
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {pastList.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Past Recordings</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastList.map((w: any) => (
                <div key={w.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-3">
                    <Play className="w-3.5 h-3.5" />
                    {w.scheduled_at && new Date(w.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1 leading-snug">{w.title}</h3>
                  <p className="text-slate-500 text-sm mb-4">
                    {w.host_name}
                    {w.duration_minutes && <span className="text-slate-400"> · {w.duration_minutes} min</span>}
                    {w.view_count > 0 && <span className="text-slate-400"> · {w.view_count.toLocaleString()} views</span>}
                  </p>
                  <div className="mt-auto">
                    {w.recording_url ? (
                      <a href={w.recording_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full border border-slate-200 hover:border-brand-blue-400 text-slate-700 hover:text-brand-blue-700 font-semibold py-2.5 rounded-lg text-sm transition-colors">
                        <Play className="w-4 h-4" /> Watch Recording
                      </a>
                    ) : (
                      <span className="block w-full text-center text-slate-500 text-sm py-2.5">Recording not available</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
