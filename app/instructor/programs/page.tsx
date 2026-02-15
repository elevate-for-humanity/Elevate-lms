import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Users, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Programs | Instructor Portal',
  description: 'View and manage your assigned programs.',
};

export const dynamic = 'force-dynamic';

export default async function InstructorProgramsPage() {
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
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['instructor', 'admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  // Get programs
  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Programs</h1>
              <p className="text-gray-600">Programs you are assigned to teach</p>
            </div>
            <Link href="/instructor/dashboard" className="px-4 py-2 text-gray-600 hover:text-gray-900">
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs && programs.length > 0 ? (
            programs.map((program: any) => (
              <div key={program.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{program.name}</h3>
                      <p className="text-sm text-gray-500">{program.credential || 'Certificate'}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {program.description || 'No description available.'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {program.duration || 'Varies'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      0 enrolled
                    </span>
                  </div>

                  <Link
                    href={`/instructor/programs/${program.id}`}
                    className="block w-full text-center px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
                  >
                    View Program
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-lg shadow-sm border p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Programs Assigned</h3>
              <p className="text-gray-600">
                Contact an administrator to be assigned to programs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
