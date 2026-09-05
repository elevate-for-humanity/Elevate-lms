/**
 * Static blog posts — rendered at build time.
 * Add new posts here. They merge with any published DB posts at runtime.
 *
 * Public funding and outcome language must remain informational. A blog article
 * is not evidence of participant eligibility, program approval, an award,
 * credential issuance, employment, wages, or a completion timeline.
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
    title: 'What Is WIOA — and How Can Training Funding Work?',
    excerpt:
      'WIOA can support eligible participants in eligible training programs. WorkOne or the responsible workforce agency determines eligibility, approved costs, and authorization.',
    published_at: '2025-05-01T00:00:00.000Z',
    author_name: 'Elizabeth Greene',
    category: 'Funding',
    tags: ['WIOA', 'Funding', 'Workforce Development'],
    image: '/images/pages/funding-hero.webp',
    published: true,
    content: `## What Is WIOA?

The **Workforce Innovation and Opportunity Act (WIOA)** is a federal workforce-development law. In Indiana, local workforce professionals and the responsible workforce entities determine participant eligibility and authorize training services under the rules and funding available for the applicable program year.

WIOA assistance is not created by a training provider's website, application, eligibility quiz, or provider relationship. A participant must be found eligible and the training program and covered costs must be authorized by the responsible workforce agency.

## Who May Be Considered?

WIOA includes adult, dislocated-worker, and youth programs with different eligibility rules. Employment status, income, public-assistance status, layoff history, age, and other criteria can matter depending on the program. The responsible workforce agency makes the determination.

## What Costs May Be Authorized?

Depending on the participant, program, local policy, available funding, and written authorization, workforce assistance may include some combination of:

- approved training tuition or fees
- required books or materials
- approved credential or examination costs
- supportive services when separately authorized

Do not assume every cost is covered or that every Elevate program is eligible. Program-level status and participant authorization are separate controls.

## How to Start

1. Review the exact training program and its published tuition and requirements.
2. Contact your local WorkOne or responsible workforce office for an eligibility assessment.
3. Confirm that the specific program is eligible for the funding source being requested.
4. Obtain the required written authorization before treating an enrollment as workforce funded.
5. Complete Elevate's program-specific admissions and onboarding requirements.

Funding availability and approval timelines vary. Elevate does not issue WIOA eligibility determinations or guarantee an Individual Training Account.

[Review funding guidance](/funding/wioa) or [start the student application](/apply/student).`,
  },
  {
    id: 'static-2',
    slug: 'why-a-national-credential-matters-more-than-a-certificate-of-completion',
    title: 'Independent Credentials and Provider Certificates: What Is the Difference?',
    excerpt:
      'Learn the difference between a provider-issued certificate of completion and a credential issued by an independent certification, licensing, testing, or government authority.',
    published_at: '2025-05-08T00:00:00.000Z',
    author_name: 'Elizabeth Greene',
    category: 'Credentials',
    tags: ['Credentials', 'Certifications', 'Career', 'Workforce'],
    image: '/images/pages/success-hero.webp',
    published: true,
    content: `## Two Different Records

A **certificate of completion** is generally issued by a training provider to document completion of that provider's requirements.

An **independent credential, certification, license, registry status, or testing result** is controlled by the organization or government authority that owns that credential. Its eligibility rules, examinations, fees, renewal requirements, and issuance standards are not controlled by Elevate.

## Why the Distinction Matters

Applicants should know who controls the credential associated with a program before enrolling. A training provider can prepare a learner for an outside examination or licensing process without having authority to guarantee that the outside organization will issue the credential.

## Questions to Ask Before Enrolling

- Who is the credentialing, testing, registry, or licensing authority?
- Is an outside examination or application required?
- Are there age, education, background, clinical, work-hour, or other prerequisites?
- Are exam and application fees included in the published program price or separately funded?
- Does the training provider issue only a completion record, or does a third party issue the final credential?

Elevate publishes program-specific credential disclosures and separates provider completion records from third-party credential authority. Certification, licensing, registry placement, and examination outcomes are not guaranteed.

[Review programs](/programs) or [see consumer disclosures](/consumer-disclosures).`,
  },
  {
    id: 'static-3',
    slug: 'how-to-go-from-unemployed-to-employed-in-90-days-in-indiana',
    title: 'Planning a Career Transition in Indiana: A Practical Workforce Checklist',
    excerpt:
      'A practical sequence for reviewing workforce services, training options, funding authorization, credentials, and job-search support without promising a fixed employment timeline.',
    published_at: '2025-05-15T00:00:00.000Z',
    author_name: 'Elizabeth Greene',
    category: 'Career',
    tags: ['Career', 'Indiana', 'Workforce', 'WIOA', 'Job Training'],
    image: '/images/pages/how-it-works-hero.webp',
    published: true,
    content: `## Start With the Workforce System

If you are unemployed, underemployed, or changing careers in Indiana, begin by separating four questions: what occupation you are targeting, what training is required, whether a third party will authorize funding, and what the employer or licensing authority requires after training.

## Step 1: Assess the Occupation

Use current labor-market information and actual job postings to compare duties, schedule, location, licensing or credential requirements, and typical employer expectations. Wage information should be treated as market data, not a promise of individual earnings.

## Step 2: Review the Exact Program

Compare the published duration, tuition, delivery model, required in-person activity, credential objective, prerequisites, and enrollment requirements for the specific program. Program timelines can change and do not guarantee a completion date.

## Step 3: Determine Whether Funding Applies

If you want WIOA, Workforce Ready Grant, vocational-rehabilitation, employer, or another third-party funding source, confirm both the program's current status and your own eligibility with the responsible agency. Do not treat provider status, a website label, or a preliminary quiz as an award.

## Step 4: Complete Training and External Requirements

Training completion and third-party credential issuance are separate events when an outside certification, registry, testing, or licensing authority is involved. Complete all requirements that apply to the specific credential pathway.

## Step 5: Use Career Services Without Treating Them as a Placement Guarantee

Career services may include resume review, interview preparation, job-search support, referrals, and employer introductions. Hiring, placement, wages, start dates, and retention are controlled by employers and market conditions and are not guaranteed by Elevate.

## Build a Documented Plan

Keep copies of your program disclosures, enrollment agreement, funding authorization, credential requirements, and job-search records. A documented sequence is more useful than relying on broad promises about cost, speed, or employment outcomes.

[View all programs](/programs), [review funding guidance](/funding), or [apply as a student](/apply/student).`,
  },
  {
    id: 'static-host-shop-1',
    slug: 'how-indianapolis-barbershops-can-build-an-apprentice-talent-pipeline',
    title: 'How Indianapolis Barbershops Can Build an Apprentice Talent Pipeline',
    excerpt: 'A practical guide to becoming an apprenticeship Host Site, developing paid talent, documenting training, and exploring conditional workforce support.',
    published_at: '2026-09-05T00:00:00.000Z',
    author_name: 'Elizabeth Greene',
    category: 'Apprenticeships',
    tags: ['Indianapolis', 'Barbershops', 'Host Sites', 'Apprenticeships'],
    image: '/images/partners/kountry-kutz-interior.webp',
    published: true,
    content: `## Empty Chairs Are a Talent-Development Question

An empty chair does not have one universal dollar value, and an apprentice is not free labor. For an Indianapolis barbershop that wants to develop its team, a registered apprenticeship pathway can provide a structured way to employ and train a paid apprentice under qualified supervision.

## What the Host Site Does

The Host Site employs and pays the apprentice, provides a safe approved work environment, assigns qualified supervision, and verifies on-the-job learning hours and competencies. The shop remains responsible for payroll, insurance, equipment, supplies, scheduling, and normal employer obligations.

## What Elevate Supports

Elevate supports related instruction, onboarding, agreements, training records, hour and competency workflows, document review, and sponsor oversight. The secure Host Shop portal keeps operational records out of the public website.

## Where Workforce Reimbursement May Fit

Some employers and participants may qualify for WorkOne On-the-Job Training wage reimbursement. Eligibility, rate, covered hours, training plan, and timing are determined by the responsible workforce entity. Written authorization must be obtained before covered training begins.

## Start With the Worksite

Prepare the business license, supervising professional license, liability coverage, workers’ compensation certificate or valid exemption, EIN verification or W-9, and worksite details. Elevate reviews the occupation fit and current capacity before final approval or placement.

[Review the Indianapolis Host Site pathway](/partners/host-shops/indiana/indianapolis) or [submit the no-cost Host Site application](/partners/host-shop/apply).`,
  },
  {
    id: 'static-host-shop-2',
    slug: 'indiana-salon-owner-guide-to-workone-ojt-wage-reimbursement',
    title: 'Indiana Salon Owner’s Guide to WorkOne OJT Wage Reimbursement',
    excerpt: 'Understand what OJT wage reimbursement may cover, what remains the employer’s responsibility, and why written pre-authorization matters.',
    published_at: '2026-09-05T00:00:00.000Z',
    author_name: 'Elizabeth Greene',
    category: 'Workforce',
    tags: ['WorkOne', 'OJT', 'Indiana Salons', 'Wage Reimbursement'],
    image: '/images/pages/funding-hero.webp',
    published: true,
    content: `## Reimbursement Is Conditional—not Automatic

WorkOne On-the-Job Training support may reimburse an eligible employer for an authorized portion of eligible wages while an eligible participant learns job-specific skills. It is not automatic funding, free labor, a tuition award, or a payment promised by Elevate.

## The Decision Belongs to the Workforce Entity

The responsible WorkOne office or workforce entity evaluates the employer, participant, job, training plan, wage, reimbursement rate, covered period, and available funding. The employer should not begin work it expects to claim until written authorization is complete.

## Costs the Shop Still Carries

The Host Site remains the employer. It is responsible for wages, payroll taxes and records, insurance, supervision, tools, supplies, scheduling, workplace safety, and all other normal obligations except amounts specifically included in a written workforce agreement.

## Records Matter

Accurate payroll, attendance, on-the-job learning hours, competencies, supervisor approvals, and supporting documents make the process auditable. Elevate’s Host Shop portal centralizes those apprenticeship records; it does not replace the workforce entity’s funding decision.

## Plan Before You Promise

Use estimates only for planning. Do not advertise a reimbursement amount to a candidate, employee, or shop until the authorizing entity has confirmed it in writing.

[Explore regional Host Site support](/partners/host-shops) or [start the Host Site application](/partners/host-shop/apply).`,
  },
  {
    id: 'static-host-shop-3',
    slug: 'booth-renters-vs-paid-apprentices-what-indiana-salon-owners-should-compare',
    title: 'Booth Renters vs. Paid Apprentices: What Indiana Salon Owners Should Compare',
    excerpt: 'Compare two different business relationships without assuming either model guarantees revenue, retention, licensing, or funding.',
    published_at: '2026-09-05T00:00:00.000Z',
    author_name: 'Elizabeth Greene',
    category: 'Business',
    tags: ['Salon Business', 'Booth Rental', 'Apprenticeships', 'Indiana'],
    image: '/images/partners/generations-hair/color-transformation.webp',
    published: true,
    content: `## These Are Different Legal and Operating Models

A booth renter generally operates an independent business relationship, while a registered apprentice is a paid employee learning under an approved training structure. Classification, licensing, supervision, wage, tax, insurance, and recordkeeping rules must be evaluated for the actual arrangement.

## Compare Control and Responsibility

Salon owners should compare scheduling, service standards, client ownership, product use, supervision, education, payroll administration, workplace policies, and the degree of control the business exercises. A label in an agreement does not override the facts of the relationship.

## Compare Talent Development

An apprenticeship can help a shop deliberately develop a worker’s occupational skills through related instruction and documented on-the-job learning. That requires qualified supervision and consistent verification; it is not an instant staffing solution.

## Compare Economics With Real Numbers

Model wages, payroll costs, supervision time, supplies, chair utilization, service demand, pricing, retention, and any written reimbursement separately. Do not assume an apprentice will double foot traffic, fill every open chair, or create a particular amount of revenue.

## Choose the Model You Can Operate Correctly

The right structure depends on the shop’s capacity, business model, legal responsibilities, supervisor availability, and long-term workforce goals. Consult qualified legal, tax, licensing, and workforce professionals for decisions specific to your business.

[See approved Host Shop profiles](/partners/host-shops) or [check the Host Site requirements](/partners/host-shop/apply).`,
  },
];
