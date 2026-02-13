/**
 * Avatar Governance Scripts
 * 
 * ONE GLOBAL AVATAR with deterministic routing layer.
 * Reads page context and delivers the right script immediately.
 * No rebuild required—just master prompt + route-to-script map.
 * 
 * Designed for: HeyGen LiveAvatar / Streaming Avatar
 * Response limit: 3 sentences max (spoken avatar constraint)
 */

// =============================================================================
// MASTER AVATAR PROMPT (HeyGen Knowledge Base format)
// =============================================================================

export const AVATAR_PERSONA = `Name: Elevate Guide
Role: On-page institutional guide for Elevate for Humanity. I route users through training, funding, enrollment, learning, credential issuance, and verification with minimal staff involvement.`;

export const AVATAR_INSTRUCTIONS = `Operating rules (must follow):
1. Speak in short, deterministic replies. Max 3 sentences unless user explicitly asks for more.
2. Use any provided CONTEXT first (route, user role, funding type, status). If missing, ask at most 2 short routing questions.
3. Never promise guaranteed funding, acceptance, or job placement.
4. For WIOA/WRG/JRI paths, always state: required docs, review timeline, and common delay/denial reasons.
5. End every reply with exactly one next action the user can take on the current page.
6. If user asks "what do I do next," respond with the next action and the condition that unlocks progress.
7. Do not be conversational or open-ended. Behave like a rules engine with human tone.`;

// Combined master prompt for API usage
export const MASTER_AVATAR_PROMPT = `${AVATAR_PERSONA}

${AVATAR_INSTRUCTIONS}

Routing logic: Classify the page into one intent using route keywords, then output the matching Opening Script and next action.`;

// =============================================================================
// ROUTE-TO-SCRIPT MAP (3 sentences max for spoken avatar)
// =============================================================================

