import Link from 'next/link';
import {
  BOOKKEEPING_COURSE_ID,
  BOOKKEEPING_WORKBOOK_SLUG,
} from '@/lib/lms/bookkeeping-workbook-contract';

export default function BookkeepingStudyGuide({ coursePage = false }: { coursePage?: boolean }) {
  return (
    <section
      aria-label="Bookkeeping study steps"
      className="rounded-2xl border border-teal-300 bg-teal-50 p-5 text-slate-950"
    >
      <h2 className="text-xl font-bold">Bookkeeping: start here</h2>
      <ol className="my-4 list-decimal space-y-2 pl-5 leading-relaxed">
        <li>Open your course and read or watch the lesson.</li>
        <li>Complete that lesson’s workbook activities and save your answers.</li>
        <li>Review your writing, then complete the lesson assessment and required activities.</li>
        <li>Continue to the next available lesson. Your saved work stays in your account.</li>
      </ol>
      <p className="rounded-xl border border-teal-200 bg-white p-4 leading-relaxed">
        <strong>Use a desktop or laptop for spreadsheets and the month-end case.</strong> The larger
        screen and keyboard make tables, calculations, and files easier to manage. You can still
        read lessons, watch videos, and write and save workbook answers on your phone. If a required
        file or tool does not work on your phone, continue that activity on a computer.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {!coursePage ? (
          <Link
            href={`/lms/courses/${BOOKKEEPING_COURSE_ID}`}
            className="min-h-12 rounded-xl bg-teal-900 px-4 py-3 font-bold text-white"
          >
            Open my bookkeeping course
          </Link>
        ) : null}
        <Link
          href={`/workbooks/${BOOKKEEPING_WORKBOOK_SLUG}`}
          className="min-h-12 rounded-xl border border-teal-800 bg-white px-4 py-3 font-bold"
        >
          Open my workbook
        </Link>
      </div>
    </section>
  );
}
