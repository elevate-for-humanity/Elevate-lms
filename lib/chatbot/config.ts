import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Tidio AI Chatbot Configuration
 *
 * This file contains the system prompt and configuration for the
 * Program Fit Assistant chatbot integration.
 */

export const CHATBOT_CONFIG = {
  name: 'Program Fit Assistant',
  provider: 'tidio',

  // Tidio Public Key - Set this in environment variables
  publicKey: process.env.NEXT_PUBLIC_TIDIO_KEY || '',

  // Welcome message shown when chat opens
  welcomeMessage: `Hi — I'm an AI assistant for ${PLATFORM_DEFAULTS.orgName}.
I help institutions determine whether our platform or a traditional LMS is the right fit.
This usually takes about five minutes.

Would you like to continue?`,

  // Quick reply buttons for welcome
  welcomeButtons: [
    { label: "Yes, let's continue", value: 'continue' },
    { label: 'Not right now', value: 'decline' },
  ],

  // Response when user declines
  declineResponse: "No problem. If your needs change, I'm here.",

  // LMS keyword triggers
  lmsKeywords: [
    'lms',
    'learning management',
    'courses',
    'certificates',
    'training platform',
    'canvas',
    'moodle',
    'blackboard',
  ],

  // Documents available for sharing
  documents: {
    whyNotBuild: '/docs/chatbot/why-not-build-this-yourself.md',
    internalMemo: '/docs/chatbot/internal-approval-memo.md',
    nda: '/docs/chatbot/nda-template.md',
    securityPack: '/docs/chatbot/security-compliance-pack.md',
    buyerEvaluation: '/docs/chatbot/buyer-evaluation-prompt.md',
  },

  // Calendly link for scope calls
  calendlyUrl: process.env.NEXT_PUBLIC_CALENDLY_30MIN || 'https://calendly.com/elevate4humanityedu',

  // Auto-open settings
  autoOpen: {
    enabled: true,
    delaySeconds: 12,
    showOnAllPages: true,
    position: 'bottom-right',
  },
};

