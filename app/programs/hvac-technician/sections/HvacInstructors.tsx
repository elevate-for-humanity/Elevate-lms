import React from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import type {
  HvacProgramInstructorsBlock,
  AiTutorGuide,
  CredentialedPartnerEntry,
} from '../hvac-program-data';
import { hvacInstructorsBlock, HVAC_FAQS } from '../hvac-program-data';
import { ProgramTutorCTA } from '@/components/ProgramTutorCTA';

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-white/70">{subtitle}</p> : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
      {children}
    </span>
  );
}

function TutorCard({ tutor }: { tutor: AiTutorGuide }) {
  return (
    <Card title={tutor.name} subtitle={`${tutor.role} • ${tutor.availability}`}>
      <div className="flex flex-wrap gap-2">
        {tutor.specialties.map((s) => (
          <Pill key={s}>{s}</Pill>
        ))}
      </div>
      <ul className="mt-4 space-y-2 text-sm text-white/80">
        {tutor.features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PartnerCard({ partner }: { partner: CredentialedPartnerEntry }) {
  return (
    <Card title={partner.name} subtitle={partner.credentialSummary}>
      <div className="flex flex-wrap gap-2">
        {partner.areas.map((a) => (
          <Pill key={a}>{a}</Pill>
        ))}
      </div>
      {partner.verificationNote ? (
        <p className="mt-4 text-sm text-white/70">{partner.verificationNote}</p>
      ) : null}
      {partner.websiteUrl ? (
        <div className="mt-4">
          <a
            href={partner.websiteUrl}
            className="text-sm font-medium text-white underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            Visit partner site
          </a>
        </div>
      ) : null}
    </Card>
  );
}

function InstructorsAndTutorsSection({ block }: { block: HvacProgramInstructorsBlock }) {
  return (
    <section className="bg-slate-900 py-14">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold text-white">{block.heading}</h2>
          <p className="max-w-3xl text-sm text-white/70">{block.subheading}</p>
        </div>

        <div className="mt-8 grid gap-10">
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">AI Tutors &amp; Guides</h3>
              <span className="text-xs text-white/60">Activated inside the LMS upon enrollment</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {block.aiTutors.map((t) => (
                <TutorCard key={t.id} tutor={t} />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Credentialed Partners</h3>
              <span className="text-xs text-white/60">Instruction, labs, and verification</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {block.credentialedPartners.map((p) => (
                <PartnerCard key={p.id} partner={p} />
              ))}
            </div>
          </div>
        </div>

        <ProgramTutorCTA
          programSlug="hvac-technician"
          programName="Building Technician with HVAC Fundamentals"
          applyHref="/programs/hvac-technician/apply"
          suggestions={['What is EPA 608?', 'How long is the program?', 'Is tuition covered?', 'What jobs can I get?']}
        />
      </div>
    </section>
  );
}

export function HvacInstructors() {
  return (
    <>
      <InstructorsAndTutorsSection block={hvacInstructorsBlock} />

      {/* FAQs */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-brand-blue-600" />
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 mb-8">
            Common questions about the Building Technician with HVAC Fundamentals program.
          </p>
          <div className="space-y-3">
            {HVAC_FAQS.map((faq, i) => (
              <details key={i} className="group bg-white border border-slate-200 rounded-lg">
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 font-semibold text-slate-900 text-sm">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-5 pb-4 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
