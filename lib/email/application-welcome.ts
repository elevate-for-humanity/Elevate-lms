/**
 * Auto-welcome email sent after every application submission.
 * Per-program content: description, credentials, funding type, duration.
 * Funding sections (WIOA, JRI, self-pay) vary by program.
 */

import { sendEmail } from './sendgrid';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

type FundingType = 'wioa' | 'jri' | 'apprenticeship' | 'self-pay' | 'wrg' | 'next-level-jobs' | 'employer-sponsored';

interface ProgramInfo {
  name: string;
  description: string;
  credentials: string;
  careerOutlook: string;
  duration: string;
  funding: FundingType[];
  etplApproved: boolean;
}

const PROGRAMS: Record<string, ProgramInfo> = {
  'hvac-technician': {
    name: 'HVAC Technician',
    description: 'HVAC technicians install, maintain, and repair heating, ventilation, and air conditioning systems in homes and commercial buildings. This is one of the highest-demand skilled trades in Indiana.',
    credentials: 'EPA 608 Universal Certification, OSHA 10 Safety Certification, industry-recognized HVAC credentials, Indiana HVAC journeyman license pathway',
    careerOutlook: 'Starting pay: $18-$24/hour. Experienced: $25-$40+/hour. Year-round demand.',
    duration: '12 Weeks (144 Hours)',
    funding: ['wioa', 'next-level-jobs', 'wrg'],
    etplApproved: true,
  },
  'barber-apprenticeship': {
    name: 'Barber Apprenticeship',
    description: 'USDOL Registered Apprenticeship — 2,000 hours of on-the-job training at an approved barbershop plus online theory through Milady RISE to earn your Indiana barber license.',
    credentials: 'Indiana Barber License',
    careerOutlook: 'Licensed barbers earn $30,000-$60,000+/year. Shop owners earn more.',
    duration: '12-18 Months',
    funding: ['apprenticeship', 'wioa', 'wrg'],
    etplApproved: true,
  },
  'cna-cert': {
    name: 'CNA (Certified Nursing Assistant)',
    description: 'CNAs provide direct patient care in hospitals, nursing homes, and home health settings — vital signs, daily activities, and patient monitoring.',
    credentials: 'Indiana CNA Certification',
    careerOutlook: 'Starting pay: $15-$19/hour. Experienced: $18-$24/hour. High demand statewide.',
    duration: '4-8 Weeks',
    funding: ['self-pay', 'employer-sponsored'],
    etplApproved: false,
  },
  'cpr-cert': {
    name: 'CPR, AED & First Aid',
    description: 'American Heart Association CPR/AED and First Aid certifications for healthcare workers, teachers, childcare providers, and anyone who wants life-saving skills.',
    credentials: 'AHA CPR/AED and First Aid Certification',
    careerOutlook: 'Required credential for many healthcare and education jobs. Enhances any resume.',
    duration: '1 Day (4-8 Hours)',
    funding: ['self-pay', 'employer-sponsored'],
    etplApproved: false,
  },
  'medical-assistant': {
    name: 'Medical Assistant',
    description: 'Medical Assistants work in clinics and doctor offices — taking vitals, drawing blood, scheduling appointments, and assisting physicians.',
    credentials: 'Certified Medical Assistant (CMA)',
    careerOutlook: 'Starting pay: $16-$20/hour. Experienced: $20-$26/hour.',
    duration: '16-24 Weeks',
    funding: ['wioa', 'wrg'],
    etplApproved: true,
  },
  'phlebotomy-technician': {
    name: 'Phlebotomy Technician',
    description: 'Phlebotomy Technicians draw blood for lab tests, transfusions, and donations. Fast-track healthcare career.',
    credentials: 'Certified Phlebotomy Technician (CPT)',
    careerOutlook: 'Starting pay: $15-$18/hour. Experienced: $18-$23/hour.',
    duration: '4-8 Weeks',
    funding: ['wioa', 'wrg'],
    etplApproved: true,
  },
  'cdl-training': {
    name: 'CDL (Commercial Driver License)',
    description: 'Get your Class A CDL in 4-6 weeks. Classroom instruction, range practice, and real road experience.',
    credentials: 'Indiana Class A Commercial Driver License (CDL-A)',
    careerOutlook: 'Starting: $45,000-$55,000/year. Experienced: $60,000-$85,000+/year.',
    duration: '4-6 Weeks (160 Hours)',
    funding: ['wioa', 'wrg', 'employer-sponsored'],
    etplApproved: true,
  },
  'electrical': {
    name: 'Electrical Apprenticeship',
    description: 'Residential and commercial electrical systems — wiring, circuits, panels, troubleshooting, and NEC code compliance.',
    credentials: 'OSHA 10, Indiana Electrical Apprentice Registration',
    careerOutlook: 'Apprentice: $16-$20/hour. Journeyman: $25-$40/hour.',
    duration: '12 Weeks (144 Hours)',
    funding: ['wioa', 'next-level-jobs', 'wrg'],
    etplApproved: true,
  },
  'plumbing': {
    name: 'Plumbing Apprenticeship',
    description: 'Indiana Plumbing Code, pipe materials, DWV systems, water supply, fixture installation, and troubleshooting.',
    credentials: 'OSHA 10, Plumbing Program Completion Certificate',
    careerOutlook: 'Apprentice: $16-$20/hour. Journeyman: $25-$40/hour.',
    duration: '12 Weeks (144 Hours)',
    funding: ['wioa', 'next-level-jobs', 'wrg'],
    etplApproved: true,
  },
  'welding': {
    name: 'Welding Certification',
    description: 'MIG, TIG, stick welding, blueprint reading, and metal fabrication through hands-on training.',
    credentials: 'AWS (American Welding Society) Certification',
    careerOutlook: 'Starting: $18-$22/hour. Certified: $25-$40+/hour.',
    duration: '12-24 Weeks',
    funding: ['wioa', 'wrg', 'apprenticeship'],
    etplApproved: true,
  },
  'it-support-specialist': {
    name: 'IT Support Specialist',
    description: 'Troubleshoot hardware/software, support end users, maintain computer systems. Entry point into tech.',
    credentials: 'CompTIA A+ Certification',
    careerOutlook: 'Starting: $18-$22/hour. Experienced: $24-$35/hour.',
    duration: '12-20 Weeks',
    funding: ['wioa', 'wrg', 'employer-sponsored'],
    etplApproved: true,
  },
  'cybersecurity-analyst': {
    name: 'Cybersecurity Fundamentals',
    description: 'Protect organizations from digital threats — monitoring networks, responding to incidents, implementing security.',
    credentials: 'CompTIA Security+ Certification',
    careerOutlook: 'Starting: $22-$30/hour. Experienced: $35-$55/hour.',
    duration: '12-20 Weeks',
    funding: ['wioa', 'wrg'],
    etplApproved: true,
  },
  'tax-prep': {
    name: 'Tax Preparation Program',
    description: 'Prepare individual and business tax returns using professional software. Work for a firm or start your own business.',
    credentials: 'IRS PTIN, VITA Certification, QuickBooks Pro Advisor',
    careerOutlook: 'Firms: $15-$25/hour. Self-employed: $50-$200+ per return.',
    duration: '10 Weeks (150 Hours)',
    funding: ['wioa', 'wrg'],
    etplApproved: true,
  },
  'peer-recovery-specialist-jri': {
    name: 'Certified Peer Recovery Coach',
    description: 'Support individuals in recovery from substance use disorders using your own lived experience.',
    credentials: 'Indiana Certified Peer Recovery Coach (CPRC)',
    careerOutlook: 'Starting: $15-$20/hour. Experienced: $20-$28/hour.',
    duration: '45 Days (180 Hours)',
    funding: ['wioa', 'jri'],
    etplApproved: true,
  },
  'reentry-specialist': {
    name: 'Public Safety Reentry Specialist',
    description: 'Help individuals returning from incarceration reintegrate — housing, employment, and support services.',
    credentials: 'Reentry Specialist Certificate',
    careerOutlook: 'Starting: $16-$22/hour. Work with corrections, nonprofits, government.',
    duration: '6-8 Weeks',
    funding: ['wioa', 'jri'],
    etplApproved: true,
  },
  'forklift-operator': {
    name: 'Forklift Operator Certification',
    description: 'OSHA-compliant forklift operation in warehouses, distribution centers, and manufacturing.',
    credentials: 'OSHA Forklift Operator Certification',
    careerOutlook: 'Starting: $16-$20/hour. Experienced: $20-$26/hour. Immediate placement.',
    duration: '1-2 Weeks (40 Hours)',
    funding: ['wioa', 'wrg'],
    etplApproved: true,
  },
  'business-startup': {
    name: 'Business Start-up & Marketing',
    description: 'Launch your own business — business planning, digital marketing, LLC formation, and financial management.',
    credentials: 'Business Start-up Certificate, Marketing Fundamentals Certificate',
    careerOutlook: 'Self-employment in any industry — barbershop, cleaning, food truck, consulting.',
    duration: '5 Weeks (32 Hours)',
    funding: ['wioa', 'wrg'],
    etplApproved: true,
  },
};

