"use client";

import Link from "next/link";

export function TaxCredentialingSection() {
  return (
    <section className="mt-8 rounded-xl bg-white p-4 text-xs shadow-sm border border-slate-200">
      <h2 className="text-sm font-semibold text-black">
        Credentialing & Volunteer Requirements (IRS VITA / TCE)
      </h2>

      <p className="mt-2 text-black">
        This pathway is designed to align with the IRS Volunteer Income Tax Assistance (VITA)
        and Tax Counseling for the Elderly (TCE) programs. To be recognized as an IRS VITA
        volunteer, learners must complete IRS training, pass certification tests, and sign
        the required volunteer agreement forms.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {/* Column 1 – Link & Learn Taxes */}
        <div className="rounded-lg bg-slate-50 p-3">
          <h3 className="text-[11px] font-semibold text-black">
            Step 1: IRS Link &amp; Learn Taxes
          </h3>
          <p className="mt-1 text-[11px] text-black">
            Complete the official IRS Link &amp; Learn Taxes online training and certification
            for the VITA/TCE program. This is where you take your ethics and tax law tests.
          </p>
          <ul className="mt-2 list-disc pl-4 text-[11px] text-black space-y-1">
            <li>Choose the appropriate certification level (Basic, Advanced, etc.).</li>
            <li>Pass the Volunteer Standards of Conduct (VSC) exam.</li>
            <li>Pass the Intake/Interview &amp; Quality Review and tax law exams.</li>
          </ul>
          <Link
            href="https://apps.irs.gov/app/vita/"
            target="_blank"
            className="mt-3 inline-flex rounded-md bg-brand-orange-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-brand-orange-700"
          >
            Go to IRS Link &amp; Learn Taxes
          </Link>
        </div>

        {/* Column 2 – Required IRS Volunteer Forms */}
        <div className="rounded-lg bg-slate-50 p-3">
          <h3 className="text-[11px] font-semibold text-black">
            Step 2: Required IRS Volunteer Forms
          </h3>
          <p className="mt-1 text-[11px] text-black">
            VITA/TCE sites use these IRS forms and publications for ethics, training,
            intake, and quality review. Learners in this pathway will be guided on how
            to complete them with the sponsoring site.
          </p>
          <ul className="mt-2 space-y-1 text-[11px] text-black">
            <li>
              <a
                href="https://www.irs.gov/pub/irs-pdf/f13615.pdf"
                target="_blank"
                className="text-brand-red-700 underline" rel="noreferrer"
              >
                Form 13615 – Volunteer Standards of Conduct Agreement
              </a>
            </li>
            <li>
              <a
                href="https://www.irs.gov/pub/irs-pdf/f6744.pdf"
                target="_blank"
                className="text-brand-red-700 underline" rel="noreferrer"
              >
                Form 6744 – VITA/TCE Volunteer Assistor&apos;s Test/Retest
              </a>
            </li>
            <li>
              <a
                href="https://www.irs.gov/pub/irs-pdf/p4012.pdf"
                target="_blank"
                className="text-brand-red-700 underline" rel="noreferrer"
              >
                Pub 4012 – VITA/TCE Volunteer Resource Guide
              </a>
            </li>
            <li>
              <a
                href="https://www.irs.gov/pub/irs-pdf/p4961.pdf"
                target="_blank"
                className="text-brand-red-700 underline" rel="noreferrer"
              >
                Pub 4961 – Volunteer Standards of Conduct (Ethics Training)
              </a>
            </li>
            <li>
              <a
                href="https://www.irs.gov/pub/irs-pdf/p5166.pdf"
                target="_blank"
                className="text-brand-red-700 underline" rel="noreferrer"
              >
                Pub 5166 – VITA/TCE Quality Site Requirements
              </a>
            </li>
            <li>
              <a
                href="https://www.irs.gov/pub/irs-pdf/f13614c.pdf"
                target="_blank"
                className="text-brand-red-700 underline" rel="noreferrer"
              >
                Form 13614-C – Intake/Interview &amp; Quality Review Sheet
              </a>
            </li>
            <li>
              <a
                href="https://www.irs.gov/pub/irs-pdf/f14446.pdf"
                target="_blank"
                className="text-brand-red-700 underline" rel="noreferrer"
              >
                Form 14446 – Virtual VITA/TCE Taxpayer Consent
              </a>
            </li>
            <li className="text-[10px] text-slate-500">
              Additional forms (e.g., Form 13206 Volunteer Assistance Summary) can be added
              to this list or provided by the site coordinator.
            </li>
          </ul>
        </div>

        {/* Column 3 – Intuit Free Tax Courses */}
        <div className="rounded-lg bg-slate-50 p-3">
          <h3 className="text-[11px] font-semibold text-black">
            Step 3: Intuit Free Tax Courses (Optional but Recommended)
          </h3>
          <p className="mt-1 text-[11px] text-black">
            To deepen your tax skills and prepare for paid roles, learners can complete free
            Intuit Academy tax courses.
          </p>
          <ul className="mt-2 space-y-1 text-[11px] text-black">
            <li>
              <a
                href="https://academy.intuit.com/programs/tax-preparation"
                target="_blank"
                className="text-brand-red-700 underline" rel="noreferrer"
              >
                Intuit Academy – Tax Preparation (overview)
              </a>
            </li>
            <li>
              <a
                href="https://academy.intuit.com/programs/tax-level-1"
                target="_blank"
                className="text-brand-red-700 underline" rel="noreferrer"
              >
                Tax Level 1 – Federal Individual Tax Fundamentals
              </a>
            </li>
            <li>
              <a
                href="https://academy.intuit.com/programs/tax-level-2"
                target="_blank"
                className="text-brand-red-700 underline" rel="noreferrer"
              >
                Tax Level 2 – Advanced Topics
              </a>
            </li>
          </ul>
          <p className="mt-2 text-[11px] text-black">
            These courses are free and self-paced, and can help learners qualify for seasonal
            or year-round tax preparation opportunities.
          </p>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-black">
        Elevate for Humanity uses this pathway to help learners understand both community
        service through VITA and the steps into paid tax preparation work. Local site
        coordinators and partners will confirm the exact forms, certifications, and
        schedules required each tax season.
      </p>
    </section>
  );
}
