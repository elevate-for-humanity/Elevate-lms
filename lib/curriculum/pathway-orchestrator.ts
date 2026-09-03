/**
 * lib/curriculum/pathway-orchestrator.ts
 *
 * Workforce Curriculum Pathway Orchestrator.
 *
 * This is the constrained assembly engine. It does NOT generate content —
 * it orchestrates assembly from approved providers into structured pathways.
 *
 * A "pathway" is a multi-program sequence that leads to a workforce outcome:
 *   e.g. "Community Health Worker + AI Digital Literacy"
 *        "IT Help Desk → Cybersecurity Analyst"
 *        "Office Specialist → Bookkeeping → QuickBooks Certification"
 *
 * The orchestrator:
 *   1. Validates the requested programs against the approved provider registry
 *   2. Maps each program to its competency framework and workforce outcomes
 *   3. Pulls MS Learn / Google / IBM content for each program
 *   4. Aligns content to Certiport exam objectives (if applicable)
 *   5. Generates a structured pathway with weekly pacing
 *   6. Produces an instructor pacing guide
 *   7. Outputs enrollment flow and LMS module structure
 *
 * The AI reasoning model (Azure o3-mini) is used for the assembly step —
 * it reasons over the competency map and content catalog to produce
 * a coherent, non-redundant, properly sequenced pathway.
 */

import { aiReason, aiChat } from '@/lib/ai/ai-service';
import { buildMSLearnContext, searchMSLearn } from '@/lib/ai/microsoft-learn';
import { buildProviderConstraintPrompt, getApprovedProvidersForCategory } from './approved-providers';
import { getCertiportContextForCourse } from '@/lib/partners/certiport';
import { buildWorkforceOutcomeContext } from './workforce-outcomes';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PathwayProgram {
  /** Program slug from your programs table */
  slug: string;
  title: string;
  /** Certiport exam code if this program leads to a Certiport cert */
  certiportExamCode?: string;
  /** O*NET SOC code for workforce outcome alignment */
  socCode?: string;
  /** Estimated weeks to complete */
  durationWeeks: number;
  /** CIP code for federal reporting */
  cipCode?: string;
}

export interface PathwayModule {
  weekNumber: number;
  title: string;
  program: string;
  objectives: string[];
  contentSources: string[]; // provider IDs
  activities: string[];
  assessmentType: 'quiz' | 'checkpoint' | 'lab' | 'assignment' | 'exam' | 'none';
  estimatedHours: number;
}

export interface InstructorPacingGuide {
  pathwayTitle: string;
  totalWeeks: number;
  totalHours: number;
  weeklyBreakdown: Array<{
    week: number;
    focus: string;
    instructorActions: string[];
    learnerActivities: string[];
    assessments: string[];
    resources: string[];
  }>;
  credentialMilestones: Array<{
    week: number;
    credential: string;
    provider: string;
    examCode?: string;
  }>;
}

export interface PathwayOrchestrationResult {
  pathwayTitle: string;
  description: string;
  programs: PathwayProgram[];
  modules: PathwayModule[];
  pacingGuide: InstructorPacingGuide;
  enrollmentFlow: string[];
  workforceOutcomes: string[];
  approvedProviders: string[];
  lmsStructure: {
    courses: Array<{
      slug: string;
      title: string;
      moduleCount: number;
      estimatedHours: number;
    }>;
  };
  complianceNotes: string[];
  generatedAt: string;
}

// ── IBM SkillsBuild static catalog (key topics) ───────────────────────────────
// No public API — we maintain a curated topic list for AI context injection.
const IBM_SKILLSBUILD_TOPICS: Record<string, string[]> = {
  'ai-digital-literacy': [
    'Introduction to Artificial Intelligence',
    'AI Ethics and Bias',
    'Machine Learning Fundamentals',
    'AI in the Workplace',
    'Data Privacy and AI',
    'Prompt Engineering Basics',
  ],
  'cybersecurity': [
    'Cybersecurity Fundamentals',
    'Network Security Basics',
    'Security Operations Center (SOC) Analyst',
    'Threat Intelligence',
    'Incident Response',
  ],
  'cloud': [
    'Cloud Computing Fundamentals',
    'IBM Cloud Essentials',
    'DevOps Fundamentals',
    'Containers and Kubernetes',
  ],
  'professional-development': [
    'Professional Communication',
    'Design Thinking',
    'Agile Explorer',
    'Enterprise Design Thinking',
    'Digital Credentials and Badges',
  ],
};

