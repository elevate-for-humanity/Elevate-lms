import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { requireRole } from '@/lib/auth/require-role';
import { loadLearnerWorkspace } from '@/lib/learner/workspace';
import { getHandbook } from '@/lib/apprenticeship/handbook-content';
import { AgreementAcceptanceButton } from '@/components/lms/AgreementAcceptanceButton';

const DOCUMENTS: Record<string, { title: string; sections: Array<[string,string]> }> = {
  'enrollment-agreement': { title: 'Enrollment Agreement', sections: [['Training services','Elevate provides the training access, learner support, progress tracking, and credential guidance described in the learner course assignment.'],['Learner commitments','The learner agrees to participate, maintain accurate records, complete required work, and promptly report access or support barriers.'],['Completion','Completion and credential eligibility depend on satisfying program, assessment, attendance, payment or funding, and document requirements.']] },
  'student-handbook': { title: 'Student Handbook', sections: [['Academic progress','Learners must complete assigned activities, assessments, and attendance requirements and maintain satisfactory progress.'],['Conduct and integrity','Learners must act respectfully, follow safety requirements, protect account access, and submit their own work.'],['Support and grievances','Learners may request accessibility support, report barriers, and use the support and grievance process without retaliation.'],['Records and credentials','Enrollment, attendance, progress, agreements, evidence, and credentials are maintained as part of the learner record.']] },
  privacy: { title: 'Privacy and Data Sharing Statement', sections: [['Information collected','Elevate records identity, contact, eligibility, enrollment, attendance, progress, document, support, payment or funding, and employment-outcome information needed to deliver services.'],['Use and sharing','Information is used for training, support, compliance, funding, credentialing, placement, and required reporting, and is shared only with authorized providers, funders, employers, credential partners, or agencies as applicable.'],['Protection and choices','Access is role-based. Learners may request access or correction and should contact support with privacy questions.']] },
  'student-mou': { title: 'Student Participation MOU', sections: [['Shared purpose','The learner and Elevate agree to work together toward training completion and employment or advancement goals.'],['Elevate commitments','Elevate will provide assigned access, reasonable support, progress information, and referrals described by the program.'],['Learner commitments','The learner will communicate, participate, complete requirements, protect login credentials, and notify support when circumstances change.']] },
  'apprenticeship-agreement': {
    title: 'Apprenticeship Agreement',
    sections: [
      ['Program participation', 'The apprentice agrees to participate in assigned related instruction and supervised work-based learning, follow the approved training plan, and maintain accurate attendance, work-hour, and competency records.'],
      ['Worksite and supervision', 'Work-based learning occurs only at an approved host site under an authorized supervisor. The apprentice must promptly report any change in employer, host site, supervisor, schedule, wage, or employment status.'],
      ['Time, wages, and records', 'The apprentice must record only time actually worked or attended. The employer or host site remains responsible for employment records, lawful wages, supervision, and required approvals. Elevate maintains training and compliance records.'],
      ['Conduct and safety', 'The apprentice agrees to follow safety, sanitation, professional conduct, privacy, nondiscrimination, and applicable licensing requirements. Falsifying time, documents, signatures, or competencies is prohibited.'],
      ['Completion and changes', 'Completion depends on satisfying the applicable related-instruction, competency, attendance, documentation, payment or funding, and licensing requirements. The governing registered standard or signed program addendum controls when it applies.'],
      ['Electronic signature', 'Selecting “I have read and agree” records the signer identity, agreement version, timestamp, network and device audit information, and constitutes an electronic signature.'],
    ],
  },
};

export default async function LegalDocumentPage({ params }: { params: Promise<{ document: string }> }) {
  const { user, profile } = await requireRole(['student','learner','admin']);
  const slug = (await params).document;
  const document = DOCUMENTS[slug];
  if (!document) notFound();
  const workspace = await loadLearnerWorkspace(user.id, profile?.role || 'student');
  const agreement = workspace.agreements.find((item) => item.documentUrl.endsWith(`/legal/${slug}`));
  const programSlug = workspace.enrollments[0]?.program_slug || '';
  const handbook = slug === 'student-handbook' ? getHandbook(programSlug) : null;
  return <article className="mx-auto max-w-4xl space-y-6 pb-28"><div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Required legal document</p><h1 className="mt-2 text-3xl font-black">{handbook?.programName ? `${handbook.programName} Handbook` : document.title}</h1><p className="mt-2 text-sm text-slate-600">Version {handbook?.version || agreement?.version || '1.0'}{handbook?.effectiveDate ? ` · Effective ${handbook.effectiveDate}` : ''}</p></div>{handbook ? handbook.sections.map((section) => <section key={section.id} className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-black">{section.title}</h2><div className="prose prose-slate mt-4 max-w-none"><ReactMarkdown>{section.content}</ReactMarkdown></div></section>) : document.sections.map(([title,body]) => <section key={title} className="rounded-2xl border bg-white p-6"><h2 className="text-lg font-black">{title}</h2><p className="mt-2 leading-7 text-slate-700">{body}</p></section>)}{agreement ? <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white/95 p-4 shadow-xl backdrop-blur"><p className="text-sm font-bold text-slate-800">{agreement.signed ? 'This document has been acknowledged.' : 'Finish by recording your acknowledgment.'}</p>{agreement.signed ? <span className="font-black text-emerald-700">Complete</span> : <AgreementAcceptanceButton type={agreement.type} version={agreement.version} />}</div> : null}</article>;
}
