import Link from 'next/link';
import type { BeautyApprenticeshipSlug } from '@/lib/beauty-apprenticeship/constants';
import { BEAUTY_PROGRAM_SYLLABI } from '@/lib/beauty-apprenticeship/program-syllabus';

type Props = {
  programSlug: BeautyApprenticeshipSlug;
};

export default function HostShopSyllabusRequirement({ programSlug }: Props) {
  const info = BEAUTY_PROGRAM_SYLLABI[programSlug];
  return (
    <section className="py-16 px-6 bg-brand-blue-50 border-y border-brand-blue-100">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">
          Program syllabus — same subject in the shop and on LMS
        </h2>
        <p className="text-slate-700 text-center mb-8 leading-relaxed">{info.hostRequirement}</p>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-semibold text-slate-900">RTI / theory delivered by</dt>
              <dd className="text-slate-600 mt-1">{info.rtiLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Published syllabus</dt>
              <dd className="mt-1">
                <Link
                  href={info.syllabusPath}
                  className="text-brand-blue-600 font-semibold hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download {info.title} syllabus (PDF/Markdown)
                </Link>
              </dd>
            </div>
          </dl>
          <p className="text-slate-600 text-sm mt-6 leading-relaxed">
            Host shops receive the weekly module outline so supervisors coach the same topic the
            apprentice studies online that day. Instructors can see LMS progress and align floor
            coaching with bookwork.
          </p>
        </div>
      </div>
    </section>
  );
}