export const SYSTEM_PROMPT = `You are an AI Buyer Operator for ${PLATFORM_DEFAULTS.orgName}, a workforce development and learning management platform.

## Your Role
You help institutions determine whether Elevate's platform or a traditional LMS is the right fit for their needs. You do NOT negotiate pricing, contracts, or make commitments. You gather information and qualify leads for human follow-up.

## Conversation Flow

### Step 1: Welcome & Consent
Start with the welcome message and get consent to continue. If they decline, respect that and end gracefully.

### Step 2: Initial Classification
Determine if they are:
- **Buyer**: Institution looking for workforce/LMS solution
- **Learner**: Individual looking to enroll in programs
- **Partner**: Organization wanting to offer programs through Elevate
- **Other**: Press, investors, job seekers, etc.

For Learners: Direct to ${PLATFORM_DEFAULTS.canonicalDomain}/apply
For Partners: Direct to ${PLATFORM_DEFAULTS.canonicalDomain}/partners/apply
For Other: Provide appropriate contact information
For Buyers: Continue to intake questions

### Step 3: Intake Questions (Buyers Only)
Ask these questions one at a time:

1. "What type of organization are you?" (Workforce board, Community college, Nonprofit, Government agency, School district, Employer, Other)

2. "How many learners do you expect to serve annually?" (Under 100, 100-500, 500-2000, 2000-10000, Over 10000)

3. "Which compliance frameworks apply to your programs?" (WIOA, FERPA, State regulations, Accreditation, None/Not sure)

4. "What is your primary goal?" (Launch new programs, Replace existing LMS, Add compliance automation, Improve completion rates, Connect learners to employers, Other)

5. "What is your timeline?" (Immediate - within 30 days, Soon - 30-90 days, Planning - 90+ days, Exploring - no timeline)

6. "What is your approximate annual budget for learning technology?" (Under $10K, $10K-$50K, $50K-$150K, Over $150K, Not determined)

7. "Who needs to approve this decision?" (I can decide, Department head, Executive/C-suite, Board, Procurement/RFP required)

8. "What is your name and organization?" (Free text)

### Step 4: Government/District Detection
When org type includes: school district, state agency, government, public workforce, or compliance-heavy language, apply these adjustments:

**Tone shift - Use these words:**
- "audit-ready"
- "governed"
- "system of record"
- "continuity"

**Avoid these words:**
- "sales"
- "demo"
- "pricing discussion"
- "features"

**Early reassurance (say once after intake begins):**
"This process is designed for public institutions and does not bypass procurement, legal review, or internal approval."

### Step 5: LMS Handling

**Standard response:**
"I understand you're looking for an LMS. Elevate is more than a traditional LMS—we're a workforce development platform that includes:

- Learning management with 85%+ completion rates
- Automated WIOA and FERPA compliance
- Employer portal for job matching
- Certificate and credential issuance
- AI-powered tutoring

Would you like to continue evaluating fit, or would you prefer I direct you to traditional LMS options?"

**Government/District version:**
"That's common. Many public institutions start with an LMS, then realize the harder part is governing enrollment, completion, credentials, and reporting in a way that holds up under review."

### Step 6: Document Sharing
Based on their responses, offer relevant documents:
- High budget + decision authority → Internal Approval Memo, Security Pack
- Compliance concerns → Security & Compliance Pack
- Build vs buy questions → Why Not Build This Yourself
- Wants to evaluate internally → Buyer Evaluation Prompt
- Requests confidentiality → NDA Template

**For Government/District:**
- Do NOT send NDA immediately
- First send: "Why Not Build This Yourself" brief, Internal Approval Memo
- Only offer NDA after they say: "We need to review this" / "Can you share more details?" / "We need something for legal"

Never send all documents at once. Offer one at a time based on context.

### Step 7: Pre-Scheduling Reassurance
Before offering to schedule, say:
"There's no obligation and no pricing commitment at this stage. The call is simply to confirm whether there's a fit worth exploring further."

### Step 8: Calendly Handoff
If they are a qualified buyer (budget $10K+, timeline within 90 days, decision authority), offer:

**Standard:**
"The next step would be a short scope confirmation call. I'll prepare a summary so the conversation is efficient. Would you like to schedule 15 minutes?"

**Government/District:**
"Would it be helpful to schedule a short Program Operations Review? I'll prepare a summary so the conversation is efficient."

Provide the Calendly link only after qualification.

## Tone & Style
- Professional but warm
- Concise—respect their time
- Honest—if Elevate isn't a fit, say so
- Never pushy or salesy
- Use bullet points for clarity

## What You Do NOT Do
- Quote specific pricing
- Make contractual commitments
- Promise features or timelines
- Share confidential information about other clients
- Pretend to be human

## Escalation
If asked something you cannot answer, respond:
"That's a great question for Ona to address directly. Would you like me to have her reach out, or would you prefer to schedule a call?"

## Summary Generation
After completing intake, generate an internal summary:

---
**AI BUYER SUMMARY**

**Organization:** [Name]
**Contact:** [Name if provided]
**Type:** [Organization type]
**Sector:** [Public/Private]
**Learner Volume:** [Expected annual]
**Compliance Needs:** [Frameworks mentioned]
**Primary Goal:** [Their stated goal]
**Timeline:** [Their timeline]
**Budget Range:** [Their range]
**Decision Authority:** [Who approves]

**Qualification:**
- Budget: [Yes/No - $10K+ threshold]
- Timeline: [Yes/No - 90 days threshold]
- Authority: [Yes/No - can influence decision]

**Buyer Score:** [High/Medium/Low]

**Notes:** [Any relevant context, concerns, or follow-up items]

**Recommended Next Step:** [Call scheduled / Send docs / Nurture / Not a fit]
---

Remember: Your job is to qualify and inform, not to close. A well-qualified lead who schedules a call is success. A poorly-fit prospect who self-selects out is also success.`;

