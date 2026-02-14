import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap,
  Users,
  Briefcase,
  Calendar,
  MapPin,
  MessageSquare,
  Award,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Alumni Network | LMS',
  description: 'Connect with fellow graduates and access alumni resources.',
};

export const dynamic = 'force-dynamic';

export default async function AlumniPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Alumni" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();

  // Get alumni members
  const { data: alumni } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, graduation_year, program, company, job_title, location')
    .eq('role', 'alumni')
    .order('graduation_year', { ascending: false })
    .limit(20);

  // Get alumni count
  const { count: alumniCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'alumni');

  // Get upcoming alumni events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('event_type', 'alumni')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(3);

  // Get success stories
  const { data: stories } = await supabase
    .from('success_stories')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(3);

  // Check if current user is alumni
  let isAlumni = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isAlumni = profile?.role === 'alumni';
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Alumni Network</h1>
          <p className="text-gray-600">Connect with {alumniCount || 0} graduates</p>
        </div>
        {isAlumni && (
          <Link
            href="/lms/alumni/profile"
            className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700"
          >
            Edit My Profile
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
          <GraduationCap className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <div className="text-2xl font-bold">{alumniCount || 0}</div>
          <div className="text-gray-600 text-sm">Total Alumni</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
          <Briefcase className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold">85%</div>
          <div className="text-gray-600 text-sm">Employed</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
          <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold">50+</div>
          <div className="text-gray-600 text-sm">Companies</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
          <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold">20+</div>
          <div className="text-gray-600 text-sm">Cities</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Alumni Directory */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Alumni Directory</h2>
              <Link href="/lms/alumni/directory" className="text-amber-600 text-sm font-medium hover:underline">
                View All
              </Link>
            </div>
            {alumni && alumni.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {alumni.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                      {member.avatar_url ? (
                        <Image src={member.avatar_url} alt={member.full_name || 'Alumni member'} fill className="rounded-full object-cover" sizes="48px" />
                      ) : (
                        <GraduationCap className="w-6 h-6 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{member.full_name}</h3>
                      {member.job_title && member.company && (
                        <p className="text-sm text-gray-500 truncate">
                          {member.job_title} at {member.company}
                        </p>
                      )}
                      {member.graduation_year && (
                        <p className="text-xs text-gray-400">Class of {member.graduation_year}</p>
                      )}
                    </div>
                    <Link href={`/lms/alumni/${member.id}`} className="text-amber-600 text-sm">
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p>No alumni profiles yet</p>
              </div>
            )}
          </div>

          {/* Success Stories */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Success Stories</h2>
            {stories && stories.length > 0 ? (
              <div className="space-y-4">
                {stories.map((story: any) => (
                  <div key={story.id} className="border-l-4 border-amber-500 pl-4">
                    <h3 className="font-medium">{story.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{story.excerpt}</p>
                    <Link href={`/success-stories/${story.slug}`} className="text-amber-600 text-sm hover:underline">
                      Read More
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 italic mb-4">&quot;The program changed my life. I went from unemployed to earning $55K in just 6 months.&quot;</p>
                  <p className="font-semibold text-gray-900">Graduate</p>
                  <p className="text-sm text-gray-500">HVAC Graduate, 2025</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 italic mb-4">&quot;The career services team helped me land my dream job. I am so grateful for this opportunity.&quot;</p>
                  <p className="font-semibold text-gray-900">Sarah M.</p>
                  <p className="text-sm text-gray-500">Medical Assistant Graduate, 2025</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Alumni Events</h2>
            {events && events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event: any) => (
                  <div key={event.id} className="p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-600 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.start_date).toLocaleDateString()}
                    </div>
                    <h3 className="font-medium">{event.title}</h3>
                    <Link href={`/events/${event.id}`} className="text-amber-600 text-sm hover:underline">
                      Details
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No upcoming events</p>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="font-semibold mb-3">Alumni Resources</h3>
            <div className="space-y-2 text-sm">
              <Link href="/lms/alumni/directory" className="flex items-center gap-2 text-amber-700 hover:underline">
                <Users className="w-4 h-4" /> Full Directory
              </Link>
              <Link href="/lms/alumni/mentorship" className="flex items-center gap-2 text-amber-700 hover:underline">
                <MessageSquare className="w-4 h-4" /> Mentorship Program
              </Link>
              <Link href="/lms/alumni/jobs" className="flex items-center gap-2 text-amber-700 hover:underline">
                <Briefcase className="w-4 h-4" /> Job Board
              </Link>
              <Link href="/lms/certificates" className="flex items-center gap-2 text-amber-700 hover:underline">
                <Award className="w-4 h-4" /> Certificates
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