function getProgram(slug: string): ProgramInfo {
  const normalized = slug.toLowerCase().replace(/\s+/g, '-');
  if (PROGRAMS[normalized]) return PROGRAMS[normalized];
  // Try partial match
  const match = Object.keys(PROGRAMS).find(k => normalized.includes(k) || k.includes(normalized));
  if (match) return PROGRAMS[match];
  // Fallback
  return {
    name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    description: 'This program provides hands-on training and industry-recognized credentials.',
    credentials: 'Industry-recognized certification upon completion',
    careerOutlook: 'Competitive wages with strong demand in Indianapolis and across Indiana.',
    duration: 'Varies by program',
    funding: ['wioa', 'wrg'],
    etplApproved: true,
  };
}

function hasFunding(p: ProgramInfo, type: FundingType): boolean {
  return p.funding.includes(type);
}

function isSelfPayOnly(p: ProgramInfo): boolean {
  return p.funding.every(f => f === 'self-pay' || f === 'employer-sponsored');
}

export async function sendApplicationWelcomeEmail(params: {
  to: string;
  firstName: string;
  programSlug: string;
}) {
  const p = getProgram(params.programSlug);
  const html = buildHtml(params.firstName, p);
  const text = buildText(params.firstName, p);

  return sendEmail({
    to: params.to,
    subject: `Welcome to Elevate — ${p.name} Program Details & Your Next Steps`,
    html,
    text,
  });
}

