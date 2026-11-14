import Image from 'next/image';
import Link from 'next/link';
import WorkbookNarration from '@/components/lms/WorkbookNarration';
import { getCatalogProduct } from '@/lib/store/db';
import { HVAC_STORE_BUNDLE, HVAC_STORE_WORKBOOK_COVER } from '@/lib/store/hvac-course-product';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'EPA 608 Refrigeration Types I, II & III | Elevate Store',
  description: 'Narrated EPA 608 preparation with an illustrated PARIS-guided workbook, interactive system exercises and four practice tests. $182 online bundle.',
};
const introduction = 'Welcome to Elevate for Humanity. This online EPA 608 Refrigeration study bundle covers Core and Types One, Two and Three. You receive seventeen narrated lessons, an illustrated workbook with fifty-one activities, virtual system exercises and four twenty-five-question practice tests. The one-time price is one hundred eighty-two dollars for one learner. The official EPA examination, certification fees and supervised hands-on training are separate. After verified payment, open My Purchases to begin your course and workbook. Existing enrolled HVAC students already have their assigned workbook and do not need to buy it again.';

export default async function HvacCourseStorePage() {
  const product = await getCatalogProduct(HVAC_STORE_BUNDLE.slug);
  const available = product?.isActive === true && product.price === HVAC_STORE_BUNDLE.price * 100;
  return <main className="min-h-screen bg-white px-4 py-8 text-stone-950 sm:py-12">
    <div className="mx-auto max-w-6xl">
      <Link href="/store" className="inline-flex min-h-11 items-center font-bold underline">Back to Elevate Store</Link>
      <section className="mt-6 grid items-start gap-8 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]">
        <Image src={HVAC_STORE_BUNDLE.image} alt="Elevate for Humanity EPA 608 Refrigeration Types I, II and III course cover" width={1024} height={1536} priority sizes="(max-width: 768px) 75vw, 360px" className="mx-auto h-auto w-full max-w-xs rounded-xl border border-stone-200 shadow-md sm:max-w-sm" />
        <div>
          <p className="font-bold uppercase tracking-wider text-red-700">Elevate for Humanity · Online learning</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">EPA 608 Refrigeration<br/><span className="text-red-700">Types I, II &amp; III</span></h1>
          <p className="mt-5 text-lg leading-relaxed">Understand the systems, explain your decisions, and prepare with guided practice. Includes Core concepts, narrated instruction, an illustrated workbook and interactive exercises.</p>
          <p className="mt-5 text-4xl font-black">$182 <span className="text-base font-normal">one-time · one learner</span></p>
          <p className="mt-3 leading-relaxed">Course and workbook included. No subscription. Internet access and an individual learner account are required.</p>
          {available ? <Link href={`/store/cart?add=${HVAC_STORE_BUNDLE.slug}`} className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-red-700 px-6 py-3 font-bold text-white">Buy course + workbook · $182</Link> : <p role="status" className="mt-5 rounded-xl border border-stone-300 p-4 font-semibold">Checkout is temporarily unavailable while the payment connection is verified. Please contact Elevate for purchase assistance.</p>}
          <Link href="/contact?topic=epa608-course" className="ml-0 mt-4 inline-flex min-h-12 items-center px-2 font-bold underline sm:ml-3">Ask about this course</Link>
          <p className="mt-4 text-sm leading-relaxed">Already enrolled in Elevate HVAC? Use your existing LMS account and assigned workbook. You do not need to buy this bundle again.</p>
        </div>
      </section>
      <WorkbookNarration text={introduction} />
      <section className="mt-10 border-t border-stone-200 pt-8" aria-label="What is included">
        <h2 className="text-2xl font-bold">Your learning package</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[['17 narrated lessons','Study HVAC fundamentals, refrigerant safety, Core, small appliances, high-pressure systems and low-pressure systems.'],['Illustrated workbook','17 chapters, 51 practice activities, diagrams, worked examples and PARIS narration. Save your own answers to your account.'],['Interactive systems','Explore a virtual electrical circuit, refrigeration animation, superheat and subcooling calculations, recovery decisions and airflow reasoning.'],['100 practice questions','Four original 25-question tests: Core, Type I, Type II and Type III. Earn at least 80% in each. Review feedback after submitting.']].map(([title,text])=><article key={title} className="rounded-xl border border-stone-300 p-5"><h3 className="text-lg font-bold">{title}</h3><p className="mt-3 leading-relaxed">{text}</p></article>)}
        </div>
      </section>
      <section className="mt-10 grid items-center gap-6 border-t border-stone-200 pt-8 sm:grid-cols-[160px_1fr]">
        <Image src={HVAC_STORE_WORKBOOK_COVER} alt="Matching EPA 608 illustrated practice workbook cover" width={1024} height={1536} sizes="160px" className="mx-auto h-auto w-40 rounded-lg border shadow-sm" />
        <div><h2 className="text-2xl font-bold">PARIS guides your workbook study</h2><p className="mt-3 leading-relaxed">Choose Listen with PARIS to begin. Pause, replay and follow the transcript as you study. Work through the examples, enter your responses and save each chapter review. Narration supports learning; it does not complete your activities for you.</p><p className="mt-3 leading-relaxed">To finish the course, complete all required lessons, save the workbook responses and chapter reviews, and pass all four practice tests. Virtual exercises do not count as supervised hands-on hours.</p></div>
      </section>
      <section className="mt-10 rounded-xl border border-stone-300 p-6" aria-label="Before you buy">
        <h2 className="text-2xl font-bold">Know what your purchase includes</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed"><li>This is an Elevate online preparation course. It is not an official EPA examination or an EPA endorsement.</li><li>The official exam, exam voucher, external certifications, tools and in-person supervised training are not included.</li><li>One learner receives access after payment is verified. An organization needs separate arrangements for multiple learners; source files and resale rights are not included.</li><li>Open My Purchases after payment to access both the course and workbook. Contact support before paying again if a payment is pending.</li></ul>
        <div className="mt-4 flex flex-wrap gap-5"><Link className="min-h-11 py-3 font-bold underline" href="/store/orders">My Purchases</Link><Link className="min-h-11 py-3 font-bold underline" href="/refund-policy">Refund policy</Link><Link className="min-h-11 py-3 font-bold underline" href="/terms-of-service">Terms of service</Link></div>
      </section>
    </div>
  </main>;
}
