/**
 * Full Barber Apprenticeship Onboarding Email
 *
 * Sent to all approved barber applicants before enrollment.
 * Covers: program overview, what to expect, costs, timeline,
 * requirements, and a confirmation link (yes/no to proceed).
 *
 * A confirmation notification is sent to admin when the applicant responds.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
const LOGO = `${SITE}/logo.png`;

export interface BarberFullOnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  applicationId: string;
  /** Token for the confirmation link */
  confirmToken: string;
}

export function barberFullOnboardingEmail(data: BarberFullOnboardingData) {
  const { firstName, lastName, email, confirmToken } = data;
  const confirmUrl = `${SITE}/programs/barber-apprenticeship/confirm?token=${confirmToken}`;

  const subject = `${firstName}, Your Barber Apprenticeship Application Has Been Approved — Action Required`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;padding:24px 16px;">

  <!-- Header -->
  <div style="background:#1e293b;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;">Elevate for Humanity</h1>
    <p style="color:#94a3b8;margin:6px 0 0;font-size:13px;">Barber Apprenticeship Program — Onboarding</p>
  </div>

  <!-- Body -->
  <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;">

    <p style="font-size:16px;color:#1e293b;">Hi ${firstName},</p>

    <p style="color:#334155;line-height:1.7;">
      Congratulations — your application to the <strong>Barber Apprenticeship Program</strong> at Elevate for Humanity has been <strong style="color:#16a34a;">approved</strong>. Before we move forward with enrollment, please read through everything below so you know exactly what to expect.
    </p>

    <!-- ═══ PROGRAM OVERVIEW ═══ -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin:24px 0;">
      <h2 style="margin:0 0 16px;color:#1e293b;font-size:17px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">Program Overview</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
        <tr><td style="padding:8px 0;font-weight:600;width:40%;">Program</td><td style="padding:8px 0;">DOL Registered Barber Apprenticeship</td></tr>
        <tr style="background:#f1f5f9;"><td style="padding:8px;font-weight:600;">Duration</td><td style="padding:8px;">12 months (52 weeks)</td></tr>
        <tr><td style="padding:8px 0;font-weight:600;">Total Hours Required</td><td style="padding:8px 0;">2,000 hours (Indiana requirement)</td></tr>
        <tr style="background:#f1f5f9;"><td style="padding:8px;font-weight:600;">On-the-Job Training (OJT)</td><td style="padding:8px;">1,500 hours at a licensed barbershop</td></tr>
        <tr><td style="padding:8px 0;font-weight:600;">Related Technical Instruction (RTI)</td><td style="padding:8px 0;">500 hours (online via Milady RISE)</td></tr>
        <tr style="background:#f1f5f9;"><td style="padding:8px;font-weight:600;">Schedule</td><td style="padding:8px;">15–20 hours/week (flexible with shop)</td></tr>
        <tr><td style="padding:8px 0;font-weight:600;">Delivery</td><td style="padding:8px 0;">Hybrid — OJT at shop + theory online</td></tr>
        <tr style="background:#f1f5f9;"><td style="padding:8px;font-weight:600;">Location</td><td style="padding:8px;">Indianapolis / Marion County area</td></tr>
      </table>
    </div>

    <!-- ═══ WHAT YOU WILL EARN ═══ -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:24px;margin:24px 0;">
      <h2 style="margin:0 0 12px;color:#166534;font-size:17px;">What You Will Earn</h2>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#334155;line-height:2;">
        <li><strong>Indiana Barber License</strong> — issued by the Indiana Professional Licensing Agency (IPLA) after completing 2,000 hours and passing the state exam</li>
        <li><strong>DOL Registered Apprenticeship Certificate</strong> — nationally recognized, portable to all 50 states</li>
        <li><strong>Milady RISE Certification</strong> — Client Well-Being &amp; Safety (Domestic Violence Awareness, Human Trafficking Awareness, Infection Control)</li>
        <li><strong>Barbershop Business Management Certificate</strong> — from Elevate for Humanity</li>
        <li><strong>CPR / First Aid / AED</strong> — American Heart Association</li>
      </ul>
    </div>

    <!-- ═══ WHAT TO EXPECT ═══ -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin:24px 0;">
      <h2 style="margin:0 0 12px;color:#1e293b;font-size:17px;">What to Expect</h2>
      <ol style="margin:0;padding-left:20px;font-size:14px;color:#334155;line-height:2;">
        <li><strong>You will be matched with a licensed partner barbershop</strong> where you complete your OJT hours under a licensed barber supervisor.</li>
        <li><strong>You will be a W-2 employee of the shop</strong> during your apprenticeship — you earn wages while you train.</li>
        <li><strong>Theory coursework is completed online</strong> through Milady RISE at your own pace (included at no extra cost).</li>
        <li><strong>Monthly evaluations</strong> — your supervisor, Elevate staff, and you will review your progress using a rubric-based scoring system.</li>
        <li><strong>You will build a client portfolio</strong> of 50+ documented services by program completion.</li>
        <li><strong>At the end of the program</strong>, you sit for the Indiana State Board written and practical exams to earn your barber license.</li>
      </ol>
    </div>

    <!-- ═══ SKILLS YOU WILL LEARN ═══ -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin:24px 0;">
      <h2 style="margin:0 0 12px;color:#1e293b;font-size:17px;">Skills You Will Learn</h2>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${['Fades & tapers', 'Lineups & shape-ups', 'Scissor-over-comb', 'Clipper techniques', 'Straight razor shaving', 'Beard shaping & grooming', 'Sanitation & disinfection', 'Scalp conditions & treatment', 'Client consultation', 'Time management', 'Shop operations', 'Business fundamentals'].map(s =>
          `<span style="display:inline-block;background:#e0f2fe;color:#0369a1;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:500;">${s}</span>`
        ).join('')}
      </div>
    </div>

    <!-- ═══ COSTS & PAYMENT ═══ -->
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:24px;margin:24px 0;">
      <h2 style="margin:0 0 12px;color:#92400e;font-size:17px;">Costs &amp; Payment</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
        <tr><td style="padding:8px 0;font-weight:600;width:45%;">Program Tuition</td><td style="padding:8px 0;"><strong>$4,890</strong></td></tr>
        <tr style="background:#fef3c7;"><td style="padding:8px;font-weight:600;">Down Payment</td><td style="padding:8px;">$500 (required to secure your spot)</td></tr>
        <tr><td style="padding:8px 0;font-weight:600;">Payment Plans Available</td><td style="padding:8px 0;">Yes — BNPL (Buy Now, Pay Later) financing</td></tr>
        <tr style="background:#fef3c7;"><td style="padding:8px;font-weight:600;">Employer-Sponsored Option</td><td style="padding:8px;">If your host shop sponsors you, tuition may be covered</td></tr>
        <tr><td style="padding:8px 0;font-weight:600;">What's Included</td><td style="padding:8px 0;">Milady RISE access, training materials, RISE certification, monthly evaluations, career placement support</td></tr>
      </table>
      <p style="margin:12px 0 0;font-size:13px;color:#92400e;">
        <strong>Note:</strong> Your down payment is required before we can assign you to a partner shop and begin your apprenticeship.
      </p>
    </div>

    <!-- ═══ CAREER OUTCOMES ═══ -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin:24px 0;">
      <h2 style="margin:0 0 12px;color:#1e293b;font-size:17px;">Career Pathway After Completion</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
        <tr style="background:#f1f5f9;"><td style="padding:10px;font-weight:600;">Barber Apprentice (during program)</td><td style="padding:10px;text-align:right;color:#16a34a;font-weight:600;">$24K–$30K</td></tr>
        <tr><td style="padding:10px;font-weight:600;">Licensed Barber (1–3 years)</td><td style="padding:10px;text-align:right;color:#16a34a;font-weight:600;">$30K–$45K</td></tr>
        <tr style="background:#f1f5f9;"><td style="padding:10px;font-weight:600;">Senior Barber / Specialist (3–5 years)</td><td style="padding:10px;text-align:right;color:#16a34a;font-weight:600;">$45K–$65K</td></tr>
        <tr><td style="padding:10px;font-weight:600;">Shop Owner / Master Barber (5+ years)</td><td style="padding:10px;text-align:right;color:#16a34a;font-weight:600;">$65K–$100K+</td></tr>
      </table>
    </div>

    <!-- ═══ REQUIREMENTS ═══ -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin:24px 0;">
      <h2 style="margin:0 0 12px;color:#1e293b;font-size:17px;">Admission Requirements</h2>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#334155;line-height:2;">
        <li>Must be at least 16 years old</li>
        <li>Valid government-issued photo ID</li>
        <li>Social Security number (for DOL RAPIDS registration)</li>
        <li>High school diploma or GED (or currently enrolled)</li>
        <li>Able to commit to 15–20 hours per week for 12 months</li>
        <li>Pass a background check (required by partner shops)</li>
        <li>Reliable transportation to your assigned shop</li>
      </ul>
    </div>

    <!-- ═══ ONBOARDING STEPS ═══ -->
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:24px;margin:24px 0;">
      <h2 style="margin:0 0 16px;color:#1e40af;font-size:17px;">Your Onboarding Steps (After You Confirm)</h2>

      <div style="margin-bottom:14px;">
        <p style="margin:0;font-weight:700;color:#1e293b;font-size:14px;">Step 1: Confirm You Want to Proceed</p>
        <p style="margin:4px 0 0;font-size:13px;color:#475569;">Click the confirmation button at the bottom of this email.</p>
      </div>

      <div style="margin-bottom:14px;">
        <p style="margin:0;font-weight:700;color:#1e293b;font-size:14px;">Step 2: Schedule Your Orientation Call</p>
        <p style="margin:4px 0 0;font-size:13px;color:#475569;">30-minute Zoom call to walk through the program, answer questions, and review paperwork.</p>
      </div>

      <div style="margin-bottom:14px;">
        <p style="margin:0;font-weight:700;color:#1e293b;font-size:14px;">Step 3: Submit Your Down Payment ($500)</p>
        <p style="margin:4px 0 0;font-size:13px;color:#475569;">Secures your spot and triggers shop matching. Payment plans available.</p>
      </div>

      <div style="margin-bottom:14px;">
        <p style="margin:0;font-weight:700;color:#1e293b;font-size:14px;">Step 4: Complete Enrollment Paperwork</p>
        <p style="margin:4px 0 0;font-size:13px;color:#475569;">Sign enrollment agreement, submit ID and SSN for DOL RAPIDS registration.</p>
      </div>

      <div style="margin-bottom:14px;">
        <p style="margin:0;font-weight:700;color:#1e293b;font-size:14px;">Step 5: Get Matched with a Partner Shop</p>
        <p style="margin:4px 0 0;font-size:13px;color:#475569;">We assign you to a licensed barbershop based on location and availability.</p>
      </div>

      <div>
        <p style="margin:0;font-weight:700;color:#1e293b;font-size:14px;">Step 6: Begin Training</p>
        <p style="margin:4px 0 0;font-size:13px;color:#475569;">Start your OJT hours at the shop and begin Milady RISE theory coursework online.</p>
      </div>
    </div>

    <!-- ═══ CONFIRMATION SECTION ═══ -->
    <div style="background:#1e293b;border-radius:8px;padding:28px;margin:28px 0;text-align:center;">
      <h2 style="color:#fff;margin:0 0 8px;font-size:18px;">Ready to Move Forward?</h2>
      <p style="color:#94a3b8;margin:0 0 20px;font-size:14px;">
        Click below to confirm you want to proceed with enrollment. This does NOT commit you to payment yet — it tells us you are interested and ready for the next step.
      </p>
      <a href="${confirmUrl}&response=yes" style="display:inline-block;padding:14px 36px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;margin:0 8px 8px 0;">
        Yes, I Want to Enroll
      </a>
      <br>
      <a href="${confirmUrl}&response=no" style="display:inline-block;padding:10px 24px;background:transparent;color:#94a3b8;text-decoration:underline;font-size:13px;margin-top:8px;">
        No, I am not interested at this time
      </a>
    </div>

    <!-- ═══ QUESTIONS ═══ -->
    <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:24px;">
      <p style="font-size:14px;color:#334155;margin:0 0 8px;">Have questions before you decide? Contact us:</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#334155;line-height:1.8;">
        <li>Phone: <strong>(317) 314-3757</strong></li>
        <li>Email: <a href="mailto:info@elevateforhumanity.org" style="color:#ea580c;">info@elevateforhumanity.org</a></li>
        <li>Text: (317) 314-3757</li>
      </ul>
    </div>

    <!-- Signature -->
    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:14px;color:#334155;font-weight:600;">Elizabeth Greene, CEO</p>
      <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Elevate for Humanity Career &amp; Technical Institute</p>
      <p style="margin:2px 0 0;font-size:12px;color:#64748b;">info@elevateforhumanity.org | (317) 314-3757</p>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#f1f5f9;border-radius:0 0 12px 12px;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
      Elevate for Humanity | Operated by 2Exclusive LLC-S<br>
      Indianapolis, IN | <a href="${SITE}" style="color:#64748b;">elevateforhumanityeducation.com</a>
    </p>
  </div>

</div>
</body>
</html>`;

  return { subject, html };
}

/**
 * Admin notification when an applicant confirms (yes or no).
 */
export function barberConfirmationAdminEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  response: 'yes' | 'no';
  applicationId: string;
}) {
  const isYes = data.response === 'yes';
  const subject = isYes
    ? `[ACTION] ${data.firstName} ${data.lastName} confirmed — ready to enroll`
    : `${data.firstName} ${data.lastName} declined barber apprenticeship`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:${isYes ? '#16a34a' : '#dc2626'};color:#fff;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
    <h2 style="margin:0;">${isYes ? 'Applicant Confirmed — Ready to Enroll' : 'Applicant Declined'}</h2>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse;">
      <tr><td style="padding:8px 0;font-weight:600;">Name</td><td style="padding:8px 0;">${data.firstName} ${data.lastName}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;">Email</td><td style="padding:8px 0;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
      <tr><td style="padding:8px 0;font-weight:600;">Phone</td><td style="padding:8px 0;"><a href="tel:${data.phone}">${data.phone}</a></td></tr>
      <tr><td style="padding:8px 0;font-weight:600;">Response</td><td style="padding:8px 0;"><strong style="color:${isYes ? '#16a34a' : '#dc2626'};">${isYes ? 'YES — wants to proceed' : 'NO — not interested'}</strong></td></tr>
      <tr><td style="padding:8px 0;font-weight:600;">Application ID</td><td style="padding:8px 0;font-size:12px;color:#64748b;">${data.applicationId}</td></tr>
    </table>
    ${isYes ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin-top:16px;">
      <p style="margin:0;font-size:14px;color:#166534;"><strong>Next steps:</strong> Schedule orientation call, send enrollment paperwork, collect down payment.</p>
    </div>` : ''}
  </div>
</body></html>`;

  return { subject, html };
}
