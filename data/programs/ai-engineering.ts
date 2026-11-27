/**
 * AI Engineering — short online foundation course in applied AI engineering.
 *
 * Source of truth: the published Supabase records created 2026-11-25 —
 *   programs row b5153cdf-a23c-49b4-a1fd-af0826be86d4 (slug 'ai-engineering')
 *   courses  row b9156bad-d77d-4e7a-be09-a954c08a8045 (12 lessons, 3 modules,
 *   compiler-verified 12/12) and workbook 'ai-engineering-applied-practice'.
 * Every fact below comes from those rows: title, description, CIP 11.0102,
 * NIST AI RMF 1.0 alignment, the two external exam-preparation targets,
 * ~19 planned hours over 3 weeks, and the 80% mastery + capstone completion
 * criteria.
 *
 * What the source does NOT state and this file therefore does NOT invent:
 * no tuition (programs.tuition/total_cost and courses.tuition_cost are NULL —
 * selfPayCost uses the registry's unset-price pattern), no SOC code (left
 * blank in the source on purpose: no distinct AI-engineer SOC exists), and
 * no salary or labour-market figures (the source salary/industry fields are
 * NULL, so pathway/career salary fields use 'Varies by employer', the
 * commercial-cleaning pattern). Funding flags in the source are all false:
 * the program is not ETPL/WIOA approved and no funding claim is made.
 */
import type { ProgramSchema } from '@/lib/programs/program-schema';