// ── Google Career Certificate topics ─────────────────────────────────────────
const GOOGLE_CERT_TOPICS: Record<string, string[]> = {
  'it-help-desk': [
    'Technical Support Fundamentals',
    'The Bits and Bytes of Computer Networking',
    'Operating Systems and You: Becoming a Power User',
    'System Administration and IT Infrastructure Services',
    'IT Security: Defense against the Digital Dark Arts',
  ],
  'cybersecurity': [
    'Foundations of Cybersecurity',
    'Play It Safe: Manage Security Risks',
    'Connect and Protect: Networks and Network Security',
    'Tools of the Trade: Linux and SQL',
    'Assets, Threats, and Vulnerabilities',
    'Sound the Alarm: Detection and Response',
    'Automate Cybersecurity Tasks with Python',
    'Put It to Work: Prepare for Cybersecurity Jobs',
  ],
  'data-analytics': [
    'Foundations: Data, Data, Everywhere',
    'Ask Questions to Make Data-Driven Decisions',
    'Prepare Data for Exploration',
    'Process Data from Dirty to Clean',
    'Analyze Data to Answer Questions',
    'Share Data Through the Art of Visualization',
    'Data Analysis with R Programming',
    'Google Data Analytics Capstone',
  ],
  'project-management': [
    'Foundations of Project Management',
    'Project Initiation: Starting a Successful Project',
    'Project Planning: Putting It All Together',
    'Project Execution: Running the Project',
    'Agile Project Management',
    'Capstone: Applying Project Management in the Real World',
  ],
};

// ── Core orchestration function ───────────────────────────────────────────────

/**
 * Orchestrate a multi-program workforce pathway.
 *
 * @param programs  — ordered list of programs in the pathway
 * @param pathwayTitle — human-readable pathway name
 * @param targetOutcome — the workforce outcome this pathway leads to
 */
