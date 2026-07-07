import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Calendar | Elevate for Humanity',
  keywords: ["calendar", "class schedule", "program dates", "Indiana"], description: 'Calendar page content.',
};

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let enrollments = null;
  let assignments = null;

  if (user) {
    const { data: enrollmentData } = await supabase
      .from('program_enrollments')
      .select(
        `
        id,
        course:courses(id, title, schedule, start_date, end_date)
      `,
      )
      .eq('user_id', user.id)
      .eq('status', 'active');
    enrollments = enrollmentData;

    const courseIds = enrollments?.map((e: any) => e.course?.id).filter(Boolean) || [];
    if (courseIds.length > 0) {
      const { data: assignmentData } = await supabase
        .from('assignments')
        .select('*')
        .in('course_id', courseIds)
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(10);
      assignments = assignmentData;
    }
  }

  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, start_date, schedule')
    .eq('is_active', true)
    .limit(10);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-blue-200">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}
