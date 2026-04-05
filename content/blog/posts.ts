/**
 * Static blog posts — rendered at build time.
 * Add new posts here. They merge with any published DB posts at runtime.
 *
 * content: supports markdown-style syntax (##, **, *, - lists, [text](url))
 */

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author_name: string;
  published_at: string;
  category: string;
  tags: string[];
  image: string;
  published: true;
};

export const STATIC_POSTS: BlogPost[] = [
  {
    id: 'static-1',
    slug: 'what-is-wioa-and-how-does-it-pay-for-your-training',
    title: 'What Is WIOA — and How Does It Pay for Your Training?',
    excerpt:
      'WIOA is a federal law that funds free career training for eligible adults. Here is exactly how it works, who qualifies, and how to apply through Elevate.',
    published_at: '2025-05-01T00:00:00.000Z',
    author_name: 'Elizabeth Greene',
    category: 'Funding',
    tags: ['WIOA', 'Funding', 'Free Training', 'Workforce Development'],
    image: '/images/pages/funding-hero.jpg',
    published: true,
    content: `## What Is WIOA?

The **Workforce Innovation and Opportunity Act (WIOA)** is a federal law that funds career training for adults, dislocated workers, and youth across the United States. It is administered in Indiana through the Department of Workforce Development (DWD) and delivered locally through WorkOne career centers.

WIOA is not a loan. It does not need to be repaid. For eligible participants, it covers tuition, books, certification fees, and in some cases supportive services like transportation and childcare.

## Who Qualifies?

WIOA has two main adult tracks:

**Adult Program** — for individuals 18 and older who are:
- Unemployed or underemployed
- Low-income (based on household size and income thresholds)
- Receiving public assistance (SNAP, TANF, SSI, or similar)

**Dislocated Worker Program** — for individuals who have:
- Been laid off or received a notice of layoff
- Lost a job due to a plant closure or mass layoff
- Left the military within the past 12 months

Income limits are higher for the Dislocated Worker track, and many people who do not qualify for the Adult Program qualify here.

## What Does WIOA Cover at Elevate?

At Elevate for Humanity, WIOA funding can cover:

- **Tuition** for approved programs (CNA, CDL, Medical Assistant, HVAC, and more)
- **Books and supplies**
- **Certification exam fees** (EPA 608, OSHA, WorkKeys, NHA, and others)
- **Supportive services** — ask your WorkOne case manager about transportation and childcare assistance

## How to Apply

1. **Contact your local WorkOne center** — find yours at [workone.in.gov](https://www.workone.in.gov)
2. **Complete an intake assessment** — WorkOne will determine your eligibility and funding level
3. **Choose an approved program** — Elevate is listed on Indiana's Eligible Training Provider List (ETPL) under Location ID 10004621
4. **Enroll at Elevate** — once your Individual Training Account (ITA) is approved, we handle the rest

The process typically takes 2–4 weeks from first contact to enrollment. Starting early matters — funding is allocated on a first-come, first-served basis each program year.

## What If I Don't Qualify for WIOA?

If you do not qualify for WIOA, you may still be eligible for:

- **Workforce Ready Grant (WRG)** — Indiana state grant for high-demand certifications
- **JRI (Justice Reinvestment Initiative)** — for justice-involved individuals
- **Self-pay with BNPL** — flexible payment plans through Affirm, Klarna, and Sezzle for programs not covered by grants

[Check your eligibility](/wioa-eligibility) or [apply now](/apply/student) to get started.`,
  },
  {
    id: 'static-2',
    slug: 'why-a-national-credential-matters-more-than-a-certificate-of-completion',
    title: 'Why a National Credential Matters More Than a Certificate of Completion',
    excerpt:
      'Not all training certificates are equal. Here is the difference between a completion certificate and a nationally recognized credential — and why employers care.',
    published_at: '2025-05-08T00:00:00.000Z',
    author_name: 'Elizabeth Greene',
    category: 'Credentials',
    tags: ['Credentials', 'Certifications', 'Career', 'Workforce'],
    image: '/images/pages/success-hero.jpg',
    published: true,
    content: `## Two Kinds of Paper

When you finish a training program, you might receive a certificate. But there is a significant difference between two types:

**Certificate of Completion** — issued by the training provider. It says you attended and finished the course. Employers recognize it only as much as they recognize the training provider.

**National Credential** — issued by an independent certifying body (EPA, OSHA, ACT, NHA, Certiport, AHA). It is earned by passing a standardized exam. It is portable, verifiable, and recognized by employers across the country regardless of where you trained.

## Why Employers Prefer National Credentials

When a hiring manager sees a national credential on a resume, they know three things immediately:

1. You passed a standardized exam — not just a class
2. The credential can be verified independently
3. The standard is the same whether you trained in Indiana or California

A certificate of completion tells them you showed up. A national credential tells them you can do the job.

## What Credentials Does Elevate Issue?

Elevate is an authorized testing center for multiple national certifying bodies. Every program culminates in a credential issued by the certifying organization — not by Elevate.

- **CNA** — Indiana State Department of Health (ISDH) registry
- **Medical Assistant** — NHA CCMA (National Healthcareer Association)
- **HVAC** — EPA 608 Universal (Mainstream Engineering / EPA)
- **CDL** — Indiana Bureau of Motor Vehicles (BMV)
- **Barber** — Indiana Professional Licensing Agency (IPLA)
- **IT / Technology** — Certiport (IC3, MOS, CompTIA pathway)
- **Workplace Readiness** — ACT WorkKeys / National Career Readiness Certificate (NCRC)
- **Safety** — OSHA 10/30-Hour (U.S. Department of Labor)

## The WorkKeys NCRC: A Credential for Every Career

The **National Career Readiness Certificate (NCRC)** is issued by ACT and earned by passing three WorkKeys assessments: Applied Math, Workplace Documents, and Business Writing. It comes in four levels — Bronze, Silver, Gold, and Platinum.

Employers across Indiana use the NCRC as a hiring benchmark. It is not program-specific — it validates foundational workplace skills that apply to any career. Elevate is an authorized WorkKeys testing site.

## What to Ask Before You Enroll Anywhere

Before enrolling in any training program, ask:

- Who issues the credential at the end — the school or an independent body?
- Is the credential on a national registry that employers can verify?
- Is the testing center authorized by the certifying organization?

At Elevate, the answer to all three is clear. [View our full credential list](/credentials) or [apply to a program](/apply/student).`,
  },
  {
    id: 'static-3',
    slug: 'how-to-go-from-unemployed-to-employed-in-90-days-in-indiana',
    title: 'How to Go From Unemployed to Employed in 90 Days in Indiana',
    excerpt:
      'Indiana has more funded workforce training resources than most people realize. Here is a realistic 90-day roadmap from job loss to a new career with a national credential.',
    published_at: '2025-05-15T00:00:00.000Z',
    author_name: 'Elizabeth Greene',
    category: 'Career',
    tags: ['Career', 'Indiana', 'Workforce', 'WIOA', 'Job Training'],
    image: '/images/pages/how-it-works-hero.jpg',
    published: true,
    content: `## The 90-Day Window

Losing a job is disorienting. But Indiana has a dense network of workforce resources that most people never use — not because they don't qualify, but because they don't know where to start.

This is a realistic roadmap. Not a motivational post. A sequence of actual steps.

## Week 1–2: File and Assess

**File for unemployment immediately** if you were laid off or let go. Do not wait. Benefits are retroactive to your filing date, not the date you were approved.

**Contact WorkOne** — Indiana's workforce development network. Find your nearest center at [workone.in.gov](https://www.workone.in.gov). Schedule an intake appointment. This is free.

At your intake, a case manager will:
- Assess your eligibility for WIOA funding
- Review your work history and transferable skills
- Help you identify target careers based on labor market data

## Week 3–4: Choose a Program and Get Funded

Indiana's labor market data consistently shows high demand in:

- **Healthcare** — CNA, Medical Assistant (4–8 weeks, WIOA-funded)
- **Skilled Trades** — HVAC, Electrical, Welding (8–16 weeks, WIOA/WRG-funded)
- **Transportation** — CDL Class A (4–6 weeks, WRG-funded)
- **Technology** — IT Help Desk, Cybersecurity (8–12 weeks)

If you qualify for WIOA, your case manager will issue an **Individual Training Account (ITA)** — essentially a voucher that pays your tuition directly to the training provider.

Elevate for Humanity is on Indiana's **Eligible Training Provider List (ETPL)** under Location ID 10004621. Your ITA can be used here.

## Week 5–12: Train and Credential

Most of Elevate's programs run 4–12 weeks. During training you will:

- Complete hands-on, competency-based instruction
- Prepare for your national certification exam
- Take your exam on-site at Elevate (authorized testing center)
- Graduate with a credential issued by a national body — not just a completion certificate

## Week 10–12: Job Placement

Elevate's career services team works with you during training, not after. That means:

- Resume review and interview preparation
- Direct connections to employer partners
- Job board access with pre-screened openings

Many graduates receive job offers before they finish training. Employers actively recruit from our cohorts because they know graduates hold verified national credentials.

## The Numbers

Indiana's average starting wages for Elevate program graduates:

- CNA: $16–$19/hr
- Medical Assistant: $18–$22/hr
- HVAC Technician: $22–$28/hr
- CDL Driver: $24–$32/hr
- IT Help Desk: $18–$24/hr

At 40 hours per week, a $20/hr job is $41,600/year. That is a meaningful income change for most households — achieved in under 90 days with $0 out of pocket for eligible participants.

## Start Now

[Check your WIOA eligibility](/wioa-eligibility) — it takes about 5 minutes.

[View all programs](/programs) — filter by sector, duration, and funding type.

[Apply as a student](/apply/student) — the application takes about 10 minutes.

If you have questions, [contact our team](/contact). We will tell you exactly what you qualify for and what the next step is.`,
  },
];
