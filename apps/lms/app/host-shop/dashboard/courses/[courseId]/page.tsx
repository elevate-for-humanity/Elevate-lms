import Link from 'next/link';
import {notFound} from 'next/navigation';
import {requireRole} from '@/lib/auth/require-role';
import {HOST_SHOP_ROLES} from '@/lib/rbac/role-matrix';
import {loadHostShopCourses} from '@/lib/apprenticeship/host-shop-courses';
export const dynamic='force-dynamic';
export default async function ShopCourse({params,searchParams}:{params:Promise<{courseId:string}>;searchParams:Promise<{lesson?:string}>}) {
 const {user}=await requireRole(HOST_SHOP_ROLES);
 const {courseId}=await params; const {lesson:selected}=await searchParams;
 const {db,courses}=await loadHostShopCourses(user.id);const course=courses.find(c=>c.id===courseId);if(!course)notFound();
 const [{data:lessons,error},{data:weeks}]=await Promise.all([
  db.from('course_lessons').select('id,title,order_index,is_published').eq('course_id',courseId).order('order_index'),
  db.from('course_lesson_release_weeks').select('lesson_id,release_week').eq('course_id',courseId)
 ]);if(error)throw error;
 const weekById=new Map((weeks||[]).map(w=>[w.lesson_id,w.release_week]));
 const active=(lessons||[]).find(l=>l.id===selected&&l.is_published)||(lessons||[]).find(l=>l.is_published);
 return <main className="mx-auto max-w-5xl space-y-6 p-6"><Link href="/host-shop/dashboard/programs" className="font-bold text-cyan-800">Back to programs</Link><h1 className="text-3xl font-black">{course.title}</h1><p>Host Shop course and lesson-by-lesson syllabus · {course.duration_weeks || 'Scheduled'} weeks. This preview does not record learner completion or RTI hours.</p>{active ? <section><h2 className="mb-3 text-xl font-bold">{active.title}</h2><video controls playsInline preload="metadata" className="aspect-video w-full rounded-xl bg-black" src={`/api/host-shop/course-playback?courseId=${courseId}&lessonId=${active.id}`}/></section> : null}<Link href="/host-shop/dashboard/practical-log" className="inline-block rounded-xl bg-cyan-800 px-5 py-3 font-bold text-white">Open owner service checkoffs</Link><section><h2 className="text-2xl font-black">Course syllabus</h2><ol className="mt-4 divide-y rounded-xl border bg-white">{(lessons||[]).map(l=><li key={l.id} className="p-4"><span className="mr-3 font-bold">{weekById.get(l.id) ? `Week ${weekById.get(l.id)}` : `Lesson ${l.order_index}`}</span>{l.is_published ? <Link className="font-semibold text-cyan-800 underline" href={`?lesson=${l.id}`}>{l.title}</Link> : <span>{l.title} · In production</span>}</li>)}</ol></section></main>;
}
