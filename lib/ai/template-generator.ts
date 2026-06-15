/**
 * Template Generator for Dev Studio
 * 
 * Generates page templates for courses, dashboards, landing pages, etc.
 */

import { ModelRouter, callModel } from './model-router';

const modelRouter = new ModelRouter();

export type TemplateType = 
  | 'course_landing'
  | 'lesson_page'
  | 'module_layout'
  | 'quiz_page'
  | 'certificate_page'
  | 'student_dashboard'
  | 'employer_dashboard'
  | 'agency_reporting'
  | 'marketing_landing'
  | 'enrollment_page'
  | 'program_page';

export interface TemplateGenerationRequest {
  templateType: TemplateType;
  title: string;
  description?: string;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  customFields?: Record<string, string>;
}

export interface GeneratedTemplate {
  templateType: TemplateType;
  title: string;
  html: string;
  css: string;
  components: string[];
  previewUrl: string;
  savedToSupabase: boolean;
  metadata: {
    generatedAt: string;
    model: string;
    tokensUsed: number;
  };
}

const TEMPLATE_PROMPTS: Record<TemplateType, { system: string; user: string }> = {
  course_landing: {
    system: `You are an expert Next.js/React developer creating course landing pages.
Generate a complete, production-ready landing page component.
Use Tailwind CSS for styling. Include:
- Hero section with course title and CTA
- Course overview/syllabus
- Instructor info section
- Testimonials
- FAQ section
- Enrollment CTA
Return ONLY valid JSX with inline styles or Tailwind classes.`,
    user: `Create a course landing page for: {title}
Description: {description}
Brand colors: {brandColors}`,
  },
  lesson_page: {
    system: `You are an expert instructional designer creating lesson page templates.
Generate a complete lesson page component with:
- Lesson header with title and objectives
- Video/media embed area
- Content sections with rich text
- Interactive elements (quizzes, activities)
- Notes/resources sidebar
- Progress indicator
Use Tailwind CSS. Return ONLY valid JSX.`,
    user: `Create a lesson page for: {title}
Description: {description}`,
  },
  module_layout: {
    system: `You are an expert Next.js developer creating module/curriculum layouts.
Generate a module overview page with:
- Module title and description
- Lesson list with progress indicators
- Time estimates for each lesson
- Completion badges
- Navigation between lessons
Use Tailwind CSS. Return ONLY valid JSX.`,
    user: `Create a module layout for: {title}
Lessons: {description}`,
  },
  quiz_page: {
    system: `You are an expert quiz/exam page developer.
Generate an interactive quiz component with:
- Question display with options
- Progress bar
- Timer (if applicable)
- Submit button
- Results page with score
- Review mode
Use Tailwind CSS. Return ONLY valid JSX.`,
    user: `Create a quiz page for: {title}
Questions: {description}`,
  },
  certificate_page: {
    system: `You are an expert certificate design developer.
Generate a printable certificate template with:
- Official header/branding
- Recipient name field
- Course/program completed
- Completion date
- Credential ID
- QR code for verification
- Digital signature area
Use Tailwind CSS. Return ONLY valid JSX for both screen and print.`,
    user: `Create a certificate for: {title}
Description: {description}`,
  },
  student_dashboard: {
    system: `You are an expert dashboard developer creating student portals.
Generate a student dashboard with:
- Welcome header with name
- Enrolled courses with progress
- Upcoming deadlines
- Recent activity
- Achievement badges
- Quick actions (continue learning, view certificates)
Use Tailwind CSS. Return ONLY valid JSX.`,
    user: `Create a student dashboard for: {title}
Description: {description}`,
  },
  employer_dashboard: {
    system: `You are an expert dashboard developer creating employer portals.
Generate an employer dashboard with:
- Posted jobs summary
- Candidate pipeline
- Training progress of apprentices
- Credential verification
- Analytics/reporting
Use Tailwind CSS. Return ONLY valid JSX.`,
    user: `Create an employer dashboard for: {title}
Description: {description}`,
  },
  agency_reporting: {
    system: `You are an expert reporting dashboard developer.
Generate an agency reporting dashboard with:
- Enrollment metrics
- Completion rates
- Funding utilization
- Compliance status
- Export functionality
Use Tailwind CSS. Return ONLY valid JSX.`,
    user: `Create an agency reporting dashboard for: {title}
Description: {description}`,
  },
  marketing_landing: {
    system: `You are an expert marketing page developer.
Generate a high-converting landing page with:
- Hero with compelling headline
- Social proof (logos, testimonials)
- Feature/benefit sections
- Call-to-action blocks
- Trust indicators
Use Tailwind CSS. Return ONLY valid JSX.`,
    user: `Create a marketing landing page for: {title}
Description: {description}`,
  },
  enrollment_page: {
    system: `You are an expert enrollment form developer.
Generate an enrollment page with:
- Multi-step form wizard
- Personal information step
- Program selection
- Payment/funding options
- Document upload
- Terms acceptance
- Confirmation step
Use Tailwind CSS. Return ONLY valid JSX.`,
    user: `Create an enrollment page for: {title}
Description: {description}`,
  },
  program_page: {
    system: `You are an expert program page developer.
Generate a comprehensive program page with:
- Hero with program title
- Program overview
- Curriculum/modules breakdown
- Career outcomes
- Requirements/prerequisites
- Duration and schedule
- Cost/funding options
- Apply CTA
Use Tailwind CSS. Return ONLY valid JSX.`,
    user: `Create a program page for: {title}
Description: {description}`,
  },
};

