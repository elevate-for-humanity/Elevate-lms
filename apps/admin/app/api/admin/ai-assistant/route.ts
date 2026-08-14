import type { SupabaseClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { aiChat } from '@/lib/ai/ai-service';
import { hydrateProcessEnv } from '@/lib/secrets';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ELLIE_ACTION_REGISTRY, type EllieActionType } from '@/lib/ellie/actions';

const SYSTEM_PROMPT = `You are Ellie — the AI operations assistant for ${PLATFORM_DEFAULTS.orgName}, a DOL-registered apprenticeship sponsor and Indiana ETPL/WIOA/WRG/JRI-approved workforce development organization based in Indianapolis, Indiana.

You are NOT a generic chatbot. You are deeply embedded in this organization. You know the staff, the programs, the students, the funding sources, the compliance requirements, and the live operational data. You speak like a knowledgeable colleague — direct, warm, and specific. Never say "I don't have access to that" when the live data is provided to you.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORGANIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${PLATFORM_DEFAULTS.orgName}
Website: ${PLATFORM_DEFAULTS.canonicalDomain}
Admin portal: admin.${PLATFORM_DEFAULTS.canonicalDomain}
Phone: ${PLATFORM_DEFAULTS.supportPhone}
Address: Indianapolis, Indiana
Approvals: Indiana ETPL, WIOA Title I, Workforce Ready Grant (WRG), Job Ready Indy (JRI), DOL Registered Apprenticeship Sponsor, FSSA IMPACT, EmployIndy partner
Tax entity: Also operates Selfish Inc. (501(c)(3)) for VITA free tax prep
Testing: Certiport Authorized Testing Center (CATC), EPA 608 Certified Proctor (ESCO #358010 and Mainstream Engineering)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STAFF — know these people by name
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Elizabeth Greene — Founder & CEO. U.S. Army veteran. IRS Enrolled Agent (EA), EFIN/PTIN holder, ERO, SBIN-authorized federal tax software submitter. Licensed barber. Indiana substitute teacher. OSHA 10-Hour certified. EPA 608 Certified Proctor. Leads all tax operations and Selfish Inc. Email: elizabethpowell6262@gmail.com

Jozanna George — Director of Enrollment & Beauty Industry Programs. Multi-licensed: Nail Technician, Nail Instructor, Esthetician. Oversees nail program at Textures Institute of Cosmetology. Email: jozanna@${PLATFORM_DEFAULTS.canonicalDomain}

Dr. Carlina Wilkes — Executive Director of Financial Operations & Organizational Compliance. 24+ years federal experience with DFAS. DoD Financial Management Certification Level II. Email: carlina@elevateforhumanity.org

Leslie Wafford — Director of Community Services. Housing access and eviction prevention. Email: leslie@elevateforhumanity.org

Delores Reynolds — Social Media & Digital Engagement Coordinator. Email: delores@elevateforhumanity.org

Clystjah Woodley — Program Coordinator. Student services and enrollment support. Email: clystjah@elevateforhumanity.org

Naomi Jordan — Director of Healthcare Administration. Owner of Rebuilds Mind and Body Studio LLC. Credentials: CNA, HHA, Phlebotomy Technician, QMA. Oversees all healthcare programs. Email: naomi@elevateforhumanity.org

Ameco Martin — Director of Information Technology. Owner of Ameco's Enterprise LLC. BS Computer Programming. Oversees all IT/tech programs. Career Coach at Warren Central High School (WIOA In-School Youth). Email: amecosenterprise@gmail.com

Alberta Davis — Testing Center Coordinator & Exam Proctor. Coordinates certification exams. Email: alberta@elevateforhumanity.org

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROGRAMS & PRICING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HEALTHCARE (Director: Naomi Jordan)
- CNA — $1,850 — 6 weeks — State certification
- Medical Assistant — $5,565 — 20 weeks — NHA CCMA
- Phlebotomy Technician — $4,750 — 6 weeks — NHA CPT
- Pharmacy Technician — $5,200 — 16 weeks
- Home Health Aide — $575
- Drug & Alcohol Specimen Collector — $1,800 — 2 weeks
- Dental Assistant — $4,500 — 12 weeks
- Community Healthcare Worker — $1,200
- Peer Recovery Specialist — WIOA-funded

SKILLED TRADES
- HVAC Technician — $5,000 — 8 weeks — EPA 608
- CDL Training — $4,550 — 4 weeks
- Welding — $5,500
- Building Maintenance Technician — $4,730 — 12 weeks — WRG eligible
- Solar Panel Installation — $4,200 — 12 weeks
- Manufacturing Technician — $4,200 — 12 weeks
- Automotive Technician — $9,500 — 32 weeks
- Diesel Mechanic — $9,500 — 32 weeks
- Electrical Apprenticeship — DOL registered
- Plumbing Apprenticeship — DOL registered

APPRENTICESHIPS (DOL Registered)
- Barber Apprenticeship — $4,980 — 52 weeks — Indiana State Barber License
- Cosmetology Apprenticeship — $4,950 — 52 weeks — Indiana State Cosmetology License
- Esthetician Apprenticeship — State license
- Nail Technician Apprenticeship — State license
- Culinary Apprenticeship — 40 weeks
- EMT Apprenticeship — 12 weeks

TECHNOLOGY (Director: Ameco Martin)
- IT Help Desk / CompTIA A+ — Certification
- Cybersecurity Analyst — $9,100 — 24 weeks
- Network Administration — Certification
- Web Development — $8,120 — 24 weeks
- Software Development — Certification
- Data Analytics — $7,280 — 20 weeks
- Graphic Design — Certification
- CAD/Drafting — Certification

BUSINESS & FINANCE
- Bookkeeping — $2,800 — 16 weeks
- Administrative Assistant — $4,200 — 12 weeks
- Business Start-Up — $5,200
- Real Estate Agent — $4,200 — 12 weeks
- Insurance Agent — $2,800 — 8 weeks
- Tax Preparation — $2,800

SPECIAL PROGRAMS
- JRI (Justice-Reinvestment Initiative) — Reentry workforce training
- Life Coach Certification — $750 — 12 weeks — WIOA eligible
- NRF Rise Up — $399 — Retail/hospitality
- Reentry Specialist — WIOA-funded

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FUNDING SOURCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- WIOA Title I (WorkOne) — covers most programs for eligible adults/dislocated workers/youth
- Workforce Ready Grant (WRG) — Indiana state grant for high-demand occupations
- Job Ready Indy (JRI) — Marion County workforce grant
- FSSA IMPACT — Indiana welfare-to-work funding
- EmployIndy — Indianapolis workforce board, WIOA In-School Youth contracts
- Self-pay — 35% deposit + payment plan, Affirm and Sezzle BNPL available
- Employer-sponsored — employers can sponsor employees

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW YOU RESPOND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Use the LIVE DATA snapshot provided with every message — it has real numbers
- Be specific — use real names, real prices, real program names
- Format responses clearly — use bullet points and headers for operational data
- For compliance questions, be precise and cite the relevant funding source
- Never make up data — if something is not in the live snapshot, say so
- Suggest admin actions with specific URLs: "Go to /admin/applications to review these"
- Keep responses concise for simple questions, detailed for operational queries
- You remember the full conversation — refer back to earlier messages when relevant
- When someone asks about a student by name, use the ADDITIONAL LOOKUP DATA if provided

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIONS YOU CAN TAKE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When asked to perform an action, respond with your explanation AND append a JSON action block at the very end of your response in this exact format (no markdown fences, one block per action):

ACTION:{"type":"<action_type>","label":"<short button label>","params":{...},"targetCount":<number>}

Supported action types and required params:
- send_reminder          — { userIds: string[], message?: string }
- flag_at_risk           — { enrollmentIds: string[], reason?: string }
- unflag_at_risk         — { enrollmentIds: string[] }
- approve_application    — { applicationId: string, studentName?: string }
- reject_application     — { applicationId: string, studentName?: string, reason?: string }
- approve_program_holder — { programHolderId: string, orgName?: string }
- reject_program_holder  — { programHolderId: string, orgName?: string, reason?: string }
- issue_certificate      — { enrollmentId: string, studentName?: string }
- send_magic_link        — { email: string, name?: string }
- assign_case_manager    — { enrollmentId: string, caseManagerId: string, studentName?: string, caseManagerName?: string }
- schedule_exam          — { firstName: string, lastName: string, email: string, examType: string, examName?: string, preferredDate: string, preferredTime?: string, userId?: string, notes?: string }
- cancel_exam            — { bookingId: string, reason?: string }
- run_workflow           — { workflowId: string, workflowName?: string }
- navigate               — { url: string }

Rules:
- Only include ACTION blocks when the user explicitly asks you to DO something.
- For bulk actions (send_reminder, flag_at_risk), include ALL relevant IDs from the lookup data.
- Always explain what you are about to do BEFORE the ACTION block.
- The user must confirm — the action is staged for approval, not executed immediately.
- targetCount should reflect how many records will be affected.`;