export const AI_ENGINEERING: ProgramSchema = {
  slug: 'ai-engineering',
  title: 'AI Engineering',
  subtitle:
    'Twelve online lessons (about 19 planned study hours) covering how AI works, prompt engineering, APIs, data privacy, evaluation, safety, and automation — ending in a capstone where you build and document a real AI workflow.',
  sector: 'technology',
  category: 'Technology',
  programType: 'certification',
  heroImage: '/images/pages/admin-ai-studio-hero.webp',
  heroImageAlt: 'Developer working at a multi-screen workstation',
  deliveryMode: 'online',
  deliveredBy: 'Elevate',
  durationWeeks: 3,
  hoursPerWeekMin: 6,
  hoursPerWeekMax: 7,
  hoursBreakdown: {
    modules: [
      { label: 'AI Foundations', hours: 6 },
      { label: 'Building with AI', hours: 6 },
      { label: 'Trust, Safety, and Automation', hours: 7 },
    ],
  },
  schedule: 'Fully online — self-paced study, about 6–7 hours per week for 3 weeks',
  cohortSize: 'Open enrollment',
  fundingStatement:
    'Tuition has not been set for this program yet. Any sponsor or workforce funding must be verified in writing before it is described as approved.',
  selfPayCost: 'Contact admissions',
  fundingOptions: ['self_pay'],
  credentials: [
    {
      name: 'Elevate AI Engineering Certificate of Completion',
      issuer: 'Elevate for Humanity',
      description:
        'Awarded on completion of all twelve lessons with at least 80% mastery and an approved capstone project.',
    },
    {
      name: 'AWS Certified AI Practitioner (AIF-C01) — exam preparation',
      issuer: 'Amazon Web Services',
      description:
        'External certification exam. This course prepares learners for it; the credential is awarded by AWS, not by Elevate.',
    },
    {
      name: 'Microsoft Azure AI Fundamentals (AI-900) — exam preparation',
      issuer: 'Microsoft',
      description:
        'External certification exam. This course prepares learners for it; the credential is awarded by Microsoft, not by Elevate.',
    },
  ],
  outcomes: [
    {
      statement: 'Explain how large language models work and where they fail.',
      assessedAt: 'Lesson 2',
    },
    {
      statement: 'Write and iterate structured prompts with a test set.',
      assessedAt: 'Lessons 3–4',
    },
    {
      statement:
        'Design an AI API integration with structured output, validation, and safe key handling.',
      assessedAt: 'Lesson 6',
    },
    {
      statement: 'Apply data minimization and grounding so private data stays protected.',
      assessedAt: 'Lesson 8',
    },
    {
      statement:
        'Verify AI output against independent sources and measure a workflow with an evaluation set.',
      assessedAt: 'Lesson 9',
    },
    {
      statement: 'Run an AI risk review using the NIST AI RMF (Govern, Map, Measure, Manage).',
      assessedAt: 'Lesson 10',
    },
    {
      statement: 'Design automation with an autonomy level, guardrails, and human checkpoints.',
      assessedAt: 'Lesson 11',
    },
    {
      statement: 'Build and document a small AI workflow end to end (capstone).',
      assessedAt: 'Lesson 12 (capstone)',
    },
  ],
  careerPathway: [
    {
      title: 'AI Workflow Assistant (business operations)',
      timeframe: 'After program completion',
      requirements: 'Elevate AI Engineering completion record and capstone project',
      salaryRange: 'Varies by employer',
    },
    {
      title: 'Entry-Level AI Support and Automation Assistant',
      timeframe: 'After program completion',
      requirements: 'Completion record; AI support and automation tasks performed under supervision',
      salaryRange: 'Varies by employer',
    },
    {
      title: 'External Certification Candidate',
      timeframe: 'After program completion',
      requirements:
        'Sit the AWS Certified AI Practitioner or Microsoft AI-900 exam with the awarding provider',
      salaryRange: 'Varies by employer',
    },
  ],
  weeklySchedule: [
    {
      week: 'Module 1',
      title: 'AI Foundations',
      competencyMilestone:
        'Explain how large language models work and write structured, iterated prompts',
    },
    {
      week: 'Module 2',
      title: 'Building with AI',
      competencyMilestone:
        'Design an AI API integration and plan its cost, data, and reliability behavior',
    },
    {
      week: 'Module 3',
      title: 'Trust, Safety, and Automation',
      competencyMilestone:
        'Evaluate AI output, run a NIST AI RMF risk review, and complete the capstone workflow',
    },
  ],
  curriculum: [
    {
      title: 'AI Foundations',
      topics: [
        'What AI is — and what it is not',
        'How large language models actually work',
        'Prompt engineering: structure, context, and examples',
        'Prompt engineering: iteration and failure modes',
      ],
    },
    {
      title: 'Building with AI',
      topics: [
        'AI tools and workflows in a business',
        'Building with AI APIs: requests, keys, and structured output',
        'Cost, rate limits, and reliability in AI systems',
        'Data for AI: quality, privacy, and what never to paste',
      ],
    },
    {
      title: 'Trust, Safety, and Automation',
      topics: [
        'Evaluating AI output and catching hallucinations',
        'AI safety, ethics, and workplace policy',
        'Automation with AI: agents and human-in-the-loop',
        'Capstone: build and document a small AI workflow',
      ],
    },
  ],
  complianceAlignment: [
    {
      standard: 'NIST AI Risk Management Framework (AI RMF 1.0)',
      description:
        'Safety, ethics, and workplace-policy content is aligned to the NIST AI Risk Management Framework (Govern, Map, Measure, Manage), published by the National Institute of Standards and Technology.',
    },
    {
      standard: 'NCES CIP 11.0102 — Artificial Intelligence',
      description:
        'Program classified under CIP code 11.0102 (Artificial Intelligence), NCES CIP 2020.',
    },
  ],
  laborMarket: {
    medianSalary: 0,
    salaryRange: 'Varies by employer',
    growthRate: 'Contact admissions for current local labor-market information',
    source: 'No labor-market source is recorded for this program yet',
    sourceYear: 2026,
    region: 'National',
  },
  careers: [
    { title: 'AI Workflow Assistant', salary: 'Varies by employer' },
    { title: 'AI Support and Automation Assistant', salary: 'Varies by employer' },
  ],
  cta: {
    applyHref: '/apply?program=ai-engineering',
    requestInfoHref: '/programs/ai-engineering/request-info',
    advisorHref: '/contact',
    courseHref: '/programs/ai-engineering',
  },
  programDescription: [
    'A short, fully online foundation course in applied AI engineering: how large language models work, prompt engineering, building with AI tools and APIs, data quality and privacy, evaluating output, AI safety and workplace policy under the NIST AI Risk Management Framework, and automation with human oversight. Twelve authored lessons (about 19 planned online study hours) with workbook assignments, knowledge checks, and a capstone project in which each learner builds and documents a small AI workflow.',
    'The course awards an Elevate completion record. It is designed to prepare learners for external entry-level certification exams such as AWS Certified AI Practitioner and Microsoft Azure AI Fundamentals (AI-900); those credentials are awarded by their own providers, not by Elevate. This program is not currently ETPL/WIOA approved, and tuition has not been set.',
  ],
  admissionRequirements: [
    'Basic computer literacy',
    'Comfort reading and writing plain English',
    'No prior coding experience required',
  ],
  modality: 'Fully online — twelve authored lessons in the Elevate LMS with workbook assignments and a capstone project',
  // No employer partners are named in the source program record.
  employerPartners: ['Contact admissions for current employer partners'],
  pricingIncludes: [
    '12 online lessons (about 19 planned study hours)',
    'Workbook assignments and knowledge checks',
    'Capstone project with instructor review',
    'Elevate AI Engineering Certificate of Completion',
  ],
  paymentTerms:
    'Tuition has not been set for this program yet. Contact admissions for current tuition and payment options.',
  faqs: [
    {
      question: 'Do I need coding experience?',
      answer:
        'No. Basic computer literacy and comfort reading and writing plain English are the only prerequisites; the API lesson is taught through guided design examples.',
    },
    {
      question: 'What credential do I earn?',
      answer:
        'You earn the Elevate AI Engineering Certificate of Completion. The course also prepares you for the AWS Certified AI Practitioner and Microsoft AI-900 exams, which are awarded by AWS and Microsoft, not by Elevate.',
    },
    {
      question: 'How long does it take?',
      answer:
        'Twelve online lessons, about 19 planned study hours over 3 weeks (roughly 6–7 hours per week).',
    },
    {
      question: 'How much does it cost?',
      answer:
        'Tuition has not been set for this program yet. Contact admissions for current tuition.',
    },
    {
      question: 'Is this program WIOA funded?',
      answer:
        'No. This program is not currently ETPL/WIOA approved. Any sponsor or workforce funding must be verified in writing before it is described as approved.',
    },
  ],
  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'AI Engineering' },
  ],
  metaTitle: 'AI Engineering | Elevate for Humanity',
  metaDescription:
    'Twelve online lessons (about 19 planned study hours) covering how AI works, prompt engineering, APIs, data privacy, evaluation, safety, and automation — ending in a capstone where you build and document a real AI workflow.',
  funding: {
    fssa_eligible: false,
    wioa_eligible: false,
    wrg_eligible: false,
    jobReadyIndyEligible: false,
    fundingNotes:
      'Not currently ETPL/WIOA approved. Tuition has not been set, and all funding flags are false in the source program record.',
  },
  lmsCourseSlug: 'ai-engineering',
};