function buildFundingHtml(p: ProgramInfo): string {
  if (isSelfPayOnly(p)) {
    return `
<h2 style="color:#1e293b;font-size:18px;border-bottom:2px solid #f97316;padding-bottom:6px;margin-top:28px">PROGRAM COST</h2>
<p>The <strong>${p.name}</strong> program is a <strong>self-pay or employer-sponsored</strong> program. This program is not currently funded through WIOA or other federal workforce programs.</p>
<p><strong>Payment options:</strong></p>
<ul>
<li><strong>Self-Pay</strong> — pay tuition directly. Payment plans may be available.</li>
<li><strong>Employer-Sponsored</strong> — your employer pays for your training. Ask your HR department about tuition reimbursement or professional development funds.</li>
</ul>
<p>Contact us at <strong>(317) 314-3757</strong> to discuss payment options and any available scholarships.</p>`;
  }

  let html = `
<h2 style="color:#1e293b;font-size:18px;border-bottom:2px solid #f97316;padding-bottom:6px;margin-top:28px">HOW FUNDING WORKS &mdash; YOU MAY QUALIFY FOR FREE TRAINING</h2>`;

  if (hasFunding(p, 'wioa') || hasFunding(p, 'wrg') || hasFunding(p, 'next-level-jobs')) {
    html += `
<div style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px;border-radius:8px;margin:12px 0">
<h3 style="margin-top:0;color:#1e293b">WIOA Funding (Workforce Innovation and Opportunity Act)</h3>
<p>WIOA is a federal program that pays for job training for people who qualify. It is administered through your local <strong>WorkOne</strong> career center. WIOA can cover:</p>
<ul>
<li>100% of your tuition and training costs</li>
<li>Books, tools, and supplies</li>
<li>Transportation assistance</li>
<li>Supportive services (childcare, work clothes, etc.)</li>
</ul>
<p><strong>Who qualifies:</strong></p>
<ul>
<li>Adults who are unemployed or underemployed</li>
<li>People receiving public assistance (SNAP, TANF, Medicaid)</li>
<li>Veterans and military spouses</li>
<li>People with disabilities</li>
<li>Youth ages 16-24 who are out of school</li>
<li>Workers who were laid off or had their hours cut</li>
<li>Low-income individuals</li>
</ul>
<p>You do NOT need to be on public assistance to qualify &mdash; many working people qualify based on income.</p>
</div>`;
  }

  if (hasFunding(p, 'jri')) {
    html += `
<div style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px;border-radius:8px;margin:12px 0">
<h3 style="margin-top:0;color:#374151">JRI Funding (Job Ready Indy)</h3>
<p>JRI is an Indiana state program specifically for people who have been involved in the criminal justice system.</p>
<p><strong>What JRI covers:</strong> 100% of training costs, tools, transportation, and supportive services.</p>
<p><strong>Who qualifies:</strong></p>
<ul>
<li>Individuals currently on probation or parole</li>
<li>People recently released from incarceration</li>
<li>Individuals with a criminal history facing employment barriers</li>
<li>People referred by community corrections or a probation officer</li>
</ul>
<p>There is no judgment &mdash; this program exists because Indiana recognizes that job training helps people build stable lives. Mention JRI when you meet with your WorkOne counselor.</p>
</div>`;
  }

  if (hasFunding(p, 'apprenticeship')) {
    html += `
<div style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px;border-radius:8px;margin:12px 0">
<h3 style="margin-top:0;color:#374151">Registered Apprenticeship Funding</h3>
<p>As a <strong>USDOL Registered Apprenticeship</strong>, this program qualifies for additional federal and state funding. Apprentices earn wages while training &mdash; you get paid while you learn.</p>
</div>`;
  }

  if (hasFunding(p, 'next-level-jobs')) {
    html += `
<div style="background:#f9fafb;border:1px solid #e5e7eb;padding:16px;border-radius:8px;margin:12px 0">
<h3 style="margin-top:0;color:#374151">Next Level Jobs (Indiana)</h3>
<p>Indiana's Next Level Jobs program provides free training in high-demand fields. This program may qualify &mdash; your WorkOne counselor can confirm eligibility.</p>
</div>`;
  }

  return html;
}