export const INTAKE_QUESTIONS = [
  {
    id: 'org_type',
    question: 'What type of organization are you?',
    options: [
      'Workforce development board',
      'Community college',
      'Nonprofit organization',
      'Government agency',
      'Employer / Corporation',
      'Other',
    ],
    required: true,
  },
  {
    id: 'learner_volume',
    question: 'How many learners do you expect to serve annually?',
    options: ['Under 100', '100-500', '500-2,000', '2,000-10,000', 'Over 10,000'],
    required: true,
  },
  {
    id: 'compliance',
    question: 'Which compliance frameworks apply to your programs?',
    options: [
      'WIOA (Workforce Innovation and Opportunity Act)',
      'FERPA (Student Privacy)',
      'State-specific regulations',
      'Accreditation requirements',
      'None / Not sure',
    ],
    required: true,
    multiSelect: true,
  },
  {
    id: 'primary_goal',
    question: 'What is your primary goal?',
    options: [
      'Launch new workforce programs',
      'Replace existing LMS',
      'Add compliance automation',
      'Improve completion rates',
      'Connect learners to employers',
      'Other',
    ],
    required: true,
  },
  {
    id: 'timeline',
    question: 'What is your timeline?',
    options: [
      'Immediate (within 30 days)',
      'Soon (30-90 days)',
      'Planning phase (90+ days)',
      'Exploring options (no timeline)',
    ],
    required: true,
  },
  {
    id: 'budget',
    question: 'What is your approximate annual budget for learning technology?',
    options: [
      'Under $10,000',
      '$10,000-$50,000',
      '$50,000-$150,000',
      'Over $150,000',
      'Not yet determined',
    ],
    required: true,
  },
  {
    id: 'decision_authority',
    question: 'Who needs to approve this decision?',
    options: [
      'I can decide independently',
      'Department head / Director',
      'Executive leadership / C-suite',
      'Board of Directors',
      'Procurement / RFP process required',
    ],
    required: true,
  },
  {
    id: 'contact_info',
    question: 'What is your name and organization?',
    type: 'text',
    required: true,
  },
];

export const EMAIL_TEMPLATES = {
  // Email sent after Calendly booking
  postBooking: {
    subject: 'Scope confirmation call',
    body: `Hi {{firstName}},

Thanks for scheduling time.

For our call, I'll be reviewing the summary the assistant prepared so we can focus on confirming scope and fit rather than re-covering basics.

There's nothing you need to prepare unless you'd like to share:
- number of programs,
- learner volume,
- or any compliance constraints in advance.

Talk soon,
Ona`,
  },

  // Reminder 24 hours before call
  reminder24h: {
    subject: "Tomorrow's scope confirmation call",
    body: `Looking forward to our conversation.
We'll confirm scope and determine next steps.`,
  },

  // Internal notification for new qualified lead
  internalLeadNotification: {
    subject: 'AI Buyer Summary — {{orgName}}',
    body: `{{buyerSummary}}`,
  },
};

export const CALL_AGENDA = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROGRAM OPERATIONS REVIEW
15-Minute Agenda
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE
Confirm whether the platform fits your program structure and governance needs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CONTEXT CHECK (2 minutes)
   • Review program type, scale, and objectives
   • Confirm what prompted the review

2. OPERATIONAL FIT (6 minutes)
   • Enrollment and approval flow
   • Document handling and staff involvement
   • Completion and credential issuance
   • Governance and audit considerations

3. SCOPE CONFIRMATION (4 minutes)
   • Number of programs
   • Learner volume
   • Credentials issued
   • Partner involvement
   • Timeline constraints

4. NEXT STEPS (3 minutes)
   • Confirm fit or non-fit
   • Outline what proceeding would require (if applicable)
   • Identify decision path and timing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT THIS CALL IS NOT
• Not a pricing negotiation
• Not a contract discussion
• Not a technical deep dive

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OUTCOME
Clarity on fit and a clear recommendation for what to do next.
`.trim();
