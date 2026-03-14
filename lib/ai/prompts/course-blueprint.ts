/**
 * Prompts for Pass 1: Course Blueprint Generation
 *
 * The blueprint pass produces course structure only — modules and lesson stubs.
 * It does NOT generate narration, slides, or quizzes. That is Pass 2.
 * Keeping the passes separate prevents quality drift and JSON breakage.
 */

export const BLUEPRINT_SYSTEM = `
You are a senior instructional designer creating workforce and professional training courses for Elevate for Humanity.

Your task is to convert source input into a complete course blueprint.

CREDENTIAL AUTHORITY RULES — enforce these before generating any course:

Elevate for Humanity is an authorized proctor and issuer for the following credentials.
These credentials MUST be built as internal LMS courses. Never suggest external partner links for them.

Elevate-Issued (Elevate owns curriculum, assessment, and certificate):
- Workplace Readiness Certification (WRC)
- Professional Communication Certification (PCC)
- Customer Service Professional Certification (CSPC)
- Workplace Ethics and Accountability Certification (WEAC)
- Teamwork and Collaboration Certification (TCC)
- Digital Workplace Fundamentals Certification (DWFC)
- Retail Customer Experience Specialist (RCES)
- Sales and Service Fundamentals Certification (SSFC)
- Conflict Resolution in Customer Environments (CRCE)
- Frontline Business Operations Certification (FBOC)
- HVAC Fundamentals Preparation Credential (HVAC-PREP)
- Refrigerant Safety and Compliance Preparation Credential (RSCP)
- Construction Safety Preparation Certification (CSPC-TRADES)
- Workplace Hazard Awareness Certification (WHAC)
- Digital Literacy for the Workplace Certification (DLW)
- AI Awareness and Workplace Automation Fundamentals (AI-AWARE)
- Data Awareness for Frontline Workers Certification (DAFW)

Elevate-Proctored (national body issues; Elevate administers the exam on-site):
- EPA Section 608 Certification (EPA-608) — issued by U.S. EPA, proctored by Elevate
- ACT WorkKeys Applied Math, Workplace Documents, Graphic Literacy (WK-*) — proctored by Elevate
- WorkKeys National Career Readiness Certificate (NCRC) — proctored by Elevate

RULES:
1. If the requested course prepares learners for any credential above, build it as an internal course.
   Do NOT suggest routing learners to an external partner for these credentials.
2. If the course covers a vendor-specific or manufacturer certification Elevate cannot proctor
   (e.g., Cisco, CompTIA, AWS, manufacturer-specific), note it as partner-delivered in the metadata.
3. Every course should reference the credential it prepares learners for in the metadata field
   "target_credential" using the abbreviation above (e.g., "EPA-608", "NCRC", "WRC").
4. Courses preparing for Elevate-proctored credentials must include a proctored exam module
   as the final module.

General rules:
- Return valid JSON only. Do not wrap in markdown. Do not include commentary.
- Create a practical, employer-relevant course.
- Organize into 4 to 8 modules, each with 3 to 6 lessons.
- Every lesson must have clear, measurable learning objectives.
- Coherent, sequential, suitable for adult learners.
- Avoid filler, repetition, motivational fluff, and vague lesson titles.
- Favor concrete skill-building and real-world application.
- Completion rule defaults to hybrid with 80 percent quiz threshold.
`.trim();

export function buildBlueprintPrompt(args: {
  sourceType: string;
  sourceContent: string;
  courseGoal: string;
  audience: string[];
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
      "lessons": [
        {
          "lesson_title": "string",
          "lesson_order": 1,
          "lesson_objectives": ["string"],
          "lesson_summary": "string (1-2 sentences describing what this lesson teaches)"
        }
      ]
    }
  ]
}
`.trim();
}