function buildNextStepsHtml(p: ProgramInfo): string {
  if (isSelfPayOnly(p)) {
    return `
<h2 style="color:#1e293b;font-size:18px;border-bottom:2px solid #f97316;padding-bottom:6px;margin-top:28px">YOUR NEXT STEPS</h2>
<div style="background:white;border:1px solid #e2e8f0;border-left:4px solid #e5e7eb;padding:16px;margin:12px 0;border-radius:0 6px 6px 0">
<h3 style="margin-top:0">Step 1: Call Us to Discuss Enrollment</h3>
<p>Call <strong>(317) 314-3757</strong> or reply to this email. We will walk you through:</p>
<ul>
<li>Program schedule and start dates</li>
<li>Tuition and payment options</li>
<li>Any available scholarships or discounts</li>
<li>What to bring on your first day</li>
</ul>
</div>
<div style="background:white;border:1px solid #e2e8f0;border-left:4px solid #e5e7eb;padding:16px;margin:12px 0;border-radius:0 6px 6px 0">
<h3 style="margin-top:0">Step 2: Complete Enrollment</h3>
<p>Once payment is arranged, we will get you enrolled and send you all the details to get started.</p>
</div>`;
  }

  return `
<h2 style="color:#1e293b;font-size:18px;border-bottom:2px solid #f97316;padding-bottom:6px;margin-top:28px">YOUR NEXT STEPS &mdash; DO THIS NOW</h2>

<div style="background:white;border:1px solid #e2e8f0;border-left:4px solid #e5e7eb;padding:16px;margin:12px 0;border-radius:0 6px 6px 0">
<h3 style="margin-top:0">Step 1: Go to Indiana Career Connect and Create an Account</h3>
<p>Go to: <strong><a href="https://www.indianacareerconnect.com">www.indianacareerconnect.com</a></strong></p>
<ol>
<li>Click <strong>"Create Account"</strong> or <strong>"Register"</strong> in the top right corner</li>
<li>Choose <strong>"Job Seeker"</strong> as your account type</li>
<li>Fill in your personal information &mdash; name, email, phone, address</li>
<li>Create a username and password (write these down)</li>
<li>Complete your profile &mdash; add your work history, education, and skills</li>
</ol>
</div>

<div style="background:white;border:1px solid #e2e8f0;border-left:4px solid #e5e7eb;padding:16px;margin:12px 0;border-radius:0 6px 6px 0">
<h3 style="margin-top:0">Step 2: Find Your Local WorkOne Office and Make an Appointment</h3>
<ol>
<li>Log in to <a href="https://www.indianacareerconnect.com">indianacareerconnect.com</a></li>
<li>Click <strong>"Find a WorkOne Office"</strong> or <strong>"Locations"</strong></li>
<li>Search by your ZIP code</li>
<li>Call that office and say: <strong>"I want to make an appointment with a career counselor to discuss WIOA funding for the ${p.name} program through Elevate for Humanity Career &amp; Technical Institute"</strong></li>
<li>Training provider name: <strong>Elevate for Humanity Career &amp; Technical Institute</strong></li>
<li>Program name: <strong>${p.name}</strong></li>
</ol>
<p><strong>Indianapolis WorkOne:</strong> Call <strong>(317) 890-4640</strong> &mdash; they will direct you to the right location.</p>
</div>

<div style="background:white;border:1px solid #e2e8f0;border-left:4px solid #e5e7eb;padding:16px;margin:12px 0;border-radius:0 6px 6px 0">
<h3 style="margin-top:0">Step 3: Attend Your WorkOne Appointment</h3>
<p>Bring:</p>
<ul>
<li><strong>Government-issued photo ID</strong> (driver's license, state ID, or passport)</li>
<li><strong>Proof of income</strong> (pay stubs, tax return, or letter of unemployment)</li>
<li><strong>Proof of address</strong> (utility bill, lease, or mail with your name/address)</li>
${hasFunding(p, 'jri') ? '<li>If you have a <strong>criminal record</strong>, ask about <strong>JRI funding</strong></li>' : ''}
</ul>
<p>The counselor will determine your funding eligibility and issue a voucher if approved.</p>
</div>

<div style="background:white;border:1px solid #e2e8f0;border-left:4px solid #e5e7eb;padding:16px;margin:12px 0;border-radius:0 6px 6px 0">
<h3 style="margin-top:0">Step 4: Call Us Back and Update Your Progress</h3>
<p>Once you have met with WorkOne:</p>
<ol>
<li><strong>Call us at (317) 314-3757</strong> or reply to this email with:
<ul><li>Whether you were approved for funding</li><li>Your WorkOne counselor's name</li><li>When you want to start</li></ul></li>
<li><strong>Log in and update your progress</strong> so we can track where you are:<br>
<a href="${SITE_URL}/next-steps" style="color:#f97316;font-weight:bold">${SITE_URL}/next-steps</a></li>
</ol>
</div>

<div style="background:#f9fafb;border:1px solid #e5e7eb;padding:12px 16px;border-radius:6px;margin:16px 0;font-weight:bold;color:#374151">
IMPORTANT: DO NOT WAIT. WorkOne appointments can take 1-2 weeks to schedule. Do Step 1 and Step 2 today.
</div>`;
}