export async function orchestratePathway(
  programs: PathwayProgram[],
  pathwayTitle: string,
  targetOutcome: string,
): Promise<PathwayOrchestrationResult> {
  logger.info('[pathway-orchestrator] Starting pathway orchestration', {
    pathwayTitle,
    programs: programs.map((p) => p.slug),
  });

  // 1. Build content context from approved providers for each program
  const contentContexts: string[] = [];

  for (const program of programs) {
    const category = program.slug;
    const providerConstraint = buildProviderConstraintPrompt(category);
    contentContexts.push(`\n### Program: ${program.title}\n${providerConstraint}`);

    // MS Learn content
    if (program.certiportExamCode) {
      const msCtx = await buildMSLearnContext(program.certiportExamCode).catch(() => '');
      if (msCtx) contentContexts.push(msCtx);

      const certiCtx = getCertiportContextForCourse(program.certiportExamCode);
      if (certiCtx) contentContexts.push(certiCtx);
    } else {
      const msModules = await searchMSLearn(program.title, 5).catch(() => []);
      if (msModules.length > 0) {
        const list = msModules.map((m) => `- ${m.title}: ${m.summary.slice(0, 100)}`).join('\n');
        contentContexts.push(`\n## Microsoft Learn: ${program.title}\n${list}`);
      }
    }

    // Workforce outcome alignment
    const outcomeCtx = buildWorkforceOutcomeContext(program.slug);
    if (outcomeCtx) contentContexts.push(outcomeCtx);

    // IBM SkillsBuild topics
    const ibmTopics = IBM_SKILLSBUILD_TOPICS[category] || IBM_SKILLSBUILD_TOPICS['professional-development'] || [];
    if (ibmTopics.length > 0) {
      contentContexts.push(`\n## IBM SkillsBuild: ${program.title}\n${ibmTopics.map((t) => `- ${t}`).join('\n')}`);
    }

    // Google Career Certificate topics
    const googleTopics = GOOGLE_CERT_TOPICS[category] || [];
    if (googleTopics.length > 0) {
      contentContexts.push(`\n## Google Career Certificates: ${program.title}\n${googleTopics.map((t) => `- ${t}`).join('\n')}`);
    }
  }

  const totalWeeks = programs.reduce((sum, p) => sum + p.durationWeeks, 0);
  const contentContext = contentContexts.join('\n\n');

  // 2. Use reasoning model to assemble the pathway
  const systemPrompt = `You are a workforce curriculum orchestration engine for ${PLATFORM_DEFAULTS.orgName} Career and Technical Institute.

Your job is to assemble structured workforce training pathways from APPROVED content sources only.
You do NOT generate proprietary lesson content. You orchestrate assembly from approved providers.

RULES:
- Only reference content from the approved providers listed in the context
- Every module must map to a specific content source (MS Learn, Google, IBM, Certiport, or Elevate proprietary)
- Sequence must build competencies progressively — no redundancy
- Each week must have clear learner objectives and instructor actions
- Credential milestones must align with actual exam schedules
- All workforce outcomes must reference real O*NET occupational data
- Flag any compliance requirements (WIOA eligibility, ETPL alignment, clock hours)

OUTPUT FORMAT: Respond with a valid JSON object matching the PathwayOrchestrationResult schema.`;

  const userPrompt = `Orchestrate a workforce training pathway with these specifications:

PATHWAY TITLE: ${pathwayTitle}
TARGET WORKFORCE OUTCOME: ${targetOutcome}
TOTAL DURATION: ${totalWeeks} weeks

PROGRAMS IN SEQUENCE:
${programs.map((p, i) => `${i + 1}. ${p.title} (${p.durationWeeks} weeks)${p.certiportExamCode ? ` → ${p.certiportExamCode} exam` : ''}${p.socCode ? ` | SOC: ${p.socCode}` : ''}`).join('\n')}

APPROVED CONTENT SOURCES:
${contentContext}

Generate:
1. Weekly module breakdown with content source attribution
2. Instructor pacing guide with weekly actions
3. Credential milestone schedule
4. Enrollment flow steps
5. Workforce outcomes (job titles, salary ranges, employers)
6. LMS course structure
7. Compliance notes (WIOA eligibility, clock hours, ETPL)

Return as JSON matching this structure:
{
  "pathwayTitle": string,
  "description": string,
  "modules": [{ "weekNumber": number, "title": string, "program": string, "objectives": string[], "contentSources": string[], "activities": string[], "assessmentType": string, "estimatedHours": number }],
  "pacingGuide": { "totalWeeks": number, "totalHours": number, "weeklyBreakdown": [...], "credentialMilestones": [...] },
  "enrollmentFlow": string[],
  "workforceOutcomes": string[],
  "approvedProviders": string[],
  "lmsStructure": { "courses": [...] },
  "complianceNotes": string[]
}`;

  const result = await aiReason({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    maxTokens: 8192,
  });

  // 3. Parse the JSON response
  let parsed: Partial<PathwayOrchestrationResult> = {};
  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    logger.error('[pathway-orchestrator] Failed to parse AI response as JSON', err);
    // Return a structured fallback
    parsed = {
      pathwayTitle,
      description: `${pathwayTitle} — ${totalWeeks} week workforce training pathway`,
      modules: [],
      enrollmentFlow: ['Apply', 'Enroll', 'Orientation', 'Training', 'Certification', 'Job Placement'],
      workforceOutcomes: [targetOutcome],
      approvedProviders: programs.map((p) => p.slug),
      complianceNotes: ['Review WIOA eligibility before enrollment'],
    };
  }

  return {
    pathwayTitle: parsed.pathwayTitle ?? pathwayTitle,
    description: parsed.description ?? '',
    programs,
    modules: parsed.modules ?? [],
    pacingGuide: parsed.pacingGuide ?? {
      pathwayTitle,
      totalWeeks,
      totalHours: totalWeeks * 20,
      weeklyBreakdown: [],
      credentialMilestones: [],
    },
    enrollmentFlow: parsed.enrollmentFlow ?? [],
    workforceOutcomes: parsed.workforceOutcomes ?? [],
    approvedProviders: parsed.approvedProviders ?? [],
    lmsStructure: parsed.lmsStructure ?? { courses: [] },
    complianceNotes: parsed.complianceNotes ?? [],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Quick pathway suggestion — given a learner's goal, suggest 2-3 pathway options.
 * Uses standard chat model (not reasoning) for speed.
 */
export async function suggestPathways(learnerGoal: string, currentPrograms: string[]): Promise<string[]> {
  const result = await aiChat({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: `You are a workforce pathway advisor for ${PLATFORM_DEFAULTS.orgName}.
Suggest 2-3 specific program sequences from our catalog that lead to the learner's goal.
Available programs: ${currentPrograms.join(', ')}.
Be specific. Include credential names and estimated timelines. Keep each suggestion to 2 sentences.`,
      },
      { role: 'user', content: `My goal: ${learnerGoal}` },
    ],
    temperature: 0.5,
    maxTokens: 400,
  });

  return result.content
    .split('\n')
    .filter((line) => line.trim().length > 20)
    .slice(0, 3);
}
