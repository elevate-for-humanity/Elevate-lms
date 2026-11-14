// pre-auth-registry: exempt - authenticated holder context protects partner templates.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { partnerStandards } from '@/lib/program-holder/professional-standards';
const templates: Record<string, { title: string; lines: string[] }> = {
  'staff-orientation': {
    title: 'Team orientation checklist',
    lines: [
      'Business: __________________  Team member: __________________',
      'Role and employment/contract arrangement: __________________',
      'Supervisor / contact: __________________  Date: __________________',
      'Review: role and duties; applicable agreement; handbook; privacy/confidentiality; safety and required protective equipment; student support and accommodations; attendance and progress records; reporting and escalation; compensation/payroll under the applicable agreement.',
      'Record the title and version of each document reviewed: __________________',
      'Questions and follow-up: __________________',
      'Team member acknowledgement: I reviewed the listed materials and had an opportunity to ask questions.',
      'Team member signature / date: __________________',
      'Business representative signature / date: __________________',
      'Blank template only. Do not use this checklist as a substitute for an individual contract, tax form or required legal notice.',
    ],
  },
  'training-plan': {
    title: 'Program syllabus and training-plan worksheet',
    lines: [
      'Business / instructor / program: __________________',
      'Credential target and prerequisites: __________________',
      'Learning objectives: __________________',
      'Modules, activities and hands-on practice: __________________',
      'Delivery format / location / schedule / total hours: __________________',
      'Assessment and competency evidence: __________________',
      'Attendance and progress reporting: __________________',
      'Safety, equipment and accommodations: __________________',
      'Completion criteria and support contact: __________________',
      'Complete and save the syllabus text in Dashboard > Documents to start your secondary course build. Keep original third-party licenses and materials attached when applicable.',
    ],
  },
  invoice: {
    title: 'Training invoice worksheet',
    lines: [
      'Business: __________________ Invoice reference / date: __________________',
      'Student / enrollment: __________________',
      'Program / service dates: __________________',
      'Milestone: start / completion / other: __________________',
      'Signed MOU / addendum reference: __________________',
      'Agreed amount / prior paid / amount requested: __________________',
      'Services and supporting records: __________________',
      'Adjustment explanation, if any: __________________',
      'Prepared by / signature / date: __________________',
      'Use Dashboard > Payouts to select an assigned student and submit the invoice. This worksheet does not authorize or confirm a payment.',
    ],
  },
  'meeting-notes': {
    title: 'Training and follow-up meeting notes',
    lines: [
      'Business / date / attendees: __________________',
      'Authorized student or team record reference: __________________',
      'Progress and evidence reviewed: __________________',
      'Questions or barriers: __________________',
      'Action / owner / due date: __________________',
      'Next check-in: __________________',
      'Record private student information only in the approved dashboard.',
    ],
  },
  standards: {
    title: 'Professional standards',
    lines: partnerStandards.flatMap(([heading, body]) => [heading, body]),
  },
};
export async function GET(request: Request) {
  await requireProgramHolder({ allowPendingApproval: true });
  const key = new URL(request.url).searchParams.get('type') || '';
  const template = Object.prototype.hasOwnProperty.call(templates, key) ? templates[key] : null;
  if (!template)
    return NextResponse.json({ error: 'Choose an available template.' }, { status: 400 });
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF();
  let y = 20;
  pdf.setFontSize(17);
  pdf.text(template.title, 15, y);
  y += 12;
  pdf.setFontSize(11);
  for (const text of template.lines) {
    for (const line of pdf.splitTextToSize(text, 178)) {
      if (y > 275) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, 15, y);
      y += 6;
    }
    y += 7;
  }
  return new Response(pdf.output('arraybuffer'), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="elevate-template.pdf"',
      'Cache-Control': 'private, no-store',
    },
  });
}
