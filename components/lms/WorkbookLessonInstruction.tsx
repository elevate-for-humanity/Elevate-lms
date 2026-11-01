import {
  workbookInstructions,
  workbookInstructionAnchor,
} from '@/lib/lms/workbook-lesson-links';

export default function WorkbookLessonInstruction({ resources }: { resources: unknown }) {
  const sections = workbookInstructions(resources);
  if (!sections.length) return null;
  return (
    <section aria-label="Matching workbook instruction" className="space-y-6">
      <h2 className="text-2xl font-extrabold">Workbook teaching and practice</h2>
      <p className="leading-relaxed">Study the section that matches your workbook, then return to record your answers. These study activities do not replace course assessments, practical sign-off or training-hour requirements.</p>
      {sections.map((section) => (
        <article key={section.section_id} id={workbookInstructionAnchor(section.section_id)} className="scroll-mt-6 rounded-2xl border border-stone-300 bg-white p-5 shadow-sm sm:p-8">
          <h3 className="text-xl font-bold">{section.section_number}. {section.title}</h3>
          <p className="mt-4 max-w-prose whitespace-pre-line leading-relaxed">{section.teaching}</p>
          <h4 className="mt-5 font-bold">Worked example</h4>
          <p className="mt-2 max-w-prose leading-relaxed">{section.example}</p>
          <h4 className="mt-5 font-bold">Check your understanding</h4>
          <ol className="mt-2 list-decimal space-y-3 pl-6 leading-relaxed">{section.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ol>
          <p className="mt-5 leading-relaxed"><strong>Recap:</strong> {section.recap}</p>
          {section.sources?.filter((source) => typeof source.title === 'string' && typeof source.url === 'string' && /^https:\/\/(www\.)?(in\.gov|fda\.gov|epa\.gov)\//.test(source.url)).map((source) => <p key={source.url} className="mt-3"><a href={source.url} className="underline">{source.title}</a></p>)}
          <a className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-slate-900 px-4 py-3 font-bold text-white" href={`/workbooks/${section.workbook_slug}#section-${section.section_id}`}>Return to workbook section {section.section_number}</a>
        </article>
      ))}
    </section>
  );
}