export const PAGE_SCRIPTS: Record<string, {
  opening: string;
  nextAction: string;
}> = {
  // === MARKETING / ORIENTATION ===
  '/': {
    opening: `Welcome. This platform is a self-service workforce training and credentialing hub. I can route you to funded training, apprenticeship, employer-sponsored, or self-pay in under a minute.`,
    nextAction: `Tell me: are you a learner, employer, training provider, or workforce partner?`,
  },

  '/about': {
    opening: `This page explains who we are and what we do. We provide regulated workforce training with multiple funding paths.`,
    nextAction: `Click 'Find Programs' to browse options or 'Check Eligibility' to see funding paths.`,
  },

  // === PROGRAM DISCOVERY ===
  '/programs': {
    opening: `You're in the program catalog. Filter by industry, location, and funding type. Funded options require eligibility verification; self-pay does not.`,
    nextAction: `Open one program card to view details.`,
  },

  // === PROGRAM DETAIL (dynamic) ===
  '/programs/[slug]': {
    opening: `This page shows requirements, timeline, funding options, and credential outcome. Funding approval is separate from interest—access is granted after eligibility verification.`,
    nextAction: `Click 'Apply' to start screening.`,
  },

  '/programs/healthcare': {
    opening: `Healthcare programs include CNA, Phlebotomy, and Medical Assistant. Most are WIOA/WRG eligible. Clinical components require background checks.`,
    nextAction: `Select a specific program to see requirements.`,
  },

  '/programs/cna': {
    opening: `CNA training is 8-12 weeks with classroom and clinical hours. State exam scheduled after completion. Requires: 18+, background check, TB test.`,
    nextAction: `Click 'Apply' to start eligibility screening.`,
  },

  '/programs/trades': {
    opening: `Skilled trades include HVAC, Electrical, Welding, and CDL. Hands-on programs with industry certifications. Most are WIOA/WRG eligible.`,
    nextAction: `Select a specific trade to see requirements.`,
  },

  '/programs/hvac': {
    opening: `HVAC training covers heating, cooling, and refrigeration. Includes EPA 608 certification. Funding available through WIOA/WRG.`,
    nextAction: `Click 'Apply' to start eligibility screening.`,
  },

  '/programs/cdl': {
    opening: `CDL training prepares you for Class A or B licensing. Includes classroom, range, and road training. DOT physical required.`,
    nextAction: `Click 'Apply' to start eligibility screening.`,
  },

  '/programs/barber': {
    opening: `Barber Apprenticeship is USDOL registered. You earn wages while training. 2,000 hours for Indiana license.`,
    nextAction: `Click 'Apply' to start the apprenticeship application.`,
  },

  '/programs/technology': {
    opening: `Tech programs include IT Support, Cybersecurity, and Cloud Computing. No coding experience required. WIOA/WRG funding available.`,
    nextAction: `Select a specific program to see requirements.`,
  },

  // === APPLY / ELIGIBILITY ===
  '/apply': {
    opening: `This application has three parts: eligibility screening, document upload, and funding selection. Missing documents pause review. Typical review is 1-3 business days.`,
    nextAction: `Complete eligibility questions, then upload documents.`,
  },

  '/eligibility': {
    opening: `This screening determines your funding options. WIOA: adults with barriers. WRG: Indiana residents. JRI: justice-involved. Answer honestly.`,
    nextAction: `Answer the screening questions to see your options.`,
  },

  // === ENROLLMENT & FUNDING ===
  '/funding': {
    opening: `This page explains funding options. Most students qualify for one or more paths. Funding requires eligibility verification and documents.`,
    nextAction: `Click 'Check Eligibility' to see which paths you qualify for.`,
  },

  '/financial-aid': {
    opening: `Funding options: WIOA (federal), WRG (Indiana), JRI (justice-involved), employer sponsorship, or self-pay. Funding is not guaranteed.`,
    nextAction: `Click 'Check Eligibility' to see your options.`,
  },

  // === DASHBOARD / STATUS ===
  '/student': {
    opening: `This dashboard shows your status and the one step blocking progress. Status flow: submitted → under review → approved/denied → enrolled → completed.`,
    nextAction: `Open Requirements/Documents and complete the first incomplete item.`,
  },

  '/student/dashboard': {
    opening: `This dashboard shows your status and next required action. Most delays are missing documents or unsigned agreements.`,
    nextAction: `Check your status card and complete any pending items.`,
  },

  '/client-portal': {
    opening: `This dashboard shows your current status and the single next step required. If stuck, it's usually a missing document.`,
    nextAction: `Open Documents and confirm every item shows as received.`,
  },

  // === LEARNING ===
  '/lms': {
    opening: `This is your learning system. Access enrolled courses, track progress, complete assessments. Progress saves automatically.`,
    nextAction: `Click a course to continue learning.`,
  },

  '/lms/dashboard': {
    opening: `Your enrolled courses, completion percentage, and deadlines are shown here. For funded programs, progress is reported to oversight partners.`,
    nextAction: `Click 'Continue' on your active course.`,
  },

  '/lms/courses': {
    opening: `Your enrolled courses appear at top. Other courses show enrollment requirements and funding eligibility.`,
    nextAction: `Click a course to view details or continue.`,
  },

  '/lms/courses/[courseId]': {
    opening: `This page shows course details, lessons, and your progress. Complete lessons in order—some unlock after prerequisites.`,
    nextAction: `Click 'Start Lesson' or 'Continue' to proceed.`,
  },

  '/lms/courses/[courseId]/lessons/[lessonId]': {
    opening: `This is your learning workspace. Progress tracked by lesson completion. For funded programs, attendance may be reported.`,
    nextAction: `Click 'Start/Resume' to continue.`,
  },

  '/lms/orientation': {
    opening: `Orientation is required before starting. Covers platform navigation, expectations, and attendance requirements. Completion is tracked.`,
    nextAction: `Watch each section and complete the acknowledgment.`,
  },

  // === CERTIFICATES ===
  '/certificates': {
    opening: `Your earned credentials are listed here. Each has a unique verification ID for employers.`,
    nextAction: `Click a certificate to view, download, or share.`,
  },

  '/certificates/[id]': {
    opening: `This is an official credential record and verification view. Employers can verify authenticity using this page.`,
    nextAction: `Use 'Share Verification Link' or 'Download' for records.`,
  },

  // === STORE ===
  '/store': {
    opening: `Study materials, certification prep, and platform licenses. Prices shown are final. Some materials included with funded enrollments.`,
    nextAction: `Browse categories or search for materials.`,
  },

  '/store/demo': {
    opening: `Platform demo for potential licensees. Sample data shown. Features: student portal, course delivery, progress tracking, reporting.`,
    nextAction: `Click through sections to explore, then contact us for pricing.`,
  },

  // === TAX SERVICES ===
  '/vita': {
    opening: `VITA provides free tax prep for income under $64,000. IRS-certified volunteers. Bring: ID, Social Security cards, income documents.`,
    nextAction: `Click 'Schedule Appointment' to book your session.`,
  },

  '/supersonic-fast-cash': {
    opening: `Professional tax prep with same-day refund advance up to $7,500. Fees deducted from refund. Advance depends on approval.`,
    nextAction: `Click 'Book Appointment' to schedule.`,
  },

  // === PORTALS ===
  '/workforce-board': {
    opening: `Compliance oversight portal. Enrollment counts, attendance, outcomes, funding breakdowns. Reports reflect audit logs.`,
    nextAction: `Open 'Reports' and select funding source and date range.`,
  },

  '/employer': {
    opening: `Employer portal for hiring trained candidates. Post positions, review profiles, track outcomes. Candidates have verified training.`,
    nextAction: `Click 'Post Position' or 'Browse Candidates'.`,
  },

  '/employers': {
    opening: `Partner with us: hire graduates, sponsor training, or host apprentices. Multiple partnership options available.`,
    nextAction: `Click 'Partner With Us' or 'Post a Job'.`,
  },

  '/partner': {
    opening: `Training provider portal. Manage programs, view rosters, track progress, export reports. Revenue share per agreement.`,
    nextAction: `Open 'Programs' or 'Roster' to get started.`,
  },

  '/staff-portal': {
    opening: `Staff administration portal. Role-based access. Manage enrollments, review applications, process documents, generate reports.`,
    nextAction: `Select a task from sidebar or check pending items.`,
  },
};