async function getLiveDataSnapshot(db: SupabaseClient): Promise<string> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date(); today.setHours(0,0,0,0);

  const [
    pendingApps, totalApps, activeEnrollments, totalStudents,
    revenueMonth, revenueAll, certs, atRisk,
    complianceAlerts, pendingWioa, pendingSignatures,
    openContracts, activeGrants, staleLeads,
    pendingWorkflows, publishedLessons, programBreakdown,
    // New: testing center
    examBookingsToday, examBookingsPending, examBookingsPaid,
    // New: program holders & employers
    pendingProgramHolders, activeProgramHolders, activeEmployers,
    // New: delivery / automation
    emailsSentToday, emailsFailed,
    // New: CRM pipeline
    hotLeads, newLeadsToday,
    // New: at-risk detail
    atRiskDetail,
    // New: placements + SNAP
    activePlacements,
    activeSnapParticipants,
  ] = await Promise.all([
    db.from('applications').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'pending_admin_review', 'under_review']),
    db.from('applications').select('id', { count: 'exact', head: true }),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid').gte('created_at', monthStart),
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid'),
    db.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active').or(`last_activity_at.lt.${cutoff7d},last_activity_at.is.null`),
    db.from('compliance_alerts').select('id', { count: 'exact', head: true }).neq('status', 'resolved'),
    db.from('wioa_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('document_signatures').select('id', { count: 'exact', head: true }).is('signed_at', null),
    db.from('mou_documents').select('id', { count: 'exact', head: true }),
    db.from('grants').select('id', { count: 'exact', head: true }).in('status', ['draft', 'in_progress', 'submitted']),
    db.from('crm_leads').select('id', { count: 'exact', head: true }).or(`last_contact_at.lt.${cutoff7d},last_contact_at.is.null`).neq('status', 'closed'),
    db.from('workflows').select('id', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
    db.from('curriculum_lessons').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('program_enrollments').select('programs(name), status').eq('status', 'active').limit(200),
    // Testing center
    db.from('exam_bookings').select('id', { count: 'exact', head: true }).gte('preferred_date', today.toISOString().split('T')[0]),
    db.from('exam_bookings').select('id', { count: 'exact', head: true }).in('status', ['pending', 'submitted']),
    db.from('exam_bookings').select('id', { count: 'exact', head: true }).eq('payment_status', 'paid'),
    // Program holders & employers
    db.from('program_holder_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('program_holder_profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('employer_profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    // Delivery logs
    db.from('delivery_logs').select('id', { count: 'exact', head: true }).eq('channel', 'email').eq('status', 'sent').gte('created_at', today.toISOString()),
    db.from('delivery_logs').select('id', { count: 'exact', head: true }).eq('channel', 'email').eq('status', 'failed').gte('created_at', monthStart),
    // CRM hot leads
    db.from('crm_leads').select('id', { count: 'exact', head: true }).eq('status', 'hot'),
    db.from('crm_leads').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    // At-risk names
    db.from('program_enrollments').select('profiles(full_name), programs(name), last_activity_at').eq('status', 'active').or(`last_activity_at.lt.${cutoff7d},last_activity_at.is.null`).limit(5),
    // Placements
    db.from('job_placements').select('id', { count: 'exact', head: true }).eq('status', 'placed'),
    // SNAP E&T / FSSA
    db.from('snap_participants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  const sum = (rows: Record<string, unknown>[]) =>
    rows.reduce((s, r) => s + ((r.amount_paid_cents as number) ?? 0), 0);
  const monthCents = sum(revenueMonth.data ?? []);
  const allCents   = sum(revenueAll.data   ?? []);

  const programCounts: Record<string, number> = {};
  for (const row of (programBreakdown.data ?? []) as any[]) {
    const name = (row.programs as any)?.name ?? 'Unknown';
    programCounts[name] = (programCounts[name] ?? 0) + 1;
  }
  const topPrograms = Object.entries(programCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([name, count]) => `  ${name}: ${count} active`).join('\n') || '  (none)';

  const atRiskNames = (atRiskDetail.data ?? []).slice(0, 5).map((r: any) =>
    `  ${(r.profiles as any)?.full_name ?? 'Unknown'} — ${(r.programs as any)?.name ?? 'Unknown'} (last active: ${r.last_activity_at ? new Date(r.last_activity_at).toLocaleDateString() : 'never'})`
  ).join('\n') || '  None';

  return `LIVE DATA (${now.toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' })} ET):

STUDENTS & ENROLLMENT
- Total students: ${totalStudents.count ?? 0}
- Active enrollments: ${activeEnrollments.count ?? 0}
- At-risk learners (inactive 7d+): ${atRisk.count ?? 0}
- Certificates issued: ${certs.count ?? 0}

AT-RISK LEARNERS (top 5):
${atRiskNames}

TOP ACTIVE PROGRAMS
${topPrograms}

APPLICATIONS
- Pending review: ${pendingApps.count ?? 0}
- Total applications: ${totalApps.count ?? 0}

REVENUE
- This month: $${(monthCents / 100).toLocaleString('en-US')}
- All time: $${(allCents / 100).toLocaleString('en-US')}

TESTING CENTER
- Exam bookings today: ${examBookingsToday.count ?? 0}
- Pending bookings: ${examBookingsPending.count ?? 0}
- Paid bookings: ${examBookingsPaid.count ?? 0}

PROGRAM HOLDERS & EMPLOYERS
- Pending program holder approvals: ${pendingProgramHolders.count ?? 0}
- Active program holders: ${activeProgramHolders.count ?? 0}
- Active employers: ${activeEmployers.count ?? 0}

COMPLIANCE & DOCUMENTS
- Open compliance alerts: ${complianceAlerts.count ?? 0}
- Pending WIOA documents: ${pendingWioa.count ?? 0}
- Pending signatures: ${pendingSignatures.count ?? 0}

CONTRACTS & GRANTS
- Active contracts/MOUs: ${openContracts.count ?? 0}
- Active/in-progress grants: ${activeGrants.count ?? 0}

CRM & MARKETING
- Hot leads: ${hotLeads.count ?? 0}
- New leads today: ${newLeadsToday.count ?? 0}
- Stale leads (7d+ no contact): ${staleLeads.count ?? 0}

AUTOMATION & DELIVERY
- Emails sent today: ${emailsSentToday.count ?? 0}
- Email failures this month: ${emailsFailed.count ?? 0}
- Active workflows: ${pendingWorkflows.count ?? 0}

PLACEMENTS & SPECIAL PROGRAMS
- Active job placements: ${activePlacements.count ?? 0}
- Active SNAP E&T participants: ${activeSnapParticipants.count ?? 0}

CURRICULUM
- Published lessons: ${publishedLessons.count ?? 0}`;
}

interface IntentResult {
  text: string;
  // Structured action payload extracted from the lookup — used to pre-populate
  // the ACTION block so Ellie has real IDs to work with, not placeholders.
  actionHint?: {
    type: EllieActionType;
    label: string;
    params: Record<string, unknown>;
    targetCount: number;
  };
}

async function resolveIntent(message: string, db: SupabaseClient): Promise<IntentResult> {
  const lower = message.toLowerCase();
  const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date(); today.setHours(0,0,0,0);

  // Name lookup
  const nameMatch = message.match(
    /(?:find|look up|search|show|who is|tell me about|status of|check on|what about)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i
  );
  if (nameMatch && !lower.includes('program') && !lower.includes('grant')) {
    const query = nameMatch[1].trim();
    const parts = query.split(' ');
    const firstName = parts[0];
    const lastName = parts[1] ?? '';

    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .or(lastName
        ? `full_name.ilike.%${firstName}%,full_name.ilike.%${lastName}%`
        : `full_name.ilike.%${firstName}%`)
      .limit(5);

    if (profiles && profiles.length > 0) {
      const results = await Promise.all(profiles.map(async (p: any) => {
        const { data: enrollments } = await db
          .from('program_enrollments')
          .select('programs(name), status, created_at, amount_paid_cents')
          .eq('user_id', p.id)
          .order('created_at', { ascending: false })
          .limit(3);

        const { data: apps } = await db
          .from('applications')
          .select('status, created_at, programs(name)')
          .eq('user_id', p.id)
          .order('created_at', { ascending: false })
          .limit(3);

        const enrollStr = (enrollments ?? []).map((e: any) =>
          `    • ${(e.programs as any)?.name ?? 'Unknown'} — ${e.status} ($${((e.amount_paid_cents ?? 0) / 100).toLocaleString()} paid)`
        ).join('\n') || '    None';

        const appStr = (apps ?? []).map((a: any) =>
          `    • ${(a.programs as any)?.name ?? 'Unknown'} — ${a.status} (${new Date(a.created_at).toLocaleDateString()})`
        ).join('\n') || '    None';

        return `${p.full_name} | ${p.role} | ${p.email}\n  Enrollments:\n${enrollStr}\n  Applications:\n${appStr}`;
      }));
      return { text: `PERSON LOOKUP — "${query}":\n${results.join('\n\n')}` };
    }
    return { text: `PERSON LOOKUP: No profiles found matching "${query}".` };
  }

  // Recent applications
  if ((lower.includes('recent') || lower.includes('latest') || lower.includes('new')) && lower.includes('application')) {
    const { data } = await db
      .from('applications')
      .select('id, created_at, status, profiles(full_name, email), programs(name)')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data?.length) {
      return {
        text: `RECENT APPLICATIONS:\n${data.map((a: any) =>
          `• ${(a.profiles as any)?.full_name ?? 'Unknown'} → ${(a.programs as any)?.name ?? 'Unknown'} (${a.status}) — ${new Date(a.created_at).toLocaleDateString()}`
        ).join('\n')}`,
      };
    }
  }

  // Pending applications list
  if (lower.includes('pending') && lower.includes('application')) {
    const { data } = await db
      .from('applications')
      .select('id, created_at, status, profiles(full_name, email), programs(name)')
      .in('status', ['submitted', 'pending_admin_review', 'under_review'])
      .order('created_at', { ascending: false })
      .limit(15);
    if (data?.length) {
      return {
        text: `PENDING APPLICATIONS (${data.length}):\n${data.map((a: any) =>
          `• ${(a.profiles as any)?.full_name ?? 'Unknown'} → ${(a.programs as any)?.name ?? 'Unknown'} (${a.status}) — ${new Date(a.created_at).toLocaleDateString()}`
        ).join('\n')}`,
      };
    }
  }

  // Revenue detail
  if (lower.includes('revenue') || (lower.includes('how much') && lower.includes('paid'))) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data } = await db
      .from('program_enrollments')
      .select('amount_paid_cents, programs(name), created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', monthStart)
      .order('amount_paid_cents', { ascending: false })
      .limit(20);
    if (data?.length) {
      const total = data.reduce((s: number, r: any) => s + (r.amount_paid_cents ?? 0), 0);
      return {
        text: `REVENUE THIS MONTH — $${(total / 100).toLocaleString()} total:\n${data.map((r: any) =>
          `• ${(r.programs as any)?.name ?? 'Unknown'}: $${((r.amount_paid_cents ?? 0) / 100).toLocaleString()}`
        ).join('\n')}`,
      };
    }
  }

  // At-risk learners
  if (lower.includes('at-risk') || lower.includes('at risk') || lower.includes('inactive') || lower.includes('falling behind') || lower.includes('not logging in')) {
    const { data } = await db
      .from('program_enrollments')
      .select('id, user_id, profiles(full_name, email), programs(name), last_activity_at, progress_percent')
      .eq('status', 'active')
      .or(`last_activity_at.lt.${cutoff7d},last_activity_at.is.null`)
      .order('last_activity_at', { ascending: true, nullsFirst: true })
      .limit(20);
    if (data?.length) {
      const text = `AT-RISK LEARNERS (${data.length} inactive 7d+):\n${data.map((r: any) =>
        `• ${(r.profiles as any)?.full_name ?? 'Unknown'} (${(r.profiles as any)?.email ?? ''}) — ${(r.programs as any)?.name ?? 'Unknown'} — ${r.progress_percent ?? 0}% complete — last active: ${r.last_activity_at ? new Date(r.last_activity_at).toLocaleDateString() : 'never'}`
      ).join('\n')}`;
      return {
        text,
        actionHint: {
          type: 'send_reminder',
          label: `Send ${data.length} Reminders`,
          params: {
            userIds: data.map((r: any) => r.user_id).filter(Boolean),
            message: 'Your program coordinator wanted to check in — please log back in to continue your progress.',
          },
          targetCount: data.length,
        },
      };
    }
    return { text: 'No at-risk learners found.' };
  }

  // Testing center
  if (lower.includes('exam') || lower.includes('testing') || lower.includes('booking') || lower.includes('nha') || lower.includes('certiport') || lower.includes('workkeys')) {
    const { data } = await db
      .from('exam_bookings')
      .select('id, first_name, last_name, email, exam_type, exam_name, preferred_date, status, payment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data?.length) {
      return {
        text: `RECENT EXAM BOOKINGS (${data.length}):\n${data.map((b: any) =>
          `• ${b.first_name} ${b.last_name} (${b.email}) — ${b.exam_name ?? b.exam_type} — ${b.preferred_date ?? 'no date'} — status: ${b.status} — payment: ${b.payment_status}`
        ).join('\n')}`,
      };
    }
    return { text: 'No exam bookings found.' };
  }

  // Program holders
  if (lower.includes('program holder') || lower.includes('partner') || lower.includes('franchise') || lower.includes('mou')) {
    const { data } = await db
      .from('program_holder_profiles')
      .select('id, org_name, contact_name, email, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data?.length) {
      const pending = data.filter((p: any) => p.status === 'pending');
      return {
        text: `PROGRAM HOLDERS (${data.length}):\n${data.map((p: any) =>
          `• ${p.org_name} — ${p.contact_name} (${p.email}) — status: ${p.status}`
        ).join('\n')}`,
        actionHint: pending.length ? {
          type: 'approve_program_holder' as EllieActionType,
          label: `Approve ${pending[0].org_name}`,
          params: { programHolderId: pending[0].id, orgName: pending[0].org_name },
          targetCount: 1,
        } : undefined,
      };
    }
    return { text: 'No program holders found.' };
  }

  // Employers
  if (lower.includes('employer') || lower.includes('company') || lower.includes('hire') || lower.includes('job placement')) {
    const { data } = await db
      .from('employer_profiles')
      .select('id, company_name, contact_name, email, status, industry, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data?.length) {
      return {
        text: `EMPLOYERS (${data.length}):\n${data.map((e: any) =>
          `• ${e.company_name} — ${e.contact_name} (${e.email}) — ${e.industry ?? 'unknown industry'} — status: ${e.status}`
        ).join('\n')}`,
      };
    }
    return { text: 'No employers found.' };
  }

  // WIOA / grants / funding
  if (lower.includes('wioa') || lower.includes('grant') || lower.includes('funding') || lower.includes('jri') || lower.includes('dislocated') || lower.includes('snap')) {
    const [{ data: wioa }, { data: grants }, { data: snap }] = await Promise.all([
      db.from('wioa_documents').select('participant_name, status, program_name, created_at').order('created_at', { ascending: false }).limit(15),
      db.from('grants').select('title, status, amount_requested, deadline, created_at').order('created_at', { ascending: false }).limit(10),
      db.from('snap_participants').select('full_name, status, program_name, created_at').order('created_at', { ascending: false }).limit(10),
    ]);
    const parts: string[] = [];
    if (wioa?.length) parts.push(`WIOA DOCUMENTS (${wioa.length}):\n${wioa.map((w: any) => `• ${w.participant_name} — ${w.program_name ?? 'Unknown'} — ${w.status}`).join('\n')}`);
    if (snap?.length) parts.push(`SNAP E&T PARTICIPANTS (${snap.length}):\n${snap.map((s: any) => `• ${s.full_name} — ${s.program_name ?? 'Unknown'} — ${s.status}`).join('\n')}`);
    if (grants?.length) parts.push(`GRANTS (${grants.length}):\n${grants.map((g: any) => `• ${g.title} — ${g.status} — $${((g.amount_requested ?? 0) / 100).toLocaleString()} — deadline: ${g.deadline ?? 'none'}`).join('\n')}`);
    if (parts.length) return { text: parts.join('\n\n') };
    return { text: 'No WIOA, SNAP, or grant records found.' };
  }

  // Compliance / audit
  if (lower.includes('compliance') || lower.includes('audit') || lower.includes('ferpa') || lower.includes('alert')) {
    const { data } = await db
      .from('compliance_alerts')
      .select('title, severity, status, created_at')
      .neq('status', 'resolved')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data?.length) {
      return {
        text: `OPEN COMPLIANCE ALERTS (${data.length}):\n${data.map((a: any) =>
          `• [${a.severity ?? 'info'}] ${a.title} — ${a.status}`
        ).join('\n')}`,
      };
    }
    return { text: 'No open compliance alerts.' };
  }

  // CRM / leads
  if (lower.includes('lead') || lower.includes('crm') || lower.includes('prospect') || lower.includes('pipeline')) {
    const { data } = await db
      .from('crm_leads')
      .select('id, full_name, email, status, program_interest, last_contact_at, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data?.length) {
      const stale = data.filter((l: any) => !l.last_contact_at || new Date(l.last_contact_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      return {
        text: `CRM LEADS (${data.length}):\n${data.map((l: any) =>
          `• ${l.full_name} (${l.email}) — ${l.program_interest ?? 'unknown interest'} — status: ${l.status} — last contact: ${l.last_contact_at ? new Date(l.last_contact_at).toLocaleDateString() : 'never'}`
        ).join('\n')}`,
        actionHint: stale.length ? {
          type: 'send_reminder' as EllieActionType,
          label: `Follow Up ${stale.length} Stale Leads`,
          params: {
            userIds: stale.map((l: any) => l.id).filter(Boolean),
            message: 'Following up on your interest in our programs.',
          },
          targetCount: stale.length,
        } : undefined,
      };
    }
    return { text: 'No CRM leads found.' };
  }

  // Delivery / email automation
  if (lower.includes('email') || lower.includes('delivery') || lower.includes('notification') || lower.includes('sent') || lower.includes('failed')) {
    const { data } = await db
      .from('delivery_logs')
      .select('channel, status, template_name, recipient, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data?.length) {
      const failed = data.filter((d: any) => d.status === 'failed');
      return {
        text: `DELIVERY LOG (${data.length} recent):\n${failed.length ? `⚠️ ${failed.length} failed:\n${failed.map((d: any) => `  • ${d.template_name ?? d.channel} → ${d.recipient}`).join('\n')}\n\n` : ''}${data.map((d: any) =>
          `• [${d.status}] ${d.template_name ?? d.channel} → ${d.recipient} — ${new Date(d.created_at).toLocaleDateString()}`
        ).join('\n')}`,
      };
    }
    return { text: 'No delivery logs found.' };
  }

  // Workflows
  if (lower.includes('workflow') || lower.includes('automation') || lower.includes('cron')) {
    const { data } = await db
      .from('workflows')
      .select('id, name, status, last_run_at, next_run_at, trigger_type')
      .order('last_run_at', { ascending: false, nullsFirst: false })
      .limit(20);
    if (data?.length) {
      return {
        text: `WORKFLOWS (${data.length}):\n${data.map((w: any) =>
          `• ${w.name} — ${w.status} — trigger: ${w.trigger_type ?? 'manual'} — last run: ${w.last_run_at ? new Date(w.last_run_at).toLocaleDateString() : 'never'}`
        ).join('\n')}`,
      };
    }
    return { text: 'No workflows found.' };
  }

  // Certificates
  if (lower.includes('certificate') || lower.includes('credential') || lower.includes('certified') || lower.includes('graduated')) {
    const { data } = await db
      .from('program_completion_certificates')
      .select('profiles(full_name), programs(name), issued_at, certificate_number')
      .order('issued_at', { ascending: false })
      .limit(20);
    if (data?.length) {
      return {
        text: `CERTIFICATES ISSUED (${data.length}):\n${data.map((c: any) =>
          `• ${(c.profiles as any)?.full_name ?? 'Unknown'} — ${(c.programs as any)?.name ?? 'Unknown'} — ${c.issued_at ? new Date(c.issued_at).toLocaleDateString() : 'pending'} — #${c.certificate_number ?? 'N/A'}`
        ).join('\n')}`,
      };
    }
    return { text: 'No certificates issued yet.' };
  }

  // Curriculum / lessons / courses
  if (lower.includes('lesson') || lower.includes('course') || lower.includes('curriculum') || lower.includes('module') || lower.includes('content')) {
    const { data } = await db
      .from('curriculum_lessons')
      .select('title, step_type, status, module_order, lesson_order')
      .eq('status', 'published')
      .order('module_order', { ascending: true })
      .limit(30);
    if (data?.length) {
      return {
        text: `PUBLISHED LESSONS (${data.length}):\n${data.map((l: any) =>
          `• [${l.step_type}] ${l.title} (module ${l.module_order}, lesson ${l.lesson_order})`
        ).join('\n')}`,
      };
    }
    return { text: 'No published lessons found.' };
  }

  // Staff / team
  if (lower.includes('staff') || lower.includes('instructor') || lower.includes('admin user') || lower.includes('team member')) {
    const { data } = await db
      .from('profiles')
      .select('full_name, email, role, created_at')
      .in('role', ['admin', 'staff', 'instructor'])
      .order('role', { ascending: true })
      .limit(30);
    if (data?.length) {
      return {
        text: `STAFF & INSTRUCTORS (${data.length}):\n${data.map((p: any) =>
          `• ${p.full_name ?? 'Unknown'} (${p.email}) — ${p.role}`
        ).join('\n')}`,
      };
    }
    return { text: 'No staff found.' };
  }

  return { text: '' };
}

async function loadMemory(db: SupabaseClient, userId: string, sessionId: string) {
  const { data } = await db
    .from('ai_conversation_memory')
    .select('role, content')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(30);
  return (data ?? []) as { role: string; content: string }[];
}

async function saveMemory(db: SupabaseClient, userId: string, sessionId: string, role: 'user' | 'assistant', content: string) {
  // Non-fatal — if the table doesn't exist yet the conversation still works,
  // it just won't have cross-message memory until the migration is applied.
  await db.from('ai_conversation_memory').insert({
    user_id: userId,
    session_id: sessionId,
    role,
    content,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }).then(() => {}, () => {});
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  // Load AI keys from platform_secrets / app_secrets into process.env.
  // Must run before any provider resolution so DB-stored keys are visible.
  await hydrateProcessEnv();

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const userMessage: string = body.message ?? '';
  const sessionId: string = body.sessionId ?? 'default';
  // Optional provider/model override from Dev Studio selector
  const preferredProvider: string = body.provider ?? 'auto';
  const preferredModel: string | undefined = body.model;

  if (!userMessage.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const db = await requireAdminClient();

  const [dataSnapshot, intentResult, history] = await Promise.all([
    getLiveDataSnapshot(db),
    resolveIntent(userMessage, db),
    loadMemory(db, auth.id, sessionId),
  ]);

  await saveMemory(db, auth.id, sessionId, 'user', userMessage);

  const intentData = intentResult.text;
  const contextBlock = intentData
    ? `${dataSnapshot}\n\nADDITIONAL LOOKUP DATA:\n${intentData}`
    : dataSnapshot;

  // If the intent resolver found a natural action hint (e.g. "show at-risk" → send_reminder),
  // inject it into the context so Ellie knows the real IDs and can include them in her ACTION block.
  const actionHintBlock = intentResult.actionHint
    ? `\n\nSUGGESTED ACTION (use these real IDs in your ACTION block if the user asks to act):\n${JSON.stringify(intentResult.actionHint, null, 2)}`
    : '';

  const systemPrompt = `${SYSTEM_PROMPT}\n\n${contextBlock}${actionHintBlock}`;
  const recentHistory = history.slice(-20);
  const messages = [
    ...recentHistory.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userMessage },
  ];

  let reply: string;

  try {
    // Primary: gpt-4o-mini (widely available, fast)
    const result = await aiChat({
      model: preferredModel ?? 'gpt-4o-mini',
      provider: preferredProvider !== 'auto' ? preferredProvider : undefined,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.4,
      maxTokens: 1000,
    });
    reply = result.content ?? '';
  } catch (primaryErr) {
    try {
      // Fallback 1: gpt-4.1-mini
      const result = await aiChat({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.4,
        maxTokens: 1000,
      });
      reply = result.content ?? '';
    } catch {
      try {
        // Fallback 2: Groq llama
        const result = await aiChat({
          model: 'llama-3.3-70b-versatile',
          provider: 'groq',
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          temperature: 0.4,
          maxTokens: 1000,
        });
        reply = result.content ?? '';
      } catch {
        const errMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
        reply = `AI service unavailable (${errMsg}). Live data:\n\n${dataSnapshot}\n\nTo enable AI: go to Admin → Integrations → Environment Manager and add GROQ_API_KEY (free at console.groq.com) or OPENAI_API_KEY.`;
      }
    }
  }

  // Parse optional ACTION block from reply
  let pendingActionId: string | null = null;
  let actionMeta: Record<string, unknown> | null = null;
  let cleanReply = reply;
  const actionMatch = reply.match(/ACTION:(\{.*?\})\s*$/s);
  if (actionMatch) {
    try {
      const parsed = JSON.parse(actionMatch[1]) as {
        type: EllieActionType;
        label: string;
        params?: Record<string, unknown>;
        targetCount?: number;
      };
      cleanReply = reply.slice(0, actionMatch.index).trimEnd();

      // Stage the action — never execute directly
      const { data: staged } = await db
        .from('ellie_pending_actions')
        .insert({
          action_type: parsed.type,
          label: parsed.label,
          params: parsed.params ?? {},
          target_ids: (parsed.params?.userIds ?? parsed.params?.enrollmentIds ?? []) as string[],
          requested_by: auth.id,
          session_id: sessionId,
          status: 'pending',
        })
        .select('id')
        .single();

      if (staged?.id) {
        pendingActionId = staged.id as string;
        actionMeta = {
          id: staged.id,
          type: parsed.type,
          label: parsed.label,
          params: parsed.params ?? {},
          targetCount: parsed.targetCount ?? 1,
          dangerLevel: ELLIE_ACTION_REGISTRY[parsed.type]?.dangerLevel ?? 'medium',
          description: ELLIE_ACTION_REGISTRY[parsed.type]?.description ?? '',
        };
      }
    } catch { /* malformed action block — ignore */ }
  }

  if (cleanReply) await saveMemory(db, auth.id, sessionId, 'assistant', cleanReply);

  return NextResponse.json({
    reply: cleanReply,
    action: actionMeta,
    pendingActionId,
    sessionId,
    dataSnapshot,
  });
}

export async function DELETE(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { sessionId } = await request.json().catch(() => ({ sessionId: 'default' }));
  const db = await requireAdminClient();

  await db.from('ai_conversation_memory').delete()
    .eq('user_id', auth.id)
    .eq('session_id', sessionId ?? 'default');

  return NextResponse.json({ ok: true });
}
