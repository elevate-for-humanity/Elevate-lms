import Link from 'next/link';
import {loadHostShopCourses} from '@/lib/apprenticeship/host-shop-courses';
export default async function HostShopCourses({userId}:{userId:string}) {
 const {courses}=await loadHostShopCourses(userId);
 return <section id="course-syllabi" className="my-6 rounded-2xl border border-cyan-200 bg-white p-5"><h2 className="text-xl font-black">Courses, syllabus and salon practice</h2><p className="mt-2 text-slate-700">Follow the same lessons as your apprentices. Only the Host Shop owner records service checkoffs; students see their progress.</p><div className="mt-4 flex flex-wrap gap-3">{courses.map(c=><Link key={c.id} href={`/host-shop/dashboard/courses/${c.id}`} className="rounded-xl bg-cyan-800 px-4 py-3 font-bold text-white">{c.title} · {c.duration_weeks ? `${c.duration_weeks} weeks` : 'Course & syllabus'}</Link>)}<Link href="/host-shop/dashboard/practical-log" className="rounded-xl border border-cyan-800 px-4 py-3 font-bold text-cyan-950">Service checkoffs & progress</Link></div>{!courses.length ? <p className="mt-3 text-sm text-slate-600">Released courses appear here when linked to your assigned occupation.</p> : null}</section>;
}