// Micro-scripts for status-based responses
export const STATUS_SCRIPTS: Record<string, string> = {
  // Application statuses
  'submitted': `Your application has been submitted and is in queue for review. Typical review time is 1-3 business days after all documents are received.

Next action: Check your dashboard for any missing documents or pending items.`,

  'under_review': `Your application is under review. If you have not uploaded all required documents, that is the most common reason for delay.

Next action: Open 'Documents' and confirm every item shows as received.`,

  'approved': `You are approved. Congratulations! Your enrollment is confirmed pending final steps.

Next action: Sign the enrollment agreement and complete any remaining payment or funding confirmation.`,

  'denied': `Your application was not approved for this funding path based on eligibility or missing verification. This does not automatically mean you cannot train.

Your options are:
1. Submit corrected documents if something was unclear
2. Select a different funding path if eligible
3. Proceed with self-pay or employer sponsorship

Next action: Review the denial reason in your dashboard and select an option above.`,

  'paused': `Your file is paused due to inactivity or missing information.

Next action: Complete the missing item shown in your dashboard to resume review.`,

  'enrolled': `You are enrolled and ready to begin. Your course access is now active.

Next action: Go to your dashboard and click 'Start Course' to begin.`,

  'in_progress': `You are currently in progress. Keep up the good work!

Next action: Continue your current lesson or check for any overdue assignments.`,

  'completed': `Congratulations! You have completed this program. Your credential is being processed.

Next action: Check 'Certificates' to download or share your credential once issued.`,

  // Document statuses
  'doc_rejected': `This document cannot be verified (blurry, expired, mismatched name/address, or incomplete).

Next action: Re-upload a clear photo that includes all corners and readable text.`,

  'doc_pending': `This document is pending review. Allow 1-2 business days for verification.

Next action: No action needed. Check back for status update.`,

  'doc_approved': `This document has been verified and approved.

Next action: Check if any other documents are still pending.`,

  // Funding statuses
  'funding_pending': `Your funding request is pending approval from the funding agency. This can take 5-10 business days.

Next action: No action needed. You will be notified when approved.`,

  'funding_approved': `Your funding has been approved. Training costs will be covered as specified.

Next action: Complete enrollment to begin your program.`,

  'funding_denied': `Your funding request was not approved. Common reasons: income over threshold, missing documentation, or program not covered.

Your options are:
1. Appeal with additional documentation
2. Apply for a different funding source
3. Proceed with self-pay

Next action: Review the denial letter in your documents for specific reason.`,
};

// Helper to get script for a route
export function getPageScript(route: string): typeof PAGE_SCRIPTS[string] | null {
  // Exact match first
  if (PAGE_SCRIPTS[route]) {
    return PAGE_SCRIPTS[route];
  }

  // Try pattern matching for dynamic routes
  for (const [pattern, script] of Object.entries(PAGE_SCRIPTS)) {
    if (pattern.includes('[')) {
      const regex = new RegExp('^' + pattern.replace(/\[.*?\]/g, '[^/]+') + '$');
      if (regex.test(route)) {
        return script;
      }
    }
  }

  return null;
}

// Helper to get status script
export function getStatusScript(status: string): string | null {
  return STATUS_SCRIPTS[status] || null;
}

// Build full system prompt for a page
export function buildSystemPrompt(route: string, userStatus?: string): string {
  const pageScript = getPageScript(route);
  
  let prompt = GLOBAL_SYSTEM_RULES + '\n\n';
  
  if (pageScript) {
    prompt += `Page context: ${route}\n\n`;
    prompt += `Opening message (use on first interaction):\n${pageScript.opening}\n\n`;
    if (pageScript.followUp) {
      prompt += `Follow-up guidance:\n${pageScript.followUp}\n\n`;
    }
    prompt += `Default next action: ${pageScript.nextAction}\n\n`;
  }

  if (userStatus) {
    const statusScript = getStatusScript(userStatus);
    if (statusScript) {
      prompt += `User status: ${userStatus}\nStatus-specific response:\n${statusScript}\n\n`;
    }
  }

  prompt += `Remember: End every response with ONE clear next action.`;

  return prompt;
}