function buildHtml(firstName: string, p: ProgramInfo): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;line-height:1.8;color:#333;margin:0;padding:0">
<div style="max-width:680px;margin:0 auto;padding:24px">
<div style="padding:30px;text-align:center;border-radius:8px 8px 0 0;border-bottom:2px solid #e5e7eb">
  <h1 style="margin:0;color:white;font-size:24px">Welcome to Elevate for Humanity!</h1>
  <p style="margin:8px 0 0;color:#fed7aa;font-size:15px">${p.name} Program</p>
</div>
<div style="padding:30px;background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">

<p>Hi ${firstName},</p>
<p>Thank you for applying to the <strong>${p.name}</strong> program at Elevate for Humanity Career &amp; Technical Institute! We received your application and we are excited to help you get started.</p>

<h2 style="color:#1e293b;font-size:18px;border-bottom:2px solid #f97316;padding-bottom:6px;margin-top:28px">ABOUT THE PROGRAM</h2>
<p>${p.description}</p>
<p><strong>Duration:</strong> ${p.duration}</p>
<p><strong>Credentials You Earn:</strong> ${p.credentials}</p>
<p><strong>Career Outlook:</strong> ${p.careerOutlook}</p>
${p.etplApproved ? '<p style="color:#374151"><strong>✓ ETPL Approved</strong> — This program is on Indiana\'s Eligible Training Provider List.</p>' : ''}

