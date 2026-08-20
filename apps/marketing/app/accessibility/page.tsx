import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Accessibility Statement',
  description: `Accessibility commitment, conformance target, accommodation process, and feedback channels for ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/accessibility' },
};

const practices = [
  'Use semantic headings, labels, landmarks, and meaningful link text.',
  'Support keyboard navigation and visible focus states for interactive controls.',
  'Provide text alternatives for meaningful images and non-text content.',
  'Maintain readable contrast and avoid relying on color alone to convey meaning.',
  'Support zoom, responsive layouts, and common assistive technologies.',
  'Provide captions, transcripts, alternative formats, or another reasonable format when required for program access.',
  'Include accessibility checks in ongoing design, engineering, content, and release work.',
] as const;

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Accessibility Statement' }]} />
        </div>
      </div>

      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-300">Accessibility</p>
          <h1 className="mt-3 text-4xl font-black">Accessibility Statement</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            {PLATFORM_DEFAULTS.orgName} is committed to providing accessible digital services and reasonable access to its programs and services.
          </p>
          <p className="mt-5 text-sm font-semibold text-slate-400">Reviewed: August 19, 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <section>
          <h2 className="text-2xl font-black">Conformance target</h2>
          <p className="mt-3 leading-7 text-slate-700">
            We use WCAG 2.1 Level AA as the current accessibility target for public and authenticated web experiences. This is an ongoing engineering and content objective; this statement does not claim that every page, document, third-party tool, or historical asset has been independently certified as fully conformant.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-black">Practices we maintain</h2>
          <ul className="mt-4 space-y-3">
            {practices.map((practice) => (
              <li key={practice} className="flex gap-3 leading-7 text-slate-700">
                <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-blue-700" />
                <span>{practice}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-2xl font-black">Third-party content</h2>
          <p className="mt-3 leading-7 text-slate-700">
            Some services, examinations, payment flows, embedded content, or partner systems are operated by third parties. We work to choose and configure accessible services where practical, but third-party accessibility is also governed by the provider that operates that service.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-black">Accommodations and alternative access</h2>
          <p className="mt-3 leading-7 text-slate-700">
            If a disability-related barrier prevents access to a page, document, application, class, testing process, or other service, contact us with the affected resource and the format or accommodation needed. Program, testing-provider, employer, or workforce-agency procedures may also apply.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-brand-blue-200 bg-brand-blue-50 p-6">
          <h2 className="text-2xl font-black">Report an accessibility barrier</h2>
          <p className="mt-3 leading-7 text-slate-700">
            Include the page or service involved, what prevented access, the assistive technology or device being used if relevant, and a way to contact you. We will review the issue and provide a reasonable response or alternative access path.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-lg bg-brand-blue-700 px-5 py-3 font-bold text-white hover:bg-brand-blue-800">Contact us</Link>
            <Link href="/federal-compliance" className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-900 hover:bg-slate-100">Compliance controls</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
