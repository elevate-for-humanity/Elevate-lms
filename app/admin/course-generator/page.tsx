// Dead-end path — redirects to the real AI course generator.
// The old /admin/course-generator only produced an outline preview and never
// persisted anything to the database. /admin/courses/generate is the
// production path: prompt/file → GPT-4o → review → publish to DB.
import { redirect } from 'next/navigation';

export default function OldCourseGeneratorRedirect() {
  redirect('/admin/courses/generate');
}
