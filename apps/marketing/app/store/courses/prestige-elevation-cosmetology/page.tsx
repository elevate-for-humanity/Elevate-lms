import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import CosmetologySeatQuote from './CosmetologySeatQuote';
import { COSMETOLOGY_COURSE_LICENSE as course } from '@/lib/store/cosmetology-course-license';
export const metadata: Metadata = {
 title: 'Prestige Elevation Cosmetology | $275 per Student',
 description: 'License the 40-lesson cosmetology theory course and matching digital workbook for your organization at $275 per student.',
};
export default function CosmetologyCourseLicensePage() {
 return <main className="min-h-screen bg-slate-50 text-slate-950">
  <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-2">
   <div>
    <Link href="/store" className="inline-block py-3 underline">Back to store</Link>
    <p className="mt-5 font-semibold uppercase tracking-widest text-teal-800">For schools & training organizations</p>
    <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">{course.name}</h1>
    <p className="mt-5 text-lg leading-relaxed text-slate-600">Bring structured cosmetology theory and guided workbook practice to your students.</p>
    <div className="mt-6 flex flex-wrap gap-3">
     <span className="rounded-full border bg-white px-4 py-2">40 video lessons</span>
     <span className="rounded-full border bg-white px-4 py-2">Lesson assessments</span>
     <span className="rounded-full border bg-white px-4 py-2">40 workbook sections</span>
    </div>
    <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-2xl">
     <Image src={course.image} alt="Cosmetology professional teaching at a salon workstation" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover object-top" />
    </div>
   </div>
   <div className="lg:pt-16"><CosmetologySeatQuote /><figure className="mt-8 rounded-2xl border border-slate-200 bg-white p-4"><Image src="/images/courses/prestige-elevation-cosmetology-workbook-cover.jpg" alt="Original Prestige Elevation cosmetology workbook cover" width={1237} height={1600} className="h-auto w-full rounded-lg" /><figcaption className="mt-3 text-sm text-slate-600">The matching Prestige Elevation digital workbook.</figcaption></figure></div>
  </section>
  <section className="mx-auto max-w-6xl px-5 pb-16">
   <h2 className="text-2xl font-bold">A connected learning experience</h2>
   <div className="mt-6 grid gap-5 md:grid-cols-3">
    {[['Learn','Published video lessons, captions and knowledge checks.'],['Practice','Digital workbook exercises with answers saved to each learner account.'],['Track','Individual lesson progress and assessment records in the Elevate LMS.']].map(([title,text])=><article key={title} className="rounded-2xl border bg-white p-6"><h3 className="text-xl font-semibold">{title}</h3><p className="mt-3 leading-relaxed text-slate-600">{text}</p></article>)}
   </div>
   <details className="mt-8 rounded-xl border bg-white p-5"><summary className="cursor-pointer font-semibold">What the student license covers</summary><p className="mt-4 leading-relaxed">One named learner's access to this course and matching workbook through Elevate's protected LMS. The organization purchases the number of student seats it needs. This is a course-content license; it does not transfer ownership, permit resale or redistribution, or include a source-media download.</p><p className="mt-3 leading-relaxed">Practical training, shop supervision, required training hours, and licensing examinations remain separate requirements. Completing this course alone does not issue a state cosmetology license.</p></details>
  </section>
 </main>;
}
