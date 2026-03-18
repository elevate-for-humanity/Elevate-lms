// Email sequences for career course purchasers.
// All CTA links route to the canonical LMS paths, not /career-services/.

export interface CourseEmailData {
  email: string;
  firstName?: string;
  courseName: string;
  courseSlug: string;
  /** LMS course UUID — used to build /lms/courses/[courseId] links */
  courseId?: string;
  purchaseDate: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://elevateforhumanity.org';

// Maps program slug → LMS course UUID for direct deep-linking.
// Add new programs here as they are seeded.
const COURSE_ID_MAP: Record<string, string> = {
  'hvac-technician': 'f0593164-55be-5867-98e7-8a86770a8dd0',
};

function lmsUrl(data: CourseEmailData): string {
  const id = data.courseId ?? COURSE_ID_MAP[data.courseSlug];
  return id
    ? `${SITE_URL}/lms/courses/${id}`
    : `${SITE_URL}/learner/dashboard`;
}

// ─── Brand colors ─────────────────────────────────────────────────────────────
const BLUE   = '#1E3A5F';
const ORANGE = '#EA580C';
const LIGHT  = '#F8FAFC';

// ─── Shared layout wrapper ────────────────────────────────────────────────────
function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
  <div style="text-align: center; margin-bottom: 28px;">
    <img src="${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="Elevate for Humanity" style="height: 60px;">
  </div>
  ${body}
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
  <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
    Elevate for Humanity &nbsp;|&nbsp; 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240<br>
    <a href="${SITE_URL}/unsubscribe" style="color: #94a3b8;">Unsubscribe</a>
  </p>
</body>
</html>`;
}

function btn(href: string, label: string, color = ORANGE): string {
  return `<div style="text-align: center; margin: 28px 0;">
    <a href="${href}" style="display: inline-block; background: ${color}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">${label}</a>
  </div>`;
}

// ─── Welcome (day 0) ──────────────────────────────────────────────────────────
export function getWelcomeEmail(data: CourseEmailData) {
  const courseUrl = lmsUrl(data);
  return {
    subject: `Welcome to ${data.courseName} — let's get started`,
    html: wrap(`
      <h1 style="color: ${BLUE}; margin-bottom: 8px;">Welcome, ${data.firstName ?? 'there'}!</h1>
      <p>You're enrolled in <strong>${data.courseName}</strong>. Your first lesson is ready right now.</p>

      <div style="background: ${LIGHT}; border-left: 4px solid ${ORANGE}; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 24px 0;">
        <strong>What to expect:</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px;">
          <li>Video lessons with interactive checkpoints</li>
          <li>Module quizzes — 70% passing threshold, EPA 608 standard</li>
          <li>OSHA 10 through CareerSafe (included, self-paced)</li>
          <li>Certificate issued automatically when all modules are complete</li>
        </ul>
      </div>

      ${btn(courseUrl, 'Start My Course →')}

      <p style="color: #64748b; font-size: 14px;">Questions? Reply to this email — we respond within one business day.</p>
      <p>— The Elevate for Humanity Team</p>
    `),
  };
}

// ─── Day 3 check-in ───────────────────────────────────────────────────────────
export function getDay3Email(data: CourseEmailData) {
  const courseUrl = lmsUrl(data);
  return {
    subject: `Day 3 — how is ${data.courseName} going?`,
    html: wrap(`
      <h1 style="color: ${BLUE};">Quick check-in</h1>
      <p>Hi ${data.firstName ?? 'there'},</p>
      <p>It's been three days since you enrolled in <strong>${data.courseName}</strong>. If you haven't started yet, today is a good day — the first module takes about 20 minutes.</p>

      <div style="background: ${LIGHT}; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <strong>Where to start:</strong><br>
        Module 1 → Foundations and Career Orientation. No prior experience needed.
      </div>

      ${btn(courseUrl, 'Continue Learning →')}

      <p>— The Elevate Team</p>
    `),
  };
}

// ─── Day 7 ────────────────────────────────────────────────────────────────────
export function getDay7Email(data: CourseEmailData) {
  const courseUrl = lmsUrl(data);
  return {
    subject: `One week in — keep the momentum going`,
    html: wrap(`
      <h1 style="color: ${BLUE};">One week in</h1>
      <p>Hi ${data.firstName ?? 'there'},</p>
      <p>You've had access to <strong>${data.courseName}</strong> for a week. Students who complete at least 3 modules in the first two weeks are 4× more likely to finish the full program.</p>

      <div style="background: ${LIGHT}; border-left: 4px solid ${BLUE}; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <strong>Reminder:</strong> Your OSHA 10 training through CareerSafe is included with your enrollment.
        Complete it alongside the course — employers want to see both EPA 608 and OSHA 10 on your resume.
      </div>

      ${btn(courseUrl, 'Go to My Course →')}

      <p>— The Elevate Team</p>
    `),
  };
}