/**
 * Generate a template based on type and requirements
 */
export async function generateTemplate(
  request: TemplateGenerationRequest
): Promise<GeneratedTemplate> {
  const { templateType, title, description, brandColors, customFields } = request;
  
  const promptTemplate = TEMPLATE_PROMPTS[templateType];
  if (!promptTemplate) {
    throw new Error(`Unknown template type: ${templateType}`);
  }

  const model = modelRouter.selectModel('documentation');
  
  // Replace placeholders
  let userPrompt = promptTemplate.user
    .replace('{title}', title)
    .replace('{description}', description || '')
    .replace('{brandColors}', JSON.stringify(brandColors || {}));

  if (customFields) {
    userPrompt += `\n\nAdditional fields: ${JSON.stringify(customFields)}`;
  }

  try {
    const response = await callModel(
      model,
      [
        { role: 'system', content: promptTemplate.system },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7, maxTokens: 32768 }
    );

    // Extract JSX from response
    const jsxMatch = response.match(/```(?:tsx?|jsx?)\s*([\s\S]*?)```/) || [null, response];
    const jsx = jsxMatch[1] || response;

    // Generate preview URL
    const previewUrl = `/preview/template/${templateType}/${encodeURIComponent(title)}`;

    return {
      templateType,
      title,
      html: jsx,
      css: '', // Tailwind handles styling
      components: [templateType],
      previewUrl,
      savedToSupabase: false,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: model.modelName,
        tokensUsed: response.length / 4, // Rough estimate
      },
    };
  } catch (error) {
    throw new Error(`Template generation failed: ${error instanceof Error ? error.message : 'Unknown'}`, { cause: error });
  }
}

/**
 * Generate multiple templates in batch
 */
export async function generateTemplateBatch(
  requests: TemplateGenerationRequest[]
): Promise<GeneratedTemplate[]> {
  const results: GeneratedTemplate[] = [];
  
  for (const request of requests) {
    try {
      const result = await generateTemplate(request);
      results.push(result);
    } catch (error) {
      console.error(`Failed to generate ${request.templateType}:`, error);
      // Continue with other templates
    }
  }
  
  return results;
}

/**
 * Get available template types
 */
export function getAvailableTemplates(): Array<{ type: TemplateType; label: string; description: string; icon: string }> {
  return [
    { type: 'course_landing', label: 'Course Landing Page', description: 'Course overview and enrollment page', icon: 'book' },
    { type: 'lesson_page', label: 'Lesson Page', description: 'Individual lesson content page', icon: 'file-text' },
    { type: 'module_layout', label: 'Module Layout', description: 'Course module with lessons', icon: 'folder' },
    { type: 'quiz_page', label: 'Quiz Page', description: 'Interactive quiz/exam page', icon: 'help-circle' },
    { type: 'certificate_page', label: 'Certificate', description: 'Completion certificate template', icon: 'award' },
    { type: 'student_dashboard', label: 'Student Dashboard', description: 'Learner portal dashboard', icon: 'user' },
    { type: 'employer_dashboard', label: 'Employer Dashboard', description: 'Employer portal dashboard', icon: 'briefcase' },
    { type: 'agency_reporting', label: 'Agency Reporting', description: 'Workforce agency reporting', icon: 'bar-chart' },
    { type: 'marketing_landing', label: 'Marketing Landing', description: 'Marketing landing page', icon: 'megaphone' },
    { type: 'enrollment_page', label: 'Enrollment Page', description: 'Multi-step enrollment form', icon: 'clipboard' },
    { type: 'program_page', label: 'Program Page', description: 'Full program overview page', icon: 'graduation-cap' },
  ];
}