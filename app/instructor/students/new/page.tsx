export const dynamic = 'force-dynamic';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Add Student | Elevate for Humanity',
  description: 'Add a new student to your course',
};

export default async function InstructorAddStudentPage() {
  let user = null;

  try {
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
    const { data: authData } = await supabase.auth.getUser();
    user = authData.user;
  } catch (error) { /* Error handled silently */ }

  return (
    <div className="container mx-auto px-4 py-8">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/career-services-hero.jpg" alt="Instructor portal" fill sizes="100vw" className="object-cover" priority />
      </section>
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Instructor", href: "/instructor" }, { label: "New" }]} />
      </div>
<h1 className="text-3xl font-bold mb-6">Add Student</h1>
      <div className="bg-white rounded-lg shadow-sm border p-6 max-w-2xl">
        <p className="text-black mb-6">
          Enroll a student in your course.
        </p>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Student Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              placeholder="student.email@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Course
            </label>
            <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500">
              <option>Select a course...</option>
            </select>
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-brand-blue-600 text-white px-6 py-2 rounded-lg hover:bg-brand-blue-700"
            >
              Add Student
            </button>
            <button
              type="button"
              className="border border-slate-300 px-6 py-2 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
        <div className="mt-6 p-4 bg-brand-blue-50 border border-brand-blue-200 rounded-lg">
          <h3 className="font-semibold text-brand-blue-900 mb-2">Bulk Enrollment</h3>
          <p className="text-sm text-brand-blue-800 mb-3">
            Need to enroll multiple students? Upload a CSV file with student emails.
          </p>
          <button className="text-sm bg-brand-blue-600 text-white px-4 py-2 rounded hover:bg-brand-blue-700" aria-label="Action button">
            Upload CSV
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <h3 className="font-semibold text-black mb-2">Need Help?</h3>
          <p className="text-sm text-black">
            Contact support at <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a> for assistance with student enrollment.
          </p>
        </div>
      </div>
    </div>
  );
}