${buildFundingHtml(p)}

${buildNextStepsHtml(p)}

<p>If you have any questions &mdash; call me directly at <strong>(317) 314-3757</strong> or reply to this email.</p>
<p>Looking forward to working with you, ${firstName}.</p>
<p>Best regards,<br><strong>Elizabeth Greene</strong><br>Director, Elevate for Humanity Career &amp; Technical Institute<br>(317) 314-3757<br><a href="${SITE_URL}">${SITE_URL}</a></p>

</div>
<div style="padding:20px;text-align:center;color:#6b7280;font-size:13px;margin-top:16px">
<p>2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Technical Institute<br>8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
</div>
</div>
</body></html>`;
}

function buildText(firstName: string, p: ProgramInfo): string {
  const selfPay = isSelfPayOnly(p);

  let fundingText = '';
  if (selfPay) {
    fundingText = `PROGRAM COST
The ${p.name} program is self-pay or employer-sponsored. Contact us at (317) 314-3757 to discuss payment options.`;
  } else {
    fundingText = 'HOW FUNDING WORKS\n';
    if (hasFunding(p, 'wioa')) {
      fundingText += `WIOA: Federal program that can cover 100% of tuition, books, tools, transportation. Qualify if unemployed, underemployed, receiving assistance, veteran, youth 16-24, or low-income.\n`;
    }
    if (hasFunding(p, 'jri')) {
      fundingText += `JRI: Indiana program for justice-involved individuals. Covers 100% of training, tools, transportation.\n`;
    }
    if (hasFunding(p, 'apprenticeship')) {
      fundingText += `Registered Apprenticeship: Earn wages while training.\n`;
    }
  }

  let stepsText = '';
  if (selfPay) {
    stepsText = `NEXT STEPS
1. Call us at (317) 314-3757 to discuss enrollment, schedule, and payment options.
2. Once payment is arranged, we get you started.`;
  } else {
    stepsText = `NEXT STEPS — DO THIS NOW
1. Create account at www.indianacareerconnect.com (Job Seeker account)
2. Call your local WorkOne: (317) 890-4640. Say "I want an appointment for WIOA funding for ${p.name} through Elevate for Humanity"
3. Attend appointment. Bring: photo ID, proof of income, proof of address${hasFunding(p, 'jri') ? '. Ask about JRI if applicable.' : ''}
4. Call us back at (317) 314-3757 with your funding status. Update progress at ${SITE_URL}/next-steps

DO NOT WAIT — appointments take 1-2 weeks to schedule.`;
  }

  return `Hi ${firstName},

Thank you for applying to ${p.name} at Elevate for Humanity!

ABOUT THE PROGRAM
${p.description}
Duration: ${p.duration}
Credentials: ${p.credentials}
Career Outlook: ${p.careerOutlook}

${fundingText}

${stepsText}

Questions? Call (317) 314-3757 or reply to this email.

Elizabeth Greene
Director, Elevate for Humanity Career & Technical Institute
(317) 314-3757
${SITE_URL}`;
}
