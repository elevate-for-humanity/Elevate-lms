import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  ClipboardCheck, Users, Calendar, Clock, 
  CheckCircle, XCircle, AlertCircle, ArrowLeft, Save
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Take Attendance | Staff Portal | Elevate For Humanity',
  description: 'Record daily attendance for students.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function TakeAttendancePage() {
  const supabase = await createClient();
  
  if (!supabase) {
    redirect('/login');
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/staff-portal/attendance/take');
  }

  // Fetch active cohorts
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('id, name, start_date, end_date')
    .eq('status', 'active')
    .order('name');

  const cohortList = cohorts || [];

  // Fetch students (apprentices) for attendance
  const { data: students } = await supabase
    .from('apprentices')
    .select(`
      id,
      profiles (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'active')
    .limit(20);

  const studentList = students || [];

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Staff Portal', href: '/staff-portal' },
            { label: 'Attendance', href: '/staff-portal/attendance' },
            { label: 'Take Attendance' }
          ]} />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Link 
            href="/staff-portal/attendance" 
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Attendance
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <ClipboardCheck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Take Attendance</h1>
                <p className="text-blue-100 mt-1">{today}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
              <Clock className="w-5 h-5" />
              <span className="font-medium">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Cohort Selection */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Select Cohort</h2>
              <p className="text-sm text-gray-600">Choose the class or program to take attendance for</p>
            </div>
            <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[250px]">
              <option value="">Select a cohort...</option>
              {cohortList.map((cohort: any) => (
                <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
              ))}
              {cohortList.length === 0 && (
                <option disabled>No active cohorts</option>
              )}
            </select>
          </div>
        </div>

        {/* Attendance Form */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Student Roster</h2>
              <p className="text-sm text-gray-600">{studentList.length} students enrolled</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                Mark All Present
              </button>
              <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Clear All
              </button>
            </div>
          </div>

          {studentList.length > 0 ? (
            <div className="divide-y">
              {studentList.map((student: any, index: number) => (
                <div key={student.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {student.profiles?.avatar_url ? (
                          <img 
                            src={student.profiles.avatar_url} 
                            alt="" 
                            className="w-full h-full rounded-full object-cover" 
                          />
                        ) : (
                          <Users className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {student.profiles?.full_name || `Student ${index + 1}`}
                        </div>
                        <div className="text-sm text-gray-500">ID: {student.id.slice(0, 8)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Status Buttons */}
                      <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-300 bg-green-50 text-green-700 hover:bg-green-100">
                          <CheckCircle className="w-4 h-4" />
                          Present
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                          <XCircle className="w-4 h-4" />
                          Absent
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                          <AlertCircle className="w-4 h-4" />
                          Late
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                          <Calendar className="w-4 h-4" />
                          Excused
                        </button>
                      </div>
                      
                      {/* Hours Input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="12"
                          step="0.5"
                          defaultValue="8"
                          className="w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-500">hrs</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div className="mt-3 ml-14">
                    <input
                      type="text"
                      placeholder="Add notes (optional)..."
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600 mb-4">
                Select a cohort above to view enrolled students, or there may be no active students.
              </p>
              <Link
                href="/staff-portal/students/add"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Students
              </Link>
            </div>
          )}

          {/* Submit */}
          {studentList.length > 0 && (
            <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{studentList.length}</span> students • 
                <span className="text-green-600 ml-2">0 present</span> • 
                <span className="text-red-600 ml-2">0 absent</span> • 
                <span className="text-yellow-600 ml-2">0 late</span>
              </div>
              <div className="flex gap-4">
                <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-white text-gray-700">
                  Save as Draft
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  <Save className="w-5 h-5" />
                  Submit Attendance
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="mt-6 bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Tips</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Use &quot;Mark All Present&quot; for quick entry, then adjust individual records</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Add notes for absences to track reasons and patterns</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Save as draft if you need to complete attendance later</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