// ─── Completion ───────────────────────────────────────────────────────────────
export function getCompletionEmail(data: CourseEmailData & { certificateId?: string }) {
  const courseUrl  = lmsUrl(data);
  const certUrl    = data.certificateId
    ? `${SITE_URL}/verify/${data.certificateId}`
    : courseUrl;

  return {
    subject: `You completed ${data.courseName} — your certificate is ready`,
    html: wrap(`
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 56px; line-height: 1;">🎓</div>
        <h1 style="color: ${BLUE}; margin: 12px 0 4px;">Congratulations, ${data.firstName ?? 'Graduate'}!</h1>
        <p style="color: #64748b; margin: 0;">You completed <strong>${data.courseName}</strong>.</p>
      </div>

      <div style="background: ${LIGHT}; border: 2px solid ${ORANGE}; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <p style="margin: 0 0 16px; font-size: 15px;">Your completion certificate is issued and publicly verifiable.</p>
        ${btn(certUrl, 'View My Certificate →', BLUE)}
      </div>

      <h3 style="color: ${BLUE};">What comes next</h3>
      <ul style="padding-left: 20px;">
        <li style="margin-bottom: 8px;"><strong>EPA 608 exam:</strong> Schedule with ESCO Institute or Mainstream Engineering. Your exam fee is covered by your enrollment.</li>
        <li style="margin-bottom: 8px;"><strong>OSHA 10 card:</strong> If you haven't completed CareerSafe yet, do it now — employers require it on day one.</li>
        <li style="margin-bottom: 8px;"><strong>Career services:</strong> Reply to this email to connect with our employer partners in Indianapolis.</li>
      </ul>

      <p>We're proud of you.</p>
      <p>— The Elevate for Humanity Team</p>
    `),
  };
}

// ─── Re-engagement ────────────────────────────────────────────────────────────
export function getReengagementEmail(data: CourseEmailData & { lastLoginDays: number }) {
  const courseUrl = lmsUrl(data);
  return {
    subject: `Your course is waiting — ${data.lastLoginDays} days since your last visit`,
    html: wrap(`
      <h1 style="color: ${BLUE};">Still with us?</h1>
      <p>Hi ${data.firstName ?? 'there'},</p>
      <p>It's been <strong>${data.lastLoginDays} days</strong> since you last visited <strong>${data.courseName}</strong>. Your progress is saved — pick up exactly where you left off.</p>

      <div style="background: ${LIGHT}; border-left: 4px solid ${ORANGE}; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        If something is getting in the way — schedule, questions, technical issues — reply to this email.
        We'll help you get back on track.
      </div>

      ${btn(courseUrl, 'Jump Back In →')}

      <p>— The Elevate Team</p>
    `),
  };
}

// ─── Certificate issued (new) ─────────────────────────────────────────────────
export function getCertificateIssuedEmail(data: {
  email: string;
  firstName?: string;
  courseName: string;
  certificateId: string;
  programSlug: string;
}) {
  const certUrl = `${SITE_URL}/verify/${data.certificateId}`;
  return {
    subject: `Your ${data.courseName} certificate is ready`,
    html: wrap(`
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 48px; line-height: 1;">📜</div>
        <h1 style="color: ${BLUE}; margin: 12px 0 4px;">Your certificate is issued</h1>
        <p style="color: #64748b; margin: 0;">${data.courseName}</p>
      </div>

      <p>Hi ${data.firstName ?? 'there'},</p>
      <p>Your completion certificate for <strong>${data.courseName}</strong> has been issued and is publicly verifiable at the link below.</p>

      ${btn(certUrl, 'View & Share Certificate →', BLUE)}

      <div style="background: ${LIGHT}; padding: 16px 20px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #475569;">
        <strong>Certificate ID:</strong> ${data.certificateId}<br>
        <strong>Verify at:</strong> <a href="${certUrl}" style="color: ${BLUE};">${certUrl}</a><br><br>
        Share this link with employers, on LinkedIn, or anywhere you want to show your credential.
        It is permanently accessible and does not expire.
      </div>

      <p>— The Elevate for Humanity Team</p>
    `),
  };
}
