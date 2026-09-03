/**
 * Prompts for Pass 1: Course Blueprint Generation
 *
 * The blueprint pass produces course structure only — modules and lesson stubs.
 * It does NOT generate narration, slides, or quizzes. That is Pass 2.
 * Keeping the passes separate prevents quality drift and JSON breakage.
 *
 * When industry standards are available (O*NET + BLS + credential domains),
 * they are injected into the system prompt so the AI generates content
 * grounded in real job task data rather than model training data alone.
 */

import type { IndustryStandards } from '@/lib/industry/standards-loader';

export const BLUEPRINT_SYSTEM = `
You are a senior instructional designer creating workforce and professional training courses.

Your task is to convert source input into a complete course blueprint.

Rules:
- Return valid JSON only.
- Do not wrap JSON in markdown.
- Do not include commentary.
- Create a practical, employer-relevant course.
- Organize the course into 4 to 8 modules.
- Organize each module into 3 to 6 lessons.
- Every lesson must have clear, measurable learning objectives.
- The course must be coherent, sequential, and suitable for adult learners.
- Avoid filler, repetition, motivational fluff, and vague lesson titles.
- Favor concrete skill-building and real-world application.
- Estimate realistic duration.
- Completion rule should default to hybrid with 80 percent quiz threshold unless the content clearly does not require quizzes.
`.trim();

/**
 * Build the industry standards block injected into the system prompt.
 * This is what makes the AI generate industry-grounded content instead of
 * generic content based on its training data alone.
 */
export function buildIndustryStandardsBlock(standards: IndustryStandards): string {
  const lines: string[] = [
    '--- INDUSTRY STANDARDS (authoritative — must be reflected in course content) ---',
    '',
    `OCCUPATION: ${standards.occupation_title} (SOC ${standards.soc_code})`,
    standards.occupation_description ? `DESCRIPTION: ${standards.occupation_description}` : '',
    '',
  ];

  if (standards.top_tasks.length > 0) {
    lines.push('CORE JOB TASKS (from O*NET — these are what workers actually do):');
    standards.top_tasks.forEach((t, i) => lines.push(`  ${i + 1}. ${t}`));
    lines.push('');
  }

  if (standards.top_skills.length > 0) {
    lines.push(`TOP SKILLS REQUIRED: ${standards.top_skills.join(', ')}`);
    lines.push('');
  }

  if (standards.top_knowledge.length > 0) {
    lines.push(`KEY KNOWLEDGE AREAS: ${standards.top_knowledge.join(', ')}`);
    lines.push('');
  }

  if (standards.technology_skills.length > 0) {
    lines.push(`TECHNOLOGY TOOLS USED: ${standards.technology_skills.join(', ')}`);
    lines.push('');
  }

  // Wage context — helps AI frame career value accurately
  if (standards.median_annual_wage) {
    const wage = standards.indiana_median_wage ?? standards.median_annual_wage;
    lines.push(`WAGE CONTEXT (Indiana): Median $${wage.toLocaleString()}/year`);
    if (standards.entry_wage)
      lines.push(`  Entry level: $${standards.entry_wage.toLocaleString()}/year`);
    if (standards.experienced_wage)
      lines.push(`  Experienced: $${standards.experienced_wage.toLocaleString()}/year`);
    lines.push('');
  }

  if (standards.projected_growth_cat) {
    lines.push(
      `JOB OUTLOOK: ${standards.projected_growth_cat}${standards.projected_growth_pct !== null ? ` (${standards.projected_growth_pct > 0 ? '+' : ''}${standards.projected_growth_pct}% projected growth)` : ''}`,
    );
    if (standards.projected_openings)
      lines.push(`  Annual openings: ~${standards.projected_openings.toLocaleString()}`);
    lines.push('');
  }

  // Credential domains — the most important injection for exam-aligned courses
  if (standards.credential_domains.length > 0) {
    lines.push(
      `CREDENTIAL EXAM DOMAINS (${standards.credential_code} — course MUST cover all domains):`,
    );
    standards.credential_domains.forEach((d) => {
      lines.push(`  ${d.name} (${d.weight_pct}% of exam, min ${d.min_hours}h):`);
      d.competencies.slice(0, 5).forEach((c) => lines.push(`    - ${c}`));
    });
    if (standards.exam_blueprint) {
      lines.push(
        `  Exam: ${standards.exam_blueprint.total_questions} questions, ${standards.exam_blueprint.passing_score}% passing score`,
      );
    }
    lines.push('');
    lines.push('CRITICAL: Module structure must map to these credential domains.');
    lines.push('Each domain must have at least one dedicated module or lesson set.');
    lines.push('Lesson objectives must explicitly address the listed competencies.');
    lines.push('');
  }

  if (standards.certifications.length > 0) {
    lines.push('AVAILABLE CERTIFICATIONS:');
    standards.certifications
      .slice(0, 5)
      .forEach((c) => lines.push(`  - ${c.name} (${c.organization})`));
    lines.push('');
  }

  lines.push('--- END INDUSTRY STANDARDS ---');
  lines.push('');
  lines.push(
    'INSTRUCTION: Use the above data as the authoritative source for what this course must teach.',
  );
  lines.push(
    'Do not invent job tasks or competencies. Every module and lesson must trace back to the tasks, skills, or credential domains listed above.',
  );

  return lines.filter((l) => l !== null).join('\n');
}

/**
 * Build the full system prompt, optionally injecting industry standards.
 */
export function buildBlueprintSystemPrompt(standards?: IndustryStandards | null): string {
  if (!standards) return BLUEPRINT_SYSTEM;
  return BLUEPRINT_SYSTEM + '\n\n' + buildIndustryStandardsBlock(standards);
}

export function buildBlueprintPrompt(args: {
  sourceType: string;
  sourceContent: string;
  courseGoal: string;
  audience: string[];
  standards?: IndustryStandards | null;
}): string {
  return `
SOURCE TYPE: ${args.sourceType}

SOURCE CONTENT:
${args.sourceContent}

COURSE GOAL:
${args.courseGoal}

AUDIENCE:
${args.audience.join(', ')}

CONSTRAINTS:
- Tone: professional instructor-led training
- Format: LMS course for adult learners
- Must be publish-ready after lesson compilation
- Keep modules balanced
- Avoid duplicate lessons
${args.standards?.credential_domains?.length ? '- MUST align module structure to credential exam domains listed in industry standards above' : ''}
${args.standards?.top_tasks?.length ? '- MUST address the core job tasks listed in industry standards above' : ''}

Return JSON matching this exact schema (no markdown, no commentary):

{
  "course_title": "string",
  "course_name": "string (short slug-friendly name)",
  "description": "string (2-3 sentences)",
  "summary": "string (1 sentence)",
  "difficulty": "beginner | intermediate | advanced",
  "learning_objectives": ["string"],
  "target_audience": ["string"],
  "estimated_total_minutes": 0,
  "certificate_enabled": true,
  "completion_rule": {
    "type": "hybrid",
    "quiz_threshold_percent": 80
  },
  "modules": [
    {
      "module_title": "string",
      "module_order": 1,
      "module_objectives": ["string"],
      "credential_domain_key": "string or null (maps to credential domain key if applicable)",
      "lessons": [
        {
          "lesson_title": "string",
          "lesson_order": 1,
          "lesson_objectives": ["string"],
          "lesson_summary": "string (1-2 sentences describing what this lesson teaches)",
          "job_tasks_covered": ["string (from O*NET task list — exact match preferred)"]
        }
      ]
    }
  ]
}
`.trim();
}
